"""Langfuse telemetry helpers — compatible with langfuse>=3.x Python SDK.

Hierarchy (single trace, hierarchical):
  strategy_job  (Node root trace, id = jobId)
  ├── python_agent_phase  (Node span)
  │   └── [LangChain tool calls + LLM generations via CallbackHandler]
  └── node_canvas_llm  (Node span)
      └── [Langchain.js canvas LLM generation]

Node passes:
  - x-langfuse-trace-id:     jobId        → trace_id in Python CallbackHandler
  - x-langfuse-parent-span-id: spanId     → parent_span_id in Python CallbackHandler

This means ALL Python LangChain events nest under the python_agent_phase span
that Node already opened, giving a single unified tree in Langfuse UI.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Optional

from portfolio_ai.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _init_client():
    """Initialize the Langfuse v3 global singleton. Called once per process."""
    if not settings.LANGFUSE_PUBLIC_KEY or not settings.LANGFUSE_SECRET_KEY:
        return None
    try:
        from langfuse import Langfuse

        client = Langfuse(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            host=settings.LANGFUSE_HOST,
        )
        logger.info(
            "Langfuse initialized — host=%s project=%s",
            settings.LANGFUSE_HOST,
            settings.LANGFUSE_PROJECT_NAME,
        )
        return client
    except Exception as exc:
        logger.warning("Langfuse init failed (tracing disabled): %s", exc)
        return None


def _lf32(id_str: str) -> str:
    """Normalize to 32 lowercase hex chars (strips dashes, truncates to 32). For trace IDs."""
    return id_str.replace("-", "")[:32].lower()


def _lf16(id_str: str) -> str:
    """Normalize to 16 lowercase hex chars. For span IDs."""
    return id_str.replace("-", "")[:16].lower()


def get_callback_handler(
    trace_id: str,
    parent_span_id: Optional[str] = None,
    prompt_version: str = "v1",
):
    """Return a LangChain-compatible Langfuse callback handler (or None).

    Args:
        trace_id:        jobId — must match the Node root trace id.
        parent_span_id:  Node's python_agent_phase span id — nests Python spans under it.
        prompt_version:  Prompt version tag for eval tracking.

    IDs are normalized to 32-char hex (Langfuse v3 requirement) before use.
    """
    client = _init_client()
    if client is None:
        return None
    try:
        from langfuse.langchain import CallbackHandler

        norm_trace_id = _lf32(trace_id)
        trace_context: dict = {
            "trace_id": norm_trace_id,
            "metadata": {
                "job_id": trace_id,
                "prompt_version": prompt_version,
                "project": settings.LANGFUSE_PROJECT_NAME,
            },
        }
        if parent_span_id:
            trace_context["parent_span_id"] = _lf16(parent_span_id)

        logger.info(
            "Langfuse CallbackHandler: trace_id=%s parent_span_id=%s",
            norm_trace_id,
            trace_context.get("parent_span_id"),
        )
        return CallbackHandler(trace_context=trace_context)
    except Exception as exc:
        logger.warning("Langfuse CallbackHandler unavailable: %s", exc)
        return None
