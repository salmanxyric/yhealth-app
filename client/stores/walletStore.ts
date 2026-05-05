// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.
// Every gated action must additionally be enforced by the server (HTTP 402/403).

import { create } from "zustand";

/**
 * Wallet store — the one piece of entitlement state that mutates on every
 * AI action. Lives outside the EntitlementsContext so that a credit chip
 * ticking down does not re-render the entire subscribed tree.
 *
 * Subscribe with slice selectors:
 *   const total = useWalletStore(s => s.total);
 */

/** One in-flight debit, retained so rollback can reverse the exact split. */
interface PendingDebit {
    id: number;
    fromPlan: number;
    fromBonus: number;
}

export interface WalletState {
    planCredits: number;
    bonusCredits: number;
    total: number;
    lastResetAt: string | null;
    nextResetAt: string | null;
    // Version bumps on every update — useful for detecting stale optimistic updates.
    version: number;
    // Per-debit ledger so rollback can reverse the exact bucket split.
    pendingDebits: PendingDebit[];
    pendingDebitCount: number;
}

export interface WalletActions {
    hydrate: (snapshot: Partial<Omit<WalletState, "total" | "pendingDebits" | "pendingDebitCount" | "version">>) => void;
    /** Returns the debit id so the caller can pass it to rollbackDebit / confirmDebit. */
    optimisticDebit: (amount: number) => number;
    /** Reverse the debit's exact plan/bonus split. Pass the id from optimisticDebit. */
    rollbackDebit: (id: number) => void;
    /** Clear the pending marker once the server confirms the debit. Balances stay as-is. */
    confirmDebit: (id: number) => void;
    reset: () => void;
}

const INITIAL: WalletState = {
    planCredits: 0,
    bonusCredits: 0,
    total: 0,
    lastResetAt: null,
    nextResetAt: null,
    version: 0,
    pendingDebits: [],
    pendingDebitCount: 0,
};

let nextDebitId = 1;

export const useWalletStore = create<WalletState & WalletActions>((set) => ({
    ...INITIAL,

    /**
     * Replace wallet state from a server snapshot (initial fetch, SSE delta, post-settle).
     * Always wins over optimistic local state. `total` is always recomputed
     * from `planCredits + bonusCredits` — never trusted from the caller.
     */
    hydrate: (snapshot) =>
        set((prev) => {
            const planCredits =
                snapshot.planCredits !== undefined ? snapshot.planCredits : prev.planCredits;
            const bonusCredits =
                snapshot.bonusCredits !== undefined ? snapshot.bonusCredits : prev.bonusCredits;
            return {
                ...prev,
                planCredits,
                bonusCredits,
                total: planCredits + bonusCredits,
                lastResetAt: snapshot.lastResetAt ?? prev.lastResetAt,
                nextResetAt: snapshot.nextResetAt ?? prev.nextResetAt,
                pendingDebits: [],
                pendingDebitCount: 0,
                version: prev.version + 1,
            };
        }),

    /**
     * Subtract `amount` from the local wallet before the server confirms.
     * Always drain plan credits first, then bonus. Clamped — total never goes
     * below 0 even if caller forgot to pre-check with canUse.
     * Returns a debit id; pass it to rollbackDebit or confirmDebit.
     */
    optimisticDebit: (amount) => {
        const id = nextDebitId++;
        set((prev) => {
            const fromPlan = Math.max(0, Math.min(prev.planCredits, amount));
            const fromBonus = Math.max(0, Math.min(prev.bonusCredits, amount - fromPlan));
            return {
                ...prev,
                planCredits: prev.planCredits - fromPlan,
                bonusCredits: prev.bonusCredits - fromBonus,
                total: prev.total - (fromPlan + fromBonus),
                pendingDebits: [...prev.pendingDebits, { id, fromPlan, fromBonus }],
                pendingDebitCount: prev.pendingDebitCount + 1,
                version: prev.version + 1,
            };
        });
        return id;
    },

    /**
     * Reverse a specific optimistic debit by its id. Returns credits to the
     * exact buckets they were taken from — symmetric with optimisticDebit.
     * No-op if the id is unknown (already rolled back / confirmed).
     */
    rollbackDebit: (id) =>
        set((prev) => {
            const pending = prev.pendingDebits.find((d) => d.id === id);
            if (!pending) return prev;
            return {
                ...prev,
                planCredits: prev.planCredits + pending.fromPlan,
                bonusCredits: prev.bonusCredits + pending.fromBonus,
                total: prev.total + pending.fromPlan + pending.fromBonus,
                pendingDebits: prev.pendingDebits.filter((d) => d.id !== id),
                pendingDebitCount: Math.max(0, prev.pendingDebitCount - 1),
                version: prev.version + 1,
            };
        }),

    /**
     * Clear the pending marker when the server confirms the debit succeeded.
     * Balances are unchanged — the optimistic deduction stays.
     */
    confirmDebit: (id) =>
        set((prev) => {
            if (!prev.pendingDebits.some((d) => d.id === id)) return prev;
            return {
                ...prev,
                pendingDebits: prev.pendingDebits.filter((d) => d.id !== id),
                pendingDebitCount: Math.max(0, prev.pendingDebitCount - 1),
                version: prev.version + 1,
            };
        }),

    reset: () => {
        nextDebitId = 1;
        set({ ...INITIAL, version: 0 });
    },
}));

/** Selector helper: does the wallet have enough to cover `cost` credits? */
export const selectCanAfford = (cost: number) => (s: WalletState) => s.total >= cost;
