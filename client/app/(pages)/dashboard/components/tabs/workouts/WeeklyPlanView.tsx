"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  TrendingUp,
  AlertCircle,
  Clock,
  Flame,
  Zap,
  Target,
  Award,
} from "lucide-react";
import {
  WeekPlan,
  DayWorkout,
  WeekSummary,
  WORKOUT_TYPE_COLORS,
  DAY_FULL_LABELS,
} from "./types";
import { CircularProgress, MiniCircularProgress } from "./CircularProgress";

interface WeeklyPlanViewProps {
  planName: string;
  durationWeeks: number;
  currentWeek: number;
  weeks?: Record<string, WeekPlan>;
  weeklySchedule?: Record<string, DayWorkout | null>;
  weeksSummary?: WeekSummary[];
  dailyProgress?: Record<string, number>; // day -> percentage or week_day -> percentage
  onWeekChange?: (weekNumber: number) => void;
  onDayClick?: (dayOfWeek: string, workout: DayWorkout) => void;
  startDate?: string; // YYYY-MM-DD — plan start date for computing calendar dates
}

const DAYS_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyPlanView({
  planName,
  durationWeeks,
  currentWeek,
  weeks,
  weeklySchedule,
  weeksSummary,
  dailyProgress = {},
  onWeekChange,
  onDayClick,
  startDate,
}: WeeklyPlanViewProps) {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  // Sync selectedWeek when currentWeek changes (e.g., from async plan data)
  useEffect(() => {
    setSelectedWeek(currentWeek);
  }, [currentWeek]);

  const handleWeekChange = (week: number) => {
    setSelectedWeek(week);
    onWeekChange?.(week);
  };

  const goToPreviousWeek = () => {
    if (selectedWeek > 1) handleWeekChange(selectedWeek - 1);
  };

  const goToNextWeek = () => {
    if (selectedWeek < durationWeeks) handleWeekChange(selectedWeek + 1);
  };

  // Get the selected week's plan
  const weekPlan = weeks?.[`week_${selectedWeek}`];
  const weekDays = weekPlan?.days || weeklySchedule || {};
  const weekMultiplier = weekPlan?.multiplier || 1.0;
  const isDeloadWeek = weekPlan?.isDeloadWeek || false;
  const weekSummary = weeksSummary?.find(w => w.weekNumber === selectedWeek);

  // Get progress percentage for a day
  // First try week-specific key (week_1_monday), then generic day name, then 0
  const getDayProgress = (day: string): number => {
    // Try week-specific key first (e.g., "week_1_monday")
    const weekSpecificKey = `week_${selectedWeek}_${day}`;
    if (dailyProgress[weekSpecificKey] !== undefined) {
      return dailyProgress[weekSpecificKey];
    }
    // Fallback to generic day name (for backward compatibility)
    return dailyProgress[day] || 0;
  };

  // Calculate week progress
  const calculateWeekProgress = () => {
    let totalProgress = 0;
    let workoutDays = 0;
    DAYS_ORDER.forEach(day => {
      if (weekDays[day]) {
        workoutDays++;
        // Use getDayProgress which handles week-specific keys
        const progress = getDayProgress(day);
        totalProgress += progress;
      }
    });
    return workoutDays > 0 ? totalProgress / workoutDays : 0;
  };

  const weekProgress = calculateWeekProgress();

  // Calculate completion for a specific week from dailyProgress (for week pills)
  const getWeekCompletionFromProgress = (week: number): number => {
    const weekDaysForWeek = weeks?.[`week_${week}`]?.days || (week === selectedWeek ? weekDays : {});
    let total = 0;
    let sum = 0;
    DAYS_ORDER.forEach(day => {
      if (weekDaysForWeek[day]) {
        total++;
        const key = `week_${week}_${day}`;
        sum += (dailyProgress[key] ?? 0);
      }
    });
    return total > 0 ? sum / total : 0;
  };

  const getWorkoutColor = (workout?: DayWorkout | null) => {
    if (!workout) return WORKOUT_TYPE_COLORS.rest;
    const workoutType = workout.focusArea?.toLowerCase() || workout.workoutName?.toLowerCase() || "full body";
    return WORKOUT_TYPE_COLORS[workoutType] || WORKOUT_TYPE_COLORS["full body"];
  };

  // Format a Date object as YYYY-MM-DD in local timezone (avoids UTC shift from toISOString)
  const toLocalDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Compute the calendar date for a given day of the selected week
  const getDayDate = (dayIndex: number): string | null => {
    // First check if the DayWorkout itself has a scheduledDate (from server JSONB)
    const dayName = DAYS_ORDER[dayIndex];
    const workout = weekDays[dayName];
    if (workout?.scheduledDate) {
      // Adjust for selected week offset from week 1
      if (selectedWeek === 1) return workout.scheduledDate;
      // For later weeks, add (selectedWeek - 1) * 7 days
      const baseDate = new Date(workout.scheduledDate + 'T00:00:00');
      baseDate.setDate(baseDate.getDate() + (selectedWeek - 1) * 7);
      return toLocalDateStr(baseDate);
    }

    // Fallback: compute from plan startDate
    if (!startDate) return null;
    const planStart = new Date(startDate + 'T00:00:00');
    const dow = planStart.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(planStart);
    monday.setDate(planStart.getDate() + mondayOffset);
    // Add week offset + day offset
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (selectedWeek - 1) * 7 + dayIndex);
    return toLocalDateStr(targetDate);
  };

  // Format date string as "Mar 2" style
  const formatShortDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Week Header with Progress */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 p-4 sm:p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 break-words">{planName}</h2>
            <p className="text-sm sm:text-base text-slate-400">
              Week {selectedWeek} of {durationWeeks}
              {isDeloadWeek && <span className="ml-2 text-amber-400">• Deload Week</span>}
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Week Progress */}
            <div className="text-center flex-shrink-0">
              <CircularProgress
                percentage={weekProgress}
                size={70}
                strokeWidth={8}
                labelSize="lg"
              />
              <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">Week Progress</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 sm:gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToPreviousWeek}
                disabled={selectedWeek <= 1}
                className="p-2 sm:p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
              <span className="px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-lg font-bold text-white bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30 whitespace-nowrap">
                Week {selectedWeek}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToNextWeek}
                disabled={selectedWeek >= durationWeeks}
                className="p-2 sm:p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Week Pills */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: durationWeeks }, (_, i) => i + 1).map((week) => {
            const summary = weeksSummary?.find(w => w.weekNumber === week);
            const isSelected = week === selectedWeek;
            const isCurrent = week === currentWeek;
            const isDeload = summary?.isDeloadWeek || weeks?.[`week_${week}`]?.isDeloadWeek;
            // Use weeksSummary if available, otherwise compute from dailyProgress
            const completion = summary?.completionRate ?? (getWeekCompletionFromProgress(week) / 100);

            return (
              <motion.button
                key={week}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleWeekChange(week)}
                className={`
                  flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all
                  ${isSelected
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20"
                    : isCurrent
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : isDeload
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                  }
                `}
              >
                <span>W{week}</span>
                <MiniCircularProgress percentage={completion * 100} size={24} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Daily Progress Overview */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-3 sm:p-5 backdrop-blur-xl">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Daily Progress</h3>
        <div className="grid grid-cols-7 gap-1 sm:gap-3">
          {DAYS_ORDER.map((day, index) => {
            const workout = weekDays[day];
            const progress = getDayProgress(day);
            const isRestDay = !workout;
            const dayDate = getDayDate(index);

            return (
              <div key={day} className="text-center min-w-0">
                <p className="text-[9px] sm:text-xs text-slate-500 mb-0.5 sm:mb-1 uppercase tracking-wider">{DAY_SHORT[index]}</p>
                {dayDate && (
                  <p className="text-[8px] sm:text-[10px] text-slate-600 mb-0.5 sm:mb-1 truncate">{formatShortDate(dayDate)}</p>
                )}
                {isRestDay ? (
                  <div className="w-8 h-8 sm:w-11 sm:h-11 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center">
                    <span className="text-[8px] sm:text-xs text-slate-500">Rest</span>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="hidden sm:block">
                      <CircularProgress
                        percentage={progress}
                        size={44}
                        strokeWidth={4}
                        labelSize="sm"
                      />
                    </div>
                    <div className="sm:hidden">
                      <MiniCircularProgress
                        percentage={progress}
                        size={32}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Info Banner */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Progressive Overload Indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm text-slate-300">
            Load: <span className="font-bold text-white">{Math.round(weekMultiplier * 100)}%</span>
          </span>
        </div>

        {/* Deload Warning */}
        {isDeloadWeek && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="text-xs sm:text-sm text-amber-400 font-medium">Deload Week</span>
          </div>
        )}

        {/* Current Week Indicator */}
        {selectedWeek === currentWeek && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            <span className="text-xs sm:text-sm text-emerald-400 font-medium">Current Week</span>
          </div>
        )}

        {/* Week Stats */}
        {weekSummary && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <span className="text-xs sm:text-sm text-slate-300">
              Completed: <span className="font-bold text-white">{Math.round(weekSummary.completionRate * 100)}%</span>
            </span>
          </div>
        )}
      </div>

      {/* Daily Workouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <AnimatePresence mode="wait">
          {DAYS_ORDER.map((day, index) => {
            const workout = weekDays[day];
            const color = getWorkoutColor(workout);
            const isRestDay = !workout;
            const progress = getDayProgress(day);
            const dayDate = getDayDate(index);

            return (
              <motion.div
                key={`${selectedWeek}-${day}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => workout && onDayClick?.(day, workout)}
                className={`
                  relative p-4 sm:p-5 rounded-2xl border transition-all overflow-hidden
                  ${workout
                    ? `${color.bg} ${color.border} cursor-pointer hover:scale-[1.02] hover:shadow-lg`
                    : "bg-slate-800/30 border-slate-700/30 cursor-pointer hover:bg-slate-800/50"
                  }
                `}
              >
                {/* Gradient overlay */}
                {workout && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                )}

                {/* Day Header */}
                <div className="flex items-center justify-between mb-3 sm:mb-4 relative">
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">
                      {DAY_FULL_LABELS[day]}
                    </span>
                    {dayDate && (
                      <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-slate-500">{formatShortDate(dayDate)}</span>
                    )}
                  </div>
                  {isRestDay ? (
                    <span className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs bg-slate-700/50 text-slate-400 rounded-lg font-medium flex-shrink-0">
                      Rest Day
                    </span>
                  ) : (
                    <div className="flex-shrink-0">
                      <CircularProgress
                        percentage={progress}
                        size={40}
                        strokeWidth={4}
                        labelSize="sm"
                      />
                    </div>
                  )}
                </div>

                {workout ? (
                  <div className="relative">
                    {/* Workout Name */}
                    <h4 className={`text-base sm:text-lg font-bold ${color.text} mb-1 sm:mb-2 break-words`}>
                      {workout.workoutName}
                    </h4>

                    {/* Focus Area */}
                    <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
                      {workout.focusArea}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <div className="text-center p-1.5 sm:p-2 bg-black/20 rounded-lg">
                        <Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1 text-slate-400" />
                        <span className="text-[10px] sm:text-xs text-white font-bold">{workout.exercises?.length || 0}</span>
                        <p className="text-[9px] sm:text-[10px] text-slate-500">exercises</p>
                      </div>
                      <div className="text-center p-1.5 sm:p-2 bg-black/20 rounded-lg">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1 text-slate-400" />
                        <span className="text-[10px] sm:text-xs text-white font-bold">{workout.estimatedDuration}</span>
                        <p className="text-[9px] sm:text-[10px] text-slate-500">min</p>
                      </div>
                      <div className="text-center p-1.5 sm:p-2 bg-black/20 rounded-lg">
                        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5 sm:mb-1 text-slate-400" />
                        <span className="text-[10px] sm:text-xs text-white font-bold">{workout.estimatedCalories}</span>
                        <p className="text-[9px] sm:text-[10px] text-slate-500">cal</p>
                      </div>
                    </div>

                    {/* Progressive Overload Badge */}
                    {weekMultiplier !== 1.0 && (
                      <div className={`
                        flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg w-fit
                        ${isDeloadWeek ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}
                      `}>
                        <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="text-[10px] sm:text-xs font-medium">
                          {isDeloadWeek ? "↓" : "↑"} {Math.abs(Math.round((weekMultiplier - 1) * 100))}% load
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 relative">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 rounded-full bg-slate-700/50 flex items-center justify-center">
                      <Award className="w-6 h-6 sm:w-7 sm:h-7 text-slate-500" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-500 font-medium">Recovery Day</p>
                    <p className="text-slate-600 text-[10px] sm:text-xs mt-1">Rest, stretch & recover</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Week Notes */}
      {weekPlan?.notes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/30 rounded-2xl p-4 sm:p-5 border border-slate-700/30"
        >
          <h4 className="text-xs sm:text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Week Notes
          </h4>
          <p className="text-sm sm:text-base text-slate-300">{weekPlan.notes}</p>
        </motion.div>
      )}
    </div>
  );
}

export default WeeklyPlanView;
