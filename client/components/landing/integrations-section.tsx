"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { Sparkles, Zap, Activity } from "lucide-react";
import { AnimatedGradientMesh } from "./shared";

// ─── SVG icons for each integration ──────────────────────────────────
function AppleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GoogleFitIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" opacity="0.3" />
      <path d="M12.75 3.94c.55.83.88 1.79.88 2.81 0 1.76-.9 3.31-2.25 4.22l-2.06-2.06L12.75 3.94zM8.36 8.98L5.94 6.56C4.73 8.11 4 10 4 12c0 2 .73 3.89 1.94 5.44l2.42-2.42C7.53 14.01 7 13.06 7 12s.53-2.01 1.36-3.02zM12 20c2 0 3.89-.73 5.44-1.94l-2.42-2.42c-1.01.83-2.06 1.36-3.02 1.36s-2.01-.53-3.02-1.36l-2.42 2.42C8.11 19.27 10 20 12 20zm6.56-5.94l-2.42-2.42c.83-1.01 1.36-2.06 1.36-3.02h-.01c-.01-.33-.05-.65-.13-.96l2.63-2.63A9.97 9.97 0 0 1 22 12c0 2-1.27 4.52-3.44 5.06z" />
    </svg>
  );
}

function FitbitIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="4" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="20" r="2" />
      <circle cx="8" cy="6" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="8" cy="18" r="1.5" />
      <circle cx="16" cy="6" r="1.5" />
      <circle cx="16" cy="12" r="1.5" />
      <circle cx="16" cy="18" r="1.5" />
    </svg>
  );
}

function GarminIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z" />
      <path d="M14 11h-3v3h1v-2h2z" />
    </svg>
  );
}

function SamsungIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 7h14c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V9c0-1.1.9-2 2-2zm0 2v6h14V9H5zm2 1h2v4H7v-4zm3 0h2v4h-2v-4zm3 0h2v4h-2v-4z" />
    </svg>
  );
}

function StravaIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}

function MyFitnessPalIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
    </svg>
  );
}

function PelotonIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z" />
    </svg>
  );
}

function WhoopIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.14-7-7 3.14-7 7-7z" />
      <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

const integrations = [
  { name: "Apple Health", Icon: AppleIcon, color: "from-gray-100 to-gray-300", accent: "#A2AAAD", desc: "Sync workouts, steps & vitals", dataType: "Health Kit" },
  { name: "Google Fit", Icon: GoogleFitIcon, color: "from-blue-400 to-green-400", accent: "#4285F4", desc: "Activity & heart rate data", dataType: "Fitness API" },
  { name: "Fitbit", Icon: FitbitIcon, color: "from-teal-400 to-teal-500", accent: "#00B0B9", desc: "Sleep, activity & SPO2", dataType: "Web API" },
  { name: "Garmin", Icon: GarminIcon, color: "from-orange-400 to-orange-500", accent: "#F7941D", desc: "GPS & performance metrics", dataType: "Connect IQ" },
  { name: "Samsung Health", Icon: SamsungIcon, color: "from-blue-500 to-blue-600", accent: "#1428A0", desc: "Full health ecosystem sync", dataType: "Health SDK" },
  { name: "Strava", Icon: StravaIcon, color: "from-orange-500 to-red-500", accent: "#FC4C02", desc: "Running & cycling data", dataType: "OAuth API" },
  { name: "Whoop", Icon: WhoopIcon, color: "from-emerald-400 to-teal-500", accent: "#44D62C", desc: "Strain, recovery & sleep", dataType: "Developer API" },
  { name: "MyFitnessPal", Icon: MyFitnessPalIcon, color: "from-green-400 to-green-500", accent: "#0062FF", desc: "Nutrition & calorie tracking", dataType: "Diary API" },
  { name: "Peloton", Icon: PelotonIcon, color: "from-red-500 to-red-600", accent: "#D0021B", desc: "Workout classes & metrics", dataType: "Telemetry" },
];

// ─── Central hub with particle burst ─────────────────────────────────
function CentralHub({ activeIndex }: { activeIndex: number }) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ zIndex: 20 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring" as const, stiffness: 200, damping: 20, delay: 0.3 }}
    >
      {/* Outer glow - pulses with active integration accent */}
      <motion.div
        className="absolute w-36 h-36 rounded-full"
        animate={{
          boxShadow: [
            `0 0 40px ${integrations[activeIndex].accent}33, 0 0 80px ${integrations[activeIndex].accent}15`,
            `0 0 60px ${integrations[activeIndex].accent}55, 0 0 120px ${integrations[activeIndex].accent}25`,
            `0 0 40px ${integrations[activeIndex].accent}33, 0 0 80px ${integrations[activeIndex].accent}15`,
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Particle ring - orbiting particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-primary/60"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 8 + i * 0.5,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            transformOrigin: "0 0",
            left: "50%",
            top: "50%",
          }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: 52 + i * 2,
              top: -1,
              background: `${integrations[i % integrations.length].accent}88`,
              boxShadow: `0 0 6px ${integrations[i % integrations.length].accent}66`,
            }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
          />
        </motion.div>
      ))}

      {/* Inner orbital ring */}
      <motion.div
        className="absolute w-28 h-28 rounded-full border border-primary/10"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* Hub circle */}
      <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center border-2 border-white/20 shadow-2xl">
        <Activity className="w-10 h-10 text-white" />

        {/* Pulse rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/40"
          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-purple-400/30"
          animate={{ scale: [1, 2.4], opacity: [0.4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-white/10"
          animate={{ scale: [1, 3], opacity: [0.2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
        />
      </div>

      {/* Label with active integration name cycling */}
      <motion.span
        className="absolute -bottom-9 text-xs font-bold tracking-wider uppercase whitespace-nowrap"
        style={{ color: integrations[activeIndex].accent }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={activeIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
          >
            yHealth
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </motion.div>
  );
}

// ─── Orbital node with magnetic hover & 3D tilt ─────────────────────
function OrbitalNode({
  integration,
  index,
  total,
  baseAngleOffset,
  hoveredIndex,
  activeIndex,
  onHover,
  onLeave,
}: {
  integration: (typeof integrations)[0];
  index: number;
  total: number;
  baseAngleOffset: number;
  hoveredIndex: number | null;
  activeIndex: number;
  onHover: (i: number) => void;
  onLeave: () => void;
}) {
  const angle = ((index / total) * 360 - 90 + baseAngleOffset) % 360;
  const radius = 210;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;
  const isHovered = hoveredIndex === index;
  const isActive = activeIndex === index;
  const Icon = integration.Icon;

  // Magnetic tilt
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const smoothTiltX = useSpring(tiltX, { stiffness: 300, damping: 30 });
  const smoothTiltY = useSpring(tiltY, { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      tiltX.set((e.clientY - cy) / 3);
      tiltY.set(-(e.clientX - cx) / 3);
    },
    [tiltX, tiltY]
  );

  const handleMouseLeave = useCallback(() => {
    tiltX.set(0);
    tiltY.set(0);
    onLeave();
  }, [tiltX, tiltY, onLeave]);

  return (
    <motion.div
      className="absolute"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        zIndex: isHovered ? 30 : 15,
        pointerEvents: "auto",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring" as const,
        stiffness: 200,
        damping: 20,
        delay: 0.4 + index * 0.08,
      }}
    >
      <motion.div
        className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer"
        animate={{
          scale: isHovered ? 1.2 : isActive ? 1.1 : 1,
          y: isActive ? -4 : 0,
        }}
        transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
        onMouseEnter={() => onHover(index)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: smoothTiltX,
          rotateY: smoothTiltY,
          transformPerspective: 600,
        }}
      >
        {/* Active/hover glow ring */}
        <motion.div
          className="absolute -inset-3 rounded-2xl"
          animate={{
            boxShadow:
              isHovered || isActive
                ? `0 0 24px ${integration.accent}55, 0 0 48px ${integration.accent}22, inset 0 0 12px ${integration.accent}11`
                : `0 0 8px ${integration.accent}15`,
            borderColor:
              isHovered || isActive
                ? `${integration.accent}44`
                : "transparent",
          }}
          transition={{ duration: 0.3 }}
          style={{ border: "1px solid transparent", borderRadius: 16 }}
        />

        {/* Card */}
        <div
          className="relative w-[68px] h-[68px] rounded-2xl bg-background/80 backdrop-blur-sm border border-white/10 flex items-center justify-center group hover:border-white/30 transition-colors duration-300 overflow-hidden"
        >
          {/* Shimmer on active */}
          {isActive && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{ x: [-80, 80] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />
          )}
          <Icon className="w-8 h-8 text-white/80 group-hover:text-white transition-colors relative z-10" />

          {/* Live dot */}
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
            style={{
              background: isActive ? integration.accent : "#34d399",
              boxShadow: `0 0 8px ${isActive ? integration.accent : "rgba(52,211,153,0.6)"}`,
            }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
          />
        </div>

        {/* Hover tooltip with data type badge */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.85 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-48 p-3 rounded-xl bg-background/95 backdrop-blur-md border border-white/10 shadow-2xl"
              style={{
                zIndex: 100,
                pointerEvents: "auto",
              }}
            >
              <p className="text-sm font-semibold text-white text-center">
                {integration.name}
              </p>
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                {integration.desc}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Connected
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">|</span>
                <span
                  className="text-[10px] font-mono font-medium"
                  style={{ color: integration.accent }}
                >
                  {integration.dataType}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Connection lines with bi-directional data streams ───────────────
function ConnectionLines({
  hoveredIndex,
  activeIndex,
  baseAngleOffset,
}: {
  hoveredIndex: number | null;
  activeIndex: number;
  baseAngleOffset: number;
}) {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="-260 -260 520 520"
      style={{ zIndex: 1, pointerEvents: "none" }}
    >
      <defs>
        <filter id="dotGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="lineGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Gradient defs for each integration line */}
        {integrations.map((int, i) => (
          <linearGradient key={`grad-${i}`} id={`lineGrad-${i}`}>
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor={int.accent} stopOpacity="0.8" />
          </linearGradient>
        ))}
      </defs>

      {/* Outer orbital ring with rotation */}
      <motion.circle
        cx={0}
        cy={0}
        r={210}
        fill="none"
        stroke="hsl(var(--primary) / 0.06)"
        strokeWidth={1}
        strokeDasharray="4 8"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      />

      {/* Inner decorative ring */}
      <motion.circle
        cx={0}
        cy={0}
        r={150}
        fill="none"
        stroke="hsl(var(--primary) / 0.04)"
        strokeWidth={0.5}
        strokeDasharray="2 12"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 0.4 }}
      />

      {/* Connection lines + data flow */}
      {integrations.map((integration, i) => {
        const angle =
          (((i / integrations.length) * 360 - 90 + baseAngleOffset) % 360) *
          (Math.PI / 180);
        const outerR = 210;
        const innerR = 52;
        const x1 = Math.cos(angle) * innerR;
        const y1 = Math.sin(angle) * innerR;
        const x2 = Math.cos(angle) * (outerR - 34);
        const y2 = Math.sin(angle) * (outerR - 34);
        const isHighlighted =
          hoveredIndex === i || activeIndex === i;
        const isVisible = hoveredIndex === null || hoveredIndex === i;

        return (
          <g key={i}>
            {/* Base line */}
            <motion.line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={
                isHighlighted
                  ? `url(#lineGrad-${i})`
                  : "hsl(var(--primary) / 0.12)"
              }
              strokeWidth={isHighlighted ? 2 : 0.8}
              strokeDasharray={isHighlighted ? "none" : "3 6"}
              filter={isHighlighted ? "url(#lineGlow)" : undefined}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: isVisible ? (isHighlighted ? 0.9 : 0.3) : 0.08,
              }}
              transition={{
                duration: 0.8,
                delay: 0.5 + i * 0.08,
              }}
            />

            {/* Outbound data dot (hub → node) */}
            <motion.circle
              r={isHighlighted ? 3 : 1.5}
              fill={isHighlighted ? integration.accent : "hsl(var(--primary))"}
              filter={isHighlighted ? "url(#dotGlow)" : undefined}
              animate={{
                cx: [x1, x2],
                cy: [y1, y2],
                opacity: isVisible
                  ? isHighlighted
                    ? [0, 1, 1, 0]
                    : [0, 0.4, 0.4, 0]
                  : 0,
              }}
              transition={{
                cx: {
                  duration: 1.8 + i * 0.15,
                  repeat: Infinity,
                  ease: "linear",
                },
                cy: {
                  duration: 1.8 + i * 0.15,
                  repeat: Infinity,
                  ease: "linear",
                },
                opacity: {
                  duration: 1.8 + i * 0.15,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
            />

            {/* Inbound data dot (node → hub) — offset timing */}
            <motion.circle
              r={isHighlighted ? 2.5 : 1}
              fill={isHighlighted ? "hsl(var(--primary))" : integration.accent}
              animate={{
                cx: [x2, x1],
                cy: [y2, y1],
                opacity: isVisible
                  ? isHighlighted
                    ? [0, 0.8, 0.8, 0]
                    : [0, 0.25, 0.25, 0]
                  : 0,
              }}
              transition={{
                cx: {
                  duration: 2.2 + i * 0.15,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.9,
                },
                cy: {
                  duration: 2.2 + i * 0.15,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.9,
                },
                opacity: {
                  duration: 2.2 + i * 0.15,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.9,
                },
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Active integration info panel (scroll-triggered) ────────────────
function ActiveInfoPanel({ activeIndex }: { activeIndex: number }) {
  const integration = integrations[activeIndex];

  return (
    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-64" style={{ zIndex: 25 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.9 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="glass-card rounded-2xl p-4 border border-white/10 text-center"
          style={{
            borderColor: `${integration.accent}22`,
            boxShadow: `0 8px 32px ${integration.accent}15`,
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <integration.Icon className="w-4 h-4 text-white/80" />
            <span className="text-sm font-semibold text-white">
              {integration.name}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">{integration.desc}</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[10px] text-emerald-400 font-medium">
                Live
              </span>
            </div>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/5"
              style={{ color: integration.accent }}
            >
              {integration.dataType}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Desktop orbital layout (scroll-animated) ───────────────────────
function OrbitalLayout() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [baseAngleOffset, setBaseAngleOffset] = useState(0);

  // Auto-cycle active integration every 3s (paused on hover)
  useEffect(() => {
    if (hoveredIndex !== null) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % integrations.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [hoveredIndex]);

  // Override active on hover
  useEffect(() => {
    if (hoveredIndex !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveIndex(hoveredIndex);
    }
  }, [hoveredIndex]);

  // Slow continuous rotation of the orbital ring
  useEffect(() => {
    let frame: number;
    const startTime = performance.now();
    const speed = 0.003; // degrees per ms

    function tick(now: number) {
      const elapsed = now - startTime;
      setBaseAngleOffset(elapsed * speed);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="relative w-[520px] h-[520px] mx-auto"
      style={{ zIndex: 10, isolation: "isolate" }}
    >
      {/* Connection lines SVG */}
      <ConnectionLines
        hoveredIndex={hoveredIndex}
        activeIndex={activeIndex}
        baseAngleOffset={baseAngleOffset}
      />

      {/* Central hub */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 20 }}
      >
        <CentralHub activeIndex={activeIndex} />
      </div>

      {/* Orbital nodes */}
      <div style={{ zIndex: 15, pointerEvents: "none" }}>
        {integrations.map((integration, i) => (
          <OrbitalNode
            key={integration.name}
            integration={integration}
            index={i}
            total={integrations.length}
            baseAngleOffset={baseAngleOffset}
            hoveredIndex={hoveredIndex}
            activeIndex={activeIndex}
            onHover={setHoveredIndex}
            onLeave={() => setHoveredIndex(null)}
          />
        ))}
      </div>

      {/* Active info panel at bottom */}
      <ActiveInfoPanel activeIndex={activeIndex} />

      {/* Slow rotation decorative overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 2 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 180, repeat: Infinity, ease: "linear" }}
      >
        {[0, 72, 144, 216, 288].map((angle) => (
          <motion.div
            key={angle}
            className="absolute w-0.5 h-0.5 rounded-full bg-primary/20"
            style={{
              left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 180}px)`,
              top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 180}px)`,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ─── Mobile grid card with staggered 3D reveal ──────────────────────
function MobileCard({
  integration,
  index,
}: {
  integration: (typeof integrations)[0];
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const Icon = integration.Icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, rotateX: 15, scale: 0.85 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, rotateX: 0, scale: 1 }
          : {}
      }
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6, scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="group relative"
      style={{ transformPerspective: 800 }}
    >
      <motion.div
        className="absolute -inset-1 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${integration.accent}20, ${integration.accent}08)`,
        }}
      />
      <div className="relative glass-card rounded-2xl p-4 border border-white/10 text-center h-full overflow-hidden group-hover:border-primary/30 transition-all duration-300">
        {/* Shimmer on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12"
          initial={{ x: "-100%" }}
          whileHover={{ x: "200%" }}
          transition={{ duration: 0.8 }}
        />
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div
            className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center border border-white/10"
            style={{
              boxShadow: `0 0 12px ${integration.accent}15`,
            }}
          >
            <Icon className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
          </div>
          <h4 className="font-semibold text-xs">{integration.name}</h4>
          <div className="flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
            />
            <span className="text-[9px] text-emerald-400">Connected</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── INTEGRATIONS SECTION ────────────────────────────────────────────
export function IntegrationsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [isDesktop, setIsDesktop] = useState(false);

  // Scroll-driven parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const sectionScale = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    [0.88, 1, 1, 0.92],
    { clamp: true }
  );
  const sectionOpacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [0.2, 1, 1, 0.2],
    { clamp: true }
  );
  const sectionY = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [80, 0, -80],
    { clamp: true }
  );
  const bgOrbY1 = useTransform(
    scrollYProgress,
    [0, 1],
    [-60, 100],
    { clamp: true }
  );
  const bgOrbY2 = useTransform(
    scrollYProgress,
    [0, 1],
    [60, -100],
    { clamp: true }
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-20 md:py-24 relative overflow-hidden"
    >
      {/* Background layers */}
      <div
        className="absolute inset-0 cyber-grid opacity-20"
        style={{ zIndex: 0 }}
      />
      <div style={{ zIndex: 0 }}>
        <AnimatedGradientMesh intensity={0.2} speed={0.85} blur={110} />
      </div>
      <motion.div
        className="absolute left-0 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary/5 rounded-full blur-3xl"
        style={{ zIndex: 0, y: bgOrbY1, top: "20%" }}
      />
      <motion.div
        className="absolute right-0 w-40 sm:w-64 md:w-80 h-40 sm:h-64 md:h-80 bg-purple-500/5 rounded-full blur-3xl"
        style={{ zIndex: 0, y: bgOrbY2, bottom: "20%" }}
      />

      {/* Main content with scroll parallax */}
      <motion.div
        className="container mx-auto px-4 relative"
        style={{
          zIndex: 10,
          scale: sectionScale,
          opacity: sectionOpacity,
          y: sectionY,
        }}
      >
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass-card px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span>Integrations</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6"
          >
            Connects with Your{" "}
            <span className="gradient-text-animated">Favorite Apps</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-muted-foreground px-2 sm:px-4"
          >
            Seamlessly sync your health data from all your devices and apps for
            a complete picture of your wellness.
          </motion.p>
        </div>

        {/* Orbital on desktop, Grid on mobile */}
        {isDesktop ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <OrbitalLayout />
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {integrations.map((integration, index) => (
              <MobileCard
                key={integration.name}
                integration={integration}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-10 sm:mt-12 md:mt-14"
        >
          <motion.div
            className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full"
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
          >
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              And{" "}
              <span className="text-primary font-medium">50+ more</span>{" "}
              integrations coming soon
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
