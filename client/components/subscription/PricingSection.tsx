'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, Loader2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PlanItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  interval: string;
  features: string[];
  credits_included_monthly?: number;
}

interface PricingSectionProps {
  plans: PlanItem[];
  loading?: boolean;
  submittingId: string | null;
  onSubscribe: (planId: string) => void;
  showBillingToggle?: boolean;
  currentPlanId?: string | null;
  className?: string;
}

const DEFAULT_SAVE_PERCENT = 20;

function computeYearlySavingsPercent(allPlans: PlanItem[]): number {
  const monthly = allPlans.filter((p) => p.interval === 'month');
  const yearly = allPlans.filter((p) => p.interval === 'year');
  if (monthly.length === 0 || yearly.length === 0) return DEFAULT_SAVE_PERCENT;
  for (const m of monthly) {
    const y = yearly.find((yp) => yp.slug === m.slug);
    if (y && m.amount_cents > 0) {
      const monthlyAnnualized = m.amount_cents * 12;
      const pct = Math.round(((monthlyAnnualized - y.amount_cents) / monthlyAnnualized) * 100);
      if (pct > 0 && pct < 100) return pct;
    }
  }
  return DEFAULT_SAVE_PERCENT;
}

function getPlanIcon(slug: string) {
  if (slug === 'pro') return Crown;
  if (slug === 'premium') return Zap;
  return Sparkles;
}

function formatPrice(plan: PlanItem) {
  const amount = plan.amount_cents / 100;
  const cur = (plan.currency || 'usd').toUpperCase();
  if (plan.interval === 'year') {
    const perMonth = amount / 12;
    return { main: `$${perMonth.toFixed(0)}`, sub: '/mo', extra: `Billed $${amount}/year`, cur };
  }
  return { main: `$${amount.toFixed(2)}`, sub: '/mo', extra: null, cur };
}

function extractCredits(features: string[]): string | null {
  const match = features.find((f) => /credit/i.test(f));
  return match || null;
}

export function PricingSection({
  plans,
  loading = false,
  submittingId,
  onSubscribe,
  showBillingToggle = true,
  currentPlanId = null,
  className = '',
}: PricingSectionProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const savePercent = useMemo(() => computeYearlySavingsPercent(plans), [plans]);

  const filteredPlans = useMemo(() => {
    if (!showBillingToggle) return plans;
    return plans.filter((p) => p.interval === billingInterval);
  }, [plans, showBillingToggle, billingInterval]);

  const isPopularPlan = (slug: string) => slug === 'pro';

  if (loading) {
    return (
      <div className={`flex min-h-[320px] items-center justify-center ${className}`}>
        <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <p className={`text-center text-slate-500 ${className}`}>
        No plans available at the moment.
      </p>
    );
  }

  return (
    <div className={className}>
      {showBillingToggle && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col items-center gap-4"
        >
          <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-800/80 p-1.5 ring-1 ring-slate-700/60 backdrop-blur-md shadow-xl shadow-slate-950/50">
            <button
              type="button"
              onClick={() => setBillingInterval('month')}
              className={cn(
                'relative rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-300',
                billingInterval === 'month'
                  ? 'bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('year')}
              className={cn(
                'relative rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-300',
                billingInterval === 'year'
                  ? 'bg-gradient-to-r from-emerald-600 to-sky-600 text-white shadow-lg shadow-sky-500/25'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              Yearly
              <span className="ml-1.5 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/20">
                Save {savePercent}%
              </span>
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {filteredPlans.map((plan, i) => {
          const Icon = getPlanIcon(plan.slug);
          const price = formatPrice(plan);
          const popular = isPopularPlan(plan.slug);
          const isCurrent = currentPlanId === plan.id;
          const isHovered = hoveredId === plan.id;
          const creditsMonthly = plan.credits_included_monthly ?? 0;
          const credits = creditsMonthly > 0
            ? `${creditsMonthly.toLocaleString()} credits / month`
            : extractCredits(plan.features);
          const nonCreditFeatures = plan.features.filter((f) => !/credit/i.test(f));

          return (
            <motion.article
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              onMouseEnter={() => setHoveredId(plan.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'group relative flex flex-col rounded-2xl border p-6 md:p-8 transition-all duration-500',
                'bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl',
                popular
                  ? 'border-emerald-500/40 shadow-xl shadow-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-400/60'
                  : 'border-slate-700/50 shadow-lg shadow-slate-950/50 hover:shadow-xl hover:border-slate-600/70',
                popular && 'ring-1 ring-emerald-500/15 hover:ring-emerald-500/30',
              )}
            >
              {/* Hover glow effect */}
              <div className={cn(
                'absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none',
                popular ? 'bg-gradient-to-b from-emerald-500/[0.03] to-transparent' : 'bg-gradient-to-b from-sky-500/[0.02] to-transparent',
                isHovered && 'opacity-100',
              )} />

              {/* Popular badge */}
              {popular && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2"
                >
                  <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                </motion.div>
              )}

              {/* Plan header */}
              <div className="relative mb-6 flex items-center gap-3.5">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                    popular
                      ? 'bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-800 text-slate-300 border border-slate-700/50 group-hover:bg-slate-700/80 group-hover:text-white',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                  <p className="text-xs text-slate-500">
                    {plan.interval === 'year' ? 'Billed annually' : 'Billed monthly'}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="relative mb-2">
                <span className={cn(
                  'text-4xl font-extrabold tracking-tight md:text-5xl',
                  popular
                    ? 'bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent'
                    : 'text-white',
                )}>
                  {price.main}
                </span>
                <span className="text-base text-slate-500 font-medium">{price.sub}</span>
              </div>
              {price.extra && (
                <p className="mb-5 text-xs text-slate-500">{price.extra}</p>
              )}
              {!price.extra && <div className="mb-5" />}

              {plan.description && (
                <p className="mb-5 text-sm leading-relaxed text-slate-400">
                  {plan.description}
                </p>
              )}

              {/* Credits highlight */}
              {credits && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  className={cn(
                    'mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3 border',
                    popular
                      ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                      : 'bg-slate-800/50 border-slate-700/40',
                  )}
                >
                  <motion.div
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                  >
                    <Coins className={cn(
                      'h-5 w-5',
                      popular ? 'text-emerald-400' : 'text-sky-400',
                    )} />
                  </motion.div>
                  <span className={cn(
                    'text-sm font-semibold',
                    popular ? 'text-emerald-300' : 'text-slate-300',
                  )}>
                    {credits}
                  </span>
                </motion.div>
              )}

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {nonCreditFeatures.map((feature, j) => (
                  <motion.li
                    key={j}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + j * 0.05 + 0.3 }}
                    className="flex items-start gap-2.5 text-sm text-slate-300"
                  >
                    <div className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                      popular ? 'bg-emerald-500/15' : 'bg-slate-700/50',
                    )}>
                      <Check className={cn(
                        'h-3 w-3',
                        popular ? 'text-emerald-400' : 'text-slate-400',
                      )} />
                    </div>
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => onSubscribe(plan.id)}
                  disabled={!!submittingId || isCurrent}
                  className={cn(
                    'w-full rounded-xl py-6 text-base font-semibold transition-all duration-300',
                    isCurrent
                      ? 'bg-slate-800/60 text-slate-400 border border-slate-600/30 cursor-default'
                      : popular
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30'
                        : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500',
                  )}
                >
                  {submittingId === plan.id ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : isCurrent ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      Current Plan
                    </span>
                  ) : popular ? (
                    <span className="flex items-center justify-center gap-2">
                      Choose {plan.name}
                      <Sparkles className="h-4 w-4" />
                    </span>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              </motion.div>
            </motion.article>
          );
        })}
      </div>

      {showBillingToggle && filteredPlans.length === 0 && (
        <p className="text-center text-slate-500">
          No {billingInterval === 'month' ? 'monthly' : 'yearly'} plans at the moment.
        </p>
      )}
    </div>
  );
}
