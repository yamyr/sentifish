import { motion } from "framer-motion";
import { Scale, FlaskConical, Code2, Plug } from "lucide-react";

const reasons = [
  {
    title: "Unbiased Benchmarks",
    description:
      "Same queries, same datasets, fair comparison. No provider gets preferential treatment or cherry-picked examples.",
    Icon: Scale,
  },
  {
    title: "Real IR Metrics",
    description:
      "Not vibes, actual information retrieval science. Every score is computed with peer-reviewed formulas used in academic research.",
    Icon: FlaskConical,
  },
  {
    title: "Open Source",
    description:
      "Fully transparent methodology. Inspect the scoring code, audit the datasets, and reproduce every benchmark yourself.",
    Icon: Code2,
  },
  {
    title: "API-First",
    description:
      "Integrate evaluations into your CI/CD pipeline. Catch search quality regressions before they hit production.",
    Icon: Plug,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const WhySentifish = () => (
  <section id="why" className="bg-gradient-to-br from-secondary/50 to-secondary/30 py-24">
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
          Why
        </p>
        <h2 className="mt-3 font-sans-brand text-3xl font-bold text-foreground sm:text-4xl">
          Why <span className="bg-gradient-to-r from-brand-cyan to-brand-indigo bg-clip-text text-transparent">Sentifish?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Built for engineers who need data, not opinions, when choosing a
          search provider.
        </p>
      </motion.div>

      {/* Value prop grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-6 sm:grid-cols-2"
      >
        {reasons.map(({ title, description, Icon }) => (
          <motion.div
            key={title}
            variants={cardVariants}
            className="gradient-border flex gap-5 rounded-2xl border border-border bg-card p-6 hover:shadow-xl hover:shadow-brand-indigo/8 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="glow-indigo flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-indigo/10 ring-1 ring-brand-indigo/20">
              <Icon className="h-5 w-5 text-brand-indigo" />
            </div>
            <div>
              <h3 className="font-sans-brand text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default WhySentifish;
