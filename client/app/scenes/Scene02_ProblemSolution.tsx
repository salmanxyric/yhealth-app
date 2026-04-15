'use client';
import { motion } from 'framer-motion';
import { SceneShell } from './_shell';
import { site } from '@/data/siteContent';

export default function Scene02_ProblemSolution() {
  return (
    <SceneShell id="scene-problem-solution" ariaLabel="Problem and Solution" heightVh={110}>
      <div className="relative mx-auto max-w-6xl px-6 h-full flex flex-col justify-center py-24">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.6 }}
          className="text-center text-3xl sm:text-5xl font-semibold text-white tracking-tight max-w-3xl mx-auto"
        >
          {site.problemSolution.headline}
        </motion.h2>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent -translate-x-1/2" />

          <div className="space-y-4">
            <div className="text-xs uppercase tracking-[0.3em] text-red-300/80">Problem</div>
            {site.problemSolution.rows.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-slate-300"
              >
                {r.problem}
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">yHealth Solution</div>
            {site.problemSolution.rows.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 0.5, delay: i * 0.1 + 0.15 }}
                className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 backdrop-blur-sm p-4 text-white shadow-lg shadow-cyan-500/10"
              >
                {r.solution}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SceneShell>
  );
}
