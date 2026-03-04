"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugins once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.defaults({
    toggleActions: "play none none reverse",
  });

  // Debounce ScrollTrigger callbacks for performance
  ScrollTrigger.config({ limitCallbacks: true });
}

export { gsap, ScrollTrigger };
