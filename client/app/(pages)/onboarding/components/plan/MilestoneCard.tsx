'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import type { MilestoneCardProps } from './types';

/**
 * MilestoneCard - Displays a plan milestone
 *
 * Features:
 * - Purple gradient styling
 * - Day indicator
 * - Milestone title
 */
export function MilestoneCard({ milestone }: MilestoneCardProps) {
  return (
    <motion.div
      className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <span className="text-xs text-purple-400 font-medium">
            First Milestone - Day {milestone.day}
          </span>
          <p className="text-white font-medium">{milestone.title}</p>
        </div>
      </div>
    </motion.div>
  );
}
