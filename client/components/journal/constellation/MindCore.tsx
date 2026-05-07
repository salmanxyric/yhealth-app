"use client";

/**
 * @file MindCore Component
 * @description Compact brain orb — smaller, purple-themed like the knowledge
 * graph reference. Concentric rings are rendered separately in
 * ConstellationSVGLines; MindCore is just the core sphere + brain icon.
 */

import { Brain } from "lucide-react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

interface Props {
  cx: number;
  cy: number;
}

const ORB = 108;   // inner sphere diameter (reduced 1.5rem per brief)
const HALO = 220;  // outer halo diameter

export function MindCore({ cx, cy }: Props) {
  const prefersReducedMotion = useReducedMotionSafe();
  const anim = (v: string) => (prefersReducedMotion ? undefined : v);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: cx,
        top: cy,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
      }}
    >
      {/* Distant slow aura (galaxy ring) */}
      <div
        className="mind-outer-aura absolute rounded-full pointer-events-none"
        style={{
          width: HALO + 56,
          height: HALO + 56,
          left: "50%",
          top: "50%",
          background:
            "radial-gradient(circle, rgba(196, 181, 253, 0.18) 0%, rgba(139, 92, 246, 0.1) 35%, rgba(88, 28, 135, 0.04) 65%, transparent 100%)",
          filter: "blur(8px)",
          transform: "translate(-50%, -50%)",
          animation: anim("mind-outer-aura 10s ease-in-out infinite"),
        }}
      />

      {/* Soft purple halo */}
      <div
        className="absolute rounded-full"
        style={{
          width: HALO,
          height: HALO,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(192, 132, 252, 0.55) 0%, rgba(168, 85, 247, 0.25) 38%, rgba(168, 85, 247, 0.07) 72%, transparent 100%)",
          filter: "blur(4px)",
          boxShadow: "0 0 50px 18px rgba(139, 92, 246, 0.2)",
          animation: anim("mind-halo-breathe 5s ease-in-out infinite"),
        }}
      />

      {/* Glass sphere — bright solid purple */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          width: ORB,
          height: ORB,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle at 38% 32%, rgba(192, 132, 252, 0.95) 0%, rgba(147, 51, 234, 0.92) 40%, rgba(126, 34, 206, 0.88) 70%, rgba(107, 33, 168, 0.85) 100%)",
          border: "1.5px solid rgba(216, 180, 254, 0.6)",
          boxShadow: [
            "inset 0 0 30px rgba(192, 132, 252, 0.5)",
            "inset 2px 3px 12px rgba(255, 255, 255, 0.15)",
            "inset -2px -3px 14px rgba(88, 28, 135, 0.4)",
            "0 0 50px rgba(168, 85, 247, 0.8)",
            "0 0 90px rgba(139, 92, 246, 0.45)",
            "0 0 130px rgba(147, 51, 234, 0.2)",
          ].join(", "),
        }}
      >
        {/* Inner luminous blobs */}
        <div
          className="absolute rounded-full"
          style={{
            width: "75%",
            height: "75%",
            left: "15%",
            top: "18%",
            background:
              "radial-gradient(circle, rgba(216, 180, 254, 0.7) 0%, rgba(192, 132, 252, 0.4) 45%, transparent 75%)",
            filter: "blur(14px)",
            mixBlendMode: "screen",
            animation: anim("mind-blob-drift-a 14s ease-in-out infinite"),
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "60%",
            height: "60%",
            left: "22%",
            top: "26%",
            background:
              "radial-gradient(circle, rgba(192, 132, 252, 0.65) 0%, rgba(168, 85, 247, 0.3) 50%, transparent 75%)",
            filter: "blur(12px)",
            mixBlendMode: "screen",
            animation: anim("mind-blob-drift-b 16s ease-in-out infinite"),
          }}
        />

        {/* Specular highlight */}
        <div
          className="absolute rounded-full"
          style={{
            width: "50%",
            height: "30%",
            top: "10%",
            left: "16%",
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 40%, transparent 70%)",
            filter: "blur(5px)",
            animation: anim("mind-spec-shift 7s ease-in-out infinite"),
          }}
        />

        {/* Brain icon */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: "#ffffff" }}
        >
          <Brain
            style={{
              width: 36,
              height: 36,
              filter:
                "drop-shadow(0 0 8px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 18px rgba(216, 180, 254, 0.7))",
            }}
            strokeWidth={1.75}
          />
        </div>
      </div>

      {/* Crisp outer ring */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: ORB + 4,
          height: ORB + 4,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          border: "1px solid rgba(168, 85, 247, 0.5)",
          boxShadow:
            "0 0 18px rgba(168, 85, 247, 0.55), 0 0 36px rgba(139, 92, 246, 0.2)",
        }}
      />
    </div>
  );
}
