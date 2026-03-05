'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  Flame,
  Droplets,
  Utensils,
  Moon,
  Sun,
  Dumbbell,
  Brain,
  Heart,
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

// Activity type icons mapping
const activityTypeIcons: Record<string, React.ElementType> = {
  workout: Dumbbell,
  exercise: Activity,
  meal: Utensils,
  nutrition: Utensils,
  water: Droplets,
  sleep: Moon,
  rest: Moon,
  meditation: Brain,
  mindfulness: Brain,
  cardio: Heart,
  morning: Sun,
};

// Activity type colors mapping
const activityTypeColors: Record<string, { bg: string; border: string; glow: string }> = {
  workout: { bg: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
  exercise: { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  meal: { bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30', glow: 'shadow-green-500/20' },
  nutrition: { bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30', glow: 'shadow-green-500/20' },
  water: { bg: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20' },
  sleep: { bg: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
  rest: { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
  meditation: { bg: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30', glow: 'shadow-pink-500/20' },
  default: { bg: 'from-slate-500/20 to-slate-600/20', border: 'border-slate-500/30', glow: 'shadow-slate-500/20' },
};

// Render icon helper
function renderIcon(iconSource: unknown, className: string): React.ReactNode {
  // Check if it's a valid React element (already rendered JSX)
  if (
    typeof iconSource === 'object' &&
    iconSource !== null &&
    '$$typeof' in iconSource &&
    // Check if it has props (indicating it's a React element, not a component)
    'props' in iconSource
  ) {
    // It's already a JSX element - clone with new className
    return React.cloneElement(iconSource as React.ReactElement<{ className?: string }>, { className });
  }
  
  // Check if it's a React component (function or forwardRef/memo object)
  if (
    typeof iconSource === 'function' ||
    (typeof iconSource === 'object' &&
      iconSource !== null &&
      // Components can have $$typeof but won't have props
      ('$$typeof' in iconSource || 'render' in iconSource))
  ) {
    // It's a component - render it
    const IconComponent = iconSource as React.ComponentType<{ className?: string }>;
    return <IconComponent className={className} />;
  }
  
  // Fallback
  return iconSource as React.ReactNode;
}

// Premium Activity Card Component
function ActivityCard({
  activity,
  index,
  onComplete,
  isExpanded,
  onToggle,
  isCurrent,
}: {
  activity: {
    id: string;
    type: string;
    title: string;
    description: string;
    preferredTime: string;
    duration?: number;
    status: string;
  };
  index: number;
  onComplete: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  isCurrent: boolean;
}) {
  const iconSource = activityTypeIcons[activity.type] || activityIcons[activity.type] || Activity;
  const colors = activityTypeColors[activity.type] || activityTypeColors.default;
  const isCompleted = activity.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      className="relative"
    >
      {/* Timeline connector */}
      <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gradient-to-b from-slate-700 to-transparent" />

      <motion.div
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onToggle}
        className={`
          relative flex items-start gap-4 p-4 rounded-2xl
          bg-gradient-to-br ${colors.bg} ${colors.border}
          border backdrop-blur-sm
          transition-all duration-300
          ${isCompleted ? 'opacity-60' : 'hover:shadow-lg hover:' + colors.glow}
          ${isCurrent ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20' : ''}
        `}
      >
        {/* Time indicator */}
        <div className="flex flex-col items-center gap-1">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            bg-gradient-to-br ${activityColors[activity.type] || 'from-slate-500 to-slate-600'}
            shadow-lg
            ${isCurrent ? 'animate-pulse' : ''}
          `}>
            {renderIcon(iconSource, "w-5 h-5 text-white")}
          </div>
          {isCurrent && (
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className={`font-semibold text-base ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                {activity.title}
              </h3>
              <p className="text-sm text-slate-400 truncate mt-0.5">{activity.description}</p>
              
              {/* Meta info */}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(activity.preferredTime)}
                </span>
                {activity.duration && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {activity.duration} min
                  </span>
                )}
              </div>
            </div>

            {/* Complete button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300
                ${isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-white/10 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                }
              `}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 mt-3 border-t border-white/10">
                  <p className="text-sm text-slate-400">
                    Complete this activity to maintain your streak and earn XP points.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expand indicator */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-slate-500"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function TodaySchedule({
  todayData,
  plan,
  onActivityComplete,
  onRefresh,
}: TodayScheduleProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Determine current activity based on time
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const getCurrentActivityIndex = () => {
    if (!todayData?.activities) return -1;
    return todayData.activities.findIndex((activity) => {
      const [hour, minute] = activity.preferredTime.split(':').map(Number);
      const activityTime = hour * 60 + minute;
      const currentTime = currentHour * 60 + currentMinute;
      return Math.abs(activityTime - currentTime) <= 30 && activity.status !== 'completed';
    });
  };

  const currentActivityIndex = getCurrentActivityIndex();

  return (
    <div className="p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Clock className="w-5 h-5 text-blue-400" />
          </motion.div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Today&apos;s Schedule</h2>
            <p className="text-sm text-slate-400">
              {todayData?.dayOfWeek
                ? todayData.dayOfWeek.charAt(0).toUpperCase() + todayData.dayOfWeek.slice(1)
                : new Date().toLocaleDateString('en-US', { weekday: 'long' })}
              , {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <motion.button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRefresh();
              }}
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
          )}
          <Link
            href={plan ? "/dashboard?tab=plans" : '#'}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Activities List or Rest Day */}
      <div className="space-y-3">
        {todayData?.isRestDay ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden"
          >
            <div className="p-8 text-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Sparkles className="w-10 h-10 text-purple-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">Rest Day</h3>
              <p className="text-slate-400 mb-4">Take time to rest, recover, and recharge</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Moon className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">Recovery Day</span>
              </div>
            </div>
          </motion.div>
        ) : todayData?.activities && todayData.activities.length > 0 ? (
          todayData.activities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              index={index}
              onComplete={() => onActivityComplete(activity.id)}
              isExpanded={expandedId === activity.id}
              onToggle={() => setExpandedId(expandedId === activity.id ? null : activity.id)}
              isCurrent={index === currentActivityIndex}
            />
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 text-center rounded-2xl bg-white/5 border border-white/10"
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <Star className="w-8 h-8 text-slate-600" />
            </motion.div>
            <p className="text-slate-400 mb-2">No activities scheduled for today</p>
            <Link
              href="/dashboard?tab=plans"
              className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Create a plan
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}
      </div>

      {/* Progress summary */}
      {todayData?.activities && todayData.activities.length > 0 && !todayData.isRestDay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 pt-6 border-t border-white/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {todayData.activities.slice(0, 3).map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-900
                      ${activity.status === 'completed' ? 'bg-emerald-500/30' : 'bg-slate-700'}
                    `}
                  >
                    {activity.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500" />
                    )}
                  </motion.div>
                ))}
                {todayData.activities.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-900 text-xs text-slate-400">
                    +{todayData.activities.length - 3}
                  </div>
                )}
              </div>
              <span className="text-sm text-slate-400">
                {todayData.completedCount} of {todayData.totalCount} completed
              </span>
            </div>
            
            {/* Mini progress bar */}
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-slate-700 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(todayData.completedCount / todayData.totalCount) * 100}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </div>
              <span className="text-sm font-medium text-white">
                {Math.round((todayData.completedCount / todayData.totalCount) * 100)}%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
