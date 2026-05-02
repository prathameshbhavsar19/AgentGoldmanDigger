"""Historical stress test sector return fixtures.

Each scenario contains sector-by-sector returns so any holding mix can be replayed.
Sources: academic research, Bloomberg, and published drawdown analysis.

Sectors follow the GICS classification (Financials, Technology, Energy, etc.).
"""

STRESS_SCENARIOS: dict[str, dict] = {
    "2008_GFC": {
        "name": "2008 Global Financial Crisis (Sep 2008 – Mar 2009)",
        "description": "Lehman Brothers collapse triggered systemic credit freeze. Global equities fell ~55% peak-to-trough.",
        "peak_trough_dates": {"peak": "2007-10", "trough": "2009-03"},
        "global_equity_drawdown_pct": -55.0,
        "sector_returns": {
            "Financials": -72.0,
            "Real Estate": -68.0,
            "Consumer Discretionary": -58.0,
            "Materials": -55.0,
            "Industrials": -52.0,
            "Technology": -48.0,
            "Energy": -46.0,
            "Communication Services": -42.0,
            "Consumer Staples": -25.0,
            "Health Care": -22.0,
            "Utilities": -30.0,
        },
        "asset_class_returns": {
            "Global Equity": -55.0,
            "US Equity (S&P 500)": -52.0,
            "Emerging Markets Equity": -61.0,
            "Investment Grade Bonds": +5.0,
            "Government Bonds (10y)": +20.0,
            "High Yield Bonds": -30.0,
            "Gold": +12.0,
            "Real Estate (REITs)": -65.0,
            "Cash / Money Market": +2.0,
        },
        "causal_chain": "Subprime mortgage defaults → bank writedowns → credit freeze → economic recession → mass unemployment",
    },
    "2020_COVID": {
        "name": "2020 COVID-19 Crash (Feb – Mar 2020)",
        "description": "Fastest bear market in history. Global equities fell ~34% in 33 days. V-shaped recovery.",
        "peak_trough_dates": {"peak": "2020-02-19", "trough": "2020-03-23"},
        "global_equity_drawdown_pct": -34.0,
        "sector_returns": {
            "Energy": -50.0,
            "Financials": -40.0,
            "Real Estate": -38.0,
            "Industrials": -36.0,
            "Consumer Discretionary": -32.0,
            "Materials": -30.0,
            "Communication Services": -20.0,
            "Consumer Staples": -18.0,
            "Health Care": -12.0,
            "Utilities": -22.0,
            "Technology": -12.0,  # Tech held up / recovered fastest
        },
        "asset_class_returns": {
            "Global Equity": -34.0,
            "US Equity (S&P 500)": -34.0,
            "Emerging Markets Equity": -32.0,
            "Investment Grade Bonds": +3.0,
            "Government Bonds (10y)": +8.0,
            "High Yield Bonds": -20.0,
            "Gold": +0.0,
            "Real Estate (REITs)": -40.0,
            "Cash / Money Market": +0.3,
        },
        "causal_chain": "Pandemic lockdowns → sudden-stop economic activity → supply chain collapse → liquidity panic → central bank QE intervention",
    },
    "2022_inflation": {
        "name": "2022 Inflation / Rate-Hike Shock (Jan – Dec 2022)",
        "description": "Fed hiked rates aggressively. Long-duration assets devastated. Equity + bond both down.",
        "peak_trough_dates": {"peak": "2021-12", "trough": "2022-10"},
        "global_equity_drawdown_pct": -25.0,
        "sector_returns": {
            "Technology": -40.0,
            "Consumer Discretionary": -38.0,
            "Communication Services": -42.0,
            "Real Estate": -28.0,
            "Financials": -12.0,
            "Materials": -15.0,
            "Industrials": -12.0,
            "Consumer Staples": -2.0,
            "Health Care": -5.0,
            "Utilities": -1.0,
            "Energy": +50.0,  # Energy was the outlier winner in 2022
        },
        "asset_class_returns": {
            "Global Equity": -18.0,
            "US Equity (S&P 500)": -18.0,
            "Emerging Markets Equity": -22.0,
            "Investment Grade Bonds": -15.0,
            "Government Bonds (10y)": -17.0,
            "High Yield Bonds": -14.0,
            "Gold": -2.0,
            "Real Estate (REITs)": -28.0,
            "Cash / Money Market": +2.0,
        },
        "causal_chain": "Post-COVID supply chain disruption + Ukraine war → CPI peaks at 9.1% → Fed hikes 425bps in 12 months → discount rate rise destroys growth-stock DCFs → 60/40 portfolio worst year in 50 years",
    },
    "2018_oilshock": {
        "name": "2018 Oil Price Collapse (Oct – Dec 2018 + Q4 volatility)",
        "description": "Brent crude fell 40% in Q4 2018. Combined with trade war fears and tightening fears.",
        "peak_trough_dates": {"peak": "2018-10-03", "trough": "2018-12-24"},
        "global_equity_drawdown_pct": -20.0,
        "sector_returns": {
            "Energy": -38.0,
            "Materials": -24.0,
            "Industrials": -22.0,
            "Technology": -18.0,
            "Consumer Discretionary": -20.0,
            "Financials": -15.0,
            "Real Estate": -12.0,
            "Communication Services": -16.0,
            "Consumer Staples": -8.0,
            "Health Care": -6.0,
            "Utilities": -5.0,
        },
        "asset_class_returns": {
            "Global Equity": -20.0,
            "US Equity (S&P 500)": -20.0,
            "Emerging Markets Equity": -18.0,
            "Investment Grade Bonds": +2.0,
            "Government Bonds (10y)": +4.0,
            "High Yield Bonds": -8.0,
            "Gold": +5.0,
            "Real Estate (REITs)": -10.0,
            "Cash / Money Market": +0.6,
        },
        "causal_chain": "US shale supply glut + OPEC production decision → Brent -40% → energy sector revenues compressed → EM currencies weakened → risk-off sentiment → broad Q4 equity selloff",
    },
}

# Sector mapping for common asset types
ASSET_TO_SECTOR: dict[str, str] = {
    # Airlines
    "DAL": "Industrials",
    "UAL": "Industrials",
    "AAL": "Industrials",
    "INDIGO": "Industrials",
    "AIRINDIA": "Industrials",
    # Energy
    "XOM": "Energy",
    "CVX": "Energy",
    "COP": "Energy",
    "ONGC.NS": "Energy",
    "RELIANCE.NS": "Energy",
    # Tech
    "AAPL": "Technology",
    "MSFT": "Technology",
    "GOOGL": "Communication Services",
    "NVDA": "Technology",
    "AMZN": "Consumer Discretionary",
    "META": "Communication Services",
    # Finance
    "JPM": "Financials",
    "BAC": "Financials",
    "HDFCBANK.NS": "Financials",
    "ICICIBANK.NS": "Financials",
    # Broad funds/ETFs
    "VOO": "Global Equity",
    "VTI": "US Equity (S&P 500)",
    "QQQ": "Technology",
    "SPY": "US Equity (S&P 500)",
    "VWIGX": "Global Equity",
}
