'use client';

import { motion } from 'framer-motion';
import type { ComponentScores } from '@/src/shared/services/leaderboard.service';

interface ScoreBreakdownBarsProps {
  scores: ComponentScores;
}

const SCORE_ITEMS = [
  { key: 'workout' as const, label: 'Workout', color: 'bg-orange-500', track: 'bg-orange-500/20' },
  { key: 'nutrition' as const, label: 'Nutrition', color: 'bg-green-500', track: 'bg-green-500/20' },
  { key: 'wellbeing' as const, label: 'Wellbeing', color: 'bg-purple-500', track: 'bg-purple-500/20' },
  { key: 'biometrics' as const, label: 'Biometrics', color: 'bg-pink-500', track: 'bg-pink-500/20' },
  { key: 'engagement' as const, label: 'Engagement', color: 'bg-blue-500', track: 'bg-blue-500/20' },
  { key: 'consistency' as const, label: 'Consistency', color: 'bg-amber-500', track: 'bg-amber-500/20' },
] as const;

export function ScoreBreakdownBars({ scores }: ScoreBreakdownBarsProps) {
  const raw = (scores ?? {}) as unknown as Record<string, number>;
  const normalizedScores = {
    workout: raw.workout ?? 0,
    nutrition: raw.nutrition ?? 0,
    wellbeing: raw.wellbeing ?? 0,
    biometrics: raw.biometrics ?? 0,
    engagement: raw.engagement ?? raw.participation ?? 0,
    consistency: raw.consistency ?? 0,
  };

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full max-w-[340px]">
      {SCORE_ITEMS.map((item, i) => {
        const value = normalizedScores[item.key] || 0;
        return (
          <div key={item.key} className="flex items-center gap-1.5" title={`${item.label}: ${value.toFixed(0)}`}>
            <span className="text-[10px] text-gray-500 w-[70px] truncate">{item.label}</span>
            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${item.track}`}>
              <motion.div
                className={`h-full rounded-full ${item.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(value, 100)}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] text-gray-400 tabular-nums w-[18px] text-right">{value.toFixed(0)}</span>
          </div>
        );
      })}
    </div>
  );
}
