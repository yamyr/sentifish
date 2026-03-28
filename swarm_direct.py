#!/usr/bin/env python3
"""
TinyFish Direct Swarm — agents browse target websites directly to extract
information about evals for web search agents. No Google search involved.
"""

import asyncio
import json
import os
import re
import time
from pathlib import Path

import httpx

API_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"
API_KEY = os.environ.get(
    "TINYFISH_API_KEY", "sk-tinyfish-V4YFytYNQ19UQLHHeI9bzD7ChFDmPB_x"
)
TIMEOUT = 150.0
CONCURRENCY = 25
OUTPUT_DIR = Path("search_results")

# ---------------------------------------------------------------------------
# Direct website targets — each entry is (url, goal/extraction prompt)
# ---------------------------------------------------------------------------
TARGETS = [
    # --- Benchmark & eval framework sites ---
    (
        "https://webarena.dev/",
        "Extract all information about the WebArena benchmark for evaluating web agents. "
        "Include: what it evaluates, metrics used, how agents are scored, datasets, leaderboard results, and links to papers.",
    ),
    (
        "https://osu-nlp-group.github.io/Mind2Web/",
        "Extract all information about the Mind2Web benchmark. "
        "Include: what it evaluates, task types, evaluation metrics, dataset size, and key findings.",
    ),
    (
        "https://jykoh.com/vwa",
        "Extract all information about VisualWebArena. "
        "Include: what it evaluates, multimodal capabilities tested, metrics, and results.",
    ),
    (
        "https://huggingface.co/gaia-benchmark",
        "Extract all information about the GAIA benchmark for general AI assistants. "
        "Include: task types, evaluation methodology, levels of difficulty, and leaderboard.",
    ),
    (
        "https://github.com/ServiceNow/BrowserGym",
        "Extract all information about BrowserGym evaluation framework. "
        "Include: what it provides, supported benchmarks, how to use it, and evaluation capabilities.",
    ),
    (
        "https://github.com/THUDM/AgentBench",
        "Extract all information about AgentBench for evaluating LLM agents. "
        "Include: environments tested, metrics, models evaluated, and key results.",
    ),
    (
        "https://github.com/ServiceNow/WorkArena",
        "Extract all information about WorkArena benchmark for enterprise web agents. "
        "Include: task types, evaluation metrics, and enterprise-specific challenges.",
    ),
    (
        "https://webshop-pnlp.github.io/",
        "Extract all information about the WebShop benchmark for interactive web shopping agents. "
        "Include: evaluation metrics, task design, and agent performance results.",
    ),
    (
        "https://assistantbench.github.io/",
        "Extract all information about AssistantBench for web assistant evaluation. "
        "Include: task types, metrics, difficulty levels, and key findings.",
    ),
    (
        "https://www.swebench.com/",
        "Extract all information about SWE-bench for software engineering agent evaluation. "
        "Include: how it works, evaluation criteria, leaderboard, and how agents are tested.",
    ),
    # --- Academic & research ---
    (
        "https://arxiv.org/abs/2307.13854",
        "Extract the full abstract and key details of this paper about WebArena. "
        "Include: authors, methodology, metrics, key results, and contributions.",
    ),
    (
        "https://arxiv.org/abs/2306.06070",
        "Extract the full abstract and key details of this Mind2Web paper. "
        "Include: authors, dataset, evaluation approach, metrics, and findings.",
    ),
    (
        "https://arxiv.org/abs/2401.13649",
        "Extract the full abstract and key details of this VisualWebArena paper. "
        "Include: authors, multimodal evaluation approach, and key results.",
    ),
    (
        "https://arxiv.org/abs/2311.12983",
        "Extract the full abstract and key details of this GAIA benchmark paper. "
        "Include: authors, evaluation levels, metrics, and how it tests AI assistants.",
    ),
    (
        "https://arxiv.org/abs/2308.03688",
        "Extract the full abstract and key details of this AgentBench paper. "
        "Include: environments, LLMs evaluated, metrics, and key findings.",
    ),
    (
        "https://arxiv.org/abs/2404.07972",
        "Extract the full abstract and key details about OSWorld benchmark. "
        "Include: OS-level tasks, evaluation metrics, and agent performance.",
    ),
    (
        "https://arxiv.org/abs/2402.06015",
        "Extract the full abstract about WebLINX conversational web navigation benchmark. "
        "Include: task design, evaluation metrics, and results.",
    ),
    (
        "https://arxiv.org/abs/2310.12931",
        "Extract the full abstract about this survey on LLM-based autonomous agents evaluation. "
        "Include: evaluation dimensions, metrics taxonomy, and recommendations.",
    ),
    (
        "https://arxiv.org/abs/2405.15786",
        "Extract the full abstract about evaluation of web agents. "
        "Include: methodology, metrics, and key recommendations.",
    ),
    (
        "https://arxiv.org/abs/2312.04474",
        "Extract the full abstract about tool-augmented LLM evaluation. "
        "Include: evaluation framework, metrics, and findings.",
    ),
    # --- IR evaluation resources ---
    (
        "https://trec.nist.gov/",
        "Extract information about TREC evaluation campaigns for information retrieval. "
        "Include: tracks related to web search, evaluation methodology, metrics used (NDCG, MAP, etc), and recent tracks.",
    ),
    (
        "https://github.com/beir-cellar/beir",
        "Extract all information about the BEIR benchmark for information retrieval. "
        "Include: datasets, evaluation metrics, how to use it, and supported models.",
    ),
    (
        "https://huggingface.co/spaces/mteb/leaderboard",
        "Extract information about the MTEB leaderboard for text embedding benchmarks. "
        "Include: evaluation tasks, metrics, top models, and retrieval-specific benchmarks.",
    ),
    (
        "https://microsoft.github.io/msmarco/",
        "Extract information about MS MARCO passage retrieval evaluation. "
        "Include: dataset details, evaluation metrics, leaderboard, and how it's used for search eval.",
    ),
    # --- Evaluation platforms & tools ---
    (
        "https://docs.smith.langchain.com/",
        "Extract information about LangSmith's evaluation capabilities for agents. "
        "Include: how to evaluate search agents, metrics, tracing, and dataset management.",
    ),
    (
        "https://docs.llamaindex.ai/en/stable/",
        "Find and extract information about LlamaIndex evaluation modules. "
        "Include: retrieval evaluation, response evaluation, and metrics for search quality.",
    ),
    (
        "https://docs.ragas.io/en/stable/",
        "Extract information about RAGAS evaluation framework. "
        "Include: metrics for retrieval evaluation, faithfulness, answer relevance, and context metrics.",
    ),
    (
        "https://github.com/explodinggradients/ragas",
        "Extract all information about RAGAS - Retrieval Augmented Generation Assessment. "
        "Include: evaluation metrics, how it works, and integration with search pipelines.",
    ),
    (
        "https://docs.arize.com/phoenix",
        "Extract information about Arize Phoenix for LLM observability and evaluation. "
        "Include: retrieval evaluation, search metrics, and monitoring capabilities.",
    ),
    (
        "https://www.braintrust.dev/docs",
        "Extract information about Braintrust AI evaluation platform. "
        "Include: how it evaluates search/retrieval, metrics, scoring, and experiment tracking.",
    ),
    # --- Company evaluation methodologies ---
    (
        "https://docs.perplexity.ai/",
        "Extract any information about how Perplexity AI evaluates their search. "
        "Include: API details, search capabilities, and quality metrics if available.",
    ),
    (
        "https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf",
        "Extract key information about Google's Search Quality Evaluator Guidelines. "
        "Include: E-E-A-T criteria, page quality ratings, needs met ratings, and evaluation methodology.",
    ),
    (
        "https://docs.tavily.com/",
        "Extract information about Tavily AI search API. "
        "Include: search capabilities, API endpoints, quality features, and how results are ranked.",
    ),
    (
        "https://docs.exa.ai/",
        "Extract information about Exa AI search API. "
        "Include: search capabilities, neural search features, evaluation approach, and result quality.",
    ),
    (
        "https://brave.com/search/api/",
        "Extract information about Brave Search API. "
        "Include: search capabilities, result quality, independence metrics, and API features.",
    ),
    # --- Blog posts & articles ---
    (
        "https://www.anthropic.com/research/swe-bench-sonnet",
        "Extract all information about Anthropic's approach to evaluating agents on SWE-bench. "
        "Include: methodology, results, and insights about agent evaluation.",
    ),
    (
        "https://openai.com/index/practices-for-governing-agentic-ai-systems/",
        "Extract information about OpenAI's practices for governing agentic AI systems. "
        "Include: evaluation recommendations, safety considerations, and benchmarks mentioned.",
    ),
    (
        "https://blog.langchain.dev/benchmarking-agent-tool-use/",
        "Extract information about benchmarking agent tool use from LangChain's blog. "
        "Include: evaluation methodology, metrics, and results.",
    ),
    (
        "https://lilianweng.github.io/posts/2023-06-23-agent/",
        "Extract information about LLM-powered autonomous agents from Lilian Weng's blog. "
        "Include: evaluation approaches, benchmarks mentioned, and agent architectures.",
    ),
    (
        "https://www.patronus.ai/blog",
        "Extract information about Patronus AI's approach to LLM evaluation. "
        "Include: evaluation metrics, hallucination detection, and search-related evaluation.",
    ),
    # --- GitHub repos with eval tools ---
    (
        "https://github.com/openai/evals",
        "Extract information about OpenAI Evals framework. "
        "Include: how it works, eval types, metrics, and how to create custom evals for search tasks.",
    ),
    (
        "https://github.com/confident-ai/deepeval",
        "Extract information about DeepEval framework. "
        "Include: evaluation metrics for RAG/search, supported metrics, and how to use it.",
    ),
    (
        "https://github.com/run-llama/llama_index/tree/main/llama-index-core/llama_index/core/evaluation",
        "Extract information about LlamaIndex's evaluation module. "
        "Include: retrieval evaluators, response evaluators, and search quality metrics.",
    ),
    (
        "https://github.com/langchain-ai/langsmith-cookbook",
        "Extract information about LangSmith evaluation recipes. "
        "Include: agent evaluation examples, search evaluation, and benchmark setups.",
    ),
    (
        "https://github.com/anthropics/anthropic-cookbook",
        "Extract information about Anthropic's cookbook for tool use and agent evaluation. "
        "Include: evaluation patterns, tool use testing, and search agent examples.",
    ),
    # --- Survey & comparison pages ---
    (
        "https://paperswithcode.com/task/web-navigation",
        "Extract all information about web navigation benchmarks and evaluations. "
        "Include: benchmark list, metrics, top results, and dataset links.",
    ),
    (
        "https://paperswithcode.com/task/information-retrieval",
        "Extract all information about information retrieval benchmarks. "
        "Include: benchmark list, metrics, top models, and evaluation datasets.",
    ),
    (
        "https://paperswithcode.com/task/question-answering",
        "Extract information about question answering benchmarks relevant to web search. "
        "Include: datasets that test search capabilities, metrics, and top results.",
    ),
    (
        "https://huggingface.co/spaces/Weyaxi/awesome-llm-agents",
        "Extract information about LLM agent benchmarks and evaluations. "
        "Include: evaluation frameworks listed, benchmarks, and comparison tools.",
    ),
    # --- Additional research papers ---
    (
        "https://arxiv.org/abs/2401.01335",
        "Extract the abstract about this agent evaluation survey or benchmark paper. "
        "Include: authors, key evaluation dimensions, and metrics.",
    ),
    (
        "https://arxiv.org/abs/2403.13457",
        "Extract the abstract about this web agent or search evaluation paper. "
        "Include: evaluation methodology and key findings.",
    ),
    (
        "https://arxiv.org/abs/2305.14318",
        "Extract the abstract about ToolBench or tool-use evaluation. "
        "Include: evaluation approach, metrics, and results.",
    ),
    (
        "https://arxiv.org/abs/2310.11511",
        "Extract the abstract about this LLM agent or web agent evaluation paper. "
        "Include: key evaluation dimensions and findings.",
    ),
    (
        "https://arxiv.org/abs/2406.01014",
        "Extract the abstract about evaluation of search or retrieval systems. "
        "Include: methodology, metrics proposed, and conclusions.",
    ),
    (
        "https://arxiv.org/abs/2407.01511",
        "Extract the abstract about web agent evaluation or benchmarking. "
        "Include: benchmark design, evaluation metrics, and agent performance.",
    ),
    # --- Documentation / standards ---
    (
        "https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)",
        "Extract comprehensive information about evaluation measures for information retrieval. "
        "Include: all metrics (precision, recall, F1, MAP, NDCG, MRR, ERR), formulas, and use cases.",
    ),
    (
        "https://en.wikipedia.org/wiki/Discounted_cumulative_gain",
        "Extract detailed information about DCG and NDCG metrics. "
        "Include: formulas, variants, applications to web search evaluation, and examples.",
    ),
    (
        "https://en.wikipedia.org/wiki/Mean_reciprocal_rank",
        "Extract detailed information about Mean Reciprocal Rank (MRR). "
        "Include: formula, applications, and how it's used in web search evaluation.",
    ),
    # --- Leaderboards & competitions ---
    (
        "https://huggingface.co/spaces/TIGER-Lab/WebArena-Leaderboard",
        "Extract the WebArena leaderboard data. "
        "Include: top agents, scores, evaluation metrics, and performance trends.",
    ),
    (
        "https://github.com/anthropics/anthropic-cookbook/tree/main/tool_use",
        "Extract information about Anthropic's tool use patterns relevant to search agent evaluation. "
        "Include: evaluation approaches, testing patterns, and best practices.",
    ),
    (
        "https://docs.confident-ai.com/",
        "Extract information about Confident AI / DeepEval evaluation platform. "
        "Include: retrieval metrics, RAG evaluation, and search quality assessment.",
    ),
    # --- More practical guides ---
    (
        "https://www.pinecone.io/learn/retrieval-augmented-generation/",
        "Extract information about evaluating RAG systems with search components. "
        "Include: evaluation metrics, best practices, and quality assessment.",
    ),
    (
        "https://weaviate.io/blog/rag-evaluation",
        "Extract information about RAG evaluation approaches. "
        "Include: retrieval evaluation metrics, generation evaluation, and end-to-end metrics.",
    ),
    (
        "https://docs.cohere.com/docs/reranking",
        "Extract information about Cohere's reranking and search evaluation. "
        "Include: evaluation methodology, metrics, and quality benchmarks.",
    ),
    (
        "https://qdrant.tech/documentation/",
        "Extract information about vector search evaluation from Qdrant docs. "
        "Include: retrieval metrics, benchmarking approaches, and quality assessment.",
    ),
]


async def tinyfish_browse(
    client: httpx.AsyncClient,
    url: str,
    goal: str,
    sem: asyncio.Semaphore,
    idx: int,
) -> dict:
    """Send a TinyFish agent directly to a website to extract information."""
    async with sem:
        short = url[:70]
        print(f"  [{idx+1:02d}/{len(TARGETS)}] Browsing: {short}...")
        t0 = time.monotonic()
        try:
            buffer = ""
            extracted_text = ""
            async with client.stream(
                "POST",
                API_URL,
                json={"url": url, "goal": goal},
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
                            result = event.get("result", "")
                            if isinstance(result, dict):
                                extracted_text = json.dumps(result, indent=2)
                            elif isinstance(result, list):
                                extracted_text = json.dumps(result, indent=2)
                            else:
                                extracted_text = str(result)

            latency = time.monotonic() - t0
            print(
                f"  [{idx+1:02d}/{len(TARGETS)}] Done in {latency:.1f}s "
                f"({len(extracted_text)} chars) — {short}"
            )
            return {
                "url": url,
                "goal": goal,
                "content": extracted_text,
                "latency_s": round(latency, 2),
                "error": None,
            }
        except Exception as exc:
            latency = time.monotonic() - t0
            print(f"  [{idx+1:02d}/{len(TARGETS)}] FAILED ({exc!r}) — {short}")
            return {
                "url": url,
                "goal": goal,
                "content": "",
                "latency_s": round(latency, 2),
                "error": str(exc),
            }


def slugify(text: str) -> str:
    slug = re.sub(r"https?://", "", text)
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", slug)
    return slug.strip("-").lower()[:80]


def write_result_md(data: dict, idx: int) -> Path:
    slug = slugify(data["url"])
    fname = f"{idx+1:02d}-{slug}.md"
    path = OUTPUT_DIR / fname

    lines = [
        f"# {data['url']}",
        "",
        f"**Source:** {data['url']}  ",
        f"**Latency:** {data['latency_s']}s  ",
        f"**Extraction goal:** {data['goal'][:200]}  ",
    ]
    if data["error"]:
        lines.append(f"**Error:** {data['error']}  ")
    lines.append("")

    if data["content"]:
        lines.append("## Extracted Content\n")
        lines.append(data["content"])
        lines.append("")
    else:
        lines.append("*No content extracted.*\n")

    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def write_index_md(all_data: list[dict]) -> Path:
    path = OUTPUT_DIR / "00-INDEX.md"
    succeeded = sum(1 for d in all_data if not d["error"] and d["content"])
    failed = sum(1 for d in all_data if d["error"] or not d["content"])
    total_chars = sum(len(d["content"]) for d in all_data)

    lines = [
        "# Web Search Agent Evals — Direct Website Research",
        "",
        f"**Total sites browsed:** {len(all_data)}  ",
        f"**Succeeded:** {succeeded}  ",
        f"**Failed:** {failed}  ",
        f"**Total content extracted:** {total_chars:,} characters  ",
        f"**Concurrency:** {CONCURRENCY} parallel TinyFish agents  ",
        "",
        "## All Sources\n",
        "| # | URL | Chars | Latency | Status |",
        "|---|-----|-------|---------|--------|",
    ]

    for i, d in enumerate(all_data, 1):
        slug = slugify(d["url"])
        fname = f"{i:02d}-{slug}.md"
        status = "OK" if (not d["error"] and d["content"]) else "FAIL"
        chars = len(d["content"])
        lines.append(
            f"| {i} | [{d['url'][:60]}]({fname}) | {chars:,} | {d['latency_s']}s | {status} |"
        )

    lines.append("")

    # Group by category
    lines.append("## Sources by Category\n")
    lines.append("### Benchmarks & Frameworks")
    lines.append("### Research Papers (arXiv)")
    lines.append("### Evaluation Platforms & Tools")
    lines.append("### Company Search APIs")
    lines.append("### Guides & Blog Posts")
    lines.append("### Reference & Standards")
    lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")
    return path


async def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    print(f"TinyFish Direct Swarm")
    print(f"  Targets: {len(TARGETS)} websites")
    print(f"  Concurrency: {CONCURRENCY} parallel agents")
    print(f"  Output: {OUTPUT_DIR}/")
    print()

    sem = asyncio.Semaphore(CONCURRENCY)

    async with httpx.AsyncClient(timeout=httpx.Timeout(TIMEOUT)) as client:
        tasks = [
            tinyfish_browse(client, url, goal, sem, idx)
            for idx, (url, goal) in enumerate(TARGETS)
        ]
        all_data = await asyncio.gather(*tasks)

    all_data = list(all_data)

    print("\nWriting markdown files...")
    for idx, data in enumerate(all_data):
        write_result_md(data, idx)

    index_path = write_index_md(all_data)

    succeeded = sum(1 for d in all_data if not d["error"] and d["content"])
    total_chars = sum(len(d["content"]) for d in all_data)

    print(f"\nDone!")
    print(f"  Sites browsed: {len(all_data)}")
    print(f"  Succeeded: {succeeded}/{len(all_data)}")
    print(f"  Total content: {total_chars:,} characters")
    print(f"  Index: {index_path}")


if __name__ == "__main__":
    asyncio.run(main())
