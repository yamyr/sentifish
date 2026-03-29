import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Fish,
  ArrowLeft,
  Trophy,
  Crown,
  Zap,
  Target,
  Brain,
  Timer,
  Loader2,
  Printer,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRunReport } from "@/hooks/useApi";
import NarratorButton from "@/components/dashboard/NarratorButton";

const PROVIDER_COLORS = [
  "#00DDBB",
  "#7F6BC6",
  "#22C55E",
  "#F59E0B",
  "#F43F5E",
  "#0EA5E9",
];

const METRIC_LABELS: Record<string, { label: string; icon: typeof Trophy }> = {
  mean_ndcg_at_k: { label: "NDCG", icon: Target },
  mean_precision_at_k: { label: "Precision", icon: Zap },
  mean_mrr: { label: "MRR", icon: Brain },
  mean_latency_ms: { label: "Speed", icon: Timer },
  mean_llm_judge_score: { label: "AI Judge", icon: Brain },
};

export default function Report() {
  const { runId } = useParams<{ runId: string }>();
  const { data: report, isLoading, error } = useRunReport(runId ?? null);

  if (!runId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">No run ID provided.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-brand-cyan" />
        <span className="text-muted-foreground">Loading report...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : "Failed to load report. Run may not be completed."}
        </p>
        <Link to="/dashboard" className="text-sm text-brand-cyan hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const radarMetrics = ["NDCG", "Precision", "Recall", "MRR", "Speed", "AI Score"];
  const maxLatency = Math.max(
    ...Object.values(report.summary).map((s) => s.mean_latency_ms),
    1,
  );

  const radarData = radarMetrics.map((metricLabel) => {
    const point: Record<string, string | number> = { metric: metricLabel };
    for (const provider of report.providers) {
      const stats = report.summary[provider];
      if (!stats) continue;
      let value = 0;
      switch (metricLabel) {
        case "NDCG":
          value = (stats.mean_ndcg_at_k ?? 0) * 100;
          break;
        case "Precision":
          value = (stats.mean_precision_at_k ?? 0) * 100;
          break;
        case "Recall":
          value = (stats.mean_recall_at_k ?? 0) * 100;
          break;
        case "MRR":
          value = (stats.mean_mrr ?? 0) * 100;
          break;
        case "Speed":
          value = (1 - (stats.mean_latency_ms ?? 0) / maxLatency) * 100;
          break;
        case "AI Score":
          value = (stats.mean_llm_judge_score ?? 0) * 100;
          break;
      }
      point[provider] = Math.round(value * 10) / 10;
    }
    return point;
  });

  const queryEntries = Object.entries(report.query_winners);

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 bg-background/90 backdrop-blur-md print:hidden"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="glow-cyan flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/15 ring-1 ring-brand-cyan/30">
              <Fish className="h-5 w-5 text-brand-cyan" />
            </div>
            <span className="font-sans-brand text-lg font-bold tracking-tight text-foreground">
              Sentifish
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-cyan"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-brand-cyan/20 to-transparent" />
      </motion.nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span className="font-mono-brand">{report.dataset}</span>
            <span>·</span>
            <span>{report.providers.length} providers</span>
            <span>·</span>
            <span>{report.query_count} queries</span>
            {report.duration_seconds > 0 && (
              <>
                <span>·</span>
                <span>{Math.round(report.duration_seconds)}s</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Section 1: Winner Card */}
        {report.best_overall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="gradient-border overflow-hidden">
              <div className="bg-gradient-to-br from-amber-400/10 via-transparent to-brand-cyan/5 p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-400/30"
                >
                  <Crown className="h-8 w-8 text-amber-400" />
                </motion.div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Best Overall</p>
                <h2 className="font-sans-brand text-3xl font-bold capitalize text-foreground">
                  {report.best_overall}
                </h2>
                <p className="mt-2 font-mono-brand text-4xl font-bold text-brand-cyan">
                  {(report.composite_scores[report.best_overall] ?? 0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Composite Score</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Section 2: Metric Winners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h3 className="font-sans-brand text-lg font-semibold text-foreground mb-4">
            Metric Winners
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Object.entries(report.metric_winners).map(([metricKey, winner]) => {
              const meta = METRIC_LABELS[metricKey];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <Card key={metricKey} className="gradient-border">
                  <CardContent className="p-4 text-center">
                    <Icon className="mx-auto mb-2 h-5 w-5 text-brand-cyan" />
                    <p className="text-xs text-muted-foreground mb-1">{meta.label}</p>
                    <p className="font-sans-brand text-sm font-semibold capitalize text-foreground">
                      {winner}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        <Separator />

        {/* Section 3: Query-by-Query Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="gradient-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-sans-brand text-lg">
                Query-by-Query Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queryEntries.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No query data available.
                </p>
              ) : (
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b">
                        <th className="text-left py-2 pr-4 font-medium">Query</th>
                        <th className="text-left py-2 font-medium">Winner</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono-brand">
                      {queryEntries.map(([query, winner]) => (
                        <tr key={query} className="border-b border-border/50">
                          <td className="py-2.5 pr-4 max-w-[400px] truncate font-sans-brand text-foreground">
                            {query}
                          </td>
                          <td className="py-2.5">
                            <Badge
                              variant="secondary"
                              className="capitalize text-xs ring-1 ring-brand-cyan/20"
                            >
                              <Trophy className="mr-1 h-3 w-3" />
                              {winner}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Separator />

        {/* Section 4: Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="gradient-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-sans-brand text-lg">
                Side-by-Side Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {report.providers.map((p, i) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: PROVIDER_COLORS[i % PROVIDER_COLORS.length] }}
                    />
                    <span className="text-xs capitalize text-muted-foreground">{p}</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  {report.providers.map((p, i) => (
                    <Radar
                      key={p}
                      name={p}
                      dataKey={p}
                      stroke={PROVIDER_COLORS[i % PROVIDER_COLORS.length]}
                      fill={PROVIDER_COLORS[i % PROVIDER_COLORS.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <Separator />

        {/* Section 5: Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="gradient-border">
            <CardHeader className="pb-3">
              <CardTitle className="font-sans-brand text-lg">Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <NarratorButton runId={runId} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Section 6: Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="flex justify-center print:hidden"
        >
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Download PDF Report
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
