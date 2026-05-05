"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout";
import { DashboardPageSkeleton } from "@/components/loading";
import { AchievementsTab } from "@/app/(pages)/dashboard/components/tabs";

function AchievementsLoading() {
  return <DashboardPageSkeleton activeTab="achievements" variant="compact" />;
}

function AchievementsContent() {
  return (
    <DashboardLayout activeTab="achievements">
      <div className="max-w-8xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <AchievementsTab />
      </div>
    </DashboardLayout>
  );
}

export default function AchievementsPageContent() {
  return (
    <Suspense fallback={<AchievementsLoading />}>
      <AchievementsContent />
    </Suspense>
  );
}
