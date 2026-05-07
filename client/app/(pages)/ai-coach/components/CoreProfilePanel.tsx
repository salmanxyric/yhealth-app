"use client";

import { useState } from "react";
import {
  Heart,
  Target,
  ShieldAlert,
  Settings2,
  Stethoscope,
  Activity,
  AlertTriangle,
  Pencil,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type {
  CoreProfile,
  CoreProfileEntry,
  CoreSection,
} from "@shared/types/domain/intelligence-files";

const SECTION_CONFIG: Record<CoreSection, { icon: LucideIcon; label: string; accent: string }> = {
  biometrics: { icon: Heart, label: "Biometrics", accent: "text-rose-400" },
  targets: { icon: Target, label: "Targets", accent: "text-amber-400" },
  constraints: { icon: ShieldAlert, label: "Constraints", accent: "text-red-400" },
  preferences: { icon: Settings2, label: "Preferences", accent: "text-blue-400" },
  medical: { icon: Stethoscope, label: "Medical", accent: "text-pink-400" },
  lifestyle: { icon: Activity, label: "Lifestyle", accent: "text-emerald-400" },
};

const SECTIONS: CoreSection[] = ["biometrics", "targets", "constraints", "preferences", "medical", "lifestyle"];

interface CoreProfilePanelProps {
  profile: CoreProfile;
  onUpdate?: (section: CoreSection, key: string, value: unknown, unit?: string) => void;
}

export function CoreProfilePanel({ profile, onUpdate }: CoreProfilePanelProps) {
  return (
    <div className="space-y-4">
      {/* Missing fields warning */}
      {profile.missingFields.length > 0 && (
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Missing Data</span>
          </div>
          <div className="space-y-1">
            {profile.missingFields.slice(0, 5).map((f) => (
              <div key={`${f.section}:${f.key}`} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {f.key.replace(/_/g, " ")}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    f.impact === "high"
                      ? "text-red-400 bg-red-500/10"
                      : f.impact === "medium"
                        ? "text-amber-400 bg-amber-500/10"
                        : "text-slate-400 bg-white/5"
                  }`}
                >
                  {f.impact} impact
                </span>
              </div>
            ))}
            {profile.missingFields.length > 5 && (
              <span className="text-[10px] text-slate-500">
                +{profile.missingFields.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sections */}
      {SECTIONS.map((section) => {
        const entries = profile[section];
        if (entries.length === 0) return null;
        const config = SECTION_CONFIG[section];
        const Icon = config.icon;

        return (
          <div key={section}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-3.5 h-3.5 ${config.accent}`} />
              <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                {config.label}
              </span>
              <span className="text-[10px] text-slate-600">({entries.length})</span>
            </div>
            <div className="space-y-1.5">
              {entries.map((entry) => (
                <CoreEntryRow key={entry.id} entry={entry} onUpdate={onUpdate} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CoreEntryRow({
  entry,
  onUpdate,
}: {
  entry: CoreProfileEntry;
  onUpdate?: (section: CoreSection, key: string, value: unknown, unit?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const displayValue =
    typeof entry.value === "object" ? JSON.stringify(entry.value) : String(entry.value);

  const handleSave = async () => {
    if (!onUpdate) return;
    let parsed: unknown = editValue;
    try {
      parsed = JSON.parse(editValue);
    } catch {
      // keep as string
    }
    onUpdate(entry.section, entry.key, parsed, entry.unit || undefined);
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04] group">
      <div className="flex-1 min-w-0">
        <span className="text-xs text-slate-400">{entry.key.replace(/_/g, " ")}</span>
        {editing ? (
          <div className="flex items-center gap-1 mt-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 text-sm text-white bg-white/5 border border-white/10 rounded px-2 py-0.5 outline-none focus:border-blue-500/50"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            />
            <button onClick={handleSave} className="p-1 hover:bg-white/5 rounded transition-colors">
              <Check className="w-3 h-3 text-emerald-400" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1 hover:bg-white/5 rounded transition-colors">
              <X className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-medium text-white">{displayValue}</span>
            {entry.unit && <span className="text-[10px] text-slate-500">{entry.unit}</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16">
          <ConfidenceBadge confidence={entry.confidence} size="sm" />
        </div>
        {onUpdate && !editing && (
          <button
            onClick={() => { setEditValue(displayValue); setEditing(true); }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-all"
          >
            <Pencil className="w-3 h-3 text-slate-500" />
          </button>
        )}
      </div>
    </div>
  );
}
