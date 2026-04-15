'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SceneShell } from './_shell';
import { site } from '@/data/siteContent';

export default function Scene09_FinalCTA() {
  return (
    <SceneShell id="scene-final-cta" ariaLabel="Final Call To Action" heightVh={110}>
      <div className="relative mx-auto max-w-4xl px-6 h-full flex flex-col items-center justify-center text-center py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.18),transparent_60%)] pointer-events-none"
        />
        <motion.h2
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8 }}
          className="relative text-4xl sm:text-6xl font-semibold text-white tracking-tight"
          style={{ textShadow: '0 8px 48px rgba(34,211,238,0.25)' }}
        >
          {site.finalCta.headline}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative mt-5 text-slate-300"
        >
          {site.finalCta.sub}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative mt-8 flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href={site.finalCta.ctaPrimary.href}
            className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-medium text-white bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/30 transition"
          >
            {site.finalCta.ctaPrimary.label}
          </Link>
          <Link
            href={site.finalCta.ctaSecondary.href}
            className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-medium text-slate-200 border border-white/10 hover:bg-white/5 backdrop-blur transition"
          >
            {site.finalCta.ctaSecondary.label}
          </Link>
        </motion.div>
      </div>
    </SceneShell>
  );
}
