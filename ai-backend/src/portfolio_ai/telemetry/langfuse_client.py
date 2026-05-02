"""Langfuse singleton + LangChain callback handler factory."""
from __future__ import annotations

from functools import lru_cache
from typing import Optional

from portfolio_ai.config import settings


@lru_cache(maxsize=1)
def get_langfuse():
    """Return a Langfuse client, or None if keys are not configured."""
    if not settings.LANGFUSE_PUBLIC_KEY or not settings.LANGFUSE_SECRET_KEY:
        return None
    try:
        from langfuse import Langfuse

        return Langfuse(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            host=settings.LANGFUSE_HOST,
        )
    except Exception:
        return None


def get_callback_handler(
    trace_id: str,
    session_id: Optional[str] = None,
    prompt_version: str = "v1",
):
    """Return a LangChain-compatible Langfuse callback handler.

    If Langfuse is not configured, return an empty list (LangChain accepts
    an empty callbacks list gracefully).
    """
    try:
        from langfuse.callback import CallbackHandler

        return CallbackHandler(
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
            host=settings.LANGFUSE_HOST,
            trace_id=trace_id,
            session_id=session_id or trace_id,
            metadata={"prompt_version": prompt_version},
        )
    except Exception:
        return None
