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
import NarratorButton from "@/components/dashboard/NarratorButton";
import NewRunDialog from "@/components/dashboard/NewRunDialog";
import { useRuns } from "@/hooks/useApi";

export default function Dashboard() {
  const [newRunOpen, setNewRunOpen] = useState(false);
  const { data: runs } = useRuns();

  const latestCompletedRunId =
    runs
      ?.filter((r) => r.status === "completed")
      .sort((a, b) => b.created_at - a.created_at)[0]?.id ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav bar */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-40 bg-background/90 backdrop-blur-md"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="glow-cyan flex h-8 w-8 items-center justify-center rounded-lg bg-brand-cyan/15 ring-1 ring-brand-cyan/30">
              <Fish className="h-5 w-5 text-brand-cyan" />
            </div>
            <span className="font-sans-brand text-lg font-bold tracking-tight text-foreground">
              Sentifish
            </span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-cyan"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-brand-cyan/20 to-transparent" />
      </motion.nav>

      {/* Main content */}
        <main className="mx-auto max-w-6xl px-4 py-4 sm:py-8 sm:px-6 space-y-10">
        <DashboardHeader onNewRun={() => setNewRunOpen(true)} />

        <Separator />

        <StatCards />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ProviderComparison />
          <TrendChart />
        </div>

        <InsightCard />

        <NarratorButton runId={latestCompletedRunId} />

        <RecentRuns />
      </main>

      {/* New run dialog */}
      <NewRunDialog open={newRunOpen} onOpenChange={setNewRunOpen} />
    </div>
  );
}
