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

    // Resume from lastEventId
    const url = new URL(_req.url ?? "/", "http://localhost");
    const lastEventId = parseInt(url.searchParams.get("lastEventId") ?? "0", 10);
    if (lastEventId > 0) {
      const missed = getEventsAfter(jobId, lastEventId);
      missed.forEach((e) => {
        try {
          send(JSON.parse(e.raw_event_json ?? "{}"));
        } catch {
          send({ event_type: e.event_type, job_id: e.job_id });
        }
      });
    }

    // Verify job exists
    const job = getJobById(jobId);
    if (job?.status === "completed") {
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
