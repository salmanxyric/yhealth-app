"use client";

import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Check,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { ClientDietPlan } from "../types";
import { DietPlanSkeleton } from "../Skeletons";

const dietTypes = [
  { id: "balanced", label: "Balanced", description: "Equal macros distribution" },
  { id: "high_protein", label: "High Protein", description: "For muscle building" },
  { id: "low_carb", label: "Low Carb", description: "Reduce carbohydrates" },
  { id: "keto", label: "Keto", description: "Very low carb, high fat" },
  { id: "vegan", label: "Vegan", description: "Plant-based only" },
  { id: "mediterranean", label: "Mediterranean", description: "Heart-healthy diet" },
];

interface PlansTabProps {
  plans: ClientDietPlan[];
  plansLoading: boolean;
  selectedPlanIds: Set<string>;
  onPlanSelect: (planId: string) => void;
  onPlanDelete: (planId: string) => void;
  onPlansDelete: () => void;
  onPlanActivate: (planId: string) => void;
  onPlanEdit: (plan: ClientDietPlan) => void;
  onPlanCreate: () => void;
  onAIGenerate: () => void;
  aiGenerating: boolean;
}

export function PlansTab({
  plans,
  plansLoading,
  selectedPlanIds,
  onPlanSelect,
  onPlanDelete,
  onPlansDelete,
  onPlanActivate,
  onPlanEdit,
  onPlanCreate,
  onAIGenerate,
  aiGenerating,
}: PlansTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-white">Your Diet Plans</h3>
        <div className="flex gap-2">
          {selectedPlanIds.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPlansDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-medium text-sm hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedPlanIds.size})
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlanCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </motion.button>
        </div>
      </div>

      {plansLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <DietPlanSkeleton key={i} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-8 text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h4 className="text-white font-medium mb-2">No diet plans yet</h4>
          <p className="text-slate-400 text-sm mb-4">Generate an AI-powered plan or create a custom one</p>
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAIGenerate}
              disabled={aiGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 text-white font-medium text-sm hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Plan
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPlanCreate}
              className="px-4 py-2 rounded-xl bg-slate-700 text-white font-medium text-sm hover:bg-slate-600 transition-colors"
            >
              Create Manual Plan
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl border p-5 transition-all ${
                plan.isActive
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : selectedPlanIds.has(plan.id)
                  ? "bg-red-500/5 border-red-500/30"
                  : "bg-slate-800/50 border-slate-700/50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onPlanSelect(plan.id)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedPlanIds.has(plan.id)
                        ? "border-red-500 bg-red-500"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                  >
                    {selectedPlanIds.has(plan.id) && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{plan.name}</h4>
                      {plan.isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {dietTypes.find((t) => t.id === plan.type)?.label || plan.type}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!plan.isActive && (
                    <button
                      onClick={() => onPlanActivate(plan.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                      title="Set as active"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onPlanEdit(plan)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onPlanDelete(plan.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-500 mb-1">Calories</p>
                  <p className="text-lg font-bold text-orange-400">{plan.targetCalories}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-500 mb-1">Protein</p>
                  <p className="text-lg font-bold text-red-400">{plan.targetProtein}g</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-500 mb-1">Carbs</p>
                  <p className="text-lg font-bold text-amber-400">{plan.targetCarbs}g</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-500 mb-1">Fat</p>
                  <p className="text-lg font-bold text-purple-400">{plan.targetFat}g</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-500">{plan.mealsPerDay} meals/day</span>
                <span className="text-slate-500">Created {plan.createdAt}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

