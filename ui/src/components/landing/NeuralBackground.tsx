import { useEffect, useRef, useCallback } from "react";

interface Props {
  /** Number of nodes to render. Default 60. */
  nodeCount?: number;
  /** Max distance between nodes to draw a connection. Default 160. */
  connectionDistance?: number;
  /** Opacity multiplier for the whole canvas. Default 1. */
  opacity?: number;
  /** Primary color in rgb format. Default "56, 189, 217" (brand-cyan). */
  primaryColor?: string;
  /** Secondary color in rgb format. Default "99, 91, 255" (brand-indigo). */
  secondaryColor?: string;
  className?: string;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
}

interface Signal {
  fromIdx: number;
  toIdx: number;
  progress: number; // 0..1
  speed: number;
  color: string;
}

const NeuralBackground = ({
  nodeCount = 60,
  connectionDistance = 160,
  opacity = 1,
  primaryColor = "51, 153, 137",
  secondaryColor = "127, 107, 198",
  className = "",
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const signalsRef = useRef<Signal[]>([]);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const initNodes = useCallback(
    (w: number, h: number) => {
      const nodes: Node[] = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5 + 1,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }
      return nodes;
    },
    [nodeCount],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;

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

      // Re-init nodes on resize
      nodesRef.current = initNodes(w, h);
      signalsRef.current = [];
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
      const from = Math.floor(Math.random() * nodes.length);
      // Find a nearby node to send signal to
      const candidates: number[] = [];
      for (let j = 0; j < nodes.length; j++) {
        if (j === from) continue;
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

    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const signals = signalsRef.current;
      const mouse = mouseRef.current;

      // Spawn signals periodically
      if (time % 8 === 0) spawnSignal();

      // Update nodes
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
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120 * 0.15;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        // Damping
        node.vx *= 0.999;
        node.vy *= 0.999;
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${primaryColor}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw and update signals
      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        sig.progress += sig.speed;
        if (sig.progress >= 1) {
          // Chain reaction: signal arriving can trigger a new signal from the destination
          if (Math.random() < 0.3) {
            const nextCandidates: number[] = [];
            for (let j = 0; j < nodes.length; j++) {
              if (j === sig.toIdx || j === sig.fromIdx) continue;
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

        // Glow
        const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12);
        gradient.addColorStop(0, `rgba(${sig.color}, 0.6)`);
        gradient.addColorStop(0.5, `rgba(${sig.color}, 0.15)`);
        gradient.addColorStop(1, `rgba(${sig.color}, 0)`);
        ctx.beginPath();
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${sig.color}, 0.9)`;
        ctx.fill();

        // Trail
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

      // Draw nodes
      for (const node of nodes) {
        const pulse = Math.sin(time * 0.02 + node.pulsePhase) * 0.3 + 0.7;

        // Outer glow
        const glow = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, node.radius * 4,
        );
        glow.addColorStop(0, `rgba(${primaryColor}, ${0.15 * pulse})`);
        glow.addColorStop(1, `rgba(${primaryColor}, 0)`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${primaryColor}, ${0.5 * pulse})`;
        ctx.fill();
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
  }, [nodeCount, connectionDistance, primaryColor, secondaryColor, initNodes]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-auto absolute inset-0 ${className}`}
      style={{ opacity }}
    />
  );
};

export default NeuralBackground;
