import { motion } from "framer-motion";
import { Target, FlaskConical, Plug, Zap, Trophy } from "lucide-react";

const reasons = [
  {
    title: "Define your task, not just queries",
    description:
      "Custom task types let you benchmark exactly what matters. Go beyond generic search — evaluate tools on your specific use case.",
    Icon: Target,
  },
  {
    title: "Add any tool via API",
    description:
      "Integrate any AI tool through HTTP endpoints. Bring your own providers and compare them against the standards.",
    Icon: Plug,
  },
  {
    title: "AI-derived evaluation criteria",
    description:
      "Our metric recommender suggests the right evaluation criteria based on your task, so you measure what matters.",
    Icon: FlaskConical,
  },
  {
    title: "Live provider race",
    description:
      "Watch providers compete in real-time. See results stream in as each tool finishes, with live score updates.",
    Icon: Zap,
  },
  {
    title: "Persistent leaderboard",
    description:
      "Track performance over time across all your evaluation runs. Spot trends, compare versions, find the best tool for each task.",
    Icon: Trophy,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: (i: number) => ({
    opacity: 0,
    x: i % 2 === 0 ? -30 : 30,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const WhySentifish = () => (
  <section id="why" className="overflow-x-hidden bg-gradient-to-br from-secondary/50 to-secondary/30 py-24">
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
          Built for engineers who need data, not opinions, when choosing AI tools.
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
        {reasons.map(({ title, description, Icon }, index) => (
          <motion.div
            key={title}
            custom={index}
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
