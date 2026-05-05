"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Shield,
  Plus,
  AlertCircle,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  TrendingUp,
  Users,
  Trash2,
  CheckSquare,
  X,
  Loader2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { DashboardUnderlineTabs } from "../../DashboardUnderlineTabs";

import { ContractCard } from "./ContractCard";
import { CreateContractModal } from "./CreateContractModal";
import { SocialAccountabilitySection } from "./SocialAccountabilitySection";
import type {
  Contract,
  ContractStats,
  ContractSuggestion,
  ContractsResponse,
} from "./types";

/* ── Skeleton ── */
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/[0.03] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-[140px]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[200px]" />)}
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({
  icon: Icon,
  value,
  label,
  color,
  index,
}: {
  icon: typeof Shield;
  value: string | number;
  label: string;
  color: string;
  index: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 + 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="p-4 sm:p-5 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] transition-colors"
      style={{ background: `linear-gradient(135deg, ${color}06, transparent 60%)` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/[0.06]"
          style={{ background: `${color}12` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none mb-1">
        {value}
      </p>
      <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}

/* ── Main Tab ── */
export function AccountabilityTab() {
  const prefersReducedMotion = useReducedMotion();
  const [activeSubTab, setActiveSubTab] = useState<"contracts" | "social">("contracts");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [suggestions, setSuggestions] = useState<ContractSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [_selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Selection & delete
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(contracts.map(c => c.id)));
  }, [contracts]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filter !== "all") params.status = filter;

      const [contractsResult, statsResult, suggestionsResult] = await Promise.allSettled([
        api.get<ContractsResponse>("/contracts", { params }),
        api.get<{ stats: ContractStats }>("/contracts/stats"),
        api.get<{ suggestions: ContractSuggestion[] }>("/contracts/suggestions"),
      ]);

      if (contractsResult.status === "fulfilled" && contractsResult.value.success && contractsResult.value.data) {
        setContracts(contractsResult.value.data.contracts || []);
      }
      if (statsResult.status === "fulfilled" && statsResult.value.success && statsResult.value.data) {
        setStats(statsResult.value.data.stats);
      }
      if (suggestionsResult.status === "fulfilled" && suggestionsResult.value.success && suggestionsResult.value.data) {
        setSuggestions(suggestionsResult.value.data.suggestions || []);
      }
      if (contractsResult.status === "rejected" && statsResult.status === "rejected") {
        throw contractsResult.reason;
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load contracts");
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const handleEdit = useCallback((contract: Contract) => {
    setEditingContract(contract);
    setShowCreate(true);
  }, []);

  const handleDeleteSingle = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/contracts/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData();
    } catch {
      // handled silently
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchData]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await api.post("/contracts/bulk-delete", { ids: Array.from(selectedIds) });
      setShowBulkDeleteConfirm(false);
      exitSelectionMode();
      fetchData();
    } catch {
      // handled silently
    } finally {
      setDeleting(false);
    }
  }, [selectedIds, exitSelectionMode, fetchData]);

  const allSelected = useMemo(
    () => contracts.length > 0 && selectedIds.size === contracts.length,
    [contracts, selectedIds]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && contracts.length === 0) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-rose-400" />
          </div>
          <p className="text-zinc-300 font-medium mb-1">Something went wrong</p>
          <p className="text-sm text-zinc-500 mb-5">{error}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08]
              text-white rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ─── Top Level Tab Switch ── */}
      <div>
        <DashboardUnderlineTabs
          layoutId="accountabilitySubTabUnderline"
          activeId={activeSubTab}
          onTabChange={(id) => setActiveSubTab(id as "contracts" | "social")}
          tabs={[
            { id: "contracts", label: "Contracts", icon: Shield },
            { id: "social", label: "Social Accountability", icon: Users },
          ]}
        />
      </div>

      {/* ─── Social Accountability Sub-Tab ── */}
      {activeSubTab === "social" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <SocialAccountabilitySection
            onNavigateToSettings={() => {
              window.location.href = "/settings?section=accountability";
            }}
          />
        </motion.div>
      )}

      {/* ─── Contracts Sub-Tab ── */}
      {activeSubTab === "contracts" && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5 sm:space-y-6">

      {/* ─── Header + Actions ── */}
      <AnimatePresence mode="wait">
        {selectionMode ? (
          <motion.div
            key="selection-bar"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between px-4 py-3 rounded-2xl border border-emerald-500/15"
            style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.04), transparent 60%)" }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={exitSelectionMode}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
              <span className="text-[13px] font-medium text-zinc-300">
                {selectedIds.size} selected
              </span>
              <button
                onClick={allSelected ? deselectAll : selectAll}
                className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
            <button
              onClick={() => selectedIds.size > 0 && setShowBulkDeleteConfirm(true)}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold
                bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20
                disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedIds.size})
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Accountability Contracts</h2>
                <p className="text-[12px] text-zinc-500">Self-imposed commitments with real consequences</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {contracts.length > 0 && (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium
                    text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]
                    transition-all cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Select</span>
                </button>
              )}
              <button
                onClick={() => { setEditingContract(null); setShowCreate(true); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold
                  bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20
                  transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Contract</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Stats Row ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Shield} value={stats.activeCount} label="Active" color="#34d399" index={0} />
          <StatCard icon={CheckCircle2} value={`${stats.overallSuccessRate}%`} label="Success Rate" color="#38bdf8" index={1} />
          <StatCard icon={XCircle} value={stats.totalViolations} label="Violations" color="#fb7185" index={2} />
          <StatCard icon={BarChart3} value={stats.completedCount} label="Completed" color="#a78bfa" index={3} />
        </div>
      )}

      {/* ─── AI Suggestions ── */}
      {suggestions.length > 0 && (
        <div
          className="rounded-2xl border border-indigo-500/10 p-5"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.04), rgba(139,92,246,0.03))" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-[12px] font-semibold text-indigo-300 uppercase tracking-wider">
              AI Suggestions
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {suggestions.slice(0, 4).map((s, i) => (
              <motion.button
                key={s.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]
                  hover:bg-white/[0.05] hover:border-indigo-500/20 transition-all cursor-pointer text-left group"
                onClick={() => {
                  // Pre-fill contract from suggestion
                  setShowCreate(true);
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-white truncate">{s.title}</p>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">{s.reason}</p>
                </div>
                <Plus className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Filters ── */}
      <div>
        <DashboardUnderlineTabs
          layoutId="contractFilterUnderline"
          activeId={filter}
          onTabChange={setFilter}
          tabs={[
            { id: "all", label: "All" },
            { id: "active", label: "Active", icon: Shield },
            { id: "at_risk", label: "At Risk", icon: AlertCircle },
            { id: "violated", label: "Violated", icon: XCircle },
            { id: "draft", label: "Drafts", icon: FileText },
            { id: "completed", label: "Completed", icon: CheckCircle2 },
          ]}
        />
      </div>

      {/* ─── Contract Cards Grid ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {contracts.map((contract, index) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              index={index}
              onClick={setSelectedContract}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              selectable={selectionMode}
              selected={selectedIds.has(contract.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Empty State ── */}
      {contracts.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
            <Shield className="w-9 h-9 text-zinc-700" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-400 mb-1.5">No contracts yet</h3>
          <p className="text-[13px] text-zinc-600 max-w-[280px] mx-auto mb-6">
            Create your first accountability contract to boost your discipline
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold
              bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20
              transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Contract
          </button>
        </div>
      )}

      {/* ─── Create / Edit Modal ── */}
      <CreateContractModal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setEditingContract(null); }}
        onSuccess={fetchData}
        editContract={editingContract}
      />

      {/* ─── Single Delete Confirmation ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(180deg, #0d1117 0%, #0a0e13 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white text-center mb-1">Delete Contract</h3>
                <p className="text-[13px] text-zinc-500 text-center mb-1">
                  Are you sure you want to delete
                </p>
                <p className="text-[13px] text-white font-medium text-center mb-5">
                  &ldquo;{deleteTarget.title}&rdquo;?
                </p>
                <p className="text-[11px] text-zinc-600 text-center mb-5">
                  This action cannot be undone. All associated violations and checks will be removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-medium text-zinc-400 hover:text-white
                      bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]
                      transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSingle}
                    disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold
                      bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20
                      transition-all cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bulk Delete Confirmation ── */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => !deleting && setShowBulkDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(180deg, #0d1117 0%, #0a0e13 100%)", border: "1px solid rgba(255,255,255,0.06)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white text-center mb-1">Delete {selectedIds.size} Contracts</h3>
                <p className="text-[13px] text-zinc-500 text-center mb-5">
                  Are you sure you want to delete {selectedIds.size} selected contract{selectedIds.size > 1 ? "s" : ""}?
                  This action cannot be undone.
                </p>
                <div className="max-h-[140px] overflow-y-auto space-y-1 mb-5 px-1">
                  {contracts.filter(c => selectedIds.has(c.id)).map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-[12px] text-zinc-400 px-3 py-1.5 rounded-lg bg-white/[0.02]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400/60 flex-shrink-0" />
                      <span className="truncate">{c.title}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-medium text-zinc-400 hover:text-white
                      bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]
                      transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold
                      bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20
                      transition-all cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete All
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </motion.div>)}
    </div>
  );
}
