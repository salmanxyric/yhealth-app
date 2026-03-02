"use client";

import { Suspense, useState } from "react";
import { Loader2, BookOpen, Flame, Sparkles, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  JournalEntryForm,
  JournalHistory,
  JournalStreaks,
  JournalPrompt,
} from "@/app/(pages)/dashboard/components/wellbeing";
import type { JournalPrompt as JournalPromptType } from "@/src/shared/services/wellbeing.service";

function JournalLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
        <p className="text-slate-400">Loading journal entries...</p>
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

function JournalContent() {
  const [showJournalEntry, setShowJournalEntry] = useState(false);
  const [selectedJournalPrompt, setSelectedJournalPrompt] = useState<JournalPromptType | null>(null);
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
            className="flex items-center justify-between relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-blue-600/20 to-indigo-600/20 blur-3xl rounded-full" />
            <div className="relative flex items-center gap-4 flex-1">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/30"
              >
                <BookOpen className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent">
                  Daily Journaling
                </h1>
                <p className="text-slate-400 mt-1 text-lg">
                  Reflect with guided prompts and AI personalization
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowJournalEntry(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <BookOpen className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">New Entry</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Journal History - Takes 2 columns */}
            <motion.div variants={cardVariants} className="lg:col-span-2">
              <JournalHistory limit={20} onRefresh={() => {}} />
            </motion.div>

            {/* Sidebar - Streaks and Prompts */}
            <div className="space-y-6">
              <motion.div variants={cardVariants}>
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-orange-600/5 to-red-600/5" />
                  <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Flame className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-semibold text-white">Streak</h3>
                    </div>
                    <JournalStreaks />
                  </div>
                </div>
              </motion.div>
              <motion.div variants={cardVariants}>
                <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-blue-600/5 to-indigo-600/5" />
                  <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-semibold text-white">Prompts</h3>
                    </div>
                    <JournalPrompt
                      onSelectPrompt={(prompt) => {
                        setSelectedJournalPrompt(prompt);
                        setShowJournalEntry(true);
                      }}
                      limit={5}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Journal Entry Modal with animation */}
          <AnimatePresence>
            {showJournalEntry && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={() => setShowJournalEntry(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-blue-600/10 to-indigo-600/10" />
                  <div className="relative p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">New Journal Entry</h3>
                    </div>
                    <JournalEntryForm
                      selectedPrompt={selectedJournalPrompt}
                      onSuccess={() => {
                        setShowJournalEntry(false);
                        setSelectedJournalPrompt(null);
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new Event('journal-logged'));
                        }
                      }}
                      onCancel={() => {
                        setShowJournalEntry(false);
                        setSelectedJournalPrompt(null);
                      }}
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

export default function JournalPageContent() {
  return (
    <Suspense fallback={<JournalLoading />}>
      <JournalContent />
    </Suspense>
  );
}

