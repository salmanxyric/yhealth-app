'use client';
import { motion } from 'framer-motion';
import { SceneShell, Scene3D } from './_shell';
import { site } from '@/data/siteContent';

export default function Scene04_DeviceShowcase() {
  return (
    <SceneShell id="scene-devices" ariaLabel="Devices" heightVh={110}>
      <div className="relative mx-auto max-w-6xl px-6 h-full flex flex-col justify-center py-24">
        <motion.h2
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl sm:text-5xl font-semibold text-white tracking-tight max-w-3xl mx-auto mb-16"
        >
          {site.devices.headline}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.8 }}
          className="relative h-[420px]"
        >
          <Scene3D kind="devices" />
        </motion.div>
        <div className="mt-8 flex items-center justify-center gap-2">
          {site.devices.states.map((s) => (
            <span key={s} className="text-[11px] uppercase tracking-wider text-slate-400 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {s}
            </span>
          ))}
        </div>
      </div>
    </SceneShell>
  );
}
