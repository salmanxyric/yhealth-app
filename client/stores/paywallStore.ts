// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

import { create } from "zustand";

export type PaywallReason =
    | "feature_disabled"
    | "plan_required"
    | "credits_exhausted"
    | "limit_reached"
    | "trial_expired";

export interface PaywallState {
    isOpen: boolean;
    featureKey: string | null;
    requiredTier: "free" | "starter" | "pro" | "premium" | "enterprise" | null;
    reason: PaywallReason | null;
    // Arbitrary extra payload the opener wants the modal to show.
    context: Record<string, unknown> | null;
}

interface PaywallActions {
    open: (opts: Partial<Omit<PaywallState, "isOpen">> & { featureKey?: string | null }) => void;
    close: () => void;
}

const INITIAL: PaywallState = {
    isOpen: false,
    featureKey: null,
    requiredTier: null,
    reason: null,
    context: null,
};

export const usePaywallStore = create<PaywallState & PaywallActions>((set) => ({
    ...INITIAL,
    open: (opts) =>
        set({
            isOpen: true,
            featureKey: opts.featureKey ?? null,
            requiredTier: opts.requiredTier ?? null,
            reason: opts.reason ?? null,
            context: opts.context ?? null,
        }),
    close: () => set({ ...INITIAL, isOpen: false }),
}));
