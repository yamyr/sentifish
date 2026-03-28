import { Fish, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Footer = () => (
  <motion.footer
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5 }}
    className="overflow-x-hidden bg-background"
  >
    {/* Gradient top border */}
    <div className="h-px bg-gradient-to-r from-transparent via-brand-cyan/25 to-transparent" />

    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-12 md:grid-cols-3">
        {/* Left column – Branding */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="glow-cyan flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/15 ring-1 ring-brand-cyan/30">
              <Fish className="h-4 w-4 text-brand-cyan" />
            </div>
            <span className="font-sans-brand text-lg font-semibold">
              Sentifish
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Open-source search provider benchmarking
          </p>
        </div>

        {/* Center column – Link groups */}
        <div className="flex gap-16">
          <div>
            <h3 className="font-sans-brand text-sm font-semibold text-foreground mb-4">
              Product
            </h3>
            <Link
              to="/dashboard"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
            >
              Dashboard
            </Link>
            <a
              href="https://github.com/yamyr/sentifish#api-documentation"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
            >
              API Docs
            </a>
          </div>

          <div>
            <h3 className="font-sans-brand text-sm font-semibold text-foreground mb-4">
              Community
            </h3>
            <a
              href="https://github.com/yamyr/sentifish"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
            >
              GitHub
            </a>
            <a
              href="https://github.com/yamyr/sentifish/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
            >
              Issues
            </a>
            <a
              href="https://github.com/yamyr/sentifish/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
            >
              Discussions
            </a>
          </div>
        </div>

        {/* Right column – Built with */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Built with
          </h3>
          <div>
            <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 font-mono-brand text-xs text-muted-foreground mr-2 mb-2">
              FastAPI
            </span>
            <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 font-mono-brand text-xs text-muted-foreground mr-2 mb-2">
              React
            </span>
            <span className="inline-flex items-center rounded-md bg-secondary/80 px-2.5 py-1 font-mono-brand text-xs text-muted-foreground mr-2 mb-2">
              TypeScript
            </span>
          </div>
          <a
            href="https://github.com/yamyr/sentifish"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-4 inline-flex items-center gap-1.5 text-sm text-brand-cyan hover:underline"
          >
            <Star className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-[72deg] group-hover:scale-125" />
            Star us on GitHub
          </a>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-12 pt-8 border-t border-border text-center">
        <p className="font-mono-brand text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Sentifish
        </p>
      </div>
    </div>
  </motion.footer>
);

export default Footer;
