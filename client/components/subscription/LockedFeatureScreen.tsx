// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement checks.

"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePaywallStore } from "@/stores/paywallStore";

interface Props {
    pageKey: string;
    title?: string;
    description?: string;
    requiredPlan?: string;
    className?: string;
}

/**
 * Full-screen paywall shown when a user deep-links to a route their plan
 * doesn't cover. Rendered by per-segment layout.tsx guards when
 * requirePlanPage() returns locked=true.
 *
 * The server is the source of truth — the corresponding layout.tsx should
 * also have returned 402 for any API call. This screen is the friendly UX
 * around that boundary.
 */
export function LockedFeatureScreen({
    pageKey,
    title,
    description,
    requiredPlan,
    className,
}: Props) {
    const openPaywall = usePaywallStore((s) => s.open);

    const defaultTitle = `${prettyName(pageKey)} is not on your plan`;
    const defaultDescription =
        requiredPlan
            ? `Upgrade to ${requiredPlan} or higher to unlock ${prettyName(pageKey)} plus the rest of the premium experience.`
            : `Upgrade to unlock ${prettyName(pageKey)} plus the rest of the premium experience.`;

    return (
        <div
            className={cn(
                "flex min-h-[70vh] flex-col items-center justify-center px-6 py-12",
                className
            )}
        >
            <div className="max-w-md text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-400/30">
                    <Lock className="h-7 w-7 text-cyan-300" />
                </div>

                <h1 className="text-2xl font-semibold text-slate-100 mb-3">
                    {title ?? defaultTitle}
                </h1>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                    {description ?? defaultDescription}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href={`/subscription?feature=${encodeURIComponent(pageKey)}`}
                        className={cn(
                            "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3",
                            "text-sm font-semibold text-slate-950",
                            "bg-gradient-to-r from-cyan-500 to-teal-500",
                            "hover:opacity-90 active:scale-[0.98] transition-all"
                        )}
                    >
                        <Sparkles className="h-4 w-4" />
                        See plans
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={() =>
                            openPaywall({
                                reason: "plan_required",
                                context: { pageKey },
                            })
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-slate-300 border border-slate-800 hover:bg-slate-900 transition-colors"
                    >
                        Learn more
                    </button>
                </div>
            </div>
        </div>
    );
}

function prettyName(pageKey: string): string {
    const parts = pageKey.replace(/[-.]/g, " ").split(" ");
    return parts
        .map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
        .join(" ");
}
