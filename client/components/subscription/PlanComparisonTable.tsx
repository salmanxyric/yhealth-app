// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for plan availability and features.

"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, X, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface PlanSummary {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    tier: number;
    amountCents: number;
    yearlyAmountCents: number | null;
    currency: string;
    interval: "month" | "year";
    creditsIncludedMonthly: number;
    trialDays: number;
    isEnterprise: boolean;
    highlights: string[];
}

interface Props {
    currentPlanSlug: string | null;
    onSelect: (plan: PlanSummary, billingCycle: "month" | "year") => void;
    billingCycle: "month" | "year";
    onBillingCycleChange: (cycle: "month" | "year") => void;
    disabled?: boolean;
}

function formatPrice(cents: number, currency: string): string {
    const amount = cents / 100;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
}

export function PlanComparisonTable({
    currentPlanSlug,
    onSelect,
    billingCycle,
    onBillingCycleChange,
    disabled,
}: Props) {
    const [plans, setPlans] = useState<PlanSummary[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                type RawPlan = {
                    id: string;
                    slug: string;
                    name: string;
                    description: string | null;
                    tier?: number;
                    amount_cents: number;
                    yearly_amount_cents?: number | null;
                    currency: string;
                    interval: "month" | "year";
                    credits_included_monthly?: number;
                    trial_days?: number;
                    is_enterprise?: boolean;
                    features?: string[];
                };
                const res = await api.get<{ plans: RawPlan[] }>(
                    "/subscription/plans"
                );
                if (cancelled) return;
                if (res.success && res.data?.plans) {
                    const mapped: PlanSummary[] = res.data.plans
                        .filter((p) => !p.is_enterprise && p.slug !== "free")
                        .map((p) => ({
                            id: p.id,
                            slug: p.slug,
                            name: p.name,
                            description: p.description,
                            tier: p.tier ?? 0,
                            amountCents: p.amount_cents,
                            yearlyAmountCents: p.yearly_amount_cents ?? null,
                            currency: p.currency,
                            interval: p.interval,
                            creditsIncludedMonthly:
                                p.credits_included_monthly ?? 0,
                            trialDays: p.trial_days ?? 0,
                            isEnterprise: !!p.is_enterprise,
                            highlights: (p.features ?? []).slice(0, 4),
                        }));
                    setPlans(mapped);
                } else {
                    setLoadError("Unable to load plans right now.");
                }
            } catch (e) {
                if (cancelled) return;
                setLoadError(
                    e instanceof ApiError
                        ? e.message
                        : "Unable to load plans right now."
                );
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loadError) {
        return (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center text-rose-200">
                <X className="mx-auto h-6 w-6 mb-2" />
                <p className="text-sm">{loadError}</p>
            </div>
        );
    }

    if (!plans) {
        return (
            <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-12">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <p className="text-center text-sm text-slate-400">
                No plans are configured yet. Please contact support.
            </p>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-center gap-1 rounded-full border border-slate-800 bg-slate-900/40 p-1 w-fit mx-auto">
                {(["month", "year"] as const).map((cycle) => (
                    <button
                        key={cycle}
                        type="button"
                        onClick={() => onBillingCycleChange(cycle)}
                        className={cn(
                            "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                            billingCycle === cycle
                                ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950"
                                : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        {cycle === "month" ? "Monthly" : "Yearly"}
                        {cycle === "year" && (
                            <span className="ml-1 text-[10px] text-emerald-300">
                                Save 20%
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan) => {
                    const isCurrent = currentPlanSlug === plan.slug;
                    const priceCents =
                        billingCycle === "year" && plan.yearlyAmountCents
                            ? plan.yearlyAmountCents
                            : plan.amountCents;
                    const isPro = plan.slug === "pro";

                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative flex flex-col rounded-2xl border p-6",
                                "bg-gradient-to-b from-slate-900/60 to-slate-950/60",
                                isPro
                                    ? "border-cyan-400/50 shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)]"
                                    : "border-slate-800 hover:border-slate-700"
                            )}
                        >
                            {isPro && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-950">
                                    Most popular
                                </span>
                            )}
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-slate-100">
                                    {plan.name}
                                </h3>
                                {plan.description && (
                                    <p className="mt-1 text-xs text-slate-400">
                                        {plan.description}
                                    </p>
                                )}
                            </div>
                            <div className="mb-6">
                                <span className="text-3xl font-bold text-slate-100">
                                    {formatPrice(priceCents, plan.currency)}
                                </span>
                                <span className="ml-1 text-sm text-slate-500">
                                    /{billingCycle === "year" ? "yr" : "mo"}
                                </span>
                            </div>

                            <ul className="mb-6 flex-1 space-y-2.5 text-sm">
                                <li className="flex items-start gap-2 text-cyan-100">
                                    <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                                    <span>
                                        <span className="font-semibold">
                                            {plan.creditsIncludedMonthly.toLocaleString()}
                                        </span>{" "}
                                        credits / month
                                    </span>
                                </li>
                                {plan.trialDays > 0 && (
                                    <li className="flex items-start gap-2 text-emerald-200">
                                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                                        <span>{plan.trialDays}-day free trial</span>
                                    </li>
                                )}
                                {plan.highlights.map((h) => (
                                    <li
                                        key={h}
                                        className="flex items-start gap-2 text-slate-300"
                                    >
                                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-500" />
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                type="button"
                                disabled={disabled || isCurrent}
                                onClick={() => onSelect(plan, billingCycle)}
                                className={cn(
                                    "w-full rounded-full px-4 py-2.5 text-sm font-semibold transition-all",
                                    isCurrent
                                        ? "cursor-default bg-slate-800 text-slate-400"
                                        : isPro
                                          ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:opacity-90 active:scale-[0.98]"
                                          : "bg-slate-800 text-slate-100 hover:bg-slate-700 active:scale-[0.98]",
                                    disabled && "opacity-60"
                                )}
                            >
                                {isCurrent
                                    ? "Your current plan"
                                    : disabled
                                      ? "Loading…"
                                      : `Choose ${plan.name}`}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
