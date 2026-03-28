import pytest

from app.models import Dataset, QueryCase, SearchResult
from app.providers import MockProvider
from app.runner import _eval_query, execute_run, _runs


class TestEvalQuery:
    async def test_scores_mock_results(self):
        results = [
            SearchResult(url="https://a.com", title="A", rank=1),
            SearchResult(url="https://b.com", title="B", rank=2),
            SearchResult(url="https://c.com", title="C", rank=3),
        ]
        provider = MockProvider(results=results, latency_ms=42.0)

        score = await _eval_query(
            provider=provider,
            query="test query",
            relevant_urls={"https://a.com", "https://b.com"},
            top_k=3,
        )

        assert score.provider == "mock"
        assert score.query == "test query"
        assert score.latency_ms == 42.0
        assert score.result_count == 3
        assert score.precision_at_k == pytest.approx(2 / 3)
        assert score.recall_at_k == 1.0
        assert score.mrr == 1.0
        assert score.ndcg_at_k > 0

    async def test_handles_provider_failure(self):
        class FailProvider(MockProvider):
            async def search(self, query, top_k=10):
                raise RuntimeError("boom")

        provider = FailProvider()
        provider.name = "failing"

        score = await _eval_query(provider, "q", {"https://a.com"}, 5)
        assert score.result_count == 0
        assert score.latency_ms == 0.0


class TestExecuteRun:
    async def test_full_run_with_mock(self, monkeypatch):
        results = [
            SearchResult(url="https://a.com", title="A", rank=1),
            SearchResult(url="https://x.com", title="X", rank=2),
        ]
        mock = MockProvider(results=results, latency_ms=10.0)

        # Patch get_provider to return our mock
        monkeypatch.setattr("app.runner.get_provider", lambda name: mock)

        dataset = Dataset(
            name="test_ds",
            cases=[
                QueryCase(query="q1", relevant_urls=["https://a.com"]),
                QueryCase(query="q2", relevant_urls=["https://b.com"]),
            ],
        )

        run = await execute_run(dataset, ["mock"], top_k=2)

        assert run.status == "completed"
        assert run.dataset_name == "test_ds"
        assert len(run.scores) == 2

        summary = run.summary
        assert "mock" in summary
        assert summary["mock"]["total_queries"] == 2
        assert summary["mock"]["mean_precision_at_k"] == 0.25  # 0.5 + 0.0 / 2

        # Cleanup
        _runs.pop(run.id, None)
