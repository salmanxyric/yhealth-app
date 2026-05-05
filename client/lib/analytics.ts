/**
 * Analytics stub — wraps an optional `window.analytics.track` so gate primitives
 * and upgrade flows can fire events without depending on a specific provider.
 * Replace the inner call with Segment / Mixpanel / Amplitude when we pick one.
 */

export type AnalyticsEvent =
    | "paywall_viewed"
    | "upgrade_cta_clicked"
    | "plan_selected"
    | "checkout_started"
    | "checkout_completed"
    | "checkout_abandoned"
    | "credit_exhausted_shown"
    | "locked_page_viewed"
    | "trial_banner_clicked"
    | "feature_gate_denied"
    | "plan_gate_denied"
    | "credit_gate_blocked";

type WindowWithAnalytics = Window & {
    analytics?: { track?: (event: string, props?: Record<string, unknown>) => void };
};

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
    try {
        if (typeof window === "undefined") return;
        const w = window as WindowWithAnalytics;
        w.analytics?.track?.(event, props);
        if (process.env.NODE_ENV === "development") {
             
            console.debug("[analytics]", event, props ?? {});
        }
    } catch {
        /* analytics must never break the app */
    }
}
