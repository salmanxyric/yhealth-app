"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CallQualityIndicatorProps {
  quality: "excellent" | "good" | "fair" | "poor" | "unknown";
  visible: boolean;
}

const QUALITY_CONFIG: Record<
  CallQualityIndicatorProps["quality"],
  { filledBars: number; color: string; label: string }
> = {
  excellent: { filledBars: 4, color: "#22c55e", label: "Excellent" },
  good: { filledBars: 3, color: "#22c55e", label: "Good" },
  fair: { filledBars: 2, color: "#eab308", label: "Fair" },
  poor: { filledBars: 1, color: "#ef4444", label: "Poor" },
  unknown: { filledBars: 0, color: "#6b7280", label: "Unknown" },
};

const BAR_HEIGHTS = [6, 10, 14, 18];

export function CallQualityIndicator({ quality, visible }: CallQualityIndicatorProps) {
  const { filledBars, color, label } = QUALITY_CONFIG[quality];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative group flex items-center justify-center"
          style={{
            width: "24px",
            height: "24px",
            background: "#09090e",
            borderRadius: "4px",
          }}
          role="img"
          aria-label={`Call quality: ${label}`}
        >
          <div
            className="flex items-end justify-center"
            style={{ gap: "2px", height: "18px" }}
          >
            {BAR_HEIGHTS.map((height, index) => {
              const isFilled = index < filledBars;
              return (
                <motion.div
                  key={index}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.15, delay: index * 0.04 }}
                  style={{
                    width: "3px",
                    height: `${height}px`,
                    borderRadius: "1px",
                    background: isFilled ? color : "rgba(255,255,255,0.15)",
                    transformOrigin: "bottom",
                  }}
                />
              );
            })}
          </div>

          {/* Tooltip */}
          <div
            className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded px-2 py-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: "#1a1a24",
              color: "#d1d5dc",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: "10px",
              lineHeight: "14px",
            }}
            role="tooltip"
          >
            {label}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
