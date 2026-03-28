import Hero from "@/components/landing/Hero";
import ProviderShowcase from "@/components/landing/ProviderShowcase";
import HowItWorks from "@/components/landing/HowItWorks";
import MetricsExplained from "@/components/landing/MetricsExplained";
import WhySentifish from "@/components/landing/WhySentifish";
import Footer from "@/components/landing/Footer";

const Landing = () => (
  <div className="min-h-screen">
    <Hero />
    <ProviderShowcase />
    <HowItWorks />
    <MetricsExplained />
    <WhySentifish />
    <Footer />
  </div>
);

export default Landing;
