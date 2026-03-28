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
