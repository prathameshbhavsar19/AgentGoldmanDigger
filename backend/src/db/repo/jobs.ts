import { getDb } from "../migrate.js";
import { newId } from "../../utils/ids.js";

export interface JobRow {
  id: string;
  user_id: string;
  session_id: string;
  status: string;
  python_job_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export function createJob(userId: string, sessionId: string): JobRow {
  const db = getDb();
  const id = newId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO strategy_jobs (id, user_id, session_id, status, created_at)
    VALUES (?, ?, ?, 'created', ?)
  `).run(id, userId, sessionId, now);
  return getJobById(id)!;
}

export function getJobById(id: string): JobRow | undefined {
  return getDb().prepare("SELECT * FROM strategy_jobs WHERE id = ?").get(id) as JobRow | undefined;
}

export function updateJob(id: string, data: Partial<Omit<JobRow, "id" | "created_at">>): void {
  const db = getDb();
  const fields = Object.keys(data).map((k) => `${k} = ?`).join(", ");
  db.prepare(`UPDATE strategy_jobs SET ${fields} WHERE id = ?`).run(...Object.values(data), id);
}
