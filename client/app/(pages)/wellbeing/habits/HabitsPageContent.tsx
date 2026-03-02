"use client";

import { Suspense } from "react";
import { Loader2, Target, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { HabitDashboard } from "@/app/(pages)/dashboard/components/wellbeing";

function HabitsLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
        <p className="text-slate-400">Loading habits...</p>
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

function HabitsContent() {
  const router = useRouter();

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

          {/* Header */}
          <motion.div
            variants={cardVariants}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 blur-3xl rounded-full" />
            <div className="relative flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/30"
              >
                <Target className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent">
                  Habit Tracking
                </h1>
                <p className="text-slate-400 mt-1 text-lg">
                  Build and track your daily habits
                </p>
              </div>
            </div>
          </motion.div>

          {/* Habit Dashboard */}
          <motion.div
            variants={cardVariants}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-teal-600/5 to-cyan-600/5" />
            <div className="relative p-6 sm:p-8">
              <HabitDashboard />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function HabitsPageContent() {
  return (
    <Suspense fallback={<HabitsLoading />}>
      <HabitsContent />
    </Suspense>
  );
}

