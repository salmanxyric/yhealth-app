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
  Archive,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PaginationBar } from '@/components/ui/pagination-bar';

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

function CountdownPill({ endDate }: { endDate: Date }) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0 });
        return;
      }
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      });
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [endDate]);

  if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0) {
    return null;
  }

  const text = remaining.days > 0
    ? `${remaining.days}d ${remaining.hours}h left`
    : `${remaining.hours}h ${remaining.minutes}m left`;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium',
      remaining.days <= 3
        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
        : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
    )}>
      <Clock className="h-3 w-3" />
      {text}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]')}>
        <Icon className={cn('h-4 w-4', accent)} />
      </div>
      <div>
        <p className={cn('text-lg font-bold tabular-nums leading-none', accent)}>{value}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 animate-pulse"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-16 rounded bg-white/[0.06]" />
        <div className="h-5 w-20 rounded bg-white/[0.06]" />
      </div>
      <div className="h-5 w-3/4 rounded bg-white/[0.08] mb-2" />
      <div className="h-4 w-full rounded bg-white/[0.04] mb-4" />
      <div className="flex gap-3 mb-4">
        <div className="h-4 w-28 rounded bg-white/[0.04]" />
        <div className="h-4 w-24 rounded bg-white/[0.04]" />
      </div>
      <div className="h-9 w-full rounded-lg bg-white/[0.06]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function CompetitionsPageContent() {
  const { user } = useAuth();
  const router = useRouter();

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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // ---- Fetch ----
  const {
    data: competitionsData,
    isLoading,
    error: competitionsError,
    refetch,
  } = useFetch<Competition[] | { competitions: Competition[]; total: number }>('/competitions?limit=200', {
    immediate: !!user?.id,
    deps: [user?.id],
  });

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

  // ---- Joined IDs (API + optimistic) ----
  const userJoinedIds = useMemo(() => {
    const apiJoined = new Set(competitions.filter((c) => c.is_joined).map((c) => c.id));
    optimisticJoins.forEach((id) => apiJoined.add(id));
    optimisticLeaves.forEach((id) => apiJoined.delete(id));
    return apiJoined;
  }, [competitions, optimisticJoins, optimisticLeaves]);

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

  const isJoined = useCallback((id: string) => userJoinedIds.has(id), [userJoinedIds]);

  // ---- Filter & Sort ----
  const filteredCompetitions = useMemo(() => {
    let list = [...competitions];

    if (statusFilter === 'active') {
      list = list.filter((c) => c.status === 'active' && new Date(c.end_date) >= new Date());
    } else if (statusFilter === 'ended') {
      list = list.filter((c) => c.status === 'ended' || new Date(c.end_date) < new Date());
    }

    if (filterMode === 'joined') {
      list = list.filter((c) => isJoined(c.id));
    } else if (filterMode === 'ai_generated') {
      list = list.filter((c) => c.type === 'ai_generated');
    }

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

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, filterMode, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredCompetitions.length / PAGE_SIZE));
  const paginatedCompetitions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCompetitions.slice(start, start + PAGE_SIZE);
  }, [filteredCompetitions, currentPage]);

  // ---- Stats ----
  const stats = useMemo(() => {
    const total = competitions.length;
    const active = competitions.filter((c) => c.status === 'active' && new Date(c.end_date) >= new Date()).length;
    const ended = total - active;
    const totalParticipants = competitions.reduce((sum, c) => sum + (c.participant_count ?? 0), 0);
    const joinedCount = competitions.filter((c) => isJoined(c.id)).length;
    return { total, active, ended, totalParticipants, joinedCount };
  }, [competitions, isJoined]);

  const selectedCompetition = useMemo(
    () => competitions.find((c) => c.id === selectedCompetitionId) ?? null,
    [competitions, selectedCompetitionId]
  );

  // ---- Handlers ----
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
    setOptimisticJoins((prev) => new Set(prev).add(id));

    try {
      await joinCompetition(id);
      toast.success(`Joined "${competitionForJoin.name}"!`, {
        description: 'Your progress will be tracked on the leaderboard.',
        duration: 4000,
      });
      refetch();
    } catch (error) {
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
          toast.error('Not eligible', { description: error.message });
        } else {
          toast.error('Failed to join', { description: error.message });
        }
      } else {
        toast.error('Failed to join', {
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
      setOptimisticLeaves((prev) => new Set(prev).add(competitionId));

      try {
        await leaveCompetition(competitionId);
        toast.success('Left competition', { description: 'You can rejoin anytime before it ends.', duration: 3000 });
        refetch();
      } catch (error) {
        setOptimisticLeaves((prev) => {
          const next = new Set(prev);
          next.delete(competitionId);
          return next;
        });
        toast.error('Failed to leave', {
          description: error instanceof Error ? error.message : 'Please try again',
        });
      } finally {
        setLeaving(null);
      }
    },
    [refetch]
  );

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
      <div className="flex flex-col h-full min-h-screen bg-[#0a0a0f]">
        {/* ── Sticky Top Bar ── */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl px-4 sm:px-6 h-12">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Competitions</span>
            </div>
          </div>

          {/* Sort control */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3 w-3 text-slate-500" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-slate-400 focus:border-emerald-500/30 focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="participants">Most Participants</option>
              <option value="ending_soon">Ending Soon</option>
            </select>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 space-y-5">

            {/* Stats row */}
            {!isLoading && competitions.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={Target} label="Active" value={stats.active} accent="text-emerald-400" />
                <StatCard icon={Users} label="Participants" value={stats.totalParticipants} accent="text-purple-400" />
                <StatCard icon={Flame} label="Joined" value={stats.joinedCount} accent="text-amber-400" />
                <StatCard icon={Archive} label="Ended" value={stats.ended} accent="text-slate-400" />
              </div>
            )}

            {/* Filter pills */}
            {!isLoading && competitions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status filters */}
                <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.03] p-0.5 border border-white/[0.06]">
                  {([
                    { key: 'all' as StatusFilter, label: 'All' },
                    { key: 'active' as StatusFilter, label: 'Active' },
                    { key: 'ended' as StatusFilter, label: 'Ended' },
                  ]).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-all',
                        statusFilter === f.key
                          ? 'bg-white/[0.08] text-white'
                          : 'text-slate-500 hover:text-slate-300'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-white/[0.06] hidden sm:block" />

                {/* Type filters */}
                {([
                  { key: 'all' as FilterMode, label: 'All Types' },
                  { key: 'joined' as FilterMode, label: 'Joined', count: stats.joinedCount },
                  { key: 'ai_generated' as FilterMode, label: 'AI Generated' },
                ]).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterMode(f.key)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                      filterMode === f.key
                        ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                    )}
                  >
                    {f.label}
                    {'count' in f && f.count !== undefined && f.count > 0 && (
                      <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500/15 px-1 text-[10px] font-bold text-emerald-400">
                        {f.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} index={i} />
                ))}
              </div>
            )}

            {/* Error */}
            {competitionsError && !isLoading && (
              <div className="mx-auto max-w-sm rounded-xl border border-red-500/15 bg-red-500/[0.04] p-8 text-center">
                <XCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-red-300 mb-1">Failed to load competitions</p>
                <p className="text-xs text-red-400/60 mb-4">
                  {competitionsError.message || 'Something went wrong.'}
                </p>
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  size="sm"
                  className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !competitionsError && filteredCompetitions.length === 0 && (
              <div className="mx-auto max-w-sm py-16 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <Trophy className="h-7 w-7 text-slate-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-300 mb-1">
                  {filterMode === 'all' && statusFilter === 'all'
                    ? 'No competitions yet'
                    : 'No matching competitions'}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {filterMode === 'all' && statusFilter === 'all'
                    ? 'Check back later for new challenges!'
                    : 'Try adjusting your filters.'}
                </p>
                {(filterMode !== 'all' || statusFilter !== 'all') && (
                  <Button
                    onClick={() => { setFilterMode('all'); setStatusFilter('all'); }}
                    variant="outline"
                    size="sm"
                    className="border-white/10 text-slate-400 hover:bg-white/5"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}

            {/* ── Competition Cards Grid — Figma 4-col layout ── */}
            {!isLoading && !competitionsError && filteredCompetitions.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedCompetitions.map((competition, index) => {
                  const endDate = new Date(competition.end_date);
                  const startDate = new Date(competition.start_date);
                  const daysLeft = getDaysRemaining(endDate);
                  const joined = isJoined(competition.id);
                  const isEnded = competition.status === 'ended' || daysLeft === 0;
                  const participantCount = competition.participant_count ?? 0;
                  const rules = competition.rules as Record<string, unknown> | undefined;
                  const metric = rules?.metric as string | undefined;

                  return (
                    <motion.article
                      key={competition.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                      onClick={() => setSelectedCompetitionId(competition.id)}
                      className={cn(
                        'group relative cursor-pointer rounded-xl border bg-[#111827]/80 backdrop-blur-sm transition-all duration-200',
                        joined
                          ? 'border-emerald-500/25 hover:border-emerald-500/40'
                          : 'border-white/[0.06] hover:border-white/[0.12]',
                        isEnded && !joined && 'opacity-70',
                      )}
                    >
                      <div className="p-5">
                        {/* Status badges */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-3">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                            isEnded
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-emerald-500/15 text-emerald-400'
                          )}>
                            <span className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              isEnded ? 'bg-red-400' : 'bg-emerald-400'
                            )} />
                            {isEnded ? 'Ended' : 'Active'}
                          </span>

                          {competition.type === 'ai_generated' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-400">
                              <Sparkles className="h-2.5 w-2.5" />
                              AI Generated
                            </span>
                          )}

                          {joined && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300">
                              <CheckCircle className="h-2.5 w-2.5" />
                              Joined
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-[15px] font-semibold text-white leading-snug mb-1">
                          {competition.name}
                        </h3>

                        {/* Description */}
                        {competition.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                            {competition.description}
                          </p>
                        )}

                        {/* Info row — date, countdown, participants inline */}
                        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 mb-3">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {formatDate(startDate)} - {formatDate(endDate)}
                          </span>
                          {!isEnded && <CountdownPill endDate={endDate} />}
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3 shrink-0" />
                            {participantCount} Participants
                          </span>
                        </div>

                        {/* Metric type */}
                        {metric && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                            <TrendingUp className="h-3 w-3 shrink-0" />
                            <span className="capitalize">{metric.replace(/_/g, ' ')}</span>
                          </div>
                        )}

                        {/* Prize badges */}
                        {competition.prize_metadata?.badges && competition.prize_metadata.badges.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mb-4">
                            {competition.prize_metadata.badges.slice(0, 2).map((badge, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[11px] font-medium border border-amber-500/15"
                              >
                                <Award className="h-2.5 w-2.5" />
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action button */}
                        {joined ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCompetitionId(competition.id);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all"
                            >
                              <TrendingUp className="h-3.5 w-3.5" />
                              Leaderboard
                              <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                            </button>
                            <button
                              onClick={(e) => handleLeave(competition.id, e)}
                              disabled={leaving === competition.id}
                              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-red-500/15 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/25 transition-colors"
                            >
                              {leaving === competition.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleJoinClick(competition, e)}
                            disabled={joining === competition.id || isEnded}
                            className={cn(
                              'w-full flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all duration-200',
                              isEnded
                                ? 'bg-white/[0.03] text-slate-400 border border-white/[0.06]'
                                : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-500 hover:to-emerald-500 shadow-lg shadow-emerald-600/15'
                            )}
                          >
                            {joining === competition.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Joining...
                              </>
                            ) : isEnded ? (
                              'Ended'
                            ) : (
                              'Join Competition'
                            )}
                          </button>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !competitionsError && filteredCompetitions.length > 0 && (
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                total={filteredCompetitions.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                className="rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm"
              />
            )}
          </div>
        </div>

        {/* ── Join Modal ── */}
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

        {/* ── Detail Dialog ── */}
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
                  'bg-[#0a0a0f] border-white/[0.08] p-0 gap-0 overflow-hidden overflow-y-auto transition-all duration-300',
                  isFullscreen
                    ? 'max-w-full w-full h-full max-h-full rounded-none'
                    : 'max-w-3xl max-h-[90vh]',
                )}
                showCloseButton={false}
              >
                <DialogTitle className="sr-only">Competition Details</DialogTitle>
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-xl px-5 py-2.5">
                  <h2 className="text-xs font-semibold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                    <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                    Competition Details
                  </h2>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setIsFullscreen((f) => !f)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => setSelectedCompetitionId(null)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-5">
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
    </ErrorBoundary>
  );
}
