import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDatasets, useDeleteDataset } from "@/hooks/useApi";
import { toast } from "sonner";
import { Database, Loader2, Trash2 } from "lucide-react";

export default function DatasetList() {
  const { data: datasets, isLoading } = useDatasets();
  const deleteDataset = useDeleteDataset();

  const handleDelete = (name: string) => {
    if (!window.confirm(`Delete dataset "${name}"? This cannot be undone.`)) {
      return;
    }
    deleteDataset.mutate(name, {
      onSuccess: () => {
        toast.success("Dataset deleted", { description: name });
      },
      onError: (err) => {
        toast.error("Failed to delete dataset", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-sans-brand">
            <Database className="h-5 w-5 text-brand-cyan" />
            Datasets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading datasets...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!datasets || datasets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-sans-brand">
            <Database className="h-5 w-5 text-brand-cyan" />
            Datasets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No datasets yet. Create one to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-sans-brand">
          <Database className="h-5 w-5 text-brand-cyan" />
          Datasets
          <Badge variant="secondary" className="font-mono-brand ml-1">
            {datasets.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {datasets.map((ds) => (
            <motion.div
              key={ds.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono-brand text-sm font-medium text-foreground truncate">
                    {ds.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs font-mono-brand"
                  >
                    {ds.cases.length} {ds.cases.length === 1 ? "query" : "queries"}
                  </Badge>
                </div>
                {ds.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {ds.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(ds.name)}
                disabled={deleteDataset.isPending}
                className="ml-3 shrink-0 rounded-sm p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                title={`Delete ${ds.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
