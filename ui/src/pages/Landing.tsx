import type { ReactNode } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import BenchmarkTable from "@/components/landing/BenchmarkTable";
import HowItWorks from "@/components/landing/HowItWorks";
import MetricsExplained from "@/components/landing/MetricsExplained";
import WhySentifish from "@/components/landing/WhySentifish";
import Roadmap from "@/components/landing/Roadmap";
import CtaBanner from "@/components/landing/CtaBanner";
import Footer from "@/components/landing/Footer";
import { useLeaderboard } from "@/hooks/useApi";
import { Trophy } from "lucide-react";

const SectionSlide = ({
  children,
  full = true,
  className = "",
}: {
  children: ReactNode;
  full?: boolean;
  className?: string;
}) => (
  <div className={`${full ? "snap-section" : "snap-section-auto"} ${className}`}>
    {children}
  </div>
);

const Divider = ({ dark = false }: { dark?: boolean }) => (
  <div className={dark ? "section-divider-dark" : "section-divider"} />
);

const SocialProof = () => {
  const { data, isLoading } = useLeaderboard();

  if (isLoading || !data || data.leaderboard.length === 0) {
    return null;
  }

  const top3 = data.leaderboard.slice(0, 3);
  const rankColors = ["text-yellow-400", "text-slate-300", "text-amber-600"];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="font-sans-brand text-2xl font-bold text-foreground mb-8">
          Top Performers
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {top3.map((entry, i) => (
            <div key={entry.provider} className="flex items-center gap-3 bg-card border border-border rounded-xl px-6 py-4 shadow-sm">
              <Trophy className={`h-6 w-6 ${rankColors[i] || "text-muted-foreground"}`} />
              <div className="text-left">
                <div className="font-sans-brand font-semibold text-foreground capitalize">{entry.provider}</div>
                <div className="text-sm text-muted-foreground">Score: {entry.avg_score.toFixed(1)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Landing = () => (
  <>
    <Navbar />
    <div className="snap-container overflow-x-hidden">
      <SectionSlide>
        <Hero />
      </SectionSlide>
      <Divider />
      <SectionSlide>
        <BenchmarkTable />
      </SectionSlide>
      <Divider />
      <SectionSlide>
        <HowItWorks />
      </SectionSlide>
      <Divider />
      <SectionSlide>
        <MetricsExplained />
      </SectionSlide>
      <Divider />
      <SectionSlide>
        <WhySentifish />
      </SectionSlide>
      <Divider dark />
      <SectionSlide>
        <SocialProof />
      </SectionSlide>
      <Divider dark />
      <SectionSlide>
        <Roadmap />
      </SectionSlide>
      <Divider dark />
      <SectionSlide full={false}>
        <CtaBanner />
      </SectionSlide>
      <SectionSlide full={false}>
        <Footer />
      </SectionSlide>
    </div>
  </>
);

export default Landing;
