// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for promo code redemption.

"use client";

import { useState } from "react";
import { Tag, Loader2, Check } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
    onRedeemed?: (result: { code: string; grantedCredits?: number }) => void;
    className?: string;
}

export function PromoCodeInput({ onRedeemed, className }: Props) {
    const [code, setCode] = useState("");
    const [state, setState] = useState<"idle" | "submitting" | "applied">("idle");

    const handleRedeem = async () => {
        const normalized = code.trim().toUpperCase();
        if (!normalized) return;
        setState("submitting");
        try {
            const res = await api.post<{ success: boolean; grantedCredits?: number }>(
                "/me/promos/redeem",
                { code: normalized }
            );
            if (res.success) {
                setState("applied");
                toast.success(
                    res.data?.grantedCredits
                        ? `${res.data.grantedCredits} credits added`
                        : "Promo code applied"
                );
                onRedeemed?.({ code: normalized, grantedCredits: res.data?.grantedCredits });
                setCode("");
                setTimeout(() => setState("idle"), 2000);
            } else {
                toast.error("Promo code is not valid");
                setState("idle");
            }
        } catch (e) {
            toast.error(
                e instanceof ApiError
                    ? e.message
                    : "Unable to apply promo code"
            );
            setState("idle");
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleRedeem();
                    }}
                    placeholder="Promo code"
                    disabled={state !== "idle"}
                    className="w-full rounded-full border border-slate-800 bg-slate-950/40 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 disabled:opacity-60"
                    maxLength={40}
                />
            </div>
            <button
                type="button"
                onClick={handleRedeem}
                disabled={state !== "idle" || !code.trim()}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    state === "applied"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-60"
                )}
            >
                {state === "submitting" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {state === "applied" && <Check className="h-3.5 w-3.5" />}
                {state === "idle" && "Apply"}
                {state === "submitting" && "Applying"}
                {state === "applied" && "Applied"}
            </button>
        </div>
    );
}
