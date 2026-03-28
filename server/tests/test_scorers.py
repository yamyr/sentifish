from app.scorers import (
    precision_at_k,
    recall_at_k,
    mrr,
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


class TestMRR:
    def test_first_position(self):
        returned = ["http://a.com", "http://b.com"]
        relevant = {"http://a.com"}
        assert mrr(returned, relevant) == 1.0

    def test_second_position(self):
        returned = ["http://x.com", "http://a.com"]
        relevant = {"http://a.com"}
        assert mrr(returned, relevant) == 0.5

    def test_not_found(self):
        returned = ["http://x.com", "http://y.com"]
        relevant = {"http://a.com"}
        assert mrr(returned, relevant) == 0.0


class TestNDCG:
    def test_perfect_ranking(self):
        returned = ["http://a.com", "http://b.com"]
        relevant = {"http://a.com", "http://b.com"}
        assert ndcg_at_k(returned, relevant, 2) == 1.0

    def test_reversed_ranking(self):
        returned = ["http://x.com", "http://a.com"]
        relevant = {"http://a.com"}
        # Relevant at position 2 instead of 1 → NDCG < 1
        score = ndcg_at_k(returned, relevant, 2)
        assert 0.0 < score < 1.0

    def test_no_relevant(self):
        returned = ["http://x.com"]
        relevant = {"http://a.com"}
        assert ndcg_at_k(returned, relevant, 1) == 0.0

    def test_empty_relevant_set(self):
        assert ndcg_at_k(["http://a.com"], set(), 1) == 1.0


class TestScoreQuery:
    def test_returns_all_metrics(self):
        returned = ["http://a.com", "http://b.com"]
        relevant = {"http://a.com"}
        result = score_query(returned, relevant, 2)
        assert set(result.keys()) == {"precision_at_k", "recall_at_k", "ndcg_at_k", "mrr"}
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
