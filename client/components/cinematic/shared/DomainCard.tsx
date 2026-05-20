"use client";

import { motion } from "framer-motion";
import type { Domain } from "../CinematicContext";

interface DomainCardProps {
  domain: Domain;
  selected: boolean;
  onSelect: (id: string) => void;
  exitDelay?: number;
  exiting?: boolean;
}

const spring = { type: "spring" as const, stiffness: 200, damping: 20, mass: 1 };

export function DomainCard({ domain, selected, onSelect, exitDelay = 0, exiting }: DomainCardProps) {
  return (
    <motion.button
      onClick={() => onSelect(domain.id)}
      className="relative rounded-2xl border p-5 text-center cursor-pointer w-full overflow-hidden"
      style={{
        background: selected
          ? `linear-gradient(135deg, rgba(${hexToRgb(domain.color)}, 0.18) 0%, rgba(${hexToRgb(domain.color)}, 0.06) 100%)`
          : `rgba(${hexToRgb(domain.color)}, 0.06)`,
        borderColor: selected ? `${domain.color}80` : `${domain.color}20`,
        boxShadow: selected
          ? `0 0 24px rgba(${hexToRgb(domain.color)}, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)`
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
      whileHover={!selected && !exiting ? {
        y: -6,
        borderColor: `${domain.color}60`,
        boxShadow: `0 8px 24px rgba(${hexToRgb(domain.color)}, 0.12), inset 0 1px 0 rgba(255,255,255,0.06)`,
        transition: spring,
      } : undefined}
      animate={
        selected
          ? { scale: 1.08, zIndex: 10 }
          : exiting
            ? { opacity: 0, scale: 0.5, transition: { delay: exitDelay * 0.08 } }
            : { scale: 1, opacity: 1 }
      }
      transition={spring}
      layout
    >
      <div className="text-2xl mb-2">{domain.icon}</div>
      <div className="text-sm font-medium" style={{ color: domain.color }}>
        {domain.label}
      </div>
      <div className="text-[11px] mt-1" style={{ color: "var(--cin-text-secondary, rgba(245,245,247,0.6))" }}>
        {domain.subLabel}
      </div>
    </motion.button>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
