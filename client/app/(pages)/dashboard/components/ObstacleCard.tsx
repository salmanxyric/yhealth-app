'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MessageCircle, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { DashboardCard } from './tabs/overview/widgets/DashboardCard';

interface Obstacle {
  id: string;
  goalRefType: 'life_goal' | 'user_goal' | 'daily_intention';
  goalRefId: string;
  goalTitle: string;
  missCountLast7d: number;
  createdAt: string;
}

interface ListResponse {
  obstacles: Obstacle[];
}

export function ObstacleCard() {
  const router = useRouter();
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const resp = await api.get<ListResponse>('/obstacles');
      if (resp.success && resp.data?.obstacles) setObstacles(resp.data.obstacles);
      else setObstacles(resp.data?.obstacles ?? []);
    } catch (err) {
      console.error('[ObstacleCard] load failed', err);
      setObstacles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpen = (obstacle: Obstacle) => {
    router.push(`/ai-coach?obstacleId=${encodeURIComponent(obstacle.id)}`);
  };

  const handleDismiss = async (obstacleId: string) => {
    setDismissingId(obstacleId);
    try {
      await api.post(`/obstacles/${obstacleId}/dismiss`);
      setObstacles((prev) => prev.filter((o) => o.id !== obstacleId));
    } catch (err) {
      console.error('[ObstacleCard] dismiss failed', err);
    } finally {
      setDismissingId(null);
    }
  };

  if (loading || obstacles.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {obstacles.map((o) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <DashboardCard accent="orange" padding="md" hoverable={false} className="relative">
              <button
                type="button"
                onClick={() => handleDismiss(o.id)}
                disabled={dismissingId === o.id}
                aria-label="Dismiss"
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors z-20"
              >
                {dismissingId === o.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                ) : (
                  <X className="w-4 h-4 text-white/60" />
                )}
              </button>

              <div className="flex items-start gap-3 pr-10">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/15 border border-orange-500/25">
                  <AlertCircle className="w-5 h-5 text-orange-300" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium uppercase tracking-wider text-orange-300/90 mb-1">
                    Let&apos;s figure this out
                  </div>
                  <div className="text-sm font-semibold text-white mb-1 truncate">{o.goalTitle}</div>
                  <div className="text-xs text-slate-400 mb-3">
                    Missed {o.missCountLast7d} times in the last 7 days. What&apos;s really blocking you?
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpen(o)}
                    className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-600 hover:brightness-110 transition-all shadow-lg shadow-orange-900/20"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Open diagnosis
                  </button>
                </div>
              </div>
            </DashboardCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ObstacleCard;
