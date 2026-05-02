import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PORT = parseInt(process.env["PYTHON_PORT"] ?? "8001", 10);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

type TimelineEvent = {
  event_type: string;
  delay_ms: number;
  [key: string]: unknown;
};

function loadTimeline(name: string): TimelineEvent[] {
  const timelinesDir = path.join(__dirname, "timelines");
  const filePath = path.join(timelinesDir, `${name}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as TimelineEvent[];
  }
  // Default minimal timeline
  return [
    { event_type: "analysis_started", delay_ms: 100 },
    { event_type: "activity_step_started", delay_ms: 200, stepId: "s1", label: "Reading your financial profile", phase: "reading" },
    { event_type: "activity_thought_delta", delay_ms: 300, stepId: "s1", delta: "Reviewing your goals and risk comfort..." },
    { event_type: "activity_step_completed", delay_ms: 500, stepId: "s1", summary: "Profile analyzed." },
    { event_type: "activity_step_started", delay_ms: 600, stepId: "s2", label: "Building strategy options", phase: "strategy" },
    { event_type: "activity_thought_delta", delay_ms: 800, stepId: "s2", delta: "Comparing 3 strategy paths..." },
    { event_type: "activity_step_completed", delay_ms: 1000, stepId: "s2", summary: "3 options prepared." },
    {
      event_type: "canvas_module_ready",
      delay_ms: 1100,
      module: {
        type: "goal_summary",
        priority: 1,
        props: { goal: "Wealth creation", time_horizon: "5-10 years", risk_tone: "Balanced" },
      },
    },
    {
      event_type: "canvas_module_ready",
      delay_ms: 1300,
      module: {
        type: "strategy_options",
        priority: 3,
        props: {
          options: [
            { title: "Safety First Foundation", risk: "Low", summary: "Build emergency savings before major market exposure." },
            { title: "Balanced Growth Path", risk: "Moderate", summary: "Diversified funds and gradual monthly investing." },
            { title: "Long-Term Growth", risk: "Medium-High", summary: "Higher equity exposure for long-term compounding." },
          ],
        },
      },
    },
    { event_type: "analysis_completed", delay_ms: 1500, jobId: "PLACEHOLDER" },
  ];
}

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Track pending timelines: jobId -> job context
const jobContexts = new Map<string, { persona: string; userJson?: unknown }>();

app.post("/ai/jobs", (req, res) => {
  const body = req.body as { jobId?: string; userJson?: { persona?: string } };
  const jobId = body.jobId ?? (req.headers["x-job-id"] as string) ?? "unknown";
  const persona = body.userJson?.persona ?? "new_investor";
  jobContexts.set(jobId, { persona, userJson: body.userJson });
  console.log(`[mockPython] job started: ${jobId} persona: ${persona}`);
  res.status(202).json({ job_id: jobId });
});

app.post("/ai/jobs/:jobId/follow-up", (req, res) => {
  const { jobId } = req.params;
  console.log(`[mockPython] follow-up for: ${jobId}`);
  res.json({ accepted: true });

  // Emit follow-up events
  const ws = activeConnections.get(jobId!);
  if (ws && ws.readyState === WebSocket.OPEN) {
    setTimeout(() => {
      ws.send(JSON.stringify({ event_type: "activity_step_started", stepId: "fu1", label: "Following up on your question", phase: "followup" }));
    }, 100);
    setTimeout(() => {
      ws.send(JSON.stringify({ event_type: "canvas_module_updating", moduleId: "strategy_options" }));
    }, 300);
    setTimeout(() => {
      ws.send(JSON.stringify({ event_type: "canvas_module_ready", module: { type: "strategy_options", priority: 3, props: { options: [{ title: "Conservative Adjustment", risk: "Low", summary: "Shifted to safer allocation." }] } } }));
    }, 600);
    setTimeout(() => {
      ws.send(JSON.stringify({ event_type: "activity_step_completed", stepId: "fu1", summary: "Canvas updated with conservative options." }));
    }, 800);
  }
});

const activeConnections = new Map<string, WebSocket>();

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const match = url.pathname.match(/^\/ai\/jobs\/([^/]+)\/events$/);
  if (!match) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req, match[1]);
  });
});

wss.on("connection", (ws: WebSocket, _req: http.IncomingMessage, jobId: string) => {
  console.log(`[mockPython] WS connected for job: ${jobId}`);
  activeConnections.set(jobId, ws);

  const ctx = jobContexts.get(jobId);
  const persona = ctx?.persona ?? "new_investor";
  const timeline = loadTimeline(persona);

  let offset = 0;
  timeline.forEach((event) => {
    const { delay_ms, ...payload } = event;
    offset += delay_ms;
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const toSend = event.event_type === "analysis_completed"
          ? { ...payload, jobId }
          : payload;
        ws.send(JSON.stringify(toSend));
        console.log(`[mockPython] sent: ${event.event_type}`);
      }
    }, offset);
  });

  ws.on("close", () => {
    activeConnections.delete(jobId);
    console.log(`[mockPython] WS closed for job: ${jobId}`);
  });
});

server.listen(PORT, () => {
  console.log(`[mockPython] listening on port ${PORT}`);
});
