'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Crown, Flame, Trophy, TrendingUp, Star } from 'lucide-react';
import { api } from '@/lib/api-client';

// ============================================
// TYPES
// ============================================

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

interface AchievementSummary {
  level: number;
  totalXP: number;
  xpProgress: number;
  xpNeeded: number;
  xpProgressPercentage: number;
  totalUnlocked: number;
  totalAchievements: number;
  currentStreak: number;
  longestStreak: number;
}

// ============================================
// LEVEL CONFIG
// ============================================

function getLevelName(level: number): string {
  if (level < 5) return 'Beginner';
  if (level < 10) return 'Explorer';
  if (level < 20) return 'Achiever';
  if (level < 50) return 'Champion';
  return 'Legend';
}

interface LevelColors {
  gradient: string;
  text: string;
  badge: string;
  barFrom: string;
  barTo: string;
  glow: string;
}

function getLevelColors(level: number): LevelColors {
  if (level < 5)
    return {
      gradient: 'from-slate-500 to-slate-400',
      text: 'text-slate-400',
      badge: 'bg-slate-500/20 text-slate-400',
      barFrom: '#64748b',
      barTo: '#94a3b8',
      glow: 'rgba(100,116,139,0.4)',
    };
  if (level < 10)
    return {
      gradient: 'from-amber-500 to-orange-500',
      text: 'text-amber-400',
      badge: 'bg-amber-500/15 text-amber-400',
      barFrom: '#f59e0b',
      barTo: '#f97316',
      glow: 'rgba(245,158,11,0.4)',
    };
  if (level < 20)
    return {
      gradient: 'from-emerald-500 to-cyan-500',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-400',
      barFrom: '#10b981',
      barTo: '#06b6d4',
      glow: 'rgba(16,185,129,0.4)',
    };
  if (level < 50)
    return {
      gradient: 'from-violet-500 to-fuchsia-500',
      text: 'text-violet-400',
      badge: 'bg-violet-500/15 text-violet-400',
      barFrom: '#8b5cf6',
      barTo: '#d946ef',
      glow: 'rgba(139,92,246,0.4)',
    };
  return {
    gradient: 'from-yellow-400 to-amber-500',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/15 text-yellow-400',
    barFrom: '#facc15',
    barTo: '#f59e0b',
    glow: 'rgba(250,204,21,0.5)',
  };
}

// ============================================
// ANIMATED COUNTER
// ============================================

function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync reset for zero value
      setDisplay(0);
      return;
    }
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * end);
      setDisplay(start);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

// ============================================
// SKELETON LOADER
// ============================================

function XPSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div
      data-tour="xp-widget"
      className={`rounded-2xl p-4 sm:p-5 ${compact ? 'h-full min-h-[120px] flex flex-col' : ''}`}
      style={{
        background: 'linear-gradient(145deg, #0f0f1a 0%, #0a0a14 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className={`flex items-center gap-3 ${compact ? 'mb-3' : 'mb-4'}`}>
        <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-white/[0.04] animate-pulse`} />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-white/[0.04] animate-pulse" />
          <div className="h-3 w-16 rounded bg-white/[0.04] animate-pulse" />
        </div>
      </div>
      <div className={`h-1.5 rounded-full bg-white/[0.04] animate-pulse ${compact ? '' : 'mb-3'}`} />
      {!compact && (
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
          <div className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN WIDGET
// ============================================

export function XPLevelWidget({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const compact = variant === 'compact';
  const [level, setLevel] = useState(1);
  const [totalXP, setTotalXP] = useState(0);
  const [xpInLevel, setXpInLevel] = useState(0);
  const [xpNeeded, setXpNeeded] = useState(500);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalUnlocked, setTotalUnlocked] = useState(0);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const [gamRes, achRes] = await Promise.all([
        api.get<{ stats: GamificationStats }>('/gamification/stats').catch(() => null),
        api.get<AchievementSummary>('/achievements/summary').catch(() => null),
      ]);

      const gamStats = gamRes?.success ? gamRes.data?.stats : null;
      const achStats = achRes?.success ? achRes.data : null;

      const gamXP = gamStats?.totalXP || 0;
      const achXP = achStats?.totalXP || 0;

      if (achXP >= gamXP && achStats) {
        setLevel(achStats.level);
        setTotalXP(achStats.totalXP);
        setXpInLevel(achStats.xpProgress);
        setXpNeeded(achStats.xpNeeded);
        setProgressPercent(achStats.xpProgressPercentage);
        setCurrentStreak(achStats.currentStreak || gamStats?.currentStreak || 0);
        setLongestStreak(achStats.longestStreak || gamStats?.longestStreak || 0);
        setTotalUnlocked(achStats.totalUnlocked || 0);
        setTotalAchievements(achStats.totalAchievements || 0);
      } else if (gamStats) {
        setLevel(gamStats.currentLevel);
        setTotalXP(gamStats.totalXP);
        setXpInLevel(gamStats.totalXP - gamStats.levelProgress.xpForCurrentLevel);
        setXpNeeded(gamStats.levelProgress.xpForNextLevel - gamStats.levelProgress.xpForCurrentLevel);
        setProgressPercent(gamStats.levelProgress.progressPercent);
        setCurrentStreak(gamStats.currentStreak);
        setLongestStreak(gamStats.longestStreak);
      }
    } catch (err) {
      console.error('Failed to fetch gamification stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return <XPSkeleton compact={compact} />;
  }

  const levelName = getLevelName(level);
  const colors = getLevelColors(level);
  const streakBonus = currentStreak > 0 ? Math.min(currentStreak, 30) * 2 : 0;
  const progressId = 'xp-progress-gradient';

  return (
    <motion.div
      data-tour="xp-widget"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={`relative overflow-hidden rounded-2xl ${compact ? 'h-full min-h-0 flex flex-col ring-1 ring-white/[0.06]' : ''}`}
      style={{
        background: compact
          ? `linear-gradient(165deg, rgba(28,26,22,0.95) 0%, rgba(16,14,12,0.98) 50%, rgba(10,9,8,1) 100%)`
          : 'linear-gradient(145deg, #0f0f1a 0%, #0a0a14 100%)',
        border: compact ? `1px solid ${colors.barFrom}55` : '1px solid rgba(255,255,255,0.06)',
        boxShadow: compact
          ? `0 8px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.35), 0 0 48px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.35)`
          : undefined,
      }}
    >
      {compact && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.barFrom}77, transparent)`,
          }}
        />
      )}
      {/* Ambient glow */}
      <div
        className={`absolute -top-16 -right-16 rounded-full blur-3xl pointer-events-none ${compact ? 'w-40 h-40 opacity-90' : 'w-32 h-32'}`}
        style={{ background: `linear-gradient(135deg, ${colors.barFrom}25, ${colors.barTo}12)` }}
      />

      <div className={`relative ${compact ? 'flex flex-1 min-h-0 flex-col p-3' : 'p-4 sm:p-5'}`}>
        {/* ---- Header: Level badge + Name + XP ---- */}
        <div className={`flex min-w-0 items-center gap-2.5 sm:gap-3 ${compact ? 'mb-2' : 'mb-4'}`}>
          {/* Crown badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
            className={`shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br ${colors.gradient} shadow-lg ${compact ? 'h-8 w-8 ring-2 ring-white/10' : 'w-10 h-10'}`}
            style={{ boxShadow: `0 4px 20px ${colors.glow}` }}
          >
            <Crown className={`text-white drop-shadow ${compact ? 'h-3.5 w-3.5' : 'h-5 w-5'}`} />
          </motion.div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-1.5 sm:items-center sm:gap-2">
              <h3
                className={`min-w-0 font-bold leading-tight tracking-tight text-white ${compact ? 'text-xs sm:text-sm' : 'text-base'}`}
              >
                {levelName}
              </h3>
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide sm:px-2 sm:text-[10px] ${colors.badge}`}
                style={compact ? { boxShadow: `0 0 12px ${colors.glow}` } : undefined}
              >
                Lv {level}
              </span>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
              <Star className={`shrink-0 fill-current ${colors.text} ${compact ? 'h-2.5 w-2.5 sm:h-3 sm:w-3' : 'h-3 w-3'}`} />
              <span
                className={`min-w-0 truncate font-semibold tabular-nums ${colors.text} ${compact ? 'text-xs sm:text-[13px]' : 'text-sm'}`}
              >
                <AnimatedNumber value={totalXP} /> XP
              </span>
            </div>
          </div>
        </div>

        {compact && (
          <div className="relative mb-2 flex flex-1 min-h-0 flex-col items-center justify-center py-1.5 sm:mb-3 sm:py-2">
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-90"
              style={{
                background: `radial-gradient(ellipse 85% 55% at 50% 35%, ${colors.barFrom}24, transparent 68%)`,
              }}
            />
            {streakBonus > 0 ? (
              <div
                className="relative z-[1] rounded-xl px-4 py-2.5 text-center ring-1 ring-white/[0.08]"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                }}
              >
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Streak boost</p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-amber-300" style={{ textShadow: '0 0 20px rgba(251,191,36,0.35)' }}>
                  +{streakBonus}%
                  <span className="text-xs font-semibold text-amber-200/80"> XP</span>
                </p>
                {currentStreak > 0 && (
                  <p className="mt-1 text-[10px] font-medium text-slate-500">{currentStreak} day streak active</p>
                )}
              </div>
            ) : (
              <div
                className="relative z-[1] flex h-[72px] w-[72px] items-center justify-center rounded-full ring-1 ring-white/[0.08]"
                style={{
                  background: `conic-gradient(from 200deg, ${colors.barFrom}33, transparent 55%, ${colors.barTo}22)`,
                  boxShadow: `inset 0 0 24px rgba(0,0,0,0.45), 0 0 32px ${colors.glow}`,
                }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Level</span>
              </div>
            )}
          </div>
        )}

        {/* ---- XP Progress bar ---- */}
        <div className={compact ? 'mt-auto' : 'mb-4'}>
          {compact ? (
            <div
              className="rounded-xl px-3 pb-3 pt-2 ring-1 ring-white/[0.06]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="mb-1.5 flex min-w-0 items-start justify-between gap-2">
                <span className="shrink-0 pt-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.1em] text-slate-400 sm:tracking-[0.12em]">
                  Progress
                </span>
                <span className="min-w-0 text-right text-[9px] font-semibold leading-none tabular-nums text-slate-200 sm:text-[11px]">
                  {xpInLevel.toLocaleString()}/{xpNeeded.toLocaleString()}
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.06]">
                <svg className="absolute h-0 w-0">
                  <defs>
                    <linearGradient id={progressId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={colors.barFrom} />
                      <stop offset="100%" stopColor={colors.barTo} />
                    </linearGradient>
                  </defs>
                </svg>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${colors.barFrom}, ${colors.barTo})`,
                    boxShadow: `0 0 14px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                    }}
                    animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 1.5 }}
                  />
                </motion.div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Progress</span>
                <span className="text-[10px] font-medium tabular-nums text-slate-500">
                  {xpInLevel.toLocaleString()}/{xpNeeded.toLocaleString()}
                </span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <svg className="absolute h-0 w-0">
                  <defs>
                    <linearGradient id={progressId} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={colors.barFrom} />
                      <stop offset="100%" stopColor={colors.barTo} />
                    </linearGradient>
                  </defs>
                </svg>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${colors.barFrom}, ${colors.barTo})`,
                    boxShadow: `0 0 12px ${colors.glow}, 0 0 4px ${colors.glow}`,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                    }}
                    animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 1.5 }}
                  />
                </motion.div>
              </div>
            </>
          )}
        </div>

        {!compact && (
          <>
            {/* ---- Stats row: 2 columns ---- */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div
                  className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                    currentStreak > 0 ? 'bg-orange-500/15' : 'bg-white/[0.04]'
                  }`}
                >
                  <Flame
                    className={`w-3.5 h-3.5 ${currentStreak > 0 ? 'text-orange-400' : 'text-slate-600'}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 leading-tight font-medium">Streak</p>
                  <p
                    className={`text-sm font-bold tabular-nums ${
                      currentStreak > 0 ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    <AnimatedNumber value={currentStreak} duration={0.8} />
                    <span className="text-[10px] text-slate-500 font-normal ml-0.5">d</span>
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/15">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 leading-tight font-medium">Best</p>
                  <p className="text-sm font-bold text-white tabular-nums">
                    <AnimatedNumber value={longestStreak} duration={0.8} />
                    <span className="text-[10px] text-slate-500 font-normal ml-0.5">d</span>
                  </p>
                </div>
              </motion.div>
            </div>

            {/* ---- Footer: Achievements + XP bonus ---- */}
            {totalAchievements > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-between pt-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-slate-500">
                    {totalUnlocked}/{totalAchievements} achievements
                  </span>
                </div>
                {streakBonus > 0 && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(245,158,11,0.1)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245,158,11,0.15)',
                    }}
                  >
                    +{streakBonus}% XP bonus
                  </span>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
