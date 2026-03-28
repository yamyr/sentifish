import { motion } from "framer-motion";
import { Target, ListChecks, TrendingUp, Search, Timer } from "lucide-react";

const metrics = [
  {
    name: "Precision@K",
    question: "How many top results are relevant?",
    detail:
      "Of the first K results returned, what fraction are actually useful? High precision means less noise in your results.",
    Icon: Target,
    accent: "brand-indigo",
    bgClass: "bg-brand-indigo/10",
    textClass: "text-brand-indigo",
    ringClass: "ring-brand-indigo/20",
  },
  {
    name: "Recall@K",
    question: "How many relevant results did we find?",
    detail:
      "Of all the relevant documents that exist, how many appear in the top K? High recall means nothing important is missed.",
    Icon: ListChecks,
    accent: "brand-cyan",
    bgClass: "bg-brand-cyan/10",
    textClass: "text-brand-cyan",
    ringClass: "ring-brand-cyan/20",
  },
  {
    name: "NDCG@K",
    question: "Are the best results ranked highest?",
    detail:
      "Normalized Discounted Cumulative Gain measures whether the most relevant documents appear near the top of the list.",
    Icon: TrendingUp,
    accent: "success",
    bgClass: "bg-success/10",
    textClass: "text-success",
    ringClass: "ring-success/20",
  },
  {
    name: "MRR",
    question: "How quickly do you find the first good result?",
    detail:
      "Mean Reciprocal Rank tells you how far down you have to scroll before hitting the first relevant result.",
    Icon: Search,
    accent: "warning",
    bgClass: "bg-warning/10",
    textClass: "text-warning",
    ringClass: "ring-warning/20",
  },
  {
    name: "Latency",
    question: "How fast does the provider respond?",
    detail:
      "End-to-end response time in milliseconds. Because relevance means nothing if your users are waiting.",
    Icon: Timer,
    accent: "danger",
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    ringClass: "ring-destructive/20",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const MetricsExplained = () => (
  <section className="bg-background py-24">
    <div className="mx-auto max-w-6xl px-6">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-14 text-center"
      >
        <p className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-brand-cyan">
          Metrics
        </p>
        <h2 className="mt-3 font-sans-brand text-3xl font-bold text-foreground sm:text-4xl">
          What We Measure
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Standard Information Retrieval metrics used by researchers and
          engineers worldwide.
        </p>
      </motion.div>

      {/* Metrics grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {metrics.map(({ name, question, detail, Icon, bgClass, textClass, ringClass }) => (
          <motion.div
            key={name}
            variants={cardVariants}
            className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${bgClass} ring-1 ${ringClass}`}
            >
              <Icon className={`h-5 w-5 ${textClass}`} />
            </div>
            <h3 className="font-mono-brand text-sm font-semibold text-foreground">
              {name}
            </h3>
            <p className="mt-1.5 font-sans-brand text-base font-medium text-foreground">
              {question}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {detail}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default MetricsExplained;
