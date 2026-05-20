"use client";

import { motion } from "framer-motion";

interface VisionCapsuleProps {
  text: string;
  selected: boolean;
  onSelect: () => void;
  delay?: number;
}

const spring = { type: "spring" as const, stiffness: 200, damping: 20, mass: 1 };

export function VisionCapsule({ text, selected, onSelect, delay = 0 }: VisionCapsuleProps) {
  return (
    <motion.button
      onClick={onSelect}
      className="w-full text-left rounded-full border px-7 py-4 cursor-pointer"
      style={{
        background: selected
          ? "linear-gradient(135deg, rgba(212,165,116,0.15) 0%, rgba(212,165,116,0.06) 100%)"
          : "rgba(20,20,22,0.7)",
        borderColor: selected ? "#D4A57480" : "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        color: "var(--cin-text-primary, #F5F5F7)",
        fontSize: "0.95rem",
        boxShadow: selected
          ? "0 0 20px rgba(212,165,116,0.08), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay }}
      whileHover={!selected ? {
        y: -3,
        borderColor: "#D4A57430",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
      } : undefined}
    >
      {text}
    </motion.button>
  );
}
