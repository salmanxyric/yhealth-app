"use client";

import { motion } from "framer-motion";
import { Bot, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { parseActionsFromResponse, ActionExecutionResult } from "@/src/shared/services/action-handler.service";
import { RoutingChip } from "@/components/ai-coach/RoutingChip";
import { MessageActions } from "./MessageActions";
import type { Message } from "../hooks/useAICoach";

interface AICoachMessagesProps {
  messages: Message[];
  isSending: boolean;
  executingActions: Set<string>;
  actionResults: Map<string, ActionExecutionResult>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onRegenerateMessage: (messageId: string) => void;
}

export function AICoachMessages({
  messages,
  isSending,
  executingActions,
  actionResults,
  messagesEndRef,
  onRegenerateMessage,
}: AICoachMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {messages.map((message) => (
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
          <div
            className={`rounded-2xl px-4 py-3 break-words ${
              message.role === "user"
                ? "max-w-[85%] sm:max-w-[75%] bg-sky-500/15 text-slate-100 border border-sky-400/20 shadow-sm shadow-sky-500/5"
                : "max-w-[85%] sm:max-w-[80%] bg-white/5 text-slate-200 border border-white/10"
            }`}
          >
            {message.role === "assistant" ? (
              <div className="space-y-2">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {/* Action execution indicators */}
                {(() => {
                  const messageActions = parseActionsFromResponse(message.content);
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
                  content={message.content}
                  onRegenerate={() => onRegenerateMessage(message.id)}
                  isRegenerating={isSending}
                />
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
          {message.role === "user" && (
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/20 flex items-center justify-center shrink-0 mt-1">
              <User className="w-4 h-4 text-sky-300" />
            </div>
          )}
        </motion.div>
      ))}

      {/* Typing indicator */}
      {isSending && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
