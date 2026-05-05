'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useId, useMemo } from 'react';
import type { Plan } from './types';

const ARC_DEG = 270;

// Arc from 135deg (bottom-left) sweeping 270deg clockwise to 45deg (bottom-right)
function describeArc(cx: number, cy: number, r: number, startAngle: number, sweepDeg: number) {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = ((startAngle + sweepDeg) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = sweepDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

interface CurrentPlanCardProps {
  plan: Plan;
  variant?: 'default' | 'compact';
}

export function CurrentPlanCard({ plan, variant = 'default' }: CurrentPlanCardProps) {
  const gid = useId();
  const compact = variant === 'compact';
  const svgSize = compact ? 118 : 160;
  const gaugeR = compact ? 42 : 62;
  const gaugeStroke = compact ? 6 : 8;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const arcPath = useMemo(() => describeArc(cx, cy, gaugeR, 135, ARC_DEG), [cx, cy, gaugeR]);
  const arcLen = (ARC_DEG * Math.PI * gaugeR) / 180;
  const progress = Math.min(plan.overallProgress, 100);
  const gaugeOffset = arcLen - (arcLen * progress) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      className={`group/plan relative cursor-pointer overflow-hidden rounded-2xl ${compact ? 'flex h-full min-h-0 flex-col ring-1 ring-sky-400/10' : ''}`}
      style={{
        background: compact
          ? 'linear-gradient(165deg, rgba(20,28,42,0.96) 0%, rgba(10,16,32,0.99) 50%, rgba(6,10,22,1) 100%)'
          : 'linear-gradient(160deg, rgba(14,16,33,0.98) 0%, rgba(8,10,24,1) 100%)',
        border: compact ? '1px solid rgba(56,189,248,0.22)' : '1px solid rgba(56,189,248,0.08)',
        boxShadow: compact
          ? '0 8px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.35), 0 0 40px rgba(14,165,233,0.12), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.35)'
          : '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      {compact && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.55), transparent)' }}
        />
      )}
      <div
        className={`relative flex flex-col items-center text-center ${compact ? 'min-h-0 flex-1 justify-between px-4 pb-3 pt-4' : 'px-6 pt-5 pb-5'}`}
      >
        {/* Arc gauge */}
        <div className={compact ? 'relative w-[118px] h-[96px] shrink-0' : 'relative w-[160px] h-[130px]'}>
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} fill="none" className="w-full h-full">
            <path
              d={arcPath}
              stroke="rgba(255,255,255,0.03)"
              strokeWidth={gaugeStroke}
              strokeLinecap="round"
              fill="none"
            />
            <motion.path
              d={arcPath}
              fill="none"
              stroke="rgba(14,165,233,0.35)"
              strokeWidth={gaugeStroke + 10}
              strokeLinecap="round"
              strokeDasharray={arcLen}
              initial={{ strokeDashoffset: arcLen }}
              animate={{ strokeDashoffset: gaugeOffset }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ filter: 'blur(10px)' }}
            />
            <motion.path
              d={arcPath}
              fill="none"
              stroke="rgba(56,189,248,0.4)"
              strokeWidth={gaugeStroke + 4}
              strokeLinecap="round"
              strokeDasharray={arcLen}
              initial={{ strokeDashoffset: arcLen }}
              animate={{ strokeDashoffset: gaugeOffset }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ filter: 'blur(5px)' }}
            />
            <motion.path
              d={arcPath}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth={gaugeStroke}
              strokeLinecap="round"
              strokeDasharray={arcLen}
              initial={{ strokeDashoffset: arcLen }}
              animate={{ strokeDashoffset: gaugeOffset }}
              transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
            <defs>
              <linearGradient id={gid} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0369a1" />
                <stop offset="40%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ paddingTop: compact ? '8px' : '12px' }}
          >
            <motion.span
              className={`font-extrabold tabular-nums leading-none text-white ${compact ? 'text-2xl' : 'text-[26px]'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              style={{
                textShadow: compact
                  ? '0 0 28px rgba(56,189,248,0.45), 0 2px 8px rgba(0,0,0,0.6)'
                  : '0 0 20px rgba(56,189,248,0.15)',
              }}
            >
              {progress}%
            </motion.span>
            {!compact && (
              <span className="text-[10px] text-sky-300/50 font-medium mt-1 tracking-wide">
                Overall Progress
              </span>
            )}
          </div>
        </div>

        <h3
          className={`w-full min-w-0 font-bold leading-snug tracking-tight text-white ${compact ? 'mb-2 mt-1 line-clamp-2 text-[13px]' : 'mb-1 text-base'}`}
        >
          {plan.name}
        </h3>
        {!compact && plan.description ? (
          <p className="text-xs text-slate-400/80 leading-relaxed line-clamp-2 mb-5 max-w-[220px]">
            {plan.description}
          </p>
        ) : null}

        {compact ? (
          <Link
            href="/dashboard?tab=plans"
            className="mt-auto flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-sky-400/25 bg-gradient-to-b from-white/[0.08] to-white/[0.02] px-3 text-sm font-semibold text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:border-sky-400/45 hover:text-white hover:shadow-[0_0_24px_rgba(56,189,248,0.2)]"
          >
            View plan
            <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover/plan:translate-x-0.5" />
          </Link>
        ) : (
          <Link
            href="/dashboard?tab=plans"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #059669, #047857)',
              boxShadow: '0 4px 12px rgba(5,150,105,0.3), 0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            View Plan Details
            <ChevronRight className="w-4 h-4 group-hover/plan:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
