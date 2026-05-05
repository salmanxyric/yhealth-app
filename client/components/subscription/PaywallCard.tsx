// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

"use client";

import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaywallStore } from "@/stores/paywallStore";
import { track } from "@/lib/analytics";
import type { PaywallReason } from "@/stores/paywallStore";
import type { PlanTier } from "@/app/context/EntitlementsContext";

interface PaywallCardProps {
    featureKey?: string;
    title?: string;
    description?: string;
    cta?: string;
    reason?: PaywallReason;
    requiredTier?: PlanTier;
    className?: string;
}

/**
 * Inline "upgrade required" card. The default fallback rendered by <FeatureGate>
 * when the user lacks access. Click → opens the global <UpgradeModal>.
 */
export function PaywallCard({
    featureKey,
    title = "Upgrade to unlock",
    description = "This feature is part of a paid plan. Upgrade anytime to continue.",
    cta = "See plans",
    reason = "plan_required",
    requiredTier,
    className = "",
}: PaywallCardProps) {
    const openPaywall = usePaywallStore((s) => s.open);

    const onClick = () => {
        track("upgrade_cta_clicked", { featureKey, reason, requiredTier, surface: "paywall_card" });
        openPaywall({ featureKey: featureKey ?? null, reason, requiredTier: requiredTier ?? null });
    };

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-cyan-950/30 p-6 backdrop-blur ${className}`}
            role="group"
            aria-label="Upgrade required"
        >
            <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl"
            />
            <div className="relative flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-400/20 text-cyan-300 ring-1 ring-cyan-400/30">
                    <Lock className="h-5 w-5" aria-hidden />
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className="text-base font-semibold text-slate-100">{title}</h3>
                    <p className="text-sm text-slate-400">{description}</p>
                </div>
            </div>
            <div className="relative mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-cyan-300/80">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    <span>{requiredTier ? `Included in ${requiredTier}` : "Included in paid plans"}</span>
                </div>
                <Button
                    size="sm"
                    onClick={onClick}
                    className="bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-900 hover:from-cyan-300 hover:to-teal-300"
                >
                    {cta}
                </Button>
            </div>
        </div>
    );
}
