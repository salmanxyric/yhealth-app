"use client";

import { useCallback } from "react";
import {
  Bell,
  Moon,
  Smartphone,
  Mail,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import type { PreferencesWithSetterProps } from "./settings-types";
import { ToggleSwitch, GlassCard, SectionHeader } from "./SettingsSharedUI";
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push-notifications";

export function NotificationsSettingsSection({
  preferences,
  updatePreference,
  setPreferences,
}: PreferencesWithSetterProps) {
  const handlePushToggle = useCallback(async () => {
    const currentlyEnabled = !!preferences.notifications.push;

    if (!currentlyEnabled) {
      if (!isPushSupported()) {
        toast.error("Push notifications are not supported in this browser");
        return;
      }
      const success = await subscribeToPush();
      if (success) {
        updatePreference("notifications", "push", true);
        toast.success("Push notifications enabled");
      } else {
        toast.error("Could not enable push notifications. Please allow notifications in your browser settings.");
      }
    } else {
      await unsubscribeFromPush();
      updatePreference("notifications", "push", false);
      toast.success("Push notifications disabled");
    }
  }, [preferences.notifications.push, updatePreference]);
  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <SectionHeader
            icon={<Bell className="w-5 h-5" />}
            title="Notification Channels"
            gradient="from-blue-500 to-cyan-500"
          />
          <ToggleSwitch
            checked={preferences.notifications.enabled}
            onChange={() => updatePreference("notifications", "enabled", !preferences.notifications.enabled)}
          />
        </div>

        <div className="space-y-3">
          {[
            { id: "push", label: "Push Notifications", icon: <Smartphone className="w-5 h-5" />, key: "push", onToggle: handlePushToggle },
            { id: "email", label: "Email", icon: <Mail className="w-5 h-5" />, key: "email" },
            { id: "sms", label: "SMS", icon: <MessageSquare className="w-5 h-5" />, key: "sms" },
            { id: "whatsapp", label: "WhatsApp", icon: <MessageSquare className="w-5 h-5" />, key: "whatsapp" },
          ].map((channel) => (
            <div key={channel.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.06] text-slate-400">{channel.icon}</div>
                <span className="text-slate-300">{channel.label}</span>
              </div>
              <ToggleSwitch
                checked={!!preferences.notifications[channel.key as keyof typeof preferences.notifications]}
                onChange={channel.onToggle ?? (() => updatePreference("notifications", channel.key, !preferences.notifications[channel.key as keyof typeof preferences.notifications]))}
                disabled={!preferences.notifications.enabled}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Quiet Hours</h2>
          </div>
          <ToggleSwitch
            checked={preferences.notifications.quietHours.enabled}
            onChange={() =>
              setPreferences((prev) => ({
                ...prev,
                notifications: {
                  ...prev.notifications,
                  quietHours: { ...prev.notifications.quietHours, enabled: !prev.notifications.quietHours.enabled },
                },
              }))
            }
            color="indigo"
          />
        </div>

        {preferences.notifications.quietHours.enabled && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-slate-400 mb-2 block">From</label>
              <input
                type="time"
                value={preferences.notifications.quietHours.start}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, quietHours: { ...prev.notifications.quietHours, start: e.target.value } },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-slate-400 mb-2 block">To</label>
              <input
                type="time"
                value={preferences.notifications.quietHours.end}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    notifications: { ...prev.notifications, quietHours: { ...prev.notifications.quietHours, end: e.target.value } },
                  }))
                }
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
