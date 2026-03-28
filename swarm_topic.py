#!/usr/bin/env python3
"""
Single-topic TinyFish agent: search + analyze for one topic.
Usage: python swarm_topic.py <topic_number> "<topic_query>"
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path
from urllib.parse import quote_plus

import httpx

API_KEY = os.environ.get("TINYFISH_API_KEY")
if not API_KEY:
    raise RuntimeError("TINYFISH_API_KEY environment variable is required")
SSE_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"
TIMEOUT = 180.0
CONCURRENCY = 10
OUTPUT_DIR = Path("swarm_analysis")


async def tinyfish_sse(client, url, goal):
    """Call TinyFish SSE endpoint, return extracted text."""
    buffer = ""
    extracted = ""
    async with client.stream(
        "POST", SSE_URL,
        json={"url": url, "goal": goal},
        headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
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
                    r = event.get("result", "")
                    if isinstance(r, (dict, list)):
                        extracted = json.dumps(r, indent=2)
                    else:
                        extracted = str(r)
    return extracted


async def search_topic(client, topic, top_k=10):
    """Search DuckDuckGo via TinyFish SSE for a topic."""
    search_url = f"https://duckduckgo.com/?q={quote_plus(topic)}"
    goal = (
        f"Extract the top {top_k} search results from this page. "
        "Return a JSON array where each item has: url, title, snippet."
    )
    t0 = time.monotonic()
    raw = await tinyfish_sse(client, search_url, goal)
    latency = time.monotonic() - t0

    results = []
    if raw:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = []
        items = data if isinstance(data, list) else []
        if isinstance(data, dict):
            for key in ("search_results", "results", "data", "items", "organic"):
                if isinstance(data.get(key), list):
                    items = data[key]
                    break
        for i, item in enumerate(items[:top_k]):
            if not isinstance(item, dict):
                continue
            url = item.get("url") or item.get("link") or item.get("href") or ""
            if not url:
                continue
            results.append({
                "url": url,
                "title": item.get("title", ""),
                "snippet": item.get("snippet") or item.get("description") or "",
                "rank": i + 1,
            })
    return results, latency


async def analyze_page(client, url, topic, sem):
    """Browse a URL and extract content relevant to the topic."""
    goal = (
        f"You are researching '{topic}'. "
        "Extract the most relevant information from this page. "
        "Include: key findings, methodologies, metrics, tools/frameworks, "
        "benchmarks, datasets, and quantitative results. "
        "Return a structured summary."
    )
    async with sem:
        t0 = time.monotonic()
        try:
            content = await tinyfish_sse(client, url, goal)
            latency = time.monotonic() - t0
            return {"url": url, "content": content, "latency": latency, "error": None}
        except Exception as exc:
            latency = time.monotonic() - t0
            return {"url": url, "content": "", "latency": latency, "error": str(exc)}


async def main():
    topic_num = int(sys.argv[1])
    topic = sys.argv[2]
    OUTPUT_DIR.mkdir(exist_ok=True)

    print(f"[Topic {topic_num:02d}] Searching: {topic}")

    async with httpx.AsyncClient(timeout=httpx.Timeout(TIMEOUT, connect=15.0)) as client:
        # Phase 1: Search
        results, search_latency = await search_topic(client, topic)
        print(f"[Topic {topic_num:02d}] Found {len(results)} results in {search_latency:.1f}s")

        if not results:
            print(f"[Topic {topic_num:02d}] No results, writing empty report")
            _write_report(topic_num, topic, search_latency, [], [])
            return

        # Phase 2: Analyze all results in parallel
        sem = asyncio.Semaphore(CONCURRENCY)
        tasks = [
            analyze_page(client, r["url"], topic, sem)
            for r in results
        ]
        analyses = list(await asyncio.gather(*tasks))

    ok = sum(1 for a in analyses if a["content"])
    total_chars = sum(len(a["content"]) for a in analyses)
    print(f"[Topic {topic_num:02d}] Analyzed {ok}/{len(analyses)} pages, {total_chars:,} chars")

    _write_report(topic_num, topic, search_latency, results, analyses)
    print(f"[Topic {topic_num:02d}] Done!")


def _write_report(topic_num, topic, search_latency, results, analyses):
    slug = topic.lower().replace(" ", "-")[:60]
    path = OUTPUT_DIR / f"topic-{topic_num:02d}-{slug}.md"

    lines = [
        f"# Topic {topic_num}: {topic}",
        "",
        f"**Search latency:** {search_latency:.1f}s  ",
        f"**Results found:** {len(results)}  ",
        f"**Pages analyzed:** {len(analyses)}  ",
        f"**Successful analyses:** {sum(1 for a in analyses if a.get('content'))}  ",
        f"**Total content:** {sum(len(a.get('content','')) for a in analyses):,} chars  ",
        "",
    ]

    if results:
        lines.append("## Search Results\n")
        lines.append("| Rank | Title | URL |")
        lines.append("|------|-------|-----|")
        for r in results:
            lines.append(f"| {r['rank']} | {r['title'][:60]} | {r['url'][:80]} |")
        lines.append("")

    if analyses:
        lines.append("## Page Analyses\n")
        for i, a in enumerate(analyses):
            title = results[i]["title"] if i < len(results) else a["url"]
            lines.append(f"### {i+1}. {title}")
            lines.append(f"**URL:** {a['url']}  ")
            lines.append(f"**Latency:** {a['latency']:.1f}s  ")
            if a.get("error"):
                lines.append(f"**Error:** {a['error']}  ")
            lines.append("")
            if a.get("content"):
                lines.append(a["content"])
            else:
                lines.append("*No content extracted.*")
            lines.append("\n---\n")

    path.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    asyncio.run(main())
