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
      {/* Ambient glow */}
      <div
        className="absolute rounded-full"
        style={{
          inset: "-40%",
          background: "radial-gradient(circle, rgba(212,165,116,0.25) 0%, rgba(212,165,116,0.08) 40%, transparent 70%)",
          filter: "blur(6px)",
        }}
      />
      <svg viewBox="0 0 32 32" fill="none" className="absolute inset-0 w-full h-full">
        {/* Outer ring */}
        <circle cx="16" cy="16" r="13" stroke="url(#siaGrad)" strokeWidth="0.8" opacity="0.5" />
        <circle cx="16" cy="16" r="10" stroke="#D4A574" strokeWidth="0.5" opacity="0.2" strokeDasharray="2 3" />
        {/* Core */}
        <circle cx="16" cy="16" r="4" fill="url(#siaCore)" opacity="0.95" />
        <circle cx="16" cy="16" r="4" fill="none" stroke="#D4A574" strokeWidth="0.5" opacity="0.4" />
        {/* Cardinal lines */}
        <line x1="16" y1="1"  x2="16" y2="8"  stroke="url(#siaLine)" strokeWidth="0.8" />
        <line x1="16" y1="24" x2="16" y2="31" stroke="url(#siaLine)" strokeWidth="0.8" />
        <line x1="1"  y1="16" x2="8"  y2="16" stroke="url(#siaLine)" strokeWidth="0.8" />
        <line x1="24" y1="16" x2="31" y2="16" stroke="url(#siaLine)" strokeWidth="0.8" />
        {/* Diagonal lines */}
        <line x1="5"  y1="5"  x2="10" y2="10" stroke="#D4A574" strokeWidth="0.4" opacity="0.25" />
        <line x1="22" y1="22" x2="27" y2="27" stroke="#D4A574" strokeWidth="0.4" opacity="0.25" />
        <line x1="27" y1="5"  x2="22" y2="10" stroke="#D4A574" strokeWidth="0.4" opacity="0.25" />
        <line x1="5"  y1="27" x2="10" y2="22" stroke="#D4A574" strokeWidth="0.4" opacity="0.25" />
        {/* Gradients */}
        <defs>
          <radialGradient id="siaCore" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#E8C49A" />
            <stop offset="100%" stopColor="#D4A574" />
          </radialGradient>
          <linearGradient id="siaGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D4A574" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#D4A574" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4A574" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="siaLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A574" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#D4A574" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D4A574" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}
