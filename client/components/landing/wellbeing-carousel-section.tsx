"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useGSAP } from "@/hooks/use-gsap";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WellbeingCard {
  num: string;
  total: string;
  icon: string;
  title: string;
  description: string;
  statLabel: string;
  statValue: string;
  statColor: string;
  action: string;
  actionColor: string;
  iconBg: string;
  iconColor: string;
  imageUrl: string;
}

// ---------------------------------------------------------------------------
// Static card data (matches source HTML exactly: 9 wellbeing modules)
// ---------------------------------------------------------------------------

const CARDS: WellbeingCard[] = [
  {
    num: "01",
    total: "09",
    icon: "☺", // ☺
    title: "Mood",
    description:
      "Track your emotional state throughout the day. Cia spots patterns you can't.",
    statLabel: "Logged",
    statValue: "3h ago",
    statColor: "#E8765A",
    action: "Log now",
    actionColor: "var(--cream)",
    iconBg: "linear-gradient(135deg, #E8765A, #B5523B)",
    iconColor: "white",
    imageUrl: "https://picsum.photos/seed/mood/800/1000",
  },
  {
    num: "02",
    total: "09",
    icon: "⚡", // ⚡
    title: "Energy",
    description:
      "Monitor your energy levels and patterns. Know when to push and when to rest.",
    statLabel: "Logged",
    statValue: "5h ago",
    statColor: "var(--orange-soft)",
    action: "Log now",
    actionColor: "var(--cream)",
    iconBg: "linear-gradient(135deg, var(--orange), #A04408)",
    iconColor: "white",
    imageUrl: "https://picsum.photos/seed/energy/800/1000",
  },
  {
    num: "03",
    total: "09",
    icon: "📖", // 📖
    title: "Journal",
    description:
      "Reflect with guided prompts and AI personalization. Cia asks the right questions.",
    statLabel: "Last entry",
    statValue: "Yesterday",
    statColor: "var(--purple-soft)",
    action: "Open",
    actionColor: "var(--lime)",
    iconBg: "linear-gradient(135deg, var(--purple), #2D2799)",
    iconColor: "white",
    imageUrl: "https://picsum.photos/seed/journal/800/1000",
  },
  {
    num: "04",
    total: "09",
    icon: "⊙", // ⊙
    title: "Habits",
    description:
      "Build and track your daily habits. Streaks, nudges, and gentle accountability.",
    statLabel: "Today",
    statValue: "4 / 5",
    statColor: "var(--mind)",
    action: "Open",
    actionColor: "var(--lime)",
    iconBg: "linear-gradient(135deg, var(--mind), #2F706A)",
    iconColor: "white",
    imageUrl: "https://picsum.photos/seed/habits/800/1000",
  },
  {
    num: "05",
    total: "09",
    icon: "∼", // ∼
    title: "Stress",
    description:
      "Multi-signal stress detection from heart rate, sleep, and behavior patterns.",
    statLabel: "Logged",
    statValue: "2h ago",
    statColor: "#E84545",
    action: "Log now",
    actionColor: "var(--cream)",
    iconBg: "linear-gradient(135deg, #E84545, #A02828)",
    iconColor: "white",
    imageUrl: "https://picsum.photos/seed/stress/800/1000",
  },
  {
    num: "06",
    total: "09",
    icon: "▦", // ▦
    title: "Schedule",
    description:
      "Plan your day with time-based activities and intelligent rescheduling.",
    statLabel: "Today",
    statValue: "3 active",
    statColor: "var(--purple-soft)",
    action: "Open",
    actionColor: "var(--lime)",
    iconBg: "linear-gradient(135deg, var(--purple-soft), var(--purple))",
    iconColor: "white",
    imageUrl: "https://picsum.photos/seed/schedule/800/1000",
  },
  {
    num: "07",
    total: "09",
    icon: "≋", // ≋
    title: "Breathing",
    description:
      "Lung capacity tests and guided breathing exercises that actually calm you down.",
    statLabel: "Last session",
    statValue: "2 days ago",
    statColor: "var(--lime)",
    action: "Start",
    actionColor: "var(--lime)",
    iconBg: "linear-gradient(135deg, var(--lime), #7DBA1F)",
    iconColor: "var(--ink)",
    imageUrl: "https://picsum.photos/seed/breathing/800/1000",
  },
  {
    num: "08",
    total: "09",
    icon: "♥", // ♥
    title: "Emotional Check-in",
    description:
      "Brief screening conversation with Cia to notice patterns and get support early.",
    statLabel: "Status",
    statValue: "Available",
    statColor: "#E8765A",
    action: "Start",
    actionColor: "var(--lime)",
    iconBg: "linear-gradient(135deg, #E8765A, #B5523B)",
    iconColor: "white",
    imageUrl: "https://picsum.photos/seed/emotional/800/1000",
  },
  {
    num: "09",
    total: "09",
    icon: "◉", // ◉
    title: "Insights",
    description:
      "Health correlations and recurring themes from your journals — surfaced by Cia.",
    statLabel: "Updated",
    statValue: "Auto",
    statColor: "var(--bread)",
    action: "View",
    actionColor: "var(--lime)",
    iconBg: "linear-gradient(135deg, var(--bread), #B89968)",
    iconColor: "var(--ink)",
    imageUrl: "https://picsum.photos/seed/insights/800/1000",
  },
];

// ---------------------------------------------------------------------------
// WellbeingCarouselSection component
// ---------------------------------------------------------------------------

/**
 * Sticky horizontal-scroll carousel of 9 wellbeing module cards.
 *
 * - Each card has a front face (image + title) and back face (content).
 *   Desktop: hover to flip. Mobile: tap to flip.
 * - Circular bend curve: cards near the viewport center are larger and
 *   face forward; cards at the edges rotate away, scale down, recede
 *   in z, and fade in opacity.
 * - ScrollTrigger drives the horizontal translation with sticky pin.
 * - Progress dots at the bottom indicate which card is centered.
 * - Section height is computed dynamically from track width.
 */
export function WellbeingCarouselSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [flippedIdx, setFlippedIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // ── Detect touch device for tap-to-flip ─────────────────────────────
  useEffect(() => {
    const check = () => {
      setIsMobile(
        window.matchMedia("(hover: none) and (pointer: coarse)").matches
      );
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Circular bend curve ─────────────────────────────────────────────
  const applyBendCurve = useCallback(() => {
    const slides = slideRefs.current;
    const viewportCenterX = window.innerWidth / 2;
    const viewportHalfWidth = window.innerWidth / 2;

    slides.forEach((slide) => {
      if (!slide) return;
      const rect = slide.getBoundingClientRect();
      const itemCenterX = rect.left + rect.width / 2;
      const x = itemCenterX - viewportCenterX;
      // Normalize position from -1.6 to 1.6
      const distNorm = Math.max(-1.6, Math.min(1.6, x / viewportHalfWidth));
      const absDist = Math.abs(distNorm);

      // Bend math (matches React Bits CircularGallery aesthetic)
      const rotateY = -distNorm * 28;
      const translateY = absDist * 60;
      const translateZ = -absDist * 80;
      const scale = 1 - absDist * 0.08;
      const opacity = Math.max(0.4, 1 - absDist * 0.35);

      slide.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, ${translateZ.toFixed(1)}px) rotateY(${rotateY.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      slide.style.opacity = opacity.toFixed(2);
    });
  }, []);

  // ── Mobile tap-to-flip handler ──────────────────────────────────────
  const handleCardTap = useCallback(
    (idx: number) => {
      if (!isMobile) return;
      setFlippedIdx((prev) => (prev === idx ? null : idx));
    },
    [isMobile]
  );

  // ── ScrollTrigger: horizontal scroll with sticky pin ────────────────
  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const slides = track.querySelectorAll<HTMLElement>(".wellbeing-slide");
      if (slides.length === 0) return;

      const totalSlides = slides.length;

      // Calculate section height: enough scroll space for all slides
      const sectionHeight = totalSlides * window.innerHeight * 0.6;
      section.style.height = `${sectionHeight}px`;

      const slideWidth = slides[0].offsetWidth;
      const gap = 32;
      const totalWidth = (slideWidth + gap) * totalSlides;
      const viewportWidth = window.innerWidth;
      const translateDistance = totalWidth - viewportWidth + 100;

      gsap.to(track, {
        x: -translateDistance,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          onUpdate: (self) => {
            // Update active dot
            const activeIndex = Math.min(
              Math.floor(self.progress * totalSlides),
              totalSlides - 1
            );
            dotRefs.current.forEach((dot, i) => {
              if (!dot) return;
              dot.classList.toggle("active", i === activeIndex);
            });
            // Recompute bend curve every scroll frame
            applyBendCurve();
          },
        },
      });

      // Apply curve once on init so initial state has correct bend
      applyBendCurve();

      // Debounced resize to refresh ScrollTrigger
      let resizeTimer: ReturnType<typeof setTimeout> | null = null;
      const handleResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          ScrollTrigger.refresh();
        }, 200);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        window.removeEventListener("resize", handleResize);
      };
    },
    sectionRef,
    []
  );

  return (
    <section
      className="wellbeing-sticky-section"
      id="wellbeingSticky"
      ref={sectionRef}
      aria-label="Wellbeing modules carousel"
    >
      <div className="wellbeing-sticky-pin">
        {/* Section header */}
        <div className="wellbeing-header">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Wellbeing Modules &middot; 9 modules
          </div>
          <h2 className="h-section">
            All your wellbeing, <span className="serif">in your hand.</span>
          </h2>
        </div>

        {/* Horizontal scroll track */}
        <div className="wellbeing-track" ref={trackRef}>
          {CARDS.map((card, idx) => (
            <div
              key={card.title}
              ref={(el) => {
                slideRefs.current[idx] = el;
              }}
              className={`wellbeing-slide${flippedIdx === idx ? " flipped" : ""}`}
              tabIndex={0}
              role="article"
              aria-label={`${card.title} -- ${card.description}`}
              onClick={() => handleCardTap(idx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardTap(idx);
                }
              }}
            >
              <div className="wellbeing-card-inner">
                {/* ── Front face (image) ── */}
                <div className="wellbeing-card-front">
                  <div
                    className="wellbeing-slide-image"
                    style={{
                      backgroundImage: `url('${card.imageUrl}')`,
                    }}
                    aria-hidden="true"
                  />
                  <div
                    className="wellbeing-card-front-overlay"
                    aria-hidden="true"
                  />
                  <div className="wellbeing-card-front-info">
                    <div className="wellbeing-card-front-num">
                      {card.num} / {card.total}
                    </div>
                    <div className="wellbeing-card-front-title">
                      {card.title}
                    </div>
                    <div className="wellbeing-card-front-hint">
                      {isMobile ? "Tap to reveal →" : "Hover to reveal →"}
                    </div>
                  </div>
                </div>

                {/* ── Back face (content) ── */}
                <div className="wellbeing-card-back">
                  <div className="wellbeing-slide-content">
                    <div className="wellbeing-slide-num">
                      {card.num} / {card.total}
                    </div>
                    <div
                      className="wellbeing-slide-icon"
                      style={{
                        background: card.iconBg,
                        color: card.iconColor,
                      }}
                      aria-hidden="true"
                    >
                      {card.icon}
                    </div>
                    <div className="wellbeing-slide-title">{card.title}</div>
                    <div className="wellbeing-slide-desc">
                      {card.description}
                    </div>
                    <div className="wellbeing-slide-meta">
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--muted-light)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            fontWeight: 600,
                          }}
                        >
                          {card.statLabel}
                        </div>
                        <div
                          className="wellbeing-slide-stat"
                          style={{ color: card.statColor }}
                        >
                          {card.statValue}
                        </div>
                      </div>
                      <div
                        className="wellbeing-slide-action"
                        style={{ color: card.actionColor }}
                      >
                        {card.action} &rarr;
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div
          className="wellbeing-progress"
          role="tablist"
          aria-label="Carousel progress"
        >
          {CARDS.map((card, idx) => (
            <div
              key={card.title}
              ref={(el) => {
                dotRefs.current[idx] = el;
              }}
              className={`wellbeing-dot${idx === 0 ? " active" : ""}`}
              role="tab"
              aria-selected={idx === 0}
              aria-label={`${card.title} card`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
