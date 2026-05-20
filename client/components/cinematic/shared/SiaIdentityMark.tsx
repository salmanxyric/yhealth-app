"use client";

import { motion } from "framer-motion";

interface SiaIdentityMarkProps {
  size?: number;
  className?: string;
}

export function SiaIdentityMark({ size = 32, className = "" }: SiaIdentityMarkProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      animate={{ scale: [1, 1.06, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(212,165,116,0.3) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
      <svg viewBox="0 0 32 32" fill="none" className="absolute inset-0 w-full h-full">
        <circle cx="16" cy="16" r="12" stroke="#D4A574" strokeWidth="1" opacity="0.6" />
        <circle cx="16" cy="16" r="4" fill="#D4A574" opacity="0.9" />
        <line x1="16" y1="2"  x2="16" y2="8"  stroke="#D4A574" strokeWidth="1" opacity="0.5" />
        <line x1="16" y1="24" x2="16" y2="30" stroke="#D4A574" strokeWidth="1" opacity="0.5" />
        <line x1="2"  y1="16" x2="8"  y2="16" stroke="#D4A574" strokeWidth="1" opacity="0.5" />
        <line x1="24" y1="16" x2="30" y2="16" stroke="#D4A574" strokeWidth="1" opacity="0.5" />
        <line x1="6"  y1="6"  x2="11" y2="11" stroke="#D4A574" strokeWidth="0.5" opacity="0.3" />
        <line x1="21" y1="21" x2="26" y2="26" stroke="#D4A574" strokeWidth="0.5" opacity="0.3" />
        <line x1="26" y1="6"  x2="21" y2="11" stroke="#D4A574" strokeWidth="0.5" opacity="0.3" />
        <line x1="6"  y1="26" x2="11" y2="21" stroke="#D4A574" strokeWidth="0.5" opacity="0.3" />
      </svg>
    </motion.div>
  );
}
