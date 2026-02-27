"use client";

import { useScroll, useTransform, MotionValue } from "framer-motion";
import { RefObject } from "react";

interface ScrollAnimationOptions {
  // Scroll offset configuration [start, end]
  offset?: ["start end" | "start start" | "center center" | "end end" | "end start", "start end" | "start start" | "center center" | "end end" | "end start"];
}

interface ScrollAnimationResult {
  scrollYProgress: MotionValue<number>;
  // Scale animations (zoom in/out effects)
  scale: MotionValue<number>;
  scaleUp: MotionValue<number>;
  scaleDown: MotionValue<number>;
  // Opacity animations
  opacity: MotionValue<number>;
  opacityFadeIn: MotionValue<number>;
  opacityFadeOut: MotionValue<number>;
  // Y-axis movement
  y: MotionValue<number>;
  yUp: MotionValue<number>;
  yDown: MotionValue<number>;
  // Parallax effects
  parallaxSlow: MotionValue<number>;
  parallaxFast: MotionValue<number>;
  // Rotation
  rotate: MotionValue<number>;
  // Blur effect value (use with filter: `blur(${blur}px)`)
  blur: MotionValue<number>;
}

/**
 * Custom hook for creating n8n-style scroll animations
 * Provides various motion values for scroll-based animations
 */
export function useScrollAnimation(
  ref: RefObject<HTMLElement>,
  options: ScrollAnimationOptions = {}
): ScrollAnimationResult {
  const { offset = ["start end", "end start"] } = options;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  });

  // Scale animations
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const scaleUp = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.05, 0.85]);
  const scaleDown = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);

  // Opacity animations
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const opacityFadeIn = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const opacityFadeOut = useTransform(scrollYProgress, [0.7, 1], [1, 0]);

  // Y-axis movement
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const yUp = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const yDown = useTransform(scrollYProgress, [0, 1], [-50, 50]);

  // Parallax effects (different speeds)
  const parallaxSlow = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const parallaxFast = useTransform(scrollYProgress, [0, 1], [0, -300]);

  // Rotation
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 10]);

  // Blur effect
  const blur = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [10, 0, 0, 10]);

  return {
    scrollYProgress,
    scale,
    scaleUp,
    scaleDown,
    opacity,
    opacityFadeIn,
    opacityFadeOut,
    y,
    yUp,
    yDown,
    parallaxSlow,
    parallaxFast,
    rotate,
    blur,
  };
}

/**
 * Hook for creating a zoom-on-scroll effect like n8n
 * Element zooms in as you scroll into view, then zooms out as you scroll past
 */
export function useZoomOnScroll(
  ref: RefObject<HTMLElement>,
  { startScale = 0.8, peakScale = 1, endScale = 0.95 } = {}
) {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(
    scrollYProgress,
    [0, 0.4, 0.6, 1],
    [startScale, peakScale, peakScale, endScale]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.3, 1, 1, 0.3]
  );

  const y = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [80, 0, -80]
  );

  return { scrollYProgress, scale, opacity, y };
}

/**
 * Hook for creating a sticky zoom effect
 * Element scales up as it becomes centered, stays, then scales down
 */
export function useStickyZoom(ref: RefObject<HTMLElement>) {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0.7, 1, 1, 0.7]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [0, 1, 1, 0]
  );

  const blur = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [8, 0, 0, 8]
  );

  return { scrollYProgress, scale, opacity, blur };
}

/**
 * Hook for parallax background effects
 */
export function useParallax(ref: RefObject<HTMLElement>, speed: number = 0.5) {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, speed * -200]);

  return { scrollYProgress, y };
}
