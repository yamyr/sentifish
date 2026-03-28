"""Eval runner: executes search queries against providers and scores results."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from pathlib import Path

from .config import settings
from .models import Dataset, EvalRun, QueryScore, RunStatus
from .providers import SearchProvider, get_provider
from .scorers import score_query

logger = logging.getLogger(__name__)

# In-memory run store (keyed by run ID)
_runs: dict[str, EvalRun] = {}


def get_run(run_id: str) -> EvalRun | None:
    return _runs.get(run_id)


def list_runs() -> list[EvalRun]:
    return sorted(_runs.values(), key=lambda r: r.created_at, reverse=True)


_MAX_RETRIES = 3
_RETRY_BACKOFF = [1.0, 3.0, 5.0]


async def _eval_query(
    provider: SearchProvider,
    query: str,
    relevant_urls: set[str],
    top_k: int,
) -> QueryScore:
    """Run a single query against a provider and score it (with retry on 429)."""
    for attempt in range(_MAX_RETRIES):
        try:
            results, latency_ms = await provider.search(query, top_k)
            break
        except Exception as exc:
            is_rate_limit = "429" in str(exc) or "Too Many" in str(exc)
            if is_rate_limit and attempt < _MAX_RETRIES - 1:
                wait = _RETRY_BACKOFF[attempt]
                logger.info(
                    "Provider %s rate-limited on %r, retrying in %.0fs (attempt %d/%d)",
                    provider.name,
                    query,
                    wait,
                    attempt + 1,
                    _MAX_RETRIES,
                )
                await asyncio.sleep(wait)
                continue
            logger.warning("Provider %s failed on %r: %s", provider.name, query, exc)
            return QueryScore(
                query=query,
                provider=provider.name,
                latency_ms=0.0,
                result_count=0,
            )

    returned_urls = [r.url for r in results]
    scores = score_query(returned_urls, relevant_urls, top_k)

    return QueryScore(
        query=query,
        provider=provider.name,
        precision_at_k=scores["precision_at_k"],
        recall_at_k=scores["recall_at_k"],
        ndcg_at_k=scores["ndcg_at_k"],
        mrr=scores["mrr"],
        latency_ms=latency_ms,
        result_count=len(results),
        results=results,
    )


def create_run(dataset: Dataset, provider_names: list[str], top_k: int) -> EvalRun:
    """Create a pending run and register it in the store."""
    run = EvalRun(
        dataset_name=dataset.name,
        providers=provider_names,
        top_k=top_k,
        status=RunStatus.RUNNING,
    )
    _runs[run.id] = run
    return run


async def execute_run(
    run: EvalRun, dataset: Dataset, provider_names: list[str], top_k: int
) -> EvalRun:
    """Execute a full evaluation run: all queries x all providers."""
    try:
        providers = [get_provider(name) for name in provider_names]
    except ValueError as exc:
        run.status = RunStatus.FAILED
        run.error = str(exc)
        return run

    # TinyFish runs real browser sessions — limit to 2 concurrent to avoid timeouts
    _SLOW_PROVIDERS = {"tinyfish"}
    sem_fast = asyncio.Semaphore(settings.max_concurrency)
    sem_slow = asyncio.Semaphore(2)

    async def limited_eval(prov: SearchProvider, case_query: str, relevant: set[str]) -> QueryScore:
        sem = sem_slow if prov.name in _SLOW_PROVIDERS else sem_fast
        async with sem:
            return await _eval_query(prov, case_query, relevant, top_k)

    tasks = []
    for case in dataset.cases:
        relevant = set(case.relevant_urls)
        for provider in providers:
            tasks.append(limited_eval(provider, case.query, relevant))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, Exception):
            logger.error("Eval task error: %s", result)
            continue
        run.scores.append(result)

    run.status = RunStatus.COMPLETED
    run.completed_at = time.time()

    # Persist to disk
    _persist_run(run)

    logger.info(
        "Run %s completed: %d scores across %d providers",
        run.id[:8],
        len(run.scores),
        len(provider_names),
    )
    return run


def _persist_run(run: EvalRun) -> Path:
    """Save a completed run to the results directory as JSON."""
    results_dir = Path(settings.results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)
    path = results_dir / f"{run.id}.json"
    path.write_text(run.model_dump_json(indent=2))
    return path


def load_persisted_runs() -> None:
    """Load all persisted runs from disk into memory on startup."""
    results_dir = Path(settings.results_dir)
    if not results_dir.is_dir():
        return
    for path in results_dir.glob("*.json"):
        try:
            data = json.loads(path.read_text())
            run = EvalRun(**data)
            _runs[run.id] = run
        except Exception as exc:
            logger.warning("Failed to load run %s: %s", path.name, exc)
