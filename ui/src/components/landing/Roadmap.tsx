import { motion } from "framer-motion";
import { Brain, Bot, BellRing, Sparkles, Swords, type LucideIcon } from "lucide-react";
import NeuralBackground from "./NeuralBackground";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const vision =
  "From search benchmarking to full agent observability — think Datadog, but for agents.";

type Status = "next" | "planned" | "future";

interface Milestone {
  title: string;
  description: string;
  icon: LucideIcon;
  status: Status;
}

const milestones: Milestone[] = [
  {
    title: "LLM-as-Judge Scoring",
    description:
      "Semantic relevance scoring via OpenAI. Evaluate answer quality, not just URL matches.",
    icon: Brain,
    status: "next",
  },
  {
    title: "Agent Output Evaluation",
    description:
      "Beyond search: benchmark any web agent's task output for correctness and drift.",
    icon: Bot,
    status: "planned",
  },
  {
    title: "Drift Detection & Alerts",
    description:
      "Scheduled re-evaluation with auto-alerting when agent quality degrades over time.",
    icon: BellRing,
    status: "planned",
  },
  {
    title: "Self-Improving Baselines",
    description:
      "Auto-classify real drift vs benign change. Adapt baselines without manual intervention.",
    icon: Sparkles,
    status: "future",
  },
  {
    title: "Multi-Agent Arena",
    description:
      "Head-to-head comparison of browser agents on identical tasks, scored with the same metrics.",
    icon: Swords,
    status: "future",
  },
];

/* ------------------------------------------------------------------ */
/*  Status-driven style maps                                           */
/* ------------------------------------------------------------------ */

const iconContainerStyle: Record<Status, string> = {
  next: "bg-brand-cyan/20 text-brand-cyan glow-cyan",
  planned: "bg-brand-indigo/15 text-brand-indigo",
  future: "bg-white/10 text-white/50",
};

const dotStyle: Record<Status, string> = {
  next: "h-4 w-4 bg-brand-cyan",
  planned: "h-3 w-3 bg-brand-indigo",
  future: "h-2.5 w-2.5 bg-white/30",
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Glowing dot on the timeline */
const TimelineDot = ({ status }: { status: Status }) => (
  <div className="relative flex items-center justify-center">
    {/* Ping ring for "next" status */}
    {status === "next" && (
      <span className="absolute h-4 w-4 animate-ping rounded-full bg-brand-cyan/40" />
    )}
    <span className={`relative z-10 rounded-full ${dotStyle[status]}`} />
  </div>
);

/** Single milestone card */
const MilestoneCard = ({
  milestone,
  index,
}: {
  milestone: Milestone;
  index: number;
}) => {
  const Icon = milestone.icon;
  const isLeft = index % 2 === 0; // even = left on desktop

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.08 }}
      className="gradient-border rounded-2xl bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-brand-cyan/5"
    >
      {/* Icon + badge row */}
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconContainerStyle[milestone.status]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {milestone.status === "next" && (
          <span className="rounded-full bg-brand-cyan/15 px-2.5 py-0.5 font-mono-brand text-[10px] uppercase tracking-wider text-brand-cyan">
            Up Next
          </span>
        )}
      </div>

      {/* Text */}
      <h3 className="font-sans-brand text-lg font-semibold text-white">
        {milestone.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/50">
        {milestone.description}
      </p>
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const Roadmap = () => (
  <section
    id="roadmap"
    className="relative overflow-hidden bg-gradient-to-b from-brand-navy via-brand-navy/95 to-brand-navy py-24"
  >
    {/* Neural network background */}
    <NeuralBackground
      nodeCount={50}
      connectionDistance={140}
      opacity={0.4}
      secondaryColor="130, 120, 255"
    />

    <div className="relative mx-auto max-w-6xl px-6">
      {/* ---- Section header ---- */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="mb-16 text-center"
      >
        <p className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-brand-cyan">
          Roadmap
        </p>
        <h2 className="mt-3 font-sans-brand text-3xl font-bold text-white sm:text-4xl">
          Where We're{" "}
          <span className="bg-gradient-to-r from-brand-cyan to-brand-indigo bg-clip-text text-transparent">
            Headed
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/50">
          {vision}
        </p>
      </motion.div>

      {/* ---- Timeline ---- */}
      <div className="relative">
        {/* Vertical glowing line */}
        <div
          aria-hidden
          className="absolute left-4 top-0 bottom-12 w-px md:left-1/2 md:-translate-x-px"
        >
          {/* Gradient line */}
          <div className="h-full w-full bg-gradient-to-b from-brand-cyan via-brand-indigo/60 to-transparent" />
          {/* Pulsing glow overlay */}
          <div className="absolute inset-0 w-full bg-gradient-to-b from-brand-cyan via-brand-indigo/60 to-transparent opacity-50 blur-sm animate-pulse-glow" />
        </div>

        {/* Milestone rows */}
        <div className="relative flex flex-col gap-12">
          {milestones.map((milestone, index) => {
            const isLeft = index % 2 === 0;

            return (
              <div
                key={milestone.title}
                className="relative grid grid-cols-[32px_1fr] items-start gap-4 md:grid-cols-[1fr_32px_1fr] md:gap-8"
              >
                {/* ---- Desktop left column ---- */}
                <div
                  className={`hidden md:block ${
                    isLeft ? "" : "md:col-start-1"
                  }`}
                >
                  {isLeft && (
                    <MilestoneCard milestone={milestone} index={index} />
                  )}
                </div>

                {/* ---- Center dot + connector ---- */}
                <div className="relative flex justify-center md:col-start-2">
                  {/* Horizontal connector: extends left or right toward the card */}
                  <div
                    aria-hidden
                    className={`absolute top-1/2 hidden h-px w-8 -translate-y-1/2 md:block ${
                      isLeft
                        ? "right-full bg-gradient-to-l from-brand-cyan/40 to-transparent"
                        : "left-full bg-gradient-to-r from-brand-indigo/40 to-transparent"
                    }`}
                  />
                  <TimelineDot status={milestone.status} />
                </div>

                {/* ---- Desktop right column ---- */}
                <div
                  className={`hidden md:block ${
                    !isLeft ? "" : "md:col-start-3"
                  }`}
                >
                  {!isLeft && (
                    <MilestoneCard milestone={milestone} index={index} />
                  )}
                </div>

                {/* ---- Mobile card (always right of dot) ---- */}
                <div className="md:hidden">
                  <MilestoneCard milestone={milestone} index={index} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Fade-to-future tail */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-col items-center"
        >
          {/* Fading dots */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
            <span className="h-1 w-1 rounded-full bg-white/5" />
          </div>
          <p className="mt-4 font-mono-brand text-xs tracking-wider text-white/25">
            ...and more
          </p>
        </motion.div>
      </div>
    </div>
  </section>
);

export default Roadmap;
