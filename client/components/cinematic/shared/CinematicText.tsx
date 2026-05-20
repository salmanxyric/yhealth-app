"use client";

import { useRef, useEffect, type CSSProperties } from "react";
import { gsap } from "@/lib/gsap-init";

interface CinematicTextProps {
  text: string;
  className?: string;
  style?: CSSProperties;
  charSpeed?: number;
  onComplete?: () => void;
  trigger?: boolean;
  dimTo?: number;
  dimmed?: boolean;
}

export function CinematicText({
  text,
  className = "",
  style,
  charSpeed = 45,
  onComplete,
  trigger = true,
  dimTo = 0.4,
  dimmed = false,
}: CinematicTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!trigger || hasAnimated.current || !containerRef.current) return;
    hasAnimated.current = true;

    const chars = containerRef.current.querySelectorAll<HTMLSpanElement>(".cin-char");
    gsap.set(chars, { opacity: 0 });
    gsap.to(chars, {
      opacity: 1,
      duration: 0.05,
      stagger: charSpeed / 1000,
      ease: "none",
      onComplete,
    });
  }, [trigger, charSpeed, onComplete]);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.to(containerRef.current, {
      opacity: dimmed ? dimTo : 1,
      duration: 0.4,
      ease: "power2.out",
    });
  }, [dimmed, dimTo]);

  const chars = text.split("").map((char, i) => (
    <span key={i} className="cin-char inline-block" style={{ opacity: 0 }}>
      {char === " " ? " " : char}
    </span>
  ));

  return (
    <div ref={containerRef} className={className} style={style}>
      {chars}
    </div>
  );
}
