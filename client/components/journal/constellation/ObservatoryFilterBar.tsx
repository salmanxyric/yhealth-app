"use client";

export type FilterPeriod =
  | { mode: "all_time" }
  | { mode: "year"; year: number }
  | { mode: "month"; year: number; month: number };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  filter: FilterPeriod;
  onFilterChange: (filter: FilterPeriod) => void;
}

function getLabel(filter: FilterPeriod): string {
  if (filter.mode === "all_time") return "All Time";
  if (filter.mode === "year") return String(filter.year);
  return `${MONTH_NAMES[filter.month]} ${filter.year}`;
}

function navigatePrev(filter: FilterPeriod): FilterPeriod {
  if (filter.mode === "month") {
    const m = filter.month - 1;
    if (m < 0) return { mode: "month", year: filter.year - 1, month: 11 };
    return { mode: "month", year: filter.year, month: m };
  }
  if (filter.mode === "year") return { mode: "year", year: filter.year - 1 };
  return filter;
}

function navigateNext(filter: FilterPeriod): FilterPeriod {
  if (filter.mode === "month") {
    const m = filter.month + 1;
    if (m > 11) return { mode: "month", year: filter.year + 1, month: 0 };
    return { mode: "month", year: filter.year, month: m };
  }
  if (filter.mode === "year") return { mode: "year", year: filter.year + 1 };
  return filter;
}

export function ObservatoryFilterBar({ filter, onFilterChange }: Props) {
  const modes = ["month", "year", "all_time"] as const;
  const modeLabels = { month: "MONTH", year: "YEAR", all_time: "ALL TIME" };

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
      className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3"
      style={{ top: 62, zIndex: 30 }}
    >
      {/* Mode pills */}
      <div className="flex rounded-full border border-white/10 overflow-hidden">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`observatory-font-display px-3 py-1.5 transition-all duration-200 ${
              filter.mode === m
                ? "bg-purple-500/25 text-purple-200"
                : "text-white/30 hover:text-white/50 hover:bg-white/5"
            }`}
            style={{ fontSize: 9, letterSpacing: "0.15em" }}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Period navigator */}
      {filter.mode !== "all_time" && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFilterChange(navigatePrev(filter))}
            className="text-white/30 hover:text-white/60 transition-colors px-1"
            style={{ fontSize: 14 }}
          >
            &lsaquo;
          </button>
          <span
            className="observatory-font-display text-white/60 min-w-[120px] text-center"
            style={{ fontSize: 10, letterSpacing: "0.12em" }}
          >
            {getLabel(filter)}
          </span>
          <button
            onClick={() => onFilterChange(navigateNext(filter))}
            className="text-white/30 hover:text-white/60 transition-colors px-1"
            style={{ fontSize: 14 }}
          >
            &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
}
