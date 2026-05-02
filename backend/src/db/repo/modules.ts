import { getDb } from "../migrate.js";
import { newId } from "../../utils/ids.js";

export interface ModuleRow {
  id: string;
  job_id: string;
  module_type: string;
  priority: number;
  module_json: string;
  created_at: string;
}

export function upsertModule(jobId: string, type: string, priority: number, payload: unknown): ModuleRow {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db.prepare("SELECT id FROM canvas_modules WHERE job_id = ? AND module_type = ?").get(jobId, type) as { id: string } | undefined;
  const json = JSON.stringify(payload);
  if (existing) {
    db.prepare("UPDATE canvas_modules SET module_json = ?, priority = ? WHERE id = ?").run(json, priority, existing.id);
    return db.prepare("SELECT * FROM canvas_modules WHERE id = ?").get(existing.id) as ModuleRow;
  }
  const id = newId();
  db.prepare(`
    INSERT INTO canvas_modules (id, job_id, module_type, priority, module_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, jobId, type, priority, json, now);
  return { id, job_id: jobId, module_type: type, priority, module_json: json, created_at: now };
}

export function getModulesByJob(jobId: string): ModuleRow[] {
  return getDb().prepare("SELECT * FROM canvas_modules WHERE job_id = ? ORDER BY priority ASC").all(jobId) as ModuleRow[];
}
