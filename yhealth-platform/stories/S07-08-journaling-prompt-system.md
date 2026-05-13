---
type: story
id: S07.2.1
title: Journaling Prompt System
epic: E07
epic_name: Wellbeing Pillar
feature: F7.2
feature_name: Daily Journaling
product: yhealth-platform
priority: P0
status: Complete
story_points: 0
created: 2025-12-24
---

# S07.2.1: Journaling Prompt System


### User Story
**As a** Busy Professional (P2),
**I want to** receive research-based journaling prompts that guide my reflection,
**So that** I can build a journaling habit without staring at a blank page.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
The journaling prompt system provides structured guidance using research-backed prompt categories (gratitude, reflection, emotional processing, stress management, self-compassion, future focus). Prompts reduce the intimidation of blank-page journaling and ensure meaningful reflection.

**Prompt Categories (Research-Based):**

| Category | Evidence | Example Prompts |
|----------|----------|-----------------|
| **Gratitude** | Improves wellbeing, reduces depression | "List three things you're grateful for today and why they matter." |
| **Reflection & Growth** | Increases self-awareness, goal achievement | "What's one thing that went well today? What made it successful?" |
| **Emotional Processing** | Reduces anxiety, improves emotional regulation | "What emotion are you feeling right now? What triggered it?" |
| **Stress Management** | Reduces cortisol, improves coping | "What's causing stress right now? What parts are within your control?" |
| **Self-Compassion** | Reduces self-criticism, improves mental health | "What would you say to a friend going through what you're experiencing?" |
| **Future Focus** | Increases motivation, reduces anxiety | "What's one intention you have for tomorrow?" |

**Prompt Library (50+ prompts across 6 categories):**

**Gratitude (10+ prompts):**
- "What are three things you're grateful for today?"
- "Who made a positive impact on you today? How did they help?"
- "What's a simple pleasure you enjoyed today?"

**Reflection & Growth (10+ prompts):**
- "What's one thing that went well today? What made it successful?"
- "What challenge did you face? What did you learn from it?"
- "How did you show up as your best self today?"

**Emotional Processing (10+ prompts):**
- "What emotion are you feeling right now? What triggered it?"
- "What's weighing on your mind? Why does it matter to you?"
- "If this emotion had a message for you, what would it be?"

**Stress Management (10+ prompts):**
- "What's causing stress right now? What's within your control?"
- "What's one action you can take to ease this stress?"
- "What would help you feel calmer right now?"

**Self-Compassion (10+ prompts):**
- "What would you say to a friend going through what you're experiencing?"
- "What do you need to forgive yourself for today?"
- "How can you be kinder to yourself tomorrow?"

**Future Focus (10+ prompts):**
- "What's one intention you have for tomorrow?"
- "What are you looking forward to this week?"
- "What would make tomorrow feel successful?"

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Single prompt displayed. 1-2 sentence response encouraged. 2-5 minute session. |
| **Deep** | Multiple prompts (3-5), extended reflection, cross-pillar prompts. 10-20 minute session. |

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Prompt ID | UUID | Required | System |
| Prompt Text | String | From library | System |
| Prompt Category | Enum | From 6 categories | System |
| Display Mode | Enum | light/deep | User setting |
| Timestamp | ISO 8601 | Required | System |

**Behaviors:**
- Prompt rotates daily to prevent repetition
- Same prompt not shown within 7 days
- Category balance maintained across week
- Users can "skip" prompt to get a different one
- Cross-pillar prompts available: "How did today's workout affect your mood?"

### Acceptance Criteria

**AC1: Daily Prompt Display**
Given the user opens journaling,
When the journaling interface loads,
Then a prompt is displayed from the prompt library.

**AC2: Prompt Rotation**
Given the user saw a specific prompt yesterday,
When they open journaling today,
Then a different prompt is shown (no repeat within 7 days).

**AC3: Skip to Different Prompt**
Given the user doesn't resonate with the current prompt,
When they tap "Different prompt",
Then a new prompt from a different category appears.

**AC4: Category Balance**
Given the user journals daily for a week,
When reviewing prompts shown,
Then all 6 categories are represented (not all gratitude, for example).

**AC5: Light Mode Single Prompt**
Given the user is in Light mode,
When viewing journal prompts,
Then only one prompt displays with brief entry field.

**AC6: Deep Mode Multiple Prompts**
Given the user is in Deep mode,
When viewing journal prompts,
Then 3-5 prompts are available for extended reflection.

**AC7: Cross-Pillar Prompt (Deep Mode)**
Given the user logged a workout today,
When Deep mode prompts load,
Then cross-pillar prompt is included: "How did today's workout affect your mood?"

**AC8: Prompt Library Coverage**
Given the prompt library,
When reviewing all prompts,
Then 50+ unique prompts exist across 6 categories.

### Success Metrics
- Prompt engagement: 70% of users respond to at least one prompt per session
- Skip rate: <30% of prompts skipped (indicates prompt relevance)
- Category coverage: Users exposed to 5+ categories within first 2 weeks
- Light mode completion: 80% complete Light mode journal entries

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Prompt load <500ms | Auth required | Prompts not logged until response | Voice input for prompt | iOS 14+, Android 10+ |
| Skip response <300ms | Encrypted | User-only | Min 4.5:1 contrast | All channels |

### Dependencies
- **Prerequisite Stories:** None (foundation for journaling)
- **Related Stories:** S07.2.2, S07.2.3
- **External Dependencies:** E4 (Mobile App), E3 (WhatsApp for prompts)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| All prompts in category exhausted (rare) | Reset category, start rotation again |
| User always skips certain category | Reduce frequency of that category; don't eliminate |
| User prefers specific category | Allow "favorite" prompts to appear more often |
| Prompt contains triggering content | Avoid prompts that assume negative context (e.g., don't assume conflict) |
| Cross-pillar data unavailable | Show standard prompts; no cross-pillar prompt |

### Open Questions
- Should users be able to favorite specific prompts?
- Can users submit custom prompts for personal use?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] 50+ prompts implemented across 6 categories
- [ ] Prompt rotation preventing repeats
- [ ] Skip functionality working
- [ ] Category balance maintained
- [ ] Light and Deep mode prompts rendering correctly
- [ ] Cross-pillar prompts functional when data available

---