"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Lock,
  Home,
  ArrowLeft,
  Crown,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Forbidden (403) screen — shown when the user is authenticated but does not
 * have permission for the requested resource (wrong role, expired plan, etc.).
 *
 * Route: `/forbidden`. Trigger by redirecting from middleware or server
 * components when permission checks fail.
 */
export default function ForbiddenPage() {
  // Pre-computed positions for orbiting lock rings.
  const orbits = useMemo(
    () =>
      [0, 1, 2].map((i) => ({
        id: i,
        size: 120 + i * 36,
        duration: 18 + i * 6,
        reverse: i % 2 === 1,
      })),
    []
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0">
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 30% 40%, rgba(168, 85, 247, 0.10) 0%, transparent 55%)",
              "radial-gradient(circle at 70% 60%, rgba(244, 114, 182, 0.10) 0%, transparent 55%)",
              "radial-gradient(circle at 30% 40%, rgba(168, 85, 247, 0.10) 0%, transparent 55%)",
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Diagonal stripes */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 18px)",
          }}
        />
      </div>

      {/* Soft orbs */}
      <div
        aria-hidden
        className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-pink-500/5 blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-xl mx-auto">
        {/* Locked shield */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.9, bounce: 0.35 }}
          className="relative mx-auto mb-8 flex h-44 w-44 items-center justify-center"
        >
          {/* Orbiting dotted rings */}
          {orbits.map((o) => (
            <motion.div
              key={o.id}
              aria-hidden
              className="absolute rounded-full border border-dashed border-purple-500/25"
              style={{ width: o.size, height: o.size }}
              animate={{ rotate: o.reverse ? -360 : 360 }}
              transition={{
                duration: o.duration,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          {/* Glow */}
          <motion.div
            aria-hidden
            className="absolute inset-8 rounded-full bg-linear-to-br from-purple-500/30 to-pink-500/30 blur-2xl"
            animate={{ opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Shield */}
          <motion.div
            className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-linear-to-br from-purple-500/20 to-pink-500/20 border border-white/15 backdrop-blur-sm shadow-xl shadow-purple-900/30"
            animate={{
              boxShadow: [
                "0 0 24px rgba(168, 85, 247, 0.18)",
                "0 0 44px rgba(168, 85, 247, 0.30)",
                "0 0 24px rgba(168, 85, 247, 0.18)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <ShieldAlert className="h-12 w-12 text-purple-200" />
            {/* Small lock badge */}
            <motion.span
              aria-hidden
              className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 border border-purple-500/40"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.6,
                type: "spring",
                bounce: 0.6,
                duration: 0.6,
              }}
            >
              <Lock className="h-4 w-4 text-pink-300" />
            </motion.span>
          </motion.div>
        </motion.div>

        {/* 403 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-200 text-xs font-medium tracking-[0.2em] mb-5"
        >
          ERROR 403 — ACCESS RESTRICTED
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight"
        >
          You don&apos;t have access to this area
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-slate-400 text-base md:text-lg max-w-md mx-auto mb-8 leading-relaxed"
        >
          Your account is signed in, but this page requires a different role or
          subscription tier. If you believe this is a mistake, contact your
          workspace owner.
        </motion.p>

        {/* Reasons */}
        <motion.ul
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mx-auto max-w-md mb-10 grid gap-2 text-left"
        >
          <ReasonRow text="The page is restricted to admins or specific roles." />
          <ReasonRow text="Your current subscription does not include this feature." />
          <ReasonRow text="An invite link or share token may have expired." />
        </motion.ul>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] px-8"
          >
            <Link href="/upgrade">
              <Crown className="w-5 h-5 mr-2" />
              Upgrade plan
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-600 backdrop-blur-sm px-8"
          >
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
          </Button>
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm"
        >
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-slate-500 hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go back
          </button>
          <span className="text-slate-800">|</span>
          <Link
            href="/help"
            className="flex items-center gap-1.5 text-slate-500 hover:text-purple-300 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Contact support
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function ReasonRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 px-3 py-2.5 backdrop-blur-sm">
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-purple-300"
      >
        <Lock className="h-3 w-3" />
      </span>
      <span className="text-sm text-slate-300 leading-relaxed">{text}</span>
    </li>
  );
}
