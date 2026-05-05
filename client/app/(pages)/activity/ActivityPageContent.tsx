"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout";
import { DashboardPageSkeleton } from "@/components/loading";
import { ActivityTab } from "@/app/(pages)/dashboard/components/tabs";

function ActivityLoading() {
  return <DashboardPageSkeleton activeTab="activity" variant="compact" />;
}

function ActivityContent() {
  return (
    <DashboardLayout activeTab="activity">
      <div className="max-w-8xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <ActivityTab />
      </div>
    </DashboardLayout>
  );
}

export default function ActivityPageContent() {
  return (
    <Suspense fallback={<ActivityLoading />}>
      <ActivityContent />
    </Suspense>
  );
}
