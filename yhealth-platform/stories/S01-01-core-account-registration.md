---
type: story
id: S01.1.1
title: Core Account Registration
epic: E01
epic_name: Onboarding & Assessment
feature: F1.1
feature_name: Account Creation
product: yhealth-platform
priority: P0
status: Done
created: 2025-12-07
---

# S01.1.1: Core Account Registration

## User Story

**As a** new yHealth user,
**I want to** create an account with my email and basic profile information,
**So that** I can securely access yHealth and begin my personalized health journey.

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
- User enters email address with real-time format validation
- User creates password with strength indicator (weak/medium/strong)
- Password visibility toggle available
- User provides basic profile: First name, Last name, Date of Birth, Gender
- Date of Birth captured via date picker with automatic age calculation
- Gender options: Male, Female, Non-binary, Prefer not to say
- Age gate validates user is 18+ (blocks underage with clear message)
- Inline validation provides immediate feedback on all fields

**Data Captured:**

| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Email | standard@example.com | Valid format, unique, not disposable | Login only |
| Password | 8+ chars | Min 8 chars, 1 uppercase, 1 number, 1 special | Hashed (bcrypt) |
| First Name | Text | 2-50 characters | Display |
| Last Name | Text | 2-50 characters | Display |
| Date of Birth | YYYY-MM-DD | 18+ years required | Analytics only |
| Gender | Enum | Required selection | AI context only |

**UI Screens (Mobile Primary):**
- Screen 1: Email + Password entry
- Screen 2: Basic Profile (Name, DOB, Gender)
- Navigation: Progress indicator, back navigation supported

**Behaviors:**
- Form state persisted if user navigates away briefly
- "Show password" toggle for accessibility
- Disposable email addresses blocked with friendly message
- Duplicate email detection redirects to sign-in or password reset
- Network errors trigger auto-retry (3x) with local save

---

## Acceptance Criteria

```gherkin
Scenario: Successful registration
  Given a new user on the registration screen
  When they enter a valid email, strong password, and complete profile
  Then an account is created and user proceeds to consent flow

Scenario: Duplicate email
  Given a user enters an email already registered
  When they attempt to submit
  Then they see "This email is already registered. Sign in or reset password?"

Scenario: Age verification
  Given a user enters a date of birth showing age < 18
  When they submit
  Then registration is blocked with "yHealth is for users 18+."

Scenario: Password strength
  Given a user enters a weak password
  When they type
  Then the strength indicator shows "Weak" and suggests improvements

Scenario: Disposable email
  Given a user enters a disposable email domain
  When they submit
  Then they see "Please use a permanent email address"
```

---

## Success Metrics

- Completion Rate: 95%+ (started → account created)
- Time to Complete: <2 minutes
- Validation Error Rate: <5%
- Auto-retry Success: 95%+ on network errors

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s form load | bcrypt password hashing | Email not shared | 44x44pt tap targets | iOS 14+, Android 10+ |
| <500ms validation | Rate limiting on attempts | DOB analytics only | Screen reader labels | |

---

## Dependencies

- **Prerequisite Stories:** None (entry point)
- **Related Stories:** S01.1.2, S01.1.3
- **External Dependencies:** Email service (verification), Database (user table)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Network timeout during submit | Auto-retry 3x, show "Connection issue. Retrying..." |
| Email validation API unavailable | Allow submission, async validate later |
| User abandons mid-form | Save state locally, resume on return |
| Browser autofill conflicts | Accept autofill values, apply validation |

---

## Open Questions

- Confirm disposable email blocklist provider (e.g., Kickbox, ZeroBounce)
- Password requirements: confirm special character requirements with security team

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Error scenarios handled gracefully
- [ ] Password strength indicator functional
- [ ] Age gate validation working
- [ ] Email uniqueness check working
- [ ] Inline validation implemented
- [ ] Mobile UI responsive and accessible

---

*Story S01.1.1 | Epic E01 | Product: yHealth Platform*
