"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CoachInsight } from "./useAICoach";

interface AIPillProps {
  insights: CoachInsight[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<string>;
  onDismissInsight: (index: number) => void;
  onQuickAction?: (action: string) => void;
}

const INSIGHT_ICONS: Record<string, string> = {
  pattern: "🔍",
  connection: "🔗",
  time_aware: "🌙",
  encouragement: "✨",
};

export function AIPill({
  insights,
  isLoading,
  onSendMessage,
  onDismissInsight,
  onQuickAction,
}: AIPillProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);

  // Listen for Ctrl+J toggle event
  useEffect(() => {
    const handler = () => setIsExpanded((prev) => !prev);
    document.addEventListener("toggle-ai-pill", handler);
    return () => document.removeEventListener("toggle-ai-pill", handler);
  }, []);

  const handleSend = useCallback(async () => {
    if (!chatInput.trim()) return;
    const message = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: message }]);

    const response = await onSendMessage(message);
    setChatMessages((prev) => [...prev, { role: "ai", text: response }]);
  }, [chatInput, onSendMessage]);

  return (
    <div className="fixed bottom-20 right-6 z-[65]">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 rounded-2xl border border-white/10 bg-[#0e0a22]/98 backdrop-blur-xl shadow-2xl shadow-purple-500/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="observatory-font-display text-white/60" style={{ fontSize: 10, letterSpacing: "0.12em" }}>
                  AI COACH
                </span>
              </div>
              <button onClick={() => setIsExpanded(false)} className="text-white/20 hover:text-white/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <div className="px-3 py-2 space-y-2 max-h-40 overflow-y-auto observatory-scroll border-b border-white/5">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 px-2 py-2 rounded-lg bg-white/[0.02]">
                    <span className="text-sm">{INSIGHT_ICONS[insight.type] || "💡"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/50 text-xs leading-relaxed">{insight.message}</p>
                      {insight.action && (
                        <button
                          onClick={() => onQuickAction?.(insight.action!)}
                          className="mt-1 text-purple-400/70 text-xs hover:text-purple-300 transition-colors"
                        >
                          {insight.action} →
                        </button>
                      )}
                    </div>
                    <button onClick={() => onDismissInsight(i)} className="text-white/10 hover:text-white/30 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {chatMessages.length > 0 && (
              <div className="px-3 py-2 space-y-2 max-h-48 overflow-y-auto observatory-scroll">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("text-xs leading-relaxed px-2 py-1.5 rounded-lg", msg.role === "user" ? "bg-purple-500/10 text-purple-200 ml-6" : "bg-white/[0.02] text-white/50 mr-6")}>
                    {msg.text}
                  </div>
                ))}
              </div>
            )}

            {/* Chat input */}
            <div className="px-3 py-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  placeholder="Ask AI anything..."
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-white/60 placeholder:text-white/15 text-xs focus:outline-none focus:border-purple-500/20"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !chatInput.trim()}
                  className="p-2 rounded-lg text-purple-400/50 hover:text-purple-300 hover:bg-purple-500/10 transition-colors disabled:opacity-30"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {["Reframe this", "Suggest prompt", "Go deeper"].map((action) => (
                  <button
                    key={action}
                    onClick={() => onQuickAction?.(action)}
                    className="px-2.5 py-1 rounded-full bg-white/5 text-white/25 hover:text-white/50 hover:bg-white/10 transition-colors text-xs"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-purple-500/20 bg-[#0e0a22]/90 backdrop-blur-xl text-purple-300/70 hover:text-purple-200 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span className="observatory-font-display" style={{ fontSize: 10, letterSpacing: "0.1em" }}>
              AI
            </span>
            {insights.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-200 flex items-center justify-center" style={{ fontSize: 9 }}>
                {insights.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
