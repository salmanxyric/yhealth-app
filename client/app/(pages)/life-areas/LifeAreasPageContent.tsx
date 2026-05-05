'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Sparkles, LayoutGrid, Compass, Plug } from 'lucide-react';
import { DashboardPageSkeleton } from '@/components/loading';
import { useAuth } from '@/app/context/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { DashboardUnderlineTabs } from '@/app/(pages)/dashboard/components/DashboardUnderlineTabs';
import { useLifeAreas } from './hooks/use-life-areas';
import { LifeAreaGrid } from './components/LifeAreaGrid';
import { CreateLifeAreaModal } from './components/CreateLifeAreaModal';
import { EditLifeAreaModal } from './components/EditLifeAreaModal';
import { DeleteLifeAreaDialog } from './components/DeleteLifeAreaDialog';
import { LifeAreaDetailDrawer } from './components/LifeAreaDetailDrawer';
import { EmptyState } from './components/EmptyState';
import { LifeAreasOverviewTab } from './components/LifeAreasOverviewTab';
import { LifeAreasConnectionsTab } from './components/LifeAreasConnectionsTab';
import type { LifeArea } from './types';

type LifeAreasMainTab = 'overview' | 'areas' | 'connections';

export default function LifeAreasPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { areas, domains, summary, isLoading, error, create, update, archive, getDetail, refresh } = useLifeAreas();
  const [mainTab, setMainTab] = useState<LifeAreasMainTab>('overview');
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<LifeArea | null>(null);
  const [editing, setEditing] = useState<LifeArea | null>(null);
  const [deleting, setDeleting] = useState<LifeArea | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/signin?callbackUrl=/life-areas');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isLoading) {
    return <DashboardPageSkeleton activeTab="life-areas" variant="heroTabsGrid" />;
  }
  if (!isAuthenticated) return null;

  async function handleDelete(id: string) {
    await archive(id);
    if (selected?.id === id) setSelected(null);
  }

  async function handleEdit(id: string, patch: Partial<LifeArea>) {
    const updated = await update(id, patch);
    if (selected?.id === id) setSelected(updated);
    return updated;
  }

  return (
    <DashboardLayout activeTab="life-areas">
      <div className="min-h-screen overflow-x-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="mb-8 flex items-start justify-between gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-slate-300 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Universal self-improvement
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                Your Life Areas
              </h1>
              <p className="mt-2 text-slate-400 max-w-xl">
                Everything you&rsquo;re working on, in one place. The coach listens, schedules, follows up —
                for anything you want to improve.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white
                         bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500
                         shadow-lg shadow-blue-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              New Area
            </button>
          </motion.div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <DashboardUnderlineTabs
            layoutId="lifeAreasMainTabs"
            className="mb-8 -mx-1"
            tabs={[
              { id: 'overview', label: 'Overview', icon: LayoutGrid },
              { id: 'areas', label: 'My areas', icon: Compass },
              { id: 'connections', label: 'Connections', icon: Plug },
            ]}
            activeId={mainTab}
            onTabChange={(id) => setMainTab(id as LifeAreasMainTab)}
          />

          {mainTab === 'overview' && (
            <LifeAreasOverviewTab summary={summary} domains={domains} />
          )}

          {mainTab === 'areas' && (
            areas.length === 0 ? (
              <EmptyState onCreate={() => setCreateOpen(true)} />
            ) : (
              <LifeAreaGrid
                areas={areas}
                onSelect={setSelected}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            )
          )}

          {mainTab === 'connections' && <LifeAreasConnectionsTab />}
        </div>

        {/* Create Modal */}
        <CreateLifeAreaModal
          open={createOpen}
          domains={domains}
          onClose={() => setCreateOpen(false)}
          onCreate={async (input) => {
            await create(input);
            setCreateOpen(false);
          }}
        />

        {/* Edit Modal */}
        <EditLifeAreaModal
          open={!!editing}
          area={editing}
          domains={domains}
          onClose={() => setEditing(null)}
          onSave={handleEdit}
        />

        {/* Delete Confirmation */}
        <DeleteLifeAreaDialog
          open={!!deleting}
          area={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
        />

        {/* Detail Drawer */}
        <LifeAreaDetailDrawer
          area={selected}
          onClose={() => setSelected(null)}
          onUpdate={update}
          onArchive={async (id) => { await archive(id); setSelected(null); }}
          getDetail={getDetail}
          refresh={refresh}
        />
      </div>
    </DashboardLayout>
  );
}
