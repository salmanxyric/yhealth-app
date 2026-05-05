'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Compass, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { LifeAreasDashboardSummary } from '@/app/(pages)/life-areas/types';
import { DashboardCard } from './DashboardCard';

export function LifeAreasOverviewWidget() {
  const [summary, setSummary] = useState<LifeAreasDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<LifeAreasDashboardSummary>('/life-areas/summary');
      if (res.success && res.data) setSummary(res.data);
      else setSummary(null);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const preview = summary?.areas.slice(0, 3) ?? [];

  return (
    <DashboardCard accent="violet" padding="md">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-violet-300" />
          <h3 className="text-sm font-semibold text-white">Life areas</h3>
        </div>
        {loading ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin" /> : null}
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Career, relationships, creativity, and more — linked to your coach and schedule.
      </p>
      {preview.length === 0 && !loading ? (
        <p className="text-xs text-slate-400">No active areas yet. Chat with the coach about any goal to create one.</p>
      ) : (
        <ul className="space-y-2 mb-3">
          {preview.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-xs text-slate-300 gap-2">
              <span className="truncate font-medium">{a.display_name}</span>
              <span className="text-slate-500 tabular-nums shrink-0">{a.link_count}</span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/life-areas"
        className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200 transition"
      >
        Manage
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </DashboardCard>
  );
}
