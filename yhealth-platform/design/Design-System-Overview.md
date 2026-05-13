# yHealth Design System

> The comprehensive design foundation for yHealth - Your AI Health Companion

---

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Philosophy** | Conversation-First, Playful & Expressive |
| **Primary Color** | Warm Teal `#00BCD4` |
| **Fitness Pillar** | Orange `#FF9800` (Ember the Flame) |
| **Nutrition Pillar** | Green `#4CAF50` (Sprout the Plant) |
| **Wellbeing Pillar** | Soft Blue `#5C9CE6` (Nimbus the Cloud) |
| **AI Coach** | Sage (illustrated character) |
| **Primary Font** | Lato / Open Sans |
| **Theme** | Dark Mode Primary |
| **Tech Stack** | shadcn/ui + Tailwind CSS |

---

## Design System Documents

### Foundation Layer

| Document | Purpose | Status |
|----------|---------|--------|
| [Brand Identity](./Brand-Identity.md) | Brand story, character design (Sage + creatures), voice | Active |
| [Color System](./Color-System.md) | Colors, gradients, creature palettes, celebrations | Active |
| [Typography System](./Typography-System.md) | Font stack, type scale, readability | Active |
| [Spacing & Layout](./Spacing-Layout.md) | Grid, spacing tokens, touch targets | Active |

### Component Layer

| Document | Purpose | Status |
|----------|---------|--------|
| [Component Library](./Component-Library.md) | UI components, conversation UI, creatures | Active |
| [Motion Design](./Motion-System.md) | Animations, creature behaviors, celebrations | Active |
| [Data Visualization](./Data-Visualization.md) | Charts, progressive disclosure, hierarchy | Active |

### Experience Layer

| Document | Purpose | Status |
|----------|---------|--------|
| [Home Page Design](./Home-Page-Design.md) | Hybrid layout with creatures and conversation | Active |
| [Conversation UI Design](./Conversation-UI-Design.md) | Chat interface, MCQ chips, voice input | Active |
| [Pillar Detail Design](./Pillar-Detail-Design.md) | Drill-down views, filtered conversations | Active |

### Guidelines Layer

| Document | Purpose | Status |
|----------|---------|--------|
| [Accessibility](./Accessibility.md) | WCAG 2.1 AA compliance standards | Active |
| [Voice & Tone](./Voice-Tone.md) | Supportive Friend personality, playful writing | Active |

---

## Design Principles

### 1. Conversation-First
The chat is the primary interface, not a feature. Users engage through conversation, and insights flow naturally from dialogue. Metrics support the story, not vice versa.

### 2. Playful, Not Childish
Expressive and fun, but trustworthy and credible. Characters add emotional connection without feeling juvenile. Celebrations feel joyful, not corporate.

### 3. Voice as Equal Citizen
Speaking is as natural as typing. Voice input is prominent and encouraged, not hidden as a secondary option.

### 4. Quick Taps, Deep Thoughts
MCQ chips for speed, expandable input for depth. Make engagement effortless while allowing meaningful expression.

### 5. Characters with Personality
Sage (the coach) and the pillar creatures (Ember, Sprout, Nimbus) create emotional connection. They react, celebrate, and support.

### 6. Three Living Pillars
Fitness, Nutrition, and Wellbeing are represented by animated creatures that grow and respond to user engagement.

### 7. Celebration Matters
Make wins feel genuinely good with animations, confetti, and character reactions. Progress should feel rewarding.

---

## Brand Identity Summary

### Positioning
**"Your AI Health Companion"** - Not a fitness tracker with AI bolted on. A playful, honest friend who happens to know everything about your health and genuinely wants to help you thrive.

### Core Promise
> *"The AI companion that knows you better than you know yourself - a supportive friend who helps you connect the dots between how you feel, move, and fuel your body."*

### Characters
- **Sage**: The AI coach - illustrated character with expressions (happy, curious, supportive, celebratory)
- **Ember**: Fitness creature (flame) - energetic, grows with activity
- **Sprout**: Nutrition creature (plant) - nurturing, blooms with good habits
- **Nimbus**: Wellbeing creature (cloud) - calm, peaceful when balanced

### Target Audience
- **Primary**: Health-conscious adults 25-55
- **Market**: US/Western
- **Personas**: Holistic Health Seekers, Busy Professionals, Wellness Enthusiasts

### Competitive Differentiation
| vs Competitors | yHealth Advantage |
|----------------|-------------------|
| WHOOP, Bevel | Conversation-first + living pillar creatures |
| Noom, MyFitnessPal | Playful personality + voice-equal input |
| Apple Health | AI companion with character, not passive dashboards |

---

## Visual Identity Summary

### Color Philosophy
- **Playful & Expressive**: Gradients, glows, and celebration colors that feel alive.
- **Living Creature Colors**: Each creature has gradient states reflecting their vitality.
- **Time-Aware Tints**: Warm mornings, cool evenings - subtle shifts throughout the day.
- **Dark Mode Primary**: Premium, immersive, modern. Battery-efficient and easier on eyes.

### Typography Philosophy
- **Humanist Sans**: Warm, friendly, approachable. Balance of modern and human.
- **Accessibility First**: Minimum 16px body, 44px touch targets, 4.5:1 contrast.

### Motion Philosophy
- **Characters That Breathe**: Creatures and Sage have idle animations, reactions, and celebrations.
- **Celebration Moments**: Confetti, glows, and animations for achievements.
- **Conversation Flow**: Smooth message animations, typing indicators, voice recording pulses.

---

## Implementation Guide

### For Developers (Tailwind/shadcn)

```css
/* Primary brand color */
--primary: 187 100% 42%; /* #00BCD4 */

/* Pillar colors */
--fitness: 36 100% 50%;  /* #FF9800 */
--nutrition: 122 39% 49%; /* #4CAF50 */
--wellbeing: 214 74% 63%; /* #5C9CE6 */

/* Dark mode surfaces */
--background: 0 0% 7%;     /* #121212 */
--card: 0 0% 12%;          /* #1E1E1E */
--foreground: 0 0% 98%;    /* #FAFAFA */
```

### For Designers

1. Use the color palette exactly as specified
2. Maintain 16px minimum body text
3. Ensure 44×44px minimum touch targets
4. Test all designs in dark mode first
5. Apply pillar colors consistently across all contexts

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-12-20 | Conversation-first redesign with characters |
| 1.0 | 2025-12-07 | Initial design system creation |

---

*yHealth Design System v2.0 | Conversation-First, Playful & Expressive*
