// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.
// Every gated action must additionally be enforced by the server (HTTP 402/403).

"use client";

import { useCallback, type ReactNode } from "react";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { useWalletStore } from "@/stores/walletStore";
import { usePaywallStore } from "@/stores/paywallStore";
import { track } from "@/lib/analytics";

const noop = () => {};

export interface CreditGateChildProps {
    /** True when the wallet can cover the estimated cost AND feature is enabled. */
    canUse: boolean;
    /** Live wallet total after any optimistic debits. */
    remaining: number;
    /** The effective cost (estimatedCost ?? feature.creditCost). */
    cost: number;
    /**
     * Invoke to run the action. Debits locally (optimistic), returns an object
     * with the result. On success, the caller MUST call either confirm() after
     * a successful server response OR rollback() on failure. A paywall is
     * opened automatically when the action is blocked.
     */
    consume: () => { ok: boolean; confirm: () => void; rollback: () => void };
}

interface CreditGateProps {
    featureKey: string;
    /** Override the feature's default credit cost when you have a better estimate. */
    estimatedCost?: number;
    /** Called when gate blocks the action (out of credits / feature disabled). */
    onBlocked?: (reason: "no_credits" | "disabled" | "limit_reached" | "no_plan") => void;
    children: (args: CreditGateChildProps) => ReactNode;
}

/**
 * Render-prop gate for wrapping AI action buttons. Gives the caller control
 * over the Send button and a helper to consume credits optimistically:
 *
 *   <CreditGate featureKey="ai.coach.message">
 *     {({ canUse, remaining, consume }) => (
 *       <Button disabled={!canUse} onClick={() => consume() && send()}>
 *         Send ({remaining})
 *       </Button>
 *     )}
 *   </CreditGate>
 */
export function CreditGate({
    featureKey,
    estimatedCost,
    onBlocked,
    children,
}: CreditGateProps) {
    const { canUse: canUseFeature, feature } = useEntitlements();
    const record = feature(featureKey);
    const cost = estimatedCost ?? record.creditCost;
    const remaining = useWalletStore((s) => s.total);
    const optimisticDebit = useWalletStore((s) => s.optimisticDebit);
    const rollbackDebit = useWalletStore((s) => s.rollbackDebit);
    const confirmDebit = useWalletStore((s) => s.confirmDebit);
    const openPaywall = usePaywallStore((s) => s.open);

    const check = canUseFeature(featureKey, cost);
    const canUse = check.allowed;

    const consume = useCallback(() => {
        if (!canUse) {
            const reason =
                check.reason === "no_credits"
                    ? "credits_exhausted"
                    : check.reason === "limit_reached"
                      ? "limit_reached"
                      : "feature_disabled";
            track("credit_gate_blocked", { featureKey, reason: check.reason, cost });
            openPaywall({ featureKey, reason });
            if (
                check.reason === "no_credits" ||
                check.reason === "limit_reached" ||
                check.reason === "no_plan" ||
                check.reason === "disabled"
            ) {
                onBlocked?.(check.reason);
            } else {
                onBlocked?.("disabled");
            }
            return { ok: false, confirm: noop, rollback: noop };
        }
        if (cost <= 0) {
            // No credits to debit — nothing to confirm/rollback either.
            return { ok: true, confirm: noop, rollback: noop };
        }
        const id = optimisticDebit(cost);
        return {
            ok: true,
            confirm: () => confirmDebit(id),
            rollback: () => rollbackDebit(id),
        };
    }, [
        canUse,
        check.reason,
        cost,
        featureKey,
        optimisticDebit,
        rollbackDebit,
        confirmDebit,
        openPaywall,
        onBlocked,
    ]);

    return <>{children({ canUse, remaining, cost, consume })}</>;
}
