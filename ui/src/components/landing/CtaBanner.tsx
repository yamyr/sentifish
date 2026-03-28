import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";

const CtaBanner = () => (
  <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy to-brand-indigo py-20">
    {/* Subtle grid overlay */}
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--brand-cyan)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--brand-cyan)) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="relative mx-auto max-w-3xl px-6 text-center"
    >
      <h2 className="font-sans-brand text-3xl font-bold text-white sm:text-4xl">
        Ready to Find Your Best Search API?
      </h2>

      <p className="mt-4 font-sans-brand text-lg text-white/60">
        Run your first benchmark in under a minute. Free, open source, no
        account required.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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
      </div>
    </motion.div>
  </section>
);

export default CtaBanner;
