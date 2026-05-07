"use client";

/**
 * @file JournalHubPage Component
 * @description Journal page with constellation (default) and list view modes.
 * The constellation view shows an immersive mind-map visualization.
 * The list view preserves the traditional entries/dashboard/goals tabs.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Plus,
  LayoutDashboard,
  Target,
  FileText,
  Sun,
  Stars,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  JournalHistory,
  JournalStreaks,
} from "@/app/(pages)/dashboard/components/wellbeing";
import { JournalingModeSelector } from "@/components/journal/JournalingModeSelector";
import { DistractionFreeEditor } from "@/components/journal/DistractionFreeEditor";
import { DailyCheckinFlow } from "@/components/journal/DailyCheckinFlow";
import { MindConstellation } from "@/components/journal/constellation/MindConstellation";
import {
  dailyCheckinService,
  journalService,
} from "@/src/shared/services/wellbeing.service";
import type { JournalingMode, JournalEntry } from "@shared/types/domain/wellbeing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = "constellation" | "list";
type HubTab = "entries" | "dashboard" | "goals";
type NewEntryStep = "select_mode" | "write";

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

// ---------------------------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------------------------

function JournalHubLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
        <p className="text-slate-400">Loading journal hub...</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placeholder cards for upcoming tabs
// ---------------------------------------------------------------------------

function PlaceholderCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-800/60 to-slate-900/90 backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-blue-600/5 to-indigo-600/5" />
      <div className="relative flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
          <Icon className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 max-w-sm">{description}</p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main content component
// ---------------------------------------------------------------------------

function JournalHubContent() {
  const router = useRouter();

  // View mode: constellation (default) or list
  const [viewMode, setViewMode] = useState<ViewMode>("constellation");

  // Tab state (for list view)
  const [activeTab, setActiveTab] = useState<HubTab>("entries");

  // Daily check-in state
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(true);
  const [showCheckin, setShowCheckin] = useState(false);

  // New entry flow state
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryStep, setNewEntryStep] = useState<NewEntryStep>("select_mode");
  const [selectedMode, setSelectedMode] = useState<JournalingMode | null>(null);
  const [editorText, setEditorText] = useState("");
  const [editorHtml, setEditorHtml] = useState("");
  const [editorJson, setEditorJson] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Editing existing entry state
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch today's check-in status on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    async function fetchCheckinStatus() {
      try {
        const result = await dailyCheckinService.getToday();
        if (!cancelled && result.success && result.data) {
          setHasCheckedInToday(result.data.hasCheckedIn);
        }
      } catch {
        // Silently handle
      } finally {
        if (!cancelled) setCheckinLoading(false);
      }
    }
    fetchCheckinStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // New entry flow handlers
  // ---------------------------------------------------------------------------
  const handleOpenNewEntry = useCallback(() => {
    setShowNewEntry(true);
    setNewEntryStep("select_mode");
    setSelectedMode(null);
    setEditorText("");
    setEditorHtml("");
    setEditorJson(null);
    setEntryDate(new Date().toISOString().split("T")[0]);
  }, []);

  const handleSelectMode = useCallback((mode: JournalingMode) => {
    setSelectedMode(mode);
    setNewEntryStep("write");
  }, []);

  const handleCloseNewEntry = useCallback(() => {
    setShowNewEntry(false);
    setNewEntryStep("select_mode");
    setSelectedMode(null);
    setEditorText("");
    setEditorHtml("");
    setEditorJson(null);
    setEditingEntry(null);
  }, []);

  const handleSubmitEntry = useCallback(async () => {
    if (!editorText.trim() || !selectedMode) return;

    setIsSubmitting(true);
    try {
      // Build logged_at from selected date (use noon to avoid timezone issues)
      const today = new Date().toISOString().split("T")[0];
      const logged_at = entryDate !== today
        ? `${entryDate}T12:00:00.000Z`
        : undefined;

      const result = await journalService.createEntry({
        prompt: "Free reflection",
        entry_text: editorText.trim(),
        content_html: editorHtml || undefined,
        content_json: editorJson || undefined,
        mode: "deep",
        journaling_mode: selectedMode,
        ...(logged_at ? { logged_at } : {}),
      });

      if (result.success) {
        handleCloseNewEntry();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("journal-logged"));
        }
      }
    } catch {
      // Error handling — user stays in the editor
    } finally {
      setIsSubmitting(false);
    }
  }, [editorText, editorHtml, editorJson, selectedMode, entryDate, handleCloseNewEntry]);

  // ---------------------------------------------------------------------------
  // Edit entry handlers
  // ---------------------------------------------------------------------------
  const handleEditEntry = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setSelectedMode(entry.journalingMode || "free_write");
    setEditorText(entry.contentHtml || entry.entryText);
    setEditorHtml(entry.contentHtml || "");
    setEditorJson(entry.contentJson || null);
    setEntryDate(entry.loggedAt.split("T")[0]);
    setShowNewEntry(true);
    setNewEntryStep("write");
  }, []);

  const handleSubmitEdit = useCallback(async () => {
    if (!editorText.trim() || !editingEntry) return;

    setIsSubmitting(true);
    try {
      const result = await journalService.updateEntry(editingEntry.id, {
        entry_text: editorText.trim(),
        content_html: editorHtml || undefined,
        content_json: editorJson || undefined,
      });

      if (result.success) {
        setEditingEntry(null);
        handleCloseNewEntry();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("journal-logged"));
        }
      }
    } catch {
      // Error handling — user stays in the editor
    } finally {
      setIsSubmitting(false);
    }
  }, [editorText, editorHtml, editorJson, editingEntry, handleCloseNewEntry]);

  // ---------------------------------------------------------------------------
  // Check-in flow handlers
  // ---------------------------------------------------------------------------
  const handleStartCheckin = useCallback(() => {
    setShowCheckin(true);
  }, []);

  const handleCheckinComplete = useCallback(() => {
    setHasCheckedInToday(true);
    setShowCheckin(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <DashboardLayout activeTab="wellbeing">
      {/* ================================================================= */}
      {/* CONSTELLATION VIEW (default)                                       */}
      {/* ================================================================= */}
      {viewMode === "constellation" && (
        <MindConstellation
          onOpenNewEntry={handleOpenNewEntry}
          onSwitchToList={() => setViewMode("list")}
          onEditEntry={handleEditEntry}
        />
      )}

      {/* ================================================================= */}
      {/* LIST VIEW                                                          */}
      {/* ================================================================= */}
      {viewMode === "list" && (
        <div className="max-w-8xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Top bar with back + constellation toggle */}
            <motion.div variants={cardVariants} className="flex items-center justify-between">
              <motion.button
                onClick={() => router.push("/wellbeing")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all group"
                whileHover={{ x: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Wellbeing</span>
              </motion.button>

              <motion.button
                onClick={() => setViewMode("constellation")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Stars className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Constellation</span>
              </motion.button>
            </motion.div>

            {/* Header */}
            <motion.div
              variants={cardVariants}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden rounded-2xl"
            >
              <div className="relative flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/30"
                >
                  <BookOpen className="w-8 h-8 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent">
                    Wellness Journal
                  </h1>
                  <p className="text-slate-400 mt-1 text-base sm:text-lg">
                    Reflect, grow, and track your inner world
                  </p>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
                <Button
                  onClick={handleOpenNewEntry}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/30 transition-all duration-300 relative overflow-hidden group gap-2"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Plus className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">New Entry</span>
                </Button>
              </motion.div>
            </motion.div>

            {/* Daily check-in banner */}
            {!checkinLoading && !hasCheckedInToday && (
              <motion.div
                variants={cardVariants}
                className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 backdrop-blur-xl"
              >
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                      <Sun className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Start your daily check-in</h3>
                      <p className="text-sm text-slate-400 mt-0.5">A quick reflection to set the tone for your day</p>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleStartCheckin}
                      variant="outline"
                      className="border-amber-500/30 text-amber-400 hover:bg-amber-600/20 whitespace-nowrap"
                    >
                      Start Check-in
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Tab navigation */}
            <motion.div variants={cardVariants}>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as HubTab)}
                className="w-full"
              >
                <TabsList className="bg-slate-800/60 border border-white/10 w-full sm:w-auto">
                  <TabsTrigger
                    value="entries"
                    className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    Entries
                  </TabsTrigger>
                  <TabsTrigger
                    value="dashboard"
                    className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 gap-1.5"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="goals"
                    className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 gap-1.5"
                  >
                    <Target className="w-4 h-4" />
                    Goals
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="entries" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <JournalHistory limit={20} onRefresh={() => {}} />
                    </div>
                    <div className="space-y-6">
                      <JournalStreaks />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="dashboard" className="mt-6">
                  <PlaceholderCard
                    title="Emotional Dashboard"
                    description="Visualize your emotional patterns, sentiment trends, and journaling insights over time. Coming soon."
                    icon={LayoutDashboard}
                  />
                </TabsContent>

                <TabsContent value="goals" className="mt-6">
                  <PlaceholderCard
                    title="Life Goals"
                    description="Set meaningful goals, track them through your journal entries, and watch your progress unfold. Coming soon."
                    icon={Target}
                  />
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* ================================================================= */}
      {/* OVERLAYS (shared between both views)                               */}
      {/* ================================================================= */}

      {/* Daily Check-in overlay */}
      <AnimatePresence>
        {showCheckin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCheckin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-yellow-600/10" />
              <div className="relative">
                <DailyCheckinFlow
                  onComplete={(checkinId) => {
                    handleCheckinComplete();
                    void checkinId;
                  }}
                  onContinueToJournal={() => {
                    handleCheckinComplete();
                    handleOpenNewEntry();
                  }}
                  onClose={() => setShowCheckin(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Entry mode selector */}
      <AnimatePresence>
        {showNewEntry && newEntryStep === "select_mode" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={handleCloseNewEntry}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 backdrop-blur-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Ambient background glow */}
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/6 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <div className="relative p-7 sm:p-9">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">New Journal Entry</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Choose how you want to write today</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseNewEntry}
                    aria-label="Close"
                    className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all duration-200"
                  >
                    <span className="sr-only">Close</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
                <JournalingModeSelector onSelect={handleSelectMode} selectedMode={selectedMode} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distraction-free editor */}
      <AnimatePresence>
        {showNewEntry && newEntryStep === "write" && selectedMode && (
          <DistractionFreeEditor
            mode={selectedMode}
            value={editorText}
            onChange={setEditorText}
            onContentChange={(html, text, json) => {
              setEditorHtml(html);
              setEditorText(text);
              setEditorJson(json);
            }}
            onClose={handleCloseNewEntry}
            onSubmit={editingEntry ? handleSubmitEdit : handleSubmitEntry}
            isSubmitting={isSubmitting}
            entryDate={entryDate}
            onDateChange={!editingEntry ? setEntryDate : undefined}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// Exported page component with Suspense boundary
// ---------------------------------------------------------------------------

export default function JournalHubPage() {
  return (
    <Suspense fallback={<JournalHubLoading />}>
      <JournalHubContent />
    </Suspense>
  );
}
