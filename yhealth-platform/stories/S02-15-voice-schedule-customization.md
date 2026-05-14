---
type: story
id: S02.6.1
title: Voice & Schedule Customization
epic: E02
epic_name: Voice Coaching
feature: F2.6
feature_name: Voice Preferences
product: yhealth-platform
priority: P0
status: Done
created: 2025-12-07
implemented: 2026-05-14
---

# S02.6.1: Voice & Schedule Customization

## User Story

**As a** Holistic Health Seeker (P1),
**I want to** choose my AI coach's voice and set when calls can occur,
**So that** conversations feel comfortable and respect my schedule.

---

## Story Type

- [x] Feature
- [ ] Enhancement
- [ ] Technical
- [ ] Integration

## Priority

- [x] Must Have (P0)
- [ ] Should Have (P1)

---

## Scope Description

**Voice Selection Options (MVP):**
| Voice ID | Description | Characteristics |
|----------|-------------|-----------------|
| Coach Maya | Female, American, Warm | Moderate pace, empathetic, default |
| Coach Alex | Male, American, Calm | Slower pace, reassuring |
| Coach Jordan | Gender-neutral, British, Energetic | Faster pace, motivational |
| Coach Sam | Male, American, Gentle | Slow pace, soft, supportive |

**Voice Customization:**
- Voice selection from 4+ options
- Speech pace adjustment (0.8x, 1.0x, 1.2x, 1.5x)
- Voice preview: "Test this voice" before selecting
- Change voice anytime in settings

**Schedule Customization:**
| Setting | Options | Default |
|---------|---------|---------|
| Quiet Hours | Time range when AI cannot initiate | 10pm-7am |
| DND Days | Block AI calls on specific days | None |
| Timezone | Auto-detected, adjustable | Device timezone |
| Override | Allow user calls during quiet hours | Yes |

**AI-Initiated Call Frequency:**
| Level | Behavior | Use Case |
|-------|----------|----------|
| Off | AI never initiates | User prefers full control |
| Minimal | Critical patterns only | Default, low interruption |
| Moderate | Weekly check-ins + critical | Regular engagement |
| Active | Daily check-ins + coaching | High-touch coaching |

**Light Mode:**
- Basic voice selection (2 options)
- Simple quiet hours toggle
- AI calls on/off

**Deep Mode:**
- Full voice library
- Detailed schedule configuration
- Granular frequency controls

---

## Acceptance Criteria

```gherkin
Scenario: Voice selection
  Given a user wants to select a voice
  When they access voice preferences
  Then they see 4+ voice options with preview capability

Scenario: Voice preview
  Given a user selects "Coach Alex"
  When they tap preview
  Then they hear a sample of Coach Alex's voice

Scenario: Quiet hours enforcement
  Given a user sets quiet hours to 9pm-8am
  When the AI would initiate a call at 10pm
  Then no call is initiated (deferred until 8am)

Scenario: Speech pace adjustment
  Given a user adjusts speech pace to 1.2x
  When the AI responds in calls
  Then the AI speaks 20% faster than default

Scenario: AI frequency off
  Given a user sets AI frequency to "Off"
  When any trigger condition is met
  Then no AI-initiated call occurs

Scenario: Timezone change
  Given a user travels to a new timezone
  When timezone change is detected
  Then prompt: "Detected new timezone. Update quiet hours?"
```

---

## Success Metrics

- Voice Customization Rate: 70% adjust voice preference
- Quiet Hours Usage: 60% set custom quiet hours
- Voice Satisfaction: 4.6/5 comfort rating
- Quiet Hours Compliance: 100%
- Preview Usage: 80% preview voice before selecting

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s voice preview load | Preferences encrypted | No voice data shared | Voice descriptions accessible | All platforms |
| Settings sync <2s | Auth required | | Time picker accessible | TTS API supports all voices |

---

## Dependencies

- **Prerequisite Stories:** S02.1.1 (uses voice preference), S02.2.1 (TTS uses voice)
- **Related Stories:** S02.1.2 (AI initiation respects schedule), S02.6.2 (additional preferences)
- **External Dependencies:** TTS service with multiple voice options

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Selected voice temporarily unavailable | Fallback to default: "Your preferred voice is unavailable. Using default." |
| User sets >18 hours quiet hours | Warn: "This leaves only 6 hours for AI calls. Are you sure?" |
| Timezone auto-detection fails | Prompt manual selection |
| Voice preview fails to load | Retry, show error if persistent |
| Conflicting settings (DND + scheduled session) | Warn about conflict, let user resolve |

---

## Open Questions

- Additional voice options for post-MVP (languages, accents)
- Voice personality customization (more formal/casual)

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] 4+ voice options available
- [ ] Voice preview functional
- [ ] Speech pace adjustment working
- [ ] Quiet hours enforced
- [ ] DND days working
- [ ] Timezone handling correct
- [ ] AI frequency levels functional
- [ ] Settings sync across devices

---

*Story S02.6.1 | Epic E02 | Product: yHealth Platform*
