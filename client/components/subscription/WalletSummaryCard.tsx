// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for wallet balance.

"use client";

import { Sparkles, Clock, TrendingUp } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { cn } from "@/lib/utils";

interface Props {
    className?: string;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

export function WalletSummaryCard({ className }: Props) {
    const planCredits = useWalletStore((s) => s.planCredits);
    const bonusCredits = useWalletStore((s) => s.bonusCredits);
    const total = useWalletStore((s) => s.total);
    const { bundle } = useEntitlements();

    const planName = bundle?.plan.name ?? "Free";
    const nextResetAt = bundle?.wallet.nextResetAt ?? null;

    return (
        <div
            className={cn(
                "rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-slate-900/60 p-6",
                className
            )}
        >
            <div className="flex items-start justify-between mb-6">
                <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                        Credits remaining
                    </p>
                    <p className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-slate-100 tabular-nums">
                            {total.toLocaleString()}
                        </span>
                        <span className="text-sm text-slate-400">
                            / {planName}
                        </span>
                    </p>
                </div>
                <div className="rounded-full bg-cyan-400/10 p-3">
                    <Sparkles className="h-5 w-5 text-cyan-400" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Plan
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-100 tabular-nums">
                        {planCredits.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Bonus
                    </p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300 tabular-nums">
                        {bonusCredits.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Next reset: {formatDate(nextResetAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Plan drains before bonus</span>
                </div>
            </div>
        </div>
    );
}
