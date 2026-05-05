// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { ApiError } from "@/lib/api-client";
import { usePaywallStore, type PaywallReason } from "@/stores/paywallStore";
import { track } from "@/lib/analytics";

interface Props {
    children: ReactNode;
    /** Optional fallback rendered INSIDE the boundary when a 402/403 is caught. */
    fallback?: ReactNode;
}

interface State {
    error: ApiError | null;
    /** Non-paywall errors we need to rethrow from render so the next boundary sees them. */
    passthroughError: unknown;
}

/**
 * Catches ApiError thrown from render paths (e.g. React Query's throw-on-error)
 * with statusCode in {402, 403} and opens the paywall. For fetch errors in
 * imperative code paths, wire `usePaywall().open()` in the catch block instead.
 *
 * Non-paywall errors are re-thrown during render so parent boundaries catch them.
 * We do NOT rethrow from getDerivedStateFromError (undefined behavior per React).
 */
export class PaywallErrorBoundary extends Component<Props, State> {
    state: State = { error: null, passthroughError: null };

    static getDerivedStateFromError(error: unknown): State {
        if (error instanceof ApiError && (error.statusCode === 402 || error.statusCode === 403)) {
            return { error, passthroughError: null };
        }
        // Store non-paywall errors in state so render() can rethrow them.
        return { error: null, passthroughError: error };
    }

    componentDidCatch(error: unknown, info: ErrorInfo) {
        if (!(error instanceof ApiError)) return;
        if (error.statusCode !== 402 && error.statusCode !== 403) return;

        track("paywall_viewed", {
            statusCode: error.statusCode,
            code: error.code,
            surface: "error_boundary",
            stack: info.componentStack,
        });
        const store = usePaywallStore.getState();
        const reason: PaywallReason =
            error.code === "CREDITS_EXHAUSTED"
                ? "credits_exhausted"
                : error.code === "FEATURE_LIMIT_REACHED"
                  ? "limit_reached"
                  : "plan_required";
        store.open({ reason });
    }

    render() {
        if (this.state.passthroughError) {
            // Rethrow so the next outer boundary handles it. This is the
            // React-blessed way to "skip" an error boundary.
            throw this.state.passthroughError;
        }
        if (this.state.error) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}
