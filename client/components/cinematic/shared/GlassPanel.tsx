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
        className={`relative rounded-2xl border border-white/[0.06] ${className}`}
        style={{
          background: "rgba(20, 20, 22, 0.7)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          ...(active && glowColor
            ? {
                boxShadow: `0 0 20px ${glowColor}26, 0 0 60px ${glowColor}10`,
                borderColor: `${glowColor}4D`,
              }
            : {}),
        }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);
