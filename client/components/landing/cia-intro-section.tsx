"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";

/**
 * "Meet Cia" introduction section — large orb, eyebrow label,
 * display heading, and descriptive paragraph.
 *
 * Uses individual GSAP `from` tweens per child to stagger the
 * entrance exactly as the original landing page specifies.
 */
export default function CiaIntroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Orb scales up from nothing
      gsap.from(".cia-orb-big-wrap", {
        scale: 0,
        opacity: 0,
        duration: 1.4,
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: ".cia-intro",
          start: "top 70%",
        },
      });

      // Eyebrow fades up
      gsap.from(".cia-intro-eyebrow", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.2,
        scrollTrigger: {
          trigger: ".cia-intro",
          start: "top 70%",
        },
      });

      // Title fades up
      gsap.from(".cia-intro-title", {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.4,
        scrollTrigger: {
          trigger: ".cia-intro",
          start: "top 70%",
        },
      });

      // Description fades up
      gsap.from(".cia-intro-desc", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.6,
        scrollTrigger: {
          trigger: ".cia-intro",
          start: "top 70%",
        },
      });
    },
    sectionRef,
    []
  );

  return (
    <section className="cia-intro" ref={sectionRef}>
      <div className="cia-intro-content">
        <div className="cia-orb-big-wrap">
          <div className="cia-orb-big" />
        </div>
        <div className="cia-intro-eyebrow">
          <div className="eyebrow" style={{ marginBottom: 20 }}>
            Meet Cia
          </div>
        </div>
        <h2 className="h-display cia-intro-title">
          Your whole life,
          <br />
          <span className="serif">in one mind.</span>
        </h2>
        <p className="cia-intro-desc">
          Cia connects every part of your life &mdash; what you eat, how you
          sleep, what you spend, who you love, where you&rsquo;re heading
          &mdash; and helps you make better decisions across all of them.
        </p>
      </div>
    </section>
  );
}
