// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and page access.
// The matching AI/API endpoints are protected by requireFeature / consumeCredits
// middleware — this component only controls the UX around that boundary.

"use client";

import type { ReactNode } from "react";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { LockedFeatureScreen } from "@/components/subscription/LockedFeatureScreen";
import { Loader2 } from "lucide-react";

interface Props {
    pageKey: string;
    title?: string;
    description?: string;
    requiredPlan?: string;
    children: ReactNode;
}

/**
 * Page-level guard. Reads `bundle.pages[pageKey]` and renders:
 *   - skeleton while entitlements load
 *   - LockedFeatureScreen when access is 'locked' or 'none'
 *   - children when access is 'full' or 'preview'
 *
 * Convention: page.tsx wraps its content in <PageAccessGate pageKey="...">
 * at the segment root. The matching layout.tsx can keep chrome visible.
 */
export function PageAccessGate({
    pageKey,
    title,
    description,
    requiredPlan,
    children,
}: Props) {
    const { bundle, isLoading } = useEntitlements();

    if (isLoading && !bundle) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
        );
    }

    // Fail-open when the bundle never arrived — the server is still
    // authoritative. We'd rather show the feature briefly than block a
    // paying user during a transient network failure.
    if (!bundle) return <>{children}</>;

    const access = bundle.pages[pageKey];
    if (access === "none" || access === "locked") {
        return (
            <LockedFeatureScreen
                pageKey={pageKey}
                title={title}
                description={description}
                requiredPlan={requiredPlan}
            />
        );
    }

    return <>{children}</>;
}
