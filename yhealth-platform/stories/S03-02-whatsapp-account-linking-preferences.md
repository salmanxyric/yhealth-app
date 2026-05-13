---
type: story
id: S03.1.1
title: WhatsApp Account Linking & Preferences
epic: E03
epic_name: WhatsApp Integration
feature: F3.1
feature_name: Account Linking
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.1.1: WhatsApp Account Linking & Preferences

## User Story

**As a** Busy Professional (P2),
**I want to** connect my WhatsApp account to yHealth and configure my messaging preferences,
**So that** I can receive coaching and log health data through an app I already use constantly.

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
- WhatsApp linking offered during onboarding (E1) or from app settings
- Phone number entry with country code auto-detection from device locale
- SMS verification code (6-digit, 10-minute expiry)
- Clear privacy consent: "yHealth will message you on WhatsApp for health coaching. Reply STOP anytime."
- Confirmation message sent to WhatsApp after successful linking
- Preference configuration (quiet hours, frequency, notification types)

**Light Mode:**
- Simple phone number entry, SMS verification
- Single "Yes, message me on WhatsApp" consent button
- Default quiet hours applied (10pm-8am)
- Minimal configuration required

**Deep Mode:**
- Detailed preference configuration
- Messaging frequency selection (multiple daily/daily/weekly)
- Custom quiet hours configuration
- Notification category toggles (insights/reminders/check-ins)
- Per-message-type opt-in/opt-out

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Phone Number | E.164 format | Valid country code, not disposable | Encrypted |
| Country Code | ISO 3166-1 | Auto-detected, editable | Analytics |
| Verification Status | Boolean | Code validated | - |
| Quiet Hours Start | HH:MM | 00:00-23:59 | Preferences |
| Quiet Hours End | HH:MM | 00:00-23:59 | Preferences |
| Timezone | IANA timezone | Device-detected | Preferences |
| Consent Timestamp | ISO 8601 | Recorded at consent | Legal |

**Linking Flow:**
1. User enters phone number with country code
2. SMS verification code sent within 30 seconds
3. User enters 6-digit code (3 attempts, then resend option)
4. Privacy consent screen displayed
5. User accepts Terms + Privacy Policy + WhatsApp consent
6. Preferences configured (or defaults applied)
7. Welcome message sent to WhatsApp: "Welcome to yHealth! I'm your AI health coach..."
8. Linking confirmed in app

**Preference Options:**
- Quiet Hours: Default 10pm-8am, user-configurable
- Frequency: Minimal (2-3/day), Moderate (5-7/day), Frequent (based on engagement)
- Notification Types: Morning check-in, Goal reminders, Insights, Meal reminders

---

## Acceptance Criteria

```gherkin
Scenario: SMS verification
  Given a user on the WhatsApp linking screen
  When they enter a valid phone number and tap "Send Code"
  Then an SMS verification code is sent within 30 seconds

Scenario: Successful verification
  Given a user enters the correct verification code
  When they submit
  Then verification succeeds and consent screen is displayed

Scenario: Failed verification attempts
  Given a user enters incorrect code 3 times
  When the third attempt fails
  Then they see "Code incorrect. Tap to resend a new code."

Scenario: Account linking
  Given a user has verified their number
  When they accept privacy consent
  Then WhatsApp is linked and welcome message is sent within 60 seconds

Scenario: Light mode setup
  Given a user wants Light mode setup
  When they tap "Use defaults"
  Then quiet hours (10pm-8am) are applied and setup completes

Scenario: Deep mode setup
  Given a user wants Deep mode setup
  When they configure preferences
  Then all selections are saved and applied immediately

Scenario: Unlink WhatsApp
  Given a user wants to unlink WhatsApp
  When they confirm in settings
  Then WhatsApp is disconnected and no further messages are sent

Scenario: Duplicate phone number
  Given a phone number is already linked to another account
  When verification succeeds
  Then user sees "This number is linked to another account. Unlink it first or contact support."
```

---

## Success Metrics

- Linking Completion Rate: >85% of users who start
- Linking Time: <2 minutes average
- WhatsApp Opt-In Rate: >70% of users enable WhatsApp
- SMS Verification Success: >90% first-attempt success
- User Satisfaction: 4.5/5 on setup simplicity

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s SMS delivery | Phone number encrypted | GDPR consent | Country code picker accessible | iOS 14+, Android 10+ |
| <2min total flow | Rate limit verification attempts | Consent versioned | VoiceOver support | WhatsApp installed |

---

## Dependencies

- **Prerequisite Stories:** S03.0.1 (API configuration)
- **Related Stories:** S03.5.2 (quiet hours used), S03.2.1 (messaging starts)
- **External Dependencies:** SMS provider, E1 Onboarding (S01.1.3 flow)
- **Cross-Epic:** E1 S01.1.3 (WhatsApp enrollment in onboarding)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid phone number format | "Phone number format invalid. Try with country code (e.g., +1 555-123-4567)." |
| SMS delivery failure | "Didn't receive code? Tap to resend or try WhatsApp call verification." |
| Verification code expired (>10 min) | "Code expired. Tap to get a new code." |
| WhatsApp not installed | "WhatsApp is required. Install WhatsApp to continue." |
| User changes phone number | Re-verification flow with new number |
| Network timeout during verification | Auto-retry, show "Verifying... please wait" |

---

## Open Questions

- Voice call verification as SMS alternative?
- Support for multiple WhatsApp accounts (business + personal)?

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Phone number entry with country code picker
- [ ] SMS verification (6-digit, 10-min expiry)
- [ ] Privacy consent with version tracking
- [ ] Light mode (defaults) functional
- [ ] Deep mode (custom preferences) functional
- [ ] Welcome message sent to WhatsApp
- [ ] Unlink functionality working
- [ ] Error handling for all failure scenarios

---

*Story S03.1.1 | Epic E03 | Product: yHealth Platform*
