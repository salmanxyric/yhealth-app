"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Save } from "lucide-react";
import type { ShoppingItem } from "../types";

const SHOPPING_CATEGORIES = [
  { id: "produce", label: "Produce", color: "text-green-400" },
  { id: "protein", label: "Protein", color: "text-red-400" },
  { id: "dairy", label: "Dairy", color: "text-blue-400" },
  { id: "grains", label: "Grains", color: "text-amber-400" },
  { id: "pantry", label: "Pantry", color: "text-orange-400" },
  { id: "beverages", label: "Beverages", color: "text-cyan-400" },
  { id: "frozen", label: "Frozen", color: "text-indigo-400" },
  { id: "other", label: "Other", color: "text-slate-400" },
];

interface ShoppingFormData {
  name: string;
  quantity: string;
  category: string;
  notes: string;
  calories: string;
}

interface ShoppingItemModalProps {
  isOpen: boolean;
  editingItem: ShoppingItem | null;
  formData: ShoppingFormData;
  onClose: () => void;
  onFormChange: (updater: (prev: ShoppingFormData) => ShoppingFormData) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ShoppingItemModal({
  isOpen,
  editingItem,
  formData,
  onClose,
  onFormChange,
  onSave,
  onCancel,
}: ShoppingItemModalProps) {
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
            className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6"
          >
            <h2 className="text-base font-bold text-white mb-6">
              {editingItem ? "Edit Item" : "Add Shopping Item"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Chicken breast"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity (optional)</label>
                <input
                  type="text"
                  value={formData.quantity}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, quantity: e.target.value }))}
                  placeholder="e.g., 500g, 2 packs"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {SHOPPING_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Calories (optional)</label>
                <input
                  type="number"
                  value={formData.calories}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, calories: e.target.value }))}
                  placeholder="e.g., 150"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">Calories per item/portion</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes (optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={!formData.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {editingItem ? "Update" : "Add"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
