'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CreditCard,
  Users,
  Grid3X3,
  ShieldAlert,
  Gift,
  AlertTriangle,
  Activity,
  BarChart3,
  MoreHorizontal,
  Undo2,
  Ban,
  Unlock,
  Coins,
  MinusCircle,
  Clock,
  FileCheck,
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

import { api, ApiError } from '@/lib/api-client';
import { OverrideDialog, type OverrideAction } from '@/components/admin/OverrideDialog';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { confirm } from '@/components/common/ConfirmDialog';
import { DataTable, StatusBadge, FilterBar, type FilterConfig } from '@/components/admin/premium';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface OverrideRow {
  id: string;
  userId: string;
  kind: string;
  planId: string | null;
  creditsDelta: number | null;
  days: number | null;
  reason: string;
  effectiveAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface PlanRow {
  id: string;
  name: string;
  slug: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getOverrideStatus(o: OverrideRow): string {
  if (o.revokedAt) return 'revoked';
  if (o.expiresAt && new Date(o.expiresAt) < new Date()) return 'expired';
  return 'active';
}

function getDetail(o: OverrideRow): string {
  if (o.creditsDelta !== null) return `${o.creditsDelta > 0 ? '+' : ''}${o.creditsDelta} credits`;
  if (o.days !== null) return `${o.days} days`;
  if (o.planId) return `Plan ${o.planId.slice(0, 6)}…`;
  return '—';
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

const ACTION_CARDS = [
  { action: 'grant_credits' as OverrideAction, label: 'Grant Credits', description: 'Add credits to account', icon: Coins, accent: 'text-emerald-400 bg-emerald-500/10' },
  { action: 'deduct_credits' as OverrideAction, label: 'Deduct Credits', description: 'Remove credits from account', icon: MinusCircle, accent: 'text-amber-400 bg-amber-500/10' },
  { action: 'extend_trial' as OverrideAction, label: 'Extend Trial', description: 'Add days to trial period', icon: Clock, accent: 'text-violet-400 bg-violet-500/10' },
  { action: 'comp_plan' as OverrideAction, label: 'Comp Plan', description: 'Assign complimentary plan', icon: FileCheck, accent: 'text-cyan-400 bg-cyan-500/10' },
  { action: 'suspend' as OverrideAction, label: 'Suspend', description: 'Disable account access', icon: Ban, accent: 'text-rose-400 bg-rose-500/10' },
  { action: 'unsuspend' as OverrideAction, label: 'Unsuspend', description: 'Restore account access', icon: Unlock, accent: 'text-emerald-400 bg-emerald-500/10' },
];

const FILTER_CONFIG: FilterConfig[] = [
  { key: 'search', label: 'Search', type: 'search', placeholder: 'Filter by user ID...' },
];

export default function AdminOverridesPageContent() {
  const pathname = usePathname();
  const [rows, setRows] = useState<OverrideRow[] | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<OverrideAction>('grant_credits');
  const [dialogUserId, setDialogUserId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');

  const filterUser = (filters.search as string) ?? '';

  const load = useCallback(async () => {
    setRows(null);
    try {
      const url = filterUser
        ? `/admin/billing/overrides?userId=${encodeURIComponent(filterUser)}`
        : '/admin/billing/overrides';
      const res = await api.get<{ overrides: OverrideRow[] }>(url);
      if (res.success && res.data) setRows(res.data.overrides);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Load failed');
      setRows([]);
    }
  }, [filterUser]);

  const loadPlans = useCallback(async () => {
    try {
      const res = await api.get<{ plans: Array<{ id: string; name: string; slug: string }> }>(
        '/subscription/plans',
      );
      if (res.success && res.data) setPlans(res.data.plans);
    } catch {
      /* non-blocking */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const revoke = async (id: string) => {
    const ok = await confirm({
      description: 'Are you sure you want to revoke this override?',
      confirmText: 'Revoke',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await api.post(`/admin/billing/overrides/${id}/revoke`, {});
      toast.success('Override revoked');
      void load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Revoke failed');
    }
  };

  const openAction = (action: OverrideAction) => {
    if (!userInput.trim()) {
      toast.error('Paste a user ID first');
      return;
    }
    setDialogAction(action);
    setDialogUserId(userInput.trim());
    setDialogOpen(true);
  };

  const columns = useMemo<ColumnDef<OverrideRow, unknown>[]>(
    () => [
      {
        accessorKey: 'kind',
        header: 'Kind',
        cell: ({ row }) => <StatusBadge status={row.original.kind} />,
      },
      {
        accessorKey: 'userId',
        header: 'User',
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-slate-400">
            {row.original.userId.slice(0, 8)}…
          </span>
        ),
      },
      {
        id: 'detail',
        header: 'Detail',
        cell: ({ row }) => (
          <span className="text-xs text-slate-300">{getDetail(row.original)}</span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="max-w-xs truncate text-xs text-slate-400">{row.original.reason}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Applied',
        cell: ({ row }) => (
          <span className="text-[11px] text-slate-500">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = getOverrideStatus(row.original);
          return <StatusBadge status={status} />;
        },
      },
      {
        id: 'actions',
        header: '',
        size: 44,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          if (row.original.revokedAt) return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-slate-700 bg-slate-900">
                <DropdownMenuItem
                  onClick={() => void revoke(row.original.id)}
                  className="text-rose-400 focus:text-rose-300"
                >
                  <Undo2 className="mr-2 h-3.5 w-3.5" />
                  Revoke
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [],
  );

  return (
    <>
      <div className="space-y-6 pb-4">
        {/* Compact header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Admin Overrides</h1>
            <p className="text-sm text-slate-500">
              Grant credits, comp plans, suspend accounts — all audit-logged
            </p>
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

        {/* Action launcher */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Act on user (paste user ID)
          </label>
          <input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
            className="mb-4 w-full max-w-md rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 font-mono text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ACTION_CARDS.map((card) => {
              const Icon = card.icon;
              return (
              <button
                key={card.action}
                type="button"
                onClick={() => openAction(card.action)}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-800/40"
              >
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', card.accent)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{card.label}</p>
                  <p className="text-xs text-slate-500">{card.description}</p>
                </div>
              </button>
              );
            })}
          </div>
        </section>

        {/* Filters */}
        <FilterBar
          filters={FILTER_CONFIG}
          values={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onReset={() => setFilters({})}
        />

        {/* Table */}
        <DataTable
          columns={columns}
          data={rows ?? []}
          isLoading={rows === null}
          getRowId={(row) => row.id}
          tableId="admin-overrides"
          emptyState={
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <ShieldAlert className="h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">No overrides yet</p>
            </div>
          }
        />
      </div>

      <OverrideDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        action={dialogAction}
        userId={dialogUserId}
        plans={plans}
        onSuccess={() => void load()}
      />
    </>
  );
}
