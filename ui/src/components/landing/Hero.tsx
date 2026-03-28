import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Fish, ExternalLink, ArrowRight, Star } from "lucide-react";
import NeuralBackground from "./NeuralBackground";

const Hero = () => {
  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/yamyr/sentifish")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        if (typeof data.stargazers_count === "number") {
          setStarCount(data.stargazers_count);
        }
      })
      .catch(() => {
        // silently ignore – badge simply won't render
      });
  }, []);

  return (
    <section
      id="hero"
      className="relative w-full overflow-x-hidden overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy to-brand-indigo/80"
    >
      {/* Neural network background */}
      <NeuralBackground
        nodeCount={70}
        connectionDistance={150}
        opacity={0.6}
        primaryColor="51, 153, 137"
        secondaryColor="127, 107, 198"
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

      {/* Floating decorative orbs */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brand-cyan/8 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-10 -left-20 h-48 w-48 rounded-full bg-brand-indigo/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 pt-28 sm:pt-36 lg:pt-44 pb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex items-center gap-3"
          >
            <div className="glow-cyan flex h-12 w-12 items-center justify-center rounded-xl bg-brand-cyan/15 ring-1 ring-brand-cyan/30">
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
            <span
              className="animate-gradient-shift bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-cyan bg-clip-text text-transparent"
              style={{ backgroundSize: "200% 200%" }}
            >
              Actually Works
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 max-w-2xl font-sans-brand text-lg leading-relaxed text-white/70 sm:text-xl"
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
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-brand-cyan px-7 py-3.5 font-sans-brand text-sm font-semibold text-brand-navy shadow-lg shadow-brand-cyan/20 transition-all hover:shadow-brand-cyan/30 hover:brightness-110"
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
              {starCount !== null && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white/80">
                  <Star className="h-3 w-3" />
                  {starCount.toLocaleString()}
                </span>
              )}
            </a>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.5 }}
            className="mt-16 mx-auto w-full max-w-5xl px-4"
            style={{ perspective: "1200px" }}
          >
            <motion.div
              initial={{ rotateX: 4 }}
              animate={{ rotateX: 2 }}
              transition={{ type: "spring", stiffness: 60, damping: 20, delay: 0.7 }}
              className="glow-cyan relative rounded-2xl gradient-border bg-white/5 shadow-2xl shadow-brand-cyan/10 overflow-hidden"
            >
              {/* Browser chrome top bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
              </div>
              <img
                src="/gifs/05-dashboard.gif"
                alt="Sentifish dashboard showing provider comparison metrics"
                className="w-full"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
