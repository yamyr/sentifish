#!/usr/bin/env python3
"""
TinyFish Swarm Search — Batch 2: additional queries for deeper coverage.
"""

import asyncio
import json
import os
import time
from pathlib import Path
from urllib.parse import quote_plus

import httpx

API_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"
API_KEY = os.environ.get(
    "TINYFISH_API_KEY", "sk-tinyfish-V4YFytYNQ19UQLHHeI9bzD7ChFDmPB_x"
)
TIMEOUT = 120.0
CONCURRENCY = 25
OUTPUT_DIR = Path("search_results_batch2")

QUERIES = [
    # Deep-dive eval frameworks
    "OSWorld benchmark operating system web agent evaluation",
    "ToolBench evaluation API tool calling agents",
    "APIBench benchmark LLM API function calling evaluation",
    "WebLINX benchmark conversational web navigation",
    "MiniWoB++ benchmark web interaction evaluation",
    "CompWoB compositional web tasks evaluation benchmark",
    # Eval methodologies
    "precision at k recall at k for web search evaluation explained",
    "normalized discounted cumulative gain NDCG web search",
    "mean reciprocal rank MRR web search agent evaluation",
    "expected reciprocal rank ERR web search evaluation",
    "search result quality annotation guidelines",
    "inter-annotator agreement web search relevance judging",
    # Agent frameworks with eval
    "LangChain agent evaluation web search tools",
    "LlamaIndex evaluation framework web search retrieval",
    "CrewAI agent evaluation metrics web tasks",
    "AutoGPT evaluation benchmarks web browsing",
    "OpenAI function calling evaluation web search",
    "Anthropic Claude tool use evaluation web search",
    # Search quality specifics
    "search engine optimization evaluation metrics SEO",
    "query understanding evaluation NLP web search",
    "snippet quality evaluation web search results",
    "featured snippet evaluation methodology",
    "knowledge panel accuracy evaluation web search",
    "zero-click search evaluation methodology",
    # Infrastructure & tooling
    "Weights and Biases evaluation tracking web agents",
    "MLflow experiment tracking search agent evaluation",
    "Braintrust AI evaluation platform search agents",
    "Arize AI observability web search agent monitoring",
    "LangSmith evaluation tracing web search agents",
    "Patronus AI evaluation LLM web search hallucination",
    # Academic & competition
    "CLEF web search evaluation campaign",
    "NTCIR web search evaluation workshop",
    "SIGIR information retrieval evaluation papers 2024",
    "ACL web search agent evaluation papers 2024 2025",
    "NeurIPS agent benchmark evaluation papers 2024",
    "EMNLP search evaluation papers 2024",
    # Safety & alignment evals
    "web agent safety evaluation harmful content filtering",
    "red teaming web search agents evaluation",
    "bias fairness evaluation web search results",
    "privacy evaluation web browsing agents",
    "web agent evaluation adversarial robustness",
    "jailbreak evaluation web search AI agents",
    # Practical implementation
    "how to build search evaluation pipeline Python",
    "search relevance annotation tool open source",
    "crowdsourcing search relevance judgments evaluation",
    "synthetic evaluation data generation web search",
    "LLM as judge web search result evaluation",
    "GPT-4 as evaluator web search quality",
    # Comparison & surveys
    "survey evaluation methods web search agents 2024",
    "comparison web search APIs evaluation results",
    "state of AI search evaluation 2025",
    "web search agent evaluation best practices guide",
    "building web search evaluation dataset from scratch",
    "continuous evaluation monitoring web search agents production",
    # Niche & emerging
    "multi-agent web search evaluation coordination",
    "planning evaluation web navigation agents",
    "memory augmented web agent evaluation",
    "self-improving web search agent evaluation loop",
    "web search agent evaluation user study design",
    "cross-lingual web search evaluation benchmark",
    "video search agent evaluation benchmark",
    "voice search agent evaluation metrics",
    "enterprise search agent evaluation internal documents",
    "medical search agent evaluation clinical accuracy",
]


async def tinyfish_search(
    client: httpx.AsyncClient,
    query: str,
    sem: asyncio.Semaphore,
    idx: int,
) -> dict:
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
    path = OUTPUT_DIR / "00-INDEX.md"
    total_results = sum(len(d["results"]) for d in all_data)
    succeeded = sum(1 for d in all_data if not d["error"])
    failed = sum(1 for d in all_data if d["error"])
    lines = [
        "# Web Search Agent Evals — Research Collection (Batch 2)",
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
    print(f"TinyFish Swarm Search — Batch 2")
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
    unique_urls = len({r["url"] for d in all_data for r in d["results"]})
    print(f"\nDone!")
    print(f"  Queries run: {len(all_data)}")
    print(f"  Succeeded: {succeeded}/{len(all_data)}")
    print(f"  Total results: {total_results}")
    print(f"  Unique URLs: {unique_urls}")
    print(f"  Index: {index_path}")


if __name__ == "__main__":
    asyncio.run(main())
