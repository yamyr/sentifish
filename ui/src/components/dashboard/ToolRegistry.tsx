import { motion, type Variants } from "framer-motion";
import { Lock, Trash2, Plus, Loader2, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTools, useDeleteTool } from "@/hooks/useApi";
import type { ToolDefinition } from "@/lib/api/sentifish";

const CATEGORY_COLORS: Record<string, string> = {
  search: "bg-brand-cyan/15 text-brand-cyan",
  ai_assistant: "bg-brand-indigo/15 text-brand-indigo",
  code_generation: "bg-success/15 text-success",
  image_generation: "bg-warning/15 text-warning",
  data_extraction: "bg-brand-navy/15 text-brand-navy",
  summarization: "bg-warning/15 text-warning",
  custom: "bg-muted text-muted-foreground",
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-brand-indigo/15 text-brand-indigo",
  anthropic: "bg-warning/15 text-warning",
  google: "bg-brand-cyan/15 text-brand-cyan",
  azure: "bg-brand-navy/15 text-brand-navy",
  internal: "bg-success/15 text-success",
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

type ToolRegistryProps = {
  onAddTool: () => void;
};

function formatLabel(value?: string | null): string {
  if (!value) {
    return "Custom";
  }

  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getCategoryColor(category?: string | null): string {
  if (!category) {
    return CATEGORY_COLORS.custom;
  }

  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.custom;
}

function getProviderColor(provider?: string | null): string {
  if (!provider) {
    return "bg-muted text-muted-foreground";
  }

  return PROVIDER_COLORS[provider.toLowerCase()] ?? "bg-muted text-muted-foreground";
}

function ToolCard({
  tool,
  onDelete,
  isDeleting,
}: {
  tool: ToolDefinition;
  onDelete: (tool: ToolDefinition) => void;
  isDeleting: boolean;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="group flex h-full flex-col rounded-lg border bg-card p-5 shadow-sm transition-colors duration-200 hover:border-brand-cyan/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_0_4px_rgba(34,197,94,0.12)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Available
            </span>
          </div>

          <div className="space-y-1.5">
            <h3 className="truncate font-sans-brand text-lg font-semibold text-foreground">
              {tool.name}
            </h3>
            <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
              {tool.description || "No description provided for this tool."}
            </p>
          </div>
        </div>

        {tool.is_builtin ? (
          <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="h-4 w-4" />
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(tool)}
            disabled={isDeleting}
            aria-label={`Delete ${tool.name}`}
            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Badge className={`rounded-full border-0 px-2.5 py-1 ${getCategoryColor(tool.category)}`}>
          {formatLabel(tool.category)}
        </Badge>

        {tool.is_builtin && (
          <Badge
            className={`rounded-full border-0 px-2.5 py-1 ${getProviderColor(tool.builtin_provider)}`}
          >
            {formatLabel(tool.builtin_provider ?? "built_in")}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

export default function ToolRegistry({ onAddTool }: ToolRegistryProps) {
  const { data: tools = [], isLoading } = useTools();
  const deleteTool = useDeleteTool();

  const handleDelete = (tool: ToolDefinition) => {
    if (tool.is_builtin) {
      return;
    }

    const confirmed = window.confirm(`Delete "${tool.name}" from your tool registry?`);

    if (!confirmed) {
      return;
    }

    deleteTool.mutate(tool.slug);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-foreground">
            <Wrench className="h-5 w-5 text-brand-cyan" />
            <h2 className="font-sans-brand text-xl font-semibold tracking-tight">
              Tool Registry
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Browse built-in providers and manage custom tools available to your workspace.
          </p>
        </div>

        <Button onClick={onAddTool} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Tool
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-lg border bg-card p-10 text-muted-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-brand-cyan" />
            <span className="text-sm">Loading available tools...</span>
          </div>
        </div>
      ) : tools.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed bg-card/60 p-10 text-center shadow-sm">
          <div className="mb-4 rounded-full bg-muted p-3 text-muted-foreground">
            <Wrench className="h-6 w-6" />
          </div>
          <h3 className="font-sans-brand text-lg font-semibold text-foreground">
            No tools available yet
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Add your first custom tool to start extending the dashboard.
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {tools.map((tool: ToolDefinition) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onDelete={handleDelete}
              isDeleting={deleteTool.isPending}
            />
          ))}
        </motion.div>
      )}
    </section>
  );
}
