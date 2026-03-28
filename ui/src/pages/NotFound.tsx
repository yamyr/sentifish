import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
    <p className="font-mono-brand text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">
      404
    </p>
    <h1 className="font-sans-brand font-bold text-3xl text-foreground mb-3">
      Page not found
    </h1>
    <p className="text-muted-foreground text-sm mb-8 max-w-sm">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link
      to="/"
      className="bg-brand-indigo text-primary-foreground font-sans-brand font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
    >
      Back to Home
    </Link>
  </div>
);

export default NotFound;
