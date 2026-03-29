import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTools, useCreateTask, useRecommendMetrics } from "@/hooks/useApi";
import type { ToolDefinition, EvalMetricWeight } from "@/lib/api/sentifish";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

void Badge;

type TaskWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (taskId: string) => void;
};

type TaskCategory = "Search" | "Q&A" | "Code Gen" | "Summarization" | "Custom";

const CATEGORIES: Array<{
  value: TaskCategory;
  blurb: string;
}> = [
  { value: "Search", blurb: "Evaluate retrieval quality, freshness, and source trust." },
  { value: "Q&A", blurb: "Measure answer quality, factuality, and grounded reasoning." },
  { value: "Code Gen", blurb: "Assess correctness, completeness, and developer usefulness." },
  { value: "Summarization", blurb: "Optimize coverage, clarity, and concise synthesis." },
  { value: "Custom", blurb: "Build your own benchmark with flexible criteria." },
];

const STEP_LABELS = ["Define Task", "Derive Metrics", "Select Tools"] as const;

const PIE_COLORS = [
  "hsl(172, 50%, 40%)",
  "hsl(255, 45%, 60%)",
  "hsl(158, 45%, 45%)",
  "hsl(40, 75%, 55%)",
  "hsl(0, 60%, 55%)",
];

const DEFAULT_METRICS: EvalMetricWeight[] = [
  {
    metric: "relevance",
    weight: 30,
    label: "Relevance",
    description: "How relevant are the results to the query",
    higher_is_better: true,
  },
  {
    metric: "accuracy",
    weight: 25,
    label: "Accuracy",
    description: "Factual correctness of the output",
    higher_is_better: true,
  },
  {
    metric: "completeness",
    weight: 20,
    label: "Completeness",
    description: "Coverage of all aspects of the query",
    higher_is_better: true,
  },
  {
    metric: "latency",
    weight: 15,
    label: "Latency",
    description: "Response time of the tool",
    higher_is_better: false,
  },
  {
    metric: "consistency",
    weight: 10,
    label: "Consistency",
    description: "Consistency of results across repeated queries",
    higher_is_better: true,
  },
];

const normalizeCategory = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const defaultMetricReasoning = (metric: EvalMetricWeight) =>
  `${metric.label} is a dependable baseline for this task type, helping you balance quality with operational performance.`;

const isToolAvailable = (tool: ToolDefinition) => Boolean(tool.endpoint_url || tool.is_builtin || tool.builtin_provider);

export default function TaskWizard({ open, onOpenChange, onComplete }: TaskWizardProps) {
  const { data: tools = [], isLoading: toolsLoading } = useTools();
  const createTaskMutation = useCreateTask();
  const recommendMetricsMutation = useRecommendMetrics();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Search");
  const [evaluationCriteria, setEvaluationCriteria] = useState("");
  const [metrics, setMetrics] = useState<EvalMetricWeight[]>(DEFAULT_METRICS);
  const [metricReasoning, setMetricReasoning] = useState("");
  const [recommendationNote, setRecommendationNote] = useState<string | null>(null);
  const [expandedMetrics, setExpandedMetrics] = useState<Record<string, boolean>>({});
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setName("");
      setDescription("");
      setCategory("Search");
      setEvaluationCriteria("");
      setMetrics(DEFAULT_METRICS);
      setMetricReasoning("");
      setRecommendationNote(null);
      setExpandedMetrics({});
      setSelectedToolIds([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const matchingToolIds = tools
      .filter(
        (tool: ToolDefinition) =>
          normalizeCategory(tool.category) === normalizeCategory(category) && isToolAvailable(tool),
      )
      .map((tool: ToolDefinition) => tool.id);

    setSelectedToolIds(matchingToolIds);
  }, [tools, category, open]);

  const totalWeight = metrics.reduce(
    (sum: number, metric: EvalMetricWeight) => sum + metric.weight,
    0,
  );
  const chartMetrics =
    totalWeight > 0
      ? metrics
      : metrics.map((metric: EvalMetricWeight) => ({ ...metric, weight: 1 }));

  const toggleMetricReason = (metricName: string) => {
    setExpandedMetrics((current: Record<string, boolean>) => ({
      ...current,
      [metricName]: !current[metricName],
    }));
  };

  const updateMetricWeight = (metricName: string, weight: number) => {
    setMetrics((current: EvalMetricWeight[]) =>
      current.map((metric: EvalMetricWeight) =>
        metric.metric === metricName ? { ...metric, weight } : metric,
      ),
    );
  };

  const toggleTool = (tool: ToolDefinition) => {
    if (!isToolAvailable(tool)) {
      return;
    }

    setSelectedToolIds((current: string[]) =>
      current.includes(tool.id)
        ? current.filter((id: string) => id !== tool.id)
        : [...current, tool.id],
    );
  };

  const handleNext = () => {
    if (step === 0) {
      if (!name.trim() || !description.trim() || !category) {
        toast.error("Add a task name, description, and category to continue.");
        return;
      }
    }

    setStep((current: number) => Math.min(current + 1, STEP_LABELS.length - 1));
  };

  const handleBack = () => {
    setStep((current: number) => Math.max(current - 1, 0));
  };

  const handleRecommendMetrics = async () => {
    try {
      setRecommendationNote(null);

      const recommendation = await recommendMetricsMutation.mutateAsync({
        task_name: name,
        task_description: description,
        task_category: category,
        evaluation_criteria: evaluationCriteria || undefined,
      });

      const recommendedMetrics = recommendation.eval_config.metrics?.length
        ? recommendation.eval_config.metrics
        : DEFAULT_METRICS;

      setMetrics(recommendedMetrics);
      setMetricReasoning(recommendation.eval_config.ai_reasoning || "");
      setExpandedMetrics({});

      if (!recommendation.llm_used || !recommendation.eval_config.metrics?.length) {
        setRecommendationNote("Configure OPENAI_API_KEY for AI-powered recommendations");
      }
    } catch {
      setMetrics(DEFAULT_METRICS);
      setMetricReasoning("");
      setExpandedMetrics({});
      setRecommendationNote("Configure OPENAI_API_KEY for AI-powered recommendations");
      toast.error("AI recommendation failed. Loaded sensible defaults instead.");
    }
  };

  const handleCreateTask = async () => {
    if (selectedToolIds.length === 0) {
      toast.error("Select at least one available tool to continue.");
      return;
    }

    try {
      const task = await createTaskMutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        category,
        input_template: "{{input}}",
        evaluation_criteria: evaluationCriteria.trim(),
        suggested_metrics: metrics.map((metric: EvalMetricWeight) => metric.metric),
      });

      toast.success("Task created. Ready to run.");
      onComplete?.(task.id);
      onOpenChange(false);
    } catch {
      toast.error("Unable to create the task right now.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border/70 bg-card p-0 shadow-2xl sm:max-w-2xl">
        <div className="flex max-h-[88vh] min-h-[80vh] flex-col bg-gradient-to-br from-card via-card to-brand-indigo/5">
          <DialogHeader className="border-b border-border/60 px-6 pb-5 pt-6 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-flex w-fit items-center rounded-full bg-brand-cyan/10 px-2.5 py-1 text-xs font-medium text-brand-cyan">
                  AI Task Setup
                </span>
                <DialogTitle className="font-semibold text-2xl tracking-tight text-foreground">
                  Create an evaluation task
                </DialogTitle>
                <DialogDescription className="max-w-xl text-sm text-muted-foreground">
                  Shape the task brief, derive weighted evaluation metrics, and choose which tools should
                  run against it.
                </DialogDescription>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full bg-brand-indigo/10 px-2.5 py-1 text-xs font-medium text-brand-indigo">
                Step {step + 1} / {STEP_LABELS.length}
              </span>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {STEP_LABELS.map((label, index) => {
                const active = index === step;
                const completed = index < step;

                return (
                  <div key={label} className="flex flex-1 items-center gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                          completed
                            ? "border-brand-cyan bg-brand-cyan text-white"
                            : active
                              ? "border-brand-indigo bg-brand-indigo/10 text-brand-indigo"
                              : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        {completed ? <Check className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                      </div>
                    </div>
                    {index < STEP_LABELS.length - 1 ? (
                      <div className="h-px flex-1 bg-border/70" aria-hidden="true" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-6"
              >
                {step === 0 ? (
                  <div className="space-y-6">
                    <div className="grid gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="task-name">Task name</Label>
                        <Input
                          id="task-name"
                          value={name}
                          onChange={(event: import("react").ChangeEvent<HTMLInputElement>) =>
                            setName(event.target.value)
                          }
                          placeholder="Compare retrieval quality across legal research tools"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="task-description">Description</Label>
                        <textarea
                          id="task-description"
                          value={description}
                          onChange={(event: import("react").ChangeEvent<HTMLTextAreaElement>) =>
                            setDescription(event.target.value)
                          }
                          rows={5}
                          className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                          placeholder="Describe the user prompt, expected output, and what a strong response should do."
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Category</Label>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {CATEGORIES.map((item) => {
                            const selected = item.value === category;

                            return (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => setCategory(item.value)}
                                className={`rounded-2xl border p-4 text-left transition-all ${
                                  selected
                                    ? "border-brand-cyan bg-brand-cyan/10 shadow-sm shadow-brand-cyan/15"
                                    : "border-border/70 bg-background/70 hover:border-brand-indigo/40 hover:bg-brand-indigo/5"
                                }`}
                              >
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <span className="font-medium text-foreground">{item.value}</span>
                                  {selected ? (
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan text-white">
                                      <Check className="h-3.5 w-3.5" />
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-sm leading-6 text-muted-foreground">{item.blurb}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="evaluation-criteria">Evaluation criteria</Label>
                        <textarea
                          id="evaluation-criteria"
                          value={evaluationCriteria}
                          onChange={(event: import("react").ChangeEvent<HTMLTextAreaElement>) =>
                            setEvaluationCriteria(event.target.value)
                          }
                          rows={4}
                          className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                          placeholder="Results must be from authoritative sources, published in the last year"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-brand-indigo/15 bg-brand-indigo/5 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-foreground">Recommend weighted metrics</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Use AI to derive the best evaluation parameters for this task, or refine the
                            defaults manually.
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={handleRecommendMetrics}
                          disabled={recommendMetricsMutation.isPending}
                          className="gap-2"
                        >
                          {recommendMetricsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          ✨ Recommend Metrics
                        </Button>
                      </div>

                      {recommendMetricsMutation.isPending ? (
                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />
                          <span>Analyzing your task… deriving the best evaluation parameters</span>
                        </div>
                      ) : null}

                      {recommendationNote ? (
                        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                          {recommendationNote}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)]">
                      <div className="space-y-4">
                        {metrics.map((metric: EvalMetricWeight, index: number) => {
                          const reasoning = metricReasoning || defaultMetricReasoning(metric);
                          const expanded = Boolean(expandedMetrics[metric.metric]);

                          return (
                            <div
                              key={metric.metric}
                              className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{metric.label}</span>
                                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                      {metric.higher_is_better ? "Higher is better" : "Lower is better"}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                                </div>
                                <div
                                  className="h-3 w-3 shrink-0 rounded-full"
                                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                />
                              </div>

                              <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <Label htmlFor={`metric-${metric.metric}`}>Weight</Label>
                                  <span className="text-sm font-medium text-foreground">{metric.weight}%</span>
                                </div>
                                <input
                                  id={`metric-${metric.metric}`}
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={metric.weight}
                                  onChange={(event: import("react").ChangeEvent<HTMLInputElement>) =>
                                    updateMetricWeight(metric.metric, Number(event.target.value))
                                  }
                                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[hsl(172,50%,40%)]"
                                />
                              </div>

                              <p className="mt-4 text-sm leading-6 text-muted-foreground line-clamp-2">
                                {reasoning}
                              </p>

                              <button
                                type="button"
                                onClick={() => toggleMetricReason(metric.metric)}
                                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-indigo transition-colors hover:text-brand-cyan"
                              >
                                Why this metric?
                                {expanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>

                              <AnimatePresence initial={false}>
                                {expanded ? (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-3 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
                                      {reasoning}
                                    </div>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-background/70 p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">Weight distribution</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Current total: {totalWeight}%
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-brand-cyan/10 px-2.5 py-1 text-xs font-medium text-brand-cyan">
                            {metrics.length} metrics
                          </span>
                        </div>

                        <div className="mt-6 h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartMetrics}
                                dataKey="weight"
                                nameKey="label"
                                innerRadius={55}
                                outerRadius={88}
                                paddingAngle={3}
                              >
                                {chartMetrics.map((metric: EvalMetricWeight, index: number) => (
                                  <Cell
                                    key={metric.metric}
                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-3">
                          {metrics.map((metric: EvalMetricWeight, index: number) => (
                            <div key={metric.metric} className="flex items-center justify-between gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                />
                                <span className="text-muted-foreground">{metric.label}</span>
                              </div>
                              <span className="font-medium text-foreground">{metric.weight}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="font-medium text-foreground">Select tools to run</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Matching tools for {category} are preselected. Unconfigured tools stay visible but
                          cannot be toggled on.
                        </p>
                      </div>
                      <span className="inline-flex w-fit items-center rounded-full bg-brand-indigo/10 px-2.5 py-1 text-xs font-medium text-brand-indigo">
                        {selectedToolIds.length} selected
                      </span>
                    </div>

                    {toolsLoading ? (
                      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-5 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />
                        Loading available tools…
                      </div>
                    ) : null}

                    {!toolsLoading && tools.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 px-4 py-8 text-center text-sm text-muted-foreground">
                        No tools are available yet.
                      </div>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-2">
                      {tools.map((tool: ToolDefinition) => {
                        const available = isToolAvailable(tool);
                        const selected = selectedToolIds.includes(tool.id);
                        const categoryMatch = normalizeCategory(tool.category) === normalizeCategory(category);

                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => toggleTool(tool)}
                            disabled={!available}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              !available
                                ? "cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground opacity-60"
                                : selected
                                  ? "border-brand-cyan bg-brand-cyan/10 shadow-sm shadow-brand-cyan/10"
                                  : "border-border/70 bg-background/70 hover:border-brand-indigo/40 hover:bg-brand-indigo/5"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-foreground">{tool.name}</span>
                                  {categoryMatch ? (
                                    <span className="inline-flex items-center rounded-full bg-brand-cyan/10 px-2.5 py-1 text-xs font-medium text-brand-cyan">
                                      Match
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                  {tool.description}
                                </p>
                              </div>
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                                  selected
                                    ? "border-brand-cyan bg-brand-cyan text-white"
                                    : "border-border bg-background"
                                }`}
                              >
                                {selected ? <Check className="h-3.5 w-3.5" /> : null}
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                {tool.category}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                {tool.input_type}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                {tool.output_type}
                              </span>
                              <span
                                className={
                                  available
                                    ? "inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                                    : "inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                                }
                              >
                                {available ? "Available" : "No endpoint"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 px-6 py-4 sm:px-8">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < STEP_LABELS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending || selectedToolIds.length === 0}
                className="min-w-[160px]"
              >
                {createTaskMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Task & Run
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
