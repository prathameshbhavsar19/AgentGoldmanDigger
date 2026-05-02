"""Category D — Portfolio Analytics tools (deterministic; no LLM, no network)."""
from __future__ import annotations

import json
import logging
from typing import Literal

from langchain_core.tools import tool

from .stress_fixtures import STRESS_SCENARIOS, ASSET_TO_SECTOR

logger = logging.getLogger(__name__)


@tool
def portfolio_concentration_analyzer(holdings_json: str) -> str:
    """Analyse portfolio concentration: single-stock %, single-sector %, top-3 concentration.

    Args:
        holdings_json: JSON array of holdings. Each holding: {"symbol": "AAPL", "value": 5000, "sector": "Technology"}

    Returns:
        JSON with concentration metrics, flags for >25% single position, and diversification score.
    """
    try:
        holdings = json.loads(holdings_json) if isinstance(holdings_json, str) else holdings_json
        if not holdings:
            return json.dumps({"error": "No holdings provided"})

        total = sum(h.get("value", 0) for h in holdings)
        if total == 0:
            return json.dumps({"error": "Total portfolio value is zero"})

        # Per-stock concentration
        stock_weights = {
            h.get("symbol", f"stock_{i}"): h.get("value", 0) / total * 100
            for i, h in enumerate(holdings)
        }
        top_stock, top_stock_pct = max(stock_weights.items(), key=lambda x: x[1])

        # Per-sector concentration
        sector_values: dict[str, float] = {}
        for h in holdings:
            sector = h.get("sector") or ASSET_TO_SECTOR.get(h.get("symbol", ""), "Other")
            sector_values[sector] = sector_values.get(sector, 0) + h.get("value", 0)

        sector_weights = {s: v / total * 100 for s, v in sector_values.items()}
        top_sector, top_sector_pct = max(sector_weights.items(), key=lambda x: x[1])

        # Top-3 concentration
        sorted_weights = sorted(stock_weights.values(), reverse=True)
        top3_pct = sum(sorted_weights[:3])

        flags = []
        if top_stock_pct > 25:
            flags.append(f"⚠️ {top_stock} is {top_stock_pct:.1f}% of portfolio — single-stock concentration risk.")
        if top_sector_pct > 35:
            flags.append(f"⚠️ {top_sector} sector is {top_sector_pct:.1f}% of portfolio — sector concentration risk.")
        if top3_pct > 60:
            flags.append(f"⚠️ Top 3 holdings = {top3_pct:.1f}% — low diversification.")

        return json.dumps(
            {
                "total_holdings": len(holdings),
                "total_value": round(total, 2),
                "top_single_stock": top_stock,
                "top_single_stock_pct": round(top_stock_pct, 1),
                "top_sector": top_sector,
                "top_sector_pct": round(top_sector_pct, 1),
                "top3_concentration_pct": round(top3_pct, 1),
                "sector_breakdown": {s: round(w, 1) for s, w in sector_weights.items()},
                "flags": flags,
                "well_diversified": len(flags) == 0,
            }
        )
    except Exception as exc:
        logger.exception("portfolio_concentration_analyzer failed")
        return json.dumps({"error": str(exc)})


@tool
def fund_overlap_analyzer(fund_list_json: str) -> str:
    """Analyse pairwise overlap in top holdings across funds.

    Args:
        fund_list_json: JSON array of fund symbols (e.g. ["VOO", "QQQ", "SPY"])

    Returns:
        JSON with pairwise overlap percentages and flags for >40% overlap.
    """
    # Curated top-10 holdings for popular funds
    _FUND_HOLDINGS: dict[str, list[str]] = {
        "VOO": ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "BRK.B", "LLY", "JPM", "UNH"],
        "VTI": ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "BRK.B", "LLY", "JPM", "UNH"],
        "SPY": ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "BRK.B", "LLY", "JPM", "UNH"],
        "QQQ": ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA", "AVGO", "COST", "NFLX"],
        "VGT": ["AAPL", "MSFT", "NVDA", "AVGO", "ORCL", "CSCO", "ADBE", "ACN", "AMD", "TXN"],
        "ARKK": ["TSLA", "COIN", "ROKU", "PATH", "EXAS", "HOOD", "IOVA", "PACB", "CRISPR", "BEAM"],
        "NIFTYBEES.NS": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BAJFINANCE.NS", "BHARTIARTL.NS"],
    }

    try:
        funds = json.loads(fund_list_json) if isinstance(fund_list_json, str) else fund_list_json
        if len(funds) < 2:
            return json.dumps({"note": "Need at least 2 funds to analyse overlap."})

        overlap_results = []
        flags = []

        for i in range(len(funds)):
            for j in range(i + 1, len(funds)):
                f1, f2 = funds[i], funds[j]
                h1 = set(_FUND_HOLDINGS.get(f1.upper(), []))
                h2 = set(_FUND_HOLDINGS.get(f2.upper(), []))
                if not h1 or not h2:
                    overlap_results.append({"pair": f"{f1}/{f2}", "overlap_pct": "unknown", "note": "Holdings not in curated dataset"})
                    continue
                overlap = len(h1 & h2) / max(len(h1 | h2), 1) * 100
                overlap_results.append({"pair": f"{f1}/{f2}", "overlap_pct": round(overlap, 1)})
                if overlap > 40:
                    flags.append(f"⚠️ {f1} and {f2} share {overlap:.0f}% of top holdings — redundant diversification.")

        return json.dumps({"pairs": overlap_results, "flags": flags})
    except Exception as exc:
        logger.exception("fund_overlap_analyzer failed")
        return json.dumps({"error": str(exc)})


@tool
def cost_drag_analyzer(holdings_json: str) -> str:
    """Calculate annual expense drag and 10-year cumulative cost.

    Args:
        holdings_json: JSON array: [{"symbol": "VOO", "value": 10000, "expense_ratio_pct": 0.03}]

    Returns:
        JSON with annual fee, 10-year cumulative drag, and comparison to low-cost alternatives.
    """
    _DEFAULT_EXPENSE_RATIOS = {
        "VOO": 0.03, "VTI": 0.03, "SPY": 0.0945, "QQQ": 0.20,
        "ARKK": 0.75, "FXAIX": 0.015, "VFIAX": 0.04,
        "NIFTYBEES.NS": 0.07, "JUNIORBEES.NS": 0.09,
    }

    try:
        holdings = json.loads(holdings_json) if isinstance(holdings_json, str) else holdings_json
        if not holdings:
            return json.dumps({"error": "No holdings provided"})

        total_value = sum(h.get("value", 0) for h in holdings)
        annual_fee = 0.0
        breakdown = []

        for h in holdings:
            symbol = h.get("symbol", "")
            value = h.get("value", 0)
            er = h.get("expense_ratio_pct") or _DEFAULT_EXPENSE_RATIOS.get(symbol.upper(), 0.5)
            fee = value * er / 100
            annual_fee += fee
            breakdown.append({"symbol": symbol, "value": value, "expense_ratio_pct": er, "annual_fee": round(fee, 2)})

        avg_er = annual_fee / total_value * 100 if total_value else 0

        # Compound effect over 10 years (assumes 7% gross return)
        gross_10y = total_value * (1.07 ** 10)
        net_10y = total_value * ((1.07 - avg_er / 100) ** 10)
        cumulative_drag = gross_10y - net_10y

        low_cost_alternative = total_value * ((1.07 - 0.03 / 100) ** 10)

        return json.dumps(
            {
                "total_portfolio_value": round(total_value, 2),
                "blended_expense_ratio_pct": round(avg_er, 4),
                "annual_fee_total": round(annual_fee, 2),
                "ten_year_cumulative_drag": round(cumulative_drag, 2),
                "ten_year_drag_vs_low_cost": round(gross_10y - low_cost_alternative - cumulative_drag, 2),
                "breakdown": breakdown,
                "note": "Assumes 7% gross annual return. Drag compounds — higher-cost funds lose disproportionately over time.",
            }
        )
    except Exception as exc:
        logger.exception("cost_drag_analyzer failed")
        return json.dumps({"error": str(exc)})


@tool
def historical_stress_test(
    holdings_json: str,
    scenario: Literal["2008_GFC", "2020_COVID", "2022_inflation", "2018_oilshock"],
) -> str:
    """Replay a historical market shock on the user's portfolio using sector return fixtures.

    Args:
        holdings_json: JSON array: [{"symbol": "AAPL", "value": 5000, "sector": "Technology"}]
        scenario: One of 2008_GFC, 2020_COVID, 2022_inflation, 2018_oilshock

    Returns:
        JSON with portfolio drawdown, sector contributions, and comparison to global equity.
    """
    try:
        holdings = json.loads(holdings_json) if isinstance(holdings_json, str) else holdings_json
        sc = STRESS_SCENARIOS.get(scenario)
        if not sc:
            return json.dumps({"error": f"Unknown scenario: {scenario}. Use one of {list(STRESS_SCENARIOS.keys())}"})

        if not holdings:
            return json.dumps({"scenario": scenario, "note": "No holdings — showing global equity reference.", **sc["asset_class_returns"]})

        total_value = sum(h.get("value", 0) for h in holdings)
        if total_value == 0:
            return json.dumps({"error": "All holdings have zero value"})

        # Map each holding to a sector and apply scenario sector return
        sector_returns = sc["sector_returns"]
        asset_class_returns = sc["asset_class_returns"]

        weighted_return = 0.0
        holding_impacts = []

        for h in holdings:
            symbol = h.get("symbol", "")
            value = h.get("value", 0)
            weight = value / total_value
            sector = h.get("sector") or ASSET_TO_SECTOR.get(symbol.upper(), None)

            # Try sector lookup, then asset class, then global equity as fallback
            ret = sector_returns.get(sector) if sector else None
            if ret is None:
                ret = asset_class_returns.get("Global Equity", -30.0)

            weighted_return += weight * ret
            holding_impacts.append(
                {
                    "symbol": symbol,
                    "sector": sector or "Unknown",
                    "weight_pct": round(weight * 100, 1),
                    "scenario_return_pct": ret,
                    "value_impact": round(value * ret / 100, 2),
                }
            )

        portfolio_drawdown = weighted_return
        estimated_loss = total_value * portfolio_drawdown / 100

        return json.dumps(
            {
                "scenario": scenario,
                "scenario_name": sc["name"],
                "description": sc["description"],
                "portfolio_drawdown_pct": round(portfolio_drawdown, 1),
                "estimated_value_loss": round(estimated_loss, 2),
                "global_equity_reference_pct": sc["global_equity_drawdown_pct"],
                "causal_chain": sc["causal_chain"],
                "holding_impacts": holding_impacts,
                "note": "Uses historical sector returns as proxy. Actual performance may differ.",
            }
        )
    except Exception as exc:
        logger.exception("historical_stress_test failed")
        return json.dumps({"error": str(exc)})


@tool
def goal_gap_calculator(
    target_amount: float,
    current_value: float,
    monthly_capacity: float,
    years: int,
    expected_real_return: float,
) -> str:
    """Project whether the user's goal is reachable and calculate the funding gap.

    Args:
        target_amount: Target corpus in base currency (e.g. 1000000 for $1M)
        current_value: Current portfolio / savings value
        monthly_capacity: Monthly investable amount
        years: Investment horizon in years
        expected_real_return: Expected annualised real return in % (e.g. 7.0)

    Returns:
        JSON with projected value, gap, required step-up, and ±2% sensitivity bands.
    """
    try:
        r_annual = expected_real_return / 100
        r_monthly = r_annual / 12
        n_months = years * 12

        # Future value of lump sum
        fv_lump = current_value * (1 + r_annual) ** years

        # Future value of monthly contributions (annuity)
        if r_monthly > 0:
            fv_annuity = monthly_capacity * (((1 + r_monthly) ** n_months - 1) / r_monthly)
        else:
            fv_annuity = monthly_capacity * n_months

        total_projected = fv_lump + fv_annuity
        gap = target_amount - total_projected

        # Required monthly step-up to close the gap
        gap_positive = max(gap, 0)
        if r_monthly > 0 and n_months > 0:
            required_monthly = gap_positive * r_monthly / ((1 + r_monthly) ** n_months - 1)
        else:
            required_monthly = gap_positive / n_months if n_months > 0 else gap_positive

        # Sensitivity bands at ±2%
        def project(ret_pct):
            r_a = ret_pct / 100
            r_m = r_a / 12
            fv_l = current_value * (1 + r_a) ** years
            fv_a = monthly_capacity * (((1 + r_m) ** n_months - 1) / r_m) if r_m > 0 else monthly_capacity * n_months
            return round(fv_l + fv_a, 2)

        return json.dumps(
            {
                "target_amount": target_amount,
                "current_value": current_value,
                "monthly_capacity": monthly_capacity,
                "years": years,
                "expected_return_pct": expected_real_return,
                "projected_value": round(total_projected, 2),
                "gap": round(gap, 2),
                "goal_reachable": gap <= 0,
                "required_additional_monthly": round(required_monthly, 2) if gap > 0 else 0,
                "sensitivity": {
                    f"at_{expected_real_return - 2:.0f}_pct_return": project(expected_real_return - 2),
                    f"at_{expected_real_return:.0f}_pct_return": round(total_projected, 2),
                    f"at_{expected_real_return + 2:.0f}_pct_return": project(expected_real_return + 2),
                },
                "note": f"At {expected_real_return}% annual return, you project ${total_projected:,.0f}. Target is ${target_amount:,.0f}.",
            }
        )
    except Exception as exc:
        logger.exception("goal_gap_calculator failed")
        return json.dumps({"error": str(exc)})
