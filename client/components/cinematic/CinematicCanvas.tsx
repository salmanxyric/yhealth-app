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
      style={{ opacity: canvasOpacity, transition: "opacity 0.3s ease-out" }}
    >
      <Scene />
    </div>
  );
}
