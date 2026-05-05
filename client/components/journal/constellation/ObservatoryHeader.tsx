"use client";

import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FilterPeriod } from "./ObservatoryFilterBar";

interface Props {
  entryCount: number;
  onNewEntry: () => void;
  filter: FilterPeriod;
  onFilterChange: (filter: FilterPeriod) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDateLabel(f: FilterPeriod): string {
  if (f.mode === "all_time") return "";
  if (f.mode === "year") return String(f.year);
  return `${MONTH_NAMES[f.month]} ${f.year}`;
}

function navPrev(f: FilterPeriod): FilterPeriod {
  if (f.mode === "month") {
    const m = f.month - 1;
    if (m < 0) return { mode: "month", year: f.year - 1, month: 11 };
    return { mode: "month", year: f.year, month: m };
  }
  if (f.mode === "year") return { mode: "year", year: f.year - 1 };
  return f;
}

function navNext(f: FilterPeriod): FilterPeriod {
  if (f.mode === "month") {
    const m = f.month + 1;
    if (m > 11) return { mode: "month", year: f.year + 1, month: 0 };
    return { mode: "month", year: f.year, month: m };
  }
  if (f.mode === "year") return { mode: "year", year: f.year + 1 };
  return f;
}

export function ObservatoryHeader({ entryCount, onNewEntry, filter, onFilterChange }: Props) {
  const router = useRouter();

  const modes = ["all_time", "month", "year"] as const;
  const modeLabels: Record<(typeof modes)[number], string> = {
    all_time: "All Time",
    month: "Monthly",
    year: "Yearly",
  };

  const switchMode = (mode: "month" | "year" | "all_time") => {
    if (mode === "all_time") {
      onFilterChange({ mode: "all_time" });
    } else if (mode === "year") {
      const y = filter.mode !== "all_time" && "year" in filter ? filter.year : new Date().getFullYear();
      onFilterChange({ mode: "year", year: y });
    } else {
      const now = new Date();
      const y = filter.mode !== "all_time" && "year" in filter ? filter.year : now.getFullYear();
      const m = filter.mode === "month" ? filter.month : now.getMonth();
      onFilterChange({ mode: "month", year: y, month: m });
    }
  };

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 gap-4"
      style={{
        zIndex: 30,
        background: "linear-gradient(180deg, rgba(2, 2, 10, 0.85) 0%, rgba(2, 2, 10, 0.4) 70%, transparent 100%)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Left: back + title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={() => router.push("/wellbeing")}
          aria-label="Back to wellbeing"
          className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-white text-[22px] sm:text-[26px] font-medium leading-tight tracking-tight truncate">
            Mind Observatory
          </h2>
          <p className="text-[13px] sm:text-[14px] text-white/50 mt-[2px] truncate">
            {entryCount} {entryCount === 1 ? "Reflection" : "Reflections"} Mapped
          </p>
        </div>
      </div>

      {/* Center: combined filter pill */}
      <div
        className="hidden md:flex items-center gap-1 h-[52px] rounded-full px-[6px] shrink-0"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Date nav (hidden when All Time) */}
        {filter.mode !== "all_time" && (
          <>
            <button
              onClick={() => onFilterChange(navPrev(filter))}
              aria-label="Previous period"
              className="flex items-center justify-center w-[30px] h-[30px] rounded-[6px] text-white transition-all hover:brightness-110"
              style={{ backgroundColor: "#10b981" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span
              className="text-white text-[14px] font-medium min-w-[110px] text-center px-2 select-none"
            >
              {getDateLabel(filter)}
            </span>
            <button
              onClick={() => onFilterChange(navNext(filter))}
              aria-label="Next period"
              className="flex items-center justify-center w-[30px] h-[30px] rounded-[6px] text-white transition-all hover:brightness-110"
              style={{ backgroundColor: "#10b981" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-5 mx-1 bg-white/10" />
          </>
        )}

        {/* Mode segments */}
        {modes.map((m) => {
          const active = filter.mode === m;
          return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`h-[38px] px-[18px] rounded-full text-[13px] font-medium transition-colors ${
                active
                  ? "bg-white text-black"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {modeLabels[m]}
            </button>
          );
        })}
      </div>

      {/* Right: Add New Reflection */}
      <button
        onClick={onNewEntry}
        className="shrink-0 inline-flex items-center gap-2 h-[44px] rounded-full px-4 sm:px-5 text-white text-[14px] sm:text-[15px] font-medium transition-all hover:brightness-110 active:brightness-95"
        style={{
          backgroundColor: "#10b981",
          boxShadow: "0 6px 20px rgba(16, 185, 129, 0.25)",
        }}
      >
        <Sparkles className="w-[18px] h-[18px]" />
        <span className="hidden sm:inline">Add New Reflection</span>
        <span className="sm:hidden">New</span>
      </button>
    </div>
  );
}
