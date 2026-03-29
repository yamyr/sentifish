"""AI-powered evaluation metric recommender.

Given a task description and category, uses an LLM to recommend the
best 5 evaluation metrics with weights and rationale.
"""

from __future__ import annotations

import json
import logging

import httpx

from .config import settings

logger = logging.getLogger(__name__)

AVAILABLE_METRICS = {
    "ndcg_at_k": {
        "label": "Ranking Quality (NDCG@K)",
        "description": "How well relevant results are ranked near the top. Best for ordered result sets.",
        "higher_is_better": True,
        "applicable_to": ["search", "recommendation", "retrieval"],
    },
    "precision_at_k": {
        "label": "Precision@K",
        "description": (
            "Fraction of top-K results that are relevant. Best when result quality > quantity."
        ),
        "higher_is_better": True,
        "applicable_to": ["search", "retrieval", "classification"],
    },
    "recall_at_k": {
        "label": "Recall@K",
        "description": (
            "Fraction of all relevant items found in top-K. Best when completeness matters."
        ),
        "higher_is_better": True,
        "applicable_to": ["search", "retrieval", "comprehensive_research"],
    },
    "mrr": {
        "label": "Mean Reciprocal Rank",
        "description": (
            "How quickly the first relevant result appears. Best for navigational queries."
        ),
        "higher_is_better": True,
        "applicable_to": ["search", "qa", "navigation"],
    },
    "map_at_k": {
        "label": "Mean Average Precision",
        "description": (
            "Average precision across all recall levels. Comprehensive ranked retrieval metric."
        ),
        "higher_is_better": True,
        "applicable_to": ["search", "retrieval"],
    },
    "latency_ms": {
        "label": "Response Speed (Latency)",
        "description": (
            "Wall-clock response time. Critical for real-time or interactive use cases."
        ),
        "higher_is_better": False,
        "applicable_to": ["all"],
    },
    "content_depth": {
        "label": "Content Depth",
        "description": (
            "Richness of returned content (normalized snippet length). Best for research tasks."
        ),
        "higher_is_better": True,
        "applicable_to": ["research", "summarization", "qa"],
    },
    "llm_judge_score": {
        "label": "AI Relevance Score",
        "description": (
            "Semantic relevance scored by an LLM judge. Best for open-ended or generative tasks."
        ),
        "higher_is_better": True,
        "applicable_to": ["qa", "generation", "summarization", "code", "all"],
    },
    "composite_score": {
        "label": "Composite Quality Score",
        "description": (
            "Weighted blend of NDCG×35+Precision×25+Recall×25+MRR×15. Overall benchmark."
        ),
        "higher_is_better": True,
        "applicable_to": ["all"],
    },
    "result_count": {
        "label": "Result Coverage",
        "description": (
            "Number of results returned. Matters when breadth of coverage is important."
        ),
        "higher_is_better": True,
        "applicable_to": ["research", "comprehensive_search"],
    },
}

_SYSTEM_PROMPT = (
    "You are an expert in information retrieval and AI evaluation methodology.\n\n"
    "Given a task description and category, recommend exactly 5 evaluation metrics "
    "from the available metrics list.\n"
    "For each metric:\n"
    "1. Assign a weight (0.0–1.0, must sum to exactly 1.0)\n"
    "2. Explain in 1 sentence why it's important for this specific task\n\n"
    "Return ONLY a JSON object:\n"
    "{\n"
    '  "metrics": [\n'
    '    {"metric": "metric_key", "weight": 0.35, "reasoning": "..."},\n'
    '    {"metric": "metric_key", "weight": 0.25, "reasoning": "..."},\n'
    '    {"metric": "metric_key", "weight": 0.20, "reasoning": "..."},\n'
    '    {"metric": "metric_key", "weight": 0.15, "reasoning": "..."},\n'
    '    {"metric": "metric_key", "weight": 0.05, "reasoning": "..."}\n'
    "  ],\n"
    '  "overall_reasoning": "One sentence explaining the overall evaluation '
    'philosophy for this task"\n'
    "}\n\n"
    "Available metrics: " + json.dumps(list(AVAILABLE_METRICS.keys()))
)


async def recommend_metrics(
    task_name: str,
    task_description: str,
    task_category: str,
    evaluation_criteria: str = "",
) -> dict:
    """Use LLM to recommend the best 5 evaluation metrics for a task.

    Returns dict with 'metrics' list and 'overall_reasoning'.
    Falls back to sensible defaults if LLM is unavailable.
    """
    if not settings.openai_api_key:
        return _default_metrics(task_category)

    user_message = (
        f"Task name: {task_name}\n"
        f"Task category: {task_category}\n"
        f"Description: {task_description}\n"
        f"Evaluation criteria: {evaluation_criteria or 'Standard quality evaluation'}\n\n"
        f"Available metrics with descriptions:\n"
        f"{json.dumps(AVAILABLE_METRICS, indent=2)}\n\n"
        f"Recommend the best 5 metrics with weights for this task."
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": settings.openai_model,
                    "messages": [
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user", "content": user_message},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3,
                },
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            result = json.loads(content)

            # Validate weights sum to ~1.0
            total = sum(m["weight"] for m in result.get("metrics", []))
            if abs(total - 1.0) > 0.05:
                # Normalize
                for m in result["metrics"]:
                    m["weight"] = round(m["weight"] / total, 3)

            return result
    except Exception as exc:
        logger.warning("Metric recommendation failed: %s", exc)
        return _default_metrics(task_category)


def _default_metrics(category: str) -> dict:
    """Sensible defaults when LLM is unavailable."""
    defaults = {
        "search": [
            {
                "metric": "ndcg_at_k",
                "weight": 0.35,
                "reasoning": "Ranking quality is most important for search tasks",
            },
            {
                "metric": "precision_at_k",
                "weight": 0.25,
                "reasoning": "High precision reduces time spent on irrelevant results",
            },
            {
                "metric": "recall_at_k",
                "weight": 0.20,
                "reasoning": "Recall ensures comprehensive coverage of relevant sources",
            },
            {
                "metric": "mrr",
                "weight": 0.15,
                "reasoning": "How quickly the first relevant result appears",
            },
            {
                "metric": "latency_ms",
                "weight": 0.05,
                "reasoning": "Response speed affects user experience",
            },
        ],
        "ai_assistant": [
            {
                "metric": "llm_judge_score",
                "weight": 0.40,
                "reasoning": "Semantic quality is paramount for AI assistants",
            },
            {
                "metric": "content_depth",
                "weight": 0.25,
                "reasoning": "Depth and richness of responses matters",
            },
            {
                "metric": "latency_ms",
                "weight": 0.20,
                "reasoning": "Response speed is critical for interactive use",
            },
            {
                "metric": "ndcg_at_k",
                "weight": 0.10,
                "reasoning": "Ranking of information within responses",
            },
            {
                "metric": "precision_at_k",
                "weight": 0.05,
                "reasoning": "Accuracy of specific claims",
            },
        ],
    }

    metrics = defaults.get(category, defaults["search"])
    return {
        "metrics": metrics,
        "overall_reasoning": f"Standard evaluation configuration for {category} tasks",
    }
