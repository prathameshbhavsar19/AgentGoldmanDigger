"""Category B — News & Web tools (Tavily-backed)."""
from __future__ import annotations

import json
import logging
from typing import Optional

from langchain_core.tools import tool

from portfolio_ai.config import settings

logger = logging.getLogger(__name__)


def _tavily_client():
    try:
        from tavily import TavilyClient
        return TavilyClient(api_key=settings.TAVILY_API_KEY) if settings.TAVILY_API_KEY else None
    except ImportError:
        return None


def _mock_news(query: str, n: int = 3) -> list[dict]:
    """Fallback mock results when Tavily is not configured."""
    return [
        {
            "title": f"Mock article {i + 1}: {query[:50]}",
            "url": f"https://example.com/article-{i + 1}",
            "content": f"This is a mock news article about {query}. In a real deployment, Tavily would return actual news.",
            "published_date": "2026-05-02",
        }
        for i in range(n)
    ]


@tool
def market_news_search(query: str, recency_days: int = 7, domain_filter: str = "finance") -> str:
    """Search for recent financial news using Tavily.

    Args:
        query: Search query (e.g. "oil price spike impact on airline stocks")
        recency_days: Limit to news published within this many days (default 7)
        domain_filter: Focus domain — "finance", "general", "geopolitics" (default "finance")

    Returns:
        JSON array of top news articles with title, url, content snippet, and date.
    """
    client = _tavily_client()
    if not client:
        logger.warning("Tavily not configured — returning mock news for: %s", query)
        return json.dumps({"results": _mock_news(query), "source": "mock"})

    try:
        finance_domains = [
            "reuters.com", "bloomberg.com", "ft.com", "wsj.com",
            "cnbc.com", "marketwatch.com", "economictimes.com",
            "moneycontrol.com", "livemint.com",
        ]
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=5,
            days=recency_days,
            include_domains=finance_domains if domain_filter == "finance" else [],
        )
        results = [
            {
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "content": r.get("content", "")[:500],
                "published_date": r.get("published_date", ""),
            }
            for r in response.get("results", [])
        ]
        return json.dumps({"results": results, "source": "tavily"})
    except Exception as exc:
        logger.exception("market_news_search failed for query: %s", query)
        return json.dumps({"results": _mock_news(query), "source": "mock_fallback", "error": str(exc)})


@tool
def web_search(query: str) -> str:
    """General web search for non-financial context (geopolitics, regulations, etc.).

    Args:
        query: Search query string

    Returns:
        JSON array of top search results with title, url, and content snippet.
    """
    client = _tavily_client()
    if not client:
        return json.dumps({"results": _mock_news(query), "source": "mock"})

    try:
        response = client.search(
            query=query,
            search_depth="basic",
            max_results=5,
        )
        results = [
            {
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "content": r.get("content", "")[:400],
            }
            for r in response.get("results", [])
        ]
        return json.dumps({"results": results, "source": "tavily"})
    except Exception as exc:
        logger.exception("web_search failed: %s", query)
        return json.dumps({"results": _mock_news(query), "source": "mock_fallback", "error": str(exc)})


@tool
def company_news(ticker: str, recency_days: int = 14) -> str:
    """Fetch recent news for a specific company / issuer.

    Args:
        ticker: Stock or fund ticker symbol (e.g. AAPL, TSLA)
        recency_days: Limit to news from this many days back (default 14)

    Returns:
        JSON array of top company-specific news articles.
    """
    query = f"{ticker} stock news earnings outlook"
    client = _tavily_client()
    if not client:
        return json.dumps({"ticker": ticker, "results": _mock_news(query, n=3), "source": "mock"})

    try:
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=5,
            days=recency_days,
        )
        results = [
            {
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "content": r.get("content", "")[:500],
                "published_date": r.get("published_date", ""),
            }
            for r in response.get("results", [])
        ]
        return json.dumps({"ticker": ticker, "results": results, "source": "tavily"})
    except Exception as exc:
        logger.exception("company_news failed for %s", ticker)
        return json.dumps({"ticker": ticker, "results": _mock_news(query, n=3), "source": "mock_fallback", "error": str(exc)})
