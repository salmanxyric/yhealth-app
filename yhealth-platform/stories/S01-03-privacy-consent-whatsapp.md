---
type: story
id: S01.1.3
title: Privacy Consent & WhatsApp Enrollment
epic: E01
epic_name: Onboarding & Assessment
feature: F1.1
feature_name: Account Creation
product: yhealth-platform
priority: P0
status: In Progress
created: 2025-12-07
---

# S01.1.3: Privacy Consent & WhatsApp Enrollment

## User Story

**As a** new yHealth user,
**I want to** understand and consent to yHealth's privacy practices and optionally enroll my WhatsApp number,
**So that** I'm informed about data usage and can access yHealth via my preferred channel.

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
- Privacy policy summary displayed (skimmable, <100 words)
- Key privacy points highlighted:
  - "We use your data to personalize coaching"
  - "You control who sees your data"
  - "We never sell your information"
- Explicit consent checkboxes (required before proceeding):
  - Terms of Service (required) - links to full document
  - Privacy Policy (required) - links to full document
  - Email marketing updates (optional)
  - WhatsApp coaching consent (optional, if number provided)
- Optional WhatsApp number input with SMS verification
- WhatsApp verification: 6-digit code, 10-minute expiry
- GDPR compliance elements present (data export, deletion rights noted)

**Consent Flow:**
```
1. Privacy Summary Screen
   ↓
2. Consent Checkboxes
   ☑ I agree to Terms of Service (required)
   ☑ I agree to Privacy Policy (required)
   ☐ Email marketing updates (optional)
   ↓
3. WhatsApp Enrollment (Optional)
   - Enter phone number
   - Receive SMS verification code
   - Verify code (6 digits, 10-min expiry)
   ↓
4. Account Creation Complete
   - Welcome email sent within 5 minutes
```

**Data Captured:**

| Field | Required | Purpose |
|-------|----------|---------|
| ToS Consent | Yes | Legal compliance |
| Privacy Consent | Yes | Legal compliance |
| Email Marketing | No | Marketing communications |
| WhatsApp Number | No | Multi-channel coaching |
| WhatsApp Consent | If number provided | WhatsApp messaging |

---

## Acceptance Criteria

```gherkin
Scenario: Required consents
  Given a user on the consent screen
  When they check both required consent boxes and tap "Create Account"
  Then the account is created and user proceeds to assessment

Scenario: Missing consents
  Given a user attempts to proceed without checking required consents
  When they tap "Create Account"
  Then the button remains disabled with hint text

Scenario: WhatsApp verification
  Given a user enters a WhatsApp number
  When they request verification
  Then a 6-digit SMS code is sent within 30 seconds

Scenario: Verification code correct
  Given a user enters the correct verification code
  When they submit
  Then WhatsApp enrollment is confirmed

Scenario: Verification failures
  Given a user enters incorrect verification code 3 times
  When they fail third attempt
  Then they see option to resend code or skip

Scenario: Welcome email
  Given account creation completes
  When user sees confirmation
  Then welcome email arrives within 5 minutes
```

---

## Success Metrics

- Consent Completion: 100% (required to proceed)
<!-- - WhatsApp Enrollment: 60%+ at account creation OR within 7 days -->
- SMS Verification Success: 90%+
- Welcome Email Delivery: 99%+ within 5 minutes

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s SMS delivery | Rate limit SMS requests | GDPR compliant | Readable policy text | All markets |
| <5min welcome email | Phone number encrypted | Consent versioning | Screen reader support | |

---

## Dependencies

- **Prerequisite Stories:** S01.1.1 (account exists)
- **Related Stories:** S01.1.2 (consent follows social sign-in too)
- **External Dependencies:** SMS Service (Twilio), Email Service, WhatsApp Business API

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid phone number format | Inline validation before SMS attempt |
| SMS service unavailable | Allow skip, prompt to add WhatsApp later |
| User's phone blocks SMS | Suggest voice call verification alternative |
| Consent version updated after user signed up | Prompt re-consent on next login |

---

## Open Questions

- Voice call verification as SMS alternative?
- Consent re-prompt frequency when policies update

---

## Definition of Done

- [ ] Required consent checkboxes blocking progression when unchecked
- [ ] Full policy documents linked and accessible
- [ ] WhatsApp number input with format validation
- [ ] SMS verification working (6-digit, 10-min expiry)
- [ ] Consent timestamps recorded with policy version
- [ ] Welcome email sent within 5 minutes
- [ ] GDPR compliance: data export/deletion rights noted
- [ ] Skip option for WhatsApp enrollment

---

*Story S01.1.3 | Epic E01 | Product: yHealth Platform*
