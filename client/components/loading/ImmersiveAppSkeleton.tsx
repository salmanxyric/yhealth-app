"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ImmersiveAppSkeletonProps {
  /** `ai-coach` matches the dark coach shell; `voice` uses slate-950 */
  variant?: "ai-coach" | "voice";
  className?: string;
}

/**
 * Full-viewport skeleton for routes that do not use `DashboardLayout`
 * (AI Coach, Voice Assistant, and similar immersive shells).
 */
export function ImmersiveAppSkeleton({
  variant = "voice",
  className,
}: ImmersiveAppSkeletonProps) {
  const shellBg =
    variant === "ai-coach" ? "bg-[#02000f]" : "bg-slate-950";

  return (
    <div
      className={cn(
        "flex h-[100dvh] max-h-[100dvh] overflow-hidden",
        shellBg,
        className,
      )}
    >
      <aside className="hidden w-[280px] shrink-0 flex-col gap-3 border-r border-white/[0.06] p-4 lg:flex">
        <Skeleton className="h-8 w-28 rounded-lg bg-white/10" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-white/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton
                className="h-3 rounded bg-white/10"
                style={{ width: `${55 + (i % 4) * 8}%` }}
              />
              <Skeleton className="h-3 w-[55%] rounded bg-white/5" />
            </div>
          </div>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4">
          <Skeleton className="h-8 w-8 rounded-lg bg-white/10 lg:hidden" />
          <Skeleton className="h-6 max-w-md flex-1 rounded bg-white/10" />
          <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-hidden p-4 md:p-6">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 pt-4">
            <Skeleton className="h-20 w-20 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-48 rounded bg-white/10" />
            <Skeleton className="h-3 w-64 max-w-full rounded bg-white/5" />
          </div>
          <div className="mx-auto mt-4 max-w-3xl space-y-3">
            <Skeleton className="ml-0 h-16 w-[85%] rounded-2xl bg-white/[0.06]" />
            <Skeleton className="ml-auto h-14 w-[70%] rounded-2xl bg-white/[0.04]" />
            <Skeleton className="ml-0 h-20 w-[90%] rounded-2xl bg-white/[0.05]" />
          </div>
        </div>

        <footer className="shrink-0 border-t border-white/[0.06] p-4">
          <Skeleton className="mx-auto h-12 w-full max-w-3xl rounded-xl bg-white/10" />
        </footer>
      </div>
    </div>
  );
}
