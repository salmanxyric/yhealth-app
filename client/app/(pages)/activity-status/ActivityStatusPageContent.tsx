"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, List, BarChart3, Plus, Activity } from "lucide-react";
import { StatusIndicator } from "@/app/components/activity/StatusIndicator";
import { StatusCalendar } from "./components/StatusCalendar";
import { StatusTimeline } from "./components/StatusTimeline";
import { StatusStats } from "./components/StatusStats";
import { StatusPickerModal } from "./components/StatusPickerModal";
import { activityStatusService } from "@/src/shared/services/activity-status.service";
import { Button } from "@/components/ui/button";
import { DashboardUnderlineTabs } from "@/app/(pages)/dashboard/components/DashboardUnderlineTabs";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPageSkeleton } from "@/components/loading";
import { useAuth } from "@/app/context/AuthContext";

type InternalTabType = "calendar" | "timeline" | "stats";

function ActivityStatusPageInner() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();


  // Internal tab state

  // Internal page tab state
  const [activeTab, setActiveTab] = useState<InternalTabType>("calendar");
  const [, setCurrentStatus] = useState<string>("working");
  const [isNewStatusModalOpen, setIsNewStatusModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle sidebar tab change
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
  ];

  if (authLoading) {
    return (
      <DashboardPageSkeleton
        activeTab="activity-status"
        variant="heroTabsGrid"
      />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout activeTab="activity-status">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 -left-44 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 right-1/4 w-md h-112 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 15, 0], y: [0, -25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative min-h-full">
          <div className="container mx-auto max-w-7xl px-2.5 py-3 text-[11px] sm:px-4 sm:py-4 lg:text-xs xl:text-[13px]">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 sm:mb-4"
              transition={{ duration: 0.45 }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 rounded-xl border border-cyan-500/20 bg-cyan-500/15 p-2 sm:p-2.5">
                    <Activity className="h-4 w-4 text-cyan-300 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-[13px] font-semibold tracking-tight text-white sm:text-[15px] lg:text-base">
                      Activity Status
                    </h1>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400 sm:text-[11px] lg:text-xs">
                      Track your daily rhythm, activity, and mood.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex origin-right scale-90 items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-500/10 px-2 py-1 text-[10px] shadow-[0_0_14px_rgba(16,185,129,0.14)] sm:text-[11px]">
                    <StatusIndicator showLabel className="text-[10px] sm:text-[11px]" />
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </div>
                </div>
              </div>

              <div className="bal-surface px-1.5 py-1">
                <DashboardUnderlineTabs
                  layoutId="activityStatusSubTabUnderline"
                  activeId={activeTab}
                  onTabChange={(id) => setActiveTab(id as InternalTabType)}
                  className="[&_[role=tab]]:px-3 [&_[role=tab]]:py-2 [&_[role=tab]]:text-[11px] sm:[&_[role=tab]]:px-4 sm:[&_[role=tab]]:text-xs lg:[&_[role=tab]]:text-[13px] [&_svg]:h-3.5 [&_svg]:w-3.5"
                  tabs={tabs.map((t) => ({
                    id: t.id,
                    label: t.label,
                    icon: t.icon,
                  }))}
                />
              </div>
            </motion.div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {activeTab === "calendar" && <StatusCalendar key={refreshKey} />}
              {activeTab === "timeline" && <StatusTimeline key={refreshKey} />}
              {activeTab === "stats" && <StatusStats key={refreshKey} />}
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
              className="bal-fab"
              aria-label="Add status"
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
    </DashboardLayout>
  );
}

export default function ActivityStatusPageContent() {
  return (
    <Suspense
      fallback={
        <DashboardPageSkeleton
          activeTab="activity-status"
          variant="heroTabsGrid"
        />
      }
    >
      <ActivityStatusPageInner />
    </Suspense>
  );
}
