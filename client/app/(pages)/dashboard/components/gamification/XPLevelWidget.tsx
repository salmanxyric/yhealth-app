'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Trophy, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';

interface GamificationStats {
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  levelProgress: {
    currentLevel: number;
    currentXP: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    progressPercent: number;
  };
}

export function XPLevelWidget() {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<{ stats: GamificationStats }>('/gamification/stats');
      if (response.success && response.data) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch gamification stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - request deduplication handles concurrent calls

  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { currentLevel, levelProgress, currentStreak, longestStreak } = stats;
  const xpInLevel = stats.totalXP - levelProgress.xpForCurrentLevel;
  const xpNeeded = levelProgress.xpForNextLevel - levelProgress.xpForCurrentLevel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4"
    >
      {/* Level Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{currentLevel}</span>
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center"
            >
              <Sparkles className="w-3 h-3 text-amber-900" />
            </motion.div>
          </div>
          <div>
            <h3 className="font-semibold text-white">Level {currentLevel}</h3>
            <p className="text-sm text-amber-400/70">
              {stats.totalXP.toLocaleString()} Total XP
            </p>
          </div>
        </div>
      </div>

      {/* Progress to Next Level */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Progress to Level {currentLevel + 1}</span>
          <span className="text-amber-400 font-medium">
            {xpInLevel} / {xpNeeded} XP
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress.progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
          />
        </div>
      </div>

      {/* Streak & Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Current Streak */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-400' : 'text-slate-500'}`} />
            <span className="text-xs text-slate-400">Current Streak</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${currentStreak > 0 ? 'text-white' : 'text-slate-500'}`}>
              {currentStreak}
            </span>
            <span className="text-xs text-slate-400">days</span>
          </div>
        </div>

        {/* Best Streak */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Best Streak</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{longestStreak}</span>
            <span className="text-xs text-slate-400">days</span>
          </div>
        </div>
      </div>

      {/* Streak Multiplier Info */}
      {currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 p-2 bg-amber-500/10 rounded-lg text-center"
        >
          <span className="text-xs text-amber-400">
            {Math.min(currentStreak, 30) * 2}% XP Bonus Active
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
