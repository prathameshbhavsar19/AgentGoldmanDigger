"""Category E — Fees & Disclosures tools (curated mock with realistic shape)."""
from __future__ import annotations

import json
import logging

from langchain_core.tools import tool

logger = logging.getLogger(__name__)

# Curated fund factsheet data — realistic shapes for demo
_FUND_FACTSHEETS: dict[str, dict] = {
    "VOO": {
        "name": "Vanguard S&P 500 ETF",
        "type": "ETF",
        "expense_ratio_pct": 0.03,
        "exit_load_pct": 0.0,
        "lock_in_years": 0,
        "aum_bn_usd": 500.0,
        "fund_manager_tenure_years": 10,
        "top_10_holdings": ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "BRK.B", "LLY", "JPM", "UNH"],
        "scheme_type": "Index ETF — tracks S&P 500",
        "benchmark": "S&P 500",
        "category": "Large-cap US equity",
    },
    "SPY": {
        "name": "SPDR S&P 500 ETF Trust",
        "type": "ETF",
        "expense_ratio_pct": 0.0945,
        "exit_load_pct": 0.0,
        "lock_in_years": 0,
        "aum_bn_usd": 550.0,
        "fund_manager_tenure_years": 15,
        "top_10_holdings": ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "BRK.B", "LLY", "JPM", "UNH"],
        "scheme_type": "Index ETF — tracks S&P 500",
        "benchmark": "S&P 500",
        "note": "Higher expense ratio than VOO despite similar exposure.",
    },
    "QQQ": {
        "name": "Invesco QQQ Trust",
        "type": "ETF",
        "expense_ratio_pct": 0.20,
        "exit_load_pct": 0.0,
        "lock_in_years": 0,
        "aum_bn_usd": 250.0,
        "fund_manager_tenure_years": 12,
        "top_10_holdings": ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA", "AVGO", "COST", "NFLX"],
        "scheme_type": "Index ETF — tracks NASDAQ-100",
        "benchmark": "NASDAQ-100",
        "note": "Heavy tech concentration (~60%). High volatility.",
    },
    "ARKK": {
        "name": "ARK Innovation ETF",
        "type": "Active ETF",
        "expense_ratio_pct": 0.75,
        "exit_load_pct": 0.0,
        "lock_in_years": 0,
        "aum_bn_usd": 7.5,
        "fund_manager_tenure_years": 8,
        "top_10_holdings": ["TSLA", "COIN", "ROKU", "PATH", "EXAS"],
        "scheme_type": "Active ETF — disruptive innovation",
        "benchmark": "ARK Innovation Index",
        "note": "High expense ratio (0.75%) for an ETF. Historically high volatility; -75% from 2021 peak.",
    },
    "FXAIX": {
        "name": "Fidelity 500 Index Fund",
        "type": "Mutual Fund",
        "expense_ratio_pct": 0.015,
        "exit_load_pct": 0.0,
        "lock_in_years": 0,
        "aum_bn_usd": 450.0,
        "fund_manager_tenure_years": 20,
        "top_10_holdings": ["AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "BRK.B", "LLY", "JPM", "UNH"],
        "scheme_type": "Index Mutual Fund — S&P 500",
        "benchmark": "S&P 500",
        "category": "Large-cap US equity, extremely low cost",
    },
    "NIFTYBEES.NS": {
        "name": "Nippon India ETF Nifty BeES",
        "type": "ETF",
        "expense_ratio_pct": 0.07,
        "exit_load_pct": 0.0,
        "lock_in_years": 0,
        "aum_bn_usd": 2.5,
        "fund_manager_tenure_years": 5,
        "top_10_holdings": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS"],
        "scheme_type": "Index ETF — Nifty 50",
        "benchmark": "NIFTY 50",
        "country": "India",
    },
    "GOLDBEES.NS": {
        "name": "Nippon India ETF Gold BeES",
        "type": "Gold ETF",
        "expense_ratio_pct": 0.39,
        "exit_load_pct": 0.0,
        "lock_in_years": 0,
        "aum_bn_usd": 1.2,
        "fund_manager_tenure_years": 6,
        "top_10_holdings": ["Physical Gold"],
        "scheme_type": "Gold ETF",
        "benchmark": "Domestic Gold Price",
    },
    "ELSS_GENERIC": {
        "name": "Generic ELSS Mutual Fund (India)",
        "type": "ELSS",
        "expense_ratio_pct": 1.2,
        "exit_load_pct": 0.0,
        "lock_in_years": 3,
        "aum_bn_usd": 0.5,
        "fund_manager_tenure_years": 4,
        "top_10_holdings": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "HDFC.NS"],
        "scheme_type": "ELSS — Tax-saving mutual fund",
        "benchmark": "NIFTY 500",
        "note": "3-year lock-in. Eligible for 80C deduction up to INR 1.5L/yr.",
    },
}

# Hidden / non-obvious charges
_HIDDEN_CHARGES: dict[str, dict] = {
    "VOO": {
        "charges": [
            "Bid-ask spread on ETF: typically 0.01% per transaction",
            "Brokerage commission: $0 at most US brokers but verify for your platform",
            "Currency conversion fee if buying from non-USD account: typically 0.5–2%",
        ],
        "stcg_note": "Short-term capital gains (held <1yr) taxed at ordinary income rate in US",
        "redemption_note": "No redemption gateway fee; ETF sells on exchange",
    },
    "QQQ": {
        "charges": [
            "Expense ratio of 0.20% is 6.7x higher than VOO for similar large-cap US exposure",
            "Bid-ask spread: ~0.01-0.02%",
            "High concentration risk (>55% in top 10 names) not captured in the TER",
        ],
        "stcg_note": "Same US capital gains treatment as other equity ETFs",
    },
    "ARKK": {
        "charges": [
            "Expense ratio 0.75% is very high for an ETF — costs $75/yr per $10,000 invested",
            "High portfolio turnover generates taxable events (even if you don't sell)",
            "Bid-ask spread can widen to 0.1–0.5% during volatile periods",
        ],
        "redemption_note": "No lock-in, but liquidity risk during market stress",
    },
    "ELSS_GENERIC": {
        "charges": [
            "Exit load: 0% (but 3-year statutory lock-in applies — you cannot exit early)",
            "Expense ratio 1.2% (direct plan) or up to 2.5% (regular/advisor plan) — always verify",
            "STT (Securities Transaction Tax): 0.001% on redemption units",
            "Capital gains: LTCG at 12.5% above INR 1.25L after 3-year holding (equity classification)",
        ],
        "redemption_note": "Redemption only after 3-year lock-in. SEBI-mandated.",
    },
    "NIFTYBEES.NS": {
        "charges": [
            "Brokerage: varies by broker; most charge <0.1% for delivery trades",
            "STT: 0.1% on sell leg for equity ETFs in India",
            "LTCG above INR 1.25L: taxed at 12.5% after 12 months",
            "STCG (held <12 months): 20% flat",
        ],
    },
    "SPY": {
        "charges": [
            "Expense ratio 0.0945% is 3x higher than VOO for identical S&P 500 exposure — 10yr drag is ~$600 per $10,000 initial investment",
            "Bid-ask spread: 0.01–0.02%",
        ],
    },
}

_GENERIC_HIDDEN_CHARGES = {
    "charges": [
        "Transaction charges vary by broker; typical range 0.01–0.1% per trade",
        "Currency conversion fee for international funds: 0.5–2% per transaction",
        "Capital gains tax on redemption (varies by country — consult tax advisor)",
    ],
    "note": "This symbol is not in the curated factsheet database. The charges listed are illustrative.",
}


@tool
def fund_factsheet_lookup(symbol: str) -> str:
    """Look up expense ratio, exit load, lock-in, AUM, fund manager tenure, and top-10 holdings.

    Args:
        symbol: Fund or ETF symbol (e.g. VOO, NIFTYBEES.NS, ARKK)

    Returns:
        JSON with full factsheet data including scheme type, charges, and top holdings.
    """
    data = _FUND_FACTSHEETS.get(symbol.upper()) or _FUND_FACTSHEETS.get(symbol)
    if not data:
        return json.dumps(
            {
                "symbol": symbol,
                "note": "Fund not in curated factsheet database. Data below is illustrative.",
                "expense_ratio_pct": "typically 0.03–2.0% depending on fund type",
                "exit_load_pct": "check fund fact sheet",
                "lock_in_years": "check scheme information document",
                "aum": "not available",
            }
        )
    return json.dumps({"symbol": symbol, **data})


@tool
def hidden_charge_scanner(symbol: str) -> str:
    """Perform a second-pass sweep for non-obvious fees: STT, transaction costs, switch charges, etc.

    Args:
        symbol: Fund or ETF symbol (e.g. VOO, ELSS_GENERIC)

    Returns:
        JSON with list of hidden/non-obvious charges and tax implications.
    """
    data = _HIDDEN_CHARGES.get(symbol.upper()) or _HIDDEN_CHARGES.get(symbol)
    if not data:
        return json.dumps({"symbol": symbol, **_GENERIC_HIDDEN_CHARGES})
    return json.dumps({"symbol": symbol, **data})
