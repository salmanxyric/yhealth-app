---
type: story
id: YH-S04.2.2
title: Channel Switching & Navigation State
epic: E04
epic_name: Mobile App
feature: F4.2
feature_name: Navigation & Information Architecture
product: yhealth-platform
priority: P0
status: Draft
story_points: 5
created: 2025-12-09
---

# YH-S04.2.2: Channel Switching & Navigation State

## User Story

**As a** Holistic Health Seeker (P1),
**I want to** easily switch between the app, voice coaching, and WhatsApp,
**So that** I can interact with yHealth through my preferred channel at any moment.

---

## Story Type

- [x] Feature
- [ ] Enhancement
- [ ] Technical
- [ ] Integration

## Priority

- [x] Must Have (P0)
- [ ] Should Have (P1)
- [ ] Could Have (P2)
- [ ] Won't Have (P3)

---

## Scope Description

**User Experience:**
The top navigation bar includes channel switcher icons for Voice Coaching (E2) and WhatsApp (E3). Users can quickly switch channels without losing their place in the app. Navigation state persists across channel switches and app restarts.

**Top Navigation Bar:**
- Left: App logo/branding
- Center-Right: Channel switcher icons (Voice, WhatsApp)
- Right: Notifications bell, Search (magnifying glass)

**Channel Switching:**
- **Voice Icon:** Initiates voice coaching session (E2)
- **WhatsApp Icon:** Opens WhatsApp conversation or prompts linking (E3)
- Channel switch preserves app navigation state

**Deep Linking:**
- Support for notification deep links to specific screens
- Handle invalid/expired deep links gracefully
- Maintain navigation stack for back button behavior

**Navigation State Persistence:**
- Remember last visited screen on app close
- Restore navigation state on app reopen
- Handle back button per platform conventions (Android hardware back, iOS swipe)

**Behaviors:**
- Channel switcher always accessible from top nav
- Navigation state saved on app background
- Deep links override current navigation to target screen
- Back button returns to previous screen in stack

---

## Acceptance Criteria

```gherkin
Scenario: Top Navigation Display
  Given the app is loaded
  When the main interface displays
  Then the top navigation bar shows app branding, channel switchers (Voice, WhatsApp), notification bell

Scenario: Voice Channel Switch
  Given the user taps the Voice icon
  When the icon is pressed
  Then the app initiates a voice coaching session (E2 integration)

Scenario: WhatsApp Channel Switch
  Given the user taps the WhatsApp icon
  When the icon is pressed
  Then the app opens WhatsApp conversation or prompts for linking if not connected

Scenario: Navigation State Persistence
  Given the user is on a specific screen
  When they close and reopen the app
  Then the app restores to the last visited screen

Scenario: Deep Linking
  Given a notification with deep link is received
  When the user taps the notification
  Then the app navigates to the linked screen

Scenario: Invalid Deep Link Handling
  Given a deep link to invalid/unavailable content
  When processed
  Then the app navigates to Dashboard with toast: "Content unavailable. Showing your dashboard."

Scenario: Back Button Behavior
  Given the user is not on the root screen
  When they press back (Android) or swipe (iOS)
  Then the app navigates to the previous screen in the stack
```

---

## Success Metrics

- Channel switch success rate >95%
- Deep link resolution success >90%
- Navigation state restoration success >99%

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Channel switch <1s | Deep link validation | State stored locally | Icons have labels | iOS + Android |
| State restore <500ms | Auth on channel access | No sensitive data in links | Keyboard navigable | All devices |

---

## Dependencies

- **Prerequisite Stories:** YH-S04.2.1 (Tab navigation)
- **Related Stories:** YH-S04.4.2 (Notification deep linking)
- **External Dependencies:** E2 (Voice Coaching), E3 (WhatsApp Integration)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Voice channel unavailable (no mic permission) | Prompt for permission or show error |
| WhatsApp not linked | Show linking prompt with instructions |
| Deep link to premium feature (free user) | Show upgrade prompt |
| Navigation stack overflow | Clear older entries, maintain recent 10 |

---

## Open Questions

- Should search be accessible from all screens?
- Should channel history be visible (recent voice calls, WhatsApp messages)?

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Channel switching functional (Voice, WhatsApp)
- [ ] Navigation state persistence working
- [ ] Deep linking implemented
- [ ] Back button behavior correct per platform

---

*Story YH-S04.2.2 | Epic E04 | Product: yhealth-platform*
