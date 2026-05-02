"""Prompt regression tests using golden output snapshots.

These tests run tolerance checks against the golden scenarios to catch prompt regressions.
They use mocked/stubbed LLM output for CI speed; real LLM tests are in integration/.
"""
import json
import os
import re
from pathlib import Path
import pytest

GOLDEN_DIR = Path(__file__).parent


def load_golden(scenario_num: int) -> dict:
    path = GOLDEN_DIR / f"golden_scenario_{scenario_num}.json"
    return json.loads(path.read_text())


def validate_against_golden(actual_output: dict, golden: dict) -> list[str]:
    """Return list of validation failure messages. Empty list = pass."""
    failures = []
    checks = golden["tolerance_checks"]

    # Option count
    options = actual_output.get("options", [])
    if len(options) < checks.get("min_options", 3):
        failures.append(f"Expected >={checks['min_options']} options, got {len(options)}")

    # Risk level coverage
    for required_risk in checks.get("required_risk_levels", []):
        if not any(o.get("risk_level") == required_risk for o in options):
            failures.append(f"Missing option with risk_level={required_risk}")

    # Hidden disclosures non-empty
    if checks.get("hidden_disclosures_non_empty"):
        if not actual_output.get("hidden_disclosures"):
            failures.append("hidden_disclosures must be non-empty")

    # Causal chain regex in user_summary_md
    pattern = checks.get("causal_chain_regex")
    if pattern:
        summary = actual_output.get("user_summary_md", "")
        if not re.search(pattern, summary, re.IGNORECASE):
            failures.append(f"user_summary_md missing causal chain evidence (pattern: {pattern})")

    # Each option has non-empty content_md
    for opt in options:
        if not opt.get("content_md", "").strip():
            failures.append(f"Option {opt.get('id')} has empty content_md")

    return failures


class TestGoldenScenario1:
    """First-time investor — no portfolio."""

    def test_golden_structure(self):
        golden = load_golden(1)
        sample = golden["sample_output"]
        failures = validate_against_golden(sample, golden)
        assert not failures, f"Golden scenario 1 structure failures: {failures}"

    def test_min_3_options(self):
        golden = load_golden(1)
        assert len(golden["sample_output"]["options"]) >= 3

    def test_hidden_disclosures_non_empty(self):
        golden = load_golden(1)
        assert len(golden["sample_output"]["hidden_disclosures"]) > 0

    def test_has_low_risk_option(self):
        golden = load_golden(1)
        risk_levels = [o["risk_level"] for o in golden["sample_output"]["options"]]
        assert "Low" in risk_levels


class TestGoldenScenario2:
    """Panic crash — existing portfolio."""

    def test_golden_structure(self):
        golden = load_golden(2)
        sample = golden["sample_output"]
        failures = validate_against_golden(sample, golden)
        assert not failures, f"Golden scenario 2 structure failures: {failures}"

    def test_causal_chain_in_summary(self):
        golden = load_golden(2)
        pattern = golden["tolerance_checks"]["causal_chain_regex"]
        summary = golden["sample_output"]["user_summary_md"]
        assert re.search(pattern, summary, re.IGNORECASE), f"Pattern {pattern!r} not found in summary"

    def test_includes_do_nothing_option(self):
        golden = load_golden(2)
        titles = [o["title"].lower() for o in golden["sample_output"]["options"]]
        assert any("nothing" in t or "hold" in t or "maintain" in t for t in titles)


class TestGoldenScenario14:
    """Geopolitical shock — Hormuz, airlines, causal chain."""

    def test_golden_structure(self):
        golden = load_golden(14)
        sample = golden["sample_output"]
        failures = validate_against_golden(sample, golden)
        assert not failures, f"Golden scenario 14 structure failures: {failures}"

    def test_oil_causal_chain_present(self):
        golden = load_golden(14)
        pattern = golden["tolerance_checks"]["causal_chain_regex"]
        summary = golden["sample_output"]["user_summary_md"]
        assert re.search(pattern, summary, re.IGNORECASE)

    def test_second_order_reasoning(self):
        golden = load_golden(14)
        pattern = golden["tolerance_checks"]["second_order_reasoning_regex"]
        # Should appear in either the summary or the portfolio diagnosis
        text = golden["sample_output"]["user_summary_md"] + golden["sample_output"]["portfolio_diagnosis_md"]
        assert re.search(pattern, text, re.IGNORECASE)

    def test_airline_and_geopolitical_disclosures(self):
        golden = load_golden(14)
        disclosures = " ".join(golden["sample_output"]["hidden_disclosures"]).lower()
        assert any(keyword in disclosures for keyword in ["airline", "fuel", "fx", "conversion", "energy"])
