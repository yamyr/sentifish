import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Fish, ExternalLink, ArrowRight } from "lucide-react";

const floatingBadges = [
  { label: "NDCG", value: "0.891", delay: 0 },
  { label: "MRR", value: "0.92", delay: 0.15 },
  { label: "P@K", value: "0.87", delay: 0.3 },
];

const Hero = () => (
  <section className="relative w-full overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy to-brand-indigo">
    {/* Subtle grid overlay */}
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--brand-cyan)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--brand-cyan)) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />

    <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
      <div className="flex flex-col items-center text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/15 ring-1 ring-brand-cyan/30">
            <Fish className="h-6 w-6 text-brand-cyan" />
          </div>
          <span className="font-sans-brand text-2xl font-bold text-white">
            Sentifish
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-sans-brand text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Know Which Search API
          <br />
          <span className="bg-gradient-to-r from-brand-cyan to-brand-indigo bg-clip-text text-transparent">
            Actually Works
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 max-w-2xl font-sans-brand text-lg leading-relaxed text-white/60 sm:text-xl"
        >
          Compare search providers head-to-head with real Information Retrieval
          metrics. No guesswork, no vibes &mdash; just science.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 rounded-xl bg-brand-cyan px-7 py-3.5 font-sans-brand text-sm font-semibold text-brand-navy shadow-lg shadow-brand-cyan/25 transition-all hover:shadow-brand-cyan/40 hover:brightness-110"
          >
            Start Evaluating
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="https://github.com/yamyr/sentifish"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-sans-brand text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10"
          >
            View on GitHub
            <ExternalLink className="h-4 w-4" />
          </a>
        </motion.div>

        {/* Floating metric badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-4"
        >
          {floatingBadges.map((badge) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.7 + badge.delay,
                type: "spring",
                stiffness: 200,
              }}
              className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-md"
            >
              <span className="font-mono-brand text-[11px] uppercase tracking-wider text-white/40">
                {badge.label}
              </span>
              <span className="font-mono-brand text-base font-semibold text-brand-cyan">
                {badge.value}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>

    {/* Bottom fade */}
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
  </section>
);

export default Hero;
