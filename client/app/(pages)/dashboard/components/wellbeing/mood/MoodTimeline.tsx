/**
 * @file MoodTimeline Component
 * @description Visual timeline chart showing mood patterns over time
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, Calendar } from "lucide-react";
import { moodService } from "@/src/shared/services/wellbeing.service";
import { format, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MoodTimelineProps {
  days?: number;
}

export function MoodTimeline({ days = 30 }: MoodTimelineProps) {
  const [timeline, setTimeline] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
    
    // Listen for mood log events to refresh timeline
    const handleMoodLogged = () => {
      loadTimeline();
    };
    
    window.addEventListener('mood-logged', handleMoodLogged);
    return () => {
      window.removeEventListener('mood-logged', handleMoodLogged);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const loadTimeline = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = subDays(new Date(), days).toISOString().split("T")[0];

      const result = await moodService.getTimeline(startDate, endDate);

      if (result.success && result.data) {
        // Transform data for chart
        const chartData = result.data.timeline
          .filter((item) => item.averageRating !== undefined && item.averageRating !== null)
          .map((item) => ({
            date: format(new Date(item.date), "MMM d"),
            fullDate: item.date,
            mood: item.averageRating || 0,
            emoji: item.moodEmoji || "",
          }));
        setTimeline(chartData);
      } else {
        setError(result.error?.message || "Failed to load timeline");
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load timeline");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Mood Timeline</h3>
          </div>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Mood Timeline</h3>
          </div>
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadTimeline}
              className="px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm transition-colors border border-emerald-500/30"
            >
              Retry
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-purple-600/5 to-pink-600/5" />
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Mood Timeline ({days} days)</h3>
        </div>
        {timeline.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-white/80">No mood data yet</p>
              <p className="text-sm mt-1 text-slate-400">Start logging your mood to see patterns</p>
            </motion.div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="date"
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#9ca3af"
                style={{ fontSize: "12px" }}
                label={{ value: "Mood Score", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#9ca3af" } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #10b981",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
                }}
                labelStyle={{ color: "#e2e8f0" }}
                formatter={(value: unknown) => [`${Number(value).toFixed(1)}/10`, "Mood Score"]}
              />
              <Legend wrapperStyle={{ color: "#e2e8f0" }} />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 5 }}
                activeDot={{ r: 7, fill: "#34d399" }}
                name="Mood Score"
                isAnimationActive={true}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

