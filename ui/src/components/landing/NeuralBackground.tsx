import { useEffect, useRef, useCallback } from "react";

interface Props {
  /** Number of nodes to render. Default 60. */
  nodeCount?: number;
  /** Max distance between nodes to draw a connection. Default 160. */
  connectionDistance?: number;
  /** Opacity multiplier for the whole canvas. Default 1. */
  opacity?: number;
  /** Primary color in rgb format. Default "51, 153, 137" (brand-cyan). */
  primaryColor?: string;
  /** Secondary color in rgb format. Default "127, 107, 198" (brand-indigo). */
  secondaryColor?: string;
  className?: string;
  /** Enable parallax depth layers. Default true. */
  depth?: boolean;
  /** Enable flowing wave lines. Default true. */
  waves?: boolean;
}

const enum Layer {
  Background = 0,
  Midground = 1,
  Foreground = 2,
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
  layer: Layer;
  baseOpacity: number;
}

interface Signal {
  fromIdx: number;
  toIdx: number;
  progress: number; // 0..1
  speed: number;
  color: string;
}

interface Burst {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

interface WaveLine {
  amplitude: number;
  frequency: number;
  speed: number;
  yOffset: number; // fraction of height (0..1)
  color: string;
  opacity: number;
  phase: number;
}

const LAYER_CONFIG = [
  { radiusMin: 0.5, radiusMax: 1, speed: 0.1, opacity: 0.2, fraction: 0.35 },
  { radiusMin: 1, radiusMax: 2, speed: 0.3, opacity: 0.5, fraction: 0.4 },
  { radiusMin: 2, radiusMax: 3.5, speed: 0.5, opacity: 0.8, fraction: 0.25 },
] as const;

const NeuralBackground = ({
  nodeCount = 60,
  connectionDistance = 160,
  opacity = 1,
  primaryColor = "51, 153, 137",
  secondaryColor = "127, 107, 198",
  className = "",
  depth = true,
  waves = true,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const signalsRef = useRef<Signal[]>([]);
  const burstsRef = useRef<Burst[]>([]);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const initNodes = useCallback(
    (w: number, h: number) => {
      const nodes: Node[] = [];
      for (let i = 0; i < nodeCount; i++) {
        let layer: Layer;
        let cfg;
        if (depth) {
          const r = i / nodeCount;
          if (r < LAYER_CONFIG[0].fraction) {
            layer = Layer.Background;
          } else if (r < LAYER_CONFIG[0].fraction + LAYER_CONFIG[1].fraction) {
            layer = Layer.Midground;
          } else {
            layer = Layer.Foreground;
          }
          cfg = LAYER_CONFIG[layer];
        } else {
          layer = Layer.Midground;
          cfg = LAYER_CONFIG[1];
        }

        const speedMul = cfg.speed;
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4 * (speedMul / 0.3),
          vy: (Math.random() - 0.5) * 0.4 * (speedMul / 0.3),
          radius: cfg.radiusMin + Math.random() * (cfg.radiusMax - cfg.radiusMin),
          pulsePhase: Math.random() * Math.PI * 2,
          layer,
          baseOpacity: cfg.opacity,
        });
      }
      return nodes;
    },
    [nodeCount, depth],
  );

  const initWaves = useCallback(
    (): WaveLine[] => {
      if (!waves) return [];
      const colors = [primaryColor, secondaryColor, primaryColor, secondaryColor];
      return [
        { amplitude: 30, frequency: 0.003, speed: 0.008, yOffset: 0.25, color: colors[0], opacity: 0.04, phase: 0 },
        { amplitude: 45, frequency: 0.002, speed: -0.006, yOffset: 0.5, color: colors[1], opacity: 0.03, phase: 1.2 },
        { amplitude: 25, frequency: 0.004, speed: 0.01, yOffset: 0.7, color: colors[2], opacity: 0.05, phase: 2.8 },
        { amplitude: 35, frequency: 0.0025, speed: -0.005, yOffset: 0.4, color: colors[3], opacity: 0.06, phase: 4.1 },
      ];
    },
    [waves, primaryColor, secondaryColor],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let waveLines: WaveLine[] = [];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodesRef.current = initNodes(w, h);
      signalsRef.current = [];
      burstsRef.current = [];
      waveLines = initWaves();
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = null;
    };
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    let time = 0;

    const spawnSignal = () => {
      const nodes = nodesRef.current;
      if (nodes.length < 2) return;
      // Prefer midground/foreground nodes for signals (they're more visible)
      const eligibleIndices: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].layer !== Layer.Background) eligibleIndices.push(i);
      }
      if (eligibleIndices.length < 2) return;

      const from = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
      const candidates: number[] = [];
      for (let j = 0; j < nodes.length; j++) {
        if (j === from || nodes[j].layer === Layer.Background) continue;
        const dx = nodes[from].x - nodes[j].x;
        const dy = nodes[from].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < connectionDistance) {
          candidates.push(j);
        }
      }
      if (candidates.length === 0) return;
      const to = candidates[Math.floor(Math.random() * candidates.length)];
      signalsRef.current.push({
        fromIdx: from,
        toIdx: to,
        progress: 0,
        speed: 0.008 + Math.random() * 0.012,
        color: Math.random() > 0.5 ? primaryColor : secondaryColor,
      });
    };

    const spawnBurst = (x: number, y: number, color: string) => {
      burstsRef.current.push({
        x,
        y,
        radius: 2,
        maxRadius: 18 + Math.random() * 10,
        opacity: 0.5,
        color,
      });
    };

    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const signals = signalsRef.current;
      const bursts = burstsRef.current;
      const mouse = mouseRef.current;

      // Spawn signals periodically
      if (time % 8 === 0) spawnSignal();

      // --- Draw wave lines (behind everything) ---
      if (waves && waveLines.length > 0) {
        for (const wave of waveLines) {
          wave.phase += wave.speed;
          ctx.beginPath();
          const yBase = wave.yOffset * h;
          ctx.moveTo(0, yBase + Math.sin(wave.phase) * wave.amplitude);
          // Step by 4px for performance
          for (let x = 4; x <= w; x += 4) {
            const y = yBase + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(${wave.color}, ${wave.opacity})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // --- Update nodes ---
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off walls with padding
        if (node.x < -20) node.vx = Math.abs(node.vx);
        if (node.x > w + 20) node.vx = -Math.abs(node.vx);
        if (node.y < -20) node.vy = Math.abs(node.vy);
        if (node.y > h + 20) node.vy = -Math.abs(node.vy);

        // Mouse repulsion
        if (mouse) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 14400 && distSq > 0) { // 120^2
            const dist = Math.sqrt(distSq);
            const force = ((120 - dist) / 120) * 0.15;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        // Damping
        node.vx *= 0.999;
        node.vy *= 0.999;
      }

      // --- Draw connections (batch by layer for fewer state changes) ---
      // Only connect nodes on the same layer or adjacent layers
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const layerDiff = Math.abs(nodes[i].layer - nodes[j].layer);
          if (layerDiff > 1) continue; // skip connections between bg and fg

          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx * dx + dy * dy;
          const maxDist = connectionDistance;
          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const baseAlpha = (1 - dist / maxDist) * 0.15;
            // Dim connections involving background layer
            const layerOpacity = Math.min(nodes[i].baseOpacity, nodes[j].baseOpacity);
            const alpha = baseAlpha * (layerOpacity / 0.5);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${primaryColor}, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      // --- Draw and update signals ---
      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        sig.progress += sig.speed;
        if (sig.progress >= 1) {
          // Burst effect at destination
          const dest = nodes[sig.toIdx];
          if (dest) {
            spawnBurst(dest.x, dest.y, sig.color);
          }

          // Chain reaction
          if (Math.random() < 0.3) {
            const nextCandidates: number[] = [];
            for (let j = 0; j < nodes.length; j++) {
              if (j === sig.toIdx || j === sig.fromIdx) continue;
              if (nodes[j].layer === Layer.Background) continue;
              const dx2 = nodes[sig.toIdx].x - nodes[j].x;
              const dy2 = nodes[sig.toIdx].y - nodes[j].y;
              if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < connectionDistance) {
                nextCandidates.push(j);
              }
            }
            if (nextCandidates.length > 0) {
              const next = nextCandidates[Math.floor(Math.random() * nextCandidates.length)];
              signals.push({
                fromIdx: sig.toIdx,
                toIdx: next,
                progress: 0,
                speed: 0.01 + Math.random() * 0.015,
                color: sig.color,
              });
            }
          }
          signals.splice(s, 1);
          continue;
        }

        const from = nodes[sig.fromIdx];
        const to = nodes[sig.toIdx];
        if (!from || !to) {
          signals.splice(s, 1);
          continue;
        }

        const sx = from.x + (to.x - from.x) * sig.progress;
        const sy = from.y + (to.y - from.y) * sig.progress;

        // Particle trail (4 dots behind the signal head)
        const trailCount = 4;
        const trailStep = 0.025;
        for (let t = trailCount; t >= 1; t--) {
          const tp = sig.progress - t * trailStep;
          if (tp < 0) continue;
          const tx = from.x + (to.x - from.x) * tp;
          const ty = from.y + (to.y - from.y) * tp;
          const trailAlpha = (1 - t / (trailCount + 1)) * 0.5;
          const trailR = 1.2 - t * 0.2;
          ctx.beginPath();
          ctx.arc(tx, ty, Math.max(0.4, trailR), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${sig.color}, ${trailAlpha})`;
          ctx.fill();
        }

        // Glow (slightly larger radius)
        const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 15);
        gradient.addColorStop(0, `rgba(${sig.color}, 0.6)`);
        gradient.addColorStop(0.4, `rgba(${sig.color}, 0.15)`);
        gradient.addColorStop(1, `rgba(${sig.color}, 0)`);
        ctx.beginPath();
        ctx.arc(sx, sy, 15, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${sig.color}, 0.9)`;
        ctx.fill();

        // Trail line
        const trailLen = 0.08;
        const trailStart = Math.max(0, sig.progress - trailLen);
        const tsx = from.x + (to.x - from.x) * trailStart;
        const tsy = from.y + (to.y - from.y) * trailStart;
        const trailGrad = ctx.createLinearGradient(tsx, tsy, sx, sy);
        trailGrad.addColorStop(0, `rgba(${sig.color}, 0)`);
        trailGrad.addColorStop(1, `rgba(${sig.color}, 0.4)`);
        ctx.beginPath();
        ctx.moveTo(tsx, tsy);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // --- Draw burst effects ---
      for (let b = bursts.length - 1; b >= 0; b--) {
        const burst = bursts[b];
        burst.radius += 0.8;
        burst.opacity -= 0.02;
        if (burst.opacity <= 0 || burst.radius >= burst.maxRadius) {
          bursts.splice(b, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${burst.color}, ${burst.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // --- Draw nodes (batch by layer: back to front) ---
      const layerOrder = depth
        ? [Layer.Background, Layer.Midground, Layer.Foreground]
        : [Layer.Midground];

      for (const layerIdx of layerOrder) {
        for (const node of nodes) {
          if (node.layer !== layerIdx) continue;

          const pulse = Math.sin(time * 0.02 + node.pulsePhase) * 0.3 + 0.7;
          const nodeOpacity = node.baseOpacity * pulse;

          // Outer glow
          const glowRadius = node.radius * 4;
          const glow = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, glowRadius,
          );
          glow.addColorStop(0, `rgba(${primaryColor}, ${0.15 * nodeOpacity})`);
          glow.addColorStop(1, `rgba(${primaryColor}, 0)`);
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${primaryColor}, ${0.5 * nodeOpacity})`;
          ctx.fill();
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [nodeCount, connectionDistance, primaryColor, secondaryColor, initNodes, initWaves, depth, waves]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-auto absolute inset-0 ${className}`}
      style={{ opacity, willChange: "transform" }}
    />
  );
};

export default NeuralBackground;
