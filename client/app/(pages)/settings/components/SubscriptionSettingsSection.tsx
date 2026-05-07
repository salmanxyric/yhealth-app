"use client";

import { CreditCard, ExternalLink } from "lucide-react";
import { GlassCard, SectionHeader } from "./SettingsSharedUI";

export function SubscriptionSettingsSection() {
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<CreditCard className="w-5 h-5" />} title="Subscription & Billing" gradient="from-amber-500 to-yellow-500" />
        <p className="text-sm text-slate-400 mb-6">Manage your subscription plan, billing information, and payment history.</p>
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 mb-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-semibold text-white">Current Plan</p><p className="text-xs text-amber-400 mt-0.5">Free Plan — Basic features</p></div>
            <a href="/subscription" className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-sm font-medium transition-colors border border-amber-500/20">Upgrade</a>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { label: "View Plans & Pricing", href: "/subscription" },
            { label: "Billing History", href: "/subscription?tab=billing" },
            { label: "Manage Payment Method", href: "/subscription?tab=payment" },
          ].map((link) => (
            <a key={link.href} href={link.href} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group">
              <span className="text-sm text-slate-300">{link.label}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </a>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
