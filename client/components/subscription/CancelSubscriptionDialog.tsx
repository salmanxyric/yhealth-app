// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for subscription state.

"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api-client";
import { useEntitlements } from "@/app/context/EntitlementsContext";
import toast from "react-hot-toast";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CancelSubscriptionDialog({ open, onOpenChange }: Props) {
    const { bundle, refetch } = useEntitlements();
    const [reason, setReason] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);

    const currentPlan = bundle?.plan.name ?? "your plan";
    const periodEnd = bundle?.subscription.currentPeriodEnd
        ? new Date(bundle.subscription.currentPeriodEnd).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
          })
        : null;

    const handleCancel = async () => {
        setSubmitting(true);
        try {
            await api.post("/subscription/cancel", { reason });
            toast.success(
                periodEnd
                    ? `Cancellation scheduled — access until ${periodEnd}`
                    : "Subscription canceled"
            );
            await refetch();
            onOpenChange(false);
        } catch (e) {
            toast.error(
                e instanceof ApiError ? e.message : "Unable to cancel. Please contact support."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-amber-500/10 p-2">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                        </div>
                        <DialogTitle>Cancel subscription?</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2 text-slate-400">
                        You&apos;ll keep {currentPlan} access
                        {periodEnd ? ` until ${periodEnd}` : " until the current period ends"}
                        . After that, your account returns to the free plan.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 mt-4">
                    <label
                        htmlFor="cancel-reason"
                        className="block text-xs font-medium uppercase tracking-wider text-slate-500"
                    >
                        Why are you leaving? (optional)
                    </label>
                    <textarea
                        id="cancel-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                        placeholder="Too expensive, missing a feature, didn't use it…"
                        maxLength={500}
                    />
                </div>

                <DialogFooter className="gap-2 pt-4">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                        className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 border border-slate-800 hover:bg-slate-900 disabled:opacity-50 transition-colors"
                    >
                        Keep my plan
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white bg-rose-500 hover:bg-rose-400 disabled:opacity-60 transition-colors"
                    >
                        {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Cancel subscription
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
