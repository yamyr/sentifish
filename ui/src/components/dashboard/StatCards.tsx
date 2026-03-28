import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useRuns } from "@/hooks/useApi";
import { BarChart3, Zap, Target, Activity } from "lucide-react";

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

export default function StatCards() {
  const { data: runs } = useRuns();

  const stats = useMemo(() => {
    const completedRuns = runs?.filter((r) => r.status === "completed") ?? [];
    const allScores = completedRuns.flatMap((r) => r.scores ?? []).filter(Boolean);

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

    // Fastest avg latency per provider across all runs
    const latencyByProvider: Record<string, number[]> = {};
    for (const score of allScores) {
      if (!latencyByProvider[score.provider]) latencyByProvider[score.provider] = [];
      latencyByProvider[score.provider].push(score.latency_ms);
    }
    let fastestLatency = Infinity;
    let fastestProvider = "\u2014";
    for (const [provider, latencies] of Object.entries(latencyByProvider)) {
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      if (avg < fastestLatency) {
        fastestLatency = avg;
        fastestProvider = provider;
      }
    }

    return {
      totalQueries,
      bestNdcg: totalQueries > 0 ? bestNdcg.toFixed(3) : "\u2014",
      bestNdcgProvider: totalQueries > 0 ? bestNdcgProvider : "\u2014",
      fastestLatency: fastestLatency < Infinity ? `${Math.round(fastestLatency)}ms` : "\u2014",
      fastestProvider: fastestLatency < Infinity ? fastestProvider : "\u2014",
      totalRuns: runs?.length ?? 0,
    };
  }, [runs]);

  const cards = [
    {
      label: "Total Queries Evaluated",
      value: stats.totalQueries > 0 ? stats.totalQueries.toLocaleString() : "0",
      sub: null,
      icon: BarChart3,
      color: "text-brand-indigo",
    },
    {
      label: "Best NDCG@K",
      value: stats.bestNdcg,
      sub: stats.bestNdcgProvider !== "\u2014" ? stats.bestNdcgProvider : null,
      icon: Target,
      color: "text-success",
    },
    {
      label: "Fastest Avg Latency",
      value: stats.fastestLatency,
      sub: stats.fastestProvider !== "\u2014" ? stats.fastestProvider : null,
      icon: Zap,
      color: "text-warning",
    },
    {
      label: "Evaluation Runs",
      value: stats.totalRuns,
      sub: null,
      icon: Activity,
      color: "text-brand-cyan",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.label} variants={item}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {card.label}
                  </p>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <p className="mt-2 font-mono-brand text-2xl font-bold text-foreground">
                  {card.value}
                </p>
                {card.sub && (
                  <p className="mt-0.5 text-xs text-muted-foreground capitalize">
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
