"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";
import { GlassPanel } from "../shared/GlassPanel";
import { SiaIdentityMark } from "../shared/SiaIdentityMark";
import { DOMAINS } from "../CinematicContext";

const LINES = [
  { text: "I'm SIA — your life coach.", style: "normal" as const },
  { text: "I'm not a fitness app. I'm not a to-do list.", style: "negation" as const },
  { text: "I connect the parts of your life you've been managing separately.", style: "thesis" as const },
  { text: "Let me show you what I mean.", style: "cta" as const },
];

export function ActTwo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const domainsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !panelRef.current || !linesRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    // Panel slides in with spring-like overshoot
    tl.fromTo(
      panelRef.current,
      { y: 100, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 15, ease: "power3.out" },
      0
    );

    // Each line fades in sequentially, previous dims
    const lineEls = linesRef.current.querySelectorAll<HTMLDivElement>(".sia-line");
    lineEls.forEach((line, i) => {
      const startAt = 15 + i * 18;
      tl.fromTo(
        line,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 12, ease: "power2.out" },
        startAt
      );
      if (i > 0) {
        tl.to(lineEls[i - 1], { opacity: 0.4, duration: 8 }, startAt);
      }
    });

    // Domain dots pulse on "connect" line
    if (domainsRef.current) {
      const dots = domainsRef.current.querySelectorAll(".domain-dot");
      tl.fromTo(
        dots,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 0.6, stagger: 0.8, duration: 5, ease: "power2.out" },
        55
      );
    }
  }, sectionRef, []);

  return (
    <section ref={sectionRef} className="relative h-[120vh] flex items-center justify-center">
      <GlassPanel
        ref={panelRef}
        className="max-w-xl w-full mx-8 p-10 md:p-12"
        style={{ opacity: 0 }}
      >
        {/* SIA identity mark */}
        <div className="flex justify-center mb-8">
          <SiaIdentityMark size={40} />
        </div>

        {/* Dialogue lines */}
        <div ref={linesRef} className="space-y-6 text-center">
          {LINES.map((line, i) => (
            <div
              key={i}
              className="sia-line"
              style={{
                opacity: 0,
                color: line.style === "cta" ? "var(--cin-sia-accent, #D4A574)" : "var(--cin-text-primary, #F5F5F7)",
                fontSize: line.style === "cta" ? "1.125rem" : "1.5rem",
                fontStyle: line.style === "cta" ? "italic" : "normal",
                fontFamily: line.style === "cta" ? "var(--font-instrument-serif, serif)" : "inherit",
                fontWeight: 400,
              }}
            >
              {line.text}
            </div>
          ))}
        </div>

        {/* Mini domain network */}
        <div ref={domainsRef} className="flex justify-center gap-2 mt-8">
          {DOMAINS.slice(0, 5).map((d) => (
            <div
              key={d.id}
              className="domain-dot rounded-full"
              style={{
                width: 10,
                height: 10,
                backgroundColor: d.color,
                opacity: 0,
              }}
            />
          ))}
        </div>
      </GlassPanel>
    </section>
  );
}
