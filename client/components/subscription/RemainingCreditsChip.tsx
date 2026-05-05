// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

"use client";

import Link from "next/link";
import { useWalletStore } from "@/stores/walletStore";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import { Coins } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
    className?: string;
}

export function RemainingCreditsChip({ className }: Props) {
    const total = useWalletStore((s) => s.total);
    const pending = useWalletStore((s) => s.pendingDebitCount);
    const { isLoading, bundle } = useEntitlements();

    if (isLoading && !bundle) {
        return (
            <div
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs",
                    "bg-slate-800/60 text-slate-500 animate-pulse border border-slate-700/50",
                    className
                )}
                aria-label="Loading credits"
            >
                <Coins className="h-3.5 w-3.5" />
                <span className="tabular-nums">…</span>
            </div>
        );
    }

    const isLow = total > 0 && total <= 10;
    const isEmpty = total === 0;

    return (
        <Link
            href="/subscription"
            aria-label={`${total} credits remaining — open subscription`}
            className={cn(
                "group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold",
                "transition-all duration-300 hover:scale-105 active:scale-95",
                "border backdrop-blur-sm",
                isEmpty &&
                    "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15 hover:shadow-lg hover:shadow-rose-500/10",
                isLow &&
                    !isEmpty &&
                    "border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15 hover:shadow-lg hover:shadow-amber-400/10",
                !isLow &&
                    !isEmpty &&
                    "border-cyan-400/30 bg-cyan-400/5 text-cyan-200 hover:bg-cyan-400/10 hover:shadow-lg hover:shadow-cyan-400/10",
                className
            )}
        >
            <motion.div
                animate={isEmpty ? { rotate: [0, -10, 10, -10, 0] } : isLow ? { rotate: [0, -5, 5, 0] } : {}}
                transition={isEmpty ? { duration: 0.5, repeat: Infinity, repeatDelay: 2 } : isLow ? { duration: 0.6, repeat: Infinity, repeatDelay: 3 } : {}}
            >
                <Coins className={cn(
                    "h-3.5 w-3.5 transition-colors duration-300",
                    isEmpty ? "text-rose-400" : isLow ? "text-amber-400" : "text-cyan-400",
                    "group-hover:scale-110"
                )} />
            </motion.div>
            <span className="tabular-nums">{total.toLocaleString()}</span>
            {pending > 0 && (
                <span className="text-[10px] opacity-60" aria-label="pending">
                    · {pending}
                </span>
            )}
        </Link>
    );
}
