"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  Zap,
  Flame,
  Activity,
  LogIn,
  Timer,
  
  Users,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Bell,
} from "lucide-react";
import { accountabilityService } from "@/src/shared/services/accountability.service";
import type {
  AccountabilityContact,
  AccountabilityGroup,
  CreateTriggerInput,
} from "@/src/shared/services/accountability.service";
import type { Chat } from "@/src/shared/services/chat.service";

interface TriggerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contacts: AccountabilityContact[];
  /** Named accountability groups (members are contacts) */
  accountabilityGroups: AccountabilityGroup[];
  /** Native app group chats from Messages */
  chatGroups: Chat[];
}

const CONDITION_TYPES = [
  { id: "inactivity" as const, label: "Inactivity", icon: Timer, desc: "No app activity for X days", color: "#f97316" },
  { id: "metric_threshold" as const, label: "Metric Threshold", icon: Activity, desc: "Calories, steps, or other metric exceeds limit", color: "#eab308" },
  { id: "streak_break" as const, label: "Streak Break", icon: Flame, desc: "Your streak drops to zero", color: "#ef4444" },
  { id: "login_gap" as const, label: "Login Gap", icon: LogIn, desc: "Haven't logged in for X days", color: "#8b5cf6" },
] as const;

const METRICS = [
  { id: "calories", label: "Calories" },
  { id: "gym_sessions", label: "Gym Sessions" },
  { id: "steps", label: "Steps" },
  { id: "water_intake", label: "Water Intake" },
  { id: "sleep_hours", label: "Sleep Hours" },
  { id: "workout_completion", label: "Workout Completion" },
];

const MESSAGE_TYPES = [
  { id: "motivation" as const, label: "Motivation", icon: Bell, desc: "Encouraging reminder", color: "#34d399" },
  { id: "failure" as const, label: "Alert", icon: AlertTriangle, desc: "Direct notification about missed target", color: "#f97316" },
  { id: "sos" as const, label: "SOS", icon: AlertTriangle, desc: "Emergency wellness check", color: "#ef4444" },
];

export function TriggerConfigModal({
  isOpen,
  onClose,
  onSuccess,
  contacts,
  accountabilityGroups,
  chatGroups,
}: TriggerConfigModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    conditionType: "" as CreateTriggerInput["condition_type"] | "",
    conditionMetric: "",
    conditionOperator: "gt" as CreateTriggerInput["condition_operator"],
    conditionValue: "",
    conditionWindowDays: "3",
    targetType: "contact" as CreateTriggerInput["target_type"],
    targetContactId: "",
    targetGroupId: "",
    targetChatId: "",
    messageType: "motivation" as CreateTriggerInput["message_type"],
    messageTemplate: "",
    cooldownHours: "48",
    aiInterveneFirst: true,
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const resetAndClose = () => {
    setForm({
      name: "",
      description: "",
      conditionType: "",
      conditionMetric: "",
      conditionOperator: "gt",
      conditionValue: "",
      conditionWindowDays: "3",
      targetType: "contact",
      targetContactId: "",
      targetGroupId: "",
      targetChatId: "",
      messageType: "motivation",
      messageTemplate: "",
      cooldownHours: "48",
      aiInterveneFirst: true,
    });
    setError(null);
    onClose();
  };

  const canSubmit = () => {
    if (!form.name || !form.conditionType) return false;
    if (form.targetType === "contact" && !form.targetContactId) return false;
    if (form.targetType === "group" && !form.targetGroupId) return false;
    if (form.targetType === "app_chat" && !form.targetChatId) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setSubmitting(true);
    setError(null);
    try {
      const input: CreateTriggerInput = {
        name: form.name,
        description: form.description || undefined,
        condition_type: form.conditionType as CreateTriggerInput["condition_type"],
        condition_metric: form.conditionMetric || undefined,
        condition_operator: form.conditionOperator || undefined,
        condition_value: form.conditionValue ? Number(form.conditionValue) : undefined,
        condition_window_days: Number(form.conditionWindowDays) || 3,
        target_type: form.targetType,
        target_contact_id: form.targetContactId || undefined,
        target_group_id: form.targetGroupId || undefined,
        target_chat_id: form.targetChatId || undefined,
        message_type: form.messageType || undefined,
        message_template: form.messageTemplate || undefined,
        cooldown_hours: Number(form.cooldownHours) || 48,
        ai_intervene_first: form.aiInterveneFirst,
      };
      await accountabilityService.createTrigger(input);
      resetAndClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trigger");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const needsMetric = form.conditionType === "metric_threshold";
  const needsValue = form.conditionType === "inactivity" || form.conditionType === "metric_threshold" || form.conditionType === "login_gap";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        onClick={resetAndClose}
      >
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.96, opacity: 0, y: 8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
          style={{
            background: "linear-gradient(180deg, #0d1117 0%, #0a0e13 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">New Trigger</h2>
                <p className="text-[11px] text-zinc-500">Set up an accountability rule</p>
              </div>
            </div>
            <button
              onClick={resetAndClose}
              aria-label="Close"
              className="p-2 rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="px-6 pb-4 space-y-5 overflow-y-auto flex-1">
            {/* Name */}
            <div>
              <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Trigger Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder='e.g. "Gym inactivity alert"'
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-zinc-600
                  focus:outline-none focus:border-orange-500/40 transition-colors text-sm"
              />
            </div>

            {/* Condition Type */}
            <div>
              <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Condition *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITION_TYPES.map((ct) => {
                  const Icon = ct.icon;
                  const selected = form.conditionType === ct.id;
                  return (
                    <button
                      key={ct.id}
                      onClick={() => update("conditionType", ct.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? "border-orange-500/30 bg-orange-500/[0.06]"
                          : "border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1]"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: ct.color }} />
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{ct.label}</p>
                        <p className="text-[10px] text-zinc-600 truncate">{ct.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metric + Value */}
            {needsMetric && (
              <div>
                <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Metric
                </label>
                <div className="flex gap-2 flex-wrap">
                  {METRICS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => update("conditionMetric", m.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                        form.conditionMetric === m.id
                          ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                          : "bg-white/[0.03] text-zinc-500 border border-white/[0.05] hover:text-zinc-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {needsValue && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Threshold
                  </label>
                  <input
                    type="number"
                    value={form.conditionValue}
                    onChange={(e) => update("conditionValue", e.target.value)}
                    placeholder={form.conditionType === "inactivity" || form.conditionType === "login_gap" ? "e.g. 3 days" : "e.g. 3000"}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-zinc-600
                      focus:outline-none focus:border-orange-500/40 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Window (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={form.conditionWindowDays}
                    onChange={(e) => update("conditionWindowDays", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-zinc-600
                      focus:outline-none focus:border-orange-500/40 transition-colors text-sm"
                  />
                </div>
              </div>
            )}

            {/* Target */}
            <div>
              <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Who to Notify *
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { id: "contact" as const, label: "Contact", icon: Users },
                  { id: "group" as const, label: "Saved group", icon: Users },
                  { id: "app_chat" as const, label: "App chat", icon: MessageSquare },
                  { id: "emergency" as const, label: "Emergency", icon: AlertTriangle },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        update("targetType", t.id);
                        update("targetContactId", "");
                        update("targetGroupId", "");
                        update("targetChatId", "");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
                        form.targetType === t.id
                          ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                          : "bg-white/[0.03] text-zinc-500 border border-white/[0.05]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              {form.targetType === "app_chat" && (
                <p className="text-[11px] text-zinc-500 mb-2 leading-relaxed">
                  Everyone else in the chat must be an accountability contact with consent for this message type.
                </p>
              )}

              {form.targetType === "contact" && (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto rounded-xl border border-white/[0.06] p-1.5">
                  {contacts.length === 0 ? (
                    <p className="text-[12px] text-zinc-600 px-3 py-2">No contacts yet — add them in Social Accountability</p>
                  ) : contacts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => update("targetContactId", c.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] transition-all cursor-pointer ${
                        form.targetContactId === c.id
                          ? "bg-orange-500/15 text-orange-300 border border-orange-500/20"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{c.contactName || c.nickname || "User"}</span>
                      {form.targetContactId === c.id && <CheckCircle2 className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-orange-400" />}
                    </button>
                  ))}
                </div>
              )}

              {form.targetType === "group" && (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto rounded-xl border border-white/[0.06] p-1.5">
                  {accountabilityGroups.length === 0 ? (
                    <p className="text-[12px] text-zinc-600 px-3 py-2">No saved groups — create one under Social Accountability</p>
                  ) : accountabilityGroups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => update("targetGroupId", g.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] transition-all cursor-pointer ${
                        form.targetGroupId === g.id
                          ? "bg-orange-500/15 text-orange-300 border border-orange-500/20"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent"
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{g.name}</span>
                      {form.targetGroupId === g.id && <CheckCircle2 className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-orange-400" />}
                    </button>
                  ))}
                </div>
              )}

              {form.targetType === "app_chat" && (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto rounded-xl border border-white/[0.06] p-1.5">
                  {chatGroups.length === 0 ? (
                    <p className="text-[12px] text-zinc-600 px-3 py-2">No group chats yet — create one in Messages</p>
                  ) : chatGroups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => update("targetChatId", g.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] transition-all cursor-pointer ${
                        form.targetChatId === g.id
                          ? "bg-orange-500/15 text-orange-300 border border-orange-500/20"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{g.chatName}</span>
                      {form.targetChatId === g.id && <CheckCircle2 className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-orange-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Message Type */}
            <div>
              <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Message Type
              </label>
              <div className="flex gap-2">
                {MESSAGE_TYPES.map((mt) => {
                  const Icon = mt.icon;
                  return (
                    <button
                      key={mt.id}
                      onClick={() => update("messageType", mt.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
                        form.messageType === mt.id
                          ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                          : "bg-white/[0.03] text-zinc-500 border border-white/[0.05]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {mt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom message */}
            <div>
              <label className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Custom Message (optional)
              </label>
              <textarea
                value={form.messageTemplate}
                onChange={(e) => update("messageTemplate", e.target.value)}
                rows={2}
                placeholder="Message sent when trigger fires..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-zinc-600
                  focus:outline-none focus:border-orange-500/40 transition-colors text-sm resize-none"
              />
            </div>

            {/* AI intervene first */}
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] cursor-pointer">
              <input
                type="checkbox"
                checked={form.aiInterveneFirst}
                onChange={(e) => update("aiInterveneFirst", e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <div>
                <p className="text-[13px] text-white font-medium">AI Coach Intervenes First</p>
                <p className="text-[11px] text-zinc-500">
                  AI coach tries to re-engage you before alerting contacts
                </p>
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="px-6 pb-3">
              <p className="text-[13px] text-rose-400 bg-rose-500/10 px-4 py-2 rounded-xl">
                {error}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.05] flex-shrink-0">
            <button
              onClick={resetAndClose}
              className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold
                bg-gradient-to-r from-orange-500 to-amber-500 text-white
                hover:from-orange-400 hover:to-amber-400
                disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer
                shadow-[0_0_20px_-4px_rgba(249,115,22,0.3)]"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Create Trigger
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
