'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  RefreshCw,
  Inbox,
  Download,
  Trash2,
  MoreHorizontal,
  FileText,
  Pencil,
  CreditCard,
  Grid3X3,
  ShieldAlert,
  Gift,
  AlertTriangle,
  Activity,
  BarChart3,
} from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/app/context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import type { SubscriptionPlan, UserSubscription } from '../types';
import { generateInvoicePDF, type InvoiceData } from '@/lib/invoice-pdf';

import {
  DataTable,
  FilterBar,
  StatusBadge,
  FormModal,
  type FilterConfig,
  type FormSection,
  type BulkAction,
} from '@/components/admin/premium';

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

function displayName(sub: UserSubscription) {
  if (sub.user_first_name || sub.user_last_name) {
    return [sub.user_first_name, sub.user_last_name].filter(Boolean).join(' ') || sub.user_email || '—';
  }
  return sub.user_email || '—';
}

export default function AdminCustomerSubscriptionsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [subsTotal, setSubsTotal] = useState(0);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsPage, setSubsPage] = useState(1);

  // Filters
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit subscription modal
  const [editSubModalOpen, setEditSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<UserSubscription | null>(null);
  const [subForm, setSubForm] = useState({
    status: '',
    current_period_start: '',
    current_period_end: '',
    cancel_at_period_end: false,
  });
  const [subSaving, setSubSaving] = useState(false);

  // Invoice
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [_invoiceSub, setInvoiceSub] = useState<UserSubscription | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user, router]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get<{ plans: SubscriptionPlan[]; total: number }>('/admin/subscriptions/plans?limit=100');
      const data = res.data as { plans: SubscriptionPlan[]; total: number } | undefined;
      setPlans(data?.plans ?? []);
    } catch {
      setPlans([]);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setSubsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(subsPage), limit: '20' });
      const statusFilter = filterValues.status as string | undefined;
      const planFilter = filterValues.plan as string | undefined;
      if (statusFilter) params.set('status', statusFilter);
      if (planFilter) params.set('planId', planFilter);
      const res = await api.get<{ subscriptions: UserSubscription[]; total: number }>(
        `/admin/subscriptions/subscriptions?${params.toString()}`,
      );
      const data = res.data as { subscriptions: UserSubscription[]; total: number } | undefined;
      setSubscriptions(data?.subscriptions ?? []);
      setSubsTotal(data?.total ?? res.meta?.total ?? 0);
    } catch {
      setSubscriptions([]);
      setSubsTotal(0);
    } finally {
      setSubsLoading(false);
    }
  }, [subsPage, filterValues.status, filterValues.plan]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  // Filter config
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      { key: 'search', type: 'search', label: 'Search', placeholder: 'Search by name or email...' },
      {
        key: 'status',
        type: 'select',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'canceled', label: 'Canceled' },
          { value: 'past_due', label: 'Past Due' },
          { value: 'trialing', label: 'Trialing' },
        ],
      },
      {
        key: 'plan',
        type: 'select',
        label: 'Plan',
        options: plans.map((p) => ({ value: p.id, label: p.name })),
      },
    ],
    [plans],
  );

  // Handlers
  const openEditSubscription = (sub: UserSubscription) => {
    setEditingSub(sub);
    setSubForm({
      status: sub.status,
      current_period_start: sub.current_period_start ? format(new Date(sub.current_period_start), 'yyyy-MM-dd') : '',
      current_period_end: sub.current_period_end ? format(new Date(sub.current_period_end), 'yyyy-MM-dd') : '',
      cancel_at_period_end: sub.cancel_at_period_end,
    });
    setEditSubModalOpen(true);
  };

  const handleSaveSubscription = async () => {
    if (!editingSub) return;
    setSubSaving(true);
    try {
      await api.patch(`/admin/subscriptions/subscriptions/${editingSub.id}`, subForm);
      toast.success('Subscription updated');
      setEditSubModalOpen(false);
      fetchSubscriptions();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update subscription');
    } finally {
      setSubSaving(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSubscription = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/subscriptions/subscriptions/${deleteTargetId}`);
      toast.success('Subscription deleted');
      fetchSubscriptions();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete subscription');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(ids.map((id) => api.delete(`/admin/subscriptions/subscriptions/${id}`).catch(() => null)));
      toast.success(`Deleted ${ids.length} subscription(s)`);
      fetchSubscriptions();
    } catch {
      toast.error('Failed to delete some subscriptions');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (subscriptions.length === 0) {
      toast.error('No subscriptions to export');
      return;
    }
    const headers = ['User Name', 'Email', 'Plan', 'Amount', 'Currency', 'Status', 'Period Start', 'Period End', 'Cancel at Period End', 'Created'];
    const rows = subscriptions.map((sub) => [
      displayName(sub),
      sub.user_email || '',
      sub.plan_name || sub.plan_slug || '',
      sub.plan_amount_cents ? (sub.plan_amount_cents / 100).toFixed(2) : '',
      (sub.plan_currency || 'USD').toUpperCase(),
      sub.status,
      sub.current_period_start ? format(new Date(sub.current_period_start), 'yyyy-MM-dd') : '',
      sub.current_period_end ? format(new Date(sub.current_period_end), 'yyyy-MM-dd') : '',
      sub.cancel_at_period_end ? 'Yes' : 'No',
      sub.created_at ? format(new Date(sub.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `subscriptions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Exported to CSV');
  };

  const handleGenerateInvoice = async (sub: UserSubscription) => {
    setInvoiceSub(sub);
    try {
      const res = await api.post<InvoiceData>('/admin/subscriptions/invoice', { subscriptionId: sub.id });
      if (res.success && res.data) {
        setInvoiceData(res.data);
        setInvoiceModalOpen(true);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to generate invoice');
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceData) return;
    await generateInvoicePDF(invoiceData);
    toast.success('Invoice downloaded');
  };

  // Table columns
  const columns: ColumnDef<UserSubscription, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'user_email',
        header: 'Customer',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium text-slate-100">{displayName(row.original)}</p>
            {row.original.user_email && (
              <p className="mt-0.5 truncate text-xs text-slate-500">{row.original.user_email}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'plan_name',
        header: 'Plan',
        cell: ({ row }) => (
          <span className="text-slate-300">{row.original.plan_name || row.original.plan_slug || '—'}</span>
        ),
      },
      {
        accessorKey: 'plan_amount_cents',
        header: 'Amount',
        cell: ({ row }) => {
          const sub = row.original;
          return sub.plan_amount_cents != null ? (
            <span className="text-slate-200">
              {(sub.plan_amount_cents / 100).toFixed(2)}{' '}
              <span className="text-slate-500">{(sub.plan_currency || 'USD').toUpperCase()}</span>
            </span>
          ) : (
            <span className="text-slate-600">&mdash;</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'period',
        header: 'Period',
        cell: ({ row }) => {
          const s = row.original;
          if (!s.current_period_start && !s.current_period_end) return <span className="text-slate-600">&mdash;</span>;
          return (
            <span className="text-xs text-slate-400">
              {s.current_period_start ? format(new Date(s.current_period_start), 'MMM d') : '?'}
              {' – '}
              {s.current_period_end ? format(new Date(s.current_period_end), 'MMM d, yyyy') : '?'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const sub = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-300">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 border-slate-700 bg-slate-900 text-slate-300">
                  <DropdownMenuItem onClick={() => openEditSubscription(sub)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleGenerateInvoice(sub)}>
                    <FileText className="h-3.5 w-3.5" />
                    Generate Invoice
                  </DropdownMenuItem>
                  {sub.invoice_url && (
                    <DropdownMenuItem onClick={() => window.open(sub.invoice_url!, '_blank')}>
                      <Download className="h-3.5 w-3.5" />
                      Download Invoice
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem variant="destructive" onClick={() => handleDeleteSubscription(sub.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  // Bulk actions
  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        label: 'Delete',
        icon: <Trash2 className="mr-1 h-3.5 w-3.5" />,
        onClick: handleBulkDelete,
        variant: 'destructive',
      },
    ],
    [],
  );

  // Edit modal sections
  const editSections: FormSection[] = editingSub
    ? [
        {
          key: 'status',
          title: 'Subscription Status',
          children: (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-slate-400">Status</Label>
                <Select value={subForm.status} onValueChange={(v) => setSubForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="border-slate-700 bg-slate-800/60 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-900">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300">Cancel at period end</Label>
                  <p className="text-xs text-slate-500">Subscription will not renew after current period</p>
                </div>
                <Switch
                  checked={subForm.cancel_at_period_end}
                  onCheckedChange={(checked) => setSubForm((f) => ({ ...f, cancel_at_period_end: checked }))}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          ),
        },
        {
          key: 'period',
          title: 'Billing Period',
          children: (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-slate-400">Period Start</Label>
                <Input
                  type="date"
                  value={subForm.current_period_start}
                  onChange={(e) => setSubForm((f) => ({ ...f, current_period_start: e.target.value }))}
                  className="border-slate-700 bg-slate-800/60 text-slate-100"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-400">Period End</Label>
                <Input
                  type="date"
                  value={subForm.current_period_end}
                  onChange={(e) => setSubForm((f) => ({ ...f, current_period_end: e.target.value }))}
                  className="border-slate-700 bg-slate-800/60 text-slate-100"
                />
              </div>
            </div>
          ),
        },
      ]
    : [];

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-6 pb-4">
      {/* Compact header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
            <Users className="h-4.5 w-4.5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Customer Subscriptions</h1>
            <p className="text-sm text-slate-500">View and manage all customer subscriptions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchSubscriptions}
            disabled={subsLoading}
            className="h-8 w-8 text-slate-500 hover:text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${subsLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
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
        filters={filterConfigs}
        values={filterValues}
        onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
        onReset={() => setFilterValues({})}
      />

      {/* Subscriptions table */}
      <DataTable
        columns={columns}
        data={subscriptions}
        isLoading={subsLoading}
        stickyHeader
        enableSelection
        enableColumnVisibility
        tableId="admin-customer-subs"
        getRowId={(row) => row.id}
        bulkActions={bulkActions}
        pagination={{
          page: subsPage,
          total: subsTotal,
          pageSize: 20,
          onPageChange: setSubsPage,
        }}
        emptyState={
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Inbox className="h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-400">No subscriptions found</p>
            <p className="text-xs text-slate-500">Adjust your filters or wait for new signups</p>
          </div>
        }
      />

      {/* Edit Subscription Modal */}
      <FormModal
        title="Edit Subscription"
        description={editingSub ? `Editing subscription for ${displayName(editingSub)}` : undefined}
        open={editSubModalOpen}
        onOpenChange={setEditSubModalOpen}
        maxWidth="md"
        sections={editSections}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setEditSubModalOpen(false)}
              className="border-slate-700 text-slate-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSubscription}
              disabled={subSaving}
              className="bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:bg-emerald-500"
            >
              {subSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      />

      {/* Invoice Preview Modal */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="max-w-2xl border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Invoice Preview</DialogTitle>
          </DialogHeader>
          {invoiceData && (
            <div className="space-y-4 py-4">
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Invoice Number</p>
                    <p className="mt-0.5 font-medium text-slate-200">{invoiceData.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="mt-0.5 font-medium text-slate-200">{format(new Date(invoiceData.date), 'PP')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Customer</p>
                    <p className="mt-0.5 font-medium text-slate-200">{invoiceData.customer.name}</p>
                    <p className="text-xs text-slate-500">{invoiceData.customer.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Plan</p>
                    <p className="mt-0.5 font-medium text-slate-200">{invoiceData.plan.name}</p>
                  </div>
                  {invoiceData.period.start && invoiceData.period.end && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Period</p>
                      <p className="mt-0.5 font-medium text-slate-200">
                        {format(new Date(invoiceData.period.start), 'PP')} – {format(new Date(invoiceData.period.end), 'PP')}
                      </p>
                    </div>
                  )}
                  <div className="col-span-2 border-t border-slate-700 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-300">Total</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {invoiceData.plan.currency} {invoiceData.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceModalOpen(false)} className="border-slate-700 text-slate-400">
              Close
            </Button>
            <Button onClick={handleDownloadPDF} disabled={!invoiceData} className="bg-emerald-600 hover:bg-emerald-500">
              <Download className="mr-1.5 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="border-slate-800 bg-slate-900 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-4 w-4" />
              Delete Subscription
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. The subscription will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-400 hover:bg-slate-800">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSubscription}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
