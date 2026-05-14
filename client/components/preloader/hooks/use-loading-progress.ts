"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { gsap } from "@/lib/gsap-init";
import { TIMING } from "../constants";

export function useLoadingProgress(): number {
  const [smoothProgress, setSmoothProgress] = useState(0);
  const rawProgress = useRef(0);
  const animatedProgress = useRef({ value: 0 });

  const setProgress = useCallback((target: number) => {
    if (target <= rawProgress.current) return;
    rawProgress.current = target;

    gsap.to(animatedProgress.current, {
      value: target,
      duration: TIMING.progressSmoothingDuration,
      ease: "power2.out",
      onUpdate: () => {
        setSmoothProgress(animatedProgress.current.value);
      },
    });
  }, []);

  useEffect(() => {
    // Stage 1: Document ready (0 → 20%)
    const handleDocReady = () => setProgress(20);

    if (document.readyState === "complete") {
      handleDocReady();
    } else {
      window.addEventListener("load", handleDocReady, { once: true });
    }

    // Stage 2: Fonts loaded (20 → 40%)
    document.fonts.ready.then(() => {
      setProgress(40);
    });

    // Stage 3: App hydration (40 → 70%)
    const handleHydrated = () => setProgress(70);
    window.addEventListener("app-hydrated", handleHydrated, { once: true });

    // Stage 4: Critical assets (70 → 100%) — no critical images, use timeout
    const criticalAssetsTimer = setTimeout(() => {
      setProgress(100);
    }, 300);

    return () => {
      window.removeEventListener("load", handleDocReady);
      window.removeEventListener("app-hydrated", handleHydrated);
      clearTimeout(criticalAssetsTimer);
    };
  }, [setProgress]);

  return smoothProgress;
}
