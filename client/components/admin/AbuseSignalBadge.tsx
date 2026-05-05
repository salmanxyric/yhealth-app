// CLIENT GATES ARE UX HINTS ONLY.

"use client";

import { AlertTriangle, ShieldAlert, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    score: number;
    className?: string;
}

export function AbuseSignalBadge({ score, className }: Props) {
    const level = score >= 90 ? "critical" : score >= 75 ? "high" : score >= 50 ? "medium" : "low";
    const Icon = level === "critical" ? Flame : level === "high" ? ShieldAlert : AlertTriangle;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
                level === "critical" && "bg-rose-500/15 text-rose-200 border-rose-500/40",
                level === "high" && "bg-amber-500/15 text-amber-200 border-amber-500/40",
                level === "medium" && "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
                level === "low" && "bg-slate-800 text-slate-400 border-slate-700",
                className
            )}
        >
            <Icon className="h-3 w-3" />
            {score}
        </span>
    );
}
