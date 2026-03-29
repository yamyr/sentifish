import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRun } from "@/hooks/useApi";
import { CheckCircle2, Loader2, Globe, ArrowDown } from "lucide-react";

interface RunProgressPanelProps {
  runId: string;
  onDismiss: () => void;
}

/** Label for TinyFish differs — it's a web agent that takes 90–120s. */
function providerStatusLabel(provider: string, isDone: boolean): string {
  if (isDone) return "Done";
  if (provider === "tinyfish") return "Browsing…";
  return "Running…";
}

function providerStatusIcon(provider: string, isDone: boolean) {
  if (isDone) return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (provider === "tinyfish") return <Globe className="h-4 w-4 text-brand-cyan animate-pulse" />;
  return <Loader2 className="h-4 w-4 text-brand-cyan animate-spin" />;
}

export default function RunProgressPanel({ runId, onDismiss }: RunProgressPanelProps) {
  const { data: run } = useRun(runId);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (run?.status === "completed") {
      const timer = setTimeout(() => setDismissed(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [run?.status]);

  useEffect(() => {
    if (dismissed) onDismiss();
  }, [dismissed, onDismiss]);

  const { completedProviders, totalProviders, providerStatuses } = useMemo(() => {
    if (!run) return { completedProviders: 0, totalProviders: 0, providerStatuses: [] };

    const allProviders = run.providers ?? [];
    const totalProviders = allProviders.length;

    const scoresByProvider = new Map<string, number>();
    for (const score of run.scores ?? []) {
      scoresByProvider.set(score.provider, (scoresByProvider.get(score.provider) ?? 0) + 1);
    }

    const providerStatuses = allProviders.map((provider) => {
      const scoreCount = scoresByProvider.get(provider) ?? 0;
      const isDone = scoreCount > 0;
      return { provider, isDone, scoreCount };
    });

    const completedProviders = providerStatuses.filter((p) => p.isDone).length;

    return { completedProviders, totalProviders, providerStatuses };
  }, [run]);

  const isComplete = run?.status === "completed";
  const progressPercent = totalProviders > 0 ? (completedProviders / totalProviders) * 100 : 0;

  const scrollToRecentRuns = () => {
    const el = document.querySelector("[data-recent-runs]");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    onDismiss();
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="gradient-border border-brand-cyan/30 bg-gradient-to-br from-card to-brand-cyan/[0.03]">
            <CardContent className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-brand-cyan animate-spin" />
                  )}
                  <h3 className="font-sans-brand text-sm font-semibold">
                    {isComplete ? "Evaluation Complete" : "Evaluation Running"}
                  </h3>
                </div>
                <Badge
                  variant="secondary"
                  className="font-mono-brand text-xs ring-1 ring-brand-cyan/20"
                >
                  {completedProviders}/{totalProviders} providers
                </Badge>
              </div>

              {/* Progress bar */}
              <Progress value={progressPercent} className="h-2" />

              {/* Provider list */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {providerStatuses.map(({ provider, isDone, scoreCount }) => (
                  <div
                    key={provider}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isDone
                        ? "border-success/30 bg-success/5"
                        : "border-border bg-card"
                    }`}
                  >
                    {providerStatusIcon(provider, isDone)}
                    <span className="capitalize font-medium truncate">{provider}</span>
                    {isDone && (
                      <Badge variant="secondary" className="ml-auto text-xs font-mono-brand">
                        {scoreCount}
                      </Badge>
                    )}
                    {!isDone && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {providerStatusLabel(provider, isDone)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Complete CTA */}
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    onClick={scrollToRecentRuns}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Complete — View Results
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
