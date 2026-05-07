"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export type DatePreset = "day" | "week" | "month" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface DateFilterBarProps {
  value: DateRange;
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  onRangeChange: (range: DateRange) => void;
}

const presets: { id: DatePreset; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "custom", label: "Custom" },
];

function formatRangeLabel(range: DateRange, preset: DatePreset): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const monthOpts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };

  if (preset === "month") {
    return range.start.toLocaleDateString("en-US", monthOpts);
  }
  if (preset === "day") {
    return range.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }
  const startStr = range.start.toLocaleDateString("en-US", opts);
  const endStr = range.end.toLocaleDateString("en-US", opts);
  return `${startStr} – ${endStr}`;
}

export function getDefaultRange(preset: DatePreset, anchor?: Date): DateRange {
  const now = anchor || new Date();

  switch (preset) {
    case "day": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: "" };
    }
    case "week": {
      const start = new Date(now);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: "" };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end, label: "" };
    }
    case "custom":
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end, label: "" };
    }
  }
}

function shiftRange(range: DateRange, preset: DatePreset, direction: -1 | 1): DateRange {
  const anchor = new Date(range.start);

  switch (preset) {
    case "day":
      anchor.setDate(anchor.getDate() + direction);
      return getDefaultRange("day", anchor);
    case "week":
      anchor.setDate(anchor.getDate() + 7 * direction);
      return getDefaultRange("week", anchor);
    case "month":
      anchor.setMonth(anchor.getMonth() + direction);
      return getDefaultRange("month", anchor);
    default:
      return range;
  }
}

export function DateFilterBar({ value, preset, onPresetChange, onRangeChange }: DateFilterBarProps) {
  const [showCustom, setShowCustom] = useState(false);

  const displayLabel = useMemo(() => formatRangeLabel(value, preset), [value, preset]);

  const isToday = useMemo(() => {
    const now = new Date();
    const defaultRange = getDefaultRange(preset, now);
    return value.start.getTime() === defaultRange.start.getTime();
  }, [value, preset]);

  const handlePresetClick = useCallback((p: DatePreset) => {
    if (p === "custom") {
      setShowCustom(!showCustom);
      onPresetChange(p);
      return;
    }
    setShowCustom(false);
    onPresetChange(p);
    onRangeChange(getDefaultRange(p));
  }, [showCustom, onPresetChange, onRangeChange]);

  const handleNavigate = useCallback((direction: -1 | 1) => {
    onRangeChange(shiftRange(value, preset, direction));
  }, [value, preset, onRangeChange]);

  const handleToday = useCallback(() => {
    onRangeChange(getDefaultRange(preset));
  }, [preset, onRangeChange]);

  const canNavigateForward = useMemo(() => {
    const now = new Date();
    const nextRange = shiftRange(value, preset, 1);
    return nextRange.start <= now;
  }, [value, preset]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Preset pills */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetClick(p.id)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                preset === p.id
                  ? "text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {preset === p.id && (
                <motion.div
                  layoutId="datePresetPill"
                  className="absolute inset-0 rounded-lg bg-emerald-600"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
              <span className="relative z-10">{p.label}</span>
            </button>
          ))}
        </div>

        {/* Navigation + label */}
        <div className="flex items-center gap-2">
          {!isToday && (
            <button
              onClick={handleToday}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => handleNavigate(-1)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-white min-w-[140px] text-center font-[family-name:var(--font-syne)]">
            {displayLabel}
          </span>
          <button
            onClick={() => handleNavigate(1)}
            disabled={!canNavigateForward}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Custom date range inputs */}
      {preset === "custom" && showCustom && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3 flex-wrap"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={value.start.toISOString().split("T")[0]}
              onChange={(e) => {
                const start = new Date(e.target.value + "T00:00:00");
                if (!isNaN(start.getTime())) {
                  onRangeChange({ ...value, start, label: "" });
                }
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark] focus:outline-none focus:border-emerald-500/40"
            />
          </div>
          <span className="text-xs text-slate-500">to</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={value.end.toISOString().split("T")[0]}
              onChange={(e) => {
                const end = new Date(e.target.value + "T23:59:59.999");
                if (!isNaN(end.getTime())) {
                  onRangeChange({ ...value, end, label: "" });
                }
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark] focus:outline-none focus:border-emerald-500/40"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
