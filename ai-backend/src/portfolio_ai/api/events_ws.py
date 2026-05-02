"""WS /ai/jobs/:jobId/events — per-job pub/sub event stream to Node."""
from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from portfolio_ai.jobs.models import JobStatus
from portfolio_ai.jobs.store import job_store

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ai/jobs/{job_id}/events")
async def job_events_ws(websocket: WebSocket, job_id: str) -> None:
    """Stream job events to Node.js over WebSocket until job completes or client disconnects."""
    await websocket.accept()
    logger.info("WS client connected for job %s", job_id)

    state = job_store.get(job_id)
    if not state:
        await websocket.send_text(json.dumps({"type": "error", "message": f"Job {job_id} not found"}))
        await websocket.close(code=4004)
        return

    try:
        while True:
            try:
                event = await asyncio.wait_for(state.event_queue.get(), timeout=30.0)
            except asyncio.TimeoutError:
                # Heartbeat
                await websocket.send_text(json.dumps({"type": "heartbeat"}))
                continue

            if event is None:
                # Sentinel — job completed or failed
                logger.info("Job %s finished — closing WS", job_id)
                break

            await websocket.send_text(json.dumps(event))

            # Check if this was the terminal event
            if event.get("type") in ("python_analysis_completed", "analysis_failed"):
                break

    except WebSocketDisconnect:
        logger.info("WS client disconnected from job %s", job_id)
    except Exception as exc:
        logger.exception("WS error for job %s: %s", job_id, exc)
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": str(exc)}))
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
