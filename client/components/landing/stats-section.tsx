"use client";

import { useRef } from "react";
import { useGSAP, gsap, ScrollTrigger } from "@/hooks/use-gsap";

/* ─────────────────────────────────────────────
   Stat data model
   ───────────────────────────────────────────── */

interface StatData {
  /** CSS modifier class, e.g. "stat-orange" */
  colorClass: string;
  /** Icon character (emoji or symbol) */
  icon: string;
  /** Target value for counter animation */
  target: number;
  /** Number of decimals to show */
  decimals: number;
  /** Suffix shown after the animated number */
  suffix: string;
  /** Primary label */
  label: string;
  /** Secondary descriptor */
  subLabel: string;
  /** 0-100 progress bar fill percentage */
  fillPercent: number;
  /** SVG sparkline points for the filled area polygon */
  sparkFillPoints: string;
  /** SVG sparkline points for the stroke line */
  sparkLinePoints: string;
  /** Endpoint position for the sparkline dot */
  sparkDot: { cx: number; cy: number };
}

const STATS: StatData[] = [
  {
    colorClass: "stat-orange",
    icon: "◇", // diamond ◇
    target: 1,
    decimals: 1,
    suffix: "M+",
    label: "Members worldwide",
    subLabel: "84 countries · growing daily",
    fillPercent: 92,
    sparkFillPoints:
      "0,24 14,22 28,18 42,16 56,14 70,10 84,8 100,4 100,28 0,28",
    sparkLinePoints: "0,24 14,22 28,18 42,16 56,14 70,10 84,8 100,4",
    sparkDot: { cx: 100, cy: 4 },
  },
  {
    colorClass: "stat-bread",
    icon: "★", // star
    target: 4.8,
    decimals: 1,
    suffix: "★",
    label: "App Store rating",
    subLabel: "“Editor’s choice” · iOS 17+",
    fillPercent: 96,
    sparkFillPoints:
      "0,18 14,16 28,14 42,12 56,10 70,9 84,7 100,5 100,28 0,28",
    sparkLinePoints: "0,18 14,16 28,14 42,12 56,10 70,9 84,7 100,5",
    sparkDot: { cx: 100, cy: 5 },
  },
  {
    colorClass: "stat-purple",
    icon: "◈", // diamond ◈
    target: 28.6,
    decimals: 1,
    suffix: "k+",
    label: "5-star reviews",
    subLabel: "Across App Store & Play",
    fillPercent: 78,
    sparkFillPoints:
      "0,22 14,18 28,20 42,12 56,14 70,8 84,10 100,3 100,28 0,28",
    sparkLinePoints:
      "0,22 14,18 28,20 42,12 56,14 70,8 84,10 100,3",
    sparkDot: { cx: 100, cy: 3 },
  },
  {
    colorClass: "stat-lime",
    icon: "↗", // uptrend arrow
    target: 87,
    decimals: 0,
    suffix: "%",
    label: "Hit their weekly goals",
    subLabel: "Up from 62% pre-Cia",
    fillPercent: 87,
    sparkFillPoints:
      "0,26 14,22 28,18 42,20 56,14 70,16 84,8 100,2 100,28 0,28",
    sparkLinePoints:
      "0,26 14,22 28,18 42,20 56,14 70,16 84,8 100,2",
    sparkDot: { cx: 100, cy: 2 },
  },
];

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const section = sectionRef.current;
      const cards = section.querySelectorAll<HTMLElement>(".stat-premium");

      /* Set --stat-fill CSS var per card for the progress bar animation */
      cards.forEach((card) => {
        const fill = card.dataset.statFill || "87";
        card.style.setProperty("--stat-fill", `${fill}%`);
      });

      /* Header entrance */
      gsap.from(
        section.querySelectorAll(".stats-premium-header > *"),
        {
          y: 30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
          },
        }
      );

      /* Card reveal: staggered fade-up + counter animation + .stat-revealed toggle */
      cards.forEach((card, i) => {
        gsap.from(card, {
          y: 50,
          opacity: 0,
          duration: 0.8,
          delay: i * 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            once: true,
            onEnter: () => {
              // Stagger the CSS-driven reveal class
              setTimeout(
                () => card.classList.add("stat-revealed"),
                100 + i * 60
              );
            },
          },
        });
      });

      /* Counter animation for each .counter element */
      const counters =
        section.querySelectorAll<HTMLElement>(".counter");
      counters.forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () => {
            const target = parseFloat(el.dataset.target || "0");
            const decimals = parseInt(el.dataset.decimals || "0", 10);
            const obj = { val: 0 };

            gsap.to(obj, {
              val: target,
              duration: 1.8,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = obj.val.toFixed(decimals);
              },
            });
          },
        });
      });
    },
    sectionRef,
    []
  );

  return (
    <section
      className="stats-premium-section"
      id="statsPremium"
      ref={sectionRef}
      aria-label="Platform statistics"
    >
      <div className="stats-premium-inner">
        {/* Header */}
        <div className="stats-premium-header">
          <div className="stats-premium-eyebrow">Trusted globally</div>
          <h2 className="stats-premium-title">
            Numbers that{" "}
            <span className="serif">move with us.</span>
          </h2>
          <p className="stats-premium-sub">
            A million people letting Cia coach their whole life &ndash;
            across 84 countries and growing.
          </p>
        </div>

        {/* Grid */}
        <div className="stats-premium-grid" role="list">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className={`stat-premium ${stat.colorClass}`}
              data-stat-fill={stat.fillPercent}
              role="listitem"
            >
              {/* Top row: icon + sparkline */}
              <div className="stat-premium-top">
                <div
                  className="stat-premium-icon"
                  aria-hidden="true"
                >
                  {stat.icon}
                </div>
                <div className="stat-premium-spark">
                  <svg
                    viewBox="0 0 100 28"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <polygon
                      className="stat-premium-spark-fill"
                      points={stat.sparkFillPoints}
                    />
                    <polyline
                      className="stat-premium-spark-line"
                      points={stat.sparkLinePoints}
                    />
                    <circle
                      className="stat-premium-spark-dot"
                      cx={stat.sparkDot.cx}
                      cy={stat.sparkDot.cy}
                      r={2.5}
                    />
                  </svg>
                </div>
              </div>

              {/* Counter number */}
              <div className="stat-premium-num">
                <span
                  className="counter"
                  data-target={stat.target}
                  data-decimals={stat.decimals}
                  aria-label={`${stat.target}${stat.suffix}`}
                >
                  0
                </span>
                <span className="stat-premium-num-suffix">
                  {stat.suffix}
                </span>
              </div>

              {/* Labels */}
              <div>
                <div className="stat-premium-label">{stat.label}</div>
                <div className="stat-premium-sub-label">
                  {stat.subLabel}
                </div>
              </div>

              {/* Progress bar */}
              <div className="stat-premium-bar">
                <div />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
