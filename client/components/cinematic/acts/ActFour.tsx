"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";
import { GlassPanel } from "../shared/GlassPanel";

const WEEKS = Array.from({ length: 12 }, (_, i) => ({
  week: i + 1,
  height: i === 3 ? 55 : i === 5 ? 70 : i === 11 ? 85 : 30 + Math.sin(i * 0.6) * 15 + i * 3,
  milestone: i === 3 ? "First milestone: consistent sleep rhythm" : i === 11 ? "Full system power" : null,
  highlight: i === 5,
}));

const INSIGHTS = [
  { from: "Sleep", to: "Mood", text: "Your sleep quality drops 23% on days with 3+ meetings", color: "#8B5CF6" },
  { from: "Meditation", to: "Focus", text: "Evening meditation correlates with next-day focus scores", color: "#10B981" },
];

const VIGNETTES = [
  { title: "Cross-Pillar Intelligence", subtitle: "Most apps see one dimension. SIA sees ten.", color: "#D4A574" },
  { title: "Adaptive Coaching", subtitle: "Your plan isn't fixed. It learns as you do.", color: "#3B82F6" },
  { title: "Predictive Insights", subtitle: "SIA doesn't just track — she anticipates.", color: "#8B5CF6" },
];

export function ActFour() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const vignettesRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    // Timeline bars grow in sequentially
    if (timelineRef.current) {
      const bars = timelineRef.current.querySelectorAll(".week-bar");
      gsap.fromTo(
        bars,
        { scaleY: 0, transformOrigin: "bottom" },
        {
          scaleY: 1,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "30% top",
            scrub: 1,
          },
        }
      );
    }

    // Insights slide in
    if (insightsRef.current) {
      const cards = insightsRef.current.querySelectorAll(".insight-card");
      gsap.fromTo(
        cards,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.3,
          ease: "power3.out",
          scrollTrigger: {
            trigger: insightsRef.current,
            start: "top 70%",
            end: "top 30%",
            scrub: 1,
          },
        }
      );
    }

    // Vignettes cascade in
    if (vignettesRef.current) {
      const cards = vignettesRef.current.querySelectorAll(".vignette-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: vignettesRef.current,
            start: "top 80%",
            end: "top 40%",
            scrub: 1,
          },
        }
      );
    }
  }, sectionRef, []);

  return (
    <section ref={sectionRef} className="relative h-[150vh] px-8 py-20" style={{ background: "var(--cin-void, #000)" }}>
      {/* Subtle gradient atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 40% at 50% 30%, rgba(139,92,246,0.03) 0%, transparent 60%)",
        }}
      />

      {/* Title */}
      <div className="relative text-center mb-20 pt-20">
        <p
          className="text-sm tracking-[0.2em] uppercase mb-4"
          style={{ color: "var(--cin-sia-accent, #D4A574)" }}
        >
          Building your first 12 weeks
        </p>
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-light"
          style={{
            color: "var(--cin-text-primary, #F5F5F7)",
            fontFamily: "var(--font-instrument-serif, serif)",
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
          }}
        >
          We start where it matters — your evening routine.
        </h2>
      </div>

      {/* 12-week timeline visualization */}
      <div ref={timelineRef} className="relative flex items-end justify-center gap-[6px] h-44 max-w-3xl mx-auto mb-24">
        {WEEKS.map((week) => (
          <div key={week.week} className="flex flex-col items-center flex-1">
            <div
              className="week-bar w-full rounded-t-sm"
              style={{
                height: week.height,
                background: week.highlight
                  ? "linear-gradient(to top, rgba(139,92,246,0.3), rgba(139,92,246,0.6))"
                  : week.milestone
                    ? "linear-gradient(to top, rgba(245,158,11,0.2), rgba(245,158,11,0.45))"
                    : "linear-gradient(to top, rgba(59,130,246,0.12), rgba(59,130,246,0.3))",
                borderTop: `1px solid ${week.highlight ? "rgba(139,92,246,0.5)" : week.milestone ? "rgba(245,158,11,0.4)" : "rgba(59,130,246,0.2)"}`,
                boxShadow: week.highlight ? "0 -4px 16px rgba(139,92,246,0.2)" : "none",
                transformOrigin: "bottom",
                transform: "scaleY(0)",
              }}
            />
            <span className="text-[10px] mt-2 font-medium" style={{ color: week.highlight ? "#8B5CF6" : "var(--cin-text-secondary)" }}>
              {week.highlight ? "W6" : week.milestone ? `W${week.week}` : ""}
            </span>
          </div>
        ))}
      </div>

      {/* Cross-domain insights — the money shot */}
      <div ref={insightsRef} className="relative max-w-2xl mx-auto mb-24">
        <p
          className="text-center text-xl md:text-2xl mb-10"
          style={{
            color: "var(--cin-text-primary, #F5F5F7)",
            fontFamily: "var(--font-instrument-serif, serif)",
            fontStyle: "italic",
            letterSpacing: "0.01em",
          }}
        >
          This is where it gets interesting.
        </p>
        <div className="space-y-4">
          {INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className="insight-card rounded-2xl border p-6 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, rgba(${hexToRgb(insight.color)}, 0.1) 0%, rgba(${hexToRgb(insight.color)}, 0.03) 100%)`,
                borderColor: `rgba(${hexToRgb(insight.color)}, 0.15)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
                opacity: 0,
              }}
            >
              <div className="text-xs font-medium mb-2 tracking-wide uppercase" style={{ color: insight.color }}>
                {insight.from} ↔ {insight.to}
              </div>
              <div className="text-sm leading-relaxed" style={{ color: "var(--cin-text-primary, #F5F5F7)" }}>
                {insight.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature vignettes */}
      <div ref={vignettesRef} className="relative grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {VIGNETTES.map((v, i) => (
          <GlassPanel key={i} className="vignette-card p-7" style={{ opacity: 0 }}>
            <div
              className="w-8 h-[2px] rounded-full mb-4"
              style={{ background: v.color }}
            />
            <div className="text-sm font-medium mb-2" style={{ color: v.color }}>
              {v.title}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--cin-text-secondary)" }}>
              {v.subtitle}
            </p>
          </GlassPanel>
        ))}
      </div>
    </section>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
