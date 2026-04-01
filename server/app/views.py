"""API routes for managing datasets, eval runs, and providers."""

from __future__ import annotations

import asyncio
import json
import logging
import re
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.responses import StreamingResponse
from fastapi.security import APIKeyHeader

from . import datasets as ds
from . import narrator
from . import runner
from . import task_registry
from . import tool_registry
from .config import settings
from .metric_recommender import AVAILABLE_METRICS
from .models import EvalConfig, EvalMetricWeight
from .providers import PROVIDERS, available_providers

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

_api_key_header = APIKeyHeader(name="X-Api-Key", auto_error=False)


def _require_write_auth(
    x_api_key: str | None = Security(_api_key_header),
) -> None:
    """No-op if API_KEY is not configured. Raises 401 if key is wrong."""
    if not settings.api_key:
        return  # Auth disabled
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


_UUID_RE = re.compile(
    r"^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$",
    re.IGNORECASE,
)


def _validate_run_id(run_id: str) -> str:
    if not _UUID_RE.match(run_id):
        raise HTTPException(status_code=400, detail="Invalid run ID format")
    return run_id


# -- Providers ---------------------------------------------------------------


@router.get("/providers")
def list_providers():
    """List search providers with configured API keys."""
    return {
        "providers": available_providers(),
        "llm_judge_available": bool(settings.openai_api_key),
    }


@router.get("/providers/all")
def list_all_providers():
    """List all known providers with their availability status."""
    from .providers import _KEY_MAP

    providers = []
    for name in PROVIDERS:
        key_attr = _KEY_MAP.get(name, "")
        available = bool(key_attr and getattr(settings, key_attr, ""))
        providers.append({"name": name, "available": available})
    return {"providers": providers}


# -- Tools -------------------------------------------------------------------


@router.post("/tools/test", dependencies=[Depends(_require_write_auth)])
async def test_tool_connection(body: dict):
    from .custom_executor import execute_custom_tool
    from .models import ToolDefinition

    tool = ToolDefinition(**body.get("tool", {}))
    test_query = body.get("query", "test query")

    results, latency_ms = await execute_custom_tool(tool, test_query, top_k=3)
    return {
        "ok": True,
        "latency_ms": latency_ms,
        "result_count": len(results),
        "sample_results": [r.model_dump() for r in results[:3]],
    }


# -- Datasets ----------------------------------------------------------------


@router.get("/datasets")
def list_datasets():
    names = ds.list_datasets()
    datasets = []
    for name in names:
        try:
            dataset = ds.load_dataset(name)
            datasets.append(dataset.model_dump())
        except Exception:
            datasets.append({"name": name, "description": "", "cases": []})
    return {"datasets": datasets}


@router.get("/datasets/{name}")
def get_dataset(name: str):
    try:
        dataset = ds.load_dataset(name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Resource not found")
    return dataset.model_dump()


@router.post("/datasets", dependencies=[Depends(_require_write_auth)])
def create_dataset(body: dict):
    try:
        dataset = ds.load_dataset_from_dict(body)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid request data")
    except Exception as exc:
        logger.exception("Failed to create dataset: %s", exc)
        raise HTTPException(status_code=400, detail="Invalid request data")
    ds.save_dataset(dataset)
    return {"ok": True, "name": dataset.name, "cases": dataset.size}


@router.delete("/datasets/{name}", dependencies=[Depends(_require_write_auth)])
def delete_dataset(name: str):
    if not ds.delete_dataset(name):
        raise HTTPException(status_code=404, detail=f"Dataset not found: {name!r}")
    return {"ok": True, "deleted": name}


# -- Eval Runs ---------------------------------------------------------------


@router.get("/runs")
def list_runs():
    runs = runner.list_runs()
    return {"runs": [r.model_dump() for r in runs]}


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    _validate_run_id(run_id)
    run = runner.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return run.model_dump()


@router.get("/runs/{run_id}/summary")
def get_run_summary(run_id: str):
    _validate_run_id(run_id)
    run = runner.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {
        "id": run.id,
        "dataset_name": run.dataset_name,
        "status": run.status,
        "summary": run.summary,
    }


# -- Narration ---------------------------------------------------------------


@router.get("/runs/{run_id}/narration/text")
def get_narration_text(run_id: str):
    """Return narration text for an eval run (cached after first generation)."""
    _validate_run_id(run_id)

    # Serve from cache if available
    cached = narrator.get_cached_text(run_id)
    if cached is not None:
        return {"text": cached, "cached": True}

    run = runner.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    narration_text = narrator.generate_narration(run)

    # Only cache completed runs (in-progress narrations may change)
    if run.status == "completed":
        narrator.save_cached_text(run_id, narration_text)

    return {"text": narration_text, "cached": False}


@router.get("/runs/{run_id}/narration/audio")
async def get_narration_audio(run_id: str):
    """Return narration audio (MP3) for an eval run (cached after first synthesis)."""
    _validate_run_id(run_id)

    if not settings.elevenlabs_api_key:
        raise HTTPException(
            status_code=503,
            detail="ElevenLabs API key not configured",
        )

    # Serve from cache if available
    cached_audio = narrator.get_cached_audio(run_id)
    if cached_audio is not None:
        return StreamingResponse(
            iter([cached_audio]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=narration.mp3"},
        )

    run = runner.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Generate text (use cached text if available)
    narration_text = narrator.get_cached_text(run_id)
    if narration_text is None:
        narration_text = narrator.generate_narration(run)
        if run.status == "completed":
            narrator.save_cached_text(run_id, narration_text)

    # Synthesize and cache audio
    audio_bytes = await narrator.synthesize_speech(narration_text)
    if run.status == "completed":
        narrator.save_cached_audio(run_id, audio_bytes)

    return StreamingResponse(
        iter([audio_bytes]),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=narration.mp3"},
    )


@router.post("/demo-run", dependencies=[Depends(_require_write_auth)])
async def create_demo_run():
    """One-click demo: sample dataset vs all available providers."""
    try:
        dataset = ds.load_dataset("sample")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Sample dataset not found")

    provider_names = available_providers()
    if not provider_names:
        raise HTTPException(status_code=503, detail="No providers configured")

    run = runner.create_run(dataset, provider_names, top_k=10)
    asyncio.create_task(runner.execute_run(run, dataset, provider_names, top_k=10))
    return {"id": run.id, "status": run.status, "providers": provider_names}


@router.post("/runs", dependencies=[Depends(_require_write_auth)])
async def create_run(body: dict):
    """Trigger eval run(s).

    Body (single):  {"dataset": "name", "providers": [...], "top_k": 10}
    Body (multi):   {"datasets": ["name1", "name2"], "providers": [...], "top_k": 10}
    """
    provider_names = body.get("providers")
    raw_top_k = body.get("top_k", 10)
    top_k_err = "top_k must be an integer between 1 and 100"
    if not isinstance(raw_top_k, (int, float, str)):
        raise HTTPException(status_code=400, detail=top_k_err)
    try:
        top_k = max(1, min(int(raw_top_k), 100))
    except ValueError:
        raise HTTPException(status_code=400, detail=top_k_err)

    if not provider_names:
        raise HTTPException(status_code=400, detail="'providers' list is required")

    # Validate provider names against the known registry
    unknown = set(provider_names) - set(PROVIDERS)
    if unknown:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown provider(s): {', '.join(sorted(unknown))}",
        )

    # Determine dataset(s)
    dataset_names = body.get("datasets") or []
    single_dataset = body.get("dataset")

    if single_dataset and not dataset_names:
        dataset_names = [single_dataset]

    if not dataset_names:
        raise HTTPException(status_code=400, detail="'dataset' or 'datasets' is required")

    # Load all datasets, fail fast if any missing
    datasets_loaded = []
    for name in dataset_names:
        try:
            datasets_loaded.append(ds.load_dataset(name))
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"Dataset not found: {name!r}")

    # Single dataset: backward-compatible response
    if len(datasets_loaded) == 1 and single_dataset:
        dataset = datasets_loaded[0]
        run = runner.create_run(dataset, provider_names, top_k)
        asyncio.create_task(runner.execute_run(run, dataset, provider_names, top_k))
        return {"id": run.id, "status": run.status}

    # Multi-dataset: create parallel runs
    results = []
    for dataset in datasets_loaded:
        run = runner.create_run(dataset, provider_names, top_k)
        asyncio.create_task(runner.execute_run(run, dataset, provider_names, top_k))
        results.append({"id": run.id, "dataset": dataset.name, "status": run.status})

    return {"runs": results}


# -- Tools -------------------------------------------------------------------


@router.get("/tools")
def list_tools_endpoint():
    return {"tools": [t.model_dump() for t in tool_registry.list_tools()]}


@router.post("/tools", dependencies=[Depends(_require_write_auth)])
async def create_tool(body: dict):
    from .models import ToolDefinition

    tool = ToolDefinition(**body)
    tool_registry.register_tool(tool)
    return tool.model_dump()


@router.delete("/tools/{slug}", dependencies=[Depends(_require_write_auth)])
def delete_tool(slug: str):
    if not tool_registry.delete_tool(slug):
        raise HTTPException(404, "Tool not found or is a built-in")
    return {"ok": True}


# -- Tasks -------------------------------------------------------------------


@router.get("/tasks")
def list_tasks():
    return {"tasks": [t.model_dump() for t in task_registry.list_tasks()]}


@router.post("/tasks", dependencies=[Depends(_require_write_auth)])
async def create_task(body: dict):
    from .models import TaskDefinition

    task = TaskDefinition(**body)
    task_registry.register_task(task)
    return task.model_dump()


# -- Metrics -----------------------------------------------------------------
@router.get("/metrics")
def list_available_metrics():
    """List all available evaluation metrics with descriptions."""
    return {"metrics": AVAILABLE_METRICS}


@router.post("/tasks/recommend-metrics", dependencies=[Depends(_require_write_auth)])
async def recommend_task_metrics(body: dict):
    """Auto-derive the best 5 evaluation metrics for a task type."""
    from .metric_recommender import recommend_metrics

    task_name = body.get("task_name", "Custom Task")
    task_description = body.get("task_description", "")
    task_category = body.get("task_category", "search")
    evaluation_criteria = body.get("evaluation_criteria", "")
    result = await recommend_metrics(
        task_name, task_description, task_category, evaluation_criteria
    )
    metrics = [
        EvalMetricWeight(
            metric=m["metric"],
            weight=m["weight"],
            label=AVAILABLE_METRICS.get(m["metric"], {}).get("label", m["metric"]),
            description=m.get("reasoning", ""),
            higher_is_better=AVAILABLE_METRICS.get(m["metric"], {}).get("higher_is_better", True),
        )
        for m in result.get("metrics", [])
    ]
    config = EvalConfig(
        task_id=body.get("task_id", ""),
        name=f"Auto-config for {task_name}",
        metrics=metrics,
        generated_by_ai=bool(settings.openai_api_key),
        ai_reasoning=result.get("overall_reasoning", ""),
    )
    return {
        "eval_config": config.model_dump(),
        "available_metrics": AVAILABLE_METRICS,
        "llm_used": bool(settings.openai_api_key),
    }


# -- Eval Configs ------------------------------------------------------------
_EVAL_CONFIGS_FILE = Path(settings.results_dir) / "eval_configs.json"


def _load_eval_configs() -> list[dict]:
    if _EVAL_CONFIGS_FILE.is_file():
        try:
            return json.loads(_EVAL_CONFIGS_FILE.read_text())
        except json.JSONDecodeError, OSError:
            return []
    return []


def _save_eval_configs(configs: list[dict]) -> None:
    _EVAL_CONFIGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    _EVAL_CONFIGS_FILE.write_text(json.dumps(configs, indent=2))


@router.get("/eval-configs")
def list_eval_configs():
    return {"eval_configs": _load_eval_configs()}


@router.post("/eval-configs", dependencies=[Depends(_require_write_auth)])
def create_eval_config(body: dict):
    configs = _load_eval_configs()
    config = EvalConfig(
        task_id=body.get("task_id", ""),
        name=body.get("name", "Untitled Config"),
        metrics=[EvalMetricWeight(**m) for m in body.get("metrics", [])],
        generated_by_ai=body.get("generated_by_ai", False),
        ai_reasoning=body.get("ai_reasoning", ""),
    )
    configs.append(config.model_dump())
    _save_eval_configs(configs)
    return {"ok": True, "eval_config": config.model_dump()}


@router.get("/leaderboard")
def get_leaderboard(metric: str = "composite_score", limit: int = 20):
    """Global leaderboard: best average score per tool across all completed runs."""
    from collections import defaultdict

    runs = [r for r in runner.list_runs() if r.status == "completed"]

    # Aggregate per provider
    provider_scores: dict[str, list[float]] = defaultdict(list)
    provider_latencies: dict[str, list[float]] = defaultdict(list)
    provider_costs: dict[str, list[float]] = defaultdict(list)
    provider_runs: dict[str, int] = defaultdict(int)

    for run in runs:
        summary = run.summary
        for provider, stats in summary.items():
            provider_runs[provider] += 1
            provider_latencies[provider].append(stats.get("mean_latency_ms", 0))
            provider_costs[provider].append(stats.get("mean_cost_usd", 0))

            if metric == "composite_score":
                score = (
                    stats.get("mean_ndcg_at_k", 0) * 0.35
                    + stats.get("mean_precision_at_k", 0) * 0.25
                    + stats.get("mean_recall_at_k", 0) * 0.25
                    + stats.get("mean_mrr", 0) * 0.15
                ) * 100
            else:
                score = stats.get(f"mean_{metric}", 0) * 100

            provider_scores[provider].append(score)

    leaderboard = []
    for provider, scores in provider_scores.items():
        avg_score = sum(scores) / len(scores)
        avg_latency = sum(provider_latencies[provider]) / len(provider_latencies[provider])
        costs = provider_costs[provider]
        avg_cost = sum(costs) / len(costs) if costs else 0.0
        leaderboard.append(
            {
                "rank": 0,  # filled below
                "provider": provider,
                "avg_score": round(avg_score, 1),
                "avg_latency_ms": round(avg_latency, 1),
                "avg_cost_per_query": round(avg_cost, 6),
                "run_count": provider_runs[provider],
                "trend": "stable",  # could be computed from score history
            }
        )

    leaderboard.sort(key=lambda x: x["avg_score"], reverse=True)
    for i, entry in enumerate(leaderboard[:limit]):
        entry["rank"] = i + 1

    return {
        "leaderboard": leaderboard[:limit],
        "metric": metric,
        "total_runs": len(runs),
        "last_updated": max((r.completed_at or 0 for r in runs), default=0),
    }


@router.get("/runs/{run_id}/report")
def get_run_report(run_id: str):
    """Generate a structured comparison report for a completed run."""
    _validate_run_id(run_id)
    run = runner.get_run(run_id)
    if not run or run.status != "completed":
        raise HTTPException(400, "Run must be completed to generate report")

    summary = run.summary

    # Winner per metric
    winners = {}
    for m in [
        "mean_ndcg_at_k",
        "mean_precision_at_k",
        "mean_mrr",
        "mean_latency_ms",
        "mean_llm_judge_score",
    ]:
        if m == "mean_latency_ms":
            winner = min(summary, key=lambda p: summary[p].get(m, float("inf")))
        else:
            winner = max(summary, key=lambda p: summary[p].get(m, 0))
        winners[m] = winner

    # Best overall
    composite = {
        p: (
            s.get("mean_ndcg_at_k", 0) * 0.35
            + s.get("mean_precision_at_k", 0) * 0.25
            + s.get("mean_recall_at_k", 0) * 0.25
            + s.get("mean_mrr", 0) * 0.15
        )
        * 100
        for p, s in summary.items()
    }
    best_overall = max(composite, key=lambda p: composite[p]) if composite else None

    # Per-query breakdown: which provider won each query
    query_winners = {}
    queries = list({s.query for s in run.scores})
    for query in queries:
        query_scores = {s.provider: s.ndcg_at_k for s in run.scores if s.query == query}
        if query_scores:
            query_winners[query] = max(query_scores, key=lambda p: query_scores[p])

    return {
        "run_id": run_id,
        "dataset": run.dataset_name,
        "providers": run.providers,
        "summary": summary,
        "composite_scores": composite,
        "best_overall": best_overall,
        "metric_winners": winners,
        "query_count": len(queries),
        "query_winners": query_winners,
        "duration_seconds": (run.completed_at or 0) - run.created_at,
    }
