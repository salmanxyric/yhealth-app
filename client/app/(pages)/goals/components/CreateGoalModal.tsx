"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Star,
  ArrowLeft,
  X,
  Loader2,
  Quote,
  PlusCircle,
} from "lucide-react";
import type { NewGoalData } from "../goals-types";
import { goalCategoryConfig } from "../goals-constants";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewGoalData) => void;
  isLoading: boolean;
}

export const CreateGoalModal = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
}: CreateGoalModalProps) => {
  const [step, setStep] = useState(1);
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

  const categories = Object.entries(goalCategoryConfig).filter(([key]) => key !== "custom");

  const handleCategorySelect = (category: string) => {
    let pillar = "fitness";
    if (["nutrition", "weight_loss"].includes(category)) pillar = "nutrition";
    if (["sleep_improvement", "stress_wellness", "overall_optimization"].includes(category)) pillar = "wellbeing";

    setFormData({ ...formData, category, pillar });
    setStep(2);
  };

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#0f0f18] border border-white/[0.06] rounded-xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">Create New Goal</h3>
                  <p className="text-sm text-slate-400">Step {step} of 2</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    s <= step ? "bg-gradient-to-r from-emerald-600 to-sky-600" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-slate-300 mb-4">What type of goal would you like to set?</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {categories.map(([key, config]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCategorySelect(key)}
                      className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer text-left ${
                        formData.category === key
                          ? `bg-gradient-to-br ${config.bgColor} border-white/20`
                          : "bg-white/5 border-white/[0.06] hover:border-white/20"
                      }`}
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${config.bgColor.replace("from-", "bg-").split(" ")[0]} flex items-center justify-center ${config.color} mb-2`}>
                        {config.icon}
                      </div>
                      <p className="font-medium text-white text-xs sm:text-sm">{config.label}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to categories
                </button>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Goal Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title ?? ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Lose 10 lbs in 12 weeks"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.06] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.description ?? ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Describe your goal in detail..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.06] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Current</label>
                    <input
                      type="number"
                      value={formData.currentValue ?? 0}
                      onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) || 0 })}
                      className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/[0.06] text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target *</label>
                    <input
                      type="number"
                      value={formData.targetValue ?? 0}
                      onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) || 0 })}
                      className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/[0.06] text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Unit *</label>
                    <input
                      type="text"
                      value={formData.targetUnit ?? ""}
                      onChange={(e) => setFormData({ ...formData, targetUnit: e.target.value })}
                      placeholder="lbs"
                      className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/[0.06] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Weeks</label>
                    <select
                      value={formData.durationWeeks ?? 12}
                      onChange={(e) => setFormData({ ...formData, durationWeeks: Number(e.target.value) || 12 })}
                      className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/[0.06] text-white focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
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
                    value={formData.motivation ?? ""}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    rows={2}
                    placeholder="This helps keep you motivated..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/[0.06] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                  />
                </div>

                <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/[0.06] cursor-pointer hover:bg-white/10 transition-colors">
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
            )}

            <div className="flex gap-3 mt-6 pt-4 border-t border-white/[0.06]">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white border border-white/[0.06] hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              {step === 2 && (
                <button
                  onClick={() => onSave(formData)}
                  disabled={isLoading || !isValid()}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Goal
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
