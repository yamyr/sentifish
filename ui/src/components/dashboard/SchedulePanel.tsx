import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSchedules,
  useCreateSchedule,
  useDeleteSchedule,
  useToggleSchedule,
  useDatasets,
  useProviders,
} from "@/hooks/useApi";
import { Calendar, Plus, Trash2, Power, PowerOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

const INTERVAL_OPTIONS = [
  { label: "Every 30 min", value: 30 },
  { label: "Every 1 hour", value: 60 },
  { label: "Every 6 hours", value: 360 },
  { label: "Every 12 hours", value: 720 },
  { label: "Every 24 hours", value: 1440 },
  { label: "Every 7 days", value: 10080 },
];

export default function SchedulePanel() {
  const { data: schedules, isLoading } = useSchedules();
  const { data: datasets } = useDatasets();
  const { data: providers } = useProviders();
  const createSchedule = useCreateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const toggleSchedule = useToggleSchedule();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [datasetName, setDatasetName] = useState("");
  const [interval, setInterval] = useState(360);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());

  const handleCreate = async () => {
    if (!name || !datasetName || selectedProviders.size === 0) return;
    try {
      await createSchedule.mutateAsync({
        name,
        dataset_name: datasetName,
        providers: Array.from(selectedProviders),
        top_k: 10,
        interval_minutes: interval,
        enabled: true,
      });
      toast.success("Schedule created");
      setShowForm(false);
      setName("");
      setDatasetName("");
      setSelectedProviders(new Set());
    } catch (err) {
      toast.error("Failed to create schedule", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule.mutateAsync(id);
      toast.success("Schedule deleted");
    } catch {
      toast.error("Failed to delete schedule");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleSchedule.mutateAsync(id);
    } catch {
      toast.error("Failed to toggle schedule");
    }
  };

  const formatInterval = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${minutes / 60}h`;
    return `${minutes / 1440}d`;
  };

  const formatLastRun = (ts: number | null) => {
    if (!ts) return "Never";
    const ago = Math.floor((Date.now() / 1000 - ts) / 60);
    if (ago < 60) return `${ago}m ago`;
    if (ago < 1440) return `${Math.floor(ago / 60)}h ago`;
    return `${Math.floor(ago / 1440)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-cyan" />
              <CardTitle className="font-sans-brand text-lg">
                Scheduled Evaluations
              </CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Create form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border bg-secondary/30 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nightly benchmark"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dataset</Label>
                      <Select value={datasetName} onValueChange={setDatasetName}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select dataset" />
                        </SelectTrigger>
                        <SelectContent>
                          {datasets?.map((ds) => (
                            <SelectItem key={ds.name} value={ds.name}>
                              {ds.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Interval</Label>
                    <Select
                      value={String(interval)}
                      onValueChange={(v) => setInterval(Number(v))}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVAL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Providers</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {providers?.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            const next = new Set(selectedProviders);
                            next.has(p) ? next.delete(p) : next.add(p);
                            setSelectedProviders(next);
                          }}
                          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                            selectedProviders.has(p)
                              ? "bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/30"
                              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={!name || !datasetName || selectedProviders.size === 0 || createSchedule.isPending}
                  >
                    {createSchedule.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Create Schedule"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Schedule list */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading schedules...
            </div>
          ) : !schedules?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No scheduled evaluations yet.
            </p>
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                    s.enabled ? "bg-card" : "bg-secondary/30 opacity-60"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.dataset_name} · {s.providers.length} providers · every{" "}
                      {formatInterval(s.interval_minutes)} · {s.run_count} runs · last:{" "}
                      {formatLastRun(s.last_run_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => handleToggle(s.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary transition-colors"
                      title={s.enabled ? "Pause" : "Resume"}
                    >
                      {s.enabled ? (
                        <Power className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <PowerOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
