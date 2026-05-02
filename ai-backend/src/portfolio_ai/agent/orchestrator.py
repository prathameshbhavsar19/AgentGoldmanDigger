"""Build and run the senior-consultant LangGraph ReAct agent."""
from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, Callable, Awaitable

from portfolio_ai.agent.prompts import render_senior_consultant_prompt, PROMPT_VERSION
from portfolio_ai.agent.streaming import StreamingActivityCallback
from portfolio_ai.config import settings
from portfolio_ai.jobs.models import FinalAnalysis, StrategyOption
from portfolio_ai.telemetry.langfuse_client import get_callback_handler
from portfolio_ai.tools import ALL_TOOLS

logger = logging.getLogger(__name__)

def _scan_json_object(text: str, start: int) -> str | None:
    """Scan from `start` (which must be `{`) and return the substring up to
    its matching `}`. Tracks string state to correctly skip braces inside
    string values. Returns None if no balanced object found.
    """
    if start >= len(text) or text[start] != "{":
        return None
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
        else:
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
    return None


def _extract_json(text: str) -> dict:
    """Extract the FinalAnalysis JSON object from agent output.

    Claude often prepends scratchpad/reasoning prose and may wrap the JSON in
    a ```json ... ``` code fence. We try several strategies, in order.
    """
    # Strategy 1: ```json ... ``` code fence
    fence_match = re.search(r"```(?:json)?\s*\n(\{.*?\})\s*\n```", text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1))
        except json.JSONDecodeError:
            pass

    # Strategy 2: anchor on a known schema key, walk back to opening brace
    anchor = '"user_summary_md"'
    idx = text.find(anchor)
    if idx != -1:
        # Walk back through whitespace and quotes to find the opening `{`
        for start in range(idx, -1, -1):
            if text[start] == "{":
                candidate = _scan_json_object(text, start)
                if candidate is not None:
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        continue
        # If nothing parsed, fall through

    # Strategy 3: try every `{` from the end, return the first that parses
    indices = [i for i, ch in enumerate(text) if ch == "{"]
    for start in reversed(indices):
        candidate = _scan_json_object(text, start)
        if candidate is None:
            continue
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue

    raise ValueError(f"No valid JSON object found in LLM output. Preview: {text[:300]}")


async def run_agent_job(
    job_id: str,
    user_md: str,
    user_json: dict,
    holdings: list[dict] | None,
    langfuse_trace_id: str | None,
    push_event: Callable[[dict], Awaitable[None]],
    langfuse_parent_span_id: str | None = None,
) -> FinalAnalysis:
    """Run the full senior-consultant ReAct agent and return structured FinalAnalysis.

    This function is the single entry point for the AI reasoning pipeline.
    It streams activity events through push_event throughout execution.
    """
    try:
        from langchain_anthropic import ChatAnthropic
        from langgraph.prebuilt import create_react_agent
    except ImportError as exc:
        raise RuntimeError(f"Missing langchain deps: {exc}") from exc

    trace_id = langfuse_trace_id or job_id
    system_prompt = render_senior_consultant_prompt(user_json)

    # Build callback list
    callbacks = []
    lf_handler = get_callback_handler(
        trace_id,
        parent_span_id=langfuse_parent_span_id,
        prompt_version=PROMPT_VERSION,
    )
    if lf_handler:
        callbacks.append(lf_handler)

    streaming_cb = StreamingActivityCallback(job_id=job_id, push_fn=push_event)
    callbacks.append(streaming_cb)

    llm = ChatAnthropic(
        model=settings.ANTHROPIC_MODEL,
        api_key=settings.ANTHROPIC_API_KEY,
        max_tokens=32000,
        temperature=0,
    )

    # Build holdings context string
    holdings_str = ""
    if holdings:
        holdings_str = "\n\nUser's current holdings:\n" + json.dumps(holdings, indent=2)

    human_message = (
        f"User profile (markdown):\n{user_md}"
        f"{holdings_str}"
        "\n\nPlease conduct your full research pipeline and produce the structured analysis."
    )

    agent = create_react_agent(
        llm.bind_tools(ALL_TOOLS),
        ALL_TOOLS,
        prompt=system_prompt,
    )

    def _content_to_text(content) -> str:
        """Normalise Anthropic message content to a plain string.

        Claude returns content as either a string OR a list of typed blocks
        such as [{"type": "text", "text": "..."}, {"type": "tool_use", ...}].
        We concatenate all text-type blocks; tool_use blocks are ignored.
        """
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    parts.append(block.get("text", ""))
                elif isinstance(block, str):
                    parts.append(block)
            return "".join(parts)
        return ""

    # Run the agent — LangGraph returns the final state
    result_text = ""
    try:
        async for chunk in agent.astream(
            {"messages": [{"role": "user", "content": human_message}]},
            config={"callbacks": callbacks, "recursion_limit": 40},
        ):
            # Extract the latest AI message text from this chunk
            if "agent" in chunk:
                msgs = chunk["agent"].get("messages", [])
                for msg in msgs:
                    text = _content_to_text(getattr(msg, "content", ""))
                    if text.strip():
                        result_text = text
    except Exception as exc:
        logger.exception("Agent execution failed for job %s", job_id)
        raise

    # Parse structured output
    logger.info("Job %s — agent finished. Output length: %d chars", job_id, len(result_text))

    # Persist the raw output for offline debugging
    try:
        import os
        debug_dir = os.environ.get("AI_DEBUG_DIR", "/tmp/portfolio_ai_debug")
        os.makedirs(debug_dir, exist_ok=True)
        with open(os.path.join(debug_dir, f"{job_id}.txt"), "w") as f:
            f.write(result_text)
    except Exception:
        pass

    # Step 1: extract JSON from the agent text. If this fails, the agent did
    # not produce parseable output at all.
    try:
        raw = _extract_json(result_text)
    except Exception as exc:
        logger.exception("Failed to extract JSON from agent output")
        raise ValueError(f"Agent returned unparseable output: {result_text[:500]}") from exc

    # Step 2: coerce the JSON into our schema. Be permissive about known fields
    # but never invent data — if a required field is missing, surface it.

    # Normalise risk_level values that the LLM might emit slightly off-spec
    _RISK_ALIASES = {
        "low": "Low",
        "moderate": "Moderate",
        "medium": "Moderate",
        "moderate-high": "Medium-High",
        "medium-high": "Medium-High",
        "med-high": "Medium-High",
        "high": "High",
    }

    def _normalise_risk(level: str) -> str:
        return _RISK_ALIASES.get((level or "").strip().lower(), level or "Moderate")

    try:
        options = [
            StrategyOption(
                id=str(o.get("id", f"opt-{i + 1}")),
                title=str(o.get("title", "Strategy Option")),
                risk_level=_normalise_risk(o.get("risk_level", "Moderate")),
                best_for=str(o.get("best_for", "")),
                content_md=str(o.get("content_md", "")),
            )
            for i, o in enumerate(raw.get("options", []) or [])
        ]
        analysis = FinalAnalysis(
            job_id=job_id,
            user_summary_md=str(raw.get("user_summary_md", "")),
            portfolio_diagnosis_md=str(raw.get("portfolio_diagnosis_md", "")),
            options=options,
            hidden_disclosures=[str(d) for d in (raw.get("hidden_disclosures", []) or [])],
        )
        return analysis
    except Exception as exc:
        logger.exception("Failed to coerce agent JSON into FinalAnalysis schema")
        raise ValueError(
            f"Agent JSON did not match schema: {exc}. "
            f"Keys present: {list(raw.keys()) if isinstance(raw, dict) else type(raw)}"
        ) from exc
