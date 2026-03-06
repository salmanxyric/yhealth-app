"use client";

/**
 * @file MindConstellation Component
 * @description Orchestrator for the Mind Observatory — hybrid Canvas + DOM + SVG
 * constellation visualization. Manages data fetching, filter state, and composes
 * all sub-layers: background, SVG lines, mind core, star layer, and UI chrome.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Stars, Sun } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { journalService } from "@/src/shared/services/wellbeing.service";
import type { JournalEntry } from "@shared/types/domain/wellbeing";

import {
  computeStarVisuals,
  findConsecutivePairs,
  formatStarLabel,
  polarToXY,
  seededRandom,
} from "./constellation-math";
import type { ScreenStar } from "./ObservatoryStarLayer";
import { useObservatoryEngine } from "./useObservatoryEngine";
import { ConstellationBackground } from "./ConstellationBackground";
import { ConstellationSVGLines } from "./ConstellationSVGLines";
import { MindCore } from "./MindCore";
import { ObservatoryStarLayer } from "./ObservatoryStarLayer";
import { ObservatoryHeader } from "./ObservatoryHeader";
import { ObservatoryFilterBar } from "./ObservatoryFilterBar";
import type { FilterPeriod } from "./ObservatoryFilterBar";
import { ObservatoryMoodLegend } from "./ObservatoryMoodLegend";
import { StarTooltip } from "./StarTooltip";
import { JournalEntryModal } from "./JournalEntryModal";
import { ConstellationEmptyState } from "./ConstellationEmptyState";

// ============================================
// TYPES
// ============================================

interface MindConstellationProps {
  onOpenNewEntry: () => void;
  onStartCheckin: () => void;
  hasCheckedInToday: boolean;
  checkinLoading: boolean;
  onSwitchToList: () => void;
  onEditEntry?: (entry: JournalEntry) => void;
}

// ============================================
// CONSTANTS
// ============================================

const INNER_RADIUS = 0.15;
const OUTER_RADIUS = 0.45;
const TILT_Y = 0.52;

// ============================================
// HELPERS
// ============================================

function getDateRange(filter: FilterPeriod): { startDate?: string; endDate?: string } {
  if (filter.mode === "all_time") return {};
  if (filter.mode === "year") {
    return {
      startDate: `${filter.year}-01-01`,
      endDate: `${filter.year}-12-31`,
    };
  }
  // month
  const start = new Date(filter.year, filter.month, 1);
  const end = new Date(filter.year, filter.month + 1, 0); // last day of month
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    startDate: `${filter.year}-${pad(filter.month + 1)}-01`,
    endDate: `${filter.year}-${pad(filter.month + 1)}-${pad(end.getDate())}`,
  };
}

// ============================================
// COMPONENT
// ============================================

export function MindConstellation({
  onOpenNewEntry,
  onStartCheckin,
  hasCheckedInToday,
  checkinLoading,
  onSwitchToList,
  onEditEntry,
}: MindConstellationProps) {
  const prefersReducedMotion = useReducedMotionSafe();

  // --- Container size ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // --- Filter ---
  const now = new Date();
  const [filter, setFilter] = useState<FilterPeriod>({
    mode: "month",
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  // --- Data ---
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const range = getDateRange(filter);
      const result = await journalService.getEntries({
        limit: 100,
        page: 1,
        ...range,
      });
      if (result.success && result.data) {
        setEntries(result.data.entries || []);
      }
    } catch {
      // Silently handle — constellation shows empty
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Refresh on journal-logged event
  useEffect(() => {
    const handler = () => fetchEntries();
    window.addEventListener("journal-logged", handler);
    return () => window.removeEventListener("journal-logged", handler);
  }, [fetchEntries]);

  // --- Interaction state ---
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedEntry, setClickedEntry] = useState<JournalEntry | null>(null);

  const clearClickedEntry = useCallback(() => setClickedEntry(null), []);

  // --- Engine ---
  const { rotationAngle, parallaxX, parallaxY } = useObservatoryEngine({
    pauseRotation: hoveredIndex !== null,
    width: size.width,
    height: size.height,
    disabled: prefersReducedMotion,
  });

  // --- Sorted entries (newest first) ---
  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
      ),
    [entries]
  );

  // --- Compute screen positions ---
  const cx = size.width / 2;
  const cy = size.height / 2;
  const minDim = Math.min(size.width, size.height);

  const screenStars: ScreenStar[] = useMemo(() => {
    if (sorted.length === 0 || minDim === 0) return [];

    return sorted.map((entry, i) => {
      const t = sorted.length === 1 ? 0 : i / (sorted.length - 1);
      const radiusFrac = INNER_RADIUS + (OUTER_RADIUS - INNER_RADIUS) * t;
      const angle = seededRandom(entry.id) * Math.PI * 2;
      const radiusPx = radiusFrac * minDim;

      const { x: dx, y: dy } = polarToXY(angle + rotationAngle, radiusPx, TILT_Y);
      const visuals = computeStarVisuals(entry);

      return {
        id: entry.id,
        x: cx + dx + parallaxX,
        y: cy + dy + parallaxY,
        domSize: visuals.domSize,
        color: visuals.color,
        glowColor: visuals.glowColor,
        brightness: visuals.brightness,
        twinkleSpeed: visuals.twinkleSpeed,
        twinklePhase: visuals.twinklePhase,
        loggedAt: entry.loggedAt,
        sentimentScore: entry.sentimentScore,
      };
    });
  }, [sorted, rotationAngle, parallaxX, parallaxY, cx, cy, minDim]);

  // --- Consecutive-day pairs ---
  const consecutivePairs = useMemo(
    () => findConsecutivePairs(sorted),
    [sorted]
  );

  // --- Line points for SVG ---
  const linePoints = useMemo(
    () => screenStars.map((s) => ({ x: s.x, y: s.y, color: s.color })),
    [screenStars]
  );

  // --- Handlers ---
  const handleStarClick = useCallback(
    (index: number) => {
      const entry = sorted[index];
      if (entry) setClickedEntry(entry);
    },
    [sorted]
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      try {
        const result = await journalService.deleteEntry(entryId);
        if (result.success) {
          clearClickedEntry();
          fetchEntries();
        }
      } catch {
        // Error handling
      }
    },
    [clearClickedEntry, fetchEntries]
  );

  // --- Hovered tooltip data ---
  const hoveredEntry = hoveredIndex !== null ? sorted[hoveredIndex] : null;
  const hoveredPosition =
    hoveredIndex !== null && screenStars[hoveredIndex]
      ? { x: screenStars[hoveredIndex].x, y: screenStars[hoveredIndex].y }
      : null;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100dvh-5rem)] md:h-[calc(100dvh)] overflow-hidden"
      style={{ background: "#02020a" }}
    >
      {/* Layer 0: Canvas background (nebula + micro-stars) */}
      <ConstellationBackground width={size.width} height={size.height} />

      {/* Layer 5: SVG constellation lines */}
      <ConstellationSVGLines
        width={size.width}
        height={size.height}
        cx={cx + parallaxX}
        cy={cy + parallaxY}
        stars={linePoints}
        consecutivePairs={consecutivePairs}
      />

      {/* Layer 10: Mind Core (CSS-animated orb) */}
      <MindCore cx={cx + parallaxX} cy={cy + parallaxY} />

      {/* Layer 15: DOM Stars */}
      <ObservatoryStarLayer
        stars={screenStars}
        hoveredIndex={hoveredIndex}
        onHover={setHoveredIndex}
        onClick={handleStarClick}
      />

      {/* Layer 30: UI chrome */}
      <ObservatoryHeader
        entryCount={entries.length}
        onNewEntry={onOpenNewEntry}
      />

      <ObservatoryFilterBar filter={filter} onFilterChange={setFilter} />

      {/* Check-in banner */}
      {!checkinLoading && !hasCheckedInToday && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex justify-center"
          style={{ top: 100, zIndex: 30 }}
        >
          <button
            onClick={onStartCheckin}
            className="flex items-center gap-3 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm hover:bg-amber-500/20 transition-all observatory-font-display"
            style={{ fontSize: 10, letterSpacing: "0.12em" }}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300">DAILY CHECK-IN</span>
          </button>
        </div>
      )}

      <ObservatoryMoodLegend
        starCount={screenStars.length}
        onSwitchToList={onSwitchToList}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3 text-white/40">
            <Stars className="w-5 h-5 animate-pulse" />
            <span
              className="observatory-font-display"
              style={{ fontSize: 10, letterSpacing: "0.15em" }}
            >
              MAPPING REFLECTIONS...
            </span>
          </div>
        </div>
      )}

      {/* Layer 40: Tooltip */}
      <AnimatePresence>
        {hoveredEntry && hoveredPosition && (
          <StarTooltip
            entry={hoveredEntry}
            position={hoveredPosition}
            label={formatStarLabel(hoveredEntry.loggedAt)}
          />
        )}
      </AnimatePresence>

      {/* Layer 40: Entry modal */}
      <AnimatePresence>
        {clickedEntry && (
          <JournalEntryModal
            entry={clickedEntry}
            onClose={clearClickedEntry}
            onEdit={onEditEntry ? (entry) => { clearClickedEntry(); onEditEntry(entry); } : undefined}
            onDelete={handleDeleteEntry}
          />
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!isLoading && entries.length === 0 && (
        <ConstellationEmptyState onCreateEntry={onOpenNewEntry} />
      )}
    </div>
  );
}
