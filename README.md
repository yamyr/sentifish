# 🐟 Sentifish

**Web search provider benchmarking platform** — run standardized IR evaluations across Brave, Serper, Tavily, and TinyFish, then compare results side-by-side.

## Why

Search APIs all claim to be the best. Sentifish lets you prove it with data: run the same queries across multiple providers, score them with real IR metrics, and see who actually delivers.

## Demo

<p align="center">
  <img src="assets/gifs/02-race.gif" width="700" alt="Providers racing in real time" />
</p>
<p align="center"><em>Providers competing head-to-head on the same queries</em></p>

<p align="center">
  <img src="assets/gifs/03-comparison.gif" width="700" alt="IR metrics comparison" />
</p>
<p align="center"><em>Precision, Recall, NDCG, MRR scored per provider</em></p>

<p align="center">
  <img src="assets/gifs/04-trend.gif" width="700" alt="NDCG trend over time" />
</p>
<p align="center"><em>NDCG@10 quality tracking across runs</em></p>

<p align="center">
  <img src="assets/gifs/05-dashboard.gif" width="700" alt="Dashboard overview" />
</p>
<p align="center"><em>Full dashboard with stats, comparisons, and run history</em></p>

## Features

- **6 search providers**: Brave, Serper, SerpAPI, Tavily, Exa, TinyFish
- **IR scoring**: Precision@K, Recall@K, NDCG@K, MRR, Latency
- **Async evaluation runs**: POST triggers run, poll for results as providers finish
- **Dashboard UI**: provider head-to-head comparison, NDCG trend charts, run history
- **Typed API client**: full TypeScript SDK with React Query integration
- **Persistent results**: in-memory store + disk persistence to `./results/`
- **Dataset management**: create, list, and manage evaluation datasets
- **Multi-dataset evaluation**: Run benchmarks across multiple datasets in parallel
- **7 curated datasets**: Sample + 6 domain-specific datasets covering developer tools, news, research, startups, ML engineering, and product design
- **Railway-ready**: Dockerfile + railway.toml included

## Architecture

```
sentifish/          → Backend (Python/FastAPI)
sentifish-ui/       → Frontend (React/Vite/TypeScript)
```

### Backend

Python FastAPI server with async evaluation engine.

- Providers run concurrently (TinyFish: 2 concurrent, others: 5)
- Scores stream in as providers complete via `as_completed`
- Results persisted to `./results/` on disk
- Multi-dataset runs spawn parallel evaluation tasks

### Frontend

React SPA with a mobile-first dashboard.

- **React + Vite + TypeScript** with SWC
- **shadcn/ui** component library (Radix primitives)
- **Framer Motion** animations
- **Tailwind CSS** with custom design tokens (DM Sans + JetBrains Mono)
- **React Query** for server state
- **React Router** for navigation

Dashboard components:
| Component | What it shows |
|---|---|
| `StatCards` | Total queries evaluated, best NDCG@10, fastest provider, total runs |
| `ProviderComparison` | Animated bar charts comparing P@K, R@K, NDCG, MRR across all providers |
| `TrendChart` | NDCG@10 sparklines over last 12 runs per provider |
| `RecentRuns` | Timeline of evaluation runs with status, provider badges, best scores |
| `InsightCard` | Auto-generated evaluation insights |

## Quick Start

### Backend

```bash
cd server
uv sync --all-groups
cp ../env.sample .env   # fill in API keys (see env.sample for all options including API_KEY)
./run
```

Server starts at `http://localhost:4010`.

### Frontend

```bash
cd ../sentifish-ui
npm install
npm run dev
```

UI starts at `http://localhost:5173`. Set `VITE_SENTIFISH_API_URL` to point at the backend.

## API

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/api/providers` | GET | List configured providers |
| `/api/datasets` | GET/POST | List or create datasets |
| `/api/datasets/{name}` | GET/DELETE | Get or delete a dataset |
| `/api/runs` | GET/POST | List runs or trigger a new eval |
| `/api/runs/{id}` | GET | Full run results |
| `/api/runs/{id}/summary` | GET | Aggregated scores per provider |

### Trigger an eval

```bash
curl -X POST http://localhost:4010/api/runs \
  -H "Content-Type: application/json" \
  -d '{"dataset": "sample", "providers": ["brave", "serper", "tavily", "tinyfish"], "top_k": 10}'
```

### Poll for results

```bash
curl http://localhost:4010/api/runs/{run_id}
```

Scores stream in as providers complete — no need to wait for the slowest one.

### Multi-dataset evaluation

```bash
curl -X POST http://localhost:4010/api/runs \
  -H "Content-Type: application/json" \
  -d '{"datasets": ["developer-tools", "ml-engineer"], "providers": ["brave", "serper"], "top_k": 10}'
```

Returns one run per dataset, all executing in parallel:
```json
{
  "runs": [
    {"id": "...", "dataset": "developer-tools", "status": "running"},
    {"id": "...", "dataset": "ml-engineer", "status": "running"}
  ]
}
```

## Datasets

Ships with 7 evaluation datasets (48+ queries total):

| Dataset | Domain | Queries | Description |
|---|---|---|---|
| `sample` | General | 5 | Mixed topics for smoke testing |
| `developer-tools` | Engineering | 8 | Framework docs, debugging, API references |
| `news-and-current-events` | Journalism | 8 | Fact-checking, trending topics, explainers |
| `academic-research` | Science | 8 | Papers, scientific concepts, literature reviews |
| `startup-founder` | Business | 8 | Market research, fundraising, competitor analysis |
| `ml-engineer` | AI/ML | 8 | Model benchmarks, implementations, tooling |
| `product-designer` | Design | 8 | UX patterns, design systems, accessibility |

## Metrics

| Metric | What it measures |
|---|---|
| **Precision@K** | Fraction of top-K results that are relevant |
| **Recall@K** | Fraction of known relevant docs found in top-K |
| **NDCG@K** | Ranking quality (rewards relevant results appearing higher) |
| **MRR** | How quickly the first relevant result appears |
| **Latency** | Wall-clock response time per provider |

**Content Depth** (`content_depth`) is the normalized average snippet length returned by a provider. It measures how much substantive content each result contains — providers that return longer, richer snippets score higher. Displayed in the dashboard's Provider Comparison chart and in per-query score tables.

## Tests

```bash
cd server
uv run pytest --cov=app tests/
```

## Deploy

Deploys via Docker on Railway. Push to `main` triggers auto-deploy.

```bash
docker build -t sentifish .
docker run -p 4010:4010 --env-file .env sentifish
```

## Tech Stack

| Layer | Stack |
|---|---|
| Backend | Python, FastAPI, asyncio, uv |
| Frontend | React 18, Vite, TypeScript, Tailwind, shadcn/ui, Framer Motion |
| Scoring | Custom IR metrics engine (Precision, Recall, NDCG, MRR) |
| Search | Brave API, Serper API, Tavily API, TinyFish API (SSE) |
| Storage | In-memory + disk persistence |
| Deploy | Docker, Railway |

## Roadmap

<p align="center">
  <img src="assets/gifs/06-roadmap.gif" width="700" alt="Sentifish roadmap" />
</p>
<p align="center"><em>From search benchmarking to full agent observability</em></p>

Sentifish today benchmarks search providers. The bigger vision is **observability for any AI agent's output** — think Datadog, but for agents.

**LLM-as-Judge Scoring** — Semantic relevance scoring via OpenAI. Evaluate answer quality, not just URL matches. Catches cases where different URLs contain equally good content.

**Agent Output Evaluation** — Beyond search: benchmark any web agent's task output for correctness and drift. Define expected outputs, run agents on schedule, score results automatically.

**Drift Detection & Alerts** — Scheduled re-evaluation with auto-alerting when agent quality degrades over time. Catch silent failures before users do.

**Self-Improving Baselines** — Feed failure context + last N successful runs to an LLM. Auto-classify real drift vs benign change, and adapt baselines without manual intervention.

**Multi-Agent Arena** — Head-to-head comparison of browser agents (TinyFish, Browserbase, Multion, Steel) on identical tasks, scored with the same metrics framework.

## Security

Write endpoints (`POST /api/runs`, `POST /api/datasets`, `DELETE /api/datasets/{name}`) can be protected with an optional API key. Set the `API_KEY` environment variable to enable authentication — all write requests must then include a matching `X-Api-Key` header. When `API_KEY` is not set, auth is disabled and the API is open.

```bash
API_KEY=your-secret-key-here

curl -X POST http://localhost:4010/api/runs \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: your-secret-key-here" \
  -d '{"dataset": "sample", "providers": ["brave"], "top_k": 10}'
```

## Research

The `docs/research/` directory contains 51 research files on agentic frameworks, evaluation methods, and observability — the background research that shaped Sentifish's design.

## License

MIT
