"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll-progress indicator — a thin bar at the top of the viewport
 * that grows from 0% to 100% width as the user scrolls the page.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    function handleScroll() {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const scrolled = (window.scrollY / totalHeight) * 100;
      bar!.style.width = `${scrolled}%`;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Set initial value in case the page is already scrolled on mount
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return <div className="scroll-progress" ref={barRef} />;
}
