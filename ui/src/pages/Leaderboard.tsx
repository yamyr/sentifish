import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Fish,
  ArrowLeft,
  Trophy,
  Timer,
  Hash,
  Loader2,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaderboard } from "@/hooks/useApi";

const METRIC_TABS = [
  { value: "composite_score", label: "Composite Score" },
  { value: "ndcg_at_k", label: "NDCG" },
  { value: "precision_at_k", label: "Precision" },
  { value: "latency_ms", label: "Latency" },
  { value: "llm_judge_score", label: "LLM Judge" },
] as const;

const RANK_COLORS: Record<number, { bg: string; text: string; ring: string }> = {
  1: { bg: "bg-amber-400/15", text: "text-amber-400", ring: "ring-amber-400/30" },
  2: { bg: "bg-slate-300/15", text: "text-slate-300", ring: "ring-slate-300/30" },
  3: { bg: "bg-orange-600/15", text: "text-orange-600", ring: "ring-orange-600/30" },
};

function formatLastUpdated(ts: number): string {
  if (!ts) return "Never";
  const d = new Date(ts * 1000);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Leaderboard() {
  const [metric, setMetric] = useState("composite_score");
  const { data, isLoading } = useLeaderboard(metric);

  const leaderboard = data?.leaderboard ?? [];
  const totalRuns = data?.total_runs ?? 0;
  const lastUpdated = data?.last_updated ?? 0;
  const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map((e) => e.avg_score)) : 100;

  return (
    <div className="min-h-screen bg-background">
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 bg-background/90 backdrop-blur-md"
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
              Dashboard
            </Link>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-cyan"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-brand-cyan/20 to-transparent" />
      </motion.nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/20">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="font-sans-brand text-2xl font-bold text-foreground">
                Global Tool Leaderboard
              </h1>
              <p className="text-sm text-muted-foreground">
                {totalRuns} run{totalRuns !== 1 ? "s" : ""} · Last updated{" "}
                {formatLastUpdated(lastUpdated)}
              </p>
            </div>
          </div>
        </motion.div>

        <Tabs value={metric} onValueChange={setMetric}>
          <TabsList className="w-full sm:w-auto">
            {METRIC_TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs sm:text-sm"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card className="gradient-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/10 ring-1 ring-brand-cyan/20">
                <BarChart3 className="h-4 w-4 text-brand-cyan" />
              </div>
              <CardTitle className="font-sans-brand text-lg">
                Rankings
              </CardTitle>
              {leaderboard.length > 0 && (
                <Badge
                  variant="secondary"
                  className="font-mono-brand text-xs ring-1 ring-brand-cyan/20"
                >
                  {leaderboard.length} tools
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading leaderboard...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <Trophy className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No completed runs yet. Run an evaluation to see rankings!
                </p>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-brand-cyan hover:underline"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const rankStyle = RANK_COLORS[entry.rank];
                  const barWidth = maxScore > 0 ? (entry.avg_score / maxScore) * 100 : 0;

                  return (
                    <motion.div
                      key={entry.provider}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                      className={`flex items-center gap-4 rounded-lg border p-3 transition-colors ${
                        rankStyle
                          ? `${rankStyle.bg} border-transparent`
                          : "bg-card hover:bg-brand-cyan/[0.03]"
                      }`}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 15,
                          delay: i * 0.06 + 0.1,
                        }}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono-brand text-sm font-bold ${
                          rankStyle
                            ? `${rankStyle.bg} ${rankStyle.text} ring-1 ${rankStyle.ring}`
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {entry.rank}
                      </motion.div>

                      <span className="font-sans-brand text-sm font-semibold capitalize text-foreground min-w-[100px]">
                        {entry.provider}
                      </span>

                      <div className="flex-1 hidden sm:block">
                        <div className="h-2.5 w-full rounded-full bg-secondary">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{
                              duration: 0.6,
                              delay: i * 0.06 + 0.2,
                              ease: "easeOut",
                            }}
                            className="h-full rounded-full bg-brand-cyan"
                          />
                        </div>
                      </div>

                      <span className="font-mono-brand text-sm font-semibold text-foreground min-w-[60px] text-right">
                        {entry.avg_score.toFixed(1)}
                      </span>

                      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground min-w-[80px]">
                        <Timer className="h-3 w-3" />
                        {Math.round(entry.avg_latency_ms)}ms
                      </div>

                      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground min-w-[60px]">
                        <Hash className="h-3 w-3" />
                        {entry.run_count} run{entry.run_count !== 1 ? "s" : ""}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
