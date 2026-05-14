"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Phone, Clock, Plus, X, Bell, BellOff, Music, Play, Square, Check } from "lucide-react";
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
import { useRingtone, type RingtoneOption } from "@/hooks/use-ringtone";

// ============================================
// Ringtone waveform bars (decorative visualizer)
// ============================================
function WaveformBars({ active, color }: { active: boolean; color: string }) {
  const bars = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.35, 0.75, 0.55, 0.8, 0.45];
  return (
    <div className="flex items-end gap-[2px] h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all duration-300 ${color}`}
          style={{
            height: active ? `${h * 100}%` : '16%',
            opacity: active ? 0.9 : 0.25,
            animationName: active ? 'ringtoneWave' : 'none',
            animationDuration: `${0.4 + (i % 3) * 0.15}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ringtoneWave {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// Ringtone selector component
// ============================================
function RingtoneSelector() {
  const { selectedRingtone, ringtones, preview, stop, select } = useRingtone();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePreview = useCallback(
    (ringtoneId: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (playingId === ringtoneId) {
        stop();
        setPlayingId(null);
        return;
      }
      preview(ringtoneId);
      setPlayingId(ringtoneId);
      timeoutRef.current = setTimeout(() => {
        setPlayingId(null);
      }, 4000);
    },
    [playingId, preview, stop],
  );

  const handleSelect = useCallback(
    (ringtoneId: string) => {
      select(ringtoneId);
      toast.success("Ringtone updated");
    },
    [select],
  );

  useEffect(() => {
    return () => {
      stop();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [stop]);

  const gradients: Record<string, { bg: string; bar: string; ring: string; glow: string }> = {
    ring1: { bg: 'from-violet-500/10 to-fuchsia-500/10', bar: 'bg-violet-400', ring: 'ring-violet-500/30 border-violet-500/40', glow: 'shadow-violet-500/20' },
    ring2: { bg: 'from-sky-500/10 to-cyan-500/10', bar: 'bg-sky-400', ring: 'ring-sky-500/30 border-sky-500/40', glow: 'shadow-sky-500/20' },
    ring3: { bg: 'from-emerald-500/10 to-teal-500/10', bar: 'bg-emerald-400', ring: 'ring-emerald-500/30 border-emerald-500/40', glow: 'shadow-emerald-500/20' },
  };

  return (
    <GlassCard>
      <SectionHeader
        icon={<Music className="w-5 h-5" />}
        title="Call Ringtone"
        gradient="from-fuchsia-500 to-pink-500"
      />
      <p className="text-slate-400 text-sm mb-5">
        Choose a ringtone for incoming and outgoing calls.
      </p>

      <div className="grid gap-3">
        {ringtones.map((tone) => {
          const isSelected = selectedRingtone === tone.id;
          const isPlaying = playingId === tone.id;
          const g = gradients[tone.id] || gradients.ring1;

          return (
            <div
              key={tone.id}
              className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? `bg-gradient-to-r ${g.bg} ${g.ring} ring-1 shadow-lg ${g.glow}`
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
              }`}
              onClick={() => handleSelect(tone.id)}
            >
              {/* Play/Stop button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(tone.id);
                }}
                className={`relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isPlaying
                    ? `bg-gradient-to-br ${g.bg} ${g.ring} ring-1`
                    : 'bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08]'
                }`}
                aria-label={isPlaying ? `Stop ${tone.label}` : `Preview ${tone.label}`}
              >
                {isPlaying ? (
                  <Square className="w-4 h-4 text-white fill-current" />
                ) : (
                  <Play className="w-4 h-4 text-slate-300 ml-0.5" />
                )}
              </button>

              {/* Waveform + label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {tone.label}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <WaveformBars active={isPlaying} color={g.bar} />
                </div>
              </div>

              {/* Selection indicator */}
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-400'
                    : 'border-white/20 group-hover:border-white/40'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-black" />}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

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

      {/* Ringtone Section */}
      <RingtoneSelector />

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
