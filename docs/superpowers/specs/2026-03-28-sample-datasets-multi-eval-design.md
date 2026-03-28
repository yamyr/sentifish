# Sample Datasets + Multi-Dataset Evaluation

**Date:** 2026-03-28
**Status:** Approved

## Summary

Add 6 curated sample datasets and enable multi-dataset parallel evaluation.

## Datasets

### Real-world use-case themed
1. **developer-tools** — Framework docs, debugging, API references (8 queries)
2. **news-and-current-events** — Fact-checking, trending topics, explainers (8 queries)
3. **academic-research** — Papers, scientific concepts, literature reviews (8 queries)

### Industry-focused
4. **startup-founder** — Market research, fundraising, competitor analysis (8 queries)
5. **ml-engineer** — Model benchmarks, implementations, tooling (8 queries)
6. **product-designer** — UX patterns, design systems, accessibility (8 queries)

Each dataset: 8 queries with 2-4 curated relevant_urls per query, descriptive tags.

## Backend Changes

### New endpoint behavior
- `POST /api/runs` accepts either `dataset: str` (existing) or `datasets: list[str]` (new)
- When `datasets` provided: create one EvalRun per dataset, all fire in parallel
- Response: `{"runs": [{"id": ..., "dataset": ..., "status": "running"}, ...]}`
- Backward compatible: single `dataset` field still works

### Models
- Add `datasets` field to run request model (optional)

## Frontend Changes

### NewRunDialog
- Replace single dataset dropdown with checkbox list (matching provider multi-select UX)
- "Select All" toggle for datasets
- Submit creates multiple runs when multiple datasets selected
- Toast shows count: "Started 3 runs across 6 providers"

## File Changes
- `server/datasets/` — 6 new JSON files
- `server/app/views.py` — Updated POST /api/runs
- `server/app/models.py` — Updated request model
- `ui/src/components/dashboard/NewRunDialog.tsx` — Multi-dataset UI
- `ui/src/lib/api/sentifish.ts` — Updated types
- `README.md` — Updated docs
