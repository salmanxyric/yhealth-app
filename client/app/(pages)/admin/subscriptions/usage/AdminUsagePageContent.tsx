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
  User as UserIcon,
  ScrollText,
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

import { api, ApiError } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { DataTable, StatusBadge, FilterBar, type FilterConfig } from '@/components/admin/premium';

interface AuditEntry {
  id: string;
  actorUserId: string | null;
  actorKind: string;
  entityType: string;
  entityId: string | null;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
  { key: 'search', label: 'Search', type: 'search', placeholder: 'Filter by user ID...' },
  {
    key: 'actorKind',
    label: 'Actor',
    type: 'select',
    options: [
      { value: 'user', label: 'User' },
      { value: 'admin', label: 'Admin' },
      { value: 'system', label: 'System' },
      { value: 'webhook', label: 'Webhook' },
    ],
  },
];

export default function AdminUsagePageContent() {
  const pathname = usePathname();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const userFilter = (filters.search as string) ?? '';

  const load = useCallback(async () => {
    setEntries(null);
    try {
      const url = userFilter
        ? `/admin/billing/audit?userId=${encodeURIComponent(userFilter)}`
        : '/admin/billing/audit';
      const res = await api.get<{ entries: AuditEntry[] }>(url);
      if (res.success && res.data) setEntries(res.data.entries);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Load failed');
      setEntries([]);
    }
  }, [userFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const actorKindFilter = filters.actorKind as string | undefined;
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    if (!actorKindFilter) return entries;
    return entries.filter((e) => e.actorKind === actorKindFilter);
  }, [entries, actorKindFilter]);

  const columns = useMemo<ColumnDef<AuditEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'actorKind',
        header: 'Actor',
        size: 90,
        cell: ({ row }) => <StatusBadge status={row.original.actorKind} />,
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-slate-200">{row.original.action}</span>
        ),
      },
      {
        accessorKey: 'entityType',
        header: 'Entity',
        cell: ({ row }) => (
          <span className="text-[11px] text-slate-400">{row.original.entityType}</span>
        ),
      },
      {
        accessorKey: 'entityId',
        header: 'Entity ID',
        cell: ({ row }) =>
          row.original.entityId ? (
            <span className="max-w-[140px] truncate font-mono text-[11px] text-slate-500">
              {row.original.entityId}
            </span>
          ) : (
            <span className="text-slate-600">—</span>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Timestamp',
        cell: ({ row }) => (
          <span className="text-[11px] text-slate-500">{formatDate(row.original.createdAt)}</span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 pb-4">
      {/* Compact header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
          <Activity className="h-4.5 w-4.5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Usage & Audit Log</h1>
          <p className="text-sm text-slate-500">
            Append-only audit trail — enforced by Postgres trigger, rows cannot be edited
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
        data={filteredEntries}
        isLoading={entries === null}
        getRowId={(row) => row.id}
        tableId="admin-audit"
        renderExpandedRow={(row) => (
          <div className="grid gap-4 md:grid-cols-2 text-[11px]">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Before</p>
              <pre className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-slate-300 overflow-auto max-h-48">
                {row.before ? JSON.stringify(row.before, null, 2) : '—'}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">After</p>
              <pre className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-slate-300 overflow-auto max-h-48">
                {row.after ? JSON.stringify(row.after, null, 2) : '—'}
              </pre>
            </div>
            {row.actorUserId && (
              <p className="md:col-span-2 flex items-center gap-1.5 text-slate-500">
                <UserIcon className="h-3 w-3" />
                Actor: <span className="font-mono">{row.actorUserId}</span>
              </p>
            )}
          </div>
        )}
        emptyState={
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <ScrollText className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-400">No audit entries match</p>
          </div>
        }
      />
    </div>
  );
}
