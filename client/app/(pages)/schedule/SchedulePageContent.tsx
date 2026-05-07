'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout';
import { DashboardPageSkeleton } from '@/components/loading';
import { ScheduleFullView } from './ScheduleFullView';

function ScheduleLoading() {
  return <DashboardPageSkeleton activeTab="overview" variant="compact" />;
}

function ScheduleContent() {
  return (
    <DashboardLayout activeTab="overview">
      <div className="max-w-8xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <ScheduleFullView />
      </div>
    </DashboardLayout>
  );
}

export default function SchedulePageContent() {
  return (
    <Suspense fallback={<ScheduleLoading />}>
      <ScheduleContent />
    </Suspense>
  );
}
