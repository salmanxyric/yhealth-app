"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, LogIn, UserPlus, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

// Only allow same-origin relative paths to avoid open-redirect risk.
function safeCallbackUrl(from: string | null): string {
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return from;
  }
  return "/dashboard";
}

/**
 * Unauthorized (401) screen — shown when authentication is required but the
 * user is not signed in (or their session has expired).
 *
 * Reads `?from=/path` to preserve the originally requested URL and round-trips
 * it through `/auth/signin?callbackUrl=...` after sign-in.
 *
 * Route: `/unauthorized`.
 */
export default function UnauthorizedPage() {
  return (
    <Suspense fallback={null}>
      <UnauthorizedInner />
    </Suspense>
  );
}

function UnauthorizedInner() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const callbackUrl = safeCallbackUrl(fromParam);

  const signinHref = `/auth/signin?callbackUrl=${encodeURIComponent(
    callbackUrl
  )}`;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0">
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.10) 0%, transparent 55%)",
              "radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.10) 0%, transparent 55%)",
              "radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.10) 0%, transparent 55%)",
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Soft orbs */}
      <div
        aria-hidden
        className="absolute top-1/3 -left-20 w-80 h-80 rounded-full bg-sky-500/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-1/3 -right-20 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-xl mx-auto">
        {/* Key + keyhole motif */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.9, bounce: 0.35 }}
          className="relative mx-auto mb-8 flex h-40 w-40 items-center justify-center"
        >
          {/* Pulsing halo */}
          <motion.div
            aria-hidden
            className="absolute inset-4 rounded-full bg-linear-to-br from-sky-500/25 to-emerald-500/25 blur-2xl"
            animate={{ opacity: [0.4, 0.85, 0.4], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Outer ring */}
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full border border-sky-500/30"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Center card with key */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br from-sky-500/20 to-emerald-500/20 border border-white/15 backdrop-blur-sm">
            {/* Animated key sliding in */}
            <motion.div
              initial={{ x: 40, opacity: 0, rotate: -25 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              transition={{
                delay: 0.6,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <KeyRound className="h-12 w-12 text-sky-200" />
            </motion.div>

            {/* Sparkle accent */}
            <motion.span
              aria-hidden
              className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400"
              animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                boxShadow: "0 0 10px rgba(16, 185, 129, 0.7)",
              }}
            />
          </div>
        </motion.div>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-200 text-xs font-medium tracking-[0.2em] mb-5"
        >
          ERROR 401 — SIGN-IN REQUIRED
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight"
        >
          Please sign in to continue
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-slate-400 text-base md:text-lg max-w-md mx-auto mb-8 leading-relaxed"
        >
          {fromParam
            ? "This page is part of your private workspace. Sign in and we'll take you right back."
            : "You need to be signed in to view this content. Sign in or create a new account to continue."}
        </motion.p>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mx-auto mb-8 inline-flex items-center gap-2 text-xs text-slate-500"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          End-to-end encrypted &middot; HIPAA-aligned data handling
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="bg-linear-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white shadow-lg shadow-sky-500/20 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] px-8"
          >
            <Link href={signinHref}>
              <LogIn className="w-5 h-5 mr-2" />
              Sign in
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-600 backdrop-blur-sm px-8"
          >
            <Link href="/auth/signup">
              <UserPlus className="w-5 h-5 mr-2" />
              Create account
            </Link>
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm"
        >
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-500 hover:text-sky-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
          <span className="text-slate-800">|</span>
          <Link
            href="/auth/forgot-password"
            className="text-slate-500 hover:text-sky-300 transition-colors"
          >
            Forgot password?
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
