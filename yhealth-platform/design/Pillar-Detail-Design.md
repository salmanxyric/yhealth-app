# Pillar Detail Design

> The focused view for each health pillar — Fitness, Nutrition, and Wellbeing.

---

## Quick Reference

| Element | Specification |
|---------|---------------|
| **Entry Point** | Tap pillar creature on home screen |
| **Navigation** | Back button to home, swipe between pillars |
| **Primary Content** | Filtered conversation stream |
| **Secondary Content** | Pillar metrics summary |
| **Creature Display** | Expanded with detailed state |

---

## Design Philosophy

The Pillar Detail view provides a **focused lens** on one aspect of the user's health journey. It filters the conversation to show only relevant exchanges while displaying pillar-specific metrics and goals.

### Core Principles

1. **Filtered Focus**: Show only conversations related to this pillar
2. **Creature Prominence**: The pillar creature is featured and interactive
3. **Contextual Metrics**: Display pillar-specific data without overwhelming
4. **Seamless Return**: Easy navigation back to the unified home view
5. **Pillar Identity**: Each pillar has distinct color and personality

---

## Entry Animation

When user taps a pillar creature on the home screen:

1. **Creature Expand**: The tapped creature scales up and moves to featured position
2. **Other Creatures Fade**: The other two creatures fade out
3. **Background Shift**: Background tints toward pillar color
4. **Content Transition**: Home content fades out, pillar detail content fades in

```css
/* Transition timing */
.pillar-detail-enter {
  transition: all 300ms ease-out;
}

/* Creature featured position */
.creature-featured {
  transform: scale(1.5) translateY(-20px);
}
```

---

## Layout Structure

```
┌─────────────────────────────────────────┐
│ ← Fitness                    [Today ▼]  │  ← Header with back + date filter
├─────────────────────────────────────────┤
│                                         │
│           ┌─────────────┐               │
│           │     🔥      │               │  ← Featured Creature (large)
│           │   Steady    │               │
│           │    72       │               │
│           └─────────────┘               │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Steps   │ │ Active  │ │ Sleep   │   │  ← Metric Cards (3-4)
│  │ 8,234   │ │  45min  │ │ 7h 23m  │   │
│  └─────────┘ └─────────┘ └─────────┘   │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ 🧙‍ Sage says...                   │  │  ← AI Insight Card
│  │ Your morning workouts are 40%    │  │
│  │ more effective. Keep it up!      │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│                                         │
│  Conversation                           │  ← Section Header
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Filtered conversation stream      │  │  ← Only fitness-related messages
│  │ showing only fitness-related      │  │
│  │ messages...                       │  │
│  └───────────────────────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Ask about fitness...        🎤  ➤  │ │  ← Pillar-scoped input
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Header

### Layout

```
┌─────────────────────────────────────────┐
│  ←  Fitness                  [Today ▼]  │
└─────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Height | 56px |
| Background | `--background` with pillar tint |
| Back Button | 44px, left arrow icon |
| Title | Pillar name, 18px, font-weight 600 |
| Title Color | Pillar color |
| Date Filter | Dropdown, right-aligned |

### Date Filter Options

- Today
- This Week
- This Month
- Last 30 Days
- All Time

---

## Featured Creature Section

The pillar creature is displayed prominently with its current state and score.

### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│           ┌─────────────┐               │
│           │             │               │
│           │     🔥      │   80px creature
│           │             │               │
│           └─────────────┘               │
│              Steady                     │   ← State label
│                72                       │   ← Score number
│                                         │
│         ████████░░░░░░░░               │   ← Progress bar
│         72/100                          │
│                                         │
└─────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Creature Size | 80px |
| Animation | Active idle animation (more pronounced than home) |
| State Label | 14px, `--muted-foreground`, below creature |
| Score | 32px, font-weight 700, pillar color |
| Progress Bar | Height 8px, pillar color fill |

### Creature States Display

Each pillar creature shows its current state:

**Ember (Fitness)**
| Score | State | Label |
|-------|-------|-------|
| 80-100 | Blazing | "On Fire!" |
| 60-79 | Steady | "Steady Burn" |
| 40-59 | Dimming | "Needs Fuel" |
| 0-39 | Ember | "Just a Spark" |

**Sprout (Nutrition)**
| Score | State | Label |
|-------|-------|-------|
| 80-100 | Flourishing | "Thriving!" |
| 60-79 | Growing | "Growing Strong" |
| 40-59 | Wilting | "Needs Care" |
| 0-39 | Seedling | "Just Planted" |

**Nimbus (Wellbeing)**
| Score | State | Label |
|-------|-------|-------|
| 80-100 | Serene | "Clear Skies" |
| 60-79 | Balanced | "Partly Sunny" |
| 40-59 | Cloudy | "A Bit Foggy" |
| 0-39 | Stormy | "Storm Ahead" |

### Tap Interaction

Tapping the featured creature:
1. Creature does celebration animation
2. Tooltip appears with encouraging message
3. Optional: Link to goals/settings for this pillar

---

## Metric Cards

A horizontal scroll of key metrics for the pillar.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ 👟 Steps    │ │ ⏱ Active   │ │ 😴 Sleep    │       │
│  │             │ │             │ │             │       │
│  │   8,234     │ │   45 min    │ │   7h 23m    │       │
│  │   ↑ 12%     │ │   ↓ 5min    │ │   → same    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Card Width | 110px |
| Card Height | 80px |
| Card Gap | 12px |
| Background | `--card` |
| Border | 1px `--border` |
| Border Radius | 12px |
| Icon | 16px, pillar color |
| Label | 12px, `--muted-foreground` |
| Value | 20px, font-weight 600 |
| Change | 12px, success/error/muted color |

### Pillar-Specific Metrics

**Fitness Metrics**
- Steps (daily)
- Active Minutes
- Workouts (this week)
- Sleep Duration
- Recovery Score
- Heart Rate (resting avg)

**Nutrition Metrics**
- Meals Logged
- Hydration
- Protein (% of goal)
- Calories (if tracking)
- Meal Consistency
- Last Logged

**Wellbeing Metrics**
- Mood Average
- Journal Entries
- Stress Level
- Mindful Minutes
- Habits Completed
- Check-ins (streak)

---

## AI Insight Card

A featured insight from Sage specific to this pillar.

### Layout

```
┌─────────────────────────────────────────┐
│  ┌───┐                                  │
│  │🧙‍│  Sage's Insight                   │
│  └───┘                                  │
│                                         │
│  Your morning workouts are 40% more     │
│  effective than evening ones. Your      │
│  recovery is also faster. Keep it up!   │
│                                         │
│  ┌──────────────┐  ┌────────────────┐   │
│  │ 💬 Tell me   │  │ 📊 See data    │   │
│  │    more      │  │                │   │
│  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Background | Gradient with pillar color at 5% |
| Border | 1px pillar color at 30% |
| Border Radius | 16px |
| Padding | 16px |
| Sage Avatar | 32px |
| Header | 12px, `--muted-foreground` |
| Insight Text | 14px, `--foreground` |
| Action Buttons | Ghost buttons, pillar color |

### Insight Types

1. **Pattern Discovery**: "I noticed that..."
2. **Comparison**: "Compared to last week..."
3. **Recommendation**: "Based on your data, try..."
4. **Celebration**: "Amazing progress on..."
5. **Gentle Nudge**: "It's been a while since..."

---

## Filtered Conversation Stream

Shows only messages tagged with this pillar.

### Section Header

```
┌─────────────────────────────────────────┐
│  Conversation               [All ▼]     │
└─────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Title | "Conversation", 16px, font-weight 600 |
| Filter | Dropdown (All, Today, This Week) |

### Message Display

Same as main conversation UI but filtered:

- Only messages tagged with this pillar
- Grouped by time/session
- AI questions have pillar-specific styling

### Empty State

```
┌─────────────────────────────────────────┐
│                                         │
│           ┌─────────────┐               │
│           │     🔥      │               │
│           │  (curious)   │               │
│           └─────────────┘               │
│                                         │
│    No fitness chats yet!                │
│                                         │
│    Ask me anything about workouts,      │
│    activity, or how your body feels.    │
│                                         │
│        ┌─────────────────────┐          │
│        │ 💬 Start chatting   │          │
│        └─────────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

---

## Pillar-Scoped Input

The input bar is pre-scoped to this pillar.

### Layout

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ Ask about fitness...         🎤  ➤  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Placeholder | "Ask about [pillar]..." |
| Border Color | Pillar color at 30% |
| Focus Border | Pillar color |

### Behavior

- Messages sent are auto-tagged with current pillar
- AI responses are contextually aware of pillar focus
- User can still ask cross-pillar questions (AI will respond appropriately)

---

## Pillar-Specific Styling

Each pillar has distinct visual treatment.

### Fitness (Ember)

| Element | Value |
|---------|-------|
| Primary Color | `#FF9800` |
| Gradient | `#FF6B00` → `#FF9800` → `#FFC107` |
| Icon Theme | Energy, fire, movement |
| Background Tint | Warm orange at 3% |

### Nutrition (Sprout)

| Element | Value |
|---------|-------|
| Primary Color | `#4CAF50` |
| Gradient | `#2E7D32` → `#4CAF50` → `#81C784` |
| Icon Theme | Growth, nature, food |
| Background Tint | Fresh green at 3% |

### Wellbeing (Nimbus)

| Element | Value |
|---------|-------|
| Primary Color | `#5C9CE6` |
| Gradient | `#3D7BC9` → `#5C9CE6` → `#8AB4F8` |
| Icon Theme | Calm, clouds, mind |
| Background Tint | Soft blue at 3% |

---

## Navigation Patterns

### Back Navigation

- Back button returns to home
- Swipe right from left edge also returns
- Creature animates back to home position

### Pillar Switching

Two options for switching between pillars:

**Option A: Swipe Between Pillars**
```
┌─────────────────────────────────────────┐
│         ← Swipe left/right →            │
│                                         │
│  [Fitness] ← → [Nutrition] ← → [Wellbeing]
└─────────────────────────────────────────┘
```

**Option B: Pillar Tabs**
```
┌─────────────────────────────────────────┐
│  [🔥] [🌱] [☁️]                         │   ← Mini tabs at top
│  ────────────────                       │
└─────────────────────────────────────────┘
```

### Deep Links

Each pillar detail view has a unique route:
- `/fitness` or `/pillar/fitness`
- `/nutrition` or `/pillar/nutrition`
- `/wellbeing` or `/pillar/wellbeing`

---

## Goals Section (Optional)

If space permits, show active goals for this pillar.

### Layout

```
┌─────────────────────────────────────────┐
│  Goals                        [Edit]    │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ 🎯 10,000 steps daily               ││
│  │ ████████░░░░░░░░  8,234 / 10,000   ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ 🎯 3 workouts per week              ││
│  │ ██████░░░░░░░░░░  2 / 3            ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Goal Card Height | 60px |
| Progress Bar | 4px height |
| Goal Text | 14px |
| Progress Text | 12px, `--muted-foreground` |

---

## Responsive Behavior

### Mobile (Default)
Full-screen pillar detail as described.

### Tablet (768px+)
- Content max-width: 600px, centered
- Metric cards don't scroll, fit in row

### Desktop (1024px+)
- Pillar detail in main content area
- Home view visible in sidebar
- Can view multiple pillars simultaneously

---

## Component Summary

| Component | Purpose |
|-----------|---------|
| `PillarDetailHeader` | Back button, title, date filter |
| `FeaturedCreature` | Large creature display with score |
| `MetricCardsRow` | Horizontal scroll of key metrics |
| `AIInsightCard` | Featured Sage insight for pillar |
| `FilteredConversation` | Pillar-tagged messages only |
| `PillarScopedInput` | Input bar with pillar context |
| `PillarGoals` | Active goals for this pillar |

---

## Implementation Notes

### State Management

```tsx
interface PillarDetailState {
  activePillar: 'fitness' | 'nutrition' | 'wellbeing';
  dateFilter: 'today' | 'week' | 'month' | 'all';
  creature: {
    score: number;
    state: string;
  };
  metrics: PillarMetric[];
  insight: AIInsight | null;
  messages: Message[];
}
```

### Data Fetching

```tsx
// Fetch pillar-specific data
const { data: pillarData } = usePillarDetail(pillar, dateFilter);

// Filter messages by pillar
const filteredMessages = messages.filter(
  m => m.pillars.includes(pillar)
);
```

### Transition Animation

```tsx
// Animate creature from home position to featured
<motion.div
  layoutId={`creature-${pillar}`}
  initial={{ scale: 1 }}
  animate={{ scale: 1.5, y: -20 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  <PillarCreature pillar={pillar} />
</motion.div>
```

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Focus Management | Focus moves to header on entry |
| Screen Reader | "Fitness detail view, score 72 out of 100, Steady burn" |
| Keyboard Navigation | Tab through metrics, Enter to interact |
| Color Independence | State labels + icons, not just color |

---

*yHealth Pillar Detail Design v1.0 | Focused, Contextual, Pillar-Colored*
