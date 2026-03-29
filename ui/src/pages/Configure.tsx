import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Fish, ArrowLeft, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ToolRegistry from "@/components/dashboard/ToolRegistry";
import AddToolDialog from "@/components/dashboard/AddToolDialog";
import TaskWizard from "@/components/dashboard/TaskWizard";
import { useTasks } from "@/hooks/useApi";
import type { TaskDefinition } from "@/lib/api/sentifish";

export default function Configure() {
  const [addToolOpen, setAddToolOpen] = useState(false);
  const [taskWizardOpen, setTaskWizardOpen] = useState(false);
  const { data: tasks, isLoading: tasksLoading } = useTasks();

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
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-cyan"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-brand-cyan/20 to-transparent" />
      </motion.nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-sans-brand text-3xl font-bold tracking-tight text-foreground">
            Configure{" "}
            <span className="bg-gradient-to-r from-brand-cyan to-brand-indigo bg-clip-text text-transparent">
              Tools & Tasks
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            Manage your tool registry, create evaluation tasks, and configure reusable metric profiles.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <ToolRegistry onAddTool={() => setAddToolOpen(true)} />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-sans-brand text-xl font-semibold text-foreground">
                  Task Library
                </h2>
                <Button
                  onClick={() => setTaskWizardOpen(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  New Task
                </Button>
              </div>

              {tasksLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-cyan border-t-transparent" />
                  Loading tasks...
                </div>
              ) : !tasks || tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No tasks yet. Create one with the AI-powered wizard.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={() => setTaskWizardOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Create Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task: TaskDefinition) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border bg-card p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm text-foreground">
                          {task.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {task.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                      {task.suggested_metrics && task.suggested_metrics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.suggested_metrics.map((m) => (
                            <span
                              key={m}
                              className="rounded-full bg-brand-cyan/10 px-2 py-0.5 text-[10px] font-medium text-brand-cyan"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="font-sans-brand text-xl font-semibold text-foreground">
            Saved Evaluation Configs
          </h2>
          <div className="rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Evaluation configs will appear here after you create tasks with metric configurations.
            </p>
          </div>
        </motion.section>
      </main>

      <AddToolDialog open={addToolOpen} onOpenChange={setAddToolOpen} />
      <TaskWizard open={taskWizardOpen} onOpenChange={setTaskWizardOpen} />
    </div>
  );
}
