'use client';

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

interface GoalsSummaryProps {
  confirmedCount: number;
  maxCount?: number;
}

export function GoalsSummary({ confirmedCount, maxCount = 3 }: GoalsSummaryProps) {
  const isOverLimit = confirmedCount > maxCount;

  return (
    <motion.div
      className={`p-4 rounded-xl border mb-8 ${
        isOverLimit
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-emerald-500/10 border-emerald-600/30'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center gap-3">
        <Target className={`w-5 h-5 ${isOverLimit ? 'text-red-400' : 'text-emerald-500'}`} />
        <div>
          <span className="text-white font-medium">
            {confirmedCount}/{maxCount} goal{confirmedCount !== 1 ? 's' : ''} selected
          </span>
          <span className={`ml-2 ${isOverLimit ? 'text-red-300' : 'text-slate-400'}`}>
            {isOverLimit ? 'Remove one goal to continue' : `Up to ${maxCount} active goals allowed`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
