'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  Users,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Grid3X3,
  ShieldAlert,
  Gift,
  Activity,
  BarChart3,
  Zap,
  PieChart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { ContentSkeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { MetricCard, StatusBadge } from '@/components/admin/premium';

interface Analytics {
  summary: {
    mrrCents: number;
    arrCents: number;
    arpuCents: number;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    newLast30: number;
    churnedLast30: number;
    monthlyChurnRate: number;
  };
  creditBurn30d: { reserved: number; consumed: number };
  newSubscriptionsByDay: Array<{ day: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  planBreakdown: Array<{ planName: string; count: number; mrrCents: number }>;
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

const SUB_NAV_LINKS = [
  { label: 'Overview', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Customers', href: '/admin/subscriptions/customers', icon: Users },
  { label: 'Features', href: '/admin/subscriptions/features', icon: Grid3X3 },
  { label: 'Overrides', href: '/admin/subscriptions/overrides', icon: ShieldAlert },
  { label: 'Promotions', href: '/admin/subscriptions/promotions', icon: Gift },
  { label: 'Abuse', href: '/admin/subscriptions/abuse', icon: AlertTriangle },
  { label: 'Usage', href: '/admin/subscriptions/usage', icon: Activity },
  { label: 'Analytics', href: '/admin/subscriptions/analytics', icon: BarChart3 },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500',
  trialing: 'bg-violet-500',
  canceled: 'bg-slate-500',
  past_due: 'bg-amber-500',
  paused: 'bg-blue-500',
  suspended: 'bg-rose-500',
};

const PLAN_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#f43f5e', '#3b82f6'];

export default function AdminAnalyticsPageContent() {
  const pathname = usePathname();
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<Analytics>('/admin/billing/analytics');
        if (cancelled) return;
        if (res.success && res.data) setData(res.data);
        else setError('Could not load analytics');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : 'Load failed');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalMrr = data?.planBreakdown.reduce((s, p) => s + p.mrrCents, 0) ?? 0;
  const totalSubs = data?.statusBreakdown.reduce((s, b) => s + b.count, 0) ?? 0;
  const totalCredits = (data?.creditBurn30d.reserved ?? 0) + (data?.creditBurn30d.consumed ?? 0);
  const consumeRate = totalCredits > 0
    ? Math.round((data!.creditBurn30d.consumed / data!.creditBurn30d.reserved) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-4">
      {/* Compact header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
          <BarChart3 className="h-4.5 w-4.5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Subscription Analytics</h1>
          <p className="text-sm text-slate-500">MRR, churn, plan mix, and credit burn across all tenants</p>
        </div>
      </div>

      {/* Tab sub-navigation */}
      <nav className="-mt-2 flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-px">
        {SUB_NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-emerald-400 text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <ContentSkeleton
        name="analytics-dashboard"
        loading={!data && !error}
        animate="shimmer"
        darkColor="rgba(255,255,255,0.06)"
        fixture={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 h-[120px]">
                  <div className="mb-3 h-4 w-20 rounded bg-slate-800" />
                  <div className="mb-2 h-7 w-28 rounded bg-slate-800" />
                  <div className="h-3 w-16 rounded bg-slate-800" />
                </div>
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 h-72" />
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 h-72" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 h-56" />
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 h-56" />
            </div>
          </div>
        }
      >
      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={DollarSign}
              title="MRR"
              value={data.summary.mrrCents / 100}
              accent="emerald"
              subtitle={`ARR ${formatMoney(data.summary.arrCents)}`}
            />
            <MetricCard
              icon={TrendingUp}
              title="ARPU"
              value={data.summary.arpuCents / 100}
              accent="cyan"
              subtitle={`${data.summary.activeSubscriptions} active`}
            />
            <MetricCard
              icon={Users}
              title="Trialing"
              value={data.summary.trialingSubscriptions}
              prefix=""
              suffix=""
              accent="violet"
              subtitle={`+${data.summary.newLast30} new in 30d`}
            />
            <MetricCard
              icon={AlertTriangle}
              title="Monthly Churn"
              value={data.summary.monthlyChurnRate * 100}
              prefix=""
              suffix="%"
              accent={data.summary.monthlyChurnRate > 0.05 ? 'rose' : 'emerald'}
              trend={{
                value: data.summary.monthlyChurnRate * 100,
                direction: data.summary.monthlyChurnRate > 0.05 ? 'up' : 'down',
              }}
              subtitle={`${data.summary.churnedLast30} churned in 30d`}
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* New subscriptions area chart */}
            <section className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 transition-all hover:border-slate-700/80">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] to-transparent" />
              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10">
                      <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                    </div>
                    <h2 className="text-sm font-semibold text-slate-100">New subscriptions</h2>
                  </div>
                  <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                    Last 30 days
                  </span>
                </div>
                {data.newSubscriptionsByDay.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <p className="text-sm text-slate-500">No new subscriptions yet.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data.newSubscriptionsByDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis
                        dataKey="day"
                        stroke="transparent"
                        fontSize={10}
                        tick={{ fill: '#475569' }}
                        tickFormatter={(v) => {
                          const d = new Date(v);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                        interval="preserveStartEnd"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="transparent"
                        fontSize={10}
                        tick={{ fill: '#475569' }}
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          color: '#e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                          backdropFilter: 'blur(12px)',
                        }}
                        cursor={{ stroke: 'rgba(34,211,238,0.2)', strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fill="url(#subGrad)"
                        name="New subs"
                        dot={false}
                        activeDot={{ r: 4, fill: '#22d3ee', stroke: '#0f172a', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            {/* Credit burn */}
            <section className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 transition-all hover:border-slate-700/80">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent" />
              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <h2 className="text-sm font-semibold text-slate-100">Credit burn</h2>
                  </div>
                  <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                    Last 30 days
                  </span>
                </div>

                <div className="space-y-4">
                  <CreditRow
                    label="Reserved"
                    value={data.creditBurn30d.reserved}
                    total={Math.max(data.creditBurn30d.reserved, 1)}
                    color="cyan"
                  />
                  <CreditRow
                    label="Consumed"
                    value={data.creditBurn30d.consumed}
                    total={Math.max(data.creditBurn30d.reserved, 1)}
                    color="emerald"
                  />
                  <CreditRow
                    label="Released"
                    value={data.creditBurn30d.reserved - data.creditBurn30d.consumed}
                    total={Math.max(data.creditBurn30d.reserved, 1)}
                    color="slate"
                  />
                </div>

                {/* Utilization gauge */}
                <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Utilization rate</span>
                    <span className={cn(
                      'font-semibold tabular-nums',
                      consumeRate > 80 ? 'text-emerald-400' : consumeRate > 50 ? 'text-amber-400' : 'text-rose-400',
                    )}>
                      {consumeRate}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        consumeRate > 80 ? 'bg-emerald-500' : consumeRate > 50 ? 'bg-amber-500' : 'bg-rose-500',
                      )}
                      style={{ width: `${Math.min(consumeRate, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-600">
                    <Sparkles className="h-2.5 w-2.5" />
                    Low utilization indicates over-reservation
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Plan mix + Status breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Plan mix */}
            <section className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 transition-all hover:border-slate-700/80">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent" />
              <div className="relative">
                <div className="mb-5 flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                    <PieChart className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-100">Plan mix</h2>
                </div>

                {data.planBreakdown.length === 0 ? (
                  <div className="flex h-32 items-center justify-center">
                    <p className="text-sm text-slate-500">No data.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Stacked MRR bar */}
                    {totalMrr > 0 && (
                      <div className="flex h-3.5 overflow-hidden rounded-full bg-slate-800/80">
                        {data.planBreakdown.map((p, i) => {
                          const pct = (p.mrrCents / totalMrr) * 100;
                          return (
                            <div
                              key={p.planName}
                              className="transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length],
                              }}
                              title={`${p.planName}: ${formatMoney(p.mrrCents)} (${pct.toFixed(1)}%)`}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Plan rows */}
                    <div className="space-y-1.5">
                      {data.planBreakdown.map((p, i) => {
                        const pct = totalMrr > 0 ? (p.mrrCents / totalMrr) * 100 : 0;
                        return (
                          <div
                            key={p.planName}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-800/40"
                          >
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: PLAN_COLORS[i % PLAN_COLORS.length] }}
                            />
                            <span className="text-sm font-medium text-slate-200">{p.planName}</span>
                            <span className="ml-auto flex items-center gap-3">
                              <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium tabular-nums text-slate-400">
                                {pct.toFixed(0)}%
                              </span>
                              <span className="text-xs tabular-nums text-slate-500">{p.count} subs</span>
                              <span className="text-sm font-semibold tabular-nums text-emerald-400">
                                {formatMoney(p.mrrCents)}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total footer */}
                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                      <span className="text-xs font-medium text-slate-500">Total MRR</span>
                      <span className="text-sm font-bold tabular-nums text-slate-100">{formatMoney(totalMrr)}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Status breakdown */}
            <section className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-6 transition-all hover:border-slate-700/80">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.02] to-transparent" />
              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                      <Activity className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                    <h2 className="text-sm font-semibold text-slate-100">Status breakdown</h2>
                  </div>
                  {totalSubs > 0 && (
                    <span className="text-xs tabular-nums text-slate-500">{totalSubs} total</span>
                  )}
                </div>

                <div className="space-y-2">
                  {data.statusBreakdown.map((s) => {
                    const pct = totalSubs > 0 ? (s.count / totalSubs) * 100 : 0;
                    const barColor = STATUS_COLORS[s.status] ?? 'bg-slate-600';
                    return (
                      <div
                        key={s.status}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-800/40"
                      >
                        <StatusBadge status={s.status} />
                        <div className="flex-1">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80">
                            <div
                              className={cn('h-full rounded-full transition-all duration-700', barColor)}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="min-w-[3rem] text-right text-xs tabular-nums text-slate-400">
                          {pct.toFixed(0)}%
                        </span>
                        <span className="min-w-[2rem] text-right text-sm font-semibold tabular-nums text-slate-200">
                          {s.count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Distribution summary */}
                {totalSubs > 0 && (
                  <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5">
                    <div className="flex h-2 overflow-hidden rounded-full bg-slate-800/80">
                      {data.statusBreakdown.map((s) => {
                        const pct = (s.count / totalSubs) * 100;
                        const color = STATUS_COLORS[s.status] ?? 'bg-slate-600';
                        return (
                          <div
                            key={s.status}
                            className={cn('transition-all duration-500 first:rounded-l-full last:rounded-r-full', color)}
                            style={{ width: `${pct}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
      </ContentSkeleton>
    </div>
  );
}

function CreditRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: 'cyan' | 'emerald' | 'slate';
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const colorMap = {
    cyan: { text: 'text-cyan-300', bar: 'bg-cyan-500', bg: 'bg-cyan-500/10' },
    emerald: { text: 'text-emerald-300', bar: 'bg-emerald-500', bg: 'bg-emerald-500/10' },
    slate: { text: 'text-slate-300', bar: 'bg-slate-500', bg: 'bg-slate-500/10' },
  };
  const c = colorMap[color];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className={cn('text-lg font-bold tabular-nums', c.text)}>
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className={cn('h-full rounded-full transition-all duration-700', c.bar)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
