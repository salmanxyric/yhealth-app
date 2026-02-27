'use client';

import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { InsightChip } from './InsightChip';
import type { DisplayInsight } from './types';

interface CompletionViewProps {
  insights: DisplayInsight[];
  onComplete: () => void;
}

export function CompletionView({ insights, onComplete }: CompletionViewProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-6 py-12"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Animated icon */}
      <motion.div
        className="relative w-24 h-24"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-xl opacity-50" />
        <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-purple-500/40">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      {/* Text */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Assessment Complete!</h3>
        <p className="text-slate-400 max-w-md">
          Thank you for sharing. I have everything I need to create your personalized health
          plan.
        </p>
      </div>

      {/* Insights summary */}
      {insights.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {insights.map((insight, i) => (
            <InsightChip key={insight.id} insight={insight} index={i} />
          ))}
        </div>
      )}

      {/* Continue button */}
      <motion.button
        onClick={onComplete}
        className="group flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-semibold text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>Continue to Your Plan</span>
        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </motion.div>
  );
}
