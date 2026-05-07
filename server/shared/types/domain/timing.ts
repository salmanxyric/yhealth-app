/**
 * @file Contextual Timing domain types
 * Feature: learns user's peak engagement hours from behavioral signals.
 */

/** 24-slot histogram — index 0 = midnight, 23 = 11 PM (user-local timezone) */
export type TimingHistogram = number[];

export interface UserTimingProfile {
  id: string;
  userId: string;
  hourHistogram: TimingHistogram;
  peakHour: number;        // 0-23
  secondaryHour: number;   // 0-23
  confidence: number;      // 0.00-1.00
  eventCount: number;
  lastComputedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Single GET /timing-profile payload for UI hydration */
export interface TimingProfileStatus {
  profile: UserTimingProfile | null;
  /** When true, user chose manual preferred check-in time (Smart Timing "AI learn" off) */
  manualOverride: boolean;
  /** `HH:MM` from user_preferences, or null */
  preferredCheckInTime: string | null;
  /** Heuristic label from peak hour (e.g. morning_person) */
  archetypeLabel: string | null;
}
