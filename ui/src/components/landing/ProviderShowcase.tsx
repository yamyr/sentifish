import { motion } from "framer-motion";
import { Shield, Zap, Search, Globe, Compass, Fish } from "lucide-react";

const providers = [
  {
    name: "Brave",
    description: "Privacy-first web search with independent index",
    color: "brand-indigo",
    bgClass: "bg-brand-indigo/10",
    textClass: "text-brand-indigo",
    ringClass: "ring-brand-indigo/20",
    Icon: Shield,
  },
  {
    name: "Serper",
    description: "Fast Google SERP API with structured results",
    color: "brand-cyan",
    bgClass: "bg-brand-cyan/10",
    textClass: "text-brand-cyan",
    ringClass: "ring-brand-cyan/20",
    Icon: Zap,
  },
  {
    name: "SerpAPI",
    description: "Google, Bing, and multi-engine search results API",
    color: "primary",
    bgClass: "bg-primary/10",
    textClass: "text-primary",
    ringClass: "ring-primary/20",
    Icon: Search,
  },
  {
    name: "Tavily",
    description: "AI-native search optimized for LLM agents",
    color: "warning",
    bgClass: "bg-warning/10",
    textClass: "text-warning",
    ringClass: "ring-warning/20",
    Icon: Globe,
  },
  {
    name: "Exa",
    description: "Neural search engine with semantic understanding",
    color: "destructive",
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    ringClass: "ring-destructive/20",
    Icon: Compass,
  },
  {
    name: "TinyFish",
    description: "Browser-based search with rich content extraction",
    color: "success",
    bgClass: "bg-success/10",
    textClass: "text-success",
    ringClass: "ring-success/20",
    Icon: Fish,
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

const ProviderShowcase = () => (
  <section id="providers" className="bg-background py-24">
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
          Providers
        </p>
        <h2 className="mt-3 font-sans-brand text-3xl font-bold text-foreground sm:text-4xl">
          Six Providers, One Benchmark
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          We run the same queries across every provider so you can compare apples
          to apples.
        </p>
      </motion.div>

      {/* Provider grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {providers.map(({ name, description, bgClass, textClass, ringClass, Icon }) => (
          <motion.div
            key={name}
            variants={cardVariants}
            className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${bgClass} ring-1 ${ringClass}`}
            >
              <Icon className={`h-5 w-5 ${textClass}`} />
            </div>
            <h3 className="font-sans-brand text-lg font-semibold text-foreground">
              {name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default ProviderShowcase;
