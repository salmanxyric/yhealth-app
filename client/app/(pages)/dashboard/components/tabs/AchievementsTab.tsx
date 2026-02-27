"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Star,
  Medal,
  Award,
  Flame,
  Target,
  Zap,
  Lock,
  CheckCircle2,
  Sparkles,
  Crown,
  TrendingUp,
  ChevronRight,
  Filter,
  Gift,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api-client";

// Types
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "milestone" | "special" | "challenge" | "pillar";
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  progressPercentage: number;
  unlockedAt?: string;
}

interface AchievementSummary {
  level: number;
  totalXP: number;
  xpProgress: number;
  xpNeeded: number;
  xpProgressPercentage: number;
  totalUnlocked: number;
  totalAchievements: number;
  featuredAchievements: Achievement[];
  nearlyUnlocked: Achievement[];
  currentStreak: number;
  longestStreak: number;
}

interface CategoryBreakdown {
  total: number;
  unlocked: number;
}

interface AchievementsData {
  achievements: Achievement[];
  summary: {
    totalAchievements: number;
    unlockedCount: number;
    unlockedPercentage: number;
    totalXP: number;
    categoryBreakdown: Record<string, CategoryBreakdown>;
    rarityBreakdown: Record<string, number>;
  };
}

// Styling maps
const rarityColors = {
  common: "from-slate-400 to-slate-500",
  rare: "from-blue-400 to-cyan-500",
  epic: "from-purple-400 to-pink-500",
  legendary: "from-amber-400 to-orange-500",
};

const rarityBgColors = {
  common: "from-slate-500/20 to-slate-600/20",
  rare: "from-blue-500/20 to-cyan-500/20",
  epic: "from-purple-500/20 to-pink-500/20",
  legendary: "from-amber-500/20 to-orange-500/20",
};

const rarityBorderColors = {
  common: "border-slate-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-amber-500/30",
};

const rarityGlow = {
  common: "",
  rare: "shadow-blue-500/20",
  epic: "shadow-purple-500/30",
  legendary: "shadow-amber-500/40 shadow-lg",
};

const categoryIcons: Record<string, React.ReactNode> = {
  streak: <Flame className="w-4 h-4" />,
  milestone: <Target className="w-4 h-4" />,
  special: <Sparkles className="w-4 h-4" />,
  challenge: <Zap className="w-4 h-4" />,
  pillar: <Award className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  streak: "text-orange-400 bg-orange-500/20",
  milestone: "text-cyan-400 bg-cyan-500/20",
  special: "text-pink-400 bg-pink-500/20",
  challenge: "text-yellow-400 bg-yellow-500/20",
  pillar: "text-green-400 bg-green-500/20",
};

export function AchievementsTab() {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [summary, setSummary] = useState<AchievementSummary | null>(null);
  const [achievementsData, setAchievementsData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, achievementsRes] = await Promise.all([
        api.get<AchievementSummary>("/achievements/summary"),
        api.get<AchievementsData>("/achievements", {
          params: {
            category: categoryFilter !== "all" ? categoryFilter : undefined,
            status: filter !== "all" ? filter : undefined,
          },
        }),
      ]);

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (achievementsRes.success && achievementsRes.data) {
        setAchievementsData(achievementsRes.data);
      }
    } catch (err) {
      console.error("Error fetching achievements:", err);
      setError("Failed to load achievements. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading && !achievementsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const achievements = achievementsData?.achievements || [];
  const stats = achievementsData?.summary;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Level Progress Card */}
      {summary && (
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/10 border border-amber-500/20 p-6"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Level Badge */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-amber-500 rounded-full text-white text-sm font-bold shadow-lg">
                  {summary.level}
                </div>
              </div>
              <div>
                <p className="text-sm text-amber-300/80 font-medium">Current Level</p>
                <h2 className="text-2xl font-bold text-white">
                  {summary.level < 5 ? "Beginner" : summary.level < 10 ? "Explorer" : summary.level < 20 ? "Achiever" : summary.level < 50 ? "Champion" : "Legend"}
                </h2>
                <p className="text-sm text-slate-400">
                  {summary.totalXP.toLocaleString()} Total XP
                </p>
              </div>
            </div>

            {/* XP Progress */}
            <div className="flex-1 lg:max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Progress to Level {summary.level + 1}</span>
                <span className="text-sm font-medium text-amber-400">
                  {summary.xpProgress}/{summary.xpNeeded} XP
                </span>
              </div>
              <div className="relative h-4 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.xpProgressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4 lg:gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/20 mx-auto mb-1">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <p className="text-xl font-bold text-white">{summary.currentStreak}</p>
                <p className="text-xs text-slate-400">Streak</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 mx-auto mb-1">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-xl font-bold text-white">{summary.totalUnlocked}</p>
                <p className="text-xs text-slate-400">Unlocked</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/20 mx-auto mb-1">
                  <TrendingUp className="w-6 h-6 text-cyan-400" />
                </div>
                <p className="text-xl font-bold text-white">{summary.longestStreak}</p>
                <p className="text-xs text-slate-400">Best Streak</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">
              {stats?.unlockedPercentage || 0}%
            </span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.unlockedCount || 0}/{stats?.totalAchievements || 0}
          </p>
          <p className="text-sm text-slate-400">Achievements</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20">
              <Star className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.totalXP?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-slate-400">Total XP</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20">
              <Medal className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.rarityBreakdown?.legendary || 0}
          </p>
          <p className="text-sm text-slate-400">Legendary</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-pink-500/20">
              <Sparkles className="w-5 h-5 text-pink-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats?.rarityBreakdown?.epic || 0}
          </p>
          <p className="text-sm text-slate-400">Epic</p>
        </div>
      </motion.div>

      {/* Nearly Unlocked Section */}
      {summary && summary.nearlyUnlocked.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Almost There!</h3>
            <span className="text-xs text-slate-400 ml-auto">Keep going to unlock these</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.nearlyUnlocked.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedAchievement(achievement)}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${rarityBgColors[achievement.rarity]}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{achievement.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${rarityColors[achievement.rarity]}`}
                        style={{ width: `${achievement.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{achievement.progressPercentage}%</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          {(["all", "unlocked", "locked"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filter === f
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {f === "all" ? "All" : f === "unlocked" ? "Unlocked" : "Locked"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-500 ml-2 flex-shrink-0" />
          {["all", "streak", "milestone", "pillar", "special", "challenge"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {cat !== "all" && categoryIcons[cat]}
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Category Progress */}
      {stats?.categoryBreakdown && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(stats.categoryBreakdown).map(([category, data]) => (
            <div
              key={category}
              className={`p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer ${
                categoryFilter === category ? "border-amber-500/50 bg-amber-500/10" : ""
              }`}
              onClick={() => setCategoryFilter(category === categoryFilter ? "all" : category)}
            >
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg ${categoryColors[category]} mb-2`}>
                {categoryIcons[category]}
                <span className="text-xs font-medium capitalize">{category}</span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-xl font-bold text-white">{data.unlocked}/{data.total}</p>
                <p className="text-xs text-slate-400">
                  {Math.round((data.unlocked / data.total) * 100)}%
                </p>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                  style={{ width: `${(data.unlocked / data.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Achievements Grid */}
      <motion.div
        variants={itemVariants}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedAchievement(achievement)}
              className={`relative p-5 rounded-2xl border backdrop-blur-sm overflow-hidden transition-all cursor-pointer group ${
                achievement.unlocked
                  ? `bg-gradient-to-br ${rarityBgColors[achievement.rarity]} ${rarityBorderColors[achievement.rarity]} hover:scale-[1.02] ${rarityGlow[achievement.rarity]}`
                  : "bg-white/5 border-white/5 opacity-70 hover:opacity-90"
              }`}
            >
              {/* Rarity indicator */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${
                  rarityColors[achievement.rarity]
                } opacity-10 rounded-bl-full transition-opacity group-hover:opacity-20`}
              />

              {/* XP Badge */}
              {achievement.unlocked && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/10 text-xs font-medium text-amber-300">
                  +{achievement.xpReward} XP
                </div>
              )}

              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${
                      achievement.unlocked
                        ? `bg-gradient-to-br ${rarityBgColors[achievement.rarity]} shadow-lg`
                        : "bg-slate-800"
                    }`}
                  >
                    {achievement.unlocked ? (
                      achievement.icon
                    ) : (
                      <Lock className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  {achievement.unlocked && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                    >
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </motion.div>
                  )}
                </div>

                <h3
                  className={`font-semibold mb-1 transition-colors ${
                    achievement.unlocked ? "text-white group-hover:text-amber-200" : "text-slate-500"
                  }`}
                >
                  {achievement.title}
                </h3>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{achievement.description}</p>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Progress</span>
                    <span className={`text-xs font-medium ${achievement.unlocked ? 'text-green-400' : 'text-slate-400'}`}>
                      {achievement.progress}/{achievement.maxProgress}
                      {achievement.unlocked && ' ✓'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${achievement.progressPercentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        achievement.unlocked
                          ? 'from-green-400 to-emerald-500'
                          : rarityColors[achievement.rarity]
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${
                        rarityColors[achievement.rarity]
                      } text-white capitalize`}
                    >
                      {achievement.rarity}
                    </span>
                    <span className={`p-1.5 rounded-lg ${categoryColors[achievement.category]}`}>
                      {categoryIcons[achievement.category]}
                    </span>
                  </div>
                  {!achievement.unlocked && (
                    <span className="text-xs text-slate-500">
                      {achievement.progressPercentage}% complete
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {achievements.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No achievements found</h3>
          <p className="text-sm text-slate-500">Try adjusting your filters to see more achievements</p>
        </motion.div>
      )}

      {/* Featured Achievements Section */}
      {summary && summary.featuredAchievements.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white">Featured Achievements</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary.featuredAchievements.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-4 rounded-xl bg-gradient-to-br ${rarityBgColors[achievement.rarity]} border ${rarityBorderColors[achievement.rarity]} text-center hover:scale-105 transition-transform cursor-pointer`}
                onClick={() => setSelectedAchievement(achievement)}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <p className="text-sm font-medium text-white truncate">{achievement.title}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white capitalize`}>
                  {achievement.rarity}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Rarity Legend */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center justify-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
      >
        <span className="text-sm text-slate-400">Rarity:</span>
        {(["common", "rare", "epic", "legendary"] as const).map((rarity) => (
          <div key={rarity} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${rarityColors[rarity]}`} />
            <span className="text-xs text-slate-300 capitalize">{rarity}</span>
            <span className="text-xs text-slate-500">({stats?.rarityBreakdown?.[rarity] || 0})</span>
          </div>
        ))}
      </motion.div>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative max-w-md w-full p-6 rounded-3xl bg-gradient-to-br ${rarityBgColors[selectedAchievement.rarity]} border ${rarityBorderColors[selectedAchievement.rarity]} backdrop-blur-xl ${rarityGlow[selectedAchievement.rarity]}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedAchievement(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center">
                <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-5xl mb-4 bg-gradient-to-br ${rarityBgColors[selectedAchievement.rarity]} shadow-xl ${selectedAchievement.unlocked ? "" : "grayscale"}`}>
                  {selectedAchievement.unlocked ? selectedAchievement.icon : <Lock className="w-12 h-12 text-slate-500" />}
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">{selectedAchievement.title}</h2>
                <p className="text-slate-300 mb-4">{selectedAchievement.description}</p>

                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${rarityColors[selectedAchievement.rarity]} text-white capitalize`}>
                    {selectedAchievement.rarity}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[selectedAchievement.category]}`}>
                    {selectedAchievement.category}
                  </span>
                </div>

                {/* Progress */}
                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">Progress</span>
                    <span className="text-sm font-medium text-white">
                      {selectedAchievement.progress}/{selectedAchievement.maxProgress}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedAchievement.progressPercentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${rarityColors[selectedAchievement.rarity]}`}
                    />
                  </div>
                  <p className="text-center mt-2 text-sm text-slate-400">
                    {selectedAchievement.progressPercentage}% Complete
                  </p>
                </div>

                {/* Reward */}
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <Star className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-300 font-medium">+{selectedAchievement.xpReward} XP Reward</span>
                </div>

                {selectedAchievement.unlocked && (
                  <p className="mt-4 text-sm text-green-400 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Achievement Unlocked!
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add shimmer animation styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </motion.div>
  );
}
