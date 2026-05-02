"""Pydantic output schema for the Python expert-agent final response."""
from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class StrategyOption(BaseModel):
    id: str = Field(..., description="e.g. opt-1, opt-2")
    title: str
    risk_level: Literal["Low", "Moderate", "Medium-High", "High"]
    best_for: str = Field(..., description="1-sentence description of who this suits")
    content_md: str = Field(
        ...,
        description="Multi-section markdown: ### Asset Allocation table, ### Why this works, ### Pros, ### Cons, ### Agent guidance",
    )


class FinalAnalysis(BaseModel):
    user_summary_md: str = Field(
        ..., description="2-4 paragraphs in markdown summarising the user's situation"
    )
    portfolio_diagnosis_md: str = Field(
        ...,
        description="1-3 paragraphs diagnosing portfolio health, or 'No existing portfolio.' + financial readiness",
    )
    options: list[StrategyOption] = Field(..., min_length=3)
    hidden_disclosures: list[str] = Field(
        ...,
        description="Verbatim charges: expense ratio, exit load, lock-in, STT, etc.",
    )
