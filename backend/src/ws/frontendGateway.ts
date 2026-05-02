import type http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "url";
import { eventBus } from "../services/eventBus.js";
import { getEventsAfter } from "../db/repo/events.js";
import { getJobById } from "../db/repo/jobs.js";
import { logger } from "../utils/logger.js";

const PING_INTERVAL = 25_000;
const PONG_TIMEOUT = 10_000;

export function attachFrontendGateway(server: http.Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const match = url.pathname.match(/^\/ws\/strategy\/([^/]+)$/);
    if (!match) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, match[1]);
    });
  });

  wss.on("connection", (ws: WebSocket, _req: http.IncomingMessage, jobId: string) => {
    logger.info({ jobId }, "Frontend WS connected");

    const send = (event: unknown) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      }
    };

    // Resume from lastEventId — replay all events from lastEventId onward.
    // When lastEventId = 0 (fresh connect), replays the full history so clients
    // get a consistent view regardless of when they connect.
    const url = new URL(_req.url ?? "/", "http://localhost");
    const lastEventId = parseInt(url.searchParams.get("lastEventId") ?? "0", 10);
    const missed = getEventsAfter(jobId, lastEventId);
    missed.forEach((e) => {
      try {
        const payload = JSON.parse(e.raw_event_json ?? "{}") as Record<string, unknown>;
        // Always include event_type from DB row — raw_event_json may use "type"
        // instead of "event_type", which the frontend canvasStore switch ignores.
        send({ ...payload, event_type: e.event_type, job_id: e.job_id, event_id: e.seq });
      } catch {
        send({ event_type: e.event_type, job_id: e.job_id, event_id: e.seq });
      }
    });

    // Verify job exists — if already completed and no events were replayed,
    // synthesise a terminal event so the client can close gracefully.
    const job = getJobById(jobId);
    if (job?.status === "completed" && missed.length === 0) {
      send({ event_type: "analysis_completed", job_id: jobId });
    }

    const unsubscribe = eventBus.subscribe(jobId, send);

    // Heartbeat
    let alive = true;
    const pingInterval = setInterval(() => {
      if (!alive) {
        ws.terminate();
        return;
      }
      alive = false;
      ws.ping();
      setTimeout(() => {
        if (!alive) ws.terminate();
      }, PONG_TIMEOUT);
    }, PING_INTERVAL);

    ws.on("pong", () => { alive = true; });
    ws.on("close", () => {
      clearInterval(pingInterval);
      unsubscribe();
      logger.info({ jobId }, "Frontend WS disconnected");
    });
    ws.on("error", (err) => logger.error({ jobId, err: err.message }, "Frontend WS error"));
  });
}
