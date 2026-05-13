# Epic 03: WhatsApp Integration - User Stories

> **Epic:** E03 - WhatsApp Integration
> **Source:** `prd-epics/PRD-Epic-03-WhatsApp-Integration.md`
> **Created:** 2025-12-08
> **Stories:** 16 (16 Must Have)

---

## Story Index

| Story ID | Title | Feature | Priority | Status |
|----------|-------|---------|----------|--------|
| S03.0.1 | WhatsApp API Configuration | Technical | P0 (Must) | Draft |
| S03.1.1 | WhatsApp Account Linking & Preferences | F3.1 | P0 (Must) | Draft |
| S03.2.1 | Text-Based Coaching Engine | F3.2 | P0 (Must) | Draft |
| S03.2.2 | Cross-Pillar Query Handling | F3.2 | P0 (Must) | Draft |
| S03.3.1 | Photo Analysis Pipeline | F3.3 | P0 (Must) | Draft |
| S03.3.2 | Photo Confirmation & Logging | F3.3 | P0 (Must) | Draft |
| S03.4.1 | Voice Message Transcription | F3.4 | P0 (Must) | Draft |
| S03.4.2 | Voice Sentiment Analysis & Response | F3.4 | P0 (Must) | Draft |
| S03.5.1 | Proactive Nudge Engine | F3.5 | P0 (Must) | Draft |
| S03.5.2 | Nudge Timing & Quiet Hours | F3.5 | P0 (Must) | Draft |
| S03.5.3 | 24-Hour Window & Template Messages | F3.5 | P0 (Must) | Draft |
| S03.6.1 | Quick Logging - Button-Based | F3.6 | P0 (Must) | Draft |
| S03.6.2 | Quick Logging - Natural Language | F3.6 | P0 (Must) | Draft |
| S03.7.1 | WhatsApp to App Sync | F3.7 | P0 (Must) | Draft |
| S03.7.2 | Cross-Channel Context Continuity | F3.7 | P0 (Must) | Draft |
| S03.7.3 | Multi-Channel Notification Delivery | F3.7 | P0 (Must) | Draft |

---

## Dependency Diagram

```
PHASE A: FOUNDATION
S03.0.1 (API Config) ────► S03.1.1 (Account Linking)
                                │
                                ▼
PHASE B: CORE COACHING          │
S03.2.1 (Text Coaching) ◄───────┘
    │
    ├──► S03.2.2 (Cross-Pillar Queries)
    │
    └──► S03.6.1 (Quick Logging - Buttons)
              │
              └──► S03.6.2 (Quick Logging - NLP)
                        │
                        ▼
PHASE C: MEDIA PROCESSING
S03.3.1 (Photo Pipeline) ────► S03.3.2 (Photo Confirm & Log)
S03.4.1 (Voice Transcription) ────► S03.4.2 (Voice Sentiment)
                                           │
                                           ▼
PHASE D: INTELLIGENCE & SYNC
S03.5.1 (Nudge Engine) ────► S03.5.2 (Timing & Quiet Hours)
                                   │
                                   └──► S03.5.3 (24h Window & Templates)
S03.7.1 (WhatsApp → App Sync) ◄─────────────────────┘
    │
    └──► S03.7.2 (Context Continuity)
              │
              └──► S03.7.3 (Multi-Channel Delivery)
```

---

## Feature → Story Coverage Matrix

| Epic Feature | Story ID(s) | Coverage |
|--------------|-------------|----------|
| Technical Setup | S03.0.1 | 100% |
| F3.1 Account Linking | S03.1.1 | 100% |
| F3.2 Text-Based Coaching | S03.2.1, S03.2.2 | 100% |
| F3.3 Photo Analysis | S03.3.1, S03.3.2 | 100% |
| F3.4 Voice Message Processing | S03.4.1, S03.4.2 | 100% |
| F3.5 Proactive Nudges | S03.5.1, S03.5.2, S03.5.3 | 100% |
| F3.6 Quick Logging | S03.6.1, S03.6.2 | 100% |
| F3.7 Cross-Channel Sync | S03.7.1, S03.7.2, S03.7.3 | 100% |

**Completeness Verification:** All 7 features mapped to 16 stories. 100% coverage achieved.

---

## Implementation Phases

| Phase | Sprint | Stories | Deliverable |
|-------|--------|---------|-------------|
| A: Foundation | Sprint 1 | S03.0.1, S03.1.1 | WhatsApp channel configured, users can link accounts |
| B: Core Coaching | Sprint 2 | S03.2.1, S03.2.2, S03.6.1, S03.6.2 | Text conversations and quick logging functional |
| C: Media Processing | Sprint 3 | S03.3.1, S03.3.2, S03.4.1, S03.4.2 | Photo and voice message processing operational |
| D: Intelligence & Sync | Sprint 4 | S03.5.1-5.3, S03.7.1-7.3 | Proactive engagement and cross-channel sync complete |

---

## Competitive Advantage Summary

WhatsApp Integration delivers yHealth's unique "meet users where they are" value proposition. Unlike competitors requiring dedicated app usage, yHealth embeds AI health coaching into the world's most popular messaging platform (2B+ users). Users can log meals via photo, receive coaching via voice message, and get proactive nudges - all without leaving WhatsApp. Combined with seamless cross-channel sync, this creates a frictionless health coaching experience unavailable from any competitor.

---

# PHASE A: FOUNDATION

---

## S03.0.1: WhatsApp API Configuration

### User Story
**As a** yHealth platform,
**I want to** establish a properly configured WhatsApp Business API integration with all required infrastructure,
**So that** all WhatsApp features can function reliably within policy constraints.

### Story Type
- [x] Technical

### Priority
- [x] Must Have (P0)

### Scope Description

**What This Enables:**
- Webhook endpoint to receive all WhatsApp messages (text, media, interactive)
- Message sending capability for all message types (text, interactive, media, templates)
- Template message registration for re-engagement beyond 24-hour window
- Rate limiting and quality rating monitoring infrastructure
- Phone number verification via SMS

**WhatsApp Business API Requirements:**
- Business verification with Meta completed
- Dedicated phone number for yHealth WhatsApp channel
- API access tier configured (starting Tier 1, upgrade path defined)
- Webhook verification endpoint functional
- All required message templates pre-approved

**Message Types Supported:**
| Type | Purpose | Max Size |
|------|---------|----------|
| Text | Coaching responses, insights | 4096 characters |
| Interactive | Quick reply buttons (up to 3) | - |
| Media | Photos, voice notes | 16MB images, 16MB audio |
| Template | Re-engagement beyond 24h window | Pre-approved only |

**Template Messages Required:**
- Re-engagement: "Hi {{name}}! It's been a while since we last connected..."
- Critical Insight: "Hi {{name}}, I noticed an important pattern in your health data..."
- Goal Reminder: "Hi {{name}}, checking in on your progress toward {{goal}}..."

**Infrastructure Components:**
- Webhook endpoint for incoming messages
- Message queue for outbound message processing
- SMS gateway integration for phone verification
- Media storage service for photos and voice notes
- Rate limit tracking and quality score monitoring

**Light/Deep Mode:**
Both modes use same API configuration - mode differences implemented in application layer.

### Acceptance Criteria
Given WhatsApp Business API credentials are configured,
When the webhook verification request arrives,
Then the endpoint responds with the correct challenge and returns 200 OK.

Given an incoming WhatsApp message arrives,
When the webhook receives it,
Then the message is parsed, validated, and queued for processing within 3 seconds.

Given a template message needs to be sent,
When the message is sent to a user beyond the 24-hour window,
Then the pre-approved template is used and delivery succeeds.

Given API rate limits are approached,
When 80% of tier limit is reached,
Then the system alerts operations and begins message prioritization.

Given a phone verification is requested,
When the user enters their phone number,
Then an SMS verification code is delivered within 30 seconds.

### Success Metrics
- Webhook Uptime: 99.9%
- Message Processing Latency: <3 seconds from receipt to queue
- SMS Delivery Rate: 95%+ within 30 seconds
- Template Message Approval: 100% of required templates approved

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s webhook processing | API keys encrypted | Phone numbers encrypted | N/A (backend) | WhatsApp Business API v18+ |
| 99.9% uptime | Webhook signature validation | Message retention policy | N/A | Twilio/SMS gateway |

### Dependencies
- **Prerequisite Stories:** None (foundation)
- **Related Stories:** S03.1.1 (uses verification), all subsequent stories
- **External Dependencies:** WhatsApp Business API approval, SMS provider account, Cloud infrastructure

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Webhook signature invalid | Reject message, log security alert |
| SMS provider unavailable | Fallback to alternative provider, queue retries |
| Rate limit exceeded | Queue messages, deliver when window opens |
| Template rejected by WhatsApp | Alert product team, use approved fallback |
| Webhook timeout | Return 200 immediately, process async |

### Open Questions
- SMS provider selection (Twilio vs alternatives)
- Initial rate limit tier negotiation with WhatsApp
- Template message approval timeline

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Webhook endpoint verified and processing messages
- [ ] SMS verification delivering codes
- [ ] All template messages approved by WhatsApp
- [ ] Rate limiting infrastructure operational
- [ ] Quality score monitoring active
- [ ] Security review completed

---

## S03.1.1: WhatsApp Account Linking & Preferences

### User Story
**As a** Busy Professional (P2),
**I want to** connect my WhatsApp account to yHealth and configure my messaging preferences,
**So that** I can receive coaching and log health data through an app I already use constantly.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

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

### Acceptance Criteria
Given a user on the WhatsApp linking screen,
When they enter a valid phone number and tap "Send Code",
Then an SMS verification code is sent within 30 seconds.

Given a user enters the correct verification code,
When they submit,
Then verification succeeds and consent screen is displayed.

Given a user enters incorrect code 3 times,
When the third attempt fails,
Then they see "Code incorrect. Tap to resend a new code."

Given a user has verified their number,
When they accept privacy consent,
Then WhatsApp is linked and welcome message is sent within 60 seconds.

Given a user wants Light mode setup,
When they tap "Use defaults",
Then quiet hours (10pm-8am) are applied and setup completes.

Given a user wants Deep mode setup,
When they configure preferences,
Then all selections are saved and applied immediately.

Given a user wants to unlink WhatsApp,
When they confirm in settings,
Then WhatsApp is disconnected and no further messages are sent.

Given a phone number is already linked to another account,
When verification succeeds,
Then user sees "This number is linked to another account. Unlink it first or contact support."

### Success Metrics
- Linking Completion Rate: >85% of users who start
- Linking Time: <2 minutes average
- WhatsApp Opt-In Rate: >70% of users enable WhatsApp
- SMS Verification Success: >90% first-attempt success
- User Satisfaction: 4.5/5 on setup simplicity

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s SMS delivery | Phone number encrypted | GDPR consent | Country code picker accessible | iOS 14+, Android 10+ |
| <2min total flow | Rate limit verification attempts | Consent versioned | VoiceOver support | WhatsApp installed |

### Dependencies
- **Prerequisite Stories:** S03.0.1 (API configuration)
- **Related Stories:** S03.5.2 (quiet hours used), S03.2.1 (messaging starts)
- **External Dependencies:** SMS provider, E1 Onboarding (S01.1.3 flow)
- **Cross-Epic:** E1 S01.1.3 (WhatsApp enrollment in onboarding)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Invalid phone number format | "Phone number format invalid. Try with country code (e.g., +1 555-123-4567)." |
| SMS delivery failure | "Didn't receive code? Tap to resend or try WhatsApp call verification." |
| Verification code expired (>10 min) | "Code expired. Tap to get a new code." |
| WhatsApp not installed | "WhatsApp is required. Install WhatsApp to continue." |
| User changes phone number | Re-verification flow with new number |
| Network timeout during verification | Auto-retry, show "Verifying... please wait" |

### Open Questions
- Voice call verification as SMS alternative?
- Support for multiple WhatsApp accounts (business + personal)?

### Definition of Done
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

# PHASE B: CORE COACHING

---

## S03.2.1: Text-Based Coaching Engine

### User Story
**As a** Holistic Health Seeker (P1),
**I want to** chat with my AI coach on WhatsApp using natural language,
**So that** I can ask questions, get insights, and receive support anytime without opening a separate app.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Natural language conversational AI via WhatsApp text messages
- Context-aware responses drawing from user's health data
- Conversation history maintained across messages (24-hour session context)
- Response time <5 seconds for all text messages
- Emotionally intelligent responses that adapt to user tone
- Quick reply buttons for common follow-ups

**Light Mode:**
- Brief, focused responses
- Example: "Your energy is lower today - try a 10min walk or quick snack."
- Minimal follow-up unless user initiates
- Action-oriented, concise

**Deep Mode:**
- Detailed explanations with context
- Example: "Your energy dipped at 2pm three days this week. This correlates with skipping lunch and poor sleep Tuesday-Thursday. Let's address both: try eating lunch by 1pm and aim for 7+ hours sleep."
- Multi-turn conversations with follow-up questions
- Pattern analysis and detailed insights

**Conversation Capabilities:**
- Casual conversation: "Good morning!" → "Good morning! How are you feeling today?"
- Health questions: "How did I sleep last night?" → Data-driven response
- Recommendations: "What should I eat for lunch?" → Personalized suggestion
- Journaling: "I'm feeling stressed about work" → Empathetic response with logging
- Escalation: Complex issues trigger "Want to talk about it? I can call you now."

**AI Personality & Tone:**
- Warm, empathetic, non-judgmental coach
- Adapts to user's emotional state (detected from language)
- Appropriate use of emoji (minimal, supportive)
- Never robotic or overly formal

**Data Used for Personalization:**
- User's health history (fitness, nutrition, wellbeing data)
- Recent patterns and trends
- Goals and milestones from onboarding
- Conversation history (current session)
- Cross-pillar correlations from E8

**Response Structure:**
- Lead with direct answer
- Provide context if relevant (especially Deep mode)
- Offer next action or quick reply buttons
- Keep under 4096 characters (WhatsApp limit)

### Acceptance Criteria
Given a user sends a text message via WhatsApp,
When the AI processes the message,
Then a personalized response is delivered within 5 seconds.

Given a user sends a casual greeting,
When the AI responds,
Then the response is warm and asks about their wellbeing.

Given a user asks about their health data,
When the query is processed,
Then the response includes relevant data from their profile.

Given a user sends multiple messages in a conversation,
When AI responds,
Then context from previous messages (24h window) is maintained.

Given a user's message indicates stress or negative emotion,
When AI detects the tone,
Then the response is empathetic and supportive.

Given a user asks an out-of-scope question,
When AI detects the boundary,
Then it gracefully redirects: "I'm focused on health coaching. For that question, try..."

Given AI response takes >10 seconds,
When timeout is detected,
Then user sees "Thinking... Just a moment." followed by response.

Given user sends unclear message,
When AI has low confidence on intent,
Then it asks: "I want to help! Are you asking about X or Y?"

### Success Metrics
- Response Latency: <5 seconds (p95)
- User Engagement: 60% of users message coach 3+ times/week
- Conversation Satisfaction: 4.5/5 helpfulness rating
- Multi-Turn Depth: Average 4+ exchanges per conversation
- Context Retention: 85% of follow-ups answered correctly

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5s response time | Conversation encrypted | History per user only | Quick reply buttons | WhatsApp Business API |
| Real-time streaming | - | 90-day retention | Voice message alternative | All WhatsApp clients |

### Dependencies
- **Prerequisite Stories:** S03.1.1 (account linked), S03.0.1 (API ready)
- **Related Stories:** S03.2.2 (cross-pillar queries), S03.6.1/6.2 (logging triggers)
- **External Dependencies:** AI conversation engine, E8 (Cross-Domain Intelligence)
- **Cross-Epic:** E8 (insight generation), E5/E6/E7 (pillar data)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| AI response timeout (>10s) | Show "Thinking..." then deliver response |
| Unclear user intent | Ask clarifying question |
| Insufficient data for answer | "I need a few more days of data to answer that. Try logging tonight?" |
| API rate limit reached | "Message queued - you'll receive my response shortly!" |
| Harmful content detected | Redirect per AI safety boundaries |

### Open Questions
- Maximum conversation history to maintain (24h vs longer)
- Escalation trigger thresholds to voice call

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Natural language processing functional
- [ ] <5s response time achieved
- [ ] Light/Deep mode responses implemented
- [ ] Conversation context maintained (24h window)
- [ ] Emotional tone detection working
- [ ] Quick reply buttons included
- [ ] Out-of-scope handling graceful
- [ ] Error scenarios handled

---

## S03.2.2: Cross-Pillar Query Handling

### User Story
**As an** Optimization Enthusiast (P3),
**I want** my AI coach to answer questions that span fitness, nutrition, and wellbeing together,
**So that** I understand how different aspects of my health connect and affect each other.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- User asks questions that require data from multiple pillars
- AI synthesizes information from Fitness (E5), Nutrition (E6), and Wellbeing (E7)
- Cross-domain insights delivered conversationally
- Pattern correlations explained in natural language

**Cross-Pillar Query Examples:**
| User Question | Pillars Involved | Response Type |
|---------------|------------------|---------------|
| "Why am I so tired?" | Fitness + Nutrition + Wellbeing | Multi-factor analysis |
| "What's affecting my sleep?" | Fitness + Nutrition + Wellbeing | Correlation insights |
| "Why did I sleep poorly last night?" | Fitness (recovery) + Nutrition (late meal) + Wellbeing (stress) | Specific event analysis |
| "What's my best pre-workout meal?" | Fitness + Nutrition | Pattern-based recommendation |
| "When am I most productive?" | Fitness (energy) + Wellbeing (mood) | Trend analysis |

**Light Mode:**
- Concise multi-pillar answer
- "Your tiredness is likely from poor sleep (5h) and skipping breakfast. Try sleeping 7h and eating before 9am."

**Deep Mode:**
- Detailed analysis with data
- "Let me break this down: Your sleep has averaged 5.5h this week (vs your 7h goal). On days you skip breakfast, your energy dips 30% more at 2pm. Your stress was elevated Tuesday-Thursday (7/10 avg). These factors compound - poor sleep increases stress, which makes you skip meals."

**Data Integration:**
- Fitness (E5): Activity, recovery scores, sleep metrics
- Nutrition (E6): Meal timing, calorie intake, hydration
- Wellbeing (E7): Mood, stress, energy, journal entries
- Cross-Domain (E8): Pre-computed correlations and insights

**Response Approach:**
1. Identify pillars relevant to question
2. Query data from each pillar
3. Apply cross-domain intelligence (E8)
4. Synthesize natural language response
5. Offer actionable recommendation

### Acceptance Criteria
Given a user asks "Why am I tired?",
When AI processes the cross-pillar query,
Then the response includes relevant factors from fitness, nutrition, and wellbeing.

Given a user asks about sleep quality,
When multiple factors are identified,
Then each contributing factor is explained with its relative impact.

Given a user asks for a recommendation,
When the recommendation spans pillars,
Then specific actions for each pillar are provided.

Given cross-domain insights exist,
When relevant to the user's question,
Then insights are incorporated into the response.

Given insufficient data in one pillar,
When that pillar is relevant to the question,
Then AI acknowledges the gap: "I don't have enough nutrition data yet to fully answer this."

### Success Metrics
- Cross-Pillar Query Satisfaction: 4.5/5 helpfulness
- Insight Accuracy: 85% alignment with user perception
- Action Completion: 50% of users act on cross-pillar recommendations

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5s response | Data isolated per user | Cross-pillar within user only | Plain language explanations | All WhatsApp clients |

### Dependencies
- **Prerequisite Stories:** S03.2.1 (coaching engine)
- **Related Stories:** S03.5.1 (proactive insights)
- **External Dependencies:** E8 (Cross-Domain Intelligence)
- **Cross-Epic:** E5, E6, E7 (pillar data), E8 (correlations)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Missing data in one pillar | Acknowledge gap, answer with available data |
| Conflicting data between pillars | Present both perspectives, suggest investigation |
| Question too broad | Ask clarifying question to narrow scope |
| No cross-domain patterns found | Fall back to single-pillar response |

### Open Questions
- Minimum data threshold per pillar for cross-domain analysis

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Cross-pillar queries routed correctly
- [ ] Data from all three pillars accessible
- [ ] E8 cross-domain insights integrated
- [ ] Light/Deep response modes working
- [ ] Data gap handling graceful
- [ ] Response quality verified

---

## S03.6.1: Quick Logging - Button-Based

### User Story
**As a** Busy Professional (P2),
**I want to** log my health data with one-tap buttons on WhatsApp,
**So that** I can track everything in seconds without typing.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Quick reply buttons for common logging actions
- Emoji-based mood/energy logging
- One-tap confirmations after logging
- Contextual buttons based on time of day

**Button-Based Logging Types:**
| Data Type | Button Options | Outcome |
|-----------|---------------|---------|
| Mood | [Great] [Okay] [Rough] | Mood logged (1-10 scale mapped) |
| Energy | [High] [Medium] [Low] | Energy logged (1-10 scale) |
| Sleep Quality | [Great] [Okay] [Poor] | Sleep quality logged |
| Workout Done | [Done] [Log It] [Rest Day] | Status updated |
| Meal Eaten | [Photo] [Describe] [Skip] | Logging method selected |
| Water | [250ml] [500ml] [1L] | Hydration logged |

**Light Mode:**
- Maximum button usage, minimal typing
- "How's your mood?" → Tap emoji → "Great mood logged!"
- Ultra-fast, under 5 seconds

**Deep Mode:**
- Buttons available with optional follow-up
- "How's your mood?" → Tap emoji → "Want to tell me more?" → Text/voice elaboration
- Detailed journal entry created if user elaborates

**Contextual Button Triggers:**
| Time/Context | Prompt | Buttons |
|--------------|--------|---------|
| Morning (7-9am) | "Good morning! How are you feeling?" | Mood buttons |
| After meal time (12-1pm) | "Did you eat lunch?" | [Yes-Photo] [Yes-Text] [Not yet] |
| Evening (8-10pm) | "How was your day?" | Mood + Energy buttons |
| After workout logged | "How do you feel after your workout?" | Energy buttons |

**Logging Confirmation:**
- One-tap logs immediately confirmed
- "Logged! [emoji]" response within 2 seconds
- Running totals shown where relevant: "Water logged! You're at 1.5L today."

### Acceptance Criteria
Given a user receives a mood check prompt,
When they tap an emoji button,
Then their mood is logged and confirmed within 2 seconds.

Given a user taps water logging button,
When the amount is logged,
Then cumulative daily total is displayed in confirmation.

Given a user receives contextual prompt,
When buttons are displayed,
Then the options are relevant to the time of day and user's patterns.

Given a user is in Light mode,
When they complete a log,
Then no follow-up questions are asked.

Given a user is in Deep mode,
When they complete a log,
Then optional elaboration is offered.

Given a user taps "Not yet" for a meal,
When acknowledged,
Then a follow-up prompt is scheduled for later.

### Success Metrics
- Quick Reply Usage: >70% of logs use buttons vs. free text
- Average Logging Time: <10 seconds per entry
- Daily Logging Adoption: 75% of users log 1+ metric daily
- User Satisfaction: 4.6/5 on convenience

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s confirmation | - | Logs private | Large emoji buttons | WhatsApp interactive messages |
| Real-time totals | - | - | Readable labels | 3 buttons max per message |

### Dependencies
- **Prerequisite Stories:** S03.2.1 (coaching engine for context)
- **Related Stories:** S03.6.2 (NLP logging), S03.7.1 (sync to app)
- **External Dependencies:** E5, E6, E7 (logging endpoints)
- **Cross-Epic:** E5/E6/E7 (pillar data storage)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Button tap not registered | Resend buttons with "Tap didn't register. Try again?" |
| Duplicate log in short window | "Already logged mood at 8am. Update it or log a new one?" |
| User taps wrong button | "Oops, change that?" with undo option |
| Buttons expire (WhatsApp limit) | Resend prompt if user tries to interact with old buttons |

### Open Questions
- Maximum button prompts per day to avoid fatigue

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All logging types with buttons functional
- [ ] Contextual prompts based on time of day
- [ ] Light mode (no follow-up) working
- [ ] Deep mode (optional elaboration) working
- [ ] <2s confirmation time achieved
- [ ] Running totals displayed accurately
- [ ] Button error handling implemented

---

## S03.6.2: Quick Logging - Natural Language

### User Story
**As a** Holistic Health Seeker (P1),
**I want to** log health data by typing or speaking naturally,
**So that** I can capture context and details that buttons can't convey.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Natural language parsing for logging requests
- Batch logging in single message
- Editable logs after parsing
- Undo functionality for corrections

**Natural Language Logging Examples:**
| User Input | Parsed Data | Response |
|------------|-------------|----------|
| "Ate chicken salad for lunch" | Meal: chicken salad, Time: lunch | "Chicken salad logged for lunch!" |
| "30 min run" | Workout: running, Duration: 30 min | "30 min run logged! Great workout!" |
| "Slept 7 hours" | Sleep: 7 hours | "7 hours sleep logged!" |
| "Mood: happy, Energy: 8/10, ate breakfast" | Mood: 8, Energy: 8, Meal: breakfast | "All logged! Mood: happy, Energy: 8/10, Breakfast noted." |
| "Feeling stressed, had coffee" | Stress: high, Intake: coffee | "Stress noted. Coffee logged. Want to talk about what's stressing you?" |

**Light Mode:**
- Parse and log immediately
- Minimal confirmation: "Logged!"
- No follow-up questions

**Deep Mode:**
- Parse with optional clarification
- "30 min run - outdoor or treadmill?"
- "Chicken salad - want to estimate calories or snap a photo?"
- Context captured for richer data

**Batch Logging:**
- Multiple data points in single message
- "Slept 7 hours, mood 8/10, energy high, worked out 30 min"
- All items parsed and logged together
- Single confirmation: "All logged! Sleep: 7h, Mood: 8/10, Energy: High, Workout: 30min"

**Edit/Undo Capability:**
- "Oops, change that to 6 hours" → Updates last entry
- "Undo" → Removes last logged item
- Edit window: 5 minutes after logging

### Acceptance Criteria
Given a user types "Ate lunch",
When the message is parsed,
Then a meal entry is created with appropriate defaults.

Given a user types multiple items,
When batch logging is processed,
Then all items are logged with single confirmation.

Given a user types "Undo",
When within 5 minutes of last log,
Then the last entry is removed with confirmation.

Given a user types "Change that to X",
When the edit is parsed,
Then the previous entry is updated.

Given unclear logging input,
When AI cannot determine data type,
Then it asks: "What would you like to log? Meal, workout, mood, or something else?"

Given a user logs meal via text,
When no calorie info is provided,
Then reasonable estimate is applied (or photo requested in Deep mode).

### Success Metrics
- NLP Parsing Accuracy: >90% correct interpretation
- Batch Logging Usage: 30% of users use batch logging weekly
- Edit Usage: <10% of logs require edits (indicates good parsing)

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s parsing | - | Logs private | Works with voice messages | All WhatsApp clients |
| Real-time confirmation | - | - | - | - |

### Dependencies
- **Prerequisite Stories:** S03.6.1 (button logging), S03.2.1 (NLP engine)
- **Related Stories:** S03.4.1 (voice input), S03.7.1 (sync)
- **External Dependencies:** E5, E6, E7 (logging endpoints)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Ambiguous input ("ate food") | Ask for specifics or apply generic log |
| Invalid value ("Mood: 15/10") | "Mood scale is 1-10. Did you mean 10/10?" |
| Conflicting batch data | Process valid items, clarify conflicts |
| Undo after 5 minutes | "Too late to undo. Edit it in the app?" |

### Open Questions
- Default calorie estimates for text-logged meals

### Definition of Done
- [ ] Acceptance criteria met
- [ ] NLP parsing for all data types
- [ ] Batch logging functional
- [ ] Edit/undo capability working
- [ ] Light/Deep modes implemented
- [ ] >90% parsing accuracy verified
- [ ] Error handling for ambiguous input

---

# PHASE C: MEDIA PROCESSING

---

## S03.3.1: Photo Analysis Pipeline

### User Story
**As a** Busy Professional (P2),
**I want to** send a photo of my meal to my coach on WhatsApp,
**So that** I can log nutrition instantly without typing anything.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- User sends meal photo via WhatsApp
- AI analyzes image within 10 seconds
- Returns nutrition estimate (calories, macros)
- Identifies visible food items
- Confidence indicator (High/Medium/Low)

**Photo Analysis Pipeline:**
1. Photo received via WhatsApp webhook
2. Image preprocessing (resize, normalize)
3. Object detection (identify food items)
4. Food identification (what specific foods)
5. Portion estimation (how much of each)
6. Nutrition database lookup (calories, macros)
7. Confidence scoring (0-100)
8. Generate response

**Analysis Output:**
| Component | Description | Example |
|-----------|-------------|---------|
| Food Items | Identified foods | Turkey, whole wheat bread, lettuce, tomato |
| Calories | Total estimate | 500 cal |
| Protein | Macro estimate | 35g |
| Carbs | Macro estimate | 45g |
| Fat | Macro estimate | 18g |
| Confidence | Accuracy indicator | High (85%) |

**Light Mode:**
- Photo → Quick estimate
- "~500 calories, high protein. Log it?"
- Simple yes/no confirmation

**Deep Mode:**
- Photo → Detailed breakdown
- "Turkey sandwich (500 cal): 35g protein, 45g carbs, 18g fat. Ingredients: whole wheat bread, turkey breast, lettuce, tomato. Adjust portions or confirm to log?"
- Editable values before logging

**Confidence-Based Responses:**
| Confidence | Response |
|------------|----------|
| High (>80%) | "Grilled chicken salad - 420 cal, 35g protein. Log it?" |
| Medium (50-80%) | "Looks like pasta dish - ~600 cal (estimate). Confirm?" |
| Low (<50%) | "Can't identify this clearly. What did you eat?" |

### Acceptance Criteria
Given a user sends a meal photo,
When the image is processed,
Then analysis results return within 10 seconds.

Given a clear meal photo,
When analysis completes with high confidence,
Then accurate calorie and macro estimates are provided.

Given multiple food items in photo,
When analyzed,
Then each item is identified and combined totals provided.

Given a blurry or dark photo,
When quality is detected as low,
Then user is prompted: "Photo is a bit dark - my estimate might be less accurate. Confirm or edit?"

Given a non-food photo,
When classification fails,
Then user sees: "This doesn't look like food. Send a meal photo?"

Given confidence is low,
When AI cannot identify foods,
Then it asks: "Can't quite identify this. Tell me what it is and I'll estimate nutrition!"

### Success Metrics
- Photo Analysis Time: <10 seconds (p95)
- Calorie Accuracy: +/-20% of actual values
- User Acceptance: 70% of estimates logged without edits
- Photo Logging Adoption: 60% of meal logs via photo

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <10s analysis | Images encrypted | 90-day retention, deletable | Alt text for analysis | JPEG, PNG, HEIC |
| <16MB file size | - | - | - | WhatsApp media API |

### Dependencies
- **Prerequisite Stories:** S03.0.1 (media handling), S03.2.1 (response delivery)
- **Related Stories:** S03.3.2 (confirmation and logging)
- **External Dependencies:** Computer vision service, Nutrition database
- **Cross-Epic:** E6 (Nutrition pillar logging)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Photo too large (>16MB) | "Photo is too large. Try taking a new one?" |
| Analysis timeout (>15s) | "Taking longer than usual. Try a clearer photo?" |
| Unrecognizable food | "Can't identify this. Tell me what it is?" |
| Multiple meals in frame | "I see multiple items. Analyzing everything together." |
| Image corrupted | "Couldn't read that image. Try sending again?" |

### Open Questions
- Portion size estimation approach (visual vs. reference objects)
- Multi-language food recognition requirements

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Photo received and processed via webhook
- [ ] Object detection identifying foods
- [ ] Nutrition estimates calculated
- [ ] Confidence scoring functional
- [ ] Light/Deep response modes working
- [ ] <10s processing time achieved
- [ ] Error handling for all scenarios

---

## S03.3.2: Photo Confirmation & Logging

### User Story
**As a** Busy Professional (P2),
**I want to** confirm, edit, or reject photo analysis results before logging,
**So that** my nutrition data is accurate even when AI estimates need adjustment.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Receive photo analysis results from S03.3.1
- Quick reply buttons: [Confirm] [Edit] [Cancel]
- Edit interface for adjusting values
- Logging to Nutrition pillar (E6) upon confirmation
- Meal timestamp captured from WhatsApp message time

**Confirmation Flow:**
```
AI: "Turkey sandwich - 500 cal, 35g protein, 45g carbs, 18g fat. Log it?"
    [Yes, Log It] [Edit Values] [Cancel]

User: [Taps "Yes, Log It"]

AI: "Lunch logged! You're at 1,200 cal today. 800 more to go."
```

**Edit Flow:**
```
AI: "Turkey sandwich - 500 cal. Log it?"
    [Yes] [Edit] [Cancel]

User: [Taps "Edit"]

AI: "What would you like to change?
    - Calories: 500
    - Protein: 35g
    - Carbs: 45g
    - Fat: 18g
    Reply with what to change (e.g., 'Calories: 400')"

User: "Calories: 400"

AI: "Updated to 400 cal. Confirm?"
    [Yes, Log It] [Edit More] [Cancel]
```

**Light Mode:**
- One-tap confirm
- No automatic follow-up questions
- Simple: "Logged!"

**Deep Mode:**
- Confirm with details shown
- Optional: "Add notes?" after logging
- Portion adjustment suggestions

**Data Logged:**
| Field | Source | Format |
|-------|--------|--------|
| Meal Type | Time-based inference | breakfast/lunch/dinner/snack |
| Timestamp | WhatsApp message time | ISO 8601 |
| Calories | AI estimate or user edit | Integer |
| Protein | AI estimate or user edit | Grams |
| Carbs | AI estimate or user edit | Grams |
| Fat | AI estimate or user edit | Grams |
| Foods Identified | AI analysis | Array of strings |
| Photo URL | Stored image | Encrypted URL |

### Acceptance Criteria
Given photo analysis is complete,
When user taps "Yes, Log It",
Then meal is logged to Nutrition pillar and confirmation shown.

Given user taps "Edit",
When edit interface is displayed,
Then user can modify any nutrition value.

Given user edits values,
When they confirm edits,
Then updated values are logged (not original estimates).

Given user taps "Cancel",
When cancellation is confirmed,
Then no meal is logged and photo is discarded.

Given meal is logged,
When daily totals are calculated,
Then confirmation includes updated daily calorie count.

Given meal timing needs inference,
When logging occurs,
Then meal type (breakfast/lunch/dinner/snack) is assigned based on time.

### Success Metrics
- Confirmation Rate: >80% of analyzed photos logged
- Edit Rate: <30% of logs require edits (indicates good estimates)
- Cancel Rate: <10%
- Logging Time: <30 seconds from photo send to logged

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s confirmation | Photos encrypted | User can delete | Clear edit interface | WhatsApp interactive |
| Instant daily total | - | 90-day retention | - | - |

### Dependencies
- **Prerequisite Stories:** S03.3.1 (photo analysis)
- **Related Stories:** S03.7.1 (sync to app)
- **External Dependencies:** E6 (Nutrition pillar)
- **Cross-Epic:** E6 (meal logging endpoint)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User confirms then immediately says "Undo" | Allow undo within 5 minutes |
| Edit with invalid value ("Calories: abc") | "Please enter a number for calories." |
| Logging fails (backend error) | "Couldn't log that. Try again?" with retry button |
| Double-confirm (button tapped twice) | Ignore duplicate, log once |
| Photo storage fails | Log nutrition data, note photo unavailable |

### Open Questions
- Photo retention period (90 days default?)

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Confirm/Edit/Cancel buttons functional
- [ ] Edit interface for all nutrition values
- [ ] Meal logged to E6 Nutrition pillar
- [ ] Daily totals calculated and displayed
- [ ] Meal type inferred from time
- [ ] Undo capability working
- [ ] Error handling complete

---

## S03.4.1: Voice Message Transcription

### User Story
**As a** Holistic Health Seeker (P1),
**I want to** send voice messages to my coach on WhatsApp instead of typing,
**So that** I can share my thoughts and feelings naturally when I'm busy or prefer speaking.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- User sends voice message via WhatsApp
- AI transcribes audio within 10 seconds
- Transcription accuracy >90% word error rate
- Transcription available on request
- Voice messages up to 5 minutes supported

**Voice Processing Pipeline:**
1. Voice message received via WhatsApp webhook
2. Audio file downloaded (OGG/AAC format)
3. Audio quality check (duration, noise level)
4. Speech-to-text transcription
5. Confidence scoring
6. Natural language processing (same as text in S03.2.1)
7. Generate response

**Audio Quality Handling:**
| Quality | Detection | Response |
|---------|-----------|----------|
| Good | High confidence transcription | Process normally |
| Background noise | Noise detected | "I heard you, though there was background noise. Let me know if I misunderstood!" |
| Poor/Unclear | Confidence <60% | "Audio was a bit unclear. Can you try again or type it out?" |

**Light Mode:**
- Voice → Transcription → Brief response
- Focus on key action/sentiment
- "Got it! Logged your morning mood as 'energized'. Have a great workout!"

**Deep Mode:**
- Voice → Transcription → Detailed response
- Full context acknowledgment
- Option to view transcription: "Want to see what I heard?"

**Transcription Access:**
- User can request: "What did I say?" → Returns text transcription
- Useful for journaling and record-keeping
- Transcription stored with conversation history

**Duration Limits:**
- Supported: Up to 5 minutes
- Beyond 5 minutes: Process first 5 minutes, prompt for continuation

### Acceptance Criteria
Given a user sends a voice message,
When processing completes,
Then transcription and response occur within 10 seconds.

Given audio is clear,
When transcription completes,
Then accuracy exceeds 90% word error rate.

Given audio has background noise,
When transcription completes,
Then response acknowledges potential inaccuracy.

Given user requests transcription,
When they ask "What did I say?",
Then text transcription is provided.

Given voice message exceeds 5 minutes,
When processing occurs,
Then first 5 minutes are processed with "Want to continue in another message?" prompt.

Given audio quality is too poor to transcribe,
When confidence is very low,
Then user is asked to retry or type.

### Success Metrics
- Transcription Accuracy: >90% word error rate
- Voice Message Response Time: <10 seconds for <2min audio
- User Adoption: 40% of users send voice messages monthly
- Quality Detection Accuracy: 95%

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <10s processing | Audio encrypted | User-deletable | Transcription available | OGG, AAC formats |
| 5 min max | Secure storage | 90-day retention | - | WhatsApp voice notes |

### Dependencies
- **Prerequisite Stories:** S03.0.1 (media handling), S03.2.1 (NLP engine)
- **Related Stories:** S03.4.2 (sentiment analysis)
- **External Dependencies:** Speech-to-text service
- **Cross-Epic:** E2 (voice processing patterns)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Voice message too long (>5min) | "Got the first part! Want to continue in another message?" |
| Unsupported audio format | "I can only process WhatsApp voice messages. Try recording in-app?" |
| Transcription service unavailable | "Sorry, couldn't process that audio. Want to type your message?" |
| Empty/silent audio | "I didn't hear anything. Try recording again?" |
| Non-English language | Process with reduced accuracy, expand post-MVP |

### Open Questions
- Multi-language support timeline (English primary for MVP)
- Voice data retention policy

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Voice messages received via webhook
- [ ] Speech-to-text transcription functional
- [ ] >90% accuracy achieved
- [ ] <10s processing time
- [ ] Transcription available on request
- [ ] Audio quality detection working
- [ ] 5-minute limit enforced
- [ ] Error handling complete

---

## S03.4.2: Voice Sentiment Analysis & Response

### User Story
**As a** Holistic Health Seeker (P1),
**I want** my AI coach to understand my emotional tone from voice messages,
**So that** responses are empathetic and match how I'm actually feeling.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Sentiment detected from voice message content and tone
- AI response adapts to detected emotion
- Automatic mood logging when emotion is clear
- Empathetic responses for negative emotions

**Sentiment Detection:**
| Detected Sentiment | Indicators | AI Response Style |
|-------------------|------------|-------------------|
| Very Positive | Excited tone, positive words | Celebratory, reinforcing |
| Positive | Upbeat tone, happy content | Supportive, encouraging |
| Neutral | Flat tone, factual content | Informative, balanced |
| Negative | Sad/frustrated tone, negative words | Empathetic, solution-focused |
| Very Negative/Distressed | Distressed tone, concerning content | Highly empathetic, escalation check |
| Stressed/Anxious | Rushed speech, worry words | Calming, stress-reduction techniques |
| Tired/Fatigued | Slow speech, low energy | Gentle, suggests rest |

**Sentiment to Mood Mapping:**
- Very Positive → Mood 9-10
- Positive → Mood 7-8
- Neutral → Mood 5-6
- Negative → Mood 3-4
- Very Negative → Mood 1-2

**Light Mode:**
- Brief acknowledgment of emotion
- "Got it! Logged your morning mood as 'energized'."
- Emotion influences response tone but isn't detailed

**Deep Mode:**
- Detailed emotional acknowledgment
- "Thanks for sharing! I can hear you're feeling really energized (8/10 mood) after your morning coffee and journaling. This matches your pattern - mornings are your peak energy time. Recommend a workout within the next 2 hours for best results!"
- Full emotional context in response

**Automatic Logging:**
- Clear positive emotion → Log positive mood
- Clear negative emotion → Log lower mood, offer support
- Unclear → Ask for confirmation before logging

**Response Examples:**
```
User (stressed voice): "I'm so overwhelmed with work today, I can't even think about exercise."

AI: "I can hear you're really stressed right now. That's totally valid - work pressure is real. Let's take exercise off the table today. Instead, could you do just 5 minutes of deep breathing? I'll check in with you tomorrow when things might be calmer."
```

### Acceptance Criteria
Given a voice message with positive tone,
When sentiment analysis completes,
Then AI response is celebratory and reinforcing.

Given a voice message with stressed/negative tone,
When sentiment analysis completes,
Then AI response is empathetic and supportive.

Given clear emotional content,
When mood can be inferred,
Then mood is automatically logged to Wellbeing pillar.

Given user sounds distressed,
When very negative sentiment detected,
Then AI offers additional support options per safety boundaries.

Given sentiment is unclear,
When confidence is low,
Then AI asks: "How are you feeling about that? Just want to make sure I understand."

Given voice + text sentiment conflict,
When words say "fine" but tone suggests stress,
Then AI gently probes: "You say you're fine, but I'm sensing something might be off. Want to talk about it?"

### Success Metrics
- Sentiment Detection Accuracy: >80% alignment with user intent
- Mood Auto-Logging Accuracy: 85%+
- User Feedback: 4.5/5 on emotional understanding

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s sentiment analysis | Tone data not stored | Mood logs private | Response tone adapts | All voice messages |
| Combined with transcription | - | - | - | - |

### Dependencies
- **Prerequisite Stories:** S03.4.1 (transcription)
- **Related Stories:** S03.2.1 (response generation)
- **External Dependencies:** Text analytics service
- **Cross-Epic:** E7 (Wellbeing pillar mood logging)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Mixed emotions detected | Acknowledge complexity: "I'm hearing both excitement and some worry..." |
| Sarcasm detected | Don't take literally, acknowledge: "Not sure if you're joking there - how do you really feel?" |
| Cultural tone differences | Default to content over tone if confidence low |
| Very short voice message | Use text content primarily for sentiment |

### Open Questions
- Escalation protocol for very distressed users (integrate with E2 emergency)

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Sentiment analysis integrated with transcription
- [ ] Response adaptation based on emotion
- [ ] Automatic mood logging functional
- [ ] Light/Deep response modes working
- [ ] Distress detection and handling
- [ ] >80% accuracy verified
- [ ] Cross-epic mood logging to E7

---

# PHASE D: INTELLIGENCE & SYNC

---

## S03.5.1: Proactive Nudge Engine

### User Story
**As a** Habit Formation Seeker (P4),
**I want** my AI coach to proactively check in with me and deliver insights,
**So that** I stay consistent with my health habits without having to remember to open the app.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- AI-initiated WhatsApp messages at appropriate times
- Value-driven engagement, not spam
- Contextual nudges based on user data and patterns
- Easy response via quick replies or text
- Personalized timing based on user's active patterns

**Nudge Types:**
| Type | Trigger | Example Message |
|------|---------|-----------------|
| Morning Check-In | User's wake time (8am default) | "Good morning! How are you feeling today?" |
| Goal Progress | User 80%+ toward daily goal | "You're at 8,000 steps - just 2,000 more!" |
| Insight Delivery | New pattern detected | "Your best sleep happens when you journal before bed" |
| Milestone Celebration | Streak/goal achieved | "7-day logging streak! Amazing consistency!" |
| Recovery Alert | Recovery score <50 two days | "Your recovery is low. Rest day recommended." |
| Workout Reminder | No activity logged, user has goal | "Haven't seen a workout today. Still planning one?" |
| Meal Reminder | No meal logged by typical time | "Lunch time! Eaten yet? Snap a photo when you do." |
| Re-Engagement | No interaction in 2+ days | "Haven't heard from you in a while. Everything okay?" |
| Evening Reflection | Bedtime - 1 hour | "How was your day? Quick mood check before bed?" |

**Light Mode:**
- Minimal proactive messages: 2-3/day maximum
- Morning check-in + critical insights only
- Goal reminders only when 80%+ toward target

**Deep Mode:**
- Frequent engagement: 5-7/day maximum (user-configurable)
- Morning + evening check-ins
- All insights delivered immediately
- Motivational nudges throughout day

**Nudge Content Requirements:**
- Every nudge provides personalized value
- No generic spam
- Contextual to user's data and goals
- Actionable (clear next step or response option)

### Acceptance Criteria
Given it's the user's configured morning time,
When morning check-in is triggered,
Then a personalized greeting is sent with mood quick reply buttons.

Given a new cross-domain insight is detected,
When the insight is significant,
Then it's delivered to WhatsApp with explanation.

Given user achieves a milestone,
When achievement is detected,
Then celebratory message is sent within 1 hour.

Given user hasn't interacted in 2+ days,
When re-engagement trigger fires,
Then gentle check-in message is sent (using template if >24h window).

Given user has Light mode enabled,
When nudge count reaches 3/day,
Then no more nudges are sent until tomorrow.

Given a nudge is scheduled,
When the scheduled time falls in quiet hours,
Then the nudge is queued for next active period.

### Success Metrics
- Nudge Engagement Rate: >50% of nudges receive response
- Opt-Out Rate: <5% disable proactive messages
- Perceived Value: 4.3/5 helpfulness rating
- Timing Accuracy: >90% sent within user's active hours

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Scheduled delivery | - | Nudges per user only | Clear, readable | WhatsApp Business API |
| Real-time triggers | - | - | Quick replies | - |

### Dependencies
- **Prerequisite Stories:** S03.2.1 (response engine), S03.1.1 (preferences)
- **Related Stories:** S03.5.2 (timing), S03.5.3 (24h window)
- **External Dependencies:** Scheduling service, E8 (insights)
- **Cross-Epic:** E8 (cross-domain insight generation)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User reports "too many messages" | Reduce frequency: "Got it! I'll check in less often." |
| Multiple triggers fire simultaneously | Prioritize, send highest value, queue others |
| Insight not relevant to user | AI relevance filter prevents low-value nudges |
| User in different timezone than expected | Respect device timezone, not configured |

### Open Questions
- Maximum nudge frequency caps by mode
- Insight relevance threshold for delivery

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All nudge types implemented
- [ ] Light mode (2-3/day max) enforced
- [ ] Deep mode (5-7/day max) enforced
- [ ] Personalization working for all nudges
- [ ] Quick reply buttons on appropriate nudges
- [ ] Engagement tracking functional
- [ ] Frequency adjustment via user feedback

---

## S03.5.2: Nudge Timing & Quiet Hours

### User Story
**As a** Busy Professional (P2),
**I want** my AI coach to respect my schedule and only message during appropriate times,
**So that** I'm not disturbed during sleep, work, or focus time.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Quiet hours strictly enforced (no messages during sleep/focus time)
- Smart timing learns user's active patterns
- Messages spaced appropriately (no clustering)
- User can snooze nudges temporarily

**Quiet Hours Configuration:**
- Default: 10pm - 8am (local time)
- User-configurable start and end times
- Timezone-aware (uses device timezone)
- Hard stop: Zero messages during quiet hours (99.9% compliance)

**Smart Timing Intelligence:**
- Learn when user typically responds
- Schedule nudges during high-engagement windows
- Avoid clustering (minimum 2 hours between nudges)
- Weekend vs weekday pattern detection

**Snooze Functionality:**
- "Remind me later" → 4-hour snooze
- "Not now" → Skip this nudge today
- "Too busy today" → Silence until tomorrow morning

**Timing Rules:**
| Rule | Implementation |
|------|----------------|
| Quiet Hours | No messages 10pm-8am (or custom) |
| Spacing | Minimum 2 hours between nudges |
| Morning Window | Primary check-in: user's wake time |
| Evening Window | Reflection: 1 hour before bedtime |
| Activity-Based | Post-workout, post-meal timing |

### Acceptance Criteria
Given quiet hours are 10pm-8am,
When a nudge is scheduled for 11pm,
Then it is queued for 8am the next day.

Given user sets custom quiet hours,
When configuration is saved,
Then new hours are respected immediately.

Given user taps "Remind me later",
When 4 hours pass,
Then the nudge is resent (if still relevant).

Given two nudges are triggered within 2 hours,
When timing conflict is detected,
Then only the higher-priority nudge is sent immediately.

Given user is in different timezone,
When nudges are scheduled,
Then times are calculated using device timezone.

Given user taps "Too busy today",
When acknowledged,
Then no more nudges are sent until next morning.

### Success Metrics
- Quiet Hours Compliance: 99.9%
- Snooze Usage: <20% of nudges snoozed (indicates good timing)
- User Timing Satisfaction: 4.5/5

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Real-time timezone | - | Times stored per user | Clear time displays | All timezones |
| Instant compliance | - | - | - | - |

### Dependencies
- **Prerequisite Stories:** S03.5.1 (nudge engine), S03.1.1 (preferences)
- **Related Stories:** S03.5.3 (24h window)
- **External Dependencies:** Timezone service

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User travels to new timezone | Detect via device, adjust automatically |
| DST transition | Handle timezone offset changes |
| All day marked quiet | Require minimum 2-hour window |
| Conflicting quiet hour settings | Show validation error |
| Snooze + quiet hours conflict | Queue for next active period after snooze |

### Open Questions
- Device timezone vs configured timezone precedence

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Quiet hours configuration functional
- [ ] 99.9% quiet hours compliance verified
- [ ] Snooze functionality working
- [ ] Timezone handling correct
- [ ] Message spacing enforced
- [ ] Smart timing learning active
- [ ] Silence/pause options working

---

## S03.5.3: 24-Hour Window & Template Messages

### User Story
**As a** yHealth platform,
**I want to** properly manage WhatsApp's 24-hour messaging window and use template messages for re-engagement,
**So that** proactive nudges work within policy constraints and users can be re-engaged when inactive.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**What This Enables:**
- Compliance with WhatsApp Business API 24-hour window policy
- Re-engagement of inactive users via approved templates
- Seamless transition between free-form and template messaging
- Tracking of window status per user

**24-Hour Window Rules:**
- Window opens when user sends a message
- Free-form messages allowed within 24 hours
- After 24 hours: Only template messages allowed
- Template messages can reopen window if user responds

**Window Management:**
| User State | Message Type Allowed | Action |
|------------|---------------------|--------|
| Active (<24h since last message) | Free-form | Send any nudge |
| Inactive (>24h) | Template only | Use re-engagement template |
| Re-engaged (responded to template) | Free-form | Resume normal nudges |

**Template Messages (Pre-Approved):**
1. **Re-Engagement Template:**
   "Hi {{name}}! It's been a while since we last connected. I'm here when you're ready to continue your health journey. Reply anytime!"

2. **Critical Insight Template:**
   "Hi {{name}}, I noticed an important pattern in your health data. Reply to see the insight and how it can help you."

3. **Goal Reminder Template:**
   "Hi {{name}}, checking in on your progress toward {{goal}}. Reply to continue."

**Window Tracking:**
- Store last user message timestamp per user
- Calculate window status in real-time
- Update when user responds

**Template Usage Guidelines:**
- Maximum 1 re-engagement template per week
- Critical insight templates: As detected (max 2/week)
- Goal reminders: Weekly maximum

### Acceptance Criteria
Given a user hasn't messaged in >24 hours,
When a proactive nudge is scheduled,
Then a template message is used instead of free-form.

Given a template message is sent,
When the user responds,
Then the 24-hour window reopens for free-form messaging.

Given multiple templates need to be sent,
When selecting which to send,
Then the most relevant template is chosen.

Given re-engagement template was sent this week,
When another re-engagement trigger fires,
Then it is skipped (max 1/week enforced).

Given user responds to template,
When window status is updated,
Then normal nudge scheduling resumes.

Given all templates are on cooldown,
When re-engagement is needed,
Then the attempt is logged and skipped.

### Success Metrics
- Template Delivery Rate: 98%+
- Template Response Rate: >20% of templates get response
- Window Compliance: 100% (no policy violations)
- Re-Engagement Success: 40% of inactive users re-engage within 7 days

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Real-time window check | - | Window status per user | Templates readable | WhatsApp Business API |
| Template fallback <1s | - | - | - | Pre-approved templates |

### Dependencies
- **Prerequisite Stories:** S03.0.1 (templates approved), S03.5.1 (nudge engine)
- **Related Stories:** S03.5.2 (timing)
- **External Dependencies:** WhatsApp template approval process

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Template rejected by WhatsApp | Use approved fallback, alert product team |
| Window status calculation error | Default to template (safer) |
| User blocks yHealth | Detect blocked status, stop all messages |
| Template variable missing | Use default value or skip personalization |
| Rate limit on templates | Queue and retry within limits |

### Open Questions
- Template approval timeline with WhatsApp
- Additional template types needed

### Definition of Done
- [ ] Acceptance criteria met
- [ ] 24-hour window tracking functional
- [ ] All template messages approved and functional
- [ ] Template selection logic working
- [ ] Frequency limits enforced
- [ ] Window reopening on user response
- [ ] 100% policy compliance verified
- [ ] Re-engagement analytics tracking

---

## S03.7.1: WhatsApp to App Sync

### User Story
**As an** Optimization Enthusiast (P3),
**I want** my WhatsApp conversations and logged data to appear in the mobile app,
**So that** I can review history and see all my data in one place.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- WhatsApp messages sync to app "Messages" inbox
- Data logged via WhatsApp appears in app dashboard immediately
- Sync latency <5 minutes
- Conversation history accessible in app

**What Syncs:**
| Data Type | Sync Latency | Destination |
|-----------|--------------|-------------|
| Text messages | <5 minutes | App inbox |
| Logged meals | Immediate | Nutrition dashboard |
| Logged mood/energy | Immediate | Wellbeing dashboard |
| Logged workouts | Immediate | Fitness dashboard |
| Photo analysis results | <5 minutes | Meal history |
| Voice transcriptions | <5 minutes | Conversation history |

**Sync Architecture:**
1. WhatsApp event occurs (message, log)
2. Event published to message queue
3. Event processed and stored in database
4. Push notification to app (if open)
5. App refreshes on next open

**Light Mode:**
- Basic data sync
- 24-hour conversation history in app
- Essential data logged

**Deep Mode:**
- Full sync
- Complete conversation history (30+ days) in app
- All metadata preserved

**App Inbox View:**
- Chronological conversation thread
- Message source indicator (WhatsApp icon)
- Logged data highlighted in conversation
- Search within WhatsApp conversations

### Acceptance Criteria
Given a message is sent via WhatsApp,
When sync completes,
Then message appears in app inbox within 5 minutes.

Given meal is logged via WhatsApp photo,
When logging completes,
Then meal appears in app Nutrition dashboard immediately.

Given mood is logged via WhatsApp button,
When logging completes,
Then mood appears in app Wellbeing dashboard immediately.

Given user opens app after WhatsApp activity,
When app loads,
Then all WhatsApp data is visible and current.

Given user has Light mode enabled,
When viewing conversation history,
Then last 24 hours of WhatsApp chat is visible.

Given user has Deep mode enabled,
When viewing conversation history,
Then 30+ days of history is accessible.

### Success Metrics
- Sync Latency: <5 minutes (p95)
- Data Accuracy: 100% of WhatsApp logs appear in app
- User Satisfaction: 4.5/5 on sync reliability

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5 min sync | Data encrypted in transit | Per-user isolation | Searchable history | iOS 14+, Android 10+ |
| Immediate for logs | - | - | - | - |

### Dependencies
- **Prerequisite Stories:** All Phase B and C stories
- **Related Stories:** S03.7.2, S03.7.3
- **External Dependencies:** E4 (Mobile App inbox)
- **Cross-Epic:** E4 (app inbox UI)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Sync delay >10 minutes | Show "Syncing..." indicator in app |
| Message sync fails | Retry automatically, log failure |
| App offline during WhatsApp activity | Sync all on reconnect |
| Large history (1000+ messages) | Paginate, load on scroll |
| Conflict (edited in both places) | Use latest timestamp |

### Open Questions
- Conversation history pagination approach

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Message sync to app inbox working
- [ ] Data logs sync immediately
- [ ] <5 minute latency achieved
- [ ] Light mode (24h history) functional
- [ ] Deep mode (30+ days) functional
- [ ] App inbox displays WhatsApp conversations
- [ ] Error handling with retry logic

---

## S03.7.2: Cross-Channel Context Continuity

### User Story
**As an** Optimization Enthusiast (P3),
**I want** my AI coach to remember conversations across WhatsApp, voice calls, and the app,
**So that** I don't have to repeat myself when switching channels.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- AI maintains context across all channels
- Start conversation on WhatsApp, continue on voice call
- AI references prior discussions regardless of channel
- Seamless channel switching mid-conversation

**Context Continuity Examples:**
```
[WhatsApp - 2pm]
User: "I'm feeling stressed about work"
AI: "I'm sorry to hear that. Want to talk about it?"

[Voice Call - 4pm]
User starts call
AI: "Hi! You mentioned being stressed about work earlier. Would you like to discuss that now?"

[App - Evening]
User views insights
App shows: "Based on your conversation today about work stress..."
```

**Context Data Maintained:**
| Data | Retention | Access |
|------|-----------|--------|
| Conversation topics | 7 days detailed, 30 days summary | All channels |
| Emotional state | Current session | All channels |
| Action items discussed | Until completed | All channels |
| Recent logs | Real-time | All channels |
| User preferences expressed | Permanent | All channels |

**Cross-Channel Scenarios:**
1. **WhatsApp → Voice:** AI references WhatsApp conversation
2. **Voice → WhatsApp:** Voice call summary delivered to WhatsApp
3. **App → WhatsApp:** App actions trigger WhatsApp notifications
4. **WhatsApp → App:** WhatsApp data visible in app dashboard

### Acceptance Criteria
Given a user discusses a topic on WhatsApp,
When they start a voice call later,
Then AI references the WhatsApp conversation.

Given a voice call ends,
When summary is generated,
Then summary is sent to WhatsApp.

Given a user sets a goal in the app,
When the goal is relevant to conversation,
Then WhatsApp coach references the goal.

Given context query fails,
When AI cannot retrieve prior context,
Then it gracefully asks: "Could you remind me what we discussed?"

Given user switches channels frequently,
When AI responds,
Then context is seamless with no repetition needed.

### Success Metrics
- Context Retention: 95% of cross-channel interactions maintain context
- User Satisfaction: 4.5/5 on continuity experience
- Repetition Rate: <5% of users need to repeat themselves

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s context retrieval | Context encrypted | Per-user only | Plain language summaries | All channels |
| Real-time updates | - | - | - | - |

### Dependencies
- **Prerequisite Stories:** S03.7.1 (sync infrastructure)
- **Related Stories:** S03.7.3
- **External Dependencies:** E2 (voice coaching), E4 (mobile app)
- **Cross-Epic:** E2 (voice session context), E4 (app context)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Context storage full | Archive oldest, prioritize recent |
| Context retrieval timeout | Proceed without, note in logs |
| Conflicting context (edited topic) | Use most recent version |
| Very old context (>30 days) | Summarize only, detail not available |
| User asks about deleted context | "I don't have detailed records from that long ago" |

### Open Questions
- Context summarization approach for older conversations

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Context maintained across WhatsApp, Voice, App
- [ ] Voice call summaries delivered to WhatsApp
- [ ] App actions reflected in WhatsApp context
- [ ] 95% context retention verified
- [ ] Graceful handling when context unavailable
- [ ] Cross-epic integration tested

---

## S03.7.3: Multi-Channel Notification Delivery

### User Story
**As an** Optimization Enthusiast (P3),
**I want** important notifications delivered across my preferred channels,
**So that** I don't miss insights or alerts regardless of which channel I'm using.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Insights delivered to WhatsApp AND app notification
- User can set channel preferences per notification type
- No duplicate notifications if user has seen it
- Consistent messaging across channels

**Multi-Channel Delivery:**
| Notification Type | WhatsApp | App Push | App Inbox |
|------------------|----------|----------|-----------|
| New Insight | Message | Push notification | Saved |
| Goal Achievement | Celebratory message | Push + badge | Saved |
| Recovery Alert | Message | Push notification | Saved |
| Voice Call Summary | Summary message | - | Saved |
| Daily Summary | Optional message | Push notification | Always |

**Delivery Logic:**
1. Notification event generated
2. Check user's channel preferences
3. Deliver to preferred channels
4. Track delivery status per channel
5. Mark as seen when user views on any channel
6. Don't re-send if already seen

**Channel Preference Options:**
- "WhatsApp only" - Primary WhatsApp, no app push
- "App only" - Primary app push, no WhatsApp
- "Both" - Deliver to both channels
- "Smart" - AI decides based on user's active channel

**Deduplication:**
- Notification marked "seen" across all channels when viewed on one
- No repeated delivery of same notification
- Digest mode available: Multiple notifications combined

### Acceptance Criteria
Given a new insight is generated,
When delivery is triggered,
Then notification appears on user's preferred channels.

Given user views notification on WhatsApp,
When they open the app,
Then notification is marked as read (no duplicate alert).

Given user has "Both" preference,
When notification is sent,
Then it appears on WhatsApp AND app push.

Given user has "Smart" preference,
When AI determines active channel,
Then notification is sent to most relevant channel.

Given multiple notifications fire rapidly,
When digest mode is enabled,
Then notifications are combined into single message.

Given notification delivery fails on one channel,
When retry exhausts,
Then other channels still receive notification.

### Success Metrics
- Delivery Success Rate: 99%+ across channels
- Deduplication Accuracy: 100% no unwanted duplicates
- User Channel Satisfaction: 4.4/5

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s delivery | - | Preferences per user | Consistent formatting | All channels |
| Real-time tracking | - | - | - | - |

### Dependencies
- **Prerequisite Stories:** S03.7.1, S03.7.2
- **Related Stories:** S03.5.1 (nudge delivery)
- **External Dependencies:** E4 (app push notifications)
- **Cross-Epic:** E4 (push notification service)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| WhatsApp delivery fails, app succeeds | Retry WhatsApp, don't duplicate app |
| Both channels fail | Queue and retry, alert if persistent |
| User changes preference mid-notification | Respect new preference for future |
| Timezone affects delivery | Consistent timing across channels |
| Notification too long for WhatsApp | Truncate with "See full in app" link |

### Open Questions
- Digest mode grouping logic (time-based vs count-based)

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Multi-channel delivery working
- [ ] Channel preferences respected
- [ ] Deduplication functional
- [ ] Smart channel selection working
- [ ] Digest mode available
- [ ] Delivery tracking accurate
- [ ] Cross-channel seen status synced

---

## Implementation Notes

### E03 Decisions Captured
- **MoSCoW Priorities:** All 7 features P0 Must Have (MVP Core per PRD)
- **Story Granularity:** Mixed approach - 16 stories balancing detail and overhead
- **Tech Stack:** Tool-agnostic - specific APIs/services decided at task level
- **Light/Deep Modes:** Combined in single stories unless complexity warrants split
- **Error Handling:** Comprehensive - all PRD error scenarios embedded in acceptance criteria
- **API Policy:** Technical story (S03.0.1) + constraints embedded in feature stories
- **Cross-Epic Dependencies:** Explicitly referenced in each story

### Story Naming Convention
`S03.[Feature#].[Story#]`
- S03.0.1 = Technical/foundational story
- S03.1.1 = First story for Feature 3.1
- S03.2.2 = Second story for Feature 3.2

### Implementation Sequence Rationale
1. **Phase A (Foundation):** API and account linking enable all other features
2. **Phase B (Core):** Text coaching and logging are highest-value, highest-usage features
3. **Phase C (Media):** Photo and voice extend core capabilities with multimedia
4. **Phase D (Intelligence):** Proactive engagement and sync complete the experience

---

*Epic 03 Stories v1.0 | Created: 2025-12-08 | 16 Stories (16 Must Have)*
