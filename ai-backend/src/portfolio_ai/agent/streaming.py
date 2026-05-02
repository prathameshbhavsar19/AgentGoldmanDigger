"""StreamingActivityCallback — converts LangGraph/LangChain events to WS activity events.

Polished one-liners only; raw ReAct tokens (Action/Observation) are captured by
Langfuse for internal tracing but never forwarded to the frontend.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from typing import Any
from uuid import UUID

from langchain_core.callbacks import BaseCallbackHandler

logger = logging.getLogger(__name__)

# Map tool names to human-friendly activity labels
_TOOL_LABELS: dict[str, str] = {
    "stock_price_history": "Fetching stock price history",
    "mutual_fund_history": "Retrieving mutual fund NAV history",
    "index_snapshot": "Checking market index snapshot",
    "currency_rate": "Checking currency exchange rates",
    "commodity_price": "Checking commodity prices",
    "market_news_search": "Searching financial news",
    "web_search": "Searching the web for context",
    "company_news": "Checking company-specific news",
    "macro_indicators": "Pulling macro-economic indicators",
    "central_bank_outlook": "Reading central bank guidance",
    "tax_rules_lookup": "Looking up tax rules",
    "portfolio_concentration_analyzer": "Analysing portfolio concentration",
    "fund_overlap_analyzer": "Checking fund overlap",
    "cost_drag_analyzer": "Calculating cost drag",
    "historical_stress_test": "Running historical stress test",
    "goal_gap_calculator": "Projecting goal gap",
    "fund_factsheet_lookup": "Reading fund factsheet",
    "hidden_charge_scanner": "Scanning for hidden charges",
}

# Pipeline steps shown in sequence to the user
_PIPELINE_STEPS = [
    ("step-1", "Reading your financial profile…"),
    ("step-2", "Diagnosing your current portfolio…"),
    ("step-3", "Scanning current macro landscape…"),
    ("step-4", "Investigating the key market developments…"),
    ("step-5", "Mapping market shocks to your specific holdings…"),
    ("step-6", "Stress-testing against historical scenarios…"),
    ("step-7", "Reading fund factsheets for hidden charges…"),
    ("step-8", "Projecting whether your goal is reachable…"),
    ("step-9", "Drafting your personalised strategy options…"),
]


class StreamingActivityCallback(BaseCallbackHandler):
    """Converts LangChain events → structured WS activity events pushed to the job queue."""

    def __init__(self, job_id: str, push_fn) -> None:
        super().__init__()
        self._job_id = job_id
        self._push = push_fn  # async fn(event_dict) -> None
        self._step_idx = 0
        self._current_step_id: str | None = None
        self._tool_call_count = 0
        self._loop = None

    # ─── helpers ───────────────────────────────────────────────────────────

    def _get_loop(self):
        try:
            return asyncio.get_running_loop()
        except RuntimeError:
            return None

    def _emit(self, event: dict) -> None:
        loop = self._get_loop()
        if loop and loop.is_running():
            asyncio.ensure_future(self._push(event))
        else:
            logger.debug("No running loop; event dropped: %s", event.get("type"))

    def _advance_step(self) -> None:
        if self._step_idx < len(_PIPELINE_STEPS):
            step_id, label = _PIPELINE_STEPS[self._step_idx]
            self._current_step_id = step_id
            self._emit(
                {
                    "type": "activity_step_started",
                    "stepId": step_id,
                    "label": label,
                    "phase": "thinking",
                    "ts": int(time.time() * 1000),
                }
            )
            self._step_idx += 1

    # ─── LangChain hooks ───────────────────────────────────────────────────

    def on_chain_start(self, serialized, inputs, **kwargs) -> None:
        if self._step_idx == 0:
            self._emit(
                {
                    "type": "analysis_started",
                    "ts": int(time.time() * 1000),
                }
            )
            self._advance_step()

    def on_tool_start(
        self, serialized: dict, input_str: str, *, run_id: UUID, **kwargs
    ) -> None:
        tool_name = serialized.get("name", "")
        label = _TOOL_LABELS.get(tool_name, f"Running {tool_name}…")
        self._tool_call_count += 1

        # Advance pipeline step on certain tool transitions
        if tool_name in ("portfolio_concentration_analyzer", "fund_overlap_analyzer", "cost_drag_analyzer"):
            if self._step_idx == 1:
                self._advance_step()
        elif tool_name in ("macro_indicators", "central_bank_outlook", "index_snapshot"):
            if self._step_idx <= 2:
                while self._step_idx < 3:
                    self._advance_step()
        elif tool_name in ("market_news_search", "web_search", "company_news"):
            if self._step_idx <= 3:
                while self._step_idx < 4:
                    self._advance_step()
        elif tool_name in ("historical_stress_test",):
            if self._step_idx <= 5:
                while self._step_idx < 6:
                    self._advance_step()
        elif tool_name in ("fund_factsheet_lookup", "hidden_charge_scanner"):
            if self._step_idx <= 6:
                while self._step_idx < 7:
                    self._advance_step()
        elif tool_name in ("goal_gap_calculator",):
            if self._step_idx <= 7:
                while self._step_idx < 8:
                    self._advance_step()

        self._emit(
            {
                "type": "activity_thought_delta",
                "stepId": self._current_step_id or "step-1",
                "delta": f"{label}…",
                "ts": int(time.time() * 1000),
            }
        )

    def on_tool_end(self, output: str, *, run_id: UUID, **kwargs) -> None:
        pass  # Langfuse captures full output; we skip forwarding raw observations

    def on_tool_error(self, error, *, run_id: UUID, **kwargs) -> None:
        self._emit(
            {
                "type": "activity_thought_delta",
                "stepId": self._current_step_id or "step-1",
                "delta": "Tool returned an error; continuing with available data…",
                "ts": int(time.time() * 1000),
            }
        )

    def on_llm_start(self, serialized, prompts, **kwargs) -> None:
        if self._step_idx >= len(_PIPELINE_STEPS):
            self._emit(
                {
                    "type": "activity_thought_delta",
                    "stepId": "step-9",
                    "delta": "Synthesising your personalised strategy…",
                    "ts": int(time.time() * 1000),
                }
            )

    def on_agent_finish(self, finish, **kwargs) -> None:
        # Advance any remaining steps up to synthesis
        while self._step_idx < len(_PIPELINE_STEPS):
            self._advance_step()

        if self._current_step_id:
            self._emit(
                {
                    "type": "activity_step_completed",
                    "stepId": self._current_step_id,
                    "summary": "Research complete — drafting your options.",
                    "ts": int(time.time() * 1000),
                }
            )
