"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Check,
  Sparkles,
  MessageCircle,
  Focus,
} from "lucide-react";
import { CoachPersonaPicker } from "@/components/coach/CoachPersonaPicker";
import { coachingStyleForPersona } from "@shared/types/domain/coach-persona";
import type { PreferencesWithSetterProps } from "./settings-types";
import {
  intensityLevels,
  formalityOptions,
  encouragementOptions,
  messageStyleOptions,
  availableFocusAreas,
} from "./settings-constants";
import { SegmentedControl, ToggleSwitch, GlassCard, SectionHeader } from "./SettingsSharedUI";

interface AICoachSettingsSectionProps extends PreferencesWithSetterProps {
  isSaving: boolean;
}

export function AICoachSettingsSection({
  preferences,
  updatePreference,
  setPreferences,
  isSaving,
}: AICoachSettingsSectionProps) {
  const toggleFocusArea = (area: string) => {
    setPreferences((prev) => {
      const current = prev.coaching.focusAreas;
      if (current.includes(area)) {
        return {
          ...prev,
          coaching: {
            ...prev.coaching,
            focusAreas: current.filter((a) => a !== area),
          },
        };
      }
      if (current.length >= 5) return prev;
      return {
        ...prev,
        coaching: {
          ...prev.coaching,
          focusAreas: [...current, area],
        },
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Coaching Style & Intensity */}
      <GlassCard>
        <SectionHeader
          icon={<Sparkles className="w-5 h-5" />}
          title="Coach personality & engagement"
          gradient="from-sky-500 to-emerald-600"
        />

        <div className="mb-8">
          <CoachPersonaPicker
            value={preferences.coaching.aiCoachPersona}
            disabled={isSaving}
            onChange={(id) => {
              setPreferences((prev) => ({
                ...prev,
                coaching: {
                  ...prev.coaching,
                  aiCoachPersona: id,
                  style: coachingStyleForPersona(id),
                },
              }));
            }}
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-3 block font-medium">
            Engagement Level
          </label>
          <SegmentedControl
            options={intensityLevels}
            value={preferences.coaching.intensity}
            onChange={(id) => updatePreference("coaching", "intensity", id)}
          />
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-2 block">
              Preferred Check-in Time
            </label>
            <input
              type="time"
              value={preferences.coaching.preferredCheckInTime}
              onChange={(e) =>
                updatePreference("coaching", "preferredCheckInTime", e.target.value)
              }
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white outline-none focus:border-sky-500 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-slate-400 mb-2 block">
              Timezone
            </label>
            <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-500" />
              <span className="truncate text-sm">{preferences.coaching.timezone}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Card 2: Communication Preferences */}
      <GlassCard>
        <SectionHeader
          icon={<MessageCircle className="w-5 h-5" />}
          title="Communication Preferences"
          gradient="from-blue-500 to-cyan-500"
        />

        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-3 block font-medium">
            Formality Level
          </label>
          <SegmentedControl
            options={formalityOptions}
            value={preferences.coaching.formalityLevel}
            onChange={(id) => updatePreference("coaching", "formalityLevel", id)}
          />
          <motion.div
            key={preferences.coaching.formalityLevel}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
          >
            <p className="text-sm text-slate-400 italic">
              &quot;{formalityOptions.find((o) => o.id === preferences.coaching.formalityLevel)?.preview}&quot;
            </p>
          </motion.div>
        </div>

        <div className="mb-6">
          <label className="text-sm text-slate-400 mb-3 block font-medium">
            Encouragement Level
          </label>
          <SegmentedControl
            options={encouragementOptions}
            value={preferences.coaching.encouragementLevel}
            onChange={(id) => updatePreference("coaching", "encouragementLevel", id)}
          />
        </div>

        <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div>
            <p className="text-white font-medium">Use Emojis</p>
            <p className="text-sm text-slate-400 mt-0.5">
              Allow emojis in coach messages
            </p>
          </div>
          <ToggleSwitch
            checked={preferences.coaching.useEmojis}
            onChange={() =>
              updatePreference("coaching", "useEmojis", !preferences.coaching.useEmojis)
            }
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-3 block font-medium">
            Message Style
          </label>
          <div className="grid sm:grid-cols-3 gap-3">
            {messageStyleOptions.map((style) => {
              const isSelected = preferences.coaching.messageStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => updatePreference("coaching", "messageStyle", style.id)}
                  className={`relative p-4 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "bg-white/[0.06] border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`p-2.5 rounded-xl bg-gradient-to-br ${style.gradient} shadow-lg ${
                        isSelected ? "" : "opacity-60"
                      }`}
                    >
                      <span className="text-white">{style.icon}</span>
                    </div>
                    <span className={`font-medium text-sm ${isSelected ? "text-white" : "text-slate-300"}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-slate-500">{style.description}</span>
                  </div>
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-sky-400" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Card 3: Focus Areas */}
      <GlassCard>
        <SectionHeader
          icon={<Focus className="w-5 h-5" />}
          title="Focus Areas"
          gradient="from-emerald-500 to-teal-500"
        />
        <p className="text-sm text-slate-400 mb-4">
          Select up to 5 areas your coach should prioritize.{" "}
          <span className="text-slate-500">(max 5)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {availableFocusAreas.map((area) => {
            const isSelected = preferences.coaching.focusAreas.includes(area);
            const isDisabled = !isSelected && preferences.coaching.focusAreas.length >= 5;
            return (
              <button
                key={area}
                onClick={() => toggleFocusArea(area)}
                disabled={isDisabled}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-gradient-to-r from-sky-500/30 to-emerald-600/30 text-white border border-sky-500/40 ring-1 ring-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.1)]"
                    : isDisabled
                    ? "bg-white/[0.02] border border-white/[0.04] text-slate-600 cursor-not-allowed"
                    : "bg-white/[0.02] border border-white/[0.08] text-slate-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1.5 -mt-0.5" />}
                {area}
              </button>
            );
          })}
        </div>
        {preferences.coaching.focusAreas.length > 0 && (
          <p className="text-xs text-slate-500 mt-3">
            {preferences.coaching.focusAreas.length}/5 selected
          </p>
        )}
      </GlassCard>
    </div>
  );
}
