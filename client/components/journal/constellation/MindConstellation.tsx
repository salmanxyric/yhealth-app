"use client";

/**
 * @file MindConstellation Component
 * @description Knowledge-graph style Mind Observatory with pan + zoom canvas.
 * Renders concentric dashed orbits, category-colored satellites with icons,
 * and a right-side control rail (pan, recenter, fullscreen) plus bottom-right
 * zoom indicator and mini-map.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { AnimatePresence } from "framer-motion";
import {
  Hand,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  Target as TargetIcon,
} from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { journalService } from "@/src/shared/services/wellbeing.service";
import type { JournalEntry } from "@shared/types/domain/wellbeing";

import {
  CATEGORIES,
  computeStarVisuals,
  findConsecutivePairs,
  formatStarLabel,
  getEntryCategory,
  getEntryTitle,
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
  onSwitchToList: () => void;
  onEditEntry?: (entry: JournalEntry) => void;
}

// ============================================
// CONSTANTS
// ============================================

// Two concentric orbit rings: inner + outer (knowledge-graph style)
const ORBIT_FRACTIONS = [0.22, 0.36]; // fraction of min(w,h) per orbit
const TILT_Y = 0.6;

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;
const DEFAULT_ZOOM = 1;

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
  const end = new Date(filter.year, filter.month + 1, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    startDate: `${filter.year}-${pad(filter.month + 1)}-01`,
    endDate: `${filter.year}-${pad(filter.month + 1)}-${pad(end.getDate())}`,
  };
}

function clampZoom(z: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
}

// ============================================
// COMPONENT
// ============================================

export function MindConstellation({
  onOpenNewEntry,
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

  useEffect(() => {
    const handler = () => fetchEntries();
    window.addEventListener("journal-logged", handler);
    return () => window.removeEventListener("journal-logged", handler);
  }, [fetchEntries]);

  // --- Group entries by date ---
  const dateGroups = useMemo(() => {
    const groups = new Map<string, JournalEntry[]>();
    for (const entry of entries) {
      const dateKey = entry.loggedAt.split("T")[0];
      const existing = groups.get(dateKey);
      if (existing) existing.push(entry);
      else groups.set(dateKey, [entry]);
    }
    for (const group of groups.values()) {
      group.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
    }
    return groups;
  }, [entries]);

  // --- Interaction state ---
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [clickedEntries, setClickedEntries] = useState<JournalEntry[] | null>(null);
  const clearClickedEntries = useCallback(() => setClickedEntries(null), []);

  // --- Engine ---
  const { rotationAngle, parallaxX, parallaxY } = useObservatoryEngine({
    pauseRotation: hoveredIndex !== null,
    width: size.width,
    height: size.height,
    disabled: prefersReducedMotion,
  });

  // --- Pan/Zoom state ---
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const resetView = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z + 0.15)), []);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - 0.15)), []);

  const handleWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey) return; // only zoom on ctrl/meta + wheel
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setZoom((z) => clampZoom(z + delta));
  }, []);

  // Start panning only on mousedown inside the canvas background
  // (not on satellites / header / modals / controls). We intentionally listen
  // via document for move/up so ending a drag outside the canvas still works
  // and never captures pointer globally.
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      // Ignore drags that start inside anything interactive
      if (
        target.closest("[data-satellite]") ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='dialog']")
      ) {
        return;
      }
      const startX = e.clientX;
      const startY = e.clientY;
      const startPan = { x: pan.x, y: pan.y };
      setIsPanning(true);

      const onMove = (ev: MouseEvent) => {
        setPan({
          x: startPan.x + (ev.clientX - startX),
          y: startPan.y + (ev.clientY - startY),
        });
      };
      const onUp = () => {
        setIsPanning(false);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [pan.x, pan.y]
  );

  // --- Fullscreen ---
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // --- Sorted date keys ---
  const sortedDateKeys = useMemo(
    () =>
      [...dateGroups.keys()].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      ),
    [dateGroups]
  );

  const sortedRepEntries = useMemo(
    () => sortedDateKeys.map((dk) => dateGroups.get(dk)![0]),
    [sortedDateKeys, dateGroups]
  );

  // --- Screen positions (satellites distributed on 2 concentric orbits) ---
  const cx = size.width / 2;
  const cy = size.height / 2;
  const minDim = Math.min(size.width, size.height);

  const orbitRadii = useMemo(
    () => ORBIT_FRACTIONS.map((f) => f * minDim),
    [minDim]
  );

  const screenStars: ScreenStar[] = useMemo(() => {
    if (sortedDateKeys.length === 0 || minDim === 0) return [];

    // Split entries into orbit bands
    const half = Math.ceil(sortedDateKeys.length / 2);

    return sortedDateKeys.map((dateKey, i) => {
      const groupEntries = dateGroups.get(dateKey)!;
      const repEntry = groupEntries[0];
      const count = groupEntries.length;

      const orbitIdx = i < half ? 0 : 1;
      const radiusPx = orbitRadii[orbitIdx] ?? orbitRadii[0];
      const onOrbitCount = orbitIdx === 0 ? half : sortedDateKeys.length - half;
      const indexInOrbit = orbitIdx === 0 ? i : i - half;
      const baseAngle = (indexInOrbit / Math.max(1, onOrbitCount)) * Math.PI * 2;
      const jitter = (seededRandom(repEntry.id) - 0.5) * 0.3; // ±0.15 rad
      const angle = baseAngle + jitter;

      const { x: dx, y: dy } = polarToXY(angle + rotationAngle * 0.42, radiusPx, TILT_Y);
      const visuals = computeStarVisuals(repEntry);

      // Category-driven overrides
      const category = getEntryCategory(repEntry);
      const catMeta = CATEGORIES[category];
      const title = getEntryTitle(repEntry, category);

      return {
        id: repEntry.id,
        x: cx + dx + parallaxX,
        y: cy + dy + parallaxY,
        domSize: visuals.domSize,
        color: catMeta.color,
        glowColor: `${catMeta.color}88`,
        brightness: visuals.brightness,
        twinkleSpeed: visuals.twinkleSpeed,
        twinklePhase: visuals.twinklePhase,
        loggedAt: repEntry.loggedAt,
        sentimentScore: repEntry.sentimentScore,
        entryCount: count,
        dateKey,
        category,
        iconName: catMeta.iconName,
        title,
      };
    });
  }, [sortedDateKeys, dateGroups, orbitRadii, rotationAngle, parallaxX, parallaxY, cx, cy, minDim]);

  const consecutivePairs = useMemo(
    () => findConsecutivePairs(sortedRepEntries),
    [sortedRepEntries]
  );

  const linePoints = useMemo(
    () => screenStars.map((s) => ({ x: s.x, y: s.y, color: s.color })),
    [screenStars]
  );

  // --- Handlers ---
  const handleStarClick = useCallback(
    (index: number) => {
      const dateKey = sortedDateKeys[index];
      const group = dateKey ? dateGroups.get(dateKey) : null;
      if (group) setClickedEntries(group);
    },
    [sortedDateKeys, dateGroups]
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      try {
        const result = await journalService.deleteEntry(entryId);
        if (result.success) {
          clearClickedEntries();
          fetchEntries();
        }
      } catch {
        // Error handling
      }
    },
    [clearClickedEntries, fetchEntries]
  );

  // --- Tooltip position ---
  const hoveredDateKey = hoveredIndex !== null ? sortedDateKeys[hoveredIndex] : null;
  const hoveredEntries = hoveredDateKey ? dateGroups.get(hoveredDateKey) ?? null : null;
  const hoveredPosition =
    hoveredIndex !== null && screenStars[hoveredIndex]
      ? { x: screenStars[hoveredIndex].x, y: screenStars[hoveredIndex].y }
      : null;

  // Zoom percentage
  const zoomPct = Math.round(zoom * 100);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100dvh-5rem)] overflow-hidden"
      style={{
        background: "#02020a",
        cursor: isPanning ? "grabbing" : "default",
      }}
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
    >
      {/* Layer 0: Canvas background */}
      <ConstellationBackground
        width={size.width}
        height={size.height}
        animateGalaxy={!prefersReducedMotion}
      />

      {/* Canvas (pan + zoom transformed) */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isPanning ? "none" : "transform 0.18s ease-out",
        }}
      >
        <ConstellationSVGLines
          width={size.width}
          height={size.height}
          cx={cx + parallaxX}
          cy={cy + parallaxY}
          stars={linePoints}
          consecutivePairs={consecutivePairs}
          orbitRadii={orbitRadii}
          tiltY={TILT_Y}
          prefersReducedMotion={prefersReducedMotion}
        />

        <MindCore cx={cx + parallaxX} cy={cy + parallaxY} />

        <div data-satellite="true" className="contents">
          <ObservatoryStarLayer
            stars={screenStars}
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
            onClick={handleStarClick}
          />
        </div>
      </div>

      {/* UI chrome (fixed, outside the pan/zoom transform) */}
      <ObservatoryHeader
        entryCount={entries.length}
        onNewEntry={onOpenNewEntry}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* Mobile-only filter row (shown below header on small screens) */}
      <div className="md:hidden absolute left-0 right-0 top-[92px] flex justify-center" style={{ zIndex: 30 }}>
        <ObservatoryFilterBar filter={filter} onFilterChange={setFilter} />
      </div>

      {/* Right-side control rail */}
      <div
        className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2"
        style={{ zIndex: 30 }}
      >
        <CanvasToolButton label="Pan" onClick={() => { /* pan is always-on */ }} active>
          <Hand className="w-[18px] h-[18px]" />
        </CanvasToolButton>
        <CanvasToolButton label="Re-center" onClick={resetView}>
          <TargetIcon className="w-[18px] h-[18px]" />
        </CanvasToolButton>
        <CanvasToolButton
          label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={toggleFullscreen}
        >
          <Maximize2 className="w-[18px] h-[18px]" />
        </CanvasToolButton>
      </div>

      {/* Bottom-right zoom controls */}
      <div
        className="absolute right-4 bottom-[96px] flex items-center gap-1 rounded-full px-1 h-[36px]"
        style={{
          zIndex: 30,
          border: "1px solid rgba(255,255,255,0.12)",
          backgroundColor: "rgba(8,8,16,0.8)",
          backdropFilter: "blur(8px)",
        }}
      >
        <button
          onClick={zoomOut}
          aria-label="Zoom out"
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-[12px] text-white/80 font-medium min-w-[42px] text-center">
          {zoomPct}%
        </span>
        <button
          onClick={zoomIn}
          aria-label="Zoom in"
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Mini-map */}
      <MiniMap
        stars={screenStars}
        width={size.width}
        height={size.height}
        pan={pan}
        zoom={zoom}
      />

      <ObservatoryMoodLegend onSwitchToList={onSwitchToList} />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#10b981" }} />
            <span className="text-[12px]">Mapping reflections...</span>
          </div>
        </div>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredEntries && hoveredPosition && (
          <StarTooltip
            entries={hoveredEntries}
            position={{
              x: hoveredPosition.x * zoom + pan.x + ((1 - zoom) * size.width) / 2,
              y: hoveredPosition.y * zoom + pan.y + ((1 - zoom) * size.height) / 2,
            }}
            label={formatStarLabel(hoveredEntries[0].loggedAt)}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {clickedEntries && (
          <JournalEntryModal
            entries={clickedEntries}
            onClose={clearClickedEntries}
            onEdit={onEditEntry ? (entry) => { clearClickedEntries(); onEditEntry(entry); } : undefined}
            onDelete={handleDeleteEntry}
          />
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!isLoading && entries.length === 0 && (
        <ConstellationEmptyState onCreateEntry={onOpenNewEntry} />
      )}

      {/* Reference: suppress unused warning */}
      <span className="hidden">{now.getFullYear()}</span>
    </div>
  );
}

// ============================================
// SUBCOMPONENTS
// ============================================

function CanvasToolButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors"
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        backgroundColor: active ? "rgba(16,185,129,0.18)" : "rgba(8,8,16,0.8)",
        color: active ? "#10b981" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(8px)",
      }}
    >
      {children}
    </button>
  );
}

function MiniMap({
  stars,
  width,
  height,
  pan,
  zoom,
}: {
  stars: ScreenStar[];
  width: number;
  height: number;
  pan: { x: number; y: number };
  zoom: number;
}) {
  const MAP_W = 160;
  const MAP_H = 100;
  if (width === 0 || height === 0) return null;

  // Scale canvas coordinates into the mini-map box
  const scaleX = MAP_W / width;
  const scaleY = MAP_H / height;

  // Viewport rect (inverse-mapped from current pan/zoom)
  const viewW = (width / zoom) * scaleX;
  const viewH = (height / zoom) * scaleY;
  const viewX = (MAP_W - viewW) / 2 - (pan.x / zoom) * scaleX;
  const viewY = (MAP_H - viewH) / 2 - (pan.y / zoom) * scaleY;

  return (
    <div
      className="absolute right-4 bottom-4 rounded-[10px] overflow-hidden"
      style={{
        zIndex: 30,
        width: MAP_W,
        height: MAP_H,
        border: "1px solid rgba(16,185,129,0.35)",
        backgroundColor: "rgba(8,8,16,0.9)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      <svg width={MAP_W} height={MAP_H} className="block">
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x * scaleX}
            cy={s.y * scaleY}
            r={1.8}
            fill={s.color}
          />
        ))}
        {/* Viewport rect */}
        <rect
          x={Math.max(0, viewX)}
          y={Math.max(0, viewY)}
          width={Math.min(MAP_W, viewW)}
          height={Math.min(MAP_H, viewH)}
          fill="none"
          stroke="rgba(16,185,129,0.8)"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}
