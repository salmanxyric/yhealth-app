"use client";

import dynamic from "next/dynamic";
import { useCinematicState } from "./CinematicContext";

const Scene = dynamic(() => import("./ConstellationScene").then((m) => ({ default: m.ConstellationScene })), {
  ssr: false,
});

// Evaluated once at module load time on the client (this file is "use client",
// so it never runs on the server). Avoids any ref or effect access during render.
let _lowEndCache: boolean | null = null;
function isLowEndDevice(): boolean {
  if (typeof window === "undefined") return false;
  if (_lowEndCache === null) {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const lowEnd = navigator.hardwareConcurrency <= 4;
    _lowEndCache = mobile || lowEnd;
  }
  return _lowEndCache;
}

export function CinematicCanvas() {
  const { canvasOpacity } = useCinematicState();

  if (isLowEndDevice()) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        opacity: canvasOpacity,
        transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <Scene />
      {/* Bottom golden aurora wave */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[45%]"
        style={{
          background: "linear-gradient(175deg, transparent 30%, rgba(212,160,96,0.06) 55%, rgba(180,120,50,0.12) 75%, rgba(212,160,96,0.08) 100%)",
          maskImage: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.2) 100%)",
          WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.2) 100%)",
        }}
      />
      {/* Right blue/indigo aurora stream */}
      <div
        className="absolute top-0 right-0 bottom-0 w-[40%]"
        style={{
          background: "linear-gradient(to left, rgba(99,102,241,0.08) 0%, rgba(99,130,246,0.04) 35%, transparent 100%)",
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.1) 100%)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.1) 100%)",
        }}
      />
    </div>
  );
}
