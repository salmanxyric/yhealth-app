"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface MacroHeroCardProps {
  index: number;
  label: string;
  current: number;
  target: number;
  unit: string;
  accent: string;
}

export function MacroHeroCard({
  index,
  label,
  current,
  target,
  unit,
  accent,
}: MacroHeroCardProps) {
  const pct = target > 0 ? Math.max(0, Math.min(100, (current / target) * 100)) : 0;

  // Arc ring (corner)
  const arcSize = 44;
  const arcStroke = 5;
  const arcRadius = (arcSize - arcStroke) / 2;
  const arcCircumference = arcRadius * 2 * Math.PI;
  const arcOffset = arcCircumference - (pct / 100) * arcCircumference;

  // Sparkline: synthetic smooth curve until history endpoint wired.
  // Uses a seeded pseudo-random pattern so each macro has a stable shape.
  const points = useMemo(() => {
    const seed = label.charCodeAt(0) * 7 + index * 13;
    const n = 32;
    const arr: number[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      // layered sines for organic look
      const wave =
        0.5 +
        0.18 * Math.sin(t * Math.PI * 2 + seed * 0.1) +
        0.12 * Math.sin(t * Math.PI * 4 + seed * 0.05) +
        0.08 * Math.sin(t * Math.PI * 8 + seed * 0.2);
      arr.push(wave);
    }
    // Scale amplitude by how active today is (hint of real data presence)
    const activity = Math.min(1, pct / 100 + 0.25);
    return arr.map((v) => Math.max(0, Math.min(1, v * activity)));
  }, [label, index, pct]);

  const sparkW = 240;
  const sparkH = 56;
  const polyline = useMemo(() => {
    if (!points.length) return { line: "", area: "" };
    const step = sparkW / (points.length - 1);
    const coords = points.map((v, i) => [i * step, sparkH - v * (sparkH - 4) - 2]);
    const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${coords[0][0]},${sparkH} ${line} ${coords[coords.length - 1][0]},${sparkH}`;
    return { line, area };
  }, [points]);

  const gradientId = `macroSparkGrad-${label}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[linear-gradient(145deg,#0f1219_0%,#0a0d14_100%)] p-4 sm:p-5"
    >
      {/* Top row: label (left), arc (right) */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] sm:text-sm text-slate-300 font-medium">{label}</p>
          <p className="text-[13px] sm:text-sm text-slate-400 mt-0.5">
            <span className="text-white font-semibold">{Math.round(current)}</span>
            <span className="text-slate-500">/{Math.round(target)}</span>
          </p>
        </div>
        <div className="relative shrink-0" style={{ width: arcSize, height: arcSize }}>
          <svg width={arcSize} height={arcSize} className="-rotate-90">
            <circle
              cx={arcSize / 2}
              cy={arcSize / 2}
              r={arcRadius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={arcStroke}
              fill="none"
            />
            <motion.circle
              cx={arcSize / 2}
              cy={arcSize / 2}
              r={arcRadius}
              stroke={accent}
              strokeWidth={arcStroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={arcCircumference}
              initial={{ strokeDashoffset: arcCircumference }}
              animate={{ strokeDashoffset: arcOffset }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 + index * 0.06 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-[10px] font-semibold text-white">{Math.round(current)}</span>
            <span className="text-[7px] text-slate-400 mt-0.5">{unit}</span>
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-3 -mx-1">
        <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="w-full h-10 sm:h-12" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={polyline.area} fill={`url(#${gradientId})`} />
          <polyline
            points={polyline.line}
            fill="none"
            stroke={accent}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
  );
}
