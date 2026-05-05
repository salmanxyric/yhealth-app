"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Sliders,
  Bell,
  MessageSquare,
  Volume2,
  Zap,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Moon,
  Smartphone,
  Mail,
  Clock,
  Globe,
  
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { TimingProfileStatus, UserTimingProfile } from "@shared/types/domain/timing";
import { LanguageSelector } from "@/components/common/language-selector";
import { useVoiceAssistant } from "@/app/context/VoiceAssistantContext";
import { CoachPersonaPicker } from "@/components/coach/CoachPersonaPicker";
import { coachingStyleForPersona, personaFromCoachingStyle } from "@shared/types/domain/coach-persona";

// ─── Types ───
interface APIPreferences {
  id: string;
  userId: string;
  notifications: {
    channels: Record<string, boolean>;
    quietHours: { enabled: boolean; start: string; end: string };
    frequency: { maxPerDay: number; maxPerWeek: number };
    types: Record<string, boolean>;
  };
  coaching: {
    style: string;
    aiCoachPersona?: string;
    intensity: string;
    preferredChannel: string;
    checkInFrequency: string;
    preferredCheckInTime: string;
    timezone: string;
    aiPersonality: { useEmojis: boolean; formalityLevel: string; encouragementLevel: string };
    focusAreas: string[];
  };
  display: {
    units: { weight: string; height: string; distance: string; temperature: string };
    dateFormat: string;
    timeFormat: string;
    language: string;
    theme: string;
  };
  privacy: {
    shareProgressWithCoach: boolean;
    allowAnonymousDataForResearch: boolean;
    showInLeaderboards: boolean;
    profileVisibility: string;
  };
  integrations: {
    autoSyncEnabled: boolean;
    syncOnWifiOnly: boolean;
    backgroundSyncEnabled: boolean;
    dataRetentionDays: number;
  };
}

interface LocalPreferences {
  coaching: {
    aiCoachPersona: string;
    style: string;
    intensity: string;
    preferredChannel: string;
    checkInFrequency: string;
  };
  notifications: {
    activityReminders: boolean;
    progressUpdates: boolean;
    motivationalMessages: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  display: { language: string };
}

// ─── Constants ───
const intensityLevels = [
  { id: "light", label: "Gentle", desc: "Light nudges and reminders" },
  { id: "moderate", label: "Moderate", desc: "Balanced approach" },
  { id: "intensive", label: "Intensive", desc: "Frequent check-ins" },
];

const channelOptions = [
  { id: "push", label: "App Only", icon: Smartphone },
  { id: "email", label: "Email", icon: Mail },
  { id: "whatsapp", label: "Both", icon: Bell },
];

const frequencyOptions = [
  { id: "daily", label: "Daily" },
  { id: "every_other_day", label: "Twice Daily" },
  { id: "weekly", label: "Weekly" },
];

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function toTimeInputValue(t: string | null | undefined): string {
  if (!t) return "09:00";
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "09:00";
  const hh = m[1].padStart(2, "0");
  const mm = m[2];
  return `${hh}:${mm}`;
}

function archetypeCopy(label: string | null): string | null {
  if (!label) return null;
  switch (label) {
    case "morning_person":
      return "Your activity clusters in the morning — we’ll bias gentle nudges toward that window.";
    case "midday_person":
      return "You’re most reachable around midday — reminders align with lunch-hour engagement.";
    case "evening_person":
      return "Evenings are your strongest slot — we’ll avoid noisy mornings when possible.";
    case "night_owl":
      return "Late hours show the most signal — we still respect quiet hours and caps.";
    default:
      return null;
  }
}

function apiToLocal(apiPrefs: APIPreferences): LocalPreferences {
  return {
    coaching: {
      style: apiPrefs.coaching?.style || "supportive",
      aiCoachPersona:
        apiPrefs.coaching?.aiCoachPersona ||
        personaFromCoachingStyle(apiPrefs.coaching?.style || "supportive"),
      intensity: apiPrefs.coaching?.intensity || "moderate",
      preferredChannel: apiPrefs.coaching?.preferredChannel || "push",
      checkInFrequency: apiPrefs.coaching?.checkInFrequency || "daily",
    },
    notifications: {
      activityReminders: apiPrefs.notifications?.types?.activityReminders ?? true,
      progressUpdates: apiPrefs.notifications?.types?.progressUpdates ?? true,
      motivationalMessages: apiPrefs.notifications?.types?.motivationalMessages ?? true,
      quietHoursEnabled: apiPrefs.notifications?.quietHours?.enabled ?? false,
      quietHoursStart: apiPrefs.notifications?.quietHours?.start || "22:00",
      quietHoursEnd: apiPrefs.notifications?.quietHours?.end || "07:00",
    },
    display: { language: apiPrefs.display?.language || "en-US" },
  };
}

function localToApi(local: LocalPreferences) {
  return {
    coaching: {
      style: local.coaching.style,
      aiCoachPersona: local.coaching.aiCoachPersona,
      intensity: local.coaching.intensity,
      preferredChannel: local.coaching.preferredChannel,
      checkInFrequency: local.coaching.checkInFrequency,
    },
    notifications: {
      types: {
        activityReminders: local.notifications.activityReminders,
        progressUpdates: local.notifications.progressUpdates,
        motivationalMessages: local.notifications.motivationalMessages,
      },
      quietHours: {
        enabled: local.notifications.quietHoursEnabled,
        start: local.notifications.quietHoursStart,
        end: local.notifications.quietHoursEnd,
      },
    },
    display: { language: local.display.language },
  };
}

// ─── Card shadow helper ───
const CARD_BG = "linear-gradient(145deg, rgba(18,20,35,0.95) 0%, rgba(12,13,30,0.98) 50%, rgba(8,10,22,1) 100%)";

function cardShadow(color: string) {
  return `0 2px 4px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.35), 0 20px 48px rgba(0,0,0,0.2), 0 0 32px ${color}, inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.3)`;
}

// ─── Reusable sub-components ───

function PreferenceCard({
  accent,
  glowColor,
  icon: Icon,
  title,
  subtitle,
  children,
  delay = 0,
  className = "",
}: {
  accent: string;
  glowColor: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 30 }}
      className={`relative rounded-2xl p-5 sm:p-6 overflow-hidden ${className}`}
      style={{
        background: CARD_BG,
        border: `1px solid ${accent}25`,
        boxShadow: cardShadow(`${glowColor}10`),
      }}
    >
      {/* Top edge shimmer */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)` }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: `${accent}15`, border: `1px solid ${accent}20` }}
        >
          <span style={{ color: accent }}><Icon className="w-5 h-5" /></span>
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-white/35 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {children}
    </motion.div>
  );
}

function Toggle({
  checked,
  onChange,
  color = "#10b981",
}: {
  checked: boolean;
  onChange: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className="relative inline-flex w-[44px] h-[24px] rounded-full transition-colors duration-200 shrink-0 cursor-pointer focus:outline-none"
      style={{ backgroundColor: checked ? color : "rgba(255,255,255,0.10)" }}
    >
      <span
        className={`inline-block w-[20px] h-[20px] rounded-full bg-white shadow-md transition-transform duration-200 mt-[2px] ${
          checked ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

// ─── Main Component ───
export function PreferencesTab() {
  const { selectedLanguage, setSelectedLanguage } = useVoiceAssistant();

  const [preferences, setPreferences] = useState<LocalPreferences>({
    coaching: {
      aiCoachPersona: "gentle_friend",
      style: "supportive",
      intensity: "moderate",
      preferredChannel: "push",
      checkInFrequency: "daily",
    },
    notifications: {
      activityReminders: true,
      progressUpdates: true,
      motivationalMessages: true,
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    },
    display: { language: selectedLanguage },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [smartTimingEnabled, setSmartTimingEnabled] = useState(true);
  const [timingProfile, setTimingProfile] = useState<UserTimingProfile | null>(null);
  const [timingArchetypeLabel, setTimingArchetypeLabel] = useState<string | null>(null);
  const [manualCheckInTime, setManualCheckInTime] = useState("09:00");
  const archetypeLine = useMemo(() => archetypeCopy(timingArchetypeLabel), [timingArchetypeLabel]);

  const applyTimingStatus = useCallback((status: TimingProfileStatus) => {
    setSmartTimingEnabled(!status.manualOverride);
    setTimingProfile(status.profile);
    setTimingArchetypeLabel(status.archetypeLabel ?? null);
    if (status.preferredCheckInTime) {
      setManualCheckInTime(toTimeInputValue(status.preferredCheckInTime));
    }
  }, []);

  const refetchTimingStatus = useCallback(async () => {
    try {
      const timingRes = await api.get<TimingProfileStatus>("/timing-profile");
      if (timingRes.success && timingRes.data) {
        applyTimingStatus(timingRes.data);
      }
    } catch {
      /* timing profile may not exist */
    }
  }, [applyTimingStatus]);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prefRes = await api.get<{ preferences: APIPreferences }>("/preferences");
      if (prefRes.success && prefRes.data?.preferences) {
        setPreferences(apiToLocal(prefRes.data.preferences));
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    }
    try {
      const timingRes = await api.get<TimingProfileStatus>("/timing-profile");
      if (timingRes.success && timingRes.data) {
        applyTimingStatus(timingRes.data);
      }
    } catch {
      /* timing profile optional */
    } finally {
      setIsLoading(false);
    }
  }, [applyTimingStatus]);

  useEffect(() => { fetchPreferences(); }, [fetchPreferences]);

  const langSyncedRef = useRef(false);
  useEffect(() => {
    if (!langSyncedRef.current && preferences.display.language) {
      setSelectedLanguage(preferences.display.language);
      langSyncedRef.current = true;
    }
  }, [preferences.display.language, setSelectedLanguage]);

  useEffect(() => {
    if (langSyncedRef.current && selectedLanguage && preferences.display.language !== selectedLanguage) {
      setPreferences(prev => ({ ...prev, display: { ...prev.display, language: selectedLanguage } }));
      setHasChanges(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]);

  const savePreferences = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await api.put("/preferences", localToApi(preferences));
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateCoaching = (field: keyof LocalPreferences["coaching"], value: string) => {
    setPreferences(prev => ({ ...prev, coaching: { ...prev.coaching, [field]: value } }));
    setHasChanges(true);
  };

  const updateNotifications = (field: keyof LocalPreferences["notifications"], value: boolean | string) => {
    setPreferences(prev => ({ ...prev, notifications: { ...prev.notifications, [field]: value } }));
    setHasChanges(true);
  };

  const updateDisplay = (field: keyof LocalPreferences["display"], value: string) => {
    setPreferences(prev => ({ ...prev, display: { ...prev.display, [field]: value } }));
    setHasChanges(true);
    if (field === "language") setSelectedLanguage(value);
  };

  // ─── Loading Skeleton ───
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div><div className="h-7 w-48 bg-white/[0.06] rounded-lg" /><div className="h-4 w-64 bg-white/[0.03] rounded-lg mt-2" /></div>
          <div className="h-11 w-36 bg-white/[0.06] rounded-xl" />
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-2xl h-[260px]" style={{ background: CARD_BG, border: "1px solid rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      </div>
    );
  }

  // ─── Main Render ───
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-sky-400" />
            Preferences
          </h1>
          <p className="text-sm text-white/40 mt-1">Customize your coaching experience</p>
        </div>

        <button
          onClick={savePreferences}
          disabled={isSaving || !hasChanges}
          className={`inline-flex items-center gap-2 px-6 py-2.5 font-medium rounded-[12px] text-sm transition-all ${
            hasChanges
              ? "bg-emerald-600 text-white hover:brightness-110 shadow-[0_0_20px_rgba(5,150,105,0.2)]"
              : "bg-white/[0.04] border border-white/[0.06] text-white/30"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
        </button>
      </motion.div>

      {/* Error/Success banners */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-[12px] bg-red-500/[0.06] border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}
        {saveSuccess && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-[12px] bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-emerald-400 text-sm">Preferences saved successfully!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Coach personality ── */}
        <PreferenceCard accent="#a855f7" glowColor="#a855f7" icon={MessageSquare} title="Coach personality" subtitle="Tone for chat, voice, and proactive nudges" delay={0.05}>
          <CoachPersonaPicker
            compact
            value={preferences.coaching.aiCoachPersona}
            disabled={isSaving}
            onChange={(id) => {
              setPreferences((prev) => ({
                ...prev,
                coaching: {
                  ...prev.coaching,
                  aiCoachPersona: id,
                  style: coachingStyleForPersona(id),
                },
              }));
              setHasChanges(true);
            }}
          />
        </PreferenceCard>

        {/* ── Coaching Intensity ── */}
        <PreferenceCard accent="#f59e0b" glowColor="#f59e0b" icon={Zap} title="Coaching Intensity" subtitle="How often your coach checks in" delay={0.1}>
          <div className="space-y-2.5">
            {intensityLevels.map(level => {
              const selected = preferences.coaching.intensity === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => updateCoaching("intensity", level.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                    selected
                      ? "bg-amber-500/10 border border-amber-500/30"
                      : "bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]"
                  }`}
                >
                  {selected && <div className="w-1 h-8 rounded-full bg-amber-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${selected ? "text-amber-300" : "text-white"}`}>{level.label}</p>
                    <p className="text-xs text-white/35 mt-0.5">{level.desc}</p>
                  </div>
                  {selected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </PreferenceCard>

        {/* ── Communication Channel ── */}
        <PreferenceCard accent="#06b6d4" glowColor="#06b6d4" icon={Bell} title="Communication Channel" subtitle="How you receive updates" delay={0.15}>
          {/* Channel selector */}
          <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/[0.06] rounded-[12px] mb-5">
            {channelOptions.map(ch => {
              const selected = preferences.coaching.preferredChannel === ch.id;
              const ChIcon = ch.icon;
              return (
                <button
                  key={ch.id}
                  onClick={() => updateCoaching("preferredChannel", ch.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-medium transition-all cursor-pointer ${
                    selected
                      ? "bg-cyan-500 text-white shadow-[0_0_16px_rgba(6,182,212,0.25)]"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <ChIcon className="w-4 h-4" />
                  {ch.label}
                </button>
              );
            })}
          </div>

          {/* Frequency */}
          <div>
            <label className="text-xs text-white/40 font-medium mb-2 block">Check-in Frequency</label>
            <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/[0.06] rounded-[12px]">
              {frequencyOptions.map(freq => {
                const selected = preferences.coaching.checkInFrequency === freq.id;
                return (
                  <button
                    key={freq.id}
                    onClick={() => updateCoaching("checkInFrequency", freq.id)}
                    className={`flex-1 py-2 rounded-[10px] text-sm font-medium transition-all cursor-pointer ${
                      selected
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    {freq.label}
                  </button>
                );
              })}
            </div>
          </div>
        </PreferenceCard>

        {/* ── Smart Timing ── */}
        <PreferenceCard accent="#14b8a6" glowColor="#14b8a6" icon={Clock} title="Smart Timing" subtitle="AI-optimized notification schedule" delay={0.2}>
          <div className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Let AI learn my best times</p>
                <p className="text-xs text-white/30 mt-0.5">Analyzes activity for optimal hours</p>
              </div>
              <Toggle
                checked={smartTimingEnabled}
                color="#14b8a6"
                onChange={async () => {
                  const newVal = !smartTimingEnabled;
                  const prev = smartTimingEnabled;
                  setSmartTimingEnabled(newVal);
                  try {
                    await api.put("/timing-profile/override", { enabled: newVal, manualTime: newVal ? undefined : manualCheckInTime });
                    await refetchTimingStatus();
                  } catch {
                    setSmartTimingEnabled(prev);
                  }
                }}
              />
            </div>

            {/* AI Profile */}
            <AnimatePresence mode="wait">
              {smartTimingEnabled && timingProfile && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl p-4 overflow-hidden"
                  style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.12)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/40">Peak engagement</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      timingProfile.confidence > 0.6 ? "bg-emerald-500/15 text-emerald-400"
                        : timingProfile.confidence >= 0.3 ? "bg-amber-500/15 text-amber-400"
                        : "bg-white/[0.06] text-white/40"
                    }`}>
                      {timingProfile.confidence > 0.6 ? "Confident" : timingProfile.confidence >= 0.3 ? "Learning" : "Building..."}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 mb-3">
                    <div>
                      <span className="text-2xl font-semibold text-white">{formatHour(timingProfile.peakHour)}</span>
                      <span className="text-xs text-teal-400 ml-1">peak</span>
                    </div>
                    <div>
                      <span className="text-lg font-medium text-white/50">{formatHour(timingProfile.secondaryHour)}</span>
                      <span className="text-xs text-white/30 ml-1">secondary</span>
                    </div>
                  </div>
                  {/* Histogram */}
                  <div className="flex items-end gap-px h-10">
                    {timingProfile.hourHistogram.map((val, i) => {
                      const max = Math.max(...timingProfile.hourHistogram, 1);
                      const height = Math.max(2, (val / max) * 100);
                      const isPeak = i === timingProfile.peakHour;
                      const isSecondary = i === timingProfile.secondaryHour;
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm transition-colors ${isPeak ? "bg-teal-400" : isSecondary ? "bg-teal-400/50" : "bg-white/[0.08]"}`}
                          style={{ height: `${height}%` }}
                          title={`${formatHour(i)}: ${val} events`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/20">12am</span>
                    <span className="text-[10px] text-white/20">12pm</span>
                    <span className="text-[10px] text-white/20">11pm</span>
                  </div>
                  {archetypeLine ? (
                    <p className="text-[11px] text-white/45 mt-3 leading-relaxed border-t border-white/[0.06] pt-3">
                      {archetypeLine}
                    </p>
                  ) : null}
                </motion.div>
              )}
              {smartTimingEnabled && !timingProfile && (
                <motion.div key="no-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-xs text-white/30">Smart Timing needs ~2 weeks of data to learn your patterns. Keep using the app!</p>
                </motion.div>
              )}
              {!smartTimingEnabled && (
                <motion.div key="manual" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                  <label className="text-xs text-white/40 block">Preferred check-in time</label>
                  <input
                    type="time"
                    value={manualCheckInTime}
                    onChange={async (e) => {
                      const newTime = e.target.value;
                      setManualCheckInTime(newTime);
                      try {
                        await api.put("/timing-profile/override", { enabled: false, manualTime: newTime });
                        await refetchTimingStatus();
                      } catch {
                        /* noop */
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:border-teal-500/40 focus:outline-none focus:ring-1 focus:ring-teal-500/20 transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PreferenceCard>

        {/* ── Notifications ── */}
        <PreferenceCard accent="#10b981" glowColor="#10b981" icon={Volume2} title="Notifications" subtitle="Control what you receive" delay={0.25}>
          <div className="space-y-3">
            {([
              { key: "activityReminders" as const, label: "Activity Reminders", desc: "Scheduled activity alerts" },
              { key: "progressUpdates" as const, label: "Progress Updates", desc: "Weekly summaries & milestones" },
              { key: "motivationalMessages" as const, label: "Motivational Messages", desc: "Daily inspiration" },
            ]).map(setting => (
              <div key={setting.key} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{setting.label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{setting.desc}</p>
                </div>
                <Toggle
                  checked={preferences.notifications[setting.key] as boolean}
                  onChange={() => updateNotifications(setting.key, !preferences.notifications[setting.key])}
                  color="#10b981"
                />
              </div>
            ))}

            {/* Quiet Hours */}
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white">Quiet Hours</span>
                </div>
                <Toggle
                  checked={preferences.notifications.quietHoursEnabled}
                  onChange={() => updateNotifications("quietHoursEnabled", !preferences.notifications.quietHoursEnabled)}
                  color="#6366f1"
                />
              </div>
              <AnimatePresence>
                {preferences.notifications.quietHoursEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-2 gap-3 overflow-hidden">
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">From</label>
                      <input
                        type="time"
                        value={preferences.notifications.quietHoursStart}
                        onChange={(e) => updateNotifications("quietHoursStart", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1.5 block">To</label>
                      <input
                        type="time"
                        value={preferences.notifications.quietHoursEnd}
                        onChange={(e) => updateNotifications("quietHoursEnd", e.target.value)}
                        className="w-full px-3 py-2.5 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </PreferenceCard>

        {/* ── Display & Language ── */}
        <PreferenceCard accent="#0ea5e9" glowColor="#0ea5e9" icon={Globe} title="Display & Language" subtitle="Voice assistant language settings" delay={0.3}>
          <div className="space-y-4 relative z-50">
            <LanguageSelector
              selectedLanguage={preferences.display.language}
              onLanguageChange={(lang) => updateDisplay("language", lang)}
              compact={false}
              showPreview={true}
            />
          </div>
        </PreferenceCard>
      </div>
    </div>
  );
}
