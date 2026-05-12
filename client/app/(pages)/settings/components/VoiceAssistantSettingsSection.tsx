"use client";

import { MessageSquare } from "lucide-react";
import { LanguageSelector } from "@/components/common/language-selector";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { GlassCard, SectionHeader } from "./SettingsSharedUI";

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
    </div>
  );
}
