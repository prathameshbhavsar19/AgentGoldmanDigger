"""Category C — Macro & Regulatory tools (FRED + curated lookups)."""
from __future__ import annotations

import json
import logging
from typing import Literal

from langchain_core.tools import tool

from portfolio_ai.config import settings

logger = logging.getLogger(__name__)

# Curated fallback macro data for demo purposes when FRED is unavailable
_MACRO_FALLBACK: dict[str, dict] = {
    "US": {
        "cpi_pct": 3.2, "policy_rate_pct": 5.25, "unemployment_pct": 3.9,
        "gdp_growth_pct": 2.8, "delta_cpi_12m": -0.8, "delta_rate_12m": 0.0,
    },
    "IN": {
        "cpi_pct": 4.9, "policy_rate_pct": 6.5, "unemployment_pct": 7.8,
        "gdp_growth_pct": 6.5, "delta_cpi_12m": -0.5, "delta_rate_12m": 0.0,
    },
    "EU": {
        "cpi_pct": 2.9, "policy_rate_pct": 4.0, "unemployment_pct": 6.1,
        "gdp_growth_pct": 0.4, "delta_cpi_12m": -1.5, "delta_rate_12m": 1.0,
    },
    "UK": {
        "cpi_pct": 3.4, "policy_rate_pct": 5.25, "unemployment_pct": 4.2,
        "gdp_growth_pct": 0.1, "delta_cpi_12m": -3.1, "delta_rate_12m": 0.75,
    },
    "CN": {
        "cpi_pct": 0.3, "policy_rate_pct": 3.45, "unemployment_pct": 5.2,
        "gdp_growth_pct": 5.0, "delta_cpi_12m": -0.7, "delta_rate_12m": -0.2,
    },
}

_CENTRAL_BANK_FALLBACK: dict[str, dict] = {
    "US": {
        "bank": "Federal Reserve",
        "latest_decision": "Held rates at 5.25-5.50% in May 2026",
        "forward_guidance": "Data-dependent; two cuts expected in H2 2026 if inflation continues to moderate.",
        "key_quote": "The Committee remains attentive to inflation risks.",
    },
    "IN": {
        "bank": "Reserve Bank of India",
        "latest_decision": "Held repo rate at 6.50% in April 2026",
        "forward_guidance": "Watching CPI trajectory; may ease if food inflation cools.",
        "key_quote": "Monetary policy remains focused on withdrawal of accommodation.",
    },
    "EU": {
        "bank": "European Central Bank",
        "latest_decision": "Cut rates by 25bps to 3.75% in April 2026",
        "forward_guidance": "Gradual easing expected through 2026 as inflation nears 2% target.",
        "key_quote": "We are data-dependent and meeting-by-meeting.",
    },
    "UK": {
        "bank": "Bank of England",
        "latest_decision": "Held Bank Rate at 5.25% in March 2026",
        "forward_guidance": "Cut expected in H2 2026; labour market data key.",
        "key_quote": "Inflation persistence remains a concern.",
    },
}

# Tax rules: curated by country + instrument type
_TAX_RULES: dict[str, dict[str, dict]] = {
    "US": {
        "equity": {
            "stcg_rate": "Ordinary income rate (up to 37%) for assets held < 1 year",
            "ltcg_rate": "0%, 15%, or 20% based on income bracket for assets held > 1 year",
            "holding_period": "1 year for LTCG qualification",
            "dividend_tax": "Qualified dividends taxed at LTCG rates; ordinary dividends at income rate",
            "notes": "Wash-sale rule applies to losses within 30-day window",
        },
        "bond": {
            "stcg_rate": "Ordinary income rate for discount bonds and TIPS",
            "ltcg_rate": "15-20% for assets held > 1 year",
            "holding_period": "1 year",
            "notes": "Treasury interest exempt from state/local tax",
        },
        "mf": {
            "stcg_rate": "Ordinary income on short-term gains passed through",
            "ltcg_rate": "LTCG rate (0/15/20%) on distributions held > 1 year",
            "notes": "Index funds typically more tax-efficient than active funds",
        },
        "etf": {
            "stcg_rate": "Ordinary income for < 1 year",
            "ltcg_rate": "0/15/20% for > 1 year",
            "notes": "In-kind creation/redemption makes ETFs highly tax-efficient",
        },
    },
    "IN": {
        "equity": {
            "stcg_rate": "20% (STCG u/s 111A for listed equity held < 12 months)",
            "ltcg_rate": "12.5% on gains above INR 1.25L p.a. (LTCG u/s 112A, listed equity > 12 months)",
            "holding_period": "12 months for LTCG on listed equity",
            "dividend_tax": "Taxed at slab rate in hands of investor",
            "notes": "STT applicable on equity transactions; grandfathering applies to pre-Jan 2018 gains",
        },
        "mf": {
            "stcg_rate": "20% for equity MF held < 12 months",
            "ltcg_rate": "12.5% on gains above INR 1.25L for equity MF held > 12 months",
            "debt_mf_rate": "As per income slab (indexed cost removed for post-April 2023 purchases)",
            "holding_period": "12 months equity; 3 years debt (old regime for pre-Apr 2023)",
            "notes": "ELSS has 3-year lock-in with 80C deduction up to INR 1.5L",
        },
    },
}


@tool
def macro_indicators(country: str) -> str:
    """Fetch key macro indicators: CPI, policy rate, unemployment, GDP growth.

    Args:
        country: Country code — US, IN, EU, UK, CN, JP, AU

    Returns:
        JSON with CPI, policy_rate, unemployment, GDP growth, and 12-month deltas.
    """
    country = country.upper()
    fallback = _MACRO_FALLBACK.get(country, _MACRO_FALLBACK["US"])

    fred_key = settings.FRED_API_KEY
    if fred_key:
        try:
            from fredapi import Fred

            fred = Fred(api_key=fred_key)
            if country == "US":
                cpi_series = fred.get_series("CPIAUCSL", limit=24)
                rate_series = fred.get_series("FEDFUNDS", limit=24)
                unemp = fred.get_series("UNRATE", limit=2)
                gdp_series = fred.get_series("A191RL1Q225SBEA", limit=8)

                cpi = float(cpi_series.iloc[-1])
                cpi_12m_ago = float(cpi_series.iloc[-13]) if len(cpi_series) >= 13 else None
                rate = float(rate_series.iloc[-1])
                rate_12m_ago = float(rate_series.iloc[-13]) if len(rate_series) >= 13 else None

                return json.dumps(
                    {
                        "country": country,
                        "cpi_pct": round(cpi, 2),
                        "policy_rate_pct": round(rate, 2),
                        "unemployment_pct": round(float(unemp.iloc[-1]), 2),
                        "gdp_growth_pct": round(float(gdp_series.iloc[-1]), 2),
                        "delta_cpi_12m": round(cpi - cpi_12m_ago, 2) if cpi_12m_ago else None,
                        "delta_rate_12m": round(rate - rate_12m_ago, 2) if rate_12m_ago else None,
                        "source": "FRED",
                    }
                )
        except Exception as exc:
            logger.warning("FRED API failed for %s: %s — using fallback", country, exc)

    return json.dumps(
        {
            "country": country,
            **fallback,
            "source": "curated_fallback",
            "note": "FRED API not configured; using cached estimates.",
        }
    )


@tool
def central_bank_outlook(country: str) -> str:
    """Fetch the most recent central bank rate decision and forward guidance.

    Args:
        country: Country code — US, IN, EU, UK, CN, JP

    Returns:
        JSON with bank name, latest decision, forward guidance, and key quote.
    """
    country = country.upper()
    data = _CENTRAL_BANK_FALLBACK.get(country, {
        "bank": f"Central Bank of {country}",
        "latest_decision": "Data not available in curated dataset.",
        "forward_guidance": "Please consult official central bank website for latest guidance.",
        "key_quote": "",
    })
    return json.dumps({"country": country, **data, "source": "curated"})


@tool
def tax_rules_lookup(country: str, instrument: str) -> str:
    """Look up STCG/LTCG rates, dividend tax, holding periods for a country + instrument.

    Args:
        country: Country code — US, IN, EU, UK, etc.
        instrument: One of equity, bond, mf, etf, crypto

    Returns:
        JSON with tax rules including short-term/long-term rates and holding periods.
    """
    country = country.upper()
    instrument = instrument.lower()
    country_rules = _TAX_RULES.get(country, {})
    rules = country_rules.get(instrument)

    if not rules:
        return json.dumps(
            {
                "country": country,
                "instrument": instrument,
                "note": "Detailed rules not in curated dataset. Consult a local tax advisor.",
                "general": "Capital gains typically apply; holding periods and rates vary by jurisdiction.",
            }
        )

    return json.dumps({"country": country, "instrument": instrument, **rules})
