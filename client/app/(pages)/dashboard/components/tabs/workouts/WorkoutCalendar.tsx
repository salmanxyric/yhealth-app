"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Check,
  Coffee,
  Calendar as 
  Flame,
  Clock,

} from "lucide-react";
import {
  CalendarDay,
  DayWorkout,
  WORKOUT_TYPE_COLORS,
} from "./types";
import { MiniCircularProgress, CircularProgress } from "./CircularProgress";

interface WorkoutCalendarProps {
  startDate: string;
  endDate?: string;
  durationWeeks: number;
  weeks?: Record<string, { days: Record<string, DayWorkout | null> }>;
  weeklySchedule?: Record<string, DayWorkout | null>;
  completedDates?: Set<string>;
  dailyProgress?: Record<string, number>; // date -> completion percentage
  onDayClick?: (date: string, workout?: DayWorkout) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WorkoutCalendar({
  startDate,
  endDate,
  durationWeeks,
  weeks,
  weeklySchedule,
  completedDates = new Set(),
  dailyProgress = {},
  onDayClick,
}: WorkoutCalendarProps) {
  // Get today's date string (YYYY-MM-DD) using local timezone
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const planStart = new Date(startDate);
    const planEnd = endDate ? new Date(endDate) : null;

    // Get first day of month and total days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Get day of week for first day (0 = Sunday)
    const startDayOfWeek = firstDayOfMonth.getDay();

    // Add padding for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      const paddingDate = new Date(currentYear, currentMonth, -startDayOfWeek + i + 1);
      days.push(createCalendarDay(paddingDate, planStart, planEnd, true));
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push(createCalendarDay(date, planStart, planEnd, false));
    }

    // Add padding for remaining cells (to complete 6 rows)
    const remainingCells = 42 - days.length; // 6 rows x 7 days
    for (let i = 1; i <= remainingCells; i++) {
      const paddingDate = new Date(currentYear, currentMonth + 1, i);
      days.push(createCalendarDay(paddingDate, planStart, planEnd, true));
    }

    return days;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear, startDate, endDate]);

  function createCalendarDay(
    date: Date,
    planStart: Date,
    planEnd: Date | null,
    isPadding: boolean
  ): CalendarDay {
    // Use local date methods to avoid timezone issues
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][date.getDay()];
    
    // Calculate which week of the plan this day falls into
    // Normalize dates to start of day for accurate calculation
    const dateNormalized = new Date(year, month, day);
    const planStartNormalized = new Date(planStart.getFullYear(), planStart.getMonth(), planStart.getDate());
    const daysSinceStart = Math.floor((dateNormalized.getTime() - planStartNormalized.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysSinceStart / 7) + 1;

    // Check if this day is within the plan dates
    const isWithinPlan = dateNormalized >= planStartNormalized && (!planEnd || dateNormalized <= new Date(planEnd.getFullYear(), planEnd.getMonth(), planEnd.getDate())) && weekNumber <= durationWeeks && weekNumber > 0;

    let workout: DayWorkout | undefined;
    let isRestDay = true;

    if (isWithinPlan && !isPadding) {
      // Try to get workout from weeks structure
      if (weeks && weeks[`week_${weekNumber}`]) {
        const weekPlan = weeks[`week_${weekNumber}`];
        const dayWorkout = weekPlan.days?.[dayOfWeek];
        if (dayWorkout) {
          workout = dayWorkout;
          isRestDay = false;
        }
      } else if (weeklySchedule && weeklySchedule[dayOfWeek]) {
        // Fallback to legacy structure
        workout = weeklySchedule[dayOfWeek] || undefined;
        isRestDay = !workout;
      }
    }

    // Use local date strings for comparison to avoid timezone issues
    const todayDateStr = todayStr;
    const isToday = dateStr === todayDateStr;
    const isPast = dateStr < todayDateStr;
    const isFuture = dateStr > todayDateStr;

    // Mark as completed if:
    // 1. It's not a rest day
    // 2. Either it's in completedDates OR dailyProgress shows 100%
    const progressFromDaily = dailyProgress[dateStr];
    const isCompleted = !isRestDay && (
      completedDates.has(dateStr) || 
      (progressFromDaily !== undefined && progressFromDaily >= 100)
    );

    return {
      date: dateStr,
      dayOfWeek,
      weekNumber: isWithinPlan ? weekNumber : 0,
      workout,
      isRestDay: isWithinPlan ? isRestDay : true,
      isCompleted,
      isPast,
      isToday,
      isFuture,
    };
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const getWorkoutColor = (workout?: DayWorkout) => {
    if (!workout) return WORKOUT_TYPE_COLORS.rest;
    const workoutType = workout.focusArea?.toLowerCase() || workout.workoutName?.toLowerCase() || "full body";
    return WORKOUT_TYPE_COLORS[workoutType] || WORKOUT_TYPE_COLORS["full body"];
  };

  // Get progress for a date
  const getProgress = (dateStr: string, isCompleted: boolean, workout?: DayWorkout) => {
    if (dailyProgress[dateStr] !== undefined) {
      return dailyProgress[dateStr];
    }
    if (isCompleted) return 100;
    if (!workout) return 0;
    return 0; // Not started
  };

  // Calculate overall month stats
  const monthStats = useMemo(() => {
    const workoutDays = calendarDays.filter(d => d.workout && d.weekNumber > 0);
    // Count completed workouts: either isCompleted is true OR dailyProgress is 100%
    const completedWorkouts = workoutDays.filter(d => {
      if (d.isCompleted) return true;
      const progress = dailyProgress[d.date];
      return progress !== undefined && progress >= 100;
    }).length;
    const totalWorkouts = workoutDays.length;
    const percentage = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;
    return { completedWorkouts, totalWorkouts, percentage };
  }, [calendarDays, dailyProgress]);

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    onDayClick?.(day.date, day.workout);
  };

  const selectedDay = calendarDays.find(d => d.date === selectedDate);

  return (
    <div className="space-y-4">
      {/* Month Overview Card */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 p-4 sm:p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-0 w-full sm:w-auto">
            {/* Mobile-only progress circle */}
            <div className="sm:hidden">
              <CircularProgress
                percentage={monthStats.percentage}
                size={56}
                strokeWidth={6}
                labelSize="sm"
              />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                {monthStats.completedWorkouts} of {monthStats.totalWorkouts} workouts completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
            {/* Desktop progress circle */}
            <div className="hidden sm:block">
              <CircularProgress
                percentage={monthStats.percentage}
                size={90}
                strokeWidth={8}
                labelSize="lg"
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToToday}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-emerald-400 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
              >
                Today
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToPreviousMonth}
                className="p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goToNextMonth}
                className="p-2 sm:p-2.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-2 sm:p-4 backdrop-blur-xl">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
            {WEEKDAY_LABELS.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] sm:text-xs font-semibold text-slate-500 py-1.5 sm:py-3 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            <AnimatePresence mode="wait">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = new Date(day.date).getMonth() === currentMonth;
                const color = getWorkoutColor(day.workout);
                const progress = getProgress(day.date, day.isCompleted, day.workout);
                const isSelected = selectedDate === day.date;

                return (
                  <motion.button
                    key={`${day.date}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.005 }}
                    onClick={() => handleDayClick(day)}
                    disabled={!isCurrentMonth || day.weekNumber === 0}
                    className={`
                      relative aspect-square p-1 rounded-xl transition-all flex flex-col items-center justify-center
                      ${!isCurrentMonth ? "opacity-20" : ""}
                      ${day.isToday ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900" : ""}
                      ${isSelected ? "ring-2 ring-orange-500" : ""}
                      ${day.workout && isCurrentMonth ? `${color.bg} ${color.border} border` : "bg-slate-800/30"}
                      ${day.isRestDay && day.weekNumber > 0 && isCurrentMonth ? "bg-slate-800/50" : ""}
                      ${isCurrentMonth && day.weekNumber > 0 ? "hover:scale-105 cursor-pointer" : "cursor-default"}
                    `}
                  >
                    {/* Date number */}
                    <span
                      className={`
                        text-xs font-semibold mb-1
                        ${day.isToday ? "text-emerald-400" : isCurrentMonth ? "text-white" : "text-slate-600"}
                      `}
                    >
                      {new Date(day.date).getDate()}
                    </span>

                    {/* Progress indicator for workout days */}
                    {day.workout && isCurrentMonth && (
                      <MiniCircularProgress percentage={progress} size={24} />
                    )}

                    {/* Rest day indicator */}
                    {day.isRestDay && day.weekNumber > 0 && isCurrentMonth && (
                      <Coffee className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Selected Day Details / Legend */}
        <div className="space-y-4">
          {/* Selected Day Card */}
          {selectedDay && selectedDay.workout && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 p-4 sm:p-5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400">
                    {new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {selectedDay.workout.workoutName}
                  </h3>
                </div>
                <CircularProgress
                  percentage={getProgress(selectedDay.date, selectedDay.isCompleted, selectedDay.workout)}
                  size={60}
                  strokeWidth={6}
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-700/50 rounded-lg">
                    <Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                    <span className="text-slate-300">{selectedDay.workout.exercises?.length || 0} exercises</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-700/50 rounded-lg">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                    <span className="text-slate-300">{selectedDay.workout.estimatedDuration} min</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-700/50 rounded-lg">
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
                    <span className="text-slate-300">{selectedDay.workout.estimatedCalories} cal</span>
                  </div>
                </div>
              </div>

              {selectedDay.isCompleted && (
                <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
                  <Check className="w-4 h-4" />
                  <span>Completed</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Legend */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4 backdrop-blur-xl">
            <h4 className="text-sm font-semibold text-white mb-3">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                  <span className="text-emerald-400 font-bold">11</span>
                </div>
                <span className="text-slate-400">Today</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <MiniCircularProgress percentage={100} size={32} />
                <span className="text-slate-400">Completed (100%)</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <MiniCircularProgress percentage={50} size={32} />
                <span className="text-slate-400">In Progress</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <MiniCircularProgress percentage={0} size={32} />
                <span className="text-slate-400">Not Started</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                  <Coffee className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-slate-400">Rest Day</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-3 sm:p-4 backdrop-blur-xl">
            <h4 className="text-sm font-semibold text-white mb-3">This Month</h4>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="text-center p-2 sm:p-3 bg-slate-700/30 rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">{monthStats.completedWorkouts}</p>
                <p className="text-[10px] sm:text-xs text-slate-400">Completed</p>
              </div>
              <div className="text-center p-2 sm:p-3 bg-slate-700/30 rounded-xl">
                <p className="text-xl sm:text-2xl font-bold text-slate-300">{monthStats.totalWorkouts - monthStats.completedWorkouts}</p>
                <p className="text-[10px] sm:text-xs text-slate-400">Remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkoutCalendar;
