"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Mail,
  MessageSquare,
  Heart,
  Target,
  BarChart2,
  Flame,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  Save,
  Link as LinkIcon,
  Unlink,
  CheckCircle,
  Radio,
  Wifi,
  Trash2,
  Download,
  LogOut,
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
  X,
  Power,
  PowerOff,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useVoiceAssistant } from "@/app/context/VoiceAssistantContext";
import { useRouter } from "next/navigation";
import { LanguageSelector } from "@/components/common/language-selector";
import { api, ApiError } from "@/lib/api-client";
import { MainLayout } from "@/components/layout";
import { toast } from "sonner";
import { confirm } from "@/components/common/ConfirmDialog";

// Types - Local UI state (simpler structure for form management)
interface UserPreferences {
  coaching: {
    style: string;
    intensity: string;
    preferredChannel: string;
    checkInFrequency: string;
    preferredCheckInTime: string;
    timezone: string;
  };
  notifications: {
    enabled: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
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
  };
}

// API Response type (matches backend format)
interface ApiPreferencesResponse {
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

// Transform API response to local UI state
function apiToLocalPreferences(apiPrefs: ApiPreferencesResponse): UserPreferences {
  const channels = apiPrefs.notifications?.channels || {};
  return {
    coaching: {
      style: apiPrefs.coaching?.style || "supportive",
      intensity: apiPrefs.coaching?.intensity || "moderate",
      preferredChannel: apiPrefs.coaching?.preferredChannel || "push",
      checkInFrequency: apiPrefs.coaching?.checkInFrequency || "daily",
      preferredCheckInTime: apiPrefs.coaching?.preferredCheckInTime || "09:00",
      timezone: apiPrefs.coaching?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    notifications: {
      enabled: Object.values(channels).some(Boolean),
      email: channels.email ?? true,
      push: channels.push ?? true,
      sms: channels.sms ?? false,
      whatsapp: channels.whatsapp ?? false,
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
    },
  };
}

// Transform local UI state to API format for saving
function localToApiPreferences(localPrefs: UserPreferences, assistantName?: string) {
  return {
    coaching: {
      style: localPrefs.coaching.style,
      intensity: localPrefs.coaching.intensity,
      preferredChannel: localPrefs.coaching.preferredChannel,
      checkInFrequency: localPrefs.coaching.checkInFrequency,
      preferredCheckInTime: localPrefs.coaching.preferredCheckInTime,
      timezone: localPrefs.coaching.timezone,
    },
    notifications: {
      channels: {
        push: localPrefs.notifications.push,
        email: localPrefs.notifications.email,
        sms: localPrefs.notifications.sms,
        whatsapp: localPrefs.notifications.whatsapp,
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
    },
    voiceAssistant: assistantName ? {
      assistantName: assistantName.trim() || 'Aurea',
    } : undefined,
  };
}

interface ConnectedIntegration {
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

const coachingStyles = [
  { id: "supportive", label: "Supportive", icon: <Heart className="w-4 h-4" /> },
  { id: "direct", label: "Direct", icon: <Target className="w-4 h-4" /> },
  { id: "analytical", label: "Analytical", icon: <BarChart2 className="w-4 h-4" /> },
  { id: "motivational", label: "Motivational", icon: <Flame className="w-4 h-4" /> },
];

const intensityLevels = [
  { id: "light", label: "Light Touch", desc: "2-3 check-ins/week" },
  { id: "moderate", label: "Balanced", desc: "5-7 check-ins/week" },
  { id: "intensive", label: "High Engagement", desc: "10-14 check-ins/week" },
];

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const {
    assistantName,
    setAssistantName,
    selectedLanguage,
    setSelectedLanguage,
  } = useVoiceAssistant();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("coaching");
  const [integrations, setIntegrations] = useState<ConnectedIntegration[]>([]);
  const [whoopStatus, setWhoopStatus] = useState<{
    isConnected: boolean;
    hasCredentials: boolean;
    status?: string;
    lastSyncAt?: string;
    connectedAt?: string;
    webhookRegistered?: boolean;
    initialSyncComplete?: boolean;
    email?: string;
    whoopUserId?: number;
    firstName?: string;
    lastName?: string;
  } | null>(null);
  
  // Token management state
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenData, setTokenData] = useState({
    accessToken: '',
    refreshToken: '',
    tokenExpiry: '',
  });
  const [showTokens, setShowTokens] = useState({ access: false, refresh: false });
  const [tokenInfo, setTokenInfo] = useState<{
    hasTokens: boolean;
    accessTokenMasked?: string;
    refreshTokenMasked?: string;
    tokenExpiry?: string;
    status?: string;
  } | null>(null);
  
  // Credentials management state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsData, setCredentialsData] = useState({
    clientId: '',
    clientSecret: '',
  });
  const [showCredentials, setShowCredentials] = useState({ clientId: false, clientSecret: false });
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);

  const [preferences, setPreferences] = useState<UserPreferences>({
    coaching: {
      style: "supportive",
      intensity: "moderate",
      preferredChannel: "push",
      checkInFrequency: "daily",
      preferredCheckInTime: "09:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    notifications: {
      enabled: true,
      email: true,
      push: true,
      sms: false,
      whatsapp: false,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "07:00",
      },
    },
    appearance: {
      theme: "dark",
      compactMode: false,
    },
    privacy: {
      shareProgress: false,
      anonymousAnalytics: true,
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/settings");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ preferences: ApiPreferencesResponse }>(
        "/preferences"
      );
      if (response.success && response.data?.preferences) {
        // Transform API response to local UI state
        const localPrefs = apiToLocalPreferences(response.data.preferences);
        setPreferences(localPrefs);
        
        // Load assistant name from preferences if available
        if (response.data.preferences.voiceAssistant?.assistantName) {
          setAssistantName(response.data.preferences.voiceAssistant.assistantName);
        }
      }

      // Fetch integrations
      const intResponse = await api.get<{
        integrations: ConnectedIntegration[];
      }>("/integrations");
      if (intResponse.success && intResponse.data) {
        setIntegrations(intResponse.data.integrations || []);
      }

      // Fetch WHOOP status
      try {
        const whoopResponse = await api.get<{
          isConnected: boolean;
          hasCredentials: boolean;
          status?: string;
          lastSyncAt?: string;
          connectedAt?: string;
          webhookRegistered?: boolean;
          initialSyncComplete?: boolean;
          email?: string;
          whoopUserId?: number;
          firstName?: string;
          lastName?: string;
        }>("/integrations/whoop/status");
        if (whoopResponse.success && whoopResponse.data) {
          console.log("WHOOP status response:", whoopResponse.data);
          setWhoopStatus(whoopResponse.data);
        } else {
          console.log("WHOOP status response failed or empty:", whoopResponse);
          setWhoopStatus({ isConnected: false, hasCredentials: false });
        }
      } catch (err) {
        // WHOOP not configured yet or error fetching status
        console.error("Failed to fetch WHOOP status:", err);
        setWhoopStatus({ isConnected: false, hasCredentials: false });
      }

      // Fetch token info if connected
      try {
        const tokenResponse = await api.get<{
          hasTokens: boolean;
          accessTokenMasked?: string;
          refreshTokenMasked?: string;
          tokenExpiry?: string;
          status?: string;
        }>("/integrations/whoop/tokens");
        if (tokenResponse.success && tokenResponse.data) {
          setTokenInfo(tokenResponse.data);
        } else {
          setTokenInfo({ hasTokens: false });
        }
      } catch (err) {
        // Token info is optional, don't show error
        console.log("Token info not available:", err);
        setTokenInfo({ hasTokens: false });
      }
    } catch (err) {
      if (err instanceof ApiError && err.code !== "NOT_FOUND") {
        console.error("Failed to load preferences:", err);
      }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated, fetchPreferences]);

  // Save preferences
  const savePreferences = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Transform local UI state to API format before saving (include assistant name)
      const apiPayload = localToApiPreferences(preferences, assistantName);
      await api.patch("/preferences", apiPayload);
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to save settings");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Update preference helper
  const updatePreference = (
    section: keyof UserPreferences,
    key: string,
    value: unknown
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const sections = [
    { id: "coaching", label: "Coaching", icon: <Heart className="w-5 h-5" /> },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: <LinkIcon className="w-5 h-5" />,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <Palette className="w-5 h-5" />,
    },
    {
      id: "voiceAssistant",
      label: "Voice Assistant",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    { id: "privacy", label: "Privacy", icon: <Shield className="w-5 h-5" /> },
    { id: "account", label: "Account", icon: <User className="w-5 h-5" /> },
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-400">Loading settings...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4"
          >
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-sm">Back</span>
            </button>
          </motion.div>

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Settings
                  </span>
                </h1>
                <p className="text-slate-400 mt-1">
                  Manage your preferences and account
                </p>
              </div>

            <button
              onClick={savePreferences}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Changes
            </button>
          </div>

          {/* Success/Error Messages */}
          {(success || error) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-xl ${
                success
                  ? "bg-green-500/20 border border-green-500/30"
                  : "bg-red-500/20 border border-red-500/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {success ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <p className={success ? "text-green-400" : "text-red-400"}>
                  {success || error}
                </p>
              </div>
            </motion.div>
          )}
        </motion.header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <motion.nav
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 shrink-0"
          >
            <div className="sticky top-8 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeSection === section.id
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.label}</span>
                  {activeSection === section.id && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </motion.nav>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            {/* Coaching Settings */}
            {activeSection === "coaching" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    Coaching Style
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {coachingStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() =>
                          updatePreference("coaching", "style", style.id)
                        }
                        className={`p-4 rounded-xl border text-left transition-all ${
                          preferences.coaching.style === style.id
                            ? "bg-purple-500/20 border-purple-500/40"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              preferences.coaching.style === style.id
                                ? "bg-purple-500/30 text-purple-400"
                                : "bg-white/10 text-slate-400"
                            }`}
                          >
                            {style.icon}
                          </div>
                          <span
                            className={
                              preferences.coaching.style === style.id
                                ? "text-white font-medium"
                                : "text-slate-300"
                            }
                          >
                            {style.label}
                          </span>
                          {preferences.coaching.style === style.id && (
                            <Check className="w-4 h-4 text-purple-400 ml-auto" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    Engagement Level
                  </h2>
                  <div className="space-y-3">
                    {intensityLevels.map((level) => (
                      <button
                        key={level.id}
                        onClick={() =>
                          updatePreference("coaching", "intensity", level.id)
                        }
                        className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                          preferences.coaching.intensity === level.id
                            ? "bg-purple-500/20 border-purple-500/40"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div>
                          <p
                            className={
                              preferences.coaching.intensity === level.id
                                ? "text-white font-medium"
                                : "text-slate-300"
                            }
                          >
                            {level.label}
                          </p>
                          <p className="text-sm text-slate-500">{level.desc}</p>
                        </div>
                        {preferences.coaching.intensity === level.id && (
                          <Check className="w-5 h-5 text-purple-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    Check-in Time
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm text-slate-400 mb-2 block">
                        Preferred Time
                      </label>
                      <input
                        type="time"
                        value={preferences.coaching.preferredCheckInTime}
                        onChange={(e) =>
                          updatePreference(
                            "coaching",
                            "preferredCheckInTime",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-slate-400 mb-2 block">
                        Timezone
                      </label>
                      <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-slate-500" />
                        {preferences.coaching.timezone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">
                      Notification Channels
                    </h2>
                    <button
                      onClick={() =>
                        updatePreference(
                          "notifications",
                          "enabled",
                          !preferences.notifications.enabled
                        )
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        preferences.notifications.enabled
                          ? "bg-purple-500"
                          : "bg-slate-700"
                      }`}
                    >
                      <motion.div
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                        animate={{
                          left: preferences.notifications.enabled
                            ? "calc(100% - 20px)"
                            : "4px",
                        }}
                      />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        id: "push",
                        label: "Push Notifications",
                        icon: <Smartphone className="w-5 h-5" />,
                        key: "push",
                      },
                      {
                        id: "email",
                        label: "Email",
                        icon: <Mail className="w-5 h-5" />,
                        key: "email",
                      },
                      {
                        id: "sms",
                        label: "SMS",
                        icon: <MessageSquare className="w-5 h-5" />,
                        key: "sms",
                      },
                      {
                        id: "whatsapp",
                        label: "WhatsApp",
                        icon: <MessageSquare className="w-5 h-5" />,
                        key: "whatsapp",
                      },
                    ].map((channel) => (
                      <div
                        key={channel.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white/10 text-slate-400">
                            {channel.icon}
                          </div>
                          <span className="text-slate-300">{channel.label}</span>
                        </div>
                        <button
                          onClick={() =>
                            updatePreference(
                              "notifications",
                              channel.key,
                              !preferences.notifications[
                                channel.key as keyof typeof preferences.notifications
                              ]
                            )
                          }
                          disabled={!preferences.notifications.enabled}
                          className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${
                            preferences.notifications[
                              channel.key as keyof typeof preferences.notifications
                            ]
                              ? "bg-purple-500"
                              : "bg-slate-700"
                          }`}
                        >
                          <motion.div
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                            animate={{
                              left: preferences.notifications[
                                channel.key as keyof typeof preferences.notifications
                              ]
                                ? "calc(100% - 20px)"
                                : "4px",
                            }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Moon className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-lg font-semibold text-white">
                        Quiet Hours
                      </h2>
                    </div>
                    <button
                      onClick={() =>
                        setPreferences((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            quietHours: {
                              ...prev.notifications.quietHours,
                              enabled: !prev.notifications.quietHours.enabled,
                            },
                          },
                        }))
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        preferences.notifications.quietHours.enabled
                          ? "bg-indigo-500"
                          : "bg-slate-700"
                      }`}
                    >
                      <motion.div
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                        animate={{
                          left: preferences.notifications.quietHours.enabled
                            ? "calc(100% - 20px)"
                            : "4px",
                        }}
                      />
                    </button>
                  </div>

                  {preferences.notifications.quietHours.enabled && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm text-slate-400 mb-2 block">
                          From
                        </label>
                        <input
                          type="time"
                          value={preferences.notifications.quietHours.start}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                quietHours: {
                                  ...prev.notifications.quietHours,
                                  start: e.target.value,
                                },
                              },
                            }))
                          }
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm text-slate-400 mb-2 block">
                          To
                        </label>
                        <input
                          type="time"
                          value={preferences.notifications.quietHours.end}
                          onChange={(e) =>
                            setPreferences((prev) => ({
                              ...prev,
                              notifications: {
                                ...prev.notifications,
                                quietHours: {
                                  ...prev.notifications.quietHours,
                                  end: e.target.value,
                                },
                              },
                            }))
                          }
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeSection === "integrations" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    Connected Apps
                  </h2>

                  {/* WHOOP Integration */}
                  <div className={`mb-6 p-4 rounded-xl border transition-all ${
                    whoopStatus?.isConnected 
                      ? 'bg-green-500/5 border-green-500/30' 
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Animated Connection Icon */}
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            whoopStatus?.isConnected
                              ? 'bg-green-500/20 border-2 border-green-500/50'
                              : whoopStatus?.hasCredentials
                              ? 'bg-yellow-500/20 border-2 border-yellow-500/50'
                              : 'bg-white/10 border border-white/10'
                          }`}>
                            {whoopStatus?.isConnected ? (
                              <motion.div
                                animate={{
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 5, -5, 0],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                <CheckCircle className="w-6 h-6 text-green-400" />
                              </motion.div>
                            ) : (
                              <LinkIcon className={`w-6 h-6 ${
                                whoopStatus?.hasCredentials ? 'text-yellow-400' : 'text-slate-400'
                              }`} />
                            )}
                          </div>
                          
                          {/* Pulsing ring animation when connected */}
                          {whoopStatus?.isConnected && (
                            <>
                              <motion.div
                                className="absolute inset-0 rounded-xl border-2 border-green-400/50"
                                animate={{
                                  scale: [1, 1.3, 1.3],
                                  opacity: [0.6, 0, 0],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeOut",
                                }}
                              />
                              <motion.div
                                className="absolute inset-0 rounded-xl border-2 border-green-400/30"
                                animate={{
                                  scale: [1, 1.5, 1.5],
                                  opacity: [0.4, 0, 0],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  delay: 0.5,
                                  ease: "easeOut",
                                }}
                              />
                            </>
                          )}
                          
                          {/* Socket connection indicator */}
                          {whoopStatus?.isConnected && (
                            <motion.div
                              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.7, 1],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              <motion.div
                                className="absolute inset-0 bg-green-400 rounded-full"
                                animate={{
                                  scale: [1, 2, 2],
                                  opacity: [0.8, 0, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeOut",
                                }}
                              />
                            </motion.div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium">WHOOP</p>
                            {whoopStatus?.isConnected && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1"
                              >
                                <Radio className="w-2.5 h-2.5 fill-green-400 text-green-400" />
                                Connected
                              </motion.span>
                            )}
                            {whoopStatus?.hasCredentials && !whoopStatus?.isConnected && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                Credentials Set
                              </span>
                            )}
                            {whoopStatus?.webhookRegistered && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                <Wifi className="w-2.5 h-2.5" />
                                Webhook Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Advanced recovery and strain data
                          </p>
                          {whoopStatus?.isConnected && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-2 space-y-1"
                            >
                              {whoopStatus?.email && (
                                <p className="text-xs text-slate-400">
                                  Email: <span className="text-white">{whoopStatus.email}</span>
                                </p>
                              )}
                              {whoopStatus?.lastSyncAt && (
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Last synced: {new Date(whoopStatus.lastSyncAt).toLocaleString()}
                                </p>
                              )}
                              {whoopStatus?.status && (
                                <p className="text-xs text-slate-400">
                                  Status: <span className="capitalize text-green-400">{whoopStatus.status}</span>
                                </p>
                              )}
                            </motion.div>
                          )}
                          {!whoopStatus?.isConnected && whoopStatus?.lastSyncAt && (
                            <p className="text-xs text-slate-400 mt-1">
                              Last synced: {new Date(whoopStatus.lastSyncAt).toLocaleString()}
                            </p>
                          )}
                          {!whoopStatus?.isConnected && whoopStatus?.status && (
                            <p className="text-xs text-slate-400 mt-1">
                              Status: <span className="capitalize">{whoopStatus.status}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Token Management Button - Always visible */}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              // Fetch unmasked tokens for form prefilling
                              const unmaskedResponse = await api.get<{
                                hasTokens: boolean;
                                accessToken?: string;
                                refreshToken?: string;
                                tokenExpiry?: string;
                                tokenExpiryISO?: string;
                                status?: string;
                              }>("/integrations/whoop/tokens?unmasked=true");
                              
                              // Also fetch masked tokens for display
                              const maskedResponse = await api.get<{
                                hasTokens: boolean;
                                accessTokenMasked?: string;
                                refreshTokenMasked?: string;
                                tokenExpiry?: string;
                                status?: string;
                              }>("/integrations/whoop/tokens");
                              
                              if (unmaskedResponse.success && unmaskedResponse.data?.hasTokens) {
                                // Prefill form with actual tokens
                                setTokenData({
                                  accessToken: unmaskedResponse.data.accessToken || '',
                                  refreshToken: unmaskedResponse.data.refreshToken || '',
                                  tokenExpiry: unmaskedResponse.data.tokenExpiry || '',
                                });
                                // Set masked info for display
                                if (maskedResponse.success && maskedResponse.data) {
                                  setTokenInfo(maskedResponse.data);
                                } else {
                                  setTokenInfo({
                                    hasTokens: true,
                                    accessTokenMasked: '***',
                                    refreshTokenMasked: '***',
                                    tokenExpiry: unmaskedResponse.data.tokenExpiryISO,
                                    status: unmaskedResponse.data.status,
                                  });
                                }
                              } else {
                                // No tokens exist
                                setTokenData({ accessToken: '', refreshToken: '', tokenExpiry: '' });
                                if (maskedResponse.success && maskedResponse.data) {
                                  setTokenInfo(maskedResponse.data);
                                } else {
                                  setTokenInfo({ hasTokens: false });
                                }
                              }
                            } catch (err) {
                              // If no tokens exist, that's okay - show modal for adding
                              console.log("No tokens found or error fetching:", err);
                              setTokenData({ accessToken: '', refreshToken: '', tokenExpiry: '' });
                              setTokenInfo({ hasTokens: false });
                            }
                            // Always show modal
                            setShowTokenModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30 transition-colors text-sm font-medium flex items-center gap-2"
                          title="Manage Tokens (Add/Update/Delete/View)"
                        >
                          <Key className="w-4 h-4" />
                          <span>Manage Tokens</span>
                        </button>

                        {!whoopStatus?.isConnected ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const response = await api.post<{
                                  authUrl: string;
                                  state: string;
                                }>("/integrations/oauth/initiate", {
                                  provider: "whoop",
                                });
                                if (response.success && response.data?.authUrl) {
                                  window.location.href = response.data.authUrl;
                                } else {
                                  toast.error("Failed to initiate WHOOP connection. Please ensure WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET are configured.");
                                }
                              } catch (err: unknown) {
                                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                                console.error("Failed to initiate OAuth:", err);
                                toast.error(errorMessage || "Failed to connect WHOOP. Please check server configuration.");
                              }
                            }}
                            disabled={!whoopStatus?.hasCredentials}
                            className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {whoopStatus?.hasCredentials ? "Connect WHOOP" : "WHOOP Not Configured"}
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                await api.delete("/integrations/whoop");
                                await fetchPreferences();
                                toast.success("WHOOP disconnected successfully");
                              } catch (err) {
                                console.error("Failed to disconnect:", err);
                                toast.error("Failed to disconnect WHOOP");
                              }
                            }}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Disconnect WHOOP"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Connection Status Card - Only show when connected */}
                    {whoopStatus?.isConnected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-3 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <motion.div
                              animate={{
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center"
                            >
                              <Wifi className="w-4 h-4 text-green-400" />
                            </motion.div>
                            {/* Data flow animation */}
                            <motion.div
                              className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full"
                              animate={{
                                x: [0, 8, 0],
                                opacity: [0, 1, 0],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">Live Connection Active</p>
                            <p className="text-xs text-green-400/80 mt-0.5">
                              Data is syncing in real-time from your WHOOP device
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {!whoopStatus?.isConnected && !whoopStatus?.hasCredentials && (
                      <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-xs text-yellow-400 mb-3">
                          WHOOP OAuth credentials are not configured. Please add your WHOOP Client ID and Client Secret below to connect.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCredentialsModal(true);
                            setCredentialsData({ clientId: '', clientSecret: '' });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Key className="w-4 h-4" />
                          Add Credentials
                        </button>
                      </div>
                    )}
                    {whoopStatus?.isConnected && !whoopStatus?.hasCredentials && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-400">
                          Connected using app-level credentials. You can add your own credentials to manage your connection independently.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Other Integrations */}
                  <div className="space-y-4">
                    {integrations
                      .filter((i) => i.provider !== "whoop")
                      .map((integration) => (
                        <div
                          key={integration.provider}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                              <LinkIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {integration.displayName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {integration.description}
                              </p>
                              {integration.lastSync && (
                                <p className="text-xs text-slate-400 mt-1">
                                  Last synced:{" "}
                                  {new Date(integration.lastSync).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {integration.isConnected ? (
                            <button className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                              <Unlink className="w-4 h-4" />
                            </button>
                          ) : (
                            <button className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm font-medium">
                              Connect
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    Theme
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
                      { id: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
                      {
                        id: "system",
                        label: "System",
                        icon: <Settings className="w-5 h-5" />,
                      },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() =>
                          updatePreference("appearance", "theme", theme.id)
                        }
                        className={`p-4 rounded-xl border text-center transition-all ${
                          preferences.appearance.theme === theme.id
                            ? "bg-purple-500/20 border-purple-500/40"
                            : "bg-white/5 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span
                            className={
                              preferences.appearance.theme === theme.id
                                ? "text-purple-400"
                                : "text-slate-400"
                            }
                          >
                            {theme.icon}
                          </span>
                          <span
                            className={
                              preferences.appearance.theme === theme.id
                                ? "text-white"
                                : "text-slate-300"
                            }
                          >
                            {theme.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Compact Mode
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Use a more condensed layout
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updatePreference(
                          "appearance",
                          "compactMode",
                          !preferences.appearance.compactMode
                        )
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        preferences.appearance.compactMode
                          ? "bg-purple-500"
                          : "bg-slate-700"
                      }`}
                    >
                      <motion.div
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                        animate={{
                          left: preferences.appearance.compactMode
                            ? "calc(100% - 20px)"
                            : "4px",
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Voice Assistant */}
            {activeSection === "voiceAssistant" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    Voice Assistant
                  </h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Customize your AI coach name and language for the voice assistant.
                  </p>
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="assistant-name"
                        className="block text-sm font-medium text-white mb-2"
                      >
                        Assistant name
                      </label>
                      <input
                        id="assistant-name"
                        type="text"
                        value={assistantName}
                        onChange={(e) => setAssistantName(e.target.value)}
                        onBlur={async () => {
                          // Save to database when user leaves the input field
                          try {
                            await api.patch("/preferences", {
                              voiceAssistant: {
                                assistantName: assistantName.trim() || 'Aurea',
                              },
                            });
                            toast.success("Assistant name saved");
                          } catch (err) {
                            console.error("Failed to save assistant name:", err);
                            toast.error("Failed to save assistant name");
                          }
                        }}
                        placeholder="e.g. YHealth Coach"
                        className="w-full max-w-md px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                      />
                      <p className="text-slate-500 text-xs mt-1">
                        This name is shown in the voice assistant and the coach will call itself by this name (e.g. &quot;{assistantName} is ready. Tap to start&quot;).
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Language
                      </label>
                      <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={setSelectedLanguage}
                        compact={false}
                        showPreview={true}
                      />
                      <p className="text-slate-500 text-xs mt-2">
                        The assistant will speak and listen in the selected language.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy */}
            {activeSection === "privacy" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    Data & Privacy
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div>
                        <p className="text-white font-medium">
                          Share Progress with Coach
                        </p>
                        <p className="text-sm text-slate-400">
                          Allow your AI coach to see detailed progress
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updatePreference(
                            "privacy",
                            "shareProgress",
                            !preferences.privacy.shareProgress
                          )
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences.privacy.shareProgress
                            ? "bg-purple-500"
                            : "bg-slate-700"
                        }`}
                      >
                        <motion.div
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                          animate={{
                            left: preferences.privacy.shareProgress
                              ? "calc(100% - 20px)"
                              : "4px",
                          }}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div>
                        <p className="text-white font-medium">
                          Anonymous Analytics
                        </p>
                        <p className="text-sm text-slate-400">
                          Help improve yHealth with anonymous usage data
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updatePreference(
                            "privacy",
                            "anonymousAnalytics",
                            !preferences.privacy.anonymousAnalytics
                          )
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences.privacy.anonymousAnalytics
                            ? "bg-purple-500"
                            : "bg-slate-700"
                        }`}
                      >
                        <motion.div
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                          animate={{
                            left: preferences.privacy.anonymousAnalytics
                              ? "calc(100% - 20px)"
                              : "4px",
                          }}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Your Data
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-colors">
                      <Download className="w-4 h-4" />
                      Export Data
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      Delete All Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Account */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    Account Information
                  </h2>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5">
                      <label className="text-sm text-slate-400 mb-1 block">
                        Name
                      </label>
                      <p className="text-white">
                        {user?.firstName
                          ? `${user.firstName} ${user.lastName || ""}`.trim()
                          : "Not set"}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5">
                      <label className="text-sm text-slate-400 mb-1 block">
                        Email
                      </label>
                      <p className="text-white">{user?.email || "Not set"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Session
                  </h2>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>

                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6">
                  <h2 className="text-lg font-semibold text-red-400 mb-2">
                    Danger Zone
                  </h2>
                  <p className="text-sm text-slate-400 mb-4">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </motion.main>
        </div>
        </div>
      </div>

      {/* Token Management Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  Manage WHOOP Tokens
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Add, update, or delete your WHOOP access and refresh tokens
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTokenModal(false);
                  setTokenData({ accessToken: '', refreshToken: '', tokenExpiry: '' });
                  setShowTokens({ access: false, refresh: false });
                }}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Token Info - View Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                View Current Tokens
              </h4>
              {tokenInfo?.hasTokens ? (
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-white">Token Status</p>
                    <div className="flex items-center gap-2">
                      {tokenInfo.status === 'paused' ? (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Disabled
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-400">Access Token: </span>
                      <span className="text-white font-mono">{tokenInfo.accessTokenMasked || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Refresh Token: </span>
                      <span className="text-white font-mono">{tokenInfo.refreshTokenMasked || 'N/A'}</span>
                    </div>
                    {tokenInfo.tokenExpiry && (
                      <div>
                        <span className="text-slate-400">Expires: </span>
                        <span className="text-white">
                          {new Date(tokenInfo.tokenExpiry).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-sm text-blue-400">
                    No tokens found. Add your WHOOP access and refresh tokens below.
                  </p>
                </div>
              )}
            </div>

            {/* Add/Update Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Save className="w-4 h-4 text-purple-400" />
                {tokenInfo?.hasTokens ? 'Update Tokens' : 'Add Tokens'}
              </h4>
            </div>

            {/* Token Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setIsSaving(true);
                  
                  // Convert datetime-local format to ISO string if provided
                  let tokenExpiryISO: string | undefined = undefined;
                  if (tokenData.tokenExpiry) {
                    // datetime-local format is "YYYY-MM-DDTHH:mm", convert to ISO
                    const date = new Date(tokenData.tokenExpiry);
                    if (!isNaN(date.getTime())) {
                      tokenExpiryISO = date.toISOString();
                    }
                  }
                  
                  const response = await api.post("/integrations/whoop/tokens", {
                    accessToken: tokenData.accessToken,
                    refreshToken: tokenData.refreshToken || undefined,
                    tokenExpiry: tokenExpiryISO,
                  });
                  
                  if (response.success) {
                    toast.success("Tokens saved successfully");
                    // Keep modal open and form prefilled (user might want to edit again)
                    await fetchPreferences();
                    // Refresh token info (both masked for display and unmasked for form)
                    const [maskedResponse, unmaskedResponse] = await Promise.all([
                      api.get<{
                        hasTokens: boolean;
                        accessTokenMasked?: string;
                        refreshTokenMasked?: string;
                        tokenExpiry?: string;
                        status?: string;
                      }>("/integrations/whoop/tokens"),
                      api.get<{
                        hasTokens: boolean;
                        accessToken?: string;
                        refreshToken?: string;
                        tokenExpiry?: string;
                        tokenExpiryISO?: string;
                        status?: string;
                      }>("/integrations/whoop/tokens?unmasked=true"),
                    ]);
                    
                    if (maskedResponse.success && maskedResponse.data) {
                      setTokenInfo(maskedResponse.data);
                    }
                    
                    if (unmaskedResponse.success && unmaskedResponse.data?.hasTokens) {
                      // Update form with latest saved values
                      setTokenData({
                        accessToken: unmaskedResponse.data.accessToken || tokenData.accessToken,
                        refreshToken: unmaskedResponse.data.refreshToken || tokenData.refreshToken,
                        tokenExpiry: unmaskedResponse.data.tokenExpiry || tokenData.tokenExpiry,
                      });
                    }
                  }
                } catch (err) {
                  const errorMessage = err instanceof ApiError ? err.message : 'Failed to save tokens';
                  toast.error(errorMessage);
                } finally {
                  setIsSaving(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Access Token <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showTokens.access ? "text" : "password"}
                    value={tokenData.accessToken}
                    onChange={(e) => setTokenData({ ...tokenData, accessToken: e.target.value })}
                    placeholder="Enter access token"
                    required
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokens({ ...showTokens, access: !showTokens.access })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showTokens.access ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Refresh Token (optional)
                </label>
                <div className="relative">
                  <input
                    type={showTokens.refresh ? "text" : "password"}
                    value={tokenData.refreshToken}
                    onChange={(e) => setTokenData({ ...tokenData, refreshToken: e.target.value })}
                    placeholder="Enter refresh token (optional)"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokens({ ...showTokens, refresh: !showTokens.refresh })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showTokens.refresh ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Token Expiry (optional)
                </label>
                <input
                  type="datetime-local"
                  value={tokenData.tokenExpiry}
                  onChange={(e) => setTokenData({ ...tokenData, tokenExpiry: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving || !tokenData.accessToken.trim()}
                  className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : tokenInfo?.hasTokens ? (
                    <>
                      <Save className="w-4 h-4" />
                      Update Tokens
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Add Tokens
                    </>
                  )}
                </button>
                
                {tokenInfo?.hasTokens && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const newStatus = tokenInfo.status === 'paused' ? false : true;
                          const response = await api.patch("/integrations/whoop/tokens/disable", {
                            disabled: !newStatus,
                          });
                          
                          if (response.success) {
                            toast.success(`Tokens ${newStatus ? 'enabled' : 'disabled'} successfully`);
                            const tokenResponse = await api.get<{
                              hasTokens: boolean;
                              accessTokenMasked?: string;
                              refreshTokenMasked?: string;
                              tokenExpiry?: string;
                              status?: string;
                            }>("/integrations/whoop/tokens");
                            if (tokenResponse.success && tokenResponse.data) {
                              setTokenInfo(tokenResponse.data);
                            } else {
                              setTokenInfo({ hasTokens: false });
                            }
                            await fetchPreferences();
                          }
                        } catch (err) {
                          const errorMessage = err instanceof ApiError ? err.message : 'Failed to toggle tokens';
                          toast.error(errorMessage);
                        }
                      }}
                      className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                      title={tokenInfo.status === 'paused' ? 'Enable tokens' : 'Disable tokens'}
                    >
                      {tokenInfo.status === 'paused' ? (
                        <>
                          <Power className="w-4 h-4" />
                          Enable
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-4 h-4" />
                          Disable
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Delete WHOOP Tokens",
                          description: "Are you sure you want to delete your tokens? This will disconnect your WHOOP integration.",
                          confirmText: "Delete",
                          cancelText: "Cancel",
                          variant: "destructive",
                        });

                        if (!confirmed) {
                          return;
                        }
                        try {
                          const response = await api.delete("/integrations/whoop/tokens");
                          if (response.success) {
                            toast.success("Tokens deleted successfully");
                            setShowTokenModal(false);
                            setTokenInfo({ hasTokens: false });
                            setTokenData({ accessToken: '', refreshToken: '', tokenExpiry: '' });
                            await fetchPreferences();
                          }
                        } catch (err) {
                          const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete tokens';
                          toast.error(errorMessage);
                        }
                      }}
                      className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors flex items-center gap-2 border border-red-500/30"
                      title="Delete tokens"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Credentials Management Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 rounded-xl border border-slate-700 p-6 max-w-lg w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  WHOOP Credentials
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Add your WHOOP Client ID and Client Secret
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCredentialsData({ clientId: '', clientSecret: '' });
                  setShowCredentials({ clientId: false, clientSecret: false });
                }}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setIsSavingCredentials(true);
                  const response = await api.post("/integrations/whoop/credentials", {
                    clientId: credentialsData.clientId,
                    clientSecret: credentialsData.clientSecret,
                  });
                  
                  if (response.success) {
                    toast.success("Credentials saved successfully");
                    setShowCredentialsModal(false);
                    setCredentialsData({ clientId: '', clientSecret: '' });
                    setShowCredentials({ clientId: false, clientSecret: false });
                    await fetchPreferences();
                  }
                } catch (err) {
                  const errorMessage = err instanceof ApiError ? err.message : 'Failed to save credentials';
                  toast.error(errorMessage);
                } finally {
                  setIsSavingCredentials(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client ID <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCredentials.clientId ? "text" : "password"}
                    value={credentialsData.clientId}
                    onChange={(e) => setCredentialsData({ ...credentialsData, clientId: e.target.value })}
                    placeholder="Enter WHOOP Client ID"
                    required
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredentials({ ...showCredentials, clientId: !showCredentials.clientId })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCredentials.clientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Secret <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCredentials.clientSecret ? "text" : "password"}
                    value={credentialsData.clientSecret}
                    onChange={(e) => setCredentialsData({ ...credentialsData, clientSecret: e.target.value })}
                    placeholder="Enter WHOOP Client Secret"
                    required
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredentials({ ...showCredentials, clientSecret: !showCredentials.clientSecret })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCredentials.clientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSavingCredentials}
                  className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingCredentials ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Credentials
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setCredentialsData({ clientId: '', clientSecret: '' });
                    setShowCredentials({ clientId: false, clientSecret: false });
                  }}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}
