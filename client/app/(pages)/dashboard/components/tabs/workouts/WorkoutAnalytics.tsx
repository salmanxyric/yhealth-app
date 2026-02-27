"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,

  Activity,
  Calendar,
  Award,
  Clock,
  Loader2,
  Dumbbell,
  BarChart3,
  LineChart as LineChartIcon,
  BarChart2,
  Layers,
  Zap,
} from "lucide-react";
import { workoutsService, type WorkoutLog } from "@/src/shared/services";
import { workoutLogger } from "./logger";
import type { WorkoutPlan } from "./types";

interface DailyProgressData {
  date: string;           // YYYY-MM-DD
  completionRate: number; // 0-100 percentage
  completed: number;      // exercises completed
  total: number;          // total exercises scheduled
  status: 'completed' | 'partial' | 'pending' | 'rest';
}

interface WeeklyProgressData {
  week: string;           // "Week 1", "Week 2", etc.
  completionRate: number; // average completion rate for week
  completed: number;      // total exercises completed
  total: number;          // total exercises scheduled
}

interface WorkoutAnalyticsData {
  dailyProgress: DailyProgressData[];
  weeklyProgress: WeeklyProgressData[];
  performanceMetrics: {
    averageCompletionRate: number;
    totalWorkouts: number;
    currentStreak: number;
    totalDuration: number;
  };
}

type ChartMode = 'line' | 'bar' | 'area';

interface WorkoutAnalyticsProps {
  selectedWorkoutId?: string;
  workouts?: WorkoutPlan[];
}

export function WorkoutAnalytics({ selectedWorkoutId, workouts = [] }: WorkoutAnalyticsProps) {
  const [data, setData] = useState<WorkoutAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [dailyChartMode, setDailyChartMode] = useState<ChartMode>('line');
  const [weeklyChartMode, setWeeklyChartMode] = useState<ChartMode>('area');
  const [error, setError] = useState<string | null>(null);

  const selectedWorkout = workouts.find(w => w.id === selectedWorkoutId);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedWorkout) {
        setError('No workout plan selected');
        setIsLoading(false);
        return;
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const formatDate = (date: Date): string => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };

      // Normalize dates
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Fetch all logs in a single range query instead of per-day
      const rangeResponse = await workoutsService.getLogsByDateRange(
        formatDate(startDate),
        formatDate(endDate),
        selectedWorkoutId
      );
      const allLogs: WorkoutLog[] = (rangeResponse.data?.logs || []).map((log: WorkoutLog) => ({
        ...log,
        date: log.scheduledDate,
      }));

      // Process data with correct percentage calculation
      const processedData = processWorkoutData(
        allLogs,
        selectedWorkout,
        startDate,
        endDate
      );
      setData(processedData);
    } catch (err: unknown) {
      workoutLogger.error('Failed to fetch workout analytics', err, { component: 'WorkoutAnalytics' });
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedWorkoutId, selectedWorkout]);

  useEffect(() => {
    if (selectedWorkoutId && selectedWorkout) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, selectedWorkoutId, selectedWorkout]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'No data available'}</p>
          {selectedWorkoutId && (
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  // Render chart based on mode
  const renderChart = (chartData: DailyProgressData[] | WeeklyProgressData[], mode: ChartMode, dataKey: string, color: string) => {
    const isDaily = chartData.length > 0 && 'date' in chartData[0];
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (mode) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={isDaily ? 'date' : 'week'} 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={isDaily ? formatDateForDisplay : undefined}
            />
            <YAxis 
              domain={[0, 100]}
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'Completion %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number | undefined, name: string | undefined, props: { payload?: DailyProgressData | WeeklyProgressData }) => {
                const val = value ?? 0;
                if (isDaily && props.payload && 'completed' in props.payload && 'total' in props.payload) {
                  return [`${val}%`, `Completion Rate (${props.payload.completed}/${props.payload.total} exercises)`];
                }
                return [`${val}%`, 'Completion Rate'];
              }}
              labelFormatter={isDaily ? (label: string) => formatDateForDisplay(label) : undefined}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
              name="Completion %"
            />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={isDaily ? 'date' : 'week'} 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={isDaily ? formatDateForDisplay : undefined}
            />
            <YAxis 
              domain={[0, 100]}
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'Completion %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number | undefined, name: string | undefined, props: { payload?: DailyProgressData | WeeklyProgressData }) => {
                const val = value ?? 0;
                if (isDaily && props.payload && 'completed' in props.payload && 'total' in props.payload) {
                  return [`${val}%`, `Completion Rate (${props.payload.completed}/${props.payload.total} exercises)`];
                }
                return [`${val}%`, 'Completion Rate'];
              }}
              labelFormatter={isDaily ? (label: string) => formatDateForDisplay(label) : undefined}
            />
            <Legend />
            <Bar dataKey={dataKey} fill={color} name="Completion %" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey={isDaily ? 'date' : 'week'} 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={isDaily ? formatDateForDisplay : undefined}
            />
            <YAxis 
              domain={[0, 100]}
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'Completion %', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number | undefined, name: string | undefined, props: { payload?: DailyProgressData | WeeklyProgressData }) => {
                const val = value ?? 0;
                if (isDaily && props.payload && 'completed' in props.payload && 'total' in props.payload) {
                  return [`${val}%`, `Completion Rate (${props.payload.completed}/${props.payload.total} exercises)`];
                }
                return [`${val}%`, 'Completion Rate'];
              }}
              labelFormatter={isDaily ? (label: string) => formatDateForDisplay(label) : undefined}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fillOpacity={1}
              fill={`url(#color${dataKey})`}
              name="Completion %"
            />
          </AreaChart>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20">
            <BarChart3 className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Workout Analytics</h2>
            <p className="text-sm text-slate-400">Track your fitness progress and performance</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-orange-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{data.performanceMetrics.averageCompletionRate}%</p>
          <p className="text-sm text-slate-400">Avg Completion Rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <Dumbbell className="w-5 h-5 text-blue-400" />
            <Award className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">{data.performanceMetrics.totalWorkouts}</p>
          <p className="text-sm text-slate-400">Total Workouts</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-purple-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{data.performanceMetrics.currentStreak}</p>
          <p className="text-sm text-slate-400">Current Streak</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl p-6 border border-emerald-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {Math.round(data.performanceMetrics.totalDuration / 60)}h {data.performanceMetrics.totalDuration % 60}m
          </p>
          <p className="text-sm text-slate-400">Total Duration</p>
        </motion.div>
      </div>

      {/* Charts Grid - Only 2 Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Daily Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Daily Progress
            </h3>
            <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
              {(['line', 'bar', 'area'] as ChartMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDailyChartMode(mode)}
                  className={`p-1.5 rounded transition-all ${
                    dailyChartMode === mode
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                >
                  {mode === 'line' && <LineChartIcon className="w-4 h-4" />}
                  {mode === 'bar' && <BarChart2 className="w-4 h-4" />}
                  {mode === 'area' && <Layers className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {renderChart(data.dailyProgress, dailyChartMode, 'completionRate', '#3b82f6')}
          </ResponsiveContainer>
        </motion.div>

        {/* Weekly Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              Weekly Progress
            </h3>
            <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
              {(['line', 'bar', 'area'] as ChartMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setWeeklyChartMode(mode)}
                  className={`p-1.5 rounded transition-all ${
                    weeklyChartMode === mode
                      ? 'bg-orange-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                >
                  {mode === 'line' && <LineChartIcon className="w-4 h-4" />}
                  {mode === 'bar' && <BarChart2 className="w-4 h-4" />}
                  {mode === 'area' && <Layers className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {renderChart(data.weeklyProgress, weeklyChartMode, 'completionRate', '#f97316')}
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}

// Helper function to process workout data with correct percentage calculation
function processWorkoutData(
  logs: WorkoutLog[],
  workoutPlan: WorkoutPlan,
  startDate: Date,
  endDate: Date
): WorkoutAnalyticsData {
  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Get day name from date
  const getDayName = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Get scheduled exercises for a specific date
  const getScheduledExercisesForDate = (date: Date): number => {
    const dayName = getDayName(date);

    // Calculate which week this date falls into
    if (!workoutPlan.startDate) return 0;

    const planStart = new Date(workoutPlan.startDate);
    planStart.setHours(0, 0, 0, 0);

    // Normalize date to midnight for accurate day diff calculation
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((normalizedDate.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24));
    const rawWeekNumber = Math.floor(daysDiff / 7) + 1;
    // Cap week number to durationWeeks so dates past program end still map to the last week's exercises
    const durationWeeks = workoutPlan.durationWeeks || 999;
    const weekNumber = Math.min(Math.max(1, rawWeekNumber), durationWeeks);

    // Try to get workout from weeks structure first
    if (workoutPlan.weeks) {
      const weekKey = `week_${weekNumber}`;
      const weekPlan = workoutPlan.weeks[weekKey];
      if (weekPlan?.days?.[dayName]) {
        return weekPlan.days[dayName]?.exercises?.length || 0;
      }
    }

    // Fallback to weeklySchedule
    if (workoutPlan.weeklySchedule?.[dayName]) {
      return workoutPlan.weeklySchedule[dayName]?.exercises?.length || 0;
    }

    return 0;
  };

  // Group logs by date
  const logsByDate: Record<string, WorkoutLog[]> = {};
  logs.forEach(log => {
    // WorkoutLog has scheduledDate property
    const date = (log as WorkoutLog & { date?: string }).date || log.scheduledDate;
    if (date) {
      // Use local date formatting instead of toISOString() to avoid UTC timezone shifts
      let dateStr: string;
      if (typeof date === 'string') {
        dateStr = date.split('T')[0];
      } else {
        const d = new Date(date);
        dateStr = formatDate(d);
      }
      if (!logsByDate[dateStr]) {
        logsByDate[dateStr] = [];
      }
      logsByDate[dateStr].push(log);
    }
  });

  // Calculate daily progress with correct percentage
  const dailyProgress: DailyProgressData[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    const dayLogs = logsByDate[dateStr] || [];
    
    // Get total scheduled exercises for this day
    const totalExercises = getScheduledExercisesForDate(currentDate);
    
    // Count completed exercises from logs
    let completedExercises = 0;
    dayLogs.forEach((log: WorkoutLog) => {
      if (log.exercisesCompleted && Array.isArray(log.exercisesCompleted)) {
        completedExercises += log.exercisesCompleted.length;
      }
    });
    
    // Calculate completion rate based on exercises
    let completionRate = 0;
    let status: 'completed' | 'partial' | 'pending' | 'rest' = 'rest';
    
    if (totalExercises > 0) {
      completionRate = Math.round((completedExercises / totalExercises) * 100);
      if (completionRate === 100) {
        status = 'completed';
      } else if (completionRate > 0) {
        status = 'partial';
      } else {
        status = 'pending';
      }
    } else if (dayLogs.length > 0) {
      // Fallback: log exists but exercise count couldn't be determined from plan structure
      const hasCompleted = dayLogs.some(l => l.status === 'completed');
      const hasPartial = dayLogs.some(l => l.status === 'partial');
      if (hasCompleted) {
        completionRate = 100;
        status = 'completed';
      } else if (hasPartial || completedExercises > 0) {
        completionRate = 50;
        status = 'partial';
      }
    }
    
    dailyProgress.push({
      date: dateStr,
      completionRate,
      completed: completedExercises,
      total: totalExercises,
      status,
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate weekly progress
  const weeklyProgress: WeeklyProgressData[] = [];
  const weekStart = new Date(startDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  
  while (weekStart <= endDate) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Get all days in this week
    const weekDays: DailyProgressData[] = [];
    const checkDate = new Date(weekStart);
    while (checkDate <= weekEnd && checkDate <= endDate) {
      const dateStr = formatDate(checkDate);
      const dayData = dailyProgress.find(d => d.date === dateStr);
      if (dayData) {
        weekDays.push(dayData);
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    // Calculate weekly totals
    const totalCompleted = weekDays.reduce((sum, day) => sum + day.completed, 0);
    const totalScheduled = weekDays.reduce((sum, day) => sum + day.total, 0);
    const avgCompletionRate = weekDays.length > 0 && totalScheduled > 0
      ? Math.round((totalCompleted / totalScheduled) * 100)
      : 0;
    
    weeklyProgress.push({
      week: `Week ${weeklyProgress.length + 1}`,
      completionRate: avgCompletionRate,
      completed: totalCompleted,
      total: totalScheduled,
    });
    
    weekStart.setDate(weekStart.getDate() + 7);
  }

  // Calculate performance metrics
  const totalWorkouts = logs.length;
  const allCompleted = dailyProgress.reduce((sum, day) => sum + day.completed, 0);
  const allScheduled = dailyProgress.reduce((sum, day) => sum + day.total, 0);
  const averageCompletionRate = allScheduled > 0
    ? Math.round((allCompleted / allScheduled) * 100)
    : 0;
  
  const totalDuration = logs.reduce((sum: number, log: WorkoutLog) => sum + (log.durationMinutes || 0), 0);
  
  // Calculate streak
  let currentStreak = 0;
  for (let i = dailyProgress.length - 1; i >= 0; i--) {
    const day = dailyProgress[i];
    if (day.status === 'completed' || (day.status === 'partial' && day.completionRate >= 50)) {
      currentStreak++;
    } else if (day.total > 0) {
      // Only break streak if there was a scheduled workout
      break;
    }
  }

  return {
    dailyProgress,
    weeklyProgress,
    performanceMetrics: {
      averageCompletionRate,
      totalWorkouts,
      currentStreak,
      totalDuration,
    },
  };
}
