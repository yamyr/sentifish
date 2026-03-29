import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

const METRIC_DESCRIPTIONS: Record<string, string> = {
  precision_at_k: "Precision@K: fraction of the top-K results that are relevant. Higher = fewer irrelevant results.",
  recall_at_k: "Recall@K: fraction of all known relevant documents found in the top-K results. Higher = better coverage.",
  ndcg_at_k: "NDCG@K: Normalized Discounted Cumulative Gain. Rewards relevant results appearing higher in the ranking.",
  mrr: "MRR: Mean Reciprocal Rank. Measures how quickly the first relevant result appears (1/rank). Higher = relevant result found faster.",
  map_at_k: "MAP@K: Mean Average Precision. Average precision across all recall levels.",
  content_depth: "Content Depth: normalized average snippet length (0–1, capped at 500 chars). Indicates result richness.",
  llm_judge_score: "LLM Judge: semantic relevance score from an AI evaluator (0–1). Requires OpenAI API key to be configured.",
  composite_score: "Composite Quality Score (0–100): weighted blend of NDCG×35% + Precision×25% + Recall×25% + MRR×15%.",
  latency_ms: "Latency: wall-clock response time in milliseconds. Lower = faster provider.",
};

interface MetricTooltipProps {
  metric: string;
  label: string;
}

export function MetricTooltip({ metric, label }: MetricTooltipProps) {
  const desc = METRIC_DESCRIPTIONS[metric];
  if (!desc) return <span>{label}</span>;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center gap-1 cursor-help">
          {label}
          <HelpCircle className="h-3 w-3 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{desc}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
