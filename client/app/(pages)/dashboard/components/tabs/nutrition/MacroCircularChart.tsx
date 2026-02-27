"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface MacroCircularChartProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  primaryColor: string;
  secondaryColor: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: { circle: 120, stroke: 8, fontSize: 'text-xl', labelSize: 'text-xs' },
  md: { circle: 140, stroke: 10, fontSize: 'text-2xl', labelSize: 'text-sm' },
  lg: { circle: 160, stroke: 12, fontSize: 'text-3xl', labelSize: 'text-base' },
};

export function MacroCircularChart({
  value,
  max,
  label,
  unit,
  primaryColor,
  secondaryColor,
  size = 'md',
  className = '',
}: MacroCircularChartProps) {
  const config = sizeConfig[size];
  const radius = (config.circle - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress (0-100)
  const progress = useMemo(() => {
    if (max > 0 && value > 0) {
      return Math.min((value / max) * 100, 100);
    }
    return 0;
  }, [value, max]);

  const strokeDashoffset = useMemo(() => {
    return circumference - (progress / 100) * circumference;
  }, [circumference, progress]);

  const percentage = Math.round(progress);

  // Format value display
  const displayValue = useMemo(() => {
    return Math.round(value).toLocaleString();
  }, [value]);

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Circular SVG */}
      <div 
        className="relative" 
        style={{ width: config.circle, height: config.circle }}
        role="img"
        aria-label={`${label}: ${displayValue} ${unit}`}
      >
        <svg
          className="transform -rotate-90"
          width={config.circle}
          height={config.circle}
          viewBox={`0 0 ${config.circle} ${config.circle}`}
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={radius}
            fill="rgba(255, 255, 255, 0.05)"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={config.stroke}
          />

          {/* Progress circle */}
          {progress > 0 && (
            <motion.circle
              cx={config.circle / 2}
              cy={config.circle / 2}
              r={radius}
              fill="none"
              stroke={primaryColor}
              strokeWidth={config.stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                filter: `drop-shadow(0 0 8px ${primaryColor}40)`,
              }}
            />
          )}

          {/* Gradient definition for smooth color transition */}
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="text-center"
          >
            <p
              className={`${config.fontSize} font-bold text-white mb-0.5 drop-shadow-2xl`}
              style={{ 
                textShadow: `0 0 20px ${primaryColor}80, 0 2px 4px rgba(0, 0, 0, 0.5)`,
                letterSpacing: '-0.02em',
              }}
              aria-hidden="true"
            >
              {displayValue}
            </p>
            <p className={`${config.labelSize} font-medium text-slate-400 mb-1`} aria-hidden="true">
              {unit}
            </p>
            <p 
              className={`${config.labelSize} font-semibold tracking-wider`} 
              style={{ color: primaryColor }}
              aria-hidden="true"
            >
              {label}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Percentage and target below circle */}
      <div className="mt-3 text-center">
        <p 
          className="text-sm font-semibold mb-1"
          style={{ color: primaryColor }}
        >
          {percentage}%
        </p>
        <p className="text-xs text-slate-500">
          {Math.round(value)} / {max} {unit}
        </p>
      </div>
    </div>
  );
}

