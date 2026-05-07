"use client";

import { cn } from "@/lib/utils";

interface CompletenessBarProps {
  score: number;
}

export function CompletenessBar({ score }: CompletenessBarProps) {
  const color =
    score < 30
      ? "bg-red-500/60"
      : score < 60
        ? "bg-amber-500/60"
        : "bg-emerald-500/60";

  const textColor =
    score < 30
      ? "text-red-400/40"
      : score < 60
        ? "text-amber-400/40"
        : "text-emerald-400/40";

  return (
    <button
      className="flex items-center gap-2 group cursor-default"
      title={`Completeness: ${score}%`}
    >
      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span
        className={cn("observatory-font-display", textColor)}
        style={{ fontSize: 9, letterSpacing: "0.1em" }}
      >
        {score}%
      </span>
    </button>
  );
}
