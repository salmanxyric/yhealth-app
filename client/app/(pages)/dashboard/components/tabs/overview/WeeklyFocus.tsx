'use client';

import { Sparkles } from 'lucide-react';
import type { WeeklySummary } from './types';

interface WeeklyFocusProps {
  weeklySummary: WeeklySummary | null;
}

export function WeeklyFocus({ weeklySummary }: WeeklyFocusProps) {
  if (!weeklySummary?.focus) return null;

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h3 className="font-semibold text-white">This Week&apos;s Focus</h3>
      </div>

      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm font-medium text-amber-400">
            {weeklySummary.focus.theme}
          </p>
        </div>
        <p className="text-sm text-slate-400">{weeklySummary.focus.focus}</p>
        <div className="pt-2 border-t border-white/5">
          <p className="text-xs text-slate-500">Expected Outcome:</p>
          <p className="text-sm text-slate-300">
            {weeklySummary.focus.expectedOutcome}
          </p>
        </div>
      </div>
    </div>
  );
}
