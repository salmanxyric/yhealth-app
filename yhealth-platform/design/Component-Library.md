# yHealth Component Library

> Specification for UI components aligned with shadcn/ui and Tailwind CSS, featuring conversation-first patterns and character components.

---

## Component Philosophy

### Design Principles

1. **Conversation-First**: Chat and input components are primary, not secondary.
2. **Character-Driven**: Sage and pillar creatures are reusable components with states.
3. **Playful Interactions**: Components celebrate, react, and feel alive.
4. **shadcn/ui Foundation**: Build on top of shadcn/ui primitives.
5. **Accessibility First**: WCAG 2.1 AA compliance built-in.
6. **Dark Mode Primary**: All components designed for dark mode first.

---

## Button Components

### Button Variants

| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| `primary` | `primary-600` | `foreground` | none | Main CTAs |
| `secondary` | `transparent` | `primary-500` | `primary-500` | Secondary actions |
| `ghost` | `transparent` | `muted-foreground` | none | Tertiary actions |
| `outline` | `transparent` | `foreground` | `border` | Alternative secondary |
| `destructive` | `destructive` | `foreground` | none | Delete, cancel |
| `fitness` | `fitness-500` | `foreground` | none | Fitness actions |
| `nutrition` | `nutrition-500` | `foreground` | none | Nutrition actions |
| `wellbeing` | `wellbeing-500` | `foreground` | none | Wellbeing actions |

### Button Sizes

| Size | Height | Padding | Font Size | Icon Size |
|------|--------|---------|-----------|-----------|
| `sm` | 32px | 8px 12px | 14px | 16px |
| `md` | 40px | 12px 16px | 16px | 20px |
| `lg` | 48px | 16px 24px | 18px | 24px |
| `icon` | 44px | 0 | - | 20px |

### Button States

```css
/* Primary button states */
.btn-primary {
  /* Default */
  background: var(--primary-600);

  /* Hover */
  &:hover { background: var(--primary-500); }

  /* Active/Pressed */
  &:active { background: var(--primary-700); }

  /* Disabled */
  &:disabled {
    background: var(--muted);
    color: var(--muted-foreground);
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Focus */
  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
}
```

### Button Component Spec

```tsx
// Button props
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' |
           'fitness' | 'nutrition' | 'wellbeing';
  size: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}
```

---

## Card Components

### Card Types

#### Metric Card
Displays a single health metric with pillar color coding.

```
┌─────────────────────────────┐
│  PILLAR LABEL (overline)    │
│                             │
│  85                         │  ← Large metric number
│  Recovery Score             │  ← Metric name
│                             │
│  ▲ 12% from yesterday       │  ← Trend indicator
└─────────────────────────────┘
```

**Spec:**
- Padding: 20px (`p-5`)
- Border radius: 12px (`rounded-lg`)
- Background: `card` (#1E1E1E)
- Min height: 120px
- Pillar indicator: 2px top border or overline text color

#### Insight Card
Displays an AI-generated insight with action.

```
┌─────────────────────────────┐
│  💡 Coach Insight           │
│                             │
│  Your workouts are 40%      │
│  better after 7+ hours      │
│  of sleep.                  │
│                             │
│  [Learn More]               │
└─────────────────────────────┘
```

**Spec:**
- Padding: 20px (`p-5`)
- Border radius: 12px (`rounded-lg`)
- Background: `card` (#1E1E1E)
- Icon: `primary-500` teal
- CTA: Ghost button or link

#### Action Card
Prompts user to take an action.

```
┌─────────────────────────────┐
│  📝 Daily Check-in          │
│                             │
│  How are you feeling        │
│  today?                     │
│                             │
│  [Start Check-in ▶]         │
└─────────────────────────────┘
```

**Spec:**
- Padding: 20px (`p-5`)
- Border radius: 12px (`rounded-lg`)
- Background: Gradient or elevated surface
- CTA: Primary button

### Card Grid Layout

```html
<div class="grid grid-cols-2 gap-4">
  <MetricCard pillar="fitness" value={85} label="Recovery" />
  <MetricCard pillar="nutrition" value={72} label="Nutrition" />
  <InsightCard class="col-span-2">
    <!-- Full width insight -->
  </InsightCard>
</div>
```

---

## Input Components

### Text Input

```
┌─────────────────────────────┐
│  Label                      │
│  ┌───────────────────────┐  │
│  │ Placeholder text      │  │
│  └───────────────────────┘  │
│  Helper text                │
└─────────────────────────────┘
```

**Spec:**
- Height: 44px (`h-11`)
- Padding: 12px 16px (`px-4 py-3`)
- Border radius: 8px (`rounded-md`)
- Background: `surface-elevated-1`
- Border: `border` (#404040)
- Focus border: `primary-500`

**States:**
| State | Border | Background |
|-------|--------|------------|
| Default | `border` | `surface-elevated-1` |
| Hover | `border-strong` | `surface-elevated-2` |
| Focus | `primary-500` | `surface-elevated-1` |
| Error | `destructive` | `destructive/10` |
| Disabled | `border-subtle` | `muted` |

### Select/Dropdown

```tsx
interface SelectProps {
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}
```

**Spec:**
- Same dimensions as text input
- Chevron icon on right (20px)
- Dropdown: `surface-elevated-2`, `rounded-lg`, shadow

### Toggle/Switch

```
OFF: [○        ]
ON:  [        ●]
```

**Spec:**
- Track: 48×24px
- Thumb: 20×20px
- Track off: `muted`
- Track on: `primary-500`
- Thumb: `foreground`

### Slider

Used for mood ratings, energy levels.

**Spec:**
- Track height: 4px
- Thumb: 24×24px, `primary-500`
- Active track: `primary-500`
- Inactive track: `muted`

### Checkbox

**Spec:**
- Size: 24×24px
- Border radius: 4px
- Unchecked: `border`, transparent background
- Checked: `primary-500` background, white checkmark

---

## Navigation Components

### Bottom Tab Bar

```
┌─────────────────────────────────────────┐
│  [🏠]     [📊]     [💬]     [⚙️]       │
│  Home    Insights  Coach   Settings     │
└─────────────────────────────────────────┘
```

**Spec:**
- Height: 64px + safe area
- Background: `card`
- Border top: `border`
- Active icon: `primary-500`
- Inactive icon: `muted-foreground`
- Touch target: 44×44px per item

### Header/App Bar

```
┌─────────────────────────────────────────┐
│  [←]  Page Title                   [⋮]  │
└─────────────────────────────────────────┘
```

**Spec:**
- Height: 56px (`h-14`)
- Background: `background`
- Border bottom: `border`
- Title: `text-lg font-semibold`
- Back button: 44×44px touch target

### Segmented Control

```
┌─────────────────────────────────────────┐
│  [Day]  [Week]  [Month]  [Year]         │
└─────────────────────────────────────────┘
```

**Spec:**
- Background: `muted`
- Active segment: `card`
- Border radius: 8px (container), 6px (segments)
- Height: 36px
- Padding: 4px (container)

---

## Feedback Components

### Toast Notifications

```
┌─────────────────────────────────────────┐
│  ✓  Meal logged successfully            │
└─────────────────────────────────────────┘
```

**Spec:**
- Position: Bottom, 16px from edges
- Background: `card`
- Border radius: 12px
- Padding: 16px
- Duration: 3-5 seconds
- Variants: success, error, warning, info

**Colors:**
| Variant | Icon Color | Background |
|---------|------------|------------|
| Success | `success` | `card` |
| Error | `destructive` | `card` |
| Warning | `warning` | `card` |
| Info | `info` | `card` |

### Loading States

#### Spinner
- Size: 20px (default), 16px (small), 32px (large)
- Color: `primary-500` or current text color
- Animation: 1s linear infinite rotation

#### Skeleton
- Background: Linear gradient animation
- Colors: `muted` to `surface-elevated-2`
- Border radius: Match component shape

#### Progress Ring
- Size: Varies (64px for dashboard, 40px for compact)
- Track: `muted` 4px stroke
- Progress: Pillar color, animated fill

### Empty States

```
┌─────────────────────────────────────────┐
│                                         │
│            [Illustration]               │
│                                         │
│        No meals logged today            │
│                                         │
│        [Log Your First Meal]            │
│                                         │
└─────────────────────────────────────────┘
```

**Spec:**
- Centered layout
- Illustration: 120×120px max
- Title: `text-lg font-semibold`
- Description: `text-muted-foreground`
- CTA: Primary button

---

## Modal Components

### Bottom Sheet

```
┌─────────────────────────────────────────┐
│               ─────                     │  ← Handle
│                                         │
│  Sheet Title                            │
│                                         │
│  Content goes here                      │
│                                         │
│                                         │
│  [Primary Action]                       │
│                                         │
└─────────────────────────────────────────┘
```

**Spec:**
- Border radius: 16px top
- Handle: 32×4px, `muted-foreground`, centered
- Background: `card`
- Backdrop: Black 50% opacity
- Animation: Slide up 300ms ease-out
- Swipe to dismiss: Yes

### Dialog/Alert

```
┌─────────────────────────────────────────┐
│                                         │
│  Dialog Title                           │
│                                         │
│  Are you sure you want to delete        │
│  this entry?                            │
│                                         │
│  [Cancel]           [Delete]            │
│                                         │
└─────────────────────────────────────────┘
```

**Spec:**
- Max width: 320px (mobile), 400px (tablet+)
- Padding: 24px
- Border radius: 16px
- Background: `card`
- Backdrop: Black 50% opacity
- Actions: Right-aligned or stacked on mobile

---

## Data Visualization Components

### Progress Ring

```
     ╭──────╮
    │   85  │
    │Recovery│
     ╰──────╯
```

**Spec:**
- Default size: 120×120px
- Stroke width: 8px
- Track: `muted`
- Progress: Pillar color
- Text: Centered, metric + label
- Animation: Smooth fill on load

### Bar Chart

**Spec:**
- Bar width: 24px (mobile), 32px (desktop)
- Gap: 8px
- Colors: Pillar-specific
- Axis labels: `caption` size
- Grid lines: `border-subtle`

### Line Chart

**Spec:**
- Line: 2px stroke
- Colors: `primary-500` or pillar colors
- Points: 6px circles on data points
- Grid: `border-subtle`
- Axis: `muted-foreground` text

### Score Gauge

```
     ◠◡◠◡◠
       72
      Good
```

**Spec:**
- Arc: 180° or 270°
- Segments: Color-coded (red→yellow→green)
- Score: Large centered number
- Label: Below score

---

## Pillar-Specific Components

### Fitness Components

#### Strain Gauge
- Arc visualization
- 0-21 scale display
- Orange gradient

#### Activity Ring
- Three concentric rings (Move, Exercise, Stand pattern)
- Orange primary color

### Nutrition Components

#### Macro Bar
```
Carbs  ████████░░░░░  156g / 200g
```
- Horizontal progress bars
- Green color scheme
- Labels: Macro name, current/goal

#### Meal Card
- Food photo thumbnail
- Meal name, time
- Calorie/macro summary
- Green accent

### Wellbeing Components

#### Mood Slider
```
😢  ●─────────────●  😊
     1  2  3  4  5
```
- Emoji anchors
- Soft blue accent
- Morphing animation on selection

#### Journal Entry Card
- Text preview
- Timestamp
- Mood indicator
- Soft blue accent

---

## Conversation UI Components

### Chat Bubble

The primary unit of conversation. User messages and AI messages have distinct styles.

#### User Message Bubble

```
                    ┌─────────────────────┐
                    │ I'm feeling tired   │
                    │ today but still     │
                    │ managed a 20min     │
                    │ walk                │
                    └─────────────────────┘
                                    12:34 PM
```

**Spec:**
- Alignment: Right
- Background: `primary-600`
- Text: `foreground`
- Border radius: 16px (top-left, top-right, bottom-left), 4px (bottom-right)
- Padding: 12px 16px
- Max width: 80%
- Timestamp: Below, right-aligned, `text-tertiary`

#### AI Message Bubble

```
    ┌──────────────────────────────────┐
    │ That's great! Even a short walk  │
    │ counts. How's your energy now?   │
    └──────────────────────────────────┘
    12:35 PM
```

**Spec:**
- Alignment: Left
- Background: `surface-elevated-2`
- Text: `foreground`
- Border radius: 4px (top-left), 16px (top-right, bottom-left, bottom-right)
- Padding: 12px 16px
- Max width: 80%
- Optional: Sage avatar (32px) to the left

```tsx
interface ChatBubbleProps {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  showAvatar?: boolean; // for AI messages
  avatarExpression?: 'happy' | 'curious' | 'supportive' | 'celebratory';
}
```

---

### MCQ Chips

Quick-response options presented as tappable chips.

```
┌──────────────────────────────────────────┐
│ How's your energy right now?             │
│                                          │
│ [🔥 Great]  [😐 Okay]  [😩 Low]  [📝]   │
└──────────────────────────────────────────┘
```

**Spec:**
- Container: Horizontal scroll or wrap
- Chip height: 40px
- Chip padding: 10px 16px
- Chip background: `surface-elevated-2`
- Chip border: 1px `border`
- Border radius: 20px (pill shape)
- Active/selected: `primary-500` background
- Expand icon: `📝` or `+` to open text input

**States:**
| State | Background | Border |
|-------|------------|--------|
| Default | `surface-elevated-2` | `border` |
| Hover | `surface-elevated-3` | `border-strong` |
| Selected | `primary-500` | `primary-600` |
| Disabled | `muted` | `border-subtle` |

```tsx
interface MCQChipsProps {
  options: { label: string; emoji?: string; value: string }[];
  onSelect: (value: string) => void;
  selectedValue?: string;
  allowExpand?: boolean; // shows expand icon for free text
  onExpand?: () => void;
}
```

---

### Expandable Input

Combined input that shows MCQ chips by default, expands to full input on tap.

#### Collapsed State

```
┌──────────────────────────────────────────┐
│ [Option 1]  [Option 2]  [Option 3]  [+]  │
└──────────────────────────────────────────┘
```

#### Expanded State

```
┌──────────────────────────────────────────┐
│ ┌────────────────────────────────────┐   │
│ │ Type your thoughts...              │   │
│ │                                    │   │
│ │                                    │   │
│ └────────────────────────────────────┘   │
│                                          │
│ [🎤 Voice]               [Send ▶]       │
└──────────────────────────────────────────┘
```

**Spec:**
- Transition: Smooth expansion (300ms ease-out)
- Text area: Multi-line, auto-grow
- Min height expanded: 120px
- Voice button: 44×44px, `primary-500`
- Send button: 44×44px, `primary-600`

---

### Voice Input Component

For recording voice notes.

#### Idle State

```
┌──────────────────────────────────────────┐
│ 💬 Type or speak...              [🎤]   │
└──────────────────────────────────────────┘
```

#### Recording State

```
┌──────────────────────────────────────────┐
│                                          │
│         🎤 Recording... 0:12             │
│         ◉◉◉◉◉◉◉◉◉◉◉◉                     │
│                                          │
│ [Cancel]                      [Done ✓]   │
└──────────────────────────────────────────┘
```

**Spec:**
- Recording indicator: Pulsing red dot
- Waveform: Real-time audio visualization
- Timer: MM:SS format
- Cancel: Ghost button
- Done: Primary button

#### Playback State (after recording)

```
┌──────────────────────────────────────────┐
│ [▶️] ═══════●═══════════ 0:12 / 0:23     │
│                                [✕] [✓]   │
└──────────────────────────────────────────┘
```

---

### Typing Indicator

Shows when AI is generating a response.

```
    ┌─────────────────────┐
    │  ●  ●  ●            │
    └─────────────────────┘
```

**Spec:**
- Three dots, staggered bounce animation
- Dot size: 8px
- Dot color: `muted-foreground`
- Animation: 1.4s infinite ease-in-out, 0.2s delay between dots
- Shows Sage avatar (32px, thinking expression) to the left

---

### AI Question Card

Prominent card for AI-initiated questions.

```
┌──────────────────────────────────────────┐
│ ┌────┐                                   │
│ │ 🤖 │  I noticed you slept better       │
│ └────┘  last week. What was different?   │
│                                          │
│ [🛏️ Earlier bedtime]  [📵 Less screen]  │
│ [🧘 Relaxation]  [📝 Tell me more]       │
└──────────────────────────────────────────┘
```

**Spec:**
- Background: `surface-elevated-1` with subtle gradient
- Border: 1px `primary-500/30`
- Border radius: 16px
- Padding: 20px
- Sage avatar: 48px, curious expression
- MCQ chips below text

---

## Character Components

### Sage (AI Coach Avatar)

The illustrated coach character with multiple expression states.

#### Avatar Sizes

| Context | Size | Usage |
|---------|------|-------|
| `xs` | 24px | Inline mentions |
| `sm` | 32px | Chat bubbles |
| `md` | 48px | AI question cards |
| `lg` | 64px | Empty states |
| `xl` | 120px | Achievements, celebrations |

#### Expression States

| Expression | When Used | Animation |
|------------|-----------|-----------|
| `happy` | Positive messages, greetings | Subtle bounce |
| `curious` | Questions, prompts | Head tilt, blink |
| `supportive` | Struggles, empathy | Soft glow |
| `celebratory` | Achievements, wins | Jump, confetti |
| `thinking` | Processing, loading | Look up, dots |
| `listening` | Voice input active | Sound waves |
| `concerned` | Health alerts | Gentle pulse |

```tsx
interface SageAvatarProps {
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  expression: 'happy' | 'curious' | 'supportive' | 'celebratory' | 'thinking' | 'listening' | 'concerned';
  animate?: boolean;
}
```

---

### Pillar Creatures

Animated creatures representing each health pillar.

#### Ember (Fitness)

```
     ╱ ╲
    ╱ 🔥 ╲
   ╱  78  ╲
    Fitness
```

**States by Score:**
| Score | Visual State | Size | Glow |
|-------|--------------|------|------|
| 80-100 | Blazing | 110% | Strong |
| 60-79 | Steady | 100% | Medium |
| 40-59 | Dimming | 80% | Subtle |
| 0-39 | Ember | 60% | Minimal |

**Animations:**
- Idle: Gentle flicker
- Tap: Burst + size pulse
- Score increase: Dance with sparks
- Score decrease: Sad flicker

#### Sprout (Nutrition)

```
     🌿
    ╱ ╲
   ╱ 65 ╲
  Nutrition
```

**States by Score:**
| Score | Visual State | Size | Leaves |
|-------|--------------|------|--------|
| 80-100 | Flourishing | 110% | Full bloom |
| 60-79 | Growing | 100% | Multiple |
| 40-59 | Wilting | 80% | Droopy |
| 0-39 | Seedling | 60% | Sprout |

**Animations:**
- Idle: Gentle sway
- Tap: Perk up + rustle
- Score increase: Bloom + sparkles
- Score decrease: Slight droop

#### Nimbus (Wellbeing)

```
    ☁️
   ╱   ╲
  ╱ 82  ╲
 Wellbeing
```

**States by Score:**
| Score | Visual State | Size | Effect |
|-------|--------------|------|--------|
| 80-100 | Serene | 110% | Rainbow hint |
| 60-79 | Balanced | 100% | Calm |
| 40-59 | Cloudy | 80% | Gray edges |
| 0-39 | Stormy | 60% | Light rain |

**Animations:**
- Idle: Float/bob
- Tap: Soft pulse + sparkle rain
- Score increase: Rainbow flash
- Score decrease: Light rain

```tsx
interface PillarCreatureProps {
  pillar: 'fitness' | 'nutrition' | 'wellbeing';
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showScore?: boolean;
  onTap?: () => void;
}
```

---

## Celebration Components

### Confetti Burst

Triggered on achievements and milestones.

**Spec:**
- Particle count: 50-100
- Colors: `confetti-gold`, `confetti-coral`, `confetti-teal`, `confetti-purple`, `confetti-pink`
- Duration: 2-3 seconds
- Shape: Mix of rectangles and circles
- Physics: Gravity + slight rotation

```tsx
interface ConfettiProps {
  trigger: boolean;
  intensity?: 'subtle' | 'medium' | 'max';
  colors?: string[];
  duration?: number;
}
```

### Achievement Badge

Unlocked achievements and milestones.

```
    ╭──────────────────────╮
    │      🏆             │
    │   7-Day Streak!      │
    │                      │
    │ You've logged meals  │
    │ for a whole week     │
    │                      │
    │   [Share] [Close]    │
    ╰──────────────────────╯
```

**Spec:**
- Background: `card` with celebration glow
- Border: Gold gradient for special achievements
- Animation: Scale in + confetti
- Sage expression: `celebratory`

### Streak Counter

Displays current streaks with animation.

```
🔥 14 day streak!
```

**Spec:**
- Icon: Flame with subtle animation
- Number: Bold, large
- Animation: Pulse on increment
- Background glow: Subtle streak color

---

## Component States Summary

### Interactive States

| State | Visual Change |
|-------|---------------|
| Default | Base styling |
| Hover | Lighter background, cursor pointer |
| Focus | Ring outline (2px `primary-500`) |
| Active | Darker background |
| Disabled | 50% opacity, no cursor |
| Loading | Spinner overlay or skeleton |
| Error | Red border, error message |

### Focus Visible

All interactive components must show visible focus for keyboard navigation:

```css
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

---

## Component Tokens Summary

### shadcn/ui Theme Variables

```css
:root {
  /* Backgrounds */
  --background: 0 0% 7%;
  --foreground: 0 0% 98%;
  --card: 0 0% 12%;
  --card-foreground: 0 0% 98%;
  --popover: 0 0% 15%;
  --popover-foreground: 0 0% 98%;

  /* Primary */
  --primary: 187 100% 42%;
  --primary-foreground: 0 0% 98%;

  /* Secondary */
  --secondary: 0 0% 17%;
  --secondary-foreground: 0 0% 98%;

  /* Muted */
  --muted: 0 0% 17%;
  --muted-foreground: 0 0% 70%;

  /* Accent */
  --accent: 0 0% 17%;
  --accent-foreground: 0 0% 98%;

  /* Destructive */
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;

  /* Border & Input */
  --border: 0 0% 25%;
  --input: 0 0% 25%;
  --ring: 187 100% 42%;

  /* Radius */
  --radius: 0.5rem;
}
```

---

*yHealth Component Library v2.0 | Conversation-First with Character Components*
