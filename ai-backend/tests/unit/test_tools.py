"""Unit tests for deterministic portfolio analytics tools."""
import json
import pytest

# Portfolio analytics (no network)
from portfolio_ai.tools.portfolio_analytics.tools import (
    portfolio_concentration_analyzer,
    fund_overlap_analyzer,
    cost_drag_analyzer,
    historical_stress_test,
    goal_gap_calculator,
)
from portfolio_ai.tools.fees.tools import fund_factsheet_lookup, hidden_charge_scanner
from portfolio_ai.tools.macro.tools import tax_rules_lookup, central_bank_outlook


SAMPLE_HOLDINGS = json.dumps([
    {"symbol": "AAPL", "value": 5000, "sector": "Technology"},
    {"symbol": "DAL", "value": 2000, "sector": "Industrials"},
    {"symbol": "JPM", "value": 3000, "sector": "Financials"},
])

SAMPLE_HOLDINGS_CONCENTRATED = json.dumps([
    {"symbol": "AAPL", "value": 9000, "sector": "Technology"},
    {"symbol": "VOO", "value": 1000, "sector": "Global Equity"},
])


class TestPortfolioConcentrationAnalyzer:
    def test_basic(self):
        result = json.loads(portfolio_concentration_analyzer.invoke({"holdings_json": SAMPLE_HOLDINGS}))
        assert result["total_holdings"] == 3
        assert "top_single_stock" in result
        assert "sector_breakdown" in result

    def test_concentration_flag(self):
        result = json.loads(portfolio_concentration_analyzer.invoke({"holdings_json": SAMPLE_HOLDINGS_CONCENTRATED}))
        assert result["top_single_stock_pct"] > 25
        assert len(result["flags"]) > 0


class TestFundOverlapAnalyzer:
    def test_known_funds(self):
        result = json.loads(fund_overlap_analyzer.invoke({"fund_list_json": json.dumps(["VOO", "SPY"])}))
        assert "pairs" in result
        assert len(result["pairs"]) == 1
        pair = result["pairs"][0]
        assert pair["overlap_pct"] > 50  # VOO and SPY are almost identical

    def test_single_fund(self):
        result = json.loads(fund_overlap_analyzer.invoke({"fund_list_json": json.dumps(["VOO"])}))
        assert "note" in result


class TestCostDragAnalyzer:
    def test_basic(self):
        holdings = json.dumps([
            {"symbol": "VOO", "value": 10000},
            {"symbol": "ARKK", "value": 5000},
        ])
        result = json.loads(cost_drag_analyzer.invoke({"holdings_json": holdings}))
        assert result["annual_fee_total"] > 0
        assert result["ten_year_cumulative_drag"] > 0
        assert result["blended_expense_ratio_pct"] > 0


class TestHistoricalStressTest:
    def test_2008_gfc(self):
        result = json.loads(historical_stress_test.invoke({"holdings_json": SAMPLE_HOLDINGS, "scenario": "2008_GFC"}))
        assert result["portfolio_drawdown_pct"] < 0
        assert result["scenario"] == "2008_GFC"
        assert "causal_chain" in result

    def test_2022_inflation_energy_winner(self):
        energy_holdings = json.dumps([{"symbol": "XOM", "value": 10000, "sector": "Energy"}])
        result = json.loads(historical_stress_test.invoke({"holdings_json": energy_holdings, "scenario": "2022_inflation"}))
        # Energy had +50% in 2022
        assert result["portfolio_drawdown_pct"] > 0

    def test_invalid_scenario(self):
        # Pydantic validates the literal Enum before the tool function runs,
        # so an invalid scenario raises ValidationError rather than returning {"error": ...}
        from pydantic import ValidationError
        with pytest.raises((ValidationError, Exception)):
            historical_stress_test.invoke({"holdings_json": SAMPLE_HOLDINGS, "scenario": "1929_crash"})


class TestGoalGapCalculator:
    def test_reachable_goal(self):
        result = json.loads(goal_gap_calculator.invoke({
            "target_amount": 100000,
            "current_value": 50000,
            "monthly_capacity": 500,
            "years": 10,
            "expected_real_return": 7.0,
        }))
        assert "projected_value" in result
        assert "sensitivity" in result

    def test_gap_calculation(self):
        result = json.loads(goal_gap_calculator.invoke({
            "target_amount": 10_000_000,
            "current_value": 1000,
            "monthly_capacity": 100,
            "years": 5,
            "expected_real_return": 5.0,
        }))
        assert result["goal_reachable"] is False
        assert result["gap"] > 0
        assert result["required_additional_monthly"] > 0


class TestFundFactsheetLookup:
    def test_known_fund(self):
        result = json.loads(fund_factsheet_lookup.invoke({"symbol": "VOO"}))
        assert result["expense_ratio_pct"] == 0.03
        assert "top_10_holdings" in result

    def test_unknown_fund(self):
        result = json.loads(fund_factsheet_lookup.invoke({"symbol": "XYZ_FAKE_FUND"}))
        assert "note" in result


class TestHiddenChargeScanner:
    def test_known_fund(self):
        result = json.loads(hidden_charge_scanner.invoke({"symbol": "ELSS_GENERIC"}))
        assert "charges" in result
        assert len(result["charges"]) > 0

    def test_unknown_fund(self):
        result = json.loads(hidden_charge_scanner.invoke({"symbol": "RANDOM_FUND"}))
        assert "charges" in result  # generic fallback


class TestTaxRulesLookup:
    def test_us_equity(self):
        result = json.loads(tax_rules_lookup.invoke({"country": "US", "instrument": "equity"}))
        assert "stcg_rate" in result
        assert "ltcg_rate" in result

    def test_india_mf(self):
        result = json.loads(tax_rules_lookup.invoke({"country": "IN", "instrument": "mf"}))
        assert "stcg_rate" in result

    def test_unknown_country(self):
        result = json.loads(tax_rules_lookup.invoke({"country": "ZZ", "instrument": "equity"}))
        assert "note" in result


class TestCentralBankOutlook:
    def test_us(self):
        result = json.loads(central_bank_outlook.invoke({"country": "US"}))
        assert result["bank"] == "Federal Reserve"
        assert "forward_guidance" in result

    def test_fallback(self):
        result = json.loads(central_bank_outlook.invoke({"country": "ZZ"}))
        assert "bank" in result
