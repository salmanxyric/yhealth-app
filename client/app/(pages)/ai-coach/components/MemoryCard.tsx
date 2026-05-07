"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Pencil,
  Brain,
  Heart,
  Lightbulb,
  MessageSquare,
  GitBranch,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { IntelligenceMemory, MemoryType } from "@shared/types/domain/intelligence-files";

const MEMORY_TYPE_CONFIG: Record<MemoryType, { icon: LucideIcon; label: string; color: string; bg: string }> = {
  pattern: { icon: Brain, label: "Pattern", color: "text-purple-400", bg: "bg-purple-500/10" },
  preference: { icon: Heart, label: "Preference", color: "text-pink-400", bg: "bg-pink-500/10" },
  context: { icon: Lightbulb, label: "Context", color: "text-amber-400", bg: "bg-amber-500/10" },
  feedback: { icon: MessageSquare, label: "Feedback", color: "text-blue-400", bg: "bg-blue-500/10" },
  relationship: { icon: GitBranch, label: "Relationship", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  learned_rule: { icon: BookOpen, label: "Learned Rule", color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

interface MemoryCardProps {
  memory: IntelligenceMemory;
  onClick?: () => void;
  onVerify?: () => void;
  onReject?: () => void;
  onExpire?: () => void;
  onEdit?: () => void;
}

export function MemoryCard({ memory, onClick, onVerify, onReject, onExpire, onEdit }: MemoryCardProps) {
  const typeConfig = MEMORY_TYPE_CONFIG[memory.memoryType] || MEMORY_TYPE_CONFIG.context;
  const TypeIcon = typeConfig.icon;
  const daysSinceAccess = Math.floor(
    (Date.now() - new Date(memory.lastAccessedAt).getTime()) / 86400000,
  );
  const isStale = daysSinceAccess > 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-200 truncate">{memory.title}</h4>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {memory.description}
          </p>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {/* Type badge */}
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${typeConfig.color} ${typeConfig.bg}`}>
          <TypeIcon className="w-2.5 h-2.5" />
          {typeConfig.label}
        </span>

        {/* Source badge */}
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            memory.source === "user"
              ? "text-emerald-400 bg-emerald-500/10"
              : memory.source === "wearable"
                ? "text-orange-400 bg-orange-500/10"
                : "text-blue-400 bg-blue-500/10"
          }`}
        >
          {memory.source === "user" ? "You" : memory.source === "wearable" ? "Wearable" : "AI"}
        </span>

        {/* Evidence count */}
        <span className="text-[10px] text-slate-500">
          {memory.evidenceCount} data point{memory.evidenceCount !== 1 ? "s" : ""}
        </span>

        {/* Usage frequency */}
        {memory.accessCount > 0 && (
          <span className="text-[10px] text-slate-600">
            Used {memory.accessCount}×
          </span>
        )}

        {/* Stale indicator */}
        {isStale && (
          <span className="relative flex h-2 w-2 ml-auto">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
        )}

        {/* Verified badge */}
        {memory.status === "verified" && (
          <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />
        )}
      </div>

      {/* Confidence bar */}
      <ConfidenceBadge confidence={memory.confidence} />

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/[0.04]">
        {onVerify && memory.status !== "verified" && (
          <button
            onClick={(e) => { e.stopPropagation(); onVerify(); }}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-emerald-400 px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            <CheckCircle2 className="w-3 h-3" />
            Verify
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-400 px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        )}
        {onReject && (
          <button
            onClick={(e) => { e.stopPropagation(); onReject(); }}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-red-400 px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            <XCircle className="w-3 h-3" />
            Reject
          </button>
        )}
        {onExpire && (
          <button
            onClick={(e) => { e.stopPropagation(); onExpire(); }}
            className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-400 px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            <Clock className="w-3 h-3" />
            Expire
          </button>
        )}
        <span className="text-[10px] text-slate-600 ml-auto">
          {new Date(memory.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
}
