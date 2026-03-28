import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useRuns } from "@/hooks/useApi";
import { Sparkles } from "lucide-react";

export default function InsightCard() {
  const { data: runs } = useRuns();

  const insight = useMemo(() => {
    const completedRuns = (runs ?? []).filter(
      (r) => r.status === "completed" && r.scores.length > 0
    );

    if (completedRuns.length === 0) {
      return {
        text: "Run your first evaluation to see AI-generated insights comparing search providers across precision, recall, NDCG, and latency metrics.",
        hasData: false,
      };
    }

    // Aggregate across all completed runs
    const agg: Record<
      string,
      {
        ndcg: number[];
        latency: number[];
        recall: number[];
        precision: number[];
      }
    > = {};

    for (const run of completedRuns) {
      for (const score of run.scores) {
        if (!agg[score.provider]) {
          agg[score.provider] = {
            ndcg: [],
            latency: [],
            recall: [],
            precision: [],
          };
        }
        agg[score.provider].ndcg.push(score.ndcg_at_k);
        agg[score.provider].latency.push(score.latency_ms);
        agg[score.provider].recall.push(score.recall_at_k);
        agg[score.provider].precision.push(score.precision_at_k);
      }
    }

    const mean = (arr: number[]) =>
      arr.reduce((a, b) => a + b, 0) / arr.length;

    let bestNdcgProvider = "";
    let bestNdcg = -1;
    let fastestProvider = "";
    let fastestLatency = Infinity;
    let bestRecallProvider = "";
    let bestRecall = -1;

    for (const [provider, data] of Object.entries(agg)) {
      const avgNdcg = mean(data.ndcg);
      const avgLatency = mean(data.latency);
      const avgRecall = mean(data.recall);

      if (avgNdcg > bestNdcg) {
        bestNdcg = avgNdcg;
        bestNdcgProvider = provider;
      }
      if (avgLatency < fastestLatency) {
        fastestLatency = avgLatency;
        fastestProvider = provider;
      }
      if (avgRecall > bestRecall) {
        bestRecall = avgRecall;
        bestRecallProvider = provider;
      }
    }

    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const parts: string[] = [];
    parts.push(
      `${cap(bestNdcgProvider)} achieves the highest NDCG@K at ${bestNdcg.toFixed(3)}`
    );

    if (fastestProvider !== bestNdcgProvider) {
      parts.push(
        `while ${cap(fastestProvider)} leads on speed at ${Math.round(fastestLatency)}ms avg latency`
      );
    } else {
      parts.push(
        `with an average latency of ${Math.round(fastestLatency)}ms`
      );
    }

    if (
      bestRecallProvider !== bestNdcgProvider &&
      bestRecallProvider !== fastestProvider
    ) {
      parts.push(
        `${cap(bestRecallProvider)} shows the strongest recall at ${bestRecall.toFixed(3)}`
      );
    }

    const text =
      parts.slice(0, 2).join(", ") +
      "." +
      (parts.length > 2 ? ` ${parts[2]}.` : "") +
      ` Based on ${completedRuns.length} completed evaluation${completedRuns.length > 1 ? "s" : ""}.`;

    return { text, hasData: true };
  }, [runs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="border-brand-indigo/20 bg-brand-indigo/[0.03]">
        <CardContent className="flex items-start gap-3 p-5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-indigo/10">
            <Sparkles className="h-4 w-4 text-brand-indigo" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-indigo mb-1">
              Insight
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              {insight.text}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
