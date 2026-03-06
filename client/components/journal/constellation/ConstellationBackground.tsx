"use client";

import { useRef, useEffect } from "react";

interface Props {
  width: number;
  height: number;
}

interface MicroStar {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speed: number; // twinkle speed
  phase: number;
}

function seededRandom(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function ConstellationBackground({ width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<MicroStar[]>([]);
  const rafRef = useRef<number>(0);

  // Generate micro-stars once when dimensions change
  useEffect(() => {
    const count = 160;
    const stars: MicroStar[] = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: seededRandom(i) * width,
        y: seededRandom(i + count) * height,
        r: 0.3 + seededRandom(i + count * 2) * 1.2,
        alpha: 0.2 + seededRandom(i + count * 3) * 0.6,
        speed: 0.3 + seededRandom(i + count * 4) * 0.7,
        phase: seededRandom(i + count * 5) * Math.PI * 2,
      });
    }
    starsRef.current = stars;
  }, [width, height]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const draw = (time: number) => {
      if (!running) return;
      const t = time / 1000;

      // Deep space gradient
      const grad = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) * 0.7
      );
      grad.addColorStop(0, "#0e0a22");
      grad.addColorStop(0.5, "#070516");
      grad.addColorStop(1, "#02020a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Nebula clouds
      const nebulae = [
        { x: width * 0.3, y: height * 0.25, rx: width * 0.18, ry: height * 0.12, color: "rgba(88, 28, 135, 0.06)" },
        { x: width * 0.7, y: height * 0.35, rx: width * 0.15, ry: height * 0.1, color: "rgba(59, 130, 246, 0.04)" },
        { x: width * 0.5, y: height * 0.65, rx: width * 0.2, ry: height * 0.14, color: "rgba(139, 92, 246, 0.05)" },
        { x: width * 0.2, y: height * 0.75, rx: width * 0.12, ry: height * 0.08, color: "rgba(236, 72, 153, 0.03)" },
        { x: width * 0.8, y: height * 0.7, rx: width * 0.14, ry: height * 0.1, color: "rgba(56, 189, 248, 0.035)" },
        { x: width * 0.5, y: height * 0.4, rx: width * 0.25, ry: height * 0.18, color: "rgba(124, 58, 237, 0.04)" },
      ];

      for (const n of nebulae) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, Math.max(n.rx, n.ry));
        g.addColorStop(0, n.color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(n.x, n.y, n.rx, n.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Micro stars with twinkle
      for (const star of starsRef.current) {
        const twinkle = 0.5 + 0.5 * Math.sin(t * star.speed * Math.PI * 2 + star.phase);
        const alpha = star.alpha * twinkle;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [width, height]);

  if (width === 0 || height === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  );
}
