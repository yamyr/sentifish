import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Fish, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCards from "@/components/dashboard/StatCards";
import ProviderComparison from "@/components/dashboard/ProviderComparison";
import TrendChart from "@/components/dashboard/TrendChart";
import RecentRuns from "@/components/dashboard/RecentRuns";
import InsightCard from "@/components/dashboard/InsightCard";
import NewRunDialog from "@/components/dashboard/NewRunDialog";

export default function Dashboard() {
  const [newRunOpen, setNewRunOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav bar */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-indigo">
              <Fish className="h-5 w-5 text-white" />
            </div>
            <span className="font-sans-brand text-lg font-bold tracking-tight text-foreground">
              Sentifish
            </span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </motion.nav>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
        <DashboardHeader onNewRun={() => setNewRunOpen(true)} />

        <Separator />

        <StatCards />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ProviderComparison />
          <TrendChart />
        </div>

        <InsightCard />

        <RecentRuns />
      </main>

      {/* New run dialog */}
      <NewRunDialog open={newRunOpen} onOpenChange={setNewRunOpen} />
    </div>
  );
}
