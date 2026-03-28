import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Fish, ExternalLink, ArrowRight, Star } from "lucide-react";

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
      className="relative w-full overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy to-brand-indigo"
    >
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--brand-cyan)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--brand-cyan)) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 pt-28 sm:pt-36 lg:pt-44 pb-16">
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
              {starCount !== null && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">
                  <Star className="h-3 w-3" />
                  {starCount.toLocaleString()}
                </span>
              )}
            </a>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 mx-auto max-w-5xl px-4"
            style={{ transform: "perspective(1200px) rotateX(2deg)" }}
          >
            <div className="relative rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-brand-cyan/10 overflow-hidden">
              {/* Browser chrome top bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              </div>
              <img
                src="/gifs/05-dashboard.gif"
                alt="Sentifish dashboard showing provider comparison metrics"
                className="w-full"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
