import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDatasets, useAllProviders, useTriggerRun, useTriggerMultiRun } from "@/hooks/useApi";
import type { SearchProvider } from "@/lib/api/sentifish";
import { toast } from "sonner";
import { Loader2, Play, Sparkles } from "lucide-react";
import TaskWizard from "./TaskWizard";

interface NewRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRunStarted?: (runId: string) => void;
}

export default function NewRunDialog({ open, onOpenChange, onRunStarted }: NewRunDialogProps) {
  const { data: datasets, isLoading: datasetsLoading } = useDatasets();
  const { data: allProviders, isLoading: providersLoading } = useAllProviders();
  const triggerRun = useTriggerRun();
  const triggerMultiRun = useTriggerMultiRun();

  const [taskMode, setTaskMode] = useState(false);
  const [taskWizardOpen, setTaskWizardOpen] = useState(false);
  const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set());
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [topK, setTopK] = useState(10);

  useEffect(() => {
    if (open && allProviders) {
      const available = allProviders.filter((p) => p.available).map((p) => p.name);
      setSelectedProviders(new Set(available));
    }
  }, [open, allProviders]);

  const toggleDataset = (name: string) => {
    setSelectedDatasets((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleProvider = (provider: string) => {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  };

  const canSubmit =
    selectedDatasets.size > 0 && selectedProviders.size > 0 && topK > 0 && !triggerRun.isPending && !triggerMultiRun.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      const providerArray = Array.from(selectedProviders) as SearchProvider[];
      const datasetArray = Array.from(selectedDatasets);

      if (datasetArray.length === 1) {
        const result = await triggerRun.mutateAsync({
          dataset: datasetArray[0],
          providers: providerArray,
          top_k: topK,
        });
        onRunStarted?.(result.id);
      } else {
        const result = await triggerMultiRun.mutateAsync({
          datasets: datasetArray,
          providers: providerArray,
          top_k: topK,
        });
        if (result.runs?.[0]) {
          onRunStarted?.(result.runs[0].id);
        }
      }

      toast.success("Evaluation started", {
        description: `${datasetArray.length} dataset(s) × ${selectedProviders.size} provider(s)`,
      });
      onOpenChange(false);
      setSelectedDatasets(new Set());
      setSelectedProviders(new Set());
      setTopK(10);
    } catch (err) {
      toast.error("Failed to trigger run", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleTaskModeToggle = () => {
    if (!taskMode) {
      setTaskMode(true);
      onOpenChange(false);
      setTaskWizardOpen(true);
    } else {
      setTaskMode(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-sans-brand">New Evaluation Run</DialogTitle>
            <DialogDescription>
              Select datasets and providers to benchmark against.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between rounded-lg border bg-secondary/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-indigo" />
              <span className="text-sm font-medium">Task Mode</span>
              <span className="text-xs text-muted-foreground">AI-assisted evaluation setup</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={taskMode}
              onClick={handleTaskModeToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                taskMode ? "bg-brand-indigo" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                  taskMode ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Datasets</Label>
                {!datasetsLoading && datasets && datasets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDatasets.size === datasets.length) {
                        setSelectedDatasets(new Set());
                      } else {
                        setSelectedDatasets(new Set(datasets.map((d) => d.name)));
                      }
                    }}
                    className="text-xs font-medium text-brand-cyan hover:text-brand-cyan/80 transition-colors"
                  >
                    {selectedDatasets.size === datasets?.length ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>
              {datasetsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading datasets...
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {datasets?.map((ds) => (
                    <button
                      key={ds.name}
                      type="button"
                      onClick={() => toggleDataset(ds.name)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                        selectedDatasets.has(ds.name)
                          ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedDatasets.has(ds.name)
                            ? "border-brand-cyan bg-brand-cyan"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {selectedDatasets.has(ds.name) && (
                          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 6l3 3 5-5" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="capitalize">{ds.name}</span>
                        {ds.description && (
                          <span className="ml-1.5 text-xs text-muted-foreground truncate">— {ds.description}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Providers</Label>
              {providersLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading providers...
                </div>
              ) : (
                <TooltipProvider>
                  <div className="grid grid-cols-2 gap-2">
                    {allProviders?.map((provider) => {
                      const isAvailable = provider.available;
                      const isSelected = selectedProviders.has(provider.name);

                      const btn = (
                        <button
                          key={provider.name}
                          type="button"
                          onClick={() => isAvailable && toggleProvider(provider.name)}
                          disabled={!isAvailable}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            !isAvailable
                              ? "opacity-40 cursor-not-allowed border-border bg-card text-muted-foreground"
                              : isSelected
                                ? "border-brand-indigo bg-brand-indigo/10 text-brand-indigo"
                                : "border-border bg-card text-muted-foreground hover:bg-secondary"
                          }`}
                        >
                          <div
                            className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                              !isAvailable
                                ? "border-muted-foreground/20"
                                : isSelected
                                  ? "border-brand-indigo bg-brand-indigo"
                                  : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && isAvailable && (
                              <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 6l3 3 5-5" />
                              </svg>
                            )}
                          </div>
                          <span className="capitalize">{provider.name}</span>
                        </button>
                      );

                      if (!isAvailable) {
                        return (
                          <Tooltip key={provider.name}>
                            <TooltipTrigger asChild>{btn}</TooltipTrigger>
                            <TooltipContent>
                              <p>No API key configured</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return btn;
                    })}
                  </div>
                </TooltipProvider>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="topk">Top-K Results</Label>
              <Input
                id="topk"
                type="number"
                min={1}
                max={100}
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="font-mono-brand"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {(triggerRun.isPending || triggerMultiRun.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Triggering...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Evaluation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskWizard
        open={taskWizardOpen}
        onOpenChange={(isOpen) => {
          setTaskWizardOpen(isOpen);
          if (!isOpen) setTaskMode(false);
        }}
      />
    </>
  );
}
