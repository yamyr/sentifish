"""Information retrieval scoring functions.

All scorers operate on a list of returned URLs and a set of relevant URLs.
Scores are in [0.0, 1.0] range.
"""

from __future__ import annotations

import math
from urllib.parse import urlparse


def _normalize_url(url: str) -> str:
    """Normalize a URL for comparison: strip scheme, trailing slash, www prefix."""
    parsed = urlparse(url.lower().strip())
    host = parsed.netloc.removeprefix("www.")
    path = parsed.path.rstrip("/")
    return f"{host}{path}"


def _build_relevance_vector(returned_urls: list[str], relevant_urls: set[str]) -> list[int]:
    """Build a binary relevance vector: 1 if returned URL is relevant, 0 otherwise."""
    relevant_normalized = {_normalize_url(u) for u in relevant_urls}
    return [1 if _normalize_url(u) in relevant_normalized else 0 for u in returned_urls]


def precision_at_k(returned_urls: list[str], relevant_urls: set[str], k: int) -> float:
    """Precision@K: fraction of top-K results that are relevant."""
    if k <= 0:
        return 0.0
    rels = _build_relevance_vector(returned_urls[:k], relevant_urls)
    return sum(rels) / k


def recall_at_k(returned_urls: list[str], relevant_urls: set[str], k: int) -> float:
    """Recall@K: fraction of all relevant URLs that appear in top-K results."""
    if not relevant_urls:
        return 1.0  # no relevant URLs → trivially complete recall
    rels = _build_relevance_vector(returned_urls[:k], relevant_urls)
    return sum(rels) / len(relevant_urls)


def mrr(returned_urls: list[str], relevant_urls: set[str]) -> float:
    """Mean Reciprocal Rank: 1/rank of the first relevant result."""
    rels = _build_relevance_vector(returned_urls, relevant_urls)
    for i, rel in enumerate(rels):
        if rel == 1:
            return 1.0 / (i + 1)
    return 0.0


def dcg_at_k(relevances: list[int], k: int) -> float:
    """Discounted Cumulative Gain at K."""
    return sum(rel / math.log2(i + 2) for i, rel in enumerate(relevances[:k]))


def ndcg_at_k(returned_urls: list[str], relevant_urls: set[str], k: int) -> float:
    """Normalized Discounted Cumulative Gain at K."""
    if k <= 0 or not relevant_urls:
        return 0.0 if relevant_urls else 1.0

    rels = _build_relevance_vector(returned_urls[:k], relevant_urls)
    actual_dcg = dcg_at_k(rels, k)

    # Ideal: all relevant docs at the top
    ideal_rels = sorted(rels, reverse=True)
    ideal_dcg = dcg_at_k(ideal_rels, k)

    if ideal_dcg == 0.0:
        return 0.0
    return actual_dcg / ideal_dcg


def average_precision(returned_urls: list[str], relevant_urls: set[str], k: int) -> float:
    """Average Precision@K: area under the precision-recall curve at K.

    For each relevant document found in the top-K, compute precision at that
    rank and average over all relevant documents in the ground truth.
    """
    if not relevant_urls:
        return 1.0
    rels = _build_relevance_vector(returned_urls[:k], relevant_urls)
    running_relevant = 0
    precision_sum = 0.0
    for i, rel in enumerate(rels):
        if rel == 1:
            running_relevant += 1
            precision_sum += running_relevant / (i + 1)
    return precision_sum / len(relevant_urls)


def score_query(returned_urls: list[str], relevant_urls: set[str], k: int) -> dict[str, float]:
    """Compute all metrics for a single query."""
    return {
        "precision_at_k": precision_at_k(returned_urls, relevant_urls, k),
        "recall_at_k": recall_at_k(returned_urls, relevant_urls, k),
        "ndcg_at_k": ndcg_at_k(returned_urls, relevant_urls, k),
        "mrr": mrr(returned_urls, relevant_urls),
        "map_at_k": average_precision(returned_urls, relevant_urls, k),
    }
