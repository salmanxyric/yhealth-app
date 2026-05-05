// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

"use client";

import { useWalletStore } from "@/stores/walletStore";

export interface UseCreditsResult {
    planCredits: number;
    bonusCredits: number;
    total: number;
    /** True when total >= cost. Server is still authoritative. */
    canAfford: (cost: number) => boolean;
    pendingDebitCount: number;
}

/**
 * Read live wallet balance. Subscribes only to wallet slice so a ticking credit
 * chip does not re-render the rest of the tree.
 */
export function useCredits(): UseCreditsResult {
    const planCredits = useWalletStore((s) => s.planCredits);
    const bonusCredits = useWalletStore((s) => s.bonusCredits);
    const total = useWalletStore((s) => s.total);
    const pendingDebitCount = useWalletStore((s) => s.pendingDebitCount);

    return {
        planCredits,
        bonusCredits,
        total,
        canAfford: (cost: number) => total >= cost,
        pendingDebitCount,
    };
}
