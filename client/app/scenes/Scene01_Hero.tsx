'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Scene3D, SceneShell } from './_shell';
import { site } from '@/data/siteContent';
import { useMouseParallax } from '@/hooks/use-mouse-parallax';

export default function Scene01_Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { x, y, handleMouseMove, handleMouseLeave } = useMouseParallax(containerRef, {
    strength: 20,
    damping: 18,
  });

  return (
    <SceneShell
      id="scene-hero"
      ariaLabel="Hero"
      heightVh={110}
      start="top top"
      end="bottom top"
      scrub={1}
      build={(tl) => {
        tl.fromTo(
          '.hero-orb',
          { scale: 1, y: 0, filter: 'blur(0px)', opacity: 1 },
          { scale: 1.15, y: -40, filter: 'blur(2px)', opacity: 0.85, ease: 'power2.in' },
          0,
        );
        tl.fromTo('.hero-text', { y: 0, opacity: 1 }, { y: -80, opacity: 0.1, ease: 'power2.in' }, 0);
      }}
      className="bg-[#0B0F17]"
    >
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="absolute inset-0"
      >
        {/* ambient gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-[32rem] h-[32rem] rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-[32rem] h-[32rem] rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        {/* 3D center stage with mouse parallax via framer-motion values */}
        <motion.div
          className="hero-orb absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ x, y, willChange: 'transform' }}
        >
          <Scene3D kind="health-core" />
        </motion.div>

        {/* text layer */}
        <div className="hero-text relative z-10 mx-auto max-w-6xl px-6 h-full flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {site.hero.eyebrow}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="mt-5 text-5xl sm:text-7xl lg:text-8xl font-semibold text-white tracking-tight max-w-4xl"
            style={{ textShadow: '0 8px 48px rgba(34,211,238,0.15)' }}
          >
            {site.hero.headline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-5 text-base sm:text-lg text-slate-300 max-w-xl"
          >
            {site.hero.sub}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3"
          >
            <Link
              href={site.hero.ctaPrimary.href}
              className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-medium text-white bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-lg shadow-cyan-500/20 transition"
            >
              {site.hero.ctaPrimary.label}
            </Link>
            <Link
              href={site.hero.ctaSecondary.href}
              className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-medium text-slate-200 border border-white/10 hover:bg-white/5 backdrop-blur transition"
            >
              {site.hero.ctaSecondary.label}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-slate-500"
          >
            Scroll
          </motion.div>
        </div>
      </div>
    </SceneShell>
  );
}
