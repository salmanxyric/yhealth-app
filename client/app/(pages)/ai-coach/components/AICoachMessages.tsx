"use client";

import React from "react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Bot, User, Loader2, CheckCircle2, AlertCircle, Copy, Pencil, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { parseActionsFromResponse, ActionExecutionResult } from "@/src/shared/services/action-handler.service";
import { cleanCoachDisplayText } from "@/src/shared/utils/coach-message-display";

import { RoutingChip } from "@/components/ai-coach/RoutingChip";
import { WikiLinkChip } from "./WikiLinkChip";
import { MessageActions } from "./MessageActions";
import { AgentTimeline } from "./AgentTimeline";
import { CheckInCard, parseCheckInFromMessage } from "./CheckInCard";
import { ArtifactCard, parseArtifactFromMessage } from "./ArtifactCard";
import { DeepAnalysisTimeline } from "./DeepAnalysisTimeline";
import type { Message, ToolTimelineEvent, AnalysisStepEvent } from "../hooks/useAICoach";

interface AICoachMessagesProps {
  messages: Message[];
  isSending: boolean;
  isLoadingConversation?: boolean;
  executingActions: Set<string>;
  actionResults: Map<string, ActionExecutionResult>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onRegenerateMessage: (messageId: string) => void;
  onEditUserMessage?: (messageId: string, content: string) => void | Promise<void>;
  onOpenWikiPage?: (slug: string) => void;
  isThinking?: boolean;
  thinkingLabel?: string;
  liveTimelineEvents?: ToolTimelineEvent[];
  onUndoTimelineEvent?: (messageId: string, operationId: string) => void;
  liveAnalysisSteps?: AnalysisStepEvent[];
}

function MessagesSkeleton() {
  const rows = [
    { align: "left", widths: ["70%", "45%"] },
    { align: "right", widths: ["55%"] },
    { align: "left", widths: ["80%", "60%", "30%"] },
    { align: "right", widths: ["40%"] },
    { align: "left", widths: ["65%", "50%"] },
  ] as const;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 animate-pulse">
      {rows.map((row, i) => (
        <div key={i} className={`flex gap-3 ${row.align === "right" ? "justify-end" : "justify-start"}`}>
          {row.align === "left" && (
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] shrink-0 mt-1" />
          )}
          <div
            className={`rounded-2xl px-4 py-3 space-y-2 ${
              row.align === "right"
                ? "max-w-[75%] bg-sky-500/[0.06] border border-sky-400/10"
                : "max-w-[80%] bg-white/[0.04] border border-white/[0.06]"
            }`}
          >
            {row.widths.map((w, j) => (
              <div key={j} className="h-3.5 bg-white/[0.07] rounded-md" style={{ width: w }} />
            ))}
          </div>
          {row.align === "right" && (
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 shrink-0 mt-1" />
          )}
        </div>
      ))}
    </div>
  );
}

export function AICoachMessages({
  messages,
  isSending,
  isLoadingConversation,
  executingActions,
  actionResults,
  messagesEndRef,
  onRegenerateMessage,
  onEditUserMessage,
  onOpenWikiPage,
  isThinking,
  thinkingLabel,
  liveTimelineEvents,
  onUndoTimelineEvent,
  liveAnalysisSteps,
}: AICoachMessagesProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function copyMessage(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied", { duration: 1200 });
    } catch {
      toast.error("Copy failed");
    }
  }

  function startEdit(message: Message) {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  }

  async function submitEdit(messageId: string) {
    const next = editingContent.trim();
    if (!next || !onEditUserMessage || savingEdit) return;

    setSavingEdit(true);
    try {
      await onEditUserMessage(messageId, next);
      setEditingMessageId(null);
      setEditingContent("");
    } catch {
      // Parent already shows the failure toast; keep the editor open.
    } finally {
      setSavingEdit(false);
    }
  }

  function renderContentWithWikiLinks(content: string): React.ReactNode {
    if (!onOpenWikiPage || !content.includes("[[")) {
      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      );
    }

    const parts = content.split(/(\[\[[^\]]+\]\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[\[([^\]]+)\]\]$/);
      if (match) {
        return <WikiLinkChip key={i} slug={match[1]} onClick={onOpenWikiPage} />;
      }
      if (!part) return null;
      return (
        <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
          {part}
        </ReactMarkdown>
      );
    });
  }

  if (isLoadingConversation) return <MessagesSkeleton />;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {messages.map((message) => (
        (() => {
          const displayContent = message.role === "assistant"
            ? cleanCoachDisplayText(message.content)
            : message.content;
          const checkIn = message.role === "assistant" ? parseCheckInFromMessage(message.content) : null;
          const parsedArtifact = message.role === "assistant" ? parseArtifactFromMessage(message.content) : null;
          const hasStructuredContent = Boolean(
            checkIn ||
            parsedArtifact ||
            message.timelineEvents?.length ||
            message.analysisSteps?.length ||
            message.artifacts?.length
          );
          if (message.role === "assistant" && !displayContent && !hasStructuredContent) return null;
          return (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`group flex gap-3 items-start ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {message.role === "assistant" && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
          <div className={`flex min-w-0 flex-col ${message.role === "user" ? "items-end" : "items-start"} ${message.role === "user" ? "max-w-[85%] sm:max-w-[75%]" : "max-w-[85%] sm:max-w-[80%]"}`}>
            <div
              className={`w-fit max-w-full rounded-2xl px-4 py-3 break-words ${
                message.role === "user"
                  ? "bg-sky-500/15 text-slate-100 border border-sky-400/20 shadow-sm shadow-sky-500/5"
                  : "bg-white/5 text-slate-200 border border-white/10"
              }`}
            >
            {message.role === "assistant" ? (
              <div className="space-y-2">
                {message.timelineEvents && message.timelineEvents.length > 0 && (
                  <AgentTimeline
                    events={message.timelineEvents}
                    thinkingLabel={message.thinkingLabel}
                    durationMs={message.thinkingDurationMs}
                    onUndo={onUndoTimelineEvent
                      ? (opId) => onUndoTimelineEvent(message.id, opId)
                      : undefined}
                  />
                )}
                {checkIn && <CheckInCard checkIn={checkIn} messageContent={message.content} />}
                {message.analysisSteps && message.analysisSteps.length > 0 && (
                  <DeepAnalysisTimeline steps={message.analysisSteps} />
                )}
                {message.artifacts && message.artifacts.length > 0
                  ? message.artifacts.map((art, i) => (
                      <ArtifactCard key={`artifact-${i}`} artifact={art} />
                    ))
                  : parsedArtifact ? <ArtifactCard artifact={parsedArtifact} /> : null}
                <div className="coach-prose prose prose-invert prose-sm max-w-none">
                  {displayContent && renderContentWithWikiLinks(displayContent)}
                </div>
                {/* Action execution indicators */}
                {(() => {
                  const messageActions = parseActionsFromResponse(displayContent);
                  if (messageActions.length > 0) {
                    return (
                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/5">
                        {messageActions.map((action, idx) => {
                          const actionKey = `${action.type}-${action.target}-${idx}`;
                          const isExecuting = Array.from(executingActions).some(
                            (id) => id.includes(action.type) && id.includes(action.target)
                          );
                          const result = Array.from(actionResults.values()).find(
                            (r) => r.action.type === action.type && r.action.target === action.target
                          );
                          return (
                            <div
                              key={actionKey}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs"
                            >
                              {isExecuting ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                                  <span className="text-slate-400">Executing...</span>
                                </>
                              ) : result ? (
                                <>
                                  {result.success ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">{result.message || "Completed"}</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-3 h-3 text-red-400" />
                                      <span className="text-red-400">{result.error || "Failed"}</span>
                                    </>
                                  )}
                                </>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                })()}
                {message.routingChip && (
                  <RoutingChip
                    chip={message.routingChip}
                    onReroute={async () => {
                      window.location.href = "/life-areas";
                    }}
                  />
                )}
                <MessageActions
                  content={displayContent}
                  onRegenerate={() => onRegenerateMessage(message.id)}
                  isRegenerating={isSending}
                />
              </div>
            ) : editingMessageId === message.id ? (
              <div className="w-[min(68vw,560px)] space-y-3">
                <textarea
                  value={editingContent}
                  onChange={(event) => setEditingContent(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submitEdit(message.id);
                    }
                    if (event.key === "Escape") {
                      setEditingMessageId(null);
                      setEditingContent("");
                    }
                  }}
                  autoFocus
                  rows={Math.min(6, Math.max(2, editingContent.split("\n").length))}
                  className="w-full resize-none rounded-xl border border-sky-300/20 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/50"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessageId(null);
                      setEditingContent("");
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitEdit(message.id)}
                    disabled={!editingContent.trim() || savingEdit || isSending}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cyan-500 px-3 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {message.imageUrl && (
                  <div className="mb-2 rounded-lg overflow-hidden relative w-48 h-36">
                    <img src={message.imageUrl} alt="Attached" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
              </div>
            )}
            </div>
            {message.role === "user" && editingMessageId !== message.id && (
              <div className="mt-1.5 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-80">
                <button
                  type="button"
                  title="Copy"
                  aria-label="Copy message"
                  onClick={() => void copyMessage(message.content)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {onEditUserMessage && (
                  <button
                    type="button"
                    title="Edit"
                    aria-label="Edit message"
                    disabled={isSending}
                    onClick={() => startEdit(message)}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
          {message.role === "user" && (
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/20 flex items-center justify-center shrink-0 mt-1">
              <User className="w-4 h-4 text-sky-300" />
            </div>
          )}
        </motion.div>
          );
        })()
      ))}

      {/* Streaming: thinking indicator + live timeline + typing dots */}
      {isSending && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="max-w-[85%] sm:max-w-[80%] space-y-2">
            {(isThinking || (liveTimelineEvents && liveTimelineEvents.length > 0)) && (
              <AgentTimeline
                events={liveTimelineEvents || []}
                thinkingLabel={thinkingLabel}
                isThinking={isThinking}
              />
            )}
            {liveAnalysisSteps && liveAnalysisSteps.length > 0 && (
              <DeepAnalysisTimeline steps={liveAnalysisSteps} />
            )}
            <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/10 w-fit">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
