'use client';
import { motion } from 'framer-motion';
import { SceneShell } from './_shell';
import { site } from '@/data/siteContent';

export default function Scene07_DataFlow() {
  return (
    <SceneShell id="scene-data-flow" ariaLabel="Data Flow" heightVh={110}>
      <div className="relative mx-auto max-w-6xl px-6 h-full flex flex-col justify-center py-24">
        <motion.h2
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl sm:text-5xl font-semibold text-white tracking-tight max-w-3xl mx-auto mb-16"
        >
          {site.dataFlow.headline}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {site.dataFlow.nodes.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-5 text-center"
            >
              <div className="mx-auto w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold mb-3">
                {i + 1}
              </div>
              <div className="text-sm font-semibold text-white">{n.label}</div>
              <p className="mt-1 text-xs text-slate-400">{n.desc}</p>
              {i < site.dataFlow.nodes.length - 1 && (
                <div className="hidden md:block absolute right-[-12px] top-1/2 -translate-y-1/2 w-6 h-px bg-gradient-to-r from-cyan-400/60 to-purple-400/60" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </SceneShell>
  );
}
