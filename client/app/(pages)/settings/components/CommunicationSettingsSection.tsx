"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  Mail,
  Smartphone,
  Loader2,
  ExternalLink,
  Send,
} from "lucide-react";
import Link from "next/link";
import {
  communicationService,
  type CommunicationPreferences,
  type CommunicationPreferencesUpdate,
} from "@/src/shared/services/communication.service";
import { toast } from "sonner";
import { GlassCard, SectionHeader, ToggleSwitch, HourSelect } from './SettingsSharedUI';

export function CommunicationSettingsSection() {
  const [prefs, setPrefs] = useState<CommunicationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxCheckinsDraft, setMaxCheckinsDraft] = useState<string>("1");
  const [missedHoursDraft, setMissedHoursDraft] = useState<string>("24");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communicationService.getPreferences();
      if (res.success && res.data) {
        setPrefs(res.data);
        setMaxCheckinsDraft(String(res.data.max_checkins_per_day));
        setMissedHoursDraft(String(res.data.missed_followup_hours));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (body: CommunicationPreferencesUpdate) => {
    const res = await communicationService.updatePreferences(body);
    if (res.success && res.data) {
      setPrefs(res.data);
      setMaxCheckinsDraft(String(res.data.max_checkins_per_day));
      setMissedHoursDraft(String(res.data.missed_followup_hours));
      toast.success("Communication preferences saved");
    } else {
      toast.error(res.error?.message ?? "Could not save preferences");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!prefs) {
    return (
      <GlassCard>
        <p className="text-slate-400 text-sm">
          Communication preferences are unavailable. Ensure the API is running and you are signed in.
        </p>
      </GlassCard>
    );
  }

  const hourField = (
    label: string,
    value: number | null,
    onChange: (v: number | null) => void
  ) => (
    <div className="flex-1 min-w-[120px]">
      <label className="text-sm text-slate-400 mb-2 block">{label}</label>
      <HourSelect value={value} onChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader
          icon={<Send className="w-5 h-5" />}
          title="Proactive check-ins"
          gradient="from-violet-500 to-fuchsia-500"
        />
        <p className="text-sm text-slate-400 mb-6">
          Scheduled voice check-ins open in the voice assistant. Timing respects your quiet hours when set below.
        </p>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <span className="text-slate-300">Push for check-ins</span>
          <ToggleSwitch
            checked={prefs.checkin_push_enabled}
            onChange={() => patch({ checkin_push_enabled: !prefs.checkin_push_enabled })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {hourField("Quiet hours start", prefs.quiet_hours_start, (v) =>
            patch({ quiet_hours_start: v })
          )}
          {hourField("Quiet hours end", prefs.quiet_hours_end, (v) =>
            patch({ quiet_hours_end: v })
          )}
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-4">
          <span className="text-slate-300">Workdays only (Mon–Fri)</span>
          <ToggleSwitch
            checked={prefs.workdays_only}
            onChange={() => patch({ workdays_only: !prefs.workdays_only })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Max check-ins per day</label>
            <input
              type="number"
              min={0}
              max={5}
              value={maxCheckinsDraft}
              onChange={(e) => setMaxCheckinsDraft(e.target.value)}
              onBlur={() => {
                const n = Math.min(5, Math.max(0, Number(maxCheckinsDraft) || 0));
                setMaxCheckinsDraft(String(n));
                if (n !== prefs.max_checkins_per_day) patch({ max_checkins_per_day: n });
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Missed follow-up (hours)</label>
            <input
              type="number"
              min={1}
              max={168}
              value={missedHoursDraft}
              onChange={(e) => setMissedHoursDraft(e.target.value)}
              onBlur={() => {
                const n = Math.min(168, Math.max(1, Number(missedHoursDraft) || 1));
                setMissedHoursDraft(String(n));
                if (n !== prefs.missed_followup_hours) patch({ missed_followup_hours: n });
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<Smartphone className="w-5 h-5" />}
          title="Push categories"
          gradient="from-blue-500 to-cyan-500"
        />
        <p className="text-sm text-slate-400 mb-6">
          Controls which notification categories may open a device push (FCM when configured server-side).
        </p>
        <div className="space-y-3">
          {[
            { key: "push_achievements" as const, label: "Achievements & celebrations" },
            { key: "push_streaks" as const, label: "Streaks & warnings" },
            { key: "push_nudges" as const, label: "Nudges & coaching tips" },
          ].map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              <span className="text-slate-300">{row.label}</span>
              <ToggleSwitch
                checked={prefs[row.key]}
                onChange={() => patch({ [row.key]: !prefs[row.key] })}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<Mail className="w-5 h-5" />}
          title="Email"
          gradient="from-emerald-500 to-teal-500"
        />
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div>
              <p className="text-slate-300">Prefer digest-style email</p>
              <p className="text-xs text-slate-500 mt-1">Non-urgent updates batch when digest jobs run.</p>
            </div>
            <ToggleSwitch
              checked={prefs.email_digest}
              onChange={() => patch({ email_digest: !prefs.email_digest })}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div>
              <p className="text-slate-300">Urgent-only immediate email</p>
              <p className="text-xs text-slate-500 mt-1">Suppresses non-urgent sends on the high-priority path.</p>
            </div>
            <ToggleSwitch
              checked={prefs.email_urgent_only}
              onChange={() => patch({ email_urgent_only: !prefs.email_urgent_only })}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionHeader
          icon={<Shield className="w-5 h-5" />}
          title="Social accountability"
          gradient="from-orange-500 to-amber-500"
        />
        <p className="text-sm text-slate-400 mb-4">
          Triggers, contacts, and group chat targets live on the Dashboard Accountability tab — single place to edit consent and message templates.
        </p>
        <Link
          href="/dashboard?tab=accountability"
          className="inline-flex items-center gap-2 text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
        >
          Open Accountability
          <ExternalLink className="w-4 h-4" />
        </Link>
      </GlassCard>
    </div>
  );
}
