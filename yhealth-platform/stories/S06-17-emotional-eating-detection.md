---
type: story
id: S06.6.2
title: Emotional Eating Detection & Tagging
epic: E06
feature: F6.6
product: yhealth-platform
priority: P0
status: Draft
---

# Emotional Eating Detection & Tagging

### User Story
**As a** Holistic Health Seeker (P1),
**I want to** understand when I eat emotionally vs. physically hungry,
**So that** I can build a healthier relationship with food.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users can optionally tag their emotional state when logging meals. The system also automatically correlates meals with mood/stress data from the Wellbeing Pillar (E7) to detect emotional eating patterns without manual tagging.

**Manual Emotional Tagging (Optional):**
| Emotion | Emoji | Description |
|---------|-------|-------------|
| Stressed | 😰 | Feeling pressured or anxious |
| Sad | 😢 | Feeling down or low |
| Anxious | 😟 | Worried or nervous |
| Bored | 😐 | Eating out of boredom |
| Happy | 😊 | Positive mood |
| Neutral | 😶 | No particular emotion |
| Celebratory | 🎉 | Special occasion eating |

**Automatic Correlation (E7 Integration):**
The system cross-references meal logs with:
- Mood check-ins from Wellbeing Pillar
- Journal entries mentioning food/eating
- Stress level ratings
- Energy levels before/after meals
- Time of day and context patterns

**Pattern Detection:**
| Pattern Type | Detection Method | Minimum Data |
|--------------|------------------|--------------|
| **Stress Eating** | High-calorie snacks within 2 hours of "stressed" mood | 3+ instances |
| **Emotional Triggers** | Specific emotions correlate with specific food types | 5+ instances |
| **Boredom Eating** | Frequent snacking during low-engagement periods | 7+ instances |
| **Celebration Excess** | Large meals after positive events | 3+ instances |
| **Anxiety Skipping** | Missed meals correlate with anxiety ratings | 3+ instances |

**Real-Time Intervention (When Pattern Detected):**
- AI detects user logged "stressed" mood
- Proactive message: "Stressful day? Before reaching for a snack, let's check in. Are you physically hungry or seeking comfort?"
- Coping suggestions offered (see below)

**Coping Strategy Suggestions:**
| Strategy | Example |
|----------|---------|
| **Alternative Activity** | "Try a 5-min walk or breathing exercise before eating." |
| **Mindful Eating Prompt** | "If you do eat, savor it slowly. No judgment - just awareness." |
| **Healthier Substitution** | "Craving sweets? Try Greek yogurt with honey - satisfies with protein." |
| **Journaling Prompt** | "What's triggering this? Writing it down might help." |

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Automatic detection only (no manual tagging required). Occasional insights surfaced. |
| **Deep** | Manual tagging option on every meal. Detailed correlation analysis. Proactive interventions. Weekly emotional eating summary. |

**Privacy & Sensitivity:**
- Emotional data encrypted separately (highest protection)
- Non-judgmental language always
- User can disable emotional eating tracking entirely
- No external sharing under any circumstances

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Emotional Tag | Enum | Optional, from list | Highly sensitive |
| Auto-Detected Correlation | Object | From E7 data | System |
| Intervention Sent | Boolean | Trigger timestamp | System |
| Intervention Response | Enum | accepted/dismissed/acted | System |

### Acceptance Criteria

**AC1: Manual Emotional Tagging**
Given a user is logging a meal in Deep mode,
When they complete the meal entry,
Then they can optionally tag their emotional state from the emoji list.

**AC2: Automatic E7 Correlation**
Given a user logs a high-calorie snack within 2 hours of logging "stressed" mood in E7,
When the correlation engine runs,
Then the meal is flagged as potential stress eating.

**AC3: Pattern Detection**
Given a user has 3+ instances of stress-related snacking,
When the pattern detection runs,
Then a "stress eating" pattern is identified and stored.

**AC4: Real-Time Intervention**
Given a user logs "stressed" mood in E7,
When they haven't eaten recently,
Then a proactive message is sent: "Stressful day? Pause before snacking."

**AC5: Coping Strategy Delivery**
Given an emotional eating intervention is triggered,
When the user views it,
Then at least one coping strategy suggestion is included.

**AC6: Non-Judgmental Tone**
Given any emotional eating communication,
When the message is generated,
Then the tone is supportive and non-judgmental (e.g., "no judgment - just awareness").

**AC7: Disable Option**
Given a user finds emotional eating tracking triggering,
When they go to settings,
Then they can disable all emotional eating features with one toggle.

**AC8: Privacy Protection**
Given emotional eating data is stored,
When the data is accessed,
Then it uses highest-level encryption and is never shared externally.

### Success Metrics
- Emotional tagging adoption: 30% of Deep mode users tag emotions on 20%+ of meals
- Pattern detection accuracy: 75%+ patterns confirmed by user behavior
- Intervention effectiveness: 50% show reduced emotional eating after 90 days
- User comfort: <5% disable emotional eating features

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s correlation | AES-256 encryption | Highest privacy level | Clear emotion labels | iOS 14+, Android 10+ |
| Real-time intervention | Separate data store | Never shared | Voice tagging option | E7 integration required |

### Dependencies
- **Prerequisite Stories:** S06.5.3
- **Related Stories:** S06.6.3
- **External Dependencies:** E7 (Wellbeing Pillar - mood, stress, journaling data)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| E7 data unavailable | Rely on manual tagging only, note limitation |
| User tags every meal as "stressed" | Don't trigger constant interventions, aggregate to weekly insight |
| Intervention sent but user eats anyway | No negative follow-up, just track silently |
| User reports false positive pattern | Adjust algorithm sensitivity for that user |
| Concerning pattern (possible eating disorder) | Very gentle approach with resources (see S06.6.3) |
| User declines all interventions | Reduce frequency, ask if they want to pause feature |

### Open Questions
- Should we allow custom emotion tags?
- How to handle shared meal contexts (eating with friends)?
- Should interventions vary based on time of day?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Manual tagging functional
- [ ] E7 automatic correlation working
- [ ] Pattern detection operational
- [ ] Real-time interventions triggering
- [ ] Coping strategies delivered
- [ ] Disable toggle working
- [ ] Privacy requirements verified