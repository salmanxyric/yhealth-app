"use client";

import { Suspense, useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, ArrowLeft, Clock, Plus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layout";
import { ScheduleCalendar } from "@/app/(pages)/dashboard/components/wellbeing/schedule/ScheduleCalendar";
import { scheduleService, type DailySchedule, type CalendarSchedule } from "@/src/shared/services/schedule.service";
import { ApiError } from "@/lib/api-client";

function ScheduleLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto" />
        <p className="text-slate-400">Loading schedule calendar...</p>
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

function ScheduleContent() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<DailySchedule | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true); // Start with true to show loading
  const [_calendarSchedules, _setCalendarSchedules] = useState<CalendarSchedule[]>([]);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  // Load schedule on initial mount for selected date
  useEffect(() => {
    const loadInitialSchedule = async () => {
      if (hasLoadedInitial) return;
      
      setIsLoadingSchedule(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        // Force fresh fetch by adding timestamp to bypass any client-side caching
        const result = await scheduleService.getScheduleByDate(`${dateStr}?_t=${Date.now()}`);
        
        if (result.success && result.data) {
          setSelectedSchedule(result.data.schedule);
        } else {
          setSelectedSchedule(null);
        }
      } catch (err: unknown) {
        console.error("Failed to load schedule:", err);
        setSelectedSchedule(null);
      } finally {
        setIsLoadingSchedule(false);
        setHasLoadedInitial(true);
      }
    };

    loadInitialSchedule();
  }, [selectedDate, hasLoadedInitial]);

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setIsLoadingSchedule(true);
    
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      // Always fetch fresh data when date changes (bypass cache with timestamp)
      const result = await scheduleService.getScheduleByDate(`${dateStr}?_t=${Date.now()}`);
      
      if (result.success && result.data) {
        setSelectedSchedule(result.data.schedule);
      } else {
        setSelectedSchedule(null);
      }
    } catch (err: unknown) {
      console.error("Failed to load schedule:", err);
      // Silently fail - just show empty state
      setSelectedSchedule(null);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const handleCreateSchedule = async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    try {
      // First check if schedule already exists
      const existingResult = await scheduleService.getScheduleByDate(dateStr);
      if (existingResult.success && existingResult.data?.schedule) {
        // Schedule already exists, just load it
        setSelectedSchedule(existingResult.data.schedule);
        return;
      }

      // Create new schedule if it doesn't exist
      const result = await scheduleService.createSchedule({
        schedule_date: dateStr,
      });
      
      if (result.success && result.data) {
        setSelectedSchedule(result.data.schedule);
        // Refresh calendar
        window.location.reload();
      }
    } catch (err: unknown) {
      console.error("Failed to create schedule:", err);
      // If error is "already exists", try to load it
      const errorMessage = err instanceof ApiError || err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("already exists") || errorMessage.includes("Schedule already exists")) {
        try {
          const dateStr = format(selectedDate, "yyyy-MM-dd");
          const existingResult = await scheduleService.getScheduleByDate(dateStr);
          if (existingResult.success && existingResult.data?.schedule) {
            setSelectedSchedule(existingResult.data.schedule);
          }
        } catch (loadErr) {
          console.error("Failed to load existing schedule:", loadErr);
        }
      }
    }
  };

  const handleNavigateToEditor = () => {
    router.push(`/wellbeing/schedule/${format(selectedDate, "yyyy-MM-dd")}`);
  };

  return (
    <DashboardLayout activeTab="wellbeing">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
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
                <CalendarIcon className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent">
                  Daily Schedule
                </h1>
                <p className="text-slate-400 mt-1 text-lg">
                  Plan your day with time-based activities and links
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar Section */}
            <motion.div
              variants={cardVariants}
              className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl p-6 sm:p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-teal-600/5 to-cyan-600/5" />
              <div className="relative">
                <ScheduleCalendar onDateSelect={handleDateSelect} />
              </div>
            </motion.div>

            {/* Schedule Preview Section */}
            <motion.div
              variants={cardVariants}
              className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl p-6 sm:p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/5 via-teal-600/5 to-emerald-600/5" />
              <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Clock className="w-6 h-6 text-emerald-400" />
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                      {selectedSchedule ? `${selectedSchedule.items.length} activities` : "No schedule"}
                    </p>
                  </div>
                  <motion.button
                    onClick={handleNavigateToEditor}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium transition-all shadow-lg shadow-emerald-500/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {selectedSchedule ? "Edit" : "Create"}
                  </motion.button>
                </div>

                {/* Schedule Content */}
                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {isLoadingSchedule ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center h-64"
                      >
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                      </motion.div>
                    ) : selectedSchedule && selectedSchedule.items.length > 0 ? (
                      <motion.div
                        key="schedule"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-3"
                      >
                        {selectedSchedule.items
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 rounded-xl border border-emerald-500/20 bg-slate-800/50 hover:bg-slate-800/70 transition-all group"
                              style={{
                                borderLeftColor: item.color || "rgba(16, 185, 129, 0.5)",
                                borderLeftWidth: "4px",
                              }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {item.icon && <span className="text-lg">{item.icon}</span>}
                                    <h3 className="font-semibold text-white">{item.title}</h3>
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-slate-400 mb-2">{item.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {item.startTime}
                                      {item.endTime && ` - ${item.endTime}`}
                                    </span>
                                    {item.durationMinutes && (
                                      <span>{Math.round(item.durationMinutes / 60 * 10) / 10}h</span>
                                    )}
                                    {item.category && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                        {item.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center h-64 text-center"
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                          className="p-6 rounded-full bg-emerald-500/10 mb-4"
                        >
                          <Sparkles className="w-12 h-12 text-emerald-400" />
                        </motion.div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Schedule Yet</h3>
                        <p className="text-slate-400 text-sm mb-4 max-w-sm">
                          Create a schedule for this date to start planning your day
                        </p>
                        <motion.button
                          onClick={handleCreateSchedule}
                          className="px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium transition-all shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Plus className="w-4 h-4" />
                          Create Schedule
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleLoading />}>
      <ScheduleContent />
    </Suspense>
  );
}
