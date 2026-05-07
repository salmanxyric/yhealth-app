"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2 } from "lucide-react";
import type { ClientDietPlan } from "../types";

const dietTypes = [
  { id: "balanced", label: "Balanced", description: "Equal macros distribution" },
  { id: "high_protein", label: "High Protein", description: "For muscle building" },
  { id: "low_carb", label: "Low Carb", description: "Reduce carbohydrates" },
  { id: "keto", label: "Keto", description: "Very low carb, high fat" },
  { id: "vegan", label: "Vegan", description: "Plant-based only" },
  { id: "mediterranean", label: "Mediterranean", description: "Heart-healthy diet" },
];

interface PlanFormData {
  name: string;
  type: string;
  description: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  mealsPerDay: number;
}

interface CreatePlanModalProps {
  isOpen: boolean;
  editingPlan: ClientDietPlan | null;
  planFormData: PlanFormData;
  plansSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: PlanFormData) => PlanFormData) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function CreatePlanModal({
  isOpen,
  editingPlan,
  planFormData,
  plansSaving,
  onClose,
  onFormChange,
  onSave,
  onCancel,
}: CreatePlanModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
          >
            <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] sm:text-base font-bold text-white">{editingPlan ? "Edit Diet Plan" : "Create Diet Plan"}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Plan Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Plan Name</label>
                <input
                  type="text"
                  value={planFormData.name}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High Protein Muscle Building"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
                <textarea
                  value={planFormData.description}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your diet plan..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Diet Type */}
              <div>
                <label className="block text-[13px] sm:text-sm font-medium text-slate-300 mb-2">Diet Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {dietTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => onFormChange((prev) => ({ ...prev, type: type.id }))}
                      className={`p-2.5 sm:p-3 rounded-xl border text-left transition-colors ${
                        planFormData.type === type.id
                          ? "border-emerald-500 bg-emerald-500/20"
                          : "border-slate-700 bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <p className={`text-[13px] sm:text-sm font-medium ${planFormData.type === type.id ? "text-emerald-400" : "text-white"}`}>
                        {type.label}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Macros */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">Daily Targets</label>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Calories</span>
                    <span className="text-xs text-orange-400 font-medium">{planFormData.targetCalories} kcal</span>
                  </div>
                  <input
                    type="range"
                    min="1200"
                    max="4000"
                    step="50"
                    value={planFormData.targetCalories}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, targetCalories: parseInt(e.target.value) }))}
                    className="w-full accent-orange-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Protein</span>
                    <span className="text-xs text-red-400 font-medium">{planFormData.targetProtein}g</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="5"
                    value={planFormData.targetProtein}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, targetProtein: parseInt(e.target.value) }))}
                    className="w-full accent-red-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Carbs</span>
                    <span className="text-xs text-amber-400 font-medium">{planFormData.targetCarbs}g</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    step="5"
                    value={planFormData.targetCarbs}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, targetCarbs: parseInt(e.target.value) }))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Fat</span>
                    <span className="text-xs text-purple-400 font-medium">{planFormData.targetFat}g</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    step="5"
                    value={planFormData.targetFat}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, targetFat: parseInt(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Meals per Day</span>
                    <span className="text-xs text-emerald-400 font-medium">{planFormData.mealsPerDay}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    step="1"
                    value={planFormData.mealsPerDay}
                    onChange={(e) => onFormChange((prev) => ({ ...prev, mealsPerDay: parseInt(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-6">
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={!planFormData.name.trim() || plansSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {plansSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
