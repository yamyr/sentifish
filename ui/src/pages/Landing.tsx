import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import BenchmarkTable from "@/components/landing/BenchmarkTable";
import HowItWorks from "@/components/landing/HowItWorks";
import MetricsExplained from "@/components/landing/MetricsExplained";
import WhySentifish from "@/components/landing/WhySentifish";
import CtaBanner from "@/components/landing/CtaBanner";
import Footer from "@/components/landing/Footer";

const Landing = () => (
  <div className="min-h-screen">
    <Navbar />
    <Hero />
    <BenchmarkTable />
    <HowItWorks />
    <MetricsExplained />
    <WhySentifish />
    <CtaBanner />
    <Footer />
  </div>
);

export default Landing;
