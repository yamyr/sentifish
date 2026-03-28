import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Fish, Menu, X, ExternalLink } from "lucide-react";

const NAV_LINKS = [
  { label: "Providers", href: "#providers" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Metrics", href: "#metrics" },
  { label: "Why Sentifish", href: "#why" },
  { label: "Roadmap", href: "#roadmap" },
] as const;

const SECTION_IDS = NAV_LINKS.map((l) => l.href.slice(1));

const SCROLL_THRESHOLD = 100;

const JOURNEY_SECTIONS = [
  { id: "hero", label: "Home" },
  { id: "providers", label: "Benchmarks" },
  { id: "how-it-works", label: "Workflow" },
  { id: "metrics", label: "Metrics" },
  { id: "why", label: "Why Sentifish" },
  { id: "roadmap", label: "Roadmap" },
];

/* ---------- Journey Progress Dots (Desktop) ---------- */
const JourneyProgress = ({
  activeSection,
  scrolled,
}: {
  activeSection: string;
  scrolled: boolean;
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeIndex = JOURNEY_SECTIONS.findIndex(
    (s) => s.id === activeSection,
  );
  // Treat hero as active when nothing else is
  const resolvedIndex = activeIndex === -1 ? 0 : activeIndex;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.div
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex"
      animate={{ opacity: scrolled ? 1 : 0.3 }}
      transition={{ duration: 0.3 }}
    >
      {/* Vertical connecting line (background) */}
      <div className="pointer-events-none absolute left-1/2 top-0 bottom-0 -translate-x-1/2">
        {/* Track line */}
        <div className="h-full w-px bg-white/10" />
        {/* Progress fill */}
        <motion.div
          className="absolute top-0 left-0 w-px bg-gradient-to-b from-brand-cyan to-brand-indigo"
          animate={{
            height: `${(resolvedIndex / Math.max(JOURNEY_SECTIONS.length - 1, 1)) * 100}%`,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        />
      </div>

      {JOURNEY_SECTIONS.map((section, i) => {
        const isActive = i === resolvedIndex;
        return (
          <button
            key={section.id}
            type="button"
            aria-label={`Scroll to ${section.label}`}
            onClick={() => handleClick(section.id)}
            onMouseEnter={() => setHoveredId(section.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative z-10 flex items-center justify-center p-1"
          >
            {/* Dot */}
            <motion.span
              className={`block rounded-full transition-colors duration-200 ${
                isActive
                  ? "bg-brand-cyan shadow-sm shadow-brand-cyan/40"
                  : "bg-white/25 hover:bg-white/40"
              }`}
              animate={{
                width: isActive ? 12 : 8,
                height: isActive ? 12 : 8,
              }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />

            {/* Animated layout indicator ring */}
            {isActive && (
              <motion.span
                layoutId="journey-dot-indicator"
                className="absolute inset-0 m-auto h-5 w-5 rounded-full ring-2 ring-brand-cyan/50"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredId === section.id && (
                <motion.span
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-brand-navy/90 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
                >
                  {section.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </motion.div>
  );
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  // ---------- scroll listener ----------
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll(); // initialise on mount
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ---------- IntersectionObserver for active section ----------
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(handleIntersect, {
        rootMargin: "-40% 0px -55% 0px",
        threshold: 0,
      });
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // ---------- smooth scroll helper ----------
  const scrollTo = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      setMobileOpen(false);
    },
    [],
  );

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const textColor = scrolled ? "text-foreground" : "text-white";
  const mutedText = scrolled ? "text-muted-foreground" : "text-white/60";

  return (
    <>
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* ---- Left: Logo ---- */}
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-300 ${
              scrolled
                ? "bg-brand-cyan/15 ring-1 ring-brand-cyan/30"
                : "bg-white/10 ring-1 ring-white/20"
            }`}
          >
            <Fish className="h-4 w-4 text-brand-cyan" />
          </div>
          <span
            className={`font-sans-brand text-lg font-bold transition-colors duration-300 ${textColor}`}
          >
            Sentifish
          </span>
        </Link>

        {/* ---- Center: Anchor links (desktop) ---- */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href.slice(1);
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => scrollTo(e, link.href)}
                  className={`relative rounded-lg px-3 py-2 font-sans-brand text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? scrolled
                        ? "text-brand-cyan"
                        : "text-brand-cyan"
                      : `${mutedText} hover:${textColor}`
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-brand-cyan"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        {/* ---- Right: CTAs (desktop) ---- */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="https://github.com/yamyr/sentifish"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 font-sans-brand text-sm font-medium transition-all duration-200 ${
              scrolled
                ? "border-border bg-transparent text-foreground hover:bg-secondary"
                : "border-white/15 bg-white/5 text-white hover:border-white/25 hover:bg-white/10"
            }`}
          >
            GitHub
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Link
            to="/dashboard"
            className="relative overflow-hidden inline-flex items-center rounded-lg bg-brand-cyan px-5 py-2 font-sans-brand text-sm font-semibold text-brand-navy shadow-sm shadow-brand-cyan/20 transition-all hover:shadow-brand-cyan/40 hover:brightness-110"
          >
            Start Evaluating
            <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </Link>
        </div>

        {/* ---- Mobile hamburger ---- */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((prev) => !prev)}
          className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors md:hidden ${
            scrolled
              ? "text-foreground hover:bg-secondary"
              : "text-white hover:bg-white/10"
          }`}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* ---- Mobile menu panel ---- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-b border-border bg-background/95 backdrop-blur-md md:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.href.slice(1);
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => scrollTo(e, link.href)}
                    className={`rounded-lg px-3 py-2.5 font-sans-brand text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-cyan/10 text-brand-cyan"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}

              <hr className="my-2 border-border" />

              <a
                href="https://github.com/yamyr/sentifish"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 font-sans-brand text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                GitHub
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="mt-1 inline-flex items-center justify-center rounded-lg bg-brand-cyan px-5 py-2.5 font-sans-brand text-sm font-semibold text-brand-navy shadow-sm shadow-brand-cyan/20 transition-all hover:brightness-110"
              >
                Start Evaluating
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient bottom border when scrolled */}
      {scrolled && (
        <div className="h-px bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent" />
      )}
    </header>

    <JourneyProgress activeSection={activeSection} scrolled={scrolled} />
    </>
  );
};

export default Navbar;
