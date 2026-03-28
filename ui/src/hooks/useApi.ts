import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sentifishApi, type EvalRunRequest } from "@/lib/api/sentifish";

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: sentifishApi.getProviders,
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

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: sentifishApi.health,
    staleTime: 30_000,
    retry: 1,
  });
}
