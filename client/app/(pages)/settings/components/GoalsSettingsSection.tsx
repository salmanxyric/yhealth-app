"use client";

import {
  Crosshair,
  Target,
  BarChart2,
  Flame,
  ExternalLink,
} from "lucide-react";
import type { PreferencesProps } from "./settings-types";
import { ToggleSwitch, GlassCard, SectionHeader } from "./SettingsSharedUI";

export function GoalsSettingsSection({
  preferences,
  updatePreference,
}: PreferencesProps) {
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<Crosshair className="w-5 h-5" />} title="Goals & Plans" gradient="from-teal-500 to-cyan-500" />
        <p className="text-sm text-slate-400 mb-6">Manage your health goals, active plans, and track your progress milestones.</p>
        <div className="space-y-3">
          {[
            { label: "My Goals", desc: "View and manage your active goals", href: "/goals", icon: <Crosshair className="w-4 h-4 text-teal-400" /> },
            { label: "Active Plans", desc: "Your AI-generated workout and nutrition plans", href: "/plans", icon: <Target className="w-4 h-4 text-cyan-400" /> },
            { label: "Life Areas", desc: "Balance across fitness, nutrition, sleep, mindfulness", href: "/life-areas", icon: <BarChart2 className="w-4 h-4 text-emerald-400" /> },
            { label: "Progress Tracking", desc: "Detailed progress charts and analytics", href: "/progress", icon: <Flame className="w-4 h-4 text-orange-400" /> },
          ].map((item) => (
            <a key={item.href} href={item.href} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">{item.icon}</div>
                <div><p className="text-sm font-medium text-white">{item.label}</p><p className="text-xs text-slate-500">{item.desc}</p></div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </a>
          ))}
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-base font-semibold text-white mb-3">Goal Preferences</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div><p className="text-white font-medium">Weekly Check-in Reminders</p><p className="text-xs text-slate-400">Get reminded to review your weekly goal progress</p></div>
            <ToggleSwitch checked={preferences.notifications?.weeklyReport ?? true} onChange={() => updatePreference("notifications", "weeklyReport", !preferences.notifications?.weeklyReport)} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div><p className="text-white font-medium">AI Goal Suggestions</p><p className="text-xs text-slate-400">Allow AI to suggest new goals based on your progress</p></div>
            <ToggleSwitch checked={preferences.notifications?.aiSuggestions ?? true} onChange={() => updatePreference("notifications", "aiSuggestions", !preferences.notifications?.aiSuggestions)} />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
