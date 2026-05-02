/**
 * Langfuse root-trace client for Node.js.
 * Creates one root trace per strategy job (traceId = jobId).
 * Python joins the same trace via the x-langfuse-trace-id header.
 */
import { cfg } from "../config.js";

// Lazy singleton — only initialise if keys are configured
let _lf: import("langfuse").Langfuse | null = null;

function getLangfuse(): import("langfuse").Langfuse | null {
  if (_lf) return _lf;
  if (!cfg.LANGFUSE_PUBLIC_KEY || !cfg.LANGFUSE_SECRET_KEY) return null;
  try {
    const { Langfuse } = require("langfuse") as typeof import("langfuse");
    _lf = new Langfuse({
      publicKey: cfg.LANGFUSE_PUBLIC_KEY,
      secretKey: cfg.LANGFUSE_SECRET_KEY,
      baseUrl: cfg.LANGFUSE_BASE_URL,
    });
    return _lf;
  } catch {
    return null;
  }
}

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

/** Start the root trace for a strategy job. Returns the trace object (or null). */
export function startJobTrace(jobId: string, userJson: UserJsonSnapshot) {
  const lf = getLangfuse();
  if (!lf) return null;
  return lf.trace({
    id: jobId,
    name: "strategy_job",
    sessionId: jobId,
    userId: userJson.userId ?? userJson.sessionId ?? "anonymous",
    metadata: {
      project: cfg.LANGFUSE_PROJECT_NAME,
      organization: cfg.LANGFUSE_ORGANIZATION_NAME,
      country: userJson.country,
      investment_goal: userJson.investmentGoal,
    },
  });
}

/** Flush all pending Langfuse events — call at graceful shutdown. */
export async function flushLangfuse(): Promise<void> {
  if (_lf) await _lf.flushAsync();
}
