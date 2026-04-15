'use client';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { SceneShell } from './_shell';
import { site } from '@/data/siteContent';

export default function Scene05_FeatureGrid() {
  return (
    <SceneShell id="scene-features" ariaLabel="Features" heightVh={110}>
      <div className="relative mx-auto max-w-6xl px-6 h-full flex flex-col justify-center py-24">
        <motion.h2
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl sm:text-5xl font-semibold text-white tracking-tight max-w-3xl mx-auto mb-16"
        >
          {site.features.headline}
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {site.features.cards.map((c, i) => {
            const Ico = (Icons[c.icon as keyof typeof Icons] ?? Icons.Sparkles) as React.ComponentType<{ className?: string }>;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-6 hover:border-cyan-400/30 transition"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20 ring-1 ring-white/10 mb-4">
                  <Ico className="w-5 h-5 text-cyan-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{c.title}</h3>
                <p className="text-sm text-slate-400">{c.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SceneShell>
  );
}
