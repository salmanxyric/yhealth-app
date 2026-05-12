// ============================================
// Settings Types & Interfaces
// ============================================

// Types - Local UI state (simpler structure for form management)
export interface UserPreferences {
  coaching: {
    aiCoachPersona: string;
    style: string;
    intensity: string;
    preferredChannel: string;
    checkInFrequency: string;
    preferredCheckInTime: string;
    timezone: string;
    useEmojis: boolean;
    formalityLevel: string;
    encouragementLevel: string;
    messageStyle: string;
    focusAreas: string[];
  };
  notifications: {
    enabled: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
    /** Mirrors `notifications.types` on the API (weekly check-in / goal nudges). */
    weeklyReport: boolean;
    aiSuggestions: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  appearance: {
    theme: string;
    compactMode: boolean;
  };
  privacy: {
    shareProgress: boolean;
    anonymousAnalytics: boolean;
    healthProfileVisibility: 'disabled' | 'friends' | 'all' | 'custom';
    healthProfileAllowedUsers: string[];
  };
}

// API Response type (matches backend format)
export interface ApiPreferencesResponse {
  id: string;
  userId: string;
  notifications: {
    channels: Record<string, boolean>;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
    frequency: {
      maxPerDay: number;
      maxPerWeek: number;
    };
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
    aiPersonality: {
      useEmojis: boolean;
      formalityLevel: string;
      encouragementLevel: string;
    };
    focusAreas: string[];
    messageStyle?: string;
  };
  display: {
    units: {
      weight: string;
      height: string;
      distance: string;
      temperature: string;
    };
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
    healthProfileVisibility?: "disabled" | "friends" | "all" | "custom";
    healthProfileAllowedUsers?: string[];
  };
  integrations: {
    autoSyncEnabled: boolean;
    syncOnWifiOnly: boolean;
    backgroundSyncEnabled: boolean;
    dataRetentionDays: number;
  };
  voiceAssistant?: {
    avatarUrl: string | null;
    assistantName?: string;
  };
}

export interface ConnectedIntegration {
  provider: string;
  displayName: string;
  description: string;
  tier: number;
  dataTypes: string[];
  syncFrequencyMinutes: number;
  authType: string;
  scopes: string[];
  isConnected: boolean;
  lastSync?: string;
}

export type ProfileUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  role: string;
  isEmailVerified: boolean;
  onboardingStatus: string;
  createdAt: string;
  updatedAt: string;
} | null | undefined;

export const SETTINGS_SECTION_IDS = [
  "profile",
  "aiCoach",
  "voiceAssistant",
  "goals",
  "notifications",
  "communication",
  "integrations",
  "appearance",
  "accountability",
  "contracts",
  "subscription",
  "security",
  "privacy",
  "helpSupport",
  "account",
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

export function isValidSettingsSection(s: string | null): s is SettingsSectionId {
  return !!s && (SETTINGS_SECTION_IDS as readonly string[]).includes(s);
}

// ---------------------------------------------------------------------------
// Shared prop interfaces for extracted section components
// ---------------------------------------------------------------------------

/** WHOOP connection status as returned by the API. */
export interface WhoopStatus {
  isConnected: boolean;
  hasCredentials: boolean;
  hasPerUserCredentials?: boolean;
  clientIdMasked?: string;
  status?: string;
  lastSyncAt?: string;
  connectedAt?: string;
  webhookRegistered?: boolean;
  initialSyncComplete?: boolean;
  email?: string;
  whoopUserId?: number;
  firstName?: string;
  lastName?: string;
}

/** Spotify connection status as returned by the API. */
export interface SpotifyStatus {
  isConnected: boolean;
  isConfigured: boolean;
  hasCredentials: boolean;
  clientIdMasked?: string;
  credentialSource?: 'user' | 'env';
  displayName?: string;
  accountType?: string;
  connectedAt?: string;
  avatarUrl?: string;
}

/** WHOOP token info as returned by the API. */
export interface TokenInfo {
  hasTokens: boolean;
  accessTokenMasked?: string;
  refreshTokenMasked?: string;
  tokenExpiry?: string;
  status?: string;
}

/** Props shared by tab sections that need preferences state. */
export interface PreferencesProps {
  preferences: UserPreferences;
  updatePreference: (
    section: keyof UserPreferences,
    key: string,
    value: unknown,
  ) => void;
}

/** Props for sections that also need to set preferences directly. */
export interface PreferencesWithSetterProps extends PreferencesProps {
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

/** Props for the Integrations section. */
export interface IntegrationsSectionProps {
  whoopStatus: WhoopStatus | null;
  spotifyStatus: SpotifyStatus | null;
  integrations: ConnectedIntegration[];
  isSpotifyConnecting: boolean;
  setSpotifyStatus: React.Dispatch<React.SetStateAction<SpotifyStatus | null>>;
  setIsSpotifyConnecting: React.Dispatch<React.SetStateAction<boolean>>;
  fetchPreferences: () => Promise<void>;
}
