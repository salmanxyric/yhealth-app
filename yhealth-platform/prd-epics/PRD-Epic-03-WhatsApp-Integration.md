# yHealth Platform - Epic 03: WhatsApp Integration

## EPIC OVERVIEW

### Epic Statement
WhatsApp Integration is ONE of yHealth's THREE EQUAL INTERACTION CHANNELS (Voice, WhatsApp, Mobile App) that enables users to access their AI health coach through the world's most popular messaging platform - providing 24/7 conversational coaching, quick logging, and proactive nudges where users already communicate daily.

### Epic Goal
Enable seamless, natural health coaching interactions via WhatsApp Business API that feel personal and conversational while maintaining feature parity with other channels - emphasizing convenience, accessibility, and meeting users where they are already active.

### Core Philosophy
**"Meet Users Where They Are":** WhatsApp removes friction from health tracking by embedding the AI coach into a platform users already check 20+ times per day. No app switching required - just message your coach like you would a friend.

### WhatsApp Integration Scope (7 Features)

| Feature | Description | MVP Status |
|---------|-------------|------------|
| **F3.1** | WhatsApp Account Linking | Core |
| **F3.2** | Text-Based Coaching | Core |
| **F3.3** | Photo Analysis | Core |
| **F3.4** | Voice Message Processing | Core |
| **F3.5** | Proactive Nudges | Core |
| **F3.6** | Quick Logging | Core |
| **F3.7** | Cross-Channel Sync | Core |

---

## F3.1: WHATSAPP ACCOUNT LINKING

### Description
Secure phone number verification and WhatsApp opt-in flow that connects a user's yHealth account with their WhatsApp number, establishes privacy consent, and configures notification preferences. Prioritizes user control over messaging frequency and timing while ensuring GDPR/privacy compliance.

### User Story
As a **Busy Professional** (P2), I want to connect my WhatsApp account to yHealth so that I can receive coaching and log health data through a messaging app I already use constantly without downloading another app or checking multiple platforms.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simple phone number entry, SMS verification code, single "Yes, message me on WhatsApp" consent button. Minimal configuration - default quiet hours applied. |
| **Deep** | Detailed preference configuration: messaging frequency (multiple daily/daily/weekly), quiet hours customization, notification category toggles (insights/reminders/check-ins), opt-in/opt-out by message type. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Account linking completion rate | >85% of users who start linking process | Funnel analytics |
| Linking time to completion | <2 minutes for average user | Time tracking |
| WhatsApp opt-in rate | >70% of users enable WhatsApp channel | Channel activation tracking |
| User satisfaction with setup | 4.5/5 rating on setup simplicity | Post-setup survey |

### Acceptance Criteria

- [ ] Phone number entry with country code selection (auto-detect from device locale)
- [ ] SMS verification code sent within 30 seconds
- [ ] Code validation with retry limit (3 attempts, then re-send option)
- [ ] Clear privacy policy and consent language: "yHealth will message you on WhatsApp for health coaching. Reply STOP anytime to unsubscribe."
- [ ] Opt-in confirmation message sent to WhatsApp after successful linking
- [ ] Default quiet hours set (10pm-8am local time, user-configurable)
- [ ] Light mode uses one-step consent with smart defaults
- [ ] Deep mode allows granular notification preferences
- [ ] Ability to unlink WhatsApp account from settings (with confirmation)
- [ ] Support for multiple WhatsApp accounts (edge case: business + personal numbers)
- [ ] Handles WhatsApp number changes (re-verification flow)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Invalid phone number** | Format validation fails | Prompt correction | "Phone number format invalid. Try with country code (e.g., +1 555-123-4567)." |
| **SMS delivery failure** | No code received in 2 minutes | Offer re-send or alternative method | "Didn't receive code? Tap to resend or try WhatsApp call verification." |
| **WhatsApp Business API unavailable** | API 503/timeout | Queue linking, retry when available | "WhatsApp service temporarily unavailable. We'll complete setup shortly." |
| **Number already linked** | Duplicate phone number detected | Prompt to unlink from other account or contact support | "This number is linked to another account. Unlink it first or contact support." |
| **Verification code expired** | Code >10 minutes old | Request new code | "Verification code expired. Tap to get a new code." |

### Cross-Channel Connections

**To Mobile App (E4):**
- WhatsApp linking initiated from app settings
- Preference management UI in app
- Conversation history synced to app inbox

**To Voice Coaching (E2):**
- WhatsApp messages can request voice calls: "Call me now"
- Voice session summaries delivered to WhatsApp

**To Onboarding (E1):**
- WhatsApp linking offered during onboarding multi-channel setup
- Skip option available - can link later from settings

### Dependencies
- **WhatsApp Business API:** Account setup, message templates, 24-hour window policy
- **SMS Provider:** Twilio/similar for verification codes
- **E1 (Onboarding):** Account creation prerequisite, phone number optional field
- **E4 (Mobile App):** Settings UI for WhatsApp preferences

### MVP Status
[X] MVP Core

---

## F3.2: TEXT-BASED COACHING

### Description
Natural language conversational AI coaching via WhatsApp text messages that provides context-aware responses, personalized insights, and health guidance drawing from all three pillars (Fitness, Nutrition, Wellbeing). Delivers the core "Second Mind" coaching experience through asynchronous messaging with <5 second response time.

### User Story
As a **Holistic Health Seeker** (P1), I want to chat with my AI coach on WhatsApp using natural language so that I can ask questions, get insights, and receive support anytime without opening a separate app or waiting for scheduled calls.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Brief, focused responses. "Your energy is lower today - try a 10min walk or quick snack." Quick answers to simple questions. Minimal follow-up unless user initiates. |
| **Deep** | Detailed explanations with context. "Your energy dipped at 2pm three days this week. This correlates with skipping lunch and poor sleep Tuesday-Thursday. Let's address both: try eating lunch by 1pm and aim for 7+ hours sleep." Multi-turn conversations with follow-up questions. |

### User Decisions Applied
- **Conversational AI:** Natural language understanding, not keyword matching
- **Context-aware:** AI remembers conversation history, user's health data, recent patterns
- **All-pillar access:** Can discuss fitness, nutrition, wellbeing in single conversation
- **Emotionally intelligent:** Detects tone, adjusts response empathy accordingly

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Message response latency | <5 seconds p95 | Response time monitoring |
| User engagement rate | 60% of users message AI coach 3+ times/week | Usage analytics |
| Conversation satisfaction | 4.5/5 rating on helpfulness | Post-conversation feedback |
| Multi-turn conversation depth | Average 4+ exchanges per conversation | Conversation analytics |
| Context retention accuracy | 85% of follow-up questions answered correctly | Manual review sampling |

### Acceptance Criteria

- [ ] Responds to natural language messages within 5 seconds
- [ ] Maintains conversation context across messages (24-hour window)
- [ ] Can answer questions about any pillar: "How did I sleep last night?" / "What should I eat for lunch?" / "Why am I stressed?"
- [ ] Provides personalized responses using user's historical data
- [ ] Handles casual conversation: "Good morning!" → "Good morning! How are you feeling today?"
- [ ] Detects questions requiring specific features: "Show me my week" → Sends dashboard summary or link to app
- [ ] Gracefully handles out-of-scope questions with boundaries (Section 14 of PRD)
- [ ] Light mode delivers concise, actionable responses
- [ ] Deep mode provides detailed explanations and asks clarifying follow-ups
- [ ] Supports multi-message conversations without losing context
- [ ] Emotional tone detection influences response style (empathetic vs. motivational)
- [ ] Can request escalation to voice call when text insufficient
- [ ] Includes helpful quick reply buttons for common follow-ups

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **AI response timeout (>10s)** | Response generation exceeds limit | Retry with simplified prompt | "Thinking... Just a moment." (then response) |
| **Unclear user intent** | Low confidence NLU score | Ask clarifying question | "I want to help! Are you asking about your sleep quality or workout recovery?" |
| **Insufficient data for answer** | Query requires data not available | Explain limitation, offer alternative | "I need a few more days of sleep data to answer that. Try logging tonight's sleep?" |
| **API rate limit reached** | WhatsApp API 429 response | Queue message, send when available | "Message queued - you'll receive my response shortly!" (then delayed delivery) |
| **Harmful content detected** | Content filter triggered | Redirect conversation per AI safety boundaries | "I'm here to support your health journey. Let's focus on that." |

### Cross-Pillar Connections

**To Fitness (E5):**
- "How's my recovery today?" → Dual recovery score with recommendation
- "What workout should I do?" → AI workout recommendation
- "Log 30 min run" → Activity logged to fitness pillar

**To Nutrition (E6):**
- "What should I eat for breakfast?" → Meal recommendations based on goals
- "Log my meal" → Triggers photo upload or manual entry
- "Am I eating enough protein?" → Nutrition analysis and insights

**To Wellbeing (E7):**
- "I'm feeling stressed" → Mood logged, coping strategies offered
- "Why am I tired?" → Energy pattern analysis across all pillars
- "Morning check-in" → Mood/energy/stress logging flow

**To Cross-Domain Intelligence (E8):**
- "What's affecting my energy?" → Cross-pillar correlation insights
- "Why did I sleep poorly?" → Multi-factor analysis (late meal, high stress, etc.)
- Proactive insights delivered via WhatsApp: "Your best workouts happen after morning journaling"

### Dependencies
- **WhatsApp Business API:** Message sending/receiving, 24-hour window policy
- **Claude/DeepSeek:** Conversational AI backend (ADR-002)
- **E8 (Cross-Domain Intelligence):** Insight generation engine
- **E5, E6, E7 (All Pillars):** Data sources for personalized responses
- **E4 (Mobile App):** Conversation history sync

### MVP Status
[X] MVP Core

---

## F3.3: PHOTO ANALYSIS

### Description
AI-powered image analysis for meal photos, workout summaries, and other health-related images sent via WhatsApp. Delivers nutrition estimates (calories, macros) for meals in <10 seconds and logs data automatically to the Nutrition pillar with user confirmation. Emphasizes convenience and speed over laboratory precision.

### User Story
As a **Busy Professional** (P2), I want to snap a photo of my meal and send it to my coach on WhatsApp so that I can log nutrition without typing anything or using multiple apps - getting instant feedback on what I'm eating.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Photo → Quick estimate: "~500 calories, high protein. Logged! 👍" Simple confirmation, no detailed breakdown. |
| **Deep** | Photo → Detailed analysis: "Turkey sandwich (500 cal): 35g protein, 45g carbs, 18g fat. Ingredients detected: whole wheat bread, turkey breast, lettuce, tomato. Add sides or confirm to log?" Editable values, detailed breakdown, option to adjust. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Photo analysis response time | <10 seconds p95 | Processing time monitoring |
| Calorie estimate accuracy | ±20% of actual values | Sample validation vs. labeled dataset |
| User acceptance of estimates | 70% of estimates logged without edits | Edit rate tracking |
| Photo-based logging adoption | 60% of meal logs via photo (vs. manual) | Logging method analytics |

### Acceptance Criteria

- [ ] Accepts photo messages in WhatsApp chat
- [ ] Processes images within 10 seconds
- [ ] Returns nutrition estimate: calories, macros (protein, carbs, fat)
- [ ] Identifies common foods/ingredients in photo
- [ ] Handles multiple food items in single photo
- [ ] Confidence indicator for estimates (High/Medium/Low)
- [ ] User can confirm, edit, or reject estimate before logging
- [ ] Light mode shows simplified estimate with one-tap confirm
- [ ] Deep mode shows detailed breakdown with edit options
- [ ] Unsupported photos (non-food) handled gracefully: "This doesn't look like food. Try a meal photo?"
- [ ] Low-quality photos prompt retry: "Photo is a bit blurry. Try a clearer shot for better accuracy?"
- [ ] Meal logged to Nutrition pillar (E6) after confirmation
- [ ] Photo stored securely, encrypted, deletable by user
- [ ] Works with any image format (JPEG, PNG, HEIC)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Photo analysis timeout (>15s)** | Processing exceeds limit | Return partial result or request retry | "Taking longer than usual. Try a clearer photo? Or I can log it manually." |
| **Unrecognizable food** | Low confidence score on all detections | Request clarification | "Can't quite identify this. Tell me what it is and I'll estimate nutrition!" |
| **Non-food photo sent** | Image classification fails | Polite explanation | "This doesn't look like food. Send a meal photo or describe what you ate!" |
| **Image too large** | File size >10MB | Compress or request smaller image | "Photo is too large. Try taking a new one with lower resolution?" |
| **Low lighting/blurry** | Quality score below threshold | Accept but flag low confidence | "Photo is a bit dark - my estimate might be less accurate. Confirm or edit?" |

### Photo Analysis Pipeline

```
WhatsApp Photo Received
    ↓
Image Preprocessing (resize, normalize)
    ↓
Claude Vision API → Detect objects (food items)
    ↓
Claude/DeepSeek Vision Model → Identify ingredients, estimate portions
    ↓
Nutrition Database Lookup (Nutritionix API) → Calorie/macro values
    ↓
Confidence Scoring (0-100)
    ↓
Generate Response:
  - High Confidence (>80): "Grilled chicken salad - 420 cal, 35g protein, 12g carbs, 22g fat"
  - Medium Confidence (50-80): "Looks like pasta dish - ~600 cal (estimate). Confirm?"
  - Low Confidence (<50): "Can't identify this clearly. What did you eat?"
    ↓
User Confirmation → Log to Nutrition Pillar
```

### Cross-Pillar Connections

**To Nutrition (E6):**
- Photo analysis feeds directly into meal logging
- Calorie/macro estimates update daily nutrition totals
- Meal timing captured automatically (timestamp of WhatsApp message)

**To Cross-Domain Intelligence (E8):**
- Meal photos enable "emotional eating" pattern detection (mood before/after meals)
- Food timing correlations with sleep quality and workout performance
- Visual food logs support "What did I eat before my best workouts?" insights

**To Wellbeing (E7):**
- Late-night meal photos trigger sleep quality alerts
- Comfort food patterns detected during low mood periods

### Dependencies
- **WhatsApp Business API:** Media message handling, photo download
- **Claude Vision API:** Object detection in images
- **Claude/DeepSeek Vision Model:** Food identification and portion estimation
- **Nutritionix API:** Nutrition database for calorie/macro lookup
- **E6 (Nutrition Pillar):** Meal logging endpoint
- **Cloud Storage:** Secure image storage (encrypted, time-limited retention)

### MVP Status
[X] MVP Core

---

## F3.4: VOICE MESSAGE PROCESSING

### Description
AI transcription and sentiment analysis of voice messages sent via WhatsApp, enabling users to speak naturally instead of typing - particularly useful for journaling, mood check-ins, and quick updates. Transcribes audio to text, detects emotional tone, and processes as conversational input.

### User Story
As a **Holistic Health Seeker** (P1), I want to send voice messages to my coach on WhatsApp when I'm too busy to type so that I can share my feelings, log activities, or ask questions using natural speech without slowing down my day.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Voice message → Brief acknowledgment: "Got it! Logged your morning mood as 'energized'. Have a great workout! 💪" Focus on key action/sentiment. |
| **Deep** | Voice message → Detailed response: "Thanks for sharing! I heard you're feeling energized (8/10 mood) after your morning coffee and journaling. This matches your pattern - mornings are your peak energy time. Recommend a workout within the next 2 hours for best results!" Full transcription available on request. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Transcription accuracy | >90% word error rate | Manual review sampling |
| Sentiment detection accuracy | >80% alignment with user intent | User feedback surveys |
| Voice message response time | <10 seconds for <2min audio | Processing time monitoring |
| User adoption of voice messages | 40% of users send voice messages monthly | Usage analytics |

### Acceptance Criteria

- [ ] Accepts voice message attachments in WhatsApp
- [ ] Transcribes audio to text using speech-to-text API
- [ ] Detects emotional tone/sentiment (positive, neutral, negative, stressed, excited, tired, etc.)
- [ ] Processes transcription as conversational input (same as text messages)
- [ ] Response incorporates detected emotion: "I hear you're feeling overwhelmed..." (empathetic response)
- [ ] Handles background noise gracefully (flag low quality, request clarification if needed)
- [ ] Supports voice messages up to 5 minutes duration
- [ ] Light mode delivers brief, action-focused responses
- [ ] Deep mode provides detailed, empathetic responses with full context
- [ ] User can request transcription: "What did I say?" → Returns text transcription
- [ ] Voice data encrypted and securely stored, deletable by user
- [ ] Multi-language support (English primary, expand post-MVP)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Voice message too long (>5min)** | Duration check | Process first 5 minutes, prompt continuation | "Got the first part! Want to continue in another message?" |
| **Poor audio quality** | Transcription confidence <60% | Request clarification or retry | "Audio was a bit unclear. Can you try again or type it out?" |
| **Transcription failure** | API error or timeout | Apologize, offer text alternative | "Sorry, I couldn't process that audio. Want to type your message?" |
| **Unsupported audio format** | Format detection fails | Explain limitation | "I can only process WhatsApp voice messages. Try recording in-app?" |
| **Ambient noise interference** | Background noise detected | Accept with disclaimer | "I heard you, though there was background noise. Let me know if I misunderstood!" |

### Voice Processing Pipeline

```
WhatsApp Voice Message Received
    ↓
Audio File Downloaded (OGG/AAC format)
    ↓
Audio Quality Check (duration, noise level)
    ↓
AWS Transcribe API → Transcription
    ↓
Confidence Scoring (transcription quality)
    ↓
Sentiment Analysis (AWS Comprehend)
    ↓
Emotion Detection (tone: stressed, happy, tired, neutral, etc.)
    ↓
Natural Language Processing (same as text messages in F3.2)
    ↓
Generate Response (incorporates detected emotion/tone)
    ↓
Send WhatsApp Reply + Log Relevant Data (mood, activities, etc.)
```

### Sentiment to Mood Mapping

| Detected Sentiment | Mood Score (1-10) | Coaching Response Style |
|-------------------|-------------------|-------------------------|
| **Very Positive** | 9-10 | Celebratory, reinforcing |
| **Positive** | 7-8 | Supportive, encouraging |
| **Neutral** | 5-6 | Informative, balanced |
| **Negative** | 3-4 | Empathetic, solution-focused |
| **Very Negative/Distressed** | 1-2 | Highly empathetic, escalation check (AI safety boundaries) |
| **Stressed/Anxious** | Variable | Calming, offers stress-reduction techniques |
| **Tired/Fatigued** | Variable | Gentle, suggests rest/recovery |

### Cross-Pillar Connections

**To Wellbeing (E7):**
- Voice messages often used for journaling and mood check-ins
- Emotional tone automatically logs mood/stress levels
- Replaces typed journaling for voice-preferring users

**To Fitness (E5):**
- "Just finished a great run!" → Activity logged, tone analyzed for workout enjoyment
- Fatigue in voice triggers recovery monitoring

**To Cross-Domain Intelligence (E8):**
- Voice tone patterns over time reveal stress/burnout trends
- Correlate voice sentiment with workout performance and nutrition choices

### Dependencies
- **WhatsApp Business API:** Voice message media handling
- **AWS Transcribe API:** Audio transcription
- **AWS Comprehend API:** Sentiment analysis
- **E7 (Wellbeing Pillar):** Mood/stress logging endpoint
- **E2 (Voice Coaching):** Potential escalation to live voice call
- **Cloud Storage:** Secure audio storage (encrypted, time-limited)

### MVP Status
[X] MVP Core

---

## F3.5: PROACTIVE NUDGES

### Description
AI-initiated WhatsApp messages that proactively check in with users, deliver insights, remind about goals, and encourage healthy behaviors - without being intrusive or annoying. Respects quiet hours, user preferences, and 24-hour messaging window policies. Emphasizes value-driven engagement over notification spam.

### User Story
As a **Habit Formation Seeker** (P4), I want my AI coach to check in with me at the right times and remind me of my goals so that I stay consistent with my health habits without feeling overwhelmed by constant notifications.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Minimal proactive messages: Daily morning check-in, critical insights only, goal reminders when 80%+ toward target. Max 2-3 messages/day. |
| **Deep** | Frequent engagement: Morning/evening check-ins, all insights delivered immediately, goal progress updates, pattern alerts, motivational nudges. Max 5-7 messages/day with user-configurable limits. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Nudge engagement rate | >50% of nudges receive user response | Response tracking |
| Opt-out rate | <5% of users disable proactive messages | Preference analytics |
| Perceived value of nudges | 4.3/5 rating on helpfulness | User surveys |
| Timing accuracy | >90% of nudges sent within user's active hours | Quiet hours compliance |

### Acceptance Criteria

- [ ] Morning check-in message sent at user's preferred wake time (default 8am): "Good morning! How are you feeling today?"
- [ ] Insight delivery when new cross-domain patterns detected: "I noticed your energy dips on days you skip breakfast"
- [ ] Goal progress reminders: "You're at 8,000 steps today - 2,000 more to hit your goal!"
- [ ] Milestone celebrations: "7-day logging streak! Keep it up! 🎉"
- [ ] Gentle re-engagement after inactivity: "Haven't heard from you in 2 days. Everything okay?"
- [ ] Respects quiet hours (default 10pm-8am, user-configurable)
- [ ] Adheres to WhatsApp 24-hour window: Uses template messages for re-engagement beyond window
- [ ] Light mode sends 2-3 nudges/day maximum
- [ ] Deep mode sends up to 5-7 nudges/day (user-configurable)
- [ ] User can adjust frequency: "Too many messages" → "I'll check in less often!"
- [ ] User can snooze: "Remind me later" → 4-hour snooze
- [ ] Nudges are contextual: Recommends workout when recovery high, rest when recovery low
- [ ] No generic spam: Every nudge has personalized value

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **24-hour window expired** | Last user message >24h ago | Use WhatsApp template message for re-engagement | [Template] "Hi! It's been a while. Reply to continue our conversation." |
| **User reports too many messages** | "Stop", "Too much", frequency complaints | Reduce frequency, ask preference | "Got it! I'll check in less often. How about once daily?" |
| **Nudge sent during quiet hours** | Timestamp validation fails | Queue for next active period | Silent: message queued for 8am |
| **Insight not relevant** | User ignores/dismisses repeatedly | Reduce similar insight frequency | Silent: adjust recommendation algorithm |
| **API delivery failure** | Message send fails | Retry 3x, then log failure | Silent: retry or skip if non-critical |

### Nudge Types and Triggers

| Nudge Type | Trigger Condition | Example Message | Frequency |
|-----------|-------------------|-----------------|-----------|
| **Morning Check-In** | User's wake time (8am default) | "Good morning! How are you feeling today?" | Daily |
| **Goal Progress** | User 80%+ toward daily goal | "You're at 8,000 steps - just 2,000 more!" | As triggered |
| **Insight Delivery** | New cross-domain pattern detected | "Your best sleep happens when you journal before bed" | As detected |
| **Milestone Celebration** | Streak achieved, goal completed | "7-day logging streak! Amazing consistency! 🎉" | As achieved |
| **Recovery Alert** | Recovery score <50 two consecutive days | "Your recovery is low. Rest day recommended today." | As needed |
| **Workout Reminder** | No activity logged, user has workout goal | "Haven't seen a workout today. Still planning one?" | Max 1x/day |
| **Meal Reminder** | No meal logged by typical meal time | "Lunch time! Eaten yet? Snap a photo when you do." | Max 3x/day |
| **Re-Engagement** | No interaction in 2+ days | "Haven't heard from you in a while. Everything okay?" | After 48h |
| **Evening Reflection** | User's bedtime - 1 hour | "How was your day? Quick mood check before bed?" | Daily (if enabled) |

### Quiet Hours & Timing Logic

```
Quiet Hours Configuration:
- Default: 10pm - 8am (local time)
- User-configurable in preferences
- Hard stop: No messages during quiet hours (unless emergency - future feature)

Message Timing Intelligence:
- Learn user's active patterns (when they typically respond)
- Schedule nudges during high-engagement windows
- Avoid clustering (space messages 2+ hours apart)
- Respect 24-hour WhatsApp policy

Template Messages (for >24h window):
- Pre-approved by WhatsApp Business API
- Limited to re-engagement and critical alerts
- Format: "Hi [Name]! It's been [X] days. Reply to continue our conversation."
```

### Cross-Pillar Connections

**To Fitness (E5):**
- Recovery-based workout reminders
- Goal progress nudges (steps, workouts, sleep)
- Strain alerts when overtraining detected

**To Nutrition (E6):**
- Meal logging reminders at typical meal times
- Hydration nudges based on activity level
- Late-night eating alerts affecting sleep

**To Wellbeing (E7):**
- Morning/evening mood check-ins
- Journaling prompts when user stressed
- Gratitude/reflection nudges

**To Cross-Domain Intelligence (E8):**
- Proactive insight delivery as patterns emerge
- Predictive nudges: "Your patterns suggest low energy tomorrow - prioritize sleep tonight"

### Dependencies
- **WhatsApp Business API:** Message sending, template messages, 24-hour window management
- **User Preference System:** Quiet hours, frequency settings, opt-in/opt-out
- **E8 (Cross-Domain Intelligence):** Insight generation engine for pattern-based nudges
- **E5, E6, E7 (All Pillars):** Goal tracking, data for contextual nudges
- **Timezone Management:** User's local time for quiet hours enforcement

### MVP Status
[X] MVP Core

---

## F3.6: QUICK LOGGING

### Description
Streamlined data entry via WhatsApp using natural language, quick reply buttons, and one-tap logging for common health metrics (meals, mood, workouts, water, sleep). Emphasizes speed and convenience - logging should take <30 seconds for any metric.

### User Story
As a **Busy Professional** (P2), I want to log my health data with minimal effort on WhatsApp so that I can track everything without interrupting my day or switching to a dedicated app.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Ultra-fast logging with emoji and quick replies. "How's your mood?" → Tap 😊 → "Great mood logged!" Maximum speed, minimal detail. |
| **Deep** | Detailed logging with optional context. "How's your mood?" → Tap 😊 → "Tell me more?" → Voice or text elaboration → Full journal entry created. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average logging time | <30 seconds per entry | Time tracking |
| Quick reply usage rate | >70% of logs use quick replies vs. free text | Interaction analytics |
| Daily logging adoption | 75% of users log 1+ metric daily via WhatsApp | Usage frequency |
| User satisfaction with speed | 4.6/5 rating on convenience | User surveys |

### Acceptance Criteria

- [ ] Supports quick logging for all pillars:
  - **Mood:** Emoji buttons (😊😐😟😰😴) → 1-10 scale mapped
  - **Energy:** 1-5 star buttons or text "High/Medium/Low"
  - **Stress:** 1-5 scale with quick replies
  - **Meals:** Photo (F3.3) or "Log breakfast" text → Quick confirmation
  - **Water:** "Logged water" → Defaults to 250ml, editable
  - **Workouts:** "30 min run" → Parsed and logged
  - **Sleep:** "Slept 7 hours" → Logged to fitness pillar
- [ ] Natural language parsing: "Ate chicken salad for lunch" → Meal logged
- [ ] Quick reply buttons appear contextually:
  - Morning check-in → Mood/Energy/Sleep quality buttons
  - After meal time → "Did you eat? [Yes] [No]" → Photo upload prompt
  - After typical workout time → "Workout done? [Yes] [Log it]"
- [ ] One-tap confirmation: "Logged! 👍" after each entry
- [ ] Light mode uses emoji and buttons exclusively (no typing required)
- [ ] Deep mode allows text elaboration and follow-up questions
- [ ] Supports batch logging: "Mood: happy, Energy: 8/10, ate breakfast" → All logged at once
- [ ] Undo functionality: "Oops, change that to..." → Edits last entry

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Ambiguous input** | "Ate food" (no specifics) | Request clarification | "What did you eat? Photo, description, or pick a category?" |
| **Invalid value** | "Mood: 15/10" | Flag and correct | "Mood scale is 1-10. Did you mean 10/10 (amazing)?" |
| **Duplicate logging** | "Breakfast" logged twice in 2 hours | Confirm or merge | "Already logged breakfast at 8am. Log another meal or update that one?" |
| **Missing required data** | "Log workout" (no duration/type) | Prompt for details | "What kind of workout and how long?" |
| **Parsing failure** | Unrecognizable input | Ask for clarification | "Not sure what to log. Try: 'Log mood', 'Ate lunch', or 'Workout done'." |

### Quick Logging Patterns

```
Pattern 1: Button-Based (Light Mode)
Bot: "Good morning! How are you feeling? 😊😐😟"
User: [Taps 😊]
Bot: "Great mood logged! Have an awesome day!"

Pattern 2: Natural Language (Deep Mode)
User: "Feeling stressed, had coffee, about to workout"
Bot: "Got it! ✅ Stress: 7/10 ✅ Logged coffee ✅ Workout starting - let me know how it goes!"

Pattern 3: Photo + Context
User: [Sends meal photo]
Bot: "Turkey sandwich - 500 cal, 35g protein. Log it?"
User: [Taps "Yes"]
Bot: "Lunch logged! 👍"

Pattern 4: Scheduled Prompts with Quick Replies
Bot (1pm): "Did you eat lunch? [Yes - Photo] [Yes - Text] [Not yet]"
User: [Taps "Yes - Photo"] → [Sends photo]
Bot: "Pasta bowl - 650 cal. Logged!"

Pattern 5: Batch Update
User: "Slept 7 hours, mood 8/10, energy high, worked out 30 min"
Bot: "All logged! 🎯 Sleep: 7h ✅ Mood: 8/10 ✅ Energy: High ✅ Workout: 30min"
```

### Quick Reply Button Examples

| Context | Quick Reply Options | Outcome |
|---------|-------------------|----------|
| **Morning Check-In** | [😊 Great] [😐 Okay] [😟 Rough] | Mood logged instantly |
| **Meal Time Prompt** | [📸 Photo] [✍️ Describe] [⏭️ Skip] | Logging method selected |
| **Workout Reminder** | [✅ Done] [📝 Log It] [❌ Rest Day] | Status updated |
| **Sleep Quality** | [😴 Great] [😐 Okay] [😣 Poor] | Sleep quality logged |
| **Hydration** | [💧 250ml] [💧 500ml] [🚰 1L] | Water logged |
| **Energy Check** | [⭐⭐⭐⭐⭐] [⭐⭐⭐] [⭐] | Energy rated |

### Cross-Pillar Connections

**To Fitness (E5):**
- Quick workout logging: "30 min run" → F5.1 Activity Tracking
- Sleep logging: "Slept 7 hours" → F5.2 Sleep Tracking

**To Nutrition (E6):**
- Meal logging: Photo or text → E6 Meal Logging
- Water tracking: "Drank water" → Hydration log

**To Wellbeing (E7):**
- Mood/energy/stress: Quick emoji/buttons → E7 Daily Check-ins
- Journal prompts: "Feeling stressed" → Elaboration triggers journal entry

### Dependencies
- **WhatsApp Business API:** Quick reply buttons (interactive messages)
- **Natural Language Processing:** Parse free-text logging attempts
- **E5, E6, E7 (All Pillars):** Logging endpoints for each data type
- **E4 (Mobile App):** Synced data appears in app immediately

### MVP Status
[X] MVP Core

---

## F3.7: CROSS-CHANNEL SYNC

### Description
Seamless synchronization of WhatsApp conversations, logged data, and insights across all yHealth channels (Mobile App, Voice Coaching) - ensuring users can start a conversation on WhatsApp, continue on a voice call, and review history in the app without losing context or repeating information.

### User Story
As an **Optimization Enthusiast** (P3), I want my conversations and data to sync across WhatsApp, the app, and voice calls so that I can switch between channels based on my situation without losing context or having to repeat myself.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Basic data sync - logged entries appear everywhere, but conversation history summary only. Access last 24h of WhatsApp chat in app. |
| **Deep** | Full sync - complete conversation history accessible in app, voice call summaries delivered to WhatsApp, cross-channel context maintained indefinitely. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sync latency | <5 minutes for data to appear across all channels | Sync monitoring |
| Conversation context retention | 95% of cross-channel interactions maintain context | Manual review sampling |
| User satisfaction with continuity | 4.5/5 rating on seamless experience | User surveys |
| Cross-channel usage | 60% of users actively use 2+ channels | Multi-channel analytics |

### Acceptance Criteria

- [ ] WhatsApp messages sync to Mobile App inbox within 5 minutes
- [ ] Data logged via WhatsApp appears in app dashboard immediately (steps, meals, mood, etc.)
- [ ] Voice call summaries sent to WhatsApp after call ends
- [ ] App-based actions reflected in WhatsApp: "Goal achieved!" notification sent to WhatsApp
- [ ] Conversation context maintained across channels:
  - WhatsApp: "What workout should I do?"
  - Voice Call (2 hours later): "Let's review that workout plan we discussed"
  - AI remembers the WhatsApp conversation
- [ ] Light mode syncs data and 24-hour conversation history
- [ ] Deep mode syncs full conversation history (30+ days)
- [ ] User can access WhatsApp conversation history in app's "Messages" section
- [ ] Notifications cross-channel: Insight generated → Delivered to WhatsApp AND app notification
- [ ] Preference changes sync instantly: Quiet hours set in app → WhatsApp respects immediately
- [ ] Offline mode support: WhatsApp messages queue when offline, sync when reconnected

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Sync delay (>10min)** | Delayed message delivery | Retry sync, alert if >30min | "Your data is syncing. It may take a few minutes to appear everywhere." |
| **Sync conflict** | Same data edited on multiple channels | Use latest timestamp, prompt if ambiguous | "Updated your mood to 7/10 (from app). WhatsApp shows 6/10 earlier - keeping latest." |
| **Conversation history gap** | Missing messages in sync | Backfill from server | Silent: fetch missing messages from database |
| **Channel unavailable** | App offline, WhatsApp API down | Queue updates, sync when available | Silent: queue and retry |
| **Context loss detected** | AI can't retrieve prior context | Acknowledge and ask for repeat | "Sorry, I seem to have lost our earlier conversation. Could you remind me what we discussed?" |

### Sync Architecture

```
User Action (Any Channel)
    ↓
Central Event Bus (AWS SQS/SNS)
    ↓
Event Logged to Database (PostgreSQL)
    ↓
Publish to All Active Channels:
    - WhatsApp Message Sent
    - Mobile App Push Notification
    - Voice Session Context Updated
    - Web Dashboard (Future)
    ↓
Sync Confirmation (per channel)
    ↓
User Sees Data Everywhere

Sync Intervals:
- Real-time: Critical events (insights, alerts, messages)
- Near real-time (<5min): Data logs (meals, mood, workouts)
- Periodic (15min): Conversation history backfill
- On-demand: User-initiated "Refresh"
```

### Cross-Channel Interaction Patterns

**Pattern 1: WhatsApp → Voice → App**
1. User on WhatsApp: "I'm feeling stressed about work"
2. AI suggests: "Want to talk about it? I can call you now."
3. User starts voice call → AI references WhatsApp conversation: "You mentioned work stress..."
4. After call, summary sent to WhatsApp + saved in app "Session History"

**Pattern 2: App → WhatsApp → App**
1. User sets goal in app: "Run 3x per week"
2. WhatsApp nudge: "Goal reminder: Run today?"
3. User completes run, logs in app
4. WhatsApp celebration: "Run logged! 1/3 this week! 🎉"

**Pattern 3: Voice → WhatsApp Follow-Up**
1. Voice coaching session discusses meal planning
2. After call, WhatsApp message: "Here's your meal plan from our call: [link]"
3. User clicks link → App opens to meal plan

**Pattern 4: Multi-Channel Insight Delivery**
1. Cross-domain insight detected: "Your energy is 30% higher on workout days"
2. Insight delivered simultaneously:
   - WhatsApp message with key takeaway
   - App notification with "View Details" link
   - Available in voice conversation context
3. User can engage on any channel

### Cross-Pillar Connections

**To Voice Coaching (E2):**
- WhatsApp conversations inform voice call context
- Voice call summaries sent to WhatsApp
- Escalation path: WhatsApp → Voice call request

**To Mobile App (E4):**
- WhatsApp inbox mirrored in app
- App actions trigger WhatsApp notifications
- Preference sync (quiet hours, frequency)

**To All Pillars (E5, E6, E7):**
- Data logged via WhatsApp syncs to pillar endpoints
- Pillar insights delivered via WhatsApp
- Cross-pillar correlations accessible on all channels

### Dependencies
- **Event-Driven Architecture:** AWS SQS/SNS for message routing (ADR-001)
- **Database:** PostgreSQL for conversation history, sync state
- **WhatsApp Business API:** Webhook for incoming messages, API for outgoing
- **E2 (Voice Coaching):** Voice session context management
- **E4 (Mobile App):** Inbox UI, notification system
- **Push Notification Service:** Firebase Cloud Messaging for app notifications

### MVP Status
[X] MVP Core

---

## EPIC SUCCESS CRITERIA

### Launch Readiness (All Features)

- [ ] All 7 WhatsApp features functional and integrated
- [ ] WhatsApp account linking completes in <2 minutes (F3.1)
- [ ] Text-based coaching responds in <5 seconds (F3.2)
- [ ] Photo analysis returns results in <10 seconds (F3.3)
- [ ] Voice message processing transcribes and responds in <10 seconds (F3.4)
- [ ] Proactive nudges respect quiet hours and user preferences (F3.5)
- [ ] Quick logging completes in <30 seconds per metric (F3.6)
- [ ] Cross-channel sync latency <5 minutes (F3.7)
- [ ] All features work within WhatsApp 24-hour messaging window policy
- [ ] Template messages configured for re-engagement beyond 24h window
- [ ] Error handling graceful for all failure scenarios
- [ ] Privacy and consent clearly communicated during linking

### Quality Gates

| Gate | Criteria | Measurement |
|------|----------|-------------|
| **Performance** | Message delivery <5s, Photo analysis <10s | Monitoring |
| **Reliability** | >95% message delivery success rate | WhatsApp API metrics |
| **User Satisfaction** | 4.5/5 rating for WhatsApp channel | In-app NPS surveys |
| **Engagement** | 60% of users interact via WhatsApp 3+ times/week | Usage analytics |
| **Privacy Compliance** | GDPR/WhatsApp Business Policy compliant | Audit review |

### User Experience Validation

| Persona | Key Experience | Success Indicator |
|---------|---------------|-------------------|
| **P1: Holistic Health Seeker** | Uses WhatsApp for deep conversations and journaling | Average 5+ messages/day, voice message adoption |
| **P2: Busy Professional** | Quick logging via WhatsApp without app switching | 70% of logs via WhatsApp, <30s average logging time |
| **P3: Optimization Enthusiast** | Cross-channel usage to access features everywhere | Uses WhatsApp + App + Voice actively |
| **P4: Habit Formation Seeker** | Responds to proactive nudges and builds consistency | >50% nudge engagement rate, 7+ day streaks |

---

## CROSS-EPIC DEPENDENCIES

### E1: Onboarding & Assessment
- WhatsApp linking offered during onboarding multi-channel setup
- Phone number collected (optional) during account creation
- User preference for WhatsApp vs. app established

### E2: Voice Coaching
- WhatsApp can request voice calls: "Call me now"
- Voice session summaries delivered to WhatsApp
- Escalation path from text to voice when deeper conversation needed

### E4: Mobile App
- WhatsApp preferences managed in app settings
- Conversation history synced to app inbox
- Data logged via WhatsApp appears in app dashboard

### E5: Fitness Pillar
- Quick workout logging via WhatsApp
- Recovery scores delivered as WhatsApp messages
- Photo-based workout summary logging (gym whiteboard photos)

### E6: Nutrition Pillar
- Photo-based meal logging (F3.3 primary use case)
- Calorie/macro estimates returned via WhatsApp
- Meal timing tracked automatically from WhatsApp timestamps

### E7: Wellbeing Pillar
- Voice message tone analysis logs mood/stress
- Morning/evening check-ins via WhatsApp
- Journaling via WhatsApp voice or text messages

### E8: Cross-Domain Intelligence
- Cross-pillar insights delivered via WhatsApp proactive nudges
- "What's affecting what" queries answered conversationally
- Pattern alerts sent as WhatsApp messages

### E9: Data Integrations
- Wearable sync status updates sent to WhatsApp
- Integration connection prompts via WhatsApp

---

## TECHNICAL CONSIDERATIONS

### WhatsApp Business API Requirements

**Account Setup:**
- Business verification with WhatsApp (Meta Business Account required)
- Phone number dedicated to yHealth WhatsApp channel
- API access tier selection (Standard or Enterprise)

**Message Types:**
```json
{
  "text_message": "Simple text responses, max 4096 characters",
  "interactive_message": "Quick reply buttons (up to 3 buttons)",
  "media_message": "Images, voice notes, documents",
  "template_message": "Pre-approved messages for >24h window re-engagement"
}
```

**24-Hour Messaging Window:**
- User-initiated messages open 24-hour window
- yHealth can send messages freely within window
- After 24h: Only template messages allowed (must be pre-approved by WhatsApp)
- Re-engagement templates required for proactive nudges to inactive users

**Rate Limits:**
- Tier 1: 1,000 unique users/24h
- Tier 2: 10,000 unique users/24h
- Tier 3: 100,000 unique users/24h
- Quality rating affects tier (high quality = tier upgrades)

### Data Models (WhatsApp Domain)

**WhatsApp Account Record:**
```json
{
  "whatsapp_account_id": "uuid",
  "user_id": "uuid",
  "phone_number": "+1234567890",
  "country_code": "US",
  "verification_status": "verified",
  "linked_at": "2025-12-02T10:00:00Z",
  "preferences": {
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "08:00",
    "timezone": "America/New_York",
    "message_frequency": "moderate",
    "nudges_enabled": true
  },
  "opt_in_status": "active"
}
```

**WhatsApp Message Record:**
```json
{
  "message_id": "uuid",
  "user_id": "uuid",
  "direction": "inbound|outbound",
  "message_type": "text|image|voice|interactive",
  "content": "User message or bot response",
  "timestamp": "2025-12-02T14:30:00Z",
  "whatsapp_message_id": "wamid.xyz123",
  "status": "sent|delivered|read|failed",
  "media_url": "https://storage.url/photo.jpg",
  "metadata": {
    "sentiment": "positive",
    "intent": "log_meal",
    "logged_data": ["meal_id_xyz"]
  }
}
```

### API Endpoints (WhatsApp Integration)

```
POST   /api/v1/whatsapp/link              - Link WhatsApp account
DELETE /api/v1/whatsapp/unlink            - Unlink WhatsApp account
PUT    /api/v1/whatsapp/preferences       - Update WhatsApp preferences

GET    /api/v1/whatsapp/messages          - Get conversation history
POST   /api/v1/whatsapp/messages          - Send outbound message (testing)

POST   /api/v1/webhooks/whatsapp          - WhatsApp webhook (incoming messages)
GET    /api/v1/webhooks/whatsapp/verify   - Webhook verification

GET    /api/v1/whatsapp/sync-status       - Check cross-channel sync status
```

### Webhook Event Handling

```python
# Simplified webhook processing flow
@app.route('/api/v1/webhooks/whatsapp', methods=['POST'])
def whatsapp_webhook():
    event = request.json

    if event['type'] == 'message':
        message_type = event['message']['type']

        if message_type == 'text':
            handle_text_message(event)  # F3.2
        elif message_type == 'image':
            handle_photo_message(event)  # F3.3
        elif message_type == 'audio':
            handle_voice_message(event)  # F3.4
        elif message_type == 'interactive':
            handle_quick_reply(event)  # F3.6

    elif event['type'] == 'status':
        update_message_status(event)  # Delivery/read receipts

    return {'status': 'ok'}, 200
```

### Performance Requirements

| Operation | Target Latency | Rationale |
|-----------|---------------|-----------|
| Text message response | <5 seconds | Real-time conversation feel |
| Photo analysis | <10 seconds | Acceptable wait for AI processing |
| Voice transcription | <10 seconds | Balanced accuracy vs. speed |
| Quick reply interaction | <2 seconds | Instant feedback for button taps |
| Cross-channel sync | <5 minutes | Near real-time without excessive load |
| Webhook processing | <3 seconds | WhatsApp timeout avoidance |

### Security & Privacy

- **Encryption:** All WhatsApp messages encrypted end-to-end by WhatsApp platform
- **Data Storage:** yHealth stores conversation history encrypted at rest (AES-256)
- **Consent:** Explicit opt-in required during account linking
- **Opt-Out:** User can "STOP" anytime → immediate unsubscribe
- **Data Deletion:** WhatsApp conversation history deleted within 30 days of account deletion (GDPR)
- **Compliance:** WhatsApp Business Policy, GDPR, HIPAA-compliant storage
- **Media Handling:** Photos/voice messages stored securely, auto-deleted after 90 days unless explicitly saved by user

---

## WHATSAPP BUSINESS POLICY COMPLIANCE

### Required Disclosures
- **Identity:** All messages clearly identify as yHealth AI Coach
- **Purpose:** Health coaching and tracking purposes stated upfront
- **Opt-In:** User must actively consent to receive messages
- **Opt-Out:** "Reply STOP to unsubscribe" in all proactive messages
- **Privacy:** Link to privacy policy in linking flow

### Message Content Guidelines
- **No spam:** Every message provides value (insights, coaching, logging)
- **No promotional:** MVP has no sales/marketing messages
- **Health focus only:** Scope limited to health coaching domain
- **Respectful timing:** Quiet hours respected, frequency controlled

### Quality Rating Protection
- Monitor user engagement rates (responses, blocks, reports)
- Optimize message value to maintain high quality rating
- Tier upgrade strategy: Start Tier 1 → Scale to Tier 2/3 based on user growth

---

## COMPETITIVE ANALYSIS (WHATSAPP INTEGRATION)

### Market Context
- **WhatsApp:** 2B+ users globally, most popular messaging app worldwide
- **Health apps with WhatsApp:** Rare - most health apps require dedicated app usage
- **Opportunity:** yHealth differentiates by meeting users in their daily communication hub

### Competitor Comparison

| Feature | Traditional Health Apps | yHealth WhatsApp |
|---------|------------------------|------------------|
| **Logging Method** | Open app, navigate, enter data | Message your coach, instant logging |
| **Coaching Access** | Scheduled sessions or in-app chat | 24/7 conversational access via WhatsApp |
| **Photo Analysis** | Upload in app, wait for processing | Send photo to coach, <10s response |
| **Engagement** | Daily app opens required | Proactive nudges where user already is |
| **Friction** | High (app switching, navigation) | Low (single WhatsApp thread) |

### yHealth's WhatsApp Moat
1. **Zero app-switching friction:** Entire health coaching experience in WhatsApp
2. **Proactive engagement:** AI initiates conversations, not just reactive responses
3. **Multi-modal convenience:** Text, photo, voice all in one channel
4. **Cross-channel continuity:** WhatsApp + App + Voice seamlessly connected

---

## TESTING STRATEGY

### Unit Testing
- Message parsing and intent detection accuracy
- Photo analysis calorie estimation (vs. labeled dataset)
- Voice transcription accuracy (word error rate)
- Quiet hours enforcement logic

### Integration Testing
- WhatsApp Business API webhook handling
- Cross-channel sync (WhatsApp → App, App → WhatsApp)
- Template message delivery for >24h window
- Media upload/download (photos, voice notes)

### User Acceptance Testing
- Account linking flow usability
- Conversational AI response quality and relevance
- Quick reply button interactions
- Proactive nudge timing and value perception

### Performance Testing
- Webhook processing under load (1000+ concurrent users)
- Photo analysis throughput (50+ simultaneous requests)
- Message delivery latency at scale
- Cross-channel sync speed with high message volume

### Privacy & Compliance Testing
- Opt-in/opt-out flows
- Data deletion verification (GDPR)
- WhatsApp Business Policy adherence audit
- Quiet hours enforcement (timezone edge cases)

---

## RISKS & MITIGATIONS

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **WhatsApp API rate limits** | High | Medium | Tier upgrade strategy, queue management, user education on limits |
| **24-hour window policy restrictive** | Medium | High | Template message library, re-engagement strategies, user education |
| **User perception: "spam"** | Critical | Medium | Value-first messaging, frequency controls, easy opt-out, quality monitoring |
| **Photo analysis inaccuracy** | Medium | Medium | Confidence scoring, user edit option, continuous model improvement |
| **Voice transcription errors** | Medium | Medium | Confidence threshold, clarification prompts, text fallback option |
| **Privacy concerns** | High | Low | Clear consent, encryption, GDPR compliance, data minimization |
| **Cross-channel sync failures** | Medium | Low | Retry logic, fallback to eventual consistency, user visibility into sync status |
| **WhatsApp policy violations** | Critical | Low | Pre-launch compliance audit, ongoing monitoring, conservative message strategy |

---

## ROADMAP & FUTURE ENHANCEMENTS

### MVP (Current Scope)
All 7 features (F3.1-F3.7) as defined above

### Post-MVP v1.1 (+3 months)
- **Group coaching:** Small group WhatsApp conversations with shared AI coach
- **Rich media:** Video analysis (workout form feedback), document sharing (meal plans)
- **Advanced quick replies:** Carousel menus, multi-select options
- **Chatbot personality tuning:** Adjust tone/style per user preference

### Post-MVP v1.2 (+6 months)
- **WhatsApp Status integration:** Share progress/insights to WhatsApp Status
- **Payment integration:** Premium upgrade via WhatsApp (WhatsApp Pay)
- **Multi-language support:** Expand beyond English (Spanish, Arabic, Hindi)
- **WhatsApp Channels:** Broadcast tips/insights to subscriber base

### Post-MVP v2.0 (+12 months)
- **WhatsApp Communities:** yHealth community for peer support
- **Healthcare provider integration:** Share reports with doctors via WhatsApp
- **Emergency features:** SOS mode for crisis detection and escalation
- **AI calling via WhatsApp:** Voice calls initiated within WhatsApp (vs. separate E2 system)

---

## DOCUMENT GOVERNANCE

**Review Schedule:** After E2 (Voice) and E4 (Mobile App) Epic completion to ensure channel parity
**Update Triggers:** WhatsApp API policy changes, user feedback from beta testing, feature usage analytics
**Version Control:** All feature changes require version increment with rationale
**Ownership:** Product Team with input from Engineering (WhatsApp API) and Legal (privacy compliance)

---

## APPENDIX A: USER FLOWS

### Flow 1: New User - WhatsApp Linking
1. User completes onboarding (E1), reaches "Connect Channels" step
2. Selects "WhatsApp" option
3. Enters phone number with country code
4. Receives SMS verification code within 30 seconds
5. Enters code, completes verification
6. Consent screen: "yHealth will message you on WhatsApp for health coaching. Reply STOP anytime."
7. User taps "Yes, message me"
8. Confirmation message sent to WhatsApp: "Welcome to yHealth! I'm your AI health coach. How are you feeling today?"
9. User responds → Conversation begins

### Flow 2: Photo-Based Meal Logging (Light Mode)
1. User eats lunch at desk
2. Takes photo of meal on phone
3. Opens WhatsApp, sends photo to yHealth coach
4. yHealth responds in 8 seconds: "Turkey sandwich - 500 cal, 35g protein. Log it?"
5. User taps "Yes" quick reply button
6. Bot: "Lunch logged! 👍 You're at 1,200 cal today."
7. Total time: ~20 seconds from photo to logged

### Flow 3: Morning Check-In with Proactive Nudge
1. 8:00am (user's wake time): WhatsApp message from yHealth: "Good morning! How are you feeling today? 😊😐😟"
2. User taps 😊 (positive mood)
3. Bot: "Great mood logged! Your recovery is high today (Physical: 85, Mental: 80). Perfect day for a workout! What's the plan?"
4. User types: "30 min run after work"
5. Bot: "Awesome! I'll check in tonight. Have a great day! 🏃"
6. 6:00pm: Reminder message: "Run time! Still planning that 30 min run?"
7. User completes run, sends voice message: "Just finished, felt amazing!"
8. Bot transcribes, logs workout, responds: "Fantastic! 30 min run logged. You're crushing your goals this week! 🎉"

### Flow 4: Cross-Channel Continuity (WhatsApp → Voice → WhatsApp)
1. User on WhatsApp: "I'm really stressed about work lately"
2. Bot: "I'm sorry to hear that. Want to talk about it? I can call you now."
3. User: "Yes please"
4. Voice call initiated (E2), AI references WhatsApp context: "You mentioned work stress. Tell me more about what's going on..."
5. 15-minute conversation about stress management
6. After call ends, WhatsApp message: "Thanks for talking! Here's a summary: [stress triggers identified], [coping strategies discussed]. Try the 5-minute breathing exercise tonight before bed. I'm here if you need to talk again."
7. User can review call summary in app or WhatsApp anytime

---

## APPENDIX B: MESSAGE TEMPLATE LIBRARY

### Template Messages (for >24h Window)

**Re-Engagement Template 1:**
```
Hi {{name}}! It's been a while since we last connected.
I'm here when you're ready to continue your health journey.
Reply anytime!

- Your yHealth AI Coach
```

**Re-Engagement Template 2:**
```
Hey {{name}}! Miss you! 👋
Your health goals are still waiting.
Reply to pick up where we left off.

- yHealth
```

**Critical Insight Template:**
```
Hi {{name}}, I noticed an important pattern in your health data.
Reply to see the insight and how it can help you.

- yHealth AI Coach
```

### Quick Reply Button Configurations

**Mood Check-In:**
```json
{
  "type": "button",
  "body": "How are you feeling today?",
  "buttons": [
    {"id": "mood_great", "title": "😊 Great"},
    {"id": "mood_okay", "title": "😐 Okay"},
    {"id": "mood_rough", "title": "😟 Rough"}
  ]
}
```

**Meal Logging:**
```json
{
  "type": "button",
  "body": "Did you eat lunch?",
  "buttons": [
    {"id": "meal_photo", "title": "📸 Photo"},
    {"id": "meal_describe", "title": "✍️ Describe"},
    {"id": "meal_skip", "title": "⏭️ Skip"}
  ]
}
```

**Workout Reminder:**
```json
{
  "type": "button",
  "body": "Ready for your workout?",
  "buttons": [
    {"id": "workout_done", "title": "✅ Done"},
    {"id": "workout_log", "title": "📝 Log It"},
    {"id": "workout_skip", "title": "❌ Rest Day"}
  ]
}
```

---

## APPENDIX C: TERMINOLOGY GLOSSARY

| Term | Definition |
|------|------------|
| **WhatsApp Business API** | Official API for businesses to send/receive WhatsApp messages at scale |
| **24-Hour Window** | WhatsApp policy: Free-form messages allowed 24h after user's last message |
| **Template Message** | Pre-approved message format for re-engagement beyond 24h window |
| **Interactive Message** | WhatsApp message type with quick reply buttons (up to 3 buttons) |
| **Media Message** | WhatsApp message containing image, voice note, video, or document |
| **Webhook** | HTTP endpoint receiving real-time WhatsApp events (incoming messages, status updates) |
| **Opt-In** | User's explicit consent to receive WhatsApp messages from yHealth |
| **Opt-Out** | User's request to stop receiving messages (via "STOP" keyword) |
| **Quiet Hours** | Time period when proactive messages are suppressed (default 10pm-8am) |
| **Quality Rating** | WhatsApp's assessment of message value (affects rate limits and tier) |
| **Tier** | Message volume limit (Tier 1: 1K, Tier 2: 10K, Tier 3: 100K users/24h) |
| **Cross-Channel Sync** | Real-time data synchronization across WhatsApp, App, and Voice channels |

---

*yHealth Platform - E3: WhatsApp Integration PRD v1.0*
*Your Comprehensive AI Health Coach - Physical Fitness, Nutrition, and Daily Wellbeing*

---

*Document Classification: INTERNAL USE - Product Foundation*
*Created: 2025-12-02 | Epic Specification for MVP Development*
*Total Features: 7 | All MVP Core*
