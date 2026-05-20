"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";
import { GlassPanel } from "../shared/GlassPanel";
import { SiaIdentityMark } from "../shared/SiaIdentityMark";
import { ActionCard } from "../shared/ActionCard";

export function ActFive() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const items = sectionRef.current.querySelectorAll(".act5-item");
    gsap.fromTo(
      items,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
          end: "40% top",
          scrub: 1,
        },
      }
    );
  }, sectionRef, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[80vh] flex items-center justify-center px-8"
      style={{ background: "var(--cin-void, #000)" }}
    >
      <div className="w-full max-w-md">
        {/* SIA Greeting */}
        <GlassPanel className="act5-item p-5 mb-4" style={{ opacity: 0 }}>
          <div className="flex items-start gap-3 mb-3">
            <SiaIdentityMark size={28} />
            <p className="text-[15px]" style={{ color: "var(--cin-text-primary, #F5F5F7)" }}>
              Good morning. Today we&apos;re focusing on your evening routine — small change, big ripple effect.
            </p>
          </div>
          <p className="text-xs" style={{ color: "var(--cin-text-secondary)" }}>
            Day 3 of your plan. 2 of 2 completed yesterday.
          </p>
          <div className="h-[3px] rounded mt-3" style={{ background: "rgba(139,92,246,0.4)" }} />
        </GlassPanel>

        {/* Intelligence teaser */}
        <GlassPanel className="act5-item p-4 mb-4" style={{ opacity: 0, borderColor: "rgba(212,165,116,0.15)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--cin-sia-accent, #D4A574)" }}>
            As we get to know each other, I&apos;ll start connecting dots across your life.
          </p>
          <div className="space-y-2">
            {["Sleep ↔ Mood correlation", "Stress pattern detection", "Cross-domain weekly report"].map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                style={{ background: "rgba(255,255,255,0.03)", color: "var(--cin-text-secondary)" }}
              >
                <span style={{ opacity: 0.4 }}>🔒</span> {label}
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Action cards */}
        <div className="act5-item space-y-2 mb-6" style={{ opacity: 0 }}>
          <ActionCard title="10-minute evening wind-down" duration="10 min" domainColor="#8B5CF6" variant="primary" delay={0} />
          <ActionCard title="Log last night's sleep" duration="2 min" domainColor="#10B981" variant="secondary" delay={0.1} />
          <ActionCard title="Set one intention for tomorrow" duration="3 min" domainColor="#D97706" variant="tertiary" delay={0.2} />
          <p className="text-center text-xs mt-2" style={{ color: "var(--cin-text-secondary)" }}>~15 minutes today</p>
        </div>

        {/* Closing */}
        <div className="act5-item text-center" style={{ opacity: 0 }}>
          <p
            className="text-xl mb-6"
            style={{
              color: "var(--cin-sia-accent, #D4A574)",
              fontFamily: "var(--font-instrument-serif, serif)",
              fontStyle: "italic",
            }}
          >
            Welcome to Balencia. Let&apos;s begin.
          </p>
          <p className="text-sm tracking-[0.2em] uppercase" style={{ color: "var(--cin-text-secondary)" }}>
            Balencia
          </p>
        </div>

        {/* Gradient transition to sections below */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--cin-surface, #0A0A0B))" }}
        />
      </div>
    </section>
  );
}
