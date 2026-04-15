'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { SceneShell } from './_shell';
import { site } from '@/data/siteContent';

export default function Scene06_LifeAreasCarousel() {
  return (
    <SceneShell id="scene-life-areas" ariaLabel="Life Areas" heightVh={110}>
      <div className="relative mx-auto max-w-6xl px-6 h-full flex flex-col justify-center py-24">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-5xl font-semibold text-white tracking-tight max-w-3xl mx-auto"
          >
            {site.lifeAreasCarousel.headline}
          </motion.h2>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto">{site.lifeAreasCarousel.sub}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {site.lifeAreasCarousel.domains.map((d, i) => {
            const Ico = (Icons[d.icon as keyof typeof Icons] ?? Icons.Target) as React.ComponentType<{ className?: string }>;
            return (
              <motion.div
                key={d.type}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-4 text-left"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-purple-500/20 ring-1 ring-white/10 mb-3">
                  <Ico className="w-4 h-4 text-cyan-300" />
                </div>
                <div className="text-sm font-semibold text-white capitalize">{d.type}</div>
                <p className="mt-1 text-xs text-slate-400">{d.pitch}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            href={site.lifeAreasCarousel.cta.href}
            className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-medium text-white bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/20 transition"
          >
            {site.lifeAreasCarousel.cta.label}
          </Link>
        </div>
      </div>
    </SceneShell>
  );
}
