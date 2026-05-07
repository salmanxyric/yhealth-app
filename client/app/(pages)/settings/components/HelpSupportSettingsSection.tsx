"use client";

import {
  HelpCircle,
  Mail,
  Shield,
  Lock,
  ExternalLink,
} from "lucide-react";
import { GlassCard, SectionHeader } from "./SettingsSharedUI";

export function HelpSupportSettingsSection() {
  return (
    <div className="space-y-6">
      <GlassCard>
        <SectionHeader icon={<HelpCircle className="w-5 h-5" />} title="Help & Support" gradient="from-sky-500 to-blue-500" />
        <p className="text-sm text-slate-400 mb-6">Get help, browse FAQs, or reach out to our support team.</p>
        <div className="space-y-3">
          {[
            { label: "FAQ", desc: "Frequently asked questions", href: "/faq", icon: <HelpCircle className="w-4 h-4 text-sky-400" /> },
            { label: "Help Center", desc: "Guides and tutorials", href: "/help", icon: <HelpCircle className="w-4 h-4 text-blue-400" /> },
            { label: "Contact Support", desc: "Reach out to our team", href: "/contact", icon: <Mail className="w-4 h-4 text-indigo-400" /> },
            { label: "Terms of Service", desc: "Review terms and conditions", href: "/terms", icon: <Shield className="w-4 h-4 text-slate-400" /> },
            { label: "Privacy Policy", desc: "How we handle your data", href: "/privacy", icon: <Lock className="w-4 h-4 text-rose-400" /> },
          ].map((item) => (
            <a key={item.href} href={item.href} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center">{item.icon}</div>
                <div><p className="text-sm font-medium text-white">{item.label}</p><p className="text-xs text-slate-500">{item.desc}</p></div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </a>
          ))}
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-base font-semibold text-white mb-3">App Info</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"><span className="text-sm text-slate-400">Version</span><span className="text-sm text-white font-mono">1.0.0-beta</span></div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"><span className="text-sm text-slate-400">Platform</span><span className="text-sm text-white">Web</span></div>
        </div>
      </GlassCard>
    </div>
  );
}
