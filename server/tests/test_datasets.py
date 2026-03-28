import pytest

from app.datasets import (
    delete_dataset,
    list_datasets,
    load_dataset,
    load_dataset_from_dict,
    save_dataset,
)
from app.models import Dataset, QueryCase


class TestLoadDataset:
    def test_load_sample(self):
        ds = load_dataset("sample")
        assert ds.name == "sample"
        assert ds.size > 0
        assert all(isinstance(c, QueryCase) for c in ds.cases)

    def test_missing_dataset(self):
        with pytest.raises(FileNotFoundError, match="not_real"):
            load_dataset("not_real")


class TestListDatasets:
    def test_includes_sample(self):
        names = list_datasets()
        assert "sample" in names


class TestLoadFromDict:
    def test_round_trip(self):
        data = {
            "name": "test",
            "description": "test dataset",
            "cases": [
                {"query": "hello", "relevant_urls": ["https://example.com"]},
            ],
        }
        ds = load_dataset_from_dict(data)
        assert ds.name == "test"
        assert ds.size == 1


class TestSaveAndDelete:
    def test_save_then_load(self, tmp_path, monkeypatch):
        import app.datasets as ds_mod

        monkeypatch.setattr(ds_mod, "_DATASETS_DIR", tmp_path)

        dataset = Dataset(
            name="ephemeral",
            description="temp",
            cases=[QueryCase(query="q", relevant_urls=["https://a.com"])],
        )
        save_dataset(dataset)
        loaded = load_dataset("ephemeral")
        assert loaded.name == "ephemeral"
        assert loaded.size == 1

    def test_delete(self, tmp_path, monkeypatch):
        import app.datasets as ds_mod

        monkeypatch.setattr(ds_mod, "_DATASETS_DIR", tmp_path)

        dataset = Dataset(name="to_delete", cases=[])
        save_dataset(dataset)
        assert delete_dataset("to_delete") is True
        assert delete_dataset("to_delete") is False
