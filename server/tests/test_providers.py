from app.providers import _parse_tinyfish_results, TinyfishProvider, available_providers


class TestParseTinyfishResults:
    def test_list_of_dicts(self):
        event = {
            "type": "COMPLETE",
            "result": [
                {"url": "https://a.com", "title": "A", "snippet": "desc A"},
                {"url": "https://b.com", "title": "B", "snippet": "desc B"},
            ],
        }
        results = _parse_tinyfish_results(event, top_k=10)
        assert len(results) == 2
        assert results[0].url == "https://a.com"
        assert results[0].title == "A"
        assert results[0].snippet == "desc A"
        assert results[0].rank == 1
        assert results[1].rank == 2

    def test_json_string_result(self):
        event = {
            "type": "COMPLETE",
            "result": '[{"url": "https://x.com", "title": "X", "snippet": "s"}]',
        }
        results = _parse_tinyfish_results(event, top_k=5)
        assert len(results) == 1
        assert results[0].url == "https://x.com"

    def test_dict_with_results_key(self):
        event = {
            "type": "COMPLETE",
            "result": {
                "results": [
                    {"url": "https://a.com", "title": "A", "snippet": "s"},
                ]
            },
        }
        results = _parse_tinyfish_results(event, top_k=10)
        assert len(results) == 1

    def test_respects_top_k(self):
        event = {
            "type": "COMPLETE",
            "result": [
                {"url": f"https://{i}.com", "title": str(i), "snippet": ""} for i in range(20)
            ],
        }
        results = _parse_tinyfish_results(event, top_k=5)
        assert len(results) == 5

    def test_skips_entries_without_url(self):
        event = {
            "type": "COMPLETE",
            "result": [
                {"title": "no url", "snippet": "missing"},
                {"url": "https://a.com", "title": "has url", "snippet": "ok"},
            ],
        }
        results = _parse_tinyfish_results(event, top_k=10)
        assert len(results) == 1
        assert results[0].url == "https://a.com"

    def test_none_result(self):
        event = {"type": "COMPLETE", "result": None}
        assert _parse_tinyfish_results(event, top_k=10) == []

    def test_unparseable_string(self):
        event = {"type": "COMPLETE", "result": "not json at all"}
        assert _parse_tinyfish_results(event, top_k=10) == []

    def test_alternative_field_names(self):
        event = {
            "type": "COMPLETE",
            "result": [
                {"link": "https://a.com", "title": "A", "description": "desc"},
                {"href": "https://b.com", "title": "B", "description": "desc B"},
            ],
        }
        results = _parse_tinyfish_results(event, top_k=10)
        assert len(results) == 2
        assert results[0].url == "https://a.com"
        assert results[1].url == "https://b.com"
        assert results[0].snippet == "desc"


class TestTinyfishProviderRegistered:
    def test_name(self):
        provider = TinyfishProvider()
        assert provider.name == "tinyfish"

    def test_in_available_when_key_set(self, monkeypatch):
        monkeypatch.setattr("app.providers.settings.tinyfish_api_key", "test-key")
        assert "tinyfish" in available_providers()

    def test_not_available_without_key(self, monkeypatch):
        monkeypatch.setattr("app.providers.settings.tinyfish_api_key", "")
        assert "tinyfish" not in available_providers()
