"use client";

import { Suspense } from "react";
import { Loader2, Heart, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { EmotionalCheckInFlow } from "@/app/(pages)/dashboard/components/emotional-checkin/EmotionalCheckInFlow";

function EmotionalCheckInLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
        <p className="text-slate-400">Loading emotional check-in...</p>
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
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

function EmotionalCheckInContent() {
  const router = useRouter();

  return (
    <DashboardLayout activeTab="wellbeing">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
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
            className="flex items-center justify-between relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-purple-600/20 to-pink-600/20 blur-3xl rounded-full" />
            <div className="relative flex items-center gap-4 flex-1">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-lg shadow-purple-500/30"
              >
                <Heart className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
                  Emotional Check-In
                </h1>
                <p className="text-slate-400 mt-1 text-lg">
                  A brief, supportive conversation to help you notice patterns
                </p>
              </div>
            </div>
          </motion.div>

          {/* Disclaimer */}
          <motion.div
            variants={cardVariants}
            className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-amber-900/20 backdrop-blur-xl p-4"
          >
            <p className="text-sm text-amber-200/80">
              <strong className="text-amber-200">Note:</strong> This is a wellbeing check-in, not a diagnosis. 
              This tool helps you notice patterns and offers supportive guidance.
            </p>
          </motion.div>

          {/* Check-In Flow */}
          <motion.div variants={cardVariants}>
            <EmotionalCheckInFlow />
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function EmotionalCheckInPage() {
  return (
    <Suspense fallback={<EmotionalCheckInLoading />}>
      <EmotionalCheckInContent />
    </Suspense>
  );
}

