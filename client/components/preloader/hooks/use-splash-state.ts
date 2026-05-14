"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TIMING } from "../constants";

export type SplashPhase = "loading" | "ready" | "dissolving" | "done";

export function useSplashState(progress: number): {
  phase: SplashPhase;
  alreadyShown: boolean;
} {
  const alreadyShown = useRef(false);

  const [phase, setPhase] = useState<SplashPhase>(() =>
    alreadyShown.current ? "done" : "loading"
  );

  const startTime = useRef(Date.now());
  const maxTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startDissolve = useCallback(() => {
    setPhase((current) => {
      if (current !== "ready") return current;
      return "dissolving";
    });
  }, []);

  // When phase transitions to "dissolving", write storage and schedule "done"
  useEffect(() => {
    if (phase === "dissolving") {
      const timer = setTimeout(() => {
        setPhase("done");
      }, TIMING.dissolutionDurationMs);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Auto-start dissolve when phase becomes "ready"
  useEffect(() => {
    if (phase === "ready") {
      // Let one frame pass so consumers can react to "ready" first
      const raf = requestAnimationFrame(() => startDissolve());
      return () => cancelAnimationFrame(raf);
    }
  }, [phase, startDissolve]);

  // Max timeout: force to "ready" if still loading after maxDisplayMs
  useEffect(() => {
    if (alreadyShown.current) return;

    maxTimeout.current = setTimeout(() => {
      setPhase((current) => (current === "loading" ? "ready" : current));
    }, TIMING.maxDisplayMs);

    return () => {
      if (maxTimeout.current) clearTimeout(maxTimeout.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Progress trigger: when progress >= 100 and phase is "loading"
  useEffect(() => {
    if (phase !== "loading" || progress < 100) return;

    const elapsed = Date.now() - startTime.current;
    const remaining = TIMING.minDisplayMs - elapsed;

    if (remaining <= 0) {
      setPhase("ready");
    } else {
      minTimeout.current = setTimeout(() => {
        setPhase((current) => (current === "loading" ? "ready" : current));
      }, remaining);
    }

    return () => {
      if (minTimeout.current) clearTimeout(minTimeout.current);
    };
  }, [progress, phase]);

  return { phase, alreadyShown: alreadyShown.current };
}
