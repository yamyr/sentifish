"""Web search provider abstraction.

Each provider implements the SearchProvider protocol: given a query and top_k,
return a list of SearchResult. Providers handle their own HTTP calls and
response parsing.
"""

from __future__ import annotations

import json
import logging
import time
from abc import ABC, abstractmethod
from urllib.parse import quote_plus

import httpx

from .config import settings
from .models import SearchResult


class SearchProvider(ABC):
    """Base class for all search providers."""

    name: str

    @abstractmethod
    async def search(self, query: str, top_k: int = 10) -> tuple[list[SearchResult], float]:
        """Execute a search query.

        Returns (results, latency_ms).
        """


class BraveProvider(SearchProvider):
    name = "brave"

    async def search(self, query: str, top_k: int = 10) -> tuple[list[SearchResult], float]:
        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            resp = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                params={"q": query, "count": top_k},
                headers={
                    "Accept": "application/json",
                    "X-Subscription-Token": settings.brave_api_key,
                },
            )
            resp.raise_for_status()
        latency = (time.perf_counter() - start) * 1000

        data = resp.json()
        results = []
        for i, item in enumerate(data.get("web", {}).get("results", [])[:top_k]):
            results.append(
                SearchResult(
                    url=item.get("url", ""),
                    title=item.get("title", ""),
                    snippet=item.get("description", ""),
                    rank=i + 1,
                )
            )
        return results, latency


class SerperProvider(SearchProvider):
    name = "serper"

    async def search(self, query: str, top_k: int = 10) -> tuple[list[SearchResult], float]:
        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                json={"q": query, "num": top_k},
                headers={
                    "X-API-KEY": settings.serper_api_key,
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
        latency = (time.perf_counter() - start) * 1000

        data = resp.json()
        results = []
        for i, item in enumerate(data.get("organic", [])[:top_k]):
            results.append(
                SearchResult(
                    url=item.get("link", ""),
                    title=item.get("title", ""),
                    snippet=item.get("snippet", ""),
                    rank=i + 1,
                )
            )
        return results, latency


class TavilyProvider(SearchProvider):
    name = "tavily"

    async def search(self, query: str, top_k: int = 10) -> tuple[list[SearchResult], float]:
        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            resp = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": settings.tavily_api_key,
                    "query": query,
                    "max_results": top_k,
                },
            )
            resp.raise_for_status()
        latency = (time.perf_counter() - start) * 1000

        data = resp.json()
        results = []
        for i, item in enumerate(data.get("results", [])[:top_k]):
            results.append(
                SearchResult(
                    url=item.get("url", ""),
                    title=item.get("title", ""),
                    snippet=item.get("content", ""),
                    rank=i + 1,
                )
            )
        return results, latency


logger = logging.getLogger(__name__)


class TinyfishProvider(SearchProvider):
    """TinyFish web agent provider.

    Sends a browser automation task to Google via TinyFish SSE API,
    instructing it to extract search results as structured data.
    """

    name = "tinyfish"

    async def search(self, query: str, top_k: int = 10) -> tuple[list[SearchResult], float]:
        search_url = f"https://duckduckgo.com/?q={quote_plus(query)}"
        goal = (
            f"Extract the top {top_k} search results from this page. "
            "Return a JSON array where each item has: url, title, snippet."
        )

        start = time.perf_counter()
        results: list[SearchResult] = []
        deadline = start + settings.tinyfish_timeout

        timeout = httpx.Timeout(settings.tinyfish_timeout, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                "https://agent.tinyfish.ai/v1/automation/run-sse",
                json={"url": search_url, "goal": goal},
                headers={
                    "X-API-Key": settings.tinyfish_api_key,
                    "Content-Type": "application/json",
                },
            ) as stream:
                stream.raise_for_status()
                buffer = ""
                async for chunk in stream.aiter_text():
                    if time.perf_counter() > deadline:
                        logger.warning("TinyFish wall-clock timeout for %r", query)
                        break
                    buffer += chunk
                    while "\n\n" in buffer:
                        event_str, buffer = buffer.split("\n\n", 1)
                        data_line = ""
                        for line in event_str.split("\n"):
                            if line.startswith("data: "):
                                data_line = line[6:]
                        if not data_line:
                            continue
                        try:
                            event = json.loads(data_line)
                        except json.JSONDecodeError:
                            continue
                        event_type = event.get("type", "").upper()
                        logger.info("TinyFish SSE: type=%s", event_type)
                        if event_type in ("COMPLETE", "COMPLETED"):
                            results = _parse_tinyfish_results(event, top_k)

        latency = (time.perf_counter() - start) * 1000
        return results, latency


def _parse_tinyfish_results(event: dict, top_k: int) -> list[SearchResult]:
    """Extract SearchResult list from a TinyFish COMPLETE event."""
    result_data = event.get("result")
    if result_data is None:
        return []

    # result_data may be a JSON string or already parsed
    if isinstance(result_data, str):
        try:
            result_data = json.loads(result_data)
        except json.JSONDecodeError:
            logger.warning("TinyFish returned unparseable result: %.200s", result_data)
            return []

    # Handle both list-of-dicts and dict-with-list
    items: list[dict] = []
    if isinstance(result_data, list):
        items = result_data
    elif isinstance(result_data, dict):
        # Try common wrapper keys
        for key in ("results", "data", "items", "organic"):
            if isinstance(result_data.get(key), list):
                items = result_data[key]
                break
        if not items:
            items = [result_data]

    results = []
    for i, item in enumerate(items[:top_k]):
        if not isinstance(item, dict):
            continue
        url = item.get("url") or item.get("link") or item.get("href") or ""
        if not url:
            continue
        results.append(
            SearchResult(
                url=url,
                title=item.get("title", ""),
                snippet=item.get("snippet") or item.get("description") or "",
                rank=i + 1,
            )
        )
    return results


class MockProvider(SearchProvider):
    """Deterministic mock provider for testing."""

    name = "mock"

    def __init__(self, results: list[SearchResult] | None = None, latency_ms: float = 50.0):
        self._results = results or []
        self._latency_ms = latency_ms

    async def search(self, query: str, top_k: int = 10) -> tuple[list[SearchResult], float]:
        return self._results[:top_k], self._latency_ms


# -- Registry ----------------------------------------------------------------

PROVIDERS: dict[str, type[SearchProvider]] = {
    "brave": BraveProvider,
    "serper": SerperProvider,
    "tavily": TavilyProvider,
    "tinyfish": TinyfishProvider,
}

_KEY_MAP: dict[str, str] = {
    "brave": "brave_api_key",
    "serper": "serper_api_key",
    "tavily": "tavily_api_key",
    "tinyfish": "tinyfish_api_key",
}


def get_provider(name: str) -> SearchProvider:
    """Instantiate a provider by name. Raises ValueError if unknown or unconfigured."""
    cls = PROVIDERS.get(name)
    if cls is None:
        raise ValueError(f"Unknown provider: {name!r}. Available: {list(PROVIDERS)}")
    key_attr = _KEY_MAP.get(name, "")
    if key_attr and not getattr(settings, key_attr, ""):
        raise ValueError(f"Provider {name!r} requires {key_attr.upper()} to be set")
    return cls()


def available_providers() -> list[str]:
    """Return names of providers whose API keys are configured."""
    out = []
    for name, key_attr in _KEY_MAP.items():
        if getattr(settings, key_attr, ""):
            out.append(name)
    return out
