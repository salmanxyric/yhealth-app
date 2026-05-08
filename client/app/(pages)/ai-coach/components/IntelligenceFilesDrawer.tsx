"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Brain,
  StickyNote,
  Sparkles,
  ClipboardList,
  Shield,
  FileText,
  X,
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { MemoryCard } from "./MemoryCard";
import { CoreProfilePanel } from "./CoreProfilePanel";
import { WikiPageCard } from "./WikiPageCard";
import { WikiPageDetail } from "./WikiPageDetail";
import type { useIntelligenceFiles } from "../hooks/useIntelligenceFiles";
import type {
  IntelligenceFolder,
  FolderSummary,
} from "@shared/types/domain/intelligence-files";

const FOLDER_CONFIG: Record<IntelligenceFolder, { icon: LucideIcon; accent: string }> = {
  memories: { icon: Brain, accent: "text-purple-400" },
  wiki: { icon: BookOpen, accent: "text-indigo-400" },
  notes: { icon: StickyNote, accent: "text-slate-400" },
  artifacts: { icon: Sparkles, accent: "text-cyan-400" },
  plans: { icon: ClipboardList, accent: "text-blue-400" },
  core: { icon: Shield, accent: "text-emerald-400" },
  logs: { icon: FileText, accent: "text-amber-400" },
};

type IntelligenceFilesHook = ReturnType<typeof useIntelligenceFiles>;

interface IntelligenceFilesDrawerProps {
  hook: IntelligenceFilesHook;
}

export function IntelligenceFilesDrawer({ hook }: IntelligenceFilesDrawerProps) {
  if (!hook.drawer.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intelligence-drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-[480px] max-w-full bg-[#060118]/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          {hook.drawer.level !== "folders" && (
            <button
              onClick={hook.navigateBack}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white">
              {hook.drawer.level === "folders"
                ? "Intelligence Files"
                : hook.drawer.activeFolder
                  ? FOLDER_CONFIG[hook.drawer.activeFolder]
                    ? hook.drawer.activeFolder.charAt(0).toUpperCase() + hook.drawer.activeFolder.slice(1)
                    : "Files"
                  : "Files"}
            </h2>
          </div>
          <button
            onClick={hook.closeDrawer}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Search (memories & wiki list) */}
        {hook.drawer.level === "list" && (hook.drawer.activeFolder === "memories" || hook.drawer.activeFolder === "wiki") && (
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={hook.drawer.activeFolder === "wiki" ? hook.wikiSearchQuery : hook.searchQuery}
                onChange={(e) => hook.drawer.activeFolder === "wiki" ? hook.handleWikiSearch(e.target.value) : hook.handleSearch(e.target.value)}
                placeholder={hook.drawer.activeFolder === "wiki" ? "Search wiki pages..." : "Search memories..."}
                className="w-full text-xs text-white bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 outline-none focus:border-white/20 placeholder:text-slate-600 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {hook.loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : hook.error ? (
            <ErrorState message={hook.error} onRetry={hook.openDrawer} />
          ) : hook.drawer.level === "folders" ? (
            hook.folders.length === 0 ? (
              <AnimatedEmptyState />
            ) : (
              <FolderGrid folders={hook.folders} onSelect={hook.navigateToFolder} />
            )
          ) : hook.drawer.level === "detail" && hook.drawer.activeFolder === "wiki" ? (
            <WikiPageDetail
              page={hook.selectedWikiPage}
              onOpenPage={hook.selectWikiPage}
              onFlag={hook.handleFlagWikiPage}
              onVerify={hook.handleVerifyWikiPage}
            />
          ) : hook.drawer.level === "list" ? (
            <FolderContent hook={hook} />
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function FolderGrid({
  folders,
  onSelect,
}: {
  folders: FolderSummary[];
  onSelect: (id: IntelligenceFolder) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {folders.map((folder, i) => {
        const config = FOLDER_CONFIG[folder.id] || FOLDER_CONFIG.logs;
        const Icon = config.icon;
        return (
          <motion.button
            key={folder.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(folder.id)}
            className="flex flex-col items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all text-left group"
          >
            <Icon className={`w-5 h-5 ${config.accent} group-hover:scale-110 transition-transform`} />
            <div>
              <span className="text-sm font-medium text-slate-200 block">{folder.label}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {folder.itemCount} item{folder.itemCount !== 1 ? "s" : ""}
                {folder.lastModified && (
                  <> · {new Date(folder.lastModified).toLocaleDateString()}</>
                )}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function FolderContent({ hook }: { hook: IntelligenceFilesHook }) {
  const folder = hook.drawer.activeFolder;

  switch (folder) {
    case "memories":
      return (
        <div className="space-y-3">
          {hook.memories.length === 0 ? (
            <EmptyState icon={Brain} message="No memories yet" sub="Chat with your coach to build up intelligence over time." />
          ) : (
            hook.memories.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                onClick={() => hook.selectItem(m.id)}
                onVerify={() => hook.handleVerifyMemory(m.id)}
                onReject={() => hook.handleRejectMemory(m.id)}
                onExpire={() => hook.handleExpireMemory(m.id)}
              />
            ))
          )}
        </div>
      );

    case "wiki":
      return (
        <div className="space-y-3">
          {hook.wikiStats && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-slate-400">
              <span>{hook.wikiStats.activePages} pages</span>
              <span className="text-white/20">·</span>
              <span>{hook.wikiStats.stalePages} stale</span>
              <span className="text-white/20">·</span>
              <span>{hook.wikiStats.contradictedPages} contradicted</span>
            </div>
          )}
          {hook.wikiPages.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              message="No wiki pages yet"
              sub="Your AI coach builds a personal health wiki from your conversations and data."
            />
          ) : (
            hook.wikiPages.map((page) => (
              <WikiPageCard
                key={page.id}
                page={page}
                onClick={() => hook.selectWikiPage(page.slug)}
              />
            ))
          )}
        </div>
      );

    case "core":
      return hook.coreProfile ? (
        <CoreProfilePanel profile={hook.coreProfile} />
      ) : (
        <EmptyState icon={Shield} message="No core profile data" sub="Your profile builds automatically from conversations and wearable data." />
      );

    case "artifacts":
      return (
        <div className="space-y-3">
          {hook.artifacts.length === 0 ? (
            <EmptyState icon={Sparkles} message="No artifacts yet" sub="Ask your coach for analysis to generate charts and reports." />
          ) : (
            hook.artifacts.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors cursor-pointer"
                onClick={() => hook.selectItem(a.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                    {a.artifactType}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-slate-200">{a.title}</h4>
                {a.insight && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.insight}</p>
                )}
                <span className="text-[10px] text-slate-600 mt-2 block">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </motion.div>
            ))
          )}
        </div>
      );

    case "plans":
      return (
        <div className="space-y-3">
          {hook.plans.length === 0 ? (
            <EmptyState icon={ClipboardList} message="No plans yet" sub="Ask your coach to create training, nutrition, or habit plans." />
          ) : (
            hook.plans.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors cursor-pointer"
                onClick={() => hook.selectItem(p.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    p.status === "active"
                      ? "text-emerald-400 bg-emerald-500/10"
                      : p.status === "draft"
                        ? "text-slate-400 bg-white/5"
                        : "text-amber-400 bg-amber-500/10"
                  }`}>
                    {p.status}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-slate-200">{p.title}</h4>
                {p.adherenceRate !== null && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-500">Adherence</span>
                    <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                        style={{ width: `${Math.round(p.adherenceRate * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-blue-400 tabular-nums">
                      {Math.round(p.adherenceRate * 100)}%
                    </span>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      );

    case "logs":
      return (
        <div className="space-y-2">
          {hook.logs.length === 0 ? (
            <EmptyState icon={FileText} message="No logs yet" sub="Log references are created as data flows through the system." />
          ) : (
            hook.logs.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-300 block truncate">
                    {l.summary || l.sourceTable}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {l.category} · {l.sourceDate}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      );

    case "notes":
      return (
        <EmptyState
          icon={StickyNote}
          message="Notes"
          sub="Notes are available in the Files panel. Use the existing files view to manage your notes."
        />
      );

    default:
      return null;
  }
}

function EmptyState({ icon: Icon, message, sub }: { icon: LucideIcon; message: string; sub: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-8 h-8 text-slate-600 mx-auto mb-3" />
      <p className="text-sm text-slate-400">{message}</p>
      <p className="text-xs text-slate-600 mt-1 max-w-[240px] mx-auto">{sub}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <p className="text-sm font-medium text-slate-300 mb-1">Something went wrong</p>
      <p className="text-xs text-slate-500 max-w-[280px] mx-auto mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors px-4 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/15"
      >
        Try again
      </button>
    </motion.div>
  );
}

function AnimatedEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-20"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-5"
      >
        <FolderOpen className="w-7 h-7 text-slate-500" />
      </motion.div>
      <p className="text-sm font-medium text-slate-400 mb-1">No intelligence files yet</p>
      <p className="text-xs text-slate-600 max-w-[260px] mx-auto leading-relaxed">
        Chat with your AI coach to start building memories, insights, and personalized plans.
      </p>
    </motion.div>
  );
}
