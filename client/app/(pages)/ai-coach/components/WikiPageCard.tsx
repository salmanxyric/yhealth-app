"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import type { WikiPage, WikiPageStatus } from "@shared/types/domain/wiki";

// ---------------------------------------------------------------------------
// Status badge styling
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  WikiPageStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  active: {
    label: "Active",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  stale: {
    label: "Stale",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  contradicted: {
    label: "Contradicted",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  archived: {
    label: "Archived",
    color: "text-slate-400",
    bg: "bg-white/5",
    border: "border-white/10",
  },
  draft: {
    label: "Draft",
    color: "text-slate-400",
    bg: "bg-white/5",
    border: "border-white/10",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface WikiPageCardProps {
  page: WikiPage;
  onClick: () => void;
}

export function WikiPageCard({ page, onClick }: WikiPageCardProps) {
  const status = STATUS_CONFIG[page.status];
  const confidencePct = Math.round(page.confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 hover:bg-white/[0.05] transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Header: icon + status badge + version */}
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />

        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${status.color} ${status.bg} ${status.border}`}
        >
          {status.label}
        </span>

        <span className="ml-auto text-[10px] text-slate-500 tabular-nums">
          v{page.version}
        </span>
      </div>

      {/* Title + summary */}
      <h4 className="text-sm font-medium text-slate-200 truncate">
        {page.title}
      </h4>
      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
        {page.summary}
      </p>

      {/* Confidence bar */}
      <div className="flex items-center gap-2 mt-3">
        <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden min-w-[40px]">
          <div
            className="h-1 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
            style={{ width: `${confidencePct}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-indigo-400 tabular-nums">
          {confidencePct}%
        </span>
      </div>

      {/* Footer: category + evidence */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.04]">
        <span className="text-[10px] font-medium text-slate-500 px-2 py-0.5 rounded-full bg-white/[0.04]">
          {page.category}
        </span>
        <span className="text-[10px] text-slate-600">
          {page.evidenceCount} source{page.evidenceCount !== 1 ? "s" : ""}
        </span>
        <span className="text-[10px] text-slate-600 ml-auto">
          {new Date(page.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
}
