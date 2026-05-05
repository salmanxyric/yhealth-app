// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Zap } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePaywallStore, type PaywallReason } from "@/stores/paywallStore";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { track } from "@/lib/analytics";

const REASON_COPY: Record<PaywallReason, { title: string; description: string }> = {
    feature_disabled: {
        title: "Feature not available on your plan",
        description: "This capability is included in a paid plan. Upgrade to unlock it.",
    },
    plan_required: {
        title: "Upgrade to continue",
        description: "Pick a plan that fits and keep your momentum.",
    },
    credits_exhausted: {
        title: "You're out of credits",
        description: "Upgrade or top up to keep using AI features this cycle.",
    },
    limit_reached: {
        title: "You've hit today's limit",
        description: "Upgrade for higher daily limits — or come back tomorrow.",
    },
    trial_expired: {
        title: "Your trial has ended",
        description: "Pick a plan to keep your progress going.",
    },
};

/**
 * Global upgrade modal. Listens to paywallStore and opens when triggered from
 * a gate primitive, locked sidebar item, or 402 error boundary.
 *
 * Sprint 1 renders a minimal "see plans" CTA that routes to /subscription.
 * Sprint 3 replaces the plan grid inline with <PlanComparisonTable>.
 */
export function UpgradeModal() {
    const router = useRouter();
    const { isOpen, featureKey, reason, requiredTier, close } = usePaywallStore();
    const { bundle } = useEntitlements();

    const copy = reason ? REASON_COPY[reason] : REASON_COPY.plan_required;

    const onSeePlans = () => {
        track("checkout_started", { featureKey, reason, requiredTier, surface: "upgrade_modal" });
        close();
        router.push("/subscription");
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) close();
            }}
        >
            <DialogContent className="sm:max-w-md border-cyan-400/20 bg-slate-950/95 backdrop-blur">
                <DialogHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-teal-400/20 text-cyan-300 ring-1 ring-cyan-400/30">
                        <Sparkles className="h-6 w-6" aria-hidden />
                    </div>
                    <DialogTitle className="text-center text-xl text-slate-100">
                        {copy.title}
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-slate-400">
                        {copy.description}
                    </DialogDescription>
                </DialogHeader>

                {bundle && (
                    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 text-sm text-slate-300">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Current plan</span>
                            <span className="font-medium text-slate-100">{bundle.plan.name}</span>
                        </div>
                        {bundle.wallet.total > 0 || bundle.plan.slug === "free" ? (
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-slate-400">Credits left</span>
                                <span className="flex items-center gap-1 font-medium text-cyan-300">
                                    <Zap className="h-3.5 w-3.5" aria-hidden />
                                    {bundle.wallet.total.toLocaleString()}
                                </span>
                            </div>
                        ) : null}
                    </div>
                )}

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        onClick={onSeePlans}
                        className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-900 hover:from-cyan-300 hover:to-teal-300"
                    >
                        See plans
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={close}
                        className="w-full text-slate-400 hover:text-slate-200"
                    >
                        Not now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
