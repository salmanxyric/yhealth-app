// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for checkout session creation.

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Props {
    planId: string;
    planSlug?: string;
    billingCycle: "month" | "year";
    label?: string;
    className?: string;
    disabled?: boolean;
}

/**
 * Creates a Stripe Checkout session on the server and redirects to Stripe.
 * Success URL points to /subscription/success; cancel returns to /upgrade.
 */
export function CheckoutButton({
    planId,
    billingCycle,
    label,
    className,
    disabled,
}: Props) {
    const [submitting, setSubmitting] = useState(false);

    const handleClick = async () => {
        if (submitting || disabled) return;
        setSubmitting(true);
        try {
            const origin =
                typeof window !== "undefined" ? window.location.origin : "";
            const res = await api.post<{ url: string }>(
                "/subscription/checkout-session",
                {
                    planId,
                    successUrl: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${origin}/upgrade`,
                    // Billing cycle hint — server picks yearly price if available.
                    billingCycle,
                }
            );
            if (res.success && res.data?.url) {
                window.location.href = res.data.url;
                return;
            }
            toast.error("Checkout is not available right now. Please try again.");
        } catch (e) {
            toast.error(
                e instanceof ApiError
                    ? e.message
                    : "Unable to start checkout"
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={submitting || disabled}
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all",
                "bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950",
                "hover:opacity-90 active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                className
            )}
        >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {label ?? (submitting ? "Starting checkout…" : "Continue to checkout")}
        </button>
    );
}
