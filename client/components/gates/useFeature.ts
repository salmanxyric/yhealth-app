// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

"use client";

import { useEntitlements, type FeatureEntitlement } from "@/app/context/EntitlementsContext";

export interface UseFeatureResult {
    entitled: boolean;
    enabled: boolean;
    limit: number | null;
    used: number;
    remaining: number | null;
    creditCost: number;
    loading: boolean;
    /** Full entitlement record (safe default when unknown). */
    record: FeatureEntitlement;
}

/**
 * Read-only feature check. Use in render paths that need to know whether to
 * show something — for imperative action gating, use <CreditGate> or useCredits().
 */
export function useFeature(featureKey: string): UseFeatureResult {
    const { bundle, feature, isLoading } = useEntitlements();
    const record = feature(featureKey);
    const remaining = record.limit !== null ? Math.max(0, record.limit - record.used) : null;
    const entitled =
        !!bundle &&
        record.enabled &&
        (record.limit === null || record.used < record.limit);
    return {
        entitled,
        enabled: record.enabled,
        limit: record.limit,
        used: record.used,
        remaining,
        creditCost: record.creditCost,
        loading: isLoading && !bundle,
        record,
    };
}
