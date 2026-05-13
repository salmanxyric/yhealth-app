---
type: story
id: S07.1.1
title: Mood Check-in Logging
epic: E07
epic_name: Wellbeing Pillar
feature: F7.1
feature_name: Mood Check-ins
product: yhealth-platform
priority: P0
status: Complete
story_points: 0
created: 2025-12-24
---

# S07.1.1: Mood Check-in Logging


### User Story
**As a** Holistic Health Seeker (P1),
**I want to** quickly log my mood multiple times per day through emoji or detailed ratings,
**So that** I can discover patterns between my emotional state and my physical health without mood tracking feeling like a chore.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Mood check-ins are designed to be the lowest-friction wellbeing input. Users can log their mood via a single emoji tap (Light mode) or multi-dimensional ratings (Deep mode). Check-ins are available across all channels: mobile app widget, WhatsApp quick reply, and voice coaching conversations.

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Single emoji tap: 😊 Great, 😐 Okay, 😟 Low, 😡 Angry, 😰 Anxious, 😴 Tired. Optional one-word descriptor. 5-second interaction. |
| **Deep** | Multi-dimensional rating scales: Happiness (1-10), Energy (1-10), Stress (1-10), Anxiety (1-10). Emotion tags selection. Optional context note. 30-60 second interaction. |

**Emoji Selection (Light Mode):**
| Emoji | Mood Label | Description |
|-------|------------|-------------|
| 😊 | Great | Feeling positive, energized, happy |
| 😐 | Okay | Neutral, neither good nor bad |
| 😟 | Low | Feeling down, sad, or unmotivated |
| 😡 | Angry | Frustrated, irritated, upset |
| 😰 | Anxious | Worried, stressed, nervous |
| 😴 | Tired | Exhausted, fatigued, low energy |

**Emotion Tags (Deep Mode):**
Grateful, Frustrated, Excited, Anxious, Content, Overwhelmed, Peaceful, Irritated, Hopeful, Lonely, Confident, Sad, Energized, Calm (15+ tags available)

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Emoji | Enum | From 6 options | User-only |
| Happiness Rating | Integer 1-10 | Deep mode only | User-only |
| Energy Rating | Integer 1-10 | Deep mode only | User-only |
| Stress Rating | Integer 1-10 | Deep mode only | User-only |
| Anxiety Rating | Integer 1-10 | Deep mode only | User-only |
| Emotion Tags | Array<string> | From tag library | User-only |
| Context Note | String | Max 500 chars | User-only |
| Mode | Enum | light/deep | System |
| Channel | Enum | app/whatsapp/voice | System |
| Timestamp | ISO 8601 | Required | System |

**Behaviors:**
- Light mode accessible via home screen widget (1 tap to open, 1 tap to log)
- Deep mode accessible by expanding from Light mode or via wellbeing tab
- Check-ins not forced - user can dismiss prompts without negative feedback
- Non-judgmental: No mood is labeled "good" or "bad"
- Multiple check-ins per day accepted (morning, afternoon, evening encouraged)
- Mood data immediately available for Mental Recovery Score calculation

**Multi-Channel Support:**
- **Mobile App:** Emoji widget, tap to expand to Deep mode
- **WhatsApp:** "How's your mood?" message with emoji quick replies
- **Voice Coaching:** "How are you feeling today?" with spoken mood capture

### Acceptance Criteria

**AC1: Light Mode Emoji Selection**
Given the user opens the mood check-in in Light mode,
When they tap an emoji (😊 😐 😟 😡 😰 😴),
Then the mood is logged immediately with timestamp and channel.

**AC2: Deep Mode Multi-Dimensional Rating**
Given the user switches to Deep mode,
When they adjust Happiness, Energy, Stress, Anxiety sliders (1-10),
Then all four dimensions are captured with the check-in.

**AC3: Emotion Tag Selection**
Given the user is in Deep mode,
When they tap emotion tags (e.g., "Grateful", "Anxious"),
Then selected tags are attached to the mood record (multi-select allowed).

**AC4: Context Note Entry**
Given the user is in Deep mode,
When they enter text in "What's affecting your mood?" field,
Then the note (max 500 chars) is saved with the check-in.

**AC5: WhatsApp Mood Logging**
Given the user receives "How's your mood?" prompt on WhatsApp,
When they reply with an emoji (😊, 😐, etc.),
Then the mood is logged from WhatsApp channel.

**AC6: Voice Mood Logging**
Given the user is in a voice coaching session,
When they respond to "How are you feeling?" with "I'm feeling anxious",
Then the AI captures mood (anxious) from voice input.

**AC7: Check-in Frequency**
Given a user has logged mood earlier today,
When they open mood check-in again,
Then a new check-in is created (multiple per day allowed).

**AC8: Non-Judgmental Prompts**
Given the user logs any mood (including low/angry/anxious),
When the check-in saves,
Then no negative language is used - all moods are validated.

### Success Metrics
- Daily mood logging rate: 80% of active users log mood ≥1x/day
- Multi-check-in adoption: 50% of users log mood ≥2x/day
- Light mode usage: 70% of check-ins use Light mode (validates low friction)
- Deep mode engagement: 30% use Deep mode ≥1x/week (validates depth option)
- Average check-in time: <5 seconds for Light mode, <60 seconds for Deep mode

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Check-in save <1s | Auth required | Mood data user-only | Min 44x44pt touch targets | iOS 14+, Android 10+ |
| Widget load <500ms | Encrypted at rest | No mood sharing without consent | Color-blind safe emojis | WhatsApp, Voice channels |

### Dependencies
- **Prerequisite Stories:** None (foundation story)
- **Related Stories:** S07.1.2, S07.4.1, S07.5.1
- **External Dependencies:** E4 (Mobile App widget), E3 (WhatsApp integration), E2 (Voice coaching)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Missed morning check-in | Gentle reminder at 11am: "Haven't heard from you today. Quick mood check?" |
| Multiple contradictory moods (😊 then 😟 within 1 hour) | Accept both; flag mood volatility for pattern detection (silent) |
| Context note contains crisis keywords | Trigger escalation protocol per PRD Section 14 (resources shown) |
| No mood logging for 3+ days | Re-engagement: "Missed you! Everything okay? Even 'I'm busy' helps me understand." |
| Offline check-in | Queue locally; sync when reconnected (confirmation shown) |
| WhatsApp reply with non-emoji text | Parse sentiment: "I'm feeling good" → 😊; if unclear, ask follow-up |

### Open Questions
- Should we show mood check-in streak counts (gamification)?
- What's the optimal prompt timing for morning/evening check-ins?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Light mode emoji check-in functional across app/WhatsApp/voice
- [ ] Deep mode multi-dimensional rating working
- [ ] Emotion tags selectable (15+ tags)
- [ ] Context note field functional
- [ ] Mood data feeds Mental Recovery Score (S05.3.1)
- [ ] Performance requirements verified (<1s save, <500ms widget load)
- [ ] Accessibility requirements verified (touch targets, color contrast)

---