"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Heart,
  Download,
  Sparkles,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Smile,
  Zap,
  Brain,
  BarChart3,
  Filter,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { DashboardLayout } from "@/components/layout";
import {
  WellbeingModulesGrid,
  WELLBEING_MODULES,
} from "@/components/wellbeing/WellbeingModulesGrid";
import {
  moodService,
  energyService,
  habitService,
} from "@/src/shared/services/wellbeing.service";
import { stressService } from "@/src/shared/services/stress.service";
import type { MoodLog, EnergyLog } from "@shared/types/domain/wellbeing";

/* ───────── Types ───────── */

type DateRange = "today" | "7d" | "30d";

interface ChartPoint {
  date: string;
  label: string;
  value: number;
}

interface WellbeingStats {
  moodAvg: number | null;
  moodTrend: "up" | "down" | "stable";
  energyAvg: number | null;
  energyTrend: "up" | "down" | "stable";
  stressAvg: number | null;
  stressTrend: "up" | "down" | "stable";
  habitsCompleted: number;
  habitsTotal: number;
  habitPct: number;
  moodChart: ChartPoint[];
  energyChart: ChartPoint[];
}

const DATE_OPTIONS: { value: DateRange; label: string; days: number }[] = [
  { value: "today", label: "Today", days: 1 },
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
];

/* ───────── Inline Components ───────── */

function TrendBadge({
  value,
  trend,
}: {
  value: number | null;
  trend: "up" | "down" | "stable";
}) {
  if (value === null) return null;
  const icon =
    trend === "up" ? (
      <TrendingUp className="h-3 w-3" />
    ) : trend === "down" ? (
      <TrendingDown className="h-3 w-3" />
    ) : (
      <Minus className="h-3 w-3" />
    );
  const color =
    trend === "up"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : trend === "down"
        ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
        : "text-slate-400 bg-white/[0.03] border-white/[0.06]";
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${color}`}
    >
      {icon}
      {trend === "up" ? "+" : trend === "down" ? "-" : ""}
      {Math.abs(value).toFixed(0)}
    </span>
  );
}

function KPICard({
  title,
  value,
  unit,
  trend,
  trendVal,
  icon: Icon,
  color,
  loading,
  delay = 0,
}: {
  title: string;
  value: string;
  unit?: string;
  trend: "up" | "down" | "stable";
  trendVal: number | null;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  loading: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg"
      style={{
        borderColor: `${color}20`,
        background: `linear-gradient(135deg, ${color}08 0%, #0c0c14 50%, ${color}05 100%)`,
      }}
    >
      {/* Ambient corner glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ backgroundColor: `${color}15` }}
      />

      {loading ? (
        <div className="space-y-3">
          <div className="h-4 w-20 rounded bg-white/[0.04] animate-pulse" />
          <div className="h-8 w-16 rounded bg-white/[0.04] animate-pulse" />
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {title}
            </span>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}18` }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-slate-500 font-medium">{unit}</span>
            )}
          </div>
          <div className="mt-3">
            <TrendBadge value={trendVal} trend={trend} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function QuickInsightBanner({
  stats,
  loading,
}: {
  stats: WellbeingStats | null;
  loading: boolean;
}) {
  if (loading || !stats) return null;

  let message = "";
  let accent = "#10b981";
  if (stats.moodAvg !== null && stats.moodAvg >= 7) {
    message = `Your mood is averaging ${stats.moodAvg.toFixed(1)}/10 — great emotional balance this period.`;
    accent = "#10b981";
  } else if (stats.energyAvg !== null && stats.energyAvg < 5) {
    message = `Energy is low at ${stats.energyAvg.toFixed(1)}/10. Consider a breathing session or quick walk.`;
    accent = "#f59e0b";
  } else if (stats.habitPct >= 80) {
    message = `Strong habits — ${stats.habitPct.toFixed(0)}% completion rate. Keep up the momentum!`;
    accent = "#8b5cf6";
  } else {
    message =
      "Keep logging mood, energy, and habits to unlock personalized AI insights.";
    accent = "#06b6d4";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border p-4"
      style={{
        borderColor: `${accent}20`,
        background: `linear-gradient(135deg, ${accent}0a 0%, #0c0c1400 40%, ${accent}06 100%)`,
      }}
    >
      {/* Subtle animated shimmer */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse 50% 80% at 80% 20%, ${accent}12, transparent)`,
        }}
      />
      <div className="relative flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Brain className="h-4.5 w-4.5" style={{ color: accent }} />
        </div>
        <p className="text-[13px] text-slate-300 leading-relaxed flex-1">
          {message}
        </p>
        <span className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/15 shrink-0">
          AI
        </span>
      </div>
    </motion.div>
  );
}

/* ───────── Main Content ───────── */

function WellbeingContent() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [dateOpen, setDateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WellbeingStats | null>(null);
  const [moduleFilter, setModuleFilter] = useState<
    "all" | "tracking" | "tools"
  >("all");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const days = DATE_OPTIONS.find((d) => d.value === dateRange)?.days ?? 7;
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - days * 86400000)
        .toISOString()
        .split("T")[0];

      const [moodRes, energyRes, habitRes, stressRes] = await Promise.allSettled([
        moodService.getLogs({ startDate, endDate }),
        energyService.getLogs({ startDate, endDate }),
        habitService.getHabits(),
        stressService.getLogs(startDate, endDate),
      ]);

      let moodAvg: number | null = null;
      let moodTrend: "up" | "down" | "stable" = "stable";
      if (moodRes.status === "fulfilled" && moodRes.value.data?.logs?.length) {
        const logs = moodRes.value.data.logs as MoodLog[];
        const getRating = (l: MoodLog) => l.happinessRating ?? 0;
        moodAvg =
          logs.reduce((s, l) => s + getRating(l), 0) / logs.length;
        if (logs.length >= 2) {
          const mid = Math.ceil(logs.length / 2);
          const recentAvg =
            logs.slice(0, mid).reduce((s, l) => s + getRating(l), 0) / mid;
          const olderAvg =
            logs.slice(mid).reduce((s, l) => s + getRating(l), 0) /
            (logs.length - mid);
          moodTrend =
            recentAvg > olderAvg + 0.3
              ? "up"
              : recentAvg < olderAvg - 0.3
                ? "down"
                : "stable";
        }
      }

      let energyAvg: number | null = null;
      let energyTrend: "up" | "down" | "stable" = "stable";
      if (
        energyRes.status === "fulfilled" &&
        energyRes.value.data?.logs?.length
      ) {
        const logs = energyRes.value.data.logs as EnergyLog[];
        const getRating = (l: EnergyLog) => l.energyRating ?? 0;
        energyAvg =
          logs.reduce((s, l) => s + getRating(l), 0) / logs.length;
        if (logs.length >= 2) {
          const mid = Math.ceil(logs.length / 2);
          const recentAvg =
            logs.slice(0, mid).reduce((s, l) => s + getRating(l), 0) / mid;
          const olderAvg =
            logs.slice(mid).reduce((s, l) => s + getRating(l), 0) /
            (logs.length - mid);
          energyTrend =
            recentAvg > olderAvg + 0.3
              ? "up"
              : recentAvg < olderAvg - 0.3
                ? "down"
                : "stable";
        }
      }

      let habitsCompleted = 0;
      let habitsTotal = 0;
      if (
        habitRes.status === "fulfilled" &&
        habitRes.value.data?.habits?.length
      ) {
        const habits = habitRes.value.data.habits as Array<{
          isActive?: boolean;
          is_active?: boolean;
          completedToday?: boolean;
        }>;
        habitsTotal = habits.filter(
          (h) => h.isActive !== false && h.is_active !== false
        ).length;
        habitsCompleted = habits.filter(
          (h) => h.completedToday === true
        ).length;
      }

      const habitPct =
        habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;

      // Build chart data — aggregate by date
      // Format label based on range: "Mon" for 7d, "Mar 15" for 30d
      const formatLabel = (date: string) => {
        const dt = new Date(date + 'T00:00:00');
        if (days <= 7) return dt.toLocaleDateString("en-US", { weekday: "short" });
        return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      };

      const moodChart: ChartPoint[] = [];
      if (moodRes.status === "fulfilled" && moodRes.value.data?.logs?.length) {
        const byDate = new Map<string, number[]>();
        for (const l of moodRes.value.data.logs as MoodLog[]) {
          const d = (l.loggedAt || l.createdAt).split("T")[0];
          if (!byDate.has(d)) byDate.set(d, []);
          byDate.get(d)!.push(l.happinessRating ?? 0);
        }
        for (const [date, vals] of Array.from(byDate.entries()).sort()) {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          moodChart.push({
            date,
            label: formatLabel(date),
            value: Math.round(avg * 10) / 10,
          });
        }
      }

      const energyChart: ChartPoint[] = [];
      if (energyRes.status === "fulfilled" && energyRes.value.data?.logs?.length) {
        const byDate = new Map<string, number[]>();
        for (const l of energyRes.value.data.logs as EnergyLog[]) {
          const d = (l.loggedAt || l.createdAt).split("T")[0];
          if (!byDate.has(d)) byDate.set(d, []);
          byDate.get(d)!.push(l.energyRating ?? 0);
        }
        for (const [date, vals] of Array.from(byDate.entries()).sort()) {
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          energyChart.push({
            date,
            label: formatLabel(date),
            value: Math.round(avg * 10) / 10,
          });
        }
      }

      // Stress data
      let stressAvg: number | null = null;
      let stressTrend: "up" | "down" | "stable" = "stable";
      if (stressRes.status === "fulfilled" && stressRes.value.data?.length) {
        const logs = stressRes.value.data;
        stressAvg = logs.reduce((s, l) => s + (l.stressRating ?? 0), 0) / logs.length;
        if (logs.length >= 2) {
          const mid = Math.ceil(logs.length / 2);
          const recentAvg = logs.slice(0, mid).reduce((s, l) => s + (l.stressRating ?? 0), 0) / mid;
          const olderAvg = logs.slice(mid).reduce((s, l) => s + (l.stressRating ?? 0), 0) / (logs.length - mid);
          stressTrend = recentAvg > olderAvg + 0.3 ? "up" : recentAvg < olderAvg - 0.3 ? "down" : "stable";
        }
      }

      setStats({
        moodAvg,
        moodTrend,
        energyAvg,
        energyTrend,
        stressAvg,
        stressTrend,
        habitsCompleted,
        habitsTotal,
        habitPct,
        moodChart,
        energyChart,
      });
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const filteredModules =
    moduleFilter === "all"
      ? WELLBEING_MODULES
      : moduleFilter === "tracking"
        ? WELLBEING_MODULES.filter((m) =>
            ["mood", "energy", "stress", "habits"].includes(m.id)
          )
        : WELLBEING_MODULES.filter((m) =>
            [
              "journal",
              "breathing",
              "emotional-checkin",
              "insights",
              "schedule",
            ].includes(m.id)
          );

  return (
    <DashboardLayout activeTab="wellbeing">
      <div className="flex flex-col h-full min-h-screen bg-[#0a0a0f]">
        {/* ── Sticky Top Bar ── */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl px-4 sm:px-6 h-12">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Wellbeing</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Date Range Selector */}
            <div className="relative">
              <button
                onClick={() => setDateOpen(!dateOpen)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-xs text-slate-300 hover:bg-white/[0.06] transition-colors"
              >
                <Calendar className="h-3 w-3 text-slate-500" />
                {DATE_OPTIONS.find((d) => d.value === dateRange)?.label}
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>
              <AnimatePresence>
                {dateOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-9 z-50 w-28 rounded-lg border border-white/[0.08] bg-[#15151f] shadow-xl overflow-hidden"
                  >
                    {DATE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setDateRange(opt.value);
                          setDateOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                          opt.value === dateRange
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export */}
            <button className="flex items-center justify-center h-7 w-7 rounded-md border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">
              <Download className="h-3 w-3" />
            </button>

            {/* Check-In */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/wellbeing/emotional-checkin")}
              className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-semibold bg-emerald-500/90 hover:bg-emerald-500 text-white border-0 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Check-in
            </motion.button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* AI Insight Banner */}
            <QuickInsightBanner stats={stats} loading={loading} />

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Mood"
                value={
                  stats?.moodAvg !== null && stats?.moodAvg !== undefined
                    ? stats.moodAvg.toFixed(1)
                    : "--"
                }
                unit="/10"
                trend={stats?.moodTrend ?? "stable"}
                trendVal={stats?.moodAvg ?? null}
                icon={Smile}
                color="#ec4899"
                loading={loading}
                delay={0}
              />
              <KPICard
                title="Energy"
                value={
                  stats?.energyAvg !== null && stats?.energyAvg !== undefined
                    ? stats.energyAvg.toFixed(1)
                    : "--"
                }
                unit="/10"
                trend={stats?.energyTrend ?? "stable"}
                trendVal={stats?.energyAvg ?? null}
                icon={Zap}
                color="#f59e0b"
                loading={loading}
                delay={0.04}
              />
              <KPICard
                title="Stress"
                value={
                  stats?.stressAvg !== null && stats?.stressAvg !== undefined
                    ? stats.stressAvg.toFixed(1)
                    : "--"
                }
                unit="/10"
                trend={stats?.stressTrend ?? "stable"}
                trendVal={stats?.stressAvg ?? null}
                icon={Activity}
                color="#ef4444"
                loading={loading}
                delay={0.08}
              />
              <KPICard
                title="Habits"
                value={
                  stats
                    ? `${stats.habitsCompleted}/${stats.habitsTotal}`
                    : "--"
                }
                unit={
                  stats && stats.habitsTotal > 0
                    ? `${stats.habitPct.toFixed(0)}%`
                    : undefined
                }
                trend={
                  stats && stats.habitPct >= 80
                    ? "up"
                    : stats && stats.habitPct >= 50
                      ? "stable"
                      : "down"
                }
                trendVal={stats?.habitPct ?? null}
                icon={BarChart3}
                color="#8b5cf6"
                loading={loading}
                delay={0.12}
              />
            </div>

            {/* Analytics Charts */}
            {!loading && stats && (stats.moodChart.length > 1 || stats.energyChart.length > 1) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Mood Trend */}
                {stats.moodChart.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="relative overflow-hidden rounded-2xl border border-pink-500/[0.12] p-5"
                    style={{
                      background: "linear-gradient(135deg, rgba(236,72,153,0.06) 0%, #0c0c14 60%, rgba(236,72,153,0.03) 100%)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/15">
                          <Smile className="h-3.5 w-3.5 text-pink-400" />
                        </div>
                        <h3 className="text-xs font-semibold text-white">Mood Trend</h3>
                      </div>
                      <span className="text-[10px] text-slate-600">
                        {stats.moodChart.length} days
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={stats.moodChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "#475569", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 10]}
                          tick={{ fill: "#475569", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#15151f",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "11px",
                          }}
                          labelStyle={{ color: "#94a3b8", fontSize: "10px" }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(v: any) => [`${v}/10`, "Mood"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#ec4899"
                          strokeWidth={2}
                          fill="url(#moodGrad)"
                          dot={{ r: 3, fill: "#ec4899", strokeWidth: 0 }}
                          activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {/* Energy Trend */}
                {stats.energyChart.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative overflow-hidden rounded-2xl border border-amber-500/[0.12] p-5"
                    style={{
                      background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, #0c0c14 60%, rgba(245,158,11,0.03) 100%)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15">
                          <Zap className="h-3.5 w-3.5 text-amber-400" />
                        </div>
                        <h3 className="text-xs font-semibold text-white">Energy Trend</h3>
                      </div>
                      <span className="text-[10px] text-slate-600">
                        {stats.energyChart.length} days
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={stats.energyChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "#475569", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 10]}
                          tick={{ fill: "#475569", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#15151f",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "11px",
                          }}
                          labelStyle={{ color: "#94a3b8", fontSize: "10px" }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(v: any) => [`${v}/10`, "Energy"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          fill="url(#energyGrad)"
                          dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                          activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </div>
            )}

            {/* Module Filter + Grid */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-white">
                    Wellbeing Modules
                  </h2>
                  <span className="text-[10px] text-slate-600 tabular-nums bg-white/[0.03] px-2 py-0.5 rounded-full">
                    {filteredModules.length} modules
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3 w-3 text-slate-600 mr-1" />
                  {(
                    [
                      { key: "all", label: "All" },
                      { key: "tracking", label: "Tracking" },
                      { key: "tools", label: "Tools" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setModuleFilter(f.key)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                        moduleFilter === f.key
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <WellbeingModulesGrid modules={filteredModules} />
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-white">
                Quick Actions
              </h2>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <motion.button
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => router.push("/competitions")}
                  className="group relative overflow-hidden flex flex-col items-start gap-4 p-6 rounded-2xl border border-amber-500/15 text-left transition-all duration-300 hover:border-amber-400/30 hover:shadow-lg hover:shadow-amber-500/10"
                  style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, #0c0c14 50%, rgba(249,115,22,0.05) 100%)",
                  }}
                >
                  <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-center justify-between w-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                      <span className="text-xl">🏆</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      Join
                    </span>
                  </div>
                  <div className="relative">
                    <p className="text-sm font-semibold text-white group-hover:text-amber-100 transition-colors mb-1">
                      Wellbeing Challenge
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Compete with others and earn rewards for healthy habits
                    </p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => router.push("/wellbeing/breathing")}
                  className="group relative overflow-hidden flex flex-col items-start gap-4 p-6 rounded-2xl border border-cyan-500/15 text-left transition-all duration-300 hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-500/10"
                  style={{
                    background: "linear-gradient(135deg, rgba(6,182,212,0.08) 0%, #0c0c14 50%, rgba(20,184,166,0.05) 100%)",
                  }}
                >
                  <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-cyan-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/20">
                    <span className="text-xl">🌬️</span>
                  </div>
                  <div className="relative">
                    <p className="text-sm font-semibold text-white group-hover:text-cyan-100 transition-colors mb-1">
                      Quick Breathwork
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      5-minute guided breathing session to relieve stress
                    </p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => router.push("/wellbeing/insights")}
                  className="group relative overflow-hidden flex flex-col items-start gap-4 p-6 rounded-2xl border border-violet-500/15 text-left transition-all duration-300 hover:border-violet-400/30 hover:shadow-lg hover:shadow-violet-500/10"
                  style={{
                    background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, #0c0c14 50%, rgba(168,85,247,0.05) 100%)",
                  }}
                >
                  <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-violet-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-center justify-between w-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-violet-500/15 text-violet-400 border border-violet-500/20">
                      AI
                    </span>
                  </div>
                  <div className="relative">
                    <p className="text-sm font-semibold text-white group-hover:text-violet-100 transition-colors mb-1">
                      AI Insights
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Health correlations and patterns from your data
                    </p>
                  </div>
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function WellbeingLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
      <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
    </div>
  );
}

export default function WellbeingPageContent() {
  return (
    <Suspense fallback={<WellbeingLoading />}>
      <WellbeingContent />
    </Suspense>
  );
}
