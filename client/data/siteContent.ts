/**
 * Marketing copy + scene configuration for the cinematic landing page.
 *
 * Every user-facing string tagged `// COPY-REVIEW` is placeholder voice
 * authored during the rebuild. Grep for COPY-REVIEW to find everything
 * that should be reviewed / rewritten by marketing.
 *
 * Scene 6 (Life Areas) domain keys match
 * `server/src/config/life-area-domains.ts` exactly.
 */

export const site = {
  brand: {
    name: 'yHealth',
    tagline: 'AI Health Intelligence', // COPY-REVIEW
  },

  nav: {
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    cta: { label: 'Get Started', href: '/auth/signup' },
  },

  hero: {
    eyebrow: 'Your Health, Intelligently', // COPY-REVIEW
    headline: 'Your Health, Reimagined by AI.', // COPY-REVIEW
    sub: 'An intelligent tracking system that learns your rhythms, predicts your needs, and coaches you toward the life you want.', // COPY-REVIEW
    ctaPrimary: { label: 'Get Started', href: '/auth/signup' },
    ctaSecondary: { label: 'Watch Demo', href: '#demo' },
  },

  problemSolution: {
    headline: 'Most trackers watch. yHealth listens.', // COPY-REVIEW
    rows: [
      { problem: 'Fatigue tracking without insight',    solution: 'AI detects fatigue before you feel it.' }, // COPY-REVIEW
      { problem: 'Dashboards that lack meaning',        solution: 'Predictive analytics tuned to you.' },   // COPY-REVIEW
      { problem: 'Manual logging no one keeps up with', solution: 'Automatic health sync across devices.' }, // COPY-REVIEW
    ],
  },

  aiDashboard: {
    eyebrow: 'AI Health Intelligence Engine', // COPY-REVIEW
    headline: 'Your biometrics, translated into decisions.', // COPY-REVIEW
    chatTurns: [ // COPY-REVIEW
      { role: 'assistant', text: 'Your HRV dropped 8% this week. Want to adjust tomorrow\u2019s workout?' },
      { role: 'user',      text: 'Yes \u2014 shorter session?' },
      { role: 'assistant', text: 'I\u2019ll cut it to 25 min + extra recovery block.' },
    ],
    metrics: [
      { label: 'Heart rate',  kind: 'line'   }, // COPY-REVIEW
      { label: 'Sleep score', kind: 'radial' }, // COPY-REVIEW
      { label: 'Stress',      kind: 'heat'   }, // COPY-REVIEW
    ],
  },

  devices: {
    headline: 'One intelligence layer. Every screen.', // COPY-REVIEW
    states: ['dashboard', 'insights', 'logs'] as const, // COPY-REVIEW
  },

  features: {
    headline: 'Built for how life actually works.', // COPY-REVIEW
    cards: [
      { icon: 'Brain',      title: 'Predictive coaching', body: 'Learns your patterns and intervenes early.' },   // COPY-REVIEW
      { icon: 'HeartPulse', title: 'Biometric sync',       body: 'WHOOP, Apple Health, Fitbit, Oura \u2014 all in one.' }, // COPY-REVIEW
      { icon: 'Waves',      title: 'Mood + stress',        body: 'Non-invasive signals translated into action.' }, // COPY-REVIEW
      { icon: 'Target',     title: 'Life areas',           body: 'Career, relationships, creativity \u2014 coached.' }, // COPY-REVIEW
      { icon: 'Sparkles',   title: 'Voice coach',          body: 'Check in hands-free, anywhere.' },            // COPY-REVIEW
      { icon: 'Shield',     title: 'Private by design',    body: 'Your data never leaves the circle of trust.' }, // COPY-REVIEW
    ],
  },

  lifeAreasCarousel: {
    headline: 'One app for every area of your life.', // COPY-REVIEW
    sub: 'Career. Relationships. Creativity. Anything you want to improve \u2014 yHealth is the coach that shows up.', // COPY-REVIEW
    domains: [
      { type: 'career',        icon: 'Briefcase',  pitch: 'Apply daily, follow up weekly, land the next role.' },       // COPY-REVIEW
      { type: 'relationships', icon: 'Heart',      pitch: 'Never forget the people who matter.' },                       // COPY-REVIEW
      { type: 'creativity',    icon: 'Palette',    pitch: 'Practice consistently. Ship what you love.' },                // COPY-REVIEW
      { type: 'spirituality',  icon: 'Sparkles',   pitch: 'A quiet space for the practice you keep.' },                  // COPY-REVIEW
      { type: 'finance',       icon: 'Wallet',     pitch: 'Save, track, and build \u2014 on autopilot.' },                // COPY-REVIEW
      { type: 'fitness',       icon: 'Dumbbell',   pitch: 'Train smart, recover smarter.' },                              // COPY-REVIEW
      { type: 'learning',      icon: 'BookOpen',   pitch: 'Books. Courses. Skills. Tracked.' },                           // COPY-REVIEW
      { type: 'custom',        icon: 'Target',     pitch: 'Anything you\u2019re working on. We\u2019ll show up.' },        // COPY-REVIEW
    ],
    cta: { label: 'Explore Life Areas', href: '/life-areas' },
  },

  dataFlow: {
    headline: 'From signal to insight to action.', // COPY-REVIEW
    nodes: [
      { label: 'User data',  desc: 'Biometrics, habits, voice.' },     // COPY-REVIEW
      { label: 'AI engine',  desc: 'Patterns, predictions, context.' }, // COPY-REVIEW
      { label: 'Insight',    desc: 'What matters, right now.' },       // COPY-REVIEW
      { label: 'Action',     desc: 'Coach nudge, schedule, follow-up.' }, // COPY-REVIEW
    ],
  },

  testimonials: {
    headline: 'Built for real life.', // COPY-REVIEW
    // COPY-REVIEW \u2014 all synthetic placeholders. Replace with real user quotes.
    items: [
      { quote: 'yHealth changed how I show up every day.', author: 'Amina, 32',   role: 'Product designer' },          // TODO-REAL
      { quote: 'Lost 8kg. More importantly \u2014 kept it off.', author: 'David, 41',   role: 'Engineer' },              // TODO-REAL
      { quote: 'The only tracker that feels like it gets me.', author: 'Priya, 28',  role: 'Founder' },                   // TODO-REAL
    ],
  },

  finalCta: {
    headline: 'Start your health intelligence era.', // COPY-REVIEW
    sub: 'Free to try. No credit card.',               // COPY-REVIEW
    ctaPrimary:   { label: 'Start Free Trial', href: '/auth/signup' },
    ctaSecondary: { label: 'View Demo',        href: '#demo' },
  },
} as const;

export type SiteContent = typeof site;
