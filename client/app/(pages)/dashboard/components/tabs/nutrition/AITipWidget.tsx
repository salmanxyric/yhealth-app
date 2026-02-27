"use client";

import { Sparkles } from "lucide-react";
import { MacroTarget } from "./types";

interface AITipWidgetProps {
  macros: Record<string, MacroTarget>;
}

export function AITipWidget({ macros }: AITipWidgetProps) {
  const proteinMacro = macros.protein;
  const isProteinLow = proteinMacro && proteinMacro.current < proteinMacro.target * 0.7;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-violet-500/20 shrink-0">
          <Sparkles className="w-4 h-4 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-white font-medium text-sm mb-1">AI Tip</h4>
          <p className="text-xs text-slate-400 leading-relaxed break-words">
            {isProteinLow
              ? `You're ${Math.round(proteinMacro.target - proteinMacro.current)}g short on protein. Consider adding a protein shake.`
              : "Great job hitting your protein goals! Keep up the consistent nutrition."}
          </p>
        </div>
      </div>
    </div>
  );
}
