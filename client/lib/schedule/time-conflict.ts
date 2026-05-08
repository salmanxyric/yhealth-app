/**
 * @file time-conflict.ts
 * @description Overlap detection + free-slot suggestion across heterogeneous
 * schedule sources (manual activities, Google Calendar events, prayer times).
 *
 * Canonical time unit inside the module: minutes-since-midnight (local time).
 * Callers pass HH:mm (manual) or ISO 8601 (google/prayer) — the helper
 * normalises everything.
 */

import { parseISO } from "date-fns";

export type SlotSource = "manual" | "google" | "prayer" | "plan";

/**
 * Normalised view of an already-scheduled slot used for conflict checks.
 * `start`/`end` accept either `HH:mm` or a full ISO 8601 string.
 */
export interface ExistingSlot {
  id: string;
  title: string;
  source: SlotSource;
  start: string;
  end: string;
}

export interface ConflictHit {
  id: string;
  title: string;
  source: SlotSource;
  startHHmm: string;
  endHHmm: string;
}

export interface ConflictResult {
  conflicts: ConflictHit[];
  /** Suggested non-conflicting window that preserves the requested duration. */
  suggestedStart: string | null;
  suggestedEnd: string | null;
}

const DAY_END_MINUTES = 22 * 60; // 22:00 — stop suggesting after this

/**
 * Convert a `HH:mm` (assumed local) or ISO 8601 string to minutes-since-midnight
 * in the *local* timezone. Returns NaN on unparseable input so callers can skip.
 */
export function toMinutes(value: string | null | undefined): number {
  if (!value) return NaN;
  // HH:mm — exact 5-char pattern or `H:mm` etc.
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(":").map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
    return NaN;
  }
  // ISO 8601
  try {
    const d = parseISO(value);
    if (isNaN(d.getTime())) return NaN;
    return d.getHours() * 60 + d.getMinutes();
  } catch {
    return NaN;
  }
}

export function minutesToHHmm(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * True if `[aStart,aEnd)` overlaps `[bStart,bEnd)`. Touching edges are NOT a
 * conflict (one ending exactly when another starts is fine).
 */
export function isOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Walk existing slots sorted by start; if the requested window overlaps one,
 * jump to that slot's end and try again. Returns null if no fit before
 * `DAY_END_MINUTES`.
 */
function findNextFreeWindow(
  requestedStart: number,
  durationMinutes: number,
  slots: Array<{ start: number; end: number }>,
): { start: number; end: number } | null {
  if (durationMinutes <= 0) return null;

  const sorted = [...slots].sort((a, b) => a.start - b.start);
  let start = requestedStart;

  // Iterate until we either find a gap or cross the day end.
  // Bounded by slot count × 2 to avoid pathological loops on weird data.
  const maxIterations = sorted.length * 2 + 4;
  for (let i = 0; i < maxIterations; i++) {
    const end = start + durationMinutes;
    if (end > DAY_END_MINUTES) return null;

    const conflict = sorted.find((s) => isOverlap(start, end, s.start, s.end));
    if (!conflict) {
      return { start, end };
    }
    start = conflict.end;
  }

  return null;
}

/**
 * Check a proposed `[newStart,newEnd)` window against existing slots.
 *
 * @returns Always an object. `conflicts` is [] when the slot is free, and
 *   `suggestedStart/End` is populated only when conflicts exist.
 */
export function detectConflict(
  newStart: string,
  newEnd: string,
  existing: ExistingSlot[],
): ConflictResult {
  const startMin = toMinutes(newStart);
  const endMin = toMinutes(newEnd);

  if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || endMin <= startMin) {
    return { conflicts: [], suggestedStart: null, suggestedEnd: null };
  }

  const normalised = existing
    .map((s) => {
      const start = toMinutes(s.start);
      const end = toMinutes(s.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return null;
      }
      return { ...s, startMin: start, endMin: end };
    })
    .filter((s): s is ExistingSlot & { startMin: number; endMin: number } => s !== null);

  const hits: ConflictHit[] = normalised
    .filter((s) => isOverlap(startMin, endMin, s.startMin, s.endMin))
    .map((s) => ({
      id: s.id,
      title: s.title,
      source: s.source,
      startHHmm: minutesToHHmm(s.startMin),
      endHHmm: minutesToHHmm(s.endMin),
    }));

  if (hits.length === 0) {
    return { conflicts: [], suggestedStart: null, suggestedEnd: null };
  }

  const duration = endMin - startMin;
  const free = findNextFreeWindow(
    startMin,
    duration,
    normalised.map((s) => ({ start: s.startMin, end: s.endMin })),
  );

  return {
    conflicts: hits,
    suggestedStart: free ? minutesToHHmm(free.start) : null,
    suggestedEnd: free ? minutesToHHmm(free.end) : null,
  };
}

/**
 * Given the nearest time now (or a proposed default), find the earliest free
 * 30-min slot ≥ `requestedStart`. Used to initialise the form when opening.
 */
export function findNextOpenSlot(
  requestedStart: string,
  durationMinutes: number,
  existing: ExistingSlot[],
): { start: string; end: string } | null {
  const startMin = toMinutes(requestedStart);
  if (!Number.isFinite(startMin)) return null;

  const normalised = existing
    .map((s) => ({ start: toMinutes(s.start), end: toMinutes(s.end) }))
    .filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start);

  const free = findNextFreeWindow(startMin, durationMinutes, normalised);
  if (!free) return null;
  return { start: minutesToHHmm(free.start), end: minutesToHHmm(free.end) };
}
