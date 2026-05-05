// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { useWalletStore } from "@/stores/walletStore";
import { initSocket } from "@/lib/socket-client";

/**
 * Live entitlement + wallet sync via Socket.IO.
 *
 * Server emits two events on the user's room:
 *   - `entitlements:invalidate` — full refetch trigger
 *       (fired by entitlement.service::invalidateEntitlements after admin
 *       overrides, plan matrix edits, subscription state changes)
 *   - `wallet:update` — fine-grained wallet snapshot
 *       (fired by credit.service::emitWalletDelta after grant/consume/settle)
 *
 * This bridge subscribes to both and hydrates the appropriate client state
 * without waiting for the next focus/visibility tick. Degrades silently when
 * the socket is disconnected — EntitlementsContext still polls on focus.
 */
export function EntitlementsSocketBridge() {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id ?? null;
    const { refetch } = useEntitlements();
    const hydrateWallet = useWalletStore((s) => s.hydrate);

    useEffect(() => {
        if (!isAuthenticated || !userId) return;

        const socket = initSocket();
        if (!socket) return;

        const onInvalidate = (payload: { userId?: string }) => {
            if (payload?.userId && payload.userId !== userId) return;
            void refetch();
        };

        const onWalletUpdate = (payload: {
            userId?: string;
            wallet?: { planCredits: number; bonusCredits: number; total: number };
        }) => {
            if (payload?.userId && payload.userId !== userId) return;
            if (!payload?.wallet) return;
            hydrateWallet({
                planCredits: payload.wallet.planCredits,
                bonusCredits: payload.wallet.bonusCredits,
            });
        };

        socket.on("entitlements:invalidate", onInvalidate);
        socket.on("wallet:update", onWalletUpdate);

        return () => {
            socket.off("entitlements:invalidate", onInvalidate);
            socket.off("wallet:update", onWalletUpdate);
        };
    }, [isAuthenticated, userId, refetch, hydrateWallet]);

    return null;
}
