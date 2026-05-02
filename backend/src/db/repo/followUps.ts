import { getDb } from "../migrate.js";
import { newId } from "../../utils/ids.js";

export interface FollowUpRow {
  id: string;
  job_id: string;
  question: string;
  status: string;
  created_at: string;
}

export function insertFollowUp(jobId: string, question: string): FollowUpRow {
  const db = getDb();
  const id = newId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO follow_up_messages (id, job_id, question, status, created_at)
    VALUES (?, ?, ?, 'pending', ?)
  `).run(id, jobId, question, now);
  return { id, job_id: jobId, question, status: "pending", created_at: now };
}
