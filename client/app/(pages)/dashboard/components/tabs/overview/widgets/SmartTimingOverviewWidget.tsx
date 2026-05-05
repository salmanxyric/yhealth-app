'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Clock, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { TimingProfileStatus } from '@shared/types/domain/timing';
import { DashboardCard } from './DashboardCard';

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

export function SmartTimingOverviewWidget() {
  const [status, setStatus] = useState<TimingProfileStatus | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<TimingProfileStatus>('/timing-profile');
      if (res.success && res.data) setStatus(res.data);
    } catch {
      setStatus(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loaded) {
    return (
      <DashboardCard accent="cyan" padding="md" hoverable={false}>
        <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
      </DashboardCard>
    );
  }

  const smartOn = status && !status.manualOverride;
  const peak = status?.profile?.peakHour;
  const conf = status?.profile?.confidence ?? 0;

  return (
    <DashboardCard accent="cyan" padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 border border-teal-500/25">
            <Clock className="h-4 w-4 text-teal-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">Smart Timing</p>
            <p className="text-xs text-white/40 mt-0.5 truncate">
              {smartOn && status?.profile
                ? `Peak ${formatHour(peak!)} · ${conf >= 0.5 ? 'Confident' : conf >= 0.25 ? 'Learning' : 'Collecting data'}`
                : smartOn && !status?.profile
                  ? 'Collecting signals for your rhythm'
                  : 'Manual check-in time'}
            </p>
          </div>
        </div>
        <Sparkles className="h-4 w-4 text-teal-400/50 shrink-0 mt-0.5" aria-hidden />
      </div>
      <Link
        href="/dashboard?tab=preferences"
        className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs text-teal-200/90 hover:bg-white/[0.04] hover:border-teal-500/20 transition-colors"
      >
        <span>Adjust in Preferences</span>
        <ChevronRight className="h-4 w-4 text-white/30" />
      </Link>
    </DashboardCard>
  );
}
