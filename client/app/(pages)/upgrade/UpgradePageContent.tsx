// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for plan availability.

"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PlanComparisonTable, type PlanSummary } from "@/components/subscription/PlanComparisonTable";
import { CheckoutButton } from "@/components/subscription/CheckoutButton";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { Sparkles } from "lucide-react";

function UpgradeContent() {
    const { bundle } = useEntitlements();
    const params = useSearchParams();
    const highlightedFeature = params.get("feature");
    const currentSlug = bundle?.plan.slug ?? null;

    const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
    const [selectedPlan, setSelectedPlan] = useState<PlanSummary | null>(null);

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-6xl px-6 py-10">
                <header className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-1.5 mb-4">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                        <span className="text-xs font-medium text-cyan-200">
                            {highlightedFeature
                                ? `Unlock ${highlightedFeature} and more`
                                : "Choose the plan that fits"}
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-3">
                        Upgrade your Balencia experience
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto">
                        Every plan includes unlimited onboarding and core health tracking.
                        Upgrade to add AI coaching credits, voice, advanced analytics, and more.
                    </p>
                </header>

                <PlanComparisonTable
                    currentPlanSlug={currentSlug}
                    billingCycle={billingCycle}
                    onBillingCycleChange={setBillingCycle}
                    onSelect={setSelectedPlan}
                />

                {selectedPlan && (
                    <div className="mt-10 flex justify-center">
                        <CheckoutButton
                            planId={selectedPlan.id}
                            planSlug={selectedPlan.slug}
                            billingCycle={billingCycle}
                            label={`Continue to ${selectedPlan.name}`}
                        />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function UpgradePageContent() {
    return (
        <Suspense fallback={null}>
            <UpgradeContent />
        </Suspense>
    );
}
