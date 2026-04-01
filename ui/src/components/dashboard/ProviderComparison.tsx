import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRuns, useProvidersInfo } from "@/hooks/useApi";
import { MetricTooltip } from "@/components/dashboard/MetricTooltip";
import { BarChart3, Info } from "lucide-react";

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
  judgeScore: number;
  latency: number;
  cost: number;
  precision: number;
  mrr: number;
}

const MOCK_DATA: Record<string, ProviderMetrics> = {
  brave: { ndcg: 0.84, map: 0.79, recall: 0.76, contentDepth: 0.35, judgeScore: 0.82, latency: 320, cost: 0.003, precision: 0.80, mrr: 0.78 },
  serper: { ndcg: 0.80, map: 0.76, recall: 0.81, contentDepth: 0.30, judgeScore: 0.78, latency: 180, cost: 0.001, precision: 0.77, mrr: 0.75 },
  tavily: { ndcg: 0.89, map: 0.84, recall: 0.73, contentDepth: 0.55, judgeScore: 0.88, latency: 440, cost: 0.005, precision: 0.82, mrr: 0.85 },
  exa: { ndcg: 0.87, map: 0.82, recall: 0.80, contentDepth: 0.60, judgeScore: 0.85, latency: 350, cost: 0.004, precision: 0.81, mrr: 0.83 },
  tinyfish: { ndcg: 0.72, map: 0.65, recall: 0.60, contentDepth: 0.92, judgeScore: 0.75, latency: 25000, cost: 0.002, precision: 0.68, mrr: 0.70 },
};

const BAR_METRICS: { key: keyof ProviderMetrics; label: string; metricKey: string }[] = [
  { key: "ndcg", label: "Ranking Quality — NDCG@K", metricKey: "ndcg_at_k" },
  { key: "map", label: "Consistent Precision — MAP@K", metricKey: "map_at_k" },
  { key: "recall", label: "Coverage Breadth — Recall@K", metricKey: "recall_at_k" },
  { key: "contentDepth", label: "Content Depth", metricKey: "content_depth" },
  { key: "judgeScore", label: "LLM Judge — Semantic Relevance", metricKey: "llm_judge_score" },
];

function compositeScore(p: ProviderMetrics): number {
  return Math.round(
    (p.ndcg * 0.35 + p.precision * 0.25 + p.recall * 0.25 + p.mrr * 0.15) * 100
  );
}

function compositeColor(score: number): string {
  const hue = Math.round((score / 100) * 120);
  return `hsl(${hue}, 80%, 45%)`;
}

export default function ProviderComparison() {
  const { data: runs } = useRuns();
  const { data: providersInfo } = useProvidersInfo();

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
          judgeScore: 0,
          latency: 0,
          cost: 0,
          precision: 0,
          mrr: 0,
        };
      }
    }

    const counts: Record<string, number> = {};
    for (const score of latestRun.scores ?? []) {
      const p = score.provider;
      counts[p] = (counts[p] ?? 0) + 1;
      byProvider[p].ndcg += score.ndcg_at_k;
      byProvider[p].map += score.map_at_k ?? 0;
      byProvider[p].recall += score.recall_at_k;
      byProvider[p].contentDepth += score.content_depth ?? 0;
      byProvider[p].judgeScore += score.llm_judge_score ?? 0;
      byProvider[p].latency += score.latency_ms;
      byProvider[p].cost += score.cost_usd ?? 0;
      byProvider[p].precision += score.precision_at_k;
      byProvider[p].mrr += score.mrr;
    }

    for (const p of Object.keys(byProvider)) {
      const n = counts[p];
      byProvider[p].ndcg /= n;
      byProvider[p].map /= n;
      byProvider[p].recall /= n;
      byProvider[p].contentDepth /= n;
      byProvider[p].judgeScore /= n;
      byProvider[p].latency /= n;
      byProvider[p].cost /= n;
      byProvider[p].precision /= n;
      byProvider[p].mrr /= n;
    }

    return { metrics: byProvider, isLive: true };
  }, [runs]);

  const providers = Object.keys(metrics);
  const llmJudgeAvailable = providersInfo?.llm_judge_available ?? true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="gradient-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-indigo/10 ring-1 ring-brand-indigo/20">
                <BarChart3 className="h-4 w-4 text-brand-indigo" />
              </div>
              <CardTitle className="font-sans-brand text-lg">
                Provider Comparison
              </CardTitle>
            </div>
            {!isLive && (
              <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning ring-1 ring-warning/20">
                Sample data -- run an evaluation to see live results
              </span>
            )}
          </div>
          {!llmJudgeAvailable && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-brand-cyan/20 bg-brand-cyan/5 px-3 py-2 text-xs text-brand-cyan">
              <Info className="h-3.5 w-3.5 shrink-0" />
              LLM Judge scores unavailable — add OPENAI_API_KEY to enable semantic evaluation
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider legend with composite scores */}
          <div className="flex flex-wrap gap-4">
            {providers.map((p) => {
              const score = compositeScore(metrics[p]);
              return (
                <div key={p} className="flex items-center gap-2">
                  <div
                    className={`h-3.5 w-3.5 rounded-full ring-2 ring-offset-2 ring-offset-card ${PROVIDER_COLORS[p] ?? "bg-muted-foreground"} ${PROVIDER_COLORS[p] ? PROVIDER_COLORS[p].replace("bg-", "ring-") : "ring-muted-foreground"}`}
                  />
                  <span className="text-sm font-medium capitalize">{p}</span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: compositeColor(score) }}
                    title="Composite Quality Score (0–100)"
                  >
                    {score}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Composite score explanation */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <MetricTooltip metric="composite_score" label="Quality Score" />
            <span>shown next to each provider</span>
          </div>

          {/* Metric bars */}
          <div className="space-y-5">
            {BAR_METRICS.map(({ key, label, metricKey }) => (
              <div key={key}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <MetricTooltip metric={metricKey} label={label} />
                </p>
                <div className="space-y-1.5">
                  {providers.map((p) => {
                    const val = metrics[p][key];
                    const pct = val * 100;
                    return (
                      <div key={p} className="flex items-center gap-3">
                        <span className="w-16 text-right text-sm font-medium font-sans-brand capitalize text-muted-foreground">
                          {p}
                        </span>
                        <div className="relative flex-1 h-6 rounded-full bg-secondary/70 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${PROVIDER_COLORS[p] ?? "bg-muted-foreground"}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                          >
                            {pct > 30 && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono-brand text-[10px] font-bold text-white/90">
                                {val.toFixed(2)}
                              </span>
                            )}
                          </motion.div>
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
          <p className="text-xs text-muted-foreground text-center sm:hidden">&larr; Scroll to compare &rarr;</p>

          {/* Latency grid */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MetricTooltip metric="latency_ms" label="Response Speed — Latency" />
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {providers.map((p) => {
                const ms = metrics[p].latency;
                const secs = ms / 1000;
                const display = secs >= 10 ? `${secs.toFixed(0)}s` : `${secs.toFixed(2)}s`;
                return (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="gradient-border rounded-lg border bg-secondary/50 p-3 text-center hover:shadow-sm transition-shadow"
                  >
                    <p className={`font-mono-brand text-base font-bold ${PROVIDER_TEXT_COLORS[p] ?? "text-foreground"}`}>
                      {display}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{p}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Cost per query grid */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cost Per Query
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {providers.map((p) => {
                const cost = metrics[p].cost;
                return (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="gradient-border rounded-lg border bg-secondary/50 p-3 text-center hover:shadow-sm transition-shadow"
                  >
                    <p className={`font-mono-brand text-base font-bold ${PROVIDER_TEXT_COLORS[p] ?? "text-foreground"}`}>
                      ${cost.toFixed(3)}
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
