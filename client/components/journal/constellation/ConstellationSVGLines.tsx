"use client";

import { memo, useId } from "react";
import { motion } from "framer-motion";

interface LinePoint {
  x: number;
  y: number;
  color: string;
}

interface Props {
  width: number;
  height: number;
  cx: number;
  cy: number;
  stars: LinePoint[];
  consecutivePairs: Array<[number, number]>;
  /** Radii of concentric orbits for the background ellipses (px) */
  orbitRadii?: number[];
  /** Vertical squash (0-1) — matches TILT_Y used for star positioning */
  tiltY?: number;
  /** When true, skip flowing dashes and infinite motion on edges/orbits */
  prefersReducedMotion?: boolean;
}

function OrbitRing({
  cx,
  cy,
  rx,
  ry,
  index,
  reduced,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  index: number;
  reduced: boolean;
}) {
  const dur = 3.2 + index * 0.4;
  if (reduced) {
    return (
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke="rgba(255, 255, 255, 0.16)"
        strokeWidth={1}
        strokeDasharray="4 6"
      />
    );
  }
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="none"
      stroke="rgba(255, 255, 255, 0.18)"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeDasharray="5 12"
    >
      <animate
        attributeName="stroke-dashoffset"
        from="0"
        to="-17"
        dur={`${dur}s`}
        repeatCount="indefinite"
      />
    </ellipse>
  );
}

function HubToChildEdge({
  cx,
  cy,
  to,
  color,
  index,
  reduced,
  filterId,
  gradId,
}: {
  cx: number;
  cy: number;
  to: LinePoint;
  color: string;
  index: number;
  reduced: boolean;
  filterId: string;
  gradId: string;
}) {
  const baseW = 1.25;
  const delay = index * 0.04;

  if (reduced) {
    return (
      <line
        x1={cx}
        y1={cy}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={baseW}
        strokeOpacity={0.32}
        strokeLinecap="round"
      />
    );
  }

  return (
    <g opacity={0.88}>
      <motion.line
        x1={cx}
        y1={cy}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={baseW * 3.2}
        strokeOpacity={0.12}
        strokeLinecap="round"
        filter={`url(#${filterId})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
      />
      <motion.line
        x1={cx}
        y1={cy}
        x2={to.x}
        y2={to.y}
        stroke={`url(#${gradId})`}
        strokeWidth={baseW}
        strokeLinecap="round"
        strokeOpacity={0.55}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.75, delay, ease: "easeOut" }}
      />
      <motion.line
        x1={cx}
        y1={cy}
        x2={to.x}
        y2={to.y}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth={baseW * 0.85}
        strokeLinecap="round"
        strokeDasharray="6 18"
        initial={{ strokeDashoffset: 0, opacity: 0 }}
        animate={{ strokeDashoffset: [0, -48], opacity: 1 }}
        transition={{
          strokeDashoffset: {
            duration: 2.5,
            repeat: Infinity,
            ease: "linear",
            delay: delay + 0.2,
          },
          opacity: { duration: 0.35, delay, ease: "easeOut" },
        }}
      />
    </g>
  );
}

function ConsecutiveEdge({
  from,
  to,
  color,
  index,
  reduced,
}: {
  from: LinePoint;
  to: LinePoint;
  color: string;
  index: number;
  reduced: boolean;
}) {
  if (reduced) {
    return (
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.3}
        strokeDasharray="2 4"
      />
    );
  }
  return (
    <g opacity={0.45}>
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        strokeDasharray="4 10"
        strokeOpacity={0.55}
        animate={{ strokeDashoffset: [0, -28] }}
        transition={{
          duration: 3.5 + (index % 3) * 0.2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </g>
  );
}

/**
 * Concentric dashed orbit ellipses, hub→satellite animated edges (n8n-style
 * flowing dashes), and consecutive-day connectors. Marker dots on orbit nodes.
 */
export const ConstellationSVGLines = memo(function ConstellationSVGLines({
  width,
  height,
  cx,
  cy,
  stars,
  consecutivePairs,
  orbitRadii = [],
  tiltY = 0.52,
  prefersReducedMotion = false,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const reduced = prefersReducedMotion;
  const filterId = `obs-glow-${uid}`;

  if (width === 0 || height === 0) return null;

  return (
    <svg
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {stars.map((star, i) => (
          <linearGradient
            key={`hub-grad-${i}`}
            id={`${uid}-hub-grad-${i}`}
            x1={cx}
            y1={cy}
            x2={star.x}
            y2={star.y}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={star.color} stopOpacity={0.35} />
            <stop offset="50%" stopColor={star.color} stopOpacity={0.75} />
            <stop offset="100%" stopColor={star.color} stopOpacity={0.32} />
          </linearGradient>
        ))}
      </defs>

      <g>
        {orbitRadii.map((r, i) => (
          <OrbitRing
            key={`orbit-${i}`}
            cx={cx}
            cy={cy}
            rx={r}
            ry={r * tiltY}
            index={i}
            reduced={reduced}
          />
        ))}
      </g>

      <g>
        {stars.map((star, i) => (
          <HubToChildEdge
            key={`hub-edge-${i}`}
            cx={cx}
            cy={cy}
            to={star}
            color={star.color}
            index={i}
            reduced={reduced}
            filterId={filterId}
            gradId={`${uid}-hub-grad-${i}`}
          />
        ))}
      </g>

      <g>
        {consecutivePairs.map(([a, b], i) => {
          const starA = stars[a];
          const starB = stars[b];
          if (!starA || !starB) return null;
          return (
            <ConsecutiveEdge
              key={`conn-${i}`}
              from={starA}
              to={starB}
              color={starA.color}
              index={i}
              reduced={reduced}
            />
          );
        })}
      </g>

      <g>
        {stars.map((star, i) => (
          <circle
            key={`marker-${i}`}
            cx={star.x}
            cy={star.y}
            r={3.5}
            fill={star.color}
            style={{
              filter: `drop-shadow(0 0 8px ${star.color}) drop-shadow(0 0 4px rgba(255,255,255,0.35))`,
            }}
          />
        ))}
      </g>
    </svg>
  );
});
