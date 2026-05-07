'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ContentSkeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACCENT_COLORS, type AccentColor } from '@/lib/admin-tokens';
import { useReducedMotionSafe } from '@/hooks/use-reduced-motion-safe';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  accent: AccentColor;
  trend?: { value: number; direction: 'up' | 'down' | 'flat' };
  sparklineData?: number[];
  subtitle?: string;
  prefix?: string;
  suffix?: string;
  isLoading?: boolean;
  className?: string;
}

function useCountUp(target: number, duration = 800) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(from + (target - from) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return current;
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;

  const w = 64;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className={cn('overflow-visible', className)} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

function formatValue(value: number, prefix?: string, suffix?: string): string {
  const formatted = value >= 1000
    ? value.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : value % 1 === 0
      ? value.toString()
      : value.toFixed(2);
  return `${prefix ?? ''}${formatted}${suffix ?? ''}`;
}

const SPRING_CONFIG = { stiffness: 260, damping: 20, mass: 0.8 };
const SHADOW_SPRING = { stiffness: 180, damping: 30 };
const MAX_TILT = 14;
const PERSPECTIVE = 800;

export function MetricCard({
  title,
  value,
  icon: Icon,
  accent,
  trend,
  sparklineData,
  subtitle,
  prefix = '$',
  suffix = '',
  isLoading = false,
  className,
}: MetricCardProps) {
  const animatedValue = useCountUp(value);
  const colors = ACCENT_COLORS[accent];
  const prefersReducedMotion = useReducedMotionSafe();

  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Motion values for 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring-smoothed rotation with inertia
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]), SPRING_CONFIG);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]), SPRING_CONFIG);

  // Directional shadow that follows tilt
  const shadowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [12, -12]), SHADOW_SPRING);
  const shadowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), SHADOW_SPRING);

  // Shine gradient position
  const shineX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const shineY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  // Parallax offsets for child elements (z-depth separation)
  const iconX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), SPRING_CONFIG);
  const iconY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-6, 6]), SPRING_CONFIG);
  const valueX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), SPRING_CONFIG);
  const valueY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-3, 3]), SPRING_CONFIG);

  // Derived motion values for shadow and shine (hoisted from JSX)
  const boxShadowMV = useTransform(
    [shadowX, shadowY],
    ([sx, sy]: number[]) =>
      `${sx}px ${sy}px 30px -8px rgba(0,0,0,0.5), ${sx * 0.3}px ${sy * 0.3}px 10px -4px rgba(0,0,0,0.3)`,
  );
  const shineBgMV = useTransform(
    [shineX, shineY],
    ([sx, sy]: number[]) =>
      `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
  );

  // IntersectionObserver for performance
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !isVisible) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(nx);
      mouseY.set(ny);
    },
    [prefersReducedMotion, isVisible, mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;

  const fixtureContent = (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-slate-800" />
        <p className="text-xs text-slate-500">Loading...</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-100">$0.00</p>
      <p className="mt-1.5 text-xs text-slate-500">—</p>
    </div>
  );

  return (
    <ContentSkeleton
      name={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      loading={isLoading}
      animate="shimmer"
      darkColor="rgba(255,255,255,0.06)"
      fixture={fixtureContent}
    >
    <div ref={cardRef} style={{ perspective: PERSPECTIVE }} className={cn('group', className)}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
        className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-colors duration-300 hover:border-slate-600/80"
      >
        {/* Directional shadow layer */}
        <motion.div
          className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            boxShadow: prefersReducedMotion ? 'none' : boxShadowMV,
          }}
        />

        {/* Shine / glare overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: prefersReducedMotion ? 'none' : shineBgMV,
          }}
        />

        {/* Accent glow */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-[0.07]"
          style={{ background: `var(--accent-glow, ${getAccentHex(accent)})` }}
        />

        <div className="flex items-start justify-between" style={{ transformStyle: 'preserve-3d' }}>
          <div className="min-w-0 flex-1">
            {/* Icon + Title — highest z-depth parallax */}
            <motion.div
              className="flex items-center gap-2"
              style={{
                x: prefersReducedMotion ? 0 : iconX,
                y: prefersReducedMotion ? 0 : iconY,
                translateZ: 30,
              }}
            >
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-shadow duration-300',
                colors.bg,
                'group-hover:shadow-lg group-hover:shadow-current/10',
              )}>
                <Icon className={cn('h-3.5 w-3.5', colors.text)} />
              </div>
              <p className="truncate text-xs font-medium text-slate-500">{title}</p>
            </motion.div>

            {/* Value — mid z-depth parallax */}
            <motion.p
              className="mt-3 text-2xl font-semibold tracking-tight text-slate-100"
              style={{
                x: prefersReducedMotion ? 0 : valueX,
                y: prefersReducedMotion ? 0 : valueY,
                translateZ: 20,
              }}
            >
              {formatValue(animatedValue, prefix, suffix)}
            </motion.p>

            {/* Trend + subtitle — low z-depth (stationary relative to card) */}
            <div className="mt-1.5 flex items-center gap-2" style={{ transform: 'translateZ(8px)' }}>
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-medium',
                    trend.direction === 'up' ? 'text-emerald-400' : trend.direction === 'down' ? 'text-rose-400' : 'text-slate-500',
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(trend.value).toFixed(1)}%
                </span>
              )}
              {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
            </div>
          </div>

          {/* Sparkline — parallax follows icon */}
          {sparklineData && sparklineData.length > 1 && (
            <motion.div
              style={{
                x: prefersReducedMotion ? 0 : iconX,
                y: prefersReducedMotion ? 0 : iconY,
                translateZ: 25,
              }}
            >
              <Sparkline data={sparklineData} className={cn('shrink-0', colors.text)} />
            </motion.div>
          )}
        </div>

        {/* Bottom edge glow line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${getAccentHex(accent)}40 50%, transparent 100%)`,
          }}
        />
      </motion.div>
    </div>
    </ContentSkeleton>
  );
}

function getAccentHex(accent: AccentColor): string {
  const map: Record<AccentColor, string> = {
    emerald: '#10b981',
    cyan: '#06b6d4',
    violet: '#8b5cf6',
    amber: '#f59e0b',
    rose: '#f43f5e',
    blue: '#3b82f6',
  };
  return map[accent] ?? '#10b981';
}
