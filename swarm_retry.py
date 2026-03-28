#!/usr/bin/env python3
"""
TinyFish Swarm Retry — retry only the targets that failed in the first run.
Merges results into the existing search_results/ directory.
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
    "TINYFISH_API_KEY", "***REDACTED***"
)
TIMEOUT = 180.0
CONCURRENCY = 25
OUTPUT_DIR = Path("search_results")

# Only the targets that failed (DNS errors / network drop)
TARGETS = [
    (4, "https://huggingface.co/gaia-benchmark",
     "Extract all information about the GAIA benchmark for general AI assistants. Include: task types, evaluation methodology, levels of difficulty, and leaderboard."),
    (5, "https://github.com/ServiceNow/BrowserGym",
     "Extract all information about BrowserGym evaluation framework. Include: what it provides, supported benchmarks, how to use it, and evaluation capabilities."),
    (6, "https://github.com/THUDM/AgentBench",
     "Extract all information about AgentBench for evaluating LLM agents. Include: environments tested, metrics, models evaluated, and key results."),
    (9, "https://assistantbench.github.io/",
     "Extract all information about AssistantBench for web assistant evaluation. Include: task types, metrics, difficulty levels, and key findings."),
    (13, "https://arxiv.org/abs/2401.13649",
     "Extract the full abstract and key details of this VisualWebArena paper. Include: authors, multimodal evaluation approach, and key results."),
    (15, "https://arxiv.org/abs/2308.03688",
     "Extract the full abstract and key details of this AgentBench paper. Include: environments, LLMs evaluated, metrics, and key findings."),
    (18, "https://arxiv.org/abs/2310.12931",
     "Extract the full abstract about this survey on LLM-based autonomous agents evaluation. Include: evaluation dimensions, metrics taxonomy, and recommendations."),
    (19, "https://arxiv.org/abs/2405.15786",
     "Extract the full abstract about evaluation of web agents. Include: methodology, metrics, and key recommendations."),
    (20, "https://arxiv.org/abs/2312.04474",
     "Extract the full abstract about tool-augmented LLM evaluation. Include: evaluation framework, metrics, and findings."),
    (22, "https://github.com/beir-cellar/beir",
     "Extract all information about the BEIR benchmark for information retrieval. Include: datasets, evaluation metrics, how to use it, and supported models."),
    (24, "https://microsoft.github.io/msmarco/",
     "Extract information about MS MARCO passage retrieval evaluation. Include: dataset details, evaluation metrics, leaderboard, and how it's used for search eval."),
    (25, "https://docs.smith.langchain.com/",
     "Extract information about LangSmith's evaluation capabilities for agents. Include: how to evaluate search agents, metrics, tracing, and dataset management."),
    (27, "https://docs.ragas.io/en/stable/",
     "Extract information about RAGAS evaluation framework. Include: metrics for retrieval evaluation, faithfulness, answer relevance, and context metrics."),
    (28, "https://github.com/explodinggradients/ragas",
     "Extract all information about RAGAS - Retrieval Augmented Generation Assessment. Include: evaluation metrics, how it works, and integration with search pipelines."),
    (29, "https://docs.arize.com/phoenix",
     "Extract information about Arize Phoenix for LLM observability and evaluation. Include: retrieval evaluation, search metrics, and monitoring capabilities."),
    (30, "https://www.braintrust.dev/docs",
     "Extract information about Braintrust AI evaluation platform. Include: how it evaluates search/retrieval, metrics, scoring, and experiment tracking."),
    (31, "https://docs.perplexity.ai/",
     "Extract any information about how Perplexity AI evaluates their search. Include: API details, search capabilities, and quality metrics if available."),
    (33, "https://docs.tavily.com/",
     "Extract information about Tavily AI search API. Include: search capabilities, API endpoints, quality features, and how results are ranked."),
    (34, "https://docs.exa.ai/",
     "Extract information about Exa AI search API. Include: search capabilities, neural search features, evaluation approach, and result quality."),
    (35, "https://brave.com/search/api/",
     "Extract information about Brave Search API. Include: search capabilities, result quality, independence metrics, and API features."),
    (36, "https://www.anthropic.com/research/swe-bench-sonnet",
     "Extract all information about Anthropic's approach to evaluating agents on SWE-bench. Include: methodology, results, and insights about agent evaluation."),
    (37, "https://openai.com/index/practices-for-governing-agentic-ai-systems/",
     "Extract information about OpenAI's practices for governing agentic AI systems. Include: evaluation recommendations, safety considerations, and benchmarks mentioned."),
    (38, "https://blog.langchain.dev/benchmarking-agent-tool-use/",
     "Extract information about benchmarking agent tool use from LangChain's blog. Include: evaluation methodology, metrics, and results."),
    (39, "https://lilianweng.github.io/posts/2023-06-23-agent/",
     "Extract information about LLM-powered autonomous agents from Lilian Weng's blog. Include: evaluation approaches, benchmarks mentioned, and agent architectures."),
    (40, "https://www.patronus.ai/blog",
     "Extract information about Patronus AI's approach to LLM evaluation. Include: evaluation metrics, hallucination detection, and search-related evaluation."),
    (41, "https://github.com/openai/evals",
     "Extract information about OpenAI Evals framework. Include: how it works, eval types, metrics, and how to create custom evals for search tasks."),
    (42, "https://github.com/confident-ai/deepeval",
     "Extract information about DeepEval framework. Include: evaluation metrics for RAG/search, supported metrics, and how to use it."),
    (43, "https://github.com/run-llama/llama_index/tree/main/llama-index-core/llama_index/core/evaluation",
     "Extract information about LlamaIndex's evaluation module. Include: retrieval evaluators, response evaluators, and search quality metrics."),
    (44, "https://github.com/langchain-ai/langsmith-cookbook",
     "Extract information about LangSmith evaluation recipes. Include: agent evaluation examples, search evaluation, and benchmark setups."),
    (45, "https://github.com/anthropics/anthropic-cookbook",
     "Extract information about Anthropic's cookbook for tool use and agent evaluation. Include: evaluation patterns, tool use testing, and search agent examples."),
    (46, "https://paperswithcode.com/task/web-navigation",
     "Extract all information about web navigation benchmarks and evaluations. Include: benchmark list, metrics, top results, and dataset links."),
    (47, "https://paperswithcode.com/task/information-retrieval",
     "Extract all information about information retrieval benchmarks. Include: benchmark list, metrics, top models, and evaluation datasets."),
    (48, "https://paperswithcode.com/task/question-answering",
     "Extract information about question answering benchmarks relevant to web search. Include: datasets that test search capabilities, metrics, and top results."),
    (49, "https://huggingface.co/spaces/Weyaxi/awesome-llm-agents",
     "Extract information about LLM agent benchmarks and evaluations. Include: evaluation frameworks listed, benchmarks, and comparison tools."),
    (50, "https://arxiv.org/abs/2401.01335",
     "Extract the abstract about this agent evaluation survey or benchmark paper. Include: authors, key evaluation dimensions, and metrics."),
    (51, "https://arxiv.org/abs/2403.13457",
     "Extract the abstract about this web agent or search evaluation paper. Include: evaluation methodology and key findings."),
    (52, "https://arxiv.org/abs/2305.14318",
     "Extract the abstract about ToolBench or tool-use evaluation. Include: evaluation approach, metrics, and results."),
    (53, "https://arxiv.org/abs/2310.11511",
     "Extract the abstract about this LLM agent or web agent evaluation paper. Include: key evaluation dimensions and findings."),
    (54, "https://arxiv.org/abs/2406.01014",
     "Extract the abstract about evaluation of search or retrieval systems. Include: methodology, metrics proposed, and conclusions."),
    (55, "https://arxiv.org/abs/2407.01511",
     "Extract the abstract about web agent evaluation or benchmarking. Include: benchmark design, evaluation metrics, and agent performance."),
    (56, "https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)",
     "Extract comprehensive information about evaluation measures for information retrieval. Include: all metrics (precision, recall, F1, MAP, NDCG, MRR, ERR), formulas, and use cases."),
    (57, "https://en.wikipedia.org/wiki/Discounted_cumulative_gain",
     "Extract detailed information about DCG and NDCG metrics. Include: formulas, variants, applications to web search evaluation, and examples."),
    (58, "https://en.wikipedia.org/wiki/Mean_reciprocal_rank",
     "Extract detailed information about Mean Reciprocal Rank (MRR). Include: formula, applications, and how it's used in web search evaluation."),
    (59, "https://huggingface.co/spaces/TIGER-Lab/WebArena-Leaderboard",
     "Extract the WebArena leaderboard data. Include: top agents, scores, evaluation metrics, and performance trends."),
    (60, "https://github.com/anthropics/anthropic-cookbook/tree/main/tool_use",
     "Extract information about Anthropic's tool use patterns relevant to search agent evaluation. Include: evaluation approaches, testing patterns, and best practices."),
    (61, "https://docs.confident-ai.com/",
     "Extract information about Confident AI / DeepEval evaluation platform. Include: retrieval metrics, RAG evaluation, and search quality assessment."),
    (62, "https://www.pinecone.io/learn/retrieval-augmented-generation/",
     "Extract information about evaluating RAG systems with search components. Include: evaluation metrics, best practices, and quality assessment."),
    (63, "https://weaviate.io/blog/rag-evaluation",
     "Extract information about RAG evaluation approaches. Include: retrieval evaluation metrics, generation evaluation, and end-to-end metrics."),
    (64, "https://docs.cohere.com/docs/reranking",
     "Extract information about Cohere's reranking and search evaluation. Include: evaluation methodology, metrics, and quality benchmarks."),
    (65, "https://qdrant.tech/documentation/",
     "Extract information about vector search evaluation from Qdrant docs. Include: retrieval metrics, benchmarking approaches, and quality assessment."),
]


async def tinyfish_browse(
    client: httpx.AsyncClient,
    url: str,
    goal: str,
    sem: asyncio.Semaphore,
    idx: int,
    orig_num: int,
) -> dict:
    async with sem:
        short = url[:70]
        print(f"  [retry {orig_num:02d}/65] Browsing: {short}...")
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
                            if isinstance(result, (dict, list)):
                                extracted_text = json.dumps(result, indent=2)
                            else:
                                extracted_text = str(result)

            latency = time.monotonic() - t0
            print(
                f"  [retry {orig_num:02d}/65] Done in {latency:.1f}s "
                f"({len(extracted_text)} chars) — {short}"
            )
            return {
                "orig_num": orig_num,
                "url": url,
                "goal": goal,
                "content": extracted_text,
                "latency_s": round(latency, 2),
                "error": None,
            }
        except Exception as exc:
            latency = time.monotonic() - t0
            print(f"  [retry {orig_num:02d}/65] FAILED ({exc!r}) — {short}")
            return {
                "orig_num": orig_num,
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


def write_result_md(data: dict) -> Path:
    slug = slugify(data["url"])
    fname = f"{data['orig_num']:02d}-{slug}.md"
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


async def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    print(f"TinyFish Swarm Retry")
    print(f"  Failed targets to retry: {len(TARGETS)}")
    print(f"  Concurrency: {CONCURRENCY} parallel agents")
    print(f"  Output: {OUTPUT_DIR}/ (overwriting failed files)")
    print()

    sem = asyncio.Semaphore(CONCURRENCY)

    async with httpx.AsyncClient(timeout=httpx.Timeout(TIMEOUT)) as client:
        tasks = [
            tinyfish_browse(client, url, goal, sem, idx, orig_num)
            for idx, (orig_num, url, goal) in enumerate(TARGETS)
        ]
        all_data = await asyncio.gather(*tasks)

    all_data = list(all_data)

    print("\nWriting/overwriting markdown files...")
    for data in all_data:
        if data["content"]:
            write_result_md(data)

    succeeded = sum(1 for d in all_data if not d["error"] and d["content"])
    total_chars = sum(len(d["content"]) for d in all_data)

    print(f"\nRetry Done!")
    print(f"  Retried: {len(all_data)}")
    print(f"  Succeeded: {succeeded}/{len(all_data)}")
    print(f"  New content: {total_chars:,} characters")


if __name__ == "__main__":
    asyncio.run(main())
