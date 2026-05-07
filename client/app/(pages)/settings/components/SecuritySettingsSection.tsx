"use client";

import { Lock, Smartphone } from "lucide-react";
import { GlassCard, SectionHeader } from "./SettingsSharedUI";

interface SecuritySettingsSectionProps {
  onChangePassword: () => void;
}

export function SecuritySettingsSection({ onChangePassword }: SecuritySettingsSectionProps) {
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<Lock className="w-5 h-5" />} title="Security" gradient="from-red-500 to-rose-500" />
        <p className="text-sm text-slate-400 mb-6">Protect your account with strong authentication and monitor active sessions.</p>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div><p className="text-white font-medium">Password</p><p className="text-xs text-slate-400">Last changed: unknown</p></div>
              <button onClick={onChangePassword} className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] text-sm font-medium transition-colors border border-white/[0.06]">Change Password</button>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div><p className="text-white font-medium">Two-Factor Authentication</p><p className="text-xs text-slate-400">Add an extra layer of security to your account</p></div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/20">Not Enabled</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div><p className="text-white font-medium">Active Sessions</p><p className="text-xs text-slate-400">Manage devices currently logged in</p></div>
              <span className="text-xs text-emerald-400 font-medium">1 active</span>
            </div>
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-base font-semibold text-white mb-3">Login Activity</h3>
        <p className="text-sm text-slate-400 mb-4">Recent sign-in activity on your account.</p>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center"><Smartphone className="w-4 h-4 text-emerald-400" /></div>
            <div><p className="text-sm text-white font-medium">Current Session</p><p className="text-xs text-slate-500">Active now</p></div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
