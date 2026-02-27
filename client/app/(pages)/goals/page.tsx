"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Target,
  Plus,
  ChevronRight,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Circle,
  Flame,
  Dumbbell,
  Moon,
  Brain,
  Heart,
  Utensils,
  Zap,
  Star,
  Trophy,
  Clock,
  MoreVertical,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  ArrowLeft,
  X,
  Search,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  Save,
  ChevronDown,
  Lightbulb,
  Quote,
  TrendingDown,
  Award,
  RotateCcw,
  PlusCircle,
  Trash2,
  CheckSquare,
  Square,
  BarChart3,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { DashboardLayout } from "@/components/layout";
import { AIGoalModal } from "./components/AIGoalModal";
import { BulkActionsBar } from "./components/BulkActionsBar";
import { GoalsAnalytics } from "./components/GoalsAnalytics";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface Milestone {
  id: string;
  title: string;
  targetValue: number;
  completed: boolean;
  completedAt?: string;
  weekNumber: number;
}

interface Goal {
  id: string;
  category: string;
  pillar: string;
  title: string;
  description: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  startDate: string;
  targetDate: string;
  durationWeeks: number;
  status: string;
  isPrimary: boolean;
  progress: number;
  motivation?: string;
  confidenceLevel?: number;
  milestones?: Milestone[];
}

interface Plan {
  id: string;
  name: string;
  goalId: string;
  status: string;
  overallProgress: number;
  currentWeek: number;
  durationWeeks: number;
}

interface NewGoalData {
  category: string;
  pillar: string;
  title: string;
  description: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  durationWeeks: number;
  motivation: string;
  isPrimary: boolean;
}

// Goal category config
const goalCategoryConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string; gradient: string; label: string }
> = {
  weight_loss: {
    icon: <TrendingDown className="w-5 h-5" />,
    color: "text-blue-400",
    bgColor: "from-blue-500/20 to-cyan-500/20",
    gradient: "from-blue-500 to-cyan-500",
    label: "Weight Loss",
  },
  muscle_building: {
    icon: <Dumbbell className="w-5 h-5" />,
    color: "text-orange-400",
    bgColor: "from-orange-500/20 to-red-500/20",
    gradient: "from-orange-500 to-red-500",
    label: "Build Muscle",
  },
  sleep_improvement: {
    icon: <Moon className="w-5 h-5" />,
    color: "text-indigo-400",
    bgColor: "from-indigo-500/20 to-purple-500/20",
    gradient: "from-indigo-500 to-purple-500",
    label: "Better Sleep",
  },
  stress_wellness: {
    icon: <Brain className="w-5 h-5" />,
    color: "text-cyan-400",
    bgColor: "from-cyan-500/20 to-teal-500/20",
    gradient: "from-cyan-500 to-teal-500",
    label: "Stress Management",
  },
  energy_productivity: {
    icon: <Zap className="w-5 h-5" />,
    color: "text-yellow-400",
    bgColor: "from-yellow-500/20 to-amber-500/20",
    gradient: "from-yellow-500 to-amber-500",
    label: "More Energy",
  },
  event_training: {
    icon: <Trophy className="w-5 h-5" />,
    color: "text-amber-400",
    bgColor: "from-amber-500/20 to-orange-500/20",
    gradient: "from-amber-500 to-orange-500",
    label: "Event Training",
  },
  health_condition: {
    icon: <Heart className="w-5 h-5" />,
    color: "text-rose-400",
    bgColor: "from-rose-500/20 to-pink-500/20",
    gradient: "from-rose-500 to-pink-500",
    label: "Health Condition",
  },
  habit_building: {
    icon: <Flame className="w-5 h-5" />,
    color: "text-emerald-400",
    bgColor: "from-emerald-500/20 to-green-500/20",
    gradient: "from-emerald-500 to-green-500",
    label: "Build Habits",
  },
  overall_optimization: {
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-purple-400",
    bgColor: "from-purple-500/20 to-pink-500/20",
    gradient: "from-purple-500 to-pink-500",
    label: "Optimize Health",
  },
  nutrition: {
    icon: <Utensils className="w-5 h-5" />,
    color: "text-green-400",
    bgColor: "from-green-500/20 to-emerald-500/20",
    gradient: "from-green-500 to-emerald-500",
    label: "Nutrition",
  },
  fitness: {
    icon: <Dumbbell className="w-5 h-5" />,
    color: "text-red-400",
    bgColor: "from-red-500/20 to-orange-500/20",
    gradient: "from-red-500 to-orange-500",
    label: "Fitness",
  },
  custom: {
    icon: <Target className="w-5 h-5" />,
    color: "text-slate-400",
    bgColor: "from-slate-500/20 to-slate-600/20",
    gradient: "from-slate-500 to-slate-600",
    label: "Custom",
  },
};

// Progress Update Modal
const ProgressModal = ({
  isOpen,
  onClose,
  onSave,
  goal,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (value: number) => void;
  goal: Goal | null;
  isLoading: boolean;
}) => {
  // Initialize state from goal prop - will reset when goal.id changes via key prop
  const [newValue, setNewValue] = useState(() => goal?.currentValue || 0);

  if (!goal) return null;

  const progressDiff = newValue - (goal.currentValue || 0);
  const newProgress = Math.min(100, Math.round((newValue / goal.targetValue) * 100));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Update Progress</h3>
                  <p className="text-sm text-slate-400">{goal.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 mb-1">Current</p>
                  <p className="text-2xl font-bold text-white">
                    {goal.currentValue || 0} <span className="text-sm font-normal text-slate-500">{goal.targetUnit}</span>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-sky-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-300 mb-1">Target</p>
                  <p className="text-2xl font-bold text-white">
                    {goal.targetValue} <span className="text-sm font-normal text-slate-500">{goal.targetUnit}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Value ({goal.targetUnit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-medium focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                  {progressDiff !== 0 && (
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 ${progressDiff > 0 ? "text-green-400" : "text-red-400"}`}>
                      {progressDiff > 0 ? <ArrowUpRight className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-medium">{Math.abs(progressDiff)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">New Progress</span>
                  <span className="text-sm font-medium text-white">{newProgress}%</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    initial={{ width: `${goal.progress}%` }}
                    animate={{ width: `${newProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {goal.milestones && goal.milestones.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">Milestones</span>
                  </div>
                  <div className="space-y-2">
                    {goal.milestones.slice(0, 3).map((m, index) => (
                      <div key={m.id || `milestone-${index}`} className="flex items-center gap-2">
                        {m.completed || newValue >= m.targetValue ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={`text-sm ${m.completed || newValue >= m.targetValue ? "text-green-300" : "text-slate-400"}`}>
                          {m.title} ({m.targetValue} {goal.targetUnit})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(newValue)}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Progress
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Create Goal Modal
const CreateGoalModal = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewGoalData) => void;
  isLoading: boolean;
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<NewGoalData>({
    category: "",
    pillar: "fitness",
    title: "",
    description: "",
    targetValue: 0,
    targetUnit: "",
    currentValue: 0,
    durationWeeks: 12,
    motivation: "",
    isPrimary: false,
  });

  const categories = Object.entries(goalCategoryConfig).filter(([key]) => key !== "custom");

  const handleCategorySelect = (category: string) => {
    let pillar = "fitness";
    if (["nutrition", "weight_loss"].includes(category)) pillar = "nutrition";
    if (["sleep_improvement", "stress_wellness", "overall_optimization"].includes(category)) pillar = "wellbeing";

    setFormData({ ...formData, category, pillar });
    setStep(2);
  };

  const isValid = () => {
    return (
      formData.category &&
      formData.title.length >= 5 &&
      formData.description.length >= 10 &&
      formData.targetValue > 0 &&
      formData.targetUnit &&
      formData.motivation.length >= 10
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">Create New Goal</h3>
                  <p className="text-sm text-slate-400">Step {step} of 2</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex gap-2 mb-6">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    s <= step ? "bg-gradient-to-r from-emerald-600 to-sky-600" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-slate-300 mb-4">What type of goal would you like to set?</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {categories.map(([key, config]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCategorySelect(key)}
                      className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer text-left ${
                        formData.category === key
                          ? `bg-gradient-to-br ${config.bgColor} border-white/20`
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${config.bgColor.replace("from-", "bg-").split(" ")[0]} flex items-center justify-center ${config.color} mb-2`}>
                        {config.icon}
                      </div>
                      <p className="font-medium text-white text-xs sm:text-sm">{config.label}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to categories
                </button>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Goal Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title ?? ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Lose 10 lbs in 12 weeks"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.description ?? ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Describe your goal in detail..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Current</label>
                    <input
                      type="number"
                      value={formData.currentValue ?? 0}
                      onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) || 0 })}
                      className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target *</label>
                    <input
                      type="number"
                      value={formData.targetValue ?? 0}
                      onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) || 0 })}
                      className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Unit *</label>
                    <input
                      type="text"
                      value={formData.targetUnit ?? ""}
                      onChange={(e) => setFormData({ ...formData, targetUnit: e.target.value })}
                      placeholder="lbs"
                      className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Weeks</label>
                    <select
                      value={formData.durationWeeks ?? 12}
                      onChange={(e) => setFormData({ ...formData, durationWeeks: Number(e.target.value) || 12 })}
                      className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
                    >
                      {[4, 8, 12, 16, 24, 52].map((w) => (
                        <option key={w} value={w} className="bg-slate-900">{w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Quote className="w-4 h-4 text-amber-400" />
                      Why does this goal matter? <span className="text-red-400">*</span>
                    </div>
                  </label>
                  <textarea
                    value={formData.motivation ?? ""}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    rows={2}
                    placeholder="This helps keep you motivated..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                  />
                </div>

                <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  <div>
                    <p className="font-medium text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      Set as Primary Goal
                    </p>
                    <p className="text-sm text-slate-400">This will be your main focus</p>
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              {step === 2 && (
                <button
                  onClick={() => onSave(formData)}
                  disabled={isLoading || !isValid()}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Goal
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Edit Goal Modal
const EditGoalModal = ({
  isOpen,
  onClose,
  onSave,
  goal,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewGoalData) => void;
  goal: Goal | null;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<NewGoalData>({
    category: "",
    pillar: "fitness",
    title: "",
    description: "",
    targetValue: 0,
    targetUnit: "",
    currentValue: 0,
    durationWeeks: 12,
    motivation: "",
    isPrimary: false,
  });

  // Initialize form with goal data when modal opens
  useEffect(() => {
    if (goal && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        category: goal.category || "",
        pillar: goal.pillar || "fitness",
        title: goal.title || "",
        description: goal.description || "",
        targetValue: goal.targetValue ?? 0,
        targetUnit: goal.targetUnit || "",
        currentValue: goal.currentValue ?? 0,
        durationWeeks: goal.durationWeeks ?? 12,
        motivation: goal.motivation || "",
        isPrimary: goal.isPrimary ?? false,
      });
    }
  }, [goal, isOpen]);


  const isValid = () => {
    return (
      formData.category &&
      formData.title.length >= 5 &&
      formData.description.length >= 10 &&
      formData.targetValue > 0 &&
      formData.targetUnit &&
      formData.motivation.length >= 10
    );
  };

  if (!goal) return null;

  const config = goalCategoryConfig[formData.category] || goalCategoryConfig.custom;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Pencil className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">Edit Goal</h3>
                  <p className="text-sm text-slate-400">Modify your goal details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Current Category Display */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${config.bgColor.replace("from-", "bg-").split(" ")[0]} flex items-center justify-center ${config.color}`}>
                  {config.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Category</p>
                  <p className="font-medium text-white">{config.label}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Goal Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title ?? ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Lose 10 lbs in 12 weeks"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description ?? ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Describe your goal in detail..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current</label>
                  <input
                    type="number"
                    value={formData.currentValue ?? 0}
                    onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) || 0 })}
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target *</label>
                  <input
                    type="number"
                    value={formData.targetValue ?? 0}
                    onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) || 0 })}
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Unit *</label>
                  <input
                    type="text"
                    value={formData.targetUnit ?? ""}
                    onChange={(e) => setFormData({ ...formData, targetUnit: e.target.value })}
                    placeholder="lbs"
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Weeks</label>
                  <select
                    value={formData.durationWeeks ?? 12}
                    onChange={(e) => setFormData({ ...formData, durationWeeks: Number(e.target.value) || 12 })}
                    className="w-full px-3 sm:px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
                  >
                    {[4, 8, 12, 16, 24, 52].map((w) => (
                      <option key={w} value={w} className="bg-slate-900">{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Quote className="w-4 h-4 text-amber-400" />
                    Why does this goal matter? <span className="text-red-400">*</span>
                  </div>
                </label>
                <textarea
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  rows={2}
                  placeholder="This helps keep you motivated..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                />
              </div>

              <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                />
                <div>
                  <p className="font-medium text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    Set as Primary Goal
                  </p>
                  <p className="text-sm text-slate-400">This will be your main focus</p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(formData)}
                disabled={isLoading || !isValid()}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/25"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Confirmation Modal
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isLoading?: boolean;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-slate-400">{message}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function GoalsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "paused">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/goals");
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchGoals = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const [goalsResponse, plansResponse] = await Promise.all([
        api.get<{ goals: Goal[] }>("/assessment/goals"),
        api.get<{ plans: Plan[] }>("/plans"),
      ]);

      if (goalsResponse.success && goalsResponse.data) {
        setGoals(goalsResponse.data.goals || []);
      }
      if (plansResponse.success && plansResponse.data) {
        setPlans(plansResponse.data.plans || []);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code !== "NOT_FOUND") {
          setError(err.message);
        }
      } else {
        setError("Failed to load goals");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
    }
  }, [isAuthenticated, fetchGoals]);

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const matchesFilter = filter === "all" || goal.status === filter;
      const matchesSearch =
        !searchQuery ||
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [goals, filter, searchQuery]);

  const stats = useMemo(() => ({
    total: goals.length,
    active: goals.filter((g) => g.status === "active").length,
    completed: goals.filter((g) => g.status === "completed").length,
    paused: goals.filter((g) => g.status === "paused").length,
    avgProgress: goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0,
    primaryGoal: goals.find((g) => g.isPrimary),
  }), [goals]);

  const handleCreateGoal = async (data: NewGoalData) => {
    setIsCreating(true);
    try {
      const startDate = new Date();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + data.durationWeeks * 7);

      await api.post("/assessment/goals", {
        category: data.category,
        pillar: data.pillar,
        isPrimary: data.isPrimary,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        targetUnit: data.targetUnit,
        currentValue: data.currentValue,
        timeline: {
          startDate: startDate.toISOString(),
          targetDate: targetDate.toISOString(),
          durationWeeks: data.durationWeeks,
        },
        motivation: data.motivation,
      });

      await fetchGoals();
      setIsCreateModalOpen(false);
      toast.success("Goal created successfully!");
    } catch (err) {
      console.error("Failed to create goal:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProgress = async (newValue: number) => {
    if (!selectedGoal) return;

    setIsUpdating(true);
    try {
      await api.patch(`/assessment/goals/${selectedGoal.id}`, {
        currentValue: newValue,
      });

      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoal.id
            ? {
                ...g,
                currentValue: newValue,
                progress: Math.min(100, Math.round((newValue / g.targetValue) * 100)),
              }
            : g
        )
      );

      setIsProgressModalOpen(false);
      setSelectedGoal(null);
      toast.success("Progress updated successfully!");
    } catch (err) {
      console.error("Failed to update progress:", err);
      toast.error("Failed to update progress");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (goal: Goal, newStatus: string) => {
    try {
      await api.patch(`/assessment/goals/${goal.id}`, { status: newStatus });
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, status: newStatus } : g))
      );
      toast.success(`Goal ${newStatus === "active" ? "activated" : newStatus === "paused" ? "paused" : "completed"}!`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update goal status");
    }
  };

  const handleDelete = async () => {
    if (!selectedGoal) return;

    setIsDeleting(true);
    try {
      await api.delete(`/assessment/goals/${selectedGoal.id}`);
      setGoals((prev) => prev.filter((g) => g.id !== selectedGoal.id));
      setIsDeleteModalOpen(false);
      setSelectedGoal(null);
      toast.success("Goal deleted successfully");
    } catch (err) {
      console.error("Failed to delete goal:", err);
      toast.error("Failed to delete goal");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditGoal = async (data: NewGoalData) => {
    if (!selectedGoal) return;

    setIsUpdating(true);
    try {
      const startDate = new Date(selectedGoal.startDate);
      const targetDate = new Date();
      targetDate.setDate(startDate.getDate() + data.durationWeeks * 7);

      await api.patch(`/assessment/goals/${selectedGoal.id}`, {
        category: data.category,
        pillar: data.pillar,
        isPrimary: data.isPrimary,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        targetUnit: data.targetUnit,
        currentValue: data.currentValue,
        timeline: {
          startDate: startDate.toISOString(),
          targetDate: targetDate.toISOString(),
          durationWeeks: data.durationWeeks,
        },
        motivation: data.motivation,
      });

      // Update local state
      setGoals((prev) =>
        prev.map((g) =>
          g.id === selectedGoal.id
            ? {
                ...g,
                category: data.category,
                pillar: data.pillar,
                title: data.title,
                description: data.description,
                targetValue: data.targetValue,
                targetUnit: data.targetUnit,
                currentValue: data.currentValue,
                durationWeeks: data.durationWeeks,
                motivation: data.motivation,
                isPrimary: data.isPrimary,
                progress: Math.min(100, Math.round((data.currentValue / data.targetValue) * 100)),
              }
            : g
        )
      );

      setIsEditModalOpen(false);
      setSelectedGoal(null);
      toast.success("Goal updated successfully!");
    } catch (err) {
      console.error("Failed to update goal:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update goal");
    } finally {
      setIsUpdating(false);
    }
  };

  // Selection handlers
  const toggleSelection = (goalId: string) => {
    setSelectedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedGoals(new Set(filteredGoals.map((g) => g.id)));
    setIsSelectionMode(true);
  };

  const clearSelection = () => {
    setSelectedGoals(new Set());
    setIsSelectionMode(false);
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedGoals.size === 0) return;

    setIsBulkProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedGoals).map((id) => api.delete(`/assessment/goals/${id}`))
      );
      setGoals((prev) => prev.filter((g) => !selectedGoals.has(g.id)));
      const count = selectedGoals.size;
      clearSelection();
      setIsBulkDeleteModalOpen(false);
      toast.success(`${count} goal${count > 1 ? "s" : ""} deleted successfully`);
    } catch (err) {
      console.error("Failed to delete goals:", err);
      toast.error("Failed to delete goals");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedGoals.size === 0) return;

    setIsBulkProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedGoals).map((id) =>
          api.patch(`/assessment/goals/${id}`, { status })
        )
      );
      setGoals((prev) =>
        prev.map((g) => (selectedGoals.has(g.id) ? { ...g, status } : g))
      );
      const count = selectedGoals.size;
      clearSelection();
      toast.success(`${count} goal${count > 1 ? "s" : ""} updated successfully`);
    } catch (err) {
      console.error("Failed to update goals:", err);
      toast.error("Failed to update goals");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // AI Goal creation
  const handleAIGoalAccept = async (data: {
    category: string;
    pillar: string;
    title: string;
    description: string;
    targetValue: number;
    targetUnit: string;
    durationWeeks: number;
    motivation: string;
    isPrimary: boolean;
    milestones?: Array<{
      title: string;
      targetValue: number;
      weekNumber: number;
    }>;
  }) => {
    setIsCreating(true);
    try {
      const startDate = new Date();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + data.durationWeeks * 7);

      await api.post("/assessment/goals", {
        category: data.category,
        pillar: data.pillar,
        isPrimary: data.isPrimary,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        targetUnit: data.targetUnit,
        currentValue: 0,
        timeline: {
          startDate: startDate.toISOString(),
          targetDate: targetDate.toISOString(),
          durationWeeks: data.durationWeeks,
        },
        motivation: data.motivation,
      });

      await fetchGoals();
      setIsAIModalOpen(false);
      toast.success("AI-generated goal created successfully!");
    } catch (err) {
      console.error("Failed to create AI goal:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setIsCreating(false);
    }
  };

  const getPlanForGoal = (goalId: string) => plans.find((p) => p.goalId === goalId);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-600 to-sky-600 blur-xl opacity-40 animate-pulse" />
          </div>
          <p className="text-slate-400 animate-pulse">Loading your goals...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <button
            onClick={fetchGoals}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="goals">
      <div className="min-h-screen bg-slate-950">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  My{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                    Goals
                  </span>
                </h1>
                <p className="text-slate-400 mt-1">Track and manage your health objectives</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="hidden sm:inline">Analytics</span>
                </button>
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="hidden sm:inline">AI Create</span>
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/25 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">New Goal</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          </motion.header>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            {[
              { label: "Total", value: stats.total, icon: Target, color: "emerald", bg: "from-emerald-500/10 via-emerald-600/5 to-sky-500/10" },
              { label: "Active", value: stats.active, icon: Zap, color: "green", bg: "from-green-500/10 via-green-600/5 to-emerald-500/10" },
              { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "sky", bg: "from-sky-500/10 via-sky-600/5 to-blue-500/10" },
              { label: "Paused", value: stats.paused, icon: Pause, color: "amber", bg: "from-amber-500/10 via-amber-600/5 to-yellow-500/10" },
              { label: "Progress", value: `${stats.avgProgress}%`, icon: TrendingUp, color: "violet", bg: "from-violet-500/10 via-purple-600/5 to-pink-500/10" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${stat.bg} border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-emerald-500/5 transition-all backdrop-blur-xl bg-slate-900/50`}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                    <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}-400`} />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Primary Goal */}
          {stats.primaryGoal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6 sm:mb-8"
            >
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Star className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">Primary Goal</span>
                      <h3 className="text-base sm:text-lg font-semibold text-white truncate">{stats.primaryGoal.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl sm:text-3xl font-bold text-white">{stats.primaryGoal.progress}%</p>
                      <p className="text-xs text-slate-400">Complete</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGoal(stats.primaryGoal!);
                        setIsProgressModalOpen(true);
                      }}
                      className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors text-sm font-medium cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.primaryGoal.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Analytics Section */}
          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <GoalsAnalytics goals={goals} />
            </motion.div>
          )}

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"
          >
            <div className="relative flex-1 group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-emerald-500/10 group-focus-within:bg-emerald-500/20 transition-colors">
                <Search className="w-4 h-4 text-emerald-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search goals..."
                className="w-full pl-14 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all backdrop-blur-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isSelectionMode) {
                    clearSelection();
                  } else {
                    setIsSelectionMode(true);
                    selectAll();
                  }
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isSelectionMode
                    ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {isSelectionMode ? (
                  <>
                    <X className="w-4 h-4 inline mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 inline mr-2" />
                    Select
                  </>
                )}
              </button>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto backdrop-blur-sm relative">
                {(["all", "active", "completed", "paused"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`relative px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      filter === f
                        ? "text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {filter === f && (
                      <motion.div
                        layoutId="activeGoalFilter"
                        className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-sky-600 rounded-lg shadow-lg shadow-emerald-500/25"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Bulk Actions Bar */}
          <BulkActionsBar
            selectedCount={selectedGoals.size}
            onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            onClearSelection={clearSelection}
            isProcessing={isBulkProcessing}
          />

          {/* Goals List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredGoals.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative text-center py-16 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-800/50 to-slate-900/95 border border-white/5 backdrop-blur-xl overflow-hidden"
                >
                  {/* Animated background orbs */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                      animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-10 left-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"
                    />
                    <motion.div
                      animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute bottom-10 right-1/4 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl"
                    />
                  </div>
                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-500/20 flex items-center justify-center">
                      <Target className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {filter === "all" ? "No Goals Yet" : `No ${filter} goals`}
                    </h3>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto px-4">
                      {filter === "all"
                        ? "Start your health journey by creating your first goal."
                        : `You don't have any ${filter} goals at the moment.`}
                    </p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-sky-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/25 cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      Create Goal
                    </button>
                  </div>
                </motion.div>
              ) : (
                filteredGoals.map((goal, index) => {
                  const config = goalCategoryConfig[goal.category] || goalCategoryConfig.custom;
                  const plan = getPlanForGoal(goal.id);
                  const daysRemaining = Math.ceil(
                    (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  const isExpanded = expandedGoal === goal.id;

                  return (
                    <motion.div
                      key={goal.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      className="group"
                    >
                      <div
                        className={`relative p-4 sm:p-6 rounded-2xl bg-gradient-to-br ${config.bgColor} border ${
                          selectedGoals.has(goal.id)
                            ? "border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                            : "border-white/10"
                        } backdrop-blur-sm hover:border-white/20 transition-all overflow-hidden`}
                      >
                        {/* Status indicator bar at top */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                          goal.status === "active" ? "from-emerald-500 to-sky-500" :
                          goal.status === "completed" ? "from-green-500 to-emerald-500" :
                          goal.status === "paused" ? "from-amber-500 to-yellow-500" :
                          "from-slate-500 to-slate-600"
                        }`} />
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            {isSelectionMode && (
                              <motion.button
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                onClick={() => toggleSelection(goal.id)}
                                className="mt-1 cursor-pointer"
                              >
                                {selectedGoals.has(goal.id) ? (
                                  <motion.div
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                                  </motion.div>
                                ) : (
                                  <Square className="w-5 h-5 text-slate-500 hover:text-slate-400" />
                                )}
                              </motion.button>
                            )}
                            <div
                              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 flex items-center justify-center ${config.color} shrink-0`}
                            >
                              {config.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                                  {goal.title}
                                </h3>
                                {goal.isPrimary && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    Primary
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    goal.status === "active"
                                      ? "bg-green-500/20 text-green-400"
                                      : goal.status === "completed"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : goal.status === "paused"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-slate-500/20 text-slate-400"
                                  }`}
                                >
                                  {goal.status}
                                </span>
                              </div>
                              <p className="text-sm text-slate-400 line-clamp-2 sm:line-clamp-1 mb-3">
                                {goal.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                                <div className="flex items-center gap-1.5 text-slate-300">
                                  <Target className="w-4 h-4 text-slate-500" />
                                  <span>{goal.currentValue || 0}/{goal.targetValue} {goal.targetUnit}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-300">
                                  <Calendar className="w-4 h-4 text-slate-500" />
                                  <span>{goal.durationWeeks}w</span>
                                </div>
                                <div
                                  className={`flex items-center gap-1.5 ${
                                    daysRemaining < 7 && daysRemaining > 0
                                      ? "text-amber-400"
                                      : daysRemaining <= 0
                                      ? "text-red-400"
                                      : "text-slate-300"
                                  }`}
                                >
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {daysRemaining > 0 ? `${daysRemaining}d left` : "Overdue"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-4 lg:w-52">
                            <div className="flex-1 lg:w-full">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">Progress</span>
                                <span className="text-sm font-semibold text-white">{goal.progress}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full bg-gradient-to-r ${
                                    goal.status === "completed"
                                      ? "from-green-500 to-emerald-500"
                                      : "from-emerald-500 to-sky-500"
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${goal.progress}%` }}
                                  transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {goal.status === "active" && (
                                <button
                                  onClick={() => {
                                    setSelectedGoal(goal);
                                    setIsProgressModalOpen(true);
                                  }}
                                  className="px-3 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-medium cursor-pointer flex items-center gap-1.5"
                                >
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="hidden sm:inline">Update</span>
                                </button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48 bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-xl shadow-xl"
                                >
                                  {goal.status === "active" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(goal, "paused")}
                                        className="text-amber-400 focus:text-amber-300 focus:bg-amber-500/10 cursor-pointer"
                                      >
                                        <Pause className="w-4 h-4 mr-2" />
                                        Pause
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(goal, "completed")}
                                        className="text-green-400 focus:text-green-300 focus:bg-green-500/10 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Complete
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {goal.status === "paused" && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(goal, "active")}
                                      className="text-green-400 focus:text-green-300 focus:bg-green-500/10 cursor-pointer"
                                    >
                                      <Play className="w-4 h-4 mr-2" />
                                      Resume
                                    </DropdownMenuItem>
                                  )}

                                  {(goal.status === "completed" || goal.status === "abandoned") && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(goal, "active")}
                                      className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-500/10 cursor-pointer"
                                    >
                                      <RefreshCw className="w-4 h-4 mr-2" />
                                      Reactivate
                                    </DropdownMenuItem>
                                  )}

                                  <DropdownMenuSeparator className="bg-white/10" />

                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedGoal(goal);
                                      setIsEditModalOpen(true);
                                    }}
                                    className="text-sky-400 focus:text-sky-300 focus:bg-sky-500/10 cursor-pointer"
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                                    className="text-slate-300 focus:text-white focus:bg-white/5 cursor-pointer"
                                  >
                                    <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                    {isExpanded ? "Less" : "More"}
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedGoal(goal);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {plan && (
                                <Link
                                  href="/dashboard?tab=plans"
                                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-6 pt-6 border-t border-white/10 grid sm:grid-cols-2 gap-4 sm:gap-6">
                                {goal.motivation && (
                                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Quote className="w-4 h-4 text-amber-400" />
                                      <span className="text-sm font-medium text-slate-300">Why It Matters</span>
                                    </div>
                                    <p className="text-sm text-slate-400 italic">&quot;{goal.motivation}&quot;</p>
                                  </div>
                                )}

                                {goal.milestones && goal.milestones.length > 0 && (
                                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Award className="w-4 h-4 text-emerald-400" />
                                      <span className="text-sm font-medium text-slate-300">Milestones</span>
                                    </div>
                                    <div className="space-y-2">
                                      {goal.milestones.map((m, index) => (
                                        <div key={m.id || `milestone-${index}`} className="flex items-center gap-2">
                                          {m.completed ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                          ) : (
                                            <Circle className="w-4 h-4 text-slate-500" />
                                          )}
                                          <span className={`text-sm ${m.completed ? "text-green-300 line-through" : "text-slate-400"}`}>
                                            {m.title}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </motion.div>

          {goals.length > 0 && goals.length < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-sky-500/10 border border-emerald-500/20 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-emerald-500/20 shrink-0">
                  <Lightbulb className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Pro Tip</h3>
                  <p className="text-sm text-slate-400">
                    Having 2-3 goals across different pillars leads to better success. Consider adding goals in fitness, nutrition, or wellbeing!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <CreateGoalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateGoal}
          isLoading={isCreating}
        />

        <AIGoalModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onAccept={handleAIGoalAccept}
          isLoading={isCreating}
        />

        <EditGoalModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedGoal(null);
          }}
          onSave={handleEditGoal}
          goal={selectedGoal}
          isLoading={isUpdating}
        />

        <ProgressModal
          key={selectedGoal?.id || "progress-modal"}
          isOpen={isProgressModalOpen}
          onClose={() => {
            setIsProgressModalOpen(false);
            setSelectedGoal(null);
          }}
          onSave={handleUpdateProgress}
          goal={selectedGoal}
          isLoading={isUpdating}
        />

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedGoal(null);
          }}
          onConfirm={handleDelete}
          title="Delete Goal"
          message={`Delete "${selectedGoal?.title}"? This cannot be undone.`}
          isLoading={isDeleting}
        />

        <ConfirmModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDelete}
          title="Delete Selected Goals"
          message={`Delete ${selectedGoals.size} selected goal${selectedGoals.size > 1 ? "s" : ""}? This cannot be undone.`}
          isLoading={isBulkProcessing}
        />

      </div>
    </DashboardLayout>
  );
}
