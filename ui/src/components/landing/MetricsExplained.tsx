import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Target,
  ListChecks,
  FileText,
  Timer,
  type LucideIcon,
} from "lucide-react";

type Winner = "traditional" | "tinyfish" | "depends";

interface Metric {
  id: string;
  name: string;
  tagline: string;
  description: string;
  winner: Winner;
  winnerNote: string;
  Icon: LucideIcon;
  color: string;
}

const metrics: Metric[] = [
  {
    id: "ndcg",
    name: "NDCG@K",
    tagline: "Are the best results ranked highest?",
    description:
      "Normalized Discounted Cumulative Gain measures whether the most relevant results appear at the top of the ranked list. It penalizes relevant results buried lower — a perfect score means every top-K result is relevant, ordered by decreasing relevance.",
    winner: "traditional",
    winnerNote:
      "Traditional cached-index APIs excel here because their ranking algorithms are tuned over billions of queries.",
    Icon: TrendingUp,
    color: "brand-cyan",
  },
  {
    id: "map",
    name: "MAP@K",
    tagline: "Consistently precise across all queries?",
    description:
      "Mean Average Precision evaluates precision at every recall level and averages across queries. It rewards systems that are consistently precise — not just good on average, but good across all query types.",
    winner: "traditional",
    winnerNote:
      "Traditional APIs benefit from mature ranking pipelines that deliver consistent precision across diverse query types.",
    Icon: Target,
    color: "brand-indigo",
  },
  {
    id: "recall",
    name: "Recall@K",
    tagline: "How many relevant docs did we actually find?",
    description:
      "Of all the relevant documents that exist, how many did we actually find in the top K? This varies by use case — TinyFish's live browsing sometimes surfaces pages that cached indices haven't indexed yet, while traditional APIs have broader coverage of their indexed corpus.",
    winner: "depends",
    winnerNote:
      "The swing metric. For exhaustive searches (legal, compliance), traditional APIs' larger corpus wins. For freshness-sensitive queries, TinyFish's live browsing finds what cached indices haven't indexed yet.",
    Icon: ListChecks,
    color: "warning",
  },
  {
    id: "content-depth",
    name: "Content Depth",
    tagline: "How rich are the returned snippets?",
    description:
      "This is where TinyFish differentiates. Because it browses and renders real pages (executing JavaScript, expanding dynamic content), the returned snippets are substantially richer than cached, truncated index entries from traditional APIs. Score is normalized so 1.0 equals an average of 500+ characters per snippet.",
    winner: "tinyfish",
    winnerNote:
      "TinyFish produces snippets that are 2-3x richer than traditional APIs. Decisive for RAG pipelines where richer context = better LLM generation.",
    Icon: FileText,
    color: "success",
  },
  {
    id: "latency",
    name: "Latency",
    tagline: "How fast does the provider respond?",
    description:
      "Raw response time in milliseconds. Traditional APIs serve from pre-built indices and are inherently faster. TinyFish pays a speed cost for live rendering — the tradeoff for richer content.",
    winner: "traditional",
    winnerNote:
      "Traditional APIs are 2-5x faster. But in RAG workflows, LLM inference time already dwarfs retrieval latency, making this less decisive.",
    Icon: Timer,
    color: "destructive",
  },
];

const colorMap: Record<string, { bg: string; ring: string; text: string }> = {
  "brand-cyan": {
    bg: "bg-brand-cyan/10",
    ring: "ring-brand-cyan/20",
    text: "text-brand-cyan",
  },
  "brand-indigo": {
    bg: "bg-brand-indigo/10",
    ring: "ring-brand-indigo/20",
    text: "text-brand-indigo",
  },
  success: {
    bg: "bg-success/10",
    ring: "ring-success/20",
    text: "text-success",
  },
  warning: {
    bg: "bg-warning/10",
    ring: "ring-warning/20",
    text: "text-warning",
  },
  destructive: {
    bg: "bg-destructive/10",
    ring: "ring-destructive/20",
    text: "text-destructive",
  },
};

const winnerBadge: Record<Winner, { label: string; className: string }> = {
  traditional: {
    label: "Traditional APIs",
    className:
      "bg-brand-indigo/10 text-brand-indigo ring-1 ring-brand-indigo/20",
  },
  tinyfish: {
    label: "TinyFish",
    className: "bg-success/10 text-success ring-1 ring-success/20",
  },
  depends: {
    label: "It Depends",
    className: "bg-warning/10 text-warning ring-1 ring-warning/20",
  },
};

const MetricsExplained = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeMetric = metrics.find((m) => m.id === activeId);

  return (
    <section id="metrics" className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <p className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-brand-cyan">
            Metrics
          </p>
          <h2 className="mt-3 font-sans-brand text-3xl font-bold text-foreground sm:text-4xl">
            What We{" "}
            <span className="bg-gradient-to-r from-brand-cyan to-brand-indigo bg-clip-text text-transparent">
              Measure
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            The metrics tell a tradeoff story, not a winner-takes-all story.
            Click any metric to see the comparative breakdown.
          </p>
        </motion.div>

        {/* Tradeoff summary badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-14 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="flex items-center gap-2 rounded-full bg-brand-indigo/8 px-4 py-1.5 text-xs font-medium text-brand-indigo ring-1 ring-brand-indigo/15">
            <span className="h-2 w-2 rounded-full bg-brand-indigo" />
            Traditional APIs win 3 metrics
          </span>
          <span className="flex items-center gap-2 rounded-full bg-success/8 px-4 py-1.5 text-xs font-medium text-success ring-1 ring-success/15">
            <span className="h-2 w-2 rounded-full bg-success" />
            TinyFish wins Content Depth
          </span>
          <span className="flex items-center gap-2 rounded-full bg-warning/8 px-4 py-1.5 text-xs font-medium text-warning ring-1 ring-warning/15">
            <span className="h-2 w-2 rounded-full bg-warning" />
            Recall@K depends on use case
          </span>
        </motion.div>

        {/* Metric cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric, index) => {
            const { bg, ring, text } = colorMap[metric.color];
            const isActive = activeId === metric.id;
            const badge = winnerBadge[metric.winner];

            return (
              <motion.button
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.06,
                  ease: "easeOut",
                }}
                onClick={() =>
                  setActiveId(isActive ? null : metric.id)
                }
                className={`group relative cursor-pointer rounded-2xl border p-5 text-left transition-all duration-300 ${
                  isActive
                    ? `border-brand-cyan/30 bg-card shadow-lg shadow-brand-cyan/5`
                    : "border-border bg-card hover:border-brand-cyan/20 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="metric-active-ring"
                    className="absolute inset-0 rounded-2xl ring-2 ring-brand-cyan/25"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${bg} ring-1 ${ring}`}
                >
                  <metric.Icon className={`h-5 w-5 ${text}`} />
                </div>

                {/* Name */}
                <h3 className="font-mono-brand text-sm font-semibold text-foreground">
                  {metric.name}
                </h3>

                {/* Tagline */}
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {metric.tagline}
                </p>

                {/* Winner badge */}
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono-brand text-[10px] font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Expanded detail panel */}
        <AnimatePresence mode="wait">
          {activeMetric && (
            <motion.div
              key={activeMetric.id}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Left: description */}
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          colorMap[activeMetric.color].bg
                        } ring-1 ${colorMap[activeMetric.color].ring}`}
                      >
                        <activeMetric.Icon
                          className={`h-5 w-5 ${
                            colorMap[activeMetric.color].text
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-mono-brand text-base font-semibold text-foreground">
                          {activeMetric.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {activeMetric.tagline}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {activeMetric.description}
                    </p>
                  </div>

                  {/* Right: who wins + insight */}
                  <div className="flex flex-col justify-center">
                    <div className="rounded-xl bg-secondary/60 p-5">
                      <p className="mb-2 font-mono-brand text-[10px] uppercase tracking-widest text-muted-foreground">
                        Who wins this metric?
                      </p>
                      <div className="mb-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 font-mono-brand text-xs font-semibold ${
                            winnerBadge[activeMetric.winner].className
                          }`}
                        >
                          {winnerBadge[activeMetric.winner].label}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {activeMetric.winnerNote}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Use case summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 grid gap-4 md:grid-cols-2"
        >
          {/* Traditional APIs use cases */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-indigo" />
              <h4 className="font-sans-brand text-sm font-semibold text-foreground">
                When Traditional APIs Win
              </h4>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use cases where speed and ranking precision dominate: autocomplete,
              real-time search UIs, high-throughput batch indexing, and any
              scenario where the user sees raw result ordering.
            </p>
          </div>

          {/* TinyFish use cases */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              <h4 className="font-sans-brand text-sm font-semibold text-foreground">
                When TinyFish Wins
              </h4>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use cases where snippet richness matters more than speed: RAG
              pipelines feeding LLMs, research summarization, content extraction,
              and any workflow where LLM inference time already dwarfs retrieval
              latency.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MetricsExplained;
