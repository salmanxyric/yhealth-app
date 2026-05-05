'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Plus,
  Loader2,
  CreditCard,
  Users,
  Grid3X3,
  ShieldAlert,
  Gift,
  AlertTriangle,
  Activity,
  BarChart3,
  Tag,
  Copy,
  MoreHorizontal,
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

import { api, ApiError } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { DataTable, StatusBadge, FormModal, type FormSection } from '@/components/admin/premium';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PromoRow {
  id: string;
  code: string;
  kind: 'credit_grant' | 'percent_off' | 'fixed_off' | 'trial_extend';
  credits_granted: number;
  discount_percent: number | null;
  discount_cents: number | null;
  max_redemptions: number | null;
  redemption_count: number;
  per_user_limit: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getPromoValue(p: PromoRow): string {
  if (p.kind === 'credit_grant') return `${p.credits_granted} credits`;
  if (p.kind === 'percent_off') return `${p.discount_percent}%`;
  if (p.kind === 'fixed_off') return `$${((p.discount_cents ?? 0) / 100).toFixed(2)}`;
  return 'Trial';
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

export default function AdminPromotionsPageContent() {
  const pathname = usePathname();
  const [rows, setRows] = useState<PromoRow[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newKind, setNewKind] = useState<PromoRow['kind']>('credit_grant');
  const [newCredits, setNewCredits] = useState('');
  const [newMax, setNewMax] = useState('');
  const [newExpires, setNewExpires] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ promos: PromoRow[] }>('/admin/billing/promo-codes');
      if (res.success && res.data) setRows(res.data.promos);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Load failed');
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!newCode.trim()) {
      toast.error('Code required');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/billing/promo-codes', {
        code: newCode,
        kind: newKind,
        creditsGranted: parseInt(newCredits, 10) || 0,
        maxRedemptions: newMax ? parseInt(newMax, 10) : null,
        expiresAt: newExpires ? new Date(newExpires).toISOString() : null,
      });
      toast.success('Promo created');
      setCreateOpen(false);
      setNewCode('');
      setNewCredits('');
      setNewMax('');
      setNewExpires('');
      void load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/billing/promo-codes/${id}`, { isActive: !isActive });
      void load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Update failed');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard');
  };

  const columns = useMemo<ColumnDef<PromoRow, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-2 font-mono text-sm text-slate-100">
            <Tag className="h-3 w-3 text-cyan-400" />
            {row.original.code}
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyCode(row.original.code);
              }}
              className="text-slate-600 transition-colors hover:text-slate-300"
            >
              <Copy className="h-3 w-3" />
            </button>
          </span>
        ),
      },
      {
        accessorKey: 'kind',
        header: 'Kind',
        cell: ({ row }) => <StatusBadge status={row.original.kind} />,
      },
      {
        id: 'value',
        header: 'Value',
        cell: ({ row }) => (
          <span className="text-xs text-slate-300">{getPromoValue(row.original)}</span>
        ),
      },
      {
        id: 'redemptions',
        header: 'Redemptions',
        cell: ({ row }) => {
          const { redemption_count, max_redemptions } = row.original;
          const pct = max_redemptions ? (redemption_count / max_redemptions) * 100 : 0;
          return (
            <div className="flex items-center gap-2">
              <span className="text-xs tabular-nums text-slate-300">
                {redemption_count}
                {max_redemptions !== null && ` / ${max_redemptions}`}
              </span>
              {max_redemptions !== null && (
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'expires_at',
        header: 'Expires',
        cell: ({ row }) => (
          <span className="text-xs text-slate-400">{formatDate(row.original.expires_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 44,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-slate-700 bg-slate-900">
              <DropdownMenuItem onClick={() => void toggleActive(row.original.id, row.original.is_active)}>
                {row.original.is_active ? 'Pause' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copyCode(row.original.code)}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copy code
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const formSections: FormSection[] = [
    {
      key: 'code-type',
      title: 'Code & Type',
      children: (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Code</label>
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="LAUNCH50"
              maxLength={40}
              className="border-slate-700 bg-slate-950/40 font-mono text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Kind</label>
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as PromoRow['kind'])}
              className="w-full rounded-md border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            >
              <option value="credit_grant">Credit grant</option>
              <option value="percent_off">% off</option>
              <option value="fixed_off">$ off</option>
              <option value="trial_extend">Trial extend</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      key: 'value-limits',
      title: 'Value & Limits',
      children: (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Credits / Value</label>
            <Input
              type="number"
              value={newCredits}
              onChange={(e) => setNewCredits(e.target.value)}
              placeholder="50"
              min={0}
              className="border-slate-700 bg-slate-950/40 text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Max redemptions</label>
            <Input
              type="number"
              value={newMax}
              onChange={(e) => setNewMax(e.target.value)}
              placeholder="Leave blank for unlimited"
              min={1}
              className="border-slate-700 bg-slate-950/40 text-slate-100"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'expiry',
      title: 'Expiry',
      children: (
        <div className="max-w-xs">
          <label className="mb-1 block text-xs font-medium text-slate-400">Expires at</label>
          <Input
            type="date"
            value={newExpires}
            onChange={(e) => setNewExpires(e.target.value)}
            className="border-slate-700 bg-slate-950/40 text-slate-100"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-4">
      {/* Compact header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10">
            <Gift className="h-4.5 w-4.5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Promo Codes</h1>
            <p className="text-sm text-slate-500">
              Issue credit grants or discount codes with per-user tracking
            </p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Create Code
        </Button>
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={rows ?? []}
        isLoading={rows === null}
        getRowId={(row) => row.id}
        tableId="admin-promos"
        emptyState={
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Tag className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-400">No promo codes yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="mt-2 border-slate-700 text-slate-300"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create your first code
            </Button>
          </div>
        }
      />

      {/* Create modal */}
      <FormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Promo Code"
        description="Issue a new promotional code for customers"
        sections={formSections}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button onClick={create} disabled={creating} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Code
            </Button>
          </div>
        }
      />
    </div>
  );
}
