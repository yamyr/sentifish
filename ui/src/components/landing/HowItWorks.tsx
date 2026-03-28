import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  {
    id: 0,
    label: "01 Choose Dataset",
    gif: "/gifs/05-dashboard.gif",
    description:
      "Pick from curated query sets or bring your own. Each includes queries with known-relevant documents.",
  },
  {
    id: 1,
    label: "02 Run Evaluation",
    gif: "/gifs/02-race.gif",
    description:
      "All providers race simultaneously on the same queries. Every request is timed and logged.",
  },
  {
    id: 2,
    label: "03 Compare Results",
    gif: "/gifs/03-comparison.gif",
    description:
      "Side-by-side metrics with interactive charts. Drill into individual queries to see where providers differ.",
  },
];

const INTERVAL_MS = 5000;

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % steps.length);
      setProgressKey((k) => k + 1);
    }, INTERVAL_MS);
  }, [clearTimer]);

  // Start / restart auto-advance when not paused
  useEffect(() => {
    if (!paused) {
      startTimer();
    }
    return clearTimer;
  }, [paused, startTimer, clearTimer]);

  const handleTabClick = (id: number) => {
    setActiveTab(id);
    setProgressKey((k) => k + 1);
    // Restart interval from this moment
    if (!paused) {
      startTimer();
    }
  };

  const handleMouseEnter = () => {
    setPaused(true);
    clearTimer();
  };

  const handleMouseLeave = () => {
    setPaused(false);
  };

  const current = steps[activeTab];

  return (
    <section id="how-it-works" className="overflow-x-hidden bg-secondary/50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="mb-14 text-center"
        >
          <p className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-brand-cyan">
            Workflow
          </p>
          <h2 className="mt-3 font-sans-brand text-3xl font-bold text-foreground sm:text-4xl">
            Three Steps to <span className="bg-gradient-to-r from-brand-cyan to-brand-indigo bg-clip-text text-transparent">Better Search</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            From dataset to decision in minutes.
          </p>
        </motion.div>

        {/* Tabs + content area */}
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Tab buttons */}
          <div className="flex justify-center">
            <div className="gradient-border inline-flex gap-1 rounded-xl border border-border bg-card p-1">
              {steps.map((step) => {
                const isActive = step.id === activeTab;
                return (
                  <button
                    key={step.id}
                    onClick={() => handleTabClick(step.id)}
                    className={`relative rounded-lg px-5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-brand-cyan/10 font-semibold text-foreground shadow-sm shadow-brand-cyan/20"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {step.label}
                    {/* Progress bar */}
                    {isActive && (
                      <span
                        key={progressKey}
                        className="absolute bottom-0 left-0 h-0.5 rounded-full bg-brand-cyan"
                        style={{
                          width: "0%",
                          animation: paused
                            ? "none"
                            : `progress-fill ${INTERVAL_MS}ms linear forwards`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GIF display area */}
          <div className="mx-auto mt-8 max-w-4xl">
            {/* Browser chrome frame */}
            <motion.div
              initial={{ rotateX: 2 }}
              whileInView={{ rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.2 }}
              style={{ perspective: "1200px" }}
              className="glow-indigo overflow-hidden rounded-2xl border border-border bg-card"
            >
              {/* Top bar */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-400/60" />
                <span className="h-3 w-3 rounded-full bg-amber-400/60" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/60" />
              </div>

              {/* GIF */}
              <div className="relative aspect-video w-full bg-background">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={current.gif}
                    src={current.gif}
                    alt={current.label}
                    loading="lazy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Description */}
            <p className="mx-auto mt-6 max-w-xl text-center text-muted-foreground">
              {current.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
