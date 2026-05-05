"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2,
  Calendar as CalendarIcon,
  ArrowLeft,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Timer,
  
  Tag,
  MoreHorizontal,
  Pencil,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Trash2,
  Workflow,
  Bell,
  BellRing,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameDay,
  
  
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  
} from "date-fns";
import { DashboardLayout } from "@/components/layout";
import {
  scheduleService,
  type DailySchedule,
  type ScheduleItem,
  type CalendarSchedule,
} from "@/src/shared/services/schedule.service";
import { calendarApiService, type DayContext } from "@/src/shared/services/calendar.service";
import { ActivityFormModal } from "@/app/(pages)/dashboard/components/wellbeing/schedule/ActivityFormModal";
import { ConfirmModal } from "@/app/(pages)/dashboard/components/wellbeing/schedule/ConfirmModal";
import { ActivityDetailsDrawer, type DrawerItem } from "@/app/(pages)/dashboard/components/wellbeing/schedule/ActivityDetailsDrawer";
import { ApiError } from "@/lib/api-client";
import { dataSourceService, type PrayerScheduleItem, type DailyCorrelation } from "@/src/shared/services/data-source.service";

// ============================================
// CONSTANTS
// ============================================

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  work: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-400" },
  prayer: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30", dot: "bg-violet-400" },
  meal: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-400" },
  exercise: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400" },
  health: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", dot: "bg-rose-400" },
  personal: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30", dot: "bg-cyan-400" },
  social: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30", dot: "bg-pink-400" },
  learning: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30", dot: "bg-indigo-400" },
  default: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", dot: "bg-slate-400" },
};

function getCategoryStyle(category?: string) {
  if (!category) return CATEGORY_COLORS.default;
  return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.default;
}

function getTimeOfDayIcon(time: string) {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour >= 5 && hour < 12) return <Sunrise className="w-3.5 h-3.5" />;
  if (hour >= 12 && hour < 17) return <Sun className="w-3.5 h-3.5" />;
  if (hour >= 17 && hour < 21) return <Sunset className="w-3.5 h-3.5" />;
  return <Moon className="w-3.5 h-3.5" />;
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function getDuration(startTime: string, endTime?: string, durationMinutes?: number) {
  if (durationMinutes) {
    if (durationMinutes >= 60) {
      const h = Math.floor(durationMinutes / 60);
      const m = durationMinutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${durationMinutes}m`;
  }
  if (startTime && endTime) {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff > 0) {
      if (diff >= 60) {
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
      }
      return `${diff}m`;
    }
  }
  return null;
}

// ============================================
// LOADING
// ============================================

function ScheduleLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
      <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
    </div>
  );
}

// ============================================
// MINI CALENDAR
// ============================================

function MiniCalendar({
  selectedDate,
  onDateSelect,
  scheduleDates,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  scheduleDates: Set<string>;
}) {
  const [viewMonth, setViewMonth] = useState(selectedDate);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="select-none">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-[10px] font-medium text-slate-500 uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasSchedule = scheduleDates.has(format(day, "yyyy-MM-dd"));

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                onDateSelect(day);
                if (day.getMonth() !== viewMonth.getMonth()) {
                  setViewMonth(day);
                }
              }}
              className={`
                relative h-9 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all
                ${!isCurrentMonth ? "text-slate-600" : "text-slate-300 hover:text-white"}
                ${isSelected ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" : "hover:bg-white/5"}
                ${isTodayDate && !isSelected ? "text-emerald-400 font-bold" : ""}
              `}
            >
              {day.getDate()}
              {hasSchedule && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// TIMELINE ITEM
// ============================================

function TimelineItem({ item, index, onEdit, onDelete, onOpen }: { item: ScheduleItem; index: number; onEdit?: (item: ScheduleItem) => void; onDelete?: (itemId: string) => void; onOpen?: (item: ScheduleItem) => void }) {
  const style = getCategoryStyle(item.category);
  const duration = getDuration(item.startTime, item.endTime, item.durationMinutes);
  const [menuOpen, setMenuOpen] = useState(false);
  const [alarmState, setAlarmState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Add an alarm that fires on every day of the week at the activity's start
  // time. We keep it light: no modal, one tap → alarm created. Users manage
  // them (edit / delete) in the regular alarms widget.
  const handleAddAlarm = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!item.startTime) return;
      if (alarmState === "saving" || alarmState === "saved") return;
      setAlarmState("saving");
      try {
        const normalizedTime = item.startTime
          .split(":")
          .slice(0, 2)
          .map((p) => p.padStart(2, "0"))
          .join(":");
        const res = await api.post("/alarms", {
          title: item.title || "Activity reminder",
          alarmTime: normalizedTime,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          soundEnabled: true,
          soundFile: "alarm.wav",
        });
        setAlarmState(res?.success ? "saved" : "error");
      } catch {
        setAlarmState("error");
      } finally {
        // Bounce back to idle after a moment unless we successfully saved.
        setTimeout(() => {
          setAlarmState((prev) => (prev === "error" ? "idle" : prev));
        }, 2500);
      }
    },
    [item.startTime, item.title, alarmState]
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex gap-4"
    >
      {/* Timeline Line + Dot */}
      <div className="flex flex-col items-center pt-2">
        <div className={`w-2 h-2 rounded-full ${style.dot} ring-2 ring-slate-900 z-10 shrink-0`} />
        <div className="w-px flex-1 bg-slate-700/40 min-h-[16px]" />
      </div>

      {/* Card */}
      <div
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onClick={onOpen ? () => onOpen(item) : undefined}
        onKeyDown={
          onOpen
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(item);
                }
              }
            : undefined
        }
        className={`flex-1 mb-3 p-4 rounded-xl border ${style.border} bg-slate-800/40 hover:bg-slate-800/60 transition-all duration-200 group-hover:border-opacity-60 ${onOpen ? "cursor-pointer" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center gap-2 mb-1.5">
              {item.icon && <span className="text-base shrink-0">{item.icon}</span>}
              <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-xs text-slate-400 mb-2.5 line-clamp-2 leading-relaxed">{item.description}</p>
            )}

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                {getTimeOfDayIcon(item.startTime)}
                <span className="font-medium">
                  {formatTime(item.startTime)}
                  {item.endTime && ` - ${formatTime(item.endTime)}`}
                </span>
              </div>
              {duration && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Timer className="w-3 h-3" />
                  <span>{duration}</span>
                </div>
              )}
              {item.category && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${style.bg} ${style.text}`}>
                  <Tag className="w-2.5 h-2.5" />
                  {item.category}
                </span>
              )}
            </div>
          </div>

          {/* Action cluster: Add Alarm + 3-dot menu */}
          <div className="relative shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleAddAlarm}
              disabled={alarmState === "saving" || alarmState === "saved"}
              aria-label={
                alarmState === "saved"
                  ? "Alarm added"
                  : alarmState === "saving"
                    ? "Adding alarm"
                    : `Add alarm at ${formatTime(item.startTime)}`
              }
              title={
                alarmState === "saved"
                  ? "Alarm added"
                  : `Add alarm at ${formatTime(item.startTime)}`
              }
              className={`p-1.5 rounded-lg transition-all
                ${alarmState === "saved"
                  ? "opacity-100 bg-emerald-500/15 text-emerald-300"
                  : alarmState === "error"
                    ? "opacity-100 bg-rose-500/15 text-rose-300"
                    : "opacity-0 group-hover:opacity-100 hover:bg-white/5 text-slate-500 hover:text-emerald-300"
                }
                disabled:cursor-not-allowed`}
            >
              {alarmState === "saving" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : alarmState === "saved" ? (
                <BellRing className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-8 z-50 w-36 rounded-xl border border-white/[0.08] py-1 shadow-xl"
                    style={{ background: '#14151f' }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit?.(item); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Activity
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete?.(item.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// DAY STRIP (Week Navigation)
// ============================================

function DayStrip({
  selectedDate,
  onDateSelect,
  scheduleDates,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  scheduleDates: Set<string>;
}) {
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <button
        onClick={() => onDateSelect(subDays(selectedDate, 7))}
        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const hasSchedule = scheduleDates.has(format(day, "yyyy-MM-dd"));

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                relative flex flex-col items-center py-2 px-1 rounded-xl transition-all
                ${isSelected
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : isTodayDate
                    ? "bg-white/5 text-emerald-400"
                    : "hover:bg-white/5 text-slate-400 hover:text-white"
                }
              `}
            >
              <span className="text-[10px] uppercase font-medium tracking-wider opacity-70">
                {format(day, "EEE")}
              </span>
              <span className={`text-lg font-bold mt-0.5 ${isSelected ? "text-white" : ""}`}>
                {format(day, "d")}
              </span>
              {hasSchedule && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onDateSelect(addDays(selectedDate, 7))}
        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function _EmptySchedule({ onCreateSchedule }: { onCreateSchedule: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center mb-4 border border-slate-600/50">
        <CalendarIcon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">No activities scheduled</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        Start planning your day by adding activities and tasks
      </p>
      <button
        onClick={onCreateSchedule}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-500/20"
      >
        <Plus className="w-4 h-4" />
        Create Schedule
      </button>
    </motion.div>
  );
}

// ============================================
// STATS BAR
// ============================================

function StatsBar({ items }: { items: ScheduleItem[] }) {
  const totalMinutes = items.reduce((acc, item) => {
    if (item.durationMinutes) return acc + item.durationMinutes;
    if (item.startTime && item.endTime) {
      const [sh, sm] = item.startTime.split(":").map(Number);
      const [eh, em] = item.endTime.split(":").map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return diff > 0 ? acc + diff : acc;
    }
    return acc;
  }, 0);

  const categories = new Set(items.map((i) => i.category).filter(Boolean));

  const stats = [
    { label: "Activities", value: items.length.toString() },
    { label: "Total Time", value: totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m` },
    { label: "Categories", value: categories.size.toString() },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center py-3 px-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="text-xl font-bold text-white">{stat.value}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// MAIN CONTENT
// ============================================

function ScheduleContent() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<DailySchedule | null>(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [calendarSchedules, setCalendarSchedules] = useState<CalendarSchedule[]>([]);
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dayContext, setDayContext] = useState<DayContext | null>(null);
  const [editingActivity, setEditingActivity] = useState<ScheduleItem | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<Array<{ id: string; title: string; startTime: string; endTime: string; allDay: boolean; location: string | null }>>([]);
  const [prayers, setPrayers] = useState<PrayerScheduleItem[]>([]);
  const [dailyCorrelation, setDailyCorrelation] = useState<DailyCorrelation | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);
  const [drawerItem, setDrawerItem] = useState<DrawerItem | null>(null);

  const scheduleDates = useMemo(() => {
    const set = new Set<string>();
    calendarSchedules.forEach((s) => {
      if (s.hasSchedule) set.add(s.date);
    });
    return set;
  }, [calendarSchedules]);

  const loadSchedule = useCallback(async (date: Date) => {
    setIsLoadingSchedule(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const [result, ctxResult, eventsResult] = await Promise.all([
        scheduleService.getScheduleByDate(`${dateStr}?_t=${Date.now()}`),
        calendarApiService.getScheduleContext(dateStr).catch(() => null),
        calendarApiService.getCalendarEvents(dateStr, dateStr).catch(() => null),
      ]);
      if (result.success && result.data) {
        setSelectedSchedule(result.data.schedule);
      } else {
        setSelectedSchedule(null);
      }
      if (ctxResult?.success && ctxResult.data) {
        setDayContext(ctxResult.data);
      } else {
        setDayContext(null);
      }
      if (eventsResult?.success && eventsResult.data?.events) {
        setGoogleEvents(eventsResult.data.events);
      } else {
        setGoogleEvents([]);
      }
      try {
        const [prayerData, corrData] = await Promise.all([
          dataSourceService.getPrayerSchedule(dateStr).catch(() => []),
          dataSourceService.getDailyCorrelation(dateStr).catch(() => null),
        ]);
        setPrayers(prayerData);
        setDailyCorrelation(corrData);
      } catch { /* graceful degradation */ }
    } catch {
      setSelectedSchedule(null);
      setDayContext(null);
      setGoogleEvents([]);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, []);

  const loadCalendarSchedules = useCallback(async (date: Date) => {
    try {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const result = await scheduleService.getCalendarSchedules(
        format(monthStart, "yyyy-MM-dd"),
        format(monthEnd, "yyyy-MM-dd")
      );
      if (result.success && result.data) {
        setCalendarSchedules(result.data.schedules);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    loadSchedule(selectedDate);
    loadCalendarSchedules(selectedDate);
  }, [selectedDate, loadSchedule, loadCalendarSchedules]);

  // Auto-sync Google Calendar: pull the latest events from Google on mount and
  // every 60s while the page is visible, then re-read the selected day so new
  // events added in Google Calendar appear here without a manual refresh.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const runSync = async () => {
      try {
        const res = await calendarApiService.syncCalendar();
        if (cancelled) return;
        if (res?.success) {
          // Re-read the current day's events from the synced store.
          loadSchedule(selectedDate);
        }
      } catch {
        /* user not connected or transient error — silent */
      }
    };

    runSync();
    timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      runSync();
    }, 60_000);

    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") runSync();
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisible);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisible);
      }
    };
  }, [selectedDate, loadSchedule]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);

  const ensureSchedule = useCallback(async (): Promise<DailySchedule | null> => {
    if (selectedSchedule) return selectedSchedule;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setIsCreatingSchedule(true);
    try {
      const existingResult = await scheduleService.getScheduleByDate(dateStr);
      if (existingResult.success && existingResult.data?.schedule) {
        setSelectedSchedule(existingResult.data.schedule);
        return existingResult.data.schedule;
      }
      const result = await scheduleService.createSchedule({ schedule_date: dateStr });
      if (result.success && result.data) {
        setSelectedSchedule(result.data.schedule);
        loadCalendarSchedules(selectedDate);
        return result.data.schedule;
      }
      return null;
    } catch (err: unknown) {
      const errorMessage = err instanceof ApiError || err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("already exists")) {
        try {
          const existingResult = await scheduleService.getScheduleByDate(dateStr);
          if (existingResult.success && existingResult.data?.schedule) {
            setSelectedSchedule(existingResult.data.schedule);
            return existingResult.data.schedule;
          }
        } catch { /* silent */ }
      }
      return null;
    } finally {
      setIsCreatingSchedule(false);
    }
  }, [selectedDate, selectedSchedule, loadCalendarSchedules]);

  const handleAddActivity = useCallback(async () => {
    setEditingActivity(null);
    await ensureSchedule();
    setShowActivityModal(true);
  }, [ensureSchedule]);

  // ── Activity Modal (Edit/Create) ──
  const handleEditActivity = useCallback((item: ScheduleItem) => {
    setEditingActivity(item);
    setShowActivityModal(true);
  }, []);

  // Confirmation modal state (activity vs schedule deletion)
  const [confirmState, setConfirmState] = useState<
    | { kind: "activity"; itemId: string }
    | { kind: "schedule" }
    | null
  >(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

  const handleDeleteActivity = useCallback((itemId: string) => {
    setConfirmState({ kind: "activity", itemId });
  }, []);

  const handleDeleteSchedule = useCallback(() => {
    if (!selectedSchedule) return;
    setConfirmState({ kind: "schedule" });
  }, [selectedSchedule]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmState) return;
    if (confirmState.kind === "activity") {
      setIsDeletingActivity(true);
      try {
        await scheduleService.deleteScheduleItem(confirmState.itemId);
        await loadSchedule(selectedDate);
      } catch (err) {
        console.error("Failed to delete activity:", err);
      } finally {
        setIsDeletingActivity(false);
        setConfirmState(null);
      }
    } else {
      if (!selectedSchedule) return;
      setIsDeletingSchedule(true);
      try {
        await scheduleService.deleteSchedule(selectedSchedule.id);
        setSelectedSchedule(null);
        loadCalendarSchedules(selectedDate);
      } catch (err) {
        console.error("Failed to delete schedule:", err);
      } finally {
        setIsDeletingSchedule(false);
        setConfirmState(null);
      }
    }
  }, [confirmState, selectedSchedule, selectedDate, loadSchedule, loadCalendarSchedules]);

  const sortedItems = useMemo(() => {
    if (!selectedSchedule?.items) return [];
    return [...selectedSchedule.items].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedSchedule]);

  // Group items by time-of-day
  const groupedItems = useMemo(() => {
    const groups: { label: string; icon: React.ReactNode; items: ScheduleItem[] }[] = [
      { label: "Morning", icon: <Sunrise className="w-4 h-4 text-amber-400" />, items: [] },
      { label: "Afternoon", icon: <Sun className="w-4 h-4 text-orange-400" />, items: [] },
      { label: "Evening", icon: <Sunset className="w-4 h-4 text-rose-400" />, items: [] },
      { label: "Night", icon: <Moon className="w-4 h-4 text-indigo-400" />, items: [] },
    ];

    sortedItems.forEach((item) => {
      const hour = parseInt(item.startTime.split(":")[0], 10);
      if (hour >= 5 && hour < 12) groups[0].items.push(item);
      else if (hour >= 12 && hour < 17) groups[1].items.push(item);
      else if (hour >= 17 && hour < 21) groups[2].items.push(item);
      else groups[3].items.push(item);
    });

    return groups.filter((g) => g.items.length > 0);
  }, [sortedItems]);

  return (
    <DashboardLayout activeTab="wellbeing">
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-[#0a0a0f]">
        {/* Hero Header — full width, modern */}
        <div className="shrink-0 relative overflow-hidden border-b border-white/[0.06]">
          {/* Ambient gradient */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at top left, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(ellipse at top right, rgba(59,130,246,0.05) 0%, transparent 50%), linear-gradient(180deg, #0a0a0f 0%, rgba(10,10,15,0.95) 100%)'
          }} />

          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Row 1: Header */}
            <div className="flex items-center justify-between gap-3 py-4 sm:py-5">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => router.push("/wellbeing")}
                  className="shrink-0 p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  aria-label="Back to Wellbeing"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-emerald-200/90 bg-clip-text text-transparent">
                      Schedule
                    </h1>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                      {format(selectedDate, "MMM d")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                    Plan your day with time-based activities
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Today Button */}
                {!isToday(selectedDate) && (
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors"
                  >
                    Today
                  </button>
                )}

                {/* View Toggle */}
                <div className="hidden md:flex items-center bg-white/[0.03] rounded-lg border border-white/[0.06] p-0.5">
                  <button
                    onClick={() => setViewMode("timeline")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "timeline" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"}`}
                    aria-label="Timeline view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"}`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                {/* Calendar Toggle (mobile) */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  aria-label="Toggle calendar"
                >
                  <CalendarIcon className="w-5 h-5" />
                </button>

                {/* Primary CTA — always "Add Activity" with auto-create */}
                <button
                  onClick={handleAddActivity}
                  disabled={isCreatingSchedule}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isCreatingSchedule ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Add Activity</span>
                </button>
              </div>
            </div>

            {/* Row 2: Day Strip */}
            <div className="pb-4">
              <DayStrip
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                scheduleDates={scheduleDates}
              />
            </div>
          </div>
        </div>

        {/* Main Content Area — fully responsive */}
        <div className="flex-1 overflow-y-auto" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}>
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">

              {/* LEFT COLUMN — Calendar + Stats (sticky on desktop) */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`space-y-4 sm:space-y-5 lg:sticky lg:top-6 lg:self-start ${sidebarOpen ? 'block' : 'hidden lg:block'}`}
              >
                {/* Mini Calendar Card */}
                <div className="rounded-2xl border border-white/[0.06] p-5 sm:p-6 overflow-hidden" style={{ background: 'linear-gradient(145deg, #0f1219 0%, #0a0d14 100%)' }}>
                  <MiniCalendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    scheduleDates={scheduleDates}
                  />
                </div>

                {/* Stats Card */}
                {selectedSchedule && selectedSchedule.items.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.06] p-5" style={{ background: 'linear-gradient(145deg, #0f1219 0%, #0a0d14 100%)' }}>
                    <StatsBar items={selectedSchedule.items} />
                  </div>
                )}

                {/* Category Legend Card */}
                {selectedSchedule && selectedSchedule.items.length > 0 && (
                  <div className="rounded-2xl border border-white/[0.06] p-5" style={{ background: 'linear-gradient(145deg, #0f1219 0%, #0a0d14 100%)' }}>
                    <h4 className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-3">Categories</h4>
                    <div className="space-y-1">
                      {Array.from(new Set(selectedSchedule.items.map((i) => i.category).filter(Boolean))).map(
                        (cat) => {
                          const style = getCategoryStyle(cat);
                          const count = selectedSchedule.items.filter((i) => i.category === cat).length;
                          return (
                            <div key={cat} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                  <span className="text-xs text-slate-300 capitalize">{cat}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium">{count}</span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                )}
              </motion.div>

              {/* RIGHT COLUMN — Schedule Content */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {/* Stress Indicator Bar */}
                {dayContext && dayContext.totalItems > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-xl border border-white/[0.06] p-4"
                    style={{ background: 'linear-gradient(145deg, #0f1219 0%, #0a0d14 100%)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          dayContext.stressLevel === 'critical' ? 'bg-red-500 animate-pulse' :
                          dayContext.stressLevel === 'high' ? 'bg-orange-500' :
                          dayContext.stressLevel === 'medium' ? 'bg-amber-400' :
                          'bg-emerald-400'
                        }`} />
                        <span className="text-xs font-semibold text-white uppercase tracking-wider">
                          {dayContext.stressLevel} stress
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {dayContext.busyHours}h busy · {dayContext.freeHours}h free
                      </span>
                    </div>
                    {/* Stress bar */}
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((dayContext.busyHours / 17) * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          dayContext.stressLevel === 'critical' ? 'bg-gradient-to-r from-red-600 to-red-400' :
                          dayContext.stressLevel === 'high' ? 'bg-gradient-to-r from-orange-600 to-orange-400' :
                          dayContext.stressLevel === 'medium' ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                          'bg-gradient-to-r from-emerald-600 to-emerald-400'
                        }`}
                      />
                    </div>
                    {/* AI Insight */}
                    <p className="text-[11px] text-slate-400 mt-2">
                      {dayContext.stressLevel === 'critical' || dayContext.stressLevel === 'high'
                        ? `Busy day — ${dayContext.backToBackCount} back-to-back items. Take breaks when you can.`
                        : dayContext.totalItems === 0
                        ? 'Free day! Great time for a workout or journaling.'
                        : dayContext.freeWindows.length > 0
                        ? `${dayContext.freeWindows.length} free window${dayContext.freeWindows.length > 1 ? 's' : ''} available — ${dayContext.freeWindows[0].startTime}–${dayContext.freeWindows[0].endTime} (${Math.round(dayContext.freeWindows[0].durationMinutes / 60 * 10) / 10}h)`
                        : 'Balanced day ahead.'}
                    </p>
                    {/* Special days */}
                    {dayContext.specialDays && dayContext.specialDays.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {dayContext.specialDays.map((sd) => (
                          <span key={sd.name} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20">
                            {sd.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Holiday context */}
                    {dayContext.holidayContext && (dayContext.holidayContext.activeHolidays.length > 0 || dayContext.holidayContext.upcomingHolidays.length > 0) && (
                      <div className="mt-2 space-y-1.5">
                        {dayContext.holidayContext.isFastingPeriod && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/15">
                            <span className="text-[11px]">🌙</span>
                            <span className="text-[10px] font-medium text-amber-400">
                              {dayContext.holidayContext.fastingName} — fasting period active
                            </span>
                          </div>
                        )}
                        {dayContext.holidayContext.activeHolidays.filter(h => !dayContext.holidayContext?.isFastingPeriod || h.name !== dayContext.holidayContext?.fastingName).map((h) => (
                          <span key={h.id} className="inline-flex mr-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                            {h.name}
                          </span>
                        ))}
                        {dayContext.holidayContext.suggestedAdjustments.length > 0 && (
                          <p className="text-[10px] text-slate-500 italic">
                            {dayContext.holidayContext.suggestedAdjustments[0]}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Free Windows Quick View */}
                {dayContext && dayContext.freeWindows.length > 0 && !isLoadingSchedule && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
                  >
                    {dayContext.freeWindows.slice(0, 3).map((fw, i) => (
                      <button
                        key={i}
                        onClick={handleAddActivity}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] text-xs text-emerald-400 whitespace-nowrap flex-shrink-0 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        {fw.startTime}–{fw.endTime}
                        <span className="text-emerald-500/50">({Math.round(fw.durationMinutes / 60 * 10) / 10}h)</span>
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Correlation Context Banner */}
                {dailyCorrelation && dailyCorrelation.stressScore > 60 && (
                  <div className="mb-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-400 text-sm font-medium">⚡ High Stress Day Detected</span>
                      <span className="text-xs text-slate-500">Stress: {dailyCorrelation.stressScore}/100</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {dailyCorrelation.calendarLoad > 0 && `${dailyCorrelation.calendarLoad} calendar events. `}
                      {dailyCorrelation.musicMood && `Music mood: ${dailyCorrelation.musicMood}. `}
                      {dailyCorrelation.recommendedMode === 'short' && 'Consider shorter activities today.'}
                    </p>
                    {dailyCorrelation.correlations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {dailyCorrelation.correlations.map((c, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            c.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            c.severity === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {c.description}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-white/[0.06] p-4 sm:p-5 lg:p-6" style={{ background: 'linear-gradient(145deg, #0f1219 0%, #0a0d14 100%)' }}>
                  {/* Date Header + Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6">
                    <div className="min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                        {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE")}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {format(selectedDate, "MMMM d, yyyy")}
                        {selectedSchedule && ` \u00B7 ${selectedSchedule.items.length} ${selectedSchedule.items.length === 1 ? "activity" : "activities"}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleAddActivity}
                        disabled={isCreatingSchedule}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isCreatingSchedule ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add Activity
                      </button>
                      {selectedSchedule && selectedSchedule.items.length > 0 && (
                        <button
                          onClick={() => router.push(`/wellbeing/schedule/${format(selectedDate, "yyyy-MM-dd")}`)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 text-xs font-medium transition-colors border border-sky-500/20 hover:border-sky-500/30"
                          aria-label="View workflow details"
                          title="Open workflow view"
                        >
                          <Workflow className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Details</span>
                        </button>
                      )}
                      {selectedSchedule && (
                        <button
                          onClick={handleDeleteSchedule}
                          disabled={isDeletingSchedule}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-medium transition-colors border border-red-500/20 hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Delete schedule"
                        >
                          {isDeletingSchedule ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
              <AnimatePresence mode="wait">
                {isLoadingSchedule ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-24"
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  </motion.div>
                ) : !selectedSchedule || selectedSchedule.items.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                      <div className="relative mb-5">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center">
                          <CalendarIcon className="w-7 h-7 text-emerald-400" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1.5">No activities scheduled</h3>
                      <p className="text-sm text-slate-500 mb-6 max-w-sm px-4">
                        Tap below to start planning your day — we&apos;ll set everything up for you
                      </p>
                      <button
                        onClick={handleAddActivity}
                        disabled={isCreatingSchedule}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isCreatingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {isCreatingSchedule ? "Setting up..." : "Add Activity"}
                      </button>
                    </div>
                  </motion.div>
                ) : viewMode === "timeline" ? (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {groupedItems.map((group) => (
                      <div key={group.label}>
                        {/* Group Header */}
                        <div className="flex items-center gap-2 mb-3">
                          {group.icon}
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {group.label}
                          </span>
                          <div className="flex-1 h-px bg-white/[0.04]" />
                          <span className="text-[10px] text-slate-600 font-medium">
                            {group.items.length} {group.items.length === 1 ? "item" : "items"}
                          </span>
                        </div>

                        {/* Timeline Items */}
                        <div className="ml-1">
                          {group.items.map((item, idx) => (
                            <TimelineItem
                              key={item.id}
                              item={item}
                              index={idx}
                              onEdit={handleEditActivity}
                              onDelete={handleDeleteActivity}
                              onOpen={(it) => setDrawerItem({ kind: "activity", data: it })}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  /* List/Grid View */
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {sortedItems.map((item, idx) => {
                      const style = getCategoryStyle(item.category);
                      const duration = getDuration(item.startTime, item.endTime, item.durationMinutes);
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          role="button"
                          tabIndex={0}
                          onClick={() => setDrawerItem({ kind: "activity", data: item })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setDrawerItem({ kind: "activity", data: item });
                            }
                          }}
                          className={`p-4 rounded-xl border ${style.border} bg-slate-800/40 hover:bg-slate-800/60 transition-all group cursor-pointer`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {item.icon && <span className="text-base">{item.icon}</span>}
                            <h3 className="font-semibold text-white text-sm truncate flex-1">{item.title}</h3>
                            {item.category && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${style.bg} ${style.text}`}>
                                {item.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(item.startTime)}
                              {item.endTime && ` - ${formatTime(item.endTime)}`}
                            </span>
                            {duration && (
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {duration}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

                  {/* Prayer Times */}
                  {prayers.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-white/[0.06]">
                      <h4 className="text-xs font-medium text-emerald-400 uppercase tracking-wide mb-2">Prayer Times</h4>
                      <div className="space-y-1.5">
                        {prayers.map((prayer) => {
                          const parsed = prayer.scheduledTime ? new Date(prayer.scheduledTime) : null;
                          const timeLabel = parsed && !isNaN(parsed.getTime())
                            ? parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '--:--';
                          const nameLabel = prayer.prayerName ? prayer.prayerName : 'Prayer';
                          return (
                            <div
                              key={prayer.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setDrawerItem({ kind: "prayer", data: prayer })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setDrawerItem({ kind: "prayer", data: prayer });
                                }
                              }}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-emerald-400">🕌</span>
                                <span className="text-sm text-white capitalize truncate">{nameLabel}</span>
                                <span className="text-xs text-slate-400 tabular-nums">{timeLabel}</span>
                              </div>
                              {prayer.completed ? (
                                <span className="text-xs text-emerald-400 shrink-0">✓ Done</span>
                              ) : (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await dataSourceService.markPrayerComplete(prayer.id);
                                      setPrayers(prev => prev.map(p => p.id === prayer.id ? { ...p, completed: true, completedAt: new Date().toISOString() } : p));
                                    } catch { /* ignore */ }
                                  }}
                                  className="px-2 py-0.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors shrink-0"
                                >
                                  Mark Done
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Google Calendar Events */}
                  {googleEvents.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Google Calendar</span>
                        <span className="text-[10px] text-slate-600">{googleEvents.length} event{googleEvents.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="space-y-2">
                        {googleEvents.map((event, idx) => {
                          const startDate = new Date(event.startTime);
                          const endDate = new Date(event.endTime);
                          const startStr = event.allDay ? 'All day' : `${String(startDate.getHours()).padStart(2,'0')}:${String(startDate.getMinutes()).padStart(2,'0')}`;
                          const endStr = event.allDay ? '' : `${String(endDate.getHours()).padStart(2,'0')}:${String(endDate.getMinutes()).padStart(2,'0')}`;
                          return (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              role="button"
                              tabIndex={0}
                              onClick={() => setDrawerItem({ kind: "google", data: event })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setDrawerItem({ kind: "google", data: event });
                                }
                              }}
                              className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/[0.04] border border-blue-500/10 hover:bg-blue-500/[0.08] transition-colors cursor-pointer"
                            >
                              <div className="w-1 h-8 rounded-full bg-blue-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">{event.title}</p>
                                <p className="text-[11px] text-slate-500">
                                  {startStr}{endStr ? ` – ${endStr}` : ''}
                                  {event.location ? ` · ${event.location}` : ''}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 shrink-0">
                                Google
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

            </div>{/* end grid */}
          </div>{/* end max-w container */}
        </div>{/* end overflow wrapper */}
      </div>

      {/* ── Activity Form Modal (Full Edit/Create) ── */}
      <ActivityFormModal
        isOpen={showActivityModal}
        onClose={() => { setShowActivityModal(false); setEditingActivity(null); }}
        activity={editingActivity}
        onSave={async () => {
          setShowActivityModal(false);
          setEditingActivity(null);
          await loadSchedule(selectedDate);
        }}
        scheduleId={selectedSchedule?.id}
      />

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmModal
        isOpen={!!confirmState}
        onClose={() => {
          if (isDeletingActivity || isDeletingSchedule) return;
          setConfirmState(null);
        }}
        onConfirm={handleConfirmDelete}
        title={confirmState?.kind === "schedule" ? "Delete Schedule?" : "Delete Activity?"}
        message={
          confirmState?.kind === "schedule"
            ? `This will permanently delete the entire schedule and all ${selectedSchedule?.items.length ?? 0} activities for ${format(selectedDate, "MMMM d, yyyy")}. This cannot be undone.`
            : "This will permanently remove this activity from your schedule. This cannot be undone."
        }
        confirmText={confirmState?.kind === "schedule" ? "Delete Schedule" : "Delete Activity"}
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingActivity || isDeletingSchedule}
      />

      {/* ── Activity Details Drawer (right sidebar) ── */}
      <ActivityDetailsDrawer
        item={drawerItem}
        onClose={() => setDrawerItem(null)}
        onEditActivity={handleEditActivity}
        onDeleteActivity={handleDeleteActivity}
        onMarkPrayerDone={async (prayerId) => {
          try {
            await dataSourceService.markPrayerComplete(prayerId);
            setPrayers((prev) =>
              prev.map((p) =>
                p.id === prayerId
                  ? { ...p, completed: true, completedAt: new Date().toISOString() }
                  : p,
              ),
            );
          } catch { /* ignore */ }
        }}
      />
    </DashboardLayout>
  );
}

export default function SchedulePageContent() {
  return (
    <Suspense fallback={<ScheduleLoading />}>
      <ScheduleContent />
    </Suspense>
  );
}
