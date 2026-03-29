"""Task registry: manages user-defined task types for evaluation."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from .config import settings
from .models import TaskDefinition, ToolCategory

logger = logging.getLogger(__name__)

_tasks: dict[str, TaskDefinition] = {}
_TASKS_FILE: Path | None = None


def _get_tasks_file() -> Path:
    global _TASKS_FILE
    if _TASKS_FILE is None:
        _TASKS_FILE = Path(settings.results_dir) / "tasks.json"
    return _TASKS_FILE


_BUILTIN_TASKS = [
    TaskDefinition(
        name="Web Search",
        category=ToolCategory.SEARCH,
        description="Find relevant web pages for a query",
        suggested_metrics=["ndcg_at_k", "precision_at_k", "recall_at_k", "mrr", "latency_ms"],
    ),
    TaskDefinition(
        name="Factual Q&A",
        category=ToolCategory.AI_ASSISTANT,
        description="Answer factual questions accurately",
        suggested_metrics=[
            "llm_judge_score",
            "content_depth",
            "latency_ms",
            "recall_at_k",
            "ndcg_at_k",
        ],
    ),
    TaskDefinition(
        name="Code Generation",
        category=ToolCategory.CODE_GENERATION,
        description="Generate correct, idiomatic code for a programming task",
        suggested_metrics=[
            "llm_judge_score",
            "latency_ms",
            "content_depth",
            "precision_at_k",
            "mrr",
        ],
    ),
    TaskDefinition(
        name="Summarization",
        category=ToolCategory.SUMMARIZATION,
        description="Summarize a document or topic accurately",
        suggested_metrics=[
            "llm_judge_score",
            "content_depth",
            "latency_ms",
            "recall_at_k",
            "precision_at_k",
        ],
    ),
    TaskDefinition(
        name="Custom Task",
        category=ToolCategory.CUSTOM,
        description="Define your own evaluation criteria",
        suggested_metrics=[
            "llm_judge_score",
            "ndcg_at_k",
            "precision_at_k",
            "latency_ms",
            "content_depth",
        ],
    ),
]


def _init_builtins() -> None:
    for t in _BUILTIN_TASKS:
        _tasks[t.id] = t


def list_tasks() -> list[TaskDefinition]:
    return list(_tasks.values())


def get_task(task_id: str) -> TaskDefinition | None:
    return _tasks.get(task_id)


def register_task(task: TaskDefinition) -> TaskDefinition:
    _tasks[task.id] = task
    _persist()
    return task


def delete_task(task_id: str) -> bool:
    t = _tasks.pop(task_id, None)
    if t:
        _persist()
        return True
    return False


def _persist() -> None:
    tasks_file = _get_tasks_file()
    tasks_file.parent.mkdir(parents=True, exist_ok=True)
    custom = [t.model_dump() for t in _tasks.values() if t not in _BUILTIN_TASKS]
    tasks_file.write_text(json.dumps(custom, indent=2))


def load_persisted_tasks() -> None:
    _init_builtins()
    tasks_file = _get_tasks_file()
    if tasks_file.exists():
        for data in json.loads(tasks_file.read_text()):
            try:
                t = TaskDefinition(**data)
                _tasks[t.id] = t
            except Exception as e:
                logger.warning("Failed to load task: %s", e)
