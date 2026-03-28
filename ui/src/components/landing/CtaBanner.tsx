import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import NeuralBackground from "./NeuralBackground";

const CtaBanner = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy to-brand-indigo py-20">
    {/* Neural network background */}
    <NeuralBackground
      nodeCount={35}
      connectionDistance={130}
      opacity={0.35}
    />

    {/* Subtle grid overlay */}
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--brand-cyan)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--brand-cyan)) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />

    {/* Decorative orbs */}
    <div className="absolute -top-20 right-10 h-64 w-64 rounded-full bg-brand-cyan/10 blur-3xl animate-pulse-glow" />
    <div className="absolute bottom-0 -left-20 h-48 w-48 rounded-full bg-brand-indigo/15 blur-3xl" />

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="relative mx-auto max-w-3xl px-6 text-center"
    >
      <h2 className="font-sans-brand text-4xl font-bold text-white sm:text-5xl">
        Ready to Find Your{" "}
        <span className="bg-gradient-to-r from-brand-cyan to-brand-indigo bg-clip-text text-transparent">
          Best Search API
        </span>
        ?
      </h2>

      <p className="mt-4 font-sans-brand text-lg text-white/60">
        Run your first benchmark in under a minute. Free, open source, no
        account required.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/dashboard"
          className="group relative overflow-hidden inline-flex items-center gap-2 rounded-xl bg-brand-cyan px-7 py-3.5 font-sans-brand text-sm font-semibold text-brand-navy shadow-lg shadow-brand-cyan/25 transition-all hover:shadow-brand-cyan/40 hover:brightness-110"
        >
          <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
      </div>
    </motion.div>
  </section>
);

export default CtaBanner;
