"use client";

import { useRef } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap } from "@/lib/gsap-init";

/**
 * "And that's not all" — 3x3 grid of mini-feature cards.
 * Each card staggers in per row (delay based on column index).
 */

const MINI_FEATURES = [
  { icon: "+", colorClass: "health", title: "Biological Age", desc: "One score that shows how you’re aging." },
  { icon: "$", colorClass: "finance", title: "Investments", desc: "Track portfolios, taxes, retirement." },
  { icon: "★", colorClass: "career", title: "Skill Building", desc: "Curated learning paths for your career." },
  { icon: "♥", colorClass: "relations", title: "Relationships", desc: "Birthdays, check-ins, hard conversations." },
  { icon: "◊", colorClass: "mind", title: "Mind & Recovery", desc: "Meditation, therapy prompts, reflection." },
  { icon: "↑", colorClass: "growth", title: "Personal Growth", desc: "Habits, journaling, life direction." },
  { icon: "≋", colorClass: "health", title: "Sleep Coach", desc: "Wake up restored, every morning." },
  { icon: "▦", colorClass: "finance", title: "Smart Calendar", desc: "Cia balances every part of your week." },
  { icon: "⊙", colorClass: "growth", title: "Goals", desc: "Quarterly OKRs for your whole life." },
] as const;

export default function MoreFeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const items = sectionRef.current.querySelectorAll(".mini-feature");
      items.forEach((item, i) => {
        gsap.from(item, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          delay: (i % 3) * 0.1,
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
          },
        });
      });
    },
    sectionRef,
    []
  );

  return (
    <section className="dark-section" ref={sectionRef}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>
            More life domains
          </div>
          <h2 className="h-section">
            She handles <span className="serif">everything else, too.</span>
          </h2>
        </div>

        <div className="more-features">
          {MINI_FEATURES.map((feat) => (
            <div className="mini-feature" key={feat.title}>
              <div className={`mini-feature-icon ${feat.colorClass}`}>
                {feat.icon}
              </div>
              <h4>{feat.title}</h4>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
