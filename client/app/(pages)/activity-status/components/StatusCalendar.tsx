"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activityStatusService, STATUS_CONFIG, type CalendarDayStatus } from "@/src/shared/services/activity-status.service";
import { StatusPickerModal } from "./StatusPickerModal";
import { toast } from "react-hot-toast";

interface StatusCalendarProps {
  onDateSelect?: (date: string) => void;
}

export function StatusCalendar({ onDateSelect }: StatusCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDayStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    loadCalendarData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const response = await activityStatusService.getCalendar(year, month);
      if (response.success && response.data) {
        setCalendarData(response.data.days);
      }
    } catch (_error) {
      toast.error("Failed to load calendar data");
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: CalendarDayStatus) => {
    setSelectedDate(day.date);
    setIsPickerOpen(true);
    onDateSelect?.(day.date);
  };

  const handleStatusUpdate = () => {
    loadCalendarData();
  };

  // Get first day of month and number of days
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Generate calendar grid
  const calendarDays: (CalendarDayStatus | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    // Use Date object to ensure correct date formatting and avoid timezone issues
    const dateObj = new Date(year, month - 1, day);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    const dayData = calendarData.find((d) => d.date === dateStr) || { date: dateStr };
    calendarDays.push(dayData);
  }

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() + 1 &&
      year === today.getFullYear()
    );
  };

  const dayCellClass =
    "h-[clamp(44px,5.2vw,72px)] rounded-[8px] border transition-all relative overflow-hidden";

  return (
    <div className="space-y-2.5 text-[10px] sm:text-[11px] lg:text-xs">
      {/* Calendar Header */}
      <div className="bal-surface flex items-center justify-between bg-linear-to-r from-slate-900/70 via-slate-900/45 to-slate-900/70 p-2 shadow-[inset_0_1px_0_rgba(34,211,238,0.08)]">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-7 w-7 rounded-full border-cyan-300/20 bg-slate-900/70 text-slate-200 hover:bg-slate-800 sm:h-8 sm:w-8"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <h2 className="flex min-w-0 items-center gap-2 text-[13px] font-semibold leading-none tracking-tight text-slate-100 sm:text-sm lg:text-[15px]">
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            {monthName}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="h-7 w-7 rounded-full border-cyan-300/20 bg-slate-900/70 text-slate-200 hover:bg-slate-800 sm:h-8 sm:w-8"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={goToToday}
          className="h-7 rounded-full border-cyan-300/30 bg-cyan-500/10 px-3 text-[10px] font-semibold text-cyan-200 hover:bg-cyan-500/20 sm:h-8 sm:text-[11px]"
        >
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="bal-surface-elevated relative overflow-hidden rounded-2xl p-2.5 sm:p-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.16),transparent_42%),radial-gradient(circle_at_88%_30%,rgba(16,185,129,0.12),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-25 bg-[linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] bg-size-[44px_44px]" />
        <div className="relative">
        {/* Weekday Headers */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-1.5 text-center text-[9px] font-semibold tracking-wide text-cyan-100/70 sm:text-[10px]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <div
                key={i}
                className={`${dayCellClass} animate-pulse border-white/5 bg-slate-800/70`}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className={dayCellClass} />;
              }

              const dayNumber = parseInt(day.date.split("-")[2]);
              const config = day.status ? STATUS_CONFIG[day.status] : null;
              const todayClass = isToday(dayNumber)
                ? "ring-2 ring-cyan-300 shadow-[0_0_0_4px_rgba(34,211,238,0.15),0_0_22px_rgba(34,211,238,0.35)]"
                : "";

              return (
                <motion.button
                  key={day.date}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDayClick(day)}
                  className={`${dayCellClass} ${todayClass} ${
                    config
                      ? "border-transparent shadow-[inset_0_0_20px_rgba(15,23,42,0.3)]"
                      : "border-white/10 hover:border-cyan-300/50 bg-slate-950/45"
                  }`}
                  style={{
                    backgroundColor: config ? `${config.color}16` : undefined,
                  }}
                >
                  {config && (
                    <div
                      className="absolute -top-6 -right-6 w-12 h-12 rounded-full blur-xl"
                      style={{ backgroundColor: `${config.color}4D` }}
                    />
                  )}
                  <div className="flex h-full flex-col items-center justify-center p-1">
                    <span
                      className={`text-[10px] font-semibold sm:text-[11px] lg:text-xs ${
                        isToday(dayNumber) ? "text-cyan-300" : "text-slate-100"
                      }`}
                    >
                      {dayNumber}
                    </span>
                    {config && (
                      <span className="mt-0.5 text-xs leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.25)] sm:text-sm">
                        {config.icon}
                      </span>
                    )}
                    {day.mood && (
                      <span className="mt-0.5 text-[10px] leading-none opacity-90">
                        {["😞", "😐", "😊", "😄", "🌟"][day.mood - 1]}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Status Legend */}
      <div className="bal-surface flex flex-wrap gap-1 p-2">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <div
            key={status}
            className="bal-chip px-2 py-0.5 text-[9px] font-semibold text-slate-200 sm:text-[10px]"
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Status Picker Modal */}
      {selectedDate && (
        <StatusPickerModal
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
          date={selectedDate}
          initialStatus={calendarData.find((d) => d.date === selectedDate)?.status}
          initialMood={calendarData.find((d) => d.date === selectedDate)?.mood}
          initialNotes={calendarData.find((d) => d.date === selectedDate)?.notes}
          onSuccess={handleStatusUpdate}
        />
      )}
    </div>
  );
}
