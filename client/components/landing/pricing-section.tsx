"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type CSSProperties,
} from "react";
import { useGSAP, gsap } from "@/hooks/use-gsap";

/* ─────────────────────────────────────────────
   Types & data
   ───────────────────────────────────────────── */

type BillingMode = "monthly" | "annual";

interface Feature {
  text: string;
  included: boolean;
  /** Whether the feature text should be bold (e.g. "Everything in X") */
  bold?: boolean;
}

interface PricingTier {
  /** CSS class suffix: tier-curious, tier-committed, tier-founder */
  tierClass: string;
  /** Whether this card gets the `featured` treatment */
  featured: boolean;
  /** Badge text shown on featured card */
  badge?: string;
  /** Card icon (emoji/character) */
  icon: string;
  /** Icon color */
  iconColor: string;
  /** Tier name */
  name: string;
  /** Short tagline */
  tagline: string;
  /** Monthly price (number displayed) */
  priceMonthly: string;
  /** Annual price (number displayed) */
  priceAnnual: string;
  /** Period text, e.g. "/month" or "one-time" */
  period: string;
  /** Billed description per billing mode */
  billedMonthly: string;
  billedAnnual: string;
  /** Feature list */
  features: Feature[];
  /** CTA button text */
  ctaText: string;
  /** CTA link */
  ctaHref: string;
}

const TIERS: PricingTier[] = [
  {
    tierClass: "tier-curious",
    featured: false,
    icon: "◊", // ◊
    iconColor: "#7FC9BD",
    name: "Curious",
    tagline: "Try Cia. See how she fits your life.",
    priceMonthly: "0",
    priceAnnual: "0",
    period: "/forever",
    billedMonthly: "No card needed.",
    billedAnnual: "No card needed.",
    features: [
      { text: "Health & sleep tracking", included: true },
      { text: "5 chats with Cia per day", included: true },
      { text: "Daily morning briefing", included: true },
      { text: "Cross-domain insights", included: false },
      { text: "Voice & video coaching", included: false },
      { text: "Finance & career coach", included: false },
    ],
    ctaText: "Start free",
    ctaHref: "#download",
  },
  {
    tierClass: "tier-committed",
    featured: true,
    badge: "Most Popular",
    icon: "★", // ★
    iconColor: "var(--orange)",
    name: "Committed",
    tagline: "The full Cia. Every domain, every nudge.",
    priceMonthly: "19",
    priceAnnual: "15",
    period: "/month",
    billedMonthly: "Billed monthly. Cancel anytime.",
    billedAnnual: "Billed $180/year. Save $48 vs monthly.",
    features: [
      { text: "Everything in Curious", included: true, bold: true },
      { text: "Unlimited Cia voice, chat & photo", included: true },
      { text: "All 8 life domains coached", included: true },
      { text: "Cross-domain pattern alerts", included: true },
      { text: "Finance, career & relationship coaching", included: true },
      { text: "All integrations (Whoop, Plaid, etc.)", included: true },
    ],
    ctaText: "Start 14-day trial",
    ctaHref: "#download",
  },
  {
    tierClass: "tier-founder",
    featured: false,
    icon: "⬡", // ⬡
    iconColor: "var(--bread)",
    name: "Founder",
    tagline: "Pay once. Coach for life. Limited spots.",
    priceMonthly: "299",
    priceAnnual: "299",
    period: "/lifetime",
    billedMonthly: "One-time. Never billed again.",
    billedAnnual: "One-time. Never billed again.",
    features: [
      { text: "Everything in Committed", included: true, bold: true },
      { text: "Lifetime access — pay once, never again", included: true },
      { text: "All future features included", included: true },
      { text: "Priority support & roadmap input", included: true },
      { text: "Founder badge in community", included: true },
      { text: "Early access to new domains", included: true },
    ],
    ctaText: "Become a founder",
    ctaHref: "#download",
  },
];

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

/** Check icon matching source SVG */
function CheckIcon() {
  return (
    <span className="pricing-feature-check" aria-hidden="true">
      <svg viewBox="0 0 12 12">
        <polyline
          points="2,6 5,9 10,3"
          fill="none"
          stroke="#000"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Muted x icon matching source markup */
function XIcon() {
  return (
    <span className="pricing-feature-check x" aria-hidden="true">
      &times;
    </span>
  );
}

/** Trust badges at the bottom of the pricing section */
function TrustBadges() {
  const badges = [
    "30-day money-back",
    "Cancel anytime",
    "End-to-end encrypted",
    "Your data, exportable",
  ];

  return (
    <div className="pricing-trust" role="list" aria-label="Trust badges">
      {badges.map((label) => (
        <div key={label} role="listitem">
          <span className="pricing-trust-icon" aria-hidden="true">
            &#10003;
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────── */

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLDivElement>(null);
  const [billing, setBilling] = useState<BillingMode>("monthly");

  /* ── Position the slider pill behind the active toggle button ── */
  const positionSlider = useCallback(() => {
    if (!toggleRef.current || !sliderRef.current) return;
    const activeBtn = toggleRef.current.querySelector<HTMLButtonElement>(
      ".pricing-toggle-btn.active"
    );
    if (!activeBtn) return;

    const btnRect = activeBtn.getBoundingClientRect();
    const parentRect = toggleRef.current.getBoundingClientRect();

    sliderRef.current.style.left = `${btnRect.left - parentRect.left}px`;
    sliderRef.current.style.width = `${btnRect.width}px`;
  }, []);

  /* Position on mount + whenever billing changes */
  useEffect(() => {
    // rAF ensures the DOM has painted so getBoundingClientRect is accurate
    requestAnimationFrame(positionSlider);
  }, [billing, positionSlider]);

  /* Reposition on window resize */
  useEffect(() => {
    window.addEventListener("resize", positionSlider);
    return () => window.removeEventListener("resize", positionSlider);
  }, [positionSlider]);

  /* ── Animate price text on billing toggle ── */
  const amountRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const setAmountRef = useCallback(
    (index: number) => (el: HTMLSpanElement | null) => {
      amountRefs.current[index] = el;
    },
    []
  );

  useEffect(() => {
    amountRefs.current.forEach((el) => {
      if (!el) return;
      const newVal = el.dataset[billing] || "0";
      const currentVal = el.textContent;
      if (newVal === currentVal) return;

      // Quick fade out, swap, fade in
      el.style.transition = "opacity 0.2s, transform 0.2s";
      el.style.opacity = "0";
      el.style.transform = "translateY(-6px)";
      const timer = setTimeout(() => {
        el.textContent = newVal;
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 200);

      return () => clearTimeout(timer);
    });
  }, [billing]);

  /* ── GSAP scroll-in entrance animations ── */
  useGSAP(
    () => {
      if (!sectionRef.current) return;

      gsap.from(".pricing-header > *", {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
        immediateRender: false,
        scrollTrigger: {
          trigger: ".pricing-section",
          start: "top 95%",
          toggleActions: "play none none none",
        },
      });

      gsap.from(".pricing-card", {
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        immediateRender: false,
        scrollTrigger: {
          trigger: ".pricing-section",
          start: "top 90%",
          toggleActions: "play none none none",
        },
      });

      gsap.from(".pricing-trust > div", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        immediateRender: false,
        scrollTrigger: {
          trigger: ".pricing-trust",
          start: "top 95%",
          toggleActions: "play none none none",
        },
      });
    },
    sectionRef,
    []
  );

  /* ── Handlers ── */
  const handleBillingChange = useCallback((mode: BillingMode) => {
    setBilling(mode);
  }, []);

  return (
    <section
      className="pricing-section"
      id="pricing"
      ref={sectionRef}
      aria-label="Pricing plans"
    >
      <div className="pricing-inner">
        {/* ── Header ── */}
        <div className="pricing-header">
          <div className="pricing-eyebrow">
            Plans for every life stage
          </div>
          <h2 className="pricing-title">
            Coaching that{" "}
            <span className="serif">grows with you.</span>
          </h2>
          <p className="pricing-sub">
            Start free. Upgrade when you&rsquo;re ready. Cancel anytime
            &ndash; your data stays yours.
          </p>

          {/* Billing toggle */}
          <div
            className="pricing-toggle"
            ref={toggleRef}
            role="radiogroup"
            aria-label="Billing period"
          >
            <button
              type="button"
              className={`pricing-toggle-btn${
                billing === "monthly" ? " active" : ""
              }`}
              data-billing="monthly"
              role="radio"
              aria-checked={billing === "monthly"}
              onClick={() => handleBillingChange("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn${
                billing === "annual" ? " active" : ""
              }`}
              data-billing="annual"
              role="radio"
              aria-checked={billing === "annual"}
              onClick={() => handleBillingChange("annual")}
            >
              Annual
            </button>
            <div
              className="pricing-toggle-slider"
              ref={sliderRef}
              aria-hidden="true"
            />
            <div
              className="pricing-toggle-save"
              ref={saveRef}
              style={{
                opacity: billing === "annual" ? 1 : 0,
                transition: "opacity 0.3s",
              }}
              aria-hidden={billing !== "annual"}
            >
              Save 20%
            </div>
          </div>
        </div>

        {/* ── Cards grid ── */}
        <div className="pricing-grid">
          {TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={`pricing-card ${tier.tierClass}${
                tier.featured ? " featured" : ""
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="pricing-badge">{tier.badge}</div>
              )}

              {/* Icon */}
              <div
                className="pricing-card-icon"
                style={{ color: tier.iconColor } as CSSProperties}
                aria-hidden="true"
              >
                {tier.icon}
              </div>

              {/* Name + tagline */}
              <div className="pricing-card-name">{tier.name}</div>
              <div className="pricing-card-tagline">
                {tier.tagline}
              </div>

              {/* Price */}
              <div className="pricing-card-price">
                <span className="pricing-card-currency">$</span>
                <span
                  className="pricing-card-amount"
                  ref={setAmountRef(i)}
                  data-monthly={tier.priceMonthly}
                  data-annual={tier.priceAnnual}
                >
                  {billing === "monthly"
                    ? tier.priceMonthly
                    : tier.priceAnnual}
                </span>
                <span className="pricing-card-period">
                  {tier.period}
                </span>
              </div>

              {/* Billed info */}
              <div className="pricing-card-billed" id={tier.featured ? "committedBilled" : undefined}>
                {billing === "monthly"
                  ? tier.billedMonthly
                  : tier.billedAnnual}
              </div>

              {/* Feature list */}
              <ul className="pricing-card-features">
                {tier.features.map((feat) => (
                  <li
                    key={feat.text}
                    className={feat.included ? undefined : "muted"}
                  >
                    {feat.included ? <CheckIcon /> : <XIcon />}
                    <span>
                      {feat.bold ? <strong>{feat.text}</strong> : feat.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <a
                href={tier.ctaHref}
                className="pricing-card-cta"
                role="button"
              >
                {tier.ctaText}
              </a>
            </div>
          ))}
        </div>

        {/* ── Trust badges ── */}
        <TrustBadges />
      </div>
    </section>
  );
}

export default PricingSection;
