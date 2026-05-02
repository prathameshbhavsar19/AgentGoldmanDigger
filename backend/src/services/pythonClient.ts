import WebSocket from "ws";
import { cfg } from "../config.js";
import { logger } from "../utils/logger.js";
import { insertEvent } from "../db/repo/events.js";
import { eventBus } from "./eventBus.js";
import { normalizeEvent, NODE_INTERNAL_TYPES } from "./eventNormalizer.js";
import { canvasComposer } from "./canvasComposer.js";
import { buildCanvasFromAnalysis, type PythonAnalysis } from "./canvasLLM.js";
import { getOrCreateTrace, startPythonAgentSpan, lf32, lf16, type UserJsonSnapshot } from "./langfuseClient.js";
import { backoff, sleep } from "../utils/timing.js";

export class PythonError extends Error {
  constructor(public status: number, public body: string) {
    super(`Python service error ${status}: ${body}`);
  }
}

export type { UserJsonSnapshot };

export interface StartJobInput {
  jobId: string;
  userMd: string;
  userJson: UserJsonSnapshot;
  holdings: unknown[] | null;
}

// ─── Canvas LLM runner ──────────────────────────────────────────────────────

async function runCanvasLLM(jobId: string, analysis: PythonAnalysis, userJson: UserJsonSnapshot): Promise<void> {
  logger.info({ jobId }, "Canvas LLM: starting demystifier + canvas build");

  // Emit the building state event to frontend
  const buildingEvent = insertEvent({
    job_id: jobId,
    event_type: "canvas_generation_started",
    status: null,
    display_message: "Building your personalised canvas…",
    raw_event_json: JSON.stringify({ type: "canvas_generation_started" }),
  });
  eventBus.publish(jobId, {
    event_type: "canvas_generation_started",
    job_id: jobId,
    event_id: buildingEvent.seq,
    display_message: "Building your personalised canvas…",
  });

  try {
    const modules = await buildCanvasFromAnalysis(jobId, analysis, userJson);
    logger.info({ jobId, moduleCount: modules.length }, "Canvas LLM: modules built");

    for (const mod of modules) {
      canvasComposer.handleModuleReady(jobId, mod);
      const ev = insertEvent({
        job_id: jobId,
        event_type: "canvas_module_ready",
        status: null,
        display_message: null,
        raw_event_json: JSON.stringify({ type: "canvas_module_ready", module: mod }),
      });
      eventBus.publish(jobId, {
        event_type: "canvas_module_ready",
        job_id: jobId,
        event_id: ev.seq,
        module: mod,
      });
    }

    await canvasComposer.assembleReport(jobId).catch((e) =>
      logger.error({ jobId, err: e }, "Failed to assemble report"),
    );

    const completedEv = insertEvent({
      job_id: jobId,
      event_type: "analysis_completed",
      status: "completed",
      display_message: null,
      raw_event_json: JSON.stringify({ type: "analysis_completed" }),
    });
    eventBus.publish(jobId, {
      event_type: "analysis_completed",
      job_id: jobId,
      event_id: completedEv.seq,
    });
  } catch (err) {
    logger.error({ jobId, err }, "Canvas LLM failed");
    const failedEv = insertEvent({
      job_id: jobId,
      event_type: "analysis_failed",
      status: "failed",
      display_message: "Canvas generation failed",
      raw_event_json: JSON.stringify({ type: "analysis_failed", error: String(err) }),
    });
    eventBus.publish(jobId, {
      event_type: "analysis_failed",
      job_id: jobId,
      event_id: failedEv.seq,
      error: String(err),
    });
  }
}

// ─── Python client ──────────────────────────────────────────────────────────

export const pythonClient = {
  async startJob(input: StartJobInput): Promise<{ job_id: string }> {
    const url = `${cfg.PYTHON_HTTP_BASE}/ai/jobs`;

    // Create root trace + open python_agent_phase child span.
    // Span ID is forwarded to Python so its LangChain traces nest under it.
    getOrCreateTrace(input.jobId, input.userJson);
    const pythonSpan = startPythonAgentSpan(input.jobId, input.userJson);

    const body = {
      job_id: input.jobId,
      user_md: input.userMd,
      user_json: input.userJson,
      holdings: input.holdings,
      meta: {
        anthropic_model_hint: cfg.ANTHROPIC_MODEL,
      },
    };

    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-job-id": input.jobId,
      // Normalized 32-char hex IDs so Python Langfuse SDK accepts them.
      "x-langfuse-trace-id": lf32(input.jobId),
    };
    // Send 16-char span ID (Langfuse span ID requirement)
    if (pythonSpan) headers["x-langfuse-parent-span-id"] = lf16(pythonSpan.spanId);

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new PythonError(res.status, text);
    }

    const data = (await res.json()) as { job_id: string };
    return data;
  },

  async followUp(jobId: string, question: string, userJson?: UserJsonSnapshot): Promise<void> {
    const url = `${cfg.PYTHON_HTTP_BASE}/ai/jobs/${jobId}/follow-up`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-langfuse-trace-id": lf32(jobId),
      },
      body: JSON.stringify({ question, user_json: userJson ?? {} }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new PythonError(res.status, text);
    }
  },

  subscribeToEvents(jobId: string, userJson: UserJsonSnapshot): void {
    const url = `${cfg.PYTHON_WS_BASE}/ai/jobs/${jobId}/events`;
    let attempt = 0;
    let lastSeq = 0;
    let terminated = false;
    const MAX_ATTEMPTS = 8;

    // Retrieve the python span handle opened in startJob so we can end it
    const pythonSpan = startPythonAgentSpan(jobId, userJson);

    const fail = async (reason: string) => {
      if (terminated) return;
      terminated = true;
      logger.error({ jobId, reason }, "Python pipeline failed");
      try {
        const failedEv = insertEvent({
          job_id: jobId,
          event_type: "analysis_failed",
          status: "failed",
          display_message: "Analysis failed. Please try again.",
          raw_event_json: JSON.stringify({ type: "analysis_failed", error: reason }),
        });
        eventBus.publish(jobId, {
          event_type: "analysis_failed",
          job_id: jobId,
          event_id: failedEv.seq,
          error: reason,
        });
      } catch (e) {
        logger.error({ jobId, err: e }, "Failed to publish analysis_failed event");
      }
    };

    function connect() {
      if (terminated) return;
      const wsUrl = lastSeq > 0 ? `${url}?lastEventId=${lastSeq}` : url;
      const ws = new WebSocket(wsUrl);

      ws.on("open", () => {
        logger.info({ jobId }, "Connected to Python WS events");
        attempt = 0;
      });

      ws.on("message", (data) => {
        try {
          const raw = JSON.parse(data.toString()) as Record<string, unknown>;
          const normalized = normalizeEvent(raw, jobId);
          if (!normalized) return;

          // Persist all non-internal events
          if (!NODE_INTERNAL_TYPES.has(normalized.event_type)) {
            const eventRow = insertEvent({
              job_id: jobId,
              event_type: normalized.event_type,
              status: null,
              display_message: (normalized["display_message"] as string) ?? null,
              raw_event_json: JSON.stringify(raw),
            });
            lastSeq = eventRow.seq;
            const enriched = { ...normalized, event_id: eventRow.seq };
            eventBus.publish(jobId, enriched);
          }

          // Terminal events from Python
          if (normalized.event_type === "analysis_failed") {
            terminated = true;
            try { ws.close(); } catch { /* ignore */ }
            return;
          }

          // Phase A terminal event — trigger Node canvas LLM (Phase B)
          if (normalized.event_type === "python_analysis_completed" && !terminated) {
            terminated = true; // stop reconnects; canvas LLM runs independently
            // Close the python_agent_phase Langfuse span
            pythonSpan?.end({ status: "completed" });
            const analysis: PythonAnalysis = {
              user_summary_md: (raw["user_summary_md"] as string) ?? "",
              portfolio_diagnosis_md: (raw["portfolio_diagnosis_md"] as string) ?? "",
              options: (raw["options"] as PythonAnalysis["options"]) ?? [],
              hidden_disclosures: (raw["hidden_disclosures"] as string[]) ?? [],
            };
            runCanvasLLM(jobId, analysis, userJson).catch((e) =>
              logger.error({ jobId, err: e }, "runCanvasLLM threw"),
            );
          }
        } catch (e) {
          logger.error({ jobId, err: e }, "Error processing Python WS message");
        }
      });

      ws.on("close", () => {
        if (terminated) {
          logger.info({ jobId }, "Python WS closed (terminated)");
          return;
        }
        if (attempt >= MAX_ATTEMPTS) {
          logger.error({ jobId, attempt }, "Python WS exceeded max reconnects");
          fail("Python WS reconnect limit exceeded");
          return;
        }
        logger.info({ jobId, attempt }, "Python WS closed, scheduling reconnect");
        const delay = backoff(attempt++);
        sleep(delay).then(connect);
      });

      ws.on("error", (err) => {
        logger.error({ jobId, err: err.message }, "Python WS error");
      });
    }

    connect();
  },
};
