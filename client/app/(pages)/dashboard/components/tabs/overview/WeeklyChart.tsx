'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import type { WeeklyActivityData } from './types';

export type ActivityPeriod = 'current' | 'last' | 'month' | 'year' | 'lifetime';

interface WeeklyChartProps {
  weeklyActivity: WeeklyActivityData | null;
  selectedWeek: ActivityPeriod;
  onWeekChange: (week: ActivityPeriod) => void;
}

const periodLabels: Record<ActivityPeriod, string> = {
  current: 'This Week',
  last: 'Last Week',
  month: 'This Month',
  year: 'This Year',
  lifetime: 'All Time',
};

// Premium Bar Component
function PremiumBar({
  day,
  height,
  isToday,
  completed,
  total,
  index,
  isHovered,
  onHover,
}: {
  day: string;
  height: number;
  isToday: boolean;
  completed: number;
  total: number;
  index: number;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}) {
  // Ensure height is between 0 and 100
  const normalizedHeight = Math.min(100, Math.max(0, height));
  
  // Color based on completion rate
  const getBarColor = () => {
    if (isToday) return 'from-blue-500 via-cyan-400 to-purple-500';
    if (normalizedHeight >= 70) return 'from-emerald-500 via-green-400 to-teal-500';
    if (normalizedHeight >= 40) return 'from-amber-500 via-yellow-400 to-orange-500';
    if (normalizedHeight > 0) return 'from-orange-500 via-amber-400 to-yellow-500';
    return 'from-slate-700 via-slate-600 to-slate-500';
  };

  const getGlowColor = () => {
    if (isToday) return 'shadow-blue-500/40';
    if (normalizedHeight >= 70) return 'shadow-emerald-500/40';
    if (normalizedHeight >= 40) return 'shadow-amber-500/40';
    return 'shadow-slate-500/20';
  };
  
  // Minimum bar height for visibility (when there's data)
  const displayHeight = total > 0 ? Math.max(normalizedHeight, 3) : 0;

  return (
    <motion.div
      className="flex-1 flex flex-col items-center gap-2 min-w-[40px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap"
          >
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/95 border border-white/10 shadow-xl backdrop-blur-sm">
              <span className="text-xs font-medium text-white">{completed}/{total}</span>
              <span className="text-xs text-slate-400 ml-1">({Math.round(height)}%)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bar container - reduced height */}
      <div className="relative w-full h-24 flex items-end justify-center">
        {/* Background track */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-800/30 rounded-t-lg" />
        
        {/* Animated bar - grows from bottom to top */}
        <motion.div
          className={`
            relative w-full max-w-8 rounded-t-md
            bg-gradient-to-t ${getBarColor()}
            transition-shadow duration-300
            ${isHovered ? `shadow-lg ${getGlowColor()}` : ''}
            ${isToday ? 'ring-2 ring-blue-500/50' : ''}
          `}
          initial={{ height: 0 }}
          animate={{ height: `${displayHeight}%` }}
          transition={{ 
            delay: 0.3 + index * 0.1, 
            duration: 0.8, 
            ease: [0.4, 0, 0.2, 1] 
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-t-lg"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 3,
              ease: 'linear',
              delay: index * 0.2
            }}
          />
          
          {/* Top highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 rounded-t-lg" />
        </motion.div>

        {/* Completion indicator dots */}
        {total > 0 && (
          <div className="absolute -top-6 flex gap-0.5">
            {Array.from({ length: Math.min(total, 5) }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < completed ? 'bg-emerald-400' : 'bg-slate-600'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 + i * 0.05 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Day label */}
      <motion.span
        className={`
          text-xs font-medium transition-colors
          ${isToday ? 'text-blue-400' : 'text-slate-500'}
          ${isHovered ? 'text-white' : ''}
        `}
        animate={{ y: isHovered ? -2 : 0 }}
      >
        {day}
      </motion.span>
    </motion.div>
  );
}

// Week selector dropdown
function WeekSelector({
  selected,
  onChange,
}: {
  selected: ActivityPeriod;
  onChange: (week: ActivityPeriod) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const periods: ActivityPeriod[] = ['current', 'last', 'month', 'year', 'lifetime'];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        <span>{periodLabels[selected]}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-40 rounded-xl bg-slate-800/95 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden z-20"
            >
              {periods.map((period) => (
                <motion.button
                  key={period}
                  onClick={() => {
                    onChange(period);
                    setIsOpen(false);
                  }}
                  whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm transition-colors
                    ${selected === period ? 'text-emerald-400 bg-white/5' : 'text-slate-300 hover:text-white'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{periodLabels[period]}</span>
                    {selected === period && (
                      <motion.div
                        layoutId="selectedIndicator"
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                      />
                    )}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function WeeklyChart({ weeklyActivity, selectedWeek, onWeekChange }: WeeklyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Default days if no data
  const defaultDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = weeklyActivity?.days || defaultDays.map(day => ({
    day,
    completed: 0,
    total: 0,
    completionRate: 0,
    isToday: day === 'Thu',
  }));

  const averageRate = weeklyActivity?.summary?.averageCompletionRate || 0;
  const totalCompleted = days.reduce((sum, d) => sum + d.completed, 0);
  const totalActivities = days.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30"
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </motion.div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">Weekly Activity</h2>
            <p className="text-xs text-slate-400">Your daily completion progress</p>
          </div>
        </div>
        <WeekSelector selected={selectedWeek} onChange={onWeekChange} />
      </div>

      {/* Chart */}
      <div className="relative mt-4 pt-10 ">
        {/* Grid lines - 100% at top, 0% at bottom */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[100, 75, 50, 25, 0].map((percent) => (
            <div key={percent} className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-6 text-right">{percent}%</span>
              <div className="flex-1 h-px bg-slate-800/50" />
            </div>
          ))}
        </div>

        {/* Bars container - aligned with grid */}
        <div className="flex items-end justify-between gap-2 h-32 pt-2 pb-6 px-8 ml-8">
          {days.map((day, index) => (
            <PremiumBar
              key={day.day}
              day={day.day}
              height={day.total > 0 ? day.completionRate : 0}
              isToday={day.isToday}
              completed={day.completed}
              total={day.total}
              index={index}
              isHovered={hoveredIndex === index}
              onHover={(hovered) => setHoveredIndex(hovered ? index : null)}
            />
          ))}
        </div>
      </div>

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-3 pt-3 border-t border-white/10"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                <span className="text-xs text-slate-400">High (70%+)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                <span className="text-xs text-slate-400">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
                <span className="text-xs text-slate-400">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span className="text-xs text-slate-400">No Data</span>
              </div>
            </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xl font-bold text-white">{averageRate}%</p>
              <p className="text-[10px] text-slate-400">Avg</p>
            </div>
            <motion.div
              className="p-1.5 rounded-lg bg-emerald-500/20"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </motion.div>
          </div>
        </div>

        {/* Mini stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Completed</span>
            <p className="text-base font-semibold text-white">{totalCompleted}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Activities</span>
            <p className="text-base font-semibold text-white">{totalActivities}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Success</span>
            <p className="text-base font-semibold text-emerald-400">
              {totalActivities > 0 ? Math.round((totalCompleted / totalActivities) * 100) : 0}%
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
