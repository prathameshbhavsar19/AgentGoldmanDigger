import { getDb } from "../migrate.js";
import { newId } from "../../utils/ids.js";

export interface ReportRow {
  id: string;
  job_id: string;
  report_title: string;
  ai_summary: string | null;
  final_canvas_json: string;
  metadata_json: string | null;
  created_at: string;
}

export function insertReport(data: Omit<ReportRow, "id" | "created_at">): ReportRow {
  const db = getDb();
  const id = newId();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO final_reports (id, job_id, report_title, ai_summary, final_canvas_json, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.job_id, data.report_title, data.ai_summary, data.final_canvas_json, data.metadata_json, now);
  return { id, ...data, created_at: now };
}

export function getReportByJobId(jobId: string): ReportRow | undefined {
  return getDb().prepare("SELECT * FROM final_reports WHERE job_id = ? ORDER BY created_at DESC LIMIT 1").get(jobId) as ReportRow | undefined;
}
