---
type: story
id: S01.4.2
title: OAuth Connection Flow
epic: E01
epic_name: Onboarding & Assessment
feature: F1.4
feature_name: Integration Setup
product: yhealth-platform
priority: P0
status: In Progress
created: 2025-12-07
---

# S01.4.2: OAuth Connection Flow

## User Story

**As a** new yHealth user connecting an integration,
**I want to** securely authorize yHealth to access my health data through a clear OAuth flow,
**So that** my wearable data syncs automatically without compromising my credentials.

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
- Clear explanation of what data will be synced before OAuth
- What we sync vs. what we don't (transparency)
- Native OAuth dialog (ASWebAuthenticationSession / Custom Tabs)
- Redirect back to yHealth after authorization
- Confirmation of successful connection
- Token stored securely (Keychain/Keystore)

**OAuth Flow (Example: WHOOP):**
```
1. User taps "Connect WHOOP"
   ↓
2. Permission explanation screen:
   "We'll sync your WHOOP data including:
    ✓ Daily Strain scores
    ✓ Recovery scores
    ✓ Sleep performance
    ✓ Heart Rate Variability (HRV)

    We won't access: Your WHOOP journal entries (private)

    [Authorize WHOOP] [Cancel]"
   ↓
3. Redirect to WHOOP OAuth page (native dialog)
   ↓
4. User logs into WHOOP, grants permissions
   ↓
5. Redirect back to yHealth with access token
   ↓
6. Confirmation: "✓ WHOOP Connected! Syncing your last 30 days..."
```

**OAuth Scopes Per Integration:**

| Integration | Scopes Requested | Justification |
|-------------|-----------------|---------------|
| WHOOP | read:recovery, read:sleep, read:workout, read:cycles | Core fitness/recovery |
| Apple Health | activity, workouts, heart_rate, sleep_analysis | Comprehensive tracking |
| Fitbit | activity, heartrate, sleep, profile | Fitness and sleep |
| MyFitnessPal | diary, nutrition | Food logs |
| Strava | read:all, activity:read | GPS activities |

**Token Management:**
- Access tokens stored encrypted (Keychain iOS / Keystore Android)
- Refresh tokens stored separately
- Auto-refresh before expiration
- Re-authorization prompt if refresh fails

---

## Acceptance Criteria

```gherkin
Scenario: Permission explanation
  Given user taps "Connect" on an integration
  When permission screen displays
  Then clear explanation of synced data is shown

Scenario: Successful OAuth
  Given user taps "Authorize"
  When OAuth flow completes successfully
  Then user returns to yHealth with confirmation message

Scenario: Authorization denied
  Given user denies OAuth authorization
  When redirect occurs
  Then user sees "Authorization cancelled. Try again or use another integration."

Scenario: OAuth failure
  Given OAuth redirect fails
  When error detected
  Then user sees troubleshooting options and retry button

Scenario: Token persistence
  Given token is stored
  When user closes and reopens app
  Then integration remains connected without re-authorization

Scenario: Token refresh
  Given token expires
  When refresh is needed
  Then auto-refresh occurs silently (or re-auth prompt if fails)
```

---

## Success Metrics

- OAuth Success Rate: 95%+
- Authorization Denial Rate: <10%
- Token Refresh Success: 99%+
- Time to Connect: <60 seconds per integration

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s OAuth round-trip | OAuth 2.0 PKCE | Minimal scope requests | Clear permission text | iOS 13+, Android 5+ |
| Native dialogs | Encrypted token storage | - | - | |

---

## Dependencies

- **Prerequisite Stories:** S01.4.1 (integration selected)
- **Related Stories:** S01.4.3
- **External Dependencies:** 10 third-party OAuth APIs

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| OAuth timeout | "Connection timed out. Check internet and retry." |
| Invalid/expired authorization code | Restart OAuth flow |
| User revokes access externally | Detect on next sync, prompt re-auth |
| Rate limit hit during OAuth | Queue and retry with backoff |

---

## Open Questions

- PKCE implementation details per provider

---

## Definition of Done

- [ ] OAuth flows working for all 10 integrations
- [ ] Permission explanations displayed before OAuth
- [ ] Token storage secure (Keychain/Keystore)
- [ ] Refresh token logic implemented
- [ ] Error handling for all failure modes
- [ ] Re-authorization flow for expired/revoked tokens

---

*Story S01.4.2 | Epic E01 | Product: yHealth Platform*
