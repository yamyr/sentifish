from app.custom_executor import _extract_results, _interpolate


def test_interpolate():
    template = '{"q": "{query}", "k": {top_k}}'
    result = _interpolate(template, {"query": "hello world", "top_k": "10"})
    assert result == '{"q": "hello world", "k": 10}'


def test_extract_results_list_of_dicts():
    data = [{"url": "https://example.com", "title": "Example", "snippet": "A site"}]
    results = _extract_results(data, "", 10)
    assert len(results) == 1
    assert results[0].url == "https://example.com"


def test_extract_results_nested():
    data = {"results": [{"url": "https://a.com"}, {"url": "https://b.com"}]}
    results = _extract_results(data, "", 10)
    assert len(results) == 2


def test_extract_results_jsonpath():
    data = {"hits": {"items": [{"link": "https://x.com", "title": "X"}]}}
    results = _extract_results(data, "hits.items[*]", 10)
    assert len(results) == 1
