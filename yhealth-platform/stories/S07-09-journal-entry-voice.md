---
type: story
id: S07.2.2
title: Journal Entry & Voice Input
epic: E07
epic_name: Wellbeing Pillar
feature: F7.2
feature_name: Daily Journaling
product: yhealth-platform
priority: P0
status: Draft
story_points: 0
created: 2025-12-24
---

# S07.2.2: Journal Entry & Voice Input


### User Story
**As a** Holistic Health Seeker (P1),
**I want to** write or speak my journal entries with streak tracking and privacy,
**So that** I can reflect consistently using my preferred input method while keeping my thoughts secure.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Journal entry supports both text and voice input. Streak tracking motivates consistency. Privacy is paramount - all entries are encrypted and user-only accessible. Free write mode available for users who prefer blank-page journaling.

**Input Methods:**

| Method | Experience |
|--------|------------|
| **Text** | Standard text input with markdown support. Word count displayed. |
| **Voice-to-Text** | Speak journal entry; transcription appears in real-time. Edit after speaking. |

**Structured Templates:**

| Template | Duration | Structure |
|----------|----------|-----------|
| **Morning Pages** | 10-15 min | Free-form stream of consciousness writing |
| **Evening Reflection** | 5-10 min | What went well? What to improve? Gratitude. |
| **Weekly Review** | 15-20 min | Week highlights, challenges, intentions for next week |
| **Monthly Check-in** | 20-30 min | Month review, progress on goals, adjustments needed |

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Respond to single prompt with 1-3 sentences. Quick save. 2-5 minutes. |
| **Deep** | Extended reflection with multiple prompts, templates, or free write. 10-20 minutes. |

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Entry ID | UUID | Required | System |
| Prompt ID | UUID | If prompted entry | System |
| Entry Text | Encrypted String | Max 10,000 chars | User-only (encrypted) |
| Word Count | Integer | System calculated | User-only |
| Duration | Integer (seconds) | System tracked | User-only |
| Input Method | Enum | text/voice | System |
| Template Used | Enum | Optional | System |
| Sentiment Score | Float | AI-analyzed | System (for stress detection) |
| Timestamp | ISO 8601 | Required | System |

**Behaviors:**
- Entries auto-save every 30 seconds during writing
- Voice-to-text allows pause/resume
- Journaling streak tracks consecutive days
- +10 Mental Recovery Score bonus on journaling days
- Entries encrypted at rest (AES-256)
- Export available in PDF/text format

**Streak Milestones:**
| Streak | Celebration |
|--------|-------------|
| 3 days | "3-day journaling streak! Reflection is becoming a habit." |
| 7 days | "7-day streak! You're building self-awareness." |
| 30 days | "30-day streak! Journaling is part of who you are." |

### Acceptance Criteria

**AC1: Text Entry**
Given the user opens journal entry,
When they type in the text field,
Then text saves and word count updates in real-time.

**AC2: Voice-to-Text Entry**
Given the user taps voice input,
When they speak their journal entry,
Then transcription appears in real-time with ability to edit after.

**AC3: Auto-Save**
Given the user is writing an entry,
When 30 seconds pass without explicit save,
Then entry auto-saves as draft.

**AC4: Free Write Mode**
Given the user wants unguided journaling,
When they select "Free write",
Then blank entry field appears without prompt.

**AC5: Template Selection (Deep Mode)**
Given the user is in Deep mode,
When they view templates,
Then Morning Pages, Evening Reflection, Weekly Review, Monthly Check-in are available.

**AC6: Journaling Streak Display**
Given the user has journaled consecutive days,
When viewing journal section,
Then current streak displays: "🔥 7-day streak!"

**AC7: Streak Milestone Celebration**
Given the user reaches a streak milestone,
When they complete today's entry,
Then celebratory message appears.

**AC8: Mental Recovery Bonus**
Given the user completes a journal entry today,
When Mental Recovery Score calculates,
Then +10 bonus is applied.

**AC9: Entry Encryption**
Given a journal entry is saved,
When stored in database,
Then entry text is encrypted (AES-256) and only decryptable by user.

**AC10: Export Entries**
Given the user wants to export journal data,
When they select export option,
Then entries download as PDF or text with date range selection.

### Success Metrics
- Daily journaling rate: 60% of users journal ≥3x/week
- Journaling streak formation: 50% achieve 7+ day streak within first month
- Voice input adoption: 25% use voice-to-text for journaling
- Mental Recovery Score impact: +15 point boost on journaling days (measured)

### Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Entry save <1s | AES-256 encryption | Entries user-only | Voice input support | iOS 14+, Android 10+ |
| Voice transcription <2s | Auth required | No sharing without export | Screen reader support | WhatsApp voice notes |

### Dependencies
- **Prerequisite Stories:** S07.2.1 (Journaling Prompt System)
- **Related Stories:** S07.2.3, S07.5.2 (text sentiment for stress detection)
- **External Dependencies:** E4 (Mobile App), E3 (WhatsApp voice notes), E2 (Voice coaching)

### Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Very short entries (<10 words) consistently | Suggestion: "Quick entries are great! Want to try voice journaling for richer reflection?" |
| Entry contains crisis keywords | Trigger escalation protocol per PRD Section 14 (resources shown, not intervention) |
| Voice transcription error | Allow manual correction; "Couldn't catch that - please review and edit." |
| Journaling streak broken after 7+ days | Encouragement: "7-day streak! One miss doesn't erase the habit. Quick entry today?" |
| Blank entry submitted | Accept and encourage: "Even blank pages are valid. Want a different prompt?" |
| App crash during entry | Restore from auto-save draft |

### Open Questions
- Should we offer guided audio journaling (AI asks questions, user responds verbally)?
- What's the retention period for journal entries (unlimited vs 5 years)?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Text entry with auto-save functional
- [ ] Voice-to-text working with real-time transcription
- [ ] Templates available in Deep mode
- [ ] Streak tracking and celebrations functional
- [ ] Mental Recovery bonus applying
- [ ] Entry encryption verified (AES-256)
- [ ] Export to PDF/text working
- [ ] Performance requirements verified

---