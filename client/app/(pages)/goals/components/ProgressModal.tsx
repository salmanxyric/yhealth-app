"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  X,
  Loader2,
  Save,
  Award,
} from "lucide-react";
import type { Goal } from "../goals-types";

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number) => void;
  goal: Goal | null;
  isLoading: boolean;
}

export const ProgressModal = ({
  isOpen,
  onClose,
  onSave,
  goal,
  isLoading,
}: ProgressModalProps) => {
  // Initialize state from goal prop - will reset when goal.id changes via key prop
  const [newValue, setNewValue] = useState(() => goal?.currentValue || 0);

  if (!goal) return null;

  const progressDiff = newValue - (goal.currentValue || 0);
  const newProgress = Math.min(100, Math.round((newValue / goal.targetValue) * 100));

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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#0f0f18] border border-white/[0.06] rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Update Progress</h3>
                  <p className="text-sm text-slate-400">{goal.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/[0.06]">
                  <p className="text-xs text-slate-400 mb-1">Current</p>
                  <p className="text-2xl font-bold text-white">
                    {goal.currentValue || 0} <span className="text-sm font-normal text-slate-500">{goal.targetUnit}</span>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-sky-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-300 mb-1">Target</p>
                  <p className="text-2xl font-bold text-white">
                    {goal.targetValue} <span className="text-sm font-normal text-slate-500">{goal.targetUnit}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Value ({goal.targetUnit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.06] text-white text-lg font-medium focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                  {progressDiff !== 0 && (
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 ${progressDiff > 0 ? "text-green-400" : "text-red-400"}`}>
                      {progressDiff > 0 ? <ArrowUpRight className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-medium">{Math.abs(progressDiff)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">New Progress</span>
                  <span className="text-sm font-medium text-white">{newProgress}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    initial={{ width: `${goal.progress}%` }}
                    animate={{ width: `${newProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {goal.milestones && goal.milestones.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">Milestones</span>
                  </div>
                  <div className="space-y-2">
                    {goal.milestones.slice(0, 3).map((m, index) => (
                      <div key={m.id || `milestone-${index}`} className="flex items-center gap-2">
                        {m.completed || newValue >= m.targetValue ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={`text-sm ${m.completed || newValue >= m.targetValue ? "text-green-300" : "text-slate-400"}`}>
                          {m.title} ({m.targetValue} {goal.targetUnit})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white border border-white/[0.06] hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(newValue)}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Progress
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
