"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Goal } from "../goals-types";
import { getColumnDotColor, getColumnBorderGlow, getColumnCountBadge } from "../goals-utils";

interface KanbanColumnProps {
  columnId: string;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  goals: Goal[];
  children: React.ReactNode;
}

export function KanbanColumn({
  columnId,
  label,
  color,
  icon: Icon,
  goals,
  children,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: columnId });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-1 min-w-[280px] min-h-[calc(100vh-360px)] snap-center rounded-xl border transition-all duration-200 ${
        isOver
          ? `${getColumnBorderGlow(color)} shadow-lg bg-white/[0.03]`
          : "border-white/[0.06] bg-[#0f0f18]/50"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${getColumnDotColor(color)}`} />
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getColumnCountBadge(color)}`}>
            {goals.length}
          </span>
        </div>
        <Icon className="w-4 h-4 text-slate-500" />
      </div>

      {/* Scrollable Card Container -- fills remaining height */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-xs text-slate-500">No {label.toLowerCase()} goals</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
