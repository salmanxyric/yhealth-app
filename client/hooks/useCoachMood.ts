"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MOOD_PROFILES,
  type CoachMood,
  type MoodProfile,
  type ProgressSignals,
  buildPromptContext,
  pickNudge,
  renderGreetingSeed,
  selectMood,
} from "@/lib/avatar/coachPersonality";
import { streakApiService } from "@/src/shared/services/streak.service";
import { activityStatusService } from "@/src/shared/services/activity-status.service";

export interface UseCoachMoodOptions {
  userName: string;
  /** User-forced persona (from preferences). If set, overrides computed mood. */
  preferredPersona?: CoachMood | null;
  /** Disable network fetches (e.g., during SSR or unauth). */
  enabled?: boolean;
}

export interface UseCoachMoodReturn {
  mood: CoachMood;
  profile: MoodProfile;
  signals: ProgressSignals;
  /** Greeting line personalized to current mood + signals. */
  greeting: string;
  /** Returns a new nudge line each call (randomized). */
  getNudge: () => string;
  /** Prompt-context string to append to RAG requests. */
  promptContext: string;
  /** Force refresh signals (e.g., after user logs activity). */
  refresh: () => Promise<void>;
  /** Manually override preferred persona at runtime. */
  setPreferredPersona: (mood: CoachMood | null) => void;
  loading: boolean;
}

/**
 * Hook that fetches user progress signals, derives a coach mood, and exposes
 * helpers to render greetings, nudges, and prompt context. Safe to call
 * without blocking the UI — returns sensible defaults until fetches land.
 */
export function useCoachMood({
  userName,
  preferredPersona = null,
  enabled = true,
}: UseCoachMoodOptions): UseCoachMoodReturn {
  const [signals, setSignals] = useState<ProgressSignals>({
    streakDays: 0,
    preferredPersona,
  });
  const [loading, setLoading] = useState(enabled);
  const [personaOverride, setPersonaOverride] = useState<CoachMood | null>(preferredPersona);
  const fetchInFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled || fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
    try {
      const [streakRes, statusRes] = await Promise.allSettled([
        streakApiService.getStatus(),
        activityStatusService.getCurrent(),
      ]);

      const next: ProgressSignals = { streakDays: 0 };

      if (streakRes.status === "fulfilled" && streakRes.value?.data) {
        const s = streakRes.value.data;
        next.streakDays = s.currentStreak ?? 0;
        next.streakBroken = s.atRisk === true && (s.currentStreak ?? 0) === 0;
      }

      if (statusRes.status === "fulfilled" && statusRes.value?.data) {
        next.activityStatus = statusRes.value.data.status as ProgressSignals["activityStatus"];
      }

      setSignals((prev) => ({
        ...prev,
        ...next,
        preferredPersona: personaOverride ?? prev.preferredPersona ?? null,
      }));
    } catch (err) {
      console.warn("[useCoachMood] refresh failed:", err);
    } finally {
      fetchInFlightRef.current = false;
      setLoading(false);
    }
  }, [enabled, personaOverride]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    refresh();
  }, [enabled, refresh]);

  // React to external preferredPersona changes
  useEffect(() => {
    setPersonaOverride(preferredPersona);
    setSignals((prev) => ({ ...prev, preferredPersona: preferredPersona ?? null }));
  }, [preferredPersona]);

  const mood = useMemo(() => selectMood(signals), [signals]);
  const profile = MOOD_PROFILES[mood];

  const greeting = useMemo(
    () =>
      renderGreetingSeed(profile, {
        name: userName || "friend",
        streak: signals.streakDays,
        adherence: signals.adherencePct,
        recovery: signals.recoveryPct,
      }),
    [profile, userName, signals.streakDays, signals.adherencePct, signals.recoveryPct],
  );

  const promptContext = useMemo(
    () => buildPromptContext(profile, signals),
    [profile, signals],
  );

  const getNudge = useCallback(
    () => pickNudge(profile, { name: userName || "friend" }),
    [profile, userName],
  );

  return {
    mood,
    profile,
    signals,
    greeting,
    getNudge,
    promptContext,
    refresh,
    setPreferredPersona: setPersonaOverride,
    loading,
  };
}
