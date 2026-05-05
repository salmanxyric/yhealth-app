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

      {/* Glass sphere */}
      <div
        className="absolute rounded-full overflow-hidden"
        style={{
          width: ORB,
          height: ORB,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle at 30% 28%, rgba(99, 102, 241, 0.35) 0%, rgba(88, 28, 135, 0.55) 55%, rgba(15, 5, 35, 0.95) 100%)",
          border: "1px solid rgba(168, 85, 247, 0.5)",
          boxShadow: [
            "inset 0 0 40px rgba(168, 85, 247, 0.25)",
            "inset 2px 3px 16px rgba(255, 255, 255, 0.08)",
            "inset -3px -4px 20px rgba(0, 0, 0, 0.5)",
            "0 0 40px rgba(168, 85, 247, 0.65)",
            "0 0 72px rgba(139, 92, 246, 0.28)",
          ].join(", "),
        }}
      >
        {/* Inner flowing blobs — purple / violet / indigo */}
        <div
          className="absolute rounded-full"
          style={{
            width: "75%",
            height: "75%",
            left: "15%",
            top: "18%",
            background:
              "radial-gradient(circle, rgba(168, 85, 247, 0.85) 0%, rgba(168, 85, 247, 0.3) 45%, transparent 75%)",
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
              "radial-gradient(circle, rgba(139, 92, 246, 0.75) 0%, rgba(139, 92, 246, 0.25) 50%, transparent 75%)",
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
              "radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.08) 40%, transparent 70%)",
            filter: "blur(5px)",
            animation: anim("mind-spec-shift 7s ease-in-out infinite"),
          }}
        />

        {/* Brain icon */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: "#e9d5ff" }}
        >
          <Brain
            style={{
              width: 36,
              height: 36,
              filter:
                "drop-shadow(0 0 10px rgba(233, 213, 255, 0.95)) drop-shadow(0 0 20px rgba(192, 132, 252, 0.55))",
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
