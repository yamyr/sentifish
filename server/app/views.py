"""API routes for managing datasets, eval runs, and providers."""

from __future__ import annotations

import asyncio
import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.responses import StreamingResponse
from fastapi.security import APIKeyHeader

from . import datasets as ds
from . import narrator
from . import runner
from . import task_registry
from . import tool_registry
from .config import settings
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

    try:
        top_k = max(1, min(int(raw_top_k), 100))
    except TypeError, ValueError:
        raise HTTPException(
            status_code=400,
            detail="top_k must be an integer between 1 and 100",
        )

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
