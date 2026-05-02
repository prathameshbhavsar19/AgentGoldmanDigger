/**
 * Langfuse root-trace client for Node.js.
 *
 * ONE root trace per strategy job (traceId = jobId).
 * Hierarchy:
 *
 *   strategy_job  (root trace, id = jobId)
 *   ├── python_agent_phase  (span)  ← Python LangChain joins here via headers
 *   │   ├── tool: macro_indicators
 *   │   ├── tool: stock_price_history  …
 *   │   └── llm: claude-sonnet-4-6
 *   └── node_canvas_llm  (span)      ← Langchain.js canvas LLM runs here
 *       └── generation: canvas_demystifier
 *
 * Node passes `x-langfuse-trace-id` + `x-langfuse-parent-span-id` HTTP headers
 * to Python so Python's CallbackHandler can nest under the correct span.
 */
import { Langfuse } from "langfuse";
import { cfg } from "../config.js";
import { logger } from "../utils/logger.js";

// ─── Lazy singleton ───────────────────────────────────────────────────────────

let _lf: Langfuse | null = null;

function getLangfuse(): Langfuse | null {
  if (_lf) return _lf;
  if (!cfg.LANGFUSE_PUBLIC_KEY || !cfg.LANGFUSE_SECRET_KEY) return null;
  try {
    _lf = new Langfuse({
      publicKey: cfg.LANGFUSE_PUBLIC_KEY,
      secretKey: cfg.LANGFUSE_SECRET_KEY,
      baseUrl: cfg.LANGFUSE_BASE_URL,
    });
    logger.info({ host: cfg.LANGFUSE_BASE_URL }, "Langfuse Node client initialized");
    return _lf;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn(`Langfuse not available — tracing disabled: ${msg}`);
    return null;
  }
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UserJsonSnapshot {
  userId?: string;
  sessionId?: string;
  country?: string;
  investmentGoal?: string;
  firstName?: string;
  timeHorizon?: string;
  emergencySavings?: string;
  riskReaction?: string;
  experienceTone?: string;
  currentInvestmentStatus?: string;
  portfolioReviewIntent?: string;
  persona?: string;
  currency?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Span handle returned so callers can end the span and get its ID. */
export interface SpanHandle {
  spanId: string;
  end: (output?: Record<string, unknown>) => void;
}

// ─── Per-job trace registry ───────────────────────────────────────────────────
// Keeps the root trace object so canvas LLM can reuse it without re-creating.
type TraceObj = ReturnType<Langfuse["trace"]>;
const _traces = new Map<string, TraceObj>();

/**
 * Normalize a jobId to a 32 lowercase hex char trace ID (no dashes).
 * Langfuse trace IDs must be exactly 32 hex chars.
 */
export function lf32(id: string): string {
  return id.replace(/-/g, "").slice(0, 32).toLowerCase();
}

/**
 * Derive a 16 lowercase hex char span ID from a job ID.
 * Langfuse span IDs must be exactly 16 hex chars.
 */
export function lf16(id: string): string {
  return id.replace(/-/g, "").slice(0, 16).toLowerCase();
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * Create (or return existing) root trace for a strategy job.
 * Safe to call multiple times for the same jobId.
 */
export function getOrCreateTrace(jobId: string, userJson: UserJsonSnapshot): TraceObj | null {
  const lf = getLangfuse();
  if (!lf) return null;

  if (_traces.has(jobId)) return _traces.get(jobId)!;

  // Use 32-char hex trace ID so both Node + Python SDKs accept it.
  const traceId = lf32(jobId);

  const trace = lf.trace({
    id: traceId,
    name: "strategy_job",
    sessionId: traceId,
    userId: userJson.userId ?? userJson.sessionId ?? "anonymous",
    metadata: {
      project: cfg.LANGFUSE_PROJECT_NAME,
      organization: cfg.LANGFUSE_ORGANIZATION_NAME,
      country: userJson.country,
      investment_goal: userJson.investmentGoal,
      risk_reaction: userJson.riskReaction,
    },
  });

  _traces.set(jobId, trace);
  return trace;
}

/**
 * Open a "python_agent_phase" child span under the root trace.
 * Returns the span ID so it can be forwarded to Python via HTTP header.
 * The caller must call `handle.end()` when Python finishes.
 */
export function startPythonAgentSpan(
  jobId: string,
  userJson: UserJsonSnapshot,
): SpanHandle | null {
  const trace = getOrCreateTrace(jobId, userJson);
  if (!trace) return null;

  // Derive a unique 16-char hex span ID for the python agent phase.
  // Uses second half of the UUID hex to ensure it differs from the trace ID.
  const spanId = lf32(jobId).slice(16, 32);
  const span = trace.span({
    id: spanId,
    name: "python_agent_phase",
    metadata: { description: "LangGraph ReAct agent — 18 tools, 9-step pipeline" },
  });

  return {
    spanId,
    end: (output?: Record<string, unknown>) => {
      try {
        span.end({ output });
        getLangfuse()?.flushAsync().catch(() => {});
      } catch {}
    },
  };
}

/**
 * Open a "node_canvas_llm" child span under the root trace and return
 * the span object so Langchain.js can attach its CallbackHandler with root=span.
 */
export function startCanvasLLMSpan(jobId: string, userJson: UserJsonSnapshot) {
  const trace = getOrCreateTrace(jobId, userJson);
  if (!trace) return null;

  return trace.span({
    name: "node_canvas_llm",
    metadata: {
      description: "Langchain.js demystifier — builds canvas modules",
      model: "claude-sonnet-4-6",
    },
  });
}

/** Flush all pending Langfuse events — call at graceful shutdown. */
export async function flushLangfuse(): Promise<void> {
  if (_lf) await _lf.flushAsync();
}

// ─── Backwards-compat alias (used in older call sites) ───────────────────────
export const startJobTrace = getOrCreateTrace;
