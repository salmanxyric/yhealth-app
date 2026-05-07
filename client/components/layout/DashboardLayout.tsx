"use client";

import { ReactNode, useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardSidebar, MobileBottomNav } from "@/app/(pages)/dashboard/components";
import { useAuth } from "@/app/context/AuthContext";
import { useSubscriptionAccessOptional } from "@/app/context/SubscriptionAccessContext";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { SubscriptionPaywallOverlay } from "@/components/subscription/SubscriptionGate";
import { PausedSubscriptionOverlay } from "@/components/subscription/PausedSubscriptionOverlay";
import { IncompleteSubscriptionOverlay } from "@/components/subscription/IncompleteSubscriptionOverlay";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab?: string;
  className?: string;
}

export function DashboardLayout({
  children,
  activeTab,
  className = "",
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasRole } = useAuth();
  const { hasAccess, isLoading } = useSubscriptionAccessOptional();
  const { bundle } = useEntitlements();
  const subStatus = bundle?.subscription.status ?? 'none';
  const locked = !isLoading && !hasAccess && !hasRole("admin");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Determine active tab from pathname if not provided
  const getActiveTab = (): string => {
    if (activeTab) return activeTab;
    
    // Extract tab from pathname
    if (pathname === "/dashboard") {
      // Check for dashboard tabs from URL search params (client-side only)
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        return tab || "overview";
      }
      return "overview";
    }
    if (pathname === "/whoop") return "whoop";
    if (pathname === "/goals") return "goals";
    if (pathname === "/workouts") return "workouts";
    if (pathname === "/exercises" || pathname.startsWith("/exercises")) return "exercises";
    if (pathname === "/nutrition") return "nutrition";
    if (pathname === "/progress") return "progress";
    // Check activity-status before activity to avoid false matches
    if (pathname === "/activity-status" || pathname.startsWith("/activity-status")) return "activity-status";
    if (pathname === "/activity" || pathname.startsWith("/activity")) return "activity";
    if (pathname === "/achievements") return "achievements";
    if (pathname.startsWith("/competitions")) return "competitions";
    if (pathname.startsWith("/leaderboard")) return "leaderboard";
    if (pathname === "/ai-coach") return "ai-coach";
    if (pathname === "/chat") return "chat";
    if (pathname === "/notifications") return "notifications";
    if (pathname === "/quick-notes") return "quick-notes";
    if (pathname === "/settings") return "settings";
    if (pathname === "/profile") return "profile";
    if (pathname === "/preferences") return "preferences";
    if (pathname === "/help") return "help";
    if (pathname.startsWith("/money-map")) return "money-map";
    if (pathname.startsWith("/life-areas")) return "life-areas";
    if (pathname.startsWith("/knowledge-graph")) return "knowledge-graph";
    if (pathname.startsWith("/voice-assistant")) return "voice-assistant";
    if (pathname.startsWith("/voice-call")) return "call-coach";
    if (pathname.startsWith("/settings/billing")) return "billing";
    if (pathname.startsWith("/subscription")) return "subscription";
    if (pathname.startsWith("/upgrade")) return "upgrade";
    if (pathname.startsWith("/contracts")) return "contracts";
    if (pathname.startsWith("/community")) return "community";
    if (pathname.startsWith("/chat-history")) return "chat-history";
    if (pathname.startsWith("/webinars")) return "webinars";
    if (pathname.startsWith("/admin")) return "admin-panel";

    return "overview";
  };

  const handleTabChange = useCallback(
    (tab: string) => {
      // Handle navigation for different tab types
      if (tab.startsWith("/")) {
        router.push(tab);
      } else if (tab === "overview") {
        router.push("/dashboard");
      } else if (["workouts", "exercises", "nutrition", "progress", "activity", "achievements", "leaderboard", "competitions", "contracts", "community", "chat-history", "webinars", "quick-notes"].includes(tab)) {
        // Navigate to separate pages for these tabs
        router.push(`/${tab}`);
      } else {
        // Fallback to query param for remaining tabs
        router.push(`/dashboard?tab=${tab}`);
      }
    },
    [router]
  );

  return (
    <div className={`min-h-screen bg-slate-950 ${className}`}>
      {/* Sidebar - Desktop (blurred/disabled when locked) */}
      <div className={`hidden md:block transition-all duration-300 ${locked ? 'pointer-events-none select-none opacity-60' : ''}`}>
        <div className={locked ? 'blur-[2px]' : ''}>
          <DashboardSidebar
            activeTab={getActiveTab()}
            onTabChange={handleTabChange}
            onCollapsedChange={setSidebarCollapsed}
            disabled={locked}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation (disabled when locked) */}
      <div className={`md:hidden transition-all duration-300 ${locked ? 'pointer-events-none select-none opacity-60' : ''}`}>
        <div className={locked ? 'blur-[2px]' : ''}>
          <MobileBottomNav
            activeTab={getActiveTab()}
            onTabChange={handleTabChange}
            disabled={locked}
          />
        </div>
      </div>

      {/* Main Content (blurred when locked, overlay on top) */}
      <div className={`${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'} pb-20 md:pb-0 overflow-x-hidden transition-all duration-300 ${locked ? 'pointer-events-none select-none' : ''}`}>
        <div className={locked ? 'blur-md' : ''}>
          <DashboardHeader />
          {children}
        </div>
      </div>

      {/* Paywall overlay when subscription required */}
      {locked && subStatus === 'paused' && <PausedSubscriptionOverlay />}
      {locked && subStatus === 'incomplete' && <IncompleteSubscriptionOverlay />}
      {locked && subStatus !== 'paused' && subStatus !== 'incomplete' && <SubscriptionPaywallOverlay />}
    </div>
  );
}

export default DashboardLayout;

