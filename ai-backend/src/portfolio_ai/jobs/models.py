"""Data models for AI job lifecycle."""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class JobRequest:
    job_id: str
    user_md: str
    user_json: dict[str, Any]
    holdings: list[dict[str, Any]] | None
    langfuse_trace_id: str | None = None
    meta: dict[str, Any] = field(default_factory=dict)


@dataclass
class StrategyOption:
    id: str
    title: str
    risk_level: str
    best_for: str
    content_md: str


@dataclass
class FinalAnalysis:
    job_id: str
    user_summary_md: str
    portfolio_diagnosis_md: str
    options: list[StrategyOption]
    hidden_disclosures: list[str]


@dataclass
class JobState:
    job_id: str
    status: JobStatus = JobStatus.QUEUED
    event_queue: asyncio.Queue = field(default_factory=asyncio.Queue)
    result: FinalAnalysis | None = None
    error: str | None = None
