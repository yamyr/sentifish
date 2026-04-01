"""Tests for the scheduler module."""

from app.models import EvalSchedule
from app import scheduler


def test_create_and_list_schedule(tmp_path, monkeypatch):
    """Create a schedule and verify it appears in the list."""
    monkeypatch.setattr(scheduler, "_schedules", {})
    monkeypatch.setattr(scheduler, "_SCHEDULES_DIR", tmp_path)

    s = EvalSchedule(
        name="test-schedule",
        dataset_name="sample",
        providers=["brave"],
        interval_minutes=60,
    )
    scheduler.create_schedule(s)

    schedules = scheduler.list_schedules()
    assert len(schedules) == 1
    assert schedules[0].name == "test-schedule"
    assert schedules[0].enabled is True


def test_toggle_schedule(tmp_path, monkeypatch):
    """Toggle a schedule's enabled state."""
    monkeypatch.setattr(scheduler, "_schedules", {})
    monkeypatch.setattr(scheduler, "_SCHEDULES_DIR", tmp_path)

    s = EvalSchedule(
        name="toggle-test",
        dataset_name="sample",
        providers=["serper"],
        interval_minutes=30,
    )
    scheduler.create_schedule(s)
    assert s.enabled is True

    toggled = scheduler.toggle_schedule(s.id)
    assert toggled is not None
    assert toggled.enabled is False

    toggled2 = scheduler.toggle_schedule(s.id)
    assert toggled2 is not None
    assert toggled2.enabled is True


def test_delete_schedule(tmp_path, monkeypatch):
    """Delete a schedule."""
    monkeypatch.setattr(scheduler, "_schedules", {})
    monkeypatch.setattr(scheduler, "_SCHEDULES_DIR", tmp_path)

    s = EvalSchedule(
        name="delete-test",
        dataset_name="sample",
        providers=["tavily"],
        interval_minutes=360,
    )
    scheduler.create_schedule(s)
    assert len(scheduler.list_schedules()) == 1

    result = scheduler.delete_schedule(s.id)
    assert result is True
    assert len(scheduler.list_schedules()) == 0


def test_delete_nonexistent(tmp_path, monkeypatch):
    """Deleting a nonexistent schedule returns False."""
    monkeypatch.setattr(scheduler, "_schedules", {})
    assert scheduler.delete_schedule("nonexistent-id") is False


def test_load_persisted(tmp_path, monkeypatch):
    """Schedules persist to disk and reload."""
    monkeypatch.setattr(scheduler, "_schedules", {})
    monkeypatch.setattr(scheduler, "_SCHEDULES_DIR", tmp_path)

    s = EvalSchedule(
        name="persist-test",
        dataset_name="sample",
        providers=["brave", "serper"],
        interval_minutes=720,
    )
    scheduler.create_schedule(s)

    # Clear in-memory state
    monkeypatch.setattr(scheduler, "_schedules", {})
    assert len(scheduler.list_schedules()) == 0

    # Reload from disk
    count = scheduler.load_persisted_schedules()
    assert count == 1
    assert scheduler.list_schedules()[0].name == "persist-test"
