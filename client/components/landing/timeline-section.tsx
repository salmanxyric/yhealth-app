"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useGSAP, ScrollTrigger } from "@/hooks/use-gsap";

/* ─────────────────────────────────────────────────────────
   Step data – the text content + tag chips for all 5 steps
   ───────────────────────────────────────────────────────── */

interface Tag {
  label: string;
  color: string;
}

interface StepData {
  eyebrow: string;
  headline: string;
  headlineSerif: string;
  description: string;
  tags: Tag[];
}

const STEPS: StepData[] = [
  {
    eyebrow: "Step 01 · Connect",
    headline: "Connect your watch ",
    headlineSerif: "and your world.",
    description:
      "Sync Apple Watch, Whoop, Oura, Garmin, Plaid, Gmail, Calendar, and more. Cia reads your data in real time — never sells it, never sees it without permission.",
    tags: [
      { label: "Apple Watch", color: "#A3E635" },
      { label: "Whoop", color: "#D95F0E" },
      { label: "Plaid", color: "#4F46E5" },
      { label: "Calendar", color: "#E8C998" },
    ],
  },
  {
    eyebrow: "Step 02 · Analyze",
    headline: "Cia analyzes ",
    headlineSerif: "every signal.",
    description:
      "Sleep, recovery, activity, nutrition, mood, spending, calendar load. Cia connects the dots across domains — finds the patterns you’d miss in raw numbers.",
    tags: [
      { label: "HRV +12%", color: "#A3E635" },
      { label: "Sleep · 7h42", color: "#4F46E5" },
      { label: "RHR · 52", color: "#D95F0E" },
    ],
  },
  {
    eyebrow: "Step 03 · Plan",
    headline: "A personalized plan ",
    headlineSerif: "every morning.",
    description:
      "“Push hard today — recovery is 87%. Hold off on the call until 4pm. $80 left in food budget.” Cia drafts your day in plain English, balancing every domain.",
    tags: [
      { label: "Push training", color: "#D95F0E" },
      { label: "Light meal", color: "#A3E635" },
      { label: "Deep work · 11am", color: "#4F46E5" },
    ],
  },
  {
    eyebrow: "Step 04 · Coach",
    headline: "Voice coach guides you ",
    headlineSerif: "in real time.",
    description:
      "“How was your day, really?” Talk to Cia like a friend who knows your data. She listens, she remembers, she nudges you back on track when life pulls you off.",
    tags: [
      { label: "Voice mode", color: "#A3E635" },
      { label: "Live transcript", color: "#4F46E5" },
      { label: "Photo · “What’s this?”", color: "#D95F0E" },
    ],
  },
  {
    eyebrow: "Step 05 · Track",
    headline: "See progress ",
    headlineSerif: "across your whole life.",
    description:
      "Health, finance, career, relationships — track Life Balance week over week. Compete in challenges, celebrate streaks, see what’s compounding.",
    tags: [
      { label: "Life Balance · 82", color: "#A3E635" },
      { label: "+4 this week", color: "#D95F0E" },
      { label: "Streak · 38 days", color: "#4F46E5" },
    ],
  },
];

const TOTAL_STEPS = STEPS.length;

/* ─────────────────────────────────────────────
   Visual card sub-components for each step
   ───────────────────────────────────────────── */

function TlCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="tl-card" style={style}>
      {children}
    </div>
  );
}

function TlCardEyebrow({
  dotColor,
  children,
}: {
  dotColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tl-card-eyebrow">
      <span
        className="tl-card-eyebrow-dot"
        style={{ background: dotColor }}
      />
      {children}
    </div>
  );
}

/* Step 1 visual: Connected device cards */
function VisualConnect() {
  return (
    <>
      <TlCard style={{ transform: "rotate(-2deg)" }}>
        <TlCardEyebrow dotColor="#A3E635">
          Apple Watch &bull; Connected
        </TlCardEyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(163,230,53,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#A3E635",
              fontSize: 18,
            }}
          >
            &#9201;
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              Health &bull; Activity &bull; Sleep
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--muted-light)",
              }}
            >
              Synced 2 minutes ago
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#A3E635",
              fontWeight: 700,
            }}
          >
            &#9679;&ensp;LIVE
          </div>
        </div>
      </TlCard>

      <TlCard style={{ transform: "rotate(1.5deg) translateX(40px)" }}>
        <TlCardEyebrow dotColor="#4F46E5">
          Plaid &bull; Linked
        </TlCardEyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(79,70,229,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7C75F0",
              fontSize: 16,
              fontFamily: "var(--serif)",
            }}
          >
            $
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              Chase &bull; Apple Card &bull; Vanguard
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--muted-light)",
              }}
            >
              Read-only &bull; encrypted
            </div>
          </div>
        </div>
      </TlCard>

      <TlCard style={{ transform: "rotate(-1deg) translateX(-30px)" }}>
        <TlCardEyebrow dotColor="#D95F0E">
          Calendar &bull; Today
        </TlCardEyebrow>
        <div
          style={{
            fontSize: 11,
            color: "var(--muted-light)",
            lineHeight: 1.5,
          }}
        >
          3 events &bull; 2h deep work &bull; 1:1 with Sarah
        </div>
      </TlCard>
    </>
  );
}

/* Step 2 visual: Cross-domain analysis */
function VisualAnalyze() {
  return (
    <TlCard>
      <TlCardEyebrow dotColor="#A3E635">
        Cia &bull; Cross-domain analysis
      </TlCardEyebrow>
      <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
        Three things are stacking:
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 14,
          paddingLeft: 8,
          borderLeft: "2px solid #A3E635",
        }}
      >
        <div style={{ fontSize: 12 }}>
          <strong>1.</strong> Sleep down 18% from baseline
        </div>
        <div style={{ fontSize: 12 }}>
          <strong>2.</strong> Spending up 40% &mdash; financial stress
        </div>
        <div style={{ fontSize: 12 }}>
          <strong>3.</strong> 4 late-night work calls this week
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <div
          style={{
            fontSize: 9,
            padding: "4px 8px",
            background: "rgba(163,230,53,0.15)",
            border: "1px solid rgba(163,230,53,0.3)",
            color: "#A3E635",
            borderRadius: 99,
            fontWeight: 700,
          }}
        >
          3 studies cited
        </div>
        <div
          style={{
            fontSize: 9,
            padding: "4px 8px",
            background: "rgba(79,70,229,0.15)",
            border: "1px solid rgba(79,70,229,0.3)",
            color: "#7C75F0",
            borderRadius: 99,
            fontWeight: 700,
          }}
        >
          92% confidence
        </div>
      </div>
    </TlCard>
  );
}

/* Step 3 visual: Daily plan */
function VisualPlan() {
  const items = [
    {
      time: "09:00",
      title: "Strength training",
      sub: "Push hard — recovery 87%",
      color: "#A3E635",
    },
    {
      time: "11:00",
      title: "Deep work",
      sub: "Series B platform — 2h block",
      color: "#D95F0E",
    },
    {
      time: "14:00",
      title: "1:1 with Sarah",
      sub: "Cia drafted your talking points",
      color: "#4F46E5",
    },
  ];

  return (
    <TlCard>
      <TlCardEyebrow dotColor="#D95F0E">
        Today &bull; Thursday Apr 24
      </TlCardEyebrow>
      <div
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      >
        {items.map((item) => (
          <div
            key={item.time}
            style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr",
              gap: 10,
              padding: "8px 10px",
              background: `${item.color}0F`,
              borderLeft: `2px solid ${item.color}`,
              borderRadius: 6,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "var(--muted-light)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {item.time}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--muted-light)",
                }}
              >
                {item.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </TlCard>
  );
}

/* Step 4 visual: Voice coach orb */
function VisualCoach() {
  const bars = [30, 80, 50, 90, 60, 40, 75];

  return (
    <TlCard style={{ textAlign: "center", padding: "30px 24px" }}>
      {/* Orb */}
      <div
        style={{
          width: 80,
          height: 80,
          margin: "0 auto 16px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #D95F0E 0%, #4F46E5 60%, transparent 100%)",
          position: "relative",
          boxShadow: "0 0 60px rgba(217,95,14,0.5)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -12,
            borderRadius: "50%",
            border: "1px solid rgba(217,95,14,0.4)",
            animation: "tlOrbRing 3s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: -24,
            borderRadius: "50%",
            border: "1px solid rgba(217,95,14,0.2)",
            animation: "tlOrbRing 3s ease-in-out infinite 0.5s",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "var(--orange)",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        Cia is listening
      </div>
      <div
        style={{
          fontSize: 14,
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          color: "var(--cream)",
        }}
      >
        &ldquo;How was your day, really?&rdquo;
      </div>
      {/* Audio waveform bars */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 3,
          marginTop: 14,
          height: 24,
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: `${h}%`,
              background: "#D95F0E",
              borderRadius: 99,
              animation: `tlBar 1s ease-in-out infinite ${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </TlCard>
  );
}

/* Step 5 visual: Life balance dashboard */
function VisualTrack() {
  const dayBars = [
    { h: 48, color: "#5BA89C" },
    { h: 60, color: "#B8A4D4" },
    { h: 55, color: "#E8765A" },
    { h: 72, color: "#7C75F0" },
    { h: 65, color: "#D95F0E" },
    { h: 78, color: "#A3E635" },
    { h: 90, color: "#E8C998" },
  ];
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <TlCard>
      <TlCardEyebrow dotColor="#A3E635">
        Life Balance &bull; this week
      </TlCardEyebrow>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 46,
            lineHeight: 1,
            color: "var(--cream)",
            letterSpacing: "-0.02em",
          }}
        >
          82
        </div>
        <div style={{ fontSize: 14, color: "var(--muted-light)" }}>
          / 100
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontSize: 11,
            padding: "3px 9px",
            background: "rgba(163,230,53,0.15)",
            border: "1px solid rgba(163,230,53,0.3)",
            color: "#A3E635",
            borderRadius: 99,
            fontWeight: 700,
          }}
        >
          &#9650; +4
        </div>
      </div>
      <div
        style={{
          fontSize: 10,
          color: "var(--muted-light)",
          marginBottom: 14,
        }}
      >
        Best week of the month
      </div>
      {/* Mini bar chart */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          alignItems: "flex-end",
          height: 50,
          marginBottom: 14,
        }}
      >
        {dayBars.map((bar, i) => (
          <div
            key={i}
            style={{
              height: `${bar.h}%`,
              background: bar.color,
              borderRadius: 3,
              ...(i === dayBars.length - 1
                ? { boxShadow: `0 0 8px ${bar.color}80` }
                : {}),
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          color: "var(--muted-light)",
          fontWeight: 600,
          letterSpacing: "0.06em",
        }}
      >
        {dayLabels.map((label, i) => (
          <span
            key={i}
            style={
              i === dayLabels.length - 1
                ? { color: "#E8C998" }
                : undefined
            }
          >
            {label}
          </span>
        ))}
      </div>
    </TlCard>
  );
}

const STEP_VISUALS = [
  VisualConnect,
  VisualAnalyze,
  VisualPlan,
  VisualCoach,
  VisualTrack,
];

/* ─────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────── */

export function TimelineSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  /* Detect mobile on mount */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 880);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* GSAP: set dynamic section height + create pinned ScrollTrigger */
  useGSAP(
    () => {
      if (!sectionRef.current || isMobile) return;

      const section = sectionRef.current;

      // Each step gets ~85vh of scroll travel
      const setHeight = () => {
        section.style.height = `${TOTAL_STEPS * window.innerHeight * 0.85}px`;
      };
      setHeight();

      let lastStage = -1;

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          const stage = Math.min(
            Math.floor(p * TOTAL_STEPS + 0.0001),
            TOTAL_STEPS - 1
          );

          // Top progress bar
          if (progressFillRef.current) {
            progressFillRef.current.style.width = `${p * 100}%`;
          }

          // Rail fill
          if (railFillRef.current) {
            railFillRef.current.style.height = `${p * 100}%`;
          }

          if (stage !== lastStage) {
            setActiveStep(stage);
            lastStage = stage;
          }
        },
      });

      // Recalc on resize
      let resizeTimer: ReturnType<typeof setTimeout>;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          setHeight();
          ScrollTrigger.refresh();
        }, 200);
      };
      window.addEventListener("resize", onResize);

      // Cleanup handled by gsap.context revert in useGSAP
      return () => {
        window.removeEventListener("resize", onResize);
        clearTimeout(resizeTimer);
      };
    },
    sectionRef,
    [isMobile]
  );

  /* Marker state helper */
  const getMarkerClass = useCallback(
    (index: number) => {
      if (isMobile) return "timeline-step-marker done";
      if (index < activeStep) return "timeline-step-marker done";
      if (index === activeStep) return "timeline-step-marker active";
      return "timeline-step-marker";
    },
    [activeStep, isMobile]
  );

  /* Done-marker checkmark SVG */
  const CheckIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 7.5L5.5 10L11 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <section
      className="timeline-section"
      id="timelineSection"
      ref={sectionRef}
      aria-label="How it works - Five steps"
    >
      <div className="timeline-pin">
        {/* Top edge progress bar */}
        <div className="tl-section-progress">
          <div
            className="tl-section-progress-fill"
            ref={progressFillRef}
          />
        </div>

        {/* Section header (top-left) */}
        <div className="tl-section-header">
          <div className="tl-section-header-eyebrow">How it works</div>
          <div className="tl-section-header-title">
            Five steps &middot;{" "}
            <span style={{ fontStyle: "italic" }}>one life</span>
          </div>
        </div>

        <div className="timeline-pin-grid">
          {/* ── Left rail: progress track + step markers ── */}
          <div className="timeline-rail" aria-hidden="true">
            <div className="timeline-rail-track">
              <div className="timeline-rail-fill" ref={railFillRef} />
            </div>
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={getMarkerClass(i)}
                data-step={i}
              >
                {!isMobile && i < activeStep ? <CheckIcon /> : i + 1}
              </div>
            ))}
          </div>

          {/* ── Middle column: text content ── */}
          <div className="timeline-content" role="list">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`timeline-step${
                  isMobile || i === activeStep ? " active" : ""
                }`}
                data-step={i}
                role="listitem"
                aria-current={i === activeStep ? "step" : undefined}
              >
                <div className="timeline-step-eyebrow">
                  <span className="timeline-step-eyebrow-dot" />
                  {` ${step.eyebrow}`}
                </div>
                <h3 className="timeline-step-headline">
                  {step.headline}
                  <span className="serif">{step.headlineSerif}</span>
                </h3>
                <p className="timeline-step-desc">{step.description}</p>
                <div className="timeline-step-meta">
                  {step.tags.map((tag) => (
                    <div key={tag.label} className="timeline-step-tag">
                      <span
                        className="timeline-step-tag-dot"
                        style={{ background: tag.color }}
                      />
                      {tag.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Right column: floating visual cards ── */}
          <div className="timeline-visual" aria-hidden="true">
            {STEP_VISUALS.map((Visual, i) => (
              <div
                key={i}
                className={`timeline-step-visual${
                  isMobile || i === activeStep ? " active" : ""
                }`}
                data-step={i}
              >
                <Visual />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TimelineSection;
