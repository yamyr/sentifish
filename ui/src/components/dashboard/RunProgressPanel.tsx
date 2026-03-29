interface RunProgressPanelProps {
  runId: string;
  onDismiss: () => void;
}

/** Stub — full implementation in feat/frontend-run-progress-empty-state */
export default function RunProgressPanel({ runId, onDismiss }: RunProgressPanelProps) {
  return (
    <div className="rounded-lg border border-brand-cyan/20 bg-brand-cyan/5 px-4 py-3 text-sm text-brand-cyan flex items-center justify-between">
      <span>Run <code className="font-mono text-xs">{runId.slice(0, 8)}</code> in progress…</span>
      <button type="button" onClick={onDismiss} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
    </div>
  );
}
