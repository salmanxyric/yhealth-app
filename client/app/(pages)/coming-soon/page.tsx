"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Bell,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Coming-soon screen — for features that are announced but not yet shipped.
 *
 * Highlights:
 *  - Aurora horizon line and floating sparkles.
 *  - Email opt-in form (client-only UX; wire up to your mailing list endpoint).
 *  - Animated feature preview chips.
 */
export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deterministic sparkle positions to avoid hydration mismatch.
  const sparkles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        x: 5 + ((i * 67) % 90),
        y: 8 + ((i * 53) % 80),
        delay: (i % 7) * 0.45,
        size: 6 + (i % 4) * 3,
      })),
    []
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitted(true);
    // TODO: POST to /api/waitlist when the endpoint exists.
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-40"
          animate={{
            background: [
              "radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.12) 0%, transparent 55%)",
              "radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.10) 0%, transparent 55%)",
              "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.10) 0%, transparent 55%)",
              "radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.12) 0%, transparent 55%)",
            ],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Animated horizon line */}
        <motion.div
          aria-hidden
          className="absolute left-0 right-0 top-1/2 h-px bg-linear-to-r from-transparent via-indigo-400/60 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
        />

        {/* Drifting sparkles */}
        {sparkles.map((s) => (
          <motion.div
            key={s.id}
            aria-hidden
            className="absolute text-indigo-300/40"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
            }}
            animate={{
              opacity: [0, 0.9, 0],
              y: [0, -30, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 5,
              delay: s.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-full w-full" />
          </motion.div>
        ))}

        {/* Subtle grid */}
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
        className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-indigo-500/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-pink-500/5 blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto py-12">
        {/* Rocket icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
          className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center"
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-3xl bg-linear-to-br from-indigo-500/30 to-pink-500/30 blur-2xl"
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.95, 1.1, 0.95] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-500/20 to-pink-500/20 border border-white/15 backdrop-blur-sm"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Rocket className="h-10 w-10 text-indigo-300" />
          </motion.div>
        </motion.div>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Coming soon
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight"
        >
          <span className="bg-linear-to-r from-white via-indigo-200 to-pink-200 bg-clip-text text-transparent">
            Something great is brewing
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-slate-400 text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed"
        >
          This feature is being polished and tested with a closed group of
          users. Join the waitlist and we&apos;ll let you know the moment it
          ships.
        </motion.p>

        {/* Email opt-in */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mx-auto max-w-md mb-8"
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-200"
                role="status"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">
                  You&apos;re on the list — we&apos;ll be in touch.
                </span>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-1.5"
              >
                <label htmlFor="cs-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="cs-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "cs-email-error" : undefined}
                  className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="bg-linear-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-lg shadow-indigo-500/20 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] px-6"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notify me
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
          {error && (
            <p
              id="cs-email-error"
              role="alert"
              className="mt-2 text-xs text-rose-400"
            >
              {error}
            </p>
          )}
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-12"
        >
          {[
            "Smart goal sequencing",
            "Live coach sessions",
            "Habit streak insights",
            "Wearable sync",
          ].map((chip, i) => (
            <motion.span
              key={chip}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.08, duration: 0.4 }}
              className="rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-300 backdrop-blur-sm"
            >
              {chip}
            </motion.span>
          ))}
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm"
        >
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>
          <span className="text-slate-800">|</span>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-300 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            Explore the dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
