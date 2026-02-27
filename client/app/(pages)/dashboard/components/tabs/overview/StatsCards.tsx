'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  Flame,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Loader2,
} from 'lucide-react';
import type { Plan } from './types';

interface StatsCardsProps {
  completedToday: number;
  totalToday: number;
  todayProgress: number;
  effectiveWeekRate: number;
  weekChange: number;
  currentStreak: number;
  plan: Plan | null;
  isLoadingStats: boolean;
}

export function StatsCards({
  completedToday,
  totalToday,
  todayProgress,
  effectiveWeekRate,
  weekChange,
  currentStreak,
  plan,
  isLoadingStats,
}: StatsCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* Today's Progress */}
      <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-xs text-slate-400">Today</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-white">
              {completedToday}/{totalToday}
            </p>
            <p className="text-sm text-slate-400">Activities</p>
          </div>
          <div className="text-right">
            <span
              className={`text-lg font-semibold ${
                todayProgress >= 70 ? 'text-green-400' : todayProgress >= 40 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {Math.round(todayProgress)}%
            </span>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${todayProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Week Progress */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          {isLoadingStats ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : (
            <div
              className={`flex items-center gap-1 text-xs ${
                weekChange >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {weekChange >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {weekChange >= 0 ? '+' : ''}
              {weekChange}%
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-white">{effectiveWeekRate}%</p>
        <p className="text-sm text-slate-400">Week Progress</p>
      </div>

      {/* Current Streak */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          {currentStreak >= 7 && <Trophy className="w-4 h-4 text-amber-400" />}
        </div>
        {isLoadingStats ? (
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        ) : (
          <>
            <p className="text-3xl font-bold text-white">{currentStreak}</p>
            <p className="text-sm text-slate-400">Day Streak</p>
          </>
        )}
      </div>

      {/* Plan Week */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
        </div>
        <p className="text-3xl font-bold text-white">
          Week {plan?.currentWeek || 1}
        </p>
        <p className="text-sm text-slate-400">of {plan?.durationWeeks || 12}</p>
      </div>
    </motion.div>
  );
}
