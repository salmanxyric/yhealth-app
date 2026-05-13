# yHealth Home Page Design

> A conversation-first home experience featuring pillar creatures, AI questions, and a flowing chat stream.

---

## Overview

The Home Page is the heart of the yHealth experience. It combines the warmth of a personal health companion with at-a-glance wellness insights through animated pillar creatures.

### Design Goals

1. **Conversation-First**: The chat stream is the primary interface, not a feature
2. **Character-Driven**: Sage and pillar creatures create emotional connection
3. **Quick Engagement**: MCQ chips enable one-tap responses
4. **Voice-Equal**: Speaking is as natural as typing
5. **Playful & Alive**: Characters breathe, react, and celebrate

### Target User State

- **Primary**: Returning user with data (most common)
- **Secondary**: New user completing onboarding
- **Edge case**: User with partial data (some pillars empty)

---

## Page Layout

### Mobile Wireframe (375px width)

```
┌─────────────────────────────────────────┐
│  ▀▀▀▀▀▀▀▀▀ Status Bar ▀▀▀▀▀▀▀▀▀        │
├─────────────────────────────────────────┤
│                                         │
│  Hey Alex! How are you?          [👤]   │  ← Warm greeting
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   🔥        🌿        ☁️                │  ← Pillar Creatures
│   78        65        82                │     (compact row)
│  Ember    Sprout    Nimbus              │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 🤖 I noticed you slept better   │   │  ← AI Question Card
│  │    last week. What changed?     │   │
│  │                                 │   │
│  │ [🛏️ Earlier] [📵 Less screen]  │   │  ← MCQ chips
│  │ [🧘 Relaxed] [📝 Tell me...]    │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Today                                  │  ← Conversation stream
│  ─────────────────────────────────      │
│       ┌─────────────────────────┐      │
│       │ Feeling tired but went  │      │  ← User message
│       │ for a short walk anyway │      │
│       └─────────────────────────┘      │
│  ┌────────────────────────────┐        │
│  │ 🤖 That's great! Even short│        │  ← AI message
│  │ walks count. Energy now?   │        │
│  └────────────────────────────┘        │
│       ┌─────────────────────────┐      │
│       │ 🎤 Voice note (0:23)    │      │  ← Voice note
│       └─────────────────────────┘      │
│                                         │
├─────────────────────────────────────────┤
│  ┌────────────────────────────────┐    │
│  │ 💬 Type or speak...   🎤  📎  │    │  ← Input bar
│  └────────────────────────────────┘    │
├─────────────────────────────────────────┤
│                                         │
│  [🏠]    [📊]    [💬]    [⚙️]          │  ← Tab Bar
│  Home   Insights  Coach  Settings       │
│                                         │
└─────────────────────────────────────────┘
```

---

## Section Specifications

### 1. Header Section

A warm, friendly greeting that sets the conversational tone.

#### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│  Hey Alex! How are you?          [👤]   │
│                                         │
└─────────────────────────────────────────┘
```

#### Specifications

| Element | Spec | Tailwind |
|---------|------|----------|
| Container height | 64px | `h-16` |
| Horizontal padding | 16px | `px-4` |
| Top padding | 16px (after safe area) | `pt-4` |
| Greeting | 24px, Semibold | `text-2xl font-semibold` |
| Avatar | 40px circle | `h-10 w-10 rounded-full` |

#### Greeting Variations

| Time Range | Greeting |
|------------|----------|
| 5:00 - 11:59 | Good morning, Alex! |
| 12:00 - 16:59 | Hey Alex! How's your day? |
| 17:00 - 20:59 | Good evening, Alex! |
| 21:00 - 4:59 | Hey Alex, winding down? |

#### Implementation

```tsx
<header className="h-16 px-4 pt-4 flex items-center justify-between">
  <h1 className="text-2xl font-semibold text-foreground">
    Hey Alex! How are you?
  </h1>
  <button className="h-10 w-10 rounded-full bg-card overflow-hidden">
    <img src={avatarUrl} alt="Profile" />
  </button>
</header>
```

---

### 2. Pillar Creatures Section

Three animated creatures representing Fitness, Nutrition, and Wellbeing.

#### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│   🔥        🌿        ☁️                │
│   78        65        82                │
│  Ember    Sprout    Nimbus              │
│                                         │
└─────────────────────────────────────────┘
```

#### Specifications

| Element | Spec | Tailwind |
|---------|------|----------|
| Container padding | 16px horizontal, 20px vertical | `px-4 py-5` |
| Creature container | Flex with equal spacing | `flex justify-around` |
| Creature size | 64px base (scales with score) | `w-16 h-16` |
| Score text | 24px, Bold | `text-2xl font-bold` |
| Label text | 12px, Muted | `text-xs text-muted-foreground` |

#### Creature States

Each creature scales and animates based on score:

| Score Range | Scale | Glow | Animation |
|-------------|-------|------|-----------|
| 80-100 | 110% | Strong | Celebratory |
| 60-79 | 100% | Medium | Active |
| 40-59 | 80% | Subtle | Slow |
| 0-39 | 60% | Minimal | Idle |

#### Implementation

```tsx
<section className="px-4 py-5">
  <div className="flex justify-around">
    {pillars.map((pillar) => (
      <button
        key={pillar.id}
        onClick={() => navigate(`/${pillar.id}`)}
        className="flex flex-col items-center"
      >
        <PillarCreature
          pillar={pillar.id}
          score={pillar.score}
          size="md"
          showScore
        />
        <span className="text-xs text-muted-foreground mt-1">
          {pillar.name}
        </span>
      </button>
    ))}
  </div>
</section>
```

---

### 3. AI Question Card

A prominent card where Sage asks the user a question with quick-response options.

#### Layout

```
┌──────────────────────────────────────────┐
│  ┌────┐                                  │
│  │ 🤖 │  I noticed you slept better      │
│  │Sage│  last week. What changed?        │
│  └────┘                                  │
│                                          │
│  [🛏️ Earlier bedtime] [📵 Less screen]  │
│  [🧘 Relaxation]  [📝 Tell me more...]   │
└──────────────────────────────────────────┘
```

#### Specifications

| Element | Spec | Tailwind |
|---------|------|----------|
| Container margin | 16px horizontal | `mx-4` |
| Background | Elevated surface with gradient | `bg-gradient-to-br from-card to-surface-elevated-2` |
| Border | 1px primary at 20% | `border border-primary/20` |
| Border radius | 16px | `rounded-2xl` |
| Padding | 20px | `p-5` |
| Sage avatar | 48px, curious expression | `h-12 w-12` |
| Question text | 16px | `text-base` |
| MCQ chips | 40px height, pill shape | `h-10 rounded-full` |

#### MCQ Chip States

| State | Background | Border |
|-------|------------|--------|
| Default | `surface-elevated-2` | `border` |
| Hover | `surface-elevated-3` | `border-strong` |
| Selected | `primary-500` | `primary-600` |

#### Implementation

```tsx
<section className="mx-4 mt-4">
  <div className="bg-gradient-to-br from-card to-surface-elevated-2 border border-primary/20 rounded-2xl p-5">
    {/* Sage and Question */}
    <div className="flex items-start gap-3">
      <SageAvatar size="md" expression="curious" />
      <p className="text-base text-foreground flex-1">
        I noticed you slept better last week. What changed?
      </p>
    </div>

    {/* MCQ Chips */}
    <div className="flex flex-wrap gap-2 mt-4">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleSelect(option.value)}
          className="h-10 px-4 rounded-full bg-surface-elevated-2 border border-border text-sm"
        >
          {option.emoji} {option.label}
        </button>
      ))}
      <button
        onClick={handleExpand}
        className="h-10 px-4 rounded-full bg-surface-elevated-2 border border-border text-sm"
      >
        📝 Tell me more...
      </button>
    </div>
  </div>
</section>
```

---

### 4. Conversation Stream

Scrollable chat history with user and AI messages.

#### Layout

```
Today
─────────────────────────────────
      ┌─────────────────────────┐
      │ Feeling tired but went  │  ← User message
      │ for a short walk anyway │
      └─────────────────────────┘
                          12:34 PM

┌────────────────────────────┐
│ 🤖 That's great! Even short│  ← AI message
│ walks count. Energy now?   │
└────────────────────────────┘
12:35 PM

      ┌─────────────────────────┐
      │ 🎤 Voice note (0:23)    │  ← Voice note
      └─────────────────────────┘
                          12:36 PM
```

#### Specifications

| Element | Spec | Tailwind |
|---------|------|----------|
| Container | Scrollable, flex-1 | `flex-1 overflow-y-auto` |
| Padding | 16px horizontal | `px-4` |
| Day divider | 12px, muted, center | `text-xs text-muted-foreground text-center` |
| Message gap | 12px | `space-y-3` |

#### User Message Bubble

| Element | Spec | Tailwind |
|---------|------|----------|
| Alignment | Right | `ml-auto` |
| Background | `primary-600` | `bg-primary-600` |
| Max width | 80% | `max-w-[80%]` |
| Padding | 12px 16px | `px-4 py-3` |
| Border radius | 16px, 4px bottom-right | `rounded-2xl rounded-br-sm` |
| Timestamp | Below, right, muted | `text-xs text-muted-foreground` |

#### AI Message Bubble

| Element | Spec | Tailwind |
|---------|------|----------|
| Alignment | Left | `mr-auto` |
| Background | `surface-elevated-2` | `bg-surface-elevated-2` |
| Max width | 80% | `max-w-[80%]` |
| Padding | 12px 16px | `px-4 py-3` |
| Border radius | 4px top-left, 16px rest | `rounded-2xl rounded-tl-sm` |
| Avatar | 32px Sage, optional | `h-8 w-8` |

#### Implementation

```tsx
<section className="flex-1 overflow-y-auto px-4 py-4">
  {/* Day divider */}
  <div className="text-xs text-muted-foreground text-center mb-4">
    Today
  </div>

  <div className="space-y-3">
    {messages.map((msg) => (
      <div key={msg.id} className={cn(
        "max-w-[80%]",
        msg.type === 'user' ? "ml-auto" : "mr-auto"
      )}>
        <div className={cn(
          "px-4 py-3",
          msg.type === 'user'
            ? "bg-primary-600 rounded-2xl rounded-br-sm"
            : "bg-surface-elevated-2 rounded-2xl rounded-tl-sm"
        )}>
          <p className="text-sm text-foreground">{msg.content}</p>
        </div>
        <span className={cn(
          "text-xs text-muted-foreground mt-1 block",
          msg.type === 'user' ? "text-right" : "text-left"
        )}>
          {msg.timestamp}
        </span>
      </div>
    ))}
  </div>
</section>
```

---

### 5. Input Bar

Always-visible input with equal emphasis on text and voice.

#### Layout

```
┌──────────────────────────────────────────┐
│  ┌────────────────────────────────────┐  │
│  │ 💬 Type or speak...         🎤  📎│  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

#### Specifications

| Element | Spec | Tailwind |
|---------|------|----------|
| Container | Fixed above tab bar | `fixed bottom-16` |
| Padding | 16px horizontal, 8px vertical | `px-4 py-2` |
| Background | Background color | `bg-background` |
| Input height | 48px | `h-12` |
| Input background | `surface-elevated-1` | `bg-card` |
| Border radius | 24px | `rounded-3xl` |
| Voice button | 40px, teal | `h-10 w-10 bg-primary` |
| Attach button | 40px, muted | `h-10 w-10` |

#### Input States

| State | Visual |
|-------|--------|
| Idle | Placeholder visible, mic prominent |
| Typing | Text cursor, send button appears |
| Recording | Red pulse, waveform, timer |
| Expanded | Multi-line textarea visible |

#### Implementation

```tsx
<div className="fixed bottom-16 left-0 right-0 px-4 py-2 bg-background">
  <div className="flex items-center gap-2 h-12 px-4 bg-card rounded-3xl">
    {/* Input field */}
    <input
      type="text"
      placeholder="Type or speak..."
      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
      value={input}
      onChange={(e) => setInput(e.target.value)}
    />

    {/* Voice button */}
    <button
      className="h-10 w-10 rounded-full bg-primary flex items-center justify-center"
      onClick={startRecording}
    >
      <Mic className="h-5 w-5 text-primary-foreground" />
    </button>

    {/* Attach button (optional) */}
    <button className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground">
      <Paperclip className="h-5 w-5" />
    </button>
  </div>
</div>
```

---

### 6. Bottom Tab Navigation

Fixed bottom navigation bar.

#### Layout

```
┌─────────────────────────────────────────┐
│                                         │
│  [🏠]    [📊]    [💬]    [⚙️]          │
│  Home   Insights  Coach  Settings       │
│                                         │
└─────────────────────────────────────────┘
```

#### Specifications

| Element | Spec | Tailwind |
|---------|------|----------|
| Position | Fixed bottom | `fixed bottom-0 left-0 right-0` |
| Height | 64px + safe area | `h-16` |
| Background | `card` | `bg-card` |
| Border top | `border` | `border-t border-border` |
| Z-index | 50 | `z-50` |
| Active icon | `primary-500` | `text-primary` |
| Inactive icon | `muted-foreground` | `text-muted-foreground` |

---

## Animation Specifications

### Page Load Sequence

| Step | Element | Animation | Duration | Delay |
|------|---------|-----------|----------|-------|
| 1 | Header | Fade in | 200ms | 0ms |
| 2 | Creatures | Scale in + bounce | 400ms | 100ms |
| 3 | AI Question Card | Slide up + Fade | 300ms | 300ms |
| 4 | Conversation | Fade in | 200ms | 400ms |
| 5 | Input bar | Slide up | 200ms | 500ms |

### Creature Animations

| Animation | Trigger | Duration | Easing |
|-----------|---------|----------|--------|
| Idle breathing | Always | 3s loop | ease-in-out |
| Tap reaction | On tap | 300ms | spring |
| Score update | Data change | 500ms | ease-out |
| Celebration | Score 80+ | 600ms | bounce |

### Message Animations

| Animation | Trigger | Duration |
|-----------|---------|----------|
| User message | On send | 200ms slide-in from right |
| AI message | On receive | 200ms slide-in from left |
| Typing indicator | AI processing | Continuous dot bounce |

---

## States

### Loading State

```tsx
<div className="animate-pulse">
  {/* Header skeleton */}
  <div className="h-16 px-4 pt-4 flex items-center justify-between">
    <div className="h-7 w-48 bg-muted rounded" />
    <div className="h-10 w-10 bg-muted rounded-full" />
  </div>

  {/* Creatures skeleton */}
  <div className="px-4 py-5 flex justify-around">
    <div className="w-16 h-20 bg-muted rounded-xl" />
    <div className="w-16 h-20 bg-muted rounded-xl" />
    <div className="w-16 h-20 bg-muted rounded-xl" />
  </div>

  {/* AI Card skeleton */}
  <div className="mx-4 h-40 bg-muted rounded-2xl" />
</div>
```

### Empty State (New User)

Sage welcomes the user with enthusiasm.

```tsx
<section className="px-4 py-12 text-center">
  <SageAvatar size="xl" expression="happy" className="mx-auto mb-6" />
  <h2 className="text-xl font-semibold text-foreground mb-2">
    Hi there! I'm Sage 👋
  </h2>
  <p className="text-sm text-muted-foreground mb-6 max-w-[280px] mx-auto">
    I'm your health companion. Let's start by getting to know you a bit!
  </p>
  <Button variant="primary" size="lg">
    Let's Go!
  </Button>
</section>
```

### Celebration State

When user achieves a goal or all pillars are 80+.

```tsx
{trioPerfect && (
  <Confetti intensity="max" />
)}

{/* Creatures do trio celebration dance */}
<section className="px-4 py-5">
  <div className="flex justify-around">
    {pillars.map((pillar) => (
      <PillarCreature
        key={pillar.id}
        pillar={pillar.id}
        score={pillar.score}
        celebrating={trioPerfect}
      />
    ))}
  </div>
</section>
```

---

## Accessibility

### Semantic Structure

```tsx
<main role="main" aria-label="Home">
  <header aria-label="Greeting">...</header>
  <section aria-label="Health pillars" role="group">
    <button aria-label="Fitness score: 78 out of 100">...</button>
    <button aria-label="Nutrition score: 65 out of 100">...</button>
    <button aria-label="Wellbeing score: 82 out of 100">...</button>
  </section>
  <section aria-label="AI coach question">...</section>
  <section aria-label="Conversation history" role="log">...</section>
  <form aria-label="Message input">...</form>
  <nav role="navigation" aria-label="Main navigation">...</nav>
</main>
```

### Touch Targets

All interactive elements must be at least 44×44px.

### Reduced Motion

Creatures use static images instead of animations when user prefers reduced motion.

---

## Complete Page Implementation

```tsx
export default function HomePage() {
  const { user, pillars, currentQuestion, messages, isLoading } = useHomeData();
  const [input, setInput] = useState('');

  if (isLoading) return <HomePageSkeleton />;

  const trioPerfect = pillars.every(p => p.score >= 80);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {trioPerfect && <Confetti intensity="max" />}

      {/* Header */}
      <Header user={user} />

      {/* Pillar Creatures */}
      <PillarCreaturesRow pillars={pillars} celebrating={trioPerfect} />

      {/* AI Question Card */}
      {currentQuestion && (
        <AIQuestionCard question={currentQuestion} />
      )}

      {/* Conversation Stream */}
      <ConversationStream messages={messages} className="flex-1" />

      {/* Input Bar */}
      <MessageInput
        value={input}
        onChange={setInput}
        className="fixed bottom-16 left-0 right-0"
      />

      {/* Tab Bar */}
      <BottomTabBar activeTab="home" />
    </div>
  );
}
```

---

## Document Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-12-20 | Conversation-first redesign with creatures |
| 1.0 | 2025-12-07 | Initial dashboard-centric design |

---

*yHealth Home Page Design v2.0 | Conversation-First with Pillar Creatures*
