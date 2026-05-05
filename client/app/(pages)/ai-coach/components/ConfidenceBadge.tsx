"use client";

interface ConfidenceBadgeProps {
  confidence: number;
  size?: "sm" | "md";
}

export function ConfidenceBadge({ confidence, size = "sm" }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence < 0.3
      ? "from-red-500 to-red-400"
      : confidence < 0.7
        ? "from-amber-500 to-amber-400"
        : "from-emerald-500 to-emerald-400";

  const textColor =
    confidence < 0.3
      ? "text-red-400"
      : confidence < 0.7
        ? "text-amber-400"
        : "text-emerald-400";

  const height = size === "sm" ? "h-1" : "h-1.5";

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} rounded-full bg-white/[0.06] overflow-hidden min-w-[40px]`}>
        <div
          className={`${height} rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium ${textColor} tabular-nums`}>
        {pct}%
      </span>
    </div>
  );
}
