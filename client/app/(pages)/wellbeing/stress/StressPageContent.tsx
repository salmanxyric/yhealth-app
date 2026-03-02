"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { Loader2, Activity, TrendingUp, Brain, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  StressCheckIn,
  StressCrisisBanner,
  StressEveningPrompt,
  StressAnalytics,
  EmotionAnalytics,
} from "@/app/(pages)/dashboard/components/wellbeing";
import { stressService, type StressLog, type StressSummary } from "@/src/shared/services/stress.service";

function StressLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
        <p className="text-slate-400">Loading stress data...</p>
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

function StressContent() {
  const [showStressCheckIn, setShowStressCheckIn] = useState(false);
  const [stressLogs, setStressLogs] = useState<StressLog[]>([]);
  const [stressSummary, setStressSummary] = useState<StressSummary[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const router = useRouter();

  const fetchStressData = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const today = new Date();
      const from = format(subDays(today, 13), "yyyy-MM-dd");
      const to = format(today, "yyyy-MM-dd");

      const [logsResult, summaryResult] = await Promise.all([
        stressService.getLogs(from, to),
        stressService.getSummary(from, to),
      ]);

      if (logsResult.success && logsResult.data) {
        setStressLogs(logsResult.data);
      }
      if (summaryResult.success && summaryResult.data) {
        setStressSummary(summaryResult.data);
      }
    } catch (error) {
      console.error("Failed to fetch stress data:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStressData();
  }, [fetchStressData]);

  const handleCheckInClose = (open: boolean) => {
    setShowStressCheckIn(open);
    if (!open) {
      fetchStressData();
    }
  };

  return (
    <DashboardLayout activeTab="wellbeing">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Back Button */}
          <motion.div variants={cardVariants}>
            <motion.button
              onClick={() => router.push("/wellbeing")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all group mb-4"
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Wellbeing</span>
            </motion.button>
          </motion.div>

          {/* Crisis Banner - Always show at top */}
          <motion.div variants={cardVariants}>
            <StressCrisisBanner />
          </motion.div>

          {/* Evening Prompt - Runs in background */}
          <motion.div variants={cardVariants}>
            <StressEveningPrompt />
          </motion.div>

          {/* Header */}
          <motion.div
            variants={cardVariants}
            className="flex items-center justify-between relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-red-600/20 to-rose-600/20 blur-3xl rounded-full" />
            <div className="relative flex items-center gap-4 flex-1">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 shadow-lg shadow-red-500/30"
              >
                <Activity className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-red-100 to-rose-100 bg-clip-text text-transparent">
                  Stress Management
                </h1>
                <p className="text-slate-400 mt-1 text-lg">
                  Multi-signal stress detection and management
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowStressCheckIn(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Activity className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">Log Stress</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={cardVariants}>
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-red-600/5 to-rose-600/5" />
                <div className="relative p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-semibold text-white">Stress Analytics</h2>
                  </div>
                  <StressAnalytics logs={stressLogs} summary={stressSummary} isLoading={analyticsLoading} onRefresh={fetchStressData} />
                </div>
              </div>
            </motion.div>
            <motion.div variants={cardVariants}>
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-red-600/5 to-rose-600/5" />
                <div className="relative p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Brain className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-semibold text-white">Emotional Wellbeing</h2>
                  </div>
                  <EmotionAnalytics days={14} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stress Check-In Modal */}
          <AnimatePresence>
            {showStressCheckIn && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={() => setShowStressCheckIn(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <StressCheckIn
                    open={showStressCheckIn}
                    onOpenChange={handleCheckInClose}
                    checkInType="on_demand"
                    initialMode="light"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function StressPageContent() {
  return (
    <Suspense fallback={<StressLoading />}>
      <StressContent />
    </Suspense>
  );
}

