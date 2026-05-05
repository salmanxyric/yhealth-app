// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

"use client";

import Link from "next/link";
import { useState } from "react";
import { X, Clock, ArrowRight } from "lucide-react";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { cn } from "@/lib/utils";

/**
 * Top-of-page banner that surfaces the user's trial countdown. Hides for:
 *  - non-trial subscription states (active / past_due / canceled / etc.)
 *  - the day after trial ends (so paywall screens take over)
 *  - dismissed-this-session (sessionStorage)
 *
 * Uses daysLeftInTrial from the server bundle. The server truncates at 0 so
 * we never go negative.
 */
const DISMISS_KEY = "yhealth-trial-banner-dismissed-v1";

interface Props {
    className?: string;
}

export function TrialCountdownBanner({ className }: Props) {
    const { bundle } = useEntitlements();
    const [dismissed, setDismissed] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        try {
            return sessionStorage.getItem(DISMISS_KEY) === "1";
        } catch {
            return false;
        }
    });

    if (dismissed) return null;
    if (!bundle) return null;

    const { status } = bundle.subscription;
    const daysLeft = bundle.subscription.daysLeftInTrial;

    // Only show during an active trial window.
    if (status !== "trialing") return null;
    if (daysLeft == null) return null;
    if (daysLeft < 0) return null;

    const urgent = daysLeft <= 1;

    const handleDismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem(DISMISS_KEY, "1");
        } catch {
            /* ignore */
        }
    };

    const label =
        daysLeft === 0
            ? "Your free trial ends today"
            : daysLeft === 1
              ? "Your free trial ends tomorrow"
              : `${daysLeft} days left in your free trial`;

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "relative flex items-center justify-between gap-3 px-4 py-2.5 text-sm",
                "border-b border-cyan-400/20",
                urgent
                    ? "bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-rose-500/15 text-rose-100"
                    : "bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-sky-500/10 text-cyan-100",
                className
            )}
        >
            <div className="flex items-center gap-2 min-w-0">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{label}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                    href="/subscription"
                    className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                        "transition-colors",
                        urgent
                            ? "bg-rose-500 text-white hover:bg-rose-400"
                            : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    )}
                >
                    Upgrade
                    <ArrowRight className="h-3 w-3" />
                </Link>
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Dismiss trial banner"
                    className="rounded-full p-1 text-slate-400 hover:text-slate-200 transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
