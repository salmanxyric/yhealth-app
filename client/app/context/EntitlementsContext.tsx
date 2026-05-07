// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.
// Every gated action must additionally be enforced by the server (HTTP 402/403).

"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/app/context/AuthContext";
import { useWalletStore } from "@/stores/walletStore";

// ============================================
// TYPES (mirror of server EntitlementBundle)
// ============================================

export type PlanTier = "free" | "starter" | "pro" | "premium" | "enterprise";
export type SubscriptionStatus =
    | "active" | "canceled" | "past_due" | "trialing"
    | "incomplete" | "incomplete_expired" | "grace" | "paused" | "none";

export interface FeatureEntitlement {
    enabled: boolean;
    creditCost: number;
    limit: number | null;
    limitPeriod: "day" | "week" | "month" | "cycle" | null;
    used: number;
}

export interface MenuEntitlement {
    visible: boolean;
    lockedCta: string | null;
}

export interface EntitlementBundle {
    plan: {
        id: string | null;
        slug: string;
        tier: number; // 0 | 10 | 20 | 30 | 99
        name: string;
        version: number;
        isEnterprise: boolean;
    };
    subscription: {
        status: SubscriptionStatus;
        currentPeriodEnd: string | null;
        cancelAtPeriodEnd: boolean;
        graceEndsAt: string | null;
        trialEndsAt: string | null;
        daysLeftInTrial: number | null;
    };
    features: Record<string, FeatureEntitlement>;
    pages: Record<string, "none" | "preview" | "locked" | "full">;
    menus: Record<string, MenuEntitlement>;
    wallet: {
        planCredits: number;
        bonusCredits: number;
        total: number;
        lastResetAt: string | null;
        nextResetAt: string | null;
    };
    overrides: Array<{ id: string; kind: string; createdAt: string }>;
    computedAt: string;
    etag: string;
}

/** Map server numeric tier to string for readability. */
export const TIER_RANK: Record<PlanTier, number> = {
    free: 0,
    starter: 10,
    pro: 20,
    premium: 30,
    enterprise: 99,
};

export function tierToSlug(tier: number): PlanTier {
    if (tier >= 99) return "enterprise";
    if (tier >= 30) return "premium";
    if (tier >= 20) return "pro";
    if (tier >= 10) return "starter";
    return "free";
}

// ============================================
// CONTEXT VALUE
// ============================================

export interface CanUseResult {
    allowed: boolean;
    reason: "ok" | "disabled" | "no_plan" | "no_credits" | "limit_reached" | "loading";
}

export interface EntitlementsValue {
    bundle: EntitlementBundle | null;
    isLoading: boolean;
    isStale: boolean;
    error: Error | null;
    /** Imperative refetch. Resolves once the new bundle is loaded. */
    refetch: () => Promise<void>;
    /** Check without consuming — UX hint. Server is the source of truth. */
    canUse: (featureKey: string, estimatedCost?: number) => CanUseResult;
    /** Returns the feature entitlement or a safe default when not found. */
    feature: (featureKey: string) => FeatureEntitlement;
}

const DEFAULT_FEATURE: FeatureEntitlement = {
    enabled: false,
    creditCost: 0,
    limit: null,
    limitPeriod: null,
    used: 0,
};

const EntitlementsContext = createContext<EntitlementsValue | null>(null);

// ============================================
// PROVIDER
// ============================================

const REFRESH_ON_FOCUS_MS = 60_000;
const STALE_AFTER_MS = 5 * 60_000;
const LOCAL_CACHE_KEY = "yhealth-entitlements-cache-v1";
const BROADCAST_CHANNEL_NAME = "yhealth-entitlements-sync";

function getBroadcastChannel(): BroadcastChannel | null {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
    try {
        return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch {
        return null;
    }
}

function readLocalCache(): EntitlementBundle | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(LOCAL_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { bundle: EntitlementBundle; savedAt: number };
        if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) return null; // 24h TTL
        return parsed.bundle;
    } catch {
        return null;
    }
}

function writeLocalCache(bundle: EntitlementBundle): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(
            LOCAL_CACHE_KEY,
            JSON.stringify({ bundle, savedAt: Date.now() })
        );
    } catch {
        /* quota exceeded — ignore */
    }
}

interface EntitlementsProviderProps {
    children: ReactNode;
}

export function EntitlementsProvider({ children }: EntitlementsProviderProps) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const hydrateWallet = useWalletStore((s) => s.hydrate);
    const resetWallet = useWalletStore((s) => s.reset);

    const [bundle, setBundle] = useState<EntitlementBundle | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isStale, setIsStale] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const etagRef = useRef<string | null>(bundle?.etag ?? null);
    const lastFetchAtRef = useRef<number>(0);
    const lastFocusFetchRef = useRef<number>(0);
    const bundleRef = useRef<EntitlementBundle | null>(bundle);
    bundleRef.current = bundle;

    const fetchBundle = useCallback(
        async (opts: { background?: boolean } = {}) => {
            if (!isAuthenticated) return;
            if (opts.background) setIsStale(true);
            else setIsLoading(true);
            setError(null);

            try {
                const headers: Record<string, string> = {};
                if (opts.background && etagRef.current) {
                    headers["If-None-Match"] = `W/"${etagRef.current}"`;
                }
                const res = await api.get<EntitlementBundle>("/me/entitlements", { headers });

                if (res.success && res.data) {
                    setBundle(res.data);
                    etagRef.current = res.data.etag;
                    lastFetchAtRef.current = Date.now();
                    writeLocalCache(res.data);
                    const bc = getBroadcastChannel();
                    if (bc) {
                        bc.postMessage({ type: "etag_updated", etag: res.data.etag });
                        bc.close();
                    }
                    hydrateWallet({
                        planCredits: res.data.wallet.planCredits,
                        bonusCredits: res.data.wallet.bonusCredits,
                        lastResetAt: res.data.wallet.lastResetAt,
                        nextResetAt: res.data.wallet.nextResetAt,
                    });
                }
            } catch (e) {
                if (e instanceof ApiError && e.statusCode === 304 && bundleRef.current) {
                    lastFetchAtRef.current = Date.now();
                } else {
                    setError(e instanceof Error ? e : new Error(String(e)));
                }
            } finally {
                setIsLoading(false);
                setIsStale(false);
            }
        },
        [isAuthenticated, hydrateWallet]
    );

    // Initial fetch on auth ready. Local cache is intentionally read after
    // hydration so the server render and first client render match.
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            setBundle(null);
            setIsLoading(false);
            etagRef.current = null;
            resetWallet();
            // Purge the local bundle cache so a second user signing in on the
            // same device doesn't momentarily see the previous user's plan.
            if (typeof window !== "undefined") {
                try {
                    localStorage.removeItem(LOCAL_CACHE_KEY);
                } catch {
                    /* ignore */
                }
            }
            return;
        }

        const cached = readLocalCache();
        if (cached) {
            setBundle(cached);
            etagRef.current = cached.etag;
            hydrateWallet({
                planCredits: cached.wallet.planCredits,
                bonusCredits: cached.wallet.bonusCredits,
                lastResetAt: cached.wallet.lastResetAt,
                nextResetAt: cached.wallet.nextResetAt,
            });
            void fetchBundle({ background: true });
            return;
        }

        void fetchBundle();
    }, [authLoading, isAuthenticated, fetchBundle, hydrateWallet, resetWallet]);

    // Focus + visibility refetch (throttled).
    useEffect(() => {
        if (!isAuthenticated) return;
        const onFocus = () => {
            const since = Date.now() - lastFocusFetchRef.current;
            if (since < REFRESH_ON_FOCUS_MS) return;
            lastFocusFetchRef.current = Date.now();
            void fetchBundle({ background: true });
        };
        const onVisibility = () => {
            if (document.visibilityState !== "visible") return;
            const sinceLastFetch = Date.now() - lastFetchAtRef.current;
            if (sinceLastFetch > STALE_AFTER_MS) {
                void fetchBundle({ background: true });
            }
        };
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [isAuthenticated, fetchBundle]);

    // Cross-tab sync via BroadcastChannel.
    useEffect(() => {
        if (!isAuthenticated) return;
        const bc = getBroadcastChannel();
        if (!bc) return;
        const onMessage = (ev: MessageEvent) => {
            if (ev.data?.type === "etag_updated" && ev.data.etag !== etagRef.current) {
                void fetchBundle({ background: true });
            }
        };
        bc.addEventListener("message", onMessage);
        return () => {
            bc.removeEventListener("message", onMessage);
            bc.close();
        };
    }, [isAuthenticated, fetchBundle]);

    // ============================================
    // Public API
    // ============================================

    const canUse = useCallback(
        (featureKey: string, estimatedCost?: number): CanUseResult => {
            if (!bundle) return { allowed: false, reason: "loading" };
            const f = bundle.features[featureKey];
            if (!f) return { allowed: false, reason: "no_plan" };
            if (!f.enabled) return { allowed: false, reason: "disabled" };
            if (f.limit !== null && f.used >= f.limit) {
                return { allowed: false, reason: "limit_reached" };
            }
            const cost = estimatedCost ?? f.creditCost;
            if (cost > 0 && bundle.wallet.total < cost) {
                return { allowed: false, reason: "no_credits" };
            }
            return { allowed: true, reason: "ok" };
        },
        [bundle]
    );

    const feature = useCallback(
        (featureKey: string): FeatureEntitlement => {
            return bundle?.features[featureKey] ?? DEFAULT_FEATURE;
        },
        [bundle]
    );

    const value = useMemo<EntitlementsValue>(
        () => ({
            bundle,
            isLoading,
            isStale,
            error,
            refetch: () => fetchBundle({ background: true }),
            canUse,
            feature,
        }),
        [bundle, isLoading, isStale, error, fetchBundle, canUse, feature]
    );

    return (
        <EntitlementsContext.Provider value={value}>
            {children}
        </EntitlementsContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

/**
 * Primary hook for reading entitlements. Returns a stable object with:
 *   bundle, isLoading, isStale, error, refetch, canUse(featureKey, cost?), feature(featureKey)
 *
 * When used outside an EntitlementsProvider (e.g. in a non-wrapped test or
 * public-route page), returns a fail-closed default. Client-side defaults are
 * UX hints; the server remains authoritative.
 */
export function useEntitlements(): EntitlementsValue {
    const ctx = useContext(EntitlementsContext);
    if (ctx) return ctx;
    return FAIL_CLOSED;
}

const FAIL_CLOSED: EntitlementsValue = {
    bundle: null,
    isLoading: false,
    isStale: false,
    error: null,
    refetch: async () => {},
    canUse: () => ({ allowed: false, reason: "loading" }),
    feature: () => DEFAULT_FEATURE,
};
