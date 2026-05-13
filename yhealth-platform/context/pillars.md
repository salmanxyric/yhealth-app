# yHealth Platform - Life Domains & Feature Architecture

> **Source:** Executive Vision Document v5.0

---

## Whole-Life Coaching Philosophy

yHealth is an AI Life Coach for the user's **entire life** — not limited to health, fitness, or nutrition. The platform connects every dimension of a person's life to reveal cross-domain insights impossible for specialist apps. Health signals (fitness, nutrition, sleep, recovery) serve as **foundational inputs** that ground coaching across all life domains — but they are not the boundary of what yHealth coaches on.

---

## Life Domains

yHealth organizes the user's life into interconnected domains. The platform's intelligence comes from connecting these domains — showing how changes in one area ripple across all others.

| Domain | What It Covers | Key Features |
|--------|---------------|--------------|
| **Health & Fitness** | Exercise, sleep, recovery, activity, wearable data | Workout plans, exercise library, WHOOP integration, daily scoring, vision coaching |
| **Nutrition** | Meals, hydration, diet plans, macros, adaptive calories | Meal logging, photo recognition, water tracking, shopping lists, nutrition analysis |
| **Emotional Wellbeing** | Mood, stress, journaling, emotional check-ins, crisis support | Emotional check-ins, TensorFlow emotion detection, crisis detection, daily pledges, commitment tracking |
| **Financial Wellness** | Spending, stress-spending correlation, financial habits | Transaction tracking, CSV import, spending stress analysis, financial reports |
| **Personal Growth** | Goals, habits, life areas, streaks, achievements | Goal decomposition, life area management, habit formation, achievement trees, micro-wins |
| **Social & Relationships** | Accountability, buddies, community, competitions | Buddy matching, accountability contracts, team competitions, shared challenges, community |
| **Productivity & Schedule** | Calendar, timing, routines, activity status | Google Calendar sync, timing profile, schedule management, workout alarms, status-aware planning |
| **Cultural & Spiritual** | Prayer times, holidays, cultural context | Prayer times service, holiday calendar, special days injection for culturally-aware coaching |

---

## Cross-Domain Intelligence

The core value of yHealth is in **connecting** these domains. The platform has 17 context blocks, a correlation engine, 14 intervention decision trees, and a cross-pillar intelligence system that detects contradictions across ALL data sources.

### Example Cross-Domain Insights

| Connection | Insight | Why It's Impossible Elsewhere |
|-----------|---------|-------------------------------|
| Sleep → Productivity | "Your best work days follow 7.5+ hours of sleep" | No app connects sleep data to calendar productivity |
| Nutrition → Mood | "High-sugar meals correlate with afternoon mood dips" | Nutrition apps don't track mood |
| Exercise → Creativity | "You generate more ideas after morning runs" | Fitness apps don't track creative output |
| Spending → Stress | "Weekend splurges spike when work stress rises midweek" | Finance apps don't track emotional state |
| Social → Recovery | "You recover faster after days with social connection" | Fitness trackers ignore social data |
| Habits → All Domains | "Morning journaling improves workout performance by 20%" | No journaling app connects to fitness |

### Intelligence Systems

| System | Purpose |
|--------|---------|
| **Correlation Engine** | Produces unified UserContextState from 17 context blocks |
| **Cross-Pillar Intelligence** | Detects contradictions across ALL data sources |
| **Intervention Engine** | 14 decision trees that auto-adjust plans based on signals |
| **Memory Engine** | Evidence-based creation, decay, reinforcement, semantic retrieval |
| **Wiki System** | Per-user persistent knowledge base with auto-synthesis |
| **Knowledge Graph** | Aggregates all user data into navigable knowledge structure |
| **Prediction Accuracy** | Validates AI predictions against actual outcomes |
| **Inconsistency Detection** | Flags gaps between what users say vs. what they do |

---

## Epic Structure (Implementation)

### Foundation Layer

| Epic | Name | Features | Description |
|------|------|----------|-------------|
| **E1** | Onboarding & Assessment | 6 | Account creation, flexible assessment, plan generation |

### Interaction Channels

| Epic | Name | Features | Description |
|------|------|----------|-------------|
| **E2** | Voice Coaching | 6 | AI calls, scheduled/on-demand, emotional intelligence |
| **E3** | ~~WhatsApp~~ → In-App Chat | 7 | Real-time chat, group chats, voice/video calls, media sharing |
| **E4** | Mobile App | 7 | Dashboard, visualization, journal hub, goal tracking |

### Life Domain Features

| Epic | Name | Features | Description |
|------|------|----------|-------------|
| **E5** | Fitness & Activity | 6 | Exercise, sleep, recovery, activity tracking, wearable sync |
| **E6** | Nutrition | 6 | Meal logging, calories/macros, hydration, AI coaching |
| **E7** | Emotional Wellbeing | 7 | Mood check-ins, journaling, habits, stress, crisis detection |

### Intelligence Layer

| Epic | Name | Features | Description |
|------|------|----------|-------------|
| **E8** | Cross-Domain Intelligence | 8 | Correlation engine, memory, wiki, knowledge graph, interventions |
| **E9** | Data Integrations | 10 | WHOOP, Spotify, Google Calendar, and planned integrations |
| **E10** | Analytics & Insights Dashboard | 20 | Personalized feed, predictions, pattern alerts, reports |

### Extended Life Domains (Built Beyond Original Epics)

| Feature Area | Status | Description |
|-------------|--------|-------------|
| **Financial Wellness** | ✅ Built | Transaction tracking, spending analysis, stress-spending correlation |
| **Life Areas** | ✅ Built | Multi-domain goal management (health, career, relationships, etc.) |
| **Social & Accountability** | ✅ Built | Buddy matching, contracts, triggers, competitions, team challenges |
| **Gamification** | ✅ Built | XP, levels, achievements, streaks, leaderboards, micro-wins |
| **Cultural Intelligence** | ✅ Built | Prayer times, holidays, special days for context-aware coaching |
| **AI Memory & Knowledge** | ✅ Built | Memory engine, personal wiki, knowledge graph, life history |

---

## Using Life Domains in Documents

When referencing yHealth's scope:
- Say **"life domains"** or **"life areas"** — not "three pillars" or "health pillars"
- Health data is a **foundation** for coaching, not the **boundary** of coaching
- Always emphasize **whole-life** intelligence and **cross-domain** value
- Highlight that yHealth coaches on career, relationships, finances, and personal growth — not just health
- Use specific cross-domain examples to demonstrate value (sleep→productivity, spending→stress, etc.)

---

*Updated for Executive Vision Document v5.0 — reflecting whole-life coaching positioning*
