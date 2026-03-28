"""Web search provider abstraction.

Each provider implements the SearchProvider protocol: given a query and top_k,
return a list of SearchResult. Providers handle their own HTTP calls and
response parsing.
"""

from __future__ import annotations

import time
from abc import ABC, abstractmethod

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
}

_KEY_MAP: dict[str, str] = {
    "brave": "brave_api_key",
    "serper": "serper_api_key",
    "tavily": "tavily_api_key",
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
