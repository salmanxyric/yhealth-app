"use client";

import { Target, Flame } from "lucide-react";
import { GlassCard, SectionHeader } from "./SettingsSharedUI";

export function ContractsSettingsSection() {
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<Target className="w-5 h-5" />} title="Accountability Contracts" gradient="from-cyan-500 to-emerald-500" />
        <p className="text-sm text-slate-400 mb-6">Create self-imposed commitment contracts with real consequences to boost your discipline and habit adherence.</p>
        <a href="/contracts" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer"><Target className="w-4 h-4" /> Open Contracts Dashboard</a>
      </GlassCard>
      <GlassCard>
        <h3 className="text-base font-semibold text-white mb-4">How it works</h3>
        <div className="space-y-3">
          {[
            { step: "1", title: "Create a Contract", desc: "Define a condition (e.g. miss gym) and a penalty (e.g. donate 500 PKR)" },
            { step: "2", title: "Sign & Activate", desc: "Formally commit — the contract becomes active and monitored" },
            { step: "3", title: "AI Monitors", desc: "The system checks your activity automatically every 2 hours" },
            { step: "4", title: "Consequences Apply", desc: "Violations trigger your chosen penalty — XP loss, donation pledge, or social alert" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-sm font-bold flex-shrink-0">{item.step}</div>
              <div><p className="text-sm font-medium text-white">{item.title}</p><p className="text-xs text-slate-500 mt-0.5">{item.desc}</p></div>
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-base font-semibold text-white mb-1">AI Suggestions</h3>
        <p className="text-sm text-slate-400 mb-4">The AI analyzes your behavior patterns and suggests personalized contracts — like workout consistency, calorie control, or streak protection.</p>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/15">
          <Flame className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <p className="text-xs text-indigo-300">Suggestions appear on the Contracts dashboard based on your recent activity data.</p>
        </div>
      </GlassCard>
    </div>
  );
}
