"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  X,
  Loader2,
  Save,
  Quote,
  Pencil,
} from "lucide-react";
import type { Goal, NewGoalData } from "../goals-types";
import { goalCategoryConfig } from "../goals-constants";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewGoalData) => void;
  goal: Goal | null;
  isLoading: boolean;
}

export const EditGoalModal = ({
  isOpen,
  onClose,
  onSave,
  goal,
  isLoading,
}: EditGoalModalProps) => {
  const [formData, setFormData] = useState<NewGoalData>({
    category: "",
    pillar: "fitness",
    title: "",
    description: "",
    targetValue: 0,
    targetUnit: "",
    currentValue: 0,
    durationWeeks: 12,
    motivation: "",
    isPrimary: false,
  });

  // Initialize form with goal data when modal opens
  useEffect(() => {
    if (goal && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        category: goal.category || "",
        pillar: goal.pillar || "fitness",
        title: goal.title || "",
        description: goal.description || "",
        targetValue: goal.targetValue ?? 0,
        targetUnit: goal.targetUnit || "",
        currentValue: goal.currentValue ?? 0,
        durationWeeks: goal.durationWeeks ?? 12,
        motivation: goal.motivation || "",
        isPrimary: goal.isPrimary ?? false,
      });
    }
  }, [goal, isOpen]);


  const isValid = () => {
    return (
      formData.category &&
      formData.title.length >= 5 &&
      formData.description.length >= 10 &&
      formData.targetValue > 0 &&
      formData.targetUnit &&
      formData.motivation.length >= 10
    );
  };

  if (!goal) return null;

  const config = goalCategoryConfig[formData.category] || goalCategoryConfig.custom;

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
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-20 flex items-center justify-between p-4 sm:p-6 border-b border-slate-700 bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border border-sky-500/20 flex items-center justify-center">
                  <Pencil className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-[16px] sm:text-xl font-bold text-white">Edit Goal</h3>
                  <p className="text-sm text-slate-400">Modify your goal details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close edit goal modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Current Category Display */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${config.bgColor.replace("from-", "bg-").split(" ")[0]} flex items-center justify-center ${config.color}`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Category</p>
                    <p className="font-medium text-white">{config.label}</p>
                  </div>
                </div>
              </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Goal Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title ?? ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Lose 10 lbs in 12 weeks"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description ?? ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  placeholder="Describe your goal in detail..."
                  className="min-h-[150px] w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-y"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current</label>
                  <input
                    type="number"
                    value={formData.currentValue ?? 0}
                    onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) || 0 })}
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target *</label>
                  <input
                    type="number"
                    value={formData.targetValue ?? 0}
                    onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) || 0 })}
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Unit *</label>
                  <input
                    type="text"
                    value={formData.targetUnit ?? ""}
                    onChange={(e) => setFormData({ ...formData, targetUnit: e.target.value })}
                    placeholder="lbs"
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Weeks</label>
                  <select
                    value={formData.durationWeeks ?? 12}
                    onChange={(e) => setFormData({ ...formData, durationWeeks: Number(e.target.value) || 12 })}
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
                  >
                    {[4, 8, 12, 16, 24, 52].map((w) => (
                      <option key={w} value={w} className="bg-[#0f0f18]">{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Quote className="w-4 h-4 text-amber-400" />
                    Why does this goal matter? <span className="text-red-400">*</span>
                  </div>
                </label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  rows={4}
                  placeholder="This helps keep you motivated..."
                  className="min-h-[120px] w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-y"
                />
              </div>

              <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/70 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                />
                <div>
                  <p className="font-medium text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    Set as Primary Goal
                  </p>
                  <p className="text-sm text-slate-400">This will be your main focus</p>
                </div>
              </label>
            </div>
            </div>

            <div className="sticky bottom-0 z-20 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-6 border-t border-slate-700 bg-slate-900">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-3 rounded-xl bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(formData)}
                disabled={isLoading || !isValid()}
                className="px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
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
