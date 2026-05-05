// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for wallet + ledger data.

"use client";

import { DashboardLayout } from "@/components/layout";
import { WalletSummaryCard } from "@/components/subscription/WalletSummaryCard";
import { CreditLedgerTable } from "@/components/subscription/CreditLedgerTable";
import { PromoCodeInput } from "@/components/subscription/PromoCodeInput";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEntitlements } from "@/app/context/EntitlementsContext";

export default function BillingCreditsPageContent() {
    const { refetch } = useEntitlements();

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
                        Credits &amp; usage
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Track every AI credit you&apos;ve earned and spent.
                    </p>
                </header>

                <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
                    <div className="space-y-4">
                        <WalletSummaryCard />
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">
                                Have a promo code?
                            </p>
                            <PromoCodeInput onRedeemed={() => void refetch()} />
                        </div>
                    </div>

                    <CreditLedgerTable />
                </div>
            </div>
        </DashboardLayout>
    );
}
