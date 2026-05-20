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
      className="w-full text-left rounded-full border px-6 py-4 cursor-pointer"
      style={{
        background: selected ? "rgba(212,165,116,0.12)" : "rgba(20,20,22,0.7)",
        borderColor: selected ? "#D4A57480" : "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        color: "var(--cin-text-primary, #F5F5F7)",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay }}
      whileHover={!selected ? { y: -4, borderColor: "#D4A57440" } : undefined}
    >
      {text}
    </motion.button>
  );
}
