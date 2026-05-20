"use client";

import { motion } from "framer-motion";

interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
}

export function ProgressDots({ total, current, className = "" }: ProgressDotsProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            backgroundColor: i < current ? "#D4A574" : "rgba(255,255,255,0.15)",
          }}
          animate={{ scale: i === current - 1 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}
