import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Fish, Menu, X, ExternalLink } from "lucide-react";

const NAV_LINKS = [
  { label: "Providers", href: "#providers" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Metrics", href: "#metrics" },
  { label: "Why Sentifish", href: "#why" },
] as const;

const SECTION_IDS = NAV_LINKS.map((l) => l.href.slice(1));

const SCROLL_THRESHOLD = 100;

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
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
        scrolled
          ? "border-b border-border bg-white/80 backdrop-blur-md"
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
            className="inline-flex items-center rounded-lg bg-brand-cyan px-5 py-2 font-sans-brand text-sm font-semibold text-brand-navy shadow-sm shadow-brand-cyan/25 transition-all hover:shadow-brand-cyan/40 hover:brightness-110"
          >
            Start Evaluating
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
            className="overflow-hidden border-b border-border bg-white/95 backdrop-blur-md md:hidden"
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
                className="mt-1 inline-flex items-center justify-center rounded-lg bg-brand-cyan px-5 py-2.5 font-sans-brand text-sm font-semibold text-brand-navy shadow-sm shadow-brand-cyan/25 transition-all hover:brightness-110"
              >
                Start Evaluating
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
