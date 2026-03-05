"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dumbbell,
  Play,
  Clock,
  Flame,
  ChevronRight,
  Calendar,
  CalendarDays,
  Trophy,
  Zap,
  TrendingUp,
  CheckCircle2,
  Circle,
  Timer,
  Plus,
  Sparkles,
  BarChart3,
  Repeat,
  Heart,
  X,
  Trash2,
  Save,
  GripVertical,
  Pause,
  Square,
  RotateCcw,
  Award,
  Loader2,
  Edit3,
  ListOrdered,
  RefreshCw,
} from "lucide-react";
import { WorkoutAlarmsWidget } from "../alarms/WorkoutAlarmsWidget";
import { MotivationalVideosWidget } from "../motivation/MotivationalVideosWidget";
import { workoutsService, type WorkoutLog } from "@/src/shared/services";

// Import workout utilities, constants, and logger
import {
  workoutLogger,
  isValidUUID,
  formatTime,
  MOTIVATIONAL_QUOTES,
  DEFAULT_WORKOUT_STATS,
  PRESET_EXERCISES,
  MUSCLE_GROUPS,
  DIFFICULTY_OPTIONS,
  EQUIPMENT_OPTIONS,
  LOCATION_OPTIONS,
  GOAL_CATEGORY_OPTIONS,
  DURATION_OPTIONS,
  WORKOUTS_PER_WEEK_OPTIONS,
  TIME_PER_WORKOUT_OPTIONS,
  DAYS_LABELS,
  DAYS_OF_WEEK,
  WorkoutCalendar,
  WeeklyPlanView,
  CircularProgress,
  DayWorkoutEditModal,
  WorkoutAnalytics,
  WorkoutScheduleTasks,
  WorkoutRescheduleHistory,
  WorkoutConstraints,
  RescheduleWorkoutModal,
  ExerciseExecutionDrawer,
  PlanCompletionCelebration,
  PlanCompletedBanner,
  checkPlanCompletion,
  buildFullPlanProgress,
  calculatePlanStats,
  type Exercise,
  type WorkoutPlan,
  type WorkoutSession,
  type WorkoutStats,
  type AIGenerationFormData,
  type DayWorkout,
  type PlanCompletionStats,
} from "./workouts";

// Local types that aren't in shared
interface WorkoutDay {
  day: string;
  name: string;
  completed: boolean;
  isToday: boolean;
  isRest?: boolean;
  scheduledTime?: string;
  planId?: string;
}

interface PR {
  exerciseName: string;
  weight: number;
  reps: number;
  improvement: number;
  date: string;
}

// Helper to dynamically calculate the current week from plan start date
function calculateCurrentWeek(startDateStr: string, durationWeeks: number): number {
  // Parse as local date (append T00:00:00 to avoid UTC interpretation of YYYY-MM-DD)
  const start = new Date(startDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor(daysSinceStart / 7) + 1;
  return Math.min(Math.max(1, weekNumber), durationWeeks);
}

// Helper to check if a program has passed its end date
function isProgramPastEndDate(startDateStr: string, durationWeeks: number): boolean {
  const start = new Date(startDateStr + 'T00:00:00');
  const endDate = new Date(start);
  endDate.setDate(start.getDate() + durationWeeks * 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= endDate;
}

// Sortable Workout Card Component
interface SortableWorkoutCardProps {
  workout: WorkoutPlan;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function SortableWorkoutCard({
  workout,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: SortableWorkoutCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workout.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border p-5 transition-all cursor-pointer group relative ${
        isSelected
          ? "bg-gradient-to-br from-orange-500/20 to-red-500/10 border-orange-500/30"
          : "bg-slate-800/50 border-slate-700/50 hover:border-orange-500/50"
      } ${isDragging ? "z-50 shadow-2xl" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing -ml-1.5 -mt-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          {workout.isCustom && (
            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold">
              CUSTOM
            </span>
          )}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              workout.difficulty === "beginner"
                ? "bg-emerald-500/20 text-emerald-400"
                : workout.difficulty === "intermediate"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-red-500/20 text-red-400"
            }`}
          >
            {workout.difficulty.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <h4 className="font-semibold text-white mb-2">{workout.name}</h4>
      <div className="flex flex-wrap gap-1 mb-3">
        {workout.muscleGroups.map((group) => (
          <span
            key={group}
            className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded"
          >
            {group}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {workout.duration} min
        </span>
        <span className="flex items-center gap-1">
          <Repeat className="w-3 h-3" />
          {workout.exercises.length} exercises
        </span>
        {workout.scheduledTime && (
          <span className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {workout.scheduledTime}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function WorkoutsTab() {
  const [activeView, setActiveView] = useState<"today" | "plan" | "calendar" | "weekly" | "analytics" | "schedule">("today");
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WorkoutDay[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>(DEFAULT_WORKOUT_STATS);
  const [personalRecords, setPersonalRecords] = useState<PR[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  // Workout session state
  const [session, setSession] = useState<WorkoutSession>({
    isActive: false,
    isPaused: false,
    elapsedSeconds: 0,
    currentExerciseIndex: 0,
    isResting: false,
    restTimeRemaining: 0,
  });
  const [currentQuote, setCurrentQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showPlanCompletion, setShowPlanCompletion] = useState(false);
  const [planCompletionStats, setPlanCompletionStats] = useState<PlanCompletionStats | null>(null);
  const [editingDay, setEditingDay] = useState<{ dayOfWeek: string; workout: DayWorkout | null } | null>(null);
  const [executionDrawerExercise, setExecutionDrawerExercise] = useState<Exercise | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get selected workout from state
  const selectedWorkout = workouts.find(w => w.id === selectedWorkoutId) || null;

  // Daily progress state (calculated from workout logs)
  const [dailyProgress, setDailyProgress] = useState<Record<string, number>>({
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  });

  // Today's progress calculation
  const _todayProgress = selectedWorkout?.exercises
    ? (selectedWorkout.exercises.filter(e => e.completed).length / selectedWorkout.exercises.length) * 100
    : 0;

  // Form state for creating workouts
  const [createMode, setCreateMode] = useState<"ai" | "manual">("ai");
  const [formData, setFormData] = useState({
    name: "",
    muscleGroups: [] as string[],
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    scheduledTime: "07:00",
    exercises: [] as Exercise[],
    description: "",
    useAI: false,
    aiPrompt: "",
    workoutsPerWeek: 4,
    selectedDays: ['monday', 'tuesday', 'thursday', 'friday'] as string[],
  });

  // AI Generation form state
  const [aiFormData, setAiFormData] = useState<AIGenerationFormData>({
    description: "",
    durationWeeks: 1,
    workoutsPerWeek: 3,
    timePerWorkout: 45,
    fitnessLevel: "beginner",
    equipment: ["bodyweight"],
    workoutLocation: "home",
    goalCategory: "muscle_building",
    selectedDays: ['monday', 'wednesday', 'friday'],
    startDate: new Date().toISOString().split('T')[0],
  });
  const [_generatedPlan, setGeneratedPlan] = useState<{
    name: string;
    description: string;
    muscleGroups: string[];
    weeklySchedule: Record<string, DayWorkout | null>;
    tips: string[];
  } | null>(null);

  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isGeneratingAIPlan, setIsGeneratingAIPlan] = useState(false);
  const [isLoadingAISuggestions, setIsLoadingAISuggestions] = useState(false);
  const [aiWorkoutTips, setAIWorkoutTips] = useState<string[]>([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleRefreshKey, setRescheduleRefreshKey] = useState(0);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  // Timer effect
  useEffect(() => {
    if (session.isActive && !session.isPaused) {
      timerRef.current = setInterval(() => {
        setSession(prev => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session.isActive, session.isPaused]);

  // Rest timer effect
  useEffect(() => {
    if (session.isResting && session.restTimeRemaining > 0) {
      restTimerRef.current = setInterval(() => {
        setSession(prev => {
          if (prev.restTimeRemaining <= 1) {
            return { ...prev, isResting: false, restTimeRemaining: 0 };
          }
          return { ...prev, restTimeRemaining: prev.restTimeRemaining - 1 };
        });
      }, 1000);
    } else {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
    }

    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
      }
    };
  }, [session.isResting, session.restTimeRemaining]);

  // Change motivational quote every 30 seconds during workout
  useEffect(() => {
    if (session.isActive && !session.isPaused) {
      const quoteInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        setCurrentQuote(MOTIVATIONAL_QUOTES[randomIndex]);
      }, 30000);
      return () => clearInterval(quoteInterval);
    }
  }, [session.isActive, session.isPaused]);

  // Helper to calculate daily progress from workout logs
  const calculateDailyProgress = useCallback(async (
    schedule: Array<{ day: string; dayName: string; isRest: boolean; planId?: string }>,
    workoutPlans: WorkoutPlan[],
    weekNumber?: number,
    planStartDate?: string
  ) => {
    const dayNameMapping: Record<string, string> = {
      'Mon': 'monday',
      'Tue': 'tuesday',
      'Wed': 'wednesday',
      'Thu': 'thursday',
      'Fri': 'friday',
      'Sat': 'saturday',
      'Sun': 'sunday',
    };

    // Use date strings (YYYY-MM-DD) as keys instead of day names
    const newDailyProgress: Record<string, number> = {};

    // Calculate the start of the target week based on plan start date and week number
    let startOfWeek: Date;
    
    if (planStartDate && weekNumber) {
      // Calculate dates for the specific week based on plan start date
      // Append T00:00:00 to parse as local timezone (YYYY-MM-DD alone parses as UTC)
      const planStart = new Date(planStartDate + 'T00:00:00');
      
      // Get the day of week for the plan start (0 = Sunday, 1 = Monday, etc.)
      const planStartDayOfWeek = planStart.getDay();
      // Normalize to Monday = 0
      const normalizedStartDay = planStartDayOfWeek === 0 ? 6 : planStartDayOfWeek - 1;
      
      // Calculate the start of week 1 (first Monday on or before plan start)
      const week1Start = new Date(planStart);
      week1Start.setDate(planStart.getDate() - normalizedStartDay);
      
      // Calculate the start of the target week (weekNumber weeks after week 1)
      startOfWeek = new Date(week1Start);
      startOfWeek.setDate(week1Start.getDate() + (weekNumber - 1) * 7);
      startOfWeek.setHours(0, 0, 0, 0);
    } else {
      // Fallback to current week if no plan start date or week number provided
      const today = new Date();
      const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dayOfWeek = todayLocal.getDay();
      startOfWeek = new Date(todayLocal);
      startOfWeek.setDate(todayLocal.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      startOfWeek.setHours(0, 0, 0, 0);
    }
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Format dates as YYYY-MM-DD
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    try {
      // Fetch workout logs for the week
      const weekDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        weekDates.push(formatLocalDate(date));
      }

      // Fetch logs for each day
      const logsByDate: Record<string, WorkoutLog[]> = {};
      for (const dateStr of weekDates) {
        try {
          const logsResponse = await workoutsService.getLogsForDate(dateStr);
          const logs = logsResponse.data?.logs || [];
          logsByDate[dateStr] = logs;
        } catch {
          logsByDate[dateStr] = [];
        }
      }

      // Calculate progress for each day using actual date strings
      schedule.forEach((day, index) => {
        const dayKey = dayNameMapping[day.day] || day.dayName;
        if (!dayKey) return;

        // Get the date for this day
        const dateForDay = new Date(startOfWeek);
        dateForDay.setDate(startOfWeek.getDate() + index);
        const dateStr = formatLocalDate(dateForDay);

        let progressValue = 0;

        if (!day.isRest) {
          // Get logs for this day
          const dayLogs = logsByDate[dateStr] || [];
          const planLogs = day.planId 
            ? dayLogs.filter((l: WorkoutLog) => l.workoutPlanId === day.planId)
            : dayLogs;

          if (planLogs.length > 0) {
            // Find the workout plan to get total exercises
            const plan = workoutPlans.find(p => p.id === day.planId);
            if (!plan) {
              // If no plan found, check if log has completion status
              const completedLog = planLogs.find((l: WorkoutLog) => l.status === 'completed' || l.status === 'partial');
              progressValue = completedLog ? 100 : 0;
            } else {
              // Get exercises for this day from weeklySchedule or weeks structure
              let dayWorkout: DayWorkout | null | undefined;
              const weeklySchedule = plan.weeklySchedule as Record<string, DayWorkout | null> | undefined;
              const weeks = plan.weeks;
              
              // Try to get from weeks structure first (for multi-week plans)
              if (weeks) {
                // Use the target week number passed to this function, not plan.currentWeek
                const targetWeek = weekNumber || plan.currentWeek || 1;
                const weekPlan = weeks[`week_${targetWeek}`];
                dayWorkout = weekPlan?.days?.[dayKey];
              }
              
              // Fallback to weeklySchedule
              if (!dayWorkout && weeklySchedule) {
                dayWorkout = weeklySchedule[dayKey];
              }
              
              const totalExercises = dayWorkout?.exercises?.length || plan.exercises?.length || 0;

              if (totalExercises > 0) {
                // Count completed exercises from logs
                const latestLog = planLogs[planLogs.length - 1]; // Get most recent log
                if (latestLog?.exercisesCompleted && Array.isArray(latestLog.exercisesCompleted)) {
                  const completedCount = latestLog.exercisesCompleted.length;
                  progressValue = Math.round((completedCount / totalExercises) * 100);
                } else if (latestLog?.status === 'completed') {
                  // If status is completed but no exercise data, assume 100%
                  progressValue = 100;
                } else if (latestLog?.status === 'partial') {
                  // Partial completion - estimate 50% if no exercise data
                  progressValue = 50;
                }
              }
            }
          }
        }

        // Store progress using BOTH date string (for calendar view) and day name (for weekly view)
        // Also store with week-specific key to avoid conflicts between weeks
        newDailyProgress[dateStr] = progressValue;
        if (weekNumber) {
          // Store with week-specific key: "week_1_monday", "week_2_monday", etc.
          newDailyProgress[`week_${weekNumber}_${dayKey}`] = progressValue;
        }
        // Also store generic day name (for backward compatibility, but this will be overwritten per week)
        newDailyProgress[dayKey] = progressValue;
      });
    } catch (err) {
      workoutLogger.error('Failed to calculate daily progress', err, { component: 'WorkoutsTab' });
      // Fallback to simple completion status
      schedule.forEach((day, index) => {
        const dayKey = dayNameMapping[day.day] || day.dayName;
        const dateForDay = new Date(startOfWeek);
        dateForDay.setDate(startOfWeek.getDate() + index);
        const dateStr = formatLocalDate(dateForDay);
        const progressValue = day.isRest ? 0 : 0;
        // Store progress using BOTH date string and day name
        if (dayKey) {
          newDailyProgress[dayKey] = progressValue;
        }
        newDailyProgress[dateStr] = progressValue;
      });
    }

    // Merge with existing progress data to preserve data from other weeks
    setDailyProgress(prev => ({ ...prev, ...newDailyProgress }));
  }, []);

  // Calculate progress for current week when weekly view is shown
  useEffect(() => {
    if (activeView === "weekly" && selectedWorkout && selectedWorkout.startDate) {
      const DAYS_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const currentWeek = selectedWorkout.currentWeek || 1;

      const schedule = DAYS_ORDER.map((day, index) => {
        const weekPlan = selectedWorkout.weeks?.[`week_${currentWeek}`];
        const dayWorkout = weekPlan?.days?.[day] || selectedWorkout.weeklySchedule?.[day];
        return {
          day: DAY_SHORT[index],
          dayName: day,
          isRest: !dayWorkout,
          planId: selectedWorkout.id,
        };
      });

      calculateDailyProgress(schedule, [selectedWorkout], currentWeek, selectedWorkout.startDate).catch(err => {
        workoutLogger.error('Failed to calculate initial weekly progress', err, { component: 'WorkoutsTab' });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, selectedWorkout?.id, selectedWorkout?.currentWeek, selectedWorkout?.startDate, calculateDailyProgress]);

  // Load full plan progress when calendar view is active
  useEffect(() => {
    if (activeView !== "calendar" || !selectedWorkout || !selectedWorkout.startDate) return;

    const DAYS_ORDER_CAL = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const plan = selectedWorkout;
    const durationWeeks = plan.durationWeeks || 4;

    const loadCalendarProgress = async () => {
      try {
        // Calculate plan date range
        const planStart = new Date(plan.startDate! + 'T00:00:00');
        const startDay = planStart.getDay();
        const normalizedStart = new Date(planStart);
        normalizedStart.setDate(planStart.getDate() - (startDay === 0 ? 6 : startDay - 1));

        const planEnd = new Date(normalizedStart);
        planEnd.setDate(normalizedStart.getDate() + durationWeeks * 7 - 1);

        // Cap at today (no future dates)
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        const endDate = planEnd > now ? now : planEnd;

        const formatDate = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        const todayStr = formatDate(new Date());
        const startStr = formatDate(normalizedStart);
        const endStr = formatDate(endDate);

        // Single API call to get all logs in the plan's date range
        const resp = await workoutsService.getLogsByDateRange(startStr, endStr, plan.id);
        const allLogs = resp.data?.logs || [];

        // Group logs by scheduled_date
        const logsByDate: Record<string, WorkoutLog[]> = {};
        for (const log of allLogs) {
          const dateKey = log.scheduledDate;
          if (!logsByDate[dateKey]) logsByDate[dateKey] = [];
          logsByDate[dateKey].push(log);
        }

        // Build progress for every day in the plan
        const newProgress: Record<string, number> = {};

        for (let w = 1; w <= durationWeeks; w++) {
          const weekPlan = plan.weeks?.[`week_${w}`];
          const weekStart = new Date(normalizedStart);
          weekStart.setDate(normalizedStart.getDate() + (w - 1) * 7);

          for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const dateStr = formatDate(dayDate);
            const dayName = DAYS_ORDER_CAL[i];

            // Get workout definition for this day
            let dayWorkout: DayWorkout | null | undefined;
            if (weekPlan) {
              dayWorkout = weekPlan.days?.[dayName];
            } else if (plan.weeklySchedule) {
              dayWorkout = plan.weeklySchedule[dayName];
            }

            if (!dayWorkout || dayWorkout.isRestDay) continue;

            const dayLogs = logsByDate[dateStr] || [];
            let progressValue = 0;

            if (dayLogs.length > 0) {
              const totalExercises = dayWorkout.exercises?.length || 0;
              // Use first log (most recent - query orders DESC)
              const latestLog = dayLogs[0];
              const exercisesData = latestLog?.exercisesCompleted;
              // Handle both parsed array and JSON string
              const exercisesArray = Array.isArray(exercisesData)
                ? exercisesData
                : (typeof exercisesData === 'string' ? (() => { try { return JSON.parse(exercisesData); } catch { return null; } })() : null);

              if (totalExercises > 0 && exercisesArray && Array.isArray(exercisesArray) && exercisesArray.length > 0) {
                const completedCount = exercisesArray.length;
                progressValue = Math.round((completedCount / totalExercises) * 100);
              } else if (latestLog?.status === 'completed') {
                progressValue = 100;
              } else if (latestLog?.status === 'partial') {
                progressValue = 50;
              }
            }

            newProgress[dateStr] = progressValue;
            newProgress[`week_${w}_${dayName}`] = progressValue;
          }
        }

        // Also compute today's progress from local exercise completion state
        // This handles the case where the log was just saved but the API query
        // returned stale data, or exercises were completed but not yet persisted
        const currentWorkout = workouts.find(w => w.id === plan.id);
        if (currentWorkout && currentWorkout.exercises?.length > 0) {
          const totalEx = currentWorkout.exercises.length;
          const completedEx = currentWorkout.exercises.filter(ex => ex.completed).length;
          const localProgress = Math.round((completedEx / totalEx) * 100);
          // Use the higher value between API and local state for today
          const apiProgress = newProgress[todayStr] ?? 0;
          if (localProgress > apiProgress) {
            newProgress[todayStr] = localProgress;
            // Also update the week key for today
            const todayDate = new Date();
            const daysSinceStart = Math.floor((todayDate.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24));
            const todayWeek = Math.floor(daysSinceStart / 7) + 1;
            const todayDayName = DAYS_ORDER_CAL[todayDate.getDay() === 0 ? 6 : todayDate.getDay() - 1];
            if (todayWeek >= 1 && todayWeek <= durationWeeks) {
              newProgress[`week_${todayWeek}_${todayDayName}`] = localProgress;
            }
          }
        }

        setDailyProgress(prev => ({ ...prev, ...newProgress }));
      } catch (err) {
        workoutLogger.error('Failed to load calendar progress', err, { component: 'WorkoutsTab' });
      }
    };

    loadCalendarProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, selectedWorkout?.id, selectedWorkout?.startDate, selectedWorkout?.durationWeeks, workouts]);

  // Helper to restore completion state from workout logs
  const restoreCompletionState = useCallback(async (workoutPlans: WorkoutPlan[]) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    try {
      const logsResponse = await workoutsService.getLogsForDate(todayStr);
      const logs = logsResponse.data?.logs;
      if (logs && logs.length > 0) {
        // Build a lookup: planId → log, and a global fallback from all logs
        const logByPlanId = new Map<string, WorkoutLog>();
        const allCompletedById = new Map<string, { weight?: number }>();
        const allCompletedByName = new Map<string, { weight?: number }>();

        for (const log of logs) {
          if (log.workoutPlanId) {
            logByPlanId.set(log.workoutPlanId, log);
          }
          // Build global completion maps from all logs (for ID and name matching)
          if (log.exercisesCompleted && Array.isArray(log.exercisesCompleted)) {
            for (const ec of log.exercisesCompleted) {
              // Get the weight from the first completed set (if any)
              const savedWeight = ec.sets?.find(s => s.completed)?.weight;
              allCompletedById.set(ec.exerciseId, { weight: savedWeight });
              if (ec.notes) {
                allCompletedByName.set(ec.notes, { weight: savedWeight });
              }
            }
          }
        }

        if (allCompletedById.size > 0 || allCompletedByName.size > 0) {
          setWorkouts(workoutPlans.map(workout => {
            // Try to find the log specific to this plan first
            const planLog = logByPlanId.get(workout.id);
            // Build plan-specific completion maps if we have a matching log
            let completedById = allCompletedById;
            let completedByName = allCompletedByName;
            if (planLog?.exercisesCompleted && Array.isArray(planLog.exercisesCompleted)) {
              completedById = new Map<string, { weight?: number }>();
              completedByName = new Map<string, { weight?: number }>();
              for (const ec of planLog.exercisesCompleted) {
                const savedWeight = ec.sets?.find(s => s.completed)?.weight;
                completedById.set(ec.exerciseId, { weight: savedWeight });
                if (ec.notes) {
                  completedByName.set(ec.notes, { weight: savedWeight });
                }
              }
            }

            return {
              ...workout,
              exercises: workout.exercises.map(ex => {
                // Match by exercise ID first, then by name as fallback
                const matchById = completedById.get(ex.id);
                const matchByName = completedByName.get(ex.name);
                const match = matchById || matchByName;
                if (match) {
                  return {
                    ...ex,
                    completed: true,
                    // Restore saved weight if available (e.g. user changed from 25kg to 35kg)
                    weight: match.weight ? `${match.weight}kg` : ex.weight,
                  };
                }
                return { ...ex, completed: false };
              }),
            };
          }));
          return; // Early return - state already set with completion status
        }
      }
    } catch (err) {
      workoutLogger.error('Failed to restore workout completion state', err, { component: 'WorkoutsTab' });
    }
    // No logs found - set workouts without completion state
    setWorkouts(workoutPlans);
  }, []);

  // Fetch workout plans, stats, schedule, and PRs on mount
  useEffect(() => {
    const loadWorkoutData = async () => {
      setIsLoadingPlans(true);
      workoutLogger.info('Loading workout data', { component: 'WorkoutsTab', action: 'loadWorkoutData' });

      try {
        // Fetch all data in parallel
        const [plansResponse, statsResponse, scheduleResponse, prsResponse] = await Promise.all([
          workoutsService.getPlans().catch(() => null),
          workoutsService.getWeeklyStats().catch(() => null),
          workoutsService.getWeeklySchedule().catch(() => null),
          workoutsService.getPersonalRecords(5).catch(() => null),
        ]);

        // Process workout plans
        const plans = plansResponse?.data?.plans;
        let mappedPlans: WorkoutPlan[] = [];
        if (plans && plans.length > 0) {
          // Get today's day of week for extracting exercises from weeklySchedule
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const todayKey = days[new Date().getDay()];

          // Map API response to local WorkoutPlan type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mappedPlans = plans.map((plan: any) => {
            // Try to get exercises from weeklySchedule (for AI-generated plans)
            let exercises: Exercise[] = [];
            const weeklySchedule = plan.weeklySchedule as Record<string, DayWorkout | null> | undefined;

            if (weeklySchedule && weeklySchedule[todayKey]) {
              // Extract today's exercises from weekly schedule
              const todayWorkout = weeklySchedule[todayKey];
              exercises = (todayWorkout?.exercises || []).map((ex, idx) => ({
                // Use consistent ID format: planId-dayOfWeek-index
                id: ex.id || `${plan.id}-${todayKey}-${idx}`,
                name: ex.name,
                sets: ex.sets,
                reps: String(ex.reps),
                weight: ex.weight ? String(ex.weight) : undefined,
                restSeconds: ex.restSeconds || 60,
                muscleGroup: ex.muscleGroup || 'Full Body',
                completed: false,
              }));
            }
            // If today is a rest day (weeklySchedule[todayKey] is null or undefined), 
            // exercises array remains empty - do NOT fallback to other days' exercises
            
            if (exercises.length === 0 && plan.exercises && plan.exercises.length > 0) {
              // Use direct exercises array (for manual plans)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              exercises = plan.exercises.map((ex: any) => ({
                id: ex.id,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                duration: ex.duration,
                restSeconds: ex.restSeconds,
                muscleGroup: ex.muscleGroup,
                completed: false,
              }));
            }

            // Extract all muscle groups from weekly schedule
            let muscleGroups = plan.muscleGroups || [];
            if (muscleGroups.length === 0 && weeklySchedule) {
              const allMuscleGroups = new Set<string>();
              Object.values(weeklySchedule).forEach((day) => {
                if (day && day.focusArea) {
                  day.focusArea.split(',').forEach(m => allMuscleGroups.add(m.trim()));
                }
                if (day && day.exercises) {
                  day.exercises.forEach(ex => {
                    if (ex.muscleGroup) allMuscleGroups.add(ex.muscleGroup);
                  });
                }
              });
              muscleGroups = Array.from(allMuscleGroups);
            }

            const planStartDate = plan.startDate || plan.start_date;
            const planDurationWeeks = plan.durationWeeks || plan.duration_weeks || 4;
            const dynamicCurrentWeek = planStartDate
              ? calculateCurrentWeek(planStartDate, planDurationWeeks)
              : (plan.currentWeek || plan.current_week || 1);
            const programComplete = planStartDate && planDurationWeeks > 1
              ? isProgramPastEndDate(planStartDate, planDurationWeeks)
              : false;

            return {
              id: plan.id,
              name: plan.name,
              description: plan.description,
              muscleGroups,
              exercises,
              duration: plan.duration || 45,
              scheduledTime: plan.scheduledTime,
              difficulty: (plan.difficulty || plan.initialDifficultyLevel || "beginner") as "beginner" | "intermediate" | "advanced",
              isCustom: plan.isCustom || !plan.aiGenerated,
              weeklySchedule, // Keep for reference - contains all workout days
              weeks: plan.weeks,
              scheduleDays: plan.scheduleDays || plan.schedule_days,
              durationWeeks: planDurationWeeks,
              startDate: planStartDate,
              endDate: plan.endDate || plan.end_date,
              currentWeek: dynamicCurrentWeek,
              isProgramComplete: programComplete,
            };
          });
          setSelectedWorkoutId(mappedPlans[0]?.id || "");

          // Fetch today's workout log to restore completion state
          await restoreCompletionState(mappedPlans);
        } else {
          // No plans - show empty state
          setWorkouts([]);
          setSelectedWorkoutId("");
        }

        // Process weekly stats
        const stats = statsResponse?.data?.stats;
        if (stats) {
          setWorkoutStats({
            weeklyWorkouts: stats.weeklyWorkouts || 0,
            weeklyGoal: stats.weeklyGoal || 5,
            totalMinutes: stats.totalMinutes || 0,
            caloriesBurned: stats.caloriesBurned || 0,
            currentStreak: stats.currentStreak || 0,
          });
        }

        // Process weekly schedule and calculate daily progress
        const schedule = scheduleResponse?.data?.schedule;
        if (schedule && schedule.length > 0) {
          setWeeklySchedule(schedule.map(day => ({
            day: day.day,
            name: day.name,
            completed: day.completed,
            isToday: day.isToday,
            isRest: day.isRest,
            scheduledTime: day.scheduledTime,
            planId: day.planId,
          })));
          
          // Calculate daily progress from workout logs and schedule
          // Only calculate if we have mapped plans
          if (mappedPlans.length > 0) {
            const selectedPlan = mappedPlans.find(p => p.id === selectedWorkoutId) || mappedPlans[0];
            const weekNumber = selectedPlan?.currentWeek || 1;
            const startDate = selectedPlan?.startDate;
            await calculateDailyProgress(schedule, mappedPlans, weekNumber, startDate);
          }
        }

        // Process personal records
        const records = prsResponse?.data?.records;
        if (records && records.length > 0) {
          setPersonalRecords(records.map(pr => ({
            exerciseName: pr.exerciseName,
            weight: pr.weight,
            reps: pr.reps,
            improvement: pr.improvement,
            date: pr.date,
          })));
        }
      } catch (err) {
        workoutLogger.error('Failed to load workout data', err, { component: 'WorkoutsTab', action: 'loadWorkoutData' });
        // Show empty state on error
        setWorkouts([]);
        setSelectedWorkoutId("");
      } finally {
        setIsLoadingPlans(false);
        workoutLogger.logAPI('fetch', 'workout-data', { success: true, component: 'WorkoutsTab' });
      }
    };

    loadWorkoutData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreCompletionState]);

  // Start workout session
  const startWorkout = useCallback(() => {
    if (!selectedWorkout) return;

    workoutLogger.logSession('start', {
      planId: selectedWorkoutId,
      component: 'WorkoutsTab',
      exerciseCount: selectedWorkout.exercises.length,
    });

    // Reset all exercises to not completed
    setWorkouts(prev => prev.map(w =>
      w.id === selectedWorkoutId
        ? { ...w, exercises: w.exercises.map(e => ({ ...e, completed: false })) }
        : w
    ));

    setSession({
      isActive: true,
      isPaused: false,
      elapsedSeconds: 0,
      currentExerciseIndex: 0,
      isResting: false,
      restTimeRemaining: 0,
    });
    setCurrentQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, [selectedWorkout, selectedWorkoutId]);

  // Pause/Resume workout
  const togglePause = useCallback(() => {
    setSession(prev => {
      const newPausedState = !prev.isPaused;
      workoutLogger.logSession(newPausedState ? 'pause' : 'resume', { planId: selectedWorkoutId });
      return { ...prev, isPaused: newPausedState };
    });
  }, [selectedWorkoutId]);

  // Stop workout
  const stopWorkout = useCallback(() => {
    workoutLogger.logSession('cancel', { planId: selectedWorkoutId });
    setSession({
      isActive: false,
      isPaused: false,
      elapsedSeconds: 0,
      currentExerciseIndex: 0,
      isResting: false,
      restTimeRemaining: 0,
    });
  }, [selectedWorkoutId]);

  // Complete workout
  const completeWorkout = useCallback(() => {
    workoutLogger.logSession('complete', { planId: selectedWorkoutId, duration: session.elapsedSeconds });
    setShowCompletionModal(true);
    setSession({
      isActive: false,
      isPaused: false,
      elapsedSeconds: 0,
      currentExerciseIndex: 0,
      isResting: false,
      restTimeRemaining: 0,
    });
  }, [selectedWorkoutId, session.elapsedSeconds]);

  // Toggle exercise completion - updates the main workouts state and persists to API
  const toggleExercise = useCallback(async (exerciseId: string) => {
    const workout = workouts.find(w => w.id === selectedWorkoutId);
    if (!workout) return;

    const exercise = workout.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const newCompletedState = !exercise.completed;

    // Update local state immediately for responsiveness
    setWorkouts(prev => prev.map(w => {
      if (w.id !== selectedWorkoutId) return w;

      const updatedExercises = w.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, completed: newCompletedState } : ex
      );

      // Check if all exercises are completed
      const allCompleted = updatedExercises.every(ex => ex.completed);
      if (allCompleted && session.isActive) {
        // Show completion modal
        setTimeout(() => completeWorkout(), 500);
      }

      // If completing an exercise during active session, start rest timer
      if (newCompletedState && session.isActive && exercise.restSeconds) {
        setSession(prev => ({
          ...prev,
          isResting: true,
          restTimeRemaining: exercise.restSeconds || 60,
        }));
      }

      return { ...w, exercises: updatedExercises };
    }));

    // Persist to API - save the current completed exercises (both when checking and unchecking)
    setIsSavingProgress(true);
    try {
      // Get all completed exercises for this workout after the toggle
      // When completing: include this exercise
      // When uncompleting: exclude this exercise
      const allCompletedExercises = workout.exercises
        .filter(ex => {
          if (ex.id === exerciseId) {
            return newCompletedState; // Include only if we're completing it
          }
          return ex.completed; // Keep other exercises as-is
        })
        .map(ex => {
          // Parse reps from string like "8-10" to get a number
          const repsStr = ex.reps || "10";
          const repsNum = parseInt(repsStr.split('-')[0]) || 10;

          // Parse weight from string like "60kg" or "60" to get a number
          const weightStr = ex.weight || "0";
          const weightNum = parseFloat(weightStr.replace(/[^0-9.]/g, '')) || 0;

          // Create sets array - each set marked as completed
          const setsArray = Array.from({ length: ex.sets || 1 }, () => ({
            reps: repsNum,
            weight: weightNum,
            completed: true,
          }));

          return {
            exerciseId: ex.id,
            sets: setsArray,
            notes: ex.name,
          };
        });

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await workoutsService.logWorkout({
        // Only include workoutPlanId if it's a valid UUID (not mock data)
        ...(isValidUUID(selectedWorkoutId) ? { workoutPlanId: selectedWorkoutId } : {}),
        scheduledDate: todayStr,
        workoutName: workout.name,
        exercisesCompleted: allCompletedExercises,
        durationMinutes: session.elapsedSeconds ? Math.round(session.elapsedSeconds / 60) : undefined,
      });

      workoutLogger.debug('Workout progress saved', {
        component: 'WorkoutsTab',
        exerciseId,
        newState: newCompletedState,
        totalCompleted: allCompletedExercises.length,
      });

      // Refresh daily progress after saving
      if (weeklySchedule.length > 0) {
        const scheduleForProgress = weeklySchedule.map(day => ({
          day: day.day,
          dayName: day.name,
          isRest: day.isRest || false,
          planId: day.planId,
        }));
        // Get current week and start date from selected workout
        const selectedPlan = workouts.find(w => w.id === selectedWorkoutId);
        const weekNumber = selectedPlan?.currentWeek || 1;
        const startDate = selectedPlan?.startDate;
        await calculateDailyProgress(scheduleForProgress, workouts, weekNumber, startDate);
      }
    } catch (err) {
      workoutLogger.error('Failed to save workout progress', err, { component: 'WorkoutsTab' });
      // Note: We don't revert local state - optimistic update stays
    } finally {
      setIsSavingProgress(false);
    }
  }, [workouts, selectedWorkoutId, session.isActive, session.elapsedSeconds, completeWorkout, weeklySchedule, calculateDailyProgress]);

  // Skip rest
  const skipRest = useCallback(() => {
    setSession(prev => ({ ...prev, isResting: false, restTimeRemaining: 0 }));
  }, []);

  // Update exercise weight from execution drawer
  const updateExerciseWeight = useCallback((exerciseId: string, weight: string) => {
    setWorkouts(prev => prev.map(w => {
      if (w.id !== selectedWorkoutId) return w;
      return { ...w, exercises: w.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, weight } : ex
      )};
    }));
  }, [selectedWorkoutId]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      muscleGroups: [],
      difficulty: "beginner",
      scheduledTime: "07:00",
      exercises: [],
      description: "",
      useAI: false,
      aiPrompt: "",
      workoutsPerWeek: 4,
      selectedDays: ['monday', 'tuesday', 'thursday', 'friday'],
    });
    setAiFormData({
      description: "",
      durationWeeks: 1,
      workoutsPerWeek: 3,
      timePerWorkout: 45,
      fitnessLevel: "beginner",
      equipment: ["bodyweight"],
      workoutLocation: "home",
      goalCategory: "muscle_building",
      selectedDays: ['monday', 'wednesday', 'friday'],
      startDate: new Date().toISOString().split('T')[0],
    });
    setGeneratedPlan(null);
    setAIWorkoutTips([]);
    setCreateMode("ai");
  }, []);

  // Generate AI workout plan
  const handleGenerateAIPlan = useCallback(async () => {
    if (!aiFormData.description.trim()) return;

    setIsGeneratingAIPlan(true);
    workoutLogger.logAIGeneration('start', {
      component: 'WorkoutsTab',
      action: 'generateAIPlan',
      durationWeeks: aiFormData.durationWeeks,
      workoutsPerWeek: aiFormData.workoutsPerWeek,
    });

    try {
      const response = await workoutsService.generateAIPlan({
        description: aiFormData.description,
        goalCategory: aiFormData.goalCategory,
        fitnessLevel: aiFormData.fitnessLevel,
        durationWeeks: aiFormData.durationWeeks,
        workoutsPerWeek: aiFormData.workoutsPerWeek,
        equipment: aiFormData.equipment,
        workoutLocation: aiFormData.workoutLocation,
        timePerWorkout: aiFormData.timePerWorkout,
      });

      if (response.data?.plan) {
        const plan = response.data.plan;

        // Create workout plan from AI response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const planAny = plan as any;
        const aiSchedule = (planAny.weeklySchedule || planAny.weekly_schedule || {}) as Record<string, DayWorkout | null>;

        // Build exercises array from the schedule's first workout day
        const firstDayWorkout = Object.values(aiSchedule).find((d) => d !== null) as DayWorkout | undefined;
        const rawExercises = planAny.exercises || firstDayWorkout?.exercises || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exercises = rawExercises.map((ex: any, idx: number) => ({
          id: ex.id || `ai-${Date.now()}-${idx}`,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          restSeconds: ex.restSeconds,
          muscleGroup: ex.muscleGroup,
          completed: false,
        }));

        const planStartDate = planAny.start_date || planAny.startDate || new Date().toISOString().split('T')[0];

        const newWorkout: WorkoutPlan = {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          muscleGroups: plan.muscleGroups || [],
          exercises,
          duration: plan.duration || aiFormData.timePerWorkout,
          scheduledTime: "07:00",
          difficulty: aiFormData.fitnessLevel,
          isCustom: false,
          weeklySchedule: aiSchedule,
          durationWeeks: aiFormData.durationWeeks,
          startDate: planStartDate,
          endDate: planAny.end_date || planAny.endDate,
          currentWeek: 1,
        };

        setWorkouts(prev => [...prev, newWorkout]);
        setSelectedWorkoutId(newWorkout.id);
        setAIWorkoutTips(response.data.tips || []);

        workoutLogger.logAIGeneration('success', {
          component: 'WorkoutsTab',
          action: 'generateAIPlan',
          provider: response.data.provider || 'AI',
          planId: newWorkout.id,
        });

        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      workoutLogger.logAIGeneration('error', {
        component: 'WorkoutsTab',
        action: 'generateAIPlan',
      });
      workoutLogger.error('Failed to generate AI workout plan', error, { component: 'WorkoutsTab' });
    } finally {
      setIsGeneratingAIPlan(false);
    }
  }, [aiFormData, resetForm]);

  // Toggle equipment selection for AI form
  const toggleEquipment = useCallback((equipment: string) => {
    setAiFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment],
    }));
  }, []);

  // Create new workout
  const handleCreateWorkout = useCallback(async () => {
    if (!formData.name.trim()) return;

    setIsCreatingPlan(true);
    workoutLogger.info('Creating workout plan', {
      component: 'WorkoutsTab',
      action: 'createPlan',
      exerciseCount: formData.exercises.length,
    });

    try {
      // Build weekly schedule from exercises - use selectedDays
      const weeklySchedule: Record<string, unknown> = {};
      const selectedDays = formData.selectedDays && formData.selectedDays.length > 0
        ? formData.selectedDays
        : ['monday', 'tuesday', 'thursday', 'friday']; // Default to 4 days
      
      if (formData.exercises.length > 0) {
        // Derive day name from muscle groups or exercises rather than the plan name
        const dayMuscleGroups = formData.muscleGroups.length > 0
          ? formData.muscleGroups.join(', ')
          : 'Full Body';
        const dayWorkoutName = formData.muscleGroups.length > 0
          ? `${formData.muscleGroups.slice(0, 3).join(' & ')} Day`
          : formData.name;

        selectedDays.forEach((day) => {
          weeklySchedule[day] = {
            dayOfWeek: day,
            workoutName: dayWorkoutName,
            focusArea: dayMuscleGroups,
            exercises: formData.exercises.map((ex, idx) => ({
              id: `manual-${day}-${idx}`,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds || 60,
              muscleGroup: ex.muscleGroup,
            })),
            estimatedDuration: formData.exercises.length * 8,
            estimatedCalories: formData.exercises.length * 25,
          };
        });
      }

      const response = await workoutsService.createPlan({
        name: formData.name,
        description: formData.description || undefined,
        fitnessLevel: formData.difficulty,
        scheduledTime: formData.scheduledTime,
        muscleGroups: formData.muscleGroups,
        exercises: formData.exercises,
        weeklySchedule,
        workoutsPerWeek: selectedDays.length,
        isActive: true,
      });

      if (response.data?.plan) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createdPlan = response.data.plan as any;
        const createdSchedule = createdPlan.weeklySchedule || createdPlan.weekly_schedule || weeklySchedule;
        const newWorkout: WorkoutPlan = {
          id: createdPlan.id,
          name: createdPlan.name,
          muscleGroups: formData.muscleGroups,
          exercises: formData.exercises,
          duration: formData.exercises.length * 8,
          scheduledTime: formData.scheduledTime,
          difficulty: formData.difficulty,
          isCustom: true,
          weeklySchedule: createdSchedule as Record<string, DayWorkout | null>,
          durationWeeks: createdPlan.duration_weeks || createdPlan.durationWeeks || 4,
          startDate: createdPlan.start_date || createdPlan.startDate || new Date().toISOString().split('T')[0],
          currentWeek: 1,
        };
        setWorkouts(prev => [...prev, newWorkout]);
        setSelectedWorkoutId(newWorkout.id);
        workoutLogger.logAPI('create', 'workout-plan', { success: true, planId: newWorkout.id });
      }

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      workoutLogger.error('Failed to create workout plan', error, { component: 'WorkoutsTab', action: 'createPlan' });
      // Still create locally as fallback
      const newWorkout: WorkoutPlan = {
        id: Date.now().toString(),
        name: formData.name || "Custom Workout",
        muscleGroups: formData.muscleGroups,
        exercises: formData.exercises,
        duration: formData.exercises.length * 8,
        scheduledTime: formData.scheduledTime,
        difficulty: formData.difficulty,
        isCustom: true,
      };
      setWorkouts(prev => [...prev, newWorkout]);
      setShowCreateModal(false);
      resetForm();
    } finally {
      setIsCreatingPlan(false);
    }
  }, [formData, resetForm]);

  // Open edit modal
  const handleEditWorkout = useCallback((workout: WorkoutPlan) => {
    setEditingWorkout(workout);
    
    // Extract selected days from weeklySchedule
    const selectedDays: string[] = [];
    if (workout.weeklySchedule) {
      Object.keys(workout.weeklySchedule).forEach(day => {
        if (workout.weeklySchedule?.[day] !== null) {
          selectedDays.push(day);
        }
      });
    }
    
    // Populate form with workout data
    setFormData({
      name: workout.name,
      muscleGroups: workout.muscleGroups,
      difficulty: workout.difficulty,
      scheduledTime: workout.scheduledTime || "07:00",
      exercises: workout.exercises,
      description: workout.description || "",
      useAI: false,
      aiPrompt: "",
      workoutsPerWeek: selectedDays.length > 0 ? selectedDays.length : workout.durationWeeks ? 4 : 4,
      selectedDays: selectedDays.length > 0 ? selectedDays : ['monday', 'tuesday', 'thursday', 'friday'],
    });
  }, []);

  // Update existing workout
  const handleUpdateWorkout = useCallback(async () => {
    if (!editingWorkout || !formData.name.trim()) return;

    setIsUpdatingPlan(true);
    workoutLogger.info('Updating workout plan', {
      component: 'WorkoutsTab',
      action: 'updatePlan',
      planId: editingWorkout.id,
    });

    try {
      // Build weekly schedule from selectedDays - update all selected days with exercises
      const selectedDays = formData.selectedDays && formData.selectedDays.length > 0
        ? formData.selectedDays
        : ['monday', 'tuesday', 'thursday', 'friday']; // Default to 4 days
      
      const weeklyScheduleData: Record<string, DayWorkout | null> = {};
      
      // Set workouts for selected days
      selectedDays.forEach((day) => {
        if (formData.exercises.length > 0) {
          weeklyScheduleData[day] = {
            dayOfWeek: day,
            workoutName: formData.name,
            focusArea: formData.muscleGroups.join(', ') || 'Full Body',
            exercises: formData.exercises.map((ex, idx) => ({
              id: ex.id || `edit-${day}-${idx}`,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds || 60,
              muscleGroup: ex.muscleGroup,
            })),
            estimatedDuration: formData.exercises.length * 8,
            estimatedCalories: formData.exercises.length * 25,
          };
        } else {
          // No exercises = rest day
          weeklyScheduleData[day] = null;
        }
      });
      
      // Set all other days as rest days
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      allDays.forEach(day => {
        if (!selectedDays.includes(day)) {
          weeklyScheduleData[day] = null;
        }
      });

      // Only call API if it's a valid UUID
      if (isValidUUID(editingWorkout.id)) {
        await workoutsService.updatePlan(editingWorkout.id, {
          name: formData.name,
          description: formData.description || undefined,
          fitnessLevel: formData.difficulty,
          scheduledTime: formData.scheduledTime,
          muscleGroups: formData.muscleGroups,
          exercises: formData.exercises.map(ex => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            duration: ex.duration ? parseInt(ex.duration) : undefined,
            restSeconds: ex.restSeconds,
            muscleGroup: ex.muscleGroup,
          })),
          weeklySchedule: weeklyScheduleData,
          workoutsPerWeek: selectedDays.length,
        });
        workoutLogger.logAPI('update', 'workout-plan', { success: true, planId: editingWorkout.id });
      }

      // Update local state including weeklySchedule
      const updatedWorkout: WorkoutPlan = {
        ...editingWorkout,
        name: formData.name,
        description: formData.description,
        muscleGroups: formData.muscleGroups,
        exercises: formData.exercises,
        duration: formData.exercises.length * 8,
        scheduledTime: formData.scheduledTime,
        difficulty: formData.difficulty,
        weeklySchedule: weeklyScheduleData,
      };

      setWorkouts(prev => prev.map(w => w.id === editingWorkout.id ? updatedWorkout : w));
      setEditingWorkout(null);
      resetForm();
    } catch (error) {
      workoutLogger.error('Failed to update workout plan', error, { component: 'WorkoutsTab', action: 'updatePlan' });
      // Still update locally with weeklySchedule
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayKey = days[new Date().getDay()];
      const existingSchedule = (editingWorkout.weeklySchedule || {}) as Record<string, DayWorkout | null>;
      const weeklyScheduleData: Record<string, DayWorkout | null> = { ...existingSchedule };

      if (formData.exercises.length > 0) {
        weeklyScheduleData[todayKey] = {
          dayOfWeek: todayKey,
          workoutName: formData.name,
          focusArea: formData.muscleGroups.join(', ') || 'Full Body',
          exercises: formData.exercises.map(ex => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds || 60,
            muscleGroup: ex.muscleGroup,
          })),
          estimatedDuration: formData.exercises.length * 8,
          estimatedCalories: formData.exercises.length * 25,
        };
      }

      const updatedWorkout: WorkoutPlan = {
        ...editingWorkout,
        name: formData.name,
        description: formData.description,
        muscleGroups: formData.muscleGroups,
        exercises: formData.exercises,
        duration: formData.exercises.length * 8,
        scheduledTime: formData.scheduledTime,
        difficulty: formData.difficulty,
        weeklySchedule: weeklyScheduleData,
      };
      setWorkouts(prev => prev.map(w => w.id === editingWorkout.id ? updatedWorkout : w));
      setEditingWorkout(null);
      resetForm();
    } finally {
      setIsUpdatingPlan(false);
    }
  }, [editingWorkout, formData, resetForm]);

  // Save day workout (update single day in weeklySchedule)
  const handleSaveDayWorkout = useCallback(async (dayOfWeek: string, updatedWorkout: DayWorkout | null) => {
    if (!selectedWorkout) return;

    workoutLogger.info('Saving day workout', {
      component: 'WorkoutsTab',
      action: 'saveDayWorkout',
      dayOfWeek,
      planId: selectedWorkout.id,
    });

    try {
      // Get current weeklySchedule
      const currentSchedule = (selectedWorkout.weeklySchedule || {}) as Record<string, DayWorkout | null>;
      const updatedSchedule = { ...currentSchedule };
      updatedSchedule[dayOfWeek] = updatedWorkout;

      // Update via API if valid UUID
      if (isValidUUID(selectedWorkout.id)) {
        await workoutsService.updatePlan(selectedWorkout.id, {
          weeklySchedule: updatedSchedule,
        });
      }

      // Update local state
      const updatedWorkoutPlan: WorkoutPlan = {
        ...selectedWorkout,
        weeklySchedule: updatedSchedule,
      };

      setWorkouts(prev => prev.map(w => w.id === selectedWorkout.id ? updatedWorkoutPlan : w));

      // Refresh daily progress
      if (weeklySchedule.length > 0) {
        const scheduleResponse = await workoutsService.getWeeklySchedule(selectedWorkout.id);
        const schedule = scheduleResponse.data?.schedule;
        if (schedule && schedule.length > 0) {
          const weekNumber = selectedWorkout.currentWeek || 1;
          const startDate = selectedWorkout.startDate;
          await calculateDailyProgress(schedule, workouts, weekNumber, startDate);
        }
      }

      workoutLogger.logAPI('update', 'day-workout', { success: true, dayOfWeek });
    } catch (error) {
      workoutLogger.error('Failed to save day workout', error, { component: 'WorkoutsTab' });
      throw error; // Re-throw so modal can handle it
    }
  }, [selectedWorkout, weeklySchedule, workouts, calculateDailyProgress]);

  // Delete workout
  const handleDeleteWorkout = useCallback(async (workoutId: string) => {
    workoutLogger.info('Deleting workout plan', { planId: workoutId, component: 'WorkoutsTab' });

    // Update local state immediately for responsiveness
    setWorkouts(prev => {
      const filtered = prev.filter(w => w.id !== workoutId);
      if (selectedWorkoutId === workoutId && filtered.length > 0) {
        setSelectedWorkoutId(filtered[0].id);
      }
      return filtered;
    });
    setShowDeleteConfirm(null);

    // Also delete from API if it's a valid UUID (not a mock ID)
    if (isValidUUID(workoutId)) {
      try {
        await workoutsService.deletePlan(workoutId);
        workoutLogger.logAPI('delete', 'workout-plan', { success: true, planId: workoutId });
      } catch (error) {
        workoutLogger.error('Failed to delete workout plan from API', error, { planId: workoutId });
        // Note: We don't revert local state - user already sees deletion
      }
    }
  }, [selectedWorkoutId]);

  // Add exercise to form
  const addExerciseToForm = useCallback((exerciseName: string, muscleGroup: string) => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exerciseName,
      sets: 3,
      reps: "10-12",
      restSeconds: 60,
      completed: false,
      muscleGroup,
    };
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
    }));
  }, []);

  // Remove exercise from form
  const removeExerciseFromForm = useCallback((exerciseId: string) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId),
    }));
  }, []);

  // Update exercise in form
  const updateExerciseInForm = useCallback((exerciseId: string, updates: Partial<Exercise>) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      ),
    }));
  }, []);

  // Toggle muscle group selection
  const toggleMuscleGroup = useCallback((group: string) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(group)
        ? prev.muscleGroups.filter(g => g !== group)
        : [...prev.muscleGroups, group],
    }));
  }, []);

  // Handle drag end to reorder workouts
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWorkouts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        workoutLogger.info('Workout plans reordered', {
          component: 'WorkoutsTab',
          action: 'reorder',
          fromIndex: oldIndex,
          toIndex: newIndex,
        });

        // Optionally save the new order to backend here
        // You could add a preference field or API endpoint to persist the order

        return newItems;
      });
    }
  }, []);

  // Get AI exercise suggestions
  const handleGetAISuggestions = useCallback(async () => {
    if (formData.muscleGroups.length === 0) return;

    setIsLoadingAISuggestions(true);
    workoutLogger.logAIGeneration('start', {
      component: 'WorkoutsTab',
      action: 'suggestExercises',
      provider: 'AI',
    });

    try {
      const response = await workoutsService.suggestExercises({
        muscleGroups: formData.muscleGroups,
        difficulty: formData.difficulty,
        equipment: ['bodyweight', 'dumbbells', 'barbell'], // Default equipment
        duration: 45,
      });

      if (response.data?.exercises) {
        const suggestedExercises: Exercise[] = response.data.exercises.map((ex, index) => ({
          id: `ai-${Date.now()}-${index}`,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          restSeconds: ex.restSeconds,
          muscleGroup: ex.muscleGroup,
          completed: false,
        }));
        setFormData(prev => ({
          ...prev,
          exercises: [...prev.exercises, ...suggestedExercises],
        }));
        setAIWorkoutTips(response.data.workoutTips || []);

        workoutLogger.logAIGeneration('success', {
          component: 'WorkoutsTab',
          action: 'suggestExercises',
          provider: response.data.provider || 'AI',
          exerciseCount: suggestedExercises.length,
        });
      }
    } catch (error) {
      workoutLogger.logAIGeneration('error', {
        component: 'WorkoutsTab',
        action: 'suggestExercises',
      });
      workoutLogger.error('Failed to get AI suggestions', error, { component: 'WorkoutsTab' });
    } finally {
      setIsLoadingAISuggestions(false);
    }
  }, [formData.muscleGroups, formData.difficulty]);

  // Calculate workout progress
  const completedExercises = selectedWorkout?.exercises.filter(e => e.completed).length || 0;
  const totalExercises = selectedWorkout?.exercises.length || 0;
  const progressPercentage = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Active Workout Session Banner */}
      <AnimatePresence>
        {session.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-6 relative overflow-hidden">
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center"
                    >
                      <Dumbbell className="w-8 h-8 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-white font-bold text-xl">{selectedWorkout?.name}</h3>
                      <div className="flex items-center gap-2 text-white/80">
                        <Timer className="w-4 h-4" />
                        <span className="text-2xl font-mono font-bold">{formatTime(session.elapsedSeconds)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePause}
                      className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                      {session.isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={stopWorkout}
                      className="p-3 rounded-xl bg-white/20 hover:bg-red-500/50 text-white transition-colors"
                    >
                      <Square className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Motivational Quote */}
                <motion.div
                  key={currentQuote}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-white/90"
                >
                  <Sparkles className="w-4 h-4" />
                  <p className="text-sm font-medium italic">{currentQuote}</p>
                </motion.div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-white/80 text-sm mb-2">
                    <span>Progress</span>
                    <span>{completedExercises}/{totalExercises} exercises</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest Timer Modal */}
      <AnimatePresence>
        {session.isResting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-cyan-500/20 flex items-center justify-center"
              >
                <RotateCcw className="w-12 h-12 text-cyan-400" />
              </motion.div>

              <h3 className="text-xl font-bold text-white mb-2">Rest Time</h3>
              <p className="text-slate-400 mb-6">Catch your breath and prepare for the next set!</p>

              <div className="text-6xl font-mono font-bold text-cyan-400 mb-6">
                {formatTime(session.restTimeRemaining)}
              </div>

              <button
                onClick={skipRest}
                className="w-full py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors"
              >
                Skip Rest
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workout Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-3xl p-8 max-w-sm w-full text-center"
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center"
              >
                <Trophy className="w-12 h-12 text-amber-400" />
              </motion.div>

              <h3 className="text-2xl font-bold text-white mb-2">Workout Complete! 🎉</h3>
              <p className="text-slate-300 mb-4">Amazing work! You crushed it!</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white">{formatTime(session.elapsedSeconds || 0)}</p>
                  <p className="text-xs text-slate-400">Duration</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-white">{totalExercises}</p>
                  <p className="text-xs text-slate-400">Exercises</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-6 text-emerald-400">
                <Award className="w-5 h-5" />
                <span className="font-medium">+50 XP Earned!</span>
              </div>

              <button
                onClick={async () => {
                  setShowCompletionModal(false);
                  // Refresh daily progress after closing completion modal
                  if (weeklySchedule.length > 0) {
                    try {
                      const scheduleResponse = await workoutsService.getWeeklySchedule(selectedWorkoutId);
                      const schedule = scheduleResponse.data?.schedule;
                      if (schedule && schedule.length > 0) {
                        const selectedPlan = workouts.find(w => w.id === selectedWorkoutId);
                        const weekNumber = selectedPlan?.currentWeek || 1;
                        const startDate = selectedPlan?.startDate;
                        await calculateDailyProgress(schedule, workouts, weekNumber, startDate);
                      }
                    } catch (err) {
                      workoutLogger.error('Failed to refresh progress', err, { component: 'WorkoutsTab' });
                    }
                  }

                  // Check for full plan completion (multi-week plans only)
                  const plan = workouts.find(w => w.id === selectedWorkoutId);
                  if (plan && plan.durationWeeks && plan.durationWeeks > 1 && plan.status !== 'completed') {
                    try {
                      const fullProgress = await buildFullPlanProgress(plan);
                      const check = checkPlanCompletion(plan, fullProgress);
                      if (check.isComplete) {
                        const stats = await calculatePlanStats(plan, check);
                        setPlanCompletionStats(stats);
                        setShowPlanCompletion(true);
                        // Mark plan as completed in the database
                        if (isValidUUID(plan.id)) {
                          await workoutsService.updatePlan(plan.id, { status: 'completed' });
                          // Update local state
                          setWorkouts(prev => prev.map(w =>
                            w.id === plan.id ? { ...w, status: 'completed' } : w
                          ));
                        }
                      }
                    } catch (err) {
                      workoutLogger.error('Plan completion check failed', err, { component: 'WorkoutsTab' });
                    }
                  }
                }}
                className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Completion Celebration Modal */}
      <PlanCompletionCelebration
        isOpen={showPlanCompletion}
        onClose={() => { setShowPlanCompletion(false); setPlanCompletionStats(null); }}
        onCreateNewPlan={() => { setShowPlanCompletion(false); setPlanCompletionStats(null); setShowCreateModal(true); }}
        stats={planCompletionStats}
      />

      {/* Day Workout Edit Modal */}
      {editingDay && selectedWorkout && (
        <DayWorkoutEditModal
          isOpen={!!editingDay}
          onClose={() => setEditingDay(null)}
          dayOfWeek={editingDay.dayOfWeek}
          workout={editingDay.workout}
          planName={selectedWorkout.name}
          onSave={handleSaveDayWorkout}
        />
      )}

      {/* Exercise Execution Drawer */}
      <ExerciseExecutionDrawer
        exercise={executionDrawerExercise}
        isOpen={!!executionDrawerExercise}
        onClose={() => setExecutionDrawerExercise(null)}
        onToggleComplete={toggleExercise}
        onUpdateWeight={updateExerciseWeight}
      />

      {/* Header with Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-red-500/10 to-transparent border border-orange-500/20 p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-orange-500/20">
                  <Dumbbell className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-orange-400 text-sm font-medium">AI Workout Plan</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Your Fitness Journey</h2>
              <p className="text-slate-400 text-sm">Personalized workouts adapted to your progress</p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Plan
              </motion.button>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-slate-400">This Week</span>
              </div>
              <p className="text-2xl font-bold text-white">{workoutStats.weeklyWorkouts}<span className="text-sm text-slate-400">/{workoutStats.weeklyGoal}</span></p>
              <p className="text-xs text-slate-500">Workouts</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400">Total Time</span>
              </div>
              <p className="text-2xl font-bold text-white">{workoutStats.totalMinutes}</p>
              <p className="text-xs text-slate-500">Minutes</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">Burned</span>
              </div>
              <p className="text-2xl font-bold text-white">{workoutStats.caloriesBurned}</p>
              <p className="text-xs text-slate-500">Calories</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">Streak</span>
              </div>
              <p className="text-2xl font-bold text-white">{workoutStats.currentStreak}</p>
              <p className="text-xs text-slate-500">Days</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* View Toggle */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50 w-fit">
        {[
          { id: "today", label: "Today", icon: Calendar },
          { id: "plan", label: "My Plans", icon: BarChart3 },
          { id: "weekly", label: "Weekly", icon: ListOrdered },
          { id: "calendar", label: "Calendar", icon: CalendarDays },
          { id: "analytics", label: "Analytics", icon: TrendingUp },
          { id: "schedule", label: "Schedule", icon: RefreshCw },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as typeof activeView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeView === view.id
                ? "bg-orange-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <view.icon className="w-4 h-4" />
            {view.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {isLoadingPlans && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              <p className="text-slate-400">Loading workout plans...</p>
            </div>
          </motion.div>
        )}

        {/* Plan Completed Banner (when plan status is completed OR program is past end date) */}
        {!isLoadingPlans && activeView === "today" && selectedWorkout && (selectedWorkout.status === "completed" || selectedWorkout.isProgramComplete) && (
          <PlanCompletedBanner
            planName={selectedWorkout.name}
            durationWeeks={selectedWorkout.durationWeeks || 1}
            completionRate={undefined}
            onViewSummary={async () => {
              try {
                const fullProgress = await buildFullPlanProgress(selectedWorkout);
                const check = checkPlanCompletion(selectedWorkout, fullProgress);
                const stats = await calculatePlanStats(selectedWorkout, check);
                setPlanCompletionStats(stats);
                setShowPlanCompletion(true);
              } catch (err) {
                workoutLogger.error('Failed to load plan summary', err);
              }
            }}
            onCreateNewPlan={() => setShowCreateModal(true)}
          />
        )}

        {!isLoadingPlans && activeView === "today" && !selectedWorkout && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
              <Dumbbell className="w-10 h-10 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Workout Plans Yet</h3>
            <p className="text-slate-400 text-center max-w-md mb-6">
              Create your first workout plan to start tracking your fitness journey
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow"
            >
              <Plus className="w-5 h-5" />
              Create Your First Plan
            </motion.button>
          </motion.div>
        )}

        {!isLoadingPlans && activeView === "today" && selectedWorkout && selectedWorkout.status !== "completed" && !selectedWorkout.isProgramComplete && (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Today's Workout Card */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
                {/* Workout Header */}
                <div className="p-6 border-b border-slate-700/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-medium">
                          Today
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium capitalize ${
                          selectedWorkout.difficulty === "beginner" ? "bg-emerald-500/20 text-emerald-400" :
                          selectedWorkout.difficulty === "intermediate" ? "bg-amber-500/20 text-amber-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {selectedWorkout.difficulty}
                        </span>
                        {selectedWorkout.scheduledTime && (
                          <span className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {selectedWorkout.scheduledTime}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{selectedWorkout.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedWorkout.muscleGroups.map((group) => (
                          <span key={group} className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(selectedWorkout.id)}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {!session.isActive ? (
                        selectedWorkout.exercises.length > 0 ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startWorkout}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow"
                          >
                            <Play className="w-5 h-5" />
                            Start
                          </motion.button>
                        ) : (
                          <motion.button
                            disabled
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-700/50 text-slate-500 font-semibold cursor-not-allowed opacity-60"
                          >
                            <Play className="w-5 h-5" />
                            Rest Day
                          </motion.button>
                        )
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={completeWorkout}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Finish Workout
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Progress Section with Circular Progress */}
                  <div className="flex items-center gap-6">
                    <CircularProgress
                      percentage={progressPercentage}
                      size={80}
                      strokeWidth={8}
                      labelSize="lg"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-2">
                          Todays Progress
                          {isSavingProgress && (
                            <span className="flex items-center gap-1 text-xs text-cyan-400">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Saving...
                            </span>
                          )}
                        </span>
                        <span className="text-white font-medium">{completedExercises}/{totalExercises} exercises</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {progressPercentage === 100 
                          ? "🎉 Great job! Workout complete!" 
                          : progressPercentage > 50 
                            ? "You're doing great! Keep going!" 
                            : "Let's crush this workout!"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Exercise List */}
                <div className="divide-y divide-slate-700/50">
                  {selectedWorkout.exercises.length === 0 ? (
                    <div className="p-8">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 animate-pulse" />
                          <Heart className="w-8 h-8 text-purple-400 relative z-10" />
                        </div>
                        <h4 className="text-lg font-semibold text-white mb-2">Rest Day</h4>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto mb-4">
                          No workout scheduled for today. Take time to recover and come back stronger!
                        </p>
                      </div>
                      
                      {/* Recovery Suggestions */}
                      <div className="space-y-3 max-w-md mx-auto">
                        <h5 className="text-sm font-semibold text-slate-300 mb-3 text-center">Recovery Suggestions</h5>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-400 text-lg">🧘</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">Light Stretching</p>
                              <p className="text-xs text-slate-500">10-15 minutes of gentle stretching</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-cyan-400 text-lg">💧</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">Stay Hydrated</p>
                              <p className="text-xs text-slate-500">Drink plenty of water throughout the day</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-emerald-400 text-lg">😴</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">Quality Sleep</p>
                              <p className="text-xs text-slate-500">Aim for 7-9 hours of restful sleep</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-slate-500 text-xs mt-6 text-center">
                        Check the weekly schedule to see your upcoming workouts.
                      </p>
                    </div>
                  ) : (
                    selectedWorkout.exercises.map((exercise, index) => (
                      <motion.div
                        key={exercise.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer ${
                          exercise.completed ? "bg-emerald-500/5" : ""
                        }`}
                        onClick={() => setExecutionDrawerExercise(exercise)}
                      >
                        <button
                          className="flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); toggleExercise(exercise.id); }}
                        >
                          {exercise.completed ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            </motion.div>
                          ) : (
                            <Circle className="w-6 h-6 text-slate-600 hover:text-orange-400 transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${exercise.completed ? "text-emerald-400" : "text-white"}`}>
                            {exercise.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {exercise.sets} sets × {exercise.reps}
                            {exercise.weight && ` • ${exercise.weight}`}
                            {exercise.restSeconds && ` • ${exercise.restSeconds}s rest`}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                          {exercise.muscleGroup}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className="space-y-4">
              {/* Weekly Analytics */}
              <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Weekly Progress
                </h4>

                {/* Daily Progress Bars */}
                <div className="space-y-3 mb-4">
                  {weeklySchedule.length > 0 ? (
                    weeklySchedule.map((day, index) => {
                      // Calculate progress: completed = 100%, rest day = 0% (grayed), scheduled = 0%
                      const progress = day.completed ? 100 : 0;
                      const isUpcoming = !day.isToday && index > weeklySchedule.findIndex(d => d.isToday);

                      return (
                        <div key={day.day} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                              day.isToday ? "text-orange-400" :
                              day.completed ? "text-emerald-400" :
                              "text-slate-500"
                            }`}>
                              {day.day}
                            </span>
                            <span className={`text-xs ${
                              day.isRest ? "text-slate-600" :
                              day.completed ? "text-emerald-400" :
                              isUpcoming ? "text-slate-600" :
                              "text-slate-400"
                            }`}>
                              {day.isRest ? "Rest" : day.completed ? "Done" : isUpcoming ? "Upcoming" : "Pending"}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: day.isRest ? "100%" : `${progress}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className={`h-full rounded-full ${
                                day.isRest ? "bg-slate-600/30" :
                                day.completed ? "bg-gradient-to-r from-emerald-500 to-green-400" :
                                day.isToday ? "bg-gradient-to-r from-orange-500/30 to-red-500/30" :
                                "bg-slate-600/20"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-2">
                      No schedule data available
                    </p>
                  )}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/50">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">
                      {weeklySchedule.filter(d => d.completed).length}
                    </p>
                    <p className="text-xs text-slate-500">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-400">
                      {weeklySchedule.filter(d => !d.completed && !d.isRest).length}
                    </p>
                    <p className="text-xs text-slate-500">Remaining</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-cyan-400">
                      {weeklySchedule.length > 0
                        ? Math.round((weeklySchedule.filter(d => d.completed).length /
                            weeklySchedule.filter(d => !d.isRest).length) * 100) || 0
                        : 0}%
                    </p>
                    <p className="text-xs text-slate-500">Rate</p>
                  </div>
                </div>
              </div>

              {/* Weekly Schedule Mini */}
              <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  This Week
                </h4>
                <div className="space-y-2">
                  {weeklySchedule.length > 0 ? (
                    weeklySchedule.map((day) => (
                      <div
                        key={day.day}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          day.isToday ? "bg-orange-500/10 border border-orange-500/30" : ""
                        }`}
                      >
                        <span className={`text-xs font-medium w-8 ${day.isToday ? "text-orange-400" : "text-slate-500"}`}>
                          {day.day}
                        </span>
                        <div className="flex-1">
                          <p className={`text-sm ${day.isRest ? "text-slate-500 italic" : "text-white"}`}>
                            {day.name}
                          </p>
                          {day.scheduledTime && !day.isRest && (
                            <p className="text-xs text-slate-500">{day.scheduledTime}</p>
                          )}
                        </div>
                        {day.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : day.isRest ? (
                          <Heart className="w-4 h-4 text-pink-400/50" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Create a workout plan to see your weekly schedule
                    </p>
                  )}
                </div>
              </div>

              {/* Personal Records */}
              <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-5">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Recent PRs
                </h4>
                <div className="space-y-3">
                  {personalRecords.length > 0 ? (
                    personalRecords.slice(0, 3).map((pr, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">{pr.exerciseName}</p>
                          <p className="text-xs text-slate-400">{pr.weight}kg × {pr.reps} reps</p>
                        </div>
                        <span className="text-xs text-amber-400 font-medium">+{pr.improvement}kg</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-2">
                      Complete workouts to set new personal records!
                    </p>
                  )}
                </div>
              </div>

              {/* AI Tip */}
              <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-violet-500/20 flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm mb-1">AI Tip</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Based on your progress, try increasing your bench press weight by 2.5kg next session. You&apos;re ready!
                    </p>
                  </div>
                </div>
              </div>

              {/* Workout Alarms Widget */}
              <WorkoutAlarmsWidget />

              {/* Motivational Videos Widget */}
              <MotivationalVideosWidget
                goalCategory="muscle_building"
                title="Get Motivated"
                maxVideos={5}
              />
            </div>
          </motion.div>
        )}

        {!isLoadingPlans && activeView === "plan" && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={workouts.map((w) => w.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workouts.map((workout, index) => (
                    <SortableWorkoutCard
                      key={workout.id}
                      workout={workout}
                      index={index}
                      isSelected={selectedWorkoutId === workout.id}
                      onSelect={() => setSelectedWorkoutId(workout.id)}
                      onEdit={(e) => {
                        e.stopPropagation();
                        handleEditWorkout(workout);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(workout.id);
                      }}
                    />
                  ))}

                  {/* Add New Workout Card */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: workouts.length * 0.05 }}
                    onClick={() => setShowCreateModal(true)}
                    className="rounded-2xl border-2 border-dashed border-slate-700 hover:border-orange-500/50 p-5 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-orange-400 transition-colors min-h-[180px]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-medium">Create New Workout</span>
                  </motion.button>
                </div>
              </SortableContext>
            </DndContext>
          </motion.div>
        )}

        {/* Weekly Plan View */}
        {!isLoadingPlans && activeView === "weekly" && selectedWorkout && (
          <motion.div
            key="weekly"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <WeeklyPlanView
              planName={selectedWorkout.name}
              durationWeeks={selectedWorkout.durationWeeks || 4}
              currentWeek={selectedWorkout.currentWeek || 1}
              weeks={selectedWorkout.weeks}
              weeklySchedule={selectedWorkout.weeklySchedule}
              dailyProgress={dailyProgress}
              startDate={selectedWorkout.startDate}
              onWeekChange={async (weekNumber) => {
                // Recalculate progress for the selected week
                if (selectedWorkout && selectedWorkout.startDate) {
                  const DAYS_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
                  const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                  const schedule = DAYS_ORDER.map((day, index) => {
                    const weekPlan = selectedWorkout.weeks?.[`week_${weekNumber}`];
                    const dayWorkout = weekPlan?.days?.[day] || selectedWorkout.weeklySchedule?.[day];
                    return {
                      day: DAY_SHORT[index],
                      dayName: day,
                      isRest: !dayWorkout,
                      planId: selectedWorkout.id,
                    };
                  });
                  await calculateDailyProgress(schedule, [selectedWorkout], weekNumber, selectedWorkout.startDate);
                }
              }}
              onDayClick={(day, workout) => {
                workoutLogger.info('Day clicked in weekly view', { day, workout: workout.workoutName });
                setEditingDay({ dayOfWeek: day, workout });
              }}
            />
          </motion.div>
        )}

        {/* Weekly View - No Plan Selected */}
        {!isLoadingPlans && activeView === "weekly" && !selectedWorkout && (
          <motion.div
            key="weekly-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
              <ListOrdered className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Plan Selected</h3>
            <p className="text-slate-400 mb-4">Select a workout plan to view the weekly schedule</p>
            <button
              onClick={() => setActiveView("plan")}
              className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              View My Plans
            </button>
          </motion.div>
        )}

        {/* Calendar View */}
        {!isLoadingPlans && activeView === "calendar" && selectedWorkout && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <WorkoutCalendar
              startDate={selectedWorkout.startDate || new Date().toISOString().split('T')[0]}
              endDate={selectedWorkout.endDate}
              durationWeeks={selectedWorkout.durationWeeks || 4}
              weeks={selectedWorkout.weeks}
              weeklySchedule={selectedWorkout.weeklySchedule}
              dailyProgress={dailyProgress}
              completedDates={new Set(
                Object.entries(dailyProgress)
                  .filter(([key, val]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && val >= 100)
                  .map(([key]) => key)
              )}
              onDayClick={(date, workout) => {
                workoutLogger.info('Day clicked in calendar', { date, workout: workout?.workoutName });
              }}
            />
          </motion.div>
        )}

        {/* Calendar View - No Plan Selected */}
        {!isLoadingPlans && activeView === "calendar" && !selectedWorkout && (
          <motion.div
            key="calendar-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
              <CalendarDays className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Plan Selected</h3>
            <p className="text-slate-400 mb-4">Select a workout plan to view the calendar</p>
            <button
              onClick={() => setActiveView("plan")}
              className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              View My Plans
            </button>
          </motion.div>
        )}

        {/* Analytics View */}
        {!isLoadingPlans && activeView === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {selectedWorkout ? (
              <WorkoutAnalytics
                selectedWorkoutId={selectedWorkoutId}
                workouts={workouts}
              />
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Workout Selected</h3>
                <p className="text-slate-400 mb-6">
                  Select a workout plan to view analytics
                </p>
                <button
                  onClick={() => setActiveView("plan")}
                  className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  View My Plans
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Schedule View */}
        {!isLoadingPlans && activeView === "schedule" && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Workout Schedule Management</h2>
              {selectedWorkout && (
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reschedule Workouts
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scheduled Tasks */}
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <WorkoutScheduleTasks workoutPlanId={selectedWorkoutId || undefined} refreshKey={rescheduleRefreshKey} />
              </div>

              {/* Reschedule History */}
              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <WorkoutRescheduleHistory workoutPlanId={selectedWorkoutId || undefined} refreshKey={rescheduleRefreshKey} />
              </div>
            </div>

            {/* Constraints */}
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <WorkoutConstraints />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Workout Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold text-white">Create New Workout</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="px-6 pt-4">
                <div className="flex gap-2 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <button
                    onClick={() => setCreateMode("ai")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      createMode === "ai"
                        ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Generate Plan
                  </button>
                  <button
                    onClick={() => setCreateMode("manual")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      createMode === "manual"
                        ? "bg-orange-500 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Manual Create
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[55vh] space-y-6">
                {createMode === "ai" ? (
                  /* AI Generation Form */
                  <>
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Describe Your Workout Goals
                      </label>
                      <textarea
                        value={aiFormData.description}
                        onChange={(e) => setAiFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="e.g., I want to build muscle and lose fat. I have 45 minutes to workout 4 days a week at home with dumbbells..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                      />
                    </div>

                    {/* Duration & Frequency Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Plan Duration
                        </label>
                        <select
                          value={aiFormData.durationWeeks}
                          onChange={(e) => setAiFormData(prev => ({ ...prev, durationWeeks: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500"
                        >
                          {DURATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Workouts Per Week
                        </label>
                        <select
                          value={aiFormData.workoutsPerWeek}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            const dayMappings: Record<number, string[]> = {
                              2: ['monday', 'thursday'],
                              3: ['monday', 'wednesday', 'friday'],
                              4: ['monday', 'tuesday', 'thursday', 'friday'],
                              5: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday'],
                              6: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
                            };
                            setAiFormData(prev => ({
                              ...prev,
                              workoutsPerWeek: value,
                              selectedDays: dayMappings[value] || dayMappings[3],
                            }));
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500"
                        >
                          {WORKOUTS_PER_WEEK_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Select Workout Days for AI */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Select Workout Days ({aiFormData.selectedDays?.length || 0} selected)
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = aiFormData.selectedDays?.includes(day) || false;
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const currentDays = aiFormData.selectedDays || [];
                                const newDays = currentDays.includes(day)
                                  ? currentDays.filter(d => d !== day)
                                  : [...currentDays, day];
                                setAiFormData(prev => ({
                                  ...prev,
                                  selectedDays: newDays,
                                  workoutsPerWeek: newDays.length > 0 ? newDays.length : prev.workoutsPerWeek,
                                }));
                              }}
                              className={`
                                px-3 py-2 rounded-xl border text-sm font-medium transition-all
                                ${isSelected
                                  ? "bg-violet-500/20 border-violet-500 text-violet-400"
                                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                                }
                              `}
                            >
                              {DAYS_LABELS[day]?.substring(0, 3) || day.substring(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time & Goal Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Time Per Workout
                        </label>
                        <select
                          value={aiFormData.timePerWorkout}
                          onChange={(e) => setAiFormData(prev => ({ ...prev, timePerWorkout: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500"
                        >
                          {TIME_PER_WORKOUT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Goal Category
                        </label>
                        <select
                          value={aiFormData.goalCategory}
                          onChange={(e) => setAiFormData(prev => ({ ...prev, goalCategory: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-violet-500"
                        >
                          {GOAL_CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fitness Level */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fitness Level
                      </label>
                      <div className="flex gap-2">
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setAiFormData(prev => ({ ...prev, fitnessLevel: option.value as typeof aiFormData.fitnessLevel }))}
                            className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                              aiFormData.fitnessLevel === option.value
                                ? "bg-violet-500/20 border-violet-500 text-violet-400"
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Workout Location
                      </label>
                      <div className="flex gap-2">
                        {LOCATION_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setAiFormData(prev => ({ ...prev, workoutLocation: option.value }))}
                            className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                              aiFormData.workoutLocation === option.value
                                ? "bg-violet-500/20 border-violet-500 text-violet-400"
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Equipment */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Available Equipment
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => toggleEquipment(option.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              aiFormData.equipment.includes(option.value)
                                ? "bg-violet-500/20 border border-violet-500 text-violet-400"
                                : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Tips */}
                    {aiWorkoutTips.length > 0 && (
                      <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-violet-400 mb-1">AI Tips</h4>
                            <ul className="text-xs text-slate-400 space-y-1">
                              {aiWorkoutTips.map((tip, i) => (
                                <li key={i}>• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Manual Creation Form */
                  <>
                    {/* Workout Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Workout Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Upper Body Power"
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Schedule Time */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Scheduled Time
                      </label>
                      <input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Workouts Per Week */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Workouts Per Week
                      </label>
                      <select
                        value={formData.workoutsPerWeek || 4}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          const dayMappings: Record<number, string[]> = {
                            2: ['monday', 'thursday'],
                            3: ['monday', 'wednesday', 'friday'],
                            4: ['monday', 'tuesday', 'thursday', 'friday'],
                            5: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday'],
                            6: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
                          };
                          setFormData(prev => ({
                            ...prev,
                            workoutsPerWeek: value,
                            selectedDays: dayMappings[value] || dayMappings[4],
                          }));
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                      >
                        {WORKOUTS_PER_WEEK_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Select Workout Days */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Select Workout Days ({formData.selectedDays?.length || 0} selected)
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = formData.selectedDays?.includes(day) || false;
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const currentDays = formData.selectedDays || [];
                                const newDays = currentDays.includes(day)
                                  ? currentDays.filter(d => d !== day)
                                  : [...currentDays, day];
                                setFormData(prev => ({
                                  ...prev,
                                  selectedDays: newDays,
                                  workoutsPerWeek: newDays.length > 0 ? newDays.length : prev.workoutsPerWeek || 4,
                                }));
                              }}
                              className={`
                                px-3 py-2 rounded-xl border text-sm font-medium transition-all
                                ${isSelected
                                  ? "bg-orange-500/20 border-orange-500 text-orange-400"
                                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                                }
                              `}
                            >
                              {DAYS_LABELS[day]?.substring(0, 3) || day.substring(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                      {(!formData.selectedDays || formData.selectedDays.length === 0) && (
                        <p className="text-xs text-red-400 mt-2">Please select at least one day</p>
                      )}
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Difficulty
                      </label>
                      <div className="flex gap-2">
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setFormData(prev => ({ ...prev, difficulty: option.value as typeof formData.difficulty }))}
                            className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                              formData.difficulty === option.value
                                ? "bg-orange-500/20 border-orange-500 text-orange-400"
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Muscle Groups */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Target Muscle Groups
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {MUSCLE_GROUPS.map((group) => (
                          <button
                            key={group}
                            onClick={() => toggleMuscleGroup(group)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              formData.muscleGroups.includes(group)
                                ? "bg-orange-500/20 border border-orange-500 text-orange-400"
                                : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600"
                            }`}
                          >
                            {group}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Suggestions Button */}
                    {formData.muscleGroups.length > 0 && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleGetAISuggestions}
                          disabled={isLoadingAISuggestions}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                        >
                          {isLoadingAISuggestions ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {isLoadingAISuggestions ? 'Getting AI Suggestions...' : 'Get AI Exercise Suggestions'}
                        </button>
                        {aiWorkoutTips.length > 0 && (
                          <div className="flex-1 text-xs text-slate-400">
                            <span className="text-violet-400">AI Tip:</span> {aiWorkoutTips[0]}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Exercises */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Exercises
                      </label>

                      {/* Added Exercises */}
                      {formData.exercises.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {formData.exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700"
                            >
                              <GripVertical className="w-4 h-4 text-slate-600" />
                              <div className="flex-1 grid grid-cols-4 gap-2">
                                <span className="text-white text-sm col-span-1 truncate">{exercise.name}</span>
                                <input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => updateExerciseInForm(exercise.id, { sets: parseInt(e.target.value) || 0 })}
                                  className="px-2 py-1 rounded bg-slate-700 text-white text-sm w-full"
                                  placeholder="Sets"
                                />
                                <input
                                  type="text"
                                  value={exercise.reps}
                                  onChange={(e) => updateExerciseInForm(exercise.id, { reps: e.target.value })}
                                  className="px-2 py-1 rounded bg-slate-700 text-white text-sm w-full"
                                  placeholder="Reps"
                                />
                                <input
                                  type="number"
                                  value={exercise.restSeconds || ""}
                                  onChange={(e) => updateExerciseInForm(exercise.id, { restSeconds: parseInt(e.target.value) || 60 })}
                                  className="px-2 py-1 rounded bg-slate-700 text-white text-sm w-full"
                                  placeholder="Rest (s)"
                                />
                              </div>
                              <button
                                onClick={() => removeExerciseFromForm(exercise.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Exercise from Preset */}
                      {formData.muscleGroups.length > 0 && (
                        <div className="space-y-3">
                          {formData.muscleGroups.map((group) => (
                            <div key={group}>
                              <p className="text-xs text-slate-500 mb-2">{group}</p>
                              <div className="flex flex-wrap gap-2">
                                {PRESET_EXERCISES[group]?.map((exercise) => (
                                  <button
                                    key={exercise}
                                    onClick={() => addExerciseToForm(exercise, group)}
                                    disabled={formData.exercises.some(e => e.name === exercise)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                      formData.exercises.some(e => e.name === exercise)
                                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                        : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-orange-500 hover:text-orange-400"
                                    }`}
                                  >
                                    <Plus className="w-3 h-3 inline mr-1" />
                                    {exercise}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                {createMode === "ai" ? (
                  <button
                    onClick={handleGenerateAIPlan}
                    disabled={!aiFormData.description.trim() || isGeneratingAIPlan}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingAIPlan ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isGeneratingAIPlan ? 'Generating...' : 'Generate Plan'}
                  </button>
                ) : (
                  <button
                    onClick={handleCreateWorkout}
                    disabled={!formData.name || formData.exercises.length === 0 || isCreatingPlan || !formData.selectedDays || formData.selectedDays.length === 0}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingPlan ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isCreatingPlan ? 'Creating...' : 'Create Workout'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Workout Modal */}
      <AnimatePresence>
        {editingWorkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setEditingWorkout(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold text-white">Edit Workout</h3>
                <button
                  onClick={() => {
                    setEditingWorkout(null);
                    resetForm();
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                {/* Workout Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Workout Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Upper Body Power"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Schedule Time */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Workouts Per Week */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Workouts Per Week
                  </label>
                  <select
                    value={formData.workoutsPerWeek || 4}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const dayMappings: Record<number, string[]> = {
                        2: ['monday', 'thursday'],
                        3: ['monday', 'wednesday', 'friday'],
                        4: ['monday', 'tuesday', 'thursday', 'friday'],
                        5: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday'],
                        6: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
                      };
                      setFormData(prev => ({
                        ...prev,
                        workoutsPerWeek: value,
                        selectedDays: dayMappings[value] || dayMappings[4],
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-orange-500"
                  >
                    {WORKOUTS_PER_WEEK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Select Workout Days */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Workout Days ({formData.selectedDays?.length || 0} selected)
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = formData.selectedDays?.includes(day) || false;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const currentDays = formData.selectedDays || [];
                            const newDays = currentDays.includes(day)
                              ? currentDays.filter(d => d !== day)
                              : [...currentDays, day];
                            setFormData(prev => ({
                              ...prev,
                              selectedDays: newDays,
                              workoutsPerWeek: newDays.length > 0 ? newDays.length : prev.workoutsPerWeek || 4,
                            }));
                          }}
                          className={`
                            px-3 py-2 rounded-xl border text-sm font-medium transition-all
                            ${isSelected
                              ? "bg-orange-500/20 border-orange-500 text-orange-400"
                              : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                            }
                          `}
                        >
                          {DAYS_LABELS[day]?.substring(0, 3) || day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  {(!formData.selectedDays || formData.selectedDays.length === 0) && (
                    <p className="text-xs text-red-400 mt-2">Please select at least one day</p>
                  )}
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Difficulty
                  </label>
                  <div className="flex gap-2">
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, difficulty: option.value as typeof formData.difficulty }))}
                        className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                          formData.difficulty === option.value
                            ? "bg-orange-500/20 border-orange-500 text-orange-400"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Muscle Groups */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Target Muscle Groups
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MUSCLE_GROUPS.map((group) => (
                      <button
                        key={group}
                        onClick={() => toggleMuscleGroup(group)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          formData.muscleGroups.includes(group)
                            ? "bg-orange-500/20 border border-orange-500 text-orange-400"
                            : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Suggestions Button */}
                {formData.muscleGroups.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleGetAISuggestions}
                      disabled={isLoadingAISuggestions}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
                    >
                      {isLoadingAISuggestions ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isLoadingAISuggestions ? 'Getting AI Suggestions...' : 'Get AI Exercise Suggestions'}
                    </button>
                  </div>
                )}

                {/* Exercises */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Exercises ({formData.exercises.length})
                  </label>

                  {/* Added Exercises */}
                  {formData.exercises.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.exercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700"
                        >
                          <GripVertical className="w-4 h-4 text-slate-600" />
                          <div className="flex-1 grid grid-cols-4 gap-2">
                            <span className="text-white text-sm col-span-1 truncate">{exercise.name}</span>
                            <input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExerciseInForm(exercise.id, { sets: parseInt(e.target.value) || 0 })}
                              className="px-2 py-1 rounded bg-slate-700 text-white text-sm w-full"
                              placeholder="Sets"
                            />
                            <input
                              type="text"
                              value={exercise.reps}
                              onChange={(e) => updateExerciseInForm(exercise.id, { reps: e.target.value })}
                              className="px-2 py-1 rounded bg-slate-700 text-white text-sm w-full"
                              placeholder="Reps"
                            />
                            <input
                              type="number"
                              value={exercise.restSeconds || ""}
                              onChange={(e) => updateExerciseInForm(exercise.id, { restSeconds: parseInt(e.target.value) || 60 })}
                              className="px-2 py-1 rounded bg-slate-700 text-white text-sm w-full"
                              placeholder="Rest (s)"
                            />
                          </div>
                          <button
                            onClick={() => removeExerciseFromForm(exercise.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Exercise from Preset */}
                  {formData.muscleGroups.length > 0 && (
                    <div className="space-y-3">
                      {formData.muscleGroups.map((group) => (
                        <div key={group}>
                          <p className="text-xs text-slate-500 mb-2">{group}</p>
                          <div className="flex flex-wrap gap-2">
                            {PRESET_EXERCISES[group]?.map((exercise) => (
                              <button
                                key={exercise}
                                onClick={() => addExerciseToForm(exercise, group)}
                                disabled={formData.exercises.some(e => e.name === exercise)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  formData.exercises.some(e => e.name === exercise)
                                    ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                    : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-orange-500 hover:text-orange-400"
                                }`}
                              >
                                <Plus className="w-3 h-3 inline mr-1" />
                                {exercise}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
                <button
                  onClick={() => {
                    setEditingWorkout(null);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateWorkout}
                  disabled={!formData.name || isUpdatingPlan}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPlan ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isUpdatingPlan ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Delete Workout?</h3>
              <p className="text-slate-400 text-center mb-6">
                This action cannot be undone. Are you sure you want to delete this workout plan?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteWorkout(showDeleteConfirm)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reschedule Workout Modal */}
      {selectedWorkoutId && (
        <RescheduleWorkoutModal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          workoutPlanId={selectedWorkoutId}
          onSuccess={() => {
            setRescheduleRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
