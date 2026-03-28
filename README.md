# Sentifish

Web Search Evaluation Platform — compare search providers with standardized IR metrics.

## What it does

Sentifish runs queries from curated datasets against search providers (Brave, Serper, Tavily), scores results using information retrieval metrics, and stores runs for comparison.

**Metrics:** Precision@K, Recall@K, NDCG@K, MRR, Latency

## Quick start

```bash
cd server
uv sync --all-groups
cp ../env.sample .env   # fill in API keys
./run
```

Server starts at `http://localhost:4010`.

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
  -d '{"dataset": "sample", "providers": ["brave", "serper"], "top_k": 10}'
```

## Tests

```bash
cd server
uv run pytest --cov=app tests/
```

## Deployment

Deploys via Docker on Railway. Push to `main` triggers auto-deploy.

```bash
docker build -t sentifish .
docker run -p 4010:4010 --env-file .env sentifish
```
