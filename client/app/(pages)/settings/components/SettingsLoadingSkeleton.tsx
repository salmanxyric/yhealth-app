"use client";

import { DashboardSidebar, MobileBottomNav } from "../../dashboard/components";

interface SettingsLoadingSkeletonProps {
  sidebarActiveTab: string;
  onTabChange: (tab: string) => void;
}

export function SettingsLoadingSkeleton({
  sidebarActiveTab,
  onTabChange,
}: SettingsLoadingSkeletonProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar placeholder - Desktop */}
      <div className="hidden md:block">
        <DashboardSidebar activeTab={sidebarActiveTab} onTabChange={onTabChange} />
      </div>
      <MobileBottomNav activeTab={sidebarActiveTab} onTabChange={onTabChange} />

      <div className="md:ml-64 min-h-screen pb-20 md:pb-0 overflow-x-hidden">
        {/* Background blurs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-32 bg-white/10 rounded-lg" />
                <div className="h-4 w-56 bg-white/5 rounded-lg mt-2" />
              </div>
              <div className="h-10 w-36 bg-white/10 rounded-xl" />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Section sidebar skeleton */}
            <nav className="lg:w-64 shrink-0">
              <div className="sticky top-8 space-y-1">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl">
                    <div className="w-5 h-5 bg-white/10 rounded" />
                    <div className="h-4 bg-white/10 rounded" style={{ width: `${60 + i * 10}px` }} />
                  </div>
                ))}
              </div>
            </nav>

            {/* Main content skeleton */}
            <main className="flex-1 min-w-0 space-y-6">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/10 rounded-xl" />
                  <div className="h-6 w-48 bg-white/10 rounded-lg" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-white/10 rounded" />
                          <div className="h-3 w-40 bg-white/5 rounded mt-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/10 rounded-xl" />
                  <div className="h-6 w-36 bg-white/10 rounded-lg" />
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02]">
                      <div>
                        <div className="h-4 w-32 bg-white/10 rounded" />
                        <div className="h-3 w-48 bg-white/5 rounded mt-1" />
                      </div>
                      <div className="w-12 h-6 bg-white/10 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
