'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Users,
  RefreshCw,
  Sparkles,
  DollarSign,
  TrendingUp,
  Grid3X3,
  ShieldAlert,
  Gift,
  AlertTriangle,
  Activity,
  BarChart3,
  MoreHorizontal,
  Power,
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'react-hot-toast';
import { confirm } from '@/components/common/ConfirmDialog';
import { RevenueAreaChart } from '@/components/admin/charts/RevenueAreaChart';

import { DataTable, MetricCard, FormModal, StatusBadge, SegmentedControl, type FormSection } from '@/components/admin/premium';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  amount_cents: number;
  currency: string;
  interval: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const planFormDefault = {
  name: '',
  slug: '',
  description: '',
  amount_cents: '',
  currency: 'USD',
  interval: 'month' as 'month' | 'year',
  features: [] as string[],
  is_active: true,
  sort_order: '0',
};

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

function formatCurrency(cents: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default function AdminSubscriptionsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansTotal, setPlansTotal] = useState(0);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansPage, setPlansPage] = useState(1);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState(planFormDefault);
  const [planSaving, setPlanSaving] = useState(false);
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  const [revenuePeriod, setRevenuePeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'lifetime'>('month');
  const [revenueStats, setRevenueStats] = useState<{
    total: number;
    period: string;
    breakdown: Array<{ date: string; revenue: number; subscriptions: number }>;
    byPlan: Array<{ planName: string; revenue: number; subscriptions: number }>;
  } | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user, router]);

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const params = new URLSearchParams({ page: String(plansPage), limit: '20' });
      const res = await api.get<{ plans: SubscriptionPlan[]; total: number }>(
        `/admin/subscriptions/plans?${params.toString()}`
      );
      const data = res.data as { plans: SubscriptionPlan[]; total: number } | undefined;
      setPlans(data?.plans ?? []);
      setPlansTotal(data?.total ?? res.meta?.total ?? 0);
    } catch {
      setPlans([]);
      setPlansTotal(0);
    } finally {
      setPlansLoading(false);
    }
  }, [plansPage]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const fetchRevenueStats = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const res = await api.get<{
        total: number;
        period: string;
        breakdown: Array<{ date: string; revenue: number; subscriptions: number }>;
        byPlan: Array<{ planName: string; revenue: number; subscriptions: number }>;
      }>(`/admin/subscriptions/revenue?period=${revenuePeriod}`);
      if (res.success && res.data) setRevenueStats(res.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load revenue stats');
    } finally {
      setRevenueLoading(false);
    }
  }, [revenuePeriod]);

  useEffect(() => { fetchRevenueStats(); }, [fetchRevenueStats]);

  const openCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm(planFormDefault);
    setPlanModalOpen(true);
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? '',
      amount_cents: String(plan.amount_cents),
      currency: plan.currency?.toUpperCase() ?? 'USD',
      interval: plan.interval as 'month' | 'year',
      features: Array.isArray(plan.features) ? [...plan.features] : [],
      is_active: plan.is_active,
      sort_order: String(plan.sort_order ?? 0),
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.name.trim() || !planForm.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    const amount = parseInt(planForm.amount_cents, 10);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error('Amount must be a non-negative number');
      return;
    }
    setPlanSaving(true);
    try {
      const payload = {
        name: planForm.name.trim(),
        slug: planForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: planForm.description.trim() || null,
        amount_cents: amount,
        currency: planForm.currency,
        interval: planForm.interval,
        features: planForm.features.filter(Boolean),
        is_active: planForm.is_active,
        sort_order: parseInt(planForm.sort_order, 10) || 0,
      };
      if (editingPlanId) {
        await api.patch(`/admin/subscriptions/plans/${editingPlanId}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/admin/subscriptions/plans', payload);
        toast.success('Plan created');
      }
      setPlanModalOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save plan');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan, isActive: boolean) => {
    setTogglingPlanId(plan.id);
    try {
      await api.patch(`/admin/subscriptions/plans/${plan.id}`, { is_active: isActive });
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, is_active: isActive } : p)));
      toast.success(isActive ? 'Plan activated' : 'Plan deactivated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update plan');
    } finally {
      setTogglingPlanId(null);
    }
  };

  const handleDeletePlan = async (id: string) => {
    const ok = await confirm({
      description: 'Are you sure you want to permanently delete this plan? This cannot be undone.',
      confirmText: 'Delete',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/subscriptions/plans/${id}`);
      toast.success('Plan deleted');
      fetchPlans();
    } catch {
      toast.error('Failed to delete plan');
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setPlanForm((f) => ({
      ...f,
      name,
      slug: editingPlanId ? f.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
  };

  // Computed metrics
  const totalSubscriptions = revenueStats?.breakdown.reduce((sum, item) => sum + item.subscriptions, 0) ?? 0;
  const avgRevenue = totalSubscriptions > 0 ? (revenueStats?.total ?? 0) / totalSubscriptions : 0;
  const sparklineData = revenueStats?.breakdown.map((b) => b.revenue) ?? [];

  const growthRate = useMemo(() => {
    if (!revenueStats?.breakdown || revenueStats.breakdown.length < 4) return 0;
    const mid = Math.floor(revenueStats.breakdown.length / 2);
    const firstHalf = revenueStats.breakdown.slice(0, mid).reduce((s, b) => s + b.revenue, 0);
    const secondHalf = revenueStats.breakdown.slice(mid).reduce((s, b) => s + b.revenue, 0);
    if (firstHalf === 0) return 0;
    return ((secondHalf - firstHalf) / firstHalf) * 100;
  }, [revenueStats]);

  // Pricing preview
  const previewAmount = parseInt(planForm.amount_cents, 10) || 0;
  const previewFormatted = formatCurrency(previewAmount, planForm.currency);
  const _previewInterval = planForm.interval === 'year'
    ? `${previewFormatted}/year (${formatCurrency(Math.round(previewAmount / 12), planForm.currency)}/mo)`
    : `${previewFormatted}/month`;

  // Table columns
  const planColumns: ColumnDef<SubscriptionPlan, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Plan',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium text-slate-100">{row.original.name}</p>
            {row.original.description && (
              <p className="mt-0.5 truncate text-xs text-slate-500 max-w-xs">{row.original.description}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'amount_cents',
        header: 'Pricing',
        cell: ({ row }) => (
          <span className="text-slate-200">
            {formatCurrency(row.original.amount_cents, row.original.currency)}
            <span className="text-slate-500"> / {row.original.interval}</span>
          </span>
        ),
      },
      {
        accessorKey: 'stripe_price_id',
        header: 'Stripe ID',
        cell: ({ row }) =>
          row.original.stripe_price_id ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block max-w-32 truncate font-mono text-[11px] text-slate-500">
                    {row.original.stripe_price_id}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="border-slate-700 bg-slate-900 text-xs text-slate-300">
                  {row.original.stripe_price_id}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-slate-600">&mdash;</span>
          ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} />
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const plan = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-300">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 border-slate-700 bg-slate-900 text-slate-300">
                  <DropdownMenuItem onClick={() => openEditPlan(plan)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit plan
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleToggleActive(plan, !plan.is_active)}
                    disabled={togglingPlanId === plan.id}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {plan.is_active ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => handleDeletePlan(plan.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [togglingPlanId],
  );

  // Modal sections
  const currencySymbol = planForm.currency === 'EUR' ? '€' : planForm.currency === 'GBP' ? '£' : '$';
  const modalSections: FormSection[] = [
    {
      key: 'identity',
      title: 'Plan Identity',
      description: 'Give your plan a recognizable name and unique slug',
      children: (
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">Plan Name</Label>
            <Input
              value={planForm.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="h-10 border-slate-700/80 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              placeholder="e.g., Pro Plan"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">URL Slug</Label>
            <Input
              value={planForm.slug}
              onChange={(e) => setPlanForm((f) => ({ ...f, slug: e.target.value }))}
              className="h-10 border-slate-700/80 bg-slate-950/60 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              placeholder="e.g., pro-plan"
            />
            {planForm.slug && (
              <p className="text-[10px] text-slate-600">
                Will be accessible as <span className="font-mono text-slate-500">/plans/{planForm.slug}</span>
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">Description</Label>
            <Textarea
              value={planForm.description}
              onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))}
              className="min-h-[72px] resize-none border-slate-700/80 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              placeholder="Brief plan description for customers..."
            />
          </div>
        </div>
      ),
    },
    {
      key: 'pricing',
      title: 'Pricing',
      description: 'Set the billing amount, currency, and interval',
      children: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">Amount (cents)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">{currencySymbol}</span>
                <Input
                  type="number"
                  value={planForm.amount_cents}
                  onChange={(e) => setPlanForm((f) => ({ ...f, amount_cents: e.target.value }))}
                  className="h-10 border-slate-700/80 bg-slate-950/60 pl-7 text-slate-100 tabular-nums placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                  placeholder="999"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">Currency</Label>
              <Select value={planForm.currency} onValueChange={(v) => setPlanForm((f) => ({ ...f, currency: v }))}>
                <SelectTrigger className="h-10 border-slate-700/80 bg-slate-950/60 text-slate-100 focus:ring-1 focus:ring-emerald-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-900 text-slate-100">
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">Billing Interval</Label>
            <SegmentedControl
              options={[
                { value: 'month', label: 'Monthly' },
                { value: 'year', label: 'Yearly' },
              ]}
              value={planForm.interval}
              onChange={(v) => setPlanForm((f) => ({ ...f, interval: v as 'month' | 'year' }))}
            />
          </div>
          {/* Live pricing preview */}
          <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-emerald-500/[0.02]">
            <div className="px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/70">Pricing Preview</p>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums text-slate-100">
                  {previewAmount > 0 ? `${currencySymbol}${(previewAmount / 100).toFixed(2)}` : `${currencySymbol}0.00`}
                </span>
                <span className="text-sm text-slate-500">/ {planForm.interval === 'year' ? 'year' : 'month'}</span>
              </div>
              {planForm.interval === 'year' && previewAmount > 0 && (
                <p className="mt-1 text-[11px] text-slate-500">
                  {currencySymbol}{(previewAmount / 100 / 12).toFixed(2)}/month billed annually
                </p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'config',
      title: 'Configuration',
      description: 'Control visibility, ordering, and included features',
      children: (
        <div className="space-y-5">
          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3.5">
            <div>
              <Label className="text-sm font-medium text-slate-200">Active</Label>
              <p className="mt-0.5 text-[11px] text-slate-500">Plan is visible to new subscribers</p>
            </div>
            <Switch
              checked={planForm.is_active}
              onCheckedChange={(checked) => setPlanForm((f) => ({ ...f, is_active: checked }))}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {/* Sort order */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">Sort Order</Label>
            <Input
              type="number"
              value={planForm.sort_order}
              onChange={(e) => setPlanForm((f) => ({ ...f, sort_order: e.target.value }))}
              className="h-10 w-28 border-slate-700/80 bg-slate-950/60 tabular-nums text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              placeholder="0"
            />
            <p className="text-[10px] text-slate-600">Lower values appear first in listings</p>
          </div>

          {/* Features */}
          <div className="grid gap-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Included Features
              {planForm.features.length > 0 && (
                <span className="ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500/10 px-1 text-[10px] font-semibold tabular-nums text-emerald-400">
                  {planForm.features.length}
                </span>
              )}
            </Label>
            <div className="space-y-1.5">
              {planForm.features.map((feature, index) => (
                <div key={index} className="group flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800/60 text-[10px] font-semibold tabular-nums text-slate-500">
                    {index + 1}
                  </div>
                  <Input
                    value={feature}
                    onChange={(e) => {
                      const updated = [...planForm.features];
                      updated[index] = e.target.value;
                      setPlanForm((f) => ({ ...f, features: updated }));
                    }}
                    className="h-9 border-slate-700/80 bg-slate-950/60 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                    placeholder={`Feature ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const updated = planForm.features.filter((_, i) => i !== index);
                      setPlanForm((f) => ({ ...f, features: updated }));
                    }}
                    className="h-8 w-8 shrink-0 text-slate-600 opacity-0 transition-opacity hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPlanForm((f) => ({ ...f, features: [...f.features, ''] }))}
                className="mt-1 w-full border-dashed border-slate-700/80 text-slate-500 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Feature
              </Button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-6 pb-4">
      {/* Compact header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
            <CreditCard className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Subscriptions</h1>
            <p className="text-sm text-slate-500">Manage plans, revenue, and billing operations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={revenuePeriod} onValueChange={(v) => setRevenuePeriod(v as typeof revenuePeriod)}>
            <SelectTrigger className="w-32 border-slate-700 bg-slate-800/60 text-sm text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900">
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">3 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreatePlan} className="bg-emerald-600 text-sm font-medium shadow-lg shadow-emerald-500/20 hover:bg-emerald-500">
            <Plus className="mr-1.5 h-4 w-4" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Tab sub-navigation */}
      <nav className="-mt-2 flex items-center  gap-1 overflow-x-auto border-b border-slate-800 pb-px">
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

      {/* Revenue metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={revenueStats?.total ?? 0}
          icon={DollarSign}
          accent="emerald"
          sparklineData={sparklineData}
          subtitle={revenuePeriod.charAt(0).toUpperCase() + revenuePeriod.slice(1)}
          isLoading={revenueLoading}
        />
        <MetricCard
          title="Active Subscriptions"
          value={totalSubscriptions}
          icon={Users}
          accent="cyan"
          prefix=""
          suffix=""
          subtitle={`Across ${revenueStats?.byPlan.length ?? 0} plans`}
          isLoading={revenueLoading}
        />
        <MetricCard
          title="Avg Revenue / Sub"
          value={avgRevenue}
          icon={TrendingUp}
          accent="violet"
          subtitle="Per subscription"
          isLoading={revenueLoading}
        />
        <MetricCard
          title="Growth Rate"
          value={growthRate}
          icon={BarChart3}
          accent="amber"
          prefix=""
          suffix="%"
          trend={growthRate !== 0 ? { value: Math.abs(growthRate), direction: growthRate > 0 ? 'up' : 'down' } : undefined}
          subtitle="vs prior half"
          isLoading={revenueLoading}
        />
      </div>

      {/* Revenue chart */}
      {revenueStats && revenueStats.breakdown.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Revenue Trend</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchRevenueStats}
              disabled={revenueLoading}
              className="h-7 w-7 text-slate-500 hover:text-slate-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${revenueLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <RevenueAreaChart data={revenueStats.breakdown} isLoading={revenueLoading} />
        </div>
      )}

      {/* Plans table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Plans</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchPlans}
            disabled={plansLoading}
            className="h-7 w-7 text-slate-500 hover:text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${plansLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <DataTable
          columns={planColumns}
          data={plans}
          isLoading={plansLoading}
          stickyHeader
          tableId="admin-plans"
          pagination={{
            page: plansPage,
            total: plansTotal,
            pageSize: 20,
            onPageChange: setPlansPage,
          }}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60">
                <Sparkles className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">No plans yet</p>
                <p className="mt-0.5 text-xs text-slate-500">Create your first plan to get started</p>
              </div>
              <Button onClick={openCreatePlan} variant="outline" size="sm" className="mt-1 border-slate-700 text-slate-400">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create Plan
              </Button>
            </div>
          }
        />
      </div>

      {/* Create/Edit Plan Modal */}
      <FormModal
        title={editingPlanId ? 'Edit Plan' : 'Create New Plan'}
        description={editingPlanId ? 'Update plan details and configuration.' : 'Set up a new subscription plan for your customers.'}
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        sections={modalSections}
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setPlanModalOpen(false)}
              className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={planSaving || !planForm.name.trim() || !planForm.slug.trim()}
              className="bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 disabled:opacity-50"
            >
              {planSaving ? 'Saving...' : editingPlanId ? 'Update Plan' : 'Create Plan'}
            </Button>
          </>
        }
      />
    </div>
  );
}
