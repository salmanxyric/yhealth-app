'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import type { WeeklyActivityData } from './types';

export type ActivityPeriod = 'current' | 'last' | 'month' | 'year' | 'lifetime';

interface WeeklyChartProps {
  weeklyActivity: WeeklyActivityData | null;
  selectedWeek: ActivityPeriod;
  onWeekChange: (week: ActivityPeriod) => void;
}

export function WeeklyChart({ weeklyActivity, selectedWeek, onWeekChange }: WeeklyChartProps) {
  const periodLabels: Record<ActivityPeriod, string> = {
    current: 'Weekly Activity',
    last: 'Weekly Activity',
    month: 'Monthly Activity',
    year: 'Yearly Activity',
    lifetime: 'Lifetime Activity',
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">{periodLabels[selectedWeek]}</h2>
        </div>
        <select
          value={selectedWeek}
          onChange={(e) => onWeekChange(e.target.value as ActivityPeriod)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-300 outline-none cursor-pointer hover:bg-white/10 transition-colors"
        >
          <option value="current">This Week</option>
          <option value="last">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
          <option value="lifetime">Lifetime</option>
        </select>
      </div>

      <div className="flex items-end justify-between gap-2 h-40">
        {weeklyActivity?.days ? (
          weeklyActivity.days.map((day, i) => {
            const height = day.total > 0 ? day.completionRate : 0;
            return (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full h-32 flex items-end justify-center">
                  <motion.div
                    className={`w-full max-w-8 rounded-t-lg ${
                      day.isToday
                        ? 'bg-gradient-to-t from-blue-500 to-purple-500'
                        : day.completionRate >= 70
                        ? 'bg-gradient-to-t from-green-600 to-emerald-500'
                        : day.completionRate >= 40
                        ? 'bg-gradient-to-t from-amber-600 to-amber-500'
                        : 'bg-gradient-to-t from-slate-700 to-slate-600'
                    }`}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 5)}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  />
                  {day.total > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-500">
                      {day.completed}/{day.total}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs ${
                    day.isToday ? 'text-blue-400 font-medium' : 'text-slate-500'
                  }`}
                >
                  {day.day}
                </span>
              </div>
            );
          })
        ) : (
          // Fallback skeleton
          ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                className="w-full max-w-8 rounded-t-lg bg-slate-700/50"
                initial={{ height: 0 }}
                animate={{ height: '20%' }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              />
              <span className="text-xs text-slate-500">{day}</span>
            </div>
          ))
        )}
      </div>

      {weeklyActivity?.summary && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
          <span className="text-slate-400">Average Completion</span>
          <span className="text-white font-medium">
            {weeklyActivity.summary.averageCompletionRate}%
          </span>
        </div>
      )}
    </div>
  );
}
