"""Dataset loading and management.

Datasets are JSON files with a name, description, and list of query cases.
They live in the server/datasets/ directory and are loaded on demand.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path

from .models import Dataset

logger = logging.getLogger(__name__)

_SAFE_NAME = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_\- ]{0,98}[a-zA-Z0-9]$")


def _validate_name(name: str) -> str:
    """Ensure dataset name is safe for filesystem use."""
    if not _SAFE_NAME.match(name):
        raise ValueError("Invalid dataset name: must be alphanumeric with hyphens/underscores, 2-100 chars")
    return name

_DATASETS_DIR = Path(__file__).resolve().parent.parent / "datasets"


def list_datasets() -> list[str]:
    """Return names of all available datasets."""
    if not _DATASETS_DIR.is_dir():
        return []
    return sorted(p.stem for p in _DATASETS_DIR.glob("*.json"))


def load_dataset(name: str) -> Dataset:
    """Load a dataset by name from the datasets directory."""
    _validate_name(name)
    path = _DATASETS_DIR / f"{name}.json"
    if not path.is_file():
        raise FileNotFoundError(f"Dataset not found: {name!r}. Available: {list_datasets()}")
    data = json.loads(path.read_text())
    return Dataset(**data)


def load_dataset_from_dict(data: dict) -> Dataset:
    """Load a dataset from a raw dictionary (e.g., from API request body)."""
    return Dataset(**data)


def save_dataset(dataset: Dataset) -> Path:
    """Persist a dataset to the datasets directory."""
    _validate_name(dataset.name)
    _DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    path = _DATASETS_DIR / f"{dataset.name}.json"
    path.write_text(dataset.model_dump_json(indent=2))
    logger.info("Saved dataset %r (%d cases) to %s", dataset.name, dataset.size, path)
    return path


def delete_dataset(name: str) -> bool:
    """Delete a dataset file. Returns True if deleted, False if not found."""
    _validate_name(name)
    path = _DATASETS_DIR / f"{name}.json"
    if path.is_file():
        path.unlink()
        return True
    return False
