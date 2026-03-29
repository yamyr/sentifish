"""Execute custom HTTP tool integrations.

Handles arbitrary REST/JSON APIs by interpolating request templates
and extracting results via JSONPath expressions.
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

import httpx
import jsonpath_ng  # noqa: F401

from .config import settings
from .models import SearchResult, ToolDefinition

logger = logging.getLogger(__name__)


def _interpolate(template: str, variables: dict[str, str]) -> str:
    result = template
    for key, value in variables.items():
        result = result.replace(f"{{{key}}}", value)
    return result


def _extract_results(response_data: Any, response_path: str, top_k: int) -> list[SearchResult]:
    if not response_path:
        if isinstance(response_data, list):
            items = response_data[:top_k]
        elif isinstance(response_data, dict):
            for key in ["results", "items", "data", "hits", "documents"]:
                if key in response_data and isinstance(response_data[key], list):
                    items = response_data[key][:top_k]
                    break
            else:
                items = [response_data]
        else:
            return []
    else:
        try:
            from jsonpath_ng import parse as jp_parse

            expr = jp_parse(response_path)
            items = [m.value for m in expr.find(response_data)][:top_k]
        except Exception as e:
            logger.warning("JSONPath extraction failed: %s", e)
            items = []

    results = []
    for i, item in enumerate(items):
        if isinstance(item, str):
            results.append(SearchResult(url=item, title=item, snippet="", rank=i + 1))
        elif isinstance(item, dict):
            results.append(
                SearchResult(
                    url=item.get("url", item.get("link", item.get("href", ""))),
                    title=item.get("title", item.get("name", "")),
                    snippet=item.get("snippet", item.get("description", item.get("content", ""))),
                    rank=i + 1,
                )
            )
    return results


async def execute_custom_tool(
    tool: ToolDefinition,
    query: str,
    top_k: int = 10,
) -> tuple[list[SearchResult], float]:
    if not tool.endpoint_url:
        raise ValueError(f"Tool {tool.slug} has no endpoint_url configured")

    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if tool.auth_header:
        try:
            header_name, header_value = tool.auth_header.split(":", 1)
            env_key = os.environ.get(f"{tool.slug.upper().replace('-', '_')}_API_KEY", "")
            header_value = _interpolate(header_value.strip(), {"key": env_key})
            headers[header_name.strip()] = header_value
        except ValueError:
            pass

    variables = {"query": query, "top_k": str(top_k), "k": str(top_k)}

    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            if tool.request_template:
                body_str = _interpolate(tool.request_template, variables)
                body = json.loads(body_str)
                resp = await client.post(tool.endpoint_url, json=body, headers=headers)
            else:
                resp = await client.get(
                    tool.endpoint_url,
                    params={"q": query, "query": query, "top_k": top_k},
                    headers=headers,
                )
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:
        latency = (time.perf_counter() - start) * 1000
        logger.warning("Custom tool %s failed: %s", tool.slug, exc)
        return [], latency

    latency = (time.perf_counter() - start) * 1000
    results = _extract_results(data, tool.response_path, top_k)
    return results, latency
