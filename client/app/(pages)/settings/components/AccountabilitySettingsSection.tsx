"use client";

import { Shield } from "lucide-react";
import { GlassCard, SectionHeader } from "./SettingsSharedUI";

export function AccountabilitySettingsSection() {
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<Shield className="w-5 h-5" />} title="Social Accountability" gradient="from-orange-500 to-amber-500" />
        <p className="text-sm text-slate-400 mb-6">Enable trusted contacts to receive notifications when you fall behind on your goals. Consent-based and fully customizable.</p>
        <a href="/dashboard?tab=accountability" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-400 border border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer"><Shield className="w-4 h-4" /> Open Accountability Dashboard</a>
      </GlassCard>
      <GlassCard>
        <h3 className="text-base font-semibold text-white mb-4">Features</h3>
        <div className="space-y-3">
          {[
            { step: "1", title: "Consent-Based", desc: "You control who can be notified and when — privacy first" },
            { step: "2", title: "Trigger Rules", desc: "Set conditions like 'If I miss gym for 3 days, tell my friends'" },
            { step: "3", title: "Contacts & Groups", desc: "Add trusted people — friends, family, spouse, or coach" },
            { step: "4", title: "SOS Safety Net", desc: "Emergency contacts are notified if you're inactive for extended periods" },
            { step: "5", title: "AI First", desc: "AI coach tries to re-engage you before involving others" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400 text-sm font-bold flex-shrink-0">{item.step}</div>
              <div><p className="text-sm font-medium text-white">{item.title}</p><p className="text-xs text-slate-500 mt-0.5">{item.desc}</p></div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
