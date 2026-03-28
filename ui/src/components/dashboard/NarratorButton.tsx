import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  Square,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { sentifishApi } from "@/lib/api/sentifish";

interface NarratorButtonProps {
  runId: string | null;
}

type NarratorState = "idle" | "loading" | "playing" | "error";

function SoundWaveBars() {
  const bars = [0, 1, 2];
  return (
    <div className="flex items-center gap-0.5">
      {bars.map((i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-brand-cyan"
          animate={{ height: [4, 14, 4] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function NarratorButton({ runId }: NarratorButtonProps) {
  const [state, setState] = useState<NarratorState>("idle");
  const [narrationText, setNarrationText] = useState<string | null>(null);
  const [textExpanded, setTextExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, []);

  const handleNarrate = useCallback(async () => {
    if (!runId) return;

    setState("loading");
    setNarrationText(null);
    setTextExpanded(true);

    try {
      // Fetch narration text
      const { text } = await sentifishApi.getNarrationText(runId);
      setNarrationText(text);

      // Create and play audio
      const audio = new Audio(sentifishApi.getNarrationAudioUrl(runId));
      audioRef.current = audio;

      audio.addEventListener("ended", () => {
        setState("idle");
      });

      audio.addEventListener("error", () => {
        toast.error("Failed to load narration audio");
        setState("error");
      });

      await audio.play();
      setState("playing");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate narration";
      toast.error(message);
      setState("error");
    }
  }, [runId]);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState("idle");
  }, []);

  const isDisabled = !runId || state === "loading";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Main narrate / stop button */}
        {state === "playing" ? (
          <button
            onClick={handleStop}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            <Square className="h-4 w-4" />
            Stop
            <SoundWaveBars />
          </button>
        ) : (
          <button
            onClick={handleNarrate}
            disabled={isDisabled}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            {state === "loading" ? "Generating..." : "Narrate Results"}
          </button>
        )}

        {/* Toggle text preview */}
        {narrationText && (
          <button
            onClick={() => setTextExpanded((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {textExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {textExpanded ? "Hide text" : "Show text"}
          </button>
        )}
      </div>

      {/* Narration text preview */}
      <AnimatePresence>
        {narrationText && textExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border bg-secondary p-4 text-sm leading-relaxed text-muted-foreground">
              {narrationText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
