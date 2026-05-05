// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and menu visibility.

"use client";

import { useCallback } from "react";
import { useEntitlements } from "@/app/context/EntitlementsContext";

/**
 * Maps a client-side route href → a server menu_catalog key.
 *
 * Convention: the first non-empty path segment is the menu_key, with a few
 * overrides for legacy / multi-word routes. If the menu_key is not in the
 * server catalog, we fall back to "visible, unlocked" so rollout is additive
 * and safe.
 */
const HREF_PREFIX_TO_MENU_KEY: Record<string, string> = {
    "/ai-coach": "ai.coach",
    "/voice-assistant": "voice-assistant",
    "/voice-call": "voice-call",
    "/knowledge-graph": "knowledge-graph",
    "/money-map": "money-map",
    "/chat-history": "chat-history",
    "/activity-status": "activity-status",
    "/life-areas": "life-areas",
    "/admin/subscriptions": "admin.subscriptions",
    "/settings/billing": "settings",
    "/upgrade": "upgrade",
    "/contracts": "contracts",
    "/community": "community",
    "/webinars": "webinars",
    "/subscription": "subscription",
};

function hrefToMenuKey(href: string): string | null {
    if (!href) return null;
    // Prefix overrides first (longest wins — order above is already specific).
    for (const [prefix, key] of Object.entries(HREF_PREFIX_TO_MENU_KEY)) {
        if (href === prefix || href.startsWith(prefix + "/") || href.startsWith(prefix + "?")) {
            return key;
        }
    }
    // Generic: first segment, strip query.
    const clean = href.split("?")[0].split("#")[0];
    const seg = clean.replace(/^\//, "").split("/")[0] || "";
    return seg || null;
}

export interface NavEntitlement {
    visible: boolean;
    locked: boolean;
    lockedCta: string | null;
    /** True while entitlements are still loading. Render defensively (skeleton). */
    loading: boolean;
}

/**
 * Ask whether a nav item should be visible / locked given the user's plan.
 * Fail-open: unknown menu keys are treated as visible so a missing catalog
 * entry never hides a feature in production.
 */
export function useNavEntitlement() {
    const { bundle, isLoading } = useEntitlements();

    return useCallback(
        (href: string): NavEntitlement => {
            if (isLoading && !bundle) {
                return { visible: true, locked: false, lockedCta: null, loading: true };
            }
            if (!bundle) {
                return { visible: true, locked: false, lockedCta: null, loading: false };
            }

            const key = hrefToMenuKey(href);
            if (!key) return { visible: true, locked: false, lockedCta: null, loading: false };

            const menu = bundle.menus[key];
            if (!menu) {
                // Unknown key — fail open (visible, unlocked).
                return { visible: true, locked: false, lockedCta: null, loading: false };
            }

            const pageAccess = bundle.pages[key];
            const locked = pageAccess === "locked" || pageAccess === "preview";

            return {
                visible: menu.visible,
                locked,
                lockedCta: menu.lockedCta,
                loading: false,
            };
        },
        [bundle, isLoading]
    );
}
