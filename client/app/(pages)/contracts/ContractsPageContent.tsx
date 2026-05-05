"use client";

import { Suspense } from "react";
import { DashboardLayout } from "@/components/layout";
import { DashboardPageSkeleton } from "@/components/loading";
import { AccountabilityTab } from "@/app/(pages)/dashboard/components/tabs";

function ContractsLoading() {
  return <DashboardPageSkeleton activeTab="accountability" variant="compact" />;
}

function ContractsContent() {
  return (
    <DashboardLayout activeTab="accountability">
      <div className="max-w-8xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <AccountabilityTab />
      </div>
    </DashboardLayout>
  );
}

export default function ContractsPageContent() {
  return (
    <Suspense fallback={<ContractsLoading />}>
      <ContractsContent />
    </Suspense>
  );
}
