'use client';

import { motion } from 'framer-motion';
import { Target, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Plan } from './types';

interface CurrentPlanCardProps {
  plan: Plan;
}

export function CurrentPlanCard({ plan }: CurrentPlanCardProps) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-white/10">
          <Target className="w-5 h-5 text-purple-400" />
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
          Active
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{plan.name}</h3>
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
        {plan.description}
      </p>

      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-white/10"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={176}
              initial={{ strokeDashoffset: 176 }}
              animate={{
                strokeDashoffset: 176 - (176 * plan.overallProgress) / 100,
              }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient
                id="progressGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {plan.overallProgress}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-400">Overall Progress</p>
          <p className="text-white font-medium">
            {plan.overallProgress}% Complete
          </p>
        </div>
      </div>

      <Link
        href="/dashboard?tab=plans"
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
      >
        View Plan Details
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
