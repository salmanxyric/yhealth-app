'use client';
import { motion } from 'framer-motion';
import { SceneShell } from './_shell';
import { site } from '@/data/siteContent';

export default function Scene08_Testimonials() {
  return (
    <SceneShell id="scene-testimonials" ariaLabel="Testimonials" heightVh={110}>
      <div className="relative mx-auto max-w-6xl px-6 h-full flex flex-col justify-center py-24">
        <motion.h2
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl sm:text-5xl font-semibold text-white tracking-tight max-w-3xl mx-auto mb-16"
        >
          {site.testimonials.headline}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {site.testimonials.items.map((t, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 24, rotate: i === 1 ? 0 : (i === 0 ? -2 : 2) }}
              whileInView={{ opacity: 1, y: 0, rotate: i === 1 ? 0 : (i === 0 ? -1 : 1) }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              whileHover={{ rotate: 0, y: -4 }}
              className={`rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-sm p-6 ${i === 1 ? 'md:scale-105 border-cyan-400/30 shadow-lg shadow-cyan-500/10' : ''}`}
            >
              <blockquote className="text-white text-base leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-4 text-sm text-slate-400">
                <span className="text-slate-200 font-medium">{t.author}</span> &middot; {t.role}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </SceneShell>
  );
}
