"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Shield,
  X,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { useTransparencyPanel } from "../hooks/useTransparencyPanel";

type TransparencyHook = ReturnType<typeof useTransparencyPanel>;

interface TransparencyPanelProps {
  hook: TransparencyHook;
}

export function TransparencyPanel({ hook }: TransparencyPanelProps) {
  if (!hook.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="transparency-panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="w-[300px] shrink-0 border-l border-white/10 bg-[#060118]/90 backdrop-blur-lg flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-white">AI Reasoning</span>
          </div>
          <button
            onClick={hook.close}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {hook.loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          ) : !hook.data ? (
            <div className="text-center py-12">
              <Brain className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No transparency data available for this message.</p>
            </div>
          ) : (
            <>
              {/* Overall confidence */}
              {hook.data.overallConfidence !== null && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Overall Confidence
                  </span>
                  <div className="mt-2">
                    <ConfidenceBadge confidence={hook.data.overallConfidence} size="md" />
                  </div>
                </div>
              )}

              {/* Memories used */}
              {hook.data.memoriesUsed.length > 0 && (
                <Section icon={Brain} label="Memories Used" accent="text-purple-400">
                  <div className="space-y-2">
                    {hook.data.memoriesUsed.map((m) => (
                      <div
                        key={m.memoryId}
                        className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-slate-300 block truncate">{m.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                              {m.memoryType}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {Math.round(m.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Core profile used */}
              {hook.data.coreProfileUsed.length > 0 && (
                <Section icon={Shield} label="Core Profile" accent="text-emerald-400">
                  <div className="space-y-1">
                    {hook.data.coreProfileUsed.map((cp) => (
                      <div
                        key={`${cp.section}:${cp.key}`}
                        className="flex items-center justify-between px-2 py-1 rounded-lg bg-white/[0.02]"
                      >
                        <span className="text-[11px] text-slate-400">
                          {cp.key.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-white font-medium">
                          {typeof cp.value === "object" ? JSON.stringify(cp.value) : String(cp.value)}
                          {cp.unit ? ` ${cp.unit}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Feedback */}
              {hook.activeMessageId && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2">
                    Was this helpful?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => hook.submitHelpfulness(hook.activeMessageId!, true)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Yes
                    </button>
                    <button
                      onClick={() => hook.submitHelpfulness(hook.activeMessageId!, false)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      No
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({
  icon: Icon,
  label,
  accent,
  children,
}: {
  icon: LucideIcon;
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${accent}`} />
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
