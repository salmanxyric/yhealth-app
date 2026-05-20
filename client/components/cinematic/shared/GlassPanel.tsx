"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type MotionProps } from "framer-motion";

interface GlassPanelProps extends MotionProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  active?: boolean;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  function GlassPanel({ children, className = "", glowColor, active, ...motionProps }, ref) {
    return (
      <motion.div
        ref={ref}
        className={`relative rounded-2xl overflow-hidden ${className}`}
        style={{
          background: "linear-gradient(135deg, rgba(28, 28, 32, 0.75) 0%, rgba(16, 16, 18, 0.85) 100%)",
          backdropFilter: "blur(40px) saturate(1.2)",
          WebkitBackdropFilter: "blur(40px) saturate(1.2)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: active && glowColor
            ? `0 0 30px ${glowColor}20, 0 0 80px ${glowColor}08, inset 0 1px 0 rgba(255,255,255,0.06)`
            : "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
          ...(active && glowColor ? { borderColor: `${glowColor}40` } : {}),
        }}
        {...motionProps}
      >
        {/* Top edge highlight */}
        <div
          className="absolute top-0 left-[10%] right-[10%] h-px pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
          }}
        />
        {children}
      </motion.div>
    );
  }
);
