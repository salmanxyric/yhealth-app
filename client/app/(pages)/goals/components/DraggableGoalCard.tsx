"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import {
  Star,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  TrendingUp,
  Play,
  Pause,
  RefreshCw,
  ChevronDown,
  Quote,
  Trash2,
  Pencil,
  GripVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Goal } from "../goals-types";
import { goalCategoryConfig } from "../goals-constants";
import { getColumnForStatus } from "../goals-utils";

interface DraggableGoalCardProps {
  goal: Goal;
  onUpdateProgress: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onStatusChange: (goal: Goal, status: string) => void;
  onExpand: (goalId: string | null) => void;
  onViewDetails: (goal: Goal) => void;
  isExpanded: boolean;
}

export function DraggableGoalCard({
  goal,
  onUpdateProgress,
  onEdit,
  onDelete,
  onStatusChange,
  onExpand,
  onViewDetails,
  isExpanded,
}: DraggableGoalCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: goal.id,
    data: { column: getColumnForStatus(goal.status) },
  });

  const config = goalCategoryConfig[goal.category] || goalCategoryConfig.custom;
  const daysRemaining = Math.ceil(
    (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative rounded-xl bg-[#0f0f18] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? "opacity-30 scale-[0.98]" : "opacity-100"
      }`}
    >
      <div className="p-3">
        {/* Top row: grip + category icon + title + dropdown */}
        <div className="flex items-start gap-2">
          {/* Drag Handle indicator */}
          <div className="mt-0.5 p-0.5 rounded opacity-40 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-slate-500" />
          </div>

          {/* Category Icon */}
          <div className={`w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 ${config.color}`}>
            {config.icon}
          </div>

          {/* Title + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4
              className="text-sm font-medium text-white truncate max-w-[160px] cursor-pointer hover:text-emerald-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); onViewDetails(goal); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
                {goal.title}
              </h4>
              {goal.isPrimary && (
                <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
            </div>
            <span
              className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                goal.status === "active"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : goal.status === "in_progress"
                  ? "bg-violet-500/15 text-violet-400"
                  : goal.status === "completed"
                  ? "bg-sky-500/15 text-sky-400"
                  : goal.status === "paused"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-slate-500/15 text-slate-400"
              }`}
            >
              {goal.status === "in_progress" ? "in progress" : goal.status}
            </span>
          </div>

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-[#0f0f18] backdrop-blur-xl border-white/[0.06] rounded-xl shadow-xl"
            >
              {(goal.status === "active" || goal.status === "in_progress") && (
                <>
                  <DropdownMenuItem
                    onClick={() => onUpdateProgress(goal)}
                    className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10 cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Update Progress
                  </DropdownMenuItem>
                  {goal.status === "active" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(goal, "in_progress")}
                      className="text-violet-400 focus:text-violet-300 focus:bg-violet-500/10 cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Start Progress
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onStatusChange(goal, "paused")}
                    className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/10 cursor-pointer"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusChange(goal, "completed")}
                    className="text-green-400 focus:text-green-300 focus:bg-green-500/10 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete
                  </DropdownMenuItem>
                </>
              )}
              {goal.status === "paused" && (
                <>
                  <DropdownMenuItem
                    onClick={() => onStatusChange(goal, "active")}
                    className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10 cursor-pointer"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusChange(goal, "in_progress")}
                    className="text-violet-400 focus:text-violet-300 focus:bg-violet-500/10 cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Start Progress
                  </DropdownMenuItem>
                </>
              )}
              {goal.status === "completed" && (
                <DropdownMenuItem
                  onClick={() => onStatusChange(goal, "active")}
                  className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem
                onClick={() => onEdit(goal)}
                className="text-sky-400 focus:text-sky-300 focus:bg-sky-500/10 cursor-pointer"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExpand(isExpanded ? null : goal.id)}
                className="text-slate-300 focus:text-white focus:bg-white/5 cursor-pointer"
              >
                <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                {isExpanded ? "Less" : "More"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(goal)}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-500">Progress</span>
            <span className="text-[10px] font-medium text-slate-300">{goal.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${
                goal.status === "completed"
                  ? "from-green-500 to-emerald-500"
                  : "from-emerald-500 to-sky-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-2.5 flex items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {goal.currentValue || 0}/{goal.targetValue} {goal.targetUnit}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {goal.durationWeeks}w
          </span>
          <span
            className={`flex items-center gap-1 ${
              daysRemaining < 7 && daysRemaining > 0
                ? "text-amber-400"
                : daysRemaining <= 0
                ? "text-red-400"
                : ""
            }`}
          >
            <Clock className="w-3 h-3" />
            {daysRemaining > 0 ? `${daysRemaining}d` : "Due"}
          </span>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                {goal.description && (
                  <p className="text-xs text-slate-400 line-clamp-3">{goal.description}</p>
                )}
                {goal.motivation && (
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Quote className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-medium text-slate-400">Why It Matters</span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">&quot;{goal.motivation}&quot;</p>
                  </div>
                )}
                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="space-y-1">
                    {goal.milestones.slice(0, 3).map((m, idx) => (
                      <div key={m.id || `ms-${idx}`} className="flex items-center gap-1.5">
                        {m.completed ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                        ) : (
                          <Circle className="w-3 h-3 text-slate-600 shrink-0" />
                        )}
                        <span className={`text-[11px] ${m.completed ? "text-green-400 line-through" : "text-slate-500"}`}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
