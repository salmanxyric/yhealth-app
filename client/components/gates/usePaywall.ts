// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

"use client";

import { usePaywallStore } from "@/stores/paywallStore";

/**
 * Imperative paywall opener. Use for non-JSX code paths such as fetch error
 * handlers. For JSX gates prefer <FeatureGate> / <PlanGate> / <CreditGate>.
 */
export function usePaywall() {
    const open = usePaywallStore((s) => s.open);
    const close = usePaywallStore((s) => s.close);
    const isOpen = usePaywallStore((s) => s.isOpen);
    return { open, close, isOpen };
}
