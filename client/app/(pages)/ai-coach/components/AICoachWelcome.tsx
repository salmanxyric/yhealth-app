"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Utensils, Moon, Heart, Dumbbell, Calendar, Sparkles, AlertCircle, Wallet, TrendingUp } from "lucide-react";
import { dataSourceService, DailyCorrelation } from "@/src/shared/services/data-source.service";

interface AICoachWelcomeProps {
  onSuggestionClick: (text: string) => void;
}

const BASE_SUGGESTIONS = [
  { text: "What should I eat today?", icon: Utensils },
  { text: "How am I doing financially?", icon: Wallet },
  { text: "Tips for stress management", icon: Heart },
  { text: "Create a workout plan", icon: Dumbbell },
  { text: "How can I sleep better?", icon: Moon },
  { text: "Show me my spending breakdown", icon: TrendingUp },
];

function getContextualGreeting(c: DailyCorrelation): string {
  if (c.stressScore > 70 && c.calendarLoad > 4)
    return `Looks like a packed day with ${c.calendarLoad} events. I'm here for a quick chat whenever you need it.`;
  if (c.moodScore > 70)
    return "You seem to be in great spirits today! Let's keep that momentum going.";
  if (c.prayerAdherence > 80)
    return "Mashallah, great consistency with your prayers today. How else can I help?";
  if (c.stressScore > 50)
    return "I notice you might be feeling a bit stressed. Want to talk about what's on your mind?";
  return "How can I help you today?";
}

export function AICoachWelcome({ onSuggestionClick }: AICoachWelcomeProps) {
  const [correlation, setCorrelation] = useState<DailyCorrelation | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    dataSourceService.getDailyCorrelation(today).then(setCorrelation).catch(() => {});
  }, []);

  const suggestions = useMemo(() => {
    if (!correlation) return BASE_SUGGESTIONS;
    const extra: typeof BASE_SUGGESTIONS = [];
    if (correlation.stressScore > 70)
      extra.push({ text: "I had a stressful day", icon: AlertCircle });
    if (correlation.calendarLoad > 4)
      extra.push({ text: "Help me plan around my schedule", icon: Calendar });
    if (correlation.prayerAdherence > 80)
      extra.push({ text: "Suggest a spiritual routine", icon: Sparkles });
    return [...extra, ...BASE_SUGGESTIONS].slice(0, 4);
  }, [correlation]);

  return (
    <div className="flex flex-col items-center gap-[30px] w-full max-w-[579px] mx-auto pt-[101px]">
      {/* Header section */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Green sphere */}
        <div className="relative w-[172px] h-[89px] overflow-hidden">
          <Image
            src="/chatai/Green-Sun.jpg 1.svg"
            alt=""
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Heading */}
        <h1 className="text-[32px] font-normal text-white leading-[1.2] whitespace-nowrap">
          How can I help you today?
        </h1>

        {/* Description */}
        <p className="text-[18px] text-[#9EA2AE] text-center leading-[26px] tracking-[-0.72px] w-full">
          I&apos;m <span className="italic">Cia</span>, your AI life coach. Ask me about health, fitness, nutrition, finances, career, habits, or anything that matters to you.
        </p>
      </div>

      {/* Contextual greeting based on daily correlation */}
      {correlation && (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 w-full">
          <p className="text-sm text-slate-300">
            {getContextualGreeting(correlation)}
          </p>
          {correlation.correlations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {correlation.correlations.slice(0, 3).map((c, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-700/50 text-slate-400">
                  {c.description}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestion badges - 2x2 grid */}
      <div className="flex gap-[17px] w-full">
        {/* Left column */}
        <div className="flex flex-col flex-1 gap-[17px] min-w-0">
          {suggestions.filter((_, i) => i % 2 === 0).map((s) => (
            <button
              key={s.text}
              onClick={() => onSuggestionClick(s.text)}
              className="flex items-center justify-center gap-[6px] h-[62px] w-full bg-[#02091b] border-[1.8px] border-white/[0.14] rounded-[16px] px-[14.8px] py-[3.8px] overflow-hidden hover:border-white/25 hover:bg-[#030c22] transition-colors"
            >
              <s.icon className="w-[18px] h-[18px] text-white/80 shrink-0" />
              <span className="text-[16px] text-white/80 font-normal leading-[24px] whitespace-nowrap">
                {s.text}
              </span>
            </button>
          ))}
        </div>

        {/* Right column */}
        <div className="flex flex-col flex-1 gap-[17px] min-w-0">
          {suggestions.filter((_, i) => i % 2 === 1).map((s) => (
            <button
              key={s.text}
              onClick={() => onSuggestionClick(s.text)}
              className="flex items-center justify-center gap-[6px] h-[62px] w-full bg-[#02091b] border-[1.8px] border-white/[0.14] rounded-[16px] px-[14.8px] py-[3.8px] overflow-hidden hover:border-white/25 hover:bg-[#030c22] transition-colors"
            >
              <s.icon className="w-[18px] h-[18px] text-white/80 shrink-0" />
              <span className="text-[16px] text-white/80 font-normal leading-[24px] whitespace-nowrap">
                {s.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
