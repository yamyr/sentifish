import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTool } from "@/hooks/useApi";
import type { ToolDefinition } from "@/lib/api/sentifish";
import { ArrowLeft, ArrowRight, Check, Globe, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

type AddToolDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ToolCategory = ToolDefinition["category"];

type BuiltinProviderOption = {
  provider: string;
  name: string;
  description: string;
  category: Exclude<ToolCategory, "custom">;
  inputType: string;
  outputType: string;
};

type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

const CATEGORY_COLORS: Record<string, string> = {
  search: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30",
  ai_assistant: "bg-brand-indigo/15 text-brand-indigo border-brand-indigo/30",
  code_generation: "bg-success/15 text-success border-success/30",
  image_generation: "bg-warning/15 text-warning border-warning/30",
  data_extraction: "bg-brand-navy/15 text-brand-navy border-brand-navy/30",
  summarization: "bg-warning/15 text-warning border-warning/30",
  custom: "bg-muted text-muted-foreground border-border",
};

const CATEGORY_OPTIONS: Array<{
  value: ToolCategory;
  label: string;
  description: string;
}> = [
  {
    value: "search",
    label: "Search",
    description: "Retrieval, browsing, and web lookup tools.",
  },
  {
    value: "ai_assistant",
    label: "AI Assistant",
    description: "Conversation-first assistants and agentic helpers.",
  },
  {
    value: "code_generation",
    label: "Code Generation",
    description: "Coding copilots and code synthesis providers.",
  },
  {
    value: "image_generation",
    label: "Image Generation",
    description: "Image creation models and media generation tools.",
  },
  {
    value: "data_extraction",
    label: "Data Extraction",
    description: "Structured extraction, scraping, and parsing tools.",
  },
  {
    value: "summarization",
    label: "Summarization",
    description: "Condense long content into concise outputs.",
  },
  {
    value: "custom",
    label: "Custom HTTP",
    description: "Bring your own endpoint, auth, and request templates.",
  },
];

const BUILTIN_PROVIDERS: BuiltinProviderOption[] = [
  {
    provider: "tavily",
    name: "Tavily Search",
    description: "Web search tuned for fast retrieval and research workflows.",
    category: "search",
    inputType: "text",
    outputType: "json",
  },
  {
    provider: "openai_assistant",
    name: "OpenAI Assistant",
    description: "General-purpose conversational assistant with tool-friendly outputs.",
    category: "ai_assistant",
    inputType: "text",
    outputType: "text",
  },
  {
    provider: "anthropic_assistant",
    name: "Anthropic Assistant",
    description: "High-context assistant for nuanced reasoning and drafting.",
    category: "ai_assistant",
    inputType: "text",
    outputType: "text",
  },
  {
    provider: "github_copilot",
    name: "GitHub Copilot",
    description: "Code generation provider optimized for developer workflows.",
    category: "code_generation",
    inputType: "text",
    outputType: "text",
  },
  {
    provider: "openai_images",
    name: "OpenAI Images",
    description: "Image generation provider for prompt-driven visual creation.",
    category: "image_generation",
    inputType: "text",
    outputType: "image",
  },
  {
    provider: "firecrawl",
    name: "Firecrawl Extract",
    description: "Extract structured data from live pages and documents.",
    category: "data_extraction",
    inputType: "text",
    outputType: "json",
  },
  {
    provider: "openai_summary",
    name: "OpenAI Summary",
    description: "Summarization model for concise reports and executive briefs.",
    category: "summarization",
    inputType: "text",
    outputType: "text",
  },
];

const STEP_LABELS = ["Category", "Configure", "Review"];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildAuthHeaders(rawHeader: string) {
  const headers: Record<string, string> = {};
  const trimmed = rawHeader.trim();

  if (!trimmed) {
    return headers;
  }

  const separatorIndex = trimmed.indexOf(":");

  if (separatorIndex > -1) {
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (key && value) {
      headers[key] = value;
    }

    return headers;
  }

  headers.Authorization = trimmed;
  return headers;
}

export default function AddToolDialog({ open, onOpenChange }: AddToolDialogProps) {
  const createTool = useCreateTool();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | "">("");
  const [builtinProvider, setBuiltinProvider] = useState("");
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customEndpointUrl, setCustomEndpointUrl] = useState("");
  const [customAuthHeader, setCustomAuthHeader] = useState("");
  const [customRequestTemplate, setCustomRequestTemplate] = useState("{\n  \"input\": \"{{input}}\"\n}");
  const [customResponseTemplate, setCustomResponseTemplate] = useState("{\n  \"output\": \"{{response}}\"\n}");
  const [customInputType, setCustomInputType] = useState("text");
  const [customOutputType, setCustomOutputType] = useState("json");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResponse, setTestResponse] = useState("");

  const selectedBuiltinProvider = useMemo(
    () => BUILTIN_PROVIDERS.find((provider) => provider.provider === builtinProvider),
    [builtinProvider],
  );

  const availableBuiltinProviders = useMemo(() => {
    if (!selectedCategory || selectedCategory === "custom") {
      return [];
    }

    return BUILTIN_PROVIDERS.filter((provider) => provider.category === selectedCategory);
  }, [selectedCategory]);

  const isCustomCategory = selectedCategory === "custom";
  const customSlug = slugify(customName);
  const isCreating = createTool.isPending;

  const canContinueFromStep1 = Boolean(selectedCategory);
  const canContinueFromStep2 = isCustomCategory
    ? Boolean(
        customName.trim() &&
          customEndpointUrl.trim() &&
          customRequestTemplate.trim() &&
          customResponseTemplate.trim(),
      )
    : Boolean(selectedBuiltinProvider);

  const resetForm = () => {
    setStep(1);
    setSelectedCategory("");
    setBuiltinProvider("");
    setCustomName("");
    setCustomDescription("");
    setCustomEndpointUrl("");
    setCustomAuthHeader("");
    setCustomRequestTemplate("{\n  \"input\": \"{{input}}\"\n}");
    setCustomResponseTemplate("{\n  \"output\": \"{{response}}\"\n}");
    setCustomInputType("text");
    setCustomOutputType("json");
    setIsTestingConnection(false);
    setTestResponse("");
  };

  const handleCategorySelect = (category: ToolCategory) => {
    setSelectedCategory(category);
    setStep(1);
    setTestResponse("");

    if (category === "custom") {
      setBuiltinProvider("");
      return;
    }

    const firstMatch = BUILTIN_PROVIDERS.find((provider) => provider.category === category);

    if (!firstMatch || firstMatch.provider !== builtinProvider) {
      setBuiltinProvider("");
    }
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isCreating) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleTestConnection = async () => {
    if (!customEndpointUrl.trim()) {
      toast.error("Add an endpoint URL before testing the connection.");
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    const requestBody = customRequestTemplate.trim();

    try {
      setIsTestingConnection(true);
      setTestResponse("");

      const headers = buildAuthHeaders(customAuthHeader);

      if (requestBody) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(customEndpointUrl, {
        method: requestBody ? "POST" : "GET",
        headers,
        body: requestBody || undefined,
        signal: controller.signal,
      });

      const rawResponse = await response.text();
      setTestResponse(rawResponse || `${response.status} ${response.statusText}`);

      if (!response.ok) {
        toast.error(`Connection test failed (${response.status}).`);
        return;
      }

      toast.success("Connection test succeeded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown connection error";
      setTestResponse(message);
      toast.error(message === "The operation was aborted." ? "Connection test timed out." : message);
    } finally {
      window.clearTimeout(timeoutId);
      setIsTestingConnection(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      toast.error("Choose a category before saving.");
      return;
    }

    try {
      if (isCustomCategory) {
        await createTool.mutateAsync({
          name: customName.trim(),
          slug: customSlug,
          category: "custom",
          input_type: (customInputType.trim() || "text_query") as ToolDefinition["input_type"],
          output_type: (customOutputType.trim() || "json") as ToolDefinition["output_type"],
          description: customDescription.trim(),
          endpoint_url: customEndpointUrl.trim(),
          is_builtin: false,
        });
      } else if (selectedBuiltinProvider) {
        await createTool.mutateAsync({
          name: selectedBuiltinProvider.name,
          slug: slugify(selectedBuiltinProvider.name),
          category: selectedBuiltinProvider.category,
          input_type: selectedBuiltinProvider.inputType as ToolDefinition["input_type"],
          output_type: selectedBuiltinProvider.outputType as ToolDefinition["output_type"],
          description: selectedBuiltinProvider.description,
          builtin_provider: selectedBuiltinProvider.provider,
          is_builtin: true,
        });
      }

      toast.success("Tool created successfully.");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tool.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden border border-brand-cyan/20 bg-card p-0 text-foreground sm:max-w-3xl">
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {STEP_LABELS.map((label, index) => {
                const currentStep = index + 1;
                const isActive = currentStep === step;
                const isComplete = currentStep < step;

                return (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className={[
                        "h-2.5 w-2.5 rounded-full transition-colors",
                        isActive || isComplete ? "bg-brand-cyan" : "bg-muted",
                      ].join(" ")}
                    />
                    <span
                      className={[
                        "text-xs font-medium uppercase tracking-[0.22em]",
                        isActive || isComplete ? "text-brand-cyan" : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-1 text-xs font-medium text-brand-cyan">
              Step {step} of 3
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold tracking-tight">Add a new tool</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Configure a built-in provider or wire up a custom HTTP endpoint in three quick steps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto px-6 py-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">Choose a category</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start with the capability you want this tool to provide.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {CATEGORY_OPTIONS.map((option) => {
                  const isSelected = selectedCategory === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleCategorySelect(option.value)}
                      className={[
                        "group rounded-2xl border bg-card p-4 text-left transition-all",
                        isSelected
                          ? "border-brand-cyan bg-brand-cyan/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                          : "border-border hover:border-brand-cyan/40 hover:bg-muted/40",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{option.label}</div>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{option.description}</p>
                        </div>
                        <span
                          className={[
                            "rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
                            CATEGORY_COLORS[option.value],
                          ].join(" ")}
                        >
                          {option.value.replace(/_/g, " ")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 2 && !isCustomCategory ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">Pick a built-in provider</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose from available providers for the selected category.
                </p>
              </div>

              <div className="grid gap-3">
                {availableBuiltinProviders.map((provider: BuiltinProviderOption) => {
                  const isSelected = builtinProvider === provider.provider;

                  return (
                    <button
                      key={provider.provider}
                      type="button"
                      onClick={() => setBuiltinProvider(provider.provider)}
                      className={[
                        "rounded-2xl border bg-card p-4 text-left transition-all",
                        isSelected
                          ? "border-brand-cyan bg-brand-cyan/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                          : "border-border hover:border-brand-cyan/40 hover:bg-muted/40",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 p-2 text-brand-cyan">
                            <Zap className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{provider.name}</div>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{provider.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="rounded-full border border-border bg-muted px-2.5 py-1">
                                Provider: {provider.provider}
                              </span>
                              <span className="rounded-full border border-border bg-muted px-2.5 py-1">
                                {provider.inputType} → {provider.outputType}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isSelected ? <Check className="mt-1 h-4 w-4 text-brand-cyan" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {availableBuiltinProviders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  No built-in providers are available for this category yet.
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 && isCustomCategory ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium text-foreground">Configure your custom HTTP tool</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add the endpoint, auth header, and request/response templates used by your service.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tool-name">Tool name</Label>
                  <Input
                    id="tool-name"
                    value={customName}
                    onChange={(event: ChangeEvent) => setCustomName(event.target.value)}
                    placeholder="Acme Extract API"
                    className="border-border bg-background/70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tool-slug">Slug preview</Label>
                  <Input
                    id="tool-slug"
                    value={customSlug}
                    readOnly
                    placeholder="acme-extract-api"
                    className="border-border bg-muted/40 text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tool-description">Description</Label>
                <Input
                  id="tool-description"
                  value={customDescription}
                  onChange={(event: ChangeEvent) => setCustomDescription(event.target.value)}
                  placeholder="Describe what this tool does and when it should be used."
                  className="border-border bg-background/70"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tool-input-type">Input type</Label>
                  <Input
                    id="tool-input-type"
                    value={customInputType}
                    onChange={(event: ChangeEvent) => setCustomInputType(event.target.value)}
                    placeholder="text"
                    className="border-border bg-background/70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tool-output-type">Output type</Label>
                  <Input
                    id="tool-output-type"
                    value={customOutputType}
                    onChange={(event: ChangeEvent) => setCustomOutputType(event.target.value)}
                    placeholder="json"
                    className="border-border bg-background/70"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="tool-endpoint-url">Endpoint URL</Label>
                    <Input
                      id="tool-endpoint-url"
                      value={customEndpointUrl}
                      onChange={(event: ChangeEvent) => setCustomEndpointUrl(event.target.value)}
                      placeholder="https://api.example.com/tools/run"
                      className="border-border bg-background/70"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !customEndpointUrl.trim()}
                    className="border-brand-cyan/30 bg-card text-brand-cyan hover:bg-brand-cyan/10 hover:text-brand-cyan"
                  >
                    {isTestingConnection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                    Test Connection
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="tool-auth-header">Auth header</Label>
                  <Input
                    id="tool-auth-header"
                    value={customAuthHeader}
                    onChange={(event: ChangeEvent) => setCustomAuthHeader(event.target.value)}
                    placeholder="Authorization: Bearer sk-..."
                    className="border-border bg-background/70"
                  />
                </div>

                {testResponse ? (
                  <div className="mt-4 rounded-xl border border-brand-cyan/20 bg-card p-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-brand-cyan">
                      Raw response
                    </div>
                    <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground">
                      {testResponse}
                    </pre>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tool-request-template">Request template</Label>
                  <textarea
                    id="tool-request-template"
                    value={customRequestTemplate}
                    onChange={(event: ChangeEvent) => setCustomRequestTemplate(event.target.value)}
                    className="min-h-[180px] w-full rounded-xl border border-border bg-background/70 px-3 py-2 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
                    placeholder={`{
  "input": "{{input}}"
}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tool-response-template">Response template</Label>
                  <textarea
                    id="tool-response-template"
                    value={customResponseTemplate}
                    onChange={(event: ChangeEvent) => setCustomResponseTemplate(event.target.value)}
                    className="min-h-[180px] w-full rounded-xl border border-border bg-background/70 px-3 py-2 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
                    placeholder={`{
  "output": "{{response}}"
}`}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 && selectedCategory ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium text-foreground">Review configuration</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Double-check the setup before saving this tool.
                </p>
              </div>

              <div className="rounded-2xl border border-brand-cyan/20 bg-brand-cyan/5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-foreground">
                      {isCustomCategory ? customName || "Unnamed custom tool" : selectedBuiltinProvider?.name}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {isCustomCategory
                        ? customDescription || "Custom HTTP tool with endpoint-driven execution."
                        : selectedBuiltinProvider?.description}
                    </p>
                  </div>
                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
                      CATEGORY_COLORS[selectedCategory],
                    ].join(" ")}
                  >
                    {selectedCategory.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Slug</div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {isCustomCategory ? customSlug || "—" : slugify(selectedBuiltinProvider?.name ?? "")}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mode</div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {isCustomCategory ? "Custom HTTP" : "Built-in provider"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Input / output</div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {isCustomCategory
                        ? `${customInputType || "text"} → ${customOutputType || "json"}`
                        : `${selectedBuiltinProvider?.inputType ?? "text"} → ${selectedBuiltinProvider?.outputType ?? "text"}`}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {isCustomCategory ? "Endpoint" : "Provider"}
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {isCustomCategory ? customEndpointUrl || "—" : selectedBuiltinProvider?.provider}
                    </div>
                  </div>
                </div>
              </div>

              {isCustomCategory ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Request template
                    </div>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground">
                      {customRequestTemplate}
                    </pre>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Response template
                    </div>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground">
                      {customResponseTemplate}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((current: 1 | 2 | 3) => (current > 1 ? ((current - 1) as 1 | 2 | 3) : current))}
            disabled={step === 1 || isCreating}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((current: 1 | 2 | 3) => (current < 3 ? ((current + 1) as 1 | 2 | 3) : current))}
                disabled={(step === 1 && !canContinueFromStep1) || (step === 2 && !canContinueFromStep2)}
                className="bg-brand-cyan text-brand-navy hover:bg-brand-cyan/90"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSave}
                disabled={isCreating || !selectedCategory || (isCustomCategory && !customSlug)}
                className="bg-brand-cyan text-brand-navy hover:bg-brand-cyan/90"
              >
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save tool
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
