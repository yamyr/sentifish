import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Fish, ArrowLeft, Play, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCards from "@/components/dashboard/StatCards";
import ProviderComparison from "@/components/dashboard/ProviderComparison";
import TrendChart from "@/components/dashboard/TrendChart";
import RecentRuns from "@/components/dashboard/RecentRuns";
import InsightCard from "@/components/dashboard/InsightCard";
import NarratorButton from "@/components/dashboard/NarratorButton";
import NewRunDialog from "@/components/dashboard/NewRunDialog";
import NewDatasetDialog from "@/components/dashboard/NewDatasetDialog";
import RunProgressPanel from "@/components/dashboard/RunProgressPanel";
import DatasetList from "@/components/dashboard/DatasetList";
import { useRuns, useDemoRun } from "@/hooks/useApi";
import { toast } from "sonner";

export default function Dashboard() {
  const [newRunOpen, setNewRunOpen] = useState(false);
  const [newDatasetOpen, setNewDatasetOpen] = useState(false);
  const { data: runs } = useRuns();
  const demoRun = useDemoRun();
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const isEmpty = !runs || runs.length === 0;
  const triggerDemo = demoRun;

  const latestCompletedRunId =
    runs
      ?.filter((r) => r.status === "completed")
      .sort((a, b) => b.created_at - a.created_at)[0]?.id ?? null;

  const handleDemoRun = () => {
    demoRun.mutate(undefined, {
      onSuccess: (data) => {
        toast.info(
          `Demo starting — ${data.providers.join(", ")} racing on sample queries…`,
        );
      },
      onError: (err) => {
        toast.error("Demo run failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex items-center gap-4">
            <Link
              to="/leaderboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand-cyan"
            >
              Leaderboard
              to="/configure"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-cyan"
              <Settings className="h-4 w-4" />
              Configure
            </Link>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-cyan"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-brand-cyan/20 to-transparent" />
      </motion.nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
        <DashboardHeader
          onNewRun={() => setNewRunOpen(true)}
          onDemoRun={handleDemoRun}
          isDemoRunning={demoRun.isPending}
          onNewDataset={() => setNewDatasetOpen(true)}
        />

        {activeRunId && (
          <RunProgressPanel
            runId={activeRunId}
            onDismiss={() => setActiveRunId(null)}
          />
        )}

        <Separator />

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-cyan/10 ring-1 ring-brand-cyan/20 flex items-center justify-center">
              <Fish className="h-8 w-8 text-brand-cyan" />
            </div>
            <h2 className="text-xl font-semibold font-sans-brand">Run your first evaluation</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Compare search providers head-to-head with real IR metrics. It takes about 30 seconds.
            </p>
            <Button onClick={() => setNewRunOpen(true)} className="gap-2">
              <Play className="h-4 w-4" />
              Start Evaluation
            </Button>
            <p className="text-xs text-muted-foreground">
              Or try the{" "}
              <button
                type="button"
                className="underline text-brand-cyan"
                onClick={handleDemoRun}
                disabled={triggerDemo.isPending}
              >
                one-click demo
              </button>{" "}
              — no config needed if sample dataset is available.
            </p>
          </div>
        ) : (
          <>
            <StatCards />

        <DatasetList />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <ProviderComparison />
          <TrendChart />
        </div>

            <InsightCard />

            <NarratorButton runId={latestCompletedRunId} />
          </>
        )}

        <RecentRuns />
      </main>

      <NewRunDialog open={newRunOpen} onOpenChange={setNewRunOpen} />
      <NewDatasetDialog open={newDatasetOpen} onOpenChange={setNewDatasetOpen} />
    </div>
  );
}
