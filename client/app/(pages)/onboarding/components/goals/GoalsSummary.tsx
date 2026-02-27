'use client';

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

interface GoalsSummaryProps {
  confirmedCount: number;
}

export function GoalsSummary({ confirmedCount }: GoalsSummaryProps) {
  return (
    <motion.div
      className="p-4 rounded-xl bg-linear-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center gap-3">
        <Target className="w-5 h-5 text-blue-400" />
        <div>
          <span className="text-white font-medium">
            {confirmedCount} goal{confirmedCount !== 1 ? 's' : ''} selected
          </span>
          <span className="text-slate-400 ml-2">(Max 3 active goals recommended)</span>
        </div>
      </div>
    </motion.div>
  );
}
