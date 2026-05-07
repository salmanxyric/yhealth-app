"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  X,
  Plus,
  Wand2,
  Edit3,
  Trash2,
  Circle,
  CheckCircle2,
  Flame,
} from "lucide-react";
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

interface ViewAllShoppingModalProps {
  isOpen: boolean;
  shoppingItems: ShoppingItem[];
  pendingItems: ShoppingItem[];
  purchasedItems: ShoppingItem[];
  totalCalories: number;
  onClose: () => void;
  onToggleItem: (itemId: string) => void;
  onEditItem: (item: ShoppingItem) => void;
  onDeleteItem: (itemId: string) => void;
  onClearPurchased: () => void;
  onAIGenerate: () => void;
  onAddItem: () => void;
}

export function ViewAllShoppingModal({
  isOpen,
  shoppingItems,
  pendingItems,
  purchasedItems,
  totalCalories,
  onClose,
  onToggleItem,
  onEditItem,
  onDeleteItem,
  onClearPurchased,
  onAIGenerate,
  onAddItem,
}: ViewAllShoppingModalProps) {
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
            className="w-full max-w-lg max-h-[80vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Shopping List</h2>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-slate-400">{shoppingItems.length} items total</p>
                    {totalCalories > 0 && (
                      <p className="text-sm text-orange-400 flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {totalCalories} kcal
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Pending Items */}
              {pendingItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-400">To Buy ({pendingItems.length})</h3>
                    {totalCalories > 0 && (
                      <div className="flex items-center gap-1 text-xs text-orange-400">
                        <Flame className="w-3 h-3" />
                        <span className="font-medium">Total: {totalCalories} kcal</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {pendingItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 group hover:border-emerald-500/30 transition-colors"
                      >
                        <button
                          onClick={() => onToggleItem(item.id)}
                          className="text-slate-500 hover:text-emerald-400 transition-colors"
                        >
                          <Circle className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="text-white block truncate">{item.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.quantity && <span className="text-xs text-slate-500">{item.quantity}</span>}
                            {item.category && (
                              <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                                SHOPPING_CATEGORIES.find(c => c.id === item.category)?.color || 'text-slate-400'
                              } bg-white/5`}>
                                {SHOPPING_CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                              </span>
                            )}
                            {item.calories && item.calories > 0 && (
                              <span className="text-xs text-orange-400 flex items-center gap-0.5">
                                <Flame className="w-3 h-3" />
                                {item.calories} kcal
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchased Items */}
              {purchasedItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-400">Purchased ({purchasedItems.length})</h3>
                    <button
                      onClick={onClearPurchased}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {purchasedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 opacity-60"
                      >
                        <button
                          onClick={() => onToggleItem(item.id)}
                          className="text-emerald-400"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="text-slate-400 line-through block truncate">{item.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.quantity && <span className="text-xs text-slate-600">{item.quantity}</span>}
                            {item.calories && item.calories > 0 && (
                              <span className="text-xs text-orange-400/70 flex items-center gap-0.5">
                                <Flame className="w-3 h-3" />
                                {item.calories} kcal
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {shoppingItems.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">Your shopping list is empty</p>
                  <button
                    onClick={onAddItem}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
                  >
                    Add First Item
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button
                onClick={onAIGenerate}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-500/20 text-violet-400 font-medium hover:bg-violet-500/30 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Generate with AI
              </button>
              <button
                onClick={onAddItem}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
