import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDatasets, useProviders, useTriggerRun } from "@/hooks/useApi";
import type { SearchProvider } from "@/lib/api/sentifish";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";

interface NewRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewRunDialog({ open, onOpenChange }: NewRunDialogProps) {
  const { data: datasets, isLoading: datasetsLoading } = useDatasets();
  const { data: providers, isLoading: providersLoading } = useProviders();
  const triggerRun = useTriggerRun();

  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [topK, setTopK] = useState(10);

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
    selectedDataset && selectedProviders.size > 0 && topK > 0 && !triggerRun.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await triggerRun.mutateAsync({
        dataset: selectedDataset,
        providers: Array.from(selectedProviders) as SearchProvider[],
        top_k: topK,
      });
      toast.success("Evaluation run triggered", {
        description: `Running ${selectedProviders.size} provider(s) on "${selectedDataset}"`,
      });
      onOpenChange(false);
      setSelectedDataset("");
      setSelectedProviders(new Set());
      setTopK(10);
    } catch (err) {
      toast.error("Failed to trigger run", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans-brand">New Evaluation Run</DialogTitle>
          <DialogDescription>
            Select a dataset and providers to benchmark against.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Dataset selector */}
          <div className="space-y-2">
            <Label htmlFor="dataset">Dataset</Label>
            {datasetsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading datasets...
              </div>
            ) : (
              <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                <SelectTrigger id="dataset">
                  <SelectValue placeholder="Select a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets?.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Provider checkboxes */}
          <div className="space-y-2">
            <Label>Providers</Label>
            {providersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading providers...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {providers?.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => toggleProvider(provider)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selectedProviders.has(provider)
                        ? "border-brand-indigo bg-brand-indigo/10 text-brand-indigo"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedProviders.has(provider)
                          ? "border-brand-indigo bg-brand-indigo"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {selectedProviders.has(provider) && (
                        <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>
                    <span className="capitalize">{provider}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Top-K */}
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
            {triggerRun.isPending ? (
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
  );
}
