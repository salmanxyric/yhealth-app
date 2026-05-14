"use client";

import dynamic from "next/dynamic";

const CinematicSplash = dynamic(
  () => import("@/components/preloader/CinematicSplash").then((m) => ({ default: m.CinematicSplash })),
  { ssr: false }
);

export function CinematicSplashWrapper() {
  return <CinematicSplash />;
}
