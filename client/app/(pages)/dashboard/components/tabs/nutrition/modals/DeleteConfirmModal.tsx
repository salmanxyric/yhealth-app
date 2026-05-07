"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface DeleteConfirmModalProps {
  showDeleteConfirm: string | null;
  onClose: () => void;
  onDeleteMeal: (mealId: string) => void;
  onDeletePlan: (planId: string) => void;
  onDeleteRecipe: (recipeId: string) => void;
}

export function DeleteConfirmModal({
  showDeleteConfirm,
  onClose,
  onDeleteMeal,
  onDeletePlan,
  onDeleteRecipe,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {showDeleteConfirm && (
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
            className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-5 sm:p-6"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            </div>
            <h3 className="text-[15px] sm:text-base font-bold text-white text-center mb-2">Delete Item?</h3>
            <p className="text-slate-400 text-center text-[13px] sm:text-sm mb-4 sm:mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm.startsWith("meal-")) {
                    onDeleteMeal(showDeleteConfirm.replace("meal-", ""));
                  } else if (showDeleteConfirm.startsWith("plan-")) {
                    onDeletePlan(showDeleteConfirm.replace("plan-", ""));
                  } else if (showDeleteConfirm.startsWith("recipe-")) {
                    onDeleteRecipe(showDeleteConfirm.replace("recipe-", ""));
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
