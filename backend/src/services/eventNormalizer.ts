import { logger } from "../utils/logger.js";

const ALLOWED_TYPES = new Set([
  "analysis_started",
  "activity_step_started",
  "activity_thought_delta",
  "activity_step_completed",
  "canvas_module_ready",
  "canvas_module_updating",
  "analysis_completed",
  "analysis_failed",
  "needs_user_input",
]);

export interface NormalizedEvent {
  event_type: string;
  job_id: string;
  [key: string]: unknown;
}

export function normalizeEvent(raw: unknown, jobId: string): NormalizedEvent | null {
  if (typeof raw !== "object" || raw === null) return null;

  const obj = raw as Record<string, unknown>;
  const type = (obj["event_type"] ?? obj["type"]) as string | undefined;

  if (!type || !ALLOWED_TYPES.has(type)) {
    logger.debug({ type, jobId }, "Event type not in allowlist, dropping");
    return null;
  }

  // Strip internal fields
  const { internal_message: _a, tool_name: _b, raw_chain_of_thought: _c, ...safe } = obj;

  return {
    ...safe,
    event_type: type,
    job_id: jobId,
  };
}
