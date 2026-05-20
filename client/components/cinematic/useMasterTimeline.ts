"use client";

import { useRef, useLayoutEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";
import { useCinematicStore } from "./CinematicContext";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

export interface MasterTimelineRefs {
  scrollContainer: React.RefObject<HTMLDivElement | null>;
  actThree: React.RefObject<HTMLDivElement | null>;
}

export function useMasterTimeline(refs: MasterTimelineRefs) {
  const store = useCinematicStore();
  const prefersReducedMotion = useReducedMotionSafe();
  const masterRef = useRef<gsap.core.Timeline | null>(null);
  const actThreePinRef = useRef<ScrollTrigger | null>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    if (!refs.scrollContainer.current) return;

    const master = gsap.timeline({
      scrollTrigger: {
        trigger: refs.scrollContainer.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          store.setProgress(self.progress);
        },
      },
    });

    // Placeholder tweens to establish timeline duration proportions.
    // Each act component will add real animations via addActTimeline().
    master.to({}, { duration: 17 }, 0);       // Act I:   0–17%
    master.to({}, { duration: 23 }, 17);      // Act II:  17–40%
    master.to({}, { duration: 30 }, 40);      // Act III: 40–70%
    master.to({}, { duration: 23 }, 70);      // Act IV:  70–93%
    master.to({}, { duration: 7 },  93);      // Act V:   93–100%

    masterRef.current = master;

    // Act III pin
    if (refs.actThree.current) {
      actThreePinRef.current = ScrollTrigger.create({
        id: "actThreePin",
        trigger: refs.actThree.current,
        start: "top top",
        end: "+=150%",
        pin: true,
        onEnter: () => {
          master.scrollTrigger?.disable();
          store.setInteractive(true);
        },
        onLeaveBack: () => {
          master.scrollTrigger?.enable();
          store.setInteractive(false);
        },
      });
    }

    return () => {
      actThreePinRef.current?.kill();
      master.kill();
    };
  }, [prefersReducedMotion, refs.scrollContainer, refs.actThree, store]);

  const releasePin = () => {
    actThreePinRef.current?.disable();
    masterRef.current?.scrollTrigger?.enable();
    store.setInteractive(false);
  };

  return { masterRef, releasePin };
}
