"use client";

import { Suspense, useState } from "react";
import { Loader2, Zap, TrendingUp, Sparkles, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  EnergyCheckIn,
  EnergyTimeline,
  EnergyPatterns,
} from "@/app/(pages)/dashboard/components/wellbeing";

function EnergyLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
        <p className="text-slate-400">Loading energy data...</p>
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

function EnergyContent() {
  const [showEnergyCheckIn, setShowEnergyCheckIn] = useState(false);
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

          {/* Header with animated gradient */}
          <motion.div
            variants={cardVariants}
            className="flex items-center justify-between relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-yellow-600/20 to-orange-600/20 blur-3xl rounded-full" />
            <div className="relative flex items-center gap-4 flex-1">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 shadow-lg shadow-yellow-500/30"
              >
                <Zap className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-yellow-100 to-orange-100 bg-clip-text text-transparent">
                  Energy Monitoring
                </h1>
                <p className="text-slate-400 mt-1 text-lg">
                  Track your energy levels throughout the day
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowEnergyCheckIn(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Zap className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">Log Energy</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Timeline Card */}
          <motion.div
            variants={cardVariants}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-yellow-600/5 to-orange-600/5" />
            <div className="relative p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">Energy Timeline</h2>
              </div>
              <EnergyTimeline days={30} />
            </div>
          </motion.div>

          {/* Patterns Card */}
          <motion.div
            variants={cardVariants}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-yellow-600/5 to-orange-600/5" />
            <div className="relative p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">Energy Patterns</h2>
              </div>
              <EnergyPatterns days={30} />
            </div>
          </motion.div>

          {/* Energy Check-In Modal with animation */}
          <AnimatePresence>
            {showEnergyCheckIn && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={() => setShowEnergyCheckIn(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 max-w-md w-full"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-yellow-600/10 to-orange-600/10" />
                  <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">Log Energy</h3>
                    </div>
                    <EnergyCheckIn
                      onSuccess={() => {
                        setShowEnergyCheckIn(false);
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new Event('energy-logged'));
                        }
                      }}
                      onCancel={() => setShowEnergyCheckIn(false)}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function EnergyPage() {
  return (
    <Suspense fallback={<EnergyLoading />}>
      <EnergyContent />
    </Suspense>
  );
}

