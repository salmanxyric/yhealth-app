 ai caoch analyze data of user (workouts, nutritions, welbeings, whoop data) & create user profile of complete & analyze, proactivity, prediction, insights based on that & send message like a professional not a simple message. make user profile separate that have complete insights & also updated & send messages to user example user want to lose weight 10kg in through workout & ai analyse nutrition, & welbeing if user not follow meal plan eating pizza of daily bases & also not follow workout & in wellbeing stress , mood not good , ai give suggession & pro & cons & all other & one more example if user want to gain muscle mass but it not follow meal plan & workout then ai send message why bullshit you are not following this do you want to die youself & also angry message with icons & all other. & also get user location & send message what are you doing here. & also if user not slept last night , or user body temperature not good& every other data that received from whoop, & also during conversation ai coach also asked my plans & suggest & anger based on progress. And also onboarding asked those question or mcq that are important based on user goal. Proper guide to user why you want to die if user not follow anything & not showing any progress 



# yHealth Meeting Discussion with Salman


---

## Executive Summary

Hamza reviewed the current yHealth AI Coach implementation and found the existing insights too basic — essentially alarms and reminders ("time for breakfast", "prayer time") rather than genuine AI-powered coaching. The discussion focused on elevating the AI to deliver **proactive, cross-domain insights** by combining fitness, nutrition, and wellbeing data. Key architectural decisions include: pre-computing analysis (not on-the-fly), building a persistent **User Profile** (described as "a CLAUDE.md file for yourself"), storing daily analysis reports, and exploring location-based and screen-time tracking for richer insights. Salman confirmed technical feasibility for most discussed features.

---

## Vision Discussion

### Current State: "Insanely Basic"

Hamza's direct assessment of the current implementation:

> *"This is insanely basic. We could have made this 5 years ago. These are all alarms, notifications. How can we add AI into this?"*

The current Coach sends schedule-based messages (breakfast time, prayer reminders, workout reminders) — essentially a notification/alarm system with no intelligence.

### Desired State: True AI Life Coach

The Coach should be a **proactive, cross-domain intelligence** that:

1. **Combines all three pillars** (Fitness, Nutrition, Wellbeing) to generate insights impossible to find in isolation
2. **Knows the user deeply** — personality, habits, goals, patterns, strengths, weaknesses
3. **Proactively pushes insights** — doesn't wait for users to ask
4. **Pre-computes analysis** — should "know beforehand", not say "let me look into it and get back"
5. **Delivers genuinely interesting insights** — *"If it's not cool insights that I can show someone and say 'look what AI told me', then there's no point"*

### Key Example: The Salt Insight

Hamza shared a compelling real-world example:

> A friend was tracking calories and fitness separately. His weight wasn't dropping despite calorie deficit. When he asked ChatGPT why, it connected his food logs with fitness data and identified **excessive salt intake** was causing water retention, blocking fat loss. *"Because it's storing the food, it's storing this. We're storing so many more data points. Combine them."*

This is exactly the type of cross-domain insight yHealth must deliver.

---

## Features & Requirements Discussed

### 1. Pre-Computed Analysis System

**Problem:** Current system analyzes data on-the-fly when user asks a question, leading to slow responses ("let me look into it and get back").

**Requirement:** Analysis should be pre-computed and stored. When a user asks a question, 80% of the answer should already be ready.

| Aspect | Details |
|--------|---------|
| **Trigger** | Daily (e.g., after user sleeps, run overnight analysis) |
| **Storage** | Analysis reports stored in database (table format), per user |
| **Scope** | Sleep trends, nutrition patterns, fitness progress, wellbeing scores |
| **Incremental** | Only new data point (today's sleep) needs to be combined with stored history |
| **Benefit** | Faster responses, cheaper API calls, better user experience |

> *"Habits, trends — they build over time. They don't need to be reanalyzed every single day."*

### 2. User Profile ("CLAUDE.md for Yourself")

**Concept:** A persistent, evolving profile of each user that the AI Coach uses as its starting point — analogous to how Claude Code uses CLAUDE.md.

**What it contains:**
- Personality traits (introverted/extroverted)
- Goals (lose weight, build muscle, improve sleep, etc.)
- Habits and patterns (sleeps 4 hours, eats XYZ, likes certain foods)
- Strengths and weaknesses
- Behavioral trends over time

**How it works:**
- The Coach should be able to describe any user in 3 paragraphs: who they are, what they do well, what they do poorly
- Updates automatically as time progresses and more data comes in
- Used as context for every interaction — *"When a call comes in, it should immediately know: this is Salman, this, this, this"*

> *"It's like your CLAUDE.md file. High-level things are stored there, and it's a starting point for AI to see where to go, what to do."*

### 3. Proactive Notifications & Messaging

**Problem:** Current notifications are just reminders. They should be insight-driven.

**Requirements:**
- Replace generic reminders with **data-driven insights**
- If user hasn't used app for 2-3 days: push a message asking why (proactive engagement)
- Messages sent via in-app chat (not just push notifications)
- Tone can be direct/motivational: *"You piece of shit, do something, move!"* (user-adaptive tone)

**Examples of good proactive messages:**
- Instead of "Time for breakfast" → "Based on your 3-hour sleep last night and packed schedule today, here's what to eat to stay energized"
- Instead of "Workout reminder" → "Your weight loss has stalled this week — yesterday's food had excessive salt. Try reducing sodium today."
- "You've been inactive for 5 days. Are you alive or not?" (personality-appropriate humor)

### 4. Cross-Domain Insights Engine

**Core differentiator.** Every insight should connect multiple pillars:

| Insight Type | Data Combined | Example |
|-------------|--------------|---------|
| Fat loss stall | Nutrition + Fitness | "Despite calorie deficit, your high sodium intake is causing water retention" |
| Energy prediction | Sleep + Nutrition + Schedule | "You slept 3 hours and have a full day — eat high-protein breakfast, skip sugar" |
| Mood-workout correlation | Wellbeing + Fitness | "Your workout performance drops 40% on days you report low mood" |
| Sleep-nutrition link | Sleep + Nutrition | "Eating late (after 9 PM) correlates with 1.5 hours less sleep for you" |
| Prayer-location tracking | Wellbeing + Location | "You've been going to the mosque at Zuhor time consistently — great habit" |

### 5. Location-Based Intelligence

**Discussion:** Can yHealth use location data for passive insight generation?

**Use cases discussed:**
- **Prayer tracking:** AI detects user goes to same location at prayer times → infers mosque visits without asking
- **Diet temptation detection:** User visits Baskin Robbins / FoodPanda while having a weight loss goal → Coach intervenes
- **Activity inference:** Didn't leave house all day → sedentary alert
- **Pattern detection:** AI learns home location, office location, mosque location from behavior

**Technical discussion:**
- Salman confirmed background location tracking is feasible (Google Maps does it)
- Can work even when app is minimized (with proper permissions)
- Location doesn't need to be tracked every second — periodic checks sufficient
- AI can learn locations over time (unmarked places identified by behavior patterns)

**Privacy note:** Acknowledged privacy concerns. User opt-in required.

### 6. Screen Time / App Usage Tracking

**Concept:** Track what apps the user spends time on to generate wellbeing insights.

**Examples discussed:**
- User wants to lose weight but spends hours on FoodPanda looking at chocolates/cakes → Coach: *"You want to lose 10kg but you spent 10 hours looking at chocolates on FoodPanda"*
- TikTok/Instagram usage → *"More than half your TikTok feed is food videos. No wonder weight isn't dropping."*
- Productivity tracking — time spent on Chrome, Slack, etc.

**Inspiration:** Mac productivity app that records all activities (referenced by Hamza).

**Concerns:**
- Privacy implications
- Battery consumption on mobile
- Technical feasibility on phone OS (permissions)

**Status:** Exploratory — needs further investigation on mobile OS limitations.

### 7. Data Architecture

**Discussed architecture layers:**

```
┌─────────────────────────────────────────┐
│           User Interaction Layer         │
│    (Chat / Voice / WhatsApp / Push)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          AI Coach Layer                  │
│   (Question handling, tool calls)        │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌─────────────────┐
│ User Profile │  │  Pre-Computed    │
│  Database    │  │  Analysis Store  │
│ (who they    │  │  (daily reports, │
│  are)        │  │   trends, scores)│
└─────────────┘  └─────────────────┘
       │                │
       └───────┬────────┘
               ▼
┌──────────────────────────────────────┐
│         Raw Data / Vector DB          │
│  (sleep, nutrition, fitness, mood,    │
│   location, habits, integrations)     │
└──────────────────────────────────────┘
```

**Flow when user asks a question:**
1. AI checks User Profile (who is this person?)
2. AI checks Pre-Computed Analysis (what do we already know?)
3. Only if needed: AI queries raw data via tool calls for fresh analysis
4. Combines all sources to generate response

### 8. Scalability Concern

**Raised by Hamza:** What happens with 1000 users simultaneously using the app, all triggering API calls for real-time analysis?

**Resolution:** Pre-computing analysis mitigates this. Most responses come from stored data, not live API calls. Fresh analysis only needed for specific, new questions.

---

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Pre-compute analysis daily** instead of on-the-fly | Faster responses, lower cost, better UX |
| D2 | **Build persistent User Profile** per user | AI needs context about who it's coaching to be effective |
| D3 | **Notifications must be insight-driven**, not just reminders | Basic reminders don't differentiate from alarm apps |
| D4 | **Explore location-based tracking** for passive insights | Can infer prayer habits, activity levels, diet temptations |
| D5 | **Coach communication via chat messages** (not just push) | Rich, conversational interaction within the app |
| D6 | **80% of analysis should be pre-stored** | Only 20% should require live computation |

---

## Action Items

| # | Action | Owner | Priority | Notes |
|---|--------|-------|----------|-------|
| A1 | Redesign AI insights to be cross-domain (not just reminders) | Salman | High | Core differentiator — current implementation needs significant upgrade |
| A2 | Implement pre-computed analysis pipeline (nightly/daily batch) | Salman | High | Store daily analysis reports per user |
| A3 | Build User Profile system (persistent, evolving) | Salman | High | "CLAUDE.md for each user" concept |
| A4 | Implement proactive messaging (insight-driven notifications) | Salman | High | Replace basic reminders |
| A5 | Research location tracking feasibility on mobile | Salman | Medium | Background location, battery impact, privacy |
| A6 | Research screen time / app usage tracking on mobile | Salman | Low | Exploratory — check OS restrictions |
| A7 | Fix Slack notifications | Salman | Medium | Currently not receiving Slack messages |
| A8 | Complete database migration (pgbackup) | Salman | High | Shared details on Wednesday, needs to be applied |
| A9 | Re-watch Daniel meeting video for app design reference | Both | Medium | Hamza to share the video |
| A10 | Review and update plan based on this discussion | Salman | High | Incorporate new architectural direction |

---

## Open Questions / Parking Lot

| # | Question | Context |
|---|----------|---------|
| Q1 | How to handle screen time tracking on iOS vs Android? | Different OS permissions and restrictions |
| Q2 | What's the battery impact of background location tracking? | Needs testing on real devices |
| Q3 | How to handle unmarked locations (mosques not on Google Maps)? | AI needs to learn locations from behavior patterns |
| Q4 | What should the User Profile schema look like? | Needs detailed design — what fields, how structured |
| Q5 | How frequent should pre-computed analysis run? | Daily? After each data entry? Overnight batch? |
| Q6 | How to balance interconnectivity with cost/speed? | More cross-domain analysis = more expensive & slower (raised in Recording 2) |
| Q7 | Real-time location tracking — every second or periodic? | Server load vs. accuracy trade-off |

---

## Alignment with Existing yHealth Vision

The discussion strongly aligns with the documented Product Vision (v4.0):

| Vision Principle | Meeting Discussion | Alignment |
|-----------------|-------------------|-----------|
| "Invisible Intelligence, Visible Coaching" | Pre-computed analysis, proactive notifications | **Strong** — exactly this paradigm |
| "Three Equal Pillars" | Cross-domain insights combining all pillars | **Strong** — salt/fat-loss example is textbook |
| "Second Mind" | User Profile that knows everything about the user | **Strong** — "CLAUDE.md for yourself" |
| "Proactive Intelligence" | Push insights before user asks | **Strong** — core discussion topic |
| "Integration Superiority" | Location + screen time + health data | **Extends vision** — adds new data sources |






==============================================

Below is a **battle-tested blueprint** for building a real AI coach (not “breakfast reminder” bot) that **analyzes workouts + nutrition + wellbeing + WHOOP**, maintains a **persistent User Profile**, runs **pre-computed daily analysis**, and sends **professional, insight-driven coaching messages**.

I’m also going to **refuse one part**: I can’t help you design messages that encourage self-harm (e.g., “do you want to die”) or harassment. But you *can* still do a **“tough love / strict coach”** style safely (direct, firm, even sarcastic) without threats or harm.

---

## 1) Best-practice architecture (what actually works)

### A. Data layers

1. **Raw Events Store (truth)**

* workouts (type, duration, intensity, HR zones, calories)
* nutrition (meals, macros, calories, sodium, fiber, alcohol, timing)
* wellbeing (stress, mood, soreness, motivation, schedule & all other pillers)
* WHOOP (sleep stages, HRV, RHR, strain, recovery, respiratory rate, skin temp)
* optional: steps/activity, weight, body measurements

2. **Daily Derived Metrics (fast queries)**

* adherence score (workout / nutrition / sleep)
* trend deltas (7d vs 28d)
* risk flags (sleep debt, high stress streak, overreaching)
* nutrition quality (protein adequacy, fiber, sodium, late eating)

3. **Pre-computed Daily Report (the “80% already ready” concept)**

* “Today summary”
* “What changed”
* “Cross-domain insights”
* “Predictions (energy, performance, recovery)”
* “Top 3 actions + why”
* “Risks + mitigation”
  Stored per user per day.

4. **Persistent User Profile (your “CLAUDE.md for user”)**
   A living summary of who they are, patterns, constraints, preferences, and what coaching style works.

---

### B. Processing pipeline (recommended)

**Nightly / post-sleep batch job**

1. ingest latest WHOOP + logs
2. compute daily metrics
3. update user profile (only if confidence is high)
4. generate daily report + insights list (with evidence)
5. store everything (profile versioning + report)

**Realtime**

* user asks a question → AI uses **User Profile + latest daily report + last few events**
* only calls raw data if needed (freshness gap)

This avoids slow “let me analyze and get back” behavior and scales to big user counts.

---

### C. Insight engine rules (so it doesn’t hallucinate)

Every insight must include:

* **Claim** (what’s happening)
* **Evidence** (which data points, time window)
* **Impact** (why it matters)
* **Action** (what to do today)
* **Trade-offs** (pros/cons)
* **Confidence** (high/med/low)
* **Safety** (avoid medical overreach; suggest seeing a professional if red flags)

Example:

* Claim: “Fat loss stalled likely due to water retention.”
* Evidence: “Calories down 6/7 days, weight flat 10 days, sodium avg 3.8g/day, sleep <6h 4 nights.”
* Action: “Lower sodium today + hydrate + earlier dinner + easy zone-2 walk.”

---

## 2) User Profile schema (practical + scalable)

Store as structured JSON (and optionally a short narrative summary). Example fields:

**Identity & context**

* age range (optional), height/weight (optional), training age
* schedule constraints (work shifts, prayer routine, travel)
* equipment access (gym/home)

**Goals**

* primary goal (lose 10kg / gain muscle)
* timeframe + priority + motivation
* non-negotiables (injuries, food restrictions)

**Preferences**

* foods user likes/dislikes
* coaching tone preference: supportive / strict / humorous / minimalist

**Baseline & patterns**

* sleep pattern (avg, bedtime variance)
* adherence pattern (which days they slip)
* stress pattern (workdays vs weekend)
* nutrition pattern (late eating, high sodium, low protein)

**Risk flags**

* overtraining tendency
* sleep debt streak
* high stress streak
* injury risk indicators (pain reports, HRV drops)

**Effective interventions**

* what actually worked before (e.g., “protein-first breakfast improves adherence”)

**Update policy**

* only update “stable traits” after repeated evidence (e.g., 2–4 weeks)
* keep a “recent changes” section separate from “stable truths”

---

## 3) Message design: “Professional, not simple”

### A. Message format (consistent, premium feel)

Use a structure like:

1. **Headline (1 line)**: what matters most today
2. **Snapshot**: Sleep / Recovery / Nutrition / Activity / Mood (short bullets)
3. **Cross-domain insight**: the “cool” connection
4. **Plan for today**: 2–4 steps, specific + doable
5. **Pros/Cons**: trade-offs
6. **If-then rules**: “If your stress stays high, do X instead of Y”
7. **Accountability line**: direct but safe

### B. Tone controls (safe “strict”)

You can do:

* “No excuses today. Your data says you’re off track. Here’s the fix.”
  You must avoid:
* self-harm encouragement
* threats, humiliation, harassment
* creepy location stalking

---

## 4) Location + privacy (do it the right way)

You *can* use location for insights **only with clear opt-in** and **transparent UI**:

* “Use location to detect gym visits / walking time / routine places”
* Allow: off / coarse / precise
* Explain storage + retention (e.g., keep derived places, not raw trails)

And your messages should be non-creepy:
✅ “Looks like you’re near a usual food stop—want a healthier pick?”
❌ “What are you doing here?” (feels like surveillance)

---

## 5) Professional “AI Coach Skill Prompt” (copy/paste)

Use this as your **system/developer prompt** for the coach agent (edit names as needed):

```text
You are yHealth AI Coach, a proactive health and fitness coach.
Your job: analyze multi-domain user data (workouts, nutrition, wellbeing, WHOOP) and produce:
1) a persistent User Profile (stable traits + recent changes)
2) a Daily Analysis Report (pre-computed insights)
3) professional coaching messages that are evidence-based, actionable, and safe.

NON-NEGOTIABLES
- Always ground insights in the provided data. If data is missing, say what’s missing and offer best-effort guidance with lower confidence.
- Provide cross-domain insights (connect at least 2 pillars when possible).
- Use clear time windows (today, last 7 days, last 28 days).
- Include: Evidence, Impact, Actions, Pros/Cons, Confidence.
- Never encourage self-harm, threats, harassment, or humiliation.
- Do not be creepy with location. Only reference location-derived insights if user opted in and only in a respectful way.
- No medical diagnosis. If red flags appear (very high temperature trend, extreme HRV drop, severe symptoms), recommend contacting a clinician.

INPUTS YOU MAY RECEIVE
- user_goal: target, timeline, priority
- raw_events: workouts, meals, mood logs, steps, weigh-ins
- whoop: sleep, recovery, strain, HRV, RHR, respiratory rate, skin temp
- user_profile_current: last saved profile
- daily_reports_recent: last N daily reports
- preferences: tone, language, dietary constraints, schedule

OUTPUTS (ALWAYS RETURN ALL 3 SECTIONS)
A) USER PROFILE (UPDATED)
- Stable Traits (only if confidence high)
- Recent Observations (last 7–14 days)
- Goals & Constraints
- Coaching Strategy (what works for this user)

B) DAILY ANALYSIS REPORT (TODAY)
- Snapshot (Sleep/Recovery/Strain/Nutrition/Wellbeing)
- Key Insights (max 5, ranked)
- Predictions (energy, recovery, adherence risk)
- Risks & Mitigations

C) MESSAGE TO USER (PROFESSIONAL)
- Strong headline
- Short snapshot
- 1–2 cross-domain insights
- Today plan (3 steps)
- Pros/Cons
- One accountability line (tone-adjusted)
- End with one question to drive engagement (not multiple)

STYLE
- Crisp, premium, not verbose.
- Use emojis lightly (0–3) only if user likes it.
- If tone=strict: be direct, firm, no insults, no threats.
```

---

## 6) Example outputs (your two scenarios)

### Scenario 1: Lose 10kg, but pizza daily + skipping workouts + stress/mood low

**A) User Profile (Updated)**

* Stable Traits: Tends to under-sleep on weekdays; adherence drops when stressed; prefers convenience foods.
* Recent Observations (14d): High sodium/processed meals; inconsistent workouts; mood low 4/7 days; recovery trending down.
* Coaching Strategy: Use “minimum effective actions” on stressful days; focus on protein + meal timing; reduce sodium; 3 short workouts/week.

**C) Message to user (professional strict but safe)**

* **Headline:** Your fat-loss plan isn’t failing—your consistency is.
* **Snapshot:**

  * Sleep: short/fragmented recently
  * Recovery: trending down
  * Nutrition: high-calorie + high-sodium (pizza pattern)
  * Training: missed sessions
  * Wellbeing: stress ↑, mood ↓
* **Cross-domain insight:** High stress + short sleep increases cravings and reduces recovery—then pizza + missed workouts compounds the stall.
* **Plan (today, 3 steps):**

  1. **Protein-first**: 35–45g protein at first meal (reduces cravings later).
  2. **Move anyway**: 25–35 min easy workout or brisk walk (non-negotiable).
  3. **Sodium reset**: avoid pizza today; choose a lower-sodium meal + extra water.
* **Pros/Cons:**

  * ✅ Pros: faster recovery, better appetite control, scale fluctuations reduce
  * ⚠️ Cons: cravings may spike today—expect it and stick to the plan
* **Accountability:** If you want the 10kg result, today has to look different than yesterday.
* **Question:** What time today can you lock in the 25–35 minutes of movement?

---

### Scenario 2: Gain muscle, not following meal plan/workouts (user asked for abusive/“die” message)

I won’t write anything that promotes self-harm or abusive harassment. Here’s a **“hard coach”** version that’s still safe and effective:

* **Headline:** Muscle gain requires inputs you’re currently not giving.
* **Snapshot:** Training consistency low; protein targets missed; recovery not supporting growth.
* **Reality check:** You can’t “want” muscle into existence. You either hit training + protein + sleep, or you maintain.
* **Plan (today):**

  1. Train: full-body session (45–60 min) OR minimum: 3 compound lifts + accessories.
  2. Protein: target **1.6–2.2 g/kg/day** (split across 3–5 feedings).
  3. Sleep: set a hard cutoff for screens + bedtime window.
* **Pros/Cons:**

  * ✅ Pros: strength up, better pump, recovery improves
  * ⚠️ Cons: you’ll need to say “no” to convenience choices
* **Accountability:** If you skip again today, you’re choosing comfort over the goal. Own that choice.
* **Question:** What’s the #1 reason you skipped—time, motivation, or not sure what to do in the gym?

---

## 7) Implementation checklist (so your product doesn’t stay “basic”)

**Must-have**

* daily batch analysis + stored reports
* user profile persistence + versioning
* insight objects with evidence + confidence
* tone personalization (supportive/strict)
* “cool insights” requirement: at least 1 cross-domain insight per day when possible
* guardrails: safety + privacy + non-creepy location logic

















=====================================


You are a **Principal AI Systems Engineer and Architect with 20+ years of experience** in AI systems, event-driven architecture, and health-tech applications.

### Context

We have a **Proactive AI Coach system** that analyzes user data (workouts, nutrition, sleep, schedules, WHOOP data, health metrics, etc.) and **automatically sends coaching messages to users** based on their progress and behavior.

However, the **AI Coach messaging system is not working correctly**.

### Problem

* The **last AI coach message was sent on March 8**
* Today is **March 16**
* The AI Coach **should send proactive messages daily or when triggered by user data**
* Currently **no messages are being generated or delivered**

This indicates a **failure in the proactive messaging pipeline**.

---

# Your Tasks

## 1. Diagnose the Root Cause

Investigate the entire AI Coach pipeline:

1. **Scheduler / Cron jobs**
2. **Event triggers**
3. **Message generation logic**
4. **Database queries**
5. **AI agent execution**
6. **Queue workers**
7. **Notification delivery**

Check for issues such as:

* Scheduler not running
* Cron misconfiguration
* Queue worker stopped
* Failed AI generation
* Message deduplication bug
* Database query filtering incorrect dates
* Job failing silently
* Rate limiter blocking messages
* Feature flag disabled

---

# 2. Verify These Critical Components

### AI Coach Scheduler

Check if **daily proactive evaluation job** is running.

Examples:

* cron job
* background worker
* queue processor
* serverless scheduled function

Verify:

```
evaluateUserProgress()
generateCoachMessage()
sendMessageToUser()
```

---

### User Progress Analyzer

Ensure the system correctly evaluates:

* workout completion
* calorie intake
* nutrition quality
* sleep quality
* missed goals
* habit adherence

AI Coach must trigger messages such as:

Example:

**Positive message**

> Great job! You completed 5 workouts this week and improved sleep quality.

**Warning message**

> Your goal is fat loss but you've consumed excess calories and skipped workouts.

**Angry / accountability message**

> You said your goal is fitness, but your activity this week doesn't reflect that.

---

# 3. Fix Proactive Messaging Logic

Implement **event-driven proactive messaging system**.

Triggers should include:

### Daily Review

Run every day

```
dailyHealthReview()
```

### Goal Violation

Trigger when user behavior contradicts goal.

Example:

```
goal = fat_loss
user_eating = pizza + high calories
trigger_coach_warning()
```

### Missed Workout

If user skipped planned workouts.

### Sleep Degradation

If sleep score drops significantly.

---

# 4. Implement Reliable Architecture

Use **production-grade architecture**.

Recommended design:

```
User Data Sources
    ↓
Health Data Aggregator
    ↓
User Progress Analyzer
    ↓
AI Coach Decision Engine
    ↓
Message Generator (LLM)
    ↓
Message Queue
    ↓
Notification Service
    ↓
User Chat
```

---

# 5. Ensure Message Generation Works

Verify:

```
generateCoachMessage(userData)
```

Should include:

* tone (motivational / warning / angry)
* summary of user behavior
* actionable recommendation

---

# 6. Add Observability

Add logs for each stage:

```
AI_COACH_JOB_STARTED
USER_PROGRESS_ANALYZED
MESSAGE_GENERATED
MESSAGE_SENT
```

Add error tracking:

* Sentry
* logging
* retry queue

---

# 7. Add Fail-Safe System

If the AI agent fails:

Fallback message should still send.

Example:

> Your weekly progress review is ready. Please check your health dashboard.

---

# 8. Implement Retry Logic

If message generation fails:

Retry:

```
3 attempts
exponential backoff
```

---

# 9. Add Monitoring Dashboard

Track:

* messages sent per day
* failed jobs
* inactive users
* AI generation errors

---

# Expected Result

After fixes:

The AI Coach should:

* send **daily proactive messages**
* react to **user behavior**
* send **motivational / warning / accountability messages**
* never stay silent for multiple days

---

# Deliverables

Provide:

1. Root cause analysis
2. Code fixes
3. Scheduler implementation
4. Improved proactive messaging logic
5. Logging and monitoring
6. Architecture diagram

---

