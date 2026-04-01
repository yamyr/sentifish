# MVP Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 4 critical gaps preventing public launch: CORS auth bug, cost tracking, scheduled evaluations, and network resilience.

**Architecture:** Each feature is independent — backend endpoint + frontend UI per feature. Cost tracking adds fields to existing models. Scheduled evals use Python's asyncio scheduler. Network resilience wraps React Query with error/retry UI.

**Tech Stack:** FastAPI, Pydantic, asyncio, React, TanStack Query, Tailwind, shadcn/ui

---

## Task 1: Fix CORS — Allow X-Api-Key Header

**Files:**
- Modify: `server/app/main.py:49-55`

- [ ] **Step 1: Fix CORS allow_headers**

In `server/app/main.py`, the CORS middleware config (lines 49-55) needs `X-Api-Key` added:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Api-Key"],
)
```

- [ ] **Step 2: Verify and commit**

```bash
cd server && uv run ruff check app/main.py && uv run ruff format app/main.py
git add server/app/main.py && git commit -m "fix: add X-Api-Key to CORS allowed headers"
```

---

## Task 2: Cost-Per-Query Tracking — Backend

**Files:**
- Modify: `server/app/models.py` — add cost fields
- Modify: `server/app/providers.py` — add cost constants
- Modify: `server/app/runner.py` — compute cost after each query
- Modify: `server/app/views.py` — expose cost in leaderboard/summary

- [ ] **Step 1: Add provider cost constants**

In `server/app/providers.py`, add after the `_KEY_MAP` dict:

```python
# Approximate cost per query in USD (as of 2026-Q1)
PROVIDER_COST_PER_QUERY: dict[str, float] = {
    "brave": 0.003,      # $3/1000 queries (Pro plan)
    "serper": 0.001,      # $1/1000 queries
    "serpapi": 0.005,     # $50/10K queries
    "tavily": 0.001,      # ~$1/1000 queries (starter)
    "exa": 0.003,         # $3/1000 queries
    "tinyfish": 0.010,    # $10/1000 (browser automation)
}
```

- [ ] **Step 2: Add cost fields to QueryScore and EvalRun**

In `server/app/models.py`, add to `QueryScore`:
```python
cost_usd: float = 0.0
```

Add a `total_cost_usd` property to `EvalRun`:
```python
@property
def total_cost_usd(self) -> float:
    return sum(s.cost_usd for s in self.scores)

@property
def cost_by_provider(self) -> dict[str, float]:
    costs: dict[str, float] = {}
    for s in self.scores:
        costs[s.provider] = costs.get(s.provider, 0.0) + s.cost_usd
    return costs
```

- [ ] **Step 3: Compute cost in runner**

In `server/app/runner.py`, in `_eval_query()`, after scoring, add:
```python
from .providers import PROVIDER_COST_PER_QUERY
cost = PROVIDER_COST_PER_QUERY.get(provider_name, 0.0)
```
Set `cost_usd=cost` on the returned QueryScore.

- [ ] **Step 4: Expose cost in summary and leaderboard**

In `EvalRun.summary` property, add `mean_cost_usd` per provider.
In `views.py` leaderboard endpoint, include `avg_cost_per_query` in leaderboard entries.

- [ ] **Step 5: Run tests, format, commit**

```bash
cd server && uv run ruff format app/ && uv run ruff check app/ && uv run pytest tests/ -x -q
git add server/app/ && git commit -m "feat: add cost-per-query tracking to backend"
```

---

## Task 3: Cost-Per-Query Tracking — Frontend

**Files:**
- Modify: `ui/src/lib/api/sentifish.ts` — add cost types
- Modify: `ui/src/components/dashboard/ProviderComparison.tsx` — add cost row
- Modify: `ui/src/components/dashboard/StatCards.tsx` — add total cost card

- [ ] **Step 1: Add cost fields to TypeScript types**

In `sentifish.ts`, add `cost_usd: number` to QueryScore interface.
Add `mean_cost_usd: number` and `composite_score: number` to RunSummary provider metrics.
Add `avg_cost_per_query: number` to LeaderboardEntry.

- [ ] **Step 2: Add cost display to ProviderComparison**

Add a new section after the latency grid showing cost per query per provider:
- Same grid layout as latency
- Format as `$0.003` per query
- Color code: green for cheapest, red for most expensive

- [ ] **Step 3: Add total cost to StatCards**

Add a 5th stat card showing total cost of the latest run:
- Icon: DollarSign from lucide-react
- Value: formatted as `$0.05` or `$1.23`
- Label: "Run Cost"

- [ ] **Step 4: Verify build, commit**

```bash
cd ui && npx tsc --noEmit && npm run build
git add ui/src/ && git commit -m "feat: add cost tracking UI to dashboard"
```

---

## Task 4: Scheduled Evaluations — Backend

**Files:**
- Create: `server/app/scheduler.py` — async scheduler
- Modify: `server/app/models.py` — add Schedule model
- Modify: `server/app/views.py` — schedule CRUD endpoints
- Modify: `server/app/main.py` — start scheduler on startup

- [ ] **Step 1: Create Schedule model**

In `server/app/models.py`, add:
```python
class EvalSchedule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    dataset_name: str
    providers: list[str]
    top_k: int = 10
    cron_expression: str  # e.g. "0 */6 * * *" (every 6 hours)
    enabled: bool = True
    created_at: float = Field(default_factory=time.time)
    last_run_id: str | None = None
    last_run_at: float | None = None
    run_count: int = 0
```

- [ ] **Step 2: Create scheduler module**

Create `server/app/scheduler.py`:
- In-memory store: `_schedules: dict[str, EvalSchedule]`
- `create_schedule()`, `list_schedules()`, `get_schedule()`, `delete_schedule()`
- `_check_schedules()` — async loop that checks every 60s if any schedule is due
- Uses simple cron parsing (hour/minute matching) or a lightweight lib
- On trigger: calls `runner.create_run()` + `runner.execute_run()`
- Persists schedules to `{results_dir}/schedules/` as JSON
- Loads on startup

- [ ] **Step 3: Add schedule endpoints**

In `server/app/views.py`:
```python
@router.get("/schedules")
@router.post("/schedules", dependencies=[Depends(_require_write_auth)])
@router.delete("/schedules/{schedule_id}", dependencies=[Depends(_require_write_auth)])
@router.patch("/schedules/{schedule_id}/toggle", dependencies=[Depends(_require_write_auth)])
```

- [ ] **Step 4: Start scheduler in lifespan**

In `server/app/main.py` lifespan, add:
```python
from . import scheduler
scheduler.load_persisted_schedules()
task = asyncio.create_task(scheduler.run_scheduler())
yield
task.cancel()
```

- [ ] **Step 5: Test and commit**

```bash
cd server && uv run ruff format app/ && uv run ruff check app/ && uv run pytest tests/ -x -q
git add server/app/ && git commit -m "feat: add scheduled recurring evaluations"
```

---

## Task 5: Scheduled Evaluations — Frontend

**Files:**
- Modify: `ui/src/lib/api/sentifish.ts` — add schedule types
- Modify: `ui/src/hooks/useApi.ts` — add schedule hooks
- Create: `ui/src/components/dashboard/SchedulePanel.tsx` — schedule UI
- Modify: `ui/src/pages/Dashboard.tsx` — add schedule section

- [ ] **Step 1: Add types and API methods**

In `sentifish.ts`:
```typescript
export interface EvalSchedule {
  id: string;
  name: string;
  dataset_name: string;
  providers: string[];
  top_k: number;
  cron_expression: string;
  enabled: boolean;
  created_at: number;
  last_run_id: string | null;
  last_run_at: number | null;
  run_count: number;
}
```

Add to sentifishApi: `getSchedules`, `createSchedule`, `deleteSchedule`, `toggleSchedule`.

- [ ] **Step 2: Add hooks**

In `useApi.ts`: `useSchedules()`, `useCreateSchedule()`, `useDeleteSchedule()`, `useToggleSchedule()`.

- [ ] **Step 3: Create SchedulePanel component**

Simple panel showing active schedules with:
- Schedule name, dataset, providers, cron expression
- Toggle switch to enable/disable
- Delete button
- "New Schedule" button opening a dialog with fields

- [ ] **Step 4: Add to Dashboard, verify, commit**

```bash
cd ui && npx tsc --noEmit && npm run build
git add ui/src/ && git commit -m "feat: add scheduled evaluations UI"
```

---

## Task 6: Network Resilience — Error States

**Files:**
- Create: `ui/src/components/NetworkStatus.tsx` — connection status indicator
- Modify: `ui/src/App.tsx` — add network status
- Modify: `ui/src/hooks/useApi.ts` — add retry config

- [ ] **Step 1: Create NetworkStatus component**

A small banner that appears when API is unreachable:
- Uses `useHealth()` hook
- Shows a dismissible warning bar: "Unable to reach Sentifish API. Retrying..."
- Auto-retries every 10s
- Green checkmark briefly when reconnected

- [ ] **Step 2: Configure React Query defaults for resilience**

In the QueryClient config (App.tsx), set:
```typescript
defaultOptions: {
  queries: {
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 30_000,
  },
}
```

- [ ] **Step 3: Add to App, verify, commit**

```bash
cd ui && npx tsc --noEmit && npm run build
git add ui/src/ && git commit -m "feat: add network error states and retry resilience"
```

---

## Execution Order

Tasks 1-3 can run in parallel (CORS fix + cost backend + cost frontend).
Task 4-5 run in parallel (schedule backend + schedule frontend).
Task 6 is independent.

**Recommended agent dispatch:**
- Wave 1: Tasks 1, 2, 3 (3 agents in parallel)
- Wave 2: Tasks 4, 5, 6 (3 agents in parallel)
- Final: Consolidate, test, PR, merge
