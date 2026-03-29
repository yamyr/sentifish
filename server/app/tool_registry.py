"""Tool registry: manages user-defined tools to compare."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from .config import settings
from .models import ToolCategory, ToolDefinition

logger = logging.getLogger(__name__)

_tools: dict[str, ToolDefinition] = {}
_TOOLS_FILE: Path | None = None


def _get_tools_file() -> Path:
    global _TOOLS_FILE
    if _TOOLS_FILE is None:
        _TOOLS_FILE = Path(settings.results_dir) / "tools.json"
    return _TOOLS_FILE


def _init_builtins() -> None:
    builtins = [
        ToolDefinition(
            slug="brave",
            name="Brave Search",
            category=ToolCategory.SEARCH,
            output_type="url_list",
            builtin_provider="brave",
            is_builtin=True,
        ),
        ToolDefinition(
            slug="serper",
            name="Serper",
            category=ToolCategory.SEARCH,
            output_type="url_list",
            builtin_provider="serper",
            is_builtin=True,
        ),
        ToolDefinition(
            slug="serpapi",
            name="SerpAPI",
            category=ToolCategory.SEARCH,
            output_type="url_list",
            builtin_provider="serpapi",
            is_builtin=True,
        ),
        ToolDefinition(
            slug="tavily",
            name="Tavily",
            category=ToolCategory.SEARCH,
            output_type="url_list",
            builtin_provider="tavily",
            is_builtin=True,
        ),
        ToolDefinition(
            slug="exa",
            name="Exa",
            category=ToolCategory.SEARCH,
            output_type="url_list",
            builtin_provider="exa",
            is_builtin=True,
        ),
        ToolDefinition(
            slug="tinyfish",
            name="TinyFish (Web Agent)",
            category=ToolCategory.SEARCH,
            output_type="url_list",
            builtin_provider="tinyfish",
            is_builtin=True,
        ),
    ]
    for t in builtins:
        _tools[t.slug] = t


def list_tools() -> list[ToolDefinition]:
    return list(_tools.values())


def get_tool(slug: str) -> ToolDefinition | None:
    return _tools.get(slug)


def register_tool(tool: ToolDefinition) -> ToolDefinition:
    _tools[tool.slug] = tool
    _persist()
    return tool


def delete_tool(slug: str) -> bool:
    t = _tools.pop(slug, None)
    if t and not t.is_builtin:
        _persist()
        return True
    if t and t.is_builtin:
        _tools[slug] = t
    return False


def _persist() -> None:
    tools_file = _get_tools_file()
    tools_file.parent.mkdir(parents=True, exist_ok=True)
    custom = [t.model_dump() for t in _tools.values() if not t.is_builtin]
    tools_file.write_text(json.dumps(custom, indent=2))


def load_persisted_tools() -> None:
    _init_builtins()
    tools_file = _get_tools_file()
    if tools_file.exists():
        for data in json.loads(tools_file.read_text()):
            try:
                t = ToolDefinition(**data)
                _tools[t.slug] = t
            except Exception as e:
                logger.warning("Failed to load tool: %s", e)
