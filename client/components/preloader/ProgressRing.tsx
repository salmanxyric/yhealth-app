"use client";

import { CSS_COLORS } from "./constants";

interface ProgressRingProps {
  progress: number;
  size?: number;
}

export function ProgressRing({ progress, size = 120 }: ProgressRingProps) {
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={CSS_COLORS.coreCyan}
          strokeWidth={strokeWidth}
          strokeOpacity={0.15}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={CSS_COLORS.coreCyan}
          strokeWidth={strokeWidth}
          strokeOpacity={0.4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 500ms ease-out",
          }}
        />
      </svg>
    </div>
  );
}
