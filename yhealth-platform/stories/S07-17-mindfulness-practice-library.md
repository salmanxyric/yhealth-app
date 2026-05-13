---
type: story
id: S07.7.1
title: Mindfulness Practice Library
epic: E07
epic_name: Wellbeing Pillar
feature: F7.7
feature_name: Mindfulness Recommendations
product: yhealth-platform
priority: P0
status: Complete
story_points: 0
created: 2025-12-24
---

# S07.7.1: Mindfulness Practice Library


### User Story
**As a** Holistic Health Seeker (P1),
**I want to** access a library of mindfulness practices with text-based instructions,
**So that** I can practice breathing exercises, meditation, and body scans without needing a separate meditation app.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
The mindfulness practice library provides 15+ practices with clear text-based instructions. yHealth acts as a coach who recommends and explains practices, NOT as a meditation app with guided audio. Users can browse, learn, and practice mindfulness techniques for stress reduction, mood improvement, and better sleep.

**Important Design Principle:**
yHealth provides TEXT-BASED INSTRUCTIONS ONLY. No guided audio recordings. This positions yHealth as a coach/recommender, not a Headspace/Calm competitor.

**Practice Categories:**

| Category | Practices Included |
|----------|-------------------|
| **Breathing Exercises** | Box breathing, 4-7-8 breathing, Diaphragmatic breathing |
| **Meditation** | Body scan, Loving-kindness, Mindfulness meditation, Gratitude meditation |
| **Movement** | Mindful walking, Gentle stretching, Progressive muscle relaxation |
| **Quick Resets** | 1-minute breathing, 2-minute body awareness, 3-minute gratitude |
| **Evening Practices** | Sleep meditation prep, Evening reflection, Body scan for sleep |

**Practice Details (15+ Practices):**

**Box Breathing (3 min):**
- *When to use:* High stress, anxiety, need to calm down quickly
- *Why it helps:* Activates parasympathetic nervous system, reduces stress hormones
- *Instructions:* Inhale 4s → Hold 4s → Exhale 4s → Hold 4s → Repeat

**4-7-8 Breathing (3 min):**
- *When to use:* Before sleep, acute anxiety
- *Why it helps:* Naturally tranquilizing for the nervous system
- *Instructions:* Inhale 4s → Hold 7s → Exhale 8s → Repeat 4 times

**Body Scan Meditation (10 min):**
- *When to use:* Bedtime, after stressful day, muscle tension
- *Why it helps:* Releases physical tension, grounds in present moment
- *Instructions:* Progressive attention from toes to head, noticing sensations

**Loving-Kindness Meditation (5 min):**
- *When to use:* Low mood, feeling disconnected, need emotional warmth
- *Why it helps:* Activates compassion, reduces self-criticism
- *Instructions:* Self-directed well-wishes, then to loved ones, then all beings

**Mindful Walking (10 min):**
- *When to use:* Need movement, stuck indoors, low energy
- *Why it helps:* Combines mindfulness with movement, grounds in body
- *Instructions:* Slow, deliberate walking with attention to sensations

**Duration Options:**
Each practice available in multiple durations:
- 1-3 minutes (Quick Reset)
- 5 minutes (Short Practice)
- 10 minutes (Standard Practice)
- 20 minutes (Extended Practice)

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Practice ID | UUID | Required | System |
| Practice Name | String | From library | System |
| Practice Category | Enum | breathing/meditation/movement/quick/evening | System |
| Duration Options | Array<Integer> | Minutes | System |
| Instructions | String | Text-based | System |
| Benefits | String | Why it helps | System |
| Best Context | String | When to use | System |

**Behaviors:**
- Practices browsable by category
- Each practice has "Why it helps" explanation
- Duration selection before starting practice
- Timer available during practice (optional)
- Practice completion can be logged

### Acceptance Criteria

**AC1: Practice Library Access**
Given the user opens mindfulness section,
When library loads,
Then all 15+ practices are browsable by category.

**AC2: Practice Detail View**
Given the user selects a practice (e.g., Box Breathing),
When detail view opens,
Then: name, duration options, "why it helps," "when to use," and instructions are shown.

**AC3: Duration Selection**
Given the user wants to do Body Scan,
When they select duration,
Then options appear: 5 min, 10 min, 20 min.

**AC4: Text-Based Instructions**
Given the user starts a practice,
When instructions display,
Then they are text-based (NO audio recordings).

**AC5: Category Browsing**
Given the user wants breathing exercises specifically,
When they filter by "Breathing",
Then only breathing practices appear.

**AC6: Practice Timer (Optional)**
Given the user starts a 5-minute practice,
When they want timing assistance,
Then optional timer counts down.

**AC7: Practice Completion Logging**
Given the user finishes a practice,
When they complete it,
Then practice is logged to history with timestamp and duration.

**AC8: No Audio Content**
Given any practice in the library,
When viewing its content,
Then NO audio files or guided recordings are present.

### Success Metrics
- Library exploration: 60% of users browse practice library
- Practice completion: 50% complete at least one practice from library
- Category engagement: All 5 categories have >20% usage
- Repeat practice: 40% return to same practice within 7 days

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Library load <2s | Auth required | Practice history user-only | Screen reader support | iOS 14+, Android 10+ |
| Practice load <500ms | N/A | No tracking of instruction views | Min 4.5:1 contrast | All channels |

### Dependencies
- **Prerequisite Stories:** None (foundation for mindfulness)
- **Related Stories:** S07.7.2
- **External Dependencies:** E4 (Mobile App UI)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User expects audio guidance | Clear message: "yHealth provides instructions, not guided audio. Use your preferred meditation app for audio." |
| Practice timer interrupted | Timer pauses; can resume or cancel |
| User has external meditation app | Acknowledge: "Already use Headspace? Great! We'll recommend practices, you can use your app to guide them." |
| Practice instructions unclear | Feedback option: "Was this helpful?" to improve instructions |
| Offline access | Practice library available offline (text content cached) |

### Open Questions
- Should we include video demonstrations of breathing techniques?
- Can users mark favorite practices for quick access?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] 15+ practices implemented across 5 categories
- [ ] Practice details include: name, durations, why, when, instructions
- [ ] Category filtering working
- [ ] Timer functionality operational
- [ ] Completion logging functional
- [ ] NO audio content present (text-based only)
- [ ] Performance requirements verified

---