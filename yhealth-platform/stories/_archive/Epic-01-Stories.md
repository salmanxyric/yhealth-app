# Epic 01: Onboarding & Assessment - User Stories

> **Epic:** E01 - Onboarding & Assessment
> **Source:** `prd-epics/PRD-Epic-01-Onboarding-Assessment.md`
> **Created:** 2025-12-07
> **Stories:** 15 (12 Must Have, 3 Should Have)

---

## Story Index

| Story ID | Title | Feature | Priority | Status |
|----------|-------|---------|----------|--------|
| S01.1.1 | Core Account Registration | F1.1 | P0 (Must) | Draft |
| S01.1.2 | Social Sign-In | F1.1 | P0 (Must) | Draft |
| S01.1.3 | Privacy Consent & WhatsApp Enrollment | F1.1 | P0 (Must) | Draft |
| S01.2.1 | Goal Discovery | F1.2 | P0 (Must) | Draft |
| S01.2.2 | Quick Assessment Path | F1.2 | P0 (Must) | Draft |
| S01.2.3 | Deep Assessment Path | F1.2 | P1 (Should) | Draft |
| S01.3.1 | AI-Guided Goal Setup | F1.3 | P0 (Must) | Draft |
| S01.3.2 | Goal Validation & Commitment | F1.3 | P0 (Must) | Draft |
| S01.4.1 | Integration Discovery & Selection | F1.4 | P0 (Must) | Draft |
| S01.4.2 | OAuth Connection Flow | F1.4 | P0 (Must) | Draft |
| S01.4.3 | Data Sync & Conflict Resolution | F1.4 | P0 (Must) | Draft |
| S01.5.1 | Engagement & Notification Preferences | F1.5 | P0 (Must) | Draft |
| S01.5.2 | Coaching Style & Channel Preferences | F1.5 | P1 (Should) | Draft |
| S01.6.1 | Plan Generation Engine | F1.6 | P0 (Must) | Draft |
| S01.6.2 | Plan Presentation & Adjustment | F1.6 | P0 (Must) | Draft |

---

## Dependency Diagram

```
PHASE 1: ACCOUNT FOUNDATION
S01.1.1 ──┬──► S01.1.2 (Social Sign-In)
          └──► S01.1.3 (Privacy & WhatsApp)
                  │
                  ▼
PHASE 2: ASSESSMENT
S01.2.1 ──┬──► S01.2.2 (Quick Path)
          └──► S01.2.3 (Deep Path)
                  │
                  ▼
PHASE 3: GOAL SETTING
S01.3.1 ────► S01.3.2
                  │
                  ▼
PHASE 4: INTEGRATIONS
S01.4.1 ────► S01.4.2 ────► S01.4.3
                              │
                              ▼
PHASE 5: PREFERENCES
S01.5.1 ────► S01.5.2
                  │
                  ▼
PHASE 6: PLAN GENERATION
S01.6.1 ────► S01.6.2
```

---

## Feature → Story Coverage Matrix

| Epic Feature | Story ID(s) | Coverage |
|--------------|-------------|----------|
| F1.1 Account Creation | S01.1.1, S01.1.2, S01.1.3 | 100% |
| F1.2 Flexible Assessment | S01.2.1, S01.2.2, S01.2.3 | 100% |
| F1.3 Goal Setting & Refinement | S01.3.1, S01.3.2 | 100% |
| F1.4 Integration Setup | S01.4.1, S01.4.2, S01.4.3 | 100% |
| F1.5 Preference Configuration | S01.5.1, S01.5.2 | 100% |
| F1.6 Personalized Plan Generation | S01.6.1, S01.6.2 | 100% |

---

# FEATURE 1.1: ACCOUNT CREATION

---

## S01.1.1: Core Account Registration

### User Story
**As a** new yHealth user,
**I want to** create an account with my email and basic profile information,
**So that** I can securely access yHealth and begin my personalized health journey.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

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

### Acceptance Criteria
Given a new user on the registration screen,
When they enter a valid email, strong password, and complete profile,
Then an account is created and user proceeds to consent flow.

Given a user enters an email already registered,
When they attempt to submit,
Then they see "This email is already registered. Sign in or reset password?"

Given a user enters a date of birth showing age < 18,
When they submit,
Then registration is blocked with "yHealth is for users 18+. Contact support@yhealth.com for assistance."

Given a user enters a weak password,
When they type,
Then the strength indicator shows "Weak" and suggests improvements in real-time.

Given a user enters a disposable email domain,
When they submit,
Then they see "Please use a permanent email address (no temporary emails)."

### Success Metrics
- Completion Rate: 95%+ (started → account created)
- Time to Complete: <2 minutes
- Validation Error Rate: <5%
- Auto-retry Success: 95%+ on network errors

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s form load | bcrypt password hashing | Email not shared | 44x44pt tap targets | iOS 14+, Android 10+ |
| <500ms validation | Rate limiting on attempts | DOB analytics only | Screen reader labels | |

### Dependencies
- Prerequisite Stories: None (entry point)
- Related Stories: S01.1.2, S01.1.3
- External Dependencies: Email service (verification), Database (user table)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Network timeout during submit | Auto-retry 3x, show "Connection issue. Retrying..." |
| Email validation API unavailable | Allow submission, async validate later |
| User abandons mid-form | Save state locally, resume on return |
| Browser autofill conflicts | Accept autofill values, apply validation |

### Open Questions
- Confirm disposable email blocklist provider (e.g., Kickbox, ZeroBounce)
- Password requirements: confirm special character requirements with security team

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Error scenarios handled gracefully
- [ ] Password strength indicator functional
- [ ] Age gate validation working
- [ ] Email uniqueness check working
- [ ] Inline validation implemented
- [ ] Mobile UI responsive and accessible

---

## S01.1.2: Social Sign-In

### User Story
**As a** new yHealth user,
**I want to** sign up using my Apple or Google account,
**So that** I can create an account quickly without managing another password.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

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

### Acceptance Criteria
Given a new user on the registration screen,
When they tap "Continue with Apple" and authorize,
Then an account is created with Apple profile data and user proceeds to complete DOB/Gender.

Given a new user on the registration screen,
When they tap "Continue with Google" and authorize,
Then an account is created with Google profile data and user proceeds to complete DOB/Gender.

Given a user whose social email already exists in yHealth,
When they complete OAuth,
Then they are signed in to existing account (not duplicate created).

Given a user denies OAuth authorization,
When redirect occurs,
Then user returns to registration screen with "Authorization cancelled. Try again or use email."

Given OAuth redirect fails or times out,
When error detected,
Then user sees "Connection failed. Check your internet and try again." with retry button.

### Success Metrics
- Social Sign-In Adoption: 40%+ of new registrations
- OAuth Success Rate: 95%+
- Time to Complete: <1 minute (including any missing fields)

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s OAuth round-trip | OAuth 2.0 PKCE | Only request needed scopes | VoiceOver support | Apple Sign-In (iOS 13+) |
| Native auth dialogs | Secure token storage | No profile photo stored | | Google Identity (Android 5+) |

### Dependencies
- Prerequisite Stories: S01.1.1 (shared UI components, user schema)
- Related Stories: S01.1.3
- External Dependencies: Apple Sign-In API, Google Identity API

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User has "Hide My Email" enabled (Apple) | Accept relay email, handle normally |
| Google account lacks name | Prompt user to enter name manually |
| OAuth token refresh fails | Prompt re-authentication on next sign-in |
| Social account linked to different yHealth account | Explain conflict, offer to switch accounts |

### Open Questions
- Support Facebook Login in future? (excluded from MVP)
- Account linking flow for existing email users wanting to add social

### Definition of Done
- [ ] Apple Sign-In working on iOS
- [ ] Google Sign-In working on iOS and Android
- [ ] Profile auto-fill functional
- [ ] Missing field completion flow working
- [ ] Token storage secure
- [ ] Error handling for all OAuth failure modes
- [ ] Account linking/duplicate detection working

---

## S01.1.3: Privacy Consent & WhatsApp Enrollment

### User Story
**As a** new yHealth user,
**I want to** understand and consent to yHealth's privacy practices and optionally enroll my WhatsApp number,
**So that** I'm informed about data usage and can access yHealth via my preferred channel.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

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

**Behaviors:**
- Cannot proceed without required consents
- Consent timestamp and version recorded for compliance
- WhatsApp verification allows retry and skip options
- WhatsApp can be added later in preferences (F1.5)
- Welcome email triggered immediately upon account completion
- Collapsible full policy text available for those who want detail

### Acceptance Criteria
Given a user on the consent screen,
When they check both required consent boxes and tap "Create Account",
Then the account is created and user proceeds to assessment.

Given a user attempts to proceed without checking required consents,
When they tap "Create Account",
Then the button remains disabled with hint text explaining required checkboxes.

Given a user enters a WhatsApp number,
When they request verification,
Then a 6-digit SMS code is sent within 30 seconds.

Given a user enters the correct verification code,
When they submit,
Then WhatsApp enrollment is confirmed and stored.

Given a user enters incorrect verification code 3 times,
When they fail third attempt,
Then they see option to resend code or skip WhatsApp enrollment.

<!-- Given WhatsApp SMS delivery fails,
When timeout detected (60 seconds),
Then user sees "Couldn't verify number. Try again or skip for now." -->

Given account creation completes,
When user sees confirmation,
Then welcome email arrives within 5 minutes.

### Success Metrics
- Consent Completion: 100% (required to proceed)
<!-- - WhatsApp Enrollment: 60%+ at account creation OR within 7 days -->
- SMS Verification Success: 90%+
- Welcome Email Delivery: 99%+ within 5 minutes

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s SMS delivery | Rate limit SMS requests | GDPR compliant | Readable policy text | All markets |
| <5min welcome email | Phone number encrypted | Consent versioning | Screen reader support | |

### Dependencies
- Prerequisite Stories: S01.1.1 (account exists)
- Related Stories: S01.1.2 (consent follows social sign-in too)
- External Dependencies: SMS Service (Twilio), Email Service, WhatsApp Business API

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid phone number format | Inline validation before SMS attempt |
| SMS service unavailable | Allow skip, prompt to add WhatsApp later |
| User's phone blocks SMS | Suggest voice call verification alternative |
| Consent version updated after user signed up | Prompt re-consent on next login |

### Open Questions
- Voice call verification as SMS alternative?
- Consent re-prompt frequency when policies update

### Definition of Done
- [ ] Required consent checkboxes blocking progression when unchecked
- [ ] Full policy documents linked and accessible
<!-- - [ ] WhatsApp number input with format validation -->
<!-- - [ ] SMS verification working (6-digit, 10-min expiry) -->
- [ ] Consent timestamps recorded with policy version
- [ ] Welcome email sent within 5 minutes
- [ ] GDPR compliance: data export/deletion rights noted
- [ ] Skip option for WhatsApp enrollment

---

# FEATURE 1.2: FLEXIBLE ASSESSMENT

---

## S01.2.1: Goal Discovery

### User Story
**As a** new yHealth user who just created an account,
**I want to** tell yHealth what my primary health goal is,
**So that** subsequent assessment questions are relevant to my specific objectives.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Goal discovery is the first assessment step after account creation
- User presented with structured goal options plus custom input
- Single primary goal selection (can refine later in F1.3)
- Goal selection determines question routing for Quick/Deep paths
- Clear value proposition: "Helps us ask the right questions"

**Goal Options:**
```
What brings you to yHealth today? What's your main health goal?

□ Lose weight and improve body composition
□ Build muscle and strength
□ Improve sleep quality and recovery
□ Reduce stress and improve mental wellness
□ Boost daily energy and productivity
□ Train for a specific event (marathon, competition, etc.)
□ Manage a health condition (with doctor's guidance)
□ Build sustainable healthy habits
□ Optimize overall health and performance
□ Other (custom input)
```

**Custom Goal Input:**
- If "Other" selected, free-text input appears
- AI categorizes custom goal to closest category for question routing
- Original text preserved for F1.3 refinement

**Question Routing Logic:**
| Goal Category | Primary Assessment Focus |
|---------------|-------------------------|
| Weight Loss | Body composition, diet history, emotional eating |
| Muscle Building | Training experience, protein intake, recovery |
| Sleep Improvement | Sleep patterns, bedtime routine, environment |
| Stress/Wellness | Stressors, coping mechanisms, mindfulness |
| Energy | Energy patterns, caffeine, sleep quality |
| Event Training | Event details, timeline, current fitness |
| Health Condition | Condition specifics, medications, doctor guidance |
| Habit Building | Target habits, past attempts, accountability |

### Acceptance Criteria
Given a user on the goal discovery screen,
When they select a structured goal option,
Then the selection is saved and user proceeds to assessment path choice.

Given a user selects "Other",
When they enter custom text and submit,
Then the custom goal is saved and AI categorizes it for routing.

Given a user has selected a goal,
When they proceed to assessment,
Then questions shown are relevant to their selected goal category.

Given a user wants to change their goal selection,
When they tap "Back" or edit selection,
Then they can modify their choice before proceeding.

### Success Metrics
- Goal Selection Rate: 99%+ (required to proceed)
- Custom Goal Usage: 10-15% (healthy diversity, not confusion)
- Goal Relevance: 95%+ users feel questions match their goal (survey)

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s selection response | - | Goal stored privately | Large tap targets | All devices |
| Instant routing | - | - | VoiceOver labels | |

### Dependencies
- Prerequisite Stories: S01.1.3 (account complete)
- Related Stories: S01.2.2, S01.2.3, S01.3.1
- External Dependencies: AI categorization for custom goals

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User selects multiple goals accidentally | Single-select enforced (radio buttons) |
| Custom goal text empty | Require minimum 5 characters |
| AI cannot categorize custom goal | Default to "Habit Building" routing |

### Open Questions
- Allow multiple primary goals? (Decision: No, single primary, supporting goals in F1.3)

### Definition of Done
- [ ] All 10 goal options displayed clearly
- [ ] Single-select enforced
- [ ] Custom goal input working
- [ ] AI categorization for custom goals functional
- [ ] Goal saved to user profile
- [ ] Routing logic connecting to assessment paths

---

## S01.2.2: Quick Assessment Path

### User Story
**As a** new yHealth user who selected my primary goal,
**I want to** complete a quick, structured health assessment,
**So that** I can get my personalized plan without spending too much time upfront.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- 8-12 targeted questions based on goal selection
- Structured questionnaire format (no open-ended responses)
- Progress indicator showing "Step X of Y" and estimated time remaining
- Smart defaults pre-selected for common answers
- <5 minute total completion time
- Mobile-optimized with large tap targets
- Summary review screen before finalizing

**Question Types:**
- Single-select (radio buttons)
- Multi-select (checkboxes)
- Sliders (numeric scales 1-10)
- Emoji scales (mood/energy)
- Date pickers (for timelines)
- Number inputs (height, weight)

**Screen Flow (8-10 screens):**
1. **Goal Confirmation** (from S01.2.1)
2. **Body Stats** (if relevant): Height, weight, target weight
3. **Activity Level**: Slider 0-7 days/week
4. **Nutrition Habits**: Multi-select (tracking, meal prep, dining out)
5. **Sleep Quality**: Emoji scale (1-10)
6. **Stress Level**: Emoji scale (1-10)
7. **Dietary Preferences**: Checkboxes (vegan, keto, allergies)
8. **Past Attempts**: Multi-select (diets tried, apps used)
9. **Biggest Challenge**: Single-select (time, motivation, knowledge, consistency)
10. **Summary Review**: Edit any answer before proceeding

**Cross-Pillar Baseline (Asked Regardless of Goal):**
| Pillar | Questions |
|--------|-----------|
| Fitness | Activity days/week, primary activities, wearable owned |
| Nutrition | Meals/day, cooking frequency, hydration |
| Wellbeing | Mood rating, stress level, sleep quality, mindfulness practice |

**Smart Defaults:**
- Country: Auto-detect from device locale
- Units: Imperial (US) or Metric (other) based on locale
- Common selections pre-highlighted where data supports

### Acceptance Criteria
Given a user starting Quick Assessment,
When they answer all questions and submit,
Then assessment completes in <5 minutes and data is saved.

Given a user is on any question screen,
When they view the progress indicator,
Then they see "Step X of Y" and estimated time remaining.

Given a user completes all questions,
When they reach the summary screen,
Then they can edit any answer before finalizing.

Given a user skips optional questions,
When they proceed,
Then the skip is recorded and assessment continues.

Given a user wants to switch to Deep Assessment,
When they tap "Switch to conversational mode",
Then they transition to Deep path with data preserved.

Given a user exits mid-assessment,
When they return to yHealth,
Then their progress is restored automatically.

### Success Metrics
- Completion Rate: 90%+
- Time to Complete: <5 minutes (95% of users)
- Mode Selection: 60% choose Quick path
- Data Richness: 8/10 average completeness score

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <500ms per screen | Data encrypted in transit | Health data protected | 44x44pt tap targets | iOS 14+, Android 10+ |
| Real-time save | - | - | Screen reader support | |

### Dependencies
- Prerequisite Stories: S01.2.1 (goal selected)
- Related Stories: S01.2.3, S01.3.1
- External Dependencies: None

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User abandons mid-assessment | Auto-save, send reminder via WhatsApp/email |
| Network error during save | Local cache, sync on reconnection |
| Invalid numeric input | Inline validation with bounds checking |
| User skips too many questions | Block completion, explain minimum requirements |

### Open Questions
- Minimum questions required for plan generation (target: 6)

### Definition of Done
- [ ] 8-12 questions implemented per goal category
- [ ] Progress indicator functional
- [ ] Smart defaults working
- [ ] Summary review screen implemented
- [ ] Auto-save on each answer
- [ ] Mode switch to Deep path working
- [ ] <5 minute completion verified
- [ ] Cross-pillar baseline captured

---

## S01.2.3: Deep Assessment Path

### User Story
**As a** new yHealth user who wants comprehensive personalization,
**I want to** have a natural conversation with the AI about my health goals and history,
**So that** yHealth deeply understands my context, motivations, and challenges.

### Story Type
- [x] Feature

### Priority
- [x] Should Have (P1)

### Scope Description

**User Experience:**
- AI-guided conversational assessment (10-15 minutes)
- Natural dialogue flow, not robotic question lists
- AI asks follow-up questions based on responses
- Emotional intelligence: validates struggles, celebrates honesty
- User can type or use voice input
- Progress indicator shows estimated time remaining
- Can switch to Quick mode at any point

**AI Conversation Flow:**
```
AI: "Welcome! I'm here to help you become the best version of yourself.
     What's the main thing you want to improve about your health right now?"

User: "I want to lose weight. I've tried a lot but nothing sticks."

AI: "I hear you - that's frustrating. What have you tried before,
     and what made it hard to stick with?"

User: "Keto, intermittent fasting... work stress makes me snack a lot."

AI: "Stress-eating is so common. When you're stressed, what do you
     typically reach for? Sweet, salty, or just whatever's nearby?"

[Conversation continues naturally...]
```

**AI Personality & Tone:**
- Warm, empathetic, non-judgmental coach
- Curious and reflective (not interrogative)
- Celebrates honesty: "Thanks for sharing that - it helps me personalize better"
- Validates struggles: "That's a common challenge - you're not alone"
- Appropriate use of emoji (minimal, supportive)

**Adaptive Depth Control:**
- If user gives short answers → Offer to switch to Quick mode
- If user gives detailed stories → Continue open-ended exploration
- Progress indicator updates dynamically based on conversation length

**Data Captured:**
- Full conversation transcript (for future reference)
- Extracted insights:
  - Past attempts and why they failed
  - Emotional relationship with food/exercise
  - Daily routine and constraints
  - Support system and environment
  - Intrinsic motivations (deeper "why")

### Acceptance Criteria
Given a user selecting Deep Assessment,
When they engage in conversation with AI,
Then the conversation feels natural and personalized to their responses.

Given a user provides short, minimal responses,
When AI detects pattern (3+ short answers),
Then AI offers: "Want to try quick questions instead? Faster and easier."

Given a user shares emotional/sensitive information,
When AI responds,
Then the response is empathetic and non-judgmental.

Given a user types an unrealistic goal,
When AI detects it,
Then AI gently reality-checks: "That's ambitious! What's driving this timeline?"

Given a user wants to switch to Quick Assessment,
When they request it,
Then transition occurs with conversation data preserved.

Given Deep Assessment completes,
When user finishes,
Then conversation transcript and extracted insights are saved.

### Success Metrics
- Completion Rate: 85%+ (slightly lower than Quick due to time investment)
- Time to Complete: 10-15 minutes (on target)
- Mode Selection: 40% choose Deep path
- User Satisfaction: 4.6/5 ("Assessment felt relevant to my goals")
- AI Data Richness: 9/10 average insight quality

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s AI response time | Transcript encrypted | Conversation private | Voice input option | All devices |
| Real-time streaming | - | Never shared externally | - | |

### Dependencies
- Prerequisite Stories: S01.2.1 (goal selected)
- Related Stories: S01.2.2 (mode switch), S01.3.1
- External Dependencies: AI Conversation Engine (GPT-4/Claude)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| AI generates inappropriate response | Content filter blocks, fallback to neutral response |
| User types harmful content | Flag for review, continue supportively |
| AI response timeout | Show "Thinking..." then retry |
| User idle for 2+ minutes | Gentle prompt: "Still there? Take your time." |

### Open Questions
- Voice input quality requirements
- Transcript retention policy (user can delete?)

### Definition of Done
- [ ] AI conversation engine integrated
- [ ] Natural follow-up question logic implemented
- [ ] Emotion detection and empathetic responses working
- [ ] Adaptive depth control functional
- [ ] Mode switch to Quick preserves data
- [ ] Conversation transcript saved
- [ ] Insight extraction from transcript working
- [ ] 10-15 minute target achievable

---

# FEATURE 1.3: GOAL SETTING & REFINEMENT

---

## S01.3.1: AI-Guided Goal Setup

### User Story
**As a** new yHealth user who completed assessment,
**I want to** receive AI-suggested SMART goals based on my assessment and refine them with AI guidance,
**So that** I start with clear, achievable targets tailored to my situation.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- AI suggests 2-3 goals based on assessment data (not generic templates)
- Primary goal (Fitness/Nutrition/Wellbeing) + supporting goals
- SMART format: Specific, Measurable, Achievable, Relevant, Time-bound
- User can edit every aspect: timeline, target, metrics
- Goals include "why it matters" motivation anchor
- Milestone breakdown: 30/60/90-day targets
- Light mode: Guided setup (5 min) - Accept/edit AI suggestions
- Deep mode: Collaborative refinement (10-15 min) - AI explores "why" deeper

**AI Goal Suggestion Example:**
```
Based on your goal to lose weight and improve energy, here are my recommendations:

Primary Goal (Fitness):
🎯 Lose 20 lbs in 4 months (5 lbs/month - sustainable pace)
   Why this matters: Wedding in June, want to feel confident
   Success rate: 78% of users with similar profile achieve this

Supporting Goal (Nutrition):
🍽️ Track meals 6 days/week for 90 days
   Why: Food awareness is the #1 factor in weight loss

Supporting Goal (Wellbeing):
😌 Improve sleep quality from 5/10 to 7/10 in 60 days
   Why: Your assessment showed low energy + poor sleep - they're connected

[Edit Goals] [Looks Good, Continue]
```

**Editable Parameters:**
- Target value (e.g., 20 lbs → 25 lbs)
- Timeline (slider: faster/slower)
- Metric type (weight vs body fat %)
- Supporting goal priorities
- Motivation statement (why it matters)

**Milestone Generation:**
- AI auto-generates 30-day milestones based on goal and timeline
- User can adjust milestone targets
- Example: Month 1: 5 lbs | Month 2: 10 lbs | Month 3: 15 lbs | Month 4: 20 lbs

### Acceptance Criteria
Given assessment data is available,
When user reaches goal setup,
Then AI suggests 2-3 personalized goals (not generic templates).

Given AI suggests goals,
When user taps "Edit Goals",
Then they can modify timeline, target, and all goal parameters.

Given user adjusts a goal,
When they change timeline or target,
Then AI validates the change and explains trade-offs if needed.

Given goals are finalized,
When user confirms,
Then milestones are auto-generated at 30/60/90 day markers.

Given user is in Light mode,
When they accept AI suggestions without edits,
Then goal setup completes in <5 minutes.

Given user is in Deep mode,
When they engage with AI refinement,
Then AI explores deeper motivations and adjusts goals accordingly.

### Success Metrics
- SMART Compliance: 95%+ goals meet all SMART criteria
- User Confidence: 80%+ rate confidence ≥7/10 in their goals
- Goal Clarity Score: 9/10 average (AI-assessed specificity)
- Emotional Resonance: 90%+ goals include "why it matters" statement

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5s goal generation | - | Goals private | Clear goal display | All devices |
| Real-time validation | - | - | Editable via voice | |

### Dependencies
- Prerequisite Stories: S01.2.2 or S01.2.3 (assessment complete)
- Related Stories: S01.3.2, S01.6.1
- External Dependencies: AI Coaching Engine

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Assessment data incomplete | Generate goals with available data, flag gaps |
| User sets conflicting goals | AI explains trade-off, force prioritization |
| User sets vague goal | AI prompts for specificity: "How much, by when?" |
| No primary goal set | Block proceeding, require at least one |

### Open Questions
- Maximum number of active goals? (Suggest: 1 primary + 2 supporting)

### Definition of Done
- [ ] AI goal suggestion based on assessment data
- [ ] SMART goal format enforced
- [ ] All goal parameters editable
- [ ] Milestone auto-generation working
- [ ] Trade-off explanations for aggressive changes
- [ ] Light mode <5 min completion
- [ ] Deep mode AI dialogue functional
- [ ] "Why it matters" captured for each goal

---

## S01.3.2: Goal Validation & Commitment

### User Story
**As a** new yHealth user finalizing my goals,
**I want to** have my goals validated for safety and realism, and commit with confidence,
**So that** I start with goals that are healthy, achievable, and I'm emotionally invested in.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- AI validates all goals against safety guardrails before finalization
- Medical condition flags trigger disclaimers and conservative adjustments
- User rates confidence (1-10) for each goal
- Low confidence (<7) triggers refinement conversation
- Final commitment screen with motivation anchor
- Goals can be edited anytime from settings (noted clearly)

**Safety Guardrails:**
| Goal Type | Safety Check | AI Action if Unsafe |
|-----------|--------------|---------------------|
| Weight Loss | >2 lbs/week average | Suggest slower pace, explain risks |
| Calorie Target | <1200 kcal (women) / <1500 (men) | Flag as too low, recommend TDEE-based |
| Exercise Frequency | >6 days/week, no rest | Recommend rest days, explain recovery |
| Sleep Target | <6 hours/night | Educate on health risks, suggest 7-9 |
| Extreme Timelines | Any goal with <4 weeks to drastic change | Extend timeline, explain sustainability |

**Medical Condition Handling:**
- If user disclosed conditions (diabetes, heart disease, eating disorder history):
  - AI adds disclaimer: "Since you mentioned [condition], please confirm with your doctor before starting."
  - Offer to email goal summary to share with provider
  - Adjust recommendations conservatively

**Commitment Flow:**
```
Your Goals Are Set! 🎯

PRIMARY GOAL (Fitness):
Lose 20-30 lbs in 6 months
Why it matters: "I want to feel confident at my wedding and have energy to enjoy it."

SUPPORTING GOALS:
✓ Nutrition: Track meals 6 days/week
✓ Wellbeing: Journal 3x/week to manage stress

FIRST MILESTONE (30 days):
- Lose 5 lbs
- Establish 3-day/week exercise habit
- Hit 80% food tracking consistency

How committed are you to these goals? [1━━━━━━━━━━10]

[Looks Great!] [Edit Goals]
```

**Confidence Handling:**
- If <7/10: "I'm sensing some hesitation. What's holding you back? Let's adjust until you're at an 8 or higher."
- If ≥7/10: "Love that confidence! I'll check in with you in 30 days to see how we're tracking."

### Acceptance Criteria
Given user has finalized goals,
When goals violate safety guardrails,
Then AI flags the issue and suggests safer alternatives.

Given user disclosed a medical condition,
When they finalize goals,
Then a disclaimer appears recommending doctor consultation.

Given user rates confidence,
When confidence is <7/10,
Then AI prompts to explore hesitation and adjust goals.

Given user confirms goals with confidence ≥7/10,
When they tap "Looks Great!",
Then goals are saved with commitment timestamp and user proceeds.

Given goals are saved,
When user wants to edit later,
Then they can access goals from settings at any time.

Given an unsafe goal is detected,
When user tries to override,
Then they can proceed with explicit acknowledgment of risk.

### Success Metrics
- Realistic Pacing: <5% goals flagged as unsafe/unsustainable
- User Confidence: 80%+ commit with ≥7/10 confidence
- Medical Disclaimer Display: 100% when conditions disclosed
- Goal Edit Rate: 30%+ adjust within first 30 days (healthy iteration)

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s validation | Medical data encrypted | Conditions never shared | Clear warning display | All devices |
| - | - | - | Adjustable slider | |

### Dependencies
- Prerequisite Stories: S01.3.1 (goals created)
- Related Stories: S01.6.1
- External Dependencies: None

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User overwhelmed by too many goals | AI suggests focus: "Start with 1-2 for first month?" |
| All goals flagged as unsafe | Block until at least one safe goal created |
| User skips confidence rating | Default to 5/10, suggest revisiting |
| Medical condition not disclosed but unsafe goal set | General safety warning without specific condition reference |

### Open Questions
- Email goal summary to doctor integration (future feature?)

### Definition of Done
- [ ] Safety guardrail validation implemented
- [ ] Medical condition disclaimers displayed
- [ ] Confidence rating (1-10) functional
- [ ] Low confidence triggers refinement dialogue
- [ ] Final commitment screen with motivation anchor
- [ ] Goals editable from settings
- [ ] Override with acknowledgment for unsafe goals

---

# FEATURE 1.4: INTEGRATION SETUP

---

## S01.4.1: Integration Discovery & Selection

### User Story
**As a** new yHealth user who just set my goals,
**I want to** see what wearables and apps I can connect and understand the value of each,
**So that** I can choose which integrations to set up based on my existing devices.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

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

### Acceptance Criteria
Given user reaches integration setup,
When screen loads,
Then nearby/paired devices are auto-detected and displayed.

Given integrations are displayed,
When user views each option,
Then clear value proposition is shown for that integration.

Given user selects 0 integrations,
When they try to proceed,
Then they are blocked with message explaining minimum requirement.

Given user selects 1+ integrations,
When they tap "Continue",
Then they proceed to OAuth connection flow (S01.4.2).

Given user wants to skip temporarily,
When they tap "Skip",
Then they understand they must return to add integration before plan generation.

### Success Metrics
- Integration Discovery Completion: 95%+
- Auto-Detection Accuracy: 90%+ (detects owned devices)
- Value Message Engagement: 60%+ tap to learn more
- Minimum Requirement Compliance: 100%

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s device detection | Bluetooth permissions | No data before consent | Clear device icons | iOS 14+, Android 10+ |
| - | HealthKit permissions | - | - | |

### Dependencies
- Prerequisite Stories: S01.3.2 (goals complete)
- Related Stories: S01.4.2, S01.4.3
- External Dependencies: HealthKit (iOS), Google Fit (Android), Bluetooth APIs

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| No wearables detected | Show "Don't have a wearable?" with alternatives |
| Bluetooth permission denied | Explain value, offer manual selection |
| User has unsupported device | "More integrations coming soon!" message |
| Device detected but not setup | Guide to complete device setup first |

### Open Questions
- Manual logging option if no integrations? (Decision: Discouraged but available)

### Definition of Done
- [ ] Integration catalog with 10 sources displayed
- [ ] Auto-detection via HealthKit/Google Fit/Bluetooth
- [ ] Value messaging for each integration
- [ ] Minimum 1 integration requirement enforced
- [ ] Goal-based recommendations shown
- [ ] Clear proceed/skip flows

---

## S01.4.2: OAuth Connection Flow

### User Story
**As a** new yHealth user connecting an integration,
**I want to** securely authorize yHealth to access my health data through a clear OAuth flow,
**So that** my wearable data syncs automatically without compromising my credentials.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

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

### Acceptance Criteria
Given user taps "Connect" on an integration,
When permission screen displays,
Then clear explanation of synced data is shown.

Given user taps "Authorize",
When OAuth flow completes successfully,
Then user returns to yHealth with confirmation message.

Given user denies OAuth authorization,
When redirect occurs,
Then user sees "Authorization cancelled. Try again or use another integration."

Given OAuth redirect fails,
When error detected,
Then user sees troubleshooting options and retry button.

Given token is stored,
When user closes and reopens app,
Then integration remains connected without re-authorization.

Given token expires,
When refresh is needed,
Then auto-refresh occurs silently (or re-auth prompt if fails).

### Success Metrics
- OAuth Success Rate: 95%+
- Authorization Denial Rate: <10%
- Token Refresh Success: 99%+
- Time to Connect: <60 seconds per integration

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s OAuth round-trip | OAuth 2.0 PKCE | Minimal scope requests | Clear permission text | iOS 13+, Android 5+ |
| Native dialogs | Encrypted token storage | - | - | |

### Dependencies
- Prerequisite Stories: S01.4.1 (integration selected)
- Related Stories: S01.4.3
- External Dependencies: 10 third-party OAuth APIs

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| OAuth timeout | "Connection timed out. Check internet and retry." |
| Invalid/expired authorization code | Restart OAuth flow |
| User revokes access externally | Detect on next sync, prompt re-auth |
| Rate limit hit during OAuth | Queue and retry with backoff |

### Open Questions
- PKCE implementation details per provider

### Definition of Done
- [ ] OAuth flows working for all 10 integrations
- [ ] Permission explanations displayed before OAuth
- [ ] Token storage secure (Keychain/Keystore)
- [ ] Refresh token logic implemented
- [ ] Error handling for all failure modes
- [ ] Re-authorization flow for expired/revoked tokens

---

## S01.4.3: Data Sync & Conflict Resolution

### User Story
**As a** new yHealth user who connected integrations,
**I want to** have my historical data synced and see clear status of ongoing syncs,
**So that** yHealth has my health history and I know my data is up-to-date.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Initial sync: Pull last 30 days of historical data
- Progress indicator during sync: "Syncing... 12 of 30 days imported"
- Ongoing sync: Real-time or near-real-time per integration
- Sync status dashboard showing last sync time per integration
- Multi-source conflict resolution (when same data from multiple sources)

**Sync Frequencies:**
| Integration | Initial Sync | Ongoing Sync | Method |
|-------------|--------------|--------------|--------|
| WHOOP | 30 days | Every 15 min | Webhook + polling |
| Apple Health | 30 days | Real-time | HealthKit background |
| Fitbit | 30 days | Every 15 min | Subscription API |
| MyFitnessPal | 30 days | Every 1 hour | Polling |
| Strava | 30 days | Real-time | Webhook |
| Oura | 30 days | Every 6 hours | Polling (daily data) |

**Sync Status Indicators:**
```
Integration Status:

Apple Watch: ✅ Synced 5 min ago
WHOOP: ✅ Synced 12 min ago
MyFitnessPal: ⚠️ Last sync 25 hours ago [Re-authorize]
Strava: ❌ Connection lost [Reconnect]
```

**Conflict Resolution (Golden Source Hierarchy):**
When same metric comes from multiple sources:
1. **Heart Rate:** WHOOP > Apple > Fitbit > Garmin
2. **Sleep:** Oura > WHOOP > Apple > Fitbit
3. **Steps:** Apple > Fitbit > Garmin > Samsung
4. **Workouts:** Primary device set by user, fallback to most detailed

User can override hierarchy in settings.

### Acceptance Criteria
Given integration is connected,
When initial sync begins,
Then 30 days of historical data is pulled with progress indicator.

Given initial sync is running,
When user views progress,
Then they see "Syncing... X of 30 days imported".

Given ongoing sync is active,
When new data is available at source,
Then yHealth syncs within the defined frequency.

Given sync status dashboard is viewed,
When integrations have varying states,
Then clear status indicators show each integration's health.

Given data conflict exists (same metric, multiple sources),
When data is processed,
Then golden source hierarchy is applied silently.

Given sync fails 3+ times,
When failure persists,
Then user is notified and support escalation is offered.

### Success Metrics
- Initial Sync Completion: 95%+ within 5 minutes
- Sync Reliability: 99%+ uptime
- Time to First Data: <2 min from authorization
- Conflict Resolution Accuracy: 100% (rules applied correctly)

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5 min initial sync | Data encrypted at rest | User controls retention | Status clearly visible | All supported devices |
| Real-time where possible | - | - | - | |

### Dependencies
- Prerequisite Stories: S01.4.2 (OAuth complete)
- Related Stories: S01.6.1 (plan uses synced data)
- External Dependencies: All integration APIs, background job infrastructure

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| API rate limit hit | Exponential backoff, retry later |
| No historical data available | Start collecting from now |
| Integration API down | Show status, auto-retry when up |
| Duplicate data from same source | Deduplicate by timestamp |
| User disconnects integration | Stop sync, optionally delete data |

### Open Questions
- Data retention default (2 years?)
- User ability to delete specific integration data

### Definition of Done
- [ ] 30-day historical sync for all integrations
- [ ] Progress indicator during initial sync
- [ ] Ongoing sync at defined frequencies
- [ ] Sync status dashboard implemented
- [ ] Conflict resolution hierarchy enforced
- [ ] User can view/manage sync settings
- [ ] Error handling with retry logic

---

# FEATURE 1.5: PREFERENCE CONFIGURATION

---

## S01.5.1: Engagement & Notification Preferences

### User Story
**As a** new yHealth user completing onboarding,
**I want to** set my preferred engagement depth and notification preferences,
**So that** yHealth fits my lifestyle without overwhelming me.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Set default engagement mode (Light/Deep/Adaptive)
- Configure notification types and timing
- Set quiet hours for uninterrupted time
- Smart defaults available if user wants to skip
- All preferences editable anytime from settings

**Engagement Mode Selection:**
```
How do you prefer to interact with yHealth?

○ Light Mode (Quick & Efficient)
  ✓ 30-second check-ins
  ✓ Emoji mood logging
  ✓ Brief insights (key highlights)
  ✓ Short coaching calls (5 min)

○ Deep Mode (Detailed & Comprehensive)
  ✓ 5-10 min journaling
  ✓ Detailed mood logging
  ✓ In-depth insights (full analysis)
  ✓ Extended coaching calls (20-30 min)

○ Adaptive (AI Learns Your Preference)
  ✓ Start with Light, AI suggests Deep when you have time
  ✓ Automatically adjusts based on engagement patterns

💡 You can switch modes anytime per interaction.
```

**Notification Preferences:**
```
DAILY REMINDERS:
☑ Morning check-in (7:00 AM) [Edit Time]
☑ Evening reflection (9:00 PM) [Edit Time]
☐ Meal logging reminders
☐ Hydration reminders (every 2 hours)

COACHING NUDGES:
☑ Motivational messages (2-3x/day)
☑ Habit streak celebrations
☐ Weekly progress summaries

INSIGHTS & ALERTS:
☑ New personalized insights
☑ Pattern alerts (important changes)
☑ Goal progress updates (weekly)
```

**Quiet Hours:**
```
SLEEP HOURS:
From: 10:00 PM  To: 7:00 AM  [Every day]
☑ No notifications during sleep hours

WORK/FOCUS HOURS (Optional):
From: 9:00 AM  To: 12:00 PM  [Weekdays]
☐ Silence non-urgent notifications

EXCEPTIONS:
☐ Critical health alerts can override
☐ Scheduled coaching calls can override
☑ Nothing (strict quiet hours)
```

**Smart Defaults (If Skipped):**
- Engagement Mode: Light
- Notifications: Morning (8 AM) + Evening (9 PM) only
- Quiet Hours: 10 PM - 7 AM
- Frequency: Moderate (3-5/day)

### Acceptance Criteria
Given user reaches preference configuration,
When they select engagement mode,
Then the mode is applied to all future interactions.

Given user configures notification preferences,
When they toggle options and set times,
Then preferences are saved and respected.

Given user sets quiet hours,
When those hours are active,
Then no notifications are delivered (99.9% compliance).

Given user skips preference setup,
When they proceed,
Then smart defaults are applied and noted.

Given preferences are saved,
When user accesses settings later,
Then they can modify all preferences.

### Success Metrics
- Preference Setup Completion: 85%+
- Customization Rate: 40%+ customize beyond defaults
- Notification Opt-Out: <10% disable all notifications
- Quiet Hours Compliance: 99.9%

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s save | - | Preferences private | Time picker accessible | All devices |
| - | - | - | Clear toggle states | |

### Dependencies
- Prerequisite Stories: S01.4.3 (integrations syncing)
- Related Stories: S01.5.2, S01.6.1
- External Dependencies: Push notification service, scheduling system

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Overlapping quiet hours | Auto-merge or prompt clarification |
| All hours blocked | Prevent save, require 2-hour window minimum |
| DND integration permission denied | Fallback to manual quiet hours |
| Timezone change detected | Prompt to update notification times |

### Open Questions
- DND integration depth (respect device DND?)

### Definition of Done
- [ ] Engagement mode selection working
- [ ] Notification type toggles functional
- [ ] Notification time pickers working
- [ ] Quiet hours configuration working
- [ ] Smart defaults applied when skipped
- [ ] 99.9% quiet hours compliance
- [ ] Preferences editable from settings

---

## S01.5.2: Coaching Style & Channel Preferences

### User Story
**As a** new yHealth user,
**I want to** customize how my AI coach communicates and through which channels,
**So that** yHealth interactions feel natural and fit my communication preferences.

### Story Type
- [x] Feature

### Priority
- [x] Should Have (P1)

### Scope Description

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

### Acceptance Criteria
Given user configures coaching style,
When AI generates messages,
Then tone matches selected style.

Given user sets channel preferences,
When daily interactions occur,
Then they happen via the selected channel.

Given user sets coaching call preferences,
When scheduling occurs,
Then calls are scheduled per preferences.

Given privacy preferences are set,
When data is processed,
Then preferences are respected (anonymization, retention).

### Success Metrics
- Style Customization: 30%+ users customize coaching style
- Channel Diversity: 60%+ actively use 2+ channels
- Privacy Opt-Out: <5% choose minimal personalization

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s save | - | Data usage transparent | Clear option labels | All devices |
| - | - | Retention enforced | - | |

### Dependencies
- Prerequisite Stories: S01.5.1 (engagement preferences set)
- Related Stories: S01.6.1
- External Dependencies: AI engine, WhatsApp Business API, Voice calling service

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| WhatsApp not connected but selected | Prompt to connect or choose alternative |
| Voice calls selected without phone number | Prompt to add number |
| Style change mid-conversation | Apply from next interaction |

### Open Questions
- Voice call service provider
- Multi-language AI style support

### Definition of Done
- [ ] Coaching style affects AI output
- [ ] Channel preferences route interactions correctly
- [ ] Voice call scheduling working
- [ ] Privacy/data preferences enforced
- [ ] Multi-channel sync maintained
- [ ] Preferences editable from settings

---

# FEATURE 1.6: PERSONALIZED PLAN GENERATION

---

## S01.6.1: Plan Generation Engine

### User Story
**As a** new yHealth user who completed onboarding,
**I want to** receive an AI-generated health plan synthesizing all my onboarding data,
**So that** I have a personalized roadmap tailored to my goals, data, and preferences.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Plan generates in <30 seconds
- Progress indicator shows generation steps
- Plan synthesizes: Assessment, Goals, Integrations, Preferences
- 12-week plan structure with weekly breakdown
- TDEE/macro calculations included for nutrition
- Fitness, Nutrition, and Wellbeing pillars covered

**Plan Generation Inputs:**
| Source | Data Used |
|--------|-----------|
| F1.2 Assessment | Goal, baseline metrics, past attempts, challenges |
| F1.3 Goals | SMART goals, milestones, motivation |
| F1.4 Integrations | Wearable data, baseline HR/sleep/activity |
| F1.5 Preferences | Engagement mode, coaching style, channels |

**Plan Components:**

**Fitness Plan:**
- Exercise frequency based on baseline + goal
- Exercise types tailored to goal (cardio for weight loss, strength for muscle)
- Progressive overload: Volume increases every 4 weeks
- Rest days mandatory based on recovery data
- Heart rate zones from wearable data

**Nutrition Plan:**
- TDEE calculation (Mifflin-St Jeor formula)
- Calorie target: TDEE ± deficit/surplus for goal
- Macro split personalized to goal (e.g., high protein for muscle)
- Respects dietary restrictions
- Tracking frequency recommendation

**Wellbeing Plan:**
- Sleep target based on assessment
- Stress management activities (journaling, meditation)
- Mood tracking frequency
- Energy optimization strategies

**TDEE Calculation:**
```
BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + modifier
  modifier: +5 (men), -161 (women)

TDEE = BMR × Activity Multiplier
  Sedentary: 1.2 | Light: 1.375 | Moderate: 1.55 | Active: 1.725
```

**Generation Progress:**
```
Generating Your Personalized Plan...

✓ Analyzing your goals (2 sec)
✓ Reviewing your assessment (5 sec)
✓ Calculating nutrition targets (8 sec)
✓ Designing workout plan (12 sec)
✓ Adding wellbeing strategies (18 sec)
✓ Finalizing Week 1 actions (25 sec)

Your plan is ready! (30 sec)
```

### Acceptance Criteria
Given all onboarding data is available,
When plan generation is triggered,
Then plan generates in <30 seconds.

Given plan is generating,
When user views progress,
Then step-by-step progress indicator shows status.

Given plan is generated,
When content is reviewed,
Then it includes Fitness, Nutrition, and Wellbeing components.

Given user has specific dietary restrictions,
When nutrition plan is generated,
Then restrictions are respected.

Given user has wearable data,
When fitness plan is generated,
Then baseline metrics inform recommendations.

Given unsafe targets would be generated (e.g., <1200 kcal),
When validation runs,
Then safe minimums are enforced with explanation.

### Success Metrics
- Generation Speed: <30 seconds (95% of cases)
- Plan Completeness: 100% include all 3 pillars
- TDEE Accuracy: Within 10% of validated calculators
- Safe Target Enforcement: 100%

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s generation | Plan encrypted | Plan private | Progress readable | All devices |
| - | - | - | - | |

### Dependencies
- Prerequisite Stories: S01.5.1 or S01.5.2 (preferences set)
- Related Stories: S01.6.2
- External Dependencies: AI plan generation engine (GPT-4/Claude)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Missing critical input | Block generation, prompt for missing data |
| AI generation timeout | Retry with simplified prompt |
| Unsafe plan generated | Override with safe defaults, notify user |
| No wearable data yet | Generate with assumptions, refine as data syncs |

### Open Questions
- Plan versioning when user edits

### Definition of Done
- [ ] <30 second generation time
- [ ] Progress indicator functional
- [ ] TDEE/macro calculations accurate
- [ ] All 3 pillars (Fitness, Nutrition, Wellbeing) included
- [ ] Dietary restrictions respected
- [ ] Wearable data incorporated
- [ ] Safety validation enforced
- [ ] Plan saved to database

---

## S01.6.2: Plan Presentation & Adjustment

### User Story
**As a** new yHealth user viewing my generated plan,
**I want to** see my plan in appropriate detail (Light/Deep view) and adjust parameters,
**So that** I understand my roadmap and can customize it to my needs.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Light mode: Plan overview with Week 1 focus (2-min review)
- Deep mode: Full 12-week breakdown with rationale (10-min review)
- User can adjust: Timeline, frequency, strategy, priorities
- AI validates adjustments and explains trade-offs
- Week 1 action plan clearly displayed
- Welcome experience transitions user to active coaching

**Light Mode View:**
```
Your Personalized Plan is Ready! 🎯

PRIMARY GOAL:
Lose 20 lbs in 4 months (5 lbs/month)

YOUR WEEK 1 FOCUS:
✓ Exercise 3x this week (Mon, Wed, Fri)
✓ Track meals 6 days (1800 cal/day target)
✓ In bed by 10:30 PM every night

FIRST MILESTONE (30 Days):
- Lose 5 lbs
- Establish exercise habit
- Hit 80% tracking consistency

[View Full Plan] [Start Week 1] [Adjust Plan]
```

**Deep Mode View:**
- Full 12-week breakdown
- Phase structure (Foundation → Progression → Optimization → Maintenance)
- Rationale for each recommendation
- Expected outcomes per phase
- Detailed Week 1 day-by-day actions

**Plan Adjustment Options:**
```
TIMELINE:
Current: 4 months
[Faster: 3 months] [Slower: 6 months]

EXERCISE FREQUENCY:
Current: 3x/week (Phase 1)
[Increase to 4x] [Decrease to 2x]

NUTRITION STRATEGY:
Current: Calorie tracking (1800 kcal/day)
[Portion control] [Intermittent fasting] [Keto]

[Save Adjustments] [Regenerate Plan]
```

**AI Adjustment Response:**
```
AI: "You want to increase to 4x/week in Phase 1. That's ambitious!

     Pros: Faster results, builds habit strength
     Cons: Higher injury risk, more recovery needed

     My recommendation: Stick with 3x for Phase 1, then 4x in Phase 2.
     Sound good?"

[Stick with 3x] [Override to 4x]
```

**Welcome Experience:**
```
🎉 Onboarding Complete!

TOMORROW MORNING (7:00 AM):
First check-in - rate your mood + energy (30 sec)

THIS WEEK:
Follow Week 1 actions via [WhatsApp/App]

FIRST COACHING CALL:
Scheduled for [Day/Time]

[View Full Plan] [Start Tomorrow]
```

### Acceptance Criteria
Given plan is generated,
When Light mode user views plan,
Then they see overview + Week 1 focus in <2 minutes.

Given plan is generated,
When Deep mode user views plan,
Then they see full 12-week breakdown with rationale.

Given user adjusts plan parameters,
When they tap "Save Adjustments",
Then AI validates and applies changes (or explains why not).

Given user overrides AI recommendation,
When they confirm override,
Then change is applied with acknowledgment.

Given plan review is complete,
When user taps "Start Week 1",
Then welcome experience guides them to active coaching.

Given onboarding completes,
When next day arrives,
Then first check-in is delivered per preferences.

### Success Metrics
- Plan Acceptance Rate: 90%+
- Week 1 Completion: 80%+
- Plan Relevance Score: 4.8/5
- Adjustment Rate: 20-30% (healthy engagement)
- First Milestone Achievement: 70%+

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s view load | Plan encrypted | - | Clear layout | All devices |
| - | - | - | Adjustable text | |

### Dependencies
- Prerequisite Stories: S01.6.1 (plan generated)
- Related Stories: None (final story in Epic)
- External Dependencies: None

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User rejects plan entirely | Offer to regenerate with different approach |
| All adjustments create unsafe plan | Block save, explain minimum requirements |
| User wants to restart onboarding | Allow from settings, warn data will reset |
| Plan save fails | Retry, cache locally if needed |

### Open Questions
- Plan sharing with accountability partner?

### Definition of Done
- [ ] Light mode view implemented
- [ ] Deep mode view with full 12-week breakdown
- [ ] Plan adjustment interface working
- [ ] AI validation of adjustments
- [ ] Week 1 action plan clearly displayed
- [ ] Welcome experience transitions to active coaching
- [ ] First check-in delivered next day
- [ ] Plan accessible from app dashboard

---

## Implementation Sequence (Recommended)

### Sprint 1: Account Foundation
1. S01.1.1 - Core Account Registration
2. S01.1.2 - Social Sign-In
3. S01.1.3 - Privacy Consent & WhatsApp Enrollment

### Sprint 2: Assessment Core
4. S01.2.1 - Goal Discovery
5. S01.2.2 - Quick Assessment Path
6. S01.3.1 - AI-Guided Goal Setup
7. S01.3.2 - Goal Validation & Commitment

### Sprint 3: Integrations
8. S01.4.1 - Integration Discovery & Selection
9. S01.4.2 - OAuth Connection Flow
10. S01.4.3 - Data Sync & Conflict Resolution

### Sprint 4: Personalization & Plan
11. S01.5.1 - Engagement & Notification Preferences
12. S01.6.1 - Plan Generation Engine
13. S01.6.2 - Plan Presentation & Adjustment

### Sprint 5: Enhancement
14. S01.2.3 - Deep Assessment Path (AI conversation)
15. S01.5.2 - Coaching Style & Channel Preferences

---

*Epic 01 Stories v1.0 | Created: 2025-12-07 | 15 Stories*
