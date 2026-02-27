"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MoodCheckIn,
  EnergyCheckIn,
  JournalEntryForm,
  JournalPrompt,
  JournalHistory,
  JournalStreaks,
  HabitDashboard,
  MoodTimeline,
  MoodPatterns,
  EnergyTimeline,
  EnergyPatterns,
  StressCheckIn,
  StressCrisisBanner,
  StressEveningPrompt,
  StressAnalytics,
  EmotionAnalytics,
} from "../wellbeing";
import {
  Smile,
  Zap,
  BookOpen,
} from "lucide-react";
import type { JournalPrompt as JournalPromptType } from "@/src/shared/services/wellbeing.service";

export function WellbeingTab() {
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false);
  const [showEnergyCheckIn, setShowEnergyCheckIn] = useState(false);
  const [showJournalEntry, setShowJournalEntry] = useState(false);
  const [showStressCheckIn, setShowStressCheckIn] = useState(false);
  const [selectedJournalPrompt, setSelectedJournalPrompt] = useState<JournalPromptType | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Crisis Banner - Always show at top */}
      <StressCrisisBanner />

      {/* Evening Prompt - Runs in background */}
      <StressEveningPrompt />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent">
            Wellbeing
          </h2>
          <p className="text-slate-400 mt-1">
            Track your mood, energy, journaling, habits, and more
          </p>
        </div>
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              onClick={() => setShowMoodCheckIn(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all duration-300"
            >
              <Smile className="w-4 h-4 mr-2" />
              Mood
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              onClick={() => setShowEnergyCheckIn(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all duration-300"
            >
              <Zap className="w-4 h-4 mr-2" />
              Energy
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1.5 backdrop-blur-sm">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 rounded-lg transition-all duration-300"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="mood" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 rounded-lg transition-all duration-300"
          >
            Mood
          </TabsTrigger>
          <TabsTrigger 
            value="energy" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 rounded-lg transition-all duration-300"
          >
            Energy
          </TabsTrigger>
          <TabsTrigger 
            value="journal" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 rounded-lg transition-all duration-300"
          >
            Journal
          </TabsTrigger>
          <TabsTrigger 
            value="habits" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30 rounded-lg transition-all duration-300"
          >
            Habits
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-purple-600/5 to-pink-600/5" />
              <div className="relative p-6">
                <MoodTimeline days={7} />
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-yellow-600/5 to-orange-600/5" />
              <div className="relative p-6">
                <EnergyTimeline days={7} />
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-orange-600/5 to-red-600/5" />
              <div className="relative p-6">
                <JournalStreaks />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-red-600/5 to-rose-600/5" />
              <div className="relative p-6">
                <StressAnalytics logs={[]} summary={[]} isLoading={false} onRefresh={() => {}} />
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-pink-600/5 to-rose-600/5" />
              <div className="relative p-6">
                <EmotionAnalytics days={14} />
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Mood Tab */}
        <TabsContent value="mood" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowMoodCheckIn(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all duration-300"
              >
                <Smile className="w-4 h-4 mr-2" />
                Log Mood
              </Button>
            </motion.div>
          </div>
          <MoodTimeline days={30} />
          <MoodPatterns days={30} />
        </TabsContent>

        {/* Energy Tab */}
        <TabsContent value="energy" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowEnergyCheckIn(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all duration-300"
              >
                <Zap className="w-4 h-4 mr-2" />
                Log Energy
              </Button>
            </motion.div>
          </div>
          <EnergyTimeline days={30} />
          <EnergyPatterns days={30} />
        </TabsContent>

        {/* Journal Tab */}
        <TabsContent value="journal" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowJournalEntry(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all duration-300"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                New Entry
              </Button>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <JournalHistory limit={10} />
            </div>
            <div className="space-y-6">
              <JournalStreaks />
              <JournalPrompt
                onSelectPrompt={(prompt) => {
                  setSelectedJournalPrompt(prompt);
                  setShowJournalEntry(true);
                }}
                limit={3}
              />
            </div>
          </div>
        </TabsContent>

        {/* Habits Tab */}
        <TabsContent value="habits" className="space-y-6 mt-6">
          <HabitDashboard />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <MoodCheckIn
        open={showMoodCheckIn}
        onOpenChange={setShowMoodCheckIn}
        initialMode="light"
      />

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
                  onSuccess={() => setShowEnergyCheckIn(false)}
                  onCancel={() => setShowEnergyCheckIn(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journal Entry Modal */}
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

      <StressCheckIn
        open={showStressCheckIn}
        onOpenChange={setShowStressCheckIn}
        checkInType="on_demand"
        initialMode="light"
      />
    </div>
  );
}
