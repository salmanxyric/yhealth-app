# Epic 02: Voice Coaching - User Stories

> **Epic:** E02 - Voice Coaching
> **Source:** `prd-epics/PRD-Epic-02-Voice-Coaching.md`
> **Created:** 2025-12-07
> **Stories:** 16 (16 Must Have)

---

## Story Index

| Story ID | Title | Feature | Priority | Status |
|----------|-------|---------|----------|--------|
| S02.1.1 | User-Initiated Voice Calls | F2.1 | P0 (Must) | Draft |
| S02.1.2 | AI-Initiated Proactive Calls | F2.1 | P0 (Must) | Draft |
| S02.1.3 | Scheduled Coaching Sessions | F2.1 | P0 (Must) | Draft |
| S02.2.1 | Voice Conversation Engine | F2.2 | P0 (Must) | Draft |
| S02.2.2 | Conversation Context & Memory | F2.2 | P0 (Must) | Draft |
| S02.2.3 | Real-Time Transcription & Accessibility | F2.2 | P0 (Must) | Draft |
| S02.3.1 | Emotion Detection Engine | F2.3 | P0 (Must) | Draft |
| S02.3.2 | AI Response Adaptation | F2.3 | P0 (Must) | Draft |
| S02.3.3 | Emotion Data Integration | F2.3 | P0 (Must) | Draft |
| S02.4.1 | Quick Check-In & Coaching Sessions | F2.4 | P0 (Must) | Draft |
| S02.4.2 | Emergency Support Session | F2.4 | P0 (Must) | Draft |
| S02.4.3 | Goal Review & Session Orchestration | F2.4 | P0 (Must) | Draft |
| S02.5.1 | Summary Generation & Content | F2.5 | P0 (Must) | Draft |
| S02.5.2 | Summary Delivery & Action Tracking | F2.5 | P0 (Must) | Draft |
| S02.6.1 | Voice & Schedule Customization | F2.6 | P0 (Must) | Draft |
| S02.6.2 | Conversation & Accessibility Preferences | F2.6 | P0 (Must) | Draft |

---

## Dependency Diagram

```
PHASE 1: FOUNDATION
S02.1.1 ──► S02.2.1 ──► S02.6.1
                │
PHASE 2: CORE   ▼
        S02.2.2 ──┬──► S02.3.1 ──► S02.3.2
                  └──► S02.4.1
                           │
PHASE 3: SESSIONS          ▼
        S02.1.2 ◄──────────┤
        S02.1.3 ◄──────────┤
        S02.4.2 ◄──────────┘ (CRITICAL)
        S02.4.3
            │
PHASE 4: ENHANCEMENT
            ▼
        S02.5.1 ──► S02.5.2
        S02.2.3
        S02.3.3
        S02.6.2
```

---

## Feature → Story Coverage Matrix

| Epic Feature | Story ID(s) | Coverage |
|--------------|-------------|----------|
| F2.1 Voice Call Initiation | S02.1.1, S02.1.2, S02.1.3 | 100% |
| F2.2 Real-Time AI Conversation | S02.2.1, S02.2.2, S02.2.3 | 100% |
| F2.3 Voice Tone Analysis | S02.3.1, S02.3.2, S02.3.3 | 100% |
| F2.4 Session Types | S02.4.1, S02.4.2, S02.4.3 | 100% |
| F2.5 Post-Call Summary | S02.5.1, S02.5.2 | 100% |
| F2.6 Voice Preferences | S02.6.1, S02.6.2 | 100% |

---

## Implementation Phases

| Phase | Sprint | Stories | Deliverable |
|-------|--------|---------|-------------|
| 1: Foundation | Sprint 1 | S02.1.1, S02.2.1, S02.6.1 | Users can initiate voice calls with basic conversations |
| 2: Core Capabilities | Sprint 2 | S02.2.2, S02.3.1, S02.3.2, S02.4.1 | Emotionally intelligent, context-aware conversations |
| 3: Full Session Support | Sprint 3 | S02.1.2, S02.1.3, S02.4.2, S02.4.3 | All 4 session types, AI-initiated calls, emergency protocols |
| 4: Enhancement | Sprint 4 | S02.5.1, S02.5.2, S02.2.3, S02.3.3, S02.6.2 | Complete Epic with summaries, accessibility, cross-pillar integration |

---

# FEATURE 2.1: VOICE CALL INITIATION

---

## S02.1.1: User-Initiated Voice Calls

### User Story
**As a** Busy Professional (P2),
**I want to** quickly start a voice conversation with my AI coach from the app or WhatsApp,
**So that** I can get immediate support during my commute or between meetings without navigating complex menus.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- One-tap "Call Coach" button prominently displayed on mobile app home screen
<!-- - WhatsApp voice command trigger: "Hey Coach" or "Call my coach" -->
- Visual call availability indicator: "Coach Available Now" status
- Call connection completes in <30 seconds from tap/voice command
- Call history accessible with timestamps, duration, and session type

**Light Mode:**
- Single "Call Coach" button
- Simple interface, minimal options before call starts
- AI rarely initiates (user-driven only)

**Deep Mode:**
- Multiple call entry points (home screen, widget, quick actions)
- Pre-call context: "What would you like to discuss?"
- Smart suggestions based on time of day and patterns

**Call Initiation Channels:**
| Channel | Entry Point | Connection Time |
|---------|-------------|-----------------|
| Mobile App | One-tap button on home screen | <30s |
| WhatsApp | "Call my coach" voice message | <30s |
| App Widget | iOS/Android home screen widget | <30s |

**Data Captured:**
| Field | Format | Purpose |
|-------|--------|---------|
| Call Start Time | ISO 8601 | Analytics, history |
| Initiation Channel | Enum (app/whatsapp/widget) | Usage patterns |
| Connection Duration | Seconds | Performance monitoring |
| Call Duration | Seconds | Session tracking |

### Acceptance Criteria
Given a user on the mobile app home screen,
When they tap the "Call Coach" button,
Then the AI coach connects within 30 seconds and begins the conversation.

Given a user sends "Call my coach" via WhatsApp,
When the voice command is processed,
Then a voice call is initiated and connects within 30 seconds.

Given the user has no internet connection,
When they attempt to call,
Then they see "Voice calls require internet. Try again when connected?" with option to retry.

Given a call initiation times out after 30 seconds,
When the timeout is detected,
Then the system retries once, then offers "Switch to text chat?" fallback.

Given a user wants to view past calls,
When they navigate to call history,
Then they see all previous calls with timestamp, duration, and session type.

### Success Metrics
- Call Initiation Success Rate: >98% within 30 seconds
- On-Demand Call Usage: 60% of users initiate 2+ calls/week
- User Satisfaction with Access: 4.6/5 ease of calling
- Channel Distribution: Track app vs WhatsApp initiation patterns

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s connection | Encrypted voice stream | No audio stored | VoiceOver support | iOS 14+, Android 10+ |
| <2s UI response | Authenticated sessions | Call metadata only | Large tap targets (44pt) | WhatsApp Business API |

### Dependencies
- Prerequisite Stories: None (entry point for Epic 02)
- Related Stories: S02.2.1, S02.6.1
- External Dependencies: Voice calling infrastructure, WhatsApp Business API

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Network timeout during connection | Auto-retry 3x, show "Connection issue. Retrying..." then fallback |
| WhatsApp voice command not recognized | "I didn't catch that. Say 'Call my coach' to start a call." |
| User abandons call mid-connection | Log partial attempt, no summary generated |
| Multiple rapid call attempts | Rate limit to 1 call initiation per 10 seconds |
| Poor network quality detected | Warn "Weak connection may affect call quality. Continue?" |

### Open Questions
- Confirm WhatsApp Business API voice command integration approach
- Widget priority for iOS vs Android development

### Definition of Done
- [ ] Acceptance criteria met
- [ ] One-tap call initiation functional in mobile app
- [ ] WhatsApp voice command triggers call
- [ ] Call history displays correctly
- [ ] Error handling for all failure scenarios
- [ ] <30s connection time achieved (p95)
- [ ] Accessibility requirements met

---

## S02.1.2: AI-Initiated Proactive Calls

### User Story
**As a** Holistic Health Seeker (P1),
**I want** my AI coach to proactively reach out when it detects concerning patterns or celebration-worthy milestones,
**So that** I receive timely guidance without having to remember to check in.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- AI initiates calls based on user-approved triggers
- Requires explicit opt-in during onboarding
- Respects quiet hours and do-not-disturb settings
- 30-second ring with voicemail fallback option
- User can decline with "not now" or "call me later"

**AI Initiation Triggers:**
| Trigger | Condition | Priority |
|---------|-----------|----------|
| Concerning Patterns | 5+ days poor sleep, declining recovery | High |
| Significant Milestones | 30-day streak, major goal achieved | Medium |
| Weekly Review | Sunday evening check-in (if opted in) | Medium |
| Recovery Extremes | Very high (>90) or very low (<50) scores | High |

**Light Mode:**
- AI rarely initiates (only critical patterns)
- Simple notification: "Coach wants to check in"
- Easy decline with no follow-up pressure

**Deep Mode:**
- AI initiates for weekly check-ins + patterns + milestones
- Context-rich notification explaining why AI is calling
- Smart scheduling around user's calendar (if integrated)

**Call Flow:**
1. AI determines call is warranted based on triggers
2. Check user's quiet hours and preferences
3. Send notification: "Your coach wants to check in about [reason]"
4. If user accepts, connect immediately
5. If no response in 30s, offer voice message or text summary
6. If declined 3x consecutively, reduce AI initiation frequency

### Acceptance Criteria
Given a user has opted into AI-initiated calls,
When concerning patterns are detected (e.g., 5+ days poor sleep),
Then the AI initiates a call with notification explaining the reason.

Given the AI attempts to call during quiet hours,
When quiet hours are active,
Then the call is deferred until quiet hours end.

Given a user doesn't answer within 30 seconds,
When the ring timeout occurs,
Then the AI sends a text message: "Wanted to check in. Reply 'Call me' when ready!"

Given a user declines 3+ AI-initiated calls consecutively,
When the third decline is detected,
Then AI initiation frequency is automatically reduced with message: "I'll check in less often."

Given a user has not opted into AI-initiated calls,
When any trigger condition is met,
Then no AI-initiated call occurs (text nudge only).

### Success Metrics
- AI-Initiated Call Acceptance Rate: 50%
- Trigger Accuracy: 80% of users agree call was warranted
- Quiet Hours Compliance: 100%
- Opt-in Rate: 60% of users enable AI-initiated calls
- Decline-to-frequency-reduction Effectiveness: Reduced complaints by 50%

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5s trigger-to-notification | Consent verification | Opt-in required | Screen reader notifications | iOS/Android push |
| Quiet hours checked server-side | Preference encryption | No call without consent | Haptic feedback option | Calendar API optional |

### Dependencies
- Prerequisite Stories: S02.1.1, S02.2.2 (context engine), S02.4.1 (session types)
- Related Stories: S02.6.1 (frequency preferences)
- External Dependencies: Push notification service, Calendar API (optional)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User in airplane mode | Queue notification for delivery when online |
| Multiple triggers fire simultaneously | Prioritize highest severity, combine messaging |
| User changed timezone while traveling | Detect timezone change, prompt confirmation |
| User disabled notifications at OS level | Show in-app banner on next app open |
| AI-initiated call declined immediately | Record decline, no retry for 24 hours |

### Open Questions
- Integration depth with calendar apps (Google Calendar, Apple Calendar)
- Trigger threshold tuning based on user feedback

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Opt-in consent flow during onboarding
- [ ] All trigger conditions functional
- [ ] Quiet hours respected 100%
- [ ] 30-second timeout with fallback working
- [ ] Frequency auto-reduction on consecutive declines
- [ ] Analytics tracking for trigger effectiveness

---

## S02.1.3: Scheduled Coaching Sessions

### User Story
**As an** Optimization Enthusiast (P3),
**I want to** schedule recurring coaching sessions with my AI coach,
**So that** I have consistent accountability check-ins built into my weekly routine.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Schedule recurring coaching sessions (daily, weekly, custom)
- Receive reminders 1 hour before scheduled session
- Reschedule or cancel with easy interface
- No-show handling with follow-up options
- Session history shows scheduled vs completed

**Scheduling Options:**
| Frequency | Description | Example |
|-----------|-------------|---------|
| Daily | Same time every day | 7:00 AM wake-up check-in |
| Weekly | Specific day and time | Sunday 7:00 PM weekly review |
| Custom | User-defined pattern | Mon/Wed/Fri at 6:00 PM |
| One-time | Single scheduled session | Next Tuesday at 2:00 PM |

**Light Mode:**
- Simple weekly session scheduling
- Basic reminder notification
- Easy one-tap join at scheduled time

**Deep Mode:**
- Complex recurring patterns supported
- Pre-session agenda setting ("What should we focus on?")
- Calendar integration showing sessions alongside other events
- Session series management (skip one, modify all)

**Session Lifecycle:**
1. User schedules session (date, time, recurring pattern)
2. System sends reminder 1 hour before
3. At scheduled time, notification: "Your coaching session is starting"
4. User taps to join call
5. If no-show within 5 minutes, send follow-up: "Missed your session. Reschedule?"
6. Post-session summary notes it was a scheduled session

### Acceptance Criteria
Given a user wants to schedule a weekly coaching session,
When they set up Sunday 7:00 PM recurring,
Then the session appears in their schedule and repeats weekly.

Given a scheduled session is 1 hour away,
When the reminder time is reached,
Then the user receives a notification: "Coaching session in 1 hour."

Given the scheduled session time arrives,
When the user is notified,
Then they can tap to join and connect within 30 seconds.

Given a user doesn't connect within 5 minutes of scheduled time,
When the no-show is detected,
Then they receive: "Missed your coaching session. Reschedule or cancel?"

Given a user wants to reschedule a session,
When they select reschedule,
Then they can pick a new date/time and the original is updated.

### Success Metrics
- Scheduled Session Adherence: 75% of scheduled calls completed
- Reminder Effectiveness: 80% of users who receive reminder join session
- Reschedule Usage: Track rescheduled vs cancelled sessions
- Recurring Session Retention: 60% of weekly sessions maintained >4 weeks

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s schedule creation | Authenticated only | Schedule data encrypted | VoiceOver for scheduling | iOS 14+, Android 10+ |
| Reminders delivered on time | Session tokens validated | No third-party calendar sync without consent | Time picker accessible | Calendar app integration optional |

### Dependencies
- Prerequisite Stories: S02.1.1, S02.4.1 (session types define content)
- Related Stories: S02.6.1 (quiet hours affect scheduling)
- External Dependencies: Push notification scheduling, Optional calendar API

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User schedules during their quiet hours | Warn: "This time is in your quiet hours. Schedule anyway?" |
| Timezone change for recurring session | Adjust to new timezone, notify user of change |
| Conflicting sessions scheduled | Prevent double-booking, suggest alternative |
| System downtime at scheduled time | Auto-reschedule with apology notification |
| User cancels all future recurring sessions | Confirm: "Cancel all future sessions?" with undo option |

### Open Questions
- Maximum scheduled sessions per week (prevent abuse)
- Session preparation prompts ("What do you want to discuss?")

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Recurring session scheduling working (daily, weekly, custom)
- [ ] Reminders delivered 1 hour before
- [ ] No-show detection and follow-up functional
- [ ] Reschedule and cancel flows working
- [ ] Calendar integration (optional) functional
- [ ] Session history correctly shows scheduled sessions

---

# FEATURE 2.2: REAL-TIME AI CONVERSATION

---

## S02.2.1: Voice Conversation Engine

### User Story
**As a** yHealth user,
**I want to** have natural, real-time voice conversations with my AI coach,
**So that** I can communicate naturally without typing and receive immediate, spoken guidance.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Natural speech input captured via device microphone
- AI responds with natural, human-like voice
- <2 second latency for first response (p95)
- Conversation flows naturally with interruption handling
- Real-time voice activity detection (knows when user stops speaking vs pausing)

**Technical Pipeline:**
```
User Speech → Speech-to-Text → NLP Processing → Response Generation → Text-to-Speech → User
                 (<500ms)        (<1000ms)           (<500ms)            (<500ms)
```

**Natural Language Handling:**
| Input Type | Handling |
|------------|----------|
| Casual language | Understood and matched in tone |
| Incomplete sentences | AI waits, then prompts if needed |
| Filler words (um, like) | Ignored, focus on meaning |
| Interruptions | AI stops, listens to new input |
| Multi-part questions | Addresses each part sequentially |

**Light Mode:**
- Quick, concise AI responses (1-2 sentences)
- Simple yes/no follow-ups
- Focused on single topics

**Deep Mode:**
- Detailed, exploratory AI responses
- Reflective questions from AI
- Multi-topic discussions supported

### Acceptance Criteria
Given a user speaks into the microphone,
When their speech is captured,
Then the AI responds within 2 seconds with a relevant spoken answer.

Given a user interrupts the AI mid-response,
When interruption is detected,
Then the AI stops speaking and listens to the new input.

Given a user asks a multi-part question,
When the question is processed,
Then the AI addresses each part in sequence.

Given ambient noise affects speech clarity,
When low confidence speech is detected,
Then the AI asks: "I didn't quite catch that. Could you say it again?"

Given the user pauses mid-sentence,
When voice activity detection identifies a pause,
Then the AI waits appropriately before responding.

### Success Metrics
- First Response Latency: <2 seconds (p95)
- Speech Recognition Accuracy: >95% for clear speech
- Conversation Engagement: 80% of calls >3 minutes
- Naturalness Rating: 4.5/5 user rating
- Interruption Handling: 90% successful recovery

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s first response (p95) | Encrypted voice stream | No audio storage | Works with hearing aids | iOS 14+, Android 10+ |
| <5s complex queries | TLS 1.3 transport | Text transcript only stored | Adjustable speech rate | Bluetooth audio |

### Dependencies
- Prerequisite Stories: S02.1.1 (call initiation)
- Related Stories: S02.2.2 (context), S02.3.1 (emotion), S02.6.1 (voice selection)
- External Dependencies: AWS Transcribe (Speech-to-Text), Claude/DeepSeek (AI), AWS Polly (Text-to-Speech)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Speech recognition fails | "I didn't quite catch that. Could you say it again?" |
| AI response timeout (>5s) | "Let me think about that differently..." then simplified response |
| Background noise interference | Prompt user to move to quieter location |
| Microphone permission denied | Guide user to enable microphone in settings |
| Voice processing API unavailable | "Having trouble with voice. Switch to text chat?" |

### Open Questions
- Specific AWS Transcribe/Polly configuration
- Fallback TTS provider for redundancy

### Definition of Done
- [ ] Acceptance criteria met
- [ ] <2s first response latency achieved
- [ ] Speech-to-text pipeline functional
- [ ] Text-to-speech with natural voice output
- [ ] Interruption handling working
- [ ] Voice activity detection accurate
- [ ] Error recovery for all failure modes

---

## S02.2.2: Conversation Context & Memory

### User Story
**As a** Holistic Health Seeker (P1),
**I want** my AI coach to remember our previous conversations and my health data,
**So that** I don't have to repeat my situation every time and receive truly personalized guidance.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- AI references user's specific health data during conversation
- AI recalls previous conversation topics and action items
- Multi-turn context maintained across entire session (10+ turns)
- No need to re-explain personal situation each call
- AI provides personalized insights based on complete history

**Context Layers:**
| Layer | Scope | Retention |
|-------|-------|-----------|
| Session Context | Current call only | Until call ends |
| User Context | Cross-session | 24 months rolling |
| Real-Time Data | Last 7 days | Refreshed each call |

**Session Context (Active Call):**
- Current conversation transcript
- Topics discussed so far
- User's current emotional state (from F2.3)
- Questions asked and answered
- Action items identified

**User Context (Persistent):**
- Complete health data (fitness, nutrition, wellbeing)
- User goals and progress
- Past conversation history (24 months)
- Known preferences (depth level, communication style)
- Recent insights and recommendations

**Real-Time Data Access:**
- Last 7 days of activity, sleep, nutrition, mood
- Current recovery score
- Today's progress on goals
- Recent cross-domain insights

**Example Context Use:**
```
User: "How's my recovery today?"
AI: "Your physical recovery is 82 - looking good! But your mental
     recovery is at 68, a bit lower than usual. Last week you mentioned
     struggling with work stress - is that still a factor?"
```

### Acceptance Criteria
Given the AI has access to user's health data,
When the user asks about their metrics,
Then the AI provides specific numbers: "You've slept an average of 7.2 hours this week."

Given a conversation has multiple turns,
When the user references something from earlier in the call,
Then the AI maintains context and responds appropriately.

Given a user had a previous conversation about a topic,
When they start a new call,
Then the AI can reference it: "Last week you mentioned struggling with energy."

Given action items were set in a previous call,
When starting a new call,
Then the AI follows up: "How did the sleep goal go?"

Given the AI loses context mid-conversation,
When context loss is detected,
Then the AI asks for recap: "Sorry, I lost my train of thought. What were we discussing?"

### Success Metrics
- Context Retention Accuracy: 90% users report "AI remembers me"
- Multi-Turn Success: 95% of 10+ turn conversations maintain coherence
- Data Reference Accuracy: 98% of cited metrics match actual user data
- Follow-Up Effectiveness: 70% of action item follow-ups appreciated

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <500ms context retrieval | Context encrypted at rest | User can delete history | Context summaries available | All supported platforms |
| 24-month history accessible | Role-based access only | Data minimization | | |

### Dependencies
- Prerequisite Stories: S02.2.1 (conversation engine)
- Related Stories: S02.3.1 (emotion feeds context), S02.5.1 (summary adds to history)
- External Dependencies: User data store (E5, E6, E7), Conversation history database

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User data unavailable | "I don't have your sleep data yet. Want to log it manually?" |
| Context retrieval timeout | Use cached recent data, note potential staleness |
| Conflicting data points | Ask clarifying question to resolve |
| User asks about very old conversation | "I can recall up to 24 months. That might be before my memory." |
| First-time user (no history) | Focus on current conversation, build context from scratch |

### Open Questions
- Context summarization strategy for long histories
- Privacy controls for conversation history deletion

### Definition of Done
- [ ] Acceptance criteria met
- [ ] User health data accessible during calls
- [ ] 24-month conversation history retrievable
- [ ] Multi-turn context maintained (10+ turns)
- [ ] Previous conversation references working
- [ ] Action item follow-up functional
- [ ] Context loss recovery graceful

---

## S02.2.3: Real-Time Transcription & Accessibility

### User Story
**As a** yHealth user with hearing assistance needs,
**I want** real-time transcription displayed during calls with accessibility options,
**So that** I can follow the conversation visually and access voice coaching regardless of hearing ability.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Live transcription displayed in app during voice call
- Both user speech and AI responses shown in real-time
- Adjustable font size (small, medium, large, extra large)
- High contrast mode for visibility
- Option to switch to text-only chat mid-call

**Transcription Display:**
| Element | Display |
|---------|---------|
| User Speech | Right-aligned bubble, user color |
| AI Response | Left-aligned bubble, AI color |
| System Status | Center-aligned, muted color |
| Timestamps | Optional, per message |

**Accessibility Features:**
- Real-time transcription toggle (on/off)
- Font size: Small (14pt), Medium (18pt), Large (22pt), Extra Large (28pt)
- High contrast mode: Dark background, white text
- Slow speech mode: AI speaks 20% slower
- Mid-call text switch: "Having trouble hearing? Switch to text"

**Light Mode:**
- Basic transcription display
- Standard font and colors
- Simple on/off toggle

**Deep Mode:**
- Full accessibility suite
- Customizable display preferences
- Transcript export and search
- Speaker identification

### Acceptance Criteria
Given a user has transcription enabled,
When the AI or user speaks during a call,
Then the transcription appears in real-time on screen.

Given a user with visual impairment needs larger text,
When they adjust font size to Extra Large,
Then all transcription displays at 28pt font.

Given a user has difficulty hearing the AI,
When they tap "Switch to text chat" mid-call,
Then the call transitions to text-only mode seamlessly.

Given a user enables high contrast mode,
When viewing transcription,
Then the display uses dark background with white text for maximum visibility.

Given a user enables slow speech mode,
When the AI responds,
Then the AI speaks 20% slower than default.

### Success Metrics
- Transcription Usage: 30% of users enable transcription
- Accessibility Feature Adoption: 15% of users use accessibility features
- WCAG Compliance: 100% AA compliance
- User Satisfaction: 4.5/5 for accessibility users
- Text Switch Completion: 95% successful mid-call transitions

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <500ms transcription delay | Encrypted display | Transcript storage encrypted | WCAG 2.1 AA compliant | iOS VoiceOver |
| Sync with audio | Secure session | User controls retention | Screen reader compatible | Android TalkBack |

### Dependencies
- Prerequisite Stories: S02.2.1 (voice engine provides transcript)
- Related Stories: S02.6.2 (accessibility preferences)
- External Dependencies: Speech-to-text service with real-time streaming

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Transcription service delay | Show "transcribing..." indicator |
| Poor audio quality affects transcript | Note low confidence words with [?] marker |
| User scrolls during active transcription | Auto-scroll pauses, "Jump to live" button appears |
| Device screen locks during call | Maintain audio, resume transcript on unlock |
| Transcript export fails | Retry with simpler format, notify user |

### Open Questions
- Transcript storage duration (session only vs permanent)
- Multi-language transcription support timeline

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Real-time transcription functional
- [ ] Font size adjustment working (4 sizes)
- [ ] High contrast mode implemented
- [ ] Slow speech mode working
- [ ] Mid-call text switch seamless
- [ ] WCAG 2.1 AA compliance verified

---

# FEATURE 2.3: VOICE TONE ANALYSIS

---

## S02.3.1: Emotion Detection Engine

### User Story
**As a** Holistic Health Seeker (P1),
**I want** my AI coach to understand how I'm feeling from my voice,
**So that** I don't have to explicitly state my emotions every time and receive more contextually appropriate responses.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Voice tone analyzed in real-time during calls
- No audio recordings stored (privacy-first)
- Emotion detection happens transparently
- Optional indicator shows emotion analysis active
- Fallback to explicit questions if confidence low

**Acoustic Features Analyzed:**
| Feature | Measurement | Emotion Correlation |
|---------|-------------|-------------------|
| Pitch (F0) | Mean, variance, range | Stress: high pitch; Sadness: low pitch |
| Speaking Rate | Words per minute | Anxiety: fast; Fatigue: slow |
| Intensity | Volume, dynamic range | Energy level indicator |
| Voice Quality | Jitter, shimmer | Stress: unstable; Calm: stable |

**Emotion Categories (MVP):**
| Category | Indicators | Confidence Threshold |
|----------|------------|---------------------|
| Stressed/Anxious | High pitch, fast pace, low variation | >60% |
| Sad/Low Mood | Low pitch, slow pace, monotone | >60% |
| Excited/Energetic | High variation, fast pace, high intensity | >60% |
| Fatigued | Low intensity, slow pace, breathy | >60% |
| Calm/Neutral | Moderate pitch/pace, stable variation | Default |

**Light Mode:**
- Basic emotion detection (positive/neutral/negative)
- No explicit mention of detected emotions
- Subtle AI response adaptation

**Deep Mode:**
- Detailed emotion analysis (specific emotions)
- AI explicitly validates: "You sound a bit stressed"
- Emotion tracking over time
- Emotional trend insights

### Acceptance Criteria
Given a user speaks with high pitch and fast pace,
When the acoustic analysis runs,
Then stress/anxiety is detected with >60% confidence.

Given emotion detection confidence is below 60%,
When uncertain about emotional state,
Then the AI asks directly: "How are you feeling right now?"

Given audio quality is poor (SNR <10dB),
When excessive noise is detected,
Then tone analysis is disabled for session: "There's background noise. Can you move somewhere quieter?"

Given conflicting signals (words positive, tone negative),
When analysis shows mismatch,
Then the AI validates: "You said you're fine, but you sound a bit stressed. Everything okay?"

Given a user explicitly requests to disable tone analysis,
When they make the request,
Then the feature is immediately disabled: "I've turned off tone analysis. I'll ask how you're feeling instead."

### Success Metrics
- Emotion Detection Accuracy: 70-80% for basic categories
- Stress Detection Accuracy: 65-75% vs self-reported
- User Comfort with Feature: 4.0/5 trust rating
- Fallback Trigger Rate: <20% of calls require explicit questions
- Processing Latency: <2s for emotion classification

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s analysis delay | Processing in secure environment | NO audio stored | Works with all voice types | iOS 14+, Android 10+ |
| Real-time streaming | Emotion data encrypted | Only metadata retained | Accent-agnostic | |

### Dependencies
- Prerequisite Stories: S02.2.1 (voice engine provides audio stream)
- Related Stories: S02.3.2 (adaptation uses emotion), S02.3.3 (integration logs emotion)
- External Dependencies: AWS Comprehend or equivalent emotion API

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User has atypical speech patterns | Calibrate baseline over first few calls |
| Multiple emotions detected equally | Report dominant or ask for clarification |
| Emotion detection service unavailable | Continue without, use explicit questions |
| User speaks in different language/accent | Adapt models or note reduced confidence |
| Very short utterances (<2 seconds) | Insufficient data, use context instead |

### Open Questions
- Emotion model calibration per user vs global baseline
- Specific AWS service vs third-party for emotion detection

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Acoustic feature extraction working
- [ ] 5 emotion categories detectable
- [ ] 60% confidence threshold enforced
- [ ] No audio storage confirmed
- [ ] Fallback to explicit questions functional
- [ ] User opt-out working

---

## S02.3.2: AI Response Adaptation

### User Story
**As a** yHealth user,
**I want** my AI coach to adapt its tone and responses based on how I'm feeling,
**So that** I receive empathetic, contextually appropriate guidance that matches my emotional state.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- AI adjusts voice tone based on detected emotion
- AI modifies response content and suggestions
- Responses feel natural and empathetic
- No jarring mismatches between user state and AI response

**Response Adaptation Matrix:**
| Detected Emotion | AI Voice Adaptation | Content Adaptation | Suggestions |
|------------------|--------------------|--------------------|-------------|
| Stressed/Anxious | Slower pace, calmer tone | More reassuring language | Stress-relief: breathing, walk |
| Sad/Low Mood | Empathetic, gentle tone | Validate feelings, check-in | Gentle activities, journaling |
| Excited/Energetic | Match energy, upbeat | Celebrate wins, maintain momentum | Capitalize on energy: workout |
| Fatigued | Soft, understanding tone | Suggest rest, shorter responses | Rest, recovery focus |
| Calm/Neutral | Standard conversational | Normal guidance | Balanced suggestions |

**Light Mode:**
- Subtle AI adaptation without acknowledgment
- Response tone shifts but not explicitly mentioned
- Focus on guidance, not emotion discussion

**Deep Mode:**
- AI explicitly validates emotions: "You sound stressed - want to talk about it?"
- Offers emotion-specific coaching
- Tracks emotional patterns: "You've seemed more stressed this week"

### Acceptance Criteria
Given stress is detected in user's voice,
When the AI responds,
Then it uses a slower pace, calmer tone, and offers stress-relief suggestions.

Given excitement is detected,
When the AI responds,
Then it matches the user's energy and celebrates appropriately.

Given the user is in Light mode with sadness detected,
When the AI responds,
Then it adapts tone subtly without explicitly mentioning detected emotion.

Given the user is in Deep mode with sadness detected,
When the AI responds,
Then it explicitly validates: "You sound a bit down today. Want to talk about what's going on?"

Given emotion changes mid-conversation,
When new emotion is detected,
Then the AI adapts to the new emotional state naturally.

### Success Metrics
- AI Empathy Rating: 4.5/5 "AI understood how I felt"
- Adaptation Appropriateness: 85% of adaptations rated "helpful"
- User Comfort: No increase in "AI felt robotic" feedback
- Suggestion Relevance: 70% of emotion-based suggestions accepted

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Adaptation within response time | Emotion not shared externally | User controls depth | Consistent across voices | All voice options |
| Natural transition | | Explicit mode user-chosen | | |

### Dependencies
- Prerequisite Stories: S02.3.1 (emotion detection), S02.2.1 (voice engine)
- Related Stories: S02.6.1 (voice selection affects how adaptation sounds)
- External Dependencies: TTS with emotion/style control

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Emotion detection wrong (user says so) | "Sorry, I misread that. How are you actually feeling?" |
| Rapid emotion changes | Follow most recent stable emotion |
| User prefers no adaptation | Respect preference, use neutral tone always |
| Adaptation feels unnatural | Log feedback, tune adaptation intensity |
| Mixed signals persist | Default to neutral with gentle check-in |

### Open Questions
- Intensity levels for adaptation (subtle vs obvious)
- User feedback mechanism for adaptation quality

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All 5 emotion adaptations implemented
- [ ] Light vs Deep mode behavior correct
- [ ] Tone and content adaptation working together
- [ ] Mid-conversation emotion transitions smooth
- [ ] User feedback mechanism for misreads

---

## S02.3.3: Emotion Data Integration

### User Story
**As a** Holistic Health Seeker (P1),
**I want** detected emotions from voice calls to be logged and integrated with my wellbeing data,
**So that** I can see emotional trends and my Mental Recovery Score reflects my true emotional state.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Detected emotions logged as mood data points (with user consent)
- Emotions contribute to Mental Recovery Score calculation
- Emotional trends visible in wellbeing dashboard
- Cross-pillar insights include voice emotion data
- Privacy controls for emotion data

**Data Integration Points:**
| Integration | Data Flow | Purpose |
|-------------|-----------|---------|
| Wellbeing Pillar (E7) | Emotion → Mood log | Track emotional patterns |
| Mental Recovery Score | Emotion → Score input | Comprehensive recovery picture |
| Cross-Domain Insights (E8) | Emotion + behavior data | "Stress correlates with <6hr sleep" |
| Call History | Emotion summary | Reference in future calls |

**Emotion Data Stored:**
| Field | Format | Retention |
|-------|--------|-----------|
| Timestamp | ISO 8601 | 24 months |
| Emotion Category | Enum | 24 months |
| Confidence Score | 0-100 | 24 months |
| Call ID | UUID | Link to session |

**Privacy Controls:**
- Opt-out of emotion logging entirely
- Delete emotion history on demand
- View what emotion data is stored
- Emotion data not shared with third parties

**Light Mode:**
- Basic emotion logging
- Contributes to scores silently
- No explicit emotion insights shown

**Deep Mode:**
- Detailed emotion tracking
- Emotion trends in dashboard
- AI references emotional patterns: "You've seemed calmer since starting meditation"

### Acceptance Criteria
Given emotion is detected during a call,
When the user has emotion logging enabled,
Then the emotion is logged as a mood data point in wellbeing pillar.

Given voice-detected emotions over time,
When Mental Recovery Score is calculated,
Then emotion data contributes to the score appropriately.

Given a pattern emerges (e.g., stress correlates with poor sleep),
When cross-domain analysis runs,
Then the insight is surfaced: "Your voice stress is higher on days with <6 hours sleep."

Given a user wants to see their emotion data,
When they access wellbeing dashboard,
Then they see emotion trends from voice calls.

Given a user opts out of emotion logging,
When they disable the feature,
Then no emotion data is stored from future calls.

### Success Metrics
- Emotion Logging Opt-in Rate: 70% of users consent
- Mental Recovery Score Accuracy: Emotion data improves prediction by 10%
- Cross-Pillar Insight Generation: 50% of users receive emotion-based insights
- Privacy Satisfaction: 4.0/5 comfort with emotion data handling

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Logging doesn't delay calls | Emotion data encrypted | Opt-in required | Data viewable in accessible format | Syncs with E7 pillar |
| <100ms write latency | Access controlled | Easy deletion | | |

### Dependencies
- Prerequisite Stories: S02.3.1 (emotion detection), S02.3.2 (adaptation)
- Related Stories: E7 Wellbeing Pillar, E8 Cross-Domain Intelligence
- External Dependencies: Wellbeing data store, Cross-domain analysis engine

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User opts out mid-call | Stop logging immediately, keep prior data per retention policy |
| Emotion logging service unavailable | Call continues, log emotion after call ends |
| Conflicting mood data (manual log vs voice) | Show both, let user resolve or AI ask |
| User deletes emotion history | Complete deletion, confirm to user |
| First call (no baseline) | Log data, note baseline being established |

### Open Questions
- Weight of voice emotion vs manual mood logs
- Minimum calls needed for reliable emotion trends

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Emotion logging to wellbeing pillar working
- [ ] Mental Recovery Score integration complete
- [ ] Cross-pillar insights surfacing emotion patterns
- [ ] Privacy controls functional (opt-out, view, delete)
- [ ] Dashboard emotion trends visible (Deep mode)

---

# FEATURE 2.4: SESSION TYPES

---

## S02.4.1: Quick Check-In & Coaching Sessions

### User Story
**As a** Busy Professional (P2),
**I want** access to both quick 5-minute check-ins and deeper 20-30 minute coaching sessions,
**So that** I can get meaningful guidance whether I have 5 minutes or 30 minutes.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**Quick Check-In (5 minutes):**
| Phase | Duration | Content |
|-------|----------|---------|
| Opening | 30s | "How are you feeling today?" |
| Key Metric Review | 2 min | AI highlights 1-2 important patterns |
| Single Recommendation | 1.5 min | One actionable suggestion |
| Closing | 1 min | Confirm action item |

**Triggers:** User-initiated one-tap, AI-initiated daily morning (if opted in)
**Usage:** 60% of all calls (most common)

**Coaching Session (20-30 minutes):**
| Phase | Duration | Content |
|-------|----------|---------|
| Opening Reflection | 3-5 min | "How's your week been?" |
| Data Review | 8-10 min | Detailed multi-pillar analysis |
| Insight Discussion | 5-7 min | Cross-domain connections |
| Goal Adjustment | 3-5 min | Review and refine goals |
| Action Planning | 3-5 min | Set 2-3 action items |
| Closing | 2 min | Summary and next session |

**Triggers:** Scheduled recurring, AI-suggested ("It's been a week since deep session")
**Usage:** 25% of all calls

**Light Mode:**
- Quick Check-In only available
- Coaching Sessions via explicit request only
- Simpler session selection

**Deep Mode:**
- Both session types readily available
- AI suggests appropriate type based on context
- Session can upgrade mid-call: "Want to extend this to a full coaching session?"

### Acceptance Criteria
Given a user wants a quick check-in,
When they select Quick Check-In,
Then the session completes in 5 minutes ±1 minute with one actionable recommendation.

Given a user has time for a coaching session,
When they select Coaching Session,
Then the session covers 2+ health pillars and sets 2-3 action items.

Given a user is in a Quick Check-In but has time,
When the AI detects opportunity,
Then it offers: "Want to extend this to a full coaching session?"

Given the AI needs to suggest a session type,
When user initiates call without selection,
Then AI uses context (time of day, recent patterns) to suggest appropriate type.

Given a session is running over time,
When duration exceeds target by >5 minutes,
Then AI prompts: "We're running long - should we wrap up or continue?"

### Success Metrics
- Quick Check-In Completion: 90% within 5±1 minutes
- Coaching Session Value: 4.5/5 user rating
- Session Type Appropriateness: 85% report "right session for my need"
- Session Upgrade Rate: 20% of Quick Check-Ins upgrade to Coaching
- Multi-Pillar Coverage: 95% of Coaching Sessions cover 2+ pillars

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Time tracking accurate | Session data secure | Session type not shared | Session timer accessible | All platforms |
| Smooth session transitions | | | Clear session type indication | |

### Dependencies
- Prerequisite Stories: S02.2.1 (voice engine), S02.2.2 (context for personalized content)
- Related Stories: S02.4.3 (session orchestration), S02.5.1 (summaries tailored to session type)
- External Dependencies: None beyond core voice infrastructure

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User ends Quick Check-In after 1 minute | Offer quick summary, don't force structure |
| Coaching Session user distracted | Check-in: "Are you still there? Should we pause?" |
| Session type unclear from user request | Ask: "Quick check-in or deeper conversation today?" |
| User wants to downgrade from Coaching | "No problem, let's wrap up with your key action item." |
| Network issues during long session | Save progress, offer to resume or summarize |

### Open Questions
- Optimal session timer visibility (always visible vs on-demand)
- Session phase indicators (show progress through structure?)

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Quick Check-In 5-minute structure working
- [ ] Coaching Session 20-30 minute structure working
- [ ] Session upgrade flow functional
- [ ] AI session type suggestion based on context
- [ ] Time management prompts working
- [ ] Multi-pillar coverage in Coaching Sessions

---

## S02.4.2: Emergency Support Session

### User Story
**As a** yHealth user in emotional distress,
**I want** immediate access to emergency support with appropriate resources,
**So that** I receive timely help and know where to get professional assistance when I need it most.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0) - CRITICAL SAFETY FEATURE

### Scope Description

**CRITICAL: This story defines safety-critical functionality that must be implemented as a complete unit. Emergency protocols cannot be partially deployed.**

**Emergency Support Session (10-15 minutes):**
| Phase | Duration | Content |
|-------|----------|---------|
| Immediate Acknowledgment | 1 min | "I'm here. What's happening?" |
| Active Listening | 3-5 min | Let user express without interruption |
| Emotional Validation | 1-2 min | "That sounds really difficult" |
| Immediate Coping | 3-5 min | Breathing exercise or grounding technique |
| Resource Provision | 2 min | Crisis hotlines, professional help suggestions |
| Follow-Up | 1 min | "Can I check on you tomorrow?" |

**Emergency Triggers:**
| Trigger | Detection | Response |
|---------|-----------|----------|
| User says "I need help now" | Keyword detection | Immediate emergency session |
| Crisis keywords detected | NLP analysis | Confirm and offer emergency session |
| Severe distress in voice + language | Tone + content analysis | Switch to emergency protocol |
| User selects "Emergency" option | UI selection | Immediate connection |

**Crisis Keywords (Examples):**
- "I want to hurt myself"
- "I don't want to be here anymore"
- "I'm thinking about suicide"
- "I can't take it anymore"
- "Nobody would miss me"

**Safety Protocols:**
1. Never leave user alone during crisis without confirmation
2. Always provide crisis hotline numbers
3. Follow-up check-in scheduled within 24 hours
4. Safety team notification (if configured by organization)
5. No judgment, no minimization of feelings

**Crisis Resources Provided:**
| Resource | Number | When |
|----------|--------|------|
| National Suicide Prevention | 988 | Always |
| Crisis Text Line | Text HOME to 741741 | Always |
| Emergency Services | 911 | Life-threatening situations |
| Local resources | Configurable | Based on user location |

### Acceptance Criteria
Given crisis keywords are detected during any call,
When the detection is confirmed,
Then the session immediately switches to emergency protocol.

Given a user selects Emergency Support,
When initiating the call,
Then connection occurs within 15 seconds (priority path).

Given an emergency session is active,
When the resource provision phase is reached,
Then crisis hotlines are clearly provided with instructions.

Given an emergency session concludes,
When the user confirms they're okay to end,
Then a follow-up check-in is scheduled within 24 hours.

Given the AI detects life-threatening language,
When severity is assessed as critical,
Then emergency services information (911) is prominently provided.

Given safety team notification is configured,
When an emergency session triggers,
Then the safety team receives alert (no user data, just alert flag).

### Success Metrics
- Emergency Connection Time: <15 seconds
- Crisis Resource Delivery: 100% of sessions provide appropriate resources
- Follow-Up Completion: 90% of scheduled follow-ups completed
- Protocol Compliance: 100% adherence to safety protocols
- User Safety Outcomes: No incidents attributed to protocol failure

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <15s connection | Encrypted session | Minimal logging | Available to all users | All platforms |
| Priority bandwidth | Safety team auth | Crisis data protected | Clear resource display | Works offline (resources cached) |

### Dependencies
- Prerequisite Stories: S02.2.1 (voice engine), S02.3.1 (emotion detection helps identify distress)
- Related Stories: S02.4.1 (can switch from any session to emergency)
- External Dependencies: Crisis resource database, Safety team alerting system (optional)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| False positive crisis detection | Gently confirm: "That sounded concerning. Are you okay?" |
| User denies crisis but keywords persist | Respect denial but offer resources: "Just in case you need them..." |
| Connection fails during emergency | Immediate fallback to text with resources |
| User disconnects mid-crisis | Send resources via text, attempt call back |
| Network unavailable | Display cached crisis resources immediately |
| User outside US (different hotlines) | Use geo-located resources or international default |

### Open Questions
- Integration with specific crisis response platforms
- Organizational safety team notification requirements

### Definition of Done
- [ ] All acceptance criteria met
- [ ] <15s emergency connection achieved
- [ ] Crisis keyword detection working
- [ ] Emergency session structure implemented
- [ ] Crisis resources displayed correctly
- [ ] 24-hour follow-up scheduling working
- [ ] Safety team alerting functional (if configured)
- [ ] Offline resource caching working
- [ ] Protocol compliance verified by safety review

---

## S02.4.3: Goal Review & Session Orchestration

### User Story
**As an** Optimization Enthusiast (P3),
**I want** focused goal review sessions and intelligent session type selection,
**So that** I can regularly assess my progress and always receive the right type of coaching for my current situation.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**Goal Review Session (15 minutes):**
| Phase | Duration | Content |
|-------|----------|---------|
| Goal Selection | 1 min | "Which goal should we discuss?" |
| Progress Analysis | 5 min | Review metrics and achievements |
| Barrier Exploration | 4 min | "What's holding you back?" |
| Goal Adjustment | 3 min | Modify target or strategy |
| Commitment | 2 min | Confirm adjusted goal |

**Triggers:**
- User-initiated: "Let's review my goals"
- AI-suggested: Goal deadline approaching, consistent goal failure
**Usage:** 10% of calls

**Session Orchestration Logic:**
```
IF (crisis keywords OR severe stress tone):
  → Emergency Support (immediate)

ELSE IF (user has <10 minutes):
  → Quick Check-In

ELSE IF (weekly coaching scheduled):
  → Coaching Session

ELSE IF (goal deadline approaching OR consistent failure):
  → Goal Review Session

ELSE IF (deep mode AND no recent coaching):
  → Offer Coaching Session

ELSE:
  → Default to Quick Check-In

User can always override AI suggestion.
```

**Session History:**
- All sessions labeled by type
- Filter history by session type
- Duration and topics tracked
- Completion status (full, early end, upgraded)

### Acceptance Criteria
Given a user requests a goal review,
When they select Goal Review Session,
Then they can choose which specific goal to discuss.

Given consistent goal failure is detected,
When the AI initiates contact,
Then it suggests a Goal Review Session: "Your sleep goal has been challenging. Want to review and adjust it?"

Given a goal deadline is approaching,
When the user initiates any call,
Then AI suggests: "Your 30-day fitness goal ends in 3 days. Should we review progress?"

Given session orchestration determines appropriate type,
When user doesn't specify session type,
Then AI suggests based on context with explanation.

Given a user wants to see session history,
When they access call history,
Then sessions are labeled by type with filter options.

### Success Metrics
- Goal Review Completion: 80% of Goal Reviews result in adjusted or confirmed goals
- Session Suggestion Accuracy: 85% of AI suggestions accepted
- Barrier Identification: 70% of reviews identify actionable barriers
- Session Type Distribution: Matches expected usage patterns
- History Utility: 60% of users use session history filters

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Session selection <1s | Goal data encrypted | Session type not shared | Clear session labels | All platforms |
| History loads <2s | Auth required for history | | Filter accessible | |

### Dependencies
- Prerequisite Stories: S02.4.1 (Quick Check-In and Coaching), S02.4.2 (Emergency for orchestration)
- Related Stories: S02.2.2 (context for goal data), E5/E6/E7 (goal sources)
- External Dependencies: Goal data from pillars, Session history database

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| User has no goals set | Offer to set goals: "No goals yet. Want to create one?" |
| All goals on track | Celebrate: "All goals progressing well! Let's discuss what's working." |
| Goal review reveals depression/anxiety | Seamlessly transition to emotional support, offer resources |
| Multiple goals need review | Let user prioritize: "Multiple goals to discuss. Which first?" |
| Session history very long | Paginate with date filters, search capability |

### Open Questions
- Goal review frequency recommendation
- Automatic goal archiving for completed/abandoned goals

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Goal Review 15-minute structure working
- [ ] Session orchestration logic implemented
- [ ] AI session suggestions based on context
- [ ] Session history with type labels
- [ ] History filtering functional
- [ ] Goal selection flow working

---

# FEATURE 2.5: POST-CALL SUMMARY

---

## S02.5.1: Summary Generation & Content

### User Story
**As an** Optimization Enthusiast (P3),
**I want** an automatic summary of my coaching call generated immediately after we finish,
**So that** I can remember key insights and action items without having to take notes during the conversation.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**User Experience:**
- Summary auto-generated within 30 seconds of call ending
- No user action required
- Content tailored to session type and depth mode
- Action items clearly extracted and highlighted

**Summary Content - Light Mode:**
```
📞 Quick Check-In (5 min) - Dec 2, 8:15am

💡 Key Insight: Your recovery is strong (85) - great day for a tough workout!

✅ Action Items:
- Try the 30-min HIIT workout recommended today
- Log dinner before 7pm for better sleep

👉 View full summary in app
```

**Summary Content - Deep Mode:**
```
📞 Coaching Session (28 minutes)
December 2, 2025 - 8:00am - 8:28am

🎯 Session Goals:
Review weekly progress and plan upcoming week

📊 Pillars Discussed:
- Fitness: Sleep quality, recovery, workout consistency
- Wellbeing: Morning energy, stress levels

💡 Key Insights Discovered:
1. Sleep-Workout Connection
   "Your workout performance is 30% better following 7+ hours of sleep."

2. Morning Routine Impact
   "Days you journal before 9am correlate with higher afternoon energy."

✅ Action Items (This Week):
1. Sleep Goal Adjustment (PRIORITY)
   - New target: 7-7.5 hours/night
   - Deadline: Dec 9

2. Morning Journaling
   - Continue 5x/week streak

3. Stress Reduction
   - Try 10-min meditation 3x this week

😊 Emotional Summary:
You sounded energized about fitness progress but mentioned work stress.

🔗 AI Reasoning:
Sleep recommendation based on your 30-day sleep-performance correlation.

📄 Full Transcript Available
```

### Acceptance Criteria
Given a voice call has ended,
When the call duration was >1 minute,
Then a summary is auto-generated within 30 seconds.

Given the call was a Quick Check-In,
When the summary is generated,
Then it includes: call metadata, 1 key insight, 1-2 action items.

Given the call was a Coaching Session,
When the summary is generated,
Then it includes: full themes, detailed insights, action items with deadlines, emotional summary.

Given a very short call (<1 minute),
When the call ends,
Then minimal or no summary generated: "Call was brief. No summary generated."

Given no clear action items were identified,
When the summary is generated,
Then it notes discussion topics only: "We talked about [topics]. No specific action items set."

### Success Metrics
- Summary Generation Speed: <30 seconds (95%)
- Summary Accuracy: 90% users agree it captures key points
- Action Item Extraction: 85% of action items correctly identified
- Summary Completeness: Matches session type requirements
- User Engagement: 75% of users view summary within 24 hours

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s generation | Summary encrypted | Stored per retention policy | Readable by screen readers | All platforms |
| Handles all session types | Access controlled | User can delete | Supports font scaling | |

### Dependencies
- Prerequisite Stories: S02.2.1 (provides transcript), S02.2.2 (context for insights), S02.3.1 (emotion for emotional summary)
- Related Stories: S02.5.2 (delivery), S02.4.x (session type determines content)
- External Dependencies: Claude/DeepSeek for summarization

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Summary generation fails | Retry with simplified prompt, notify user of delay |
| Transcript quality poor | Generate best-effort summary, note gaps |
| Very long call (>45 min) | Extended summary with chapters/sections |
| Emergency session summary | Sensitive handling, focus on resources provided |
| Call dropped unexpectedly | Generate summary from available transcript |

### Open Questions
- Summary template customization options
- Transcript quality threshold for summary generation

### Definition of Done
- [ ] Acceptance criteria met
- [ ] <30s generation time achieved
- [ ] Light mode summary format working
- [ ] Deep mode summary format working
- [ ] Action item extraction working
- [ ] Session type-appropriate content
- [ ] Emotional summary included (Deep mode)
- [ ] Error handling for generation failures

---

## S02.5.2: Summary Delivery & Action Tracking

### User Story
**As a** yHealth user,
**I want** my call summary delivered to both the app and WhatsApp with interactive action items,
**So that** I can access it conveniently and track my progress on commitments.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**Multi-Channel Delivery:**
| Channel | Content | Timing |
|---------|---------|--------|
| Mobile App | Full summary | Immediate |
| WhatsApp | Light summary + app link | Within 1 minute |
| Push Notification | "Summary ready" alert | Immediate |

**Action Item Interactivity:**
- Tap to mark complete
- Add to calendar/reminders
- Set deadline if not AI-suggested
- Progress tracking in dashboard

**Action Item Lifecycle:**
1. Extracted from call summary
2. Added to action item dashboard
3. Progress tracked throughout week
4. AI asks about items in next call
5. Completed items celebrated, incomplete explored
6. Completion feeds into goal progress tracking

**Export Options:**
- Copy summary to clipboard
- Share to notes apps (Apple Notes, Google Keep)
- Email summary to self
- Export as PDF (Deep mode)

**Light Mode:**
- WhatsApp delivery: Condensed summary
- App: Full summary
- Basic action item tracking

**Deep Mode:**
- Full summary on all channels
- Advanced action item features (calendar, reminders)
- Export to multiple formats
- Summary searchable in history

### Acceptance Criteria
Given a summary is generated,
When delivery is triggered,
Then it appears in both mobile app and WhatsApp within 1 minute.

Given a summary contains action items,
When the user views them in app,
Then they can tap to mark complete, add to calendar, or set deadline.

Given a user marked an action item complete via WhatsApp,
When they reply "Done ✅",
Then the item is marked complete and synced to app.

Given a user wants to export their summary,
When they select export option,
Then they can copy, share, or email the summary.

Given the next call starts,
When action items were set in previous call,
Then AI asks: "How did your action items go?"

Given WhatsApp delivery fails,
When the error is detected,
Then the system retries, then notifies: "Summary available in app. WhatsApp delivery delayed."

### Success Metrics
- Delivery Success Rate: 99% delivered to both channels
- Action Item Completion Rate: 60% completed within 7 days
- Summary View Rate: 75% viewed within 24 hours
- Export Usage: 20% of Deep mode users export summaries
- WhatsApp Engagement: 40% reply to WhatsApp summary actions

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1 min delivery | Encrypted transmission | Summary data protected | Screen reader support | iOS, Android, WhatsApp |
| Reliable sync | Auth for all channels | Export excludes sensitive data | Action items accessible | Export formats standard |

### Dependencies
- Prerequisite Stories: S02.5.1 (summary generation)
- Related Stories: E4 Mobile App (dashboard), E3 WhatsApp (delivery)
- External Dependencies: WhatsApp Business API, Calendar APIs, Notes app integrations

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| WhatsApp delivery fails | Retry 3x, fallback to app-only with notification |
| User has app notifications disabled | WhatsApp delivery becomes primary |
| Calendar integration fails | Note failure, allow manual adding |
| Action item deadline passed | Show as overdue, offer to reschedule or close |
| User hasn't viewed summary in 48 hours | Send reminder nudge |

### Open Questions
- Third-party notes app integration priority (Notion, Evernote)
- Action item reminder frequency customization

### Definition of Done
- [ ] Acceptance criteria met
- [ ] App delivery working
- [ ] WhatsApp delivery working
- [ ] Push notification working
- [ ] Action item tap-to-complete functional
- [ ] Calendar/reminder integration working
- [ ] Export options functional
- [ ] AI follow-up on action items working
- [ ] WhatsApp reply handling working

---

# FEATURE 2.6: VOICE PREFERENCES

---

## S02.6.1: Voice & Schedule Customization

### User Story
**As a** Holistic Health Seeker (P1),
**I want to** choose my AI coach's voice and set when calls can occur,
**So that** conversations feel comfortable and respect my schedule.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**Voice Selection Options (MVP):**
| Voice ID | Description | Characteristics |
|----------|-------------|-----------------|
| Coach Maya | Female, American, Warm | Moderate pace, empathetic, default |
| Coach Alex | Male, American, Calm | Slower pace, reassuring |
| Coach Jordan | Gender-neutral, British, Energetic | Faster pace, motivational |
| Coach Sam | Male, American, Gentle | Slow pace, soft, supportive |

**Voice Customization:**
- Voice selection from 4+ options
- Speech pace adjustment (0.8x, 1.0x, 1.2x, 1.5x)
- Voice preview: "Test this voice" before selecting
- Change voice anytime in settings

**Schedule Customization:**
| Setting | Options | Default |
|---------|---------|---------|
| Quiet Hours | Time range when AI cannot initiate | 10pm-7am |
| DND Days | Block AI calls on specific days | None |
| Timezone | Auto-detected, adjustable | Device timezone |
| Override | Allow user calls during quiet hours | Yes |

**AI-Initiated Call Frequency:**
| Level | Behavior | Use Case |
|-------|----------|----------|
| Off | AI never initiates | User prefers full control |
| Minimal | Critical patterns only | Default, low interruption |
| Moderate | Weekly check-ins + critical | Regular engagement |
| Active | Daily check-ins + coaching | High-touch coaching |

**Light Mode:**
- Basic voice selection (2 options)
- Simple quiet hours toggle
- AI calls on/off

**Deep Mode:**
- Full voice library
- Detailed schedule configuration
- Granular frequency controls

### Acceptance Criteria
Given a user wants to select a voice,
When they access voice preferences,
Then they see 4+ voice options with preview capability.

Given a user selects "Coach Alex",
When they tap preview,
Then they hear a sample of Coach Alex's voice.

Given a user sets quiet hours to 9pm-8am,
When the AI would initiate a call at 10pm,
Then no call is initiated (deferred until 8am).

Given a user adjusts speech pace to 1.2x,
When the AI responds in calls,
Then the AI speaks 20% faster than default.

Given a user sets AI frequency to "Off",
When any trigger condition is met,
Then no AI-initiated call occurs.

Given a user travels to a new timezone,
When timezone change is detected,
Then prompt: "Detected new timezone. Update quiet hours?"

### Success Metrics
- Voice Customization Rate: 70% adjust voice preference
- Quiet Hours Usage: 60% set custom quiet hours
- Voice Satisfaction: 4.6/5 comfort rating
- Quiet Hours Compliance: 100%
- Preview Usage: 80% preview voice before selecting

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s voice preview load | Preferences encrypted | No voice data shared | Voice descriptions accessible | All platforms |
| Settings sync <2s | Auth required | | Time picker accessible | TTS API supports all voices |

### Dependencies
- Prerequisite Stories: S02.1.1 (uses voice preference), S02.2.1 (TTS uses voice)
- Related Stories: S02.1.2 (AI initiation respects schedule), S02.6.2 (additional preferences)
- External Dependencies: TTS service with multiple voice options

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Selected voice temporarily unavailable | Fallback to default: "Your preferred voice is unavailable. Using default." |
| User sets >18 hours quiet hours | Warn: "This leaves only 6 hours for AI calls. Are you sure?" |
| Timezone auto-detection fails | Prompt manual selection |
| Voice preview fails to load | Retry, show error if persistent |
| Conflicting settings (DND + scheduled session) | Warn about conflict, let user resolve |

### Open Questions
- Additional voice options for post-MVP (languages, accents)
- Voice personality customization (more formal/casual)

### Definition of Done
- [ ] Acceptance criteria met
- [ ] 4+ voice options available
- [ ] Voice preview functional
- [ ] Speech pace adjustment working
- [ ] Quiet hours enforced
- [ ] DND days working
- [ ] Timezone handling correct
- [ ] AI frequency levels functional
- [ ] Settings sync across devices

---

## S02.6.2: Conversation & Accessibility Preferences

### User Story
**As a** yHealth user with specific needs,
**I want to** customize conversation depth defaults and accessibility settings,
**So that** my coaching experience matches my communication style and any accessibility requirements.

### Story Type
- [x] Feature

### Priority
- [x] Must Have (P0)

### Scope Description

**Conversation Depth Defaults:**
| Setting | Behavior |
|---------|----------|
| Light Mode Default | Quick, concise conversations unless user extends |
| Deep Mode Default | Detailed, exploratory unless user requests brevity |
| Adaptive | AI learns from behavior and adjusts automatically |

**Accessibility Options:**
| Feature | Description | Options |
|---------|-------------|---------|
| Real-Time Transcription | Display transcript during call | On/Off |
| Font Size | Transcript text size | Small/Medium/Large/Extra Large |
| High Contrast | Dark background, white text | On/Off |
| Slow Speech | AI speaks 20% slower | On/Off |
| Hearing Assistance | Switch to text mid-call option | On/Off |

**Privacy Preferences:**
| Setting | Description | Default |
|---------|-------------|---------|
| Voice Tone Analysis | Emotion detection during calls | On |
| Call Recording Disclaimer | Clarify only transcripts stored | Shown once |

**Notification Preferences:**
| Setting | Options |
|---------|---------|
| Call Reminders | On/Off for scheduled sessions |
| Summary Notifications | Immediate/Delayed/Off |
| Action Item Reminders | Daily/Weekly/Off |

**Preference Management:**
- All settings sync across devices
- Export/import preferences
- Reset to defaults with confirmation

### Acceptance Criteria
Given a user sets conversation depth to "Deep Mode Default",
When they start a call without specifying,
Then the AI defaults to detailed, exploratory conversation style.

Given a user enables transcription with Large font,
When in a call,
Then real-time transcript displays at 22pt font size.

Given a user enables slow speech mode,
When the AI responds,
Then the AI speaks 20% slower than standard pace.

Given a user disables voice tone analysis,
When on a call,
Then no emotion detection occurs; AI asks explicit mood questions.

Given a user wants to reset all preferences,
When they tap "Reset to Defaults",
Then confirmation appears and all preferences return to defaults.

Given settings are changed on one device,
When the user opens app on another device,
Then preferences are synced.

### Success Metrics
- Accessibility Usage: 15% of users enable accessibility features
- Depth Preference Set: 50% of users set explicit depth preference
- Setting Retention: 85% keep preferences >30 days
- Sync Success: 99% of cross-device syncs successful
- User Satisfaction: 4.5/5 for customization completeness

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Settings load <500ms | Encrypted storage | Privacy controls clear | Settings UI accessible | All platforms |
| Sync <2s | Auth required | Opt-out respected | VoiceOver compatible | |

### Dependencies
- Prerequisite Stories: S02.6.1 (base preferences), S02.2.3 (transcription feature), S02.3.1 (tone analysis toggle)
- Related Stories: All Epic 02 stories (preferences affect behavior)
- External Dependencies: Settings sync service

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Conflicting preferences (fast speech + transcription off) | Suggest: "Fast speech may be hard to follow. Enable transcription?" |
| Sync conflict between devices | Most recent change wins, notify user |
| Settings export fails | Retry, offer simpler format |
| Accessibility + Deep mode conflict | No conflict; both work together |
| User deletes account | All preferences deleted, confirm to user |

### Open Questions
- Preference backup/restore for device migration
- Notification preference granularity (per-notification type?)

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Conversation depth defaults working
- [ ] All accessibility options functional
- [ ] Privacy toggles working
- [ ] Notification preferences functional
- [ ] Cross-device sync working
- [ ] Export/import preferences working
- [ ] Reset to defaults working

---

## Appendix: Epic 02 Key Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| All 16 stories as P0 Must Have | All features are MVP Core per PRD | 2025-12-07 |
| 4 implementation phases | Logical progression: Foundation → Core → Sessions → Enhancement | 2025-12-07 |
| Emergency Support atomic | Safety protocols cannot be partially deployed | 2025-12-07 |
| Voice Tone Analysis split 3 ways | Detection, adaptation, integration are distinct concerns | 2025-12-07 |
| Transcription separated | Accessibility compliance deserves dedicated attention | 2025-12-07 |
| Session types grouped | Quick Check-In + Coaching together; Emergency separate for safety | 2025-12-07 |

---

*Epic 02 Stories v1.0 | yHealth Platform*
*Created: 2025-12-07*
