"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Phone, Clock, Plus, X, Bell, BellOff } from "lucide-react";
import { LanguageSelector } from "@/components/common/language-selector";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { GlassCard, SectionHeader } from "./SettingsSharedUI";
import {
  voiceScheduleService,
  type AICallFrequency,
  type VoiceSchedulePreferences,
  getShortDayName,
  formatScheduleTime as formatTime,
} from "@/src/shared/services/voice-schedule.service";

interface VoiceAssistantSettingsSectionProps {
  assistantName: string;
  setAssistantName: (name: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
}

export function VoiceAssistantSettingsSection({
  assistantName,
  setAssistantName,
  selectedLanguage,
  setSelectedLanguage,
}: VoiceAssistantSettingsSectionProps) {
  const [prefs, setPrefs] = useState<VoiceSchedulePreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    voiceScheduleService.getPreferences().then((res) => {
      if (res.success && res.data) setPrefs(res.data);
    });
  }, []);

  const updateSchedule = async (updates: Partial<VoiceSchedulePreferences>) => {
    setIsSaving(true);
    try {
      const res = await voiceScheduleService.updateScheduleSettings(updates);
      if (res.success && res.data) {
        setPrefs(prev => prev ? { ...prev, ...res.data } : prev);
      }
    } catch {
      toast.error("Failed to update schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFrequencyChange = (frequency: AICallFrequency) => {
    setPrefs(prev => prev ? { ...prev, aiCallFrequency: frequency } : prev);
    updateSchedule({ aiCallFrequency: frequency });
  };

  const handleAddCallTime = (time: string) => {
    if (!prefs || prefs.preferredCallTimes.includes(time)) return;
    const newTimes = [...prefs.preferredCallTimes, time].sort();
    setPrefs(prev => prev ? { ...prev, preferredCallTimes: newTimes } : prev);
    updateSchedule({ preferredCallTimes: newTimes });
    toast.success("Call time added");
  };

  const handleRemoveCallTime = (time: string) => {
    if (!prefs) return;
    const newTimes = prefs.preferredCallTimes.filter((t) => t !== time);
    setPrefs(prev => prev ? { ...prev, preferredCallTimes: newTimes } : prev);
    updateSchedule({ preferredCallTimes: newTimes });
  };

  const handleQuietHoursToggle = () => {
    if (!prefs) return;
    const val = !prefs.quietHoursEnabled;
    setPrefs(prev => prev ? { ...prev, quietHoursEnabled: val } : prev);
    updateSchedule({ quietHoursEnabled: val });
  };

  const handleQuietHoursChange = (field: "quietHoursStart" | "quietHoursEnd", value: string) => {
    setPrefs(prev => prev ? { ...prev, [field]: value } : prev);
    updateSchedule({ [field]: value });
  };

  const handleDndDayToggle = (day: number) => {
    if (!prefs) return;
    const newDays = prefs.dndDays.includes(day) ? prefs.dndDays.filter((d) => d !== day) : [...prefs.dndDays, day];
    setPrefs(prev => prev ? { ...prev, dndDays: newDays } : prev);
    updateSchedule({ dndDays: newDays });
  };

  const frequencyOptions: { id: AICallFrequency; label: string; desc: string }[] = [
    { id: "off", label: "Off", desc: "AI will never call you" },
    { id: "minimal", label: "Minimal", desc: "1-2 calls per week" },
    { id: "moderate", label: "Moderate", desc: "3-4 calls per week" },
    { id: "proactive", label: "Proactive", desc: "5-7 calls per week" },
  ];

  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<MessageSquare className="w-5 h-5" />} title="Voice Assistant" gradient="from-indigo-500 to-violet-500" />
        <p className="text-slate-400 text-sm mb-6">Customize your AI coach name and language for the voice assistant.</p>
        <div className="space-y-6">
          <div>
            <label htmlFor="assistant-name" className="block text-sm font-medium text-white mb-2">Assistant name</label>
            <input
              id="assistant-name"
              type="text"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              onBlur={async () => {
                try {
                  await api.patch("/preferences", { voiceAssistant: { assistantName: assistantName.trim() || "Cia" } });
                  toast.success("Assistant name saved");
                } catch (err) {
                  console.error("Failed to save assistant name:", err);
                  toast.error("Failed to save assistant name");
                }
              }}
              placeholder="e.g. Balencia Coach"
              className="w-full max-w-md px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-colors"
            />
            <p className="text-slate-500 text-xs mt-1">This name is shown in the voice assistant and the coach will call itself by this name (e.g. &quot;{assistantName} is ready. Tap to start&quot;).</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Language</label>
            <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} compact={false} showPreview={true} />
            <p className="text-slate-500 text-xs mt-2">The assistant will speak and listen in the selected language.</p>
          </div>
        </div>
      </GlassCard>

      {/* Call Schedule Section */}
      {prefs && (
        <GlassCard>
          <SectionHeader icon={<Phone className="w-5 h-5" />} title="Call Schedule" gradient="from-sky-500 to-blue-600" />
          <p className="text-slate-400 text-sm mb-6">Configure when your AI coach calls you for check-ins.</p>
          <div className="space-y-6">
            {/* AI Call Frequency */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">Call Frequency</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {frequencyOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleFrequencyChange(opt.id)}
                    disabled={isSaving}
                    className={`p-3 rounded-xl text-left transition-all ${
                      prefs.aiCallFrequency === opt.id
                        ? "bg-sky-500/20 border-2 border-sky-500/50 ring-1 ring-sky-500/20"
                        : "bg-white/[0.03] border-2 border-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Call Times */}
            {prefs.aiCallFrequency !== "off" && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <label className="block text-sm font-medium text-white">Preferred Call Times</label>
                </div>
                <p className="text-slate-500 text-xs mb-3">Set specific times for your AI coach to call you.</p>

                {prefs.preferredCallTimes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {prefs.preferredCallTimes.map((time) => (
                      <div key={time} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30">
                        <Clock className="w-3 h-3 text-sky-400" />
                        <span className="text-sm text-white">{formatTime(time)}</span>
                        <button onClick={() => handleRemoveCallTime(time)} className="p-0.5 rounded hover:bg-white/10 transition-colors">
                          <X className="w-3 h-3 text-slate-400 hover:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 max-w-xs">
                  <input
                    type="time"
                    id="settings-new-call-time"
                    defaultValue="09:00"
                    className="flex-1 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-colors"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById("settings-new-call-time") as HTMLInputElement;
                      if (input?.value) handleAddCallTime(input.value);
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 text-sm font-medium hover:bg-sky-500/30 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {prefs.preferredCallTimes.length === 0 && (
                  <p className="text-xs text-slate-500 mt-2">No call times set. Add times above to receive AI coach check-ins.</p>
                )}
              </div>
            )}

            {/* Quiet Hours */}
            {prefs.aiCallFrequency !== "off" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {prefs.quietHoursEnabled ? <BellOff className="w-4 h-4 text-sky-400" /> : <Bell className="w-4 h-4 text-slate-400" />}
                    <span className="text-sm font-medium text-white">Quiet Hours</span>
                  </div>
                  <button
                    onClick={handleQuietHoursToggle}
                    disabled={isSaving}
                    className={`relative w-11 h-6 rounded-full transition-colors ${prefs.quietHoursEnabled ? "bg-sky-500" : "bg-slate-600"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${prefs.quietHoursEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {prefs.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-3 max-w-xs">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">From</label>
                      <input
                        type="time"
                        value={prefs.quietHoursStart}
                        onChange={(e) => handleQuietHoursChange("quietHoursStart", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">To</label>
                      <input
                        type="time"
                        value={prefs.quietHoursEnd}
                        onChange={(e) => handleQuietHoursChange("quietHoursEnd", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DND Days */}
            {prefs.aiCallFrequency !== "off" && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Do Not Disturb Days</label>
                <div className="flex gap-1.5 max-w-sm">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      onClick={() => handleDndDayToggle(day)}
                      disabled={isSaving}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        prefs.dndDays.includes(day)
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      {getShortDayName(day)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Your AI coach won&apos;t call you on selected days.</p>
              </div>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
