"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils,
  ClipboardList,
  ChefHat,
  Scale,
  Dumbbell,
  Target,
  BookOpen,
  Droplets,
  Clock,
  Undo2,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  BarChart3,
  GitCompare,
  CalendarRange,
  CalendarCheck2,
  Pencil,
  Repeat2,
  FileText,
  Music,
  Brain,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { ToolTimelineEvent } from "../hooks/useAICoach";

const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  "clipboard-list": ClipboardList,
  "chef-hat": ChefHat,
  scale: Scale,
  dumbbell: Dumbbell,
  target: Target,
  "book-open": BookOpen,
  droplets: Droplets,
  clock: Clock,
  "bar-chart-3": BarChart3,
  "git-compare": GitCompare,
  "calendar-range": CalendarRange,
  "calendar-check": CalendarCheck2,
  pencil: Pencil,
  "repeat-2": Repeat2,
  "file-text": FileText,
  music: Music,
  brain: Brain,
  "wallet-cards": WalletCards,
};

function getIcon(iconName?: string) {
  if (!iconName) return Utensils;
  return ICON_MAP[iconName] || Utensils;
}

function formatTimelineDelta(delta?: string) {
  if (!delta) return "";
  const trimmed = delta.replace(/\s+/g, " ").trim();
  if (!trimmed || /^[{\[]/.test(trimmed)) return "";
  return trimmed.length > 88 ? `${trimmed.slice(0, 85)}...` : trimmed;
}

interface AgentTimelineProps {
  events: ToolTimelineEvent[];
  thinkingLabel?: string;
  isThinking?: boolean;
  durationMs?: number;
  onUndo?: (operationId: string) => void;
}

export function AgentTimeline({
  events,
  thinkingLabel,
  isThinking,
  durationMs,
  onUndo,
}: AgentTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (events.length === 0 && !isThinking) return null;

  const completedCount = events.filter((e) => e.status === "completed").length;
  const failedCount = events.filter((e) => e.status === "failed").length;
  const label = thinkingLabel || "Processing...";
  const durationStr = durationMs ? `${(durationMs / 1000).toFixed(1)}s` : null;

  return (
    <div className="mb-2 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
      >
        {isThinking ? (
          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
        ) : failedCount > 0 ? (
          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        )}

        <span className="flex-1 text-xs text-slate-400 italic truncate">
          {isThinking ? label : `${label} — ${completedCount} step${completedCount !== 1 ? "s" : ""} completed`}
        </span>

        {durationStr && !isThinking && (
          <span className="text-[10px] text-slate-500 font-mono shrink-0">
            {durationStr}
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ${
            isExpanded ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {/* Expandable tool steps */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-1">
              <AnimatePresence mode="popLayout">
                {events.map((event) => (
                  <ToolResultRow
                    key={event.operationId}
                    event={event}
                    onUndo={onUndo}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ThinkingIndicator({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit"
    >
      <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
      <span className="text-xs text-slate-400 italic">{label}</span>
    </motion.div>
  );
}

function ToolResultRow({
  event,
  onUndo,
}: {
  event: ToolTimelineEvent;
  onUndo?: (operationId: string) => void;
}) {
  const Icon = getIcon(event.icon);
  const isUndone = event.status === "undone";
  const isFailed = event.status === "failed";
  const isPending = event.status === "pending";
  const displayDelta = formatTimelineDelta(event.delta);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`group flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
        isUndone
          ? "bg-white/[0.02] border border-white/5 opacity-50"
          : isFailed
            ? "bg-red-500/5 border border-red-500/10"
            : "bg-white/[0.04] border border-white/[0.08]"
      }`}
    >
      <div
        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
          isUndone
            ? "bg-slate-700/50"
            : isFailed
              ? "bg-red-500/20"
              : "bg-emerald-500/20"
        }`}
      >
        <Icon
          className={`w-3.5 h-3.5 ${
            isUndone
              ? "text-slate-500"
              : isFailed
                ? "text-red-400"
                : "text-emerald-400"
          }`}
        />
      </div>

      <span
        className={`flex-1 truncate ${
          isUndone ? "line-through text-slate-500" : "text-slate-300"
        }`}
      >
        {event.label}
      </span>

      {displayDelta && (
        <span
          title={displayDelta}
          className={`min-w-0 max-w-[22rem] truncate text-right ${
            isUndone ? "line-through text-slate-500" : "text-slate-400"
          }`}
        >
          {displayDelta}
        </span>
      )}

      {isPending && (
        <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
      )}

      {event.status === "completed" && !isFailed && (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      )}

      {isFailed && (
        <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      )}

      {isUndone && (
        <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0">
          Undone
        </span>
      )}

      {event.undoable && event.status === "completed" && onUndo && (
        <button
          onClick={() => onUndo(event.operationId)}
          className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
          title="Undo this action"
        >
          <Undo2 className="w-3 h-3 text-slate-400 hover:text-white" />
        </button>
      )}
    </motion.div>
  );
}
