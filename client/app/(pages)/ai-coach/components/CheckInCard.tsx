"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Moon,
  TrendingDown,
  Flame,
  Zap,
  Clock,
  Check,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api-client";

export interface CheckInData {
  id: string;
  checkInType: string;
  triggerEvent: string;
  actions: { label: string; value: string; style: "primary" | "secondary" | "muted" }[];
  expiresAt?: string;
}

const CHECK_IN_ICONS: Record<string, LucideIcon> = {
  post_workout: Activity,
  whoop_morning_readiness: Moon,
  behavioral_drift: TrendingDown,
  streak_at_risk: Flame,
  positive_momentum: Zap,
};

const CHECK_IN_ACCENTS: Record<string, string> = {
  post_workout: "from-emerald-500/20 to-cyan-500/20 border-emerald-500/30",
  whoop_morning_readiness: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
  behavioral_drift: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  streak_at_risk: "from-red-500/20 to-orange-500/20 border-red-500/30",
  positive_momentum: "from-emerald-500/20 to-lime-500/20 border-emerald-500/30",
};

interface CheckInCardProps {
  checkIn: CheckInData;
  messageContent: string;
}

export function CheckInCard({ checkIn, messageContent }: CheckInCardProps) {
  const [status, setStatus] = useState<"pending" | "responding" | "done">("pending");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);

  const Icon = CHECK_IN_ICONS[checkIn.checkInType] || Activity;
  const accent = CHECK_IN_ACCENTS[checkIn.checkInType] || "from-slate-500/20 to-slate-500/20 border-slate-500/30";

  const isExpired = checkIn.expiresAt && new Date(checkIn.expiresAt) < new Date();

  const handleAction = async (actionValue: string) => {
    if (status !== "pending") return;
    setStatus("responding");
    setSelectedAction(actionValue);

    try {
      const response = await api.post<{ handled: boolean; followUp?: string }>(
        `/rag-chat/check-ins/${checkIn.id}/respond`,
        { action: actionValue },
      );
      if (response.success && response.data?.followUp) {
        setFollowUp(response.data.followUp);
      }
      setStatus("done");
    } catch {
      setStatus("pending");
      setSelectedAction(null);
    }
  };

  const cleanContent = messageContent
    .replace(/<!--CHECKIN:[\s\S]*?-->/g, "")
    .trim();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl bg-gradient-to-br ${accent} border p-4 space-y-3`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Check-in
        </span>
        {isExpired && (
          <span className="text-[10px] text-slate-500 ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" /> Expired
          </span>
        )}
      </div>

      {/* Message content */}
      <p className="text-sm text-slate-200 leading-relaxed">{cleanContent}</p>

      {/* Action buttons */}
      {status === "pending" && !isExpired && (
        <div className="flex flex-wrap gap-2 pt-1">
          {checkIn.actions.map((action) => (
            <button
              key={action.value}
              onClick={() => handleAction(action.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                action.style === "primary"
                  ? "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                  : action.style === "secondary"
                    ? "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Responding state */}
      {status === "responding" && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Processing...</span>
        </div>
      )}

      {/* Done state */}
      {status === "done" && (
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <Check className="w-3 h-3" />
          <span>
            {followUp || (selectedAction === "dismiss" ? "Dismissed" : "Got it!")}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Parse check-in metadata from message content.
 * Format: <!--CHECKIN:{"id":"...","checkInType":"...","actions":[...]}-->
 */
export function parseCheckInFromMessage(content: string): CheckInData | null {
  const match = content.match(/<!--CHECKIN:([\s\S]*?)-->/);
  if (!match) return null;

  try {
    const data = JSON.parse(match[1]);
    if (data.id && data.checkInType && Array.isArray(data.actions)) {
      return data as CheckInData;
    }
  } catch {
    // Malformed check-in metadata
  }
  return null;
}
