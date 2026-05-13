---
type: story
id: S04.6.1
title: Core Settings & Preferences
epic: E04
feature: F4.6
product: yhealth-platform
priority: P0
status: Draft
---

# S04.6.1: Core Settings & Preferences

## User Story
**As a** Holistic Health Seeker (P1),
**I want** to customize my app experience and notification preferences,
**So that** yHealth works exactly the way I want it to.

## Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

## Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

## Scope Description

**User Experience:**
Settings are organized into logical categories for easy navigation. Changes save immediately without requiring a "Save" button. Light mode shows essential settings; Deep mode includes all options.

**Settings Categories Covered:**
1. **Notifications**
2. **Display & Accessibility**
3. **Channels (Voice/WhatsApp)**
4. **Goals & Coaching**

**Notification Settings:**
- Master on/off toggle
- Category toggles (Check-in, Insights, Coaching, Milestones, Recovery, Prompts)
- Quiet hours (start/end time pickers)
- Frequency preference (Light: 1-3/day, Deep: up to 8/day)

**Display Settings:**
- Theme: Light, Dark, Auto (follow system)
- Text size: Small, Medium, Large, Extra Large
- Deep mode: Reduce motion toggle

**Channel Settings:**
- Preferred interaction channel: Mobile App, WhatsApp, Voice, No preference
- Voice coaching: Scheduled call times
- WhatsApp: Opt-in/opt-out, message frequency

**Goals & Coaching Settings:**
- Default goal focus: Fitness, Nutrition, Wellbeing, Balanced
- Coaching tone: Supportive, Motivational, Direct, Gentle
- Flexibility mode: Light, Deep

**Behaviors:**
- Settings save immediately (auto-save)
- Changes take effect immediately
- Settings sync across devices (if multiple)
- Search available in Deep mode

## Acceptance Criteria

**AC1: Settings Organization**
Given the user navigates to Settings,
When the settings screen loads,
Then categories are displayed: Notifications, Display, Channels, Goals & Coaching.

**AC2: Notification Master Toggle**
Given the user toggles master notifications off,
When the toggle is changed,
Then all notifications are disabled immediately.

**AC3: Theme Selection**
Given the user selects Dark theme,
When the selection is made,
Then the app immediately switches to dark theme.

**AC4: Text Size Adjustment**
Given the user changes text size to Large,
When the selection is made,
Then app-wide text size increases immediately.

**AC5: Instant Save**
Given the user changes any setting,
When the change is made,
Then it saves automatically (no "Save" button required).

**AC6: Settings Sync**
Given the user has multiple devices,
When they change a setting on one device,
Then the setting syncs to other devices.

**AC7: Deep Mode Settings Search**
Given the user is in Deep mode,
When they view settings,
Then a search bar is available to find settings by keyword.

## Success Metrics
- 80% of users access settings at least once
- 60% of users modify at least 3 settings
- Settings satisfaction 4.5/5

## Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Save <500ms | Encrypted storage | Local + sync | All controls accessible | iOS + Android |
| Load <1s | Auth required | User preference only | VoiceOver labels | All screen sizes |

## Dependencies
- **Prerequisite Stories:** S04.2.1 (Navigation to Profile)
- **Related Stories:** S04.6.2, S04.4.3 (Notification settings)
- **External Dependencies:** E2 (Voice), E3 (WhatsApp)

## Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Settings save failure (offline) | Queue and sync when online, show "Saved offline" |
| Invalid setting value | Validation error inline, prevent save |
| Theme change mid-session | Apply immediately without restart |
| Sync conflict (multi-device) | Most recent change wins |

## Open Questions
- Should settings have reset-to-default option?
- Should some settings require confirmation?

## Definition of Done
- [ ] Acceptance criteria met
- [ ] All 4 categories implemented
- [ ] Instant save working
- [ ] Theme switching functional
- [ ] Settings sync across devices
