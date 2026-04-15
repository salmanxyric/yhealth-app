'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Persistent liquid-blob backdrop rendered once at the page level.
 * Sits behind all scenes (position: fixed; inset: 0; z: -10).
 * Scroll progress morphs blob colors + position for a cinematic through-line.
 *
 * This is a coded placeholder for a future Spline scene. When a Spline
 * URL is available, swap this for <Scene3D splineUrl="..." /> inside a
 * <div className="fixed inset-0 -z-10"> wrapper.
 */
export function LiquidBackdrop() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    function update() {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setScrollProgress(Math.min(1, Math.max(0, window.scrollY / max)));
      raf = requestAnimationFrame(update);
    }
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Color interpolation across scenes.
  const hue1 = 195 + scrollProgress * 80; // cyan -> purple
  const hue2 = 270 - scrollProgress * 40; // purple -> magenta
  const blob1X = 20 + scrollProgress * 40; // 20% -> 60%
  const blob1Y = 20 + Math.sin(scrollProgress * Math.PI) * 40;
  const blob2X = 80 - scrollProgress * 50;
  const blob2Y = 70 - Math.cos(scrollProgress * Math.PI) * 35;

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ background: '#05070C' }}
    >
      {/* Soft base vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.0),rgba(5,7,12,0.9)_70%)]" />

      {/* Blob 1 */}
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '60vmin',
          height: '60vmin',
          background: `radial-gradient(circle at 30% 30%, hsla(${hue1}, 90%, 55%, 0.55), hsla(${hue1}, 90%, 40%, 0.15) 60%, transparent 75%)`,
          left: `${blob1X}%`,
          top: `${blob1Y}%`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(80px)',
          willChange: 'transform, background',
          transition: 'background 0.3s linear, left 0.4s linear, top 0.4s linear',
        }}
      />

      {/* Blob 2 */}
      <motion.div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '55vmin',
          height: '55vmin',
          background: `radial-gradient(circle at 70% 70%, hsla(${hue2}, 85%, 55%, 0.5), hsla(${hue2}, 85%, 35%, 0.12) 60%, transparent 75%)`,
          left: `${blob2X}%`,
          top: `${blob2Y}%`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(90px)',
          willChange: 'transform, background',
          transition: 'background 0.3s linear, left 0.4s linear, top 0.4s linear',
        }}
      />

      {/* Noise grain for cinematic feel */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] mix-blend-overlay" aria-hidden="true">
        <filter id="lbd-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#lbd-noise)" />
      </svg>
    </div>
  );
}
