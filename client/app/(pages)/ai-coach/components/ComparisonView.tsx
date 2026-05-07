"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ComparisonItem {
  label: string;
  current: number;
  target?: number;
  trend?: "up" | "down" | "stable";
  unit?: string;
}

interface ComparisonViewProps {
  title: string;
  headline?: string;
  items: ComparisonItem[];
}

export function ComparisonView({ title, headline, items }: ComparisonViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4"
    >
      <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
      {headline && (
        <p className="text-xs text-slate-400 mb-4">{headline}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => {
          const deltaPct = item.target && item.target !== 0 ? ((item.current - item.target) / item.target) * 100 : undefined;

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3"
            >
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                {item.label}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold text-white tabular-nums">
                  {typeof item.current === 'number' ? item.current.toLocaleString(undefined, { maximumFractionDigits: 1 }) : item.current}
                </span>
                {item.unit && (
                  <span className="text-[10px] text-slate-500">{item.unit}</span>
                )}
              </div>

              {/* Delta row */}
              {item.target !== undefined && deltaPct !== undefined && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-slate-500">
                    vs {item.target.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                  <DeltaBadge value={deltaPct} trend={item.trend} />
                </div>
              )}

              {/* Trend icon only (no target) */}
              {item.target === undefined && item.trend && (
                <div className="mt-1">
                  <TrendIcon trend={item.trend} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function DeltaBadge({ value, trend }: { value: number; trend?: "up" | "down" | "stable" }) {
  const isPositive = value >= 0;
  const color = trend === "up"
    ? "text-emerald-400 bg-emerald-500/10"
    : trend === "down"
      ? "text-red-400 bg-red-500/10"
      : isPositive
        ? "text-emerald-400 bg-emerald-500/10"
        : "text-red-400 bg-red-500/10";

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${color}`}>
      {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {isPositive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-slate-500" />;
}
