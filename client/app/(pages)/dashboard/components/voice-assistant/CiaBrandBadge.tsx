"use client";

import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface CiaBrandBadgeProps {
  name?: string;
}

export function CiaBrandBadge({ name = "Cia" }: CiaBrandBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="pointer-events-none flex flex-col items-center"
      style={{ gap: "8px", width: "108.047px" }}
    >
      <div
        className="flex flex-col items-start rounded-full"
        style={{
          width: "56px",
          height: "56px",
          background: "#64c08a",
          boxShadow: "0 0 20px 0 rgba(100,192,138,0.4)",
          padding: "2px",
          paddingTop: "2px",
        }}
      >
        <div
          className="flex items-center justify-center rounded-full w-full"
          style={{
            height: "52px",
            background: "#14151c",
            paddingLeft: "14px",
            paddingRight: "14px",
          }}
        >
          <Sparkles
            style={{ width: "20px", height: "20px", color: "#ffffff", flexShrink: 0 }}
            strokeWidth={1.5}
          />
        </div>
      </div>

      <p
        className="text-center font-bold"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "20px",
          lineHeight: "28px",
          letterSpacing: "-0.5px",
          color: "#ffffff",
          margin: 0,
        }}
      >
        {name}
      </p>
    </motion.div>
  );
}
