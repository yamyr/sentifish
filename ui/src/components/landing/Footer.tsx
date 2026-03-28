import { Fish } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-background">
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/15 ring-1 ring-brand-cyan/30">
            <Fish className="h-4 w-4 text-brand-cyan" />
          </div>
          <span className="font-sans-brand text-sm font-semibold text-foreground">
            Sentifish
          </span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a
            href="https://github.com/yamyr/sentifish"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href="https://github.com/yamyr/sentifish#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Docs
          </a>
          <a
            href="https://github.com/yamyr/sentifish/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Issues
          </a>
        </nav>

        {/* Copyright */}
        <p className="font-mono-brand text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Sentifish
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
