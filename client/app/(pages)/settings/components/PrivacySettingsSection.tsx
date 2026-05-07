"use client";

import {
  Shield,
  Accessibility,
  Heart,
  Download,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreferencesProps } from "./settings-types";
import { ToggleSwitch, GlassCard, SectionHeader } from "./SettingsSharedUI";

interface PrivacySettingsSectionProps extends PreferencesProps {
  reduceMotionPref: boolean;
  setReduceMotion: (enabled: boolean) => void;
}

export function PrivacySettingsSection({
  preferences,
  updatePreference,
  reduceMotionPref,
  setReduceMotion,
}: PrivacySettingsSectionProps) {
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<Shield className="w-5 h-5" />} title="Data & Privacy" gradient="from-rose-500 to-emerald-600" />
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div><p className="text-white font-medium">Share Progress with Coach</p><p className="text-sm text-slate-400">Allow your AI coach to see detailed progress</p></div>
            <ToggleSwitch checked={preferences.privacy.shareProgress} onChange={() => updatePreference("privacy", "shareProgress", !preferences.privacy.shareProgress)} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div><p className="text-white font-medium">Anonymous Analytics</p><p className="text-sm text-slate-400">Help improve Balencia with anonymous usage data</p></div>
            <ToggleSwitch checked={preferences.privacy.anonymousAnalytics} onChange={() => updatePreference("privacy", "anonymousAnalytics", !preferences.privacy.anonymousAnalytics)} />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader icon={<Accessibility className="w-5 h-5" />} title="Accessibility" gradient="from-violet-500 to-indigo-500" />
        <p className="text-sm text-slate-400 mb-4">Adjust how motion is used across the app. This is stored on this device only.</p>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div><p className="text-white font-medium">Reduce motion</p><p className="text-sm text-slate-400">Minimize animations and transitions for a calmer interface</p></div>
          <ToggleSwitch checked={reduceMotionPref} onChange={() => setReduceMotion(!reduceMotionPref)} />
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader icon={<Heart className="w-5 h-5" />} title="Health Profile Visibility" gradient="from-emerald-500 to-teal-500" />
        <p className="text-sm text-slate-400 mb-4">Control who can view your health data when they click your profile in a chat.</p>
        <div className="space-y-2">
          {([
            { id: "disabled" as const, label: "Nobody", desc: "Health profile is hidden from everyone" },
            { id: "friends" as const, label: "Friends Only", desc: "Only accepted connections can see your health data" },
            { id: "all" as const, label: "Everyone in Chat", desc: "Anyone who shares a chat with you can view your health data" },
            { id: "custom" as const, label: "Custom List", desc: "Only specific users you choose" },
          ]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => updatePreference("privacy", "healthProfileVisibility", opt.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl border transition-colors text-left",
                preferences.privacy.healthProfileVisibility === opt.id
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]",
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                preferences.privacy.healthProfileVisibility === opt.id ? "border-emerald-400" : "border-slate-600",
              )}>
                {preferences.privacy.healthProfileVisibility === opt.id && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
              </div>
              <div><p className="text-sm font-medium text-white">{opt.label}</p><p className="text-xs text-slate-400">{opt.desc}</p></div>
            </button>
          ))}
        </div>
        {preferences.privacy.healthProfileVisibility === "custom" && (
          <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-slate-400 mb-2">Custom user list is managed from the chat profile — tap a user and grant or revoke access.</p>
            {preferences.privacy.healthProfileAllowedUsers.length > 0 ? (
              <p className="text-xs text-emerald-400">{preferences.privacy.healthProfileAllowedUsers.length} user(s) have access</p>
            ) : (
              <p className="text-xs text-slate-500">No users added yet</p>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="text-lg font-semibold text-white mb-4">Your Data</h2>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] text-slate-300 rounded-xl hover:bg-white/[0.06] transition-colors"><Download className="w-4 h-4" /> Export Data</button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"><Trash2 className="w-4 h-4" /> Delete All Data</button>
        </div>
      </GlassCard>
    </div>
  );
}
