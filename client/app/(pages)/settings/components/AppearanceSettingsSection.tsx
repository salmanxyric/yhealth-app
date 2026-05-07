"use client";

import { Palette, Sun, Moon, Settings } from "lucide-react";
import type { PreferencesProps } from "./settings-types";
import { ToggleSwitch, GlassCard, SectionHeader } from "./SettingsSharedUI";

export function AppearanceSettingsSection({
  preferences,
  updatePreference,
}: PreferencesProps) {
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<Palette className="w-5 h-5" />} title="Theme" gradient="from-orange-500 to-amber-500" />
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
            { id: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
            { id: "system", label: "System", icon: <Settings className="w-5 h-5" /> },
          ].map((theme) => {
            const isSelected = preferences.appearance.theme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => updatePreference("appearance", "theme", theme.id)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  isSelected
                    ? "bg-white/[0.06] border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className={isSelected ? "text-sky-400" : "text-slate-400"}>{theme.icon}</span>
                  <span className={isSelected ? "text-white" : "text-slate-300"}>{theme.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </GlassCard>
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Compact Mode</h2>
            <p className="text-sm text-slate-400 mt-1">Use a more condensed layout</p>
          </div>
          <ToggleSwitch
            checked={preferences.appearance.compactMode}
            onChange={() => updatePreference("appearance", "compactMode", !preferences.appearance.compactMode)}
          />
        </div>
      </GlassCard>
    </div>
  );
}
