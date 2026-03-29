import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sentifishApi, type EvalRunRequest, type MultiEvalRunRequest } from "@/lib/api/sentifish";

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
