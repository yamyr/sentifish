/**
 * Sentifish API client — connects to the FastAPI backend
 */

const API_BASE = import.meta.env.VITE_SENTIFISH_API_URL || "";

export type SearchProvider = "brave" | "serper" | "serpapi" | "tavily" | "exa" | "tinyfish";

export interface Dataset {
  name: string;
  description: string;
  cases: DatasetQuery[];
}

export interface DatasetQuery {
  query: string;
  relevant_urls: string[];
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface EvalRunRequest {
  dataset: string;
  providers: SearchProvider[];
  top_k?: number;
}

export interface MultiEvalRunRequest {
  datasets: string[];
  providers: SearchProvider[];
  top_k?: number;
}


export interface QueryScore {
  query: string;
  provider: string;
  precision_at_k: number;
  recall_at_k: number;
  ndcg_at_k: number;
  mrr: number;
  map_at_k: number;
  content_depth: number;
  llm_judge_score: number;
  llm_judge_reasoning: string;
  latency_ms: number;
  result_count: number;
  results: SearchResult[];
}

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  rank: number;
}

export interface EvalRun {
  id: string;
  dataset_name: string;
  providers: string[];
  top_k: number;
  status: "pending" | "running" | "completed" | "failed";
  created_at: number;
  completed_at: number | null;
  scores: QueryScore[];
  error: string | null;
}

export interface RunSummary {
  [provider: string]: {
    mean_precision_at_k: number;
    mean_recall_at_k: number;
    mean_ndcg_at_k: number;
    mean_mrr: number;
    mean_map_at_k: number;
    mean_content_depth: number;
    mean_llm_judge_score: number;
    mean_latency_ms: number;
    total_queries: number;
    composite_score: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  provider: string;
  avg_score: number;
  avg_latency_ms: number;
  run_count: number;
  trend: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  metric: string;
  total_runs: number;
  last_updated: number;
}

export interface RunReportResponse {
  run_id: string;
  dataset: string;
  providers: string[];
  summary: RunSummary;
  composite_scores: Record<string, number>;
  best_overall: string | null;
  metric_winners: Record<string, string>;
  query_count: number;
  query_winners: Record<string, string>;
  duration_seconds: number;
}

export interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  category: "search" | "ai_assistant" | "code_generation" | "image_generation" | "data_extraction" | "summarization" | "custom";
  input_type: "text_query" | "url" | "file" | "code";
  output_type: "url_list" | "text" | "code" | "json" | "image_url";
  description: string;
  endpoint_url?: string;
  builtin_provider?: string;
  is_builtin: boolean;
  created_at: number;
}

export interface TaskDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  input_template: string;
  evaluation_criteria: string;
  suggested_metrics: string[];
  created_at: number;
}

export interface EvalMetricWeight {
  metric: string;
  weight: number;
  label: string;
  description: string;
  higher_is_better: boolean;
}

export interface EvalConfig {
  id: string;
  task_id: string;
  name: string;
  metrics: EvalMetricWeight[];
  generated_by_ai: boolean;
  ai_reasoning: string;
  created_at: number;
}

export interface MetricRecommendation {
  eval_config: EvalConfig;
  available_metrics: Record<string, { label: string; description: string; higher_is_better: boolean; applicable_to: string[] }>;
  llm_used: boolean;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

export const sentifishApi = {
  health: () => apiFetch<{ status: string }>("/health"),

  getProviders: () =>
    apiFetch<{ providers: string[] }>("/api/providers").then((r) => r.providers),

  getDatasets: () =>
    apiFetch<{ datasets: Dataset[] }>("/api/datasets").then((r) => r.datasets),
  createDataset: (dataset: Dataset) =>
    apiFetch<{ ok: boolean; name: string }>("/api/datasets", {
      method: "POST",
      body: JSON.stringify(dataset),
    }),
  getDataset: (name: string) => apiFetch<Dataset>(`/api/datasets/${name}`),
  deleteDataset: (name: string) =>
    apiFetch<void>(`/api/datasets/${name}`, { method: "DELETE" }),

  getRuns: () =>
    apiFetch<{ runs: EvalRun[] }>("/api/runs").then((r) => r.runs),
  triggerRun: (req: EvalRunRequest) =>
    apiFetch<{ id: string; status: string }>("/api/runs", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  triggerMultiRun: (req: MultiEvalRunRequest) =>
    apiFetch<{ runs: Array<{ id: string; dataset: string; status: string }> }>("/api/runs", {
      method: "POST",
      body: JSON.stringify(req),
    }),
  getRun: (id: string) => apiFetch<EvalRun>(`/api/runs/${id}`),
  getRunSummary: (id: string) =>
    apiFetch<{ id: string; dataset_name: string; status: string; summary: RunSummary }>(
      `/api/runs/${id}/summary`
    ),

  getAllProviders: () =>
    apiFetch<{ providers: { name: string; available: boolean }[] }>("/api/providers/all").then(
      (r) => r.providers,
    ),

  triggerDemoRun: () =>
    apiFetch<{ id: string; status: string }>("/api/demo-run", { method: "POST" }),

  getNarrationText: (runId: string) =>
    apiFetch<{ text: string }>(`/api/runs/${runId}/narration/text`),

  getNarrationAudioUrl: (runId: string) =>
    `${API_BASE}/api/runs/${runId}/narration/audio`,

  getLeaderboard: (metric = "composite_score", limit = 20) =>
    apiFetch<LeaderboardResponse>(
      `/api/leaderboard?metric=${metric}&limit=${limit}`,
    ),

  getRunReport: (runId: string) =>
    apiFetch<RunReportResponse>(`/api/runs/${runId}/report`),
  getTools: async (): Promise<ToolDefinition[]> => {
    const res = await fetch(`${API_BASE}/api/tools`);
    const data = await res.json();
    return data.tools;
  },
  createTool: async (tool: Partial<ToolDefinition>): Promise<ToolDefinition> => {
    const res = await fetch(`${API_BASE}/api/tools`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tool) });
    if (!res.ok) throw new Error("Failed to create tool");
    return res.json();
  },
  deleteTool: async (slug: string): Promise<void> => {
    await fetch(`${API_BASE}/api/tools/${slug}`, { method: "DELETE" });
  },
  getTasks: async (): Promise<TaskDefinition[]> => {
    const res = await fetch(`${API_BASE}/api/tasks`);
    const data = await res.json();
    return data.tasks;
  },
  createTask: async (task: Partial<TaskDefinition>): Promise<TaskDefinition> => {
    const res = await fetch(`${API_BASE}/api/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
  },
  recommendMetrics: async (params: { task_name: string; task_description: string; task_category: string; evaluation_criteria?: string }): Promise<MetricRecommendation> => {
    const res = await fetch(`${API_BASE}/api/tasks/recommend-metrics`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
    if (!res.ok) throw new Error("Failed to get metric recommendations");
    return res.json();
  },
  getAvailableMetrics: async () => {
    const res = await fetch(`${API_BASE}/api/metrics`);
    return res.json();
  },
};
