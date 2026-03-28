#!/usr/bin/env python3
"""
TinyFish Swarm Search — parallel web agents collecting eval research into .md files.

Usage:
    python swarm_search.py
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import quote_plus

import httpx

API_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"
API_KEY = os.environ.get(
    "TINYFISH_API_KEY", "sk-tinyfish-V4YFytYNQ19UQLHHeI9bzD7ChFDmPB_x"
)
TIMEOUT = 120.0
CONCURRENCY = 25  # max parallel agents
OUTPUT_DIR = Path("search_results")

# ---------------------------------------------------------------------------
# Diverse queries covering evals for web search agents from many angles
# ---------------------------------------------------------------------------
QUERIES = [
    # Core eval frameworks & benchmarks
    "web search agent evaluation benchmarks 2024 2025",
    "LLM web search agent evaluation metrics",
    "evaluating AI search agents accuracy relevance",
    "web agent benchmark datasets for search quality",
    "search engine result page evaluation methodology",
    "information retrieval evaluation metrics NDCG MRR precision recall",
    "automated web search agent testing frameworks",
    "web search agent eval leaderboard comparison",
    # Specific tools & papers
    "WebArena benchmark web agent evaluation",
    "Mind2Web benchmark evaluation web agents",
    "VisualWebArena multimodal web agent eval",
    "GAIA benchmark general AI assistants web search",
    "BrowserGym evaluation framework web agents",
    "AgentBench evaluation LLM agents web tasks",
    "WorkArena benchmark enterprise web agents",
    "WebShop benchmark interactive web search agents",
    "AssistantBench benchmark web assistant evaluation",
    "SWE-bench software engineering agent evaluation",
    # Techniques & approaches
    "how to evaluate web browsing AI agents",
    "ground truth labeling for web search evaluation",
    "human evaluation vs automated metrics web search",
    "A/B testing web search agent performance",
    "click-through rate evaluation web search agents",
    "end-to-end evaluation web search pipelines",
    "retrieval augmented generation evaluation web search",
    "web search agent hallucination detection evaluation",
    # Company & product specific
    "Perplexity AI search evaluation methodology",
    "Google search quality evaluation guidelines",
    "Bing AI search agent evaluation approach",
    "Brave Search API evaluation metrics",
    "Tavily AI search API evaluation benchmarks",
    "You.com AI search agent evaluation",
    "Exa AI search evaluation methodology",
    "Serper API search quality evaluation",
    # Research & academic
    "TREC web search evaluation track",
    "BEIR benchmark information retrieval evaluation",
    "MTEB massive text embedding benchmark search",
    "MS MARCO passage retrieval evaluation",
    "Natural Questions benchmark search evaluation",
    "TriviaQA evaluation web search retrieval",
    "HotpotQA multi-hop search agent evaluation",
    "FEVER fact verification search evaluation",
    # Applied & practical
    "building evaluation harness for web search agents",
    "search quality metrics for AI assistants",
    "latency vs accuracy tradeoff web search agents",
    "cost per query evaluation web search agents",
    "search result diversity evaluation metrics",
    "freshness recency evaluation web search results",
    "multilingual web search agent evaluation",
    "domain-specific search agent evaluation medical legal",
    # Agent architectures & patterns
    "ReAct agent web search evaluation",
    "tool-use LLM agent search evaluation methodology",
    "multi-step web search agent evaluation",
    "conversational search agent evaluation metrics",
    "agentic RAG evaluation web search",
    "web scraping agent evaluation accuracy",
    "autonomous web agent evaluation safety reliability",
    "web navigation agent evaluation success rate",
    # Emerging topics
    "real-time web search agent evaluation 2025",
    "multimodal web search agent evaluation vision language",
    "code generation agent web search evaluation",
    "reasoning trace evaluation web search agents",
    "tool calling evaluation for search agents",
    "search agent evaluation with user satisfaction",
    "web agent evaluation reproducibility challenges",
    "open source web search eval frameworks github",
]


async def tinyfish_search(
    client: httpx.AsyncClient,
    query: str,
    sem: asyncio.Semaphore,
    idx: int,
) -> dict:
    """Run one TinyFish search agent and return structured results."""
    search_url = f"https://www.google.com/search?q={quote_plus(query)}"
    goal = (
        f"Extract the top 15 organic search results from this Google search page. "
        "For each result return a JSON array of objects with keys: "
        '"url" (the link href), "title" (the link text), "snippet" (the description text). '
        "Return ONLY the JSON array, no other text."
    )

    async with sem:
        print(f"  [{idx+1:02d}/{len(QUERIES)}] Searching: {query[:60]}...")
        t0 = time.monotonic()
        try:
            buffer = ""
            results = []
            async with client.stream(
                "POST",
                API_URL,
                json={"url": search_url, "goal": goal},
                headers={
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
            ) as stream:
                async for chunk in stream.aiter_text():
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
                        if event.get("type") == "COMPLETE":
                            results = _parse_results(event)

            latency = time.monotonic() - t0
            print(
                f"  [{idx+1:02d}/{len(QUERIES)}] Done: {len(results)} results "
                f"in {latency:.1f}s — {query[:50]}"
            )
            return {
                "query": query,
                "results": results,
                "latency_s": round(latency, 2),
                "error": None,
            }
        except Exception as exc:
            latency = time.monotonic() - t0
            print(f"  [{idx+1:02d}/{len(QUERIES)}] FAILED ({exc!r}) — {query[:50]}")
            return {
                "query": query,
                "results": [],
                "latency_s": round(latency, 2),
                "error": str(exc),
            }


def _parse_results(event: dict) -> list[dict]:
    result_data = event.get("result")
    if result_data is None:
        return []
    if isinstance(result_data, str):
        try:
            result_data = json.loads(result_data)
        except json.JSONDecodeError:
            return []
    items: list[dict] = []
    if isinstance(result_data, list):
        items = result_data
    elif isinstance(result_data, dict):
        for key in ("results", "data", "items", "organic"):
            if isinstance(result_data.get(key), list):
                items = result_data[key]
                break
        if not items:
            items = [result_data]
    parsed = []
    for item in items:
        if not isinstance(item, dict):
            continue
        url = item.get("url") or item.get("link") or item.get("href") or ""
        if not url:
            continue
        parsed.append(
            {
                "url": url,
                "title": item.get("title", ""),
                "snippet": item.get("snippet") or item.get("description") or "",
            }
        )
    return parsed


def slugify(text: str) -> str:
    return (
        text.lower()
        .replace(" ", "-")
        .replace("/", "-")
        .replace(".", "-")
        .replace(",", "")
        .replace("?", "")
        .replace("&", "and")
        .replace("(", "")
        .replace(")", "")
        .replace("'", "")
        .replace('"', "")
        .replace(":", "")
    )[:80]


def write_result_md(data: dict, idx: int) -> Path:
    """Write one search result to a markdown file."""
    slug = slugify(data["query"])
    fname = f"{idx+1:02d}-{slug}.md"
    path = OUTPUT_DIR / fname

    lines = [
        f"# {data['query']}",
        "",
        f"**Latency:** {data['latency_s']}s  ",
        f"**Results:** {len(data['results'])}  ",
    ]
    if data["error"]:
        lines.append(f"**Error:** {data['error']}  ")
    lines.append("")

    if data["results"]:
        lines.append("## Search Results\n")
        for i, r in enumerate(data["results"], 1):
            lines.append(f"### {i}. {r['title']}")
            lines.append(f"**URL:** {r['url']}  ")
            if r["snippet"]:
                lines.append(f"> {r['snippet']}")
            lines.append("")
    else:
        lines.append("*No results returned.*\n")

    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_index_md(all_data: list[dict]) -> Path:
    """Write a master index of all search results."""
    path = OUTPUT_DIR / "00-INDEX.md"
    total_results = sum(len(d["results"]) for d in all_data)
    succeeded = sum(1 for d in all_data if not d["error"])
    failed = sum(1 for d in all_data if d["error"])

    lines = [
        "# Web Search Agent Evals — Research Collection",
        "",
        f"**Total queries:** {len(all_data)}  ",
        f"**Succeeded:** {succeeded}  ",
        f"**Failed:** {failed}  ",
        f"**Total results collected:** {total_results}  ",
        f"**Concurrency:** {CONCURRENCY} parallel agents  ",
        "",
        "## All Queries\n",
        "| # | Query | Results | Latency | Status |",
        "|---|-------|---------|---------|--------|",
    ]

    for i, d in enumerate(all_data, 1):
        slug = slugify(d["query"])
        fname = f"{i:02d}-{slug}.md"
        status = "OK" if not d["error"] else "FAIL"
        lines.append(
            f"| {i} | [{d['query']}]({fname}) | {len(d['results'])} "
            f"| {d['latency_s']}s | {status} |"
        )

    lines.append("")
    lines.append("## Unique URLs Discovered\n")

    # Deduplicate all URLs
    seen = {}
    for d in all_data:
        for r in d["results"]:
            url = r["url"]
            if url not in seen:
                seen[url] = r["title"]

    for url, title in sorted(seen.items(), key=lambda x: x[1].lower()):
        lines.append(f"- [{title or url}]({url})")

    lines.append(f"\n**{len(seen)} unique URLs collected.**\n")

    path.write_text("\n".join(lines), encoding="utf-8")
    return path


async def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    print(f"TinyFish Swarm Search")
    print(f"  Queries: {len(QUERIES)}")
    print(f"  Concurrency: {CONCURRENCY} parallel agents")
    print(f"  Output: {OUTPUT_DIR}/")
    print()

    sem = asyncio.Semaphore(CONCURRENCY)

    async with httpx.AsyncClient(timeout=httpx.Timeout(TIMEOUT)) as client:
        tasks = [
            tinyfish_search(client, query, sem, idx)
            for idx, query in enumerate(QUERIES)
        ]
        all_data = await asyncio.gather(*tasks)

    all_data = list(all_data)

    print("\nWriting markdown files...")
    for idx, data in enumerate(all_data):
        write_result_md(data, idx)

    index_path = write_index_md(all_data)

    total_results = sum(len(d["results"]) for d in all_data)
    succeeded = sum(1 for d in all_data if not d["error"])
    unique_urls = len(
        {r["url"] for d in all_data for r in d["results"]}
    )

    print(f"\nDone!")
    print(f"  Queries run: {len(all_data)}")
    print(f"  Succeeded: {succeeded}/{len(all_data)}")
    print(f"  Total results: {total_results}")
    print(f"  Unique URLs: {unique_urls}")
    print(f"  Index: {index_path}")


if __name__ == "__main__":
    asyncio.run(main())
