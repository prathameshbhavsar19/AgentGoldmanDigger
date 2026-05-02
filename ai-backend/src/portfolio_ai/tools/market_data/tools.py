"""Category A — Market Data tools (real APIs via yfinance)."""
from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.tools import tool

logger = logging.getLogger(__name__)


def _safe_yf(ticker: str) -> Any:
    """Return a yfinance Ticker, handling import errors gracefully."""
    try:
        import yfinance as yf
        return yf.Ticker(ticker)
    except Exception as exc:
        logger.warning("yfinance unavailable: %s", exc)
        return None


@tool
def stock_price_history(ticker: str, years: int = 10) -> str:
    """Fetch OHLC history, CAGR, and max drawdown for a stock ticker.

    Args:
        ticker: Stock ticker symbol (e.g. AAPL, RELIANCE.NS)
        years: Number of years of history to fetch (default 10)

    Returns:
        JSON string with price history summary, CAGR, and max drawdown.
    """
    try:
        import yfinance as yf
        import pandas as pd

        t = yf.Ticker(ticker)
        hist = t.history(period=f"{years}y", interval="1mo")
        if hist.empty:
            return json.dumps({"error": f"No data found for ticker {ticker}"})

        prices = hist["Close"].dropna()
        if len(prices) < 2:
            return json.dumps({"error": f"Insufficient data for {ticker}"})

        start_price = float(prices.iloc[0])
        end_price = float(prices.iloc[-1])
        actual_years = len(prices) / 12
        cagr = ((end_price / start_price) ** (1 / max(actual_years, 1)) - 1) * 100

        # Max drawdown
        rolling_max = prices.cummax()
        drawdown = (prices - rolling_max) / rolling_max
        max_drawdown = float(drawdown.min()) * 100

        return json.dumps(
            {
                "ticker": ticker,
                "start_price": round(start_price, 2),
                "end_price": round(end_price, 2),
                "cagr_pct": round(cagr, 2),
                "max_drawdown_pct": round(max_drawdown, 2),
                "data_points": len(prices),
                "period_years": round(actual_years, 1),
            }
        )
    except Exception as exc:
        logger.exception("stock_price_history failed for %s", ticker)
        return json.dumps({"error": str(exc), "ticker": ticker})


@tool
def mutual_fund_history(symbol: str, years: int = 10) -> str:
    """Fetch mutual fund / ETF NAV history and benchmark comparison.

    Args:
        symbol: Fund symbol / ETF ticker (e.g. VFIAX, 0P0000O3LQ.BO)
        years: Number of years of history to fetch (default 10)

    Returns:
        JSON with NAV history summary, CAGR, and comparison notes.
    """
    try:
        import yfinance as yf

        t = yf.Ticker(symbol)
        hist = t.history(period=f"{years}y", interval="1mo")
        if hist.empty:
            return json.dumps({"error": f"No data for {symbol}"})

        prices = hist["Close"].dropna()
        start = float(prices.iloc[0])
        end = float(prices.iloc[-1])
        actual_years = len(prices) / 12
        cagr = ((end / start) ** (1 / max(actual_years, 1)) - 1) * 100

        return json.dumps(
            {
                "symbol": symbol,
                "type": "mutual_fund_or_etf",
                "cagr_pct": round(cagr, 2),
                "period_years": round(actual_years, 1),
                "start_nav": round(start, 2),
                "current_nav": round(end, 2),
                "note": "Compare against relevant index for alpha assessment.",
            }
        )
    except Exception as exc:
        logger.exception("mutual_fund_history failed for %s", symbol)
        return json.dumps({"error": str(exc), "symbol": symbol})


@tool
def index_snapshot(market: str) -> str:
    """Get current index level, recent returns, 52-week range, and valuation z-score.

    Args:
        market: One of SPX, NDX, NIFTY, SENSEX, FTSE, DAX, NIKK

    Returns:
        JSON with index snapshot data.
    """
    _TICKERS = {
        "SPX": "^GSPC",
        "NDX": "^NDX",
        "NIFTY": "^NSEI",
        "SENSEX": "^BSESN",
        "FTSE": "^FTSE",
        "DAX": "^GDAXI",
        "NIKK": "^N225",
    }
    ticker = _TICKERS.get(market.upper(), market)
    try:
        import yfinance as yf

        t = yf.Ticker(ticker)
        hist_1y = t.history(period="1y", interval="1d")
        hist_5y = t.history(period="5y", interval="1mo")

        if hist_1y.empty:
            return json.dumps({"error": f"No data for {market}"})

        current = float(hist_1y["Close"].iloc[-1])
        low_52w = float(hist_1y["Low"].min())
        high_52w = float(hist_1y["High"].max())
        ret_1m = ((current / float(hist_1y["Close"].iloc[-22])) - 1) * 100 if len(hist_1y) >= 22 else None
        ret_1y = ((current / float(hist_1y["Close"].iloc[0])) - 1) * 100

        ret_5y = None
        if not hist_5y.empty and len(hist_5y) > 1:
            ret_5y = ((current / float(hist_5y["Close"].iloc[0])) - 1) * 100

        return json.dumps(
            {
                "market": market,
                "ticker": ticker,
                "current_level": round(current, 2),
                "52w_low": round(low_52w, 2),
                "52w_high": round(high_52w, 2),
                "return_1m_pct": round(ret_1m, 2) if ret_1m else None,
                "return_1y_pct": round(ret_1y, 2),
                "return_5y_pct": round(ret_5y, 2) if ret_5y else None,
                "note": "Valuation z-score requires P/E series — use fundamental data for full analysis.",
            }
        )
    except Exception as exc:
        logger.exception("index_snapshot failed for %s", market)
        return json.dumps({"error": str(exc), "market": market})


@tool
def currency_rate(base: str, quote: str) -> str:
    """Get the current spot exchange rate and 1-year trend between two currencies.

    Args:
        base: Base currency code (e.g. USD, EUR, INR)
        quote: Quote currency code (e.g. INR, USD, GBP)

    Returns:
        JSON with spot rate and 1-year change.
    """
    pair = f"{base}{quote}=X"
    try:
        import yfinance as yf

        t = yf.Ticker(pair)
        hist = t.history(period="1y", interval="1d")
        if hist.empty:
            return json.dumps({"error": f"No data for {base}/{quote}"})

        spot = float(hist["Close"].iloc[-1])
        year_ago = float(hist["Close"].iloc[0])
        change_pct = ((spot / year_ago) - 1) * 100

        return json.dumps(
            {
                "pair": f"{base}/{quote}",
                "spot": round(spot, 4),
                "year_ago": round(year_ago, 4),
                "change_1y_pct": round(change_pct, 2),
                "trend": "strengthening" if change_pct > 0 else "weakening",
            }
        )
    except Exception as exc:
        logger.exception("currency_rate failed for %s/%s", base, quote)
        return json.dumps({"error": str(exc), "pair": f"{base}/{quote}"})


@tool
def commodity_price(symbol: str) -> str:
    """Get spot price and recent move for a commodity.

    Args:
        symbol: One of OIL, GOLD, COPPER, SILVER, NATGAS, WHEAT

    Returns:
        JSON with spot price and 1-month change.
    """
    _TICKERS = {
        "OIL": "CL=F",
        "BRENT": "BZ=F",
        "GOLD": "GC=F",
        "COPPER": "HG=F",
        "SILVER": "SI=F",
        "NATGAS": "NG=F",
        "WHEAT": "ZW=F",
    }
    ticker = _TICKERS.get(symbol.upper(), f"{symbol}=F")
    try:
        import yfinance as yf

        t = yf.Ticker(ticker)
        hist = t.history(period="3mo", interval="1d")
        if hist.empty:
            return json.dumps({"error": f"No data for commodity {symbol}"})

        current = float(hist["Close"].iloc[-1])
        month_ago = float(hist["Close"].iloc[-22]) if len(hist) >= 22 else float(hist["Close"].iloc[0])
        change_1m = ((current / month_ago) - 1) * 100

        return json.dumps(
            {
                "commodity": symbol,
                "ticker": ticker,
                "spot_price": round(current, 2),
                "change_1m_pct": round(change_1m, 2),
                "trend": "rising" if change_1m > 0 else "falling",
            }
        )
    except Exception as exc:
        logger.exception("commodity_price failed for %s", symbol)
        return json.dumps({"error": str(exc), "symbol": symbol})
