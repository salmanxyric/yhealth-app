"use client";

import { motion } from "framer-motion";

interface ActionCardProps {
  title: string;
  duration: string;
  domainColor: string;
  variant: "primary" | "secondary" | "tertiary";
  delay?: number;
}

export function ActionCard({ title, duration, domainColor, variant, delay = 0 }: ActionCardProps) {
  const opacityMap = { primary: 1, secondary: 0.7, tertiary: 0.5 };
  return (
    <motion.div
      className="rounded-xl border p-4"
      style={{
        background: `rgba(${hexToRgb(domainColor)}, 0.08)`,
        borderColor: `rgba(${hexToRgb(domainColor)}, 0.15)`,
        borderLeftWidth: 3,
        borderLeftColor: domainColor,
        opacity: opacityMap[variant],
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: opacityMap[variant], y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay }}
      viewport={{ once: true }}
    >
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: "var(--cin-text-primary, #F5F5F7)" }}>
          {title}
        </span>
        <span
          className="text-xs px-2 py-1 rounded"
          style={{ background: `rgba(${hexToRgb(domainColor)}, 0.15)`, color: domainColor }}
        >
          {duration}
        </span>
      </div>
    </motion.div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
