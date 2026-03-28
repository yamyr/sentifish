import { motion } from "framer-motion";
import {
  Target,
  ListChecks,
  TrendingUp,
  Search,
  Timer,
  type LucideIcon,
} from "lucide-react";

interface Metric {
  name: string;
  explanation: string;
  Icon: LucideIcon;
  color: string;
}

const metrics: Metric[] = [
  {
    name: "Precision@K",
    explanation:
      "Of the top K results, what fraction are actually relevant? High precision means less noise.",
    Icon: Target,
    color: "brand-indigo",
  },
  {
    name: "Recall@K",
    explanation:
      "Of all relevant documents that exist, how many appear in the top K? High recall means nothing important is missed.",
    Icon: ListChecks,
    color: "brand-cyan",
  },
  {
    name: "NDCG@K",
    explanation:
      "Are the most relevant documents ranked near the top? Measures whether the best results appear first.",
    Icon: TrendingUp,
    color: "success",
  },
  {
    name: "MRR",
    explanation:
      "How far down do you scroll before hitting the first relevant result? Lower is better.",
    Icon: Search,
    color: "warning",
  },
  {
    name: "Latency",
    explanation:
      "End-to-end response time in milliseconds. Relevance means nothing if users are waiting.",
    Icon: Timer,
    color: "destructive",
  },
];

const colorMap: Record<string, { bg: string; ring: string; text: string }> = {
  "brand-indigo": {
    bg: "bg-brand-indigo/10",
    ring: "ring-brand-indigo/20",
    text: "text-brand-indigo",
  },
  "brand-cyan": {
    bg: "bg-brand-cyan/10",
    ring: "ring-brand-cyan/20",
    text: "text-brand-cyan",
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

const MetricsExplained = () => (
  <section id="metrics" className="bg-background py-24">
    <div className="mx-auto max-w-6xl px-6">
      <div className="grid gap-12 md:grid-cols-5 md:items-start">
        {/* Left column — section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="md:col-span-2 md:sticky md:top-24"
        >
          <p className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-brand-cyan">
            Metrics
          </p>
          <h2 className="mt-3 font-sans-brand text-3xl font-bold text-foreground">
            What We Measure
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Standard Information Retrieval metrics used by researchers and
            engineers worldwide.
          </p>
        </motion.div>

        {/* Right column — metric rows */}
        <div className="md:col-span-3">
          {metrics.map(({ name, explanation, Icon, color }, index) => {
            const { bg, ring, text } = colorMap[color];

            return (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.08,
                  ease: "easeOut",
                }}
                className={`flex items-start gap-4 py-5${
                  index < metrics.length - 1 ? " border-b border-border" : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg} ring-1 ${ring}`}
                >
                  <Icon className={`h-5 w-5 ${text}`} />
                </div>

                <div>
                  <h3 className="font-mono-brand text-sm font-semibold text-foreground">
                    {name}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {explanation}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default MetricsExplained;
