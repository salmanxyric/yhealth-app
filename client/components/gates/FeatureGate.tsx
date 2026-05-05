// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.
// Every gated action must additionally be enforced by the server (HTTP 402/403).

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEntitlements, type PlanTier } from "@/app/context/EntitlementsContext";
import { usePaywallStore } from "@/stores/paywallStore";
import { PaywallCard } from "@/components/subscription/PaywallCard";
import { track } from "@/lib/analytics";

type FallbackKind = "inline" | "blur" | "modal" | "redirect" | "hidden";

interface FeatureGateProps {
    featureKey: string;
    fallback?: FallbackKind | ReactNode;
    requiredTier?: PlanTier;
    /** Copy overrides for the inline fallback. */
    title?: string;
    description?: string;
    cta?: string;
    /** Where to redirect on fallback="redirect". */
    redirectTo?: string;
    /** Shown while entitlements are loading (avoids layout shift). */
    loadingSkeleton?: ReactNode;
    children: ReactNode;
}

/**
 * Gate children on a feature entitlement. Denied renderings are ~ UX hints;
 * the server must still reject the underlying call with 402/403.
 *
 *   <FeatureGate featureKey="ai.voice.call" fallback="inline">
 *     <VoiceCallButton />
 *   </FeatureGate>
 */
export function FeatureGate({
    featureKey,
    fallback = "inline",
    requiredTier,
    title,
    description,
    cta,
    redirectTo,
    loadingSkeleton,
    children,
}: FeatureGateProps) {
    const { canUse, isLoading, bundle } = useEntitlements();
    const result = canUse(featureKey);
    const openPaywall = usePaywallStore((s) => s.open);
    const router = useRouter();

    // Fire analytics event once per mount when gate denies.
    useEffect(() => {
        if (!result.allowed && result.reason !== "loading") {
            track("feature_gate_denied", { featureKey, reason: result.reason });
        }
    }, [featureKey, result.allowed, result.reason]);

    // Modal fallback: open the paywall store on mount if denied (feature disabled).
    useEffect(() => {
        if (fallback === "modal" && !result.allowed && result.reason !== "loading") {
            openPaywall({
                featureKey,
                reason:
                    result.reason === "no_credits"
                        ? "credits_exhausted"
                        : result.reason === "limit_reached"
                          ? "limit_reached"
                          : "feature_disabled",
                requiredTier: requiredTier ?? null,
            });
        }
    }, [fallback, result.allowed, result.reason, featureKey, requiredTier, openPaywall]);

    // Redirect fallback.
    useEffect(() => {
        if (fallback === "redirect" && !result.allowed && result.reason !== "loading") {
            const target = redirectTo ?? `/upgrade?feature=${encodeURIComponent(featureKey)}`;
            router.replace(target);
        }
    }, [fallback, result.allowed, result.reason, featureKey, redirectTo, router]);

    // Still loading entitlements and nothing cached: render nothing
    // (avoids a flash of locked UI while the initial fetch resolves).
    if (isLoading && !bundle) return loadingSkeleton ? <>{loadingSkeleton}</> : null;

    if (result.allowed) return <>{children}</>;

    if (fallback === "hidden" || fallback === "redirect" || fallback === "modal") {
        return null;
    }

    if (fallback === "blur") {
        return (
            <div className="relative">
                <div aria-hidden className="pointer-events-none select-none blur-sm">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-6">
                    <PaywallCard
                        featureKey={featureKey}
                        requiredTier={requiredTier}
                        title={title}
                        description={description}
                        cta={cta}
                        className="max-w-md"
                    />
                </div>
            </div>
        );
    }

    // ReactNode fallback
    if (typeof fallback !== "string") {
        return <>{fallback}</>;
    }

    // Default: inline paywall card.
    return (
        <PaywallCard
            featureKey={featureKey}
            requiredTier={requiredTier}
            title={title}
            description={description}
            cta={cta}
        />
    );
}
