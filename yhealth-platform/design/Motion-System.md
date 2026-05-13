# yHealth Motion Design System

> Playful, expressive animations that bring Sage and the pillar creatures to life.

---

## Quick Reference

| Animation Type | Duration | Easing |
|---------------|----------|--------|
| Creature Idle | Continuous | ease-in-out |
| Creature Tap | 300ms | spring |
| Message Appear | 200ms | ease-out |
| Celebration | 600ms+ | spring/bounce |
| Sage Expression | 200ms | ease-out |
| Voice Recording | Continuous | linear pulse |

---

## Motion Philosophy

### Design Principles

1. **Characters Feel Alive**: Sage and creatures have constant subtle motion - they breathe, bob, and react.
2. **Celebrate Wins Joyfully**: Achievements deserve confetti, dances, and genuine excitement.
3. **Conversation Flows Naturally**: Messages animate in smoothly, typing indicators pulse, voice recordings visualize.
4. **Adaptive Energy**: Match motion intensity to context - energetic for wins, gentle for support.
5. **Performance-First**: 60fps, hardware-accelerated animations only.
6. **Accessible**: Respect `prefers-reduced-motion` preference.

### When to Use Motion

| Use Case | Motion Type | Purpose |
|----------|-------------|---------|
| State changes | Micro-interaction | Feedback confirmation |
| Page transitions | Navigation | Context preservation |
| Loading | Progress | Reduce perceived wait |
| Celebrations | Delight | Positive reinforcement |
| Errors | Attention | Direct user focus |
| Data updates | Transition | Smooth state changes |

### When NOT to Use Motion

- Purely decorative animations
- Complex animations that distract
- Animations that delay user actions
- Motion that competes with content
- Looping animations without purpose

---

## Timing Tokens

### Duration Scale

| Token | Duration | Tailwind | Usage |
|-------|----------|----------|-------|
| `instant` | 0ms | `duration-0` | Immediate feedback |
| `micro` | 100ms | `duration-100` | Hover states |
| `fast` | 150ms | `duration-150` | Button press, toggles |
| `normal` | 200ms | `duration-200` | **Default transitions** |
| `medium` | 300ms | `duration-300` | Page transitions |
| `slow` | 400ms | `duration-400` | Modal open/close |
| `slower` | 500ms | `duration-500` | Complex animations |
| `celebration` | 600ms | `duration-600` | Achievement unlock |

### CSS Custom Properties

```css
:root {
  --duration-instant: 0ms;
  --duration-micro: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-medium: 300ms;
  --duration-slow: 400ms;
  --duration-slower: 500ms;
  --duration-celebration: 600ms;
}
```

---

## Easing Functions

### Easing Scale

| Token | Curve | Tailwind | Usage |
|-------|-------|----------|-------|
| `ease-linear` | `linear` | `ease-linear` | Progress bars |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | `ease-in` | Exit animations |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | `ease-out` | **Enter animations** |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | `ease-in-out` | Move animations |
| `ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | custom | Celebrations |
| `ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | custom | Playful feedback |

### CSS Custom Properties

```css
:root {
  --ease-linear: linear;
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Easing Guidelines

| Animation Type | Recommended Easing |
|----------------|-------------------|
| Enter/appear | `ease-out` |
| Exit/disappear | `ease-in` |
| Move/resize | `ease-in-out` |
| Progress | `linear` |
| Celebrations | `ease-spring` or `ease-bounce` |

---

## Micro-Interactions

### Button Press

```css
.button {
  transition: transform var(--duration-fast) var(--ease-out),
              background-color var(--duration-fast) var(--ease-out);
}

.button:active {
  transform: scale(0.98);
}
```

**Behavior:**
- Scale down slightly on press (0.98)
- Background color change
- Duration: 150ms
- Easing: ease-out

### Toggle Switch

```css
.toggle-thumb {
  transition: transform var(--duration-normal) var(--ease-spring);
}

.toggle-track {
  transition: background-color var(--duration-normal) var(--ease-out);
}
```

**Behavior:**
- Thumb slides with spring easing
- Track color fades
- Duration: 200ms

### Checkbox Check

```css
.checkbox-check {
  transform-origin: center;
  transition: transform var(--duration-fast) var(--ease-spring),
              opacity var(--duration-fast) var(--ease-out);
}

.checkbox-check.checked {
  transform: scale(1);
  opacity: 1;
}

.checkbox-check.unchecked {
  transform: scale(0);
  opacity: 0;
}
```

**Behavior:**
- Check mark scales in with spring
- Slight overshoot for satisfaction
- Duration: 150ms

### Card Hover (Desktop)

```css
.card {
  transition: transform var(--duration-normal) var(--ease-out),
              box-shadow var(--duration-normal) var(--ease-out);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

**Behavior:**
- Subtle lift on hover
- Shadow increase
- Duration: 200ms

### Input Focus

```css
.input {
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.2);
}
```

---

## Page Transitions

### Screen Push (Forward Navigation)

```css
/* Entering screen */
.page-enter {
  transform: translateX(100%);
  opacity: 0;
}

.page-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: transform var(--duration-medium) var(--ease-out),
              opacity var(--duration-medium) var(--ease-out);
}

/* Exiting screen */
.page-exit {
  transform: translateX(0);
  opacity: 1;
}

.page-exit-active {
  transform: translateX(-30%);
  opacity: 0.5;
  transition: transform var(--duration-medium) var(--ease-in),
              opacity var(--duration-medium) var(--ease-in);
}
```

### Screen Pop (Back Navigation)

```css
/* Entering screen (coming back) */
.page-enter-back {
  transform: translateX(-30%);
  opacity: 0.5;
}

.page-enter-back-active {
  transform: translateX(0);
  opacity: 1;
  transition: transform var(--duration-medium) var(--ease-out),
              opacity var(--duration-medium) var(--ease-out);
}

/* Exiting screen */
.page-exit-back {
  transform: translateX(0);
  opacity: 1;
}

.page-exit-back-active {
  transform: translateX(100%);
  opacity: 0;
  transition: transform var(--duration-medium) var(--ease-in),
              opacity var(--duration-medium) var(--ease-in);
}
```

### Tab Switch

```css
.tab-content {
  transition: opacity var(--duration-normal) var(--ease-out);
}

.tab-content.entering {
  opacity: 0;
}

.tab-content.active {
  opacity: 1;
}
```

**Behavior:**
- Cross-fade between tabs
- No position animation (tabs are in place)
- Duration: 200ms

---

## Modal Animations

### Bottom Sheet

```css
/* Backdrop */
.sheet-backdrop {
  transition: opacity var(--duration-medium) var(--ease-out);
}

.sheet-backdrop.entering { opacity: 0; }
.sheet-backdrop.active { opacity: 1; }
.sheet-backdrop.exiting { opacity: 0; }

/* Sheet */
.sheet {
  transition: transform var(--duration-medium) var(--ease-out);
}

.sheet.entering { transform: translateY(100%); }
.sheet.active { transform: translateY(0); }
.sheet.exiting { transform: translateY(100%); }
```

**Behavior:**
- Slide up from bottom
- Backdrop fades in
- Duration: 300ms

### Dialog

```css
/* Backdrop */
.dialog-backdrop {
  transition: opacity var(--duration-medium) var(--ease-out);
}

/* Dialog */
.dialog {
  transition: opacity var(--duration-medium) var(--ease-out),
              transform var(--duration-medium) var(--ease-out);
}

.dialog.entering {
  opacity: 0;
  transform: scale(0.95);
}

.dialog.active {
  opacity: 1;
  transform: scale(1);
}

.dialog.exiting {
  opacity: 0;
  transform: scale(0.95);
}
```

**Behavior:**
- Scale up slightly while fading in
- Duration: 300ms

---

## Loading Animations

### Spinner

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

### Skeleton Shimmer

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--muted) 25%,
    var(--surface-elevated-2) 50%,
    var(--muted) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Progress Ring Fill

```css
@keyframes ring-fill {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: var(--progress); }
}

.progress-ring-circle {
  animation: ring-fill 1s var(--ease-out) forwards;
}
```

---

## Celebration Animations

### Achievement Unlock

```css
@keyframes achievement-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.achievement {
  animation: achievement-pop var(--duration-celebration) var(--ease-spring);
}
```

**Include:**
- Scale up with overshoot
- Optional confetti particles
- Haptic feedback (device vibration)
- Sound effect (optional, respect settings)

### Streak Animation

```css
@keyframes streak-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.streak-badge {
  animation: streak-pulse 2s var(--ease-in-out) infinite;
}
```

### Checkmark Success

```css
@keyframes check-draw {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.check-icon path {
  stroke-dasharray: 100;
  animation: check-draw var(--duration-medium) var(--ease-out) forwards;
}
```

### Confetti Burst

```css
@keyframes confetti-fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes confetti-sway {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(20px); }
}

.confetti-piece {
  animation:
    confetti-fall 3s ease-out forwards,
    confetti-sway 0.5s ease-in-out infinite;
}
```

**Confetti Colors** (from Color-System.md):
- `#FF6B6B` (Coral)
- `#4ECDC4` (Teal)
- `#FFE66D` (Yellow)
- `#95E1D3` (Mint)
- `#F38181` (Salmon)
- `#AA96DA` (Lavender)

**Trigger Moments:**
- Goal completion
- Streak milestone (7, 14, 30 days)
- All three pillars at 80+
- First check-in of the day (subtle version)

---

## Sage Character Animations

Sage is the AI coach character that appears throughout the app. Animations bring Sage to life.

### Idle Breathing

Sage has a subtle idle animation that runs continuously when visible.

```css
@keyframes sage-breathe {
  0%, 100% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.02) translateY(-2px);
  }
}

.sage-avatar {
  animation: sage-breathe 3s ease-in-out infinite;
}
```

### Expression Transitions

When Sage's expression changes (e.g., from curious to celebratory), animate smoothly.

```css
@keyframes sage-expression-change {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.sage-avatar.changing-expression {
  animation: sage-expression-change 200ms ease-out;
}
```

### Expression-Specific Animations

#### Happy (Default Greeting)
```css
@keyframes sage-happy-bounce {
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-4px); }
  75% { transform: translateY(2px); }
}

.sage-avatar.happy {
  animation: sage-happy-bounce 0.5s ease-out;
}
```

#### Curious (Asking Questions)
```css
@keyframes sage-curious-tilt {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(5deg); }
}

.sage-avatar.curious {
  animation: sage-curious-tilt 2s ease-in-out infinite;
}
```

#### Celebratory (Achievements)
```css
@keyframes sage-celebrate {
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-5deg); }
  50% { transform: scale(1.15) rotate(5deg); }
  75% { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.sage-avatar.celebratory {
  animation: sage-celebrate 0.6s ease-out;
}
```

#### Thinking (Processing)
```css
@keyframes sage-think {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.sage-avatar.thinking {
  animation: sage-think 1s ease-in-out infinite;
}

/* Thought bubble dots */
@keyframes thought-dots {
  0%, 20% { opacity: 0.3; }
  40% { opacity: 1; }
  60%, 100% { opacity: 0.3; }
}

.thought-dot:nth-child(1) { animation-delay: 0s; }
.thought-dot:nth-child(2) { animation-delay: 0.2s; }
.thought-dot:nth-child(3) { animation-delay: 0.4s; }
```

#### Supportive (User Struggling)
```css
@keyframes sage-supportive {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

.sage-avatar.supportive {
  animation: sage-supportive 2s ease-in-out infinite;
  filter: brightness(0.95); /* Softer, warmer */
}
```

#### Listening (Voice Input)
```css
@keyframes sage-listen-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 188, 212, 0.4);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 8px rgba(0, 188, 212, 0);
  }
}

.sage-avatar.listening {
  animation: sage-listen-pulse 1.5s ease-in-out infinite;
}
```

### Wave Greeting

First-time users or morning greetings get a special wave.

```css
@keyframes sage-wave {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  30% { transform: rotate(14deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60%, 100% { transform: rotate(0deg); }
}

.sage-hand {
  transform-origin: bottom center;
  animation: sage-wave 1s ease-in-out;
}
```

---

## Pillar Creature Animations

Each pillar has an animated creature that grows/shrinks based on user engagement.

### Ember (Fitness - Flame)

#### Idle Flicker
```css
@keyframes ember-flicker {
  0%, 100% {
    transform: scaleY(1) scaleX(1);
    filter: brightness(1);
  }
  25% {
    transform: scaleY(1.03) scaleX(0.98);
    filter: brightness(1.05);
  }
  50% {
    transform: scaleY(0.97) scaleX(1.02);
    filter: brightness(0.98);
  }
  75% {
    transform: scaleY(1.02) scaleX(0.99);
    filter: brightness(1.02);
  }
}

.ember-creature {
  animation: ember-flicker 1.5s ease-in-out infinite;
}
```

#### State-Based Size
```css
/* Score 0-39: Ember state */
.ember-creature[data-state="ember"] {
  transform: scale(0.6);
  filter: saturate(0.7) brightness(0.9);
  animation-duration: 3s; /* Slower, weaker */
}

/* Score 40-59: Dimming state */
.ember-creature[data-state="dimming"] {
  transform: scale(0.8);
  filter: saturate(0.85);
  animation-duration: 2s;
}

/* Score 60-79: Steady state */
.ember-creature[data-state="steady"] {
  transform: scale(1);
  animation-duration: 1.5s;
}

/* Score 80-100: Blazing state */
.ember-creature[data-state="blazing"] {
  transform: scale(1.1);
  filter: saturate(1.2) brightness(1.1);
  animation-duration: 1s; /* Faster, more energetic */
}
```

#### Tap Reaction
```css
@keyframes ember-tap {
  0% { transform: scale(1); }
  30% { transform: scale(1.2); filter: brightness(1.3); }
  100% { transform: scale(1); filter: brightness(1); }
}

.ember-creature:active {
  animation: ember-tap 300ms ease-out;
}
```

#### Celebration Dance
```css
@keyframes ember-dance {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(-10deg); }
  50% { transform: translateY(-5px) rotate(10deg); }
  75% { transform: translateY(-12px) rotate(-5deg); }
}

.ember-creature.celebrating {
  animation: ember-dance 0.6s ease-out 3; /* 3 iterations */
}
```

#### Sparks Effect (Achievement)
```css
@keyframes ember-spark {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-30px) scale(0);
    opacity: 0;
  }
}

.ember-spark {
  animation: ember-spark 0.8s ease-out forwards;
}
```

---

### Sprout (Nutrition - Plant)

#### Idle Sway
```css
@keyframes sprout-sway {
  0%, 100% {
    transform: rotate(0deg);
  }
  33% {
    transform: rotate(2deg);
  }
  66% {
    transform: rotate(-2deg);
  }
}

.sprout-creature {
  transform-origin: bottom center;
  animation: sprout-sway 4s ease-in-out infinite;
}
```

#### State-Based Size
```css
/* Score 0-39: Seedling state */
.sprout-creature[data-state="seedling"] {
  transform: scale(0.5);
  filter: saturate(0.6) brightness(0.85);
}

/* Score 40-59: Wilting state */
.sprout-creature[data-state="wilting"] {
  transform: scale(0.75) rotate(-5deg);
  filter: saturate(0.75);
}

/* Score 60-79: Growing state */
.sprout-creature[data-state="growing"] {
  transform: scale(1);
}

/* Score 80-100: Flourishing state */
.sprout-creature[data-state="flourishing"] {
  transform: scale(1.15);
  filter: saturate(1.2) brightness(1.1);
}
```

#### Tap Reaction
```css
@keyframes sprout-perk {
  0% { transform: scaleY(1); }
  30% { transform: scaleY(1.15); }
  50% { transform: scaleY(0.95); }
  100% { transform: scaleY(1); }
}

.sprout-creature:active {
  animation: sprout-perk 300ms ease-out;
}
```

#### Bloom Effect (Achievement)
```css
@keyframes sprout-bloom {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.sprout-flower {
  animation: sprout-bloom 0.5s ease-out forwards;
}
```

#### Leaf Rustle
```css
@keyframes leaf-rustle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(5deg); }
  75% { transform: rotate(-5deg); }
}

.sprout-leaf {
  animation: leaf-rustle 0.4s ease-in-out 2;
}
```

---

### Nimbus (Wellbeing - Cloud)

#### Idle Float
```css
@keyframes nimbus-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.nimbus-creature {
  animation: nimbus-float 3s ease-in-out infinite;
}
```

#### State-Based Size
```css
/* Score 0-39: Stormy state */
.nimbus-creature[data-state="stormy"] {
  transform: scale(0.6);
  filter: saturate(0.5) brightness(0.7);
  /* Add rain particles */
}

/* Score 40-59: Cloudy state */
.nimbus-creature[data-state="cloudy"] {
  transform: scale(0.8);
  filter: saturate(0.7) brightness(0.85);
}

/* Score 60-79: Balanced state */
.nimbus-creature[data-state="balanced"] {
  transform: scale(1);
}

/* Score 80-100: Serene state */
.nimbus-creature[data-state="serene"] {
  transform: scale(1.1);
  filter: saturate(1.1) brightness(1.15);
  /* Add subtle glow */
}
```

#### Tap Reaction
```css
@keyframes nimbus-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(92, 156, 230, 0.4); }
  50% { transform: scale(1.1); box-shadow: 0 0 20px 10px rgba(92, 156, 230, 0.2); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(92, 156, 230, 0); }
}

.nimbus-creature:active {
  animation: nimbus-pulse 400ms ease-out;
}
```

#### Rainbow Effect (Achievement)
```css
@keyframes rainbow-appear {
  0% {
    transform: scaleX(0);
    opacity: 0;
  }
  50% {
    transform: scaleX(1.1);
    opacity: 1;
  }
  100% {
    transform: scaleX(1);
    opacity: 1;
  }
}

.nimbus-rainbow {
  transform-origin: left center;
  animation: rainbow-appear 0.6s ease-out forwards;
}
```

#### Rain Effect (Low Score)
```css
@keyframes rain-drop {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(30px);
    opacity: 0;
  }
}

.nimbus-rain-drop {
  animation: rain-drop 1s linear infinite;
}

.nimbus-rain-drop:nth-child(2) { animation-delay: 0.2s; }
.nimbus-rain-drop:nth-child(3) { animation-delay: 0.4s; }
```

---

### Trio Celebration

When all three creatures are at 80+ score, they celebrate together.

```css
@keyframes trio-dance {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-8px);
  }
  50% {
    transform: translateY(-4px);
  }
  75% {
    transform: translateY(-10px);
  }
}

.creature-trio.celebrating .ember-creature {
  animation: trio-dance 0.5s ease-out;
  animation-delay: 0s;
}

.creature-trio.celebrating .sprout-creature {
  animation: trio-dance 0.5s ease-out;
  animation-delay: 0.1s;
}

.creature-trio.celebrating .nimbus-creature {
  animation: trio-dance 0.5s ease-out;
  animation-delay: 0.2s;
}
```

---

## Conversation Animations

Animations for the chat interface.

### Message Appear

```css
@keyframes message-slide-in-user {
  0% {
    transform: translateX(20px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes message-slide-in-ai {
  0% {
    transform: translateX(-20px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

.chat-message.user {
  animation: message-slide-in-user 200ms ease-out;
}

.chat-message.ai {
  animation: message-slide-in-ai 200ms ease-out;
}
```

### Typing Indicator

```css
@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}

.typing-dot {
  animation: typing-bounce 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.15s; }
.typing-dot:nth-child(3) { animation-delay: 0.3s; }
```

### MCQ Chip Selection

```css
@keyframes chip-select {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); background-color: var(--primary-alpha-20); }
}

.mcq-chip:active {
  animation: chip-select 200ms ease-out forwards;
}
```

### MCQ Chips Appear (Staggered)

```css
@keyframes chip-appear {
  0% {
    transform: translateY(10px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.mcq-chip {
  animation: chip-appear 200ms ease-out backwards;
}

.mcq-chip:nth-child(1) { animation-delay: 0ms; }
.mcq-chip:nth-child(2) { animation-delay: 50ms; }
.mcq-chip:nth-child(3) { animation-delay: 100ms; }
.mcq-chip:nth-child(4) { animation-delay: 150ms; }
```

### Voice Recording Pulse

```css
@keyframes recording-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

.voice-recording-indicator {
  animation: recording-pulse 1.5s ease-in-out infinite;
}

/* Red dot indicator */
@keyframes recording-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

.recording-dot {
  animation: recording-blink 1s ease-in-out infinite;
}
```

### Voice Waveform

```css
@keyframes waveform-bar {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}

.waveform-bar {
  animation: waveform-bar 0.5s ease-in-out infinite;
}

/* Stagger bars for wave effect */
.waveform-bar:nth-child(1) { animation-delay: 0ms; }
.waveform-bar:nth-child(2) { animation-delay: 50ms; }
.waveform-bar:nth-child(3) { animation-delay: 100ms; }
/* ... continue for all bars */
```

### Voice Message Playback

```css
@keyframes playback-progress {
  from { width: 0%; }
  to { width: 100%; }
}

.voice-playback-progress {
  animation: playback-progress var(--duration) linear forwards;
}
```

### AI Question Card Appear

```css
@keyframes question-card-appear {
  0% {
    transform: translateY(20px) scale(0.95);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.ai-question-card {
  animation: question-card-appear 300ms ease-out;
}
```

### Input Bar Focus

```css
@keyframes input-focus-glow {
  0% { box-shadow: 0 0 0 0 rgba(0, 188, 212, 0); }
  100% { box-shadow: 0 0 0 3px rgba(0, 188, 212, 0.2); }
}

.input-bar:focus-within {
  animation: input-focus-glow 200ms ease-out forwards;
}
```

### Scroll to Bottom Button

```css
@keyframes scroll-button-appear {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.scroll-to-bottom {
  animation: scroll-button-appear 200ms ease-out;
}
```

---

## Score Animations

### Score Count Up

```css
@keyframes score-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.score-number.updating {
  animation: score-pop 300ms ease-out;
}
```

### Score Ring Fill

```css
@keyframes ring-fill {
  from {
    stroke-dashoffset: var(--circumference);
  }
  to {
    stroke-dashoffset: var(--offset);
  }
}

.score-ring-progress {
  animation: ring-fill 1s ease-out forwards;
}
```

### Score Change Indicator

```css
@keyframes score-increase {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(-20px);
    opacity: 0;
  }
}

.score-change.increase {
  color: var(--success);
  animation: score-increase 1s ease-out forwards;
}

@keyframes score-decrease {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(20px);
    opacity: 0;
  }
}

.score-change.decrease {
  color: var(--error);
  animation: score-decrease 1s ease-out forwards;
}
```

---

## Data Transitions

### Number Counter

```tsx
// Animate number changes
const AnimatedNumber = ({ value, duration = 500 }) => {
  // Interpolate from previous to new value
  // Use requestAnimationFrame for smooth 60fps
};
```

**Behavior:**
- Count up/down smoothly
- Duration: 500ms for large changes, 200ms for small
- Easing: ease-out

### Chart Data Update

```css
.chart-bar {
  transition: height var(--duration-medium) var(--ease-out);
}

.chart-line {
  transition: d var(--duration-medium) var(--ease-out);
}

.chart-point {
  transition: transform var(--duration-normal) var(--ease-out);
}
```

**Behavior:**
- Bars grow/shrink smoothly
- Lines morph between states
- Points move with easing

---

## Gesture Animations

### Pull to Refresh

```css
.refresh-indicator {
  transition: transform var(--duration-normal) var(--ease-out);
}

.refresh-indicator.pulling {
  transform: translateY(var(--pull-distance));
}

.refresh-indicator.refreshing {
  transform: translateY(60px);
}
```

### Swipe to Dismiss

```css
.swipeable {
  transition: transform var(--duration-fast) var(--ease-out),
              opacity var(--duration-fast) var(--ease-out);
}

.swipeable.swiping {
  transition: none; /* Follow finger exactly */
}

.swipeable.dismissed {
  transform: translateX(100%);
  opacity: 0;
}
```

---

## Accessibility

### Reduced Motion

Always respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Alternative for Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Replace motion with opacity change */
  .page-enter {
    opacity: 0;
    transform: none;
  }

  .page-enter-active {
    opacity: 1;
    transition: opacity var(--duration-normal) var(--ease-out);
  }
}
```

### Motion Sensitivity Guidelines

| Animation Type | Reduced Motion Alternative |
|----------------|---------------------------|
| Slide transitions | Fade only |
| Scale animations | Opacity only |
| Parallax | Static |
| Auto-playing | Static or user-triggered |
| Looping | Single iteration |

---

## Performance Guidelines

### Hardware Acceleration

Only animate properties that are GPU-accelerated:

| ✅ Performant | ❌ Avoid |
|--------------|----------|
| `transform` | `width` |
| `opacity` | `height` |
| `filter` | `margin` |
| | `padding` |
| | `left/right/top/bottom` |

### will-change

Use sparingly for complex animations:

```css
.complex-animation {
  will-change: transform, opacity;
}

/* Remove after animation */
.complex-animation.idle {
  will-change: auto;
}
```

### Animation Batching

Group related animations to prevent layout thrashing:

```javascript
// Good: Batch reads, then writes
const height = element.offsetHeight; // Read
element.style.transform = `translateY(${height}px)`; // Write

// Bad: Interleaved reads and writes
element.style.transform = 'none'; // Write
const height = element.offsetHeight; // Read (forces layout)
element.style.transform = `translateY(${height}px)`; // Write
```

---

## Implementation Examples

### Tailwind + Framer Motion

```tsx
import { motion } from 'framer-motion';

// Button with press feedback
<motion.button
  whileTap={{ scale: 0.98 }}
  className="bg-primary-600 px-4 py-3 rounded-md"
>
  Submit
</motion.button>

// Page transition
<motion.div
  initial={{ opacity: 0, x: 100 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -30 }}
  transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
>
  <PageContent />
</motion.div>

// Achievement popup
<motion.div
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{
    type: "spring",
    stiffness: 260,
    damping: 20
  }}
>
  <Achievement />
</motion.div>
```

### CSS-Only Implementation

```css
/* Button */
.btn {
  transition: transform 150ms ease-out, background-color 150ms ease-out;
}
.btn:active {
  transform: scale(0.98);
}

/* Card */
.card {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Page transition (CSS only is limited) */
.page {
  transition: opacity 300ms ease-out;
}
```

---

## Animation Checklist

Before shipping any animation:

- [ ] Duration under 500ms (except celebrations)
- [ ] Uses GPU-accelerated properties only
- [ ] Has reduced-motion alternative
- [ ] Runs at 60fps on target devices
- [ ] Serves a clear UX purpose
- [ ] Doesn't block user interaction
- [ ] Consistent with other animations
- [ ] Tested on low-end devices

---

*yHealth Motion Design System v2.0 | Playful, expressive, character-driven*
