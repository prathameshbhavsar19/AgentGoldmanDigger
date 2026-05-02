"""POST /ai/jobs/:id/follow-up — 4-step micro-pipeline."""
from __future__ import annotations

import asyncio
import json
import logging
import re

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel

from portfolio_ai.agent.prompts import render_followup_prompt, PROMPT_VERSION
from portfolio_ai.config import settings
from portfolio_ai.jobs.models import JobStatus
from portfolio_ai.jobs.store import job_store
from portfolio_ai.telemetry.langfuse_client import get_callback_handler
from portfolio_ai.tools import ALL_TOOLS

logger = logging.getLogger(__name__)
router = APIRouter()

_JSON_RE = re.compile(r"\{[\s\S]*\}", re.DOTALL)


class FollowUpRequest(BaseModel):
    question: str
    user_json: dict = {}


@router.post("/ai/jobs/{job_id}/follow-up")
async def follow_up(job_id: str, request: Request, payload: FollowUpRequest):
    """Answer a follow-up question about a completed job's analysis."""
    state = job_store.get(job_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    if state.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=409, detail="Job not yet completed")

    analysis = state.result
    trace_id = request.headers.get("x-langfuse-trace-id") or job_id

    try:
        from langchain_anthropic import ChatAnthropic
        from langgraph.prebuilt import create_react_agent

        callbacks = []
        lf = get_callback_handler(trace_id, prompt_version=f"{PROMPT_VERSION}-followup")
        if lf:
            callbacks.append(lf)

        llm = ChatAnthropic(
            model=settings.ANTHROPIC_MODEL,
            api_key=settings.ANTHROPIC_API_KEY,
            max_tokens=4096,
            temperature=0,
        )
        system = render_followup_prompt(payload.user_json)

        prior_context = json.dumps(
            {
                "user_summary_md": analysis.user_summary_md,
                "portfolio_diagnosis_md": analysis.portfolio_diagnosis_md,
                "options": [
                    {"id": o.id, "title": o.title, "risk_level": o.risk_level, "content_md": o.content_md[:500]}
                    for o in analysis.options
                ],
                "hidden_disclosures": analysis.hidden_disclosures,
            }
        )
        human = f"Prior analysis:\n{prior_context}\n\nUser question: {payload.question}"

        agent = create_react_agent(
            llm.bind_tools(ALL_TOOLS),
            ALL_TOOLS,
            state_modifier=system,
        )

        result_text = ""
        async for chunk in agent.astream(
            {"messages": [{"role": "user", "content": human}]},
            config={"callbacks": callbacks, "recursion_limit": 15},
        ):
            if "agent" in chunk:
                for msg in chunk["agent"].get("messages", []):
                    if hasattr(msg, "content") and isinstance(msg.content, str):
                        result_text = msg.content

        m = _JSON_RE.search(result_text)
        if m:
            return json.loads(m.group())
        return {"follow_up_md": result_text, "updated_options": None}

    except Exception as exc:
        logger.exception("Follow-up failed for job %s", job_id)
        raise HTTPException(status_code=500, detail=str(exc))
