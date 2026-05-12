"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Settings,
  Wrench,
  Cog,
  Clock,
  Mail,
  Twitter,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Maintenance screen — shown when the platform is in scheduled downtime.
 *
 * Features:
 *  - Rotating gears motif (counter-rotating cogs).
 *  - Live countdown to the configured end time.
 *  - Status updates summary + comms channels.
 *
 * The end-time defaults to 90 minutes from first render, but in production
 * should be driven by an env var or remote config.
 */
export default function MaintenancePage() {
  // Configure expected end time. In production, pass via prop / server data.
  const endsAt = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 90);
    return now;
  }, []);

  const [remaining, setRemaining] = useState(() => endsAt.getTime() - Date.now());

  useEffect(() => {
    const tick = () => setRemaining(endsAt.getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const { hours, minutes, seconds, isOver } = breakDown(remaining);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Ambient background */}
      <div className="absolute inset-0">
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.10) 0%, transparent 55%)",
              "radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.10) 0%, transparent 55%)",
              "radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.10) 0%, transparent 55%)",
            ],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
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
        className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 px-6 max-w-3xl mx-auto py-16">
        {/* Gear cluster */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.9, bounce: 0.35 }}
          className="relative mx-auto mb-10 h-44 w-44"
        >
          {/* Background glow */}
          <motion.div
            aria-hidden
            className="absolute inset-2 rounded-full bg-linear-to-br from-amber-500/20 to-purple-500/20 blur-2xl"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Large gear */}
          <motion.div
            aria-hidden
            className="absolute left-2 top-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          >
            <Cog className="h-28 w-28 text-amber-400/70" strokeWidth={1.2} />
          </motion.div>

          {/* Small counter-rotating gear */}
          <motion.div
            aria-hidden
            className="absolute right-2 bottom-2"
            animate={{ rotate: -360 }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          >
            <Settings
              className="h-16 w-16 text-purple-300/70"
              strokeWidth={1.4}
            />
          </motion.div>

          {/* Wrench accent */}
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ rotate: [0, -20, 20, -10, 10, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: "easeInOut",
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-sm shadow-xl">
              <Wrench className="h-6 w-6 text-amber-300" />
            </div>
          </motion.div>
        </motion.div>

        {/* Title block */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium mb-5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Scheduled maintenance
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            We&apos;re tuning things up
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-slate-400 text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Balencia is briefly offline while we ship performance improvements
            and new coaching features. Your data is safe and your subscription
            remains active.
          </motion.p>
        </div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mx-auto max-w-md mb-10"
        >
          <div className="flex items-center justify-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            {isOver ? "Wrapping up" : "Estimated return in"}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <TimeBox label="Hours" value={hours} />
            <TimeBox label="Minutes" value={minutes} />
            <TimeBox label="Seconds" value={seconds} pulse />
          </div>
        </motion.div>

        {/* Status updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mx-auto max-w-xl rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-5 mb-8"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-3">
            What&apos;s shipping
          </p>
          <ul className="space-y-2.5 text-sm text-slate-300">
            <StatusLine ok>Database migration completed</StatusLine>
            <StatusLine ok>New voice coach pipeline deployed</StatusLine>
            <StatusLine>Rebuilding personalisation cache</StatusLine>
            <StatusLine>Final smoke tests</StatusLine>
          </ul>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="bg-linear-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white shadow-lg shadow-emerald-500/20 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] px-8"
          >
            <Link href="https://status.balencia.app" target="_blank" rel="noreferrer">
              <ShieldCheck className="w-5 h-5 mr-2" />
              Live status page
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-600 backdrop-blur-sm px-8"
          >
            <Link href="mailto:support@balencia.app">
              <Mail className="w-5 h-5 mr-2" />
              Contact support
            </Link>
          </Button>
        </motion.div>

        {/* Social */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-10 flex items-center justify-center gap-6 text-sm text-slate-500"
        >
          <Link
            href="https://twitter.com/balenciaapp"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
          >
            <Twitter className="w-3.5 h-3.5" />
            @balenciaapp
          </Link>
          <span className="text-slate-800">|</span>
          <Link
            href="/blogs"
            className="hover:text-emerald-400 transition-colors"
          >
            Read the blog
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function breakDown(ms: number) {
  if (ms <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isOver: true };
  }
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { hours, minutes, seconds, isOver: false };
}

function TimeBox({
  label,
  value,
  pulse = false,
}: {
  label: string;
  value: number;
  pulse?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-sm p-4 text-center overflow-hidden">
      {pulse && (
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-transparent"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <p className="relative text-3xl md:text-4xl font-bold text-white tabular-nums tracking-tight">
        {value.toString().padStart(2, "0")}
      </p>
      <p className="relative mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function StatusLine({
  ok = false,
  children,
}: {
  ok?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      {ok ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-[10px]">
          {/* tick mark */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-slate-400">
          <motion.span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-amber-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      )}
      <span className={ok ? "text-slate-300" : "text-slate-400"}>{children}</span>
    </li>
  );
}
