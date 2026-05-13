# yHealth Platform - Epic 02: Voice Coaching

## EPIC OVERVIEW

### Epic Statement
Voice Coaching is yHealth's **CORE DIFFERENTIATOR** - the conversational AI coach that delivers real-time, emotionally intelligent health guidance through natural voice conversations, setting yHealth apart from WHOOP/BEVEL's analytics-only dashboards.

### Epic Goal
Enable users to have meaningful, proactive voice conversations with their AI health coach anytime, anywhere - transforming health coaching from passive data analytics to active, empathetic dialogue that feels like talking to a trusted friend who knows your complete health story.

### Core Philosophy
**"Second Mind" Conversational AI:** While competitors show you data, yHealth TALKS to you about your health. Voice coaching isn't a feature - it's THE way users experience yHealth's intelligence, delivering insights through natural conversation rather than cold dashboards.

### Voice Coaching Scope (6 Features)

| Feature | Description | MVP Status |
|---------|-------------|------------|
| **F2.1** | Voice Call Initiation | Core |
| **F2.2** | Real-Time AI Conversation | Core |
| **F2.3** | Voice Tone Analysis | Core |
| **F2.4** | Session Types | Core |
| **F2.5** | Post-Call Summary | Core |
| **F2.6** | Voice Preferences | Core |

---

## F2.1: VOICE CALL INITIATION

### Description
Flexible call initiation system that allows both users and the AI coach to start voice conversations, supporting scheduled coaching sessions, on-demand calls, and proactive AI-initiated check-ins based on user preferences and health patterns.

### User Story
As a **Busy Professional** (P2), I want to quickly start a voice conversation with my AI coach whenever I need guidance without navigating complex menus so that I can get immediate support during my commute or between meetings.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | One-tap call button in app, simple "Call Coach" voice command via WhatsApp. AI rarely initiates (only for critical patterns). |
| **Deep** | Scheduled recurring coaching sessions, proactive AI check-ins based on patterns, smart scheduling around user's calendar, multiple call triggers (goal milestones, concerning patterns, weekly reviews). |

### User Decisions Applied
- **Dual initiation:** Both user and AI can start calls (with user consent for AI-initiated)
- **Multi-channel access:** Start calls from mobile app, WhatsApp voice command, or scheduled reminders
- **Availability:** 24/7 on-demand availability, optional scheduled sessions for routine
- **User control:** Full control over AI-initiated call frequency and timing preferences

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Call initiation success rate | >98% within 30 seconds | Call connection analytics |
| On-demand call usage | 60% of users initiate 2+ calls/week | Usage tracking |
| Scheduled session adherence | 75% of scheduled calls completed | Session completion rate |
| AI-initiated call acceptance | 50% acceptance rate when AI initiates | Call response analytics |
| User satisfaction with access | 4.6/5 ease of calling | In-app survey |

### Acceptance Criteria

- [ ] One-tap "Call Coach" button prominently displayed in mobile app home screen
- [ ] Voice command trigger: User says "Hey Coach" or "Call my coach" via WhatsApp
- [ ] Scheduled session setup: Users can schedule recurring calls (daily, weekly, custom)
- [ ] AI-initiated calls require user opt-in during onboarding
- [ ] AI proactively suggests calls based on:
  - Concerning health patterns (e.g., 5+ days poor sleep)
  - Significant milestones (e.g., 30-day streak achieved)
  - Weekly review timing (e.g., Sunday evening check-in)
  - Recovery score extremes (very high or very low)
- [ ] Call availability indicators: Show "Coach Available Now" status
- [ ] Scheduling respects user's quiet hours and do-not-disturb settings
- [ ] Call initiation works in <30 seconds from tap/voice command to connection
- [ ] Grace period for AI-initiated calls: Ring for 30 seconds, then leave voice message option
- [ ] Call history accessible: View past calls with timestamps and duration
- [ ] Offline graceful degradation: "Coach calls require internet connection" message

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **No internet connection** | Network check fails | Show offline message, queue for later | "Voice calls require internet. Try again when connected?" |
| **Call initiation timeout** | >30s no connection | Retry once, then suggest text chat | "Having trouble connecting. Switch to text chat?" |
| **User declines AI-initiated call** | No answer after 30s | Leave summary message via text | "Wanted to check in. Reply 'Call me' when ready!" |
| **Scheduled call missed** | User doesn't connect | Send reminder, reschedule option | "Missed your coaching session. Reschedule or cancel?" |
| **Too many AI-initiated calls** | >3 declined in a row | Reduce AI initiation frequency | "I'll check in less often. Update your call preferences anytime." |

### Cross-Pillar Connections

**To All Pillars (E5, E6, E7):**
- Voice calls can address any pillar topic (fitness, nutrition, wellbeing)
- AI references cross-domain insights during conversations
- Call summaries tag relevant pillars for tracking

**To WhatsApp (E3):**
- WhatsApp voice messages can trigger voice call offers
- Call summaries delivered via WhatsApp after session
- Seamless handoff between text chat and voice call

**To Mobile App (E4):**
- Primary call interface in app with visual call history
- App shows call analytics (frequency, duration, topics)
- In-app call initiation most common entry point

### Dependencies
- **E1 (Onboarding):** Voice preferences set during onboarding, consent for AI-initiated calls
- **E4 (Mobile App):** Primary UI for call button, call history, scheduling
- **E3 (WhatsApp):** Alternative call initiation via voice command
- **E8 (Cross-Domain Intelligence):** AI determines when proactive calls are valuable

### MVP Status
[X] MVP Core

---

## F2.2: REAL-TIME AI CONVERSATION

### Description
Natural, context-aware voice conversation engine powered by Claude/DeepSeek that conducts real-time dialogue with users, maintains conversation context across sessions, references user's health data, and delivers emotionally intelligent responses that feel like talking to a knowledgeable, caring health coach.

### User Story
As a **Holistic Health Seeker** (P1), I want to have natural conversations with my AI coach that reference my complete health history and understand my emotions so that I receive personalized, empathetic guidance without repeating my situation every time.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Quick check-in conversations (3-5 minutes), focused on single topics, simple yes/no questions, concise AI responses. |
| **Deep** | Extended coaching sessions (15-30 minutes), exploratory dialogue, complex multi-topic discussions, detailed explanations, reflective questions from AI to deepen understanding. |

### User Decisions Applied
- **Context awareness:** AI remembers all previous conversations, user's health data, goals, and preferences
- **Natural language:** Conversational tone, not robotic or medical jargon unless requested
- **Emotional intelligence:** AI detects user's emotional state from voice tone and adapts response style
- **Multi-turn dialogue:** AI maintains context across entire conversation, not just single Q&A exchanges
- **First response speed:** <2 seconds for initial response to maintain natural flow

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First response latency | <2 seconds (p95) | Call analytics monitoring |
| Complete response latency | <5 seconds for complex queries (p95) | Response timing analytics |
| Conversation naturalness | 4.5/5 user rating | Post-call survey |
| Context retention accuracy | 90% users report AI "remembers me" | User feedback tracking |
| Conversation engagement | 80% of calls >3 minutes duration | Call duration analytics |
| Follow-up question quality | 70% of AI questions rated "helpful" | In-conversation feedback |

### Acceptance Criteria

- [ ] AI responds to user speech within 2 seconds for initial response (p95)
- [ ] Complex queries (requiring data lookup) respond within 5 seconds (p95)
- [ ] Conversation maintains context across entire session (10+ turn dialogue)
- [ ] AI references user's specific data: "You've slept an average of 7.2 hours this week"
- [ ] AI recalls previous conversations: "Last week you mentioned struggling with energy"
- [ ] Natural language processing handles:
  - Casual language and colloquialisms
  - Interruptions and mid-sentence corrections
  - Incomplete sentences and filler words ("um", "like", "you know")
  - Multi-part questions
- [ ] AI adapts response length based on user preference (light vs. deep mode)
- [ ] Real-time transcription displayed in app during call (accessibility + reference)
- [ ] AI asks clarifying questions when user input ambiguous
- [ ] Conversation flow markers: AI uses "Let me check your data..." for transparency
- [ ] AI can handle topic changes gracefully: "Before we move on, any questions about sleep?"
- [ ] Voice activity detection: AI knows when user stops speaking vs. pausing
- [ ] Error recovery: AI handles misheard words by asking for clarification

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **AI response timeout (>5s)** | Response timer exceeds threshold | Retry with simplified prompt | "Let me think about that differently... [response]" |
| **Speech recognition failure** | Low confidence score (<0.6) | Request clarification | "I didn't quite catch that. Could you say it again?" |
| **Context loss mid-conversation** | Session state error | Acknowledge and ask for recap | "Sorry, I lost my train of thought. What were we discussing?" |
| **Ambiguous user query** | Multiple interpretation possibilities | Ask clarifying question | "Do you mean your sleep quality or sleep duration?" |
| **Data unavailable for query** | User asks about untracked metric | Explain limitation and offer alternative | "I don't have your blood pressure data. Want to log it manually?" |
| **Out-of-scope question** | Topic classification outside health | Politely redirect | "I specialize in health coaching. For [topic], please consult [resource]." |

### Conversation Context Architecture

**Session Context (Active Call):**
- Current conversation transcript
- Topics discussed so far
- User's current emotional state (from tone analysis)
- Questions asked and answered
- Action items identified

**User Context (Persistent):**
- Complete health data (fitness, nutrition, wellbeing)
- User goals and progress
- Past conversation history (24 months rolling)
- Known preferences (communication style, depth level)
- Recent insights and recommendations
- Calendar context (if integrated)

**Real-Time Data Access:**
- Last 7 days of activity, sleep, nutrition, mood
- Current recovery score
- Today's progress on goals
- Recent cross-domain insights
- Pending action items

### Example Conversation Flow (Light Mode)

```
User: "Hey, how's my recovery today?"

AI (1.5s): "Your physical recovery is 82 - looking good! But your mental recovery is at 68, a bit lower than usual. How are you feeling?"

User: "Yeah, I'm kinda stressed about work."

AI (1.2s): "I can hear that. Want to talk about it, or should I suggest some stress-relief activities?"

User: "What activities?"

AI (1.8s): "Based on your patterns, a 20-minute walk usually boosts your mood by 15%. You could also try the breathing exercise you liked last week. Which sounds better?"

User: "I'll try the walk."

AI (1.0s): "Great choice! I'll check in with you afterward to see how you feel. Anything else before you go?"

User: "Nope, that's it."

AI (0.9s): "Perfect! Enjoy your walk. Talk soon!"

[Call ends, summary sent to app/WhatsApp]
```

### Cross-Pillar Connections

**To Fitness Pillar (E5):**
- AI discusses recovery scores, workout performance, sleep quality
- References recent activities and progress toward fitness goals
- Suggests workout intensity based on conversation about energy

**To Nutrition Pillar (E6):**
- Discusses meal patterns, nutrition goals, hydration
- References logged meals during conversation
- Suggests nutrition adjustments based on mentioned symptoms

**To Wellbeing Pillar (E7):**
- Most natural conversation topic (mood, stress, journaling)
- AI empathizes with emotional disclosures
- Encourages reflection and celebrates wins

**To Cross-Domain Intelligence (E8):**
- AI naturally weaves in cross-pillar insights during conversation
- "I noticed your workouts are better when you journal in the morning"
- Explains correlations in simple, conversational language

### Dependencies
- **E8 (Cross-Domain Intelligence):** Provides insights AI references in conversation
- **E5, E6, E7 (All Pillars):** Data sources for personalized conversation content
- **E4 (Mobile App):** Real-time transcription display, conversation history
- **F2.3 (Voice Tone Analysis):** Emotional state detection informs AI response style
- **Claude/DeepSeek:** LLM backend for natural language processing
- **Speech-to-Text & Text-to-Speech:** Real-time voice processing

### MVP Status
[X] MVP Core

---

## F2.3: VOICE TONE ANALYSIS

### Description
Emotion detection system that analyzes user's voice characteristics (pitch, pace, energy, tone) to infer emotional state (stress, excitement, fatigue, sadness) and feed this emotional context into the AI coach's response generation for more empathetic, contextually appropriate guidance.

### User Story
As a **Holistic Health Seeker** (P1), I want my AI coach to understand how I'm feeling from my voice so that I don't have to explicitly state my emotions every time and receive more empathetic responses that match my actual state.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Basic emotion detection (positive/neutral/negative), subtle AI response adaptation, no explicit mention of detected emotions unless critical. |
| **Deep** | Detailed emotion analysis (stress, energy, mood intensity), AI explicitly validates emotions ("You sound a bit stressed"), emotion tracking over time, emotional trend insights. |

### User Decisions Applied
- **Privacy-first:** Voice tone analysis happens in real-time, NOT stored as audio recordings
- **Accuracy threshold:** 70-80% accuracy for basic emotions (industry standard for voice sentiment)
- **Transparency:** Users can see emotion detection working (optional indicator in app)
- **Fallback:** If tone unclear, AI asks directly about emotional state
- **Integration:** Detected emotions feed into Mental Recovery Score and wellbeing data

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Emotion detection accuracy | 70-80% for basic emotions (positive/neutral/negative) | User validation surveys post-call |
| Stress detection accuracy | 65-75% for high stress indicators | Comparison with self-reported stress |
| User comfort with feature | 4.0/5 comfort rating | Privacy/trust surveys |
| AI empathy rating | 4.5/5 "AI understood how I felt" | Post-call feedback |
| Actionable emotion insights | 60% of detected emotions trigger appropriate AI response | Conversation quality analysis |

### Acceptance Criteria

- [ ] Real-time voice tone analysis during all calls (no audio storage)
- [ ] Detect basic emotional categories:
  - **Positive:** Happy, excited, energetic, calm
  - **Neutral:** Steady, conversational baseline
  - **Negative:** Stressed, sad, anxious, fatigued
- [ ] Analyze voice characteristics:
  - Pitch variation (monotone vs. expressive)
  - Speaking pace (rushed vs. slow)
  - Energy level (lethargic vs. animated)
  - Voice tension (relaxed vs. strained)
- [ ] Confidence scoring: Only act on emotions with >60% confidence
- [ ] AI response adaptation based on detected emotion:
  - **Stress detected:** Slower, calmer AI voice; offer stress-relief suggestions
  - **Sadness detected:** More empathetic tone; validate feelings; gentle check-in
  - **Excitement detected:** Match energy; celebrate wins
  - **Fatigue detected:** Suggest rest; shorter conversation
- [ ] Light mode: AI subtly adapts, rarely mentions detected emotion
- [ ] Deep mode: AI validates emotions explicitly ("You sound stressed - want to talk about it?")
- [ ] Emotion data integrated:
  - Feeds into Mental Recovery Score calculation
  - Logged as mood data point in wellbeing pillar
  - Tracked for emotional trend analysis
- [ ] Privacy compliance:
  - No audio recordings stored (only text transcript + metadata)
  - Emotion metadata stored as numerical values, not raw audio
  - User can opt-out of tone analysis (fallback to explicit mood questions)
- [ ] Fallback behavior: If tone analysis fails or confidence <60%, AI asks direct question

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Emotion detection uncertainty** | Confidence <60% | Default to neutral, ask directly | "How are you feeling right now?" |
| **Audio quality too poor** | SNR <10dB, excessive noise | Disable tone analysis for session | "There's background noise. Can you move somewhere quieter?" |
| **Conflicting emotion signals** | Words positive, tone negative | Prioritize tone, validate with user | "You said you're fine, but you sound a bit stressed. Everything okay?" |
| **Tone analysis processing delay** | Latency >2s | Use previous emotion state | Silent: Use last known emotional context |
| **User discomfort with feature** | User explicitly requests disable | Immediately disable, use explicit questions | "I've turned off tone analysis. I'll ask how you're feeling instead." |

### Voice Tone Analysis Technical Approach

**Acoustic Features Analyzed:**
- **Pitch (F0):** Mean, variance, range
- **Intensity:** Volume, dynamic range
- **Speaking Rate:** Words per minute, pause frequency
- **Voice Quality:** Jitter, shimmer (voice stability)
- **Spectral Features:** MFCC (Mel-frequency cepstral coefficients)

**Emotion Mapping (Basic - MVP):**

| Emotion | Acoustic Indicators | AI Response Adaptation |
|---------|-------------------|----------------------|
| **Stress/Anxiety** | High pitch, fast pace, low variation | Slower AI pace, calming tone, stress-relief offers |
| **Sadness/Low Mood** | Low pitch, slow pace, monotone | Empathetic validation, gentle suggestions, check-in |
| **Excitement/Energy** | High variation, fast pace, high intensity | Match energy, celebrate, maintain momentum |
| **Fatigue** | Low intensity, slow pace, breathy voice | Suggest rest, shorter responses, offer to end call |
| **Calm/Neutral** | Moderate pitch/pace, stable variation | Standard conversational AI tone |

**Privacy & Processing:**
- Audio processed in real-time, discarded after transcription
- Only metadata stored: timestamp, emotion category, confidence score
- GDPR/HIPAA compliant: No biometric data stored long-term
- User control: Opt-out available, no penalty for disabling

### Cross-Pillar Connections

**To Wellbeing Pillar (E7):**
- Detected emotions logged as mood data points
- Voice stress becomes part of stress tracking
- Emotional trends analyzed over time
- "Your voice stress was lower on days you journaled"

**To Recovery Monitoring (F5.3):**
- Voice-detected stress feeds Mental Recovery Score
- Morning call tone analyzed for recovery calculation
- Chronic stress patterns alert user

**To Cross-Domain Intelligence (E8):**
- "Your voice energy is 40% higher after morning workouts"
- "Stress in your voice correlates with <6 hours sleep"
- "You sound calmer on days with 3+ logged meals"

### Dependencies
- **E7 (Wellbeing Pillar):** Emotion data logged as mood entries
- **F5.3 (Recovery Monitoring):** Voice stress contributes to Mental Recovery Score
- **F2.2 (Real-Time AI Conversation):** Tone analysis informs AI response generation
- **AWS Transcribe:** Emotion detection API (or equivalent)
- **Speech-to-Text Pipeline:** Real-time audio processing for analysis

### MVP Status
[X] MVP Core

---

## F2.4: SESSION TYPES

### Description
Structured conversation templates that define different voice coaching session formats - from quick 5-minute check-ins to comprehensive 30-minute coaching sessions - each with specific purposes, conversation structures, and outcome expectations to match user needs and time availability.

### User Story
As a **Busy Professional** (P2), I want different types of coaching sessions based on my available time so that I can get meaningful guidance whether I have 5 minutes or 30 minutes, without feeling rushed or wasting time.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Access to quick check-in (5 min) and emergency support only. Simple session selection: "Quick check" or "I need help now". |
| **Deep** | Full session type library including scheduled deep coaching (20-30 min), goal reviews, weekly reflections, custom session requests. Session history with type labels. |

### Session Types Defined

#### 1. Quick Check-In (5 minutes)
**Purpose:** Rapid status update and single actionable insight
**Structure:**
1. Opening: "How are you feeling today?" (30 sec)
2. Key metric review: AI highlights 1-2 important patterns (2 min)
3. Single recommendation: One actionable suggestion (1.5 min)
4. Closing: Confirm action item (1 min)

**Triggers:**
- User-initiated: One-tap "Quick Check" button
- AI-initiated: Daily morning check-in (if user opted in)
- Usage: 60% of all calls (most common)

**Success Criteria:**
- [ ] Completes in 5 minutes ±1 minute
- [ ] Delivers 1 actionable recommendation
- [ ] 80% user satisfaction for time efficiency

---

#### 2. Coaching Session (20-30 minutes)
**Purpose:** Deep exploration of goals, patterns, and comprehensive guidance
**Structure:**
1. Opening reflection: "How's your week been?" (3-5 min)
2. Data review: Detailed multi-pillar analysis (8-10 min)
3. Insight discussion: Explore cross-domain connections (5-7 min)
4. Goal adjustment: Review and refine goals (3-5 min)
5. Action planning: Set 2-3 action items for week ahead (3-5 min)
6. Closing: Summary and next session scheduling (2 min)

**Triggers:**
- User-initiated: Scheduled recurring sessions (e.g., Sunday evenings)
- AI-suggested: "It's been a week since our last deep session - want to catch up?"
- Usage: 25% of all calls

**Success Criteria:**
- [ ] Covers 2+ health pillars
- [ ] Identifies 1+ cross-domain insight
- [ ] Sets 2-3 actionable goals
- [ ] 4.5/5 user value rating

---

#### 3. Emergency Support (10-15 minutes)
**Purpose:** Immediate emotional support and crisis resource provision
**Structure:**
1. Immediate acknowledgment: "I'm here. What's happening?" (1 min)
2. Active listening: Let user express without interruption (3-5 min)
3. Emotional validation: "That sounds really difficult" (1-2 min)
4. Immediate coping: Breathing exercise or grounding technique (3-5 min)
5. Resource provision: Crisis hotlines, professional help suggestions (2 min)
6. Follow-up: "Can I check on you tomorrow?" (1 min)

**Triggers:**
- User-initiated: "I need help" or crisis keywords detected
- AI-detection: Severe distress in voice tone + concerning language
- Usage: <5% of calls (critical safety feature)

**Success Criteria:**
- [ ] Connects within 15 seconds for emergency calls
- [ ] Provides appropriate crisis resources
- [ ] Escalation protocol followed (PRD Section 14)
- [ ] Follow-up check-in scheduled within 24 hours
- [ ] Safety team notified (if configured)

---

#### 4. Goal Review Session (15 minutes)
**Purpose:** Focused review of specific goal progress and adjustment
**Structure:**
1. Goal selection: "Which goal should we discuss?" (1 min)
2. Progress analysis: Review metrics and achievements (5 min)
3. Barrier exploration: "What's holding you back?" (4 min)
4. Goal adjustment: Modify target or strategy (3 min)
5. Commitment: Confirm adjusted goal (2 min)

**Triggers:**
- User-initiated: "Let's review my goals"
- AI-suggested: Goal deadline approaching or consistent failure detected
- Usage: 10% of calls

**Success Criteria:**
- [ ] Reviews 1-2 specific goals
- [ ] Identifies barriers to success
- [ ] Adjusts unrealistic goals when needed
- [ ] User commits to adjusted plan

---

### User Decisions Applied
- **Session selection:** User chooses session type or AI suggests based on context
- **Time flexibility:** Sessions can end early if user pressed for time
- **Session evolution:** Quick check can upgrade to coaching session if user has time
- **Emergency priority:** Emergency support always available, interrupts other sessions
- **Scheduled sessions:** Users can set recurring weekly coaching sessions

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Session type adoption | 80% of users try 2+ session types | Session variety tracking |
| Time adherence | 90% of sessions complete within expected duration | Session duration analytics |
| Session satisfaction by type | 4.4/5 average across all types | Post-session surveys |
| Emergency session response time | <15 seconds connection | Critical path monitoring |
| Session type appropriateness | 85% users report "right session for my need" | User feedback |

### Acceptance Criteria

- [ ] Session type selection menu clearly presented before call
- [ ] AI suggests appropriate session type based on:
  - Time of day (morning = quick check, evening = coaching)
  - Recent patterns (goal struggles = goal review)
  - User history (weekly coaching sessions scheduled)
- [ ] Session timer visible in app during call (optional for user)
- [ ] AI manages time gracefully: "We have 2 minutes left - any final questions?"
- [ ] Session upgrade option: "Want to extend this to a full coaching session?"
- [ ] Emergency keyword detection triggers immediate session type switch
- [ ] Session history labeled by type for user reference
- [ ] Post-session summary tailored to session type
- [ ] Scheduled sessions send reminder 1 hour before start time
- [ ] All session types accessible via mobile app and WhatsApp voice command

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Session runs over time** | Duration exceeds target by >5 min | AI prompts wrap-up | "We're running long - should we wrap up or continue?" |
| **User ends session early** | Call <50% expected duration | Offer quick summary | "Want a quick recap before you go?" |
| **Emergency keywords mid-session** | Crisis detection during any session | Immediate switch to emergency protocol | "This sounds serious. Let me help you right now." |
| **Unclear session type request** | User says "Let's talk" without specifics | Ask clarifying question | "Quick check-in or deeper conversation today?" |
| **Scheduled session no-show** | User doesn't connect within 5 min | Send reminder, reschedule option | "Missed your session. Reschedule or cancel?" |

### Session Type Selection Logic

```
AI Session Type Recommendation:

If (crisis keywords detected OR severe stress tone):
  → Emergency Support (immediate)

Else if (user has <10 minutes):
  → Quick Check-In

Else if (weekly coaching session scheduled):
  → Coaching Session (20-30 min)

Else if (goal deadline approaching OR consistent goal failure):
  → Goal Review Session

Else if (user preference = deep mode AND no recent coaching session):
  → Offer Coaching Session

Else:
  → Default to Quick Check-In

User can always override AI suggestion.
```

### Cross-Pillar Connections

**To All Pillars (E5, E6, E7):**
- Coaching sessions cover multiple pillars for holistic view
- Quick check-ins may focus on single pillar concern
- Goal reviews can address fitness, nutrition, or wellbeing goals

**To Cross-Domain Intelligence (E8):**
- Coaching sessions ideal for exploring cross-pillar insights
- "Let's talk about how your sleep affects your workouts"
- Multi-pillar patterns discussed in depth

**To Wellbeing Pillar (E7):**
- Emergency support primarily addresses mental health crises
- Coaching sessions include emotional reflection
- Quick check-ins gauge daily mood and stress

### Dependencies
- **E7 (Wellbeing Pillar):** Emergency support protocols, crisis resources
- **F5.4 (Fitness Goals):** Goal review sessions reference fitness goals
- **E6 (Nutrition Goals):** Goal review sessions reference nutrition goals
- **E8 (Cross-Domain Intelligence):** Coaching sessions explore insights
- **E4 (Mobile App):** Session type selection UI, session history
- **E3 (WhatsApp):** Session reminders, follow-up messages

### MVP Status
[X] MVP Core

---

## F2.5: POST-CALL SUMMARY

### Description
Automated conversation summary generated immediately after each voice coaching session, capturing key discussion points, action items, insights discovered, and emotional themes - delivered to both the mobile app and WhatsApp for easy reference and accountability.

### User Story
As an **Optimization Enthusiast** (P3), I want a written summary of my coaching calls so that I can remember the insights and action items without having to take notes during the conversation, and refer back to them throughout the week.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Brief 3-5 bullet summary: key insight + 1-2 action items. Sent via WhatsApp and app notification. |
| **Deep** | Comprehensive summary: full conversation themes, detailed action items with deadlines, AI's reasoning for recommendations, emotional tone notes, related insights, exportable to notes apps. |

### User Decisions Applied
- **Automatic generation:** No user action required, summary auto-created within 30 seconds of call end
- **Multi-channel delivery:** Sent to both app (permanent) and WhatsApp (convenient)
- **Structured format:** Consistent template for easy scanning
- **Action item extraction:** AI identifies commitments user made during call
- **Privacy:** Summaries stored securely, not shared with third parties

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Summary generation speed | <30 seconds post-call | Backend analytics |
| Summary accuracy | 90% users agree summary captures key points | Post-summary feedback |
| Action item completion | 60% of action items completed within 7 days | Action item tracking |
| Summary engagement | 75% of users view summary within 24 hours | View analytics |
| User satisfaction with summaries | 4.5/5 usefulness rating | In-app survey |

### Acceptance Criteria

- [ ] Summary auto-generated within 30 seconds of call ending
- [ ] Delivered to both mobile app (Insights section) and WhatsApp
- [ ] Light mode summary includes:
  - Call date/time and duration
  - Session type (Quick Check, Coaching Session, etc.)
  - 1 key insight discussed
  - 1-2 action items
- [ ] Deep mode summary includes:
  - Call metadata (date, duration, session type)
  - Conversation themes (pillars discussed: fitness, nutrition, wellbeing)
  - Key insights discovered (with context)
  - Detailed action items with suggested deadlines
  - Emotional tone analysis summary ("You seemed energized about your progress")
  - AI's reasoning for recommendations ("Based on your sleep patterns...")
  - Related cross-domain insights referenced
  - Link to full transcript (accessibility compliance)
- [ ] Action items are interactive:
  - Tap to mark complete
  - Add to calendar/reminders
  - Set deadline if not AI-suggested
- [ ] Summary includes emoji indicators for quick scanning (Light mode)
- [ ] Export options: Copy to clipboard, share to notes apps, email
- [ ] Summary searchable in call history
- [ ] Follow-up prompt: "How did these action items go?" in next call
- [ ] Privacy: Summary stored encrypted, deleted with account deletion

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Summary generation fails** | API timeout or processing error | Retry with simplified summary | "Summary taking longer than usual. You'll receive it shortly." |
| **Very short call (<1 min)** | Call duration insufficient | Minimal summary or skip | "Call was brief. No summary generated." |
| **No clear action items** | AI can't identify commitments | Summary notes discussion topics only | "We talked about [topics]. No specific action items set." |
| **Delivery failure (WhatsApp)** | WhatsApp API error | Retry, fallback to app-only | "Summary available in app. WhatsApp delivery delayed." |
| **User declines summary** | User opts out during call | Respect preference, store opt-out | "No problem! Summaries disabled. Change in settings anytime." |

### Summary Format Examples

**Light Mode Summary (WhatsApp):**
```
📞 Quick Check-In (5 min) - Dec 2, 8:15am

💡 Key Insight: Your recovery is strong (85) - great day for a tough workout!

✅ Action Items:
- Try the 30-min HIIT workout recommended today
- Log dinner before 7pm for better sleep

👉 View full summary in app
```

**Deep Mode Summary (Mobile App):**
```
📞 Coaching Session (28 minutes)
December 2, 2025 - 8:00am - 8:28am

🎯 Session Goals:
Review weekly progress and plan upcoming week

📊 Pillars Discussed:
- Fitness: Sleep quality, recovery, workout consistency
- Wellbeing: Morning energy, stress levels

💡 Key Insights Discovered:

1. Sleep-Workout Connection (Cross-Domain Insight)
   "Your workout performance is 30% better following 7+ hours of sleep.
   This week you averaged 6.8 hours, which may explain the lower energy."

2. Morning Routine Impact
   "Days you journal before 9am correlate with higher afternoon energy
   and better workout completion rates (85% vs 60%)."

3. Recovery Trend
   "Your physical recovery is improving week-over-week (+12 points),
   but mental recovery has plateaued at 68. Let's focus on stress
   management this week."

✅ Action Items (This Week):

1. Sleep Goal Adjustment (PRIORITY)
   - New target: 7-7.5 hours/night (up from 6.5-7)
   - Set bedtime alarm for 10:30pm
   - Track sleep quality correlation with workout performance
   - Deadline: 7 days (Dec 9)
   [Tap to add to calendar]

2. Morning Journaling
   - Continue current 5x/week streak
   - Try 3-minute prompts if short on time
   - Focus on gratitude and daily intentions
   [Tap for journaling prompts]

3. Stress Reduction
   - Try 10-min meditation 3x this week
   - Consider yoga instead of HIIT on high-stress days
   - Use breathing exercise when stress >7/10
   [Tap for guided meditation]

😊 Emotional Summary:
You sounded energized when discussing your fitness progress but
mentioned feeling "overwhelmed" by work stress twice. Your tone
was calm overall, suggesting you're managing well despite pressure.

🔗 AI Reasoning:
Sleep recommendation based on your 30-day sleep-performance
correlation (R² = 0.72). Meditation suggested because your HRV
improves 15% on days with mindfulness practice.

📝 Related Insights:
- "Best Sleep Habits for You" (Nov 28)
- "Morning Routine Optimization" (Nov 25)

📄 Full Transcript Available
[Tap to view conversation transcript]

---
Next coaching session: Sunday, Dec 8, 7:00pm
[Reschedule] [Cancel]
```

### Action Item Tracking Integration

**Action Item Lifecycle:**
1. Extracted from call summary
2. Added to user's action item dashboard (E4 - Mobile App)
3. Progress tracked throughout week
4. AI asks about action items in next call: "How did the sleep goal go?"
5. Completed items celebrated, incomplete items explored without judgment
6. Action item completion feeds into goal progress tracking (F5.4, E6, E7)

**AI Follow-Up Questions (Next Call):**
- "You planned to try meditation 3x this week. How did it go?"
- "I noticed you completed 2 of 3 action items. Want to talk about the third?"
- "You crushed your sleep goal this week! What helped?"

### Cross-Pillar Connections

**To All Pillars (E5, E6, E7):**
- Summaries tag which pillars were discussed
- Action items link to specific pillar goals
- Cross-pillar insights highlighted in summary

**To Mobile App (E4):**
- Summaries stored in dedicated "Call History" section
- Action items appear in dashboard with completion tracking
- Summaries searchable and exportable

**To WhatsApp (E3):**
- Light summaries delivered via WhatsApp for convenience
- Action item reminders sent via WhatsApp mid-week
- Quick feedback: Reply "Done ✅" to mark action items complete

**To Cross-Domain Intelligence (E8):**
- Summaries highlight cross-pillar insights discussed
- AI references past summaries to track progress on insights
- "In our last call, we talked about sleep-workout connection. Here's your update..."

### Dependencies
- **F2.2 (Real-Time AI Conversation):** Conversation transcript input for summary generation
- **E4 (Mobile App):** Primary summary storage and display UI
- **E3 (WhatsApp):** Secondary summary delivery channel
- **E8 (Cross-Domain Intelligence):** Insight linking in summaries
- **Claude/DeepSeek:** Summary generation and action item extraction

### MVP Status
[X] MVP Core

---

## F2.6: VOICE PREFERENCES

### Description
Comprehensive user control system for voice coaching experience customization - including AI coach voice selection (gender, accent, pace), calling hours restrictions, AI-initiated call frequency, conversation depth preferences, and accessibility options for personalized, respectful voice interaction.

### User Story
As a **Holistic Health Seeker** (P1), I want to customize my AI coach's voice and calling preferences so that conversations feel comfortable, respectful of my schedule, and aligned with my communication style.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Basic preferences only: Coach voice (male/female), Do-not-disturb hours, AI-initiated calls (on/off). Simple toggle switches. |
| **Deep** | Advanced customization: Multiple voice options (accent, pace), detailed calling schedule, conversation depth default (light/deep), language preferences, accessibility settings (transcription size, speech rate). |

### User Decisions Applied
- **Voice selection:** Multiple AI voice options (gender, accent, pace variations)
- **Schedule control:** User sets when AI can initiate calls (quiet hours, do-not-disturb)
- **Frequency control:** Adjust how often AI proactively reaches out
- **Conversation defaults:** Set preference for light vs. deep mode conversations
- **Accessibility:** Controls for hearing impairment, speech processing speed, transcription size

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Preference customization rate | 70% of users adjust ≥1 preference | Settings analytics |
| Voice preference satisfaction | 4.6/5 comfort with selected voice | User surveys |
| Calling hours adherence | 100% AI calls respect quiet hours | System compliance monitoring |
| Preference retention | 85% users keep preferences >30 days | Settings stability tracking |
| Accessibility usage | 15% users enable accessibility features | Feature adoption analytics |

### Acceptance Criteria

- [ ] Voice preference settings include:
  - **Voice selection:** 4+ voice options (e.g., Female/Male, American/British, Calm/Energetic)
  - **Speech pace:** Adjustable speed (0.8x, 1.0x, 1.2x, 1.5x)
  - **Voice preview:** "Test this voice" button to hear sample before selecting
- [ ] Calling hours preferences:
  - **Quiet hours:** Set daily time range when AI cannot initiate calls (default: 10pm-7am)
  - **Do-not-disturb days:** Block AI-initiated calls on specific days (e.g., weekends)
  - **Timezone auto-detection:** Respect user's local time
  - **Override option:** "Call anyway" button for user-initiated calls during quiet hours
- [ ] AI-initiated call frequency:
  - **Off:** AI never initiates calls (user-only initiation)
  - **Minimal:** AI initiates only for critical patterns (default)
  - **Moderate:** AI initiates for weekly check-ins + critical patterns
  - **Active:** AI initiates daily check-ins + coaching suggestions
- [ ] Conversation depth default:
  - **Light mode default:** Quick, concise conversations unless user extends
  - **Deep mode default:** Detailed, exploratory conversations unless user requests brevity
  - **Adaptive:** AI learns from user behavior and adjusts automatically
- [ ] Language preferences (MVP: English only, future: multilingual):
  - Language selection dropdown
  - Accent preference within language
- [ ] Accessibility options:
  - **Real-time transcription:** On/off toggle, font size adjustment (small/medium/large/extra large)
  - **Slow speech mode:** AI speaks 20% slower for clarity
  - **High contrast mode:** Transcription display with high contrast colors
  - **Hearing assistance:** Option to switch to text chat mid-call if voice unclear
- [ ] Notification preferences:
  - **Call reminders:** On/off for scheduled sessions
  - **Summary notifications:** Immediate/delayed/off for post-call summaries
  - **Action item reminders:** Frequency for action item nudges
- [ ] Privacy preferences:
  - **Voice tone analysis:** On/off toggle (F2.3)
  - **Call recording disclaimer:** Clarify only transcripts stored, not audio
- [ ] Preference sync across devices
- [ ] Preference export/import for device transfers
- [ ] Reset to defaults button with confirmation

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Invalid calling hours** | User sets quiet hours >18 hours/day | Warn about limited availability | "This leaves only 6 hours for calls. Are you sure?" |
| **Voice option unavailable** | Selected voice deprecated or offline | Fallback to default voice | "Your preferred voice is temporarily unavailable. Using default." |
| **Timezone mismatch** | User travels, timezone changes | Auto-adjust or prompt confirmation | "Detected new timezone. Update quiet hours?" |
| **Conflicting preferences** | Deep mode + very short call timeouts | Warn about conflict | "Deep mode works best with longer calls. Adjust timeout?" |
| **Accessibility conflict** | High speech rate + transcription off | Suggest enabling transcription | "Fast speech may be hard to follow. Enable transcription?" |

### Voice Options (MVP Minimum)

| Voice ID | Description | Characteristics | Use Case |
|----------|-------------|----------------|----------|
| **Coach Maya** | Female, American, Warm & Encouraging | Moderate pace, friendly tone, empathetic | Default, most users |
| **Coach Alex** | Male, American, Calm & Professional | Slower pace, reassuring tone | Users preferring calmer guidance |
| **Coach Jordan** | Gender-neutral, British, Energetic | Faster pace, motivational tone | Users wanting high-energy coaching |
| **Coach Sam** | Male, American, Gentle & Supportive | Slow pace, soft tone, non-judgmental | Users needing gentle approach |

**Future voices:** Spanish, French, Arabic, Urdu (post-MVP expansion)

### Preference Initialization Flow (Onboarding)

**During E1 Onboarding:**
1. Voice selection: "Choose your AI coach's voice" + preview samples
2. Calling hours: "When can I call you?" (default: 7am-10pm)
3. AI-initiated calls: "Can I proactively check in on you?" (default: Minimal)
4. Conversation depth: "Quick check-ins or deeper conversations?" (default: Adaptive)
5. Accessibility needs: "Any accessibility preferences?" (default: Off)

**Post-Onboarding:**
- All preferences adjustable anytime in Settings
- Preference changes take effect immediately
- AI confirms preference changes: "Got it! I'll use Coach Alex from now on."

### Cross-Pillar Connections

**To Onboarding (E1):**
- Initial preferences set during onboarding wizard
- Preference choices inform AI's first coaching style

**To Wellbeing (E7):**
- Voice preference affects emotional comfort during calls
- Accessibility options critical for inclusive wellbeing support

**To Mobile App (E4):**
- Settings UI for all voice preferences
- Preference dashboard shows current settings at a glance

**To WhatsApp (E3):**
- Calling hours preferences apply to WhatsApp-initiated calls too
- Notification preferences affect WhatsApp message delivery

### Dependencies
- **E1 (Onboarding):** Initial preference collection during sign-up
- **E4 (Mobile App):** Settings UI for preference management
- **Text-to-Speech API:** Multiple voice options backend
- **F2.4 (Session Types):** Conversation depth preference affects session types
- **F2.3 (Voice Tone Analysis):** Privacy toggle for tone analysis feature

### MVP Status
[X] MVP Core

---

## EPIC SUCCESS CRITERIA

### Launch Readiness (All Features)

- [ ] All 6 voice coaching features functional across Light and Deep modes
- [ ] Voice call initiation works within 30 seconds (user and AI-initiated)
- [ ] Real-time AI conversation maintains <2s first response latency (p95)
- [ ] Voice tone analysis detects basic emotions with 70%+ accuracy
- [ ] All 4 session types implemented and accessible
- [ ] Post-call summaries auto-generate within 30 seconds
- [ ] Voice preferences customizable with 4+ voice options
- [ ] Emergency support protocol functional with crisis resources
- [ ] All features accessible via Mobile App and WhatsApp
- [ ] Error handling graceful for all failure scenarios
- [ ] Privacy compliance: No audio stored, only transcripts + metadata

### Quality Gates

| Gate | Criteria | Measurement |
|------|----------|-------------|
| **Performance** | <2s first response (p95), <30s call connection | Real-time monitoring |
| **Accuracy** | 70-80% emotion detection, 90% summary accuracy | User validation surveys |
| **Reliability** | >99% call connection success, <1% dropped calls | System health metrics |
| **User Satisfaction** | 4.6/5 overall voice coaching rating | Post-call NPS surveys |
| **Safety** | 100% emergency protocol compliance | Safety audit |
| **Accessibility** | WCAG 2.1 AA compliance for transcription | Accessibility testing |

### User Experience Validation

| Persona | Key Experience | Success Indicator |
|---------|---------------|-------------------|
| **P1: Holistic Health Seeker** | Discovers cross-pillar insights through conversation | Uses voice coaching 4+ times/week, reports "aha moments" |
| **P2: Busy Professional** | Gets quick guidance without time waste | 70%+ calls are Quick Check-Ins (<5 min), high satisfaction |
| **P3: Optimization Enthusiast** | Engages in deep coaching sessions | Uses Coaching Sessions 2+ times/month, exports summaries |

---

## CROSS-EPIC DEPENDENCIES

### E1: Onboarding & Assessment
- Voice preferences set during onboarding
- Consent for AI-initiated calls collected upfront
- First voice call recommended post-onboarding to test feature

### E3: WhatsApp Integration
- Voice command triggers: "Call my coach" initiates voice call
- Call summaries delivered via WhatsApp
- Seamless handoff between WhatsApp text and voice calls

### E4: Mobile App
- Primary UI for call button, call history, session selection
- Real-time transcription display during calls
- Settings UI for voice preferences
- Post-call summary storage and action item dashboard

### E5: Fitness Pillar
- Voice calls discuss recovery scores, workout recommendations
- AI references sleep quality, activity patterns in conversation
- "How's my recovery?" is common voice query

### E6: Nutrition Pillar
- Voice calls address meal logging, nutrition goals
- AI discusses hydration, calorie intake during conversations
- "What should I eat?" triggers nutrition coaching

### E7: Wellbeing Pillar
- Voice coaching most natural for emotional discussions
- Mood check-ins, stress support, journaling encouragement
- Emergency support addresses mental health crises
- Voice tone analysis feeds Mental Recovery Score

### E8: Cross-Domain Intelligence
- Voice conversations ideal for explaining complex insights
- AI weaves cross-pillar correlations into natural dialogue
- "Why do I feel this way?" triggers cross-domain exploration

### E9: Data Integrations
- Voice calls reference data from all integrated sources
- AI says "According to your WHOOP data..." for transparency

### E10: Analytics & Insights Dashboard
- Call frequency and duration metrics tracked
- Voice coaching engagement feeds into user activity scoring
- Action item completion rates analyzed

---

## TECHNICAL CONSIDERATIONS

### Architecture Overview

**Voice Pipeline:**
```
User speaks → Speech-to-Text (AWS Transcribe) → NLP Processing (Claude/DeepSeek)
→ Context Engine (user data + conversation history) → Response Generation
→ Text-to-Speech (AWS Polly) → AI speaks → User hears (within 2s total)

Parallel: Voice Tone Analysis → Emotion Detection → Mental Recovery Score
```

### Data Models (Voice Domain)

**Call Record:**
```json
{
  "call_id": "uuid",
  "user_id": "uuid",
  "start_time": "2025-12-02T08:00:00Z",
  "end_time": "2025-12-02T08:28:00Z",
  "duration_seconds": 1680,
  "session_type": "coaching_session|quick_checkin|emergency|goal_review",
  "initiated_by": "user|ai",
  "voice_preference": "coach_maya",
  "transcript": "Full conversation text...",
  "summary": "Post-call summary text...",
  "action_items": [
    {"item": "Sleep 7-7.5 hours/night", "deadline": "2025-12-09", "completed": false}
  ],
  "emotional_tone": {
    "overall": "calm",
    "stress_level": 3,
    "energy_level": 7,
    "detected_emotions": ["neutral", "positive", "calm"]
  },
  "pillars_discussed": ["fitness", "wellbeing"],
  "insights_referenced": ["uuid1", "uuid2"]
}
```

**Voice Preference Record:**
```json
{
  "user_id": "uuid",
  "voice_selection": "coach_maya",
  "speech_rate": 1.0,
  "quiet_hours": {
    "start": "22:00",
    "end": "07:00",
    "timezone": "America/New_York"
  },
  "ai_call_frequency": "minimal|moderate|active|off",
  "conversation_depth_default": "light|deep|adaptive",
  "accessibility": {
    "transcription_enabled": true,
    "transcription_font_size": "medium",
    "slow_speech_mode": false,
    "high_contrast": false
  },
  "tone_analysis_enabled": true,
  "summary_notifications": "immediate"
}
```

### API Endpoints (Voice Coaching)

```
POST   /api/v1/voice/call/initiate           - Start a voice call (user or AI)
GET    /api/v1/voice/call/{id}/status        - Check call connection status
POST   /api/v1/voice/call/{id}/end           - End active call
GET    /api/v1/voice/call/{id}/transcript    - Get call transcript
GET    /api/v1/voice/call/{id}/summary       - Get post-call summary

GET    /api/v1/voice/calls                   - List user's call history
GET    /api/v1/voice/calls/stats             - Call frequency, duration analytics

PUT    /api/v1/voice/preferences             - Update voice preferences
GET    /api/v1/voice/preferences             - Get current preferences
GET    /api/v1/voice/voices                  - List available voice options
POST   /api/v1/voice/voices/{id}/preview     - Preview voice sample

POST   /api/v1/voice/session/schedule        - Schedule recurring coaching session
GET    /api/v1/voice/session/scheduled       - List scheduled sessions
DELETE /api/v1/voice/session/{id}            - Cancel scheduled session

POST   /api/v1/voice/emergency               - Trigger emergency support protocol
```

### Performance Requirements

| Operation | Target Latency | Rationale |
|-----------|---------------|-----------|
| Call connection | <30 seconds | User expectation for "instant" calls |
| First AI response | <2 seconds (p95) | Natural conversation flow |
| Complex query response | <5 seconds (p95) | Acceptable for data-heavy queries |
| Voice tone analysis | <1 second | Real-time emotion detection |
| Summary generation | <30 seconds post-call | Immediate actionability |
| Transcript processing | <10 seconds | Accessibility compliance |

### Security & Privacy

- **Audio Handling:** Audio processed in real-time, NOT stored (only transcripts saved)
- **Encryption:** All transcripts encrypted at rest (AES-256) and in transit (TLS 1.3)
- **Consent:** Clear user consent for voice tone analysis, opt-out available
- **Access Control:** Only user can access own call transcripts and summaries
- **Data Retention:** Transcripts stored for 24 months, then deleted (or per user request)
- **GDPR Compliance:** Right to erasure deletes all call records within 30 days
- **HIPAA Compliance:** Claude/DeepSeek HIPAA-compliant infrastructure for health conversations
- **Biometric Data:** Voice tone metadata (not raw audio) stored as health data
- **Crisis Data:** Emergency calls flagged, safety protocols followed, logs retained for audit

---

## COMPETITIVE ANALYSIS (VOICE COACHING)

### Feature Uniqueness Matrix

| Feature | WHOOP | BEVEL | Noom | yHealth | yHealth Advantage |
|---------|-------|-------|------|---------|-------------------|
| **Voice AI Coaching** | ❌ | ❌ | Text-based coach only | ✅ **Full Voice** | ONLY platform with real-time voice AI coach |
| **Emotion Detection** | ❌ | ❌ | ❌ | ✅ **Voice Tone Analysis** | Emotional intelligence unique to yHealth |
| **Proactive AI Calls** | ❌ | ❌ | Push notifications only | ✅ **AI-Initiated** | AI reaches out, not just reactive |
| **Session Types** | ❌ | ❌ | Single chat flow | ✅ **4 Session Types** | Structured coaching vs. unstructured chat |
| **Post-Call Summaries** | N/A | N/A | Chat history only | ✅ **Auto-Summaries** | Actionable takeaways, not just logs |
| **Cross-Pillar Conversations** | ❌ | Limited | Nutrition focus only | ✅ **Holistic** | Fitness + Nutrition + Wellbeing in one call |

### yHealth's Voice Coaching Moat

**What We Do BETTER (Unique):**
1. **Real Voice Conversations:** Only AI health coach you can TALK to, not just text
2. **Emotional Intelligence:** Voice tone analysis + empathetic responses
3. **Proactive Coaching:** AI initiates check-ins, not just user-initiated queries
4. **Cross-Pillar Dialogue:** Discuss fitness, nutrition, and wellbeing in one conversation
5. **Structured Sessions:** Multiple session types vs. generic chatbot flow

**Strategic Positioning:**
> "WHOOP and BEVEL show you what happened. yHealth TALKS to you about what to do next - through voice conversations that feel like a caring friend who knows your complete health story."

**Voice as THE Differentiator:**
- Competitors = Analytics dashboards + text chatbots
- yHealth = Conversational AI health companion via voice
- Voice coaching isn't a feature - it's THE yHealth experience

---

## TESTING STRATEGY

### Unit Testing
- Call initiation logic (user vs. AI triggers)
- Session type selection algorithm
- Voice tone emotion classification
- Summary generation and action item extraction
- Preference validation and enforcement

### Integration Testing
- End-to-end call flow (initiation → conversation → summary)
- Cross-pillar data access during calls (fitness, nutrition, wellbeing)
- Multi-channel integration (app, WhatsApp, voice)
- Transcript and summary delivery to app + WhatsApp
- Scheduled session reminders and calendar integration

### User Acceptance Testing
- Voice naturalness and conversation flow (user panels)
- Emotion detection accuracy (self-reported vs. detected)
- Session type appropriateness (right session for need)
- Summary completeness (captures key points and action items)
- Voice preference satisfaction (voice options, pace, schedule)

### Performance Testing
- Call connection speed under load (1000+ concurrent calls)
- Response latency at p50, p95, p99 percentiles
- Voice tone analysis processing speed
- Summary generation speed with long conversations (30+ min)
- API response times for call initiation and transcript retrieval

### Safety Testing
- Emergency keyword detection accuracy
- Crisis protocol execution (resource provision, escalation)
- Harmful content filtering effectiveness
- Boundary enforcement (medical advice, out-of-scope queries)
- Privacy compliance (audio deletion, consent verification)

---

## RISKS & MITIGATIONS

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **High latency ruins conversation flow** | Critical | Medium | Optimize pipeline, aggressive caching, fallback to text if >5s latency |
| **Emotion detection privacy concerns** | High | Medium | Transparent opt-in/out, clear privacy policy, no audio storage |
| **AI gives harmful health advice** | Critical | Low | Medical disclaimer, boundary enforcement, human review of edge cases |
| **Emergency support inadequate** | Critical | Low | Crisis resources always provided, escalation protocol, safety team review |
| **Users don't adopt voice (prefer text)** | High | Medium | Multi-channel flexibility, demonstrate value early, quick wins via voice |
| **Voice tone analysis low accuracy** | Medium | Medium | Conservative confidence thresholds, fallback to explicit questions |
| **Scheduled calls feel intrusive** | Medium | Low | User control over frequency, easy opt-out, respectful timing |
| **Call connection failures frustrate users** | High | Medium | Retry logic, graceful degradation to text, clear error messages |

---

## ROADMAP & FUTURE ENHANCEMENTS

### MVP (Current Scope)
All 6 features (F2.1-F2.6) as defined above

### Post-MVP v1.1 (+3 months)
- **Multi-language support:** Spanish, French, Arabic voice coaching
- **Voice journal mode:** "Tell me about your day" free-form reflection
- **Call scheduling integration:** Sync with Google Calendar, Apple Calendar
- **Group coaching calls:** Family or team coaching sessions

### Post-MVP v1.2 (+6 months)
- **Advanced emotion detection:** 10+ emotions (frustration, pride, worry, etc.)
- **Voice personality customization:** Adjust AI's formality, humor, directness
- **Smart interruptions:** AI detects when to interject vs. listen silently
- **Voice-activated insights:** "Tell me about my sleep-workout connection"

### Post-MVP v2.0 (+12 months)
- **Real-time workout coaching:** Voice-guided workouts with biometric monitoring
- **Clinical integrations:** Share call summaries with healthcare providers (consent-based)
- **Predictive coaching:** "Tomorrow you'll likely feel low energy - here's what to do today"
- **AI personality evolution:** AI adapts personality based on user feedback over time

---

## DOCUMENT GOVERNANCE

**Review Schedule:** After beta user testing of voice coaching features
**Update Triggers:** User feedback on voice quality, latency issues, session type effectiveness, privacy concerns
**Version Control:** All feature changes require version increment with rationale
**Ownership:** Product Team with input from AI/ML Engineering (NLP accuracy) and Design (conversation flow UX)

---

## APPENDIX A: USER FLOWS

### Flow 1: First Voice Call (New User)
1. User completes onboarding (E1), selects "Coach Maya" voice
2. App prompts: "Want to try a quick call with your AI coach?"
3. User taps "Call Coach" → Connects within 20 seconds
4. AI: "Hi! I'm your AI health coach. This is a quick check-in - how are you feeling today?"
5. User: "Pretty good, but tired."
6. AI: "I can hear that. Your sleep was 6.5 hours last night - below your 7-hour goal. Want to talk about improving it?"
7. User: "Yeah, sure."
8. 3-minute conversation about sleep strategies
9. AI: "Great plan! I'll send you a summary with action items."
10. Call ends, summary delivered to app + WhatsApp within 30 seconds
11. User views summary, taps "Mark complete" on first action item

### Flow 2: AI-Initiated Check-In (Concerning Pattern)
1. User has 5 consecutive days of poor sleep (<6 hours)
2. AI detects pattern, checks user preferences (AI calls = "Minimal" enabled)
3. AI initiates call at 6pm (within user's calling hours: 7am-10pm)
4. User's phone rings with "Your AI Coach is calling" notification
5. User answers within 15 seconds
6. AI: "Hey! I noticed your sleep has been off this week. Everything okay?"
7. User explains work stress
8. 12-minute conversation shifts to Emergency Support session type (stress detected)
9. AI provides breathing exercise, stress-relief suggestions, validates feelings
10. Call ends, AI schedules follow-up: "Can I check on you tomorrow?"
11. User agrees, follow-up call auto-scheduled for next day 6pm

### Flow 3: Emergency Support Trigger
1. User initiates call: "I need help" voice command via WhatsApp
2. System prioritizes as emergency, connects within 10 seconds
3. AI: "I'm here. What's happening?"
4. User discloses severe distress (suicidal ideation keywords detected)
5. AI immediately switches to Emergency Support protocol:
   - Active listening, emotional validation
   - Crisis resources displayed in app + read aloud
   - "National Suicide Prevention Lifeline: 988. Can I connect you?"
6. User declines, says talking helps
7. AI continues supportive conversation (15 minutes)
8. AI: "I'm glad you reached out. Can I check on you in a few hours?"
9. User agrees, follow-up scheduled for 3 hours
10. Safety team flagged (if configured), call logged for review
11. Summary sent with crisis resources highlighted

---

## APPENDIX B: CONVERSATION DESIGN PRINCIPLES

### AI Coach Personality (Baseline)
- **Tone:** Warm, encouraging, non-judgmental, knowledgeable but not condescending
- **Language:** Conversational, simple vocabulary, avoids medical jargon unless user prefers
- **Empathy:** Validates emotions, celebrates wins, offers support during struggles
- **Curiosity:** Asks open-ended questions to deepen understanding
- **Transparency:** Explains AI's reasoning, cites data sources, admits uncertainty
- **Boundaries:** Clearly states limitations (not a doctor, not a therapist)

### Conversation Best Practices
1. **Start with open-ended questions:** "How are you feeling today?" vs. "Are you feeling good?"
2. **Acknowledge emotions:** "That sounds really frustrating" vs. ignoring emotional cues
3. **Summarize understanding:** "So you're saying your energy is low because of poor sleep?"
4. **Offer choices:** "Would you like to talk about nutrition or focus on sleep?"
5. **Celebrate progress:** "You've logged meals 6 days straight - that's amazing!"
6. **Normalize struggles:** "Many people find sleep tracking challenging at first"
7. **End with action:** "What's one thing you'll try this week?"
8. **Respect time:** "We have 2 minutes left - any final questions?"

### Conversation No-Nos
- ❌ Never diagnose medical conditions
- ❌ Never prescribe medications or specific dosages
- ❌ Never shame or guilt users for unhealthy behaviors
- ❌ Never use fear-based motivation
- ❌ Never make promises about health outcomes
- ❌ Never override user's stated preferences or goals
- ❌ Never continue conversation if user wants to end

---

## APPENDIX C: TERMINOLOGY GLOSSARY

| Term | Definition |
|------|------------|
| **Voice Coaching** | Real-time AI-powered voice conversations for health guidance and support |
| **Session Type** | Structured conversation format (Quick Check-In, Coaching Session, Emergency Support, Goal Review) |
| **Voice Tone Analysis** | Acoustic feature detection to infer user's emotional state from voice characteristics |
| **Call Initiation** | Process of starting a voice call (user-initiated or AI-initiated) |
| **Post-Call Summary** | Automated text summary of conversation key points, insights, and action items |
| **Voice Preferences** | User-customizable settings for AI coach voice, calling hours, conversation depth, accessibility |
| **AI-Initiated Call** | Proactive call started by AI based on health patterns or scheduled sessions (requires user consent) |
| **Emergency Support** | Crisis-focused session type with emotional validation, coping techniques, and resource provision |
| **Context Awareness** | AI's ability to remember past conversations and reference user's complete health data |
| **Real-Time Transcription** | Live text display of conversation during call for accessibility and reference |
| **Quiet Hours** | User-defined time range when AI cannot initiate calls |
| **Action Items** | Specific commitments or recommendations extracted from conversation for user follow-through |
| **Speech Latency** | Time delay between user stops speaking and AI begins responding |
| **Emotion Confidence Score** | 0-100% likelihood that detected emotion is accurate |

---

*yHealth Platform - E2: Voice Coaching PRD v1.0*
*Your Comprehensive AI Health Coach - Physical Fitness, Nutrition, and Daily Wellbeing*

---

*Document Classification: INTERNAL USE - Product Foundation*
*Created: 2025-12-02 | Epic Specification for MVP Development*
*Total Features: 6 | All MVP Core*
*Competitive Moat: ONLY AI health platform with real-time voice coaching*
