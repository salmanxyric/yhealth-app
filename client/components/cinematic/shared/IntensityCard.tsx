"use client";

import { motion } from "framer-motion";

export interface IntensityOption {
  id: string;
  title: string;
  description: string;
  radius: number;
  atmosphere: string;
}

export const INTENSITY_OPTIONS: IntensityOption[] = [
  {
    id: "gentle",
    title: "Gentle Presence",
    description: "I'll be here when you need me. Quiet support, no pressure.",
    radius: 24,
    atmosphere: "linear-gradient(135deg, rgba(212,165,116,0.08) 0%, rgba(139,92,246,0.05) 100%)",
  },
  {
    id: "steady",
    title: "Steady Guide",
    description: "A consistent rhythm. I'll suggest, you decide.",
    radius: 16,
    atmosphere: "linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(212,165,116,0.06) 100%)",
  },
  {
    id: "accountability",
    title: "Full Accountability",
    description: "I'll push you. I'll track you. You asked for it.",
    radius: 8,
    atmosphere: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.08) 100%)",
  },
];

interface IntensityCardProps {
  option: IntensityOption;
  selected: boolean;
  onSelect: () => void;
  exiting?: boolean;
}

const spring = { type: "spring" as const, stiffness: 200, damping: 20, mass: 1 };

export function IntensityCard({ option, selected, onSelect, exiting }: IntensityCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className="relative border p-7 text-left cursor-pointer w-full overflow-hidden"
      style={{
        background: option.atmosphere,
        borderColor: selected ? "#D4A57480" : "rgba(255,255,255,0.06)",
        borderRadius: option.radius,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: selected
          ? "0 0 30px rgba(212,165,116,0.1), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
      whileHover={!selected && !exiting ? {
        y: -5,
        borderColor: "#D4A57440",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        transition: spring,
      } : undefined}
      animate={
        selected ? { flex: 1 } : exiting ? { opacity: 0, x: -100 } : { opacity: 1, x: 0 }
      }
      transition={spring}
    >
      <h3 className="text-lg font-medium mb-2" style={{ color: "var(--cin-text-primary, #F5F5F7)", letterSpacing: "0.01em" }}>
        {option.title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--cin-text-secondary, rgba(245,245,247,0.6))" }}>
        {option.description}
      </p>
    </motion.button>
  );
}
