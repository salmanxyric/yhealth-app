"use client";

import { motion } from "framer-motion";

/**
 * Root loading state — automatically rendered by Next.js during route transitions.
 *
 * Design intent: lightweight, brand-consistent, paints in <50ms.
 * No Image / network dependencies, pure CSS + framer-motion.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950"
    >
      {/* Ambient gradient wash */}
      <motion.div
        aria-hidden
        className="absolute inset-0 opacity-40"
        animate={{
          background: [
            "radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.10) 0%, transparent 55%)",
            "radial-gradient(circle at 70% 60%, rgba(14, 165, 233, 0.10) 0%, transparent 55%)",
            "radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.10) 0%, transparent 55%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Orbiting loader */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          {/* Outer rotating ring */}
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full border border-emerald-500/15"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* Middle rotating ring (reverse) */}
          <motion.div
            aria-hidden
            className="absolute inset-3 rounded-full border border-sky-500/15"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, black 40%, black 60%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 40%, black 60%, transparent 100%)",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          {/* Orbiting dot */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          </motion.div>

          {/* Pulse halo */}
          <motion.div
            aria-hidden
            className="absolute inset-6 rounded-full bg-linear-to-br from-emerald-500/20 to-sky-500/20 blur-xl"
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Center mark */}
          <motion.div
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500/15 to-sky-500/15 border border-white/10 backdrop-blur-sm"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-xl font-bold bg-linear-to-br from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              B
            </span>
          </motion.div>
        </div>

        {/* Animated shimmer bar */}
        <div className="relative h-px w-48 overflow-hidden rounded-full bg-slate-800/60">
          <motion.div
            className="absolute inset-y-0 w-1/3 rounded-full bg-linear-to-r from-transparent via-emerald-400 to-transparent"
            animate={{ x: ["-100%", "300%"] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Loading label with cycling dots */}
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <span className="tracking-wide">Loading</span>
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                aria-hidden
                className="h-1 w-1 rounded-full bg-emerald-400"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
          <span className="sr-only">Please wait while the page loads</span>
        </div>
      </div>
    </div>
  );
}
