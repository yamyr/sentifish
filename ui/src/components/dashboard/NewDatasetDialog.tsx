import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useCreateDataset } from "@/hooks/useApi";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface NewDatasetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QueryRow {
  id: string;
  query: string;
  relevant_urls: string;
}

const SLUG_REGEX = /^[a-z0-9-]+$/;

let nextId = 0;
function emptyRow(): QueryRow {
  return { id: `q-${++nextId}`, query: "", relevant_urls: "" };
}

export default function NewDatasetDialog({
  open,
  onOpenChange,
}: NewDatasetDialogProps) {
  const createDataset = useCreateDataset();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [queries, setQueries] = useState<QueryRow[]>([emptyRow()]);

  const nameValid = name.length > 0 && SLUG_REGEX.test(name);
  const hasValidQuery = queries.some((q) => q.query.trim().length > 0);
  const canSubmit = nameValid && hasValidQuery && !createDataset.isPending;

  const updateQuery = (index: number, field: keyof QueryRow, value: string) => {
    setQueries((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const addQuery = () => {
    setQueries((prev) => [...prev, emptyRow()]);
  };

  const removeQuery = (index: number) => {
    if (queries.length <= 1) return;
    setQueries((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setQueries([emptyRow()]);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const validCases = queries
      .filter((q) => q.query.trim().length > 0)
      .map((q) => ({
        query: q.query.trim(),
        relevant_urls: q.relevant_urls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean),
      }));

    try {
      await createDataset.mutateAsync({
        name,
        description,
        cases: validCases,
      });
      toast.success("Dataset created", {
        description: `"${name}" with ${validCases.length} query(ies)`,
      });
      onOpenChange(false);
      resetForm();
    } catch (err) {
      toast.error("Failed to create dataset", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans-brand">New Dataset</DialogTitle>
          <DialogDescription>
            Create a custom evaluation dataset with queries and optional
            relevant URLs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="dataset-name">Name</Label>
            <Input
              id="dataset-name"
              placeholder="my-dataset"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              className="font-mono-brand"
            />
            {name.length > 0 && !nameValid && (
              <p className="text-xs text-destructive">
                Lowercase letters, numbers, and hyphens only
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataset-desc">Description (optional)</Label>
            <Input
              id="dataset-desc"
              placeholder="What this dataset evaluates"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Queries</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuery}
                className="gap-1 h-7 text-xs"
              >
                <Plus className="h-3 w-3" />
                Add Query
              </Button>
            </div>
            <div className="space-y-3">
              {queries.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Query {index + 1}
                    </span>
                    {queries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuery(index)}
                        className="rounded-sm p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="Search query text"
                    value={row.query}
                    onChange={(e) => updateQuery(index, "query", e.target.value)}
                  />
                  <textarea
                    placeholder="Relevant URLs (one per line, optional)"
                    value={row.relevant_urls}
                    onChange={(e) =>
                      updateQuery(index, "relevant_urls", e.target.value)
                    }
                    rows={2}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {createDataset.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Dataset"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
