// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
    useEntitlements,
    TIER_RANK,
    type PlanTier,
} from "@/app/context/EntitlementsContext";
import { usePaywallStore } from "@/stores/paywallStore";
import { PaywallCard } from "@/components/subscription/PaywallCard";
import { track } from "@/lib/analytics";

type FallbackKind = "inline" | "blur" | "modal" | "redirect" | "hidden";

interface PlanGateProps {
    minTier: PlanTier;
    fallback?: FallbackKind | ReactNode;
    title?: string;
    description?: string;
    cta?: string;
    redirectTo?: string;
    /** Shown while entitlements are loading (avoids layout shift). */
    loadingSkeleton?: ReactNode;
    children: ReactNode;
}

/**
 * Coarse gate: requires the user's plan tier to meet or exceed `minTier`.
 * Useful for wrapping entire routes when a finer feature key isn't needed.
 */
export function PlanGate({
    minTier,
    fallback = "inline",
    title = "Upgrade required",
    description,
    cta,
    redirectTo,
    loadingSkeleton,
    children,
}: PlanGateProps) {
    const { bundle, isLoading } = useEntitlements();
    const openPaywall = usePaywallStore((s) => s.open);
    const router = useRouter();

    const currentTier = bundle?.plan.tier ?? 0;
    const required = TIER_RANK[minTier];
    const allowed = !!bundle && currentTier >= required;

    useEffect(() => {
        if (!isLoading && bundle && !allowed) {
            track("plan_gate_denied", { minTier, currentTier });
        }
    }, [isLoading, bundle, allowed, minTier, currentTier]);

    useEffect(() => {
        if (!allowed && fallback === "modal" && bundle) {
            openPaywall({ reason: "plan_required", requiredTier: minTier });
        }
    }, [allowed, fallback, bundle, openPaywall, minTier]);

    useEffect(() => {
        if (!allowed && fallback === "redirect" && bundle) {
            router.replace(redirectTo ?? `/subscription?tier=${minTier}`);
        }
    }, [allowed, fallback, bundle, router, redirectTo, minTier]);

    if (isLoading && !bundle) return loadingSkeleton ? <>{loadingSkeleton}</> : null;
    if (allowed) return <>{children}</>;

    if (fallback === "hidden" || fallback === "redirect" || fallback === "modal") return null;

    if (fallback === "blur") {
        return (
            <div className="relative">
                <div aria-hidden className="pointer-events-none select-none blur-sm">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <PaywallCard
                        requiredTier={minTier}
                        title={title}
                        description={description}
                        cta={cta}
                        className="max-w-md"
                    />
                </div>
            </div>
        );
    }

    if (typeof fallback !== "string") return <>{fallback}</>;

    return (
        <PaywallCard
            requiredTier={minTier}
            title={title}
            description={description}
            cta={cta}
        />
    );
}
