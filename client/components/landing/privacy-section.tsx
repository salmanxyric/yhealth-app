"use client";

import { useRef } from "react";
import { useGSAPReveal } from "@/hooks/use-gsap";

/**
 * Privacy block section — eyebrow, heading, descriptive paragraph,
 * and a row of privacy-feature badges (checkmarks handled via CSS ::before).
 *
 * Uses `useGSAPReveal` with `childSelector` to stagger children of
 * `.privacy-block-inner` exactly as the original JS does.
 */

const PRIVACY_FEATURES = [
  "End-to-end encrypted",
  "GDPR & HIPAA aligned",
  "Export anytime",
  "Delete in one click",
] as const;

export default function PrivacySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAPReveal(sectionRef, {
    from: { y: 30, opacity: 0 },
    to: { opacity: 1, y: 0 },
    start: "top 70%",
    stagger: 0.1,
    childSelector: ".privacy-block-inner > *",
  });

  return (
    <section className="privacy-block" ref={sectionRef}>
      <div className="privacy-block-inner">
        <div className="eyebrow">Built for privacy</div>
        <h2 className="h-section" style={{ marginTop: 16 }}>
          Your life is <span className="serif">yours.</span>
        </h2>
        <p>
          Cia knows everything about you because you trust her with it. We never
          sell that trust. End-to-end encrypted, GDPR/HIPAA-aligned, deletable
          in one click.
        </p>
        <div className="privacy-features">
          {PRIVACY_FEATURES.map((feature) => (
            <div className="privacy-feature" key={feature}>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
