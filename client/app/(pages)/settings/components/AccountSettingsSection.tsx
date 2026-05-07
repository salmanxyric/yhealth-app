"use client";

import { User, LogOut, Trash2 } from "lucide-react";
import { GlassCard, SectionHeader } from "./SettingsSharedUI";

interface AccountSettingsSectionProps {
  user: { firstName?: string; lastName?: string; email?: string } | null | undefined;
  onLogout: () => void;
}

export function AccountSettingsSection({ user, onLogout }: AccountSettingsSectionProps) {
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<User className="w-5 h-5" />} title="Account Information" gradient="from-slate-400 to-slate-500" />
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"><label className="text-sm text-slate-400 mb-1 block">Name</label><p className="text-white">{user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Not set"}</p></div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"><label className="text-sm text-slate-400 mb-1 block">Email</label><p className="text-white">{user?.email || "Not set"}</p></div>
        </div>
      </GlassCard>
      <GlassCard>
        <h2 className="text-lg font-semibold text-white mb-4">Session</h2>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"><LogOut className="w-4 h-4" /> Sign Out</button>
      </GlassCard>
      <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"><Trash2 className="w-4 h-4" /> Delete Account</button>
      </div>
    </div>
  );
}
