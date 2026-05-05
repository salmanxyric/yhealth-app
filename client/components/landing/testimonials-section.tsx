"use client";

/* ------------------------------------------------------------------ */
/*  Testimonials Section - 3-row infinite scroll marquee               */
/*  Pure CSS animation (no GSAP needed). Rows pause on hover.          */
/* ------------------------------------------------------------------ */

interface Testimonial {
  stars: number;
  quote: string;
  initial: string;
  avatarBg: string;
  /** Override text color on avatar (default white) */
  avatarColor?: string;
  name: string;
  role: string;
}

/* ------------------------------------------------------------------ */
/*  Row data                                                           */
/* ------------------------------------------------------------------ */

const ROW_1: Testimonial[] = [
  {
    stars: 5,
    quote:
      "“Cia is wild. Like calling my best friend who happens to be a doctor, trainer, and CFO.”",
    initial: "I",
    avatarBg: "var(--orange)",
    name: "Isaac Thompson",
    role: "Founder · NYC",
  },
  {
    stars: 5,
    quote:
      "“Switched from 6 apps to one. Cia handles fitness, money, work, relationships — all of it.”",
    initial: "M",
    avatarBg: "var(--purple)",
    name: "Maya Rodriguez",
    role: "Project Manager · Berlin",
  },
  {
    stars: 5,
    quote:
      "“She knows when I’m lying about how I’m feeling. Honestly unsettling. In a good way.”",
    initial: "D",
    avatarBg: "var(--lime)",
    avatarColor: "var(--ink)",
    name: "Daniel Chen",
    role: "Software Engineer · Austin",
  },
  {
    stars: 5,
    quote:
      "“The 1:1 prep feature literally got me promoted. Cia drafted my pitch the night before.”",
    initial: "J",
    avatarBg: "var(--mind)",
    name: "Jordan Patel",
    role: "Product Lead · LA",
  },
  {
    stars: 5,
    quote:
      "“Cia spotted my burnout two weeks before I did. That’s when I knew this was different.”",
    initial: "A",
    avatarBg: "var(--growth)",
    name: "Aisha Khan",
    role: "Designer · London",
  },
];

const ROW_2: Testimonial[] = [
  {
    stars: 5,
    quote:
      "“My savings rate doubled in three months. Cia found subscriptions I forgot I had.”",
    initial: "M",
    avatarBg: "var(--purple)",
    name: "Marcus Bell",
    role: "Consultant · Toronto",
  },
  {
    stars: 5,
    quote:
      "“Group sessions are addictive. We do morning HIIT 3x a week. Friends from 4 cities.”",
    initial: "P",
    avatarBg: "var(--orange)",
    name: "Priya Singh",
    role: "Marketing Lead · Mumbai",
  },
  {
    stars: 5,
    quote:
      "“Finally, an AI that doesn’t pretend to be human. Cia’s honest about what she is.”",
    initial: "S",
    avatarBg: "var(--lime)",
    avatarColor: "var(--ink)",
    name: "Sofia García",
    role: "Researcher · Madrid",
  },
  {
    stars: 5,
    quote:
      "“She helped me leave the job I hated. Months of conversations, not one push.”",
    initial: "L",
    avatarBg: "#E8765A",
    name: "Leo Almeida",
    role: "Engineer · São Paulo",
  },
  {
    stars: 5,
    quote:
      "“Morning briefings start my day right. HRV, calendar, money, family — 30 seconds.”",
    initial: "Y",
    avatarBg: "var(--mind)",
    name: "Yuki Tanaka",
    role: "Designer · Tokyo",
  },
];

const ROW_3: Testimonial[] = [
  {
    stars: 5,
    quote:
      "“Cia helped me have the hard conversation I’d avoided for years. Saved my marriage.”",
    initial: "S",
    avatarBg: "var(--growth)",
    name: "Sam O’Connor",
    role: "Architect · Sydney",
  },
  {
    stars: 5,
    quote:
      "“I trust Cia more than my last therapist, honestly. And she costs less.”",
    initial: "E",
    avatarBg: "var(--orange)",
    name: "Emma Walsh",
    role: "Doctor · Dublin",
  },
  {
    stars: 5,
    quote:
      "“Video calls feel weirdly personal. In a good way. She remembers my dog’s name.”",
    initial: "T",
    avatarBg: "var(--purple)",
    name: "Théo Laurent",
    role: "Photographer · Paris",
  },
  {
    stars: 5,
    quote:
      "“My partner says I’m ‘present’ for the first time in years. Cia made me notice.”",
    initial: "N",
    avatarBg: "var(--lime)",
    avatarColor: "var(--ink)",
    name: "Noor Al-Fahim",
    role: "Operations · Dubai",
  },
  {
    stars: 5,
    quote:
      "“This is the future of self-care. No spam, no fake encouragement. Just truth.”",
    initial: "R",
    avatarBg: "var(--mind)",
    name: "Riley Murphy",
    role: "Writer · Melbourne",
  },
];

/* ------------------------------------------------------------------ */
/*  Testimonial card                                                   */
/* ------------------------------------------------------------------ */

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="tcard">
      <div className="tcard-stars" aria-label={`${t.stars} out of 5 stars`}>
        {"★".repeat(t.stars)}
      </div>
      <div className="tcard-quote">{t.quote}</div>
      <div className="tcard-author">
        <div
          className="tcard-avatar"
          style={{
            background: t.avatarBg,
            ...(t.avatarColor ? { color: t.avatarColor } : {}),
          }}
          aria-hidden="true"
        >
          {t.initial}
        </div>
        <div className="tcard-meta">
          <div className="tcard-name">{t.name}</div>
          <div className="tcard-role">{t.role}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Marquee row                                                        */
/* ------------------------------------------------------------------ */

interface MarqueeRowProps {
  testimonials: Testimonial[];
  direction: "dir-rtl" | "dir-ltr" | "dir-rtl-slow";
}

function MarqueeRow({ testimonials, direction }: MarqueeRowProps) {
  return (
    <div className={`testimonials-row ${direction}`}>
      <div className="testimonials-track-marquee">
        {/* Original set */}
        {testimonials.map((t, i) => (
          <TestimonialCard key={`${t.name}-a-${i}`} t={t} />
        ))}
        {/* Duplicate set for seamless loop */}
        {testimonials.map((t, i) => (
          <TestimonialCard key={`${t.name}-b-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main section                                                       */
/* ------------------------------------------------------------------ */

export function TestimonialsSection() {
  return (
    <section className="testimonials-section">
      <div className="testimonials-header">
        <div className="eyebrow" style={{ marginBottom: 16 }}>
          Loved everywhere
        </div>
        <h2 className="h-section">
          Trusted by{" "}
          <span
            className="serif"
            style={{
              background:
                "linear-gradient(135deg, var(--orange), var(--purple-glow), var(--lime))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            1M+ people.
          </span>
        </h2>
        <p style={{ color: "var(--muted-light)", fontSize: 16, marginTop: 20 }}>
          From every domain. Every walk of life.
        </p>
      </div>

      <div className="testimonials-rows">
        {/* Row 1: RTL, 80s duration */}
        <MarqueeRow testimonials={ROW_1} direction="dir-rtl" />

        {/* Row 2: LTR, 90s duration */}
        <MarqueeRow testimonials={ROW_2} direction="dir-ltr" />

        {/* Row 3: RTL slow, 110s duration */}
        <MarqueeRow testimonials={ROW_3} direction="dir-rtl-slow" />
      </div>
    </section>
  );
}

export default TestimonialsSection;
