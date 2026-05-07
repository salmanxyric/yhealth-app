"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Edit3,
  ListChecks,
  Pencil,
  Play,
  Plus,
  Repeat,
  Target,
  Trash2,
} from "lucide-react";
import type { DayWorkout, Exercise, WorkoutPlan } from "./types";
import { DAY_FULL_LABELS } from "./types";

const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface WorkoutPlanDetailViewProps {
  plan: WorkoutPlan;
  onBack: () => void;
  onEditPlan: (plan: WorkoutPlan) => void;
  onDeletePlan: (planId: string) => void;
  onEditDay: (dayOfWeek: string, workout: DayWorkout | null) => void;
  onOpenExercise: (exercise: Exercise) => void;
}

function dayWorkoutToExercise(exercise: DayWorkout["exercises"][number], index: number): Exercise {
  return {
    id: exercise.id || `${exercise.name}-${index}`,
    name: exercise.name,
    sets: exercise.sets,
    reps: String(exercise.reps),
    weight: exercise.weight,
    restSeconds: exercise.restSeconds || 60,
    muscleGroup: exercise.muscleGroup || "Full Body",
    completed: false,
  };
}

function formatDate(date: string | undefined): string {
  if (!date) return "Not set";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPlanSchedule(plan: WorkoutPlan, week: number): Record<string, DayWorkout | null> {
  return plan.weeks?.[`week_${week}`]?.days || plan.weeklySchedule || {};
}

function countWorkoutDays(schedule: Record<string, DayWorkout | null>): number {
  return DAYS_ORDER.filter((day) => Boolean(schedule[day])).length;
}

function countExercises(schedule: Record<string, DayWorkout | null>): number {
  return DAYS_ORDER.reduce((total, day) => total + (schedule[day]?.exercises?.length || 0), 0);
}

export function WorkoutPlanDetailView({
  plan,
  onBack,
  onEditPlan,
  onDeletePlan,
  onEditDay,
  onOpenExercise,
}: WorkoutPlanDetailViewProps) {
  const [selectedWeek, setSelectedWeek] = useState(plan.currentWeek || 1);
  const durationWeeks = plan.durationWeeks || 1;
  const schedule = useMemo(() => getPlanSchedule(plan, selectedWeek), [plan, selectedWeek]);
  const workoutDays = countWorkoutDays(schedule);
  const totalExercises = countExercises(schedule) || plan.exercises.length;
  const weeklyMinutes = DAYS_ORDER.reduce(
    (sum, day) => sum + (schedule[day]?.estimatedDuration || 0),
    0
  );

  return (
    <motion.div
      key="plan-detail"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="space-y-5"
    >
      <section className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/80">
        <div className="relative p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/70 to-emerald-400/0" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                All plans
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-300">
                  {plan.difficulty}
                </span>
                {plan.isCustom && (
                  <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-[11px] font-bold uppercase text-cyan-300">
                    Custom
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-xl font-bold text-white sm:text-2xl">
                {plan.name}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                {plan.description || "Review the full plan, adjust training days, and open each exercise when you are ready to train."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {plan.muscleGroups.map((group) => (
                  <span
                    key={group}
                    className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {group}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEditPlan(plan)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-emerald-400/50"
              >
                <Edit3 className="h-4 w-4 text-emerald-300" />
                Edit plan
              </button>
              <button
                type="button"
                onClick={() => onDeletePlan(plan.id)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:border-red-400/50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={CalendarDays} label="Program" value={`${durationWeeks} weeks`} sub={`${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}`} />
            <MetricCard icon={Repeat} label="Training days" value={`${workoutDays}/7`} sub={`Week ${selectedWeek}`} />
            <MetricCard icon={ListChecks} label="Exercises" value={String(totalExercises)} sub="Across selected week" />
            <MetricCard icon={Clock} label="Time" value={`${weeklyMinutes || plan.duration} min`} sub={plan.scheduledTime ? `Default ${plan.scheduledTime}` : "Default time not set"} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-base font-bold text-white">Plan Schedule</h4>
            <p className="mt-1 text-xs text-slate-500">
              Select a week, then edit any training day or recovery day.
            </p>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: durationWeeks }, (_, index) => index + 1).map((week) => (
              <button
                key={week}
                type="button"
                onClick={() => setSelectedWeek(week)}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  week === selectedWeek
                    ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/30"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                Week {week}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-7">
          {DAYS_ORDER.map((day) => {
            const workout = schedule[day];
            return (
              <button
                key={day}
                type="button"
                onClick={() => onEditDay(day, workout || null)}
                className={`min-h-[154px] rounded-2xl border p-4 text-left transition-all ${
                  workout
                    ? "border-cyan-500/20 bg-cyan-500/10 hover:border-cyan-300/40"
                    : "border-slate-800/70 bg-slate-900/60 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase text-slate-400">
                    {DAY_FULL_LABELS[day]}
                  </span>
                  {workout ? (
                    <Pencil className="h-4 w-4 text-cyan-300" />
                  ) : (
                    <Plus className="h-4 w-4 text-slate-500" />
                  )}
                </div>
                {workout ? (
                  <div className="mt-4">
                    <h5 className="line-clamp-2 text-sm font-bold text-white">
                      {workout.workoutName}
                    </h5>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                      {workout.focusArea || "Workout day"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-300">
                      <span className="rounded-lg bg-slate-950/70 px-2 py-1">
                        {workout.exercises.length} exercises
                      </span>
                      <span className="rounded-lg bg-slate-950/70 px-2 py-1">
                        {workout.estimatedDuration} min
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
                      <Plus className="h-5 w-5 text-slate-500" />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-400">Add workout</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {DAYS_ORDER.map((day) => {
          const workout = schedule[day];
          if (!workout) return null;

          return (
            <div
              key={day}
              className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-cyan-300">
                    {DAY_FULL_LABELS[day]}
                  </p>
                  <h4 className="mt-1 text-base font-bold text-white">{workout.workoutName}</h4>
                  <p className="mt-1 text-xs text-slate-500">{workout.focusArea}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onEditDay(day, workout)}
                  className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:text-white"
                  aria-label={`Edit ${DAY_FULL_LABELS[day]} workout`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {workout.exercises.map((exercise, index) => (
                  <button
                    key={exercise.id || `${day}-${exercise.name}-${index}`}
                    type="button"
                    onClick={() => onOpenExercise(dayWorkoutToExercise(exercise, index))}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition-colors hover:border-orange-400/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{exercise.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {exercise.sets} sets x {exercise.reps} reps
                        {exercise.weight ? ` - ${exercise.weight}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                      <span>{exercise.restSeconds || 60}s</span>
                      <Play className="h-4 w-4 text-orange-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </motion.div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{sub}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
