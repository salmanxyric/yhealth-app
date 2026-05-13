# yHealth Platform - Epic 01: Onboarding & Assessment

## EPIC OVERVIEW

### Epic Description
The Onboarding & Assessment Epic establishes the foundation for every yHealth user's journey - transforming a new sign-up into an engaged user with a personalized health coaching plan. This epic encompasses the complete first-time user experience from account creation through initial plan generation, capturing maximum data for personalization while delivering an engaging, goal-oriented flow.

### Strategic Importance
Onboarding is the **critical gateway** to user activation and long-term retention. This epic determines:
- **Data Foundation:** Quality of initial user data impacts all future AI insights
- **First Impression:** Sets expectations for yHealth's intelligence and personalization
- **Engagement Trajectory:** Establishes user's preferred interaction depth (Light/Deep mode)
- **Time to Value:** Delivers first personalized insights within minutes
- **Integration Success:** Ensures at least one wearable connection for continuous data flow

### Success Criteria
- **85%+ onboarding completion rate** (account creation to plan generation)
- **Quick Path:** Complete in <5 minutes (Light mode users)
- **Deep Path:** Complete in 10-15 minutes with natural conversational flow
- **Integration Rate:** 90%+ users connect at least 1 wearable
- **Plan Generation:** <30 seconds to generate personalized first plan
- **User Satisfaction:** 4.5/5 rating for onboarding experience

### User Journey Map
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Account    │────►│   Goal-First │────►│  Deep/Quick  │────►│ Integration  │
│   Creation   │     │  Assessment  │     │  Assessment  │     │    Setup     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                        │
                                                                        ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Welcome    │◄────│ Personalized │◄────│ Preferences  │◄────│  Goal        │
│   to yHealth │     │ Plan Review  │     │    Config    │     │  Refinement  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## FEATURE BREAKDOWN

## F1.1: Account Creation

### Description
Secure account creation flow that captures essential user information while maintaining a frictionless experience. Balances data collection needs with privacy-conscious design, collecting only information required for personalization and legal compliance. Includes age verification (18+), consent management, and optional WhatsApp enrollment for multi-channel access.

### User Story
**As a** new yHealth user,
**I want to** create an account quickly and securely,
**So that** I can start my personalized health journey while maintaining control over my data.

### Flexibility Modes
| Mode | Experience |
|------|------------|
| **Light** | Email + password + basic profile (name, age, gender) - 1-2 minutes |
| **Deep** | Additional health context (current medications, conditions, goals preview) - 3-4 minutes |

**Note:** Light mode is default to minimize friction. Deep mode data can be collected during assessment.

### Detailed Requirements

#### Required Fields (Light Mode)
| Field | Format | Validation | Privacy Level |
|-------|--------|------------|---------------|
| **Email** | standard@example.com | Valid format, unique, not disposable | Private (login only) |
| **Password** | 8+ chars | Min 8 chars, 1 uppercase, 1 number, 1 special | Hashed (bcrypt) |
| **Name** | First + Last | 2-50 chars each | Display only |
| **Date of Birth** | YYYY-MM-DD | 18+ years (age gate) | Private (analytics only) |
| **Gender** | Male/Female/Non-binary/Prefer not to say | Required for biometric norms | Private (AI context only) |

#### Optional Fields (Deep Mode / Progressive)
| Field | Purpose | When to Collect |
|-------|---------|----------------|
| **WhatsApp Number** | Multi-channel access | Account creation OR later in preferences |
| **Current Medications** | Safety guardrails for recommendations | Deep mode OR assessment |
| **Known Conditions** | Personalization context | Deep mode OR assessment |
| **Timezone** | Scheduling coaching calls | Auto-detect with override option |
| **Height/Weight** | Initial BMI calculation | Assessment phase (F1.2) |

#### Privacy & Consent Flow
```
1. Account Creation Form
   ↓
2. Privacy Policy Summary (skimmable, <100 words)
   - "We use your data to personalize coaching"
   - "You control who sees your data"
   - "We never sell your information"
   ↓
3. Consent Checkboxes (required before proceeding)
   ☑ I agree to Terms of Service (link)
   ☑ I agree to Privacy Policy (link)
   ☐ I consent to email updates (optional marketing)
   ☐ I consent to WhatsApp coaching (if number provided)
   ↓
4. GDPR/Regional Compliance
   - Age verification (18+)
   - Right to data export
   - Right to deletion (account settings)
```

#### Account Creation UI/UX Specifications

**Mobile App (Primary Channel):**
- **Screen 1:** Email + Password
  - Password strength indicator (weak/medium/strong)
  - "Show password" toggle
  - Social sign-in options: Apple, Google (OAuth 2.0)
- **Screen 2:** Basic Profile
  - Name (autofill from social if used)
  - Date of Birth (date picker with age validation)
  - Gender (dropdown with inclusive options)
- **Screen 3:** Privacy Consent
  - Collapsible policy summaries
  - Clear "Create Account" CTA
  - "Already have an account? Sign in" link

**WhatsApp Enrollment (Optional, Anytime):**
- SMS verification code (6-digit)
- WhatsApp Business API opt-in
- Number ownership verification

**Web (Future):**
- Single-page responsive form
- Same validation rules as mobile
- Progressive disclosure for optional fields

### Success Metrics
- **Completion Rate:** 95%+ (account started to account created)
- **Time to Complete:** <2 minutes (Light mode), <4 minutes (Deep mode)
- **Validation Error Rate:** <5% (minimize frustration)
- **Social Sign-In Adoption:** 40%+ (reduce password burden)
- **WhatsApp Enrollment:** 60%+ at account creation OR within 7 days

### Acceptance Criteria
- [ ] Email validation prevents disposable/invalid addresses
- [ ] Password meets security requirements (8+ chars, complexity)
- [ ] Age verification blocks users <18 years old with clear message
- [ ] Privacy consent is explicit and cannot be bypassed
- [ ] Social sign-in (Apple, Google) works seamlessly with auto-fill
- [ ] WhatsApp number verification via SMS code (6 digits, 10-min expiry)
- [ ] Account creation triggers welcome email within 5 minutes
- [ ] User receives immediate feedback on validation errors (inline, real-time)
- [ ] "Already have account?" link navigates to sign-in flow
- [ ] GDPR compliance: Data export and deletion requests accessible from account settings

### Error Handling
| Scenario | Detection | Recovery | User Message |
|----------|-----------|----------|--------------|
| **Email already exists** | Database unique constraint | Prompt sign-in or password reset | "This email is already registered. Sign in or reset password?" |
| **Weak password** | Real-time strength checker | Suggest improvements | "Password too weak. Add a number and special character." |
| **Invalid date of birth** | Age <18 validation | Block with support contact | "yHealth is for users 18+. Contact support@yhealth.com for assistance." |
| **WhatsApp verification fails** | SMS delivery timeout | Retry option + skip for later | "Couldn't verify number. Try again or skip for now." |
| **Network error during creation** | API timeout | Local save + retry | "Connection issue. Retrying..." (auto-retry 3x) |
| **Disposable email detected** | Blocklist check | Require valid email | "Please use a permanent email address (no temporary emails)." |

### Dependencies
- **Authentication Service:** OAuth 2.0 for social sign-in (Apple, Google)
- **Email Service:** Welcome email, verification emails
- **SMS Service:** WhatsApp verification codes (Twilio or similar)
- **Database:** User profile schema, secure password storage (bcrypt)
- **Privacy Infrastructure:** Consent management system, GDPR compliance tools

### MVP Status
[X] MVP Core

---

## F1.2: Flexible Assessment (Goal-First Approach)

### Description
An intelligent, adaptive health assessment that begins with understanding the user's primary goal, then tailors all subsequent questions to that objective. Offers two paths: **Quick Assessment** (3-5 min, essential questions only) and **Deep Assessment** (10-15 min AI-guided conversation). The AI doesn't just collect data - it engages in a natural dialogue to understand context, motivations, and constraints, maximizing personalization potential.

### User Story
**As a** new yHealth user who just created an account,
**I want to** tell the AI what I'm trying to achieve and have it ask relevant questions based on my goals,
**So that** my health plan feels personalized from day one and I don't waste time on irrelevant assessments.

### Flexibility Modes
| Mode | Experience |
|------|------------|
| **Light (Quick Assessment)** | 3-5 min structured questionnaire: Goal selection → 8-12 targeted questions → Summary. Efficient, mobile-optimized. |
| **Deep (Conversational Assessment)** | 10-15 min AI-guided dialogue: Open-ended goal discussion → Natural follow-up questions → Reflective insights. Feels like talking to a coach. |

**User Choice:** Presented after account creation with clear time estimates. Can switch mid-assessment.

### Goal-First Flow Architecture

#### Step 1: Goal Discovery (Both Modes)
**Prompt:** "What brings you to yHealth today? What's your main health goal right now?"

**Light Mode - Structured Options:**
```
Select your primary goal:
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

**Deep Mode - Conversational Opening:**
```
AI: "Welcome! I'm here to help you become the best version of yourself.
     What's the main thing you want to improve about your health right now?"

User: [Free text response]

AI: [Reflective follow-up based on response]
     - If weight loss: "What have you tried before? What worked or didn't work?"
     - If energy: "When do you feel most drained? Morning, afternoon, evening?"
     - If stress: "How does stress show up for you? Physical symptoms, mood, sleep?"
```

#### Step 2: Context Gathering (Goal-Specific Questions)

**Example: User selected "Lose weight and improve body composition"**

**Light Mode Questions (8-12 targeted):**
1. **Current Stats:** Height, current weight, target weight
2. **Timeline:** When do you want to reach your goal? (dropdown: 3/6/12/24 months)
3. **Diet History:** Have you tried specific diets before? (checkboxes: Keto, Low-carb, IF, Calorie counting, None)
4. **Activity Level:** Current weekly exercise? (0/1-2/3-4/5+ days)
5. **Biggest Challenge:** What makes weight loss hard for you? (dropdown: Cravings, Time, Motivation, Knowledge, Consistency)
6. **Meal Preferences:** Any dietary restrictions? (Vegan, Vegetarian, Halal, Allergies, None)
7. **Tracking Experience:** Have you tracked food before? (Yes/No) - If yes: What did you use?
8. **Sleep Quality:** How's your sleep? (1-10 scale)
9. **Stress Level:** How stressed are you daily? (1-10 scale)
10. **Support System:** Who supports your goals? (Family, Friends, Alone, Online community)

**Deep Mode Conversation (AI-guided, 10-15 min):**
```
AI: "You mentioned wanting to lose weight. Tell me about your journey so far."

User: "I've tried keto and IF but can't stick to them. Work stress makes me snack."

AI: "Sounds like sustainability is key for you. When work gets stressful,
     what do you reach for? Sweet, salty, or just anything nearby?"

User: "Usually chips or cookies from the break room."

AI: "Got it - stress triggers break room snacks. Let's talk about your typical day.
     What time do you wake up, and when's your first meal?"

[Conversation continues, capturing:]
- Current habits and patterns
- Past attempts and why they failed
- Emotional relationship with food
- Daily routine and constraints
- Support system and environment
- Intrinsic motivations (why this goal matters NOW)
```

**Goal-Specific Question Sets (All Goals):**

| Goal Category | Key Assessment Areas | Sample Questions |
|---------------|---------------------|------------------|
| **Weight Loss** | Body comp, diet history, activity, emotional eating | Current weight, target, past diets, stress eating, meal timing |
| **Muscle Building** | Strength baseline, protein intake, training experience | Current lifts, protein/day, training split, recovery |
| **Sleep Improvement** | Sleep patterns, bedtime routine, environment, stress | Bedtime, wake time, quality (1-10), caffeine cutoff, wind-down routine |
| **Stress/Wellness** | Stressors, coping mechanisms, mindfulness practice | Stress sources, current coping, meditation/journaling, therapy history |
| **Energy Optimization** | Energy dips, caffeine use, sleep quality, nutrition | Energy curve (morning/afternoon/evening), caffeine intake, crash times |
| **Event Training** | Event type, date, current fitness, experience | Event details, training plan, past events, injury history |
| **Health Condition** | Condition details, medications, doctor guidance, goals | Diagnosis, meds, doctor-cleared for exercise, specific limitations |
| **Habit Building** | Desired habits, past attempts, triggers, accountability | Target habits, why now, past streaks, accountability preferences |

#### Step 3: Cross-Pillar Health Snapshot (All Users)

**Universal Questions (Asked Regardless of Goal):**
These ensure we have baseline data across all three pillars (Fitness, Nutrition, Wellbeing).

| Pillar | Questions | Purpose |
|--------|-----------|---------|
| **Fitness** | - Current activity level (days/week)<br>- Primary activities (walking, gym, sports, yoga, etc.)<br>- Wearable/tracker owned (if any) | Establish fitness baseline |
| **Nutrition** | - Typical meals per day<br>- Cooking frequency (never/sometimes/often)<br>- Hydration habits (glasses of water/day) | Establish nutrition baseline |
| **Wellbeing** | - Mood/energy rating (1-10 average)<br>- Stress level (1-10)<br>- Sleep quality (1-10)<br>- Journaling/meditation practice (yes/no) | Establish wellbeing baseline |

**Assessment Completion Screen:**
```
✓ Assessment Complete!

Here's what we learned:
- Primary Goal: [Goal name]
- Fitness Level: [Beginner/Intermediate/Advanced]
- Nutrition Style: [Tracking preference, restrictions]
- Wellbeing Focus: [Stress/sleep/energy priorities]

Next: Let's refine your goals together...
```

### Deep Assessment: AI Conversation Engine

**Conversational AI Specifications:**

**Tone & Personality:**
- Warm, empathetic, non-judgmental coach
- Curious and reflective (not interrogative)
- Celebrates honesty ("Thanks for sharing that - it helps me personalize better")
- Validates struggles ("That's a common challenge - you're not alone")

**Question Flow Logic:**
```python
# Pseudo-logic for AI question sequencing
if user_mentions("stress"):
    ask_followup("How does stress show up? Physical, mental, or both?")
    if response_includes("physical"):
        ask("What physical symptoms? (headaches, tension, fatigue?)")
    if response_includes("mental"):
        ask("Racing thoughts, mood swings, or decision fatigue?")

if user_mentions("tried_before"):
    ask("What worked well? What didn't?")
    extract_patterns(response)  # Learn what to avoid/amplify

if user_sets_aggressive_goal():
    ask("That's ambitious! What's driving this timeline?")
    validate_realism()  # Gently reality-check if needed

# Adaptive depth control
if user_gives_short_answers():
    switch_to_multiple_choice()  # Respect their time preference
if user_gives_detailed_stories():
    continue_open_ended()  # They enjoy the conversation
```

**Smart Follow-Ups (Examples):**

| User Response | AI Follow-Up |
|---------------|--------------|
| "I want to lose 30 lbs" | "When would you like to reach that? And just curious - what made you choose 30 lbs specifically?" |
| "I'm always tired" | "When do you feel most tired? Morning, afternoon, or does it vary?" |
| "I've tried everything" | "That sounds frustrating. What's 'everything' you've tried? Let's make sure we don't repeat what didn't work." |
| "I have no time" | "I hear you - time is tough. Walk me through a typical weekday. When do you wake up?" |
| "Stress eating is my problem" | "Stress eating is so common. What triggers it for you? Work, relationships, boredom, or something else?" |

**Length Control Mechanisms:**
- **Progress Indicator:** "Just a few more questions..." (reduces abandonment anxiety)
- **Time Estimate:** "About 5 more minutes" (updated dynamically)
- **Skip Option:** "Want to skip to your plan?" (always available, but framed as "we'll ask this later")

### Quick Assessment: Structured Questionnaire

**Mobile UI Specifications:**

**Screen Flow (8-10 screens, <5 min total):**
1. **Goal Selection** (single-select with "Other" custom input)
2. **Body Stats** (height, weight, target weight - if relevant to goal)
3. **Activity Level** (slider: 0-7 days/week exercise)
4. **Nutrition Habits** (multi-select: Tracking, Meal prep, Dining out, Snacking)
5. **Sleep Quality** (emoji scale: 😴😐😊 → 1-10)
6. **Stress Level** (emoji scale: 😰😐😌 → 1-10)
7. **Dietary Preferences** (checkboxes: Vegan, Keto, Allergies, etc.)
8. **Past Attempts** (quick multi-select: Diets tried, apps used, trainers hired)
9. **Biggest Challenge** (single-select: Time, Motivation, Knowledge, Consistency)
10. **Summary Review** (edit any answer before proceeding)

**Interaction Design:**
- **Large tap targets** (44x44pt minimum - accessibility)
- **Smart defaults** (pre-select common answers, user overrides)
- **Inline validation** (height in ft/in OR cm, weight in lbs OR kg)
- **Progress bar** (e.g., "Step 3 of 9" - reduces anxiety)
- **Skip with consequences** ("We'll ask this later, but skipping may delay personalized insights")

### Assessment Data Schema

**Captured Data Structure:**
```json
{
  "assessment_id": "uuid",
  "user_id": "uuid",
  "assessment_type": "quick | deep",
  "completed_at": "timestamp",
  "duration_seconds": 180,
  "primary_goal": {
    "category": "weight_loss",
    "custom_description": "Lose 30 lbs for wedding in 6 months",
    "target_date": "2026-06-15",
    "motivation_level": 9  // AI-scored 1-10
  },
  "fitness_baseline": {
    "activity_days_per_week": 2,
    "primary_activities": ["walking", "occasional_gym"],
    "wearable_owned": "apple_watch",
    "experience_level": "beginner"
  },
  "nutrition_baseline": {
    "meals_per_day": 3,
    "cooking_frequency": "sometimes",
    "dietary_restrictions": ["lactose_intolerant"],
    "hydration_glasses_per_day": 4,
    "tracking_experience": "tried_myfitnesspal"
  },
  "wellbeing_baseline": {
    "mood_rating": 6,
    "stress_level": 8,
    "sleep_quality": 5,
    "energy_pattern": "low_afternoon",
    "mindfulness_practice": "none",
    "journaling_habit": false
  },
  "contextual_insights": {
    "past_attempts": ["keto", "intermittent_fasting"],
    "biggest_challenges": ["stress_eating", "consistency"],
    "support_system": "family_supportive",
    "time_constraints": "work_40hrs_plus_commute",
    "emotional_triggers": ["work_stress", "break_room_snacks"]
  },
  "ai_conversation_log": [
    // Deep mode only - full transcript for future reference
  ]
}
```

### Success Metrics
- **Completion Rate:** 90%+ (started assessment to finished)
- **Time to Complete:** 3-5 min (Quick), 10-15 min (Deep)
- **Mode Selection:** 60% Quick, 40% Deep (both valuable)
- **Data Richness Score:** 8/10 average (AI-scored completeness of responses)
- **User Satisfaction:** 4.6/5 rating ("Assessment felt relevant to my goals")

### Acceptance Criteria
- [ ] Goal-first flow: User selects/describes goal BEFORE detailed questions
- [ ] Quick mode completes in <5 minutes (95% of users)
- [ ] Deep mode maintains natural conversation flow (no robotic question lists)
- [ ] AI adapts questions based on goal selection (no irrelevant questions)
- [ ] All three pillars (Fitness, Nutrition, Wellbeing) captured regardless of goal
- [ ] Users can switch from Quick to Deep (or vice versa) mid-assessment
- [ ] Progress indicator shows time remaining and questions completed
- [ ] Skip option available but clearly explains impact on personalization
- [ ] Deep mode AI detects short answers and offers multiple-choice fallback
- [ ] Quick mode uses smart defaults to reduce friction (e.g., pre-select "US" for country)
- [ ] Assessment summary shown before proceeding (user can edit answers)
- [ ] Data saved in real-time (progress not lost if user exits)

### Error Handling
| Scenario | Detection | Recovery | User Message |
|----------|-----------|----------|--------------|
| **User abandons mid-assessment** | No activity for 2 min | Auto-save progress, send WhatsApp/email reminder | "Your assessment is saved! Resume anytime." |
| **AI conversation stalls** | User gives "I don't know" 3+ times | Offer to switch to Quick mode | "Want to try quick questions instead? Faster and easier." |
| **Unrealistic goal detected** | AI flags (e.g., lose 50 lbs in 1 month) | Gentle reality check with education | "That timeline is very aggressive and may not be healthy. Can we discuss a sustainable pace?" |
| **Incomplete pillar data** | Missing Fitness OR Nutrition OR Wellbeing | Prompt specific questions before plan generation | "Just a few more questions about [pillar] to personalize your plan..." |
| **Network error during save** | API timeout | Local cache + retry on reconnect | "Saved locally. We'll sync when you're back online." |
| **User skips too many questions** | <50% data completeness | Block plan generation, explain why | "We need a bit more info to create a great plan. Just 3 more questions!" |

### Dependencies
- **AI Conversation Engine:** GPT-4 or Claude (conversational depth, empathy, follow-up logic)
- **Assessment Logic:** Goal-specific question routing, adaptive depth control
- **Database:** Assessment schema with real-time save/resume capability
- **UI Components:** Progress indicators, emoji scales, multi-select chips, conversational chat interface
- **Integration:** Links to F1.4 (wearable ownership data informs integration setup)

### MVP Status
[X] MVP Core

---

## F1.3: Goal Setting & Refinement (AI-Guided)

### Description
An AI-guided collaborative goal-setting experience that doesn't just capture user goals - it works WITH the user to refine, reality-check, and optimize them for success. The AI acts as a knowledgeable coach who helps users understand what's achievable, what's sustainable, and how to structure goals for maximum motivation. This is not a fixed goal picker - it's a dynamic conversation that results in SMART goals tailored to each user's context.

### User Story
**As a** new yHealth user who just completed assessment,
**I want to** work with the AI to create realistic, motivating goals that fit my life,
**So that** I start with clear, achievable targets that I actually believe in (not generic cookie-cutter goals).

### Flexibility Modes
| Mode | Experience |
|------|------------|
| **Light (Guided Setup)** | AI suggests 2-3 pre-structured goals based on assessment, user confirms or tweaks. 5 min. |
| **Deep (Collaborative Refinement)** | AI engages in goal-setting dialogue, explores trade-offs, helps prioritize, validates realism. 10-15 min. |

**Default:** Light mode for Quick assessment users, Deep mode for Deep assessment users. Can upgrade to Deep anytime.

### Goal Framework: SMART + Emotional Resonance

**SMART Goals Enhanced:**
- **Specific:** Clear metric (lose 20 lbs, run 5K, meditate daily)
- **Measurable:** Quantifiable progress (weight, distance, streak days)
- **Achievable:** Realistic given user's context (time, experience, constraints)
- **Relevant:** Aligned with user's primary motivation (why this matters NOW)
- **Time-bound:** Clear deadline or milestone timeline
- **+ Emotional Resonance:** Connected to deeper "why" (wedding, health scare, wanting energy to play with kids)

### Goal Categories (Three Pillars)

#### Fitness Goals
| Goal Type | Example | Measurement |
|-----------|---------|-------------|
| **Weight Loss** | Lose 20 lbs in 4 months | Weekly weigh-ins, body composition |
| **Muscle Gain** | Gain 10 lbs muscle in 6 months | Body composition scan, strength metrics |
| **Strength** | Squat 200 lbs by June | Progressive load tracking |
| **Endurance** | Run a half-marathon in 3 months | Distance, pace, heart rate zones |
| **Activity Consistency** | Exercise 4 days/week for 90 days | Weekly activity streak |
| **Recovery** | Improve sleep quality to 8/10 in 60 days | Sleep score tracking |

#### Nutrition Goals
| Goal Type | Example | Measurement |
|-----------|---------|-------------|
| **Calorie Target** | Maintain 1800 cal/day for 8 weeks | Daily calorie tracking |
| **Macro Balance** | Hit 150g protein daily for 90 days | Daily macro tracking |
| **Meal Consistency** | Eat 3 balanced meals/day for 30 days | Meal logging streak |
| **Hydration** | Drink 8 glasses water daily for 60 days | Daily hydration tracking |
| **Habit Formation** | Meal prep Sundays for 12 weeks | Weekly meal prep check-ins |
| **Mindful Eating** | No distracted eating for 30 days | Mindfulness check-ins |

#### Wellbeing Goals
| Goal Type | Example | Measurement |
|-----------|---------|-------------|
| **Stress Reduction** | Lower stress from 8/10 to 5/10 in 90 days | Daily stress ratings |
| **Mood Improvement** | Improve mood score to 8/10 in 60 days | Daily mood tracking |
| **Mindfulness** | Meditate 10 min daily for 30 days | Meditation streak |
| **Journaling** | Journal 5 days/week for 90 days | Journaling frequency |
| **Energy Optimization** | Eliminate afternoon energy crashes in 60 days | Energy pattern tracking |
| **Sleep Routine** | Consistent 10 PM bedtime for 30 days | Bedtime consistency |

### AI-Guided Goal Refinement Flow

#### Light Mode: Guided Setup (5 min)

**Step 1: AI Suggests Initial Goals (Based on Assessment)**
```
Based on your goal to lose weight and improve energy, here are my recommendations:

Primary Goal (Fitness):
🎯 Lose 20 lbs in 4 months (5 lbs/month - sustainable pace)
   Why this matters: Wedding in June, want to feel confident
   Success rate: 78% of users with similar profile achieve this

Supporting Goal (Nutrition):
🍽️ Track meals 6 days/week for 90 days
   Why: Food awareness is the #1 factor in weight loss
   Success rate: 85% of successful weight-losers track consistently

Supporting Goal (Wellbeing):
😌 Improve sleep quality from 5/10 to 7/10 in 60 days
   Why: Your assessment showed low energy + poor sleep - they're connected
   Success rate: 70% see energy improvements with better sleep

[Edit Goals] [Looks Good, Continue]
```

**Step 2: User Edits (Optional)**
- Adjust timeline (slider: faster/slower)
- Modify target (e.g., 25 lbs instead of 20)
- Change supporting goals priority

**Step 3: AI Validation**
```
AI: "You changed the timeline to 2 months instead of 4. That's 10 lbs/month -
     pretty aggressive. Most people find 1-2 lbs/week more sustainable.
     Want to stick with 2 months or give yourself more time?"

User: [Choice]

AI: "Got it! I'll design your plan around that. Just know I'll check in weekly
     to make sure we're on a healthy pace."
```

#### Deep Mode: Collaborative Refinement (10-15 min)

**Step 1: Goal Exploration**
```
AI: "You mentioned wanting to lose 30 lbs. Let's dig into that. Why 30 specifically?"

User: "I want to get back to my college weight."

AI: "College weight - that's a common reference point. How long ago was that,
     and what was different about your life then?"

User: "About 8 years ago. I was super active, played sports, ate whatever."

AI: "So you had a totally different lifestyle - lots of activity, different stress levels.
     Here's a question: If you lost 20 lbs but FELT amazing and had tons of energy,
     would that be a win? Or is 30 lbs the only number that matters?"

User: "I guess feeling good is more important than a specific number."

AI: "Love that shift! Let's set a goal around how you FEEL, not just the scale.
     How about this: 'Lose 20-30 lbs AND improve energy score from 6/10 to 9/10 in 6 months.'
     We'll track both, but if energy hits 9/10 at 22 lbs, we might decide that's perfect."

User: "That feels way better. Less pressure."
```

**Step 2: Reality-Checking**
```
AI: "6 months to lose 20-30 lbs is about 1 lb/week - very doable. But let's talk logistics.
     You said work is crazy and you stress-eat. What's your realistic exercise capacity?"

User: "Maybe 3 days a week, 30-45 minutes?"

AI: "Perfect - 3 days is enough if we combine it with nutrition awareness.
     Here's my concern: You mentioned stress-eating. If we focus ONLY on calorie restriction,
     you'll feel deprived and stress-eat more. What if we also set a wellbeing goal around
     stress management? Like daily 10-min journaling or breath work?"

User: "I've never journaled, but I could try."

AI: "How about we start super small - 3 days/week, 5 min. If you hate it, we pivot to
     something else. But I bet it'll help with the stress-eating more than willpower alone."
```

**Step 3: Goal Prioritization**
```
AI: "Let's lock in your goals. You've got 3 areas:
     1. FITNESS: Lose 20-30 lbs in 6 months
     2. NUTRITION: Track meals 6 days/week to build awareness
     3. WELLBEING: Journal 3x/week to manage stress-eating

     Which feels MOST important to you? Which would you be devastated to skip?"

User: "Definitely the weight loss."

AI: "Okay, that's your North Star. Nutrition and wellbeing are HOW we get there.
     If you had to choose between tracking food or journaling, which sounds more doable?"

User: "Tracking food - I've done it before."

AI: "Great. Let's make tracking PRIMARY and journaling SECONDARY (nice-to-have).
     Sound good?"
```

**Step 4: Milestone Breakdown**
```
AI: "6 months is a long time. Let's break it into mini-milestones so you feel progress:

     MONTH 1: Lose 5 lbs + establish 3-day/week workout habit
     MONTH 2: Lose 5 more lbs (10 total) + hit 6-day/week food tracking
     MONTH 3: Lose 5 more lbs (15 total) + energy score improvement to 7/10
     MONTH 4-6: Lose remaining 5-15 lbs + maintain habits

     Each month you'll get a 'check-in coaching call' where we adjust if needed.
     How does that feel?"

User: "Way less overwhelming!"
```

### Goal Validation & Safety Guardrails

**AI Validation Rules:**
| Goal Type | Safety Check | AI Action if Unsafe |
|-----------|--------------|---------------------|
| **Weight Loss** | >2 lbs/week average | Suggest slower pace, explain risks (muscle loss, metabolic slowdown) |
| **Calorie Target** | <1200 kcal/day (women) or <1500 (men) | Flag as too low, recommend TDEE-based target |
| **Muscle Gain** | >2 lbs/month for beginners, >0.5 lbs/month for advanced | Reality-check expectations, cite research |
| **Exercise Frequency** | >6 days/week with no rest | Recommend rest days, explain recovery importance |
| **Sleep Target** | <6 hours/night | Educate on health risks, suggest 7-9 hours |
| **Extreme Timelines** | Any goal with <4 weeks to drastic change | Extend timeline, explain sustainability |

**Medical Condition Flags:**
If user disclosed conditions in assessment (diabetes, heart disease, eating disorder history):
- AI adds disclaimer: "Since you mentioned [condition], please confirm with your doctor before starting."
- Offer to send goal summary via email for user to share with provider
- Adjust recommendations conservatively (e.g., no intermittent fasting for diabetics without medical clearance)

### Goal Commitment & Motivation Anchoring

**Final Commitment Screen:**
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

[Looks Great!] [Edit Goals]
```

**Motivational Lock-In:**
```
AI: "Before we build your plan, one last thing: On a scale of 1-10, how committed
     are you to these goals?"

User: [Slider selection]

If <7/10:
AI: "I'm sensing some hesitation. What's holding you back? Let's adjust until
     you're at an 8 or higher - that's the sweet spot for success."

If ≥7/10:
AI: "Love that confidence! I'll check in with you in 30 days to see how we're tracking.
     And remember - goals can evolve. If life changes, we adjust together."
```

### Success Metrics
- **Goal Clarity Score:** 9/10 average (AI-assessed specificity + achievability)
- **User Confidence:** 80%+ users rate confidence ≥7/10
- **SMART Compliance:** 95%+ goals meet all SMART criteria
- **Emotional Resonance:** 90%+ goals include "why it matters" statement
- **Realistic Pacing:** <5% of goals flagged as unsafe/unsustainable
- **Multi-Pillar Coverage:** 70%+ users set goals across 2+ pillars

### Acceptance Criteria
- [ ] AI suggests initial goals based on assessment data (not generic templates)
- [ ] Users can edit every aspect of suggested goals (timeline, target, metrics)
- [ ] AI validates goal safety and realism (flags unsafe timelines/targets)
- [ ] Deep mode explores user's "why" and emotional drivers
- [ ] Goals broken into 30-day milestones for psychological progress
- [ ] AI adjusts recommendations based on disclosed medical conditions
- [ ] Users rate confidence (1-10) before finalizing goals
- [ ] All goals meet SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] Light mode completes goal setup in <5 minutes
- [ ] Deep mode facilitates goal refinement without feeling tedious
- [ ] Goals saved with full context (primary/supporting, motivation, milestones)
- [ ] Users can return to edit goals anytime from settings

### Error Handling
| Scenario | Detection | Recovery | User Message |
|----------|-----------|----------|--------------|
| **Unsafe goal detected** | AI validation flags risk | Block finalization, explain why | "That timeline may not be healthy. Let's adjust to a sustainable pace." |
| **Conflicting goals** | Logic check (e.g., gain muscle + lose weight aggressively) | Explain trade-off, force prioritization | "Gaining muscle and losing weight fast are tough together. Which matters more right now?" |
| **Vague goal** | Missing specificity | Prompt for clarity | "Let's make this measurable. How much weight, by when?" |
| **Low confidence (<5/10)** | User commitment rating | Re-open goal refinement | "Let's find a goal you're excited about. What feels off?" |
| **No primary goal set** | User tries to skip | Block plan generation | "I need at least one primary goal to build your plan. Let's pick one together." |
| **User overwhelmed** | Detects "too many goals" | Suggest focus | "Starting with 3 goals is ambitious. Want to focus on 1-2 for the first month?" |

### Dependencies
- **AI Coaching Engine:** Goal validation logic, motivational interviewing prompts
- **Assessment Data:** F1.2 outputs inform goal suggestions
- **Database:** Goal schema with milestones, motivation anchors, revision history
- **Integration:** Links to F1.6 (goals drive personalized plan generation)

### MVP Status
[X] MVP Core

---

## F1.4: Integration Setup (Wearable & App Connections)

### Description
Seamless connection of wearables, fitness trackers, and health apps to create the unified data ecosystem that powers yHealth's "Second Mind" insights. This feature prioritizes ease of use while ensuring users understand the value of each integration. Mandatory requirement: Users must connect at least ONE data source to proceed (no integration = no insights). Supports OAuth flows for 10 primary integrations at MVP launch, with clear permission explanations and privacy controls.

### User Story
**As a** new yHealth user who just set my goals,
**I want to** quickly connect my existing wearables and health apps,
**So that** yHealth can automatically track my health data without manual logging burden.

### Flexibility Modes
| Mode | Experience |
|------|------------|
| **Light (Quick Connect)** | Connect 1-2 primary devices (WHOOP, Apple Watch, Fitbit). Skip optional integrations. 3-5 min. |
| **Deep (Full Ecosystem)** | Connect all owned devices + nutrition apps + sleep trackers. Maximize data richness. 8-12 min. |

**Mandatory Minimum:** 1 integration required (fitness tracker OR nutrition app OR sleep tracker). Cannot skip entirely.

### Supported Integrations (MVP - 10 Primary Sources)

#### Tier 1: Fitness Wearables (Primary Data Sources)
| Integration | Data Provided | OAuth Provider | Priority |
|-------------|---------------|----------------|----------|
| **WHOOP** | Heart rate, HRV, sleep stages, strain, recovery | WHOOP API | Highest |
| **Apple Health** | Activity, workouts, heart rate, sleep, nutrition (aggregated) | HealthKit | Highest |
| **Fitbit** | Steps, heart rate, sleep, active minutes | Fitbit API | High |
| **Garmin** | GPS activities, heart rate, VO2 max, training load | Garmin Connect | High |
| **Oura Ring** | Sleep stages, HRV, readiness, body temp | Oura API | High |
| **Samsung Health** | Steps, workouts, heart rate, sleep | Samsung Health API | Medium |

#### Tier 2: Nutrition & Lifestyle Apps
| Integration | Data Provided | OAuth Provider | Priority |
|-------------|---------------|----------------|----------|
| **MyFitnessPal** | Food logs, calorie/macro tracking | Under Armour API | High |
| **Nutritionix** | Food database (5M+ items) | Nutritionix API | Medium |
| **Cronometer** | Detailed micronutrient tracking | Cronometer API | Low |

#### Tier 3: Specialized Tracking
| Integration | Data Provided | OAuth Provider | Priority |
|-------------|---------------|----------------|----------|
| **Strava** | GPS activities (runs, rides), performance metrics | Strava API | Medium |

**Future (Post-MVP):** Google Fit, Polar, Suunto, Withings, Eight Sleep, Levels (CGM), Whoop+ (Dexcom), 300+ via Terra API.

### Integration Setup Flow

#### Step 1: Introduction & Value Proposition
```
Let's Connect Your Health Data 📊

yHealth becomes your "Second Mind" by connecting everything about your health.
The more you connect, the more powerful your insights.

What we'll sync:
✓ Fitness: Workouts, heart rate, steps, recovery
✓ Nutrition: Meals, calories, macros (if you track)
✓ Sleep: Quality, stages, duration
✓ Wellbeing: Mood patterns, stress indicators

Privacy Promise:
🔒 Your data is encrypted and never sold
🔒 You control what we sync (turn off anytime)
🔒 We only use data to personalize YOUR coaching

[Let's Connect] [Learn More About Privacy]
```

#### Step 2: Device Detection & Smart Recommendations
```
What wearables or apps do you use?

DETECTED NEARBY (via Bluetooth/HealthKit):
☑ Apple Watch (Series 8)  [Connect Now]
☐ WHOOP 4.0              [Not Paired - Pair in WHOOP app first]

POPULAR INTEGRATIONS:
☐ Fitbit                 [Connect]
☐ Garmin                 [Connect]
☐ Oura Ring              [Connect]
☐ MyFitnessPal           [Connect]
☐ Strava                 [Connect]

[Show All Integrations (10)]  [Skip for Now - Add Later]
```

**Smart Detection:**
- iOS: Use HealthKit to detect connected devices (Apple Watch, paired wearables)
- Android: Use Google Fit API for detection
- Bluetooth scan for nearby WHOOP/Oura (with permission)
- Prioritize integrations user already owns (no point showing Garmin if they don't have one)

#### Step 3: OAuth Connection Flow (Per Integration)

**Example: Connecting WHOOP**
```
1. User taps "Connect WHOOP"
   ↓
2. yHealth explains what we'll sync:
   "We'll sync your WHOOP data including:
    ✓ Daily Strain scores
    ✓ Recovery scores
    ✓ Sleep performance
    ✓ Heart Rate Variability (HRV)
    ✓ Heart rate data

    We won't access: Your WHOOP journal entries (private)

    [Authorize WHOOP] [Cancel]"
   ↓
3. Redirect to WHOOP OAuth page
   ↓
4. User logs into WHOOP, grants permissions
   ↓
5. Redirect back to yHealth with access token
   ↓
6. yHealth confirms connection + initiates first sync
   "✓ WHOOP Connected! Syncing your last 30 days of data..."
   ↓
7. Background job syncs historical data (30 days)
   "✓ Sync complete! 30 days of WHOOP data imported."
```

**OAuth Scopes Requested (Per Integration):**
| Integration | Scopes | Justification |
|-------------|--------|---------------|
| **WHOOP** | `read:recovery`, `read:sleep`, `read:workout`, `read:cycles` | Core fitness/recovery data for AI insights |
| **Apple Health** | `activity`, `workouts`, `heart_rate`, `sleep_analysis` | Comprehensive health tracking |
| **Fitbit** | `activity`, `heartrate`, `sleep`, `profile` | Fitness and sleep metrics |
| **MyFitnessPal** | `diary`, `nutrition` | Food logs for nutrition insights |
| **Strava** | `read:all`, `activity:read` | GPS activity data, performance metrics |

#### Step 4: Post-Connection Confirmation
```
Great! Here's what's connected:

✅ Apple Watch
   Syncing: Activity, heart rate, workouts, sleep
   Last sync: 2 minutes ago
   [Manage] [Disconnect]

✅ MyFitnessPal
   Syncing: Food logs, nutrition data
   Last sync: 5 minutes ago
   [Manage] [Disconnect]

RECOMMENDED (Based on Your Goals):
💡 Connect WHOOP for advanced recovery insights
   Why: You set a goal to improve sleep quality - WHOOP's sleep tracking is gold-standard.
   [Connect WHOOP]

[Continue to Preferences] [Add More Integrations]
```

### Data Sync Specifications

**Initial Sync (Historical Data):**
- Pull last 30 days of data (if available via API)
- Display progress indicator: "Syncing WHOOP data... 12 of 30 days imported"
- Priority order: Most recent data first (today → backwards)

**Ongoing Sync (Real-Time):**
| Integration | Sync Frequency | Method |
|-------------|----------------|--------|
| **WHOOP** | Every 15 min | Webhook + polling fallback |
| **Apple Health** | Real-time | HealthKit background delivery |
| **Fitbit** | Every 15 min | Fitbit subscription API |
| **MyFitnessPal** | Every 1 hour | Polling (no webhooks) |
| **Strava** | Real-time | Webhook subscription |
| **Oura** | Every 6 hours | Polling (daily data updated overnight) |

**Sync Status Indicators:**
```
Integration Status Dashboard (in app settings):

Apple Watch: ✅ Synced 5 min ago
WHOOP: ✅ Synced 12 min ago
MyFitnessPal: ⚠️ Last sync 25 hours ago (re-authorize needed)
Strava: ❌ Connection lost (click to reconnect)
```

### Permission Granularity & User Control

**Granular Permissions (Deep Mode):**
```
Customize What We Sync from Apple Watch:

✅ Workouts (required for fitness insights)
✅ Heart Rate (required for strain/recovery)
✅ Sleep Data (required for sleep insights)
☐ Mindfulness Sessions (optional - enhances wellbeing insights)
☐ Nutrition (if you log in Apple Health)

[Save Preferences]
```

**Data Retention Control:**
```
Data Settings:

How long should we keep your synced data?
○ Forever (best for long-term insights)
○ 2 years (recommended)
○ 1 year
○ 6 months (minimum for meaningful insights)

Delete synced data:
⚠️ This will delete all data from [integration] but won't disconnect it.
   Future data will still sync.
[Delete WHOOP Data] [Delete MyFitnessPal Data]
```

### Integration Failure & Troubleshooting

**Common Failure Scenarios:**
| Scenario | User Experience | Recovery |
|----------|-----------------|----------|
| **OAuth authorization denied** | "Looks like you didn't authorize yHealth. Want to try again?" | Retry button |
| **Token expired** | "Your WHOOP connection expired. Reconnect to resume syncing." | Re-authorize flow |
| **API rate limit hit** | "Too many sync requests. We'll retry in 15 min." | Auto-retry with exponential backoff |
| **Integration API down** | "WHOOP's API is temporarily down. We'll keep trying." | Show status page link |
| **No data available** | "Your Fitbit has no data yet. Wear it today and we'll sync tonight!" | Encouraging message |
| **Conflicting data sources** | "Apple Watch and Fitbit both report sleep. We'll use Apple Watch (your primary)." | Explain priority rules |

**Troubleshooting Help:**
```
WHOOP Not Syncing?

Try these steps:
1. Check that your WHOOP is charged and paired to your phone
2. Open the WHOOP app and ensure data is visible there
3. Disconnect and reconnect WHOOP in yHealth
4. Contact support if issue persists

[Disconnect & Reconnect] [Contact Support]
```

### Integration Value Communication

**Why This Matters (Per Integration):**
| Integration | Value Message |
|-------------|---------------|
| **WHOOP** | "WHOOP provides the most advanced recovery and strain data - essential for optimizing your training and sleep." |
| **Apple Watch** | "Apple Watch gives us continuous heart rate, activity, and workout data - the foundation for your fitness insights." |
| **MyFitnessPal** | "Nutrition tracking is the #1 factor in weight loss. MyFitnessPal makes it easy to see how food impacts your goals." |
| **Oura Ring** | "Oura Ring has the best sleep tracking in the industry. Perfect for your goal to improve sleep quality." |
| **Strava** | "Strava adds GPS and performance metrics for your runs/rides - we'll show how outdoor workouts affect your recovery." |

### Success Metrics
- **Integration Rate:** 90%+ users connect at least 1 integration
- **Multi-Integration Rate:** 60%+ users connect 2+ integrations
- **OAuth Success Rate:** 95%+ successful authorizations (low failure rate)
- **Sync Reliability:** 99%+ uptime for data syncing
- **Time to First Sync:** <2 min from authorization to data visible in app
- **User Satisfaction:** 4.7/5 rating for integration setup ease

### Acceptance Criteria
- [ ] At least 1 integration required to proceed (cannot skip entirely)
- [ ] Support for 10 primary integrations at MVP (WHOOP, Apple, Fitbit, Garmin, Oura, Samsung, MFP, Nutritionix, Cronometer, Strava)
- [ ] OAuth flows complete successfully with <5% failure rate
- [ ] Auto-detect nearby/paired devices via Bluetooth/HealthKit (iOS) or Google Fit (Android)
- [ ] Clear permission explanations before OAuth (what we sync, what we don't)
- [ ] Historical data sync (30 days) completes within 5 minutes
- [ ] Real-time/near-real-time ongoing sync for all integrations
- [ ] Sync status indicators show last sync time and connection health
- [ ] Users can disconnect integrations anytime (data optionally deleted or retained)
- [ ] Granular permission controls (choose what to sync per integration)
- [ ] Token refresh logic handles expired tokens gracefully (auto-refresh or prompt re-auth)
- [ ] Troubleshooting help for common connection issues
- [ ] Multi-source conflict resolution (priority hierarchy: WHOOP > Apple > Fitbit for HR, etc.)

### Error Handling
| Scenario | Detection | Recovery | User Message |
|----------|-----------|----------|--------------|
| **User has no wearables** | No integrations connected after 2 min | Suggest manual logging option | "No wearables? No problem! You can log workouts manually in the app." |
| **OAuth redirect fails** | Redirect timeout or error code | Retry with troubleshooting tips | "Connection failed. Check your internet and try again. [Retry] [Help]" |
| **Duplicate data from multiple sources** | Same metric from 2+ sources | Apply priority hierarchy (Section 15 of PRD) | Silent: Use golden source rules. No user action needed. |
| **Integration deprecated/sunset** | API returns 410 Gone | Notify user, suggest alternative | "MyFitnessPal API is no longer available. Try Cronometer or manual logging." |
| **Token revoked by user** | API returns 401 Unauthorized | Prompt re-authorization | "You revoked yHealth's access to Fitbit. Reconnect to resume syncing." |
| **Sync fails 3+ times** | Repeated API errors | Escalate to manual review, notify user | "Having trouble syncing WHOOP. Our team is investigating. [Contact Support]" |

### Dependencies
- **OAuth Infrastructure:** Secure token storage, refresh logic, PKCE for mobile
- **Integration APIs:** 10 third-party API clients with rate limit handling
- **Database:** Integration credentials table, sync status tracking, data conflict resolution
- **Background Jobs:** Scheduled sync workers, webhook listeners
- **UI Components:** OAuth webviews, sync status indicators, permission toggles
- **Epic Dependencies:** F1.2 (assessment may ask about owned wearables), F1.6 (integration data powers plan generation)

### MVP Status
[X] MVP Core

---

## F1.5: Preference Configuration

### Description
A comprehensive preference setup that tailors the yHealth experience to each user's engagement style, schedule, and communication preferences. This feature captures critical settings that govern how the AI coaches the user - from Light/Deep mode defaults to notification timing and quiet hours. The goal is to establish a personalized experience framework that respects user boundaries while maximizing engagement opportunities.

### User Story
**As a** new yHealth user completing onboarding,
**I want to** set my interaction preferences upfront,
**So that** yHealth fits seamlessly into my life without overwhelming or interrupting me at the wrong times.

### Flexibility Modes
| Mode | Experience |
|------|------------|
| **Light (Essential Preferences)** | Set engagement mode, notification preferences, quiet hours. 2-3 min. |
| **Deep (Full Customization)** | Granular control over every notification type, channel preferences, AI personality, coaching style. 5-8 min. |

**Default:** Light mode for most users. Deep mode accessible anytime from settings.

### Preference Categories

#### 1. Engagement Mode (Light vs Deep Default)

**Purpose:** Establish user's default engagement depth for all yHealth features.

**Configuration Screen:**
```
How do you prefer to interact with yHealth?

○ Light Mode (Quick & Efficient)
  ✓ 30-second check-ins
  ✓ Emoji mood logging
  ✓ Brief insights (key highlights only)
  ✓ Short coaching calls (5 min)

○ Deep Mode (Detailed & Comprehensive)
  ✓ 5-10 min journaling
  ✓ Detailed mood logging
  ✓ In-depth insights (full analysis)
  ✓ Extended coaching calls (20-30 min)

○ Adaptive (AI Learns Your Preference)
  ✓ Start with Light, AI suggests Deep when you have time
  ✓ Automatically adjusts based on engagement patterns

[Select Mode]

💡 You can switch modes anytime per interaction.
```

**Behavioral Impact:**
| Feature | Light Mode Default | Deep Mode Default |
|---------|-------------------|-------------------|
| **Daily Check-In** | Emoji + energy slider (30 sec) | Full journaling prompt (5-10 min) |
| **Coaching Calls** | 5-min quick check-ins | 20-30 min deep coaching |
| **Insights** | Summary bullets only | Full analysis with charts |
| **Goal Tracking** | Simple progress bar | Detailed metrics dashboard |
| **Meal Logging** | Photo + AI estimate | Full macro/calorie breakdown |

#### 2. Notification Preferences

**Purpose:** Control when and how yHealth reaches out proactively.

**Notification Types:**
```
Customize Your Notifications:

DAILY REMINDERS:
☑ Morning check-in (7:00 AM) [Edit Time]
☑ Evening reflection (9:00 PM) [Edit Time]
☐ Meal logging reminders (breakfast, lunch, dinner)
☐ Hydration reminders (every 2 hours)

COACHING NUDGES:
☑ Motivational messages (2-3x/day based on patterns)
☑ Habit streak celebrations (when you hit milestones)
☐ Weekly progress summaries (Sundays at 7 PM)

INSIGHTS & ALERTS:
☑ New personalized insights (as they're generated)
☑ Pattern alerts (when AI detects important changes)
☑ Goal progress updates (weekly)
☐ Wearable sync reminders (if data gaps detected)

CHANNEL PREFERENCES:
Deliver notifications via:
☑ Push (Mobile App)
☑ WhatsApp
☐ Email (weekly digest only)

[Save Preferences]
```

**Granular Controls (Deep Mode):**
```
Advanced Notification Settings:

Notification Frequency:
○ Minimal (1-2/day)
○ Moderate (3-5/day) ✓
○ Active (6-10/day)
○ Custom (set per notification type)

Notification Style:
○ Gentle nudges (suggestions only)
○ Balanced (mix of reminders and insights) ✓
○ Proactive coaching (frequent check-ins and guidance)

Smart Timing:
☑ Send notifications when I'm likely to be available (AI learns patterns)
☐ Fixed times only (ignore AI timing)

Do Not Disturb Integration:
☑ Respect phone's Do Not Disturb mode
☐ Override DND for critical alerts only (goal deadlines, health concerns)
```

#### 3. Quiet Hours

**Purpose:** Ensure yHealth never interrupts during sleep, meetings, or personal time.

**Configuration Screen:**
```
Set Your Quiet Hours:

When should yHealth stay silent? 🤫

SLEEP HOURS:
From: 10:00 PM  To: 7:00 AM  [Every day ▼]
☑ No notifications during sleep hours

WORK/FOCUS HOURS:
From: 9:00 AM  To: 12:00 PM  [Weekdays ▼]
☑ Silence non-urgent notifications during work focus time

CUSTOM QUIET PERIODS:
+ Add Custom Period (e.g., "Workout time", "Kids bedtime routine")

EXCEPTIONS (What can override Quiet Hours):
☐ Critical health alerts (e.g., abnormal HR detected)
☐ Scheduled coaching calls (if I booked them)
☑ Nothing (strict quiet hours)

[Save Quiet Hours]
```

**Behavioral Impact:**
- **Queued Notifications:** Messages generated during quiet hours are held and delivered at the next available window
- **Coaching Calls:** Scheduled calls show reminder 10 min before, even in quiet hours (unless disabled)
- **WhatsApp:** Messages marked "delivered" but not sent until quiet hours end

#### 4. Coaching Style Preferences

**Purpose:** Tailor AI personality and communication style to user preferences.

**Configuration Screen:**
```
How should your AI coach communicate?

TONE:
○ Professional & Formal (like a medical advisor)
○ Friendly & Supportive (like a personal trainer) ✓
○ Casual & Relatable (like a wellness-focused friend)

COMMUNICATION STYLE:
○ Direct & Concise (get to the point, no fluff)
○ Balanced (mix of efficiency and encouragement) ✓
○ Warm & Detailed (thorough explanations, lots of context)

MOTIVATIONAL APPROACH:
○ Tough love (push me hard, call out slacking)
○ Balanced accountability (supportive but honest) ✓
○ Gentle encouragement (celebrate wins, downplay setbacks)

LANGUAGE COMPLEXITY:
○ Simple (avoid jargon, explain everything)
○ Standard (assume general health literacy) ✓
○ Advanced (technical terms OK, I'm knowledgeable)

[Save Coaching Preferences]
```

**Behavioral Impact:**
| Style Choice | Example AI Message (Weight Loss Goal) |
|--------------|---------------------------------------|
| **Professional/Direct** | "Your calorie intake exceeded target by 300 kcal today. Adjust dinner portions tomorrow to stay on track." |
| **Friendly/Balanced** | "Hey! Today was a bit over target, but no worries - one day won't derail you. Let's get back on track tomorrow!" |
| **Casual/Gentle** | "Totally get it - some days are harder than others! Tomorrow's a fresh start. You've got this! 💪" |

#### 5. Channel Preferences (Voice, WhatsApp, Mobile App)

**Purpose:** Define preferred interaction channels for different use cases.

**Configuration Screen:**
```
Where do you prefer to interact with yHealth?

PRIMARY CHANNEL (daily check-ins, quick logs):
○ Mobile App (in-app interactions)
○ WhatsApp (conversational logging) ✓
○ Voice Calls (scheduled coaching)

COACHING CALLS:
☑ Schedule regular voice coaching calls
   Frequency: Weekly ▼  Day: Sundays ▼  Time: 7:00 PM ▼
☐ On-demand calls only (I'll initiate when needed)

INSIGHTS DELIVERY:
☑ Push notifications (instant)
☑ WhatsApp messages (conversational)
☐ Email digest (weekly summary)

MEAL LOGGING:
○ Mobile app (photo upload)
○ WhatsApp (send pics via chat) ✓
○ Voice (describe meals on calls)

MOOD/ENERGY LOGGING:
○ Mobile app (dashboard widget)
○ WhatsApp (quick emoji reply) ✓
○ Voice (discussed on coaching calls)

[Save Channel Preferences]
```

**Multi-Channel Sync:**
- All channels sync in real-time (log meal via WhatsApp → appears in app instantly)
- Conversation history unified across channels
- User can switch channels mid-interaction without losing context

#### 6. Privacy & Data Preferences

**Purpose:** User control over data usage and sharing.

**Configuration Screen:**
```
Privacy & Data Control:

DATA USAGE:
☑ Use my data to train AI (anonymized, improves insights for everyone)
☐ Keep my data private (AI personalized only for me, no aggregate learning)

HEALTH DATA SHARING (Future Feature):
☐ Share anonymized data with research institutions (opt-in only)
☐ Share data with my healthcare provider (requires provider integration)

PERSONALIZATION LEVEL:
○ Maximum (AI uses all data for insights)
○ Moderate (exclude sensitive data like mood journals) ✓
○ Minimal (only use fitness/nutrition data, not wellbeing)

DATA RETENTION:
Your health data is kept for: 2 years ▼
After this period, old data is archived (still accessible but not used for insights).

[Review Privacy Policy] [Manage Data Export]
```

### Default Preferences (If User Skips Setup)

**Smart Defaults (Applied if Skipped):**
- **Engagement Mode:** Light (can upgrade anytime)
- **Notifications:** Morning check-in (8 AM) + Evening reflection (9 PM) only
- **Quiet Hours:** 10 PM - 7 AM (standard sleep hours)
- **Coaching Style:** Friendly & Balanced
- **Primary Channel:** Mobile app (safest default)
- **Privacy:** Maximum personalization, data used for AI training (with anonymization)

**Onboarding Prompt:**
```
Quick question: Want to customize your experience now or use smart defaults?

Smart Defaults Include:
✓ Light mode (quick check-ins)
✓ 2 daily reminders (morning + evening)
✓ Quiet hours during typical sleep (10 PM - 7 AM)
✓ Friendly coaching style

[Use Defaults] [Customize Now] [Customize Later]
```

### Preference Change Anytime

**Access Path:**
- Mobile App: Settings > Preferences
- WhatsApp: Send "change preferences" or "settings"
- Voice Call: "I want to change my notification settings"

**Change Confirmation:**
```
You changed your engagement mode from Light to Deep.

What this means:
✓ Daily check-ins will be more detailed (5-10 min)
✓ Insights will include full analysis, not just summaries
✓ Coaching calls will be 20-30 min instead of 5 min

This takes effect immediately.

[Confirm] [Undo]
```

### Success Metrics
- **Preference Setup Completion:** 85%+ users set at least 3 preference categories
- **Customization Rate:** 40%+ users customize beyond defaults (shows engagement)
- **Notification Opt-Out Rate:** <10% users disable all notifications (low annoyance)
- **Quiet Hours Respect:** 99.9% compliance (no messages sent during quiet hours)
- **Channel Diversity:** 60%+ users actively use 2+ channels
- **Preference Changes:** 30%+ users adjust preferences within first 30 days (iterating to fit)

### Acceptance Criteria
- [ ] Users can set Light/Deep mode as default engagement level
- [ ] Granular notification controls for all notification types
- [ ] Quiet hours configurable by day and time, with exceptions
- [ ] Coaching style preferences adjust AI tone and communication
- [ ] Channel preferences determine where interactions happen (app, WhatsApp, voice)
- [ ] Privacy controls for data usage and anonymization
- [ ] Smart defaults applied if user skips preference setup
- [ ] All preferences editable anytime from app settings
- [ ] Preference changes take effect immediately
- [ ] Confirmation messages explain impact of preference changes
- [ ] Quiet hours respected 99.9% of the time (no leakage)
- [ ] Multi-channel sync ensures consistent experience across app/WhatsApp/voice

### Error Handling
| Scenario | Detection | Recovery | User Message |
|----------|-----------|----------|--------------|
| **Overlapping quiet hours** | User sets conflicting periods | Auto-merge or prompt clarification | "Your quiet hours overlap. Want to merge them into one period?" |
| **No notification windows** | Quiet hours cover 24 hours | Prevent save, require adjustment | "You've blocked all notification times. Leave at least a 2-hour window." |
| **Invalid phone DND integration** | OS permission denied | Fallback to manual quiet hours | "Can't access Do Not Disturb settings. We'll use your quiet hours instead." |
| **Channel unavailable** | WhatsApp not connected but set as primary | Prompt alternative or integration setup | "WhatsApp isn't connected yet. Use app or connect WhatsApp first?" |
| **Preference save fails** | API timeout or network error | Retry with local cache | "Couldn't save preferences. Retrying... [Saved locally until connection restored]" |

### Dependencies
- **Notification Service:** Push (FCM/APNS), WhatsApp Business API, Email (SendGrid/SES)
- **Scheduling System:** Cron jobs or task queue for timed notifications
- **User Settings Database:** Preference schema with versioning (track changes over time)
- **AI Coaching Engine:** Consumes preferences to adjust tone, depth, timing
- **Integration:** F1.4 (channel preferences depend on WhatsApp integration status)

### MVP Status
[X] MVP Core

---

## F1.6: Personalized Plan Generation

### Description
The culmination of onboarding - an AI-generated, fully personalized health plan that synthesizes every data point collected (assessment, goals, integrations, preferences) into an actionable, week-by-week roadmap. This is the user's "aha moment" - seeing their unique plan appear in seconds, tailored to their goals, constraints, and preferred engagement style. The plan includes workout recommendations, nutrition targets, wellbeing practices, and a clear Week 1 action plan.

### User Story
**As a** new yHealth user who completed onboarding,
**I want to** receive a personalized health plan that feels custom-built for me,
**So that** I know exactly what to do starting tomorrow and feel confident yHealth understands my unique situation.

### Flexibility Modes
| Mode | Experience |
|------|------------|
| **Light (Plan Overview)** | High-level summary with Week 1 action items. 2-min review. |
| **Deep (Detailed Plan)** | Full 12-week plan with rationale, milestones, expected outcomes. 10-min review. |

**Delivery:** Both modes get the same underlying plan - only the presentation depth differs.

### Plan Generation Architecture

#### Inputs to Plan Generation (Data Sources)
```
┌─────────────────────────────────────────────────────────┐
│              PLAN GENERATION INPUTS                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  FROM F1.2 (ASSESSMENT):                                │
│  ✓ Primary goal + timeline                              │
│  ✓ Fitness baseline (activity level, experience)        │
│  ✓ Nutrition baseline (meal frequency, restrictions)    │
│  ✓ Wellbeing baseline (mood, stress, sleep quality)     │
│  ✓ Contextual insights (past attempts, challenges)      │
│                                                          │
│  FROM F1.3 (GOAL SETTING):                              │
│  ✓ SMART goals (specific, measurable, time-bound)       │
│  ✓ Milestones (30/60/90-day targets)                    │
│  ✓ Motivation anchors (why this matters)                │
│                                                          │
│  FROM F1.4 (INTEGRATIONS):                              │
│  ✓ Connected wearables (WHOOP, Apple Watch, etc.)       │
│  ✓ Initial data sync (30 days historical if available)  │
│  ✓ Baseline metrics (avg HR, sleep quality, activity)   │
│                                                          │
│  FROM F1.5 (PREFERENCES):                               │
│  ✓ Engagement mode (Light/Deep)                         │
│  ✓ Preferred channels (app, WhatsApp, voice)            │
│  ✓ Notification preferences + quiet hours               │
│  ✓ Coaching style (tone, motivational approach)         │
│                                                          │
└─────────────────────────────────────────────────────────┘
                            ↓
                   ┌────────────────┐
                   │  AI PLAN       │
                   │  GENERATION    │
                   │  ENGINE        │
                   └────────────────┘
                            ↓
                   ┌────────────────┐
                   │ PERSONALIZED   │
                   │ 12-WEEK PLAN   │
                   └────────────────┘
```

#### AI Plan Generation Logic (Pseudo-Code)
```python
def generate_plan(user):
    # Analyze primary goal and timeline
    goal = user.goals.primary
    timeline_weeks = calculate_weeks(goal.start_date, goal.target_date)

    # Determine plan structure based on goal type
    if goal.category == "weight_loss":
        plan = WeightLossPlan(
            target_weight=goal.target_weight,
            weekly_deficit=calculate_safe_deficit(user.tdee, goal.timeline),
            exercise_frequency=recommend_frequency(user.fitness_baseline),
            nutrition_strategy=recommend_nutrition(user.past_attempts, user.preferences)
        )
    elif goal.category == "muscle_gain":
        plan = MuscleGainPlan(
            target_gain=goal.target_gain,
            training_split=recommend_split(user.experience_level),
            calorie_surplus=calculate_surplus(user.tdee, goal.timeline),
            protein_target=calculate_protein(user.weight, goal)
        )
    # ... [similar logic for other goal types]

    # Add cross-pillar support goals
    if user.wellbeing_baseline.sleep_quality < 6:
        plan.add_wellbeing_goal(SleepImprovementGoal())
    if user.wellbeing_baseline.stress_level > 7:
        plan.add_wellbeing_goal(StressManagementGoal())

    # Break into milestones
    plan.milestones = generate_milestones(goal, timeline_weeks)

    # Generate Week 1 action plan (detailed)
    plan.week_1 = generate_week_1_actions(user, plan)

    # Personalize based on preferences
    plan.coaching_style = user.preferences.coaching_style
    plan.engagement_depth = user.preferences.engagement_mode

    return plan
```

### Plan Structure

#### Light Mode Presentation (Plan Overview)
```
Your Personalized Plan is Ready! 🎯

PRIMARY GOAL:
Lose 20 lbs in 4 months (5 lbs/month)

YOUR WEEK 1 FOCUS:
✓ Exercise 3x this week (Monday, Wednesday, Friday)
   Recommended: 30-min walks or light gym sessions
✓ Track meals 6 days (use MyFitnessPal or WhatsApp photo logs)
   Target: 1800 calories/day (your personalized target)
✓ Improve sleep quality: In bed by 10:30 PM every night
   Why: You mentioned low energy - sleep is the foundation

FIRST MILESTONE (30 Days):
- Lose 5 lbs
- Establish 3-day/week exercise habit
- Hit 80% food tracking consistency

[View Full Plan] [Start Week 1] [Adjust Plan]
```

#### Deep Mode Presentation (Detailed 12-Week Plan)
```
Your 12-Week Personalized Plan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRIMARY GOAL:
Lose 20 lbs in 4 months (starting weight: 180 lbs → target: 160 lbs)
Timeline: Dec 2 - Apr 2 (16 weeks)
Pace: 1.25 lbs/week (sustainable, evidence-based)

WHY THIS MATTERS TO YOU:
"I want to feel confident at my wedding in June and have the energy to enjoy it."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 1: FOUNDATION (WEEKS 1-4)
Goal: Lose 5 lbs, establish habits, build consistency

FITNESS PLAN:
- Frequency: 3x/week (Monday, Wednesday, Friday)
- Duration: 30-45 min per session
- Type: Mix of cardio + light strength
  * Monday: 30-min brisk walk (target: 130-140 BPM)
  * Wednesday: Gym session (full-body strength, beginner program)
  * Friday: 30-min walk or light jog (active recovery)
- Why: You're currently at 2 days/week - 3 is the minimum for fat loss + manageable step up

NUTRITION PLAN:
- Calorie Target: 1800 kcal/day (500 kcal deficit from your TDEE of 2300)
- Macro Split: 40% carbs, 30% protein, 30% fat
  * Protein: 135g/day (30% of 1800 = 540 kcal ÷ 4 = 135g)
  * Carbs: 180g/day
  * Fat: 60g/day
- Meal Frequency: 3 meals + 1 snack (your current habit)
- Tracking: 6 days/week (one flexible day for sustainability)
- Why: 500 kcal deficit = 1 lb/week fat loss (safe, sustainable). High protein preserves muscle during weight loss.

WELLBEING PLAN:
- Sleep Target: 7.5 hours/night (up from current 6.5 hrs)
  * Bedtime: 10:30 PM → Wake: 6:00 AM
  * Wind-down routine: 10:00 PM (no screens, read or journal)
- Stress Management: Journal 3x/week (Monday, Wednesday, Friday)
  * Prompt: "What stressed me today? How did I handle it?"
  * Why: You mentioned stress-eating - journaling helps identify triggers
- Hydration: 8 glasses water/day (track in app)

WEEK 1 DETAILED ACTIONS:
Monday, Dec 2:
  - Morning: Weigh yourself (baseline), log in app
  - 9 AM: First coaching check-in (WhatsApp or app)
  - Lunchtime: 30-min walk (log activity)
  - Evening: Track all meals in MyFitnessPal
  - 10 PM: Wind-down routine (journal about today)

Tuesday, Dec 3:
  - Morning: Check-in (mood + energy rating)
  - Meals: Track breakfast, lunch, dinner, snack
  - Evening: Review yesterday's walk (how did you feel?)

Wednesday, Dec 4:
  - Morning: Gym session (full-body strength)
  - Meals: Track all meals
  - Evening: Journal (reflect on workout)

[... continues for full week]

EXPECTED OUTCOMES (PHASE 1):
✓ Weight: 175 lbs (5 lbs lost)
✓ Habit streak: 3-day/week exercise established
✓ Tracking consistency: 80%+ (24/28 days)
✓ Sleep quality: Improved from 5/10 to 6.5/10
✓ Energy: Morning energy increases (tracked via check-ins)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PHASE 2: PROGRESSION (WEEKS 5-8)
Goal: Lose 5 more lbs (10 lbs total), increase intensity

FITNESS PLAN:
- Frequency: 4x/week (add Saturday session)
- Duration: 45-60 min
- Type: Progressive overload strength + HIIT
  * Monday/Thursday: Strength (upper/lower split)
  * Wednesday: 30-min HIIT (intervals)
  * Saturday: 60-min outdoor activity (hiking, cycling, fun!)
- Why: Your body adapts - we increase volume to keep fat loss consistent

NUTRITION PLAN:
- Calorie Target: 1750 kcal/day (small cut to offset metabolic adaptation)
- Macro Split: Same (40/30/30)
- New Focus: Nutrient timing (protein before/after workouts)
- Tracking: 6 days/week (maintain)

WELLBEING PLAN:
- Sleep Target: 7.5-8 hours (maintain + refine wind-down)
- Stress Management: Add 5-min morning meditation (Mondays, Wednesdays, Fridays)
  * Why: You're handling stress better with journaling - meditation adds resilience
- Hydration: 8-10 glasses/day (increase for added activity)

[... continues for Phases 3-4]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[View Week-by-Week Breakdown] [Adjust Plan] [Start Week 1]
```

### Plan Components Breakdown

#### 1. Fitness Plan
- **Exercise Frequency:** Based on user's baseline + goal requirements
- **Exercise Type:** Tailored to goal (strength for muscle gain, cardio+strength for weight loss, endurance for event training)
- **Progressive Overload:** Automatic volume/intensity increases every 4 weeks
- **Rest & Recovery:** Mandatory rest days, especially if WHOOP/Oura data shows low recovery
- **Wearable Integration:** Uses connected devices to set heart rate zones, track strain/recovery

**Example (Weight Loss):**
```
Weeks 1-4: 3x/week, 30-45 min, moderate intensity
Weeks 5-8: 4x/week, 45-60 min, increase HIIT component
Weeks 9-12: 4x/week, 60 min, peak intensity + maintain
```

#### 2. Nutrition Plan
- **Calorie Target:** Calculated from TDEE (Total Daily Energy Expenditure) + goal (deficit/surplus)
- **Macro Split:** Personalized based on goal + dietary preferences
- **Meal Frequency:** Matches user's current habits (don't force 6 meals if they eat 3)
- **Dietary Restrictions:** Respects vegan, keto, allergies, religious restrictions
- **Tracking Flexibility:** 6 days/week tracking (1 "flex" day for mental break)

**TDEE Calculation:**
```
TDEE = BMR × Activity Multiplier
BMR (Basal Metabolic Rate) = Mifflin-St Jeor equation
  Men: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
  Women: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

Activity Multipliers:
- Sedentary (0-1 day/week): 1.2
- Lightly active (1-3 days/week): 1.375
- Moderately active (3-5 days/week): 1.55
- Very active (6-7 days/week): 1.725

Example (User):
- 30-year-old female, 180 lbs (81.6 kg), 5'6" (168 cm), lightly active
- BMR = (10 × 81.6) + (6.25 × 168) - (5 × 30) - 161 = 816 + 1050 - 150 - 161 = 1555
- TDEE = 1555 × 1.375 = 2138 kcal/day
- For weight loss: 2138 - 500 = 1638 kcal/day (round to 1650)
```

#### 3. Wellbeing Plan
- **Sleep Target:** Based on current sleep quality + goal requirements
- **Stress Management:** Journaling, meditation, breathwork (user choice)
- **Mood Tracking:** Daily check-ins to monitor emotional patterns
- **Energy Optimization:** Identify and eliminate energy crashes
- **Habit Formation:** Micro-habits that compound over time

**Example (Supporting Weight Loss):**
```
Sleep: 7.5 hrs/night (improves recovery + reduces cortisol → less stress-eating)
Journaling: 3x/week to identify stress-eating triggers
Morning routine: 5-min meditation for mental clarity
Hydration: 8 glasses/day (often mistaken for hunger)
```

#### 4. Milestones & Check-Ins
```
MILESTONE STRUCTURE (12-Week Plan):

Week 1: Foundation check-in
- Did you complete Week 1 actions?
- How did workouts feel? (too easy, just right, too hard)
- Tracking consistency? (adjust if needed)

Week 4: Phase 1 completion
- Weight check: On track to 5 lbs lost?
- Habit formation: Is 3x/week exercise feeling automatic?
- Plan adjustment: Increase intensity or maintain?

Week 8: Phase 2 completion
- Weight check: 10 lbs lost target hit?
- Energy levels: Improvement from baseline?
- Sleep quality: 7+/10 achieved?

Week 12: Phase 3 completion (Final Milestone)
- Weight check: 15 lbs lost (75% of goal)
- Habit sustainability: Can you maintain this pace?
- Plan next phase: Continue to 20 lbs or shift to maintenance?

Week 16: GOAL COMPLETION
- Weight check: 20 lbs lost (goal achieved!)
- Celebration: Acknowledge success, reflect on journey
- Transition: Switch to maintenance plan or set new goal
```

### Plan Generation Timing & Performance

**Generation Speed:**
- **Target:** <30 seconds from "Generate Plan" to "Plan Ready"
- **Breakdown:**
  - Data aggregation: 5 seconds (pull all user data)
  - AI inference: 15 seconds (GPT-4 plan generation)
  - Plan formatting: 5 seconds (structure into UI-ready format)
  - Database save: 5 seconds

**Progress Indicator:**
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

### Plan Editability & Adjustments

**User Can Adjust:**
```
Plan Adjustment Options:

TIMELINE:
Current: 4 months (16 weeks)
[Faster: 3 months] [Slower: 6 months]

EXERCISE FREQUENCY:
Current: 3x/week (Phase 1)
[Increase to 4x] [Decrease to 2x (not recommended)]

NUTRITION STRATEGY:
Current: Calorie tracking (1800 kcal/day)
[Switch to portion control] [Try intermittent fasting] [Keto approach]

WELLBEING FOCUS:
Current: Sleep + Journaling
[Add meditation] [Prioritize stress reduction] [Focus on energy]

[Save Adjustments] [Regenerate Plan]
```

**AI Response to Adjustments:**
```
AI: "You want to increase to 4x/week workouts in Phase 1. That's ambitious!
     Here's the trade-off:

     Pros: Faster results, builds habit strength
     Cons: Higher injury risk, more recovery needed, might be unsustainable

     My recommendation: Stick with 3x/week for Phase 1 (4 weeks), then bump to 4x
     in Phase 2 when your body adapts. Sound good?"

[Stick with 3x] [Override to 4x Anyway]
```

### Plan Delivery & Welcome Experience

**Onboarding Completion Screen:**
```
🎉 Onboarding Complete!

You've set up your account, connected your devices, and we've built
your personalized plan. Here's what happens next:

TOMORROW MORNING (7:00 AM):
You'll get your first check-in. Just rate your mood + energy (takes 30 sec).

THIS WEEK:
Follow your Week 1 action plan. We'll guide you daily via [WhatsApp/App/Voice].

FIRST COACHING CALL:
Scheduled for [Day/Time based on preferences]. We'll review how Week 1 went.

Ready to start?

[View Full Plan] [Start Tomorrow] [Schedule Coaching Call]
```

**First Day Experience (Day 1 Post-Onboarding):**
```
7:00 AM - First Check-In (WhatsApp or App):
"Good morning! 👋 Ready to start Week 1?
 Quick check: How are you feeling today?
 😴 Tired  😐 OK  😊 Energized

 [React with emoji]"

User reacts: 😊

"Awesome! High energy is perfect for your first workout today.
 Here's your Day 1 plan:

 ✓ 30-min walk at lunch (log it after!)
 ✓ Track all meals in MyFitnessPal
 ✓ Bedtime goal: 10:30 PM

 I'll check in tonight to see how it went. You've got this! 💪"
```

### Success Metrics
- **Plan Generation Speed:** <30 seconds (95% of cases)
- **Plan Acceptance Rate:** 90%+ users proceed with generated plan (low rejection)
- **Week 1 Completion:** 80%+ users complete Week 1 action plan
- **Plan Relevance Score:** 4.8/5 rating ("This plan feels custom-built for me")
- **Adjustment Rate:** 20-30% users adjust plan (healthy sign of engagement, not dissatisfaction)
- **Milestone Achievement:** 70%+ users hit first 30-day milestone

### Acceptance Criteria
- [ ] Plan generates in <30 seconds using all onboarding data (F1.2-F1.5)
- [ ] Light mode shows Week 1 action plan + first milestone clearly
- [ ] Deep mode includes full 12-week breakdown with rationale for each recommendation
- [ ] Fitness plan tailored to user's goal, baseline activity, and wearable data
- [ ] Nutrition plan calculates TDEE accurately and sets safe deficit/surplus
- [ ] Wellbeing plan addresses user's sleep, stress, and energy baseline
- [ ] Milestones clearly defined at 30/60/90/final-day markers
- [ ] User can adjust plan parameters (timeline, frequency, strategy)
- [ ] AI validates adjustments and explains trade-offs before applying
- [ ] Plan respects user preferences (coaching style, engagement depth, channels)
- [ ] Plan saved to database and accessible anytime from app
- [ ] Plan review screen includes [Start Week 1], [Adjust Plan], [View Full Plan] actions

### Error Handling
| Scenario | Detection | Recovery | User Message |
|----------|-----------|----------|--------------|
| **Insufficient data for plan** | Missing critical inputs (e.g., no goal set) | Block generation, prompt missing data | "We need your primary goal to create a plan. Let's set that now." |
| **AI generation timeout** | >30 sec with no response | Retry with simplified prompt | "Plan generation taking longer than usual. Retrying with faster logic..." |
| **Unsafe plan generated** | Validation check flags (e.g., <1200 kcal target) | Override with safe defaults, notify user | "Our AI suggested 1100 kcal/day, but that's too low. We adjusted to 1300 kcal for safety." |
| **Conflicting goals** | User has competing goals (gain muscle + lose weight fast) | Force prioritization during goal setting (F1.3) | [Should not reach this point - handled in F1.3] |
| **No wearable data** | User connected device but no historical data | Generate plan with assumptions, update as data flows | "No wearable data yet. We'll refine your plan as data syncs over the next few days." |
| **Plan save fails** | Database write error | Retry save, cache locally | "Plan saved locally. We'll sync to cloud when connection is restored." |

### Dependencies
- **AI Plan Generation Engine:** GPT-4 or Claude (synthesizes all onboarding data into coherent plan)
- **TDEE Calculator:** Mifflin-St Jeor formula for calorie targets
- **Macro Calculator:** Goal-specific macro split logic
- **Milestone Generator:** Timeline-based milestone breakdown
- **Database:** Plan schema with versioning (track plan edits over time)
- **Epic Dependencies:**
  - F1.2 (Assessment data)
  - F1.3 (SMART goals)
  - F1.4 (Wearable data for baseline metrics)
  - F1.5 (Preferences for plan personalization)

### MVP Status
[X] MVP Core

---

## EPIC-LEVEL SUCCESS METRICS

### Onboarding Funnel (E2E Metrics)
```
ONBOARDING FUNNEL:

100% - Account Created (F1.1)
  ↓ 95% retention
 95% - Assessment Started (F1.2)
  ↓ 90% completion
 86% - Goals Set (F1.3)
  ↓ 95% continue
 82% - Integration Connected (F1.4)
  ↓ 90% continue
 74% - Preferences Set (F1.5)
  ↓ 98% complete
 72% - Plan Generated (F1.6)
  ↓ 80% start Week 1
 58% - Week 1 Completed

TARGET: 60%+ complete onboarding → Week 1 completion
```

### Time to Value (TTV)
- **Median Onboarding Time:** 15 minutes (account → plan ready)
- **Quick Path (Light):** 8-10 minutes
- **Deep Path (Deep):** 18-25 minutes
- **First Insight Delivered:** Within 24 hours of onboarding
- **First "Aha Moment":** Within 7 days (cross-domain insight)

### User Satisfaction (Post-Onboarding Survey)
```
How would you rate your onboarding experience?

★★★★★ 4.7/5 average

What did we do well?
- "Felt personalized, not generic" (78%)
- "Quick and easy, not overwhelming" (82%)
- "Plan actually makes sense for my life" (85%)
- "AI conversation was natural" (73%)

What could improve?
- "Wanted more exercise variety in plan" (22%)
- "Too many notifications initially" (15%)
- "Confused about which integration to choose" (12%)
```

---

## EPIC DEPENDENCIES

### Upstream Dependencies (Blockers)
- **Authentication System:** Account creation requires secure auth (OAuth, email verification)
- **AI Infrastructure:** Assessment (F1.2) and Plan Generation (F1.6) require GPT-4/Claude access
- **Integration APIs:** F1.4 requires OAuth clients for 10+ third-party services
- **Database Schema:** All features require user profile, assessment, goals, preferences tables

### Downstream Dependencies (What Depends on This Epic)
- **E2 (Voice Coaching):** Requires onboarding preferences (coaching style, call scheduling)
- **E3 (WhatsApp):** Requires WhatsApp enrollment from F1.1 or F1.5
- **E4 (Mobile App):** Dashboard displays plan from F1.6
- **E5-E7 (Pillars):** Goal tracking requires goals from F1.3
- **E8 (Cross-Domain Intelligence):** Insights require baseline data from F1.4 integrations
- **E9 (Data Integrations):** OAuth flows established in F1.4
- **E10 (Analytics Dashboard):** Plan visualization requires F1.6 plan data

---

## TECHNICAL ARCHITECTURE NOTES

### Database Schema (Simplified)
```sql
-- Users table (F1.1)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR,
  date_of_birth DATE,
  gender VARCHAR,
  created_at TIMESTAMP
);

-- Assessments table (F1.2)
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  assessment_type VARCHAR, -- 'quick' or 'deep'
  primary_goal JSONB,
  fitness_baseline JSONB,
  nutrition_baseline JSONB,
  wellbeing_baseline JSONB,
  completed_at TIMESTAMP
);

-- Goals table (F1.3)
CREATE TABLE goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  category VARCHAR, -- 'fitness', 'nutrition', 'wellbeing'
  goal_type VARCHAR, -- 'weight_loss', 'muscle_gain', etc.
  target JSONB, -- {weight: 160, timeline: '2026-04-01'}
  milestones JSONB,
  motivation TEXT,
  created_at TIMESTAMP
);

-- Integrations table (F1.4)
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  integration_name VARCHAR, -- 'whoop', 'apple_health', etc.
  oauth_token VARCHAR ENCRYPTED,
  oauth_refresh_token VARCHAR ENCRYPTED,
  last_sync_at TIMESTAMP,
  status VARCHAR -- 'active', 'expired', 'disconnected'
);

-- Preferences table (F1.5)
CREATE TABLE user_preferences (
  user_id UUID REFERENCES users(id) PRIMARY KEY,
  engagement_mode VARCHAR, -- 'light', 'deep', 'adaptive'
  notification_settings JSONB,
  quiet_hours JSONB,
  coaching_style JSONB,
  channel_preferences JSONB,
  updated_at TIMESTAMP
);

-- Plans table (F1.6)
CREATE TABLE health_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_version INT, -- Allow plan revisions
  fitness_plan JSONB,
  nutrition_plan JSONB,
  wellbeing_plan JSONB,
  milestones JSONB,
  generated_at TIMESTAMP
);
```

### API Endpoints (Onboarding Flow)
```
POST   /api/v1/auth/signup              # F1.1 - Account creation
POST   /api/v1/auth/verify-email        # F1.1 - Email verification
POST   /api/v1/onboarding/assessment    # F1.2 - Save assessment data
POST   /api/v1/onboarding/goals         # F1.3 - Save goals
GET    /api/v1/integrations             # F1.4 - List available integrations
POST   /api/v1/integrations/connect     # F1.4 - Initiate OAuth flow
POST   /api/v1/integrations/callback    # F1.4 - OAuth callback
POST   /api/v1/preferences              # F1.5 - Save preferences
POST   /api/v1/plans/generate           # F1.6 - Generate plan
GET    /api/v1/plans/current            # F1.6 - Retrieve current plan
```

---

## OPEN QUESTIONS & DECISIONS NEEDED

### For Product Team:
1. **Assessment Length:** Is 10-15 min for Deep mode too long? Should we cap at 10 min?
2. **Mandatory Integrations:** Should we require 1 integration OR allow "manual mode" with no wearables?
3. **Plan Editability:** Can users fully customize AI-generated plans or only tweak parameters?
4. **Onboarding Skips:** Can users skip assessment/goals and onboard with minimal data (then complete later)?

### For Engineering Team:
1. **AI Provider:** GPT-4 Turbo or Claude Sonnet for plan generation? (Cost vs. quality trade-off)
2. **OAuth Security:** Use PKCE for mobile OAuth flows? (Best practice but adds complexity)
3. **Real-Time Sync:** WebSockets for live data sync or polling? (WhatsApp + wearables)
4. **Plan Versioning:** Do we keep full history of plan edits or only latest version?

### For Design Team:
1. **Onboarding Length:** Linear flow (6 steps) or hub model (complete in any order)?
2. **Progress Indicators:** Show "Step 3 of 6" or % completion bar?
3. **Mobile-First:** Design for mobile, adapt to web OR separate web onboarding flow?

---

## DOCUMENT GOVERNANCE

**Epic Owner:** Product Team
**Review Schedule:** Weekly during onboarding implementation
**Update Triggers:** User feedback, A/B test results, technical constraints
**Version Control:** All changes require version increment and changelog entry
**Cross-Epic Sync:** Changes to F1.4 (Integrations) must sync with E9 (Data Integrations Epic)

---

**Epic 01: Onboarding & Assessment v1.0**
*Foundation for the yHealth "Second Mind" Experience*
*6 Features | MVP Core | User's First 15 Minutes Define Success*

---

*Document Classification: INTERNAL USE - Feature Specification*
*Created: 2025-12-02 | Status: Design Stage | Next: Engineering Review*
