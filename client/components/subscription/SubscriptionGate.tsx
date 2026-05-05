'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Crown,
  Zap,
  ShieldCheck,
  ArrowRight,
  Star,
  Gem,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscriptionAccessContext } from '@/app/context/SubscriptionAccessContext';
import { useEntitlements } from '@/app/context/EntitlementsContext';

export function SubscriptionPaywallOverlay() {
  const { isExpired, isLoading } = useSubscriptionAccessContext();
  const { bundle } = useEntitlements();

  if (isLoading || !isExpired) return null;

  const status = bundle?.subscription.status ?? 'none';
  const neverSubscribed = status === 'none';

  const heading = neverSubscribed
    ? 'Choose a plan to get started'
    : 'Your subscription has expired';

  const description = neverSubscribed
    ? 'Subscribe to unlock your personalised dashboard, AI coaching, and all premium features.'
    : 'Renew your subscription to regain access to your dashboard and all features. Your data is safe and waiting for you.';

  const perks = [
    { icon: Zap, label: 'AI-powered coaching' },
    { icon: Star, label: 'Personalised dashboard' },
    { icon: Gem, label: 'Premium features' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="relative w-full max-w-150 overflow-hidden rounded-3xl border border-white/8 bg-linear-to-b from-slate-900/98 via-slate-900/95 to-slate-950/98 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
      >
        {/* Ambient glow effects */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-linear-to-b from-cyan-500/15 via-blue-500/10 to-transparent blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-violet-500/8 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-cyan-500/8 blur-3xl"
        />

        <div className="relative px-8 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-12">
          {/* Icon badge */}
          <div className="mx-auto mb-7 flex h-18 w-18 items-center justify-center">
            <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 via-blue-500 to-violet-600 shadow-[0_8px_32px_-4px_rgba(59,130,246,0.5)] ring-1 ring-white/20">
              <Crown className="h-9 w-9 text-white drop-shadow-lg" />
              <div
                aria-hidden
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 shadow-lg shadow-amber-400/40 ring-2 ring-slate-900"
              >
                <Star className="h-3 w-3 fill-amber-900 text-amber-900" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-[26px]">
            {heading}
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-center text-[15px] leading-relaxed text-slate-400">
            {description}
          </p>

          {/* Perks row */}
          <div className="mx-auto mt-7 flex max-w-md items-center justify-center gap-6">
            {perks.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-[13px] text-slate-400">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/6 ring-1 ring-white/8">
                  <Icon className="h-3.5 w-3.5 text-cyan-400" />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-auto my-7 h-px max-w-xs bg-linear-to-r from-transparent via-slate-700/60 to-transparent" />

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <Link href="/subscription" className="w-full max-w-xs">
              <Button
                className="group relative w-full overflow-hidden rounded-2xl bg-linear-to-r from-cyan-500 via-blue-500 to-violet-600 py-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_-4px_rgba(59,130,246,0.4)] transition-all duration-300 hover:shadow-[0_12px_32px_-4px_rgba(59,130,246,0.55)] hover:brightness-110"
                size="lg"
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  <Crown className="h-4.5 w-4.5" />
                  View plans & subscribe
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
                <span
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-r from-cyan-400 via-blue-400 to-violet-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              </Button>
            </Link>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/80" />
              <span>High-level privacy · Cancel anytime</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Small banner for trial users: "X days left in free trial"
 */
export function TrialBanner() {
  const { isTrial, daysLeftInTrial, isLoading } = useSubscriptionAccessContext();

  if (isLoading || !isTrial) return null;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="rounded-xl border border-blue-500/30 bg-linear-to-r from-blue-500/10 to-indigo-500/10 px-4 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">
          <span className="text-blue-300">{daysLeftInTrial} day{daysLeftInTrial !== 1 ? 's' : ''} left</span> in your free trial
        </p>
        <Link href="/plans">
          <Button variant="outline" size="sm" className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20">
            Subscribe to keep access
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
