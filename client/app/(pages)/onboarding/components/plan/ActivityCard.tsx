'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { ActivityCardProps } from './types';

/**
 * ActivityCard - Individual activity item in the plan
 *
 * Features:
 * - Animated entry
 * - Icon display
 * - Days and time display
 */
export function ActivityCard({ activity, index }: ActivityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.1 }}
      className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-slate-300">
        {activity.icon}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-white">{activity.title}</h4>
        <p className="text-sm text-slate-400">
          {activity.days.join(', ')} • {activity.time}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-500" />
    </motion.div>
  );
}
