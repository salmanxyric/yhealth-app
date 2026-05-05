"use client";

import { useRef, useEffect, useCallback } from "react";

/**
 * SpringLine -- decorative SVG connecting line that draws on scroll.
 *
 * A sinusoidal path spans from below the hero to near the bottom of the
 * document. As the user scrolls, the stroke is progressively revealed
 * (via strokeDashoffset) and a small orb travels along the path.
 *
 * All animation is driven by a passive scroll listener -- no GSAP dependency
 * required here since the original JS uses raw scroll math, not ScrollTrigger.
 */
export default function SpringLine() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const orbRef = useRef<SVGCircleElement>(null);

  /** Measures the document, rebuilds the sinusoidal path, and wires the scroll handler. */
  const setup = useCallback(() => {
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    const orb = orbRef.current;
    if (!wrap || !svg || !path || !orb) return;

    // ------------------------------------------------------------------
    // 1. Size the wrapper so the SVG line spans from below the hero
    //    to one viewport above the bottom of the document.
    // ------------------------------------------------------------------
    const docHeight = document.documentElement.scrollHeight;
    const heroEl = document.querySelector(".hero") as HTMLElement | null;
    const heroHeight = heroEl?.offsetHeight ?? window.innerHeight;
    const lineHeight = docHeight - heroHeight - window.innerHeight;

    wrap.style.top = `${heroHeight}px`;
    wrap.style.height = `${lineHeight}px`;

    // ------------------------------------------------------------------
    // 2. Build the sinusoidal quadratic-Bezier path.
    //    Amplitude 80 px (cx alternates 200/40), wavelength ~400 px.
    // ------------------------------------------------------------------
    const segments = Math.max(4, Math.floor(lineHeight / 400));
    const segmentH = lineHeight / segments;
    let d = "M120,0";
    for (let i = 1; i <= segments; i++) {
      const cpx = i % 2 === 1 ? 200 : 40;
      const cpy = (i - 0.5) * segmentH;
      const ex = 120;
      const ey = i * segmentH;
      d += ` Q${cpx},${cpy} ${ex},${ey}`;
    }
    path.setAttribute("d", d);
    svg.setAttribute("viewBox", `0 0 240 ${lineHeight}`);
    svg.setAttribute("height", String(lineHeight));

    // ------------------------------------------------------------------
    // 3. Stroke-draw preparation.
    // ------------------------------------------------------------------
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);

    // ------------------------------------------------------------------
    // 4. Scroll handler -- drives stroke reveal + orb position.
    // ------------------------------------------------------------------
    function onScroll() {
      const wrapTop = wrap!.offsetTop;
      const viewBottom = window.scrollY + window.innerHeight;

      // progress: 0 when wrap-top is at viewport bottom,
      //           1 when wrap-bottom is at viewport top
      let progress =
        (viewBottom - wrapTop) / (wrap!.offsetHeight + window.innerHeight);
      progress = Math.max(0, Math.min(1, progress));

      // Animate stroke draw
      path!.style.strokeDashoffset = String(len * (1 - progress));

      // Move orb along the path
      const point = path!.getPointAtLength(len * progress);
      orb!.setAttribute("cx", String(point.x));
      orb!.setAttribute("cy", String(point.y));
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // set initial state

    // Return cleanup so the effect can teardown on unmount / re-run.
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const cleanup = setup();

    // Debounced resize -- rebuilds the path when the document height changes.
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Teardown old listener before rebuilding.
        cleanup?.();
        setup();
      }, 250);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cleanup?.();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [setup]);

  return (
    <div
      ref={wrapRef}
      className="spring-line-wrap"
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        className="spring-line-svg"
        viewBox="0 0 240 4000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="springGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D95F0E" />
            <stop offset="35%" stopColor="#F18A3F" />
            <stop offset="65%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#A3E635" />
          </linearGradient>
          <radialGradient id="springOrbGrad" cx="0.35" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#F18A3F" />
            <stop offset="60%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#A39EFF" />
          </radialGradient>
        </defs>
        <path
          ref={pathRef}
          className="spring-line-path"
          d="M120,0 Q200,200 120,400 Q40,600 120,800 Q200,1000 120,1200 Q40,1400 120,1600 Q200,1800 120,2000 Q40,2200 120,2400 Q200,2600 120,2800 Q40,3000 120,3200 Q200,3400 120,3600 Q40,3800 120,4000"
        />
        <circle
          ref={orbRef}
          className="spring-line-orb"
          cx="120"
          cy="0"
          r="6"
          fill="url(#springOrbGrad)"
        />
      </svg>
    </div>
  );
}
