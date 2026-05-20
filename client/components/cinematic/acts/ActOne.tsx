"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";

export function ActOne() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !textRef.current) return;

    const chars = textRef.current.querySelectorAll<HTMLSpanElement>(".act1-char");

    gsap.set(chars, { opacity: 0, y: 20 });

    gsap.to(chars, {
      opacity: 1,
      y: 0,
      duration: 0.05,
      stagger: 0.03,
      ease: "power2.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "80% bottom",
        end: "95% bottom",
        scrub: 1,
      },
    });

    gsap.fromTo(
      textRef.current,
      { fontWeight: 200, letterSpacing: "0.15em" },
      {
        fontWeight: 500,
        letterSpacing: "-0.01em",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "80% bottom",
          end: "95% bottom",
          scrub: 1,
        },
      }
    );
  }, sectionRef, []);

  const text = "Your life is one system. Let's see it clearly.";
  const words = text.split(" ");

  return (
    <section ref={sectionRef} className="relative h-screen flex items-end justify-center pb-24">
      <div
        ref={textRef}
        className="text-center text-5xl md:text-7xl leading-tight max-w-4xl px-8"
        style={{
          color: "var(--cin-text-primary, #F5F5F7)",
          fontFamily: "var(--font-instrument-serif, serif)",
          fontWeight: 200,
          letterSpacing: "0.15em",
        }}
      >
        {words.map((word, wi) => (
          <span key={wi} className="inline-block mr-[0.3em]">
            {word.split("").map((char, ci) => (
              <span key={ci} className="act1-char inline-block" style={{ opacity: 0 }}>
                {char}
              </span>
            ))}
          </span>
        ))}
      </div>
    </section>
  );
}
