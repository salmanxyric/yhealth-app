'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/context/AuthContext';
import { api, ApiError } from '@/lib/api-client';
import { Check, Loader2, Sparkles, ArrowRight, Crown, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

const REDIRECT_SECONDS = 10;

function fireConfetti() {
  const colors = ['#10b981', '#06b6d4', '#3b82f6', '#a855f7', '#f59e0b', '#ffffff'];
  // Main burst
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors, startVelocity: 45 });
  // Side cannons delayed
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
  }, 250);
  // Secondary wave
  setTimeout(() => {
    confetti({ particleCount: 40, spread: 120, origin: { y: 0.5 }, colors, startVelocity: 30, gravity: 0.8 });
  }, 600);
}

function FloatingParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: -10,
        background: `radial-gradient(circle, rgba(16,185,129,0.6) 0%, rgba(6,182,212,0.3) 60%, transparent 100%)`,
      }}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: -800, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: 'linear' }}
    />
  );
}

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [planName, setPlanName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const confettiFired = useRef(false);

  const sessionId = searchParams.get('session_id');

  const goToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const refetchAndSetPlanName = useCallback(async () => {
    try {
      const res = await api.get<{ subscription?: { plan?: { name: string } } }>('/subscription/me');
      if (res.data?.subscription?.plan?.name) setPlanName(res.data.subscription.plan.name);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent('/subscription/success?' + searchParams.toString())}`);
      return;
    }
    if (!sessionId) {
      router.replace('/subscription');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await api.post('/subscription/verify-session', { session_id: sessionId });
        if (cancelled) return;
        setStatus('success');
        setErrorMessage(null);
        await refetchAndSetPlanName();
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(e instanceof ApiError ? e.message : (e instanceof Error ? e.message : 'Verification failed. Please try again or contact support.'));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, isAuthenticated, authLoading, router, searchParams, refetchAndSetPlanName]);

  // Fire confetti on success
  useEffect(() => {
    if (status === 'success' && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
  }, [status]);

  // Countdown + auto-redirect to dashboard
  useEffect(() => {
    if (status !== 'success') return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          goToDashboard();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, goToDashboard]);

  if (authLoading || !isAuthenticated || !sessionId) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="relative min-h-[85vh] overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/20 to-sky-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.08)_0%,_transparent_70%)]" />

        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 h-80 w-80 rounded-full bg-sky-500/8 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.6, 0.4, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 h-64 w-64 rounded-full bg-violet-500/5 blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Floating particles (success only) */}
        {status === 'success' && (
          <>
            {[15, 25, 40, 55, 65, 75, 85].map((x, i) => (
              <FloatingParticle key={i} delay={i * 0.7} x={x} size={4 + (i % 3) * 2} />
            ))}
          </>
        )}

        <div className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 py-16">
          <AnimatePresence mode="wait">
            {/* ---- VERIFYING ---- */}
            {status === 'verifying' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-8 text-center"
              >
                {/* Pulsing ring loader */}
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border-2 border-sky-500/20"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
                  />
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/10 to-sky-500/10 backdrop-blur-sm border border-emerald-500/20">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white md:text-3xl">Confirming your payment</h1>
                  <p className="mt-2 text-slate-400">Please wait while we activate your subscription...</p>
                </div>
              </motion.div>
            )}

            {/* ---- SUCCESS ---- */}
            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="flex max-w-xl flex-col items-center gap-8 text-center"
              >
                {/* Animated checkmark with glow rings */}
                <div className="relative">
                  {/* Outer glow ring */}
                  <motion.div
                    className="absolute -inset-6 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  {/* Middle ring */}
                  <motion.div
                    className="absolute -inset-3 rounded-full border border-emerald-500/20"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.1, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  />
                  {/* Check circle */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                    className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 shadow-2xl shadow-emerald-500/40"
                  >
                    <motion.div
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      <Check className="h-16 w-16 text-white" strokeWidth={3} />
                    </motion.div>
                  </motion.div>
                  {/* Orbiting stars */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        top: '50%',
                        left: '50%',
                      }}
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 8 + i * 2,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: i * 1,
                      }}
                    >
                      <Star
                        className="text-amber-400/60"
                        style={{
                          transform: `translate(${70 + i * 10}px, -6px)`,
                          width: 10 + i * 2,
                          height: 10 + i * 2,
                        }}
                        fill="currentColor"
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 backdrop-blur-sm"
                >
                  <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }}>
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                  </motion.div>
                  <span className="text-sm font-semibold text-emerald-300">Payment Successful</span>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                    Welcome to{' '}
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 bg-clip-text text-transparent">
                      {planName || 'Premium'}
                    </span>
                  </h1>
                  <p className="mx-auto max-w-md text-lg text-slate-400">
                    Your subscription is now active. Unlock your full health potential with premium features.
                  </p>
                </motion.div>

                {/* Feature highlights */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="flex flex-wrap items-center justify-center gap-3"
                >
                  {[
                    { icon: Zap, label: 'Unlimited AI Coaching' },
                    { icon: Crown, label: 'Premium Analytics' },
                    { icon: Sparkles, label: 'Priority Support' },
                  ].map(({ icon: Icon, label }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 backdrop-blur-sm"
                    >
                      <Icon className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-slate-300">{label}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <Button
                    size="lg"
                    onClick={goToDashboard}
                    className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-8 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
                  >
                    <span className="relative z-10 flex items-center gap-2 font-semibold">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="border-slate-600 bg-slate-800/50 hover:bg-slate-700/50">
                    <Link href="/subscription?refreshed=1">View Subscription</Link>
                  </Button>
                </motion.div>

                {/* Countdown progress bar */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="w-full max-w-xs space-y-2"
                >
                  <p className="text-xs text-slate-500">
                    Redirecting to dashboard in {countdown}s...
                  </p>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: REDIRECT_SECONDS, ease: 'linear' }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ---- ERROR ---- */}
            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-6 text-center"
              >
                <div className="rounded-full border border-amber-500/30 bg-amber-500/10 p-6">
                  <span className="text-4xl font-bold text-amber-400">!</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Something went wrong</h1>
                  <p className="mt-2 text-slate-400">
                    {errorMessage ?? "We couldn't confirm your payment. Your card may not have been charged."}
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/subscription">Back to subscription</Link>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}

export default function SubscriptionSuccessPageContent() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex min-h-[85vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          </div>
        </MainLayout>
      }
    >
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
