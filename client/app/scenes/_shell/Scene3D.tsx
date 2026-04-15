'use client';

import { motion } from 'framer-motion';

export type Scene3DKind = 'health-core' | 'devices' | 'data-flow';

interface Scene3DProps {
  kind: Scene3DKind;
  /**
   * Optional Spline scene URL. When provided, the component lazy-loads
   * `@splinetool/react-spline` and renders the scene. Until any real scenes
   * exist, every call-site passes `undefined` and gets the coded placeholder.
   */
  splineUrl?: string;
  className?: string;
}

export function Scene3D({ kind, splineUrl, className = '' }: Scene3DProps) {
  if (splineUrl) {
    // Intentional: Spline integration lands when the first real URL arrives.
    // Until then, passing `splineUrl` falls through to the placeholder so the
    // landing still renders if a URL is wired up speculatively.
    // (Hook for future: dynamic import of @splinetool/react-spline here.)
  }

  return (
    <div
      aria-hidden="true"
      className={`relative w-full h-full flex items-center justify-center ${className}`}
    >
      {kind === 'health-core' && <HealthCorePlaceholder />}
      {kind === 'devices' && <DevicesPlaceholder />}
      {kind === 'data-flow' && <DataFlowPlaceholder />}
    </div>
  );
}

function HealthCorePlaceholder() {
  return (
    <div className="relative w-[min(80vmin,640px)] h-[min(80vmin,640px)]">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-purple-600/20 blur-3xl" />
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[12%] rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(34,211,238,0.35), rgba(139,92,246,0.35), rgba(34,211,238,0.35))',
          filter: 'blur(0.5px)',
        }}
      />
      <div className="absolute inset-[28%] rounded-full bg-gradient-to-br from-slate-900 via-slate-950 to-black ring-1 ring-white/10 shadow-2xl shadow-cyan-500/20" />
      <div className="absolute inset-[32%] rounded-full bg-gradient-to-tr from-white/10 via-transparent to-transparent" />
      <svg className="absolute inset-0" viewBox="-50 -50 100 100" aria-hidden="true">
        <circle cx="0" cy="0" r="44" fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="0.15" strokeDasharray="0.6 2" />
        <circle cx="0" cy="0" r="48" fill="none" stroke="rgba(139,92,246,0.2)"  strokeWidth="0.1" strokeDasharray="0.3 3" />
      </svg>
    </div>
  );
}

function DevicesPlaceholder() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute left-[8%] top-[20%] w-[55%] aspect-[16/10] rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 ring-1 ring-white/10 shadow-2xl" />
      <div className="absolute right-[8%] top-[30%] w-[18%] aspect-[9/19] rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-950 ring-1 ring-white/10 shadow-2xl" />
    </div>
  );
}

function DataFlowPlaceholder() {
  return (
    <svg viewBox="0 0 800 200" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="sd-flow" x1="0" x2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,0.8)" />
          <stop offset="100%" stopColor="rgba(139,92,246,0.8)" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={100 + i * 200} cy={100} r={28} fill="rgba(15,23,42,0.9)" stroke="url(#sd-flow)" strokeWidth="1.5" />
      ))}
      {[0, 1, 2].map((i) => (
        <line key={i} x1={128 + i * 200} y1={100} x2={272 + i * 200} y2={100} stroke="url(#sd-flow)" strokeWidth="1.2" />
      ))}
    </svg>
  );
}
