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
      className="relative h-[90vh] flex items-center justify-center px-8"
      style={{ background: "var(--cin-void, #000)" }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,165,116,0.03) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* SIA Greeting */}
        <GlassPanel className="act5-item p-6 mb-4" style={{ opacity: 0 }}>
          <div className="flex items-start gap-4 mb-4">
            <SiaIdentityMark size={32} />
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--cin-text-primary, #F5F5F7)" }}>
              Good morning. Today we&apos;re focusing on your evening routine — small change, big ripple effect.
            </p>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--cin-text-secondary)" }}>
            Day 3 of your plan. 2 of 2 completed yesterday.
          </p>
          <div className="relative h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(139,92,246,0.15)" }}>
            <div className="absolute inset-y-0 left-0 w-2/3 rounded-full" style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.5), rgba(139,92,246,0.8))" }} />
          </div>
        </GlassPanel>

        {/* Intelligence teaser */}
        <GlassPanel
          className="act5-item p-5 mb-4"
          style={{ opacity: 0 }}
        >
          <p
            className="text-sm mb-4 font-medium"
            style={{ color: "var(--cin-sia-accent, #D4A574)", letterSpacing: "0.01em" }}
          >
            As we get to know each other, I&apos;ll start connecting dots across your life.
          </p>
          <div className="space-y-2">
            {["Sleep ↔ Mood correlation", "Stress pattern detection", "Cross-domain weekly report"].map((label) => (
              <div
                key={label}
                className="flex items-center gap-2.5 text-xs rounded-xl px-4 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  color: "var(--cin-text-secondary)",
                }}
              >
                <span style={{ opacity: 0.35, fontSize: 10 }}>🔒</span> {label}
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* Action cards */}
        <div className="act5-item space-y-2.5 mb-8" style={{ opacity: 0 }}>
          <ActionCard title="10-minute evening wind-down" duration="10 min" domainColor="#8B5CF6" variant="primary" delay={0} />
          <ActionCard title="Log last night's sleep" duration="2 min" domainColor="#10B981" variant="secondary" delay={0.1} />
          <ActionCard title="Set one intention for tomorrow" duration="3 min" domainColor="#D97706" variant="tertiary" delay={0.2} />
          <p className="text-center text-xs mt-3 tracking-wide" style={{ color: "var(--cin-text-secondary)" }}>~15 minutes today</p>
        </div>

        {/* Closing */}
        <div className="act5-item text-center" style={{ opacity: 0 }}>
          <p
            className="text-xl md:text-2xl mb-6"
            style={{
              color: "var(--cin-sia-accent, #D4A574)",
              fontFamily: "var(--font-instrument-serif, serif)",
              fontStyle: "italic",
              letterSpacing: "0.02em",
            }}
          >
            Welcome to Balencia. Let&apos;s begin.
          </p>
          <p className="text-xs tracking-[0.25em] uppercase" style={{ color: "rgba(245,245,247,0.3)" }}>
            Balencia
          </p>
        </div>
      </div>

      {/* Gradient transition to sections below */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent 0%, var(--cin-surface, #0A0A0B) 100%)" }}
      />
    </section>
  );
}
