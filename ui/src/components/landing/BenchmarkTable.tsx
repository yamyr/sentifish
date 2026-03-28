import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Zap, Globe, Fish, Trophy, type LucideIcon } from "lucide-react";

// TODO: fetch from /api/runs/latest

interface Benchmark {
  name: string;
  ndcg: number;
  map: number;
  recall: number;
  contentDepth: number;
  latency: number;
  color: string;
  Icon: LucideIcon;
}

const benchmarks: Benchmark[] = [
  { name: "Brave", ndcg: 0.82, map: 0.79, recall: 0.74, contentDepth: 0.35, latency: 320, color: "brand-indigo", Icon: Shield },
  { name: "Serper", ndcg: 0.89, map: 0.85, recall: 0.80, contentDepth: 0.40, latency: 245, color: "brand-cyan", Icon: Zap },
  { name: "Tavily", ndcg: 0.85, map: 0.82, recall: 0.78, contentDepth: 0.45, latency: 410, color: "warning", Icon: Globe },
  { name: "TinyFish", ndcg: 0.78, map: 0.73, recall: 0.76, contentDepth: 0.92, latency: 1850, color: "success", Icon: Fish },
];

type ScoreKey = "ndcg" | "map" | "recall" | "contentDepth";

const scoreKeys: ScoreKey[] = ["ndcg", "map", "recall", "contentDepth"];

/** Find the best value per metric (highest for scores, lowest for latency). */
function computeBests(data: Benchmark[]) {
  const bests: Record<string, number> = {};
  for (const key of scoreKeys) {
    bests[key] = Math.max(...data.map((b) => b[key]));
  }
  bests.latency = Math.min(...data.map((b) => b.latency));
  return bests;
}

const bests = computeBests(benchmarks);

const MAX_LATENCY = 2000;

const rowVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const, delay: i * 0.08 },
  }),
};

/** A mini horizontal bar rendered behind a score value. */
function ScoreBar({
  value,
  max,
  color,
  isBest,
}: {
  value: number;
  max: number;
  color: string;
  isBest: boolean;
}) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div
      className={`relative flex items-center rounded px-3 py-1.5 ${
        isBest ? "bg-brand-cyan/8" : ""
      }`}
    >
      <motion.div
        className={`absolute inset-y-0 left-0 rounded bg-${color}/15`}
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.1 }}
      />
      <span className="relative flex items-center gap-1 font-mono-brand text-sm text-foreground">
        {isBest && <Trophy className="h-3 w-3 text-brand-cyan" />}
        {value}
      </span>
    </div>
  );
}

function LatencyBar({
  value,
  color,
  isBest,
}: {
  value: number;
  color: string;
  isBest: boolean;
}) {
  const pct = Math.min((value / MAX_LATENCY) * 100, 100);

  return (
    <div
      className={`relative flex items-center rounded px-3 py-1.5 ${
        isBest ? "bg-brand-cyan/8" : ""
      }`}
    >
      <motion.div
        className={`absolute inset-y-0 left-0 rounded bg-${color}/15`}
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.1 }}
      />
      <span className="relative flex items-center gap-1 font-mono-brand text-sm text-foreground">
        {isBest && <Trophy className="h-3 w-3 text-brand-cyan" />}
        {value}
        <span className="ml-0.5 text-muted-foreground">ms</span>
      </span>
    </div>
  );
}

/** Desktop table view (hidden below md). */
function DesktopTable() {
  return (
    <div className="hidden md:block">
      <div className="rounded-2xl border border-border bg-card overflow-hidden glow-indigo gradient-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              <th
                scope="col"
                className="px-6 py-4 font-sans-brand text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Provider
              </th>
              <th
                scope="col"
                className="px-6 py-4 font-sans-brand text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                NDCG@K
              </th>
              <th
                scope="col"
                className="px-6 py-4 font-sans-brand text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                MAP@K
              </th>
              <th
                scope="col"
                className="px-6 py-4 font-sans-brand text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Recall@K
              </th>
              <th
                scope="col"
                className="px-6 py-4 font-sans-brand text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Content Depth
              </th>
              <th
                scope="col"
                className="px-6 py-4 font-sans-brand text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Latency
              </th>
            </tr>
          </thead>
          <motion.tbody
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {benchmarks.map((b, i) => {
              const { Icon, color } = b;
              const isLast = i === benchmarks.length - 1;

              return (
                <motion.tr
                  key={b.name}
                  custom={i}
                  variants={rowVariants}
                  className={`hover:bg-brand-cyan/[0.03] transition-colors ${isLast ? "" : "border-b border-border"}`}
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-normal"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${color}/10 ring-1 ring-${color}/20`}
                      >
                        <Icon className={`h-4 w-4 text-${color}`} />
                      </div>
                      <span className="font-sans-brand text-sm font-semibold text-foreground">
                        {b.name}
                      </span>
                    </div>
                  </th>
                  <td className="px-6 py-4">
                    <ScoreBar
                      value={b.ndcg}
                      max={1.0}
                      color={color}
                      isBest={b.ndcg === bests.ndcg}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <ScoreBar
                      value={b.map}
                      max={1.0}
                      color={color}
                      isBest={b.map === bests.map}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <ScoreBar
                      value={b.recall}
                      max={1.0}
                      color={color}
                      isBest={b.recall === bests.recall}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <ScoreBar
                      value={b.contentDepth}
                      max={1.0}
                      color={color}
                      isBest={b.contentDepth === bests.contentDepth}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <LatencyBar
                      value={b.latency}
                      color={color}
                      isBest={b.latency === bests.latency}
                    />
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}

/** Mobile card view (visible below md). */
function MobileCards() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="flex flex-col gap-4 md:hidden"
    >
      {benchmarks.map((b, i) => {
        const { Icon, color } = b;

        return (
          <motion.div
            key={b.name}
            custom={i}
            variants={rowVariants}
            className="rounded-2xl border border-border bg-card p-5"
          >
            {/* Provider header */}
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-${color}/10 ring-1 ring-${color}/20`}
              >
                <Icon className={`h-4 w-4 text-${color}`} />
              </div>
              <span className="font-sans-brand text-base font-semibold text-foreground">
                {b.name}
              </span>
            </div>

            {/* Metrics list */}
            <dl className="space-y-3">
              {(
                [
                  ["NDCG@K", b.ndcg, bests.ndcg],
                  ["MAP@K", b.map, bests.map],
                  ["Recall@K", b.recall, bests.recall],
                  ["Content Depth", b.contentDepth, bests.contentDepth],
                ] as const
              ).map(([label, value, best]) => (
                <div
                  key={label}
                  className="flex items-center justify-between"
                >
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                  </dt>
                  <dd>
                    <ScoreBar
                      value={value}
                      max={1.0}
                      color={color}
                      isBest={value === best}
                    />
                  </dd>
                </div>
              ))}

              <div className="flex items-center justify-between">
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Avg Latency
                </dt>
                <dd>
                  <LatencyBar
                    value={b.latency}
                    color={color}
                    isBest={b.latency === bests.latency}
                  />
                </dd>
              </div>
            </dl>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

const BenchmarkTable = () => (
  <section id="providers" className="overflow-x-hidden bg-background py-24">
    <div className="mx-auto max-w-6xl px-6">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-14 text-center"
      >
        <p className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-brand-cyan">
          Benchmarks
        </p>
        <h2 className="mt-3 font-sans-brand text-3xl font-bold text-foreground sm:text-4xl">
          Four Providers,{" "}
          <span className="bg-gradient-to-r from-brand-cyan to-brand-indigo bg-clip-text text-transparent">
            One Benchmark
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Same queries, same dataset, scored with real IR metrics.
        </p>
      </motion.div>

      {/* Table (desktop) / Cards (mobile) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <DesktopTable />
        <MobileCards />
      </motion.div>

      {/* Footer */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="font-mono-brand text-xs text-muted-foreground mt-4 text-center">
          Scores from sample dataset. Results vary by query set.
        </p>
        <Link
          to="/dashboard"
          className="font-sans-brand text-sm font-semibold text-brand-cyan transition-colors hover:text-brand-cyan/80"
        >
          Run your own benchmark &rarr;
        </Link>
      </div>
    </div>
  </section>
);

export default BenchmarkTable;
