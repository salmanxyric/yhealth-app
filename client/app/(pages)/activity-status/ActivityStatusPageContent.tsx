"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, List, BarChart3, Settings, Plus, Loader2 } from "lucide-react";
import { StatusIndicator } from "@/app/components/activity/StatusIndicator";
import { StatusCalendar } from "./components/StatusCalendar";
import { StatusTimeline } from "./components/StatusTimeline";
import { StatusStats } from "./components/StatusStats";
import { StatusPickerModal } from "./components/StatusPickerModal";
import { activityStatusService } from "@/src/shared/services/activity-status.service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DashboardSidebar,
  MobileBottomNav,
  TabId,
} from "../dashboard/components";
import { useAuth } from "@/app/context/AuthContext";

type InternalTabType = "calendar" | "timeline" | "stats" | "settings";

function ActivityStatusPageInner() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dashboard sidebar tab state
  const [sidebarActiveTab, setSidebarActiveTab] = useState<TabId>("activity");

  // Internal page tab state
  const [activeTab, setActiveTab] = useState<InternalTabType>("calendar");
  const [, setCurrentStatus] = useState<string>("working");
  const [isNewStatusModalOpen, setIsNewStatusModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle sidebar tab change
  const handleSidebarTabChange = useCallback(
    (tab: string) => {
      if (tab === "ai-coach") {
        router.push("/ai-coach");
      } else if (tab === "voice-assistant") {
        router.push("/voice-assistant");
      } else if (tab === "activity-status") {
        router.push("/activity-status");
      } else {
        setSidebarActiveTab(tab as TabId);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`/dashboard?${params.toString()}`, { scroll: false });
      }
    },
    [router, searchParams]
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/activity-status");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/immutability
      loadCurrentStatus();
    }
  }, [isAuthenticated]);

  const loadCurrentStatus = async () => {
    try {
      const response = await activityStatusService.getCurrent();
      if (response.success && response.data) {
        setCurrentStatus(response.data.status);
      }
    } catch (error) {
      console.error("Failed to load current status:", error);
    }
  };

  // Get today's date in YYYY-MM-DD format using local timezone
  const getTodayDate = (): string => {
    const today = new Date();
    // Use local timezone methods, not UTC
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleNewStatusSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    loadCurrentStatus();
  };

  const tabs = [
    { id: "calendar" as InternalTabType, label: "Calendar", icon: Calendar },
    { id: "timeline" as InternalTabType, label: "Timeline", icon: List },
    { id: "stats" as InternalTabType, label: "Statistics", icon: BarChart3 },
    { id: "settings" as InternalTabType, label: "Settings", icon: Settings },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-xl"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-slate-400">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <DashboardSidebar activeTab={sidebarActiveTab} onTabChange={handleSidebarTabChange} />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={sidebarActiveTab} onTabChange={handleSidebarTabChange} />

      {/* Main Content */}
      <div className="md:ml-64 min-h-screen pb-20 md:pb-0 overflow-x-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative min-h-full bg-gradient-to-br from-slate-950 to-slate-900">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-white">Activity Status</h1>
                  <p className="text-slate-400">
                    Track your daily activity status and mood
                  </p>
                </div>
                <StatusIndicator showLabel />
              </div>

              {/* Tabs */}
              <div className="flex gap-2 bg-slate-900/80 rounded-xl p-2 border border-white/10">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant="ghost"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-lg transition-all",
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </Button>
                  );
                })}
              </div>
            </motion.div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "calendar" && <StatusCalendar key={refreshKey} />}
              {activeTab === "timeline" && <StatusTimeline key={refreshKey} />}
              {activeTab === "stats" && <StatusStats key={refreshKey} />}
              {activeTab === "settings" && (
                <div className="bg-slate-900/80 rounded-xl border border-white/10 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white">Settings</h2>
                  <p className="text-slate-400">
                    Settings and preferences will be available here.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Floating Action Button */}
          <motion.div
            className="fixed bottom-24 md:bottom-6 right-6 z-50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <Button
              onClick={() => setIsNewStatusModalOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 transition-all"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </motion.div>

          {/* New Status Modal */}
          <StatusPickerModal
            open={isNewStatusModalOpen}
            onOpenChange={setIsNewStatusModalOpen}
            date={getTodayDate()}
            onSuccess={handleNewStatusSuccess}
          />
        </div>
      </div>
    </div>
  );
}

export default function ActivityStatusPageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <motion.div
              className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-xl"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-slate-400">Loading...</p>
        </motion.div>
      </div>
    }>
      <ActivityStatusPageInner />
    </Suspense>
  );
}
