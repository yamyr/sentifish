import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRuns } from "@/hooks/useApi";
import { BarChart3 } from "lucide-react";

const PROVIDER_COLORS: Record<string, string> = {
  brave: "bg-brand-indigo",
  serper: "bg-brand-cyan",
  serpapi: "bg-brand-cyan",
  tavily: "bg-warning",
  exa: "bg-danger",
  tinyfish: "bg-success",
};

const PROVIDER_TEXT_COLORS: Record<string, string> = {
  brave: "text-brand-indigo",
  serper: "text-brand-cyan",
  serpapi: "text-brand-cyan",
  tavily: "text-warning",
  exa: "text-danger",
  tinyfish: "text-success",
};

interface ProviderMetrics {
  ndcg: number;
  map: number;
  recall: number;
  contentDepth: number;
  latency: number;
}

const MOCK_DATA: Record<string, ProviderMetrics> = {
  brave: { ndcg: 0.84, map: 0.79, recall: 0.76, contentDepth: 0.35, latency: 320 },
  serper: { ndcg: 0.80, map: 0.76, recall: 0.81, contentDepth: 0.30, latency: 180 },
  tavily: { ndcg: 0.89, map: 0.84, recall: 0.73, contentDepth: 0.55, latency: 440 },
  exa: { ndcg: 0.87, map: 0.82, recall: 0.80, contentDepth: 0.60, latency: 350 },
  tinyfish: { ndcg: 0.72, map: 0.65, recall: 0.60, contentDepth: 0.92, latency: 25000 },
};

const BAR_METRICS: { key: keyof ProviderMetrics; label: string }[] = [
  { key: "ndcg", label: "Ranking Quality — NDCG@K" },
  { key: "map", label: "Consistent Precision — MAP@K" },
  { key: "recall", label: "Coverage Breadth — Recall@K" },
  { key: "contentDepth", label: "Content Depth" },
];

export default function ProviderComparison() {
  const { data: runs } = useRuns();

  const { metrics, isLive } = useMemo(() => {
    const completedRuns = (runs ?? [])
      .filter((r) => r.status === "completed" && Array.isArray(r.scores) && r.scores.length > 0)
      .sort((a, b) => b.created_at - a.created_at);

    if (completedRuns.length === 0) {
      return { metrics: MOCK_DATA, isLive: false };
    }

    const latestRun = completedRuns[0];
    const byProvider: Record<string, ProviderMetrics> = {};

    for (const score of latestRun.scores ?? []) {
      if (!byProvider[score.provider]) {
        byProvider[score.provider] = {
          ndcg: 0,
          map: 0,
          recall: 0,
          contentDepth: 0,
          latency: 0,
        };
      }
    }

    // Aggregate mean per provider
    const counts: Record<string, number> = {};
    for (const score of latestRun.scores ?? []) {
      const p = score.provider;
      counts[p] = (counts[p] ?? 0) + 1;
      byProvider[p].ndcg += score.ndcg_at_k;
      byProvider[p].map += score.map_at_k ?? 0;
      byProvider[p].recall += score.recall_at_k;
      byProvider[p].contentDepth += score.content_depth ?? 0;
      byProvider[p].latency += score.latency_ms;
    }

    for (const p of Object.keys(byProvider)) {
      const n = counts[p];
      byProvider[p].ndcg /= n;
      byProvider[p].map /= n;
      byProvider[p].recall /= n;
      byProvider[p].contentDepth /= n;
      byProvider[p].latency /= n;
    }

    return { metrics: byProvider, isLive: true };
  }, [runs]);

  const providers = Object.keys(metrics);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-indigo" />
              <CardTitle className="font-sans-brand text-lg">
                Provider Comparison
              </CardTitle>
            </div>
            {!isLive && (
              <span className="text-xs text-muted-foreground italic">
                Sample data -- run an evaluation to see live results
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider legend */}
          <div className="flex flex-wrap gap-4">
            {providers.map((p) => (
              <div key={p} className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${PROVIDER_COLORS[p] ?? "bg-muted-foreground"}`}
                />
                <span className="text-sm font-medium capitalize">{p}</span>
              </div>
            ))}
          </div>

          {/* Metric bars */}
          <div className="space-y-5">
            {BAR_METRICS.map(({ key, label }) => (
              <div key={key}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <div className="space-y-1.5">
                  {providers.map((p) => {
                    const val = metrics[p][key];
                    return (
                      <div key={p} className="flex items-center gap-3">
                        <span className="w-16 text-right text-xs font-medium capitalize text-muted-foreground">
                          {p}
                        </span>
                        <div className="flex-1 h-5 rounded-full bg-secondary overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${PROVIDER_COLORS[p] ?? "bg-muted-foreground"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${val * 100}%` }}
                            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono-brand text-xs font-semibold">
                          {val.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Latency grid */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Response Speed — Latency
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {providers.map((p) => {
                const ms = metrics[p].latency;
                const display = ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
                return (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="rounded-lg border bg-secondary/50 p-3 text-center"
                  >
                    <p className={`font-mono-brand text-lg font-bold ${PROVIDER_TEXT_COLORS[p] ?? "text-foreground"}`}>
                      {display}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{p}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
