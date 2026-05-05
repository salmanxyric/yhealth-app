"use client";

/**
 * Integrations marquee — infinite-scrolling horizontal strip of
 * integration logos / brand names. The track is duplicated inside
 * a single flex row so CSS `@keyframes marquee` produces a seamless loop.
 */

const INTEGRATIONS = [
  { icon: "⌚", label: "Apple Watch" },
  { icon: "💍", label: "Oura Ring" },
  { icon: "🟣", label: "Whoop" },
  { icon: "⌚", label: "Garmin" },
  { icon: "🟢", label: "Strava" },
  { icon: "📅", label: "Google Cal" },
  { icon: "🏦", label: "Plaid" },
  { icon: "💼", label: "LinkedIn" },
  { icon: "📧", label: "Gmail" },
  { icon: "🍎", label: "Apple Health" },
] as const;

function MarqueeItems() {
  return (
    <>
      {INTEGRATIONS.map((item, i) => (
        <div className="marquee-item" key={i}>
          <span className="marquee-item-icon">{item.icon}</span> {item.label}
        </div>
      ))}
    </>
  );
}

export default function MarqueeSection() {
  return (
    <section className="marquee">
      <div className="marquee-track">
        {/* Original set */}
        <MarqueeItems />
        {/* Duplicate set for seamless infinite loop */}
        <MarqueeItems />
      </div>
    </section>
  );
}
