"use client";

import { useRef } from "react";
import { useGSAPReveal } from "@/hooks/use-gsap";

/**
 * Final CTA section — orb, headline, download button, and meta info.
 * Uses staggered GSAP reveal on the inner content children.
 */
export default function CTASection() {
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAPReveal(contentRef, {
    from: { y: 30, opacity: 0 },
    to: { y: 0, opacity: 1 },
    start: "top 70%",
    stagger: 0.1,
    childSelector: ":scope > *",
  });

  return (
    <section className="cta-section" id="download">
      <div className="cta-content" ref={contentRef}>
        <div className="cia-orb-big" style={{ marginBottom: 32 }} />
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          Ready to meet Cia?
        </div>
        <h2 className="h-display">
          Live <span className="serif">on purpose.</span>
        </h2>
        <p>Cia is waiting to know you. Every part of you.</p>
        <a href="#" className="btn btn-cia">
          <span>
            Download for iOS <span className="btn-arrow">&rarr;</span>
          </span>
        </a>
        <div className="cta-meta">
          <span>Free to start</span>
          <span className="cta-meta-dot" />
          <span>iOS &amp; Android</span>
          <span className="cta-meta-dot" />
          <span>2-min setup</span>
        </div>
      </div>
    </section>
  );
}
