import { motion } from "framer-motion";
import { Database, Play, BarChart3 } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Choose Dataset",
    description:
      "Pick from curated query sets or create your own. Each dataset includes queries with known-relevant documents for precise scoring.",
    Icon: Database,
  },
  {
    number: "02",
    title: "Run Evaluation",
    description:
      "Query all providers simultaneously with the same inputs. Every request is timed, cached, and logged for reproducibility.",
    Icon: Play,
  },
  {
    number: "03",
    title: "Compare Results",
    description:
      "See side-by-side metrics with interactive charts. Export data or drill into individual queries to understand where providers differ.",
    Icon: BarChart3,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const HowItWorks = () => (
  <section className="bg-secondary/50 py-24">
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
          Workflow
        </p>
        <h2 className="mt-3 font-sans-brand text-3xl font-bold text-foreground sm:text-4xl">
          Three Steps to Better Search
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          From dataset to decision in minutes, not weeks.
        </p>
      </motion.div>

      {/* Steps */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-8 md:grid-cols-3"
      >
        {steps.map(({ number, title, description, Icon }, idx) => (
          <motion.div key={number} variants={stepVariants} className="relative">
            {/* Connector line (hidden on last item and on mobile) */}
            {idx < steps.length - 1 && (
              <div className="pointer-events-none absolute right-0 top-10 hidden h-px w-8 translate-x-full bg-border md:block" />
            )}

            <div className="rounded-2xl border border-border bg-card p-8">
              {/* Step number */}
              <span className="font-mono-brand text-xs font-semibold text-brand-cyan">
                {number}
              </span>

              {/* Icon */}
              <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-indigo/10 ring-1 ring-brand-indigo/20">
                <Icon className="h-5 w-5 text-brand-indigo" />
              </div>

              {/* Content */}
              <h3 className="mt-5 font-sans-brand text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default HowItWorks;
