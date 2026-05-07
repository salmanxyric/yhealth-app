import {
  TrendingDown,
  Dumbbell,
  Moon,
  Brain,
  Zap,
  Trophy,
  Heart,
  Flame,
  Sparkles,
  Utensils,
  Target,
  TrendingUp,
  Pause,
  CheckCircle2,
} from "lucide-react";

// Goal category config
export const goalCategoryConfig: Record<
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

// Kanban column configuration
export const KANBAN_COLUMNS = [
  { id: "active", label: "Active", color: "emerald", icon: Zap, statusValues: ["active"] },
  { id: "in_progress", label: "In Progress", color: "violet", icon: TrendingUp, statusValues: ["in_progress"] },
  { id: "paused", label: "Paused", color: "amber", icon: Pause, statusValues: ["paused"] },
  { id: "completed", label: "Completed", color: "sky", icon: CheckCircle2, statusValues: ["completed"] },
] as const;

export type KanbanColumnId = (typeof KANBAN_COLUMNS)[number]["id"];
