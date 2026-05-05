"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-init";
import { useGSAP } from "@/hooks/use-gsap";

/* ──────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────── */

const NUM_SCREENS = 5;
const SCROLL_PER_STAGE = 0.85; // each stage = 85vh of scroll distance

const STAGE_NAMES = [
  "Life balance",
  "Recovery score",
  "Today’s training",
  "Nutrition",
  "Schedule & focus",
] as const;

/* ──────────────────────────────────────────────────────────
   Sub-components (static markup, extracted for readability)
   ────────────────────────────────────────────────────────── */

function IPhoneStatusBar() {
  return (
    <div className="iphone-status">
      <span>9:41</span>
      <div className="iphone-status-icons">
        <span>5G</span>
        <span>100%</span>
      </div>
    </div>
  );
}

/* ── Left phone: Voice mode ── */
function VoicePhone() {
  return (
    <div className="iphone sm hero-phone-l" style={{ marginBottom: 80 }}>
      <div className="iphone-screen cia-bg">
        <div className="iphone-notch" />
        <IPhoneStatusBar />
        <div className="iphone-app">
          <div className="app-cia-listening">
            <div className="cia-orb-app" />
            <div className="app-cia-listening-label">Cia is listening</div>
            <div className="app-cia-listening-text">
              &ldquo;How was your day, really?&rdquo;
            </div>
            <div className="app-cia-waveform">
              {Array.from({ length: 9 }, (_, i) => (
                <div
                  key={i}
                  className="app-cia-wave-bar"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 16,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(245,239,226,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                &#x23F8;
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--orange)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                &#x1F3A4;
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(245,239,226,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                &#x2715;
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Right phone: Chat ── */
function ChatPhone() {
  return (
    <div className="iphone sm hero-phone-r" style={{ marginBottom: 80 }}>
      <div className="iphone-screen">
        <div className="iphone-notch" />
        <IPhoneStatusBar />
        <div className="iphone-app">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 24,
              paddingBottom: 12,
              borderBottom: "1px solid var(--line-light)",
            }}
          >
            <div className="cia-orb-sm" style={{ width: 28, height: 28 }} />
            <div>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 13,
                }}
              >
                Cia
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "var(--lime-soft)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    background: "var(--lime)",
                    borderRadius: "50%",
                  }}
                />
                Always with you
              </div>
            </div>
          </div>
          <div className="app-chat">
            <div className="app-chat-msg">
              Your savings hit 60% of goal today.
            </div>
            <div className="app-chat-msg user">
              Nice. What about the gym?
            </div>
            <div className="app-chat-msg">
              5 sessions this week &mdash; your best ever.
            </div>
            <div className="app-chat-msg user">
              And Sarah&rsquo;s birthday?
            </div>
            <div className="app-chat-msg">
              Wednesday. Reservation confirmed.
            </div>
          </div>
          <div className="app-chat-input">
            <span style={{ fontSize: 12 }}>&#x1F4F7;</span>
            <span className="app-chat-input-text">Message Cia...</span>
            <span style={{ fontSize: 12 }}>&#x1F3A4;</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Smartwatch companion ── */
function Smartwatch() {
  return (
    <div className="hero-watch-wrap">
      <div className="smartwatch">
        <div className="smartwatch-strap-top" />
        <div className="smartwatch-case">
          <div className="smartwatch-crown" />
          <div className="smartwatch-button" />
          <div className="smartwatch-screen">
            <div className="smartwatch-header">
              <div className="smartwatch-heart" />
              <div className="smartwatch-title">Heart</div>
            </div>
            <div className="smartwatch-bpm">
              <div className="smartwatch-bpm-num">72</div>
              <div className="smartwatch-bpm-unit">bpm</div>
            </div>
            <div className="smartwatch-ecg">
              <svg viewBox="0 0 100 30" preserveAspectRatio="none">
                <polyline
                  className="smartwatch-ecg-trail"
                  points="0,16 8,16 14,16 18,8 22,24 26,4 30,16 38,16 46,16 52,12 58,18 64,16 72,16 78,8 82,22 86,4 90,16 100,16"
                />
                <polyline
                  className="smartwatch-ecg-line"
                  points="0,16 8,16 14,16 18,8 22,24 26,4 30,16 38,16 46,16 52,12 58,18 64,16 72,16 78,8 82,22 86,4 90,16 100,16"
                />
              </svg>
            </div>
            <div className="smartwatch-stats">
              <span>52 min</span>
              <span style={{ color: "#A3E635" }}>&#x25B2; 12%</span>
            </div>
            <div className="smartwatch-bar">
              <div />
            </div>
          </div>
        </div>
        <div className="smartwatch-strap-bottom" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Hero screen data + components (center phone, 5 cycling screens)
   ────────────────────────────────────────────────────────── */

/* ── Screen 1: Life Balance Dashboard ── */
function ScreenBalance() {
  const domains = [
    {
      icon: "+",
      gradient: "linear-gradient(135deg,#A3E635,#7BC22E)",
      name: "Health",
      val: 88,
      barColor: "#A3E635",
    },
    {
      icon: "$",
      gradient: "linear-gradient(135deg,#A39EFF,#7C75F0)",
      name: "Finance",
      val: 76,
      barColor: "#7C75F0",
    },
    {
      icon: "★",
      gradient: "linear-gradient(135deg,#F18A3F,#D95F0E)",
      name: "Career",
      val: 82,
      barColor: "#D95F0E",
    },
    {
      icon: "♥",
      gradient: "linear-gradient(135deg,#F0998C,#E8765A)",
      name: "Relations",
      val: 79,
      barColor: "#E8765A",
    },
    {
      icon: "◊",
      gradient: "linear-gradient(135deg,#7FC9BD,#5BA89C)",
      name: "Mind",
      val: 85,
      barColor: "#5BA89C",
    },
    {
      icon: "↑",
      gradient: "linear-gradient(135deg,#D4C2E8,#B8A4D4)",
      name: "Growth",
      val: 81,
      barColor: "#B8A4D4",
    },
  ] as const;

  const weekBars: readonly {
    day: string;
    height: string;
    gradient: string;
    color: string;
    today?: boolean;
  }[] = [
    { day: "M", height: "48%", gradient: "linear-gradient(180deg,#7FC9BD,#5BA89C)", color: "#5BA89C" },
    { day: "T", height: "60%", gradient: "linear-gradient(180deg,#D4C2E8,#B8A4D4)", color: "#B8A4D4" },
    { day: "W", height: "55%", gradient: "linear-gradient(180deg,#F0998C,#E8765A)", color: "#E8765A" },
    { day: "T", height: "72%", gradient: "linear-gradient(180deg,#A39EFF,#7C75F0)", color: "#7C75F0" },
    { day: "F", height: "65%", gradient: "linear-gradient(180deg,#F18A3F,#D95F0E)", color: "#D95F0E" },
    { day: "S", height: "78%", gradient: "linear-gradient(180deg,#A3E635,#7BC22E)", color: "#A3E635" },
    { day: "S", height: "90%", gradient: "linear-gradient(180deg,#FBE694,#E8C998)", color: "#E8C998", today: true },
  ];

  return (
    <>
      <div className="hero-balance-aurora" />

      <div className="hero-balance-greet">
        <div className="hero-balance-greet-meta">Thursday &middot; April 24</div>
        <div className="hero-balance-greet-title">Your life today</div>
      </div>

      <div className="hero-balance-score">
        <div className="hero-balance-num">82</div>
        <div className="hero-balance-divider">out of 100 &middot; life balance</div>
        <div className="hero-balance-trend">&nearr; +4 this week</div>
      </div>

      <div className="hero-balance-domains">
        {domains.map((d) => (
          <div key={d.name} className="hero-balance-domain">
            <div
              className="hero-balance-domain-icon"
              style={{ background: d.gradient }}
            >
              {d.icon}
            </div>
            <div className="hero-balance-domain-info">
              <div className="hero-balance-domain-name">{d.name}</div>
              <div className="hero-balance-domain-val">{d.val}</div>
            </div>
            <div className="hero-balance-domain-bar">
              <div
                style={{
                  width: `${d.val}%`,
                  background: d.barColor,
                  color: d.barColor,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="hero-balance-week">
        <div className="hero-balance-week-label">
          <span>7-day trend</span>
          <span>+4 &nearr;</span>
        </div>
        <div className="hero-balance-week-bars">
          {weekBars.map((b, i) => (
            <div
              key={i}
              className={`hero-balance-week-bar${b.today ? " today" : ""}`}
              style={{
                height: b.height,
                background: b.gradient,
                color: b.color,
              }}
            >
              <span className="hero-balance-week-day">{b.day}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Screen 2: Recovery / Biometrics ── */
function ScreenRecovery() {
  return (
    <>
      <div className="app-greet">
        <div className="app-greet-meta">Recovery score</div>
        <div className="app-greet-name">Ready to push</div>
      </div>

      <div className="hero-ring-wrap">
        <svg className="hero-ring" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="rgba(245,239,226,0.08)"
            strokeWidth="6"
          />
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="#A3E635"
            strokeWidth="6"
            strokeDasharray="377"
            strokeDashoffset="49"
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="hero-ring-num">
          87<span>%</span>
        </div>
        <div className="hero-ring-sub">Recovered</div>
      </div>

      <div className="hero-pills">
        <div className="hero-pill">
          <div className="hero-pill-label">HRV</div>
          <div className="hero-pill-val">62ms</div>
          <div className="hero-pill-trend up">+12%</div>
        </div>
        <div className="hero-pill">
          <div className="hero-pill-label">RHR</div>
          <div className="hero-pill-val">52</div>
          <div className="hero-pill-trend down">-3%</div>
        </div>
        <div className="hero-pill">
          <div className="hero-pill-label">Sleep</div>
          <div className="hero-pill-val">7h42</div>
          <div className="hero-pill-trend up">92%</div>
        </div>
      </div>

      <div className="hero-mini-chart" style={{ marginTop: "auto" }}>
        <div className="hero-mini-chart-label">
          <span>HRV &middot; 7 days</span>
          <span style={{ color: "var(--lime-soft)" }}>Trending up</span>
        </div>
        <svg viewBox="0 0 200 40" preserveAspectRatio="none">
          <polyline
            points="0,30 28,24 56,28 84,16 112,18 140,10 168,14 196,6"
            fill="none"
            stroke="#A3E635"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="196" cy="6" r="3" fill="#A3E635" />
        </svg>
      </div>
    </>
  );
}

/* ── Screen 3: Today's Training ── */
function ScreenTraining() {
  const exercises = [
    { name: "Bench press", meta: "4 × 8 · 60kg", status: "done" },
    { name: "Pull-ups", meta: "4 × 6 · bodyweight", status: "done" },
    { name: "Shoulder press", meta: "2 / 4 sets · 22kg", status: "active" },
    { name: "Cable rows", meta: "4 × 10 · 45kg", status: "" },
  ] as const;

  return (
    <>
      <div className="app-greet">
        <div className="app-greet-meta">Today&rsquo;s training</div>
        <div className="app-greet-name">Upper body strength</div>
      </div>

      <div className="hero-workout-list">
        {exercises.map((ex) => (
          <div
            key={ex.name}
            className={`hero-workout-item${ex.status ? ` ${ex.status}` : ""}`}
          >
            <div className="hero-workout-check" />
            <div className="hero-workout-info">
              <div className="hero-workout-name">{ex.name}</div>
              <div className="hero-workout-meta">{ex.meta}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="hero-workout-stats">
        <div className="hero-workout-stat">
          <div className="hero-workout-stat-label">Time</div>
          <div className="hero-workout-stat-val">28:14</div>
        </div>
        <div className="hero-workout-stat">
          <div className="hero-workout-stat-label">Calories</div>
          <div className="hero-workout-stat-val">324</div>
        </div>
        <div className="hero-workout-stat">
          <div className="hero-workout-stat-label">Heart</div>
          <div className="hero-workout-stat-val">142</div>
        </div>
      </div>
    </>
  );
}

/* ── Screen 4: Nutrition ── */
function ScreenNutrition() {
  const macros = [
    { label: "Protein", value: "142g", pct: 78, color: "#A3E635" },
    { label: "Carbs", value: "186g", pct: 62, color: "#F18A3F" },
    { label: "Fat", value: "54g", pct: 48, color: "#7C75F0" },
  ] as const;

  return (
    <>
      <div className="app-greet">
        <div className="app-greet-meta">Nutrition today</div>
        <div className="app-greet-name">1,840 / 2,400 kcal</div>
      </div>

      <div className="hero-ring-wrap">
        <svg className="hero-ring" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="rgba(245,239,226,0.08)"
            strokeWidth="6"
          />
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="#D95F0E"
            strokeWidth="6"
            strokeDasharray="377"
            strokeDashoffset="88"
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="hero-ring-num">1,840</div>
        <div className="hero-ring-sub">kcal eaten</div>
      </div>

      <div className="hero-macros">
        {macros.map((m) => (
          <div key={m.label}>
            <div className="hero-macro-row">
              <span>{m.label}</span>
              <span>{m.value}</span>
            </div>
            <div className="hero-macro-bar">
              <div style={{ width: `${m.pct}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="hero-meal">
        <div className="hero-meal-emoji">&#x1F957;</div>
        <div>
          <div className="hero-meal-name">Chicken bowl</div>
          <div className="hero-meal-meta">
            12:30 PM &middot; 642 kcal &middot; Cia logged
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Screen 5: Schedule + Music ── */
function ScreenSchedule() {
  const events = [
    { time: "09:00", name: "Strength training", meta: "45 min · Gym", borderColor: "#A3E635" },
    { time: "11:00", name: "Deep work block", meta: "2h · Series B platform", borderColor: "#D95F0E" },
    { time: "14:00", name: "1:1 with Sarah", meta: "30 min · notes ready", borderColor: "#4F46E5" },
    { time: "19:00", name: "Sarah’s birthday", meta: "Lupa’s · booked", borderColor: "#E8765A" },
  ] as const;

  return (
    <>
      <div className="app-greet">
        <div className="app-greet-meta">Today&rsquo;s flow</div>
        <div className="app-greet-name">3 deep blocks</div>
      </div>

      <div className="hero-schedule">
        {events.map((ev) => (
          <div key={ev.time} className="hero-time-block">
            <div className="hero-time">{ev.time}</div>
            <div className="hero-event" style={{ borderColor: ev.borderColor }}>
              <div className="hero-event-name">{ev.name}</div>
              <div className="hero-event-meta">{ev.meta}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="hero-music">
        <div className="hero-music-bars">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className="hero-music-info">
          <div className="hero-music-name">Focus mode</div>
          <div className="hero-music-meta">Brain.fm &middot; 60 BPM</div>
        </div>
        <div className="hero-music-play">&#x25B6;</div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   Screen registry — maps index to component + CSS class
   ────────────────────────────────────────────────────────── */

const HERO_SCREENS: {
  Component: React.FC;
  className: string;
  stage: number;
}[] = [
  { Component: ScreenBalance, className: "hero-screen-balance", stage: 0 },
  { Component: ScreenRecovery, className: "", stage: 1 },
  { Component: ScreenTraining, className: "", stage: 2 },
  { Component: ScreenNutrition, className: "", stage: 3 },
  { Component: ScreenSchedule, className: "", stage: 4 },
];

/* ──────────────────────────────────────────────────────────
   HeroSection — main export
   ────────────────────────────────────────────────────────── */

export default function HeroSection() {
  const pinWrapRef = useRef<HTMLElement>(null);
  const stageNumRef = useRef<HTMLSpanElement>(null);
  const stageNameRef = useRef<HTMLSpanElement>(null);
  const stageLabelRef = useRef<HTMLDivElement>(null);

  const [activeScreen, setActiveScreen] = useState(0);

  /* Dynamic pin-wrap height: stages * 85vh */
  const computeHeight = useCallback((): string => {
    if (typeof window === "undefined") {
      return `${NUM_SCREENS * 85}vh`;
    }
    return `${NUM_SCREENS * window.innerHeight * SCROLL_PER_STAGE}px`;
  }, []);

  const [pinHeight, setPinHeight] = useState<string>(`${NUM_SCREENS * 85}vh`);

  /* Recalculate pin height on window resize */
  useEffect(() => {
    setPinHeight(computeHeight());

    let resizeTimer: ReturnType<typeof setTimeout>;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setPinHeight(computeHeight());
        ScrollTrigger.refresh();
      }, 200);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [computeHeight]);

  /* ── GSAP: entrance animations + ScrollTrigger pin ── */
  useGSAP(
    () => {
      /* --- Staggered entrance --- */
      gsap.from(".cia-orb-hero", {
        scale: 0,
        opacity: 0,
        duration: 1.2,
        ease: "back.out(1.7)",
      });
      gsap.from(".hero-eyebrow", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: "power3.out",
      });
      gsap.from(".hero-title", {
        y: 40,
        opacity: 0,
        duration: 1,
        delay: 0.4,
        ease: "power3.out",
      });
      gsap.from(".hero-sub", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.6,
        ease: "power3.out",
      });
      gsap.from(".hero-ctas", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.8,
        ease: "power3.out",
      });
      gsap.from(".hero-phone-l", {
        x: -100,
        opacity: 0,
        rotateY: 20,
        duration: 1.2,
        delay: 1,
        ease: "power3.out",
      });
      gsap.from(".hero-phone-c", {
        y: 100,
        opacity: 0,
        scale: 0.9,
        duration: 1.2,
        delay: 1,
        ease: "power3.out",
      });
      gsap.from(".hero-phone-r", {
        x: 100,
        opacity: 0,
        rotateY: -20,
        duration: 1.2,
        delay: 1,
        ease: "power3.out",
      });

      /* --- ScrollTrigger: pin wrap cycles hero screens --- */
      const pinEl = pinWrapRef.current;
      if (!pinEl) return;

      const screens = pinEl.querySelectorAll<HTMLElement>(".hero-screen");
      if (screens.length <= 1) return;
      /* Only enable pin-scroll on wider viewports */
      if (window.innerWidth <= 880) return;

      const stages = screens.length;
      let lastStage = -1;

      ScrollTrigger.create({
        trigger: pinEl,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const stage = Math.min(
            Math.floor(self.progress * stages),
            stages - 1,
          );
          if (stage !== lastStage) {
            screens.forEach((s, i) =>
              s.classList.toggle("active", i === stage),
            );

            if (stageNumRef.current) {
              stageNumRef.current.textContent = String(stage + 1).padStart(
                2,
                "0",
              );
            }
            if (stageNameRef.current) {
              stageNameRef.current.textContent = STAGE_NAMES[stage] ?? "Cia";
            }
            if (stageLabelRef.current) {
              stageLabelRef.current.classList.add("visible");
            }

            lastStage = stage;
            setActiveScreen(stage);
          }
        },
      });
    },
    pinWrapRef,
    [],
  );

  /* ── Render ── */
  return (
    <section
      className="hero-pin-wrap"
      id="heroPinWrap"
      ref={pinWrapRef}
      style={{ height: pinHeight }}
    >
      <section className="hero">
        {/* Liquid-ether WebGL placeholder */}
        <div className="liquid-ether-container" id="liquidEtherHero" />

        <div className="hero-grid">
          {/* ── Left column: content ── */}
          <div className="hero-content">
            <div className="hero-orb-wrap">
              <div className="cia-orb-hero" />
            </div>
            <div>
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-tag">New</span>
                Cia is now your full life coach
              </div>
            </div>
            <h1 className="h-display hero-title">
              One coach for
              <br />
              <span className="serif">your whole life.</span>
            </h1>
            <p className="hero-sub">
              Cia knows your health, finances, career, and relationships
              &mdash; and helps you grow in every direction at once.
            </p>
            <div className="hero-cta-row hero-ctas">
              <a href="#download" className="btn btn-cia">
                <span>
                  Download app <span className="btn-arrow">&rarr;</span>
                </span>
              </a>
              <div className="hero-rating">
                <span className="hero-rating-stars">
                  &#x2605;&#x2605;&#x2605;&#x2605;&#x2605;
                </span>
                <span>
                  <strong>4.8</strong> &middot; 28.6k ratings
                </span>
              </div>
            </div>
          </div>

          {/* ── Right column: showcase ── */}
          <div className="hero-showcase">
            {/* Side phone left: voice mode */}
            <VoicePhone />

            {/* Center phone: 5 cycling hero screens */}
            <div className="iphone lg center hero-phone-c">
              <div className="iphone-screen galaxy-bg">
                <div className="iphone-notch" />
                <IPhoneStatusBar />
                <div className="iphone-app">
                  <div className="hero-screens-container">
                    {HERO_SCREENS.map(({ Component, className, stage }) => (
                      <div
                        key={stage}
                        className={[
                          "hero-screen",
                          stage === activeScreen ? "active" : "",
                          className,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        data-stage={stage}
                      >
                        <Component />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Side phone right: chat */}
            <ChatPhone />

            {/* Smartwatch companion */}
            <Smartwatch />
          </div>
        </div>

        {/* Stage label at bottom */}
        <div className="hero-stage-label" id="heroStageLabel" ref={stageLabelRef}>
          <span className="hero-stage-label-num" id="heroStageNum" ref={stageNumRef}>
            01
          </span>
          <span id="heroStageName" ref={stageNameRef}>
            Life balance
          </span>
        </div>
      </section>
    </section>
  );
}
