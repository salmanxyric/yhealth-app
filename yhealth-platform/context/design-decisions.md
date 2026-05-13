# yHealth Platform - Design Decisions

> **Source:** Executive Vision Document v5.0 + PRD v4.1

---

## Core Design Philosophy

### User-Adaptive Flexibility

Every feature supports both Light and Deep engagement modes. No judgment — light mode is a valid long-term choice.

| Engagement Level | Characteristics |
|------------------|-----------------|
| **Light Mode** | Quick check-ins (30 sec), emoji logging, summary insights, brief nudges |
| **Deep Mode** | Detailed journaling (10+ min), rich narratives, granular analytics, extended sessions |

### Flexibility Spectrum by Feature

| Feature Area | Light Mode | Deep Mode |
|-------------|------------|-----------|
| **Onboarding** | 3-5 min questionnaire | 10-15 min AI conversation |
| **Daily Check-ins** | Emoji + energy rating | Full journaling + reflection |
| **Coaching Calls** | 5 min quick check | 20-30 min deep session |
| **Insights** | Key highlights only | Detailed correlation analysis |
| **Goal Tracking** | Simple progress bar | Comprehensive metrics dashboard |
| **Meal Logging** | Photo + AI estimate | Full macro/calorie breakdown |
| **Financial Tracking** | Quick spend entry | CSV import + stress analysis |

---

## Interaction Design Decisions

### Multi-Channel Strategy

Three interaction channels built into the platform:

| Channel | Primary Use Cases | Unique Value |
|---------|-------------------|--------------|
| **Voice Coaching** | Scheduled check-ins, deep sessions, emotional support | Emotional intelligence via tone analysis, scheduled AI calls |
| **In-App Chat** | 1-to-1 coaching, group chats, buddy messaging, quick logs | Real-time Socket.IO, reactions, media, voice/video calls |
| **Mobile App** | Dashboard, visualization, journaling, goal management | Rich data display, offline support, full feature access |

### Channel Design Principles

1. **Context preservation** — Conversations continue across channels; AI memory persists
2. **Channel-appropriate interaction** — Each channel optimized for its strengths
3. **No channel is secondary** — Equal feature depth across all three
4. **User choice** — Users select preferred channel without penalty

---

## AI Coaching Design Decisions

### Coaching Personality

| Attribute | Decision | Rationale |
|-----------|----------|-----------|
| **Tone** | Supportive, non-judgmental | Encourages engagement without pressure |
| **Voice** | Warm, friendly, professional | Builds trust and comfort |
| **Boundaries** | Clear wellness (not medical) scope | Safety and liability |
| **Adaptation** | Personality mode adapts to user tier, recovery, engagement, mood, context | Deep personalization |
| **Memory** | Persistent memory with evidence-based creation, decay, and reinforcement | Grows smarter over time |

### AI Response Characteristics

- **Response time:** <2 seconds in voice coaching
- **Context memory:** Persistent across sessions via memory engine, wiki, and knowledge graph
- **Emotional awareness:** Adapts based on detected mood/tone (Gemini + TensorFlow.js)
- **Proactive:** Initiates relevant nudges based on patterns, schedule, and 14 intervention decision trees
- **Crisis detection:** Automatic escalation for self-harm, suicidal ideation, severe depression

### AI Intelligence Stack

| System | Purpose |
|--------|---------|
| **Memory Engine** | Evidence-based persistent memories with decay/reinforcement |
| **Personal Wiki** | Per-user knowledge base with auto-synthesis from daily signals |
| **Knowledge Graph** | Read-only aggregator of all user data into navigable structure |
| **Correlation Engine** | Unified state from 17 context blocks |
| **Intervention Engine** | 14 decision trees for auto-adjusting plans |
| **Motivation Tier** | 14-day rolling engagement scoring |
| **Personality Mode** | Dynamic coaching style per user |

---

## Data Integration Decisions

### Golden Source Priority

When multiple sources report same metric:

| Metric Type | Priority Order |
|-------------|----------------|
| **Heart Rate** | WHOOP > Apple Watch > Fitbit > Manual |
| **Sleep** | WHOOP > Oura > Apple Watch > Manual |
| **Activity** | Apple Health (aggregated) > Wearable > Strava > Manual |
| **Nutrition** | Manual > Nutritionix scan > AI photo estimate |
| **Mood** | Manual > Voice analysis > Camera emotion > Text sentiment |

### Conflict Resolution Rules

1. Same timestamp: Higher priority source wins
2. Overlapping periods: Use more granular data source
3. Contradictory data: Flag for user if variance >20%
4. Manual override: User can always designate preferred source

---

## Privacy & Security Decisions

### Privacy-First Approach

| Decision | Implementation |
|----------|----------------|
| **User control** | Users own their data, full export available |
| **Transparency** | Clear explanation of data usage; AI decision auditability |
| **Minimal collection** | Only collect what's needed for features |
| **Secure storage** | Encryption at rest and in transit |
| **Health profile access** | Visibility and access control for health data |

### GDPR Compliance

- 14-day cooling-off for deletion requests
- Data export within 48 hours
- Machine-readable format (JSON/CSV)
- 30-day deletion completion

---

## Accessibility Decisions

### Compliance Target

WCAG 2.1 Level AA for all user-facing features.

### Key Accommodations

| User Need | Accommodation |
|-----------|---------------|
| Deaf/Hard-of-hearing | Real-time transcription in voice calls |
| Speech impairment | Text input alternative during calls |
| Cognitive load | Adjustable pace "Take your time" mode |
| Motor accessibility | 44x44pt minimum touch targets |
| Screen readers | Full ARIA implementation |

---

## Current Platform State

### Built and Live

| Category | What's Built |
|----------|-------------|
| Users | Single-user accounts with full onboarding |
| Channels | Voice coaching + In-app chat (with voice/video calls) + Mobile web app |
| AI | Full emotional intelligence, persistent memory, knowledge graph, 14 intervention trees |
| Life Domains | Health, fitness, nutrition, emotional wellbeing, finances, personal growth, social |
| Integrations | WHOOP, Spotify, Google Calendar (others planned) |
| Social | Buddy matching, follow system, accountability contracts, competitions, team challenges |
| Gamification | XP, levels, streaks, 25 achievements, leaderboards, micro-wins |
| Content | Blog, help articles, newsletters, webinars, motivational videos |

### Planned / Remaining

| Category | What's Next |
|----------|-------------|
| Family | Family plans, shared dashboards |
| Enterprise | B2B, enterprise plans |
| Native Apps | iOS/Android native (PWA first) |
| Integrations | Apple Health, Google Fit, Fitbit, Garmin, Oura, Strava, Nutritionix |

---

## First 7 Days Design

### Critical Path Focus

Day-by-day journey designed to achieve "aha moment" within first week:

| Day | Primary Goal |
|-----|--------------|
| 0 | Complete onboarding, connect first integration |
| 1 | First data sync, first insight, try voice call |
| 2-3 | Build routine, multi-domain logging |
| 4-5 | Pattern preview, personalized nudges, buddy suggestion |
| 6-7 | First real cross-domain insight (aha moment) |

### Aha Moment Definition

User qualifies for "aha moment" when they:
1. Discover a cross-domain connection they didn't know existed
2. Receive actionable advice that proves accurate
3. See a prediction that comes true
4. Achieve a goal with AI coach support
5. Get a proactive intervention that prevents a bad day

---

*Updated for Executive Vision Document v5.0 — reflecting whole-life coaching, in-app chat, and current platform state*
