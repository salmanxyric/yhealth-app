"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback, Suspense } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  MessageSquare,
  Loader2,
  Check,
  AlertCircle,
  Save,
  Link as LinkIcon,
  Brain,
  Lock,
  CreditCard,
  HelpCircle,
  Crosshair,
  Target,
  Send,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useVoiceAssistant } from "@/app/context/VoiceAssistantContext";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { DashboardSidebar, MobileBottomNav } from "../dashboard/components";
import { toast } from "sonner";
import { DashboardPageSkeleton } from "@/components/loading";

import {
  // Types
  type UserPreferences,
  type ApiPreferencesResponse,
  type ConnectedIntegration,
  type SettingsSectionId,
  type WhoopStatus,
  type SpotifyStatus,
  isValidSettingsSection,
  // Constants
  REDUCE_MOTION_STORAGE_KEY,
  // Utils
  apiToLocalPreferences,
  localToApiPreferences,
  // Section components
  ChangePasswordModal,
  ProfileSettingsSection,
  AICoachSettingsSection,
  NotificationsSettingsSection,
  CommunicationSettingsSection,
  IntegrationsSection,
  AppearanceSettingsSection,
  VoiceAssistantSettingsSection,
  GoalsSettingsSection,
  PrivacySettingsSection,
  AccountabilitySettingsSection,
  ContractsSettingsSection,
  SubscriptionSettingsSection,
  SecuritySettingsSection,
  HelpSupportSettingsSection,
  AccountSettingsSection,
  SettingsLoadingSkeleton,
} from "./components";

// ---------------------------------------------------------------------------
// Section nav config
// ---------------------------------------------------------------------------
const sections = [
  { id: "profile", label: "Profile", icon: <User className="w-5 h-5" />, gradient: "from-blue-500 to-indigo-500" },
  { id: "aiCoach", label: "AI Coach", icon: <Brain className="w-5 h-5" />, gradient: "from-sky-500 to-emerald-600" },
  { id: "voiceAssistant", label: "Voice Assistant", icon: <MessageSquare className="w-5 h-5" />, gradient: "from-indigo-500 to-violet-500" },
  { id: "goals", label: "Goals & Plans", icon: <Crosshair className="w-5 h-5" />, gradient: "from-teal-500 to-cyan-500" },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-5 h-5" />, gradient: "from-blue-500 to-cyan-500" },
  { id: "communication", label: "Communication", icon: <Send className="w-5 h-5" />, gradient: "from-violet-500 to-fuchsia-500" },
  { id: "integrations", label: "Integrations", icon: <LinkIcon className="w-5 h-5" />, gradient: "from-green-500 to-emerald-500" },
  { id: "appearance", label: "Appearance", icon: <Palette className="w-5 h-5" />, gradient: "from-orange-500 to-amber-500" },
  { id: "accountability", label: "Accountability", icon: <Shield className="w-5 h-5" />, gradient: "from-orange-500 to-amber-500" },
  { id: "contracts", label: "Contracts", icon: <Target className="w-5 h-5" />, gradient: "from-cyan-500 to-emerald-500" },
  { id: "subscription", label: "Subscription", icon: <CreditCard className="w-5 h-5" />, gradient: "from-amber-500 to-yellow-500" },
  { id: "security", label: "Security", icon: <Lock className="w-5 h-5" />, gradient: "from-red-500 to-rose-500" },
  { id: "privacy", label: "Privacy", icon: <Shield className="w-5 h-5" />, gradient: "from-rose-500 to-emerald-600" },
  { id: "helpSupport", label: "Help & Support", icon: <HelpCircle className="w-5 h-5" />, gradient: "from-sky-500 to-blue-500" },
  { id: "account", label: "Account", icon: <User className="w-5 h-5" />, gradient: "from-slate-400 to-slate-500" },
] as const;

// ---------------------------------------------------------------------------
// Main inner component
// ---------------------------------------------------------------------------
function SettingsPageInner() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const {
    assistantName,
    setAssistantName,
    selectedLanguage,
    setSelectedLanguage,
  } = useVoiceAssistant();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---- UI state ----
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(() => {
    const s = searchParams.get("section");
    return isValidSettingsSection(s) ? s : "aiCoach";
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [reduceMotionPref, setReduceMotionPref] = useState(false);
  const [sidebarActiveTab, setSidebarActiveTab] = useState("settings");

  // ---- Integration state ----
  const [integrations, setIntegrations] = useState<ConnectedIntegration[]>([]);
  const [whoopStatus, setWhoopStatus] = useState<WhoopStatus | null>(null);
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus | null>(null);
  const [isSpotifyConnecting, setIsSpotifyConnecting] = useState(false);

  // ---- Preferences state ----
  const [preferences, setPreferences] = useState<UserPreferences>({
    coaching: {
      aiCoachPersona: "gentle_friend",
      style: "supportive",
      intensity: "moderate",
      preferredChannel: "push",
      checkInFrequency: "daily",
      preferredCheckInTime: "09:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      useEmojis: true,
      formalityLevel: "balanced",
      encouragementLevel: "medium",
      messageStyle: "friendly",
      focusAreas: [],
    },
    notifications: {
      enabled: true,
      email: true,
      push: true,
      sms: false,
      whatsapp: false,
      weeklyReport: true,
      aiSuggestions: true,
      quietHours: { enabled: false, start: "22:00", end: "07:00" },
    },
    appearance: { theme: "dark", compactMode: false },
    privacy: {
      shareProgress: false,
      anonymousAnalytics: true,
      healthProfileVisibility: "friends",
      healthProfileAllowedUsers: [],
    },
  });

  // ---- Sidebar navigation ----
  const handleTabChange = useCallback(
    (tab: string) => {
      if (tab === "ai-coach") { router.push("/ai-coach"); return; }
      if (tab === "voice-assistant") { router.push("/voice-assistant"); return; }
      if (tab === "activity-status") { router.push("/activity-status"); return; }
      if (tab === "settings") return;
      setSidebarActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`/dashboard?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // ---- Auth redirect ----
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/settings");
    }
  }, [isAuthenticated, authLoading, router]);

  // ---- Spotify OAuth callback ----
  useEffect(() => {
    const callback = searchParams.get("callback");
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (callback === "spotify" && code && state) {
      (async () => {
        try {
          setIsSpotifyConnecting(true);
          setActiveSection("integrations");
          const response = await api.post<{
            isConnected: boolean;
            displayName?: string;
            accountType?: string;
            connectedAt?: string;
            avatarUrl?: string;
          }>("/spotify/auth/callback", { code, state });
          if (response.success && response.data) {
            setSpotifyStatus((prev) => ({
              isConnected: response.data?.isConnected ?? true,
              isConfigured: true,
              hasCredentials: prev?.hasCredentials ?? true,
              displayName: response.data?.displayName,
              accountType: response.data?.accountType,
              connectedAt: response.data?.connectedAt,
              avatarUrl: response.data?.avatarUrl,
              clientIdMasked: prev?.clientIdMasked,
              credentialSource: prev?.credentialSource,
            }));
            toast.success(`Spotify connected as ${response.data.displayName || "user"}`);
          }
        } catch (err) {
          console.error("Spotify OAuth callback failed:", err);
          toast.error("Failed to connect Spotify. Please try again.");
        } finally {
          setIsSpotifyConnecting(false);
          const params = new URLSearchParams(searchParams.toString());
          params.delete("callback");
          params.delete("code");
          params.delete("state");
          const cleanUrl = params.toString() ? `/settings?${params.toString()}` : "/settings";
          router.replace(cleanUrl);
        }
      })();
    }
  }, [searchParams, router]);

  // ---- Spotify post-exchange redirect ----
  useEffect(() => {
    const spotify = searchParams.get("spotify");
    if (!spotify) return;
    (async () => {
      setActiveSection("integrations");
      if (spotify === "connected") {
        toast.success("Spotify connected successfully");
        await fetchPreferences();
      } else if (spotify === "error") {
        const detail = searchParams.get("spotifyError") || "";
        toast.error(detail ? `Spotify connection failed: ${detail.replace(/_/g, " ")}` : "Spotify connection failed. Please try again.");
      }
      const params = new URLSearchParams(searchParams.toString());
      params.delete("spotify");
      params.delete("spotifyError");
      const cleanUrl = params.toString() ? `/settings?${params.toString()}` : "/settings";
      router.replace(cleanUrl);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  // ---- Deep link ----
  useEffect(() => {
    const s = searchParams.get("section");
    if (isValidSettingsSection(s)) setActiveSection(s);
  }, [searchParams]);

  // ---- Reduce motion ----
  useEffect(() => {
    try { setReduceMotionPref(localStorage.getItem(REDUCE_MOTION_STORAGE_KEY) === "1"); } catch { setReduceMotionPref(false); }
  }, []);

  const setReduceMotion = useCallback((enabled: boolean) => {
    setReduceMotionPref(enabled);
    try {
      if (enabled) { localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, "1"); document.documentElement.classList.add("reduce-motion"); }
      else { localStorage.removeItem(REDUCE_MOTION_STORAGE_KEY); document.documentElement.classList.remove("reduce-motion"); }
    } catch { /* ignore */ }
  }, []);

  // ---- Section navigation ----
  const goToSettingsSection = useCallback(
    (id: SettingsSectionId) => {
      setActiveSection(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", id);
      router.replace(`/settings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // ---- Fetch preferences + integration status ----
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ preferences: ApiPreferencesResponse }>("/preferences");
      if (response.success && response.data?.preferences) {
        setPreferences(apiToLocalPreferences(response.data.preferences));
        if (response.data.preferences.voiceAssistant?.assistantName) {
          setAssistantName(response.data.preferences.voiceAssistant.assistantName);
        }
      }
      const intResponse = await api.get<{ integrations: ConnectedIntegration[] }>("/integrations");
      if (intResponse.success && intResponse.data) setIntegrations(intResponse.data.integrations || []);

      try {
        const wr = await api.get<WhoopStatus>("/integrations/whoop/status");
        setWhoopStatus(wr.success && wr.data ? wr.data : { isConnected: false, hasCredentials: false });
      } catch { setWhoopStatus({ isConnected: false, hasCredentials: false }); }

      try {
        const sr = await api.get<SpotifyStatus>("/spotify/auth/status");
        setSpotifyStatus(sr.success && sr.data ? sr.data : { isConnected: false, isConfigured: false, hasCredentials: false });
      } catch { setSpotifyStatus({ isConnected: false, isConfigured: false, hasCredentials: false }); }
    } catch (err) {
      if (err instanceof ApiError && err.code !== "NOT_FOUND") console.error("Failed to load preferences:", err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => { if (isAuthenticated) fetchPreferences(); }, [isAuthenticated, fetchPreferences]);

  // ---- Save preferences ----
  const savePreferences = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.patch("/preferences", localToApiPreferences(preferences, assistantName));
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Helpers ----
  const handleLogout = async () => {
    try { await logout(); router.push("/"); } catch (err) { console.error("Logout failed:", err); }
  };

  const updatePreference = (section: keyof UserPreferences, key: string, value: unknown) => {
    setPreferences((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };

  // ---- Loading state ----
  if (authLoading || isLoading) {
    return <SettingsLoadingSkeleton sidebarActiveTab={sidebarActiveTab} onTabChange={handleTabChange} />;
  }

  // ---- Render ----
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="hidden md:block">
        <DashboardSidebar activeTab={sidebarActiveTab} onTabChange={handleTabChange} />
      </div>
      <MobileBottomNav activeTab={sidebarActiveTab} onTabChange={handleTabChange} />

      <div className="md:ml-64 min-h-screen pb-20 md:pb-0 overflow-x-hidden">
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">Settings</span>
                </h1>
                <p className="text-slate-400 mt-1">Manage your preferences and account</p>
              </div>
              <button
                onClick={savePreferences}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-emerald-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-sky-500/20"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>

            {(success || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-xl backdrop-blur-xl ${success ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"}`}
              >
                <div className="flex items-center gap-2">
                  {success ? <Check className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
                  <p className={success ? "text-green-400" : "text-red-400"}>{success || error}</p>
                </div>
              </motion.div>
            )}
          </motion.header>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Section sidebar */}
            <motion.nav initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:w-64 shrink-0">
              <div className="sticky top-8 space-y-1">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => goToSettingsSection(section.id as SettingsSectionId)}
                      className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${isActive ? "bg-white/[0.05] text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.03]"}`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="settings-section-indicator"
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-sky-500 to-emerald-600"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className={isActive ? `bg-gradient-to-r ${section.gradient} bg-clip-text text-transparent` : ""}>{section.icon}</span>
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.nav>

            {/* Main content area - delegates to extracted section components */}
            <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1 min-w-0">
              {activeSection === "profile" && <ProfileSettingsSection user={user} />}
              {activeSection === "aiCoach" && (
                <AICoachSettingsSection
                  preferences={preferences}
                  updatePreference={updatePreference}
                  setPreferences={setPreferences}
                  isSaving={isSaving}
                />
              )}
              {activeSection === "voiceAssistant" && (
                <VoiceAssistantSettingsSection
                  assistantName={assistantName}
                  setAssistantName={setAssistantName}
                  selectedLanguage={selectedLanguage}
                  setSelectedLanguage={setSelectedLanguage}
                />
              )}
              {activeSection === "goals" && <GoalsSettingsSection preferences={preferences} updatePreference={updatePreference} />}
              {activeSection === "notifications" && (
                <NotificationsSettingsSection
                  preferences={preferences}
                  updatePreference={updatePreference}
                  setPreferences={setPreferences}
                />
              )}
              {activeSection === "communication" && <CommunicationSettingsSection />}
              {activeSection === "integrations" && (
                <IntegrationsSection
                  whoopStatus={whoopStatus}
                  spotifyStatus={spotifyStatus}
                  integrations={integrations}
                  isSpotifyConnecting={isSpotifyConnecting}
                  setSpotifyStatus={setSpotifyStatus}
                  setIsSpotifyConnecting={setIsSpotifyConnecting}
                  fetchPreferences={fetchPreferences}
                />
              )}
              {activeSection === "appearance" && <AppearanceSettingsSection preferences={preferences} updatePreference={updatePreference} />}
              {activeSection === "accountability" && <AccountabilitySettingsSection />}
              {activeSection === "contracts" && <ContractsSettingsSection />}
              {activeSection === "privacy" && (
                <PrivacySettingsSection
                  preferences={preferences}
                  updatePreference={updatePreference}
                  reduceMotionPref={reduceMotionPref}
                  setReduceMotion={setReduceMotion}
                />
              )}
              {activeSection === "subscription" && <SubscriptionSettingsSection />}
              {activeSection === "security" && <SecuritySettingsSection onChangePassword={() => setShowChangePassword(true)} />}
              {activeSection === "helpSupport" && <HelpSupportSettingsSection />}
              {activeSection === "account" && <AccountSettingsSection user={user} onLogout={handleLogout} />}
            </motion.main>
          </div>
        </div>
      </div>

      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </div>
  );
}

export default function SettingsPageContent() {
  return (
    <Suspense fallback={<DashboardPageSkeleton activeTab="settings" variant="compact" />}>
      <SettingsPageInner />
    </Suspense>
  );
}
