"use client";

import type { Goal } from "../goals-types";
import { goalCategoryConfig } from "../goals-constants";

interface GoalCardOverlayProps {
  goal: Goal;
}

export function GoalCardOverlay({ goal }: GoalCardOverlayProps) {
  const config = goalCategoryConfig[goal.category] || goalCategoryConfig.custom;

  return (
    <div className="w-[280px] rounded-xl bg-[#0f0f18]/90 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 opacity-90 rotate-2 backdrop-blur-sm">
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className={`w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 ${config.color}`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">{goal.title}</h4>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400">
              {goal.status}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
