"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Target,
  ClipboardList,
  Apple,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  StickyNote,
  Pin,
  Archive,
  ChevronRight,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api-client";

interface UserFile {
  id: string;
  fileType: string;
  title: string;
  content: Record<string, unknown>;
  source: "ai" | "user";
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

const FILE_TYPE_CONFIG: Record<string, { icon: LucideIcon; label: string; accent: string }> = {
  goal: { icon: Target, label: "Goals", accent: "text-amber-400" },
  training_plan: { icon: ClipboardList, label: "Training Plans", accent: "text-blue-400" },
  nutrition_targets: { icon: Apple, label: "Nutrition Targets", accent: "text-emerald-400" },
  constraint: { icon: ShieldAlert, label: "Constraints", accent: "text-red-400" },
  artifact: { icon: Sparkles, label: "Artifacts", accent: "text-purple-400" },
  pattern: { icon: TrendingUp, label: "Patterns", accent: "text-cyan-400" },
  note: { icon: StickyNote, label: "Notes", accent: "text-slate-400" },
};

function getFileConfig(type: string) {
  return FILE_TYPE_CONFIG[type] || { icon: FileText, label: type, accent: "text-slate-400" };
}

interface FilesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilesPanel({ isOpen, onClose }: FilesPanelProps) {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<{ files: UserFile[] }>("/rag-chat/files");
      if (response.success && response.data?.files) {
        setFiles(response.data.files);
      }
    } catch (err) {
      console.error("[FilesPanel] Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchFiles();
  }, [isOpen, fetchFiles]);

  const handleArchive = async (fileId: string) => {
    try {
      await api.patch(`/rag-chat/files/${fileId}/archive`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("[FilesPanel] Failed to archive file:", err);
    }
  };

  const handleTogglePin = async (file: UserFile) => {
    try {
      await api.patch(`/rag-chat/files/${file.id}`, { isPinned: !file.isPinned });
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, isPinned: !f.isPinned } : f)),
      );
    } catch (err) {
      console.error("[FilesPanel] Failed to toggle pin:", err);
    }
  };

  if (!isOpen) return null;

  const grouped = new Map<string, UserFile[]>();
  for (const f of files) {
    const group = grouped.get(f.fileType) || [];
    group.push(f);
    grouped.set(f.fileType, group);
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 w-80 sm:w-96 bg-[#060118]/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Your Files</span>
          <span className="text-xs text-slate-500">({files.length})</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No files yet</p>
            <p className="text-xs text-slate-600 mt-1">
              Chat with your coach to create goals, plans, and notes that persist across conversations.
            </p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([type, items]) => {
            const config = getFileConfig(type);
            const Icon = config.icon;
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-3.5 h-3.5 ${config.accent}`} />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {config.label}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      isExpanded={expandedId === file.id}
                      onToggle={() => setExpandedId(expandedId === file.id ? null : file.id)}
                      onArchive={() => handleArchive(file.id)}
                      onTogglePin={() => handleTogglePin(file)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

function FileCard({
  file,
  isExpanded,
  onToggle,
  onArchive,
  onTogglePin,
}: {
  file: UserFile;
  isExpanded: boolean;
  onToggle: () => void;
  onArchive: () => void;
  onTogglePin: () => void;
}) {
  const summary =
    (file.content.summary as string) ||
    (file.content.description as string) ||
    "";

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
      >
        <ChevronRight
          className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isExpanded ? "rotate-90" : ""}`}
        />
        <span className="flex-1 text-sm text-slate-200 truncate">{file.title}</span>
        {file.isPinned && <Pin className="w-3 h-3 text-amber-400" />}
        {file.source === "ai" && (
          <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">AI</span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {summary && (
                <p className="text-xs text-slate-400 leading-relaxed">{String(summary).slice(0, 300)}</p>
              )}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onTogglePin}
                  className="text-[10px] text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
                >
                  <Pin className="w-2.5 h-2.5" />
                  {file.isPinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={onArchive}
                  className="text-[10px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
                >
                  <Archive className="w-2.5 h-2.5" />
                  Archive
                </button>
                <span className="text-[10px] text-slate-600 ml-auto">
                  {new Date(file.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
