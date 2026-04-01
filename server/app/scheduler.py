"""Simple async scheduler for recurring evaluations."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from pathlib import Path

from .config import settings
from .models import EvalSchedule

logger = logging.getLogger(__name__)

_schedules: dict[str, EvalSchedule] = {}
_SCHEDULES_DIR: Path | None = None


def _get_schedules_dir() -> Path:
    global _SCHEDULES_DIR
    if _SCHEDULES_DIR is None:
        _SCHEDULES_DIR = Path(settings.results_dir) / "schedules"
        _SCHEDULES_DIR.mkdir(parents=True, exist_ok=True)
    return _SCHEDULES_DIR


def list_schedules() -> list[EvalSchedule]:
    return sorted(_schedules.values(), key=lambda s: s.created_at, reverse=True)


def get_schedule(schedule_id: str) -> EvalSchedule | None:
    return _schedules.get(schedule_id)


def create_schedule(schedule: EvalSchedule) -> EvalSchedule:
    _schedules[schedule.id] = schedule
    _persist_schedule(schedule)
    return schedule


def delete_schedule(schedule_id: str) -> bool:
    if schedule_id not in _schedules:
        return False
    del _schedules[schedule_id]
    path = _get_schedules_dir() / f"{schedule_id}.json"
    path.unlink(missing_ok=True)
    return True


def toggle_schedule(schedule_id: str) -> EvalSchedule | None:
    schedule = _schedules.get(schedule_id)
    if schedule is None:
        return None
    schedule.enabled = not schedule.enabled
    _persist_schedule(schedule)
    return schedule


def _persist_schedule(schedule: EvalSchedule) -> None:
    path = _get_schedules_dir() / f"{schedule.id}.json"
    path.write_text(schedule.model_dump_json(indent=2))


def load_persisted_schedules() -> int:
    d = _get_schedules_dir()
    count = 0
    for path in d.glob("*.json"):
        try:
            data = json.loads(path.read_text())
            schedule = EvalSchedule(**data)
            _schedules[schedule.id] = schedule
            count += 1
        except Exception as exc:
            logger.warning("Failed to load schedule %s: %s", path.name, exc)
    return count


async def run_scheduler() -> None:
    """Background loop that checks schedules every 60 seconds."""
    # Import here to avoid circular imports
    from . import datasets as ds
    from . import runner

    logger.info("Scheduler started")
    while True:
        await asyncio.sleep(60)
        now = time.time()
        for schedule in list(_schedules.values()):
            if not schedule.enabled:
                continue
            # Check if enough time has passed since last run
            interval_secs = schedule.interval_minutes * 60
            last = schedule.last_run_at or schedule.created_at
            if now - last < interval_secs:
                continue
            # Time to run
            try:
                dataset = ds.load_dataset(schedule.dataset_name)
            except FileNotFoundError:
                logger.warning(
                    "Schedule %s: dataset %r not found, skipping",
                    schedule.id,
                    schedule.dataset_name,
                )
                continue
            logger.info(
                "Schedule %s: triggering run on %s",
                schedule.name,
                schedule.dataset_name,
            )
            run = runner.create_run(dataset, schedule.providers, schedule.top_k)
            asyncio.create_task(
                runner.execute_run(run, dataset, schedule.providers, schedule.top_k)
            )
            schedule.last_run_id = run.id
            schedule.last_run_at = now
            schedule.run_count += 1
            _persist_schedule(schedule)
