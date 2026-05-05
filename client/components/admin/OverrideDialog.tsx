// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for override mutations.

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export type OverrideAction =
    | "grant_credits"
    | "deduct_credits"
    | "extend_trial"
    | "comp_plan"
    | "suspend"
    | "unsuspend";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    action: OverrideAction;
    userId: string | null;
    userEmail?: string | null;
    plans?: Array<{ id: string; name: string; slug: string }>;
    onSuccess?: () => void;
}

const ACTION_META: Record<
    OverrideAction,
    { title: string; endpoint: string; amountLabel?: string; destructive?: boolean }
> = {
    grant_credits: { title: "Grant credits", endpoint: "/admin/billing/grant-credits", amountLabel: "Credits to grant" },
    deduct_credits: { title: "Deduct credits", endpoint: "/admin/billing/deduct-credits", amountLabel: "Credits to deduct", destructive: true },
    extend_trial: { title: "Extend trial", endpoint: "/admin/billing/extend-trial", amountLabel: "Days to add" },
    comp_plan: { title: "Comp plan", endpoint: "/admin/billing/comp-plan" },
    suspend: { title: "Suspend account", endpoint: "/admin/billing/suspend", destructive: true },
    unsuspend: { title: "Unsuspend account", endpoint: "/admin/billing/unsuspend" },
};

export function OverrideDialog({
    open,
    onOpenChange,
    action,
    userId,
    userEmail,
    plans = [],
    onSuccess,
}: Props) {
    const meta = ACTION_META[action];
    const [amount, setAmount] = useState<string>("");
    const [bucket, setBucket] = useState<"plan" | "bonus">("bonus");
    const [reason, setReason] = useState<string>("");
    const [planId, setPlanId] = useState<string>("");
    const [days, setDays] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    const needsAmount = action === "grant_credits" || action === "deduct_credits" || action === "extend_trial";
    const needsPlan = action === "comp_plan";

    const handleSubmit = async () => {
        if (!userId) return;
        const payload: Record<string, unknown> = { userId, reason: reason.trim() || undefined };

        if (action === "grant_credits" || action === "deduct_credits") {
            const n = parseInt(amount, 10);
            if (!Number.isFinite(n) || n <= 0) {
                toast.error("Amount must be a positive integer");
                return;
            }
            payload.amount = n;
            if (action === "grant_credits") payload.bucket = bucket;
        }
        if (action === "extend_trial") {
            const n = parseInt(amount, 10);
            if (!Number.isFinite(n) || n <= 0) {
                toast.error("Days must be a positive integer");
                return;
            }
            payload.days = n;
        }
        if (action === "comp_plan") {
            if (!planId) {
                toast.error("Pick a plan to comp");
                return;
            }
            payload.planId = planId;
            const n = parseInt(days, 10);
            if (days && Number.isFinite(n) && n > 0) payload.days = n;
        }

        setSubmitting(true);
        try {
            await api.post(meta.endpoint, payload);
            toast.success(meta.title + " applied");
            onSuccess?.();
            onOpenChange(false);
            setAmount("");
            setReason("");
            setPlanId("");
            setDays("");
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Override failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{meta.title}</DialogTitle>
                    {userEmail && (
                        <DialogDescription className="pt-2 text-slate-400">
                            Target: <span className="font-mono">{userEmail}</span>
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {needsAmount && (
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                                {meta.amountLabel}
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min={1}
                                step={1}
                                className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                            />
                        </div>
                    )}

                    {action === "grant_credits" && (
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                                Bucket
                            </label>
                            <div className="flex gap-2">
                                {(["bonus", "plan"] as const).map((b) => (
                                    <button
                                        key={b}
                                        type="button"
                                        onClick={() => setBucket(b)}
                                        className={cn(
                                            "flex-1 rounded-lg border px-3 py-2 text-sm capitalize",
                                            bucket === b
                                                ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                                                : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200"
                                        )}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {needsPlan && (
                        <>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                                    Plan
                                </label>
                                <select
                                    value={planId}
                                    onChange={(e) => setPlanId(e.target.value)}
                                    className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                                >
                                    <option value="">Select a plan…</option>
                                    {plans.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.slug})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                                    Duration (days, optional)
                                </label>
                                <input
                                    type="number"
                                    value={days}
                                    onChange={(e) => setDays(e.target.value)}
                                    min={1}
                                    max={730}
                                    placeholder="Leave blank for open-ended"
                                    className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">
                            Reason (audit trail)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                            maxLength={200}
                            placeholder="Support ticket #1234, goodwill for outage, …"
                            className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 pt-4">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                        className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 border border-slate-800 hover:bg-slate-900 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !userId}
                        className={cn(
                            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                            meta.destructive
                                ? "bg-rose-500 text-white hover:bg-rose-400"
                                : "bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:opacity-90",
                            "disabled:opacity-60"
                        )}
                    >
                        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Apply
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
