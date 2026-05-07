"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Plus,
  CheckSquare,
  X,
} from "lucide-react";
import { BulkActionsBar } from "./BulkActionsBar";
import { GoalListItem } from "./GoalListItem";
import type { Goal, Plan } from "../goals-types";

interface GoalListViewProps {
  filteredGoals: Goal[];
  filter: "all" | "active" | "completed" | "paused";
  onFilterChange: (filter: "all" | "active" | "completed" | "paused") => void;
  isSelectionMode: boolean;
  onSelectionModeToggle: () => void;
  selectedGoals: Set<string>;
  onToggleSelection: (goalId: string) => void;
  onClearSelection: () => void;
  isBulkProcessing: boolean;
  onBulkDelete: () => void;
  onBulkUpdateStatus: (status: string) => void;
  expandedGoal: string | null;
  onExpandToggle: (goalId: string | null) => void;
  onUpdateProgress: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onStatusChange: (goal: Goal, status: string) => void;
  onCreateGoal: () => void;
  getPlanForGoal: (goalId: string) => Plan | undefined;
}

export function GoalListView({
  filteredGoals,
  filter,
  onFilterChange,
  isSelectionMode,
  onSelectionModeToggle,
  selectedGoals,
  onToggleSelection,
  onClearSelection,
  isBulkProcessing,
  onBulkDelete,
  onBulkUpdateStatus,
  expandedGoal,
  onExpandToggle,
  onUpdateProgress,
  onEdit,
  onDelete,
  onStatusChange,
  onCreateGoal,
  getPlanForGoal,
}: GoalListViewProps) {
  return (
    <div className="pb-8">
      {/* Filter pills + Select */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectionModeToggle}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              isSelectionMode
                ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-lg shadow-emerald-500/25"
                : "bg-white/5 border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {isSelectionMode ? (
              <>
                <X className="w-4 h-4 inline mr-1.5" />
                Cancel
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 inline mr-1.5" />
                Select
              </>
            )}
          </button>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/[0.06]">
            {(["all", "active", "completed", "paused"] as const).map((f) => (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  filter === f
                    ? "text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {filter === f && (
                  <motion.div
                    layoutId="activeGoalFilter"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-sky-600 rounded-md shadow-lg shadow-emerald-500/25"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{f.charAt(0).toUpperCase() + f.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedGoals.size}
        onBulkDelete={onBulkDelete}
        onBulkUpdateStatus={onBulkUpdateStatus}
        onClearSelection={onClearSelection}
        isProcessing={isBulkProcessing}
      />

      {/* Goals List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredGoals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative text-center py-16 rounded-xl bg-[#0f0f18] border border-white/[0.06] overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <Target className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {filter === "all" ? "No Goals Yet" : `No ${filter} goals`}
                </h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto px-4 text-sm">
                  {filter === "all"
                    ? "Start your health journey by creating your first goal."
                    : `You don't have any ${filter} goals at the moment.`}
                </p>
                <button
                  onClick={onCreateGoal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Create Goal
                </button>
              </div>
            </motion.div>
          ) : (
            filteredGoals.map((goal, index) => (
              <GoalListItem
                key={goal.id}
                goal={goal}
                index={index}
                plan={getPlanForGoal(goal.id)}
                isExpanded={expandedGoal === goal.id}
                isSelectionMode={isSelectionMode}
                isSelected={selectedGoals.has(goal.id)}
                onToggleSelection={onToggleSelection}
                onExpandToggle={onExpandToggle}
                onUpdateProgress={onUpdateProgress}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
