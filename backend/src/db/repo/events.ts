import { getDb } from "../migrate.js";
import { newId } from "../../utils/ids.js";

export interface EventRow {
  id: string;
  job_id: string;
  event_type: string;
  status: string | null;
  display_message: string | null;
  raw_event_json: string | null;
  seq: number;
  created_at: string;
}

export function insertEvent(data: Omit<EventRow, "id" | "seq" | "created_at">): EventRow {
  const db = getDb();
  const id = newId();
  const now = new Date().toISOString();
  const seq = (db.prepare("SELECT COALESCE(MAX(seq),0)+1 as next FROM ai_events WHERE job_id = ?").get(data.job_id) as { next: number }).next;
  db.prepare(`
    INSERT INTO ai_events (id, job_id, event_type, status, display_message, raw_event_json, seq, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.job_id, data.event_type, data.status, data.display_message, data.raw_event_json, seq, now);
  return { id, ...data, seq, created_at: now };
}

export function getEventsAfter(jobId: string, afterSeq: number): EventRow[] {
  return getDb().prepare("SELECT * FROM ai_events WHERE job_id = ? AND seq > ? ORDER BY seq ASC").all(jobId, afterSeq) as EventRow[];
}

export function getEventsByJob(jobId: string): EventRow[] {
  return getDb().prepare("SELECT * FROM ai_events WHERE job_id = ? ORDER BY seq ASC").all(jobId) as EventRow[];
}
