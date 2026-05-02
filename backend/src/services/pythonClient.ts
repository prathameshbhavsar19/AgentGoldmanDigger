import WebSocket from "ws";
import { cfg } from "../config.js";
import { logger } from "../utils/logger.js";
import { insertEvent } from "../db/repo/events.js";
import { eventBus } from "./eventBus.js";
import { normalizeEvent } from "./eventNormalizer.js";
import { canvasComposer } from "./canvasComposer.js";
import { backoff, sleep } from "../utils/timing.js";

export class PythonError extends Error {
  constructor(public status: number, public body: string) {
    super(`Python service error ${status}: ${body}`);
  }
}

export interface UserJsonSnapshot {
  userId: string;
  sessionId: string;
  firstName?: string;
  country?: string;
  currency?: string;
  investmentGoal?: string;
  timeHorizon?: string;
  emergencySavings?: string;
  riskReaction?: string;
  experienceTone?: string;
  currentInvestmentStatus?: string;
  portfolioReviewIntent?: string;
  persona?: string;
  meta?: Record<string, unknown>;
}

export interface StartJobInput {
  jobId: string;
  userMd: string;
  userJson: UserJsonSnapshot;
  holdings: unknown[] | null;
}

export const pythonClient = {
  async startJob(input: StartJobInput): Promise<{ job_id: string }> {
    const url = `${cfg.PYTHON_HTTP_BASE}/ai/jobs`;
    const body = {
      ...input,
      meta: {
        anthropic_model_hint: cfg.ANTHROPIC_MODEL,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-job-id": input.jobId },
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

  async followUp(jobId: string, question: string): Promise<void> {
    const url = `${cfg.PYTHON_HTTP_BASE}/ai/jobs/${jobId}/follow-up`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new PythonError(res.status, text);
    }
  },

  subscribeToEvents(jobId: string): void {
    const url = `${cfg.PYTHON_WS_BASE}/ai/jobs/${jobId}/events`;
    let attempt = 0;
    let lastSeq = 0;

    function connect() {
      const wsUrl = lastSeq > 0 ? `${url}?lastEventId=${lastSeq}` : url;
      const ws = new WebSocket(wsUrl);

      ws.on("open", () => {
        logger.info({ jobId }, "Connected to Python WS events");
        attempt = 0;
      });

      ws.on("message", (data) => {
        try {
          const raw = JSON.parse(data.toString()) as unknown;
          const normalized = normalizeEvent(raw, jobId);
          if (!normalized) return;

          const eventRow = insertEvent({
            job_id: jobId,
            event_type: normalized.event_type,
            status: null,
            display_message: (normalized["display_message"] as string) ?? null,
            raw_event_json: JSON.stringify(raw),
          });
          lastSeq = eventRow.seq;

          // Handle canvas module
          if (normalized.event_type === "canvas_module_ready") {
            const module = normalized["module"] ?? normalized;
            canvasComposer.handleModuleReady(jobId, module);
          }

          // Handle completion
          if (normalized.event_type === "analysis_completed") {
            canvasComposer.assembleReport(jobId).catch((e) =>
              logger.error({ jobId, err: e }, "Failed to assemble report")
            );
          }

          // Broadcast to frontend
          eventBus.publish(jobId, normalized);
        } catch (e) {
          logger.error({ jobId, err: e }, "Error processing Python WS message");
        }
      });

      ws.on("close", () => {
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
