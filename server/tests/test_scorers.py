import pytest

from app.scorers import (
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
    ndcg_at_k,
    score_query,
    _normalize_url,
)


class TestNormalizeUrl:
    def test_strips_scheme_and_trailing_slash(self):
        assert _normalize_url("https://example.com/") == "example.com"
        assert _normalize_url("http://example.com/path/") == "example.com/path"

    def test_strips_www(self):
        assert _normalize_url("https://www.example.com/page") == "example.com/page"

    def test_case_insensitive(self):
        assert _normalize_url("HTTPS://Example.COM/Path") == "example.com/path"


class TestPrecisionAtK:
    def test_all_relevant(self):
        returned = ["http://a.com", "http://b.com", "http://c.com"]
        relevant = {"http://a.com", "http://b.com", "http://c.com"}
        assert precision_at_k(returned, relevant, 3) == 1.0

    def test_none_relevant(self):
        returned = ["http://x.com", "http://y.com"]
        relevant = {"http://a.com"}
        assert precision_at_k(returned, relevant, 2) == 0.0

    def test_partial(self):
        returned = ["http://a.com", "http://x.com", "http://b.com", "http://y.com"]
        relevant = {"http://a.com", "http://b.com"}
        assert precision_at_k(returned, relevant, 4) == 0.5

    def test_k_zero(self):
        assert precision_at_k(["http://a.com"], {"http://a.com"}, 0) == 0.0


class TestRecallAtK:
    def test_all_found(self):
        returned = ["http://a.com", "http://b.com"]
        relevant = {"http://a.com", "http://b.com"}
        assert recall_at_k(returned, relevant, 2) == 1.0

    def test_partial(self):
        returned = ["http://a.com", "http://x.com"]
        relevant = {"http://a.com", "http://b.com"}
        assert recall_at_k(returned, relevant, 2) == 0.5

    def test_empty_relevant(self):
        assert recall_at_k(["http://a.com"], set(), 1) == 1.0

    def test_k_zero(self):
        assert recall_at_k(["http://a.com"], {"http://a.com"}, 0) == 0.0


class TestReciprocalRank:
    def test_first_position(self):
        returned = ["http://a.com", "http://b.com"]
        relevant = {"http://a.com"}
        assert reciprocal_rank(returned, relevant) == 1.0

    def test_second_position(self):
        returned = ["http://x.com", "http://a.com"]
        relevant = {"http://a.com"}
        assert reciprocal_rank(returned, relevant) == 0.5

    def test_not_found(self):
        returned = ["http://x.com", "http://y.com"]
        relevant = {"http://a.com"}
        assert reciprocal_rank(returned, relevant) == 0.0


class TestNDCG:
    def test_perfect_ranking(self):
        returned = ["http://a.com", "http://b.com"]
        relevant = {"http://a.com", "http://b.com"}
        assert ndcg_at_k(returned, relevant, 2) == 1.0

    def test_reversed_ranking(self):
        returned = ["http://x.com", "http://a.com"]
        relevant = {"http://a.com"}
        score = ndcg_at_k(returned, relevant, 2)
        assert 0.0 < score < 1.0

    def test_no_relevant(self):
        returned = ["http://x.com"]
        relevant = {"http://a.com"}
        assert ndcg_at_k(returned, relevant, 1) == 0.0

    def test_empty_relevant_set(self):
        assert ndcg_at_k(["http://a.com"], set(), 1) == 1.0


class TestNDCGIdealDCGFix:
    """Verify NDCG uses ALL ground-truth relevant docs for ideal DCG."""

    def test_one_found_of_five_relevant(self):
        """1 relevant found out of 5 ground-truth → NDCG well below 1.0."""
        returned = ["http://a.com", "http://x.com", "http://y.com", "http://z.com", "http://w.com"]
        relevant = {"http://a.com", "http://b.com", "http://c.com", "http://d.com", "http://e.com"}
        score = ndcg_at_k(returned, relevant, 5)
        # With the bug (old code), this would be 1.0. Fixed: should be ~0.2
        assert score < 0.5
        assert score > 0.0

    def test_perfect_ranking_still_one(self):
        """All relevant docs found and at top → still 1.0."""
        returned = ["http://a.com", "http://b.com", "http://c.com"]
        relevant = {"http://a.com", "http://b.com", "http://c.com"}
        assert ndcg_at_k(returned, relevant, 3) == 1.0

    def test_more_relevant_than_k(self):
        """Ground-truth has more relevant docs than K → ideal maxes at K."""
        returned = ["http://a.com", "http://b.com"]
        relevant = {"http://a.com", "http://b.com", "http://c.com", "http://d.com", "http://e.com"}
        # Both returned are relevant → perfect for the K=2 window
        assert ndcg_at_k(returned, relevant, 2) == 1.0


class TestNegativeK:
    def test_precision_negative_k(self):
        assert precision_at_k(["http://a.com"], {"http://a.com"}, -1) == 0.0

    def test_recall_negative_k(self):
        assert recall_at_k(["http://a.com"], {"http://a.com"}, -1) == 0.0

    def test_ndcg_negative_k(self):
        assert ndcg_at_k(["http://a.com"], {"http://a.com"}, -1) == 0.0


class TestKGreaterThanReturned:
    def test_precision_k_exceeds_results(self):
        returned = ["http://a.com"]
        relevant = {"http://a.com"}
        # k=10 but only 1 result → precision = 1/10
        assert precision_at_k(returned, relevant, 10) == pytest.approx(0.1)

    def test_recall_k_exceeds_results(self):
        returned = ["http://a.com"]
        relevant = {"http://a.com", "http://b.com"}
        assert recall_at_k(returned, relevant, 10) == 0.5

    def test_ndcg_k_exceeds_results(self):
        returned = ["http://a.com"]
        relevant = {"http://a.com"}
        score = ndcg_at_k(returned, relevant, 10)
        assert score > 0.0


class TestScoreQuery:
    def test_returns_all_metrics(self):
        returned = ["http://a.com", "http://b.com"]
        relevant = {"http://a.com"}
        result = score_query(returned, relevant, 2)
        assert set(result.keys()) == {
            "precision_at_k",
            "recall_at_k",
            "ndcg_at_k",
            "mrr",
            "map_at_k",
        }
        assert all(isinstance(v, float) for v in result.values())


class TestUrlNormalizationInScoring:
    def test_www_vs_no_www(self):
        returned = ["https://www.example.com/page"]
        relevant = {"https://example.com/page"}
        assert precision_at_k(returned, relevant, 1) == 1.0

    def test_trailing_slash(self):
        returned = ["https://example.com/page/"]
        relevant = {"https://example.com/page"}
        assert precision_at_k(returned, relevant, 1) == 1.0

    def test_http_vs_https(self):
        returned = ["http://example.com/page"]
        relevant = {"https://example.com/page"}
        assert precision_at_k(returned, relevant, 1) == 1.0
