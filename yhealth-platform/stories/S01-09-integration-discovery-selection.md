---
type: story
id: S01.4.1
title: Integration Discovery & Selection
epic: E01
epic_name: Onboarding & Assessment
feature: F1.4
feature_name: Integration Setup
product: yhealth-platform
priority: P0
status: Done
created: 2025-12-07
---

# S01.4.1: Integration Discovery & Selection

## User Story

**As a** new yHealth user who just set my goals,
**I want to** see what wearables and apps I can connect and understand the value of each,
**So that** I can choose which integrations to set up based on my existing devices.

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

**User Experience:**
- Value proposition screen explaining why integrations matter
- Auto-detection of nearby/paired devices (Bluetooth, HealthKit, Google Fit)
- Integration catalog showing all 10 supported sources
- Clear value communication for each integration
- Mandatory: At least 1 integration required to proceed
- Recommendations based on user's goals

**Supported Integrations (MVP - 10):**

| Tier | Integration | Data Provided | Priority |
|------|-------------|---------------|----------|
| 1 | WHOOP | HR, HRV, sleep, strain, recovery | Highest |
| 1 | Apple Health | Activity, workouts, HR, sleep, nutrition | Highest |
| 1 | Fitbit | Steps, HR, sleep, active minutes | High |
| 1 | Garmin | GPS activities, HR, VO2 max, training load | High |
| 1 | Oura Ring | Sleep stages, HRV, readiness, body temp | High |
| 1 | Samsung Health | Steps, workouts, HR, sleep | Medium |
| 2 | MyFitnessPal | Food logs, calorie/macro tracking | High |
| 2 | Nutritionix | Food database (5M+ items) | Medium |
| 2 | Cronometer | Detailed micronutrient tracking | Low |
| 3 | Strava | GPS activities, performance metrics | Medium |

**Discovery Flow:**
```
Let's Connect Your Health Data 📊

yHealth becomes your "Second Mind" by connecting everything about your health.
The more you connect, the more powerful your insights.

DETECTED NEARBY:
☑ Apple Watch (Series 8)  [Connect Now]
☐ WHOOP 4.0              [Not Paired - Pair in WHOOP app first]

POPULAR INTEGRATIONS:
☐ Fitbit                 [Connect]
☐ Garmin                 [Connect]
☐ Oura Ring              [Connect]
☐ MyFitnessPal           [Connect]

[Show All Integrations] [Skip - Add Later]

⚠️ At least one integration is required for personalized insights.
```

**Value Communication Per Integration:**

| Integration | Value Message |
|-------------|---------------|
| WHOOP | "Advanced recovery and strain data - essential for optimizing training and sleep" |
| Apple Watch | "Continuous heart rate, activity, and workout data - foundation for fitness insights" |
| MyFitnessPal | "Nutrition tracking is #1 factor in weight loss" |
| Oura Ring | "Best sleep tracking in the industry - perfect for sleep quality goals" |

---

## Acceptance Criteria

```gherkin
Scenario: Auto-detection
  Given user reaches integration setup
  When screen loads
  Then nearby/paired devices are auto-detected and displayed

Scenario: Value communication
  Given integrations are displayed
  When user views each option
  Then clear value proposition is shown for that integration

Scenario: Minimum requirement
  Given user selects 0 integrations
  When they try to proceed
  Then they are blocked with message explaining minimum requirement

Scenario: Proceed with integration
  Given user selects 1+ integrations
  When they tap "Continue"
  Then they proceed to OAuth connection flow (S01.4.2)

Scenario: Skip temporarily
  Given user wants to skip temporarily
  When they tap "Skip"
  Then they understand they must return to add integration before plan generation
```

---

## Success Metrics

- Integration Discovery Completion: 95%+
- Auto-Detection Accuracy: 90%+ (detects owned devices)
- Value Message Engagement: 60%+ tap to learn more
- Minimum Requirement Compliance: 100%

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s device detection | Bluetooth permissions | No data before consent | Clear device icons | iOS 14+, Android 10+ |
| - | HealthKit permissions | - | - | |

---

## Dependencies

- **Prerequisite Stories:** S01.3.2 (goals complete)
- **Related Stories:** S01.4.2, S01.4.3
- **External Dependencies:** HealthKit (iOS), Google Fit (Android), Bluetooth APIs

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| No wearables detected | Show "Don't have a wearable?" with alternatives |
| Bluetooth permission denied | Explain value, offer manual selection |
| User has unsupported device | "More integrations coming soon!" message |
| Device detected but not setup | Guide to complete device setup first |

---

## Open Questions

- Manual logging option if no integrations? (Decision: Discouraged but available)

---

## Definition of Done

- [ ] Integration catalog with 10 sources displayed
- [ ] Auto-detection via HealthKit/Google Fit/Bluetooth
- [ ] Value messaging for each integration
- [ ] Minimum 1 integration requirement enforced
- [ ] Goal-based recommendations shown
- [ ] Clear proceed/skip flows

---

*Story S01.4.1 | Epic E01 | Product: yHealth Platform*
