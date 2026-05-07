"use client";

import {
  Target,
  TrendingUp,
  CheckCircle2,
  Zap,
  Pause,
} from "lucide-react";

interface GoalsStatsRowProps {
  total: number;
  active: number;
  completed: number;
  paused: number;
  avgProgress: number;
}

export function GoalsStatsRow({ total, active, completed, paused, avgProgress }: GoalsStatsRowProps) {
  const items = [
    { label: "Total", value: total, icon: Target, color: "emerald" },
    { label: "Active", value: active, icon: Zap, color: "green" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "sky" },
    { label: "Paused", value: paused, icon: Pause, color: "amber" },
    { label: "Avg Progress", value: `${avgProgress}%`, icon: TrendingUp, color: "violet" },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 py-4">
      {items.map((stat) => (
        <div
          key={stat.label}
          className="p-3 rounded-xl bg-[#0f0f18] border border-white/[0.06] hover:border-white/[0.1] transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={`w-3.5 h-3.5 text-${stat.color}-400`} />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className="text-lg font-bold text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
