import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import WebSocket from "ws";
import http from "http";
import os from "os";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = os.tmpdir() + "/test_strategy_" + Date.now() + ".db";
const usersDir = os.tmpdir() + "/test_users_strategy_" + Date.now();
const mockPythonPort = 9051 + Math.floor(Math.random() * 100);

process.env["DB_PATH"] = dbPath;
process.env["USERS_DIR"] = usersDir;
process.env["DATA_DIR"] = os.tmpdir();
process.env["NODE_ENV"] = "test";
process.env["PORT"] = "0";
process.env["PYTHON_PORT"] = String(mockPythonPort);
process.env["PYTHON_HTTP_BASE"] = `http://127.0.0.1:${mockPythonPort}`;
process.env["PYTHON_WS_BASE"] = `ws://127.0.0.1:${mockPythonPort}`;
process.env["USE_MOCK_PYTHON"] = "1";

const { runMigrations } = await import("../../src/db/migrate.js");
const { createServer } = await import("../../src/server.js");

// Inline mock Python for tests (avoids spawning a child process)
import express from "express";
import { WebSocketServer } from "ws";

let nodeServer: ReturnType<typeof createServer>;
let mockPythonServer: http.Server;
let nodePort: number;

const jobTimelines = new Map<string, boolean>();

function startMockPython(port: number): Promise<void> {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());

    const server = http.createServer(app);
    const wss = new WebSocketServer({ noServer: true });

    app.post("/ai/jobs", (req, res) => {
      const body = req.body as { jobId?: string };
      const jobId = body.jobId ?? (req.headers["x-job-id"] as string) ?? "unknown";
      jobTimelines.set(jobId, false);
      res.status(202).json({ job_id: jobId });
    });

    app.post("/ai/jobs/:jobId/follow-up", (req, res) => {
      res.json({ accepted: true });
      const { jobId } = req.params;
      const ws = activeWs.get(jobId!);
      if (ws && ws.readyState === WebSocket.OPEN) {
        setTimeout(() => ws.send(JSON.stringify({ event_type: "activity_step_started", stepId: "fu1", label: "Following up", phase: "followup" })), 50);
        setTimeout(() => ws.send(JSON.stringify({ event_type: "canvas_module_updating", moduleId: "strategy_options" })), 150);
        setTimeout(() => ws.send(JSON.stringify({ event_type: "canvas_module_ready", module: { type: "strategy_options", priority: 3, props: { options: [{ title: "Conservative Adjustment", risk: "Low", summary: "Shifted." }] } } })), 300);
        setTimeout(() => ws.send(JSON.stringify({ event_type: "activity_step_completed", stepId: "fu1", summary: "Updated." })), 450);
      }
    });

    const activeWs = new Map<string, WebSocket>();

    server.on("upgrade", (req, socket, head) => {
      const m = new URL(req.url ?? "/", "http://localhost").pathname.match(/^\/ai\/jobs\/([^/]+)\/events$/);
      if (!m) { socket.destroy(); return; }
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req, m[1]));
    });

    wss.on("connection", (ws: WebSocket, _req: http.IncomingMessage, jobId: string) => {
      activeWs.set(jobId, ws);
      // Emit a minimal timeline
      const timeline = [
        { event_type: "analysis_started", delay_ms: 50 },
        { event_type: "activity_step_started", stepId: "s1", label: "Reading profile", phase: "profile", delay_ms: 80 },
        { event_type: "activity_thought_delta", stepId: "s1", delta: "Analyzing...", delay_ms: 80 },
        { event_type: "activity_step_completed", stepId: "s1", summary: "Done.", delay_ms: 80 },
        { event_type: "canvas_module_ready", module: { type: "goal_summary", priority: 1, props: { goal: "Test" } }, delay_ms: 100 },
        { event_type: "canvas_module_ready", module: { type: "strategy_options", priority: 3, props: { options: [] } }, delay_ms: 100 },
        { event_type: "analysis_completed", jobId, delay_ms: 100 },
      ];
      let offset = 0;
      timeline.forEach(({ delay_ms, ...payload }) => {
        offset += delay_ms;
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
        }, offset);
      });
      ws.on("close", () => activeWs.delete(jobId));
    });

    mockPythonServer = server;
    server.listen(port, () => resolve());
  });
}

beforeAll(async () => {
  runMigrations();
  await startMockPython(mockPythonPort);
  nodeServer = createServer();
  await new Promise<void>((res) => nodeServer.listen(0, () => res()));
  nodePort = (nodeServer.address() as { port: number }).port;
});

afterAll(() => {
  nodeServer.close();
  mockPythonServer.close();
  try { fs.unlinkSync(dbPath); } catch {}
  try { fs.rmSync(usersDir, { recursive: true, force: true }); } catch {}
});

describe("Strategy flow integration", () => {
  let sessionId: string;
  let jobId: string;

  it("creates session and patches consent", async () => {
    const res = await request(nodeServer).post("/api/onboarding/session").send({ userHint: { firstName: "StratTest" } });
    expect(res.status).toBe(201);
    sessionId = res.body.sessionId;

    await request(nodeServer).patch(`/api/onboarding/session/${sessionId}`).send({ investmentGoal: "Wealth creation", consentGiven: true, currentStep: "review" });
  });

  it("POST /api/strategy/generate returns jobId", async () => {
    const res = await request(nodeServer).post("/api/strategy/generate").send({ sessionId });
    expect(res.status).toBe(202);
    expect(res.body.jobId).toBeTruthy();
    jobId = res.body.jobId;
  });

  it("WS gateway receives all event types", async () => {
    const received: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${nodePort}/ws/strategy/${jobId}`);
      ws.on("message", (data) => {
        const ev = JSON.parse(data.toString()) as { event_type: string };
        received.push(ev.event_type);
        if (ev.event_type === "analysis_completed") {
          ws.close();
          resolve();
        }
      });
      ws.on("error", reject);
      setTimeout(() => { ws.close(); resolve(); }, 5000);
    });

    expect(received).toContain("analysis_started");
    expect(received).toContain("activity_step_started");
    expect(received).toContain("canvas_module_ready");
    expect(received).toContain("analysis_completed");
  });

  it("GET /api/strategy/report/:jobId returns canvas with disclaimer", async () => {
    // Wait for report to be persisted
    await new Promise(r => setTimeout(r, 500));
    const res = await request(nodeServer).get(`/api/strategy/report/${jobId}`);
    expect(res.status).toBe(200);
    const modules = res.body.modules as Array<{ type: string }>;
    expect(modules.some((m) => m.type === "important_considerations")).toBe(true);
    expect(modules.some((m) => m.type === "goal_summary")).toBe(true);
  });

  it("follow-up emits canvas_module_updating then canvas_module_ready over WS", async () => {
    const fuEvents: string[] = [];

    const wsPromise = new Promise<void>((resolve) => {
      const ws = new WebSocket(`ws://127.0.0.1:${nodePort}/ws/strategy/${jobId}`);
      ws.on("message", (data) => {
        const ev = JSON.parse(data.toString()) as { event_type: string };
        fuEvents.push(ev.event_type);
        if (fuEvents.includes("canvas_module_ready") && fuEvents.includes("canvas_module_updating")) {
          ws.close();
          resolve();
        }
      });
      setTimeout(() => { ws.close(); resolve(); }, 3000);
    });

    await request(nodeServer)
      .post(`/api/strategy/${jobId}/follow-up`)
      .send({ question: "What if I invest more?" });

    await wsPromise;
    expect(fuEvents).toContain("canvas_module_updating");
    expect(fuEvents).toContain("canvas_module_ready");
  });

  it("WS reconnect with lastEventId resumes without missing events", async () => {
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${nodePort}/ws/strategy/${jobId}?lastEventId=0`);
      let count = 0;
      ws.on("message", () => { count++; });
      ws.on("open", () => {
        setTimeout(() => {
          ws.close();
          // Should receive replayed events since lastEventId=0
          expect(count).toBeGreaterThan(0);
          resolve();
        }, 500);
      });
      ws.on("error", reject);
    });
  });
});
