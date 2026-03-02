"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Dumbbell,
  Target,
  Zap,
  Clock,
  ListOrdered,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import {
  exercisesService,
  type ExerciseListItem,
} from "@/src/shared/services/exercises.service";
import { type Exercise } from "./types";
import { formatTime } from "./utils";
import { PlateCalculator } from "./PlateCalculator";

// Difficulty badge config
const difficultyConfig: Record<string, { label: string; bg: string; text: string }> = {
  beginner: { label: "Beginner", bg: "bg-emerald-500/20", text: "text-emerald-400" },
  intermediate: { label: "Intermediate", bg: "bg-amber-500/20", text: "text-amber-400" },
  advanced: { label: "Advanced", bg: "bg-red-500/20", text: "text-red-400" },
  expert: { label: "Expert", bg: "bg-purple-500/20", text: "text-purple-400" },
};

interface ExerciseExecutionDrawerProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (exerciseId: string) => void;
  onUpdateWeight: (exerciseId: string, weight: string) => void;
}

interface SetState {
  reps: number;
  weight: number;
  completed: boolean;
}

export function ExerciseExecutionDrawer({
  exercise,
  isOpen,
  onClose,
  onToggleComplete,
  onUpdateWeight,
}: ExerciseExecutionDrawerProps) {
  // Library exercise data
  const [libraryExercise, setLibraryExercise] = useState<ExerciseListItem | null>(null);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<"instructions" | "tips" | "mistakes">("instructions");

  // Set tracker
  const [sets, setSets] = useState<SetState[]>([]);

  // Rest timer
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stopwatch
  const [stopwatch, setStopwatch] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Plate calculator
  const [showPlateCalc, setShowPlateCalc] = useState(false);
  const [plateWeight, setPlateWeight] = useState(0);
  const [plateUnit] = useState<"kg" | "lbs">("kg");

  // Fetch library exercise on open
  useEffect(() => {
    if (!isOpen || !exercise) {
      setLibraryExercise(null);
      return;
    }

    setLoadingLibrary(true);
    setActiveTab("instructions");

    exercisesService
      .search({ q: exercise.name, limit: 1 })
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          // Find best match (exact or close name match)
          const match = res.data.find(
            (e) => e.name.toLowerCase() === exercise.name.toLowerCase()
          ) || res.data[0];
          setLibraryExercise(match);
        } else {
          setLibraryExercise(null);
        }
      })
      .catch(() => setLibraryExercise(null))
      .finally(() => setLoadingLibrary(false));
  }, [isOpen, exercise]);

  // Initialize sets from exercise data — preserve completed state
  useEffect(() => {
    if (!exercise) return;
    const repsStr = exercise.reps || "10";
    const repsNum = parseInt(repsStr.split("-")[0]) || 10;
    const weightStr = exercise.weight || "0";
    const weightNum = parseFloat(weightStr.replace(/[^0-9.]/g, "")) || 0;

    const newSets: SetState[] = Array.from({ length: exercise.sets || 3 }, () => ({
      reps: repsNum,
      weight: weightNum,
      completed: exercise.completed || false,
    }));
    setSets(newSets);
    setPlateWeight(weightNum);
    setShowPlateCalc(false);
    // Only reset timers if exercise is not already completed
    if (!exercise.completed) {
      setRestTimer(0);
      setIsResting(false);
      setStopwatch(0);
      setIsStopwatchRunning(false);
    }
  }, [exercise]);

  // Rest timer countdown
  useEffect(() => {
    if (isResting && restTimer > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResting, restTimer > 0]);

  // Stopwatch
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchRef.current = setInterval(() => {
        setStopwatch((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [isStopwatchRunning]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
      setIsResting(false);
      setIsStopwatchRunning(false);
    }
  }, [isOpen]);

  const toggleSetComplete = useCallback((index: number) => {
    setSets((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], completed: !updated[index].completed };

      // Start rest timer when completing a set
      if (updated[index].completed && exercise?.restSeconds) {
        setRestTimer(exercise.restSeconds);
        setIsResting(true);
      }

      return updated;
    });
  }, [exercise]);

  const skipRest = useCallback(() => {
    setIsResting(false);
    setRestTimer(0);
  }, []);

  const toggleStopwatch = useCallback(() => {
    setIsStopwatchRunning((prev) => !prev);
  }, []);

  const resetStopwatch = useCallback(() => {
    setIsStopwatchRunning(false);
    setStopwatch(0);
  }, []);

  const handleMarkComplete = useCallback(() => {
    if (!exercise) return;
    onToggleComplete(exercise.id);
    onClose();
  }, [exercise, onToggleComplete, onClose]);

  const handlePlateWeightChange = useCallback(
    (weight: number) => {
      setPlateWeight(weight);
      if (exercise) {
        onUpdateWeight(exercise.id, `${weight}kg`);
      }
    },
    [exercise, onUpdateWeight]
  );

  if (!exercise) return null;

  // Library data
  const instructions = libraryExercise?.instructions as string[] || [];
  const tips = libraryExercise?.tips as string[] || [];
  const commonMistakes = libraryExercise?.common_mistakes as string[] || [];
  const hasTabContent = instructions.length > 0 || tips.length > 0 || commonMistakes.length > 0;
  const difficulty = libraryExercise
    ? difficultyConfig[libraryExercise.difficulty_level] || difficultyConfig.beginner
    : null;
  const isVideo = libraryExercise?.animation_url?.endsWith(".mp4");
  const hasImage = libraryExercise?.animation_url || libraryExercise?.thumbnail_url;
  const completedSets = sets.filter((s) => s.completed).length;
  const allSetsCompleted = sets.length > 0 && completedSets === sets.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] z-50 bg-slate-950 border-l border-slate-700/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl flex-shrink-0">
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white truncate">
                  {exercise.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500">{exercise.muscleGroup}</span>
                  {difficulty && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${difficulty.bg} ${difficulty.text}`}>
                      {difficulty.label}
                    </span>
                  )}
                </div>
              </div>
              {/* Stopwatch */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-mono text-slate-400">
                  {formatTime(stopwatch)}
                </span>
                <button
                  onClick={toggleStopwatch}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isStopwatchRunning
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-slate-800 text-slate-500 hover:text-white"
                  }`}
                >
                  {isStopwatchRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                {stopwatch > 0 && (
                  <button
                    onClick={resetStopwatch}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
              <div className="p-4 space-y-5">
                {/* Exercise Media */}
                {loadingLibrary ? (
                  <div className="flex items-center justify-center h-32 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                  </div>
                ) : hasImage ? (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 min-h-[200px]">
                    {isVideo ? (
                      <video
                        src={libraryExercise?.animation_url || ""}
                        poster={libraryExercise?.thumbnail_url || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full min-h-[200px] object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={libraryExercise?.animation_url || libraryExercise?.thumbnail_url || ""}
                        alt={exercise.name}
                        className="w-full min-h-[200px] object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 rounded-2xl bg-slate-900/30 border border-slate-800/50">
                    <Dumbbell className="w-8 h-8 text-slate-700" />
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                    <Dumbbell className="w-4 h-4 text-orange-400 mb-1" />
                    <span className="text-lg font-bold text-white">{exercise.sets}</span>
                    <span className="text-[10px] text-slate-500 uppercase">Sets</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                    <Zap className="w-4 h-4 text-orange-400 mb-1" />
                    <span className="text-lg font-bold text-white">{exercise.reps}</span>
                    <span className="text-[10px] text-slate-500 uppercase">Reps</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800/50">
                    <Clock className="w-4 h-4 text-cyan-400 mb-1" />
                    <span className="text-lg font-bold text-white">{exercise.restSeconds || 60}s</span>
                    <span className="text-[10px] text-slate-500 uppercase">Rest</span>
                  </div>
                </div>

                {/* Instructions / Tips / Mistakes Tabs */}
                {hasTabContent && (
                  <div className="rounded-2xl bg-slate-900/40 border border-slate-800/50 overflow-hidden">
                    {/* Tab header */}
                    <div className="flex items-center border-b border-slate-800/50 bg-slate-900/30">
                      {instructions.length > 0 && (
                        <button
                          onClick={() => setActiveTab("instructions")}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all relative ${
                            activeTab === "instructions" ? "text-orange-300" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                          <span>How To</span>
                          {activeTab === "instructions" && (
                            <motion.div
                              layoutId="execDrawerTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                        </button>
                      )}
                      {tips.length > 0 && (
                        <button
                          onClick={() => setActiveTab("tips")}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all relative ${
                            activeTab === "tips" ? "text-orange-300" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Tips</span>
                          {activeTab === "tips" && (
                            <motion.div
                              layoutId="execDrawerTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                        </button>
                      )}
                      {commonMistakes.length > 0 && (
                        <button
                          onClick={() => setActiveTab("mistakes")}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all relative ${
                            activeTab === "mistakes" ? "text-orange-300" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Avoid</span>
                          {activeTab === "mistakes" && (
                            <motion.div
                              layoutId="execDrawerTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Tab content */}
                    <div className="p-4 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                      {activeTab === "instructions" && instructions.length > 0 && (
                        <div className="space-y-3">
                          {instructions.map((step, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[10px] font-bold text-orange-400">{i + 1}</span>
                              </div>
                              <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === "tips" && tips.length > 0 && (
                        <div className="space-y-3">
                          {tips.map((tip, i) => (
                            <div key={i} className="flex gap-2.5 items-start p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                              <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === "mistakes" && commonMistakes.length > 0 && (
                        <div className="space-y-3">
                          {commonMistakes.map((mistake, i) => (
                            <div key={i} className="flex gap-2.5 items-start p-2.5 rounded-xl bg-red-500/5 border border-red-500/10">
                              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-slate-300 leading-relaxed">{mistake}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Set Tracker */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800/50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-semibold text-white">Set Tracker</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {completedSets}/{sets.length} completed
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800/30">
                    {sets.map((set, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          set.completed ? "bg-emerald-500/5" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <button
                          onClick={() => toggleSetComplete(i)}
                          className="flex-shrink-0"
                        >
                          {set.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-600 hover:text-orange-400 transition-colors" />
                          )}
                        </button>
                        <span className={`text-sm font-medium flex-1 ${set.completed ? "text-emerald-400 line-through" : "text-white"}`}>
                          Set {i + 1}
                        </span>
                        <span className="text-xs text-slate-500">
                          {set.reps} reps
                          {set.weight > 0 && ` × ${set.weight}kg`}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Rest Timer (inline, shows when resting) */}
                <AnimatePresence>
                  {isResting && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-5 text-center"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-16 h-16 mx-auto mb-3 rounded-full bg-cyan-500/20 flex items-center justify-center"
                      >
                        <RotateCcw className="w-8 h-8 text-cyan-400" />
                      </motion.div>
                      <p className="text-sm text-slate-400 mb-2">Rest Time</p>
                      <p className="text-4xl font-mono font-bold text-cyan-400 mb-4">
                        {formatTime(restTimer)}
                      </p>
                      <button
                        onClick={skipRest}
                        className="px-6 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/30 transition-colors"
                      >
                        Skip Rest
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Weight & Plate Calculator */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800/50 overflow-hidden">
                  <button
                    onClick={() => setShowPlateCalc(!showPlateCalc)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-semibold text-white">Weight & Plates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {exercise.weight && (
                        <span className="text-xs text-slate-500">{exercise.weight}</span>
                      )}
                      {showPlateCalc ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {showPlateCalc && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-slate-800/50 pt-3">
                          <PlateCalculator
                            targetWeight={plateWeight}
                            unit={plateUnit}
                            onWeightChange={handlePlateWeightChange}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl">
              <button
                onClick={handleMarkComplete}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  allSetsCompleted || exercise.completed
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                }`}
              >
                {exercise.completed
                  ? "Undo Complete"
                  : allSetsCompleted
                    ? "All Sets Done — Mark Complete"
                    : `Mark Complete (${completedSets}/${sets.length} sets)`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
