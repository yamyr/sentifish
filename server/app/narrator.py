"""Narration generation and ElevenLabs TTS synthesis for eval runs."""

from __future__ import annotations

import httpx
from fastapi import HTTPException

from .config import settings
from .models import EvalRun, RunStatus


def generate_narration(run: EvalRun) -> str:
    """Produce a natural, spoken-word narration script from an EvalRun."""

    if run.status != RunStatus.COMPLETED:
        return "This evaluation is still in progress."

    summary = run.summary
    if not summary:
        return "No results available yet."

    providers = list(summary.keys())
    num_queries = int(next(iter(summary.values())).get("total_queries", 0))
    provider_list = ", ".join(providers[:-1]) + f", and {providers[-1]}" if len(providers) > 1 else providers[0]

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
    """Call ElevenLabs TTS API and return raw MP3 audio bytes."""

    api_key = settings.elevenlabs_api_key
    voice_id = settings.elevenlabs_voice_id
    model_id = settings.elevenlabs_model_id

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

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
