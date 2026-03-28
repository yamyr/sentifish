"""Narration generation, caching, and ElevenLabs TTS synthesis for eval runs."""

from __future__ import annotations

import json
import logging
from pathlib import Path

import httpx
from fastapi import HTTPException

from .config import settings
from .models import EvalRun, RunStatus

logger = logging.getLogger(__name__)


def _narration_dir(run_id: str) -> Path:
    """Return the directory where narration artifacts live for a run."""
    return Path(settings.results_dir) / "narrations" / run_id


def _ensure_narration_dir(run_id: str) -> Path:
    """Create and return the narration cache directory for a run."""
    d = _narration_dir(run_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_cached_text(run_id: str) -> str | None:
    """Return cached narration text, or None if not yet generated."""
    p = _narration_dir(run_id) / "narration.json"
    try:
        if p.is_file():
            data = json.loads(p.read_text())
            return data.get("text")
    except OSError:
        pass
    return None


def save_cached_text(run_id: str, text: str) -> None:
    """Persist narration text to disk."""
    try:
        p = _ensure_narration_dir(run_id) / "narration.json"
        p.write_text(json.dumps({"text": text}))
        logger.info("Cached narration text for run %s", run_id)
    except OSError as exc:
        logger.warning("Could not cache narration text for run %s: %s", run_id, exc)


def get_cached_audio(run_id: str) -> bytes | None:
    """Return cached MP3 audio bytes, or None if not yet synthesized."""
    p = _narration_dir(run_id) / "narration.mp3"
    try:
        if p.is_file():
            return p.read_bytes()
    except OSError:
        pass
    return None


def save_cached_audio(run_id: str, audio: bytes) -> None:
    """Persist MP3 audio to disk."""
    try:
        p = _ensure_narration_dir(run_id) / "narration.mp3"
        p.write_bytes(audio)
        logger.info("Cached narration audio for run %s (%d bytes)", run_id, len(audio))
    except OSError as exc:
        logger.warning("Could not cache narration audio for run %s: %s", run_id, exc)


def generate_narration(run: EvalRun) -> str:
    """Produce a natural, spoken-word narration script from an EvalRun."""

    if run.status != RunStatus.COMPLETED:
        return "This evaluation is still in progress."

    summary = run.summary
    if not summary:
        return "No results available yet."

    providers = list(summary.keys())
    num_queries = int(next(iter(summary.values())).get("total_queries", 0))
    provider_list = (
        ", ".join(providers[:-1]) + f", and {providers[-1]}" if len(providers) > 1 else providers[0]
    )

    lines: list[str] = []

    # Intro
    lines.append(
        f"Here are the results for the {run.dataset_name} evaluation "
        f"with {num_queries} queries across {provider_list}."
    )

    # Per-provider metrics
    for provider, metrics in summary.items():
        precision = metrics.get("mean_precision_at_k", 0.0)
        recall = metrics.get("mean_recall_at_k", 0.0)
        ndcg = metrics.get("mean_ndcg_at_k", 0.0)
        mrr = metrics.get("mean_mrr", 0.0)
        latency = metrics.get("mean_latency_ms", 0.0)

        lines.append(
            f"{provider.capitalize()} achieved a precision of {precision:.2f}, "
            f"recall of {recall:.2f}, NDCG of {ndcg:.2f}, and MRR of {mrr:.2f}, "
            f"with an average latency of {latency:.0f} milliseconds."
        )

    # Comparative insight
    best_ndcg_provider = max(summary, key=lambda p: summary[p].get("mean_ndcg_at_k", 0.0))
    fastest_provider = min(summary, key=lambda p: summary[p].get("mean_latency_ms", float("inf")))

    best_ndcg = summary[best_ndcg_provider]["mean_ndcg_at_k"]
    fastest_latency = summary[fastest_provider]["mean_latency_ms"]

    if best_ndcg_provider == fastest_provider:
        lines.append(
            f"Overall, {best_ndcg_provider.capitalize()} leads in both relevance and speed, "
            f"with the highest NDCG of {best_ndcg:.2f} and the lowest latency of "
            f"{fastest_latency:.0f} milliseconds."
        )
    else:
        lines.append(
            f"Overall, {best_ndcg_provider.capitalize()} delivered the best relevance "
            f"with an NDCG of {best_ndcg:.2f}, while {fastest_provider.capitalize()} "
            f"was the fastest at {fastest_latency:.0f} milliseconds. "
            f"This presents a classic tradeoff between quality and speed."
        )

    return " ".join(lines)


async def synthesize_speech(text: str) -> bytes:
    """Call ElevenLabs TTS API and return raw MP3 audio bytes.

    Uses the fine-tuned ElevenLabs agent when agent_id is configured,
    otherwise falls back to the standard text-to-speech endpoint.
    """

    api_key = settings.elevenlabs_api_key
    voice_id = settings.elevenlabs_voice_id
    model_id = settings.elevenlabs_model_id
    agent_id = settings.elevenlabs_agent_id

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    if agent_id:
        # Use the fine-tuned ElevenLabs conversational agent
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        payload = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.3,
            },
            "agent_id": agent_id,
        }
    else:
        # Standard TTS fallback
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        payload = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.3,
            },
        }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
                params={"output_format": "mp3_44100_128"},
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"ElevenLabs API error: {exc.response.text}",
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to reach ElevenLabs API: {exc}",
            )

    return response.content
