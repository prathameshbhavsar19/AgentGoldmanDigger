import { describe, it, expect, beforeAll } from "vitest";
import os from "os";

process.env["DB_PATH"] = os.tmpdir() + "/test_canvas_" + Date.now() + ".db";
process.env["USERS_DIR"] = os.tmpdir() + "/test_users_canvas_" + Date.now();
process.env["DATA_DIR"] = os.tmpdir();

const { runMigrations, getDb } = await import("../../src/db/migrate.js");
const { canvasComposer } = await import("../../src/services/canvasComposer.js");

const jobId = "test-job-" + Date.now();

beforeAll(() => {
  runMigrations();
  // Insert seed rows to satisfy FK constraints
  const db = getDb();
  const now = new Date().toISOString();
  const userId = "test-user-canvas";
  const sessionId = "test-session-canvas";
  db.prepare("INSERT OR IGNORE INTO users (id, first_name, created_at) VALUES (?, ?, ?)").run(userId, "Test", now);
  db.prepare("INSERT OR IGNORE INTO onboarding_sessions (id, user_id, current_step, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(sessionId, userId, "customer", "in_progress", now, now);
  db.prepare("INSERT OR IGNORE INTO strategy_jobs (id, user_id, session_id, status, created_at) VALUES (?, ?, ?, ?, ?)").run(jobId, userId, sessionId, "running", now);
});

describe("canvasComposer", () => {

  it("accepts known module types", () => {
    const result = canvasComposer.handleModuleReady(jobId, {
      type: "goal_summary",
      priority: 1,
      props: { goal: "Wealth creation" },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects unknown module types", () => {
    const result = canvasComposer.handleModuleReady(jobId, {
      type: "unknown_future_module",
      priority: 1,
      props: {},
    });
    expect(result.valid).toBe(false);
  });

  it("assembles report with disclaimer", async () => {
    await canvasComposer.assembleReport(jobId);
    const report = canvasComposer.getReport(jobId);
    expect(report).not.toBeNull();
    const canvas = JSON.parse(report!.final_canvas_json);
    expect(canvas.modules.some((m: { type: string }) => m.type === "important_considerations")).toBe(true);
  });
});
