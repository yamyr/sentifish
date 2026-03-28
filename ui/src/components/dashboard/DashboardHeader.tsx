import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProviders } from "@/hooks/useApi";
import { Plus, Loader2 } from "lucide-react";

interface DashboardHeaderProps {
  onNewRun: () => void;
}

export default function DashboardHeader({ onNewRun }: DashboardHeaderProps) {
  const { data: providers, isLoading } = useProviders();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="font-sans-brand text-3xl font-bold tracking-tight text-foreground">
            Web Search Agent{" "}
            <span className="bg-gradient-to-r from-brand-cyan to-brand-indigo bg-clip-text text-transparent">
              Evals
            </span>
          </h1>
          {isLoading ? (
            <Badge variant="secondary" className="gap-1 ring-1 ring-brand-cyan/20">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading
            </Badge>
          ) : (
            <Badge variant="secondary" className="font-mono-brand ring-1 ring-brand-cyan/20">
              {providers?.length ?? 0} providers
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          Benchmark search providers with IR metrics. Compare NDCG, MAP,
          Recall, Content Depth, and Latency across Brave, Serper, Tavily, Exa,
          and TinyFish.
        </p>
      </div>
      <Button onClick={onNewRun} className="relative overflow-hidden gap-2 shrink-0">
        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <Plus className="h-4 w-4" />
        New Evaluation Run
      </Button>
    </motion.div>
  );
}
