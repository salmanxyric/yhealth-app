// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for subscription state + invoices.

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    CreditCard,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { WalletSummaryCard } from "@/components/subscription/WalletSummaryCard";
import { CancelSubscriptionDialog } from "@/components/subscription/CancelSubscriptionDialog";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface SubscriptionMe {
    subscription: {
        id: string;
        status: string;
        current_period_start?: string | null;
        current_period_end: string | null;
        cancel_at_period_end?: boolean;
        plan: { id: string; name: string; slug: string; amount_cents: number; interval: string } | null;
    } | null;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

export default function BillingPageContent() {
    const { bundle, isLoading: entLoading } = useEntitlements();
    const { isAuthenticated } = useAuth();
    const [cancelOpen, setCancelOpen] = useState(false);
    const [subData, setSubData] = useState<SubscriptionMe | null>(null);
    const [subLoading, setSubLoading] = useState(true);
    const [subError, setSubError] = useState<string | null>(null);

    const fetchSub = useCallback(async () => {
        if (!isAuthenticated) { setSubLoading(false); return; }
        setSubLoading(true);
        setSubError(null);
        try {
            const res = await api.get<SubscriptionMe>("/subscription/me");
            if (res.data) setSubData(res.data as SubscriptionMe);
        } catch {
            setSubError("Failed to load billing info. Please try again.");
        }
        finally { setSubLoading(false); }
    }, [isAuthenticated]);

    useEffect(() => { fetchSub(); }, [fetchSub]);

    const isLoading = entLoading || subLoading;
    const activeSub = subData?.subscription;
    const planFromSub = activeSub?.plan;

    const plan = planFromSub ? { ...bundle?.plan, name: planFromSub.name, slug: planFromSub.slug } : bundle?.plan;
    const sub = activeSub ? {
        status: activeSub.status as "active" | "trialing" | "grace" | "past_due" | "none",
        currentPeriodEnd: activeSub.current_period_end,
        cancelAtPeriodEnd: activeSub.cancel_at_period_end ?? false,
        graceEndsAt: bundle?.subscription.graceEndsAt ?? null,
        trialEndsAt: bundle?.subscription.trialEndsAt ?? null,
        daysLeftInTrial: bundle?.subscription.daysLeftInTrial ?? null,
    } : bundle?.subscription;

    const isFreeTier = !plan || (plan.tier === 0 && !planFromSub);
    const isTrialing = sub?.status === "trialing";
    const isGrace = sub?.status === "grace";
    const isPastDue = sub?.status === "past_due";

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-5xl px-6 py-8">
                <Link
                    href="/settings"
                    className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to settings
                </Link>

                <header className="mb-8">
                    <h1 className="text-2xl font-semibold text-slate-100">
                        Billing &amp; subscription
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Manage your plan, payment, and credit balance.
                    </p>
                </header>

                {/* Dunning / grace warnings */}
                {isPastDue && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
                        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-amber-100">
                                We couldn&apos;t process your last payment
                            </p>
                            <p className="mt-1 text-xs text-amber-200/80">
                                We&apos;ll automatically retry. Update your card
                                to avoid interruption.
                            </p>
                        </div>
                    </div>
                )}
                {isGrace && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4">
                        <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-rose-100">
                                Your subscription was canceled
                            </p>
                            <p className="mt-1 text-xs text-rose-200/80">
                                Reactivate before {formatDate(sub?.graceEndsAt ?? null)} to keep
                                your credits and premium features.
                            </p>
                        </div>
                    </div>
                )}

                {subError && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4">
                        <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-rose-100">{subError}</p>
                            <button
                                type="button"
                                onClick={fetchSub}
                                className="mt-2 text-xs font-medium text-rose-300 hover:text-rose-200 underline transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                    {/* Current plan card */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Current plan
                                </p>
                                <div className="mt-2 flex items-center gap-3">
                                    <h2 className="text-2xl font-semibold text-slate-100">
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-slate-400 inline" />
                                        ) : plan?.name ?? "Free"}
                                    </h2>
                                    {isTrialing && (
                                        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-cyan-200">
                                            Trial
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 p-2.5">
                                <CreditCard className="h-5 w-5 text-cyan-300" />
                            </div>
                        </div>

                        <dl className="space-y-3 border-t border-slate-800 pt-4">
                            <div className="flex justify-between text-sm">
                                <dt className="text-slate-400">Status</dt>
                                <dd
                                    className={cn(
                                        "font-medium capitalize",
                                        sub?.status === "active" ||
                                            sub?.status === "trialing"
                                            ? "text-emerald-300"
                                            : sub?.status === "past_due" ||
                                                sub?.status === "grace"
                                              ? "text-rose-300"
                                              : "text-slate-200"
                                    )}
                                >
                                    {sub?.status ?? "none"}
                                </dd>
                            </div>
                            {sub?.trialEndsAt && (
                                <div className="flex justify-between text-sm">
                                    <dt className="text-slate-400">Trial ends</dt>
                                    <dd className="text-slate-200">
                                        {formatDate(sub.trialEndsAt)}
                                        {sub.daysLeftInTrial != null && (
                                            <span className="ml-2 text-xs text-cyan-300">
                                                ({sub.daysLeftInTrial} days left)
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            )}
                            {sub?.currentPeriodEnd && (
                                <div className="flex justify-between text-sm">
                                    <dt className="text-slate-400">
                                        {sub.cancelAtPeriodEnd ? "Ends" : "Next renewal"}
                                    </dt>
                                    <dd className="text-slate-200">
                                        {formatDate(sub.currentPeriodEnd)}
                                    </dd>
                                </div>
                            )}
                        </dl>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {isFreeTier ? (
                                <Link
                                    href="/subscription"
                                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90 active:scale-[0.98] transition-all"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Upgrade plan
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/subscription"
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900 transition-colors"
                                    >
                                        Change plan
                                    </Link>
                                    {!sub?.cancelAtPeriodEnd && (
                                        <button
                                            type="button"
                                            onClick={() => setCancelOpen(true)}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-sm font-medium text-slate-400 hover:text-rose-300 hover:border-rose-500/40 transition-colors"
                                        >
                                            Cancel subscription
                                        </button>
                                    )}
                                    {sub?.cancelAtPeriodEnd && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Cancellation scheduled
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <WalletSummaryCard />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/settings/billing/credits"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900 transition-colors"
                    >
                        Credits &amp; activity
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>

            <CancelSubscriptionDialog open={cancelOpen} onOpenChange={setCancelOpen} />
        </DashboardLayout>
    );
}
