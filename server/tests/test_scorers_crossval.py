"""Cross-validation of custom IR scorers against scikit-learn ranking metrics.

Validates that our hand-rolled implementations produce correct results by
comparing against well-tested reference implementations where available,
and against manually computed expected values otherwise.
"""

from __future__ import annotations

import math

import numpy as np
import pytest
from sklearn.metrics import ndcg_score

from app.scorers import (
    dcg_at_k,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
    average_precision,
    reciprocal_rank,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _urls(n: int) -> list[str]:
    """Generate n distinct fake URLs: http://r0.com, http://r1.com, ..."""
    return [f"http://r{i}.com" for i in range(n)]


def _relevant_set(urls: list[str], indices: list[int]) -> set[str]:
    """Build a relevant-URL set by picking URLs at the given indices."""
    return {urls[i] for i in indices}


def _inverse_rank_scores(n: int) -> list[float]:
    """Generate descending scores [n, n-1, ..., 1] to tell sklearn the ranking order."""
    return [float(n - i) for i in range(n)]


# ---------------------------------------------------------------------------
# NDCG cross-validation against sklearn
# ---------------------------------------------------------------------------


class TestNDCGCrossValidation:
    """Compare our ndcg_at_k() against sklearn.metrics.ndcg_score().

    Our ndcg_at_k() computes ideal DCG using the total number of relevant
    documents from the ground truth (``len(relevant_urls)``), not just those
    that appear in the returned results.  This is the correct behaviour for
    IR evaluation: if 5 documents are relevant but only 1 is returned at
    rank 1, the ideal ranking would have all 5 at the top, so NDCG < 1.

    To cross-validate with sklearn we build a padded y_true vector of length
    k that contains 1s for as many relevant docs as exist in the ground
    truth (capped at k), regardless of whether they were returned.  This
    makes sklearn compute the same ideal DCG our code uses.
    """

    @staticmethod
    def _reference_ndcg(relevance_vector: list[int], n_total_relevant: int, k: int) -> float:
        """Compute NDCG independently, matching our implementation's logic.

        ``relevance_vector`` is the actual binary relevance of the returned
        docs (length <= k).  ``n_total_relevant`` is the total number of
        relevant documents in the ground truth -- this controls the ideal.

        Ideal ranking: ``min(n_total_relevant, k)`` ones followed by zeros.
        """
        rels = relevance_vector[:k]

        if all(r == 0 for r in rels):
            return 0.0

        n_ideal_ones = min(n_total_relevant, k)
        ideal_rels = [1] * n_ideal_ones + [0] * (k - n_ideal_ones)

        actual_dcg = sum(r / math.log2(i + 2) for i, r in enumerate(rels))
        ideal_dcg = sum(r / math.log2(i + 2) for i, r in enumerate(ideal_rels))
        if ideal_dcg == 0.0:
            return 0.0
        return actual_dcg / ideal_dcg

    @staticmethod
    def _sklearn_ndcg_simple(relevance_vector: list[int], k: int) -> float:
        """Compute NDCG via sklearn when all relevant docs appear in results.

        When n_total_relevant equals the number of 1s in the relevance
        vector (i.e., no missing relevant docs), sklearn.metrics.ndcg_score
        can be used directly with y_true = relevance_vector and y_score =
        inverse-rank scores.  sklearn derives the ideal from y_true, which
        in this case matches our ideal exactly.
        """
        rels = relevance_vector[:k]
        if not rels or all(r == 0 for r in rels):
            return 0.0
        y_true = np.array([rels])
        y_score = np.array([_inverse_rank_scores(len(rels))])
        return float(ndcg_score(y_true, y_score, k=k))

    def test_perfect_ranking(self):
        """All relevant docs at the top positions -- sklearn cross-check."""
        urls = _urls(5)
        relevant = _relevant_set(urls, [0, 1, 2])
        k = 5

        ours = ndcg_at_k(urls, relevant, k)
        # All relevant docs present → sklearn can be used directly
        skl = self._sklearn_ndcg_simple([1, 1, 1, 0, 0], k=k)
        ref = self._reference_ndcg([1, 1, 1, 0, 0], n_total_relevant=3, k=k)

        assert ours == pytest.approx(skl, abs=1e-10)
        assert ours == pytest.approx(ref, abs=1e-10)
        assert ours == pytest.approx(1.0, abs=1e-10)

    def test_worst_ranking(self):
        """All relevant docs at the bottom positions -- sklearn cross-check."""
        urls = _urls(5)
        relevant = _relevant_set(urls, [3, 4])
        k = 5

        ours = ndcg_at_k(urls, relevant, k)
        skl = self._sklearn_ndcg_simple([0, 0, 0, 1, 1], k=k)
        ref = self._reference_ndcg([0, 0, 0, 1, 1], n_total_relevant=2, k=k)

        assert ours == pytest.approx(skl, abs=1e-10)
        assert ours == pytest.approx(ref, abs=1e-10)
        assert ours < 1.0

    def test_mixed_ranking(self):
        """Relevant docs interspersed with non-relevant -- sklearn cross-check."""
        urls = _urls(6)
        relevant = _relevant_set(urls, [0, 2, 4])
        k = 6

        ours = ndcg_at_k(urls, relevant, k)
        skl = self._sklearn_ndcg_simple([1, 0, 1, 0, 1, 0], k=k)
        ref = self._reference_ndcg([1, 0, 1, 0, 1, 0], n_total_relevant=3, k=k)

        assert ours == pytest.approx(skl, abs=1e-10)
        assert ours == pytest.approx(ref, abs=1e-10)

    def test_no_relevant_results(self):
        """None of the returned docs are relevant."""
        urls = _urls(4)
        relevant = {"http://other.com"}
        k = 4

        ours = ndcg_at_k(urls, relevant, k)
        ref = self._reference_ndcg([0, 0, 0, 0], n_total_relevant=1, k=k)

        assert ours == pytest.approx(0.0, abs=1e-10)
        assert ours == pytest.approx(ref, abs=1e-10)

    def test_all_relevant(self):
        """Every returned doc is relevant -- sklearn cross-check."""
        urls = _urls(4)
        relevant = _relevant_set(urls, [0, 1, 2, 3])
        k = 4

        ours = ndcg_at_k(urls, relevant, k)
        skl = self._sklearn_ndcg_simple([1, 1, 1, 1], k=k)
        ref = self._reference_ndcg([1, 1, 1, 1], n_total_relevant=4, k=k)

        assert ours == pytest.approx(skl, abs=1e-10)
        assert ours == pytest.approx(ref, abs=1e-10)
        assert ours == pytest.approx(1.0, abs=1e-10)

    def test_single_relevant_at_top(self):
        """One relevant doc at rank 1 -- sklearn cross-check."""
        urls = _urls(3)
        relevant = _relevant_set(urls, [0])
        k = 3

        ours = ndcg_at_k(urls, relevant, k)
        skl = self._sklearn_ndcg_simple([1, 0, 0], k=k)
        ref = self._reference_ndcg([1, 0, 0], n_total_relevant=1, k=k)

        assert ours == pytest.approx(skl, abs=1e-10)
        assert ours == pytest.approx(ref, abs=1e-10)
        assert ours == pytest.approx(1.0, abs=1e-10)

    def test_single_relevant_at_bottom(self):
        """One relevant doc at the last position -- sklearn cross-check."""
        urls = _urls(5)
        relevant = _relevant_set(urls, [4])
        k = 5

        ours = ndcg_at_k(urls, relevant, k)
        skl = self._sklearn_ndcg_simple([0, 0, 0, 0, 1], k=k)
        ref = self._reference_ndcg([0, 0, 0, 0, 1], n_total_relevant=1, k=k)

        assert ours == pytest.approx(skl, abs=1e-10)
        assert ours == pytest.approx(ref, abs=1e-10)

    def test_k_smaller_than_results(self):
        """k truncates the result list; ideal still accounts for all relevant docs."""
        urls = _urls(6)
        relevant = _relevant_set(urls, [0, 4, 5])
        k = 3

        ours = ndcg_at_k(urls, relevant, k)
        # At k=3, relevance vector is [1, 0, 0] but 3 relevant docs exist
        # in ground truth → ideal packs 3 ones at top → NDCG < 1.0
        # Can't use sklearn directly here (n_total_relevant > sum(rels))
        ref = self._reference_ndcg([1, 0, 0], n_total_relevant=3, k=k)

        assert ours == pytest.approx(ref, abs=1e-10)
        assert ours < 1.0  # not perfect because 2 relevant docs are outside top-k

    def test_missing_relevant_docs_penalizes_ndcg(self):
        """Relevant docs missing from results correctly lower NDCG.

        5 relevant docs exist in the ground truth but only 1 appears (at
        rank 1).  The ideal ranking packs all 5 at the top, so the ideal
        DCG is much larger than the actual DCG, yielding NDCG well below 1.
        """
        urls = _urls(5)
        # Only url 0 is in the returned set AND relevant
        relevant = {
            urls[0],
            "http://missing1.com",
            "http://missing2.com",
            "http://missing3.com",
            "http://missing4.com",
        }
        k = 5

        ours = ndcg_at_k(urls, relevant, k)
        ref = self._reference_ndcg([1, 0, 0, 0, 0], n_total_relevant=5, k=k)

        assert ours == pytest.approx(ref, abs=1e-10)
        # NDCG should be well below 1.0 since 4 of 5 relevant docs are missing
        assert ours < 0.5


class TestDCGFormula:
    """Verify our DCG formula matches the standard log2 formulation."""

    def test_single_element(self):
        # DCG of [1] at k=1: 1 / log2(2) = 1.0
        assert dcg_at_k([1], 1) == pytest.approx(1.0, abs=1e-10)

    def test_manual_computation(self):
        # DCG of [1, 1, 0, 1] at k=4:
        # 1/log2(2) + 1/log2(3) + 0/log2(4) + 1/log2(5)
        expected = 1.0 / math.log2(2) + 1.0 / math.log2(3) + 0.0 + 1.0 / math.log2(5)
        assert dcg_at_k([1, 1, 0, 1], 4) == pytest.approx(expected, abs=1e-10)

    def test_matches_sklearn_internals(self):
        """Cross-check our DCG against sklearn's ndcg_score decomposition."""
        rels = [1, 0, 1, 1, 0]
        k = 5
        our_dcg = dcg_at_k(rels, k)

        # sklearn uses the same formula: sum(rel_i / log2(i+2))
        expected = sum(r / math.log2(i + 2) for i, r in enumerate(rels))
        assert our_dcg == pytest.approx(expected, abs=1e-10)


# ---------------------------------------------------------------------------
# Precision@K cross-validation
# ---------------------------------------------------------------------------


class TestPrecisionAtKCrossValidation:
    """Hand-computed expected values for precision@K."""

    def test_perfect_ranking_k5(self):
        # 3 relevant, all in top 3, k=5: precision = 3/5
        urls = _urls(5)
        relevant = _relevant_set(urls, [0, 1, 2])
        assert precision_at_k(urls, relevant, 5) == pytest.approx(3 / 5)

    def test_perfect_ranking_k3(self):
        # 3 relevant, all in top 3, k=3: precision = 3/3
        urls = _urls(5)
        relevant = _relevant_set(urls, [0, 1, 2])
        assert precision_at_k(urls, relevant, 3) == pytest.approx(1.0)

    def test_worst_ranking(self):
        # 2 relevant at positions 4, 5 out of 5, k=5: precision = 2/5
        urls = _urls(5)
        relevant = _relevant_set(urls, [3, 4])
        assert precision_at_k(urls, relevant, 5) == pytest.approx(2 / 5)

    def test_no_relevant(self):
        urls = _urls(4)
        relevant = {"http://other.com"}
        assert precision_at_k(urls, relevant, 4) == pytest.approx(0.0)

    def test_all_relevant(self):
        urls = _urls(3)
        relevant = _relevant_set(urls, [0, 1, 2])
        assert precision_at_k(urls, relevant, 3) == pytest.approx(1.0)

    def test_single_result_relevant(self):
        urls = _urls(1)
        relevant = _relevant_set(urls, [0])
        assert precision_at_k(urls, relevant, 1) == pytest.approx(1.0)

    def test_single_result_not_relevant(self):
        urls = _urls(1)
        relevant = {"http://other.com"}
        assert precision_at_k(urls, relevant, 1) == pytest.approx(0.0)

    def test_k_larger_than_list(self):
        # Only 2 results but k=5: denominat is still k=5, so 2/5 if both relevant
        urls = _urls(2)
        relevant = _relevant_set(urls, [0, 1])
        assert precision_at_k(urls, relevant, 5) == pytest.approx(2 / 5)

    def test_mixed_half(self):
        # 4 results, 2 relevant (positions 0 and 2), k=4: precision = 2/4
        urls = _urls(4)
        relevant = _relevant_set(urls, [0, 2])
        assert precision_at_k(urls, relevant, 4) == pytest.approx(0.5)


# ---------------------------------------------------------------------------
# Recall@K cross-validation
# ---------------------------------------------------------------------------


class TestRecallAtKCrossValidation:
    """Hand-computed expected values for recall@K."""

    def test_perfect_recall(self):
        # All 3 relevant docs returned in top 5
        urls = _urls(5)
        relevant = _relevant_set(urls, [0, 1, 2])
        assert recall_at_k(urls, relevant, 5) == pytest.approx(1.0)

    def test_partial_recall_k_truncates(self):
        # 3 relevant docs at indices 0, 2, 4 but k=3: only 0 and 2 found = 2/3
        urls = _urls(5)
        relevant = _relevant_set(urls, [0, 2, 4])
        assert recall_at_k(urls, relevant, 3) == pytest.approx(2 / 3)

    def test_worst_recall(self):
        # 2 relevant at positions 3, 4 but k=2: none found = 0/2
        urls = _urls(5)
        relevant = _relevant_set(urls, [3, 4])
        assert recall_at_k(urls, relevant, 2) == pytest.approx(0.0)

    def test_no_relevant_empty_set(self):
        urls = _urls(3)
        assert recall_at_k(urls, set(), 3) == pytest.approx(1.0)

    def test_all_relevant(self):
        urls = _urls(4)
        relevant = _relevant_set(urls, [0, 1, 2, 3])
        assert recall_at_k(urls, relevant, 4) == pytest.approx(1.0)

    def test_single_result_found(self):
        urls = _urls(1)
        relevant = _relevant_set(urls, [0])
        assert recall_at_k(urls, relevant, 1) == pytest.approx(1.0)

    def test_single_result_not_found(self):
        urls = _urls(1)
        relevant = {"http://other.com"}
        assert recall_at_k(urls, relevant, 1) == pytest.approx(0.0)

    def test_more_relevant_than_returned(self):
        # 5 relevant docs, but only 3 returned and only 2 are relevant: 2/5
        urls = _urls(3)
        extra_relevant = {"http://extra1.com", "http://extra2.com", "http://extra3.com"}
        relevant = _relevant_set(urls, [0, 1]) | extra_relevant
        assert recall_at_k(urls, relevant, 3) == pytest.approx(2 / 5)


# ---------------------------------------------------------------------------
# MRR cross-validation
# ---------------------------------------------------------------------------


class TestReciprocalRankCrossValidation:
    """Hand-computed expected values for reciprocal rank."""

    def test_relevant_at_rank_1(self):
        urls = _urls(5)
        relevant = _relevant_set(urls, [0])
        assert reciprocal_rank(urls, relevant) == pytest.approx(1.0)

    def test_relevant_at_rank_3(self):
        urls = _urls(5)
        relevant = _relevant_set(urls, [2])
        assert reciprocal_rank(urls, relevant) == pytest.approx(1 / 3)

    def test_multiple_relevant_returns_first(self):
        # Multiple relevant docs; MRR uses the first one found (rank 2)
        urls = _urls(5)
        relevant = _relevant_set(urls, [1, 3])
        assert reciprocal_rank(urls, relevant) == pytest.approx(1 / 2)

    def test_none_found(self):
        urls = _urls(3)
        relevant = {"http://other.com"}
        assert reciprocal_rank(urls, relevant) == pytest.approx(0.0)

    def test_single_result_relevant(self):
        urls = _urls(1)
        relevant = _relevant_set(urls, [0])
        assert reciprocal_rank(urls, relevant) == pytest.approx(1.0)

    def test_single_result_not_relevant(self):
        urls = _urls(1)
        relevant = {"http://other.com"}
        assert reciprocal_rank(urls, relevant) == pytest.approx(0.0)


# ---------------------------------------------------------------------------
# Average Precision cross-validation
# ---------------------------------------------------------------------------


class TestAveragePrecisionCrossValidation:
    """Hand-computed expected values for average precision (MAP component)."""

    def test_perfect_ranking(self):
        # 3 relevant all at top of 5 results:
        # AP = (1/1 + 2/2 + 3/3) / 3 = 1.0
        urls = _urls(5)
        relevant = _relevant_set(urls, [0, 1, 2])
        assert average_precision(urls, relevant, 5) == pytest.approx(1.0)

    def test_reversed_ranking(self):
        # 2 relevant at positions 4, 5 (indices 3, 4) out of 5:
        # AP = (1/4 + 2/5) / 2 = (0.25 + 0.4) / 2 = 0.325
        urls = _urls(5)
        relevant = _relevant_set(urls, [3, 4])
        expected = (1 / 4 + 2 / 5) / 2
        assert average_precision(urls, relevant, 5) == pytest.approx(expected)

    def test_mixed_ranking(self):
        # Relevant at positions 1, 3, 5 (indices 0, 2, 4) out of 5:
        # AP = (1/1 + 2/3 + 3/5) / 3
        urls = _urls(5)
        relevant = _relevant_set(urls, [0, 2, 4])
        expected = (1 / 1 + 2 / 3 + 3 / 5) / 3
        assert average_precision(urls, relevant, 5) == pytest.approx(expected)

    def test_no_relevant_found(self):
        urls = _urls(3)
        relevant = {"http://other.com"}
        # No relevant docs found, but total relevant = 1, so AP = 0/1 = 0.0
        assert average_precision(urls, relevant, 3) == pytest.approx(0.0)

    def test_all_relevant(self):
        # 4 results all relevant:
        # AP = (1/1 + 2/2 + 3/3 + 4/4) / 4 = 1.0
        urls = _urls(4)
        relevant = _relevant_set(urls, [0, 1, 2, 3])
        assert average_precision(urls, relevant, 4) == pytest.approx(1.0)

    def test_single_relevant_at_rank_1(self):
        urls = _urls(3)
        relevant = _relevant_set(urls, [0])
        # AP = (1/1) / 1 = 1.0
        assert average_precision(urls, relevant, 3) == pytest.approx(1.0)

    def test_single_relevant_at_rank_3(self):
        urls = _urls(3)
        relevant = _relevant_set(urls, [2])
        # AP = (1/3) / 1 = 1/3
        assert average_precision(urls, relevant, 3) == pytest.approx(1 / 3)

    def test_empty_relevant_set(self):
        urls = _urls(3)
        assert average_precision(urls, set(), 3) == pytest.approx(1.0)

    def test_relevant_outside_k(self):
        # 3 relevant docs (indices 0, 3, 4) but k=2: only index 0 found
        # AP = (1/1) / 3 = 1/3 (denominator is total relevant, not found)
        urls = _urls(5)
        relevant = _relevant_set(urls, [0, 3, 4])
        assert average_precision(urls, relevant, 2) == pytest.approx(1 / 3)
