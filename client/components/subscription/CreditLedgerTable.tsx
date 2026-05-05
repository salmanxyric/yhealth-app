// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for ledger data.

"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, RefreshCcw } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface LedgerRow {
    id: string;
    createdAt: string;
    delta: number;
    bucket: "plan" | "bonus";
    kind: string;
    reason: string;
    featureKey: string | null;
    balanceAfterPlan: number;
    balanceAfterBonus: number;
}

interface Props {
    pageSize?: number;
    className?: string;
}

function formatWhen(iso: string): string {
    try {
        const d = new Date(iso);
        const diff = Date.now() - d.getTime();
        if (diff < 60_000) return "just now";
        if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
        if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

function kindColor(kind: string, delta: number): string {
    if (kind === "grant" || kind === "rollover" || kind === "refund") return "text-emerald-300";
    if (kind === "release") return "text-cyan-300";
    if (delta < 0) return "text-rose-300";
    return "text-slate-300";
}

export function CreditLedgerTable({ pageSize = 20, className }: Props) {
    const [rows, setRows] = useState<LedgerRow[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setRows(null);
            try {
                const res = await api.get<{ entries: LedgerRow[] }>(
                    `/me/credits/ledger?limit=${pageSize}`
                );
                if (cancelled) return;
                if (res.success && res.data?.entries) {
                    setRows(res.data.entries);
                    setLoadError(null);
                } else {
                    setLoadError("Unable to load ledger right now.");
                }
            } catch (e) {
                if (cancelled) return;
                setLoadError(
                    e instanceof ApiError
                        ? e.message
                        : "Unable to load ledger right now."
                );
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [pageSize, reloadCount]);

    return (
        <div className={cn("rounded-2xl border border-slate-800 bg-slate-900/40", className)}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                        Credit activity
                    </h3>
                    <p className="text-xs text-slate-500">
                        Last {pageSize} transactions
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setReloadCount((n) => n + 1)}
                    className="rounded-full p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    aria-label="Refresh ledger"
                >
                    <RefreshCcw className="h-3.5 w-3.5" />
                </button>
            </div>

            {loadError && (
                <div className="p-6 text-sm text-rose-300 text-center">{loadError}</div>
            )}
            {!loadError && !rows && (
                <div className="p-12 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                </div>
            )}
            {rows && rows.length === 0 && (
                <div className="p-12 text-center text-sm text-slate-500">
                    No activity yet.
                </div>
            )}
            {rows && rows.length > 0 && (
                <ul className="divide-y divide-slate-800">
                    {rows.map((row) => {
                        const positive = row.delta > 0;
                        const Icon = positive ? ArrowUp : ArrowDown;
                        return (
                            <li
                                key={row.id}
                                className="flex items-center gap-3 px-6 py-3"
                            >
                                <div
                                    className={cn(
                                        "rounded-full p-1.5",
                                        positive
                                            ? "bg-emerald-500/10 text-emerald-300"
                                            : "bg-rose-500/10 text-rose-300"
                                    )}
                                >
                                    <Icon className="h-3 w-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-200 truncate">
                                        {row.featureKey ?? row.reason}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        {row.kind} · {row.bucket} ·{" "}
                                        {formatWhen(row.createdAt)}
                                    </p>
                                </div>
                                <p
                                    className={cn(
                                        "text-sm font-medium tabular-nums",
                                        kindColor(row.kind, row.delta)
                                    )}
                                >
                                    {positive ? "+" : ""}
                                    {row.delta}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
