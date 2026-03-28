#!/usr/bin/env python3
"""
TinyFish Analysis Swarm — 10 topics × 10 results each, with deep page analysis.

Phase 1: Search 10 topics via TinyFish sync API (DuckDuckGo), collect top 10 results each
Phase 2: Browse each result URL with TinyFish agents to extract & analyze content
Phase 3: Write structured logs per agent, per API, per topic
"""

import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import quote_plus

import httpx

# --- Config ---
API_KEY = os.environ.get("TINYFISH_API_KEY")
if not API_KEY:
    raise RuntimeError("TINYFISH_API_KEY environment variable is required")
SEARCH_URL = "https://agent.tinyfish.ai/v1/automation/run"  # sync endpoint (fast)
SSE_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"  # streaming for analysis
SEARCH_TIMEOUT = 120.0
ANALYSIS_TIMEOUT = 180.0
SEARCH_CONCURRENCY = 10  # parallel search agents
ANALYSIS_CONCURRENCY = 25  # parallel analysis agents
OUTPUT_DIR = Path("swarm_analysis")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("swarm")

# --- 10 Popular Topics ---
TOPICS = [
    "WebArena benchmark web agent evaluation",
    "NDCG MRR precision recall information retrieval evaluation metrics",
    "LLM agent evaluation frameworks comparison 2024 2025",
    "RAG retrieval augmented generation evaluation methods",
    "web search quality evaluation best practices",
    "autonomous web browsing agent benchmarks",
    "tool use function calling LLM evaluation",
    "search engine result quality assessment methodology",
    "multi-step web agent task completion evaluation",
    "AI search agent safety and reliability testing",
]


@dataclass
class SearchResult:
    url: str
    title: str
    snippet: str
    rank: int


@dataclass
class AnalysisResult:
    url: str
    title: str
    topic: str
    content: str
    latency_s: float
    error: str | None = None


@dataclass
class TopicReport:
    topic: str
    search_latency_s: float
    results: list[SearchResult] = field(default_factory=list)
    analyses: list[AnalysisResult] = field(default_factory=list)
    search_error: str | None = None


@dataclass
class AgentLog:
    agent_id: str
    api_endpoint: str
    action: str  # "search" or "analyze"
    url: str
    topic: str
    started_at: float
    finished_at: float
    latency_s: float
    status: str  # "ok" or "error"
    result_count: int = 0
    content_chars: int = 0
    error: str | None = None


# Global agent logs
agent_logs: list[AgentLog] = []
agent_counter = 0


def next_agent_id(prefix: str) -> str:
    global agent_counter
    agent_counter += 1
    return f"{prefix}-{agent_counter:03d}"


# --- Phase 1: Search ---

async def search_topic(
    client: httpx.AsyncClient,
    topic: str,
    sem: asyncio.Semaphore,
    top_k: int = 10,
) -> TopicReport:
    """Use TinyFish sync API to search DuckDuckGo for a topic."""
    agent_id = next_agent_id("search")
    search_url = f"https://duckduckgo.com/?q={quote_plus(topic)}"
    goal = (
        f"Extract the top {top_k} search results from this page. "
        "Return a JSON array where each item has: url, title, snippet."
    )

    async with sem:
        log.info("[%s] Searching: %s", agent_id, topic[:60])
        t0 = time.monotonic()
        started = time.time()

        try:
            resp = await client.post(
                SEARCH_URL,
                json={"url": search_url, "goal": goal},
                headers={
                    "X-API-Key": API_KEY,
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            latency = time.monotonic() - t0

            if data.get("status") != "COMPLETED":
                error_msg = (data.get("error") or {}).get("message", "unknown")
                log.warning("[%s] Search failed: %s", agent_id, error_msg)
                agent_logs.append(AgentLog(
                    agent_id=agent_id, api_endpoint=SEARCH_URL, action="search",
                    url=search_url, topic=topic, started_at=started,
                    finished_at=time.time(), latency_s=round(latency, 2),
                    status="error", error=error_msg,
                ))
                return TopicReport(topic=topic, search_latency_s=latency, search_error=error_msg)

            results = _parse_search_results(data, top_k)
            log.info("[%s] Found %d results in %.1fs — %s", agent_id, len(results), latency, topic[:50])

            agent_logs.append(AgentLog(
                agent_id=agent_id, api_endpoint=SEARCH_URL, action="search",
                url=search_url, topic=topic, started_at=started,
                finished_at=time.time(), latency_s=round(latency, 2),
                status="ok", result_count=len(results),
            ))
            return TopicReport(topic=topic, search_latency_s=latency, results=results)

        except Exception as exc:
            latency = time.monotonic() - t0
            log.error("[%s] Search error: %r — %s", agent_id, exc, topic[:50])
            agent_logs.append(AgentLog(
                agent_id=agent_id, api_endpoint=SEARCH_URL, action="search",
                url=search_url, topic=topic, started_at=started,
                finished_at=time.time(), latency_s=round(latency, 2),
                status="error", error=str(exc),
            ))
            return TopicReport(topic=topic, search_latency_s=latency, search_error=str(exc))


def _parse_search_results(data: dict, top_k: int) -> list[SearchResult]:
    result_data = data.get("result")
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
        for key in ("search_results", "results", "data", "items", "organic"):
            if isinstance(result_data.get(key), list):
                items = result_data[key]
                break
        if not items:
            items = [result_data]
    parsed = []
    for i, item in enumerate(items[:top_k]):
        if not isinstance(item, dict):
            continue
        url = item.get("url") or item.get("link") or item.get("href") or ""
        if not url:
            continue
        parsed.append(SearchResult(
            url=url,
            title=item.get("title", ""),
            snippet=item.get("snippet") or item.get("description") or "",
            rank=i + 1,
        ))
    return parsed


# --- Phase 2: Analyze ---

async def analyze_page(
    client: httpx.AsyncClient,
    result: SearchResult,
    topic: str,
    sem: asyncio.Semaphore,
) -> AnalysisResult:
    """Use TinyFish SSE agent to browse a result URL and extract detailed content."""
    agent_id = next_agent_id("analyze")
    goal = (
        f"You are researching '{topic}'. "
        "Extract the most relevant information from this page. "
        "Include: key findings, methodologies, metrics mentioned, tools/frameworks, "
        "benchmarks, datasets, and any quantitative results. "
        "Return a structured summary with sections."
    )

    async with sem:
        log.info("[%s] Analyzing: %s", agent_id, result.url[:70])
        t0 = time.monotonic()
        started = time.time()

        try:
            buffer = ""
            extracted = ""
            async with client.stream(
                "POST",
                SSE_URL,
                json={"url": result.url, "goal": goal},
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
                            r = event.get("result", "")
                            if isinstance(r, (dict, list)):
                                extracted = json.dumps(r, indent=2)
                            else:
                                extracted = str(r)

            latency = time.monotonic() - t0
            log.info(
                "[%s] Analyzed %d chars in %.1fs — %s",
                agent_id, len(extracted), latency, result.url[:60],
            )
            agent_logs.append(AgentLog(
                agent_id=agent_id, api_endpoint=SSE_URL, action="analyze",
                url=result.url, topic=topic, started_at=started,
                finished_at=time.time(), latency_s=round(latency, 2),
                status="ok" if extracted else "empty",
                content_chars=len(extracted),
            ))
            return AnalysisResult(
                url=result.url, title=result.title, topic=topic,
                content=extracted, latency_s=latency,
            )

        except Exception as exc:
            latency = time.monotonic() - t0
            log.error("[%s] Analysis failed: %r — %s", agent_id, exc, result.url[:60])
            agent_logs.append(AgentLog(
                agent_id=agent_id, api_endpoint=SSE_URL, action="analyze",
                url=result.url, topic=topic, started_at=started,
                finished_at=time.time(), latency_s=round(latency, 2),
                status="error", error=str(exc),
            ))
            return AnalysisResult(
                url=result.url, title=result.title, topic=topic,
                content="", latency_s=latency, error=str(exc),
            )


# --- Output ---

def write_topic_report(report: TopicReport, idx: int) -> Path:
    slug = report.topic.lower().replace(" ", "-")[:60]
    path = OUTPUT_DIR / f"topic-{idx+1:02d}-{slug}.md"

    lines = [
        f"# Topic {idx+1}: {report.topic}",
        "",
        f"**Search latency:** {report.search_latency_s:.1f}s  ",
        f"**Results found:** {len(report.results)}  ",
        f"**Pages analyzed:** {len(report.analyses)}  ",
        f"**Successful analyses:** {sum(1 for a in report.analyses if a.content)}  ",
    ]
    if report.search_error:
        lines.append(f"**Search error:** {report.search_error}  ")
    lines.append("")

    # Search results table
    lines.append("## Search Results\n")
    lines.append("| Rank | Title | URL |")
    lines.append("|------|-------|-----|")
    for r in report.results:
        lines.append(f"| {r.rank} | {r.title[:60]} | {r.url[:80]} |")
    lines.append("")

    # Analyses
    lines.append("## Page Analyses\n")
    for a in report.analyses:
        lines.append(f"### {a.title or a.url}")
        lines.append(f"**URL:** {a.url}  ")
        lines.append(f"**Latency:** {a.latency_s:.1f}s  ")
        if a.error:
            lines.append(f"**Error:** {a.error}  ")
        lines.append("")
        if a.content:
            lines.append(a.content)
        else:
            lines.append("*No content extracted.*")
        lines.append("\n---\n")

    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_agent_log() -> Path:
    path = OUTPUT_DIR / "agent-log.md"

    search_logs = [l for l in agent_logs if l.action == "search"]
    analyze_logs = [l for l in agent_logs if l.action == "analyze"]

    lines = [
        "# Agent Activity Log",
        "",
        f"**Total agents spawned:** {len(agent_logs)}  ",
        f"**Search agents:** {len(search_logs)}  ",
        f"**Analysis agents:** {len(analyze_logs)}  ",
        "",
        "## Per-API Summary\n",
    ]

    # Group by API endpoint
    by_api: dict[str, list[AgentLog]] = {}
    for l in agent_logs:
        by_api.setdefault(l.api_endpoint, []).append(l)

    for api, logs in by_api.items():
        ok = sum(1 for l in logs if l.status == "ok")
        err = sum(1 for l in logs if l.status == "error")
        empty = sum(1 for l in logs if l.status == "empty")
        avg_lat = sum(l.latency_s for l in logs) / len(logs) if logs else 0
        total_chars = sum(l.content_chars for l in logs)
        total_results = sum(l.result_count for l in logs)

        lines.append(f"### `{api}`")
        lines.append(f"- **Calls:** {len(logs)}")
        lines.append(f"- **Success:** {ok} | **Empty:** {empty} | **Error:** {err}")
        lines.append(f"- **Avg latency:** {avg_lat:.1f}s")
        lines.append(f"- **Total results found:** {total_results}")
        lines.append(f"- **Total content extracted:** {total_chars:,} chars")
        lines.append("")

    # Per-agent detail table
    lines.append("## Full Agent Log\n")
    lines.append("| Agent | Action | API | Topic | Status | Latency | Results/Chars |")
    lines.append("|-------|--------|-----|-------|--------|---------|---------------|")
    for l in agent_logs:
        topic_short = l.topic[:30] + "..." if len(l.topic) > 30 else l.topic
        detail = f"{l.result_count} results" if l.action == "search" else f"{l.content_chars:,} chars"
        lines.append(
            f"| {l.agent_id} | {l.action} | {l.api_endpoint.split('/')[-1]} "
            f"| {topic_short} | {l.status} | {l.latency_s}s | {detail} |"
        )

    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_master_index(reports: list[TopicReport]) -> Path:
    path = OUTPUT_DIR / "00-INDEX.md"

    total_results = sum(len(r.results) for r in reports)
    total_analyses = sum(len(r.analyses) for r in reports)
    successful_analyses = sum(
        sum(1 for a in r.analyses if a.content) for r in reports
    )
    total_content = sum(
        sum(len(a.content) for a in r.analyses) for r in reports
    )

    search_agents = sum(1 for l in agent_logs if l.action == "search")
    analyze_agents = sum(1 for l in agent_logs if l.action == "analyze")

    lines = [
        "# Web Search Agent Evals — Swarm Analysis Report",
        "",
        "## Overview",
        "",
        f"- **Topics researched:** {len(reports)}",
        f"- **Total search results:** {total_results}",
        f"- **Pages analyzed:** {total_analyses}",
        f"- **Successful analyses:** {successful_analyses}",
        f"- **Total content extracted:** {total_content:,} characters",
        f"- **Search agents used:** {search_agents}",
        f"- **Analysis agents used:** {analyze_agents}",
        f"- **Total TinyFish agents:** {len(agent_logs)}",
        "",
        "## Topics\n",
        "| # | Topic | Results | Analyzed | Content |",
        "|---|-------|---------|----------|---------|",
    ]

    for i, r in enumerate(reports):
        analyzed_ok = sum(1 for a in r.analyses if a.content)
        content_k = sum(len(a.content) for a in r.analyses) / 1000
        slug = r.topic.lower().replace(" ", "-")[:60]
        fname = f"topic-{i+1:02d}-{slug}.md"
        lines.append(
            f"| {i+1} | [{r.topic[:50]}]({fname}) "
            f"| {len(r.results)} | {analyzed_ok}/{len(r.analyses)} "
            f"| {content_k:.1f}K |"
        )

    lines.extend([
        "",
        "## Files",
        "",
        "- [Agent Activity Log](agent-log.md) — per-agent, per-API breakdown",
    ])
    for i, r in enumerate(reports):
        slug = r.topic.lower().replace(" ", "-")[:60]
        fname = f"topic-{i+1:02d}-{slug}.md"
        lines.append(f"- [{r.topic[:60]}]({fname})")

    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


# --- Main ---

async def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    print("=" * 60)
    print("TinyFish Analysis Swarm")
    print(f"  Topics: {len(TOPICS)}")
    print(f"  Search concurrency: {SEARCH_CONCURRENCY}")
    print(f"  Analysis concurrency: {ANALYSIS_CONCURRENCY}")
    print(f"  Output: {OUTPUT_DIR}/")
    print("=" * 60)

    # Phase 1: Search all topics
    print("\n--- Phase 1: Searching topics ---")
    search_sem = asyncio.Semaphore(SEARCH_CONCURRENCY)

    async with httpx.AsyncClient(timeout=httpx.Timeout(SEARCH_TIMEOUT, connect=15.0)) as client:
        search_tasks = [
            search_topic(client, topic, search_sem) for topic in TOPICS
        ]
        reports: list[TopicReport] = list(await asyncio.gather(*search_tasks))

    total_results = sum(len(r.results) for r in reports)
    print(f"\nPhase 1 complete: {total_results} results across {len(reports)} topics")

    # Phase 2: Analyze all result pages
    print("\n--- Phase 2: Analyzing result pages ---")
    analysis_sem = asyncio.Semaphore(ANALYSIS_CONCURRENCY)

    # Build flat list of (report_idx, result) for analysis
    analysis_tasks = []
    task_map = []  # (report_idx, result_idx)
    for ri, report in enumerate(reports):
        for si, result in enumerate(report.results):
            task_map.append((ri, si))
            analysis_tasks.append(result)

    print(f"  Pages to analyze: {len(analysis_tasks)}")

    async with httpx.AsyncClient(timeout=httpx.Timeout(ANALYSIS_TIMEOUT, connect=15.0)) as client:
        coros = [
            analyze_page(client, result, reports[ri].topic, analysis_sem)
            for (ri, _si), result in zip(task_map, analysis_tasks)
        ]
        analyses: list[AnalysisResult] = list(await asyncio.gather(*coros))

    # Attach analyses back to reports
    for (ri, _si), analysis in zip(task_map, analyses):
        reports[ri].analyses.append(analysis)

    successful = sum(1 for a in analyses if a.content)
    print(f"\nPhase 2 complete: {successful}/{len(analyses)} pages analyzed successfully")

    # Phase 3: Write output
    print("\n--- Phase 3: Writing reports ---")
    for i, report in enumerate(reports):
        write_topic_report(report, i)

    write_agent_log()
    write_master_index(reports)

    total_content = sum(len(a.content) for a in analyses)
    print(f"\n{'=' * 60}")
    print(f"COMPLETE")
    print(f"  Topics: {len(reports)}")
    print(f"  Results found: {total_results}")
    print(f"  Pages analyzed: {successful}/{len(analyses)}")
    print(f"  Total content: {total_content:,} chars")
    print(f"  Agents used: {len(agent_logs)}")
    print(f"  Output: {OUTPUT_DIR}/")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    asyncio.run(main())
