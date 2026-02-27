"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Heart, Sparkles } from "lucide-react";

interface Insight {
  category: string;
  description: string;
  severity: 'mild' | 'moderate' | 'significant';
  trend?: 'improving' | 'stable' | 'declining';
}

interface CheckInInsights {
  summary: string;
  details: Insight[];
  patterns?: Record<string, unknown>;
}

interface CheckInSession {
  id: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  questionCount: number;
  screeningType: string;
  overallAnxietyScore?: number;
  overallMoodScore?: number;
  riskLevel: string;
  crisisDetected: boolean;
  insights: CheckInInsights;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    duration?: number;
  }>;
}

interface CheckInResultsProps {
  session: CheckInSession;
}

export function CheckInResults({ session }: CheckInResultsProps) {
  const insights = session.insights?.details || [];
  const summary = session.insights?.summary || "Your check-in is complete.";

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-purple-600/5 to-pink-600/5" />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">Check-In Complete</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">{summary}</p>
        </div>
      </motion.div>

      {/* Scores */}
      {(session.overallAnxietyScore !== undefined || session.overallMoodScore !== undefined) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {session.overallAnxietyScore !== undefined && (
            <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Anxiety Score</span>
                <span className="text-2xl font-bold text-white">
                  {session.overallAnxietyScore.toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
                  style={{ width: `${(session.overallAnxietyScore / 10) * 100}%` }}
                />
              </div>
            </div>
          )}
          {session.overallMoodScore !== undefined && (
            <div className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Mood Score</span>
                <span className="text-2xl font-bold text-white">
                  {session.overallMoodScore.toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                  style={{ width: `${(session.overallMoodScore / 10) * 100}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-purple-600/5 to-pink-600/5" />
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Insights</h2>
            </div>
            <div className="space-y-4">
              {insights.map((insight: Insight, index: number) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/50"
                >
                  <div className="flex items-start gap-3">
                    {insight.trend === "improving" && (
                      <TrendingUp className="w-5 h-5 text-emerald-400 mt-0.5" />
                    )}
                    {insight.trend === "declining" && (
                      <TrendingDown className="w-5 h-5 text-amber-400 mt-0.5" />
                    )}
                    {insight.trend === "stable" && (
                      <Minus className="w-5 h-5 text-slate-400 mt-0.5" />
                    )}
                    <p className="text-slate-300 leading-relaxed flex-1">
                      {insight.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {session.recommendations && session.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-purple-600/5 to-pink-600/5" />
          <div className="relative p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-6">Suggestions for You</h2>
            <div className="space-y-4">
              {session.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-emerald-500/50 transition-colors"
                >
                  <h3 className="font-semibold text-white mb-2">{rec.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{rec.description}</p>
                  {rec.duration && (
                    <span className="inline-block mt-2 text-xs text-slate-400">
                      ~{rec.duration} min
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

