"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Link2,
  History,
  CheckCircle2,
  Flag,
  Loader2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Calendar,
  Hash,
  Eye,
} from "lucide-react";
import type {
  WikiPageWithLinks,
  WikiPageStatus,
  WikiLinkType,
} from "@shared/types/domain/wiki";

// ============================================
// TYPES
// ============================================

interface WikiPageDetailProps {
  page: WikiPageWithLinks | null;
  onOpenPage: (slug: string) => void;
  onFlag: (slug: string, reason: string) => Promise<void>;
  onVerify: (slug: string) => Promise<void>;
}

type TabId = "content" | "links" | "history";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ============================================
// CONSTANTS
// ============================================

const TABS: TabDef[] = [
  { id: "content", label: "Content", icon: FileText },
  { id: "links", label: "Links", icon: Link2 },
  { id: "history", label: "History", icon: History },
];

const STATUS_STYLES: Record<WikiPageStatus, { text: string; bg: string; border: string }> = {
  active: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  stale: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  contradicted: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  archived: {
    text: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
  },
  draft: {
    text: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-600/30",
  },
};

const LINK_TYPE_LABELS: Record<WikiLinkType, string> = {
  reference: "Reference",
  contradicts: "Contradicts",
  supports: "Supports",
  supersedes: "Supersedes",
  derived_from: "Derived from",
  see_also: "See also",
};

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Preprocess body text, converting [[slug]] wiki-link syntax into
 * clickable markdown links with a `#wiki:` anchor scheme.
 */
function preprocessWikiLinks(body: string): string {
  return body.replace(
    /\[\[([a-z0-9-]+)\]\]/g,
    (_match, slug: string) => {
      const title = slug.replace(/-/g, " ");
      return `[📖 ${title}](#wiki:${slug})`;
    },
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatusBadge({ status }: { status: WikiPageStatus }) {
  const styles = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${styles.text} ${styles.bg} ${styles.border}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const gradient =
    confidence < 0.3
      ? "from-red-500 to-red-400"
      : confidence < 0.7
        ? "from-amber-500 to-amber-400"
        : "from-indigo-500 to-indigo-400";

  const textColor =
    confidence < 0.3
      ? "text-red-400"
      : confidence < 0.7
        ? "text-amber-400"
        : "text-indigo-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden min-w-[40px]">
        <div
          className={`h-1 rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium ${textColor} tabular-nums`}>
        {pct}%
      </span>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function WikiPageDetail({
  page,
  onOpenPage,
  onFlag,
  onVerify,
}: WikiPageDetailProps) {
  const [activeTab, setActiveTab] = useState<TabId>("content");
  const [verifying, setVerifying] = useState(false);
  const [flagging, setFlagging] = useState(false);

  // Preprocess wiki-link syntax in the body
  const processedBody = useMemo(() => {
    if (!page?.body) return "";
    return preprocessWikiLinks(page.body);
  }, [page?.body]);

  // Handle clicks on #wiki: links inside the markdown content
  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (href?.startsWith("#wiki:")) {
        e.preventDefault();
        const slug = href.slice("#wiki:".length);
        onOpenPage(slug);
      }
    },
    [onOpenPage],
  );

  const handleVerify = useCallback(async () => {
    if (!page || verifying) return;
    setVerifying(true);
    try {
      await onVerify(page.slug);
    } finally {
      setVerifying(false);
    }
  }, [page, verifying, onVerify]);

  const handleFlag = useCallback(async () => {
    if (!page || flagging) return;
    setFlagging(true);
    try {
      await onFlag(page.slug, "User flagged from wiki browser");
    } finally {
      setFlagging(false);
    }
  }, [page, flagging, onFlag]);

  // Loading state
  if (!page) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
      </div>
    );
  }

  const outboundCount = page.outboundLinks.length;
  const inboundCount = page.inboundLinks.length;
  const totalLinks = outboundCount + inboundCount;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full"
    >
      {/* ---- Header ---- */}
      <div className="px-4 pt-4 pb-3 space-y-3 border-b border-white/[0.06]">
        {/* Status + Category + Version */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={page.status} />
          <span className="text-[10px] font-medium text-slate-500 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            {page.category}
          </span>
          <span className="text-[10px] text-slate-600 ml-auto tabular-nums">
            v{page.version}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-base font-semibold text-white leading-snug">
          {page.title}
        </h2>

        {/* Summary */}
        <p className="text-xs text-slate-400 leading-relaxed">
          {page.summary}
        </p>

        {/* Confidence bar */}
        <ConfidenceBar confidence={page.confidence} />

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {page.evidenceCount} evidence
          </span>
          <span className="inline-flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {page.wordCount} words
          </span>
        </div>
      </div>

      {/* ---- Tab bar ---- */}
      <div
        className="flex border-b border-white/[0.06]"
        role="tablist"
        aria-label="Wiki page sections"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          const count = tab.id === "links" ? totalLinks : undefined;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? "text-indigo-400 bg-indigo-500/10 border-b-2 border-indigo-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className="text-[9px] tabular-nums opacity-70">
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---- Tab panels ---- */}
      <div className="flex-1 overflow-y-auto">
        {/* Content tab */}
        {activeTab === "content" && (
          <div
            id="tabpanel-content"
            role="tabpanel"
            aria-labelledby="tab-content"
            className="p-4"
            onClick={handleContentClick}
          >
            <div className="coach-prose prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {processedBody}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Links tab */}
        {activeTab === "links" && (
          <div
            id="tabpanel-links"
            role="tabpanel"
            aria-labelledby="tab-links"
            className="p-4 space-y-4"
          >
            {totalLinks === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Link2 className="w-5 h-5 mb-2 opacity-40" />
                <span className="text-xs">No links yet</span>
              </div>
            ) : (
              <>
                {/* Outbound links */}
                {outboundCount > 0 && (
                  <div>
                    <h3 className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3" />
                      Outbound ({outboundCount})
                    </h3>
                    <div className="space-y-1.5">
                      {page.outboundLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() =>
                            onOpenPage(link.targetSlug ?? link.targetPageId)
                          }
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-left group"
                        >
                          <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-xs text-slate-200 truncate flex-1 group-hover:text-white transition-colors">
                            {link.targetTitle ?? link.targetSlug ?? "Untitled"}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {LINK_TYPE_LABELS[link.linkType]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inbound links */}
                {inboundCount > 0 && (
                  <div>
                    <h3 className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                      <ArrowLeft className="w-3 h-3" />
                      Inbound ({inboundCount})
                    </h3>
                    <div className="space-y-1.5">
                      {page.inboundLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() =>
                            onOpenPage(link.sourceSlug ?? link.sourcePageId)
                          }
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-left group"
                        >
                          <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-xs text-slate-200 truncate flex-1 group-hover:text-white transition-colors">
                            {link.sourceTitle ?? link.sourceSlug ?? "Untitled"}
                          </span>
                          <ArrowLeft className="w-3 h-3 text-slate-600 shrink-0" />
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {LINK_TYPE_LABELS[link.linkType]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <div
            id="tabpanel-history"
            role="tabpanel"
            aria-labelledby="tab-history"
            className="p-4 space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Calendar className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-slate-300">
                    Last updated
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(page.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <BookOpen className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-slate-300">
                    Created
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDate(page.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---- Action buttons ---- */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]">
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          Looks right
        </button>
        <button
          onClick={handleFlag}
          disabled={flagging}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {flagging ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Flag className="w-3.5 h-3.5" />
          )}
          Flag issue
        </button>
      </div>
    </motion.div>
  );
}
