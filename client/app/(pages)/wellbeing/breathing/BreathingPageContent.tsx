"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { Loader2, Wind, ArrowLeft, TrendingUp, History, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import {
  BreathingTest,
  BreathingChart,
  BreathingHistory,
} from "@/app/(pages)/dashboard/components/wellbeing/breathing";
import { breathingService } from "@/src/shared/services/wellbeing.service";
import type {
  BreathingTest as BreathingTestType,
  BreathingTimelineData,
  BreathingStats,
  BreathingTestType as TestType,
} from "@shared/types/domain/wellbeing";
import { toast } from "sonner";

function BreathingLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
          <div className="absolute inset-0 blur-xl bg-cyan-500/30 rounded-full" />
        </div>
        <p className="text-slate-400">Loading breathing test...</p>
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

function BreathingContent() {
  const router = useRouter();
  const [tests, setTests] = useState<BreathingTestType[]>([]);
  const [timeline, setTimeline] = useState<BreathingTimelineData[]>([]);
  const [stats, setStats] = useState<BreathingStats | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [chartDays, setChartDays] = useState<7 | 14 | 30>(7);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - chartDays);

      const [testsRes, timelineRes, statsRes] = await Promise.all([
        breathingService.getTests({ limit: 10 }),
        breathingService.getTimeline(
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        ),
        breathingService.getStats(chartDays),
      ]);

      if (testsRes.success && testsRes.data) {
        setTests(testsRes.data.tests);
      }

      if (timelineRes.success && timelineRes.data) {
        setTimeline(timelineRes.data.timeline);
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch breathing data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [chartDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTestComplete = async (result: {
    testType: TestType;
    patternName: string;
    breathHoldDurationSeconds?: number;
    totalCyclesCompleted: number;
    totalDurationSeconds: number;
    consistencyScore?: number;
    startedAt: string;
  }) => {
    try {
      const response = await breathingService.saveTest({
        test_type: result.testType,
        pattern_name: result.patternName,
        breath_hold_duration_seconds: result.breathHoldDurationSeconds,
        total_cycles_completed: result.totalCyclesCompleted,
        total_duration_seconds: result.totalDurationSeconds,
        consistency_score: result.consistencyScore,
        started_at: result.startedAt,
      });

      if (response.success) {
        toast.success("Breathing test saved!", {
          description: result.breathHoldDurationSeconds
            ? `You held your breath for ${result.breathHoldDurationSeconds.toFixed(1)} seconds`
            : `Completed ${result.totalCyclesCompleted} cycles`,
        });

        fetchData();
      }
    } catch (error) {
      console.error("Failed to save breathing test:", error);
      toast.error("Failed to save test", {
        description: "Please try again",
      });
    }
  };

  const handleDaysChange = (days: 7 | 14 | 30) => {
    setChartDays(days);
  };

  return (
    <DashboardLayout activeTab="wellbeing">
      <div className="min-h-screen">
        {/* Background gradient effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 lg:space-y-8"
          >
            {/* Back Button */}
            <motion.div variants={cardVariants}>
              <motion.button
                onClick={() => router.push("/wellbeing")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all group"
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Wellbeing</span>
              </motion.button>
            </motion.div>

            {/* Header */}
            <motion.div variants={cardVariants} className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-teal-600/20 to-emerald-600/20 blur-3xl rounded-full" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 shadow-xl shadow-cyan-500/30"
                >
                  <Wind className="w-8 h-8 text-white" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-cyan-100 to-teal-100 bg-clip-text text-transparent">
                      Breathing Test
                    </h1>
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                  </div>
                  <p className="text-slate-400 text-base sm:text-lg">
                    Improve your lung capacity with guided breathing exercises
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Main Content - Responsive Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
              {/* Left Column - Breathing Test */}
              <motion.div variants={cardVariants} className="xl:col-span-7">
                <div className="relative rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                  {/* Decorative elements */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 via-transparent to-teal-600/5" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                  <div className="relative p-5 sm:p-6 lg:p-8">
                    <BreathingTest onComplete={handleTestComplete} />
                  </div>
                </div>
              </motion.div>

              {/* Right Column - Stats & History */}
              <motion.div variants={cardVariants} className="xl:col-span-5 space-y-6">
                {/* Stats Summary Card */}
                {stats && stats.totalTests > 0 && (
                  <div className="relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-cyan-600/5" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

                    <div className="relative p-5">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white">{stats.totalTests}</div>
                          <div className="text-xs text-slate-500 mt-1">Total Tests</div>
                        </div>
                        <div className="text-center border-x border-slate-700/50">
                          <div className="text-3xl font-bold text-cyan-400">
                            {stats.bestBreathHoldSeconds.toFixed(0)}s
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Best Hold</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-emerald-400">
                            {stats.improvementPercentage > 0 ? "+" : ""}
                            {stats.improvementPercentage.toFixed(0)}%
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Improvement</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Card */}
                <div className="relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl shadow-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 via-transparent to-teal-600/5" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

                  <div className="relative p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <History className="w-4 h-4 text-cyan-400" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                    </div>
                    <BreathingHistory
                      tests={tests}
                      stats={stats}
                      isLoading={isLoading}
                      maxItems={4}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Analytics Section - Full Width */}
            <motion.div variants={cardVariants}>
              <div className="relative rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/5 via-transparent to-teal-600/5" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

                <div className="relative p-5 sm:p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Performance Analytics</h2>
                      <p className="text-xs text-slate-500">Track your breathing progress over time</p>
                    </div>
                  </div>
                  <BreathingChart
                    data={timeline}
                    isLoading={isLoading}
                    days={chartDays}
                    onDaysChange={handleDaysChange}
                    showHeader={false}
                  />
                </div>
              </div>
            </motion.div>

            {/* Tips Section */}
            <motion.div variants={cardVariants}>
              <div className="relative rounded-2xl border border-slate-700/30 bg-slate-800/30 backdrop-blur-sm p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Pro Tips
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-400">
                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-semibold">1.</span>
                    <span>Practice on an empty stomach for best results</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-semibold">2.</span>
                    <span>Sit or lie down in a comfortable position</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-cyan-400 font-semibold">3.</span>
                    <span>Stay consistent - practice daily for improvement</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function BreathingPageContent() {
  return (
    <Suspense fallback={<BreathingLoading />}>
      <BreathingContent />
    </Suspense>
  );
}
