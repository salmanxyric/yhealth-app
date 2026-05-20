"use client";

import { motion } from "framer-motion";

interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
}

export function ProgressDots({ total, current, className = "" }: ProgressDotsProps) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i < current;
        const isCurrent = i === current - 1;
        return (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: isCurrent ? 24 : 8,
              height: 8,
              backgroundColor: isActive ? "#D4A574" : "rgba(255,255,255,0.1)",
              boxShadow: isActive ? "0 0 8px rgba(212,165,116,0.3)" : "none",
              borderRadius: 4,
            }}
            animate={{ scale: isCurrent ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            layout
          />
        );
      })}
    </div>
  );
}
