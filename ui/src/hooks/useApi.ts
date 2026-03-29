import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sentifishApi, type EvalRunRequest, type MultiEvalRunRequest, type ToolDefinition } from "@/lib/api/sentifish";

const API_BASE = import.meta.env.VITE_SENTIFISH_API_URL || "";

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: sentifishApi.getProviders,
    staleTime: 60_000,
  });
}

export function useAllProviders() {
  return useQuery({
    queryKey: ["providers-all"],
    queryFn: sentifishApi.getAllProviders,
    staleTime: 60_000,
  });
}

export function useProvidersInfo() {
  return useQuery({
    queryKey: ["providers-info"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/providers`);
      const data = await res.json();
      return data as { providers: string[]; llm_judge_available: boolean };
    },
    staleTime: 60_000,
  });
}

export function useDatasets() {
  return useQuery({
    queryKey: ["datasets"],
    queryFn: sentifishApi.getDatasets,
    staleTime: 30_000,
  });
}

export function useRuns() {
  return useQuery({
    queryKey: ["runs"],
    queryFn: sentifishApi.getRuns,
    refetchInterval: 5_000,
  });
}

export function useRun(id: string | null) {
  return useQuery({
    queryKey: ["run", id],
    queryFn: () => sentifishApi.getRun(id!),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 3_000 : false,
  });
}

export function useRunSummary(id: string | null) {
  return useQuery({
    queryKey: ["runSummary", id],
    queryFn: () => sentifishApi.getRunSummary(id!),
    enabled: !!id,
  });
}

export function useTriggerRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: EvalRunRequest) => sentifishApi.triggerRun(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}

export function useTriggerMultiRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: MultiEvalRunRequest) => sentifishApi.triggerMultiRun(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}

export function useTriggerDemoRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sentifishApi.triggerDemoRun(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}


export function useDemoRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const API_BASE = import.meta.env.VITE_SENTIFISH_API_URL || "";
      const res = await fetch(`${API_BASE}/api/demo-run`, { method: "POST" });
      if (!res.ok) throw new Error("Demo run failed");
      return res.json() as Promise<{ id: string; status: string; providers: string[] }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["runs"] });
    },
  });
}

export function useCreateDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      description: string;
      cases: Array<{ query: string; relevant_urls: string[] }>;
    }) =>
      sentifishApi.createDataset({
        name: body.name,
        description: body.description,
        cases: body.cases.map((c) => ({
          ...c,
          tags: [],
          metadata: {},
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}

export function useDeleteDataset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => sentifishApi.deleteDataset(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["datasets"] });
    },
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: sentifishApi.health,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useNarrationText(runId: string | null) {
  return useQuery({
    queryKey: ["narration", runId],
    queryFn: () => sentifishApi.getNarrationText(runId!),
    enabled: !!runId,
    staleTime: 60_000,
  });
}

export function useLeaderboard(metric = "composite_score") {
  return useQuery({
    queryKey: ["leaderboard", metric],
    queryFn: () => sentifishApi.getLeaderboard(metric),
    staleTime: 30_000,
  });
}

export function useRunReport(runId: string | null) {
  return useQuery({
    queryKey: ["runReport", runId],
    queryFn: () => sentifishApi.getRunReport(runId!),
    enabled: !!runId,
    staleTime: 60_000,
  });
export function useTools() {
  return useQuery({ queryKey: ["tools"], queryFn: sentifishApi.getTools, staleTime: 30_000 });

export function useTasks() {
  return useQuery({ queryKey: ["tasks"], queryFn: sentifishApi.getTasks, staleTime: 30_000 });

export function useCreateTool() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: sentifishApi.createTool, onSuccess: () => qc.invalidateQueries({ queryKey: ["tools"] }) });

export function useDeleteTool() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: sentifishApi.deleteTool, onSuccess: () => qc.invalidateQueries({ queryKey: ["tools"] }) });

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: sentifishApi.createTask, onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }) });
}

export function useRecommendMetrics() {
  return useMutation({ mutationFn: sentifishApi.recommendMetrics });
}
