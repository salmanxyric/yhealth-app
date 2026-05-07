"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Smile } from "lucide-react";
import { activityStatusService, STATUS_CONFIG, type StatusStats as StatusStatsType } from "@/src/shared/services/activity-status.service";
import { toast } from "react-hot-toast";

export function StatusStats() {
  const [stats, setStats] = useState<StatusStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const response = await activityStatusService.getStats({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (_error) {
      toast.error("Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bal-skeleton h-32"
          />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No statistics available</p>
      </div>
    );
  }

  const totalEntries = Object.values(stats.statusDistribution).reduce((a, b) => a + b, 0);
  const mostCommonConfig = STATUS_CONFIG[stats.mostCommonStatus];

  return (
    <div className="space-y-4 text-[11px] sm:text-xs lg:text-[13px]">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="bal-kpi p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 ring-1 ring-cyan-300/20 sm:h-10 sm:w-10">
              <Calendar className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-lg font-bold text-white sm:text-xl">{stats.totalDays}</p>
              <p className="text-[10px] text-slate-300 sm:text-[11px]">Days Tracked</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="bal-kpi p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-lg ring-1 sm:h-10 sm:w-10 sm:text-xl"
              style={{ backgroundColor: `${mostCommonConfig.color}20`, color: mostCommonConfig.color }}
            >
              {mostCommonConfig.icon}
            </div>
            <div>
              <p className="text-lg font-bold capitalize text-white sm:text-xl">{stats.mostCommonStatus}</p>
              <p className="text-[10px] text-slate-300 sm:text-[11px]">Most Common</p>
            </div>
          </div>
        </motion.div>

        {stats.averageMood && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="bal-kpi p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-300/20 sm:h-10 sm:w-10">
                <Smile className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-lg font-bold text-white sm:text-xl">{stats.averageMood.toFixed(1)}</p>
                <p className="text-[10px] text-slate-300 sm:text-[11px]">Avg Mood</p>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="bal-kpi p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-300/20 sm:h-10 sm:w-10">
              <TrendingUp className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-lg font-bold text-white sm:text-xl">{stats.streakDays}</p>
              <p className="text-[10px] text-slate-300 sm:text-[11px]">Day Streak</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Distribution */}
      <div className="bal-surface p-4 shadow-[0_14px_34px_rgba(2,6,23,0.42)] sm:p-5">
        <h3 className="mb-4 text-sm font-semibold text-white sm:text-base">Status Distribution</h3>
        <div className="space-y-3">
          {Object.entries(stats.statusDistribution)
            .filter(([_, count]) => count > 0)
            .sort(([_, a], [__, b]) => b - a)
            .map(([status, count]) => {
              const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
              const percentage = totalEntries > 0 ? (count / totalEntries) * 100 : 0;

              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg">{config.icon}</span>
                      <span className="text-[11px] font-medium capitalize text-white sm:text-xs">{status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-300 sm:text-[11px]">{count} days</span>
                      <span className="text-[10px] font-semibold text-white sm:text-[11px]">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
