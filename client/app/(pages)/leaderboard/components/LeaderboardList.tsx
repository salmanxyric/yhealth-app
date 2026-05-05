'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../../../components/ui/skeleton';
import type { LeaderboardEntry } from '@/src/shared/services/leaderboard.service';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ScoreBreakdownBars } from './ScoreBreakdownBars';
import { PaginationBar } from '@/components/ui/pagination-bar';

interface LeaderboardListProps {
  entries: LeaderboardEntry[];
  startRank: number;
  total: number;
  isLoading?: boolean;
  currentUserId?: string;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function getAccentColor(rank: number) {
  if (rank <= 5) return { border: 'border-l-emerald-500/50', glow: 'rgba(16,185,129,0.12)' };
  if (rank <= 10) return { border: 'border-l-blue-500/40', glow: 'rgba(96,165,250,0.08)' };
  if (rank <= 20) return { border: 'border-l-indigo-500/30', glow: 'rgba(99,102,241,0.06)' };
  return { border: 'border-l-white/10', glow: 'transparent' };
}

function ScoreBreakdown({ entry }: { entry: LeaderboardEntry }) {
  const raw = (entry.component_scores ?? {}) as unknown as Record<string, number>;
  const scores = {
    workout: raw.workout ?? 0,
    nutrition: raw.nutrition ?? 0,
    wellbeing: raw.wellbeing ?? 0,
    biometrics: raw.biometrics ?? 0,
    engagement: raw.engagement ?? raw.participation ?? 0,
    consistency: raw.consistency ?? 0,
  };
  const items = [
    { label: 'Workout', value: scores.workout, color: 'bg-orange-500', track: 'bg-orange-500/20' },
    { label: 'Nutrition', value: scores.nutrition, color: 'bg-green-500', track: 'bg-green-500/20' },
    { label: 'Wellbeing', value: scores.wellbeing, color: 'bg-purple-500', track: 'bg-purple-500/20' },
    { label: 'Biometrics', value: scores.biometrics, color: 'bg-pink-500', track: 'bg-pink-500/20' },
    { label: 'Engagement', value: scores.engagement, color: 'bg-blue-500', track: 'bg-blue-500/20' },
    { label: 'Consistency', value: scores.consistency, color: 'bg-amber-500', track: 'bg-amber-500/20' },
  ];

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4 pb-3 pt-1">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{item.label}</span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-mono tabular-nums">{(item.value || 0).toFixed(0)}</span>
            </div>
            <div className={cn('h-1 rounded-full overflow-hidden', item.track)}>
              <motion.div
                className={cn('h-full rounded-full', item.color)}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(item.value || 0, 100)}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function LeaderboardList({
  entries,
  startRank,
  total,
  isLoading = false,
  currentUserId,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
}: LeaderboardListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (isLoading && entries.length === 0) {
    return (
      <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-8 h-4 rounded" />
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl bg-gray-900/60 backdrop-blur-sm border border-white/5 overflow-hidden"
      role="table"
      aria-label="Leaderboard entries"
    >
      {/* Table header — desktop only */}
      <div
        className="hidden md:grid md:grid-cols-[60px_1fr_340px_80px_40px] gap-2 items-center px-4 py-3 border-b border-white/[0.06] text-[11px] text-gray-500 font-semibold uppercase tracking-wider"
        role="row"
      >
        <div role="columnheader">Rank</div>
        <div role="columnheader">Name</div>
        <div role="columnheader">Score Breakdown</div>
        <div role="columnheader" className="text-right">Score</div>
        <div role="columnheader" className="sr-only">Expand</div>
      </div>

      {entries.map((entry, index) => {
        const rank = startRank + index;
        const isCurrentUser = currentUserId === entry.user_id;
        const isExpanded = expandedRows.has(entry.user_id);
        const accent = getAccentColor(rank);
        const scores = (entry.component_scores ?? {}) as unknown as Record<string, number>;
        const normalizedScores = {
          workout: scores.workout ?? 0,
          nutrition: scores.nutrition ?? 0,
          wellbeing: scores.wellbeing ?? 0,
          biometrics: scores.biometrics ?? 0,
          engagement: scores.engagement ?? scores.participation ?? 0,
          consistency: scores.consistency ?? 0,
        };

        return (
          <motion.div
            key={entry.user_id || `entry-${index}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.5) }}
            role="row"
            aria-label={`Rank ${rank}: ${entry.user?.name || 'Anonymous'} — ${(Number(entry.total_score) || 0).toFixed(1)} pts`}
            className="group"
          >
            <div
              className={cn(
                'relative flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 transition-colors duration-200 cursor-pointer',
                'md:grid md:grid-cols-[60px_1fr_340px_80px_40px] md:gap-2',
                'border-l-2',
                accent.border,
                isCurrentUser
                  ? 'bg-emerald-500/8 hover:bg-emerald-500/12'
                  : 'hover:bg-white/[0.03]',
                index !== 0 && 'border-t border-white/[0.04]'
              )}
              onClick={() => {
                setExpandedRows((prev) => {
                  const next = new Set(prev);
                  if (next.has(entry.user_id)) next.delete(entry.user_id);
                  else next.add(entry.user_id);
                  return next;
                });
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `linear-gradient(90deg, ${accent.glow}, transparent 50%)` }}
              />

              {/* Rank number */}
              <div className="relative w-7 sm:w-8 md:w-auto text-center shrink-0">
                <span className={cn(
                  'text-xs sm:text-sm font-bold tabular-nums',
                  rank <= 5 ? 'text-emerald-400' : rank <= 10 ? 'text-blue-400' : 'text-gray-500'
                )}>
                  #{rank}
                </span>
              </div>

              {/* Avatar + Name */}
              <div className="relative flex items-center gap-2.5 flex-1 min-w-0 md:flex-none">
                <div className="relative shrink-0">
                  <Avatar className={cn(
                    'w-9 h-9 sm:w-10 sm:h-10 border',
                    isCurrentUser ? 'border-emerald-500/50' : 'border-white/10'
                  )}>
                    <AvatarImage src={entry.user?.avatar} alt={entry.user?.name || 'User'} />
                    <AvatarFallback className="bg-gray-800 text-gray-300 text-xs sm:text-sm font-semibold">
                      {entry.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isCurrentUser && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-gray-900" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={cn(
                      'text-sm sm:text-base font-semibold truncate',
                      isCurrentUser ? 'text-emerald-300' : 'text-white'
                    )}>
                      {entry.user?.name || 'Anonymous'}
                    </p>
                    {isCurrentUser && (
                      <span className="shrink-0 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] sm:text-[10px] font-bold rounded-full uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">@balencia</p>
                </div>
              </div>

              {/* Inline Score Breakdown — desktop only */}
              <div className="hidden md:block relative">
                <ScoreBreakdownBars scores={normalizedScores} />
              </div>

              {/* Score */}
              <div className="relative flex items-center justify-end gap-2 sm:gap-3 shrink-0 md:text-right">
                <span className={cn(
                  'text-base sm:text-lg font-bold font-mono tabular-nums',
                  isCurrentUser ? 'text-emerald-400' : 'text-white'
                )}>
                  {(Number(entry.total_score) || 0).toFixed(0)}
                </span>
              </div>

              {/* Expand indicator */}
              <div className="relative flex items-center justify-center shrink-0">
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </motion.div>
              </div>
            </div>

            {/* Expandable breakdown */}
            <AnimatePresence>
              {isExpanded && <ScoreBreakdown entry={entry} />}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Pagination Bar */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
