'use client';

import { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';

import { ContentSkeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/api-client';
import {
  EntityMatrix,
  type AccessLevel,
  type MatrixCell,
  type MatrixColumn,
  type MatrixRow,
} from '@/components/admin/EntityMatrix';
import { SegmentedControl } from '@/components/admin/premium';

interface MatrixPayload {
  plans: Array<{ id: string; slug: string; name: string; tier: number }>;
  featureCatalog: Array<{
    feature_key: string;
    label: string;
    category: string;
    credit_cost_default: number;
  }>;
  pageCatalog: Array<{ page_key: string; label: string }>;
  menuCatalog: Array<{ menu_key: string; label: string; section: string }>;
  planFeatures: Array<{
    plan_id: string;
    feature_key: string;
    is_enabled: boolean;
    credit_cost: number | null;
  }>;
  planPages: Array<{
    plan_id: string;
    page_key: string;
    access_level: AccessLevel;
  }>;
  planMenus: Array<{
    plan_id: string;
    menu_key: string;
    visible: boolean;
  }>;
}

type MatrixView = 'features' | 'credits' | 'pages' | 'menus';

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

const VIEW_OPTIONS = [
  { value: 'features', label: 'Features' },
  { value: 'credits', label: 'Credit costs' },
  { value: 'pages', label: 'Pages' },
  { value: 'menus', label: 'Menus' },
];

export default function AdminFeaturesPageContent() {
  const pathname = usePathname();
  const [data, setData] = useState<MatrixPayload | null>(null);
  const [view, setView] = useState<MatrixView>('features');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get<MatrixPayload>('/admin/billing/matrix');
      if (res.success && res.data) setData(res.data);
      else setError('Could not load matrix');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load matrix');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: MatrixColumn[] = (data?.plans ?? []).map((p) => ({
    id: p.id,
    label: p.name,
    tier: p.tier,
  }));

  const featureRows: MatrixRow[] = (data?.featureCatalog ?? []).map((f) => ({
    key: f.feature_key,
    label: f.label,
    category: f.category,
  }));

  const pageRows: MatrixRow[] = (data?.pageCatalog ?? []).map((p) => ({
    key: p.page_key,
    label: p.label,
  }));

  const menuRows: MatrixRow[] = (data?.menuCatalog ?? []).map((m) => ({
    key: m.menu_key,
    label: m.label,
    category: m.section,
  }));

  const featureCells: MatrixCell[] = (data?.planFeatures ?? []).map((r) => ({
    row: r.feature_key,
    column: r.plan_id,
    value: r.is_enabled,
  }));

  const creditCells: MatrixCell[] = (data?.planFeatures ?? []).map((r) => ({
    row: r.feature_key,
    column: r.plan_id,
    value:
      r.credit_cost !== null
        ? r.credit_cost
        : data?.featureCatalog.find((f) => f.feature_key === r.feature_key)
              ?.credit_cost_default ?? null,
  }));

  const pageCells: MatrixCell[] = (data?.planPages ?? []).map((r) => ({
    row: r.page_key,
    column: r.plan_id,
    value: r.access_level,
  }));

  const menuCells: MatrixCell[] = (data?.planMenus ?? []).map((r) => ({
    row: r.menu_key,
    column: r.plan_id,
    value: r.visible,
  }));

  const onFeatureUpdate = useCallback(
    async (row: string, column: string, value: MatrixCell['value']) => {
      await api.patch('/admin/billing/plan-features', {
        planId: column,
        featureKey: row,
        isEnabled: typeof value === 'boolean' ? value : undefined,
      });
    },
    [],
  );

  const onCreditUpdate = useCallback(
    async (row: string, column: string, value: MatrixCell['value']) => {
      await api.patch('/admin/billing/plan-features', {
        planId: column,
        featureKey: row,
        creditCost: typeof value === 'number' ? value : null,
      });
    },
    [],
  );

  const onPageUpdate = useCallback(
    async (row: string, column: string, value: MatrixCell['value']) => {
      await api.patch('/admin/billing/plan-pages', {
        planId: column,
        pageKey: row,
        accessLevel: value,
      });
    },
    [],
  );

  const onMenuUpdate = useCallback(
    async (row: string, column: string, value: MatrixCell['value']) => {
      await api.patch('/admin/billing/plan-menus', {
        planId: column,
        menuKey: row,
        visible: typeof value === 'boolean' ? value : true,
      });
    },
    [],
  );

  return (
    <div className="space-y-6 pb-4">
      {/* Compact header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10">
          <Grid3X3 className="h-4.5 w-4.5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Entitlement Matrix</h1>
          <p className="text-sm text-slate-500">
            Control features, pages, menus, and credit costs per plan
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

      {/* View selector */}
      <SegmentedControl
        options={VIEW_OPTIONS}
        value={view}
        onChange={(v) => setView(v as MatrixView)}
      />

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <ContentSkeleton
        name="features-matrix"
        loading={!data && !error}
        animate="shimmer"
        darkColor="rgba(255,255,255,0.06)"
        fixture={
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 h-72">
            <div className="mb-4 h-4 w-32 rounded bg-slate-800" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-4 w-40 rounded bg-slate-800" />
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-4 w-16 rounded bg-slate-800" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        }
      >
      {data && view === 'features' && (
        <EntityMatrix
          title="Plan × Feature"
          description="Toggle whether each feature is enabled on each plan."
          columns={columns}
          rows={featureRows}
          cells={featureCells}
          valueKind="boolean"
          onUpdate={onFeatureUpdate}
        />
      )}
      {data && view === 'credits' && (
        <EntityMatrix
          title="Plan × Credit cost"
          description="Override the default credit cost for each feature per plan. Leave blank for the catalog default."
          columns={columns}
          rows={featureRows}
          cells={creditCells}
          valueKind="credit_cost"
          onUpdate={onCreditUpdate}
        />
      )}
      {data && view === 'pages' && (
        <EntityMatrix
          title="Plan × Page access"
          description="Set the access level for each route per plan. 'locked' shows the paywall screen, 'preview' allows read-only view."
          columns={columns}
          rows={pageRows}
          cells={pageCells}
          valueKind="access_level"
          onUpdate={onPageUpdate}
        />
      )}
      {data && view === 'menus' && (
        <EntityMatrix
          title="Plan × Menu visibility"
          description="Hide or show each sidebar menu entry per plan."
          columns={columns}
          rows={menuRows}
          cells={menuCells}
          valueKind="boolean"
          onUpdate={onMenuUpdate}
        />
      )}
      </ContentSkeleton>
    </div>
  );
}
