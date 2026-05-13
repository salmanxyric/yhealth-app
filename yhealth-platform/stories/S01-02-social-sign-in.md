---
type: story
id: S01.1.2
title: Social Sign-In
epic: E01
epic_name: Onboarding & Assessment
feature: F1.1
feature_name: Account Creation
product: yhealth-platform
priority: P0
status: Done
created: 2025-12-07
---

# S01.1.2: Social Sign-In

## User Story

**As a** new yHealth user,
**I want to** sign up using my Apple or Google account,
**So that** I can create an account quickly without managing another password.

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
- Social sign-in buttons prominently displayed on registration screen
- Apple Sign-In and Google Sign-In available
- One-tap authentication flow via OAuth 2.0
- Profile information auto-filled from social provider (name, email)
- User completes only missing required fields (DOB, Gender if not provided)
- Seamless redirect back to yHealth after authorization

**OAuth 2.0 Flow:**
1. User taps "Continue with Apple" or "Continue with Google"
2. Native OAuth dialog appears (ASWebAuthenticationSession iOS / Custom Tabs Android)
3. User authorizes yHealth to access basic profile
4. OAuth returns access token + profile data
5. yHealth creates account with provided data
6. User completes any missing required fields
7. Proceeds to consent flow (S01.1.3)

**Data Auto-Filled:**

| Provider | Data Provided | Required After |
|----------|---------------|----------------|
| Apple | Email, Name (if shared) | DOB, Gender |
| Google | Email, Name, Profile Photo | DOB, Gender |

**Behaviors:**
- If email already exists from prior social login, sign user in
- If email exists from email registration, prompt to link accounts
- "Hide My Email" (Apple) supported with relay handling
- Failed OAuth redirects user back with clear error message
- Token stored securely (Keychain iOS / Keystore Android)

---

## Acceptance Criteria

```gherkin
Scenario: Apple Sign-In
  Given a new user on the registration screen
  When they tap "Continue with Apple" and authorize
  Then an account is created with Apple profile data

Scenario: Google Sign-In
  Given a new user on the registration screen
  When they tap "Continue with Google" and authorize
  Then an account is created with Google profile data

Scenario: Existing account
  Given a user whose social email already exists in yHealth
  When they complete OAuth
  Then they are signed in to existing account

Scenario: Authorization cancelled
  Given a user denies OAuth authorization
  When redirect occurs
  Then user returns to registration screen with "Authorization cancelled" message

Scenario: OAuth failure
  Given OAuth redirect fails or times out
  When error detected
  Then user sees "Connection failed. Check your internet and try again."
```

---

## Success Metrics

- Social Sign-In Adoption: 40%+ of new registrations
- OAuth Success Rate: 95%+
- Time to Complete: <1 minute (including any missing fields)

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s OAuth round-trip | OAuth 2.0 PKCE | Only request needed scopes | VoiceOver support | Apple Sign-In (iOS 13+) |
| Native auth dialogs | Secure token storage | No profile photo stored | | Google Identity (Android 5+) |

---

## Dependencies

- **Prerequisite Stories:** S01.1.1 (shared UI components, user schema)
- **Related Stories:** S01.1.3
- **External Dependencies:** Apple Sign-In API, Google Identity API

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| User has "Hide My Email" enabled (Apple) | Accept relay email, handle normally |
| Google account lacks name | Prompt user to enter name manually |
| OAuth token refresh fails | Prompt re-authentication on next sign-in |
| Social account linked to different yHealth account | Explain conflict, offer to switch accounts |

---

## Open Questions

- Support Facebook Login in future? (excluded from MVP)
- Account linking flow for existing email users wanting to add social

---

## Definition of Done

- [ ] Apple Sign-In working on iOS
- [ ] Google Sign-In working on iOS and Android
- [ ] Profile auto-fill functional
- [ ] Missing field completion flow working
- [ ] Token storage secure
- [ ] Error handling for all OAuth failure modes
- [ ] Account linking/duplicate detection working

---

*Story S01.1.2 | Epic E01 | Product: yHealth Platform*
