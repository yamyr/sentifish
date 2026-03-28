"""Tests for Pydantic model validation constraints."""

import pytest
from pydantic import ValidationError

from app.models import EvalRun, QueryCase, QueryScore


class TestQueryCase:
    def test_rejects_empty_query(self):
        with pytest.raises(ValidationError):
            QueryCase(query="")

    def test_accepts_non_empty_query(self):
        case = QueryCase(query="hello")
        assert case.query == "hello"


class TestQueryScore:
    def test_rejects_negative_precision(self):
        with pytest.raises(ValidationError):
            QueryScore(query="q", provider="p", precision_at_k=-0.1)

    def test_rejects_precision_above_one(self):
        with pytest.raises(ValidationError):
            QueryScore(query="q", provider="p", precision_at_k=1.1)

    def test_accepts_valid_zero_to_one_values(self):
        score = QueryScore(
            query="q",
            provider="p",
            precision_at_k=0.5,
            recall_at_k=0.0,
            ndcg_at_k=1.0,
            mrr=0.75,
            map_at_k=0.25,
            content_depth=0.9,
        )
        assert score.precision_at_k == 0.5
        assert score.recall_at_k == 0.0
        assert score.ndcg_at_k == 1.0
        assert score.mrr == 0.75
        assert score.map_at_k == 0.25
        assert score.content_depth == 0.9

    def test_rejects_negative_latency(self):
        with pytest.raises(ValidationError):
            QueryScore(query="q", provider="p", latency_ms=-1.0)

    def test_accepts_zero_latency(self):
        score = QueryScore(query="q", provider="p", latency_ms=0.0)
        assert score.latency_ms == 0.0


class TestEvalRun:
    def test_rejects_top_k_zero(self):
        with pytest.raises(ValidationError):
            EvalRun(dataset_name="ds", providers=["p"], top_k=0)

    def test_rejects_top_k_negative(self):
        with pytest.raises(ValidationError):
            EvalRun(dataset_name="ds", providers=["p"], top_k=-1)

    def test_accepts_top_k_one(self):
        run = EvalRun(dataset_name="ds", providers=["p"], top_k=1)
        assert run.top_k == 1
