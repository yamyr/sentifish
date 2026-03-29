"""Data models for web search evaluations."""

from __future__ import annotations

import time
import uuid
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class ToolCategory(StrEnum):
    SEARCH = "search"
    RETRIEVAL = "retrieval"
    CUSTOM = "custom"


class SearchResult(BaseModel):
    """A single search result returned by a provider."""

    url: str
    title: str
    snippet: str = ""
    rank: int = 0


class QueryCase(BaseModel):
    """A single evaluation case: a query with expected relevant URLs."""

    query: str = Field(min_length=1)
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
    precision_at_k: float = Field(default=0.0, ge=0.0, le=1.0)
    recall_at_k: float = Field(default=0.0, ge=0.0, le=1.0)
    ndcg_at_k: float = Field(default=0.0, ge=0.0, le=1.0)
    mrr: float = Field(default=0.0, ge=0.0, le=1.0)
    map_at_k: float = Field(default=0.0, ge=0.0, le=1.0)
    content_depth: float = Field(default=0.0, ge=0.0, le=1.0)
    llm_judge_score: float = Field(default=0.0, ge=0.0, le=1.0)
    llm_judge_reasoning: str = ""
    latency_ms: float = Field(default=0.0, ge=0.0)
    result_count: int = 0
    results: list[SearchResult] = Field(default_factory=list)

    @property
    def composite_score(self) -> float:
        """Weighted composite: NDCG×35 + P×25 + R×25 + MRR×15, scaled 0-100."""
        return round(
            (
                self.ndcg_at_k * 0.35
                + self.precision_at_k * 0.25
                + self.recall_at_k * 0.25
                + self.mrr * 0.15
            )
            * 100,
            1,
        )


class ToolCategory(StrEnum):
    SEARCH = "search"
    AI_ASSISTANT = "ai_assistant"
    CODE_GENERATION = "code_generation"
    IMAGE_GENERATION = "image_generation"
    DATA_EXTRACTION = "data_extraction"
    SUMMARIZATION = "summarization"
    CUSTOM = "custom"


class ToolInputType(StrEnum):
    TEXT_QUERY = "text_query"
    URL = "url"
    FILE = "file"
    CODE = "code"


class ToolOutputType(StrEnum):
    URL_LIST = "url_list"
    TEXT = "text"
    CODE = "code"
    JSON = "json"
    IMAGE_URL = "image_url"


class ToolDefinition(BaseModel):
    """A user-defined tool to evaluate."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    category: ToolCategory
    input_type: ToolInputType = ToolInputType.TEXT_QUERY
    output_type: ToolOutputType = ToolOutputType.URL_LIST
    description: str = ""
    endpoint_url: str = ""
    auth_header: str = ""
    request_template: str = ""
    response_path: str = ""
    builtin_provider: str = ""
    created_at: float = Field(default_factory=time.time)
    is_builtin: bool = False


class TaskDefinition(BaseModel):
    """A user-defined task type for evaluation."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    category: ToolCategory
    input_template: str = ""
    evaluation_criteria: str = ""
    suggested_metrics: list[str] = Field(default_factory=list)
    created_at: float = Field(default_factory=time.time)


class EvalMetricWeight(BaseModel):
    metric: str
    weight: float
    label: str
    description: str = ""
    higher_is_better: bool = True


class EvalConfig(BaseModel):
    """User-configured evaluation: 5 weighted metrics for a task type."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    name: str
    metrics: list[EvalMetricWeight] = Field(default_factory=list)
    created_at: float = Field(default_factory=time.time)
    generated_by_ai: bool = False
    ai_reasoning: str = ""


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
    top_k: int = Field(default=10, ge=1)
    status: RunStatus = RunStatus.PENDING
    created_at: float = Field(default_factory=time.time)
    completed_at: float | None = None
    scores: list[QueryScore] = Field(default_factory=list)
    error: str | None = None
    task_id: str | None = None
    eval_config_id: str | None = None
    tool_ids: list[str] = Field(default_factory=list)
    weighted_score: dict[str, float] = Field(default_factory=dict)

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
                "mean_map_at_k": sum(s.map_at_k for s in query_scores) / n,
                "mean_content_depth": sum(s.content_depth for s in query_scores) / n,
                "mean_llm_judge_score": sum(s.llm_judge_score for s in query_scores) / n,
                "mean_latency_ms": sum(s.latency_ms for s in query_scores) / n,
                "total_queries": n,
                "composite_score": round(
                    (
                        sum(s.ndcg_at_k for s in query_scores) / n * 0.35
                        + sum(s.precision_at_k for s in query_scores) / n * 0.25
                        + sum(s.recall_at_k for s in query_scores) / n * 0.25
                        + sum(s.mrr for s in query_scores) / n * 0.15
                    )
                    * 100,
                    1,
                ),
            }
        return out
