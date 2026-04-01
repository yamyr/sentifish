import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useRuns } from "@/hooks/useApi";
import { MetricTooltip } from "@/components/dashboard/MetricTooltip";
import { BarChart3, Zap, Target, Sparkles, DollarSign } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/** Color token map used for the icon container and the provider dot. */
const colorMap: Record<
  string,
  { bg: string; ring: string; dot: string }
> = {
  "text-brand-indigo": {
    bg: "bg-brand-indigo/10",
    ring: "ring-brand-indigo/20",
    dot: "bg-brand-indigo",
  },
  "text-success": {
    bg: "bg-success/10",
    ring: "ring-success/20",
    dot: "bg-success",
  },
  "text-warning": {
    bg: "bg-warning/10",
    ring: "ring-warning/20",
    dot: "bg-warning",
  },
  "text-brand-cyan": {
    bg: "bg-brand-cyan/10",
    ring: "ring-brand-cyan/20",
    dot: "bg-brand-cyan",
  },
  "text-danger": {
    bg: "bg-danger/10",
    ring: "ring-danger/20",
    dot: "bg-danger",
  },
};

export default function StatCards() {
  const { data: runs } = useRuns();

  const stats = useMemo(() => {
    const completedRuns = runs?.filter((r) => r.status === "completed") ?? [];
    const allScores = completedRuns.flatMap((r) => r.scores ?? []).filter(Boolean);

    // Run cost from latest completed run
    const latestCompleted = completedRuns.sort((a, b) => b.created_at - a.created_at)[0];
    const latestScores = latestCompleted?.scores ?? [];
    const runCost = latestScores.reduce((sum, s) => sum + (s.cost_usd ?? 0), 0);

    // Total queries
    const totalQueries = allScores.length;

    // Best NDCG@K
    let bestNdcg = 0;
    let bestNdcgProvider = "\u2014";
    for (const score of allScores) {
      if ((score.ndcg_at_k ?? 0) > bestNdcg) {
        bestNdcg = score.ndcg_at_k;
        bestNdcgProvider = score.provider;
      }
    }

    // Best MAP@K
    let bestMap = 0;
    let bestMapProvider = "\u2014";
    for (const score of allScores) {
      if ((score.map_at_k ?? 0) > bestMap) {
        bestMap = score.map_at_k;
        bestMapProvider = score.provider;
      }
    }

    // Best LLM Judge Score
    let bestJudge = 0;
    let bestJudgeProvider = "\u2014";
    for (const score of allScores) {
      if ((score.llm_judge_score ?? 0) > bestJudge) {
        bestJudge = score.llm_judge_score;
        bestJudgeProvider = score.provider;
      }
    }

    return {
      totalQueries,
      bestNdcg: totalQueries > 0 ? bestNdcg.toFixed(3) : "\u2014",
      bestNdcgProvider: totalQueries > 0 ? bestNdcgProvider : "\u2014",
      bestMap: totalQueries > 0 ? bestMap.toFixed(3) : "\u2014",
      bestMapProvider: totalQueries > 0 ? bestMapProvider : "\u2014",
      bestJudge: totalQueries > 0 ? bestJudge.toFixed(3) : "\u2014",
      bestJudgeProvider: totalQueries > 0 ? bestJudgeProvider : "\u2014",
      totalRuns: runs?.length ?? 0,
      runCost: runCost > 0 ? `$${runCost.toFixed(2)}` : "$0.00",
    };
  }, [runs]);

  const cards = [
    {
      label: "Total Queries Evaluated",
      value: stats.totalQueries > 0 ? stats.totalQueries.toLocaleString() : "0",
      sub: null,
      icon: BarChart3,
      color: "text-brand-indigo",
      metricKey: null,
    },
    {
      label: "Best NDCG@K",
      value: stats.bestNdcg,
      sub: stats.bestNdcgProvider !== "\u2014" ? stats.bestNdcgProvider : null,
      icon: Target,
      color: "text-success",
      metricKey: "ndcg_at_k",
    },
    {
      label: "Best MAP@K",
      value: stats.bestMap,
      sub: stats.bestMapProvider !== "\u2014" ? stats.bestMapProvider : null,
      icon: Zap,
      color: "text-warning",
      metricKey: "map_at_k",
    },
    {
      label: "Best Judge Score",
      value: stats.bestJudge,
      sub: stats.bestJudgeProvider !== "\u2014" ? stats.bestJudgeProvider : null,
      icon: Sparkles,
      color: "text-brand-cyan",
      metricKey: "llm_judge_score",
    },
    {
      label: "Run Cost",
      value: stats.runCost,
      sub: null,
      icon: DollarSign,
      color: "text-danger",
      metricKey: null,
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const palette = colorMap[card.color];
        return (
          <motion.div key={card.label} variants={item}>
            <Card
              className={`gradient-border relative overflow-hidden bg-gradient-to-br from-card to-secondary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {card.metricKey ? (
                      <MetricTooltip metric={card.metricKey} label={card.label} />
                    ) : (
                      card.label
                    )}
                  </p>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${palette.bg} ring-1 ${palette.ring}`}
                  >
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className="mt-2 font-mono-brand text-3xl font-bold text-foreground">
                  {card.value}
                </p>
                {card.sub && (
                  <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${palette.dot} mr-1.5`}
                    />
                    {card.sub}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
