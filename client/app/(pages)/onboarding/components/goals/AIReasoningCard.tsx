'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface AIReasoningCardProps {
  reasoning: string;
}

export function AIReasoningCard({ reasoning }: AIReasoningCardProps) {
  return (
    <motion.div
      className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-purple-300 mb-1">Why these goals?</h3>
          <p className="text-sm text-slate-400">{reasoning}</p>
        </div>
      </div>
    </motion.div>
  );
}
