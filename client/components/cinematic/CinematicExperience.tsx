"use client";

import { useRef } from "react";
import { CinematicProvider } from "./CinematicContext";
import { CinematicCanvas } from "./CinematicCanvas";
import { useMasterTimeline } from "./useMasterTimeline";
import { ActOne } from "./acts/ActOne";
import { ActTwo } from "./acts/ActTwo";
import { ActThree } from "./acts/ActThree";
import { ActFour } from "./acts/ActFour";
import { ActFive } from "./acts/ActFive";

function CinematicInner() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const actThreeRef = useRef<HTMLDivElement>(null);

  const { releasePin } = useMasterTimeline({
    scrollContainer: scrollContainerRef,
    actThree: actThreeRef,
  });

  return (
    <>
      <CinematicCanvas />
      <div ref={scrollContainerRef} className="relative z-10">
        <ActOne />
        <ActTwo />
        <div ref={actThreeRef}>
          <ActThree onComplete={releasePin} />
        </div>
        <ActFour />
        <ActFive />
      </div>
    </>
  );
}

export function CinematicExperience() {
  return (
    <CinematicProvider>
      <CinematicInner />
    </CinematicProvider>
  );
}
