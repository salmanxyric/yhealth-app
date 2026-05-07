"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  X,
  Quote,
} from "lucide-react";
import type { Goal } from "../goals-types";
import { goalCategoryConfig } from "../goals-constants";

interface GoalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onEdit: () => void;
  onUpdateProgress: () => void;
}

export const GoalDetailModal = ({
  isOpen,
  onClose,
  goal,
  onEdit,
  onUpdateProgress,
}: GoalDetailModalProps) => {
  if (!goal) return null;

  const config = goalCategoryConfig[goal.category] || goalCategoryConfig.custom;
  const daysRemaining = Math.ceil(
    (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const startDate = new Date(goal.startDate);
  const targetDate = new Date(goal.targetDate);
  const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, totalDays - daysRemaining);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[#0f0f18] border border-white/[0.08] shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0f0f18] border-b border-white/[0.06] p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center ${config.color}`}>
                    {config.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-white">{goal.title}</h2>
                      {goal.isPrimary && <Star className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        goal.status === "active" ? "bg-emerald-500/15 text-emerald-400"
                          : goal.status === "in_progress" ? "bg-violet-500/15 text-violet-400"
                          : goal.status === "completed" ? "bg-sky-500/15 text-sky-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}>
                        {goal.status === "in_progress" ? "In Progress" : goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize">{goal.category.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Progress Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-400">Progress</span>
                  <span className="text-sm font-semibold text-white">{goal.progress}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${goal.status === "completed" ? "from-green-500 to-emerald-500" : "from-emerald-500 to-sky-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                  <span>Current: {goal.currentValue || 0} {goal.targetUnit}</span>
                  <span>Target: {goal.targetValue} {goal.targetUnit}</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <Calendar className="w-4 h-4 text-emerald-400 mb-1.5" />
                  <p className="text-[10px] text-slate-500 mb-0.5">Started</p>
                  <p className="text-xs font-medium text-slate-300">
                    {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <Clock className="w-4 h-4 text-sky-400 mb-1.5" />
                  <p className="text-[10px] text-slate-500 mb-0.5">Duration</p>
                  <p className="text-xs font-medium text-slate-300">{goal.durationWeeks} weeks</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <Target className={`w-4 h-4 mb-1.5 ${daysRemaining <= 7 ? "text-amber-400" : daysRemaining <= 0 ? "text-red-400" : "text-violet-400"}`} />
                  <p className="text-[10px] text-slate-500 mb-0.5">Remaining</p>
                  <p className={`text-xs font-medium ${daysRemaining <= 0 ? "text-red-400" : daysRemaining <= 7 ? "text-amber-400" : "text-slate-300"}`}>
                    {daysRemaining > 0 ? `${daysRemaining} days` : "Overdue"}
                  </p>
                </div>
              </div>

              {/* Time Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">Time Elapsed</span>
                  <span className="text-[10px] text-slate-400">{daysElapsed} / {totalDays} days</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500/50" style={{ width: `${Math.min(100, (daysElapsed / totalDays) * 100)}%` }} />
                </div>
              </div>

              {/* Description */}
              {goal.description && (
                <div>
                  <h3 className="text-xs font-medium text-slate-400 mb-1.5">Description</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{goal.description}</p>
                </div>
              )}

              {/* Motivation */}
              {goal.motivation && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-2">
                    <Quote className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-400">Why It Matters</span>
                  </div>
                  <p className="text-sm text-slate-400 italic leading-relaxed">&quot;{goal.motivation}&quot;</p>
                </div>
              )}

              {/* Milestones */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-slate-400 mb-2">
                    Milestones ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length})
                  </h3>
                  <div className="space-y-1.5">
                    {goal.milestones.map((m, idx) => (
                      <div
                        key={m.id || `ms-${idx}`}
                        className={`flex items-center gap-2 p-2 rounded-lg ${m.completed ? "bg-green-500/5" : "bg-white/[0.02]"}`}
                      >
                        {m.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <span className={`text-xs ${m.completed ? "text-green-400 line-through" : "text-slate-400"}`}>
                          {m.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { onClose(); onUpdateProgress(); }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium transition-colors"
                >
                  Update Progress
                </button>
                <button
                  onClick={() => { onClose(); onEdit(); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-sm font-medium transition-colors"
                >
                  Edit Goal
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
