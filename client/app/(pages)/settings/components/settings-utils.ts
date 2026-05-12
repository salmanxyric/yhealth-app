import type { UserPreferences, ApiPreferencesResponse } from './settings-types';
import { personaFromCoachingStyle } from '@shared/types/domain/coach-persona';

// ============================================
// Transform API response to local UI state
// ============================================

export function apiToLocalPreferences(apiPrefs: ApiPreferencesResponse): UserPreferences {
  const channels = apiPrefs.notifications?.channels || {};
  const types = (apiPrefs.notifications?.types || {}) as Record<string, boolean>;
  const typeBool = (camel: string, snake: string, fallback: boolean) =>
    types[camel] ?? types[snake] ?? fallback;
  return {
    coaching: {
      style: apiPrefs.coaching?.style || "supportive",
      aiCoachPersona:
        apiPrefs.coaching?.aiCoachPersona ||
        personaFromCoachingStyle(apiPrefs.coaching?.style || "supportive"),
      intensity: apiPrefs.coaching?.intensity || "moderate",
      preferredChannel: apiPrefs.coaching?.preferredChannel || "push",
      checkInFrequency: apiPrefs.coaching?.checkInFrequency || "daily",
      preferredCheckInTime: apiPrefs.coaching?.preferredCheckInTime || "09:00",
      timezone: apiPrefs.coaching?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      useEmojis: apiPrefs.coaching?.aiPersonality?.useEmojis ?? true,
      formalityLevel: apiPrefs.coaching?.aiPersonality?.formalityLevel || "balanced",
      encouragementLevel: apiPrefs.coaching?.aiPersonality?.encouragementLevel || "medium",
      messageStyle: apiPrefs.coaching?.messageStyle || "friendly",
      focusAreas: apiPrefs.coaching?.focusAreas || [],
    },
    notifications: {
      enabled: Object.values(channels).some(Boolean),
      email: channels.email ?? true,
      push: channels.push ?? true,
      sms: channels.sms ?? false,
      whatsapp: channels.whatsapp ?? false,
      weeklyReport: typeBool("weeklyReport", "weekly_report", true),
      aiSuggestions: typeBool("aiSuggestions", "ai_suggestions", true),
      quietHours: {
        enabled: apiPrefs.notifications?.quietHours?.enabled ?? false,
        start: apiPrefs.notifications?.quietHours?.start || "22:00",
        end: apiPrefs.notifications?.quietHours?.end || "07:00",
      },
    },
    appearance: {
      theme: apiPrefs.display?.theme || "dark",
      compactMode: false, // Not stored in backend, local only
    },
    privacy: {
      shareProgress: apiPrefs.privacy?.shareProgressWithCoach ?? false,
      anonymousAnalytics: apiPrefs.privacy?.allowAnonymousDataForResearch ?? true,
      healthProfileVisibility: apiPrefs.privacy?.healthProfileVisibility || 'friends',
      healthProfileAllowedUsers: apiPrefs.privacy?.healthProfileAllowedUsers || [],
    },
  };
}

// ============================================
// Transform local UI state to API format for saving
// ============================================

export function localToApiPreferences(localPrefs: UserPreferences, assistantName?: string) {
  return {
    coaching: {
      style: localPrefs.coaching.style,
      aiCoachPersona: localPrefs.coaching.aiCoachPersona,
      intensity: localPrefs.coaching.intensity,
      preferredChannel: localPrefs.coaching.preferredChannel,
      checkInFrequency: localPrefs.coaching.checkInFrequency,
      preferredCheckInTime: localPrefs.coaching.preferredCheckInTime,
      timezone: localPrefs.coaching.timezone,
      aiPersonality: {
        useEmojis: localPrefs.coaching.useEmojis,
        formalityLevel: localPrefs.coaching.formalityLevel,
        encouragementLevel: localPrefs.coaching.encouragementLevel,
      },
      focusAreas: localPrefs.coaching.focusAreas,
      messageStyle: localPrefs.coaching.messageStyle,
    },
    notifications: {
      channels: {
        push: localPrefs.notifications.push,
        email: localPrefs.notifications.email,
        sms: localPrefs.notifications.sms,
        whatsapp: localPrefs.notifications.whatsapp,
      },
      types: {
        weeklyReport: localPrefs.notifications.weeklyReport,
        aiSuggestions: localPrefs.notifications.aiSuggestions,
      },
      quietHours: {
        enabled: localPrefs.notifications.quietHours.enabled,
        start: localPrefs.notifications.quietHours.start,
        end: localPrefs.notifications.quietHours.end,
      },
    },
    display: {
      theme: localPrefs.appearance.theme,
    },
    privacy: {
      shareProgressWithCoach: localPrefs.privacy.shareProgress,
      allowAnonymousDataForResearch: localPrefs.privacy.anonymousAnalytics,
      healthProfileVisibility: localPrefs.privacy.healthProfileVisibility,
      healthProfileAllowedUsers: localPrefs.privacy.healthProfileAllowedUsers,
    },
    voiceAssistant: assistantName ? {
      assistantName: assistantName.trim() || 'Cia',
    } : undefined,
  };
}

// ============================================
// Profile Utilities
// ============================================

export function formatProfileDate(value: string | null | undefined, fallback = "—") {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 150 ? age : null;
}

export function calculateProfileCompletion(user: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  avatarUrl: string | null;
}): number {
  const fields = [
    user.firstName,
    user.lastName,
    user.email,
    user.phone,
    user.dateOfBirth,
    user.gender,
    user.avatarUrl,
  ];
  const filled = fields.filter((v) => v && String(v).trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

// ============================================
// Prayer Time Utilities
// ============================================

export function formatPrayerTime(value: string): string {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 5);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function todayISODate(): string {
  return new Date().toISOString().split('T')[0] || '';
}
