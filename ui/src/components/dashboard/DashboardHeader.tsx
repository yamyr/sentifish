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
            Web Search Agent Evals
          </h1>
          {isLoading ? (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading
            </Badge>
          ) : (
            <Badge variant="secondary" className="font-mono-brand">
              {providers?.length ?? 0} providers
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          Benchmark search providers with IR metrics. Compare precision, recall,
          NDCG, MRR, and latency across Brave, Serper, SerpAPI, Tavily, Exa, and TinyFish.
        </p>
      </div>
      <Button onClick={onNewRun} className="gap-2 shrink-0">
        <Plus className="h-4 w-4" />
        New Evaluation Run
      </Button>
    </motion.div>
  );
}
