"""POST /ai/jobs and GET /ai/jobs/:id/result"""
from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel

from portfolio_ai.agent.orchestrator import run_agent_job
from portfolio_ai.jobs.models import FinalAnalysis, JobStatus, StrategyOption
from portfolio_ai.jobs.store import job_store

logger = logging.getLogger(__name__)
router = APIRouter()


class StartJobRequest(BaseModel):
    job_id: str
    user_md: str
    user_json: dict[str, Any]
    holdings: list[dict[str, Any]] | None = None
    meta: dict[str, Any] = {}


async def _run_job(
    job_id: str,
    req: StartJobRequest,
    trace_id: str | None,
    parent_span_id: str | None = None,
) -> None:
    await job_store.set_running(job_id)
    try:

        async def push_event(event: dict) -> None:
            await job_store.push_event(job_id, event)

        analysis = await run_agent_job(
            job_id=job_id,
            user_md=req.user_md,
            user_json=req.user_json,
            holdings=req.holdings,
            langfuse_trace_id=trace_id,
            langfuse_parent_span_id=parent_span_id,
            push_event=push_event,
        )

        # Emit the terminal event
        await push_event(
            {
                "type": "python_analysis_completed",
                "job_id": job_id,
                "user_summary_md": analysis.user_summary_md,
                "portfolio_diagnosis_md": analysis.portfolio_diagnosis_md,
                "options": [
                    {
                        "id": o.id,
                        "title": o.title,
                        "risk_level": o.risk_level,
                        "best_for": o.best_for,
                        "content_md": o.content_md,
                    }
                    for o in analysis.options
                ],
                "hidden_disclosures": analysis.hidden_disclosures,
                "ts": int(time.time() * 1000),
            }
        )

        await job_store.set_completed(job_id, analysis)

    except Exception as exc:
        logger.exception("Job %s failed", job_id)
        await job_store.push_event(
            job_id,
            {
                "type": "analysis_failed",
                "job_id": job_id,
                "error": str(exc),
                "ts": int(time.time() * 1000),
            },
        )
        await job_store.set_failed(job_id, str(exc))


@router.post("/ai/jobs")
async def create_job(request: Request, payload: StartJobRequest, background_tasks: BackgroundTasks):
    """Start a new AI analysis job."""
    trace_id = request.headers.get("x-langfuse-trace-id") or payload.job_id
    parent_span_id = request.headers.get("x-langfuse-parent-span-id") or None

    existing = job_store.get(payload.job_id)
    if existing and existing.status in (JobStatus.RUNNING, JobStatus.COMPLETED):
        return {"job_id": payload.job_id, "status": existing.status, "message": "Job already in progress"}

    await job_store.create(payload.job_id)
    background_tasks.add_task(_run_job, payload.job_id, payload, trace_id, parent_span_id)

    logger.info("Started job %s (trace=%s)", payload.job_id, trace_id)
    return {"job_id": payload.job_id, "status": "queued"}


@router.get("/ai/jobs/{job_id}/result")
async def get_result(job_id: str):
    """Retrieve the final structured result for a completed job."""
    state = job_store.get(job_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    if state.status == JobStatus.FAILED:
        raise HTTPException(status_code=500, detail=state.error or "Job failed")

    if state.status in (JobStatus.QUEUED, JobStatus.RUNNING):
        raise HTTPException(status_code=202, detail="Job still running")

    analysis: FinalAnalysis = state.result
    return {
        "job_id": job_id,
        "user_summary_md": analysis.user_summary_md,
        "portfolio_diagnosis_md": analysis.portfolio_diagnosis_md,
        "options": [
            {
                "id": o.id,
                "title": o.title,
                "risk_level": o.risk_level,
                "best_for": o.best_for,
                "content_md": o.content_md,
            }
            for o in analysis.options
        ],
        "hidden_disclosures": analysis.hidden_disclosures,
    }
