'use client';

import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import type { PrimaryGoalCardProps } from './types';

/**
 * PrimaryGoalCard - Displays the user's primary goal
 *
 * Features:
 * - Gradient background
 * - Goal title and duration
 * - Award icon
 */
export function PrimaryGoalCard({ goal }: PrimaryGoalCardProps) {
  return (
    <motion.div
      className="p-6 rounded-2xl bg-linear-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Award className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <span className="text-xs text-blue-400 font-medium uppercase tracking-wide">
            Primary Goal
          </span>
          <h3 className="text-xl font-bold text-white mt-1">
            {goal?.title || 'Achieve your health goals'}
          </h3>
          <p className="text-slate-400 mt-1">{goal?.timeline?.durationWeeks || 16} week journey</p>
        </div>
      </div>
    </motion.div>
  );
}
