import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRuns } from "@/hooks/useApi";
import {
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  ListChecks,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-success/15 text-success border-success/30 font-mono-brand",
  running: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30 font-mono-brand",
  failed: "bg-danger/15 text-danger border-danger/30 font-mono-brand",
  pending: "bg-muted text-muted-foreground border-border font-mono-brand",
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(ts: number): string {
  const seconds = Math.floor(Date.now() / 1000 - ts);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentRuns() {
  const { data: runs, isLoading } = useRuns();
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const sortedRuns = useMemo(() => {
    const sorted = [...(runs ?? [])].sort((a, b) => b.created_at - a.created_at);
    if (!filter) return sorted;
    const lower = filter.toLowerCase();
    return sorted.filter(
      (r) =>
        r.dataset_name.toLowerCase().includes(lower) ||
        r.providers.some((p) => p.toLowerCase().includes(lower)) ||
        r.status.includes(lower)
    );
  }, [runs, filter]);

  const displayed = showAll ? sortedRuns : sortedRuns.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <Card className="gradient-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 ring-1 ring-success/20">
                <ListChecks className="h-4 w-4 text-success" />
              </div>
              <CardTitle className="font-sans-brand text-lg">
                Recent Runs
              </CardTitle>
              {runs && (
                <Badge variant="secondary" className="font-mono-brand text-xs ring-1 ring-success/20">
                  {runs.length}
                </Badge>
              )}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by dataset, provider..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 text-sm bg-secondary/50 focus-visible:ring-brand-cyan/30"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading runs...
            </div>
          ) : sortedRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ListChecks className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {filter
                  ? "No runs match your filter."
                  : "No evaluation runs yet. Start one above!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayed.map((run) => {
                const isExpanded = expandedId === run.id;
                return (
                  <motion.div
                    key={run.id}
                    layout
                    className="rounded-lg border bg-card transition-colors hover:bg-brand-cyan/[0.03]"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : run.id)}
                      className="flex w-full items-center gap-3 p-3 text-left"
                    >
                      {/* Status badge */}
                      <Badge
                        className={`shrink-0 capitalize text-xs ${STATUS_STYLES[run.status] ?? ""}`}
                      >
                        {run.status === "running" && (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        )}
                        {run.status}
                      </Badge>

                      {/* Dataset */}
                      <span className="font-medium text-sm truncate flex-1">
                        {run.dataset_name}
                      </span>

                      {/* Provider badges */}
                      <div className="hidden sm:flex items-center gap-1">
                        {run.providers.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {p}
                          </Badge>
                        ))}
                      </div>

                      {/* Top K */}
                      {run.top_k != null && (
                        <span className="font-mono-brand text-xs text-muted-foreground shrink-0">
                          k={run.top_k}
                        </span>
                      )}

                      {/* Time */}
                      <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {timeAgo(run.created_at)}
                      </span>

                      {/* Expand toggle */}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {/* Expanded scores */}
                    {isExpanded && (run.scores?.length ?? 0) > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t px-3 pb-3 pt-2"
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left py-1 pr-3 font-medium">Query</th>
                                <th className="text-left py-1 pr-3 font-medium">Provider</th>
                                <th className="text-right py-1 pr-3 font-medium">P@K</th>
                                <th className="text-right py-1 pr-3 font-medium">R@K</th>
                                <th className="text-right py-1 pr-3 font-medium">NDCG</th>
                                <th className="text-right py-1 pr-3 font-medium">MAP</th>
                                <th className="text-right py-1 pr-3 font-medium">MRR</th>
                                <th className="text-right py-1 pr-3 font-medium">Depth</th>
                                <th className="text-right py-1 font-medium">Latency</th>
                              </tr>
                            </thead>
                            <tbody className="font-mono-brand">
                              {run.scores.slice(0, 20).map((s, i) => (
                                <tr
                                  key={`${s.query}-${s.provider}-${i}`}
                                  className="border-t border-border/50"
                                >
                                  <td className="py-1.5 pr-3 max-w-[200px] truncate font-sans-brand">
                                    {s.query}
                                  </td>
                                  <td className="py-1.5 pr-3 capitalize">{s.provider}</td>
                                  <td className="py-1.5 pr-3 text-right">{s.precision_at_k.toFixed(3)}</td>
                                  <td className="py-1.5 pr-3 text-right">{s.recall_at_k.toFixed(3)}</td>
                                  <td className="py-1.5 pr-3 text-right">{s.ndcg_at_k.toFixed(3)}</td>
                                  <td className="py-1.5 pr-3 text-right">{(s.map_at_k ?? 0).toFixed(3)}</td>
                                  <td className="py-1.5 pr-3 text-right">{s.mrr.toFixed(3)}</td>
                                  <td className="py-1.5 pr-3 text-right">{(s.content_depth ?? 0).toFixed(3)}</td>
                                  <td className="py-1.5 text-right">{Math.round(s.latency_ms)}ms</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {(run.scores?.length ?? 0) > 20 && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Showing 20 of {run.scores?.length} scores
                            </p>
                          )}
                        </div>
                        {run.error && (
                          <p className="mt-2 text-xs text-danger">
                            Error: {run.error}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          Created: {formatTimestamp(run.created_at)}
                          {run.completed_at &&
                            ` | Completed: ${formatTimestamp(run.completed_at)}`}
                        </p>
                      </motion.div>
                    )}

                    {isExpanded && (run.scores?.length ?? 0) === 0 && (
                      <div className="border-t px-3 py-4 text-center text-xs text-muted-foreground">
                        {run.status === "pending" || run.status === "running"
                          ? "Scores will appear when the run completes."
                          : run.error
                            ? `Error: ${run.error}`
                            : "No scores available."}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* View all button */}
              {sortedRuns.length > 5 && (
                <div className="pt-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs text-muted-foreground"
                  >
                    {showAll
                      ? `Show less`
                      : `View all ${sortedRuns.length} runs`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
