'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ErrorBoundary, ErrorFallback, JoinCompetitionModal } from '@/components/features/competitions';
import { useFetch } from '@/hooks/use-fetch';
import { useLeaderboardSocket } from '@/hooks/use-leaderboard-socket';
import type { Competition, CompetitionEntry } from '@/src/shared/services/leaderboard.service';
import { joinCompetition, leaveCompetition } from '@/src/shared/services/leaderboard.service';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/app/context/AuthContext';
import { CompetitionDetailView } from './components/CompetitionDetailView';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import {
  Trophy,
  Sparkles,
  Zap,
  Users,
  Calendar,
  Clock,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Loader2,
  Award,
  TrendingUp,
  Target,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  CircleDot,
  Archive,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompetitionWithMeta = Competition & {
  is_joined?: boolean;
  participant_count?: number;
};

type FilterMode = 'all' | 'joined' | 'ai_generated';
type StatusFilter = 'all' | 'active' | 'ended';
type SortMode = 'newest' | 'participants' | 'ending_soon';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const getDaysRemaining = (endDate: Date): number =>
  Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Live countdown timer that ticks every second. */
function CountdownTimer({ endDate }: { endDate: Date }) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
    return <span className="text-red-400 text-xs font-semibold">Ended</span>;
  }

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      {remaining.days > 0 && (
        <TimeBlock value={remaining.days} label="d" />
      )}
      <TimeBlock value={remaining.hours} label="h" />
      <TimeBlock value={remaining.minutes} label="m" />
      <TimeBlock value={remaining.seconds} label="s" />
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 text-emerald-300 border border-white/10">
      <span className="tabular-nums font-semibold">{String(value).padStart(2, '0')}</span>
      <span className="text-gray-500 text-[10px]">{label}</span>
    </span>
  );
}

/** Animated number that counts up from 0 to the target value. */
function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (value === 0) { setDisplay(0); return; }
    const steps = 40;
    const increment = value / steps;
    const intervalMs = (duration * 1000) / steps;
    let current = 0;
    const id = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(id);
      } else {
        setDisplay(Math.floor(current));
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [value, duration]);

  return <span className="tabular-nums">{display.toLocaleString()}</span>;
}

/** Skeleton card with shimmer animation. */
function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-5 w-3/4 rounded-lg bg-white/10" />
            <div className="h-3 w-full rounded-lg bg-white/[0.06]" />
            <div className="h-3 w-2/3 rounded-lg bg-white/[0.06]" />
          </div>
          <div className="ml-3 h-6 w-16 rounded-full bg-white/10" />
        </div>
        <div className="flex gap-3">
          <div className="h-8 w-20 rounded-lg bg-white/[0.06]" />
          <div className="h-8 w-20 rounded-lg bg-white/[0.06]" />
          <div className="h-8 w-20 rounded-lg bg-white/[0.06]" />
        </div>
        <div className="h-10 w-full rounded-xl bg-white/10" />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 24 },
  },
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function CompetitionsPageContent() {
  const { user } = useAuth();

  // ---- State ----
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [joining, setJoining] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [competitionForJoin, setCompetitionForJoin] = useState<Competition | null>(null);
  const [optimisticJoins, setOptimisticJoins] = useState<Set<string>>(new Set());
  const [optimisticLeaves, setOptimisticLeaves] = useState<Set<string>>(new Set());

  // ---- Fetch all competitions ----
  const {
    data: competitionsData,
    isLoading,
    error: competitionsError,
    refetch,
  } = useFetch<Competition[] | { competitions: Competition[] }>('/competitions', {
    immediate: !!user?.id,
    deps: [user?.id],
  });

  // ---- Socket ----
  useLeaderboardSocket({
    userId: user?.id,
    enabled: !!user?.id,
    onCompetitionRankUpdate: () => refetch(),
  });

  // ---- Normalize ----
  const competitions: CompetitionWithMeta[] = useMemo(() => {
    const raw = Array.isArray(competitionsData)
      ? competitionsData
      : competitionsData?.competitions || [];
    return raw as CompetitionWithMeta[];
  }, [competitionsData]);

  // ---- User's joined competition IDs (from API + optimistic) ----
  const userJoinedIds = useMemo(() => {
    const apiJoined = new Set(
      competitions.filter((c) => c.is_joined).map((c) => c.id)
    );
    optimisticJoins.forEach((id) => apiJoined.add(id));
    optimisticLeaves.forEach((id) => apiJoined.delete(id));
    return apiJoined;
  }, [competitions, optimisticJoins, optimisticLeaves]);

  // Clean up optimistic state once API confirms
  useEffect(() => {
    const apiIds = new Set(competitions.filter((c) => c.is_joined).map((c) => c.id));
    setOptimisticJoins((prev) => {
      const next = new Set(prev);
      prev.forEach((id) => { if (apiIds.has(id)) next.delete(id); });
      return next.size !== prev.size ? next : prev;
    });
    setOptimisticLeaves((prev) => {
      const next = new Set(prev);
      prev.forEach((id) => { if (!apiIds.has(id)) next.delete(id); });
      return next.size !== prev.size ? next : prev;
    });
  }, [competitions]);

  const isJoined = useCallback(
    (id: string) => userJoinedIds.has(id),
    [userJoinedIds]
  );

  // ---- Filter & Sort ----
  const filteredCompetitions = useMemo(() => {
    let list = [...competitions];

    // Status filter
    if (statusFilter === 'active') {
      list = list.filter((c) => c.status === 'active' && new Date(c.end_date) >= new Date());
    } else if (statusFilter === 'ended') {
      list = list.filter((c) => c.status === 'ended' || new Date(c.end_date) < new Date());
    }

    // Type filter
    if (filterMode === 'joined') {
      list = list.filter((c) => isJoined(c.id));
    } else if (filterMode === 'ai_generated') {
      list = list.filter((c) => c.type === 'ai_generated');
    }

    // Sort
    switch (sortMode) {
      case 'newest':
        list.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        break;
      case 'participants':
        list.sort((a, b) => (b.participant_count ?? 0) - (a.participant_count ?? 0));
        break;
      case 'ending_soon':
        list.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
        break;
    }

    return list;
  }, [competitions, statusFilter, filterMode, sortMode, isJoined]);

  // ---- Stats ----
  const stats = useMemo(() => {
    const total = competitions.length;
    const active = competitions.filter((c) => c.status === 'active' && new Date(c.end_date) >= new Date()).length;
    const ended = total - active;
    const totalParticipants = competitions.reduce(
      (sum, c) => sum + (c.participant_count ?? 0),
      0
    );
    const joinedCount = competitions.filter((c) => isJoined(c.id)).length;
    return { total, active, ended, totalParticipants, joinedCount };
  }, [competitions, isJoined]);

  // ---- Selected competition for detail modal ----
  const selectedCompetition = useMemo(
    () => competitions.find((c) => c.id === selectedCompetitionId) ?? null,
    [competitions, selectedCompetitionId]
  );

  // ---- Join / Leave handlers ----
  const handleJoinClick = useCallback(
    (competition: CompetitionWithMeta, e: React.MouseEvent) => {
      e.stopPropagation();
      if (isJoined(competition.id)) {
        toast.info('You have already joined this competition');
        return;
      }
      if (competition.status !== 'active') {
        toast.error('Competition is not active');
        return;
      }
      setCompetitionForJoin(competition);
      setJoinModalOpen(true);
    },
    [isJoined]
  );

  const handleJoinConfirm = useCallback(async () => {
    if (!competitionForJoin) return;
    const id = competitionForJoin.id;
    setJoining(id);
    setJoinModalOpen(false);

    // Optimistic update
    setOptimisticJoins((prev) => new Set(prev).add(id));

    try {
      await joinCompetition(id);
      toast.success(`Joined "${competitionForJoin.name}"!`, {
        description: 'Your progress will be tracked on the leaderboard.',
        duration: 4000,
      });
      refetch();
    } catch (error) {
      // Rollback optimistic
      setOptimisticJoins((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      if (error instanceof ApiError) {
        if (error.statusCode === 409) {
          setOptimisticJoins((prev) => new Set(prev).add(id));
          toast.info('You are already part of this competition!');
        } else if (error.statusCode === 403) {
          toast.error('Not eligible for this competition', { description: error.message });
        } else {
          toast.error('Failed to join competition', { description: error.message });
        }
      } else {
        toast.error('Failed to join competition', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } finally {
      setJoining(null);
      setCompetitionForJoin(null);
    }
  }, [competitionForJoin, refetch]);

  const handleLeave = useCallback(
    async (competitionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setLeaving(competitionId);

      // Optimistic update
      setOptimisticLeaves((prev) => new Set(prev).add(competitionId));

      try {
        await leaveCompetition(competitionId);
        toast.success('Left competition', {
          description: 'You can rejoin anytime before it ends.',
          duration: 3000,
        });
        refetch();
      } catch (error) {
        // Rollback
        setOptimisticLeaves((prev) => {
          const next = new Set(prev);
          next.delete(competitionId);
          return next;
        });
        toast.error('Failed to leave competition', {
          description: error instanceof Error ? error.message : 'Please try again',
        });
      } finally {
        setLeaving(null);
      }
    },
    [refetch]
  );

  // ---- Build user entry for detail view ----
  const buildUserEntry = useCallback(
    (competition: CompetitionWithMeta): CompetitionEntry | undefined => {
      if (!isJoined(competition.id)) return undefined;
      return {
        id: '',
        competition_id: competition.id,
        user_id: user?.id || '',
        joined_at: '',
        status: 'active',
        current_rank: null,
        current_score: null,
      };
    },
    [isJoined, user?.id]
  );

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div
        className="min-h-screen bg-gray-950 relative overflow-hidden"
        role="main"
        aria-label="Competitions page"
      >
        <div className="relative z-10">
          {/* --------------------------------------------------------------- */}
          {/* HERO SECTION                                                    */}
          {/* --------------------------------------------------------------- */}
          <section className="relative overflow-hidden border-b border-white/[0.06]">
            {/* ---- Animated background ---- */}
            <div className="absolute inset-0" aria-hidden="true">
              {/* Rich gradient mesh */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-gray-950 to-purple-950/60" />

              {/* Large emerald orb — left */}
              <motion.div
                className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-emerald-500/20 blur-[120px]"
                animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Purple orb — right */}
              <motion.div
                className="absolute -top-20 -right-32 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[120px]"
                animate={{ scale: [1.1, 1, 1.1], y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              />
              {/* Teal accent — center-bottom */}
              <motion.div
                className="absolute bottom-0 left-1/3 h-[300px] w-[400px] rounded-full bg-teal-500/10 blur-[100px]"
                animate={{ opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />

              {/* Dot grid overlay */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />

              {/* Noise texture */}
              <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27noise%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23noise)%27/%3E%3C/svg%3E")' }} />

              {/* Bottom accent line with glow */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-950 to-transparent" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-10 lg:px-8">
              {/* Top row: title + right-side trophy graphic */}
              <div className="flex items-start justify-between gap-8">
                {/* Left: text content */}
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="flex-1 min-w-0"
                >
                  {/* Title row */}
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div
                      animate={{ rotate: [0, 8, -8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30"
                    >
                      <Trophy className="h-5 w-5 text-white" />
                    </motion.div>
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                        Competitions
                      </h1>
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      className="hidden sm:block"
                    >
                      <Sparkles className="h-5 w-5 text-emerald-400/60" />
                    </motion.div>
                  </div>

                  {/* Subtitle */}
                  <p className="max-w-md text-gray-400 text-sm leading-relaxed mb-6">
                    Compete with friends, earn badges, and climb the leaderboard.
                  </p>
                </motion.div>

                {/* Right: decorative trophy illustration */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                  className="hidden lg:flex relative shrink-0"
                >
                  <div className="relative">
                    {/* Glow ring */}
                    <motion.div
                      className="absolute -inset-4 rounded-full bg-emerald-500/10 blur-xl"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20 border border-white/10 backdrop-blur-sm">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Trophy className="h-10 w-10 text-emerald-400" />
                      </motion.div>
                    </div>
                    {/* Orbiting sparkles */}
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="h-4 w-4 text-amber-400" />
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-1 -left-1"
                      animate={{ rotate: [360, 0] }}
                      transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    >
                      <Zap className="h-3 w-3 text-purple-400" />
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              {/* Stats cards */}
              {!isLoading && competitions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  {[
                    {
                      icon: Target,
                      label: 'Active',
                      value: stats.active,
                      accent: 'text-emerald-400',
                      glow: 'from-emerald-500/15 to-emerald-500/5',
                      iconBg: 'bg-emerald-500/10',
                      border: 'border-emerald-500/10',
                    },
                    {
                      icon: Users,
                      label: 'Participants',
                      value: stats.totalParticipants,
                      accent: 'text-purple-400',
                      glow: 'from-purple-500/15 to-purple-500/5',
                      iconBg: 'bg-purple-500/10',
                      border: 'border-purple-500/10',
                    },
                    {
                      icon: TrendingUp,
                      label: 'Joined',
                      value: stats.joinedCount,
                      accent: 'text-amber-400',
                      glow: 'from-amber-500/15 to-amber-500/5',
                      iconBg: 'bg-amber-500/10',
                      border: 'border-amber-500/10',
                    },
                    {
                      icon: Archive,
                      label: 'Ended',
                      value: stats.ended,
                      accent: 'text-gray-400',
                      glow: 'from-white/5 to-white/[0.02]',
                      iconBg: 'bg-white/5',
                      border: 'border-white/[0.06]',
                    },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className={cn(
                          'relative overflow-hidden rounded-xl border bg-gradient-to-b backdrop-blur-sm p-4',
                          stat.border,
                          stat.glow,
                        )}
                      >
                        {/* Subtle shimmer on hover */}
                        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
                        <div className="relative flex items-center gap-3">
                          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', stat.iconBg)}>
                            <Icon className={cn('h-4 w-4', stat.accent)} />
                          </div>
                          <div>
                            <p className={cn('text-xl font-bold tabular-nums leading-none mb-0.5', stat.accent)}>
                              <AnimatedCounter value={stat.value} />
                            </p>
                            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </section>

          {/* --------------------------------------------------------------- */}
          {/* FILTER / SORT BAR                                               */}
          {/* --------------------------------------------------------------- */}
          {!isLoading && competitions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                {/* Left: Status + Type filters */}
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Status filter pills */}
                  <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] p-0.5 border border-white/[0.06]" role="tablist" aria-label="Status filter">
                    {([
                      { key: 'all' as StatusFilter, label: 'All', icon: null },
                      { key: 'active' as StatusFilter, label: 'Active', icon: CircleDot },
                      { key: 'ended' as StatusFilter, label: 'Ended', icon: Archive },
                    ]).map((f) => {
                      const Icon = f.icon;
                      return (
                        <button
                          key={f.key}
                          role="tab"
                          aria-selected={statusFilter === f.key}
                          onClick={() => setStatusFilter(f.key)}
                          className={cn(
                            'relative rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
                            statusFilter === f.key
                              ? 'text-white'
                              : 'text-gray-500 hover:text-gray-300'
                          )}
                        >
                          {statusFilter === f.key && (
                            <motion.div
                              layoutId="statusFilter"
                              className="absolute inset-0 rounded-md bg-white/[0.08] border border-white/10"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                          <span className="relative flex items-center gap-1.5">
                            {Icon && <Icon className="h-3 w-3" />}
                            {f.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block h-4 w-px bg-white/10" />

                  {/* Type filters */}
                  <div className="flex items-center gap-1" role="tablist" aria-label="Type filter">
                    {([
                      { key: 'all' as FilterMode, label: 'All Types' },
                      { key: 'joined' as FilterMode, label: 'Joined', count: stats.joinedCount },
                      { key: 'ai_generated' as FilterMode, label: 'AI Generated' },
                    ]).map((f) => (
                      <button
                        key={f.key}
                        role="tab"
                        aria-selected={filterMode === f.key}
                        onClick={() => setFilterMode(f.key)}
                        className={cn(
                          'rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
                          filterMode === f.key
                            ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                        )}
                      >
                        {f.label}
                        {'count' in f && f.count !== undefined && f.count > 0 && (
                          <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500/20 px-1 text-[10px] font-bold text-emerald-400">
                            {f.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Sort */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-gray-600 hidden sm:block" />
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-gray-400 backdrop-blur-sm transition-colors hover:border-white/15 focus:border-emerald-500/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                    aria-label="Sort competitions"
                  >
                    <option value="newest">Newest First</option>
                    <option value="participants">Most Participants</option>
                    <option value="ending_soon">Ending Soon</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* MAIN CONTENT                                                    */}
          {/* --------------------------------------------------------------- */}
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} index={i} />
                ))}
              </div>
            )}

            {/* Error */}
            {competitionsError && !isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-8 text-center backdrop-blur-sm"
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                  <XCircle className="h-7 w-7 text-red-400" />
                </div>
                <p className="mb-1 text-lg font-semibold text-red-300">Failed to load competitions</p>
                <p className="mb-5 text-sm text-red-400/70">
                  {competitionsError.message || 'Something went wrong. Please try again.'}
                </p>
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                >
                  Retry
                </Button>
              </motion.div>
            )}

            {/* Empty state */}
            {!isLoading && !competitionsError && filteredCompetitions.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mx-auto max-w-md py-16 text-center"
              >
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border border-white/5"
                >
                  <Trophy className="h-12 w-12 text-gray-600" />
                </motion.div>
                <h3 className="mb-2 text-xl font-semibold text-gray-300">
                  {filterMode === 'all' && statusFilter === 'all'
                    ? 'No competitions yet'
                    : 'No matching competitions'}
                </h3>
                <p className="text-sm text-gray-500">
                  {filterMode === 'all' && statusFilter === 'all'
                    ? 'Check back later for new challenges and competitions!'
                    : 'Try adjusting your filters to see more competitions.'}
                </p>
                {(filterMode !== 'all' || statusFilter !== 'all') && (
                  <Button
                    onClick={() => { setFilterMode('all'); setStatusFilter('all'); }}
                    variant="outline"
                    className="mt-4 border-white/10 text-gray-400 hover:bg-white/5"
                  >
                    Clear filters
                  </Button>
                )}
              </motion.div>
            )}

            {/* ============================================================= */}
            {/* COMPETITION CARDS GRID                                        */}
            {/* ============================================================= */}
            {!isLoading && !competitionsError && filteredCompetitions.length > 0 && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredCompetitions.map((competition) => {
                  const endDate = new Date(competition.end_date);
                  const startDate = new Date(competition.start_date);
                  const daysLeft = getDaysRemaining(endDate);
                  const joined = isJoined(competition.id);
                  const isEndingSoon = daysLeft <= 3 && daysLeft > 0;
                  const isEnded = competition.status === 'ended' || daysLeft === 0;
                  const participantCount = competition.participant_count ?? 0;
                  const rules = competition.rules as Record<string, unknown> | undefined;
                  const metric = rules?.metric as string | undefined;
                  const aggregation = rules?.aggregation as string | undefined;

                  return (
                    <motion.article
                      key={competition.id}
                      variants={cardVariants}
                      whileHover={{ y: -6, transition: { duration: 0.25 } }}
                      onClick={() => setSelectedCompetitionId(competition.id)}
                      className={cn(
                        // Base glassmorphism card
                        'group relative cursor-pointer overflow-hidden rounded-2xl border p-[1px] transition-shadow duration-300',
                        // Default state
                        !joined && !isEndingSoon && !isEnded && 'border-white/[0.08]',
                        // Joined glow
                        joined && 'border-emerald-500/30 shadow-[0_0_30px_-5px] shadow-emerald-500/20',
                        // Ending soon ring
                        isEndingSoon && !joined && 'border-amber-500/30',
                        // Ended — dimmed
                        isEnded && !joined && 'border-white/[0.04] opacity-70',
                        // Hover shadow
                        'hover:shadow-xl hover:shadow-emerald-500/[0.08]'
                      )}
                      aria-label={`Competition: ${competition.name}${joined ? ' (Joined)' : ''}${isEnded ? ' (Ended)' : ''}`}
                    >
                      {/* Gradient border effect on hover */}
                      <div
                        className={cn(
                          'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                          joined
                            ? 'bg-gradient-to-br from-emerald-500/20 via-transparent to-emerald-500/10'
                            : 'bg-gradient-to-br from-emerald-500/10 via-transparent to-purple-500/10'
                        )}
                        aria-hidden="true"
                      />

                      {/* Card inner content */}
                      <div
                        className={cn(
                          'relative rounded-[15px] bg-gray-950/80 backdrop-blur-sm p-5 sm:p-6',
                          joined && 'bg-emerald-950/20'
                        )}
                      >
                        {/* Top row: badges */}
                        <div className="mb-3 flex items-center gap-2 flex-wrap">
                          {/* Status badge */}
                          <Badge
                            className={cn(
                              'border-0 text-[10px] uppercase tracking-wider',
                              isEnded
                                ? 'bg-red-500/15 text-red-400'
                                : 'bg-emerald-500/15 text-emerald-400'
                            )}
                          >
                            <span
                              className={cn(
                                'mr-1 inline-block h-1.5 w-1.5 rounded-full',
                                isEnded ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'
                              )}
                            />
                            {isEnded ? 'Ended' : 'Active'}
                          </Badge>

                          {competition.type === 'ai_generated' && (
                            <Badge className="border-0 bg-purple-500/15 text-purple-400 text-[10px] uppercase tracking-wider">
                              <Sparkles className="mr-0.5 h-2.5 w-2.5" />
                              AI Generated
                            </Badge>
                          )}

                          {joined && (
                            <Badge className="border-0 bg-emerald-500/20 text-emerald-300 text-[10px] uppercase tracking-wider">
                              <CheckCircle className="mr-0.5 h-2.5 w-2.5" />
                              Joined
                            </Badge>
                          )}

                          {isEndingSoon && (
                            <Badge className="border-0 bg-amber-500/15 text-amber-400 text-[10px] uppercase tracking-wider animate-pulse">
                              <Clock className="mr-0.5 h-2.5 w-2.5" />
                              Ending Soon
                            </Badge>
                          )}
                        </div>

                        {/* Title & description */}
                        <h3 className="mb-1.5 text-lg font-bold text-white leading-tight group-hover:text-emerald-100 transition-colors">
                          {competition.name}
                        </h3>
                        {competition.description && (
                          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-400">
                            {competition.description}
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="mb-4 space-y-2">
                          {/* Dates */}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
                          </div>

                          {/* Countdown */}
                          {!isEnded && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                              <CountdownTimer endDate={endDate} />
                            </div>
                          )}

                          {/* Participants */}
                          <div className="flex items-center gap-2 text-xs text-emerald-400/80">
                            <Users className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium">
                              <AnimatedCounter value={participantCount} duration={1} /> participants
                            </span>
                          </div>

                          {/* Rules summary */}
                          {metric && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                              <span className="capitalize">
                                {metric.replace(/_/g, ' ')}
                                {aggregation ? ` (${aggregation})` : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Prize badges */}
                        {competition.prize_metadata?.badges && competition.prize_metadata.badges.length > 0 && (
                          <div className="mb-4 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
                            <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            {competition.prize_metadata.badges.slice(0, 3).map((badge, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 border-t border-white/5 pt-4">
                          {joined ? (
                            <>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCompetitionId(competition.id);
                                }}
                                className="flex-1 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/20 h-9 text-xs"
                              >
                                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                                View Leaderboard
                                <ChevronRight className="ml-1 h-3 w-3 opacity-50" />
                              </Button>
                              <Button
                                onClick={(e) => handleLeave(competition.id, e)}
                                disabled={leaving === competition.id}
                                variant="outline"
                                className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 h-9 w-9 p-0 shrink-0"
                                aria-label="Leave competition"
                              >
                                {leaving === competition.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={(e) => handleJoinClick(competition, e)}
                              disabled={joining === competition.id || isEnded}
                              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:shadow-none h-9 text-xs font-semibold"
                            >
                              {joining === competition.id ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  Joining...
                                </>
                              ) : isEnded ? (
                                <>
                                  <Archive className="mr-1.5 h-3.5 w-3.5" />
                                  Competition Ended
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                  Join Competition
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* JOIN MODAL                                                        */}
        {/* ================================================================= */}
        {competitionForJoin && (
          <JoinCompetitionModal
            open={joinModalOpen}
            onOpenChange={setJoinModalOpen}
            competition={competitionForJoin}
            participantCount={(competitionForJoin as CompetitionWithMeta).participant_count ?? 0}
            onConfirm={handleJoinConfirm}
            isLoading={joining === competitionForJoin.id}
          />
        )}

        {/* ================================================================= */}
        {/* COMPETITION DETAIL OVERLAY (DIALOG)                               */}
        {/* ================================================================= */}
        <AnimatePresence>
          {selectedCompetition && (
            <Dialog
              open={!!selectedCompetition}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedCompetitionId(null);
                  setIsFullscreen(false);
                }
              }}
            >
              <DialogContent
                className={cn(
                  'bg-gray-950 border-white/10 p-0 gap-0 overflow-hidden overflow-y-auto transition-all duration-300',
                  isFullscreen
                    ? 'max-w-full w-full h-full max-h-full rounded-none'
                    : 'max-w-3xl max-h-[90vh]',
                )}
                showCloseButton={false}
              >
                <DialogTitle className="sr-only">Competition Details</DialogTitle>
                {/* Custom header with fullscreen + close buttons */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-gray-950/90 backdrop-blur-xl px-6 py-3">
                  <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-emerald-400" />
                    Competition Details
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsFullscreen((f) => !f)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedCompetitionId(null)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      aria-label="Close competition details"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <CompetitionDetailView
                    competition={selectedCompetition}
                    userEntry={buildUserEntry(selectedCompetition)}
                    currentUserId={user?.id}
                    onJoin={(id) => {
                      setOptimisticJoins((prev) => new Set(prev).add(id));
                      refetch();
                    }}
                    onLeave={(id) => {
                      setOptimisticLeaves((prev) => new Set(prev).add(id));
                      refetch();
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>

      {/* Inline keyframe for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </ErrorBoundary>
  );
}
