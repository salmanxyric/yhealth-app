---
type: story
id: S01.5.2
title: Coaching Style & Channel Preferences
epic: E01
epic_name: Onboarding & Assessment
feature: F1.5
feature_name: Preference Configuration
product: yhealth-platform
priority: P1
status: Done
created: 2025-12-07
---

# S01.5.2: Coaching Style & Channel Preferences

## User Story

**As a** new yHealth user,
**I want to** customize how my AI coach communicates and through which channels,
**So that** yHealth interactions feel natural and fit my communication preferences.

---

## Story Type

- [x] Feature
- [ ] Enhancement
- [ ] Technical
- [ ] Integration

## Priority

- [ ] Must Have (P0)
- [x] Should Have (P1)

---

## Scope Description

**User Experience:**
- Set AI coaching tone and style
- Choose motivational approach
- Select primary interaction channel
- Configure per-feature channel preferences
- Set privacy and data usage preferences

**Coaching Style Configuration:**
```
TONE:
○ Professional & Formal (like a medical advisor)
○ Friendly & Supportive (like a personal trainer) ✓
○ Casual & Relatable (like a wellness-focused friend)

COMMUNICATION STYLE:
○ Direct & Concise (get to the point)
○ Balanced (efficiency + encouragement) ✓
○ Warm & Detailed (thorough explanations)

MOTIVATIONAL APPROACH:
○ Tough love (push hard, call out slacking)
○ Balanced accountability (supportive but honest) ✓
○ Gentle encouragement (celebrate wins, downplay setbacks)
```

**Channel Preferences:**
```
PRIMARY CHANNEL (daily interactions):
○ Mobile App
○ WhatsApp ✓
○ Voice Calls

COACHING CALLS:
☑ Schedule regular voice coaching calls
   Frequency: Weekly  Day: Sundays  Time: 7:00 PM
☐ On-demand calls only

MEAL LOGGING:
○ Mobile app (photo upload)
○ WhatsApp (send pics via chat) ✓

MOOD/ENERGY LOGGING:
○ Mobile app widget
○ WhatsApp (emoji reply) ✓
```

**Privacy & Data Preferences:**
```
DATA USAGE:
☑ Use my data to train AI (anonymized)
☐ Keep data private (personalized only for me)

PERSONALIZATION LEVEL:
○ Maximum (AI uses all data)
○ Moderate (exclude mood journals) ✓
○ Minimal (fitness/nutrition only)

DATA RETENTION:
Keep health data for: 2 years ▼
```

---

## Acceptance Criteria

```gherkin
Scenario: Coaching style
  Given user configures coaching style
  When AI generates messages
  Then tone matches selected style

Scenario: Channel preferences
  Given user sets channel preferences
  When daily interactions occur
  Then they happen via the selected channel

Scenario: Coaching calls
  Given user sets coaching call preferences
  When scheduling occurs
  Then calls are scheduled per preferences

Scenario: Privacy preferences
  Given privacy preferences are set
  When data is processed
  Then preferences are respected (anonymization, retention)
```

---

## Success Metrics

- Style Customization: 30%+ users customize coaching style
- Channel Diversity: 60%+ actively use 2+ channels
- Privacy Opt-Out: <5% choose minimal personalization

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s save | - | Data usage transparent | Clear option labels | All devices |
| - | - | Retention enforced | - | |

---

## Dependencies

- **Prerequisite Stories:** S01.5.1 (engagement preferences set)
- **Related Stories:** S01.6.1
- **External Dependencies:** AI engine, WhatsApp Business API, Voice calling service

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| WhatsApp not connected but selected | Prompt to connect or choose alternative |
| Voice calls selected without phone number | Prompt to add number |
| Style change mid-conversation | Apply from next interaction |

---

## Open Questions

- Voice call service provider
- Multi-language AI style support

---

## Definition of Done

- [ ] Coaching style affects AI output
- [ ] Channel preferences route interactions correctly
- [ ] Voice call scheduling working
- [ ] Privacy/data preferences enforced
- [ ] Multi-channel sync maintained
- [ ] Preferences editable from settings

---

*Story S01.5.2 | Epic E01 | Product: yHealth Platform*
