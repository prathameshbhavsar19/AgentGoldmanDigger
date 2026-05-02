"""Python integration tests: 3 scenarios against the real agent.

Run with: pytest tests/integration/ -v --real-llm (requires ANTHROPIC_API_KEY in .env)

These tests use VCR cassettes for Tavily calls to avoid flaky network dependencies.
"""
import asyncio
import json
import os
import re
import pytest

# Skip if not in real-LLM mode
real_llm = pytest.mark.skipif(
    not os.getenv("ANTHROPIC_API_KEY"),
    reason="ANTHROPIC_API_KEY not set; skipping real LLM integration tests",
)

SCENARIO_1_USER_MD = """
# User Profile: Alex Chen
**Age:** 24 | **Country:** US | **Goal:** Long-term wealth building
**Monthly investable:** $300 | **Horizon:** 10+ years
**Experience:** Complete beginner | **Risk reaction:** "I'd be worried but would wait"
**Portfolio:** None
"""

SCENARIO_1_USER_JSON = {
    "firstName": "Alex",
    "ageRange": "18-25",
    "country": "US",
    "investmentGoal": "Long-term wealth building",
    "timeHorizon": "10+ years",
    "monthlyInvestment": "$300",
    "investmentFamiliarity": "beginner",
    "riskReaction": "worried but would wait",
    "holdings": None,
}

SCENARIO_2_USER_MD = """
# User Profile: Sarah Williams
**Age:** 35 | **Country:** US | **Goal:** Retirement fund
**Monthly investable:** $1000 | **Horizon:** 25 years
**Experience:** Intermediate | **Risk reaction:** "I panic when I see red"
**Portfolio:** Mixed portfolio down -12% this month
"""

SCENARIO_2_USER_JSON = {
    "firstName": "Sarah",
    "ageRange": "35-44",
    "country": "US",
    "investmentGoal": "Retirement fund",
    "timeHorizon": "25 years",
    "monthlyInvestment": "$1000",
    "investmentFamiliarity": "intermediate",
    "riskReaction": "panic",
    "holdings": [
        {"symbol": "VTI", "value": 15000, "sector": "Global Equity"},
        {"symbol": "QQQ", "value": 8000, "sector": "Technology"},
        {"symbol": "BND", "value": 5000, "sector": "Bonds"},
    ],
}

SCENARIO_14_USER_MD = """
# User Profile: Raj Sharma
**Age:** 42 | **Country:** IN | **Goal:** Wealth preservation during geopolitical crisis
**Context:** Strait of Hormuz situation causing oil spike; I hold airline stocks and tech
**Holdings:** DAL ($5000), UAL ($3000), QQQ ($8000), VWIGX ($4000)
"""

SCENARIO_14_USER_JSON = {
    "firstName": "Raj",
    "ageRange": "35-44",
    "country": "IN",
    "investmentGoal": "Wealth preservation during geopolitical crisis",
    "timeHorizon": "5-10 years",
    "monthlyInvestment": "$800",
    "investmentFamiliarity": "intermediate",
    "riskReaction": "concerned about the Hormuz situation",
    "holdings": [
        {"symbol": "DAL", "value": 5000, "sector": "Industrials"},
        {"symbol": "UAL", "value": 3000, "sector": "Industrials"},
        {"symbol": "QQQ", "value": 8000, "sector": "Technology"},
        {"symbol": "VWIGX", "value": 4000, "sector": "Global Equity"},
    ],
}


async def run_job(user_md, user_json, holdings):
    """Run agent job and collect events."""
    events = []

    async def push(event):
        events.append(event)

    from portfolio_ai.agent.orchestrator import run_agent_job
    analysis = await run_agent_job(
        job_id="test-job",
        user_md=user_md,
        user_json=user_json,
        holdings=holdings,
        langfuse_trace_id=None,
        push_event=push,
    )
    return analysis, events


@real_llm
class TestScenario1Integration:
    """First-time investor — no portfolio."""

    def test_produces_3_options(self):
        analysis, events = asyncio.run(run_job(SCENARIO_1_USER_MD, SCENARIO_1_USER_JSON, None))
        assert len(analysis.options) >= 3

    def test_thinking_events_streamed(self):
        analysis, events = asyncio.run(run_job(SCENARIO_1_USER_MD, SCENARIO_1_USER_JSON, None))
        step_events = [e for e in events if e.get("type") == "activity_step_started"]
        assert len(step_events) >= 3

    def test_hidden_disclosures_non_empty(self):
        analysis, events = asyncio.run(run_job(SCENARIO_1_USER_MD, SCENARIO_1_USER_JSON, None))
        assert len(analysis.hidden_disclosures) > 0

    def test_macro_tools_called(self):
        analysis, events = asyncio.run(run_job(SCENARIO_1_USER_MD, SCENARIO_1_USER_JSON, None))
        thought_deltas = " ".join(
            e.get("delta", "") for e in events if e.get("type") == "activity_thought_delta"
        )
        assert any(keyword in thought_deltas.lower() for keyword in ["macro", "indicator", "index", "market"])


@real_llm
class TestScenario2Integration:
    """Panic crash — existing portfolio."""

    def test_stress_test_mentioned(self):
        analysis, events = asyncio.run(run_job(SCENARIO_2_USER_MD, SCENARIO_2_USER_JSON, SCENARIO_2_USER_JSON["holdings"]))
        thought_deltas = " ".join(
            e.get("delta", "") for e in events if e.get("type") == "activity_thought_delta"
        )
        assert any(keyword in thought_deltas.lower() for keyword in ["stress", "historical", "scenario"])

    def test_options_cover_calm_and_defensive(self):
        analysis, events = asyncio.run(run_job(SCENARIO_2_USER_MD, SCENARIO_2_USER_JSON, SCENARIO_2_USER_JSON["holdings"]))
        risk_levels = {o.risk_level for o in analysis.options}
        assert len(risk_levels) >= 2  # At least 2 different risk levels

    def test_causal_chain_in_summary(self):
        analysis, events = asyncio.run(run_job(SCENARIO_2_USER_MD, SCENARIO_2_USER_JSON, SCENARIO_2_USER_JSON["holdings"]))
        assert re.search(r"(drawdown|stress|portfolio|crash|decline)", analysis.user_summary_md, re.IGNORECASE)


@real_llm
class TestScenario14Integration:
    """Geopolitical shock — Hormuz, airlines, causal chain."""

    def test_oil_causal_chain(self):
        analysis, events = asyncio.run(run_job(SCENARIO_14_USER_MD, SCENARIO_14_USER_JSON, SCENARIO_14_USER_JSON["holdings"]))
        text = analysis.user_summary_md + analysis.portfolio_diagnosis_md
        assert re.search(r"(oil|airline|fuel|margin|geopolit|Hormuz)", text, re.IGNORECASE)

    def test_second_order_in_summary(self):
        analysis, events = asyncio.run(run_job(SCENARIO_14_USER_MD, SCENARIO_14_USER_JSON, SCENARIO_14_USER_JSON["holdings"]))
        text = analysis.user_summary_md
        assert re.search(r"(airline|fuel|margin|pass.through|inflation)", text, re.IGNORECASE)

    def test_commodity_or_news_tool_called(self):
        analysis, events = asyncio.run(run_job(SCENARIO_14_USER_MD, SCENARIO_14_USER_JSON, SCENARIO_14_USER_JSON["holdings"]))
        deltas = " ".join(e.get("delta", "") for e in events if e.get("type") == "activity_thought_delta")
        assert any(kw in deltas.lower() for kw in ["commodity", "oil", "news", "geopolit"])
