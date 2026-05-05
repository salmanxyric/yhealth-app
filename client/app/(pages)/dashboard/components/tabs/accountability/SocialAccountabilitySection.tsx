"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users,
  Zap,
  Shield,
  Clock,
  AlertTriangle,
  Plus,
  Settings,
  Activity,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Bell,
  ChevronRight,
} from "lucide-react";
import { accountabilityService } from "@/src/shared/services/accountability.service";
import type {
  AccountabilityConsent,
  AccountabilityContact,
  AccountabilityGroup,
  AccountabilityTrigger,
  TriggerLog,
} from "@/src/shared/services/accountability.service";
import { chatService } from "@/src/shared/services/chat.service";
import type { Chat } from "@/src/shared/services/chat.service";
import { ContactManager } from "./ContactManager";
import { TriggerConfigModal } from "./TriggerConfigModal";
import { ConfirmModal } from "@/app/(pages)/dashboard/components/wellbeing/schedule/ConfirmModal";
import toast from "react-hot-toast";


interface SocialAccountabilitySectionProps {
  onNavigateToSettings?: () => void;
}

export function SocialAccountabilitySection({ onNavigateToSettings }: SocialAccountabilitySectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const [consent, setConsent] = useState<AccountabilityConsent | null>(null);
  const [contacts, setContacts] = useState<AccountabilityContact[]>([]);
  const [chatGroups, setChatGroups] = useState<Chat[]>([]);
  const [accountabilityGroups, setAccountabilityGroups] = useState<AccountabilityGroup[]>([]);
  const [triggers, setTriggers] = useState<AccountabilityTrigger[]>([]);
  const [logs, setLogs] = useState<TriggerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingConsent, setTogglingConsent] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [triggerToDelete, setTriggerToDelete] = useState<AccountabilityTrigger | null>(null);
  const [isDeletingTrigger, setIsDeletingTrigger] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [consentRes, contactsRes, groupsRes, chatsRes, triggersRes, logsRes] = await Promise.allSettled([
        accountabilityService.getConsent(),
        accountabilityService.getContacts(),
        accountabilityService.getGroups(),
        chatService.getChats(),
        accountabilityService.getTriggers(),
        accountabilityService.getTriggerLogs(10),
      ]);

      if (consentRes.status === "fulfilled" && consentRes.value.data) {
        setConsent(consentRes.value.data);
      }
      if (contactsRes.status === "fulfilled" && contactsRes.value.data) {
        setContacts(Array.isArray(contactsRes.value.data) ? contactsRes.value.data : []);
      }
      if (groupsRes.status === "fulfilled" && groupsRes.value.data) {
        setAccountabilityGroups(
          Array.isArray(groupsRes.value.data) ? groupsRes.value.data : []
        );
      }
      if (chatsRes.status === "fulfilled" && chatsRes.value) {
        const allChats = Array.isArray(chatsRes.value) ? chatsRes.value : [];
        setChatGroups(allChats.filter((c) => c.isGroupChat));
      }
      if (triggersRes.status === "fulfilled" && triggersRes.value.data) {
        setTriggers(Array.isArray(triggersRes.value.data) ? triggersRes.value.data : []);
      }
      if (logsRes.status === "fulfilled" && logsRes.value.data) {
        setLogs(Array.isArray(logsRes.value.data) ? logsRes.value.data : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleConsent = async () => {
    setTogglingConsent(true);
    try {
      const res = await accountabilityService.updateConsent({
        enabled: !consent?.enabled,
      });
      if (res.data) setConsent(res.data);
    } finally {
      setTogglingConsent(false);
    }
  };

  const toggleTrigger = async (triggerId: string, isActive: boolean) => {
    try {
      await accountabilityService.updateTrigger(triggerId, { is_active: !isActive });
      fetchAll();
    } catch(error: unknown) {
      toast.error("Failed to toggle trigger");
      console.error(error);
      // handled silently
    }
  };

  const requestDeleteTrigger = (trigger: AccountabilityTrigger) => {
    setTriggerToDelete(trigger);
  };

  const confirmDeleteTrigger = async () => {
    if (!triggerToDelete) return;
    setIsDeletingTrigger(true);
    try {
      await accountabilityService.deleteTrigger(triggerToDelete.id);
      toast.success("Trigger rule deleted");
      setTriggerToDelete(null);
      fetchAll();
    } catch (error) {
      toast.error("Failed to delete trigger");
      console.error(error);
    } finally {
      setIsDeletingTrigger(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[100px] rounded-2xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  const activeTriggers = triggers.filter((t) => t.isActive);
  const recentFiredLogs = logs.filter((l) => l.result === "fired").slice(0, 5);

  return (
    <div className="space-y-6">
      {/* System Status */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06]"
        style={{ background: 'linear-gradient(145deg, #0f1219 0%, #0a0d14 100%)' }}
      >
        {consent?.enabled && (
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/[0.06] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        )}
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border backdrop-blur-sm ${
                consent?.enabled
                  ? "bg-emerald-500/15 border-emerald-500/20 shadow-lg shadow-emerald-500/10"
                  : "bg-zinc-800/60 border-zinc-700/40"
              }`}>
                <Shield className={`w-5 h-5 ${consent?.enabled ? "text-emerald-400" : "text-zinc-500"}`} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-white tracking-tight">Social Accountability</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {consent?.enabled ? "Active — contacts can be notified" : "Disabled — no one will be notified"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleConsent}
              disabled={togglingConsent}
              className={`relative w-12 h-7 rounded-full transition-all duration-300 cursor-pointer ${
                consent?.enabled ? "bg-emerald-500 shadow-md shadow-emerald-500/25" : "bg-zinc-700"
              }`}
            >
              {togglingConsent ? (
                <Loader2 className="w-4 h-4 animate-spin text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              ) : (
                <div className={`absolute w-5 h-5 rounded-full bg-white top-1 transition-all duration-300 shadow-sm ${
                  consent?.enabled ? "left-[calc(100%-24px)]" : "left-1"
                }`} />
              )}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Users, color: "emerald", label: "Contacts", value: contacts.length },
              { icon: Zap, color: "orange", label: "Triggers", value: activeTriggers.length },
              { icon: Bell, color: "blue", label: "Alerts", value: recentFiredLogs.length },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.08] transition-colors"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <stat.icon className={`w-3.5 h-3.5 text-${stat.color}-400`} />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{stat.label}</span>
                </div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {consent?.allowSosAlerts && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/[0.06] border border-rose-500/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-xs text-rose-300/90 leading-relaxed">
                SOS active — emergency contacts notified after <span className="font-semibold text-rose-300">{consent.sosInactivityDays} days</span> of inactivity
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Contacts */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="p-6 rounded-2xl border border-white/[0.06]"
        style={{ background: 'linear-gradient(145deg, #0f1219 0%, #0a0d14 100%)' }}
      >
        <ContactManager contacts={contacts} onRefresh={fetchAll} />
      </motion.div>

      {/* Triggers */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/[0.06]"
        style={{ background: 'linear-gradient(145deg, #0f1219 0%, #0a0d14 100%)' }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Trigger Rules</h3>
                <p className="text-[11px] text-zinc-500">{triggers.length} rule{triggers.length !== 1 ? 's' : ''} configured</p>
              </div>
            </div>
            <button
              onClick={() => setShowTriggerModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium
                bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/15
                transition-all cursor-pointer hover:shadow-sm hover:shadow-orange-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              New Trigger
            </button>
          </div>

          {triggers.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-400">No trigger rules yet</p>
              <p className="text-xs text-zinc-600 mt-1 max-w-[240px] mx-auto leading-relaxed">
                Create rules like &quot;If I miss gym for 3 days, notify my friends&quot;
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {triggers.map((trigger, i) => (
                <motion.div
                  key={trigger.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`p-3.5 rounded-xl border transition-all duration-200 ${
                    trigger.isActive
                      ? "border-orange-500/10 bg-orange-500/[0.03] hover:border-orange-500/20"
                      : "border-white/[0.04] bg-white/[0.015] opacity-50 hover:opacity-70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        trigger.isActive ? "bg-orange-500/10 border border-orange-500/10" : "bg-zinc-800 border border-zinc-700/40"
                      }`}>
                        <Zap className={`w-4 h-4 ${trigger.isActive ? "text-orange-400" : "text-zinc-600"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-white truncate">{trigger.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-500 capitalize">
                            {(trigger.conditionType ?? "").replace(/_/g, " ") || "custom"} • {trigger.conditionWindowDays ?? 0}d window
                          </span>
                          {trigger.triggerCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-orange-500/10 text-orange-400">
                              {trigger.triggerCount}x fired
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleTrigger(trigger.id, trigger.isActive)}
                        className={`relative w-10 h-[22px] rounded-full transition-all duration-300 cursor-pointer ${
                          trigger.isActive ? "bg-orange-500 shadow-sm shadow-orange-500/25" : "bg-zinc-700"
                        }`}
                      >
                        <div className={`absolute w-4 h-4 rounded-full bg-white top-[3px] transition-all duration-300 shadow-sm ${
                          trigger.isActive ? "left-[calc(100%-19px)]" : "left-[3px]"
                        }`} />
                      </button>
                      <button
                        onClick={() => requestDeleteTrigger(trigger)}
                        aria-label="Delete trigger"
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Trigger Activity */}
      {recentFiredLogs.length > 0 && (
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/[0.06]"
          style={{ background: 'linear-gradient(145deg, #0f1219 0%, #0a0d14 100%)' }}
        >
          <div className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
                <p className="text-[11px] text-zinc-500">Latest trigger events</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {recentFiredLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    log.result === "fired"
                      ? "bg-orange-500/10 border border-orange-500/10"
                      : log.result === "ai_intervened"
                      ? "bg-blue-500/10 border border-blue-500/10"
                      : "bg-zinc-800 border border-zinc-700/40"
                  }`}>
                    {log.result === "fired" ? (
                      <MessageCircle className="w-4 h-4 text-orange-400" />
                    ) : log.result === "ai_intervened" ? (
                      <Activity className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-white truncate">
                      {log.triggerName || "System Trigger"}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {log.result === "fired" && log.messageSent ? "Notification sent" : (log.result ?? "pending").replace(/_/g, " ")}
                      {" · "}
                      {new Date(log.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  {log.messageSent && (
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Link */}
      {onNavigateToSettings && (
        <motion.button
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={onNavigateToSettings}
          className="w-full flex items-center justify-between p-5 rounded-2xl border border-white/[0.06]
            hover:border-white/[0.1] transition-all cursor-pointer group"
          style={{ background: 'linear-gradient(145deg, #0f1219 0%, #0a0d14 100%)' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center group-hover:border-zinc-600/50 transition-colors">
              <Settings className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors block">
                Full Accountability Settings
              </span>
              <span className="text-[11px] text-zinc-600 group-hover:text-zinc-500 transition-colors">
                Manage consent, contacts & triggers
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors group-hover:translate-x-0.5 transform duration-200" />
        </motion.button>
      )}

      {/* Trigger Config Modal */}
      <TriggerConfigModal
        isOpen={showTriggerModal}
        onClose={() => setShowTriggerModal(false)}
        onSuccess={fetchAll}
        contacts={contacts}
        accountabilityGroups={accountabilityGroups}
        chatGroups={chatGroups}
      />

      {/* Delete Trigger Confirmation */}
      <ConfirmModal
        isOpen={!!triggerToDelete}
        onClose={() => {
          if (isDeletingTrigger) return;
          setTriggerToDelete(null);
        }}
        onConfirm={confirmDeleteTrigger}
        title="Delete Trigger Rule?"
        message={
          triggerToDelete
            ? `This will permanently delete "${triggerToDelete.name}". This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmText="Delete Rule"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeletingTrigger}
      />
    </div>
  );
}
