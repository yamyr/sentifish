import { useState } from "react";
import { motion } from "framer-motion";
import type { QueryScore } from "@/lib/api/sentifish";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QueryResultsPanelProps {
  query: string;
  scores: QueryScore[];
}

function SnippetText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span className="text-muted-foreground italic">No snippet</span>;
  if (text.length <= 100) return <span>{text}</span>;
  return (
    <span>
      {expanded ? text : `${text.slice(0, 100)}…`}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="ml-1 text-brand-cyan hover:underline text-[10px] font-medium"
      >
        {expanded ? "less" : "more"}
      </button>
    </span>
  );
}

export default function QueryResultsPanel({ query, scores }: QueryResultsPanelProps) {
  const providerScores = scores.filter((s) => s.query === query);

  if (providerScores.length === 0) {
    return (
      <div className="py-3 text-xs text-muted-foreground text-center">
        No results for this query.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-border/50 bg-secondary/30 px-3 pb-3 pt-2"
    >
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        Results for: <span className="text-foreground font-medium">&ldquo;{query}&rdquo;</span>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border/50">
              <th className="text-left py-1.5 pr-3 font-medium w-20">Provider</th>
              <th className="text-left py-1.5 pr-3 font-medium">Top Results</th>
              <th className="text-right py-1.5 font-medium w-24">NDCG</th>
            </tr>
          </thead>
          <tbody>
            {providerScores.map((ps) => {
              const topResults = (ps.results ?? []).slice(0, 3);
              return (
                <tr key={ps.provider} className="border-b border-border/30 align-top">
                  <td className="py-2 pr-3">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {ps.provider}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">
                    {topResults.length > 0 ? (
                      <ol className="space-y-1.5">
                        {topResults.map((r, idx) => (
                          <li key={`${r.url}-${idx}`} className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${
                                  idx === 0
                                    ? "bg-success/20 text-success ring-1 ring-success/30"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {r.rank ?? idx + 1}
                              </span>
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-cyan hover:underline truncate max-w-[300px] inline-flex items-center gap-1"
                                title={r.url}
                              >
                                {r.title || r.url}
                                <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" />
                              </a>
                            </div>
                            <p className="pl-5 text-[11px] text-muted-foreground leading-snug">
                              <SnippetText text={r.snippet} />
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <span className="text-muted-foreground italic">No result data</span>
                    )}
                  </td>
                  <td className="py-2 text-right font-mono-brand">
                    {ps.ndcg_at_k.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
