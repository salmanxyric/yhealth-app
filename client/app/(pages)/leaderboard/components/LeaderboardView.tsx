'use client';

import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/use-fetch';
import { useLeaderboardSocket } from '@/hooks/use-leaderboard-socket';
import type { BoardType, TimeFilter, LeaderboardResponse } from '@/src/shared/services/leaderboard.service';
import { TopThreePodium } from './TopThreePodium';
import { LeaderboardList } from './LeaderboardList';
import { LeaderboardSkeleton } from './LeaderboardSkeleton';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface LeaderboardViewProps {
  boardType: BoardType;
  timeFilter: TimeFilter;
  date: string;
  competitionId?: string | null;
  currentUserId?: string;
}

const PAGE_SIZE = 10;

export function LeaderboardView({
  boardType,
  timeFilter,
  date,
  competitionId,
  currentUserId,
}: LeaderboardViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);

  const offset = (currentPage - 1) * PAGE_SIZE;

  const getEndpoint = () => {
    if (competitionId) {
      return `/competitions/${competitionId}/leaderboard?limit=${PAGE_SIZE}&offset=${offset}`;
    }

    const baseParams = `type=${boardType}&limit=${PAGE_SIZE}&offset=${offset}`;

    switch (timeFilter) {
      case 'daily':
        return `/leaderboards/daily?date=${date}&${baseParams}`;
      case 'weekly':
        return `/leaderboards/weekly?date=${date}&${baseParams}`;
      case 'monthly':
        return `/leaderboards/monthly?date=${date}&${baseParams}`;
      case 'all-time':
        return `/leaderboards/all-time?${baseParams}`;
      default:
        return `/leaderboards/daily?date=${date}&${baseParams}`;
    }
  };

  const endpoint = getEndpoint();

  const {
    data: fetchedData,
    isLoading,
    error,
    refetch,
  } = useFetch<LeaderboardResponse>(endpoint, {
    immediate: !!currentUserId,
    deps: [currentUserId, boardType, timeFilter, date, competitionId, currentPage]
  });

  useEffect(() => {
    if (fetchedData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLeaderboardData(fetchedData);
    }
  }, [fetchedData]);

  useLeaderboardSocket({
    userId: currentUserId,
    enabled: !!currentUserId,
    onRankUpdate: (data) => {
      if (leaderboardData && data.board_type === boardType) {
        setLeaderboardData((prev) => {
          if (!prev) return prev;
          const updatedRanks = prev.ranks.map((entry) =>
            entry.user_id === data.user_id
              ? { ...entry, rank: data.rank, total_score: data.total_score }
              : entry
          );
          updatedRanks.sort((a, b) => a.rank - b.rank);
          return { ...prev, ranks: updatedRanks };
        });
      }
    },
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [boardType, timeFilter, date, competitionId]);

  const totalItems = leaderboardData?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading && !leaderboardData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6 w-full"
      >
        <LeaderboardSkeleton variant="podium" />
        <LeaderboardSkeleton variant="list" />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center backdrop-blur-sm"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center"
        >
          <span className="text-red-400 text-2xl">⚠️</span>
        </motion.div>
        <p className="text-red-400 font-medium mb-2">Failed to load leaderboard</p>
        <p className="text-red-300/70 text-sm mb-4">{error.message}</p>
        <motion.button
          onClick={() => refetch()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-white transition-colors font-medium"
        >
          Retry
        </motion.button>
      </motion.div>
    );
  }

  if (!leaderboardData || leaderboardData.ranks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative bg-gradient-to-br from-white/5 via-white/3 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center w-full overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-purple-500/5 to-pink-500/5"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative z-10 w-20 h-20 mx-auto mb-6"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm"
          >
            <Trophy className="w-10 h-10 text-emerald-400" />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <p className="text-gray-200 text-xl font-bold mb-2">No leaderboard data available yet</p>
          <p className="text-gray-400 text-sm">Check back later when scores are calculated</p>
        </motion.div>
      </motion.div>
    );
  }

  const isFirstPage = currentPage === 1;
  const topThree = isFirstPage ? leaderboardData.ranks.slice(0, 3) : [];
  const remainingRanks = isFirstPage ? leaderboardData.ranks.slice(3) : leaderboardData.ranks;
  const listStartRank = isFirstPage ? 4 : offset + 1;

  return (
    <motion.div
      className="space-y-6 w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top 3 Podium — first page only */}
      {isFirstPage && topThree.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
          className="w-full"
        >
          <TopThreePodium entries={topThree} />
        </motion.div>
      )}

      {/* Remaining Leaderboard with pagination */}
      {remainingRanks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full"
        >
          <LeaderboardList
            entries={remainingRanks}
            startRank={listStartRank}
            total={totalItems}
            currentUserId={currentUserId}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
