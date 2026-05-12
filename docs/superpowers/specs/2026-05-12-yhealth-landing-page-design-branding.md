---
title: yHealth Landing Page Design & Branding Guide
date: 2026-05-12
status: Draft
owner: yhealth-app
---

# yHealth Landing Page Design & Branding Guide

This document defines the landing page strategy, feature messaging, and brand rules for the yHealth app. It complements the cinematic landing page spec at `docs/superpowers/specs/2026-04-15-cinematic-landing-page-design.md` by giving the page a clear conversion goal, messaging system, and visual identity.

## 1. Goal

The landing page should convert visitors into account signups for yHealth by explaining, within the first screen, what yHealth does and why it matters:

> yHealth is an AI-powered fitness, nutrition, wellbeing, and coaching platform that helps users understand their health, track progress, and take better daily action.

Primary conversion action:

- **Start free / Get started**

Secondary action, if needed:

- **Watch demo** or **See how it works**

The page should avoid competing goals. Blog links, broad navigation, social links, and unrelated product detours should be minimized or moved out of the main conversion path.

## 2. Target Audience

Primary audience:

- People who want a single app for fitness, nutrition, wellbeing, habits, and AI coaching.
- Users who are overwhelmed by fragmented health apps and want guided daily action.
- Users who want progress tracking, personalized recommendations, and clear dashboards.

Secondary audience:

- Coaches, creators, or wellness professionals evaluating yHealth as a modern product experience.
- Early adopters interested in AI-assisted personal improvement.

The messaging should be practical, not vague. Visitors should quickly understand that yHealth helps them track real health inputs and convert them into daily recommendations.

## 3. Brand Positioning

yHealth should feel:

- **Intelligent**: AI coach, personalized insights, adaptive recommendations.
- **Energetic**: fitness, progress, momentum, daily action.
- **Trustworthy**: health data, privacy, clear metrics, credible guidance.
- **Modern**: polished SaaS interface, cinematic visuals, responsive design.
- **Human**: supportive coaching language, not cold analytics.

Positioning statement:

> Your personal AI health coach for fitness, nutrition, wellbeing, and daily progress.

Possible hero headline directions:

- **Your Health, Guided by AI**
- **One AI Coach for Your Fitness, Nutrition, and Wellbeing**
- **Turn Health Data Into Daily Action**

Avoid weak or generic headlines such as "Welcome to yHealth", "The Future of Wellness", or "AI-Powered Platform" without a concrete user outcome.

## 4. Brand Colors

Use a high-energy health palette with orange as the primary action color, emerald as the wellness/progress color, and purple as the AI/intelligence accent.

### Primary Color

**Orange**

- Use for primary CTAs, active states, key highlights, conversion moments, and energetic accents.
- Recommended Tailwind range: `orange-500`, `orange-600`, `orange-700`.
- CTA default: `orange-500`.
- CTA hover: `orange-600`.
- CTA active/pressed: `orange-700`.

### Supporting Health Color

**Emerald 500/600**

- Use for health progress, positive states, success messages, wellness metrics, and trust signals.
- Recommended Tailwind values: `emerald-500`, `emerald-600`.
- Use emerald for progress rings, checkmarks, habit streak indicators, nutrition wins, and "on track" states.

### AI Accent Color

**Purple**

- Use for AI coach moments, insight cards, intelligence visuals, recommendation badges, and subtle gradients.
- Recommended Tailwind range: `purple-500`, `purple-600`, `violet-600`.
- Purple should support the page, not dominate it.

### Neutral Base

Use a dark-first neutral base for cinematic sections:

- Backgrounds: near-black, zinc, neutral, or slate tones.
- Surfaces: translucent dark panels with restrained borders.
- Text: white or near-white for headings, muted gray for supporting copy.

Avoid making the page one-note. Orange, emerald, and purple should each have clear jobs instead of blending into a generic gradient-heavy design.

## 5. Visual Direction

The landing page should show the product and the user outcome. Avoid generic stock photography.

Preferred visuals:

- Real or realistic yHealth dashboard screenshots.
- AI coach chat preview.
- Fitness, nutrition, and wellbeing metric cards.
- Device mockups showing the app interface.
- Data-to-action diagrams showing how logs become recommendations.
- Cinematic health-core visual only when it supports the message.

Avoid:

- Generic people smiling at laptops.
- Abstract wellness imagery with no product context.
- Decorative blobs, random gradients, and visuals that could belong to any SaaS app.
- Animations that hide the message or delay the CTA.

## 6. Recommended Page Structure

Use an inverted pyramid: put the highest-converting message first, then progressively support it.

1. **Hero**
   - Clear value proposition.
   - One primary CTA.
   - Short supporting sentence.
   - Product visual or AI health dashboard preview.
   - Small trust/proof line if available.

2. **Immediate Proof**
   - User count, beta metric, security/privacy note, or credible product capability.
   - If real metrics are not available, use product proof instead: "Fitness, nutrition, wellbeing, and AI coaching in one workspace."

3. **Core Benefits**
   - 3 to 5 benefit cards.
   - Focus on user outcomes, not feature names.

4. **Feature Showcase**
   - Fitness tracking.
   - Nutrition planning.
   - Wellbeing dashboard.
   - AI coaching.
   - Progress analytics.
   - Community/challenges if currently supported.

5. **How It Works**
   - Log health data.
   - Get AI insight.
   - Follow a daily plan.
   - Track progress.

6. **AI Coach Section**
   - Show sample personalized recommendation flow.
   - Explain that coaching adapts to user goals and activity.

7. **Trust and Privacy**
   - Data privacy statement.
   - Secure account/sign-in messaging.
   - No exaggerated medical claims.

8. **Pricing or Plan Teaser**
   - Keep simple.
   - Address "free trial", "no card required", or "cancel anytime" only if true.

9. **FAQ**
   - Handle objections before final CTA.

10. **Final CTA**
   - Repeat the core promise.
   - One primary action.

## 7. Hero Section Requirements

Above the fold must answer:

- What is yHealth?
- Who is it for?
- What outcome does the user get?
- What should the user do next?

Recommended hero copy pattern:

```text
Headline:
One AI Coach for Your Fitness, Nutrition, and Wellbeing

Subheadline:
Track your habits, meals, workouts, mood, and progress in one place, then get personalized guidance for what to do next.

Primary CTA:
Get Started

Secondary CTA:
Watch Demo
```

Hero requirements:

- CTA visible without scrolling on desktop and mobile.
- Primary CTA uses orange.
- Supporting proof appears near the CTA.
- Hero visual shows actual yHealth product UI or a realistic product mockup.
- Copy stays concise: one headline, one short paragraph, one primary CTA.

## 8. Feature Messaging

Each feature should be translated into a user outcome.

| Feature | Benefit Message |
|---|---|
| Fitness tracking | Know what to train next and see progress over time. |
| Nutrition management | Plan meals, track macros, and understand eating patterns. |
| Wellbeing dashboard | Connect mood, energy, stress, sleep, and habits in one view. |
| AI coaching | Get personalized recommendations instead of generic advice. |
| Progress analytics | See trends clearly so you can adjust before motivation drops. |
| Community/challenges | Stay accountable through shared goals and visible momentum. |
| Life areas | Improve health alongside career, learning, relationships, finance, and personal growth. |
| Voice or chat coach | Ask questions naturally and get guided support inside the app. |

Feature sections should use short headings, one-sentence explanations, and visual examples. Avoid dense paragraphs.

## 9. CTA Strategy

Primary CTA:

- `Get Started`
- `Start Your Health Journey`
- `Start Free`

Use one primary CTA label consistently across the page once chosen.

Secondary CTA:

- `Watch Demo`
- `See How It Works`

CTA placement:

- Hero.
- After benefits.
- After AI coach/product proof.
- Before footer.

Do not use more than two CTAs in the hero. Do not give equal visual weight to primary and secondary CTAs.

## 10. Trust, Safety, and Claims

yHealth is health-adjacent, so the landing page must be careful with claims.

Required rules:

- Do not promise diagnosis, treatment, cures, guaranteed weight loss, or guaranteed health outcomes.
- Use coaching and guidance language, not medical authority language.
- Include privacy reassurance near signup.
- Keep AI recommendations framed as support, not a replacement for professionals.

Suggested FAQ topics:

- Is yHealth medical advice?
- What health data can I track?
- Can I use yHealth without a wearable?
- Is my data private?
- What does the AI coach do?
- Can I cancel or change my plan?

## 11. Mobile Requirements

Mobile is a first-class landing page experience.

Requirements:

- Primary CTA visible in the first viewport.
- Tap targets at least 44px tall.
- No horizontal scrolling.
- Hero copy readable without zoom.
- Product mockups crop intentionally, not accidentally.
- Cinematic scroll effects degrade into simple vertical sections.
- Forms ask for the minimum required information.

For mobile, prioritize message clarity and speed over heavy animation.

## 12. Accessibility Requirements

The landing page should be usable with keyboard, screen readers, reduced motion, and high contrast needs.

Requirements:

- Semantic section structure.
- One clear `h1`.
- Logical heading order.
- Accessible button and link labels.
- Color contrast meets WCAG AA.
- Form inputs have labels.
- Decorative visuals are `aria-hidden`.
- `prefers-reduced-motion` disables or simplifies cinematic animations.
- Focus states are visible, especially on CTAs and forms.

## 13. Performance Requirements

Speed is part of conversion.

Targets:

- LCP under 2.5s.
- Mobile load under 3s on realistic network conditions.
- Hero visual optimized and not render-blocking.
- No unnecessary third-party scripts above the fold.
- Lazy-load below-fold media and heavy animation components.
- Use transform and opacity for animations.

The landing page should not sacrifice clarity or speed for visual effects.

## 14. Content Checklist

Before building or publishing, confirm:

- The hero says what yHealth does within 5 seconds.
- The primary CTA is visible above the fold.
- The page has one primary conversion goal.
- Feature copy explains outcomes, not just capabilities.
- At least one trust signal appears before the user is asked to commit.
- Health and AI claims are conservative and accurate.
- FAQ handles privacy, AI, and health-advice concerns.
- Mobile layout is readable and fast.
- Visuals show the product or user outcome.

## 15. Build Checklist

Implementation should preserve the existing Next.js/Tailwind patterns in `client/`.

Recommended implementation rules:

- Keep content in a centralized data file when possible.
- Reuse existing landing page animation infrastructure from the cinematic landing page work.
- Use orange for primary CTAs, emerald for health/progress states, and purple for AI accents.
- Use `next/image` for raster visuals with explicit sizes.
- Avoid adding new dependencies unless the existing stack cannot support the requirement.
- Keep the page buildable after each meaningful change.
- Test desktop and mobile layouts.
- Run lint/build checks before shipping.

## 16. Anti-Patterns to Avoid

Avoid:

- Full navigation that leaks users away from signup.
- Multiple competing CTA styles.
- Generic hero statements.
- Generic stock photography.
- Heavy animations that delay comprehension.
- Walls of text.
- Unsupported medical claims.
- Fake testimonials or fabricated metrics.
- Footer link mazes before the final CTA.
- Purple/orange/emerald gradients used everywhere without hierarchy.

## 17. Relationship to Cinematic Landing Page Spec

The cinematic landing page spec defines a scene-based implementation direction. This guide defines the conversion and brand rules those scenes should follow.

If the cinematic page and this guide conflict, use this guide for messaging, brand hierarchy, CTA behavior, trust requirements, and conversion strategy. Use the cinematic spec for scene sequencing and animation architecture.

