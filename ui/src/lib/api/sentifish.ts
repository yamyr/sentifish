/**
 * Sentifish API client — connects to the FastAPI backend
 */

const API_BASE = import.meta.env.VITE_SENTIFISH_API_URL || "";

export type SearchProvider = "brave" | "serper" | "tavily" | "tinyfish";

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

export interface QueryScore {
  query: string;
  provider: string;
  precision_at_k: number;
  recall_at_k: number;
  ndcg_at_k: number;
  mrr: number;
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
    mean_latency_ms: number;
    total_queries: number;
  };
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
  getRun: (id: string) => apiFetch<EvalRun>(`/api/runs/${id}`),
  getRunSummary: (id: string) =>
    apiFetch<{ id: string; dataset_name: string; status: string; summary: RunSummary }>(
      `/api/runs/${id}/summary`
    ),

  getNarrationText: (runId: string) =>
    apiFetch<{ text: string }>(`/api/runs/${runId}/narration/text`),

  getNarrationAudioUrl: (runId: string) =>
    `${API_BASE}/api/runs/${runId}/narration/audio`,
};
