"""LLM-as-Judge: use OpenAI to score search result semantic relevance."""

from __future__ import annotations

import asyncio
import logging

import httpx

from .config import settings
from .models import SearchResult

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """You are an expert search quality evaluator. Given a search query and a list of search results, score the overall relevance and quality of the results on a scale from 0.0 to 1.0.

Scoring criteria:
- 1.0: All results are highly relevant, directly answer the query, and provide comprehensive coverage
- 0.8: Most results are relevant with good coverage, minor gaps
- 0.6: Results are somewhat relevant but with notable gaps or off-topic items
- 0.4: Mixed relevance, several results are tangentially related or low quality
- 0.2: Most results are irrelevant or very low quality
- 0.0: Results are completely irrelevant to the query

Consider:
1. Topical relevance: Do the results address the query intent?
2. Result quality: Are titles and snippets informative and accurate?
3. Coverage: Do results cover different aspects of the query?
4. Freshness: Are results likely current and useful?

Respond with ONLY a JSON object: {"score": <float>, "reasoning": "<one sentence>"}"""


async def judge_results(
    query: str,
    results: list[SearchResult],
    provider: str,
    top_k: int = 10,
) -> tuple[float, str]:
    """Score search results using OpenAI as a judge.

    Returns (score, reasoning) tuple. Score is 0.0-1.0.
    Returns (0.0, "Judge unavailable") if OpenAI API key is not configured or call fails.
    """
    api_key = settings.openai_api_key
    if not api_key:
        return 0.0, "OpenAI API key not configured"

    # Format results for the prompt
    results_text = "\n".join(
        f"{i+1}. [{r.title}]({r.url})\n   {r.snippet[:200]}"
        for i, r in enumerate(results[:top_k])
    )

    user_prompt = f"""Query: "{query}"
Provider: {provider}
Number of results: {len(results[:top_k])}

Results:
{results_text}

Score these results for relevance and quality."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openai_model,
                    "messages": [
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 150,
                    "response_format": {"type": "json_object"},
                },
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]

            import json
            parsed = json.loads(content)
            score = float(parsed.get("score", 0.0))
            score = max(0.0, min(1.0, score))  # clamp
            reasoning = parsed.get("reasoning", "")

            logger.info(
                "LLM judge scored %s/%s: %.2f — %s",
                provider, query[:40], score, reasoning[:80],
            )
            return score, reasoning

    except Exception as exc:
        logger.warning("LLM judge failed for %s/%s: %s", provider, query[:40], exc)
        return 0.0, f"Judge error: {type(exc).__name__}"


async def judge_batch(
    queries_results: list[tuple[str, list[SearchResult], str]],
    top_k: int = 10,
) -> list[tuple[float, str]]:
    """Score multiple query-result sets concurrently.

    Args:
        queries_results: list of (query, results, provider) tuples
        top_k: number of results to consider

    Returns list of (score, reasoning) tuples in same order.
    """
    if not settings.openai_api_key:
        return [(0.0, "OpenAI API key not configured")] * len(queries_results)

    # Limit concurrency to avoid rate limits
    sem = asyncio.Semaphore(3)

    async def limited_judge(query: str, results: list[SearchResult], provider: str):
        async with sem:
            return await judge_results(query, results, provider, top_k)

    tasks = [
        limited_judge(query, results, provider)
        for query, results, provider in queries_results
    ]
    return list(await asyncio.gather(*tasks))
