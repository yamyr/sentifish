import pytest

from app.config import settings


@pytest.fixture(autouse=True)
def _isolate_results(tmp_path):
    """Point results_dir to a temp directory for each test."""
    original = settings.results_dir
    settings.results_dir = str(tmp_path / "results")
    yield
    settings.results_dir = original
