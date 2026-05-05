'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlarmClock, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useAlarmRing, ALARMS_OVERVIEW_PATH } from '@/app/providers/AlarmProvider';
import { RemainingCreditsChip } from '@/components/subscription/RemainingCreditsChip';
import { TrialCountdownBanner } from '@/components/subscription/TrialCountdownBanner';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function DashboardHeader() {
  const { user } = useAuth();
  const router = useRouter();
  const { isRinging } = useAlarmRing();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [greeting] = useState(() => getGreeting());
  const [date] = useState(() => getFormattedDate());

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReduceMotion(
        mq.matches || document.documentElement.classList.contains('reduce-motion')
      );
    };
    update();
    mq.addEventListener('change', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => {
      mq.removeEventListener('change', update);
      observer.disconnect();
    };
  }, []);

  const firstName = user?.firstName || 'there';
  const showAlarmMotion = isRinging && !reduceMotion;

  return (
    <div className="sticky top-0 z-30">
      <TrialCountdownBanner />
      <header
        data-tour="dashboard-header"
        className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/[0.06]"
        style={{
          background: 'rgba(2,2,9,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
      {/* Left — Greeting + Date */}
      <div>
        <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white leading-tight">
          {greeting},{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{date}</p>
      </div>

      {/* Right — Action buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <RemainingCreditsChip className="hidden sm:inline-flex" />
        <Link
          href="/notifications"
          className="relative p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </Link>

        <button
          type="button"
          onClick={() => router.push(ALARMS_OVERVIEW_PATH)}
          className={`relative p-2 sm:p-2.5 rounded-xl border transition-colors ${
            isRinging
              ? 'bg-violet-500/15 border-violet-500/40 text-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
              : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          aria-label={isRinging ? 'Alarms — ringing' : 'Alarms'}
        >
          <motion.span
            className="inline-flex"
            animate={
              showAlarmMotion
                ? { rotate: [0, -14, 14, -10, 10, 0], scale: [1, 1.08, 1] }
                : { rotate: 0, scale: 1 }
            }
            transition={
              showAlarmMotion
                ? { duration: 0.85, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.2 }
            }
          >
            <AlarmClock className="w-4 h-4" />
          </motion.span>
        </button>

        <Link
          href="/settings"
          className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
      </header>
    </div>
  );
}
