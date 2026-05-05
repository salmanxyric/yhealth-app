"use client";

import { useRef, useEffect, useCallback } from "react";
import type { AvatarState } from "@/lib/avatar/vrmMappings";

interface AvatarFallbackProps {
  currentState: AvatarState;
}

interface StateConfig {
  pulse: number;   // fast vibration amplitude (0-1)
  speed: number;   // blob rotation + shimmer rate
  haze: number;    // side ambient glow alpha multiplier
  breath: number;  // slow macro scale multiplier
}

const STATE_CONFIG: Record<AvatarState, StateConfig> = {
  idle:      { pulse: 0.02, speed: 0.18, haze: 0.18, breath: 1.00 },
  listening: { pulse: 0.06, speed: 0.55, haze: 0.32, breath: 1.03 },
  thinking:  { pulse: 0.03, speed: 0.30, haze: 0.22, breath: 1.01 },
  speaking:  { pulse: 0.10, speed: 0.75, haze: 0.42, breath: 1.06 },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function AvatarFallback({ currentState }: AvatarFallbackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const targetRef = useRef<StateConfig>(STATE_CONFIG[currentState]);
  const liveRef = useRef<StateConfig>({ ...STATE_CONFIG[currentState] });
  const prevTimeRef = useRef(0);

  useEffect(() => {
    targetRef.current = STATE_CONFIG[currentState];
  }, [currentState]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      // Smooth cfg transitions (avoids jumpy state swaps)
      const dt = Math.min(0.1, time - prevTimeRef.current);
      prevTimeRef.current = time;
      const k = 1 - Math.exp(-dt * 3); // ~critically-damped lerp
      const live = liveRef.current;
      const target = targetRef.current;
      live.pulse = lerp(live.pulse, target.pulse, k);
      live.speed = lerp(live.speed, target.speed, k);
      live.haze = lerp(live.haze, target.haze, k);
      live.breath = lerp(live.breath, target.breath, k);

      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h) * 0.28;

      // Vibration: fast sine + slow breath
      const vib = 1 + live.pulse * Math.sin(time * 4);
      const breath = 1 + (live.breath - 1) * (0.5 + 0.5 * Math.sin(time * 0.9));
      const radius = base * vib * breath;

      ctx.clearRect(0, 0, w, h);

      // 1) Full-canvas soft backdrop glow
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      bg.addColorStop(0, `hsla(160, 90%, 40%, ${0.12 + live.haze * 0.08})`);
      bg.addColorStop(0.5, `hsla(190, 90%, 40%, ${0.05 + live.haze * 0.04})`);
      bg.addColorStop(1, "transparent");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // 2) Ambient side haze (left emerald, right cyan)
      const hazeAlpha = 0.35 + live.haze * 0.6;
      const hazeShimmer = 0.85 + 0.15 * Math.sin(time * 1.4 * live.speed);
      const sideR = radius * 2.8;

      const leftGrad = ctx.createRadialGradient(
        cx - radius * 1.1,
        cy + radius * 0.15,
        0,
        cx - radius * 1.1,
        cy + radius * 0.15,
        sideR
      );
      leftGrad.addColorStop(0, `hsla(150, 95%, 42%, ${hazeAlpha * hazeShimmer})`);
      leftGrad.addColorStop(0.4, `hsla(145, 90%, 35%, ${hazeAlpha * 0.35 * hazeShimmer})`);
      leftGrad.addColorStop(1, "transparent");
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, 0, w, h);

      const rightGrad = ctx.createRadialGradient(
        cx + radius * 1.1,
        cy - radius * 0.1,
        0,
        cx + radius * 1.1,
        cy - radius * 0.1,
        sideR
      );
      rightGrad.addColorStop(0, `hsla(190, 95%, 55%, ${hazeAlpha * hazeShimmer})`);
      rightGrad.addColorStop(0.4, `hsla(195, 90%, 45%, ${hazeAlpha * 0.35 * hazeShimmer})`);
      rightGrad.addColorStop(1, "transparent");
      ctx.fillStyle = rightGrad;
      ctx.fillRect(0, 0, w, h);

      // 3) Thin outer ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(155, 70%, 80%, ${0.3 + live.haze * 0.25})`;
      ctx.lineWidth = 1.25;
      ctx.shadowColor = `hsla(165, 95%, 70%, ${0.4 + live.haze * 0.3})`;
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.restore();

      // 4) Orb frosted sphere base
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      const sphere = ctx.createRadialGradient(
        cx - radius * 0.2,
        cy - radius * 0.25,
        radius * 0.05,
        cx,
        cy,
        radius
      );
      sphere.addColorStop(0, `hsla(165, 75%, 88%, 0.42)`);
      sphere.addColorStop(0.4, `hsla(180, 90%, 62%, 0.25)`);
      sphere.addColorStop(1, `hsla(200, 80%, 25%, 0.05)`);
      ctx.fillStyle = sphere;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      // 5) Green crescent blob (bottom-left, slow rotate)
      const rotG = time * 0.25 * live.speed;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotG);
      const greenGrad = ctx.createRadialGradient(
        -radius * 0.25,
        radius * 0.15,
        0,
        -radius * 0.25,
        radius * 0.15,
        radius * 0.95
      );
      greenGrad.addColorStop(0, `hsla(145, 95%, 55%, 0.85)`);
      greenGrad.addColorStop(0.35, `hsla(150, 90%, 45%, 0.55)`);
      greenGrad.addColorStop(1, "transparent");
      ctx.fillStyle = greenGrad;
      ctx.beginPath();
      ctx.ellipse(
        -radius * 0.25,
        radius * 0.15,
        radius * 0.85,
        radius * 0.55,
        -0.6,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // 6) Cyan drop blob (top-right, counter rotate)
      const rotC = -time * 0.32 * live.speed;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotC);
      const cyanGrad = ctx.createRadialGradient(
        radius * 0.3,
        -radius * 0.2,
        0,
        radius * 0.3,
        -radius * 0.2,
        radius * 0.9
      );
      cyanGrad.addColorStop(0, `hsla(190, 100%, 70%, 0.85)`);
      cyanGrad.addColorStop(0.4, `hsla(195, 95%, 55%, 0.5)`);
      cyanGrad.addColorStop(1, "transparent");
      ctx.fillStyle = cyanGrad;
      ctx.beginPath();
      ctx.ellipse(
        radius * 0.3,
        -radius * 0.2,
        radius * 0.65,
        radius * 0.5,
        0.4,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // 7) Specular highlight (bright pinpoint)
      const specPulse = 0.8 + 0.2 * Math.sin(time * 3 * live.speed);
      const spec = ctx.createRadialGradient(
        cx + radius * 0.25,
        cy - radius * 0.35,
        0,
        cx + radius * 0.25,
        cy - radius * 0.35,
        radius * 0.3
      );
      spec.addColorStop(0, `hsla(170, 100%, 96%, ${0.75 * specPulse})`);
      spec.addColorStop(0.5, `hsla(175, 100%, 90%, ${0.25 * specPulse})`);
      spec.addColorStop(1, "transparent");
      ctx.fillStyle = spec;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

      ctx.restore(); // end clip

      // 8) Tight rim highlight on top of clip (for glossy edge)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      const rim = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius);
      rim.addColorStop(0, "transparent");
      rim.addColorStop(1, `hsla(170, 100%, 90%, ${0.2 + live.haze * 0.2})`);
      ctx.fillStyle = rim;
      ctx.fill();
      ctx.restore();
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let currentDpr = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = parent.getBoundingClientRect();
      if (
        dpr === currentDpr &&
        canvas.width === Math.round(rect.width * dpr)
      )
        return;
      currentDpr = dpr;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);

    const startTime = performance.now();
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const time = (performance.now() - startTime) / 1000;
      const rect = parent.getBoundingClientRect();
      draw(ctx, rect.width, rect.height, time);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, [draw]);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
