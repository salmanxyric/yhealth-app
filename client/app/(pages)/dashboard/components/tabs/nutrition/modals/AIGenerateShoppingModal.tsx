"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Sparkles, Loader2 } from "lucide-react";

interface AIGenerateShoppingModalProps {
  isOpen: boolean;
  prompt: string;
  generating: boolean;
  aiResponse: string;
  onClose: () => void;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
}

export function AIGenerateShoppingModal({
  isOpen,
  prompt,
  generating,
  aiResponse,
  onClose,
  onPromptChange,
  onGenerate,
}: AIGenerateShoppingModalProps) {
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
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-violet-500/20">
                <Wand2 className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-base font-bold text-white">Generate with AI</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  What do you need to buy?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder="e.g., Ingredients for a healthy chicken salad for 4 people"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {aiResponse && (
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                  <p className="text-sm text-violet-300">{aiResponse}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onGenerate}
                disabled={!prompt.trim() || generating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
