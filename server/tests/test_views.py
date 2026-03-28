"""API route tests for dataset and provider endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestListDatasetsAPI:
    def test_returns_full_objects(self):
        resp = client.get("/api/datasets")
        assert resp.status_code == 200
        data = resp.json()
        assert "datasets" in data
        assert len(data["datasets"]) > 0
        # Each dataset must be a dict with name, not a plain string
        for ds in data["datasets"]:
            assert isinstance(ds, dict)
            assert "name" in ds
            assert "cases" in ds

    def test_sample_dataset_present(self):
        resp = client.get("/api/datasets")
        names = [ds["name"] for ds in resp.json()["datasets"]]
        assert "sample" in names


class TestGetDatasetAPI:
    def test_get_sample(self):
        resp = client.get("/api/datasets/sample")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "sample"
        assert len(data["cases"]) > 0

    def test_not_found(self):
        resp = client.get("/api/datasets/nonexistent")
        assert resp.status_code == 404


class TestListProvidersAPI:
    def test_returns_list(self):
        resp = client.get("/api/providers")
        assert resp.status_code == 200
        data = resp.json()
        assert "providers" in data
        assert isinstance(data["providers"], list)
