'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertCircle, Compass, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { DashboardCard } from './DashboardCard';

type Summary = {
  obstacleCount: number;
  reconnectionCount: number;
  firstObstacleId: string | null;
};

/**
 * Compact Overview reminder when obstacles or goal reconnections are open.
 * Full actions stay on the main dashboard cards.
 */
export function ProactiveCoachOverviewWidget() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [obRes, rcRes] = await Promise.all([
        api.get<{ obstacles: { id: string }[] }>('/obstacles'),
        api.get<{ reconnections: { id: string }[] }>('/reconnections'),
      ]);
      const obstacles = obRes.data?.obstacles ?? [];
      const reconnections = rcRes.data?.reconnections ?? [];
      setSummary({
        obstacleCount: obstacles.length,
        reconnectionCount: reconnections.length,
        firstObstacleId: obstacles[0]?.id ?? null,
      });
    } catch {
      setSummary({ obstacleCount: 0, reconnectionCount: 0, firstObstacleId: null });
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!hasLoaded) return null;
  if (!summary || (summary.obstacleCount === 0 && summary.reconnectionCount === 0)) return null;

  return (
    <DashboardCard accent="orange" padding="md" hoverable={false}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/15 border border-orange-500/25">
          <AlertCircle className="w-5 h-5 text-orange-200" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="text-xs font-medium uppercase tracking-wider text-orange-200/90">Coach attention</div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {summary.obstacleCount > 0 && (
              <>
                {summary.obstacleCount === 1
                  ? 'One goal may need a quick obstacle check-in.'
                  : `${summary.obstacleCount} goals may need obstacle check-ins.`}{' '}
              </>
            )}
            {summary.reconnectionCount > 0 && (
              <>
                {summary.reconnectionCount === 1
                  ? 'One life goal is asking for reconnection.'
                  : `${summary.reconnectionCount} life goals are asking for reconnection.`}
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {summary.firstObstacleId && (
              <Link
                href={`/ai-coach?obstacleId=${encodeURIComponent(summary.firstObstacleId)}`}
                className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-600 hover:brightness-110 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Open diagnosis
              </Link>
            )}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-100 bg-indigo-500/20 border border-indigo-400/30 hover:bg-indigo-500/30 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              Dashboard actions
            </Link>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
