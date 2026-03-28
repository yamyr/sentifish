"""API routes for managing datasets, eval runs, and providers."""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException

from . import datasets as ds
from . import runner
from .providers import available_providers

router = APIRouter(prefix="/api")


# -- Providers ---------------------------------------------------------------


@router.get("/providers")
def list_providers():
    """List search providers with configured API keys."""
    return {"providers": available_providers()}


# -- Datasets ----------------------------------------------------------------


@router.get("/datasets")
def list_datasets():
    return {"datasets": ds.list_datasets()}


@router.get("/datasets/{name}")
def get_dataset(name: str):
    try:
        dataset = ds.load_dataset(name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return dataset.model_dump()


@router.post("/datasets")
def create_dataset(body: dict):
    try:
        dataset = ds.load_dataset_from_dict(body)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    ds.save_dataset(dataset)
    return {"ok": True, "name": dataset.name, "cases": dataset.size}


@router.delete("/datasets/{name}")
def delete_dataset(name: str):
    if not ds.delete_dataset(name):
        raise HTTPException(status_code=404, detail=f"Dataset not found: {name!r}")
    return {"ok": True, "deleted": name}


# -- Eval Runs ---------------------------------------------------------------


@router.get("/runs")
def list_runs():
    runs = runner.list_runs()
    return {
        "runs": [
            {
                "id": r.id,
                "dataset_name": r.dataset_name,
                "providers": r.providers,
                "status": r.status,
                "created_at": r.created_at,
                "completed_at": r.completed_at,
            }
            for r in runs
        ]
    }


@router.get("/runs/{run_id}")
def get_run(run_id: str):
    run = runner.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Run not found: {run_id!r}")
    return run.model_dump()


@router.get("/runs/{run_id}/summary")
def get_run_summary(run_id: str):
    run = runner.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Run not found: {run_id!r}")
    return {
        "id": run.id,
        "dataset_name": run.dataset_name,
        "status": run.status,
        "summary": run.summary,
    }


@router.post("/runs")
async def create_run(body: dict):
    """Trigger a new eval run.

    Body: {"dataset": "name", "providers": ["brave", "serper"], "top_k": 10}
    """
    dataset_name = body.get("dataset")
    provider_names = body.get("providers")
    top_k = body.get("top_k", 10)

    if not dataset_name:
        raise HTTPException(status_code=400, detail="'dataset' is required")
    if not provider_names:
        raise HTTPException(status_code=400, detail="'providers' list is required")

    try:
        dataset = ds.load_dataset(dataset_name)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    run = runner.create_run(dataset, provider_names, top_k)
    asyncio.create_task(runner.execute_run(run, dataset, provider_names, top_k))
    return {"id": run.id, "status": run.status}
