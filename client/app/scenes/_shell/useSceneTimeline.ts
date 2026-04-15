'use client';

import { useEffect, useState, type RefObject } from 'react';
import { gsap } from '@/lib/gsap-init';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useReducedMotionSafe } from '@/hooks/use-reduced-motion-safe';

export interface SceneTimelineConfig {
  pin?: boolean;
  start?: string;
  end?: string;
  scrub?: number | boolean;
  onUpdate?: (progress: number) => void;
  build?: (tl: gsap.core.Timeline) => void;
}

export interface SceneTimelineResult {
  progress: number;
  isActive: boolean;
  isMobile: boolean;
  prefersReduced: boolean;
}

export function useSceneTimeline(
  sceneRef: RefObject<HTMLElement | null>,
  config: SceneTimelineConfig = {},
): SceneTimelineResult {
  // `useIsMobile` returns `{ isMobile, isTablet }` in this codebase — destructure
  // the boolean we need rather than treating the return value as a boolean.
  const { isMobile } = useIsMobile();
  const prefersReduced = useReducedMotionSafe();
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        const tl = gsap.timeline({ paused: true });
        config.build?.(tl);
        tl.progress(1, false);
        config.onUpdate?.(1);
        setProgress(1);
        setIsActive(true);
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: config.start ?? 'top 80%',
          end: config.end ?? 'bottom 20%',
          scrub: config.scrub ?? 1,
          pin: !isMobile && !!config.pin,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setProgress(self.progress);
            config.onUpdate?.(self.progress);
          },
          onEnter:     () => setIsActive(true),
          onEnterBack: () => setIsActive(true),
          onLeave:     () => setIsActive(false),
          onLeaveBack: () => setIsActive(false),
        },
      });

      config.build?.(tl);
    }, el);

    return () => ctx.revert();
  }, [sceneRef, isMobile, prefersReduced, config.pin, config.start, config.end, config.scrub, config.build, config.onUpdate]);

  return { progress, isActive, isMobile, prefersReduced };
}
