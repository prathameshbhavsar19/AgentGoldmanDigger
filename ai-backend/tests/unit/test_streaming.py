"""Unit tests for StreamingActivityCallback."""
import asyncio
import json
import pytest

from portfolio_ai.agent.streaming import StreamingActivityCallback


def _make_cb(events: list) -> tuple[StreamingActivityCallback, any]:
    async def push(event):
        events.append(event)

    cb = StreamingActivityCallback(job_id="test-job", push_fn=push)
    return cb, events


class TestStreamingActivityCallback:
    def test_chain_start_emits_analysis_started(self):
        events = []
        cb, events = _make_cb(events)

        async def run():
            cb.on_chain_start({}, {})
            await asyncio.sleep(0.05)
            return events

        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(run())
        loop.close()
        types = [e.get("type") for e in result]
        assert "analysis_started" in types

    def test_tool_start_emits_thought_delta(self):
        events = []
        cb, events = _make_cb(events)

        async def run():
            cb.on_chain_start({}, {})
            cb.on_tool_start({"name": "stock_price_history"}, "AAPL", run_id=__import__("uuid").uuid4())
            await asyncio.sleep(0.05)
            return events

        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(run())
        loop.close()
        types = [e.get("type") for e in result]
        assert "activity_thought_delta" in types

    def test_tool_error_emits_thought_delta(self):
        events = []
        cb, events = _make_cb(events)

        async def run():
            cb.on_chain_start({}, {})
            cb.on_tool_error(Exception("network timeout"), run_id=__import__("uuid").uuid4())
            await asyncio.sleep(0.05)
            return events

        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(run())
        loop.close()
        types = [e.get("type") for e in result]
        assert "activity_thought_delta" in types

    def test_agent_finish_emits_step_completed(self):
        events = []
        cb, events = _make_cb(events)

        async def run():
            cb.on_chain_start({}, {})
            cb._step_idx = 9  # Skip to end
            cb._current_step_id = "step-9"
            cb.on_agent_finish({})
            await asyncio.sleep(0.05)
            return events

        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(run())
        loop.close()
        types = [e.get("type") for e in result]
        assert "activity_step_completed" in types
