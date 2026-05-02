"""In-process job registry — thread-safe for uvicorn single-process mode."""
from __future__ import annotations

import asyncio
from collections import OrderedDict
from typing import Optional

from .models import JobState, JobStatus


class JobStore:
    """Dict-backed store for job state; bounded to prevent unbounded growth."""

    _MAX_JOBS = 500

    def __init__(self) -> None:
        self._jobs: OrderedDict[str, JobState] = OrderedDict()
        self._lock = asyncio.Lock()

    async def create(self, job_id: str) -> JobState:
        async with self._lock:
            if len(self._jobs) >= self._MAX_JOBS:
                # Drop the oldest
                self._jobs.popitem(last=False)
            state = JobState(job_id=job_id)
            self._jobs[job_id] = state
            return state

    def get(self, job_id: str) -> Optional[JobState]:
        return self._jobs.get(job_id)

    async def set_running(self, job_id: str) -> None:
        state = self._jobs[job_id]
        state.status = JobStatus.RUNNING

    async def set_completed(self, job_id: str, result) -> None:
        state = self._jobs[job_id]
        state.result = result
        state.status = JobStatus.COMPLETED
        # Signal any waiting WS clients that the stream is done
        await state.event_queue.put(None)

    async def set_failed(self, job_id: str, error: str) -> None:
        state = self._jobs[job_id]
        state.error = error
        state.status = JobStatus.FAILED
        await state.event_queue.put(None)

    async def push_event(self, job_id: str, event: dict) -> None:
        state = self._jobs.get(job_id)
        if state:
            await state.event_queue.put(event)


job_store = JobStore()
