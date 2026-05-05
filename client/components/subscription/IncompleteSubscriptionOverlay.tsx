'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CreditCard, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function IncompleteSubscriptionOverlay() {
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
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-linear-to-b from-yellow-500/15 via-amber-500/10 to-transparent blur-3xl"
        />

        <div className="relative px-8 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-12">
          <div className="mx-auto mb-7 flex h-18 w-18 items-center justify-center">
            <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-linear-to-br from-yellow-500 via-amber-500 to-orange-500 shadow-[0_8px_32px_-4px_rgba(234,179,8,0.5)] ring-1 ring-white/20">
              <CreditCard className="h-9 w-9 text-white drop-shadow-lg" />
            </div>
          </div>

          <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-[26px]">
            Payment pending
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-center text-[15px] leading-relaxed text-slate-400">
            Your subscription setup is incomplete. Please complete your payment to unlock your dashboard, AI coaching, and all premium features.
          </p>

          <div className="mx-auto my-7 h-px max-w-xs bg-linear-to-r from-transparent via-slate-700/60 to-transparent" />

          <div className="flex flex-col items-center gap-4">
            <Link href="/settings/billing" className="w-full max-w-xs">
              <Button
                className="group relative w-full overflow-hidden rounded-2xl bg-linear-to-r from-yellow-500 via-amber-500 to-orange-500 py-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_-4px_rgba(234,179,8,0.4)] transition-all duration-300 hover:shadow-[0_12px_32px_-4px_rgba(234,179,8,0.55)] hover:brightness-110"
                size="lg"
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  Complete payment
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
                <span
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-r from-yellow-400 via-amber-400 to-orange-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              </Button>
            </Link>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/80" />
              <span>Secure payment · Cancel anytime</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
