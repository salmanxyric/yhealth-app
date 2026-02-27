"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect, useState, useCallback } from "react";
import {
  ChevronRight,
  Sparkles,
  Bell,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { AILoader } from "@/app/components/preloader/preloader";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import {
  TabId,
  OverviewTab,
  GoalsTab,
  PlansTab,
  WorkoutsTab,
  NutritionTab,
  ProgressTab,
  ActivityTab,
  AchievementsTab,
  AICoachTab,
  VoiceAssistantTab,
  VoiceCallTab,
  NotificationsTab,
  ChatHistoryTab,
  PreferencesTab,
  SettingsTab,
  ProfileTab,
  WellbeingTab,
} from "./components";
import { DashboardLayout } from "@/components/layout";
import { SubscriptionAccessProvider } from "@/app/context/SubscriptionAccessContext";
import { TrialBanner } from "@/components/subscription/SubscriptionGate";
import dynamic from "next/dynamic";

// Dynamically import ActivityStatusPage to avoid layout conflicts
const ActivityStatusPage = dynamic(
  () => import("@/app/(pages)/activity-status/page"),
  { ssr: false }
);

// Types
interface ActivityData {
  id: string;
  type: string;
  title: string;
  description: string;
  targetValue?: number;
  targetUnit?: string;
  preferredTime: string;
  duration?: number;
  status: "pending" | "completed" | "skipped";
  log?: {
    status: string;
    completedAt?: string;
  };
}

interface Plan {
  id: string;
  name: string;
  description: string;
  pillar: string;
  goalCategory: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  currentWeek: number;
  status: string;
  overallProgress: number;
  activities: ActivityData[];
  weeklyFocuses: Array<{
    week: number;
    theme: string;
    focus: string;
    expectedOutcome: string;
  }>;
}

interface TodayData {
  planId: string;
  date: string;
  dayOfWeek: string;
  activities: ActivityData[];
  completedCount: number;
  totalCount: number;
  isRestDay?: boolean;
}

interface WeeklySummary {
  week: number;
  focus?: {
    theme: string;
    focus: string;
    expectedOutcome: string;
  };
  stats: {
    totalActivities: number;
    completed: number;
    skipped: number;
    pending: number;
    completionRate: number;
  };
}

function DashboardContent() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state from URL
  const [activeTab, setActiveTab] = useState<string>(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      [
        "overview",
        "goals",
        "plans",
        "workouts",
        "nutrition",
        "progress",
        "activity",
        "activity-status",
        "achievements",
        "ai-coach",
        "voice-assistant",
        "voice-call",
        "notifications",
        "chat-history",
        "chat",
        // "messages",
        "preferences",
        "settings",
        "profile",
        "wellbeing",
      ].includes(tab)
    ) {
      return tab as TabId;
    }
    return "overview";
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [weekCompletionRate, setWeekCompletionRate] = useState(0);
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // State for active call context (passed to VoiceAssistantTab)
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [activeCallPurpose, setActiveCallPurpose] = useState<string | null>(null);

  // Verify Stripe checkout session on success redirect (when webhook may not have run)
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const subscriptionSuccess = searchParams.get("subscription") === "success";
    if (!sessionId || !subscriptionSuccess || !isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        await api.post("/subscription/verify-session", { session_id: sessionId });
        if (!cancelled) {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("session_id");
          params.delete("subscription");
          const qs = params.toString();
          router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
        }
      } catch {
        // Leave params so user can retry or see error
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, isAuthenticated, router]);

  // Handle tab change
  const handleTabChange = useCallback(
    (tab: string) => {
      // Navigate to separate pages for these tabs
      if (tab === "ai-coach") {
        router.push("/ai-coach");
      } else if (tab === "voice-assistant") {
        router.push("/voice-assistant");
      } else if (tab === "activity-status") {
        router.push("/activity-status");
      } else if (tab === "chat") {
        router.push("/chat");
      } else if (tab === "messages") {
        router.push("/messages");
      } else if (tab === "goals") {
        router.push("/goals");
      } else if (tab === "notifications") {
        router.push("/notifications");
      } else if (tab === "profile") {
        router.push("/profile");
      } else if (tab === "settings") {
        router.push("/settings");
      } else if (tab === "workouts") {
        router.push("/workouts");
      } else if (tab === "nutrition") {
        router.push("/nutrition");
      } else if (tab === "progress") {
        router.push("/progress");
      } else if (tab === "activity") {
        router.push("/activity");
      } else if (tab === "achievements") {
        router.push("/achievements");
      } else {
        setActiveTab(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`/dashboard?${params.toString()}`, { scroll: false });
      }
    },
    [router, searchParams]
  );

  // Listen for switchToVoiceAssistant event from VoiceCallTab
  useEffect(() => {
    const handleSwitchToVoiceAssistant = (event: CustomEvent<{ callId: string; purpose?: string }>) => {
      const { callId, purpose } = event.detail;
      console.log("[Dashboard] Received switchToVoiceAssistant event:", { callId, purpose });
      setActiveCallId(callId);
      setActiveCallPurpose(purpose || null);
      setActiveTab("voice-assistant");
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "voice-assistant");
      if (callId) params.set("callId", callId);
      const newUrl = `/dashboard?${params.toString()}`;
      console.log("[Dashboard] Navigating to:", newUrl);
      router.push(newUrl, { scroll: false });
    };

    window.addEventListener('switchToVoiceAssistant', handleSwitchToVoiceAssistant as EventListener);
    return () => {
      window.removeEventListener('switchToVoiceAssistant', handleSwitchToVoiceAssistant as EventListener);
    };
  }, [router, searchParams]);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch active plan
      const planResponse = await api.get<{
        plan: Plan;
        todayActivities: ActivityData[];
        weekCompletionRate: number;
      }>("/plans/active");

      if (planResponse.success && planResponse.data) {
        setPlan(planResponse.data.plan);
        setWeekCompletionRate(planResponse.data.weekCompletionRate);
      }

      // Fetch today's activities
      const todayResponse = await api.get<TodayData>("/plans/today");
      if (todayResponse.success && todayResponse.data) {
        setTodayData(todayResponse.data);
      }

      // Fetch weekly summary if we have a plan
      if (planResponse.data?.plan?.id) {
        const summaryResponse = await api.get<WeeklySummary>(
          `/plans/${planResponse.data.plan.id}/summary/weekly`
        );
        if (summaryResponse.success && summaryResponse.data) {
          setWeeklySummary(summaryResponse.data);
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "NOT_FOUND") {
          // No active plan - redirect to onboarding
          setError("no_plan");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load dashboard data");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Only depend on isAuthenticated - fetchDashboardData is stable

  // Log activity completion
  const handleActivityComplete = async (activityId: string) => {
    if (!plan) return;

    try {
      const response = await api.post(`/plans/${plan.id}/activities/${activityId}/log`, {
        status: "completed",
        scheduledDate: new Date().toISOString(),
      });

      if (response.success) {
        // Optimistically update todayData - no need to refetch entire dashboard
        setTodayData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            completedCount: prev.completedCount + 1,
            activities: prev.activities.map((a) =>
              a.id === activityId ? { ...a, status: "completed" as const } : a
            ),
          };
        });
        // Note: Removed fetchDashboardData() call here to prevent full page reload
        // The optimistic update is sufficient for UI feedback
      }
    } catch (err) {
      console.error("Failed to log activity:", err);
      // Revert optimistic update on error
      fetchDashboardData().catch(() => {
        // Silently fail - user can manually refresh
      });
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            plan={plan}
            todayData={todayData}
            weeklySummary={weeklySummary}
            weekCompletionRate={weekCompletionRate}
            onActivityComplete={handleActivityComplete}
            onRefresh={fetchDashboardData}
          />
        );
      case "goals":
        return <GoalsTab />;
      case "plans":
        return <PlansTab />;
      case "workouts":
        return <WorkoutsTab />;
      case "nutrition":
        return <NutritionTab />;
      case "progress":
        return <ProgressTab />;
      case "activity":
        return <ActivityTab />;
      case "activity-status":
        return <ActivityStatusPage />;
      case "achievements":
        return <AchievementsTab />;
      case "ai-coach":
        return <AICoachTab />;
      case "voice-assistant":
        return <VoiceAssistantTab callId={activeCallId} callPurpose={activeCallPurpose} onCallEnd={() => { setActiveCallId(null); setActiveCallPurpose(null); }} />;
      case "voice-call":
        return <VoiceCallTab />;
      case "notifications":
        return <NotificationsTab />;
      case "chat-history":
        return <ChatHistoryTab />;
      case "preferences":
        return <PreferencesTab />;
      case "settings":
        return <SettingsTab />;
      case "profile":
        return <ProfileTab />;
      case "wellbeing":
        return <WellbeingTab />;
      default:
        return (
          <OverviewTab
            plan={plan}
            todayData={todayData}
            weeklySummary={weeklySummary}
            weekCompletionRate={weekCompletionRate}
            onActivityComplete={handleActivityComplete}
            onRefresh={fetchDashboardData}
          />
        );
    }
  };

  if (authLoading || isLoading) {
    return <AILoader text="Initializing" />;
  }

  if (error === "no_plan") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Let&apos;s Get Started!
          </h1>
          <p className="text-slate-400 mb-8">
            Complete your onboarding to get a personalized health plan tailored
            just for you.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Start Onboarding
            <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Something went wrong
          </h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <SubscriptionAccessProvider>
      <DashboardLayout activeTab={activeTab}>
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Trial banner when in free trial */}
          <div className="mb-4">
            <TrialBanner />
          </div>
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {greeting},{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {user?.firstName || "there"}
                  </span>
                </h1>
                <p className="text-slate-400 mt-1">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleTabChange("notifications")}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                </button>
                <button
                  onClick={fetchDashboardData}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.header>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </DashboardLayout>
    </SubscriptionAccessProvider>
  );
}

// Loading fallback component
function DashboardLoading() {
  return <AILoader text="Loading" />;
}

// Main export with Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
