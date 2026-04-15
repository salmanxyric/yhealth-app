'use client';
import { motion } from 'framer-motion';
import { SceneShell } from './_shell';
import { site } from '@/data/siteContent';
import { Activity, Moon, Flame } from 'lucide-react';

const ICONS = { line: Activity, radial: Moon, heat: Flame } as const;

export default function Scene03_AIDashboard() {
  return (
    <SceneShell id="scene-ai-dashboard" ariaLabel="AI Dashboard" heightVh={110}>
      <div className="relative mx-auto max-w-6xl px-6 h-full flex flex-col justify-center py-24">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-300/80 mb-3">{site.aiDashboard.eyebrow}</div>
          <motion.h2
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl font-semibold text-white tracking-tight max-w-3xl mx-auto"
          >
            {site.aiDashboard.headline}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-6"
          >
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">Biometrics (7d)</div>
            <svg viewBox="0 0 400 160" className="w-full h-40">
              <defs>
                <linearGradient id="chart-g" x1="0" x2="1">
                  <stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <motion.path
                d="M0,110 C40,90 80,130 120,100 C160,70 200,120 240,80 C280,50 320,90 400,40"
                fill="none" stroke="url(#chart-g)" strokeWidth="2.5"
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
              />
            </svg>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {site.aiDashboard.metrics.map((m, i) => {
                const Ico = ICONS[m.kind as keyof typeof ICONS] ?? Activity;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-5%' }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-center"
                  >
                    <Ico className="w-4 h-4 mx-auto text-cyan-300 mb-1" />
                    <div className="text-[11px] text-slate-400">{m.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Chat panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-6 flex flex-col gap-3"
          >
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Coach</div>
            {site.aiDashboard.chatTurns.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.35 }}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${t.role === 'user' ? 'self-end bg-cyan-500/20 text-white border border-cyan-400/30' : 'self-start bg-white/5 text-slate-200 border border-white/10'}`}
              >
                {t.text}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </SceneShell>
  );
}
