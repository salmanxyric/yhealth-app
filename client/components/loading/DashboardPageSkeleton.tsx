"use client";

import { DashboardLayout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type DashboardPageSkeletonVariant = "heroTabsGrid" | "compact" | "kanban";

export interface DashboardPageSkeletonProps {
  /** Sidebar active item — matches `DashboardLayout` */
  activeTab?: string;
  variant?: DashboardPageSkeletonVariant;
  className?: string;
}

/**
 * Full-shell loading UI inside `DashboardLayout` (sidebar + mobile nav visible).
 * Use for route-level / auth / data loading instead of a lone spinner.
 */
export function DashboardPageSkeleton({
  activeTab = "dashboard",
  variant = "compact",
  className,
}: DashboardPageSkeletonProps) {
  return (
    <DashboardLayout activeTab={activeTab}>
      <div
        className={cn(
          "min-h-[calc(100vh-4rem)] overflow-x-hidden bg-[#0a0a14]",
          className,
        )}
      >
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-8xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {variant === "heroTabsGrid" && <HeroTabsGridBody />}
          {variant === "compact" && <CompactBody />}
          {variant === "kanban" && <KanbanBody />}
        </div>
      </div>
    </DashboardLayout>
  );
}

function HeroTabsGridBody() {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-7 w-44 rounded-full bg-white/10" />
          <Skeleton className="h-9 w-full max-w-md rounded-lg bg-white/10 sm:h-10" />
          <Skeleton className="h-4 w-full max-w-lg rounded bg-white/5" />
          <Skeleton className="h-4 w-full max-w-sm rounded bg-white/5" />
        </div>
        <Skeleton className="h-11 w-36 shrink-0 rounded-xl bg-white/10" />
      </div>

      <div className="mb-8 flex flex-wrap gap-2 border-b border-white/[0.06] pb-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-lg bg-white/10" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
          >
            <div className="mb-4 flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-white/10" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-[55%] rounded bg-white/10" />
                <Skeleton className="h-3 w-full rounded bg-white/5" />
                <Skeleton className="h-3 w-[70%] rounded bg-white/5" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
    </>
  );
}

function CompactBody() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg bg-white/10" />
        <Skeleton className="h-4 w-72 max-w-full rounded bg-white/5" />
      </div>
      <Skeleton className="h-[min(520px,60vh)] w-full rounded-2xl border border-white/[0.06] bg-white/[0.04]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl bg-white/[0.04]" />
        <Skeleton className="h-24 rounded-xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

function KanbanBody() {
  return (
    <div className="space-y-4">
      <div className="flex h-14 items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
          <Skeleton className="h-6 w-36 rounded-lg bg-white/10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg bg-white/10" />
          <Skeleton className="h-9 w-28 rounded-lg bg-white/10" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="h-[min(560px,65vh)] rounded-2xl border border-white/[0.06] bg-white/[0.03]"
          />
        ))}
      </div>
    </div>
  );
}
