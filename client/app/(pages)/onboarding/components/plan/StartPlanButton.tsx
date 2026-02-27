'use client';

import { motion } from 'framer-motion';
import { Rocket, Play, RefreshCw } from 'lucide-react';
import type { StartPlanButtonProps } from './types';

/**
 * StartPlanButton - CTA button to start the health plan
 *
 * Features:
 * - Loading state with spinner
 * - Hover/tap animations
 * - Gradient styling
 */
export function StartPlanButton({ onClick, isStarting }: StartPlanButtonProps) {
  return (
    <>
      <motion.button
        onClick={onClick}
        disabled={isStarting}
        className={`w-full py-4 rounded-xl font-bold text-lg
                 bg-linear-to-r from-emerald-500 to-teal-500 text-white
                 hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300
                 flex items-center justify-center gap-3
                 ${isStarting ? 'opacity-70 cursor-not-allowed' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileHover={isStarting ? {} : { scale: 1.02 }}
        whileTap={isStarting ? {} : { scale: 0.98 }}
      >
        {isStarting ? (
          <>
            <RefreshCw className="w-6 h-6 animate-spin" />
            Setting Up Your Plan...
          </>
        ) : (
          <>
            <Rocket className="w-6 h-6" />
            Start Your Journey
            <Play className="w-5 h-5" />
          </>
        )}
      </motion.button>

      <motion.p
        className="text-center mt-4 text-sm text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Your first check-in is tomorrow at 9:00 AM
      </motion.p>
    </>
  );
}
