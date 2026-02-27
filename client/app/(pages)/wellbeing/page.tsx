"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { motion } from "framer-motion";
import { WellbeingHeader } from "@/components/wellbeing/WellbeingHeader";
import {
  WellbeingKPIRow,
  generatePlaceholderKPIs,
  type WellbeingKPIs,
} from "@/components/wellbeing/WellbeingKPIRow";
import { WellbeingInsights } from "@/components/wellbeing/WellbeingInsights";
import { WellbeingAnalytics } from "@/components/wellbeing/WellbeingAnalytics";
import { WellbeingModulesGrid } from "@/components/wellbeing/WellbeingModulesGrid";
import { WellbeingSidebar } from "@/components/wellbeing/WellbeingSidebar";

type DateRange = "today" | "7d" | "30d";

function WellbeingLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-16 w-16 animate-spin text-emerald-500 mx-auto" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg font-medium"
        >
          Loading your wellbeing dashboard...
        </motion.p>
      </motion.div>
    </div>
  );
}

function WellbeingContent() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<WellbeingKPIs | null>(null);

  // Simulate data fetching
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    // TODO: Replace with actual API call
    // fetch(`/api/wellbeing/kpis?dateRange=${dateRange}`)
    //   .then(res => res.json())
    //   .then(data => setKpis(data))
    //   .finally(() => setIsLoading(false));

    // Simulate API delay
    setTimeout(() => {
      setKpis(generatePlaceholderKPIs());
      setIsLoading(false);
    }, 800);
  }, [dateRange]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export clicked");
  };

  const handleStartCheckIn = () => {
    router.push("/wellbeing/emotional-checkin");
  };

  return (
    <DashboardLayout activeTab="wellbeing">
      {/* Animated background with depth */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content Area (9 columns on desktop, 12 on mobile) */}
          <div className="col-span-12 lg:col-span-9 space-y-8">
            {/* Header */}
            <WellbeingHeader
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              onExport={handleExport}
              onStartCheckIn={handleStartCheckIn}
            />

            {/* KPI Row */}
            <WellbeingKPIRow kpis={kpis || undefined} isLoading={isLoading} />

            {/* AI Insights */}
            <WellbeingInsights isLoading={isLoading} />

            {/* Analytics Section */}
            <WellbeingAnalytics dateRange={dateRange} isLoading={isLoading} />
          </div>

          {/* Sidebar (3 columns on desktop, hidden on mobile) */}
          <div className="col-span-12 lg:col-span-3">
            <WellbeingSidebar />
          </div>
        </div>

        {/* Modules Grid - Full Width Section */}
        <div className="mt-8 w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center gap-3 w-full"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent">
              Wellbeing Modules
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          </motion.div>
          <div className="w-full">
            <WellbeingModulesGrid />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function WellbeingPage() {
  return (
    <Suspense fallback={<WellbeingLoading />}>
      <WellbeingContent />
    </Suspense>
  );
}
