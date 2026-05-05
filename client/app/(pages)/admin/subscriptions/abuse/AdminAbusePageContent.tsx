'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckCircle2,
  CreditCard,
  Users,
  Grid3X3,
  ShieldAlert,
  Gift,
  AlertTriangle,
  Activity,
  BarChart3,
  MoreHorizontal,
  Ban,
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

import { api, ApiError } from '@/lib/api-client';
import { AbuseSignalBadge } from '@/components/admin/AbuseSignalBadge';
import { OverrideDialog } from '@/components/admin/OverrideDialog';
import toast from 'react-hot-toast';
import { DataTable, FilterBar, type FilterConfig } from '@/components/admin/premium';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Signal {
  id: string;
  userId: string;
  signalKind: string;
  score: number;
  evidence: Record<string, unknown>;
  reviewedAt: string | null;
  actionTaken: string | null;
  createdAt: string;
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
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

const FILTER_CONFIG: FilterConfig[] = [
  {
    key: 'unreviewedOnly',
    label: 'Unreviewed only',
    type: 'boolean',
  },
];

export default function AdminAbusePageContent() {
  const pathname = usePathname();
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [filters, setFilters] = useState<Record<string, unknown>>({ unreviewedOnly: true });
  const [suspendTarget, setSuspendTarget] = useState<string | null>(null);

  const unreviewedOnly = !!filters.unreviewedOnly;

  const load = useCallback(async () => {
    setSignals(null);
    try {
      const res = await api.get<{ signals: Signal[] }>(
        `/admin/billing/abuse-signals?unreviewedOnly=${unreviewedOnly}`,
      );
      if (res.success && res.data) setSignals(res.data.signals);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Load failed');
      setSignals([]);
    }
  }, [unreviewedOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  const markReviewed = async (id: string, action: string) => {
    try {
      await api.post(`/admin/billing/abuse-signals/${id}/review`, { actionTaken: action });
      toast.success('Signal marked reviewed');
      void load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Failed');
    }
  };

  const columns = useMemo<ColumnDef<Signal, unknown>[]>(
    () => [
      {
        accessorKey: 'score',
        header: 'Score',
        cell: ({ row }) => <AbuseSignalBadge score={row.original.score} />,
        size: 80,
      },
      {
        accessorKey: 'signalKind',
        header: 'Kind',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-slate-200">
            {row.original.signalKind.replace(/_/g, ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'userId',
        header: 'User',
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-slate-500">
            {row.original.userId.slice(0, 8)}…
          </span>
        ),
      },
      {
        id: 'evidence_summary',
        header: 'Evidence',
        cell: ({ row }) => (
          <span className="max-w-xs truncate text-[11px] text-slate-400">
            {JSON.stringify(row.original.evidence).slice(0, 60)}…
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Time',
        cell: ({ row }) => (
          <span className="text-[11px] text-slate-500">{formatWhen(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 44,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          if (row.original.reviewedAt) {
            return (
              <span className="text-[11px] text-emerald-300">
                {row.original.actionTaken}
              </span>
            );
          }
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-slate-700 bg-slate-900">
                <DropdownMenuItem onClick={() => void markReviewed(row.original.id, 'cleared')}>
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  Clear
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  onClick={() => setSuspendTarget(row.original.userId)}
                  className="text-rose-400 focus:text-rose-300"
                >
                  <Ban className="mr-2 h-3.5 w-3.5" />
                  Suspend user
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Abuse Signals</h1>
            <p className="text-sm text-slate-500">
              Detector output — scores ≥ 90 auto-suspend, 50–89 surface here for review
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
          data={signals ?? []}
          isLoading={signals === null}
          getRowId={(row) => row.id}
          tableId="admin-abuse"
          renderExpandedRow={(row) => (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Full Evidence
              </p>
              <pre className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300 overflow-auto max-h-64">
                {JSON.stringify(row.evidence, null, 2)}
              </pre>
            </div>
          )}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
              <p className="text-sm text-slate-400">
                No signals {unreviewedOnly ? 'to review' : 'in the log'}
              </p>
            </div>
          }
        />
      </div>

      <OverrideDialog
        open={!!suspendTarget}
        onOpenChange={(o) => !o && setSuspendTarget(null)}
        action="suspend"
        userId={suspendTarget}
        onSuccess={() => {
          setSuspendTarget(null);
          void load();
        }}
      />
    </>
  );
}
