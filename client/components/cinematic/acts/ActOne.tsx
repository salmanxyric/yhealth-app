"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";

export function ActOne() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current || !textRef.current) return;

    const chars = textRef.current.querySelectorAll<HTMLSpanElement>(".act1-char");

    gsap.set(chars, { opacity: 0, y: 30, filter: "blur(8px)" });

    gsap.to(chars, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.05,
      stagger: 0.04,
      ease: "power3.out",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 60%",
        end: "center center",
        scrub: 1,
      },
    });

    gsap.fromTo(
      textRef.current,
      { fontWeight: 200, letterSpacing: "0.12em" },
      {
        fontWeight: 500,
        letterSpacing: "-0.02em",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "center center",
          scrub: 1,
        },
      }
    );

    if (subtitleRef.current) {
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "30% center",
            end: "60% center",
            scrub: 1,
          },
        }
      );
    }
  }, sectionRef, []);

  const text = "Your life is one system.";
  const text2 = "Let's see it clearly.";
  const words = text.split(" ");
  const words2 = text2.split(" ");

  return (
    <section ref={sectionRef} className="relative h-[120vh] flex flex-col items-center justify-center">
      {/* Radial gradient atmosphere behind text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,92,246,0.04) 0%, transparent 70%)",
        }}
      />
      <div
        ref={textRef}
        className="relative text-center text-4xl md:text-6xl lg:text-7xl leading-[1.15] max-w-5xl px-8"
        style={{
          color: "var(--cin-text-primary, #F5F5F7)",
          fontFamily: "var(--font-instrument-serif, serif)",
          fontWeight: 200,
          letterSpacing: "0.12em",
        }}
      >
        <div className="mb-2">
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
        <div>
          {words2.map((word, wi) => (
            <span key={wi} className="inline-block mr-[0.3em]">
              {word.split("").map((char, ci) => (
                <span key={ci} className="act1-char inline-block" style={{ opacity: 0 }}>
                  {char}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div
        ref={subtitleRef}
        className="relative mt-8 text-sm tracking-[0.3em] uppercase"
        style={{ color: "var(--cin-sia-accent, #D4A574)", opacity: 0 }}
      >
        Balencia
      </div>
    </section>
  );
}
