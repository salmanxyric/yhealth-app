"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  TrendingUp,
  Star,
  Play,
  Pause,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Quote,
  Trash2,
  CheckSquare,
  Square,
  Pencil,
  Award,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Goal, Plan } from "../goals-types";
import { goalCategoryConfig } from "../goals-constants";

interface GoalListItemProps {
  goal: Goal;
  index: number;
  plan: Plan | undefined;
  isExpanded: boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (goalId: string) => void;
  onExpandToggle: (goalId: string | null) => void;
  onUpdateProgress: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onStatusChange: (goal: Goal, status: string) => void;
}

export function GoalListItem({
  goal,
  index,
  plan,
  isExpanded,
  isSelectionMode,
  isSelected,
  onToggleSelection,
  onExpandToggle,
  onUpdateProgress,
  onEdit,
  onDelete,
  onStatusChange,
}: GoalListItemProps) {
  const config = goalCategoryConfig[goal.category] || goalCategoryConfig.custom;
  const daysRemaining = Math.ceil(
    (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <motion.div
      key={goal.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
      className="group"
    >
      <div
        className={`relative p-4 sm:p-5 rounded-xl bg-[#0f0f18] border ${
          isSelected
            ? "border-emerald-500/50 shadow-lg shadow-emerald-500/20"
            : "border-white/[0.06]"
        } hover:border-white/[0.12] transition-all overflow-hidden`}
      >
        {/* Status indicator bar at top */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
          goal.status === "active" ? "from-emerald-500 to-sky-500" :
          goal.status === "in_progress" ? "from-violet-500 to-purple-500" :
          goal.status === "completed" ? "from-green-500 to-emerald-500" :
          goal.status === "paused" ? "from-amber-500 to-yellow-500" :
          "from-slate-500 to-slate-600"
        }`} />

        <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {isSelectionMode && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                onClick={() => onToggleSelection(goal.id)}
                className="mt-1 cursor-pointer"
              >
                {isSelected ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <Square className="w-5 h-5 text-slate-500 hover:text-slate-400" />
                )}
              </motion.button>
            )}
            <div
              className={`w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center ${config.color} shrink-0`}
            >
              {config.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                  {goal.title}
                </h3>
                {goal.isPrimary && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Primary
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    goal.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : goal.status === "in_progress"
                      ? "bg-violet-500/20 text-violet-400"
                      : goal.status === "completed"
                      ? "bg-sky-500/20 text-sky-400"
                      : goal.status === "paused"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {goal.status === "in_progress" ? "in progress" : goal.status}
                </span>
              </div>
              <p className="text-sm text-slate-400 line-clamp-1 mb-2">
                {goal.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-slate-500" />
                  <span>{goal.currentValue || 0}/{goal.targetValue} {goal.targetUnit}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{goal.durationWeeks}w</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    daysRemaining < 7 && daysRemaining > 0
                      ? "text-amber-400"
                      : daysRemaining <= 0
                      ? "text-red-400"
                      : ""
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {daysRemaining > 0 ? `${daysRemaining}d left` : "Overdue"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 lg:w-48">
            <div className="flex-1 lg:w-full">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Progress</span>
                <span className="text-xs font-semibold text-white">{goal.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${
                    goal.status === "completed"
                      ? "from-green-500 to-emerald-500"
                      : goal.status === "in_progress"
                      ? "from-violet-500 to-purple-500"
                      : "from-emerald-500 to-sky-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(goal.status === "active" || goal.status === "in_progress") && (
                <button
                  onClick={() => onUpdateProgress(goal)}
                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs font-medium cursor-pointer flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Update</span>
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-lg bg-white/5 border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 bg-[#0f0f18] backdrop-blur-xl border-white/[0.06] rounded-xl shadow-xl"
                >
                  {(goal.status === "active" || goal.status === "in_progress") && (
                    <>
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
                    onClick={() => onExpandToggle(isExpanded ? null : goal.id)}
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

              {plan && (
                <Link
                  href="/dashboard?tab=plans"
                  className="p-2 rounded-lg bg-white/5 border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/[0.06] grid sm:grid-cols-2 gap-4">
                {goal.motivation && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-2">
                      <Quote className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-slate-300">Why It Matters</span>
                    </div>
                    <p className="text-sm text-slate-400 italic">&quot;{goal.motivation}&quot;</p>
                  </div>
                )}

                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">Milestones</span>
                    </div>
                    <div className="space-y-2">
                      {goal.milestones.map((m, mIdx) => (
                        <div key={m.id || `milestone-${mIdx}`} className="flex items-center gap-2">
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500" />
                          )}
                          <span className={`text-sm ${m.completed ? "text-green-300 line-through" : "text-slate-400"}`}>
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
