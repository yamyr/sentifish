"""Data models for web search evaluations."""

from __future__ import annotations

import time
import uuid
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class SearchResult(BaseModel):
    """A single search result returned by a provider."""

    url: str
    title: str
    snippet: str = ""
    rank: int = 0


class QueryCase(BaseModel):
    """A single evaluation case: a query with expected relevant URLs."""

    query: str
    relevant_urls: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Dataset(BaseModel):
    """A collection of query cases for evaluation."""

    name: str
    description: str = ""
    cases: list[QueryCase] = Field(default_factory=list)

    @property
    def size(self) -> int:
        return len(self.cases)


class QueryScore(BaseModel):
    """Scores for a single query evaluation."""

    query: str
    provider: str
    precision_at_k: float = 0.0
    recall_at_k: float = 0.0
    ndcg_at_k: float = 0.0
    mrr: float = 0.0
    latency_ms: float = 0.0
    result_count: int = 0
    results: list[SearchResult] = Field(default_factory=list)


class RunStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class EvalRun(BaseModel):
    """A complete evaluation run across a dataset and provider(s)."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dataset_name: str
    providers: list[str]
    top_k: int = 10
    status: RunStatus = RunStatus.PENDING
    created_at: float = Field(default_factory=time.time)
    completed_at: float | None = None
    scores: list[QueryScore] = Field(default_factory=list)
    error: str | None = None

    @property
    def summary(self) -> dict[str, dict[str, float]]:
        """Aggregate scores per provider."""
        by_provider: dict[str, list[QueryScore]] = {}
        for s in self.scores:
            by_provider.setdefault(s.provider, []).append(s)

        out: dict[str, dict[str, float]] = {}
        for provider, query_scores in by_provider.items():
            n = len(query_scores)
            if n == 0:
                continue
            out[provider] = {
                "mean_precision_at_k": sum(s.precision_at_k for s in query_scores) / n,
                "mean_recall_at_k": sum(s.recall_at_k for s in query_scores) / n,
                "mean_ndcg_at_k": sum(s.ndcg_at_k for s in query_scores) / n,
                "mean_mrr": sum(s.mrr for s in query_scores) / n,
                "mean_latency_ms": sum(s.latency_ms for s in query_scores) / n,
                "total_queries": n,
            }
        return out
