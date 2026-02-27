'use client';

import { motion } from 'framer-motion';
import {
  Activity,
  Clock,
  Timer,
  CheckCircle2,
  Circle,
  ChevronRight,
  Star,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import type { TodayData, Plan } from './types';
import { activityIcons, activityColors, formatTime } from './constants';

interface TodayScheduleProps {
  todayData: TodayData | null;
  plan: Plan | null;
  onActivityComplete: (activityId: string) => void;
  onRefresh?: () => void;
}

export function TodaySchedule({
  todayData,
  plan,
  onActivityComplete,
  onRefresh,
}: TodayScheduleProps) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Today&apos;s Schedule
              </h2>
              <p className="text-sm text-slate-400">
                {todayData?.dayOfWeek
                  ? todayData.dayOfWeek.charAt(0).toUpperCase() +
                    todayData.dayOfWeek.slice(1)
                  : new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRefresh();
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <Link
              href={plan ? "/dashboard?tab=plans" : '#'}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {todayData?.isRestDay ? null : todayData?.activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={`p-4 flex items-center gap-4 transition-colors ${
              activity.status === 'completed'
                ? 'bg-green-500/5'
                : 'hover:bg-white/5'
            }`}
          >
            <div className="w-20 text-center">
              <p className="text-sm font-medium text-slate-300">
                {formatTime(activity.preferredTime)}
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                activityColors[activity.type] || 'from-slate-500 to-slate-600'
              } flex items-center justify-center text-white shadow-lg`}
            >
              {activityIcons[activity.type] || <Activity className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className={`font-medium ${
                  activity.status === 'completed'
                    ? 'text-slate-400 line-through'
                    : 'text-white'
                }`}
              >
                {activity.title}
              </h3>
              <p className="text-sm text-slate-500 truncate">
                {activity.description}
              </p>
              {activity.duration && (
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                  <Timer className="w-3 h-3" />
                  {activity.duration} min
                </div>
              )}
            </div>

            <div>
              {activity.status === 'completed' ? (
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onActivityComplete(activity.id);
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-green-500/20 flex items-center justify-center transition-colors group cursor-pointer"
                >
                  <Circle className="w-5 h-5 text-slate-400 group-hover:text-green-400" />
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {todayData?.isRestDay ? (
          <div className="p-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 animate-pulse" />
                <Sparkles className="w-10 h-10 text-purple-400 relative z-10" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Rest Day</h3>
              <p className="text-slate-400 mb-4">Take time to rest, recover, and recharge</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <span className="text-sm text-purple-300">Recovery Day</span>
              </div>
            </motion.div>
          </div>
        ) : (!todayData?.activities || todayData.activities.length === 0) ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Star className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400">No activities scheduled for today</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
