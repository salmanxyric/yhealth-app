# yHealth Platform - Terminology

> **Source:** Executive Vision Document v5.0 + PRD + Epic PRDs

---

## Core Product Terms

| Term | Definition | Usage Notes |
|------|------------|-------------|
| **AI Life Coach** | yHealth's primary identity — an AI companion that helps users achieve goals across every life dimension | Preferred term. Never say "health coach", "wellness app", or "fitness app" |
| **Second Mind** | Aspirational state where yHealth knows users better than they know themselves through persistent memory | Used in vision/marketing and as design north star |
| **Whole-Life Intelligence** | Platform's ability to connect health, finances, emotions, habits, career, relationships into unified insights | Core differentiator — replaces "three pillars" terminology |
| **Life Domains** | The interconnected areas of a user's life: health, career, relationships, finances, personal growth, spirituality, habits | Preferred over "pillars". Use "life areas" or "life domains" |
| **Invisible Intelligence** | AI complexity hidden from user, delivering simple actionable guidance | Core principle for AI design |
| **Visible Coaching** | User-facing conversational guidance delivered via Voice/Chat/App | Paired with "invisible intelligence" |
| **Persistent Memory** | AI's growing understanding through memory engine, wiki, and knowledge graph | Key differentiator vs stateless chatbots |

---

## Life Domain Terminology

| Domain | What It Covers | Key Systems |
|--------|---------------|-------------|
| **Health & Fitness** | Exercise, sleep, recovery, activity, wearable data | Workout plans, exercise library, WHOOP, daily scoring |
| **Nutrition** | Meals, hydration, diet plans, macros, adaptive calories | Meal logging, photo recognition, water tracking, shopping lists |
| **Emotional Wellbeing** | Mood, stress, journaling, emotional check-ins, crisis support | Check-ins, emotion detection, daily pledges, commitment tracking |
| **Financial Wellness** | Spending, stress-spending correlation, financial habits | Transaction tracking, spending analysis, financial reports |
| **Personal Growth** | Goals, habits, life areas, streaks, achievements | Goal decomposition, life area management, achievement trees |
| **Social & Relationships** | Accountability, buddies, community, competitions | Buddy matching, contracts, team competitions, shared challenges |
| **Productivity & Schedule** | Calendar, timing, routines, activity status | Calendar sync, timing profile, schedule management |
| **Cultural & Spiritual** | Prayer times, holidays, cultural context | Prayer times, holiday calendar, special days |

**Note:** Use "emotional wellbeing" not "mental health" — yHealth is life coaching, not clinical care.

---

## Deprecated Terms

| Old Term | Replacement | Reason |
|----------|-------------|--------|
| **Three Equal Pillars** | **Life Domains** or **Whole-Life Intelligence** | yHealth coaches the whole life, not just fitness/nutrition/wellbeing |
| **Fitness Pillar** | **Health & Fitness domain** | No longer positioned as one of three pillars |
| **Nutrition Pillar** | **Nutrition domain** | Same reason |
| **Wellbeing Pillar** | **Emotional Wellbeing domain** | Same reason |
| **Three-Pillar Harmony** | **Life Balance Score** or **Cross-Domain Harmony** | Reflects whole-life scope |
| **Holistic Health Score** | **Life Score** or **Cross-Domain Score** | Not limited to health |
| **Health Coach** | **AI Life Coach** | yHealth coaches on career, finances, relationships — not just health |

---

## Engagement Modes

| Term | Definition | Duration |
|------|------------|----------|
| **Light Mode** | Quick, low-friction engagement | 30 seconds - 2 minutes |
| **Deep Mode** | Comprehensive, detailed engagement | 10+ minutes |
| **User-Adaptive Flexibility** | System principle that both modes are equally valid | Design principle, not feature |

---

## Interaction Channels

| Channel | Full Name | Description |
|---------|-----------|-------------|
| **Voice Coaching** | Voice Coaching Channel (E2) | AI phone/voice calls with emotional intelligence |
| **Chat** | Chat System (E4) | Real-time messaging, group chats, media, reactions |
| **Mobile App** | Mobile App Channel (E4) | Dashboard, visualization, journaling |

---

## Intelligence Terms

| Term | Definition | Category |
|------|------------|----------|
| **Cross-Domain Insight** | Correlation between life domains users couldn't discover alone | Core USP |
| **Predictive Insight** | Forward-looking pattern-based coaching | E.g., "You'll likely feel low energy tomorrow" |
| **Correlational Insight** | Connection between multiple data points across domains | E.g., "Best workouts when you journal first" |
| **Actionable Insight** | Real-time guidance based on current state | E.g., "A 10-min walk would help now" |
| **Aha Moment** | User's first experience of yHealth's unique cross-domain value | First week goal |
| **Memory** | Evidence-based persistent fact about a user with decay/reinforcement | Core AI system |
| **Wiki Page** | Per-user knowledge base entry with evidence accumulation | Core AI system |
| **Knowledge Graph** | Aggregated structure connecting all user data and insights | Read-only analytical view |

---

## AI System Terms

| Term | Definition |
|------|------------|
| **Memory Engine** | Creates, decays, reinforces, and retrieves persistent user knowledge |
| **Memory Extraction** | Patterns seen 3+ times in 14 days become persistent memories |
| **Memory Decay** | Archives/expires memories that are no longer relevant |
| **Intelligence Feedback** | User corrections that become new memories |
| **Wiki Synthesis** | LLM-powered daily synthesis of user data signals into wiki pages |
| **Correlation Engine** | Produces unified UserContextState from 17 context blocks |
| **Intervention Engine** | 14 decision trees that auto-adjust plans based on cross-domain signals |
| **Cross-Pillar Intelligence** | Detects contradictions across ALL data sources |
| **Personality Mode** | Coaching style computed from user tier, recovery, engagement, mood, context |
| **Motivation Tier** | Engagement score from 14-day rolling behavioral data |
| **Proactive Event Triggers** | Context-driven messages triggered by schedule, behavior, or patterns |

---

## Metric Terms

| Metric | Definition | Source |
|--------|------------|--------|
| **Recovery Score** | Daily readiness assessment | Fitness + emotional wellbeing |
| **Daily Score** | 6-component daily fitness score | Activity, exercise, nutrition, sleep, etc. |
| **Best Day Formula** | How well user matches their personal optimal day | Cross-domain |
| **Streak** | Consecutive days of goal-aligned behavior | Gamification |
| **XP** | Experience points for engagement and achievements | Gamification |
| **Micro-Win** | Small behavioral improvement (comeback, consistency, streak recovery) | Gamification |

---

## Persona References

| Code | Name | Quick Reference |
|------|------|-----------------|
| **P1** | Whole-Life Optimizer | 40%, mixed mode, wants cross-domain insights |
| **P2** | Busy Professional | 25%, light mode, time-constrained |
| **P3** | Data-Driven Achiever | 20%, deep mode, wants all correlations |
| **P4** | Habit Formation Seeker | 10%, light→deep, needs accountability |
| **P5** | Gentle Growth Builder | 5%, always light, compassionate support |

---

## Epic References

| Code | Name | Quick Description |
|------|------|-------------------|
| **E1** | Onboarding & Assessment | Account creation, initial setup |
| **E2** | Voice Coaching | AI voice calls |
| **E3** | ~~WhatsApp Integration~~ | Replaced by in-app Chat with voice/video calling |
| **E4** | Mobile App | Visual dashboard, chat |
| **E5** | Fitness & Activity | Exercise, sleep, recovery |
| **E6** | Nutrition | Meals, macros, hydration |
| **E7** | Emotional Wellbeing | Mood, journaling, habits, stress, crisis |
| **E8** | Cross-Domain Intelligence | Correlations, memory, wiki, knowledge graph |
| **E9** | Data Integrations | Wearables, APIs |
| **E10** | Analytics Dashboard | Insights, visualization |

---

## Feature ID Format

**Pattern:** `F[Epic#].[Feature#]`

Examples:
- F5.1 = First feature in Fitness & Activity (E5)
- F8.3 = Third feature in Cross-Domain Intelligence (E8)

---

## Story ID Format

**Pattern:** `S[Epic#].[Feature#].[Story#]`

Examples:
- S5.1.1 = First story of first feature in Fitness & Activity
- S8.3.2 = Second story of third feature in Cross-Domain Intelligence

---

## Integration Terms

| Term | Definition |
|------|------------|
| **Golden Source** | Highest-priority data source for a given metric |
| **Data Sync** | Process of pulling data from external sources |
| **OAuth Flow** | Authentication process for connecting external services |
| **Backfill** | Fetching historical data after connection |

---

## MoSCoW Priority Terms

| Priority | Code | Meaning | Typical % |
|----------|------|---------|-----------|
| **Must Have** | P0 | MVP-critical, non-negotiable | ~60% |
| **Should Have** | P1 | Important but not launch-blocking | ~20% |
| **Could Have** | P2 | Nice-to-have if time permits | ~15% |
| **Won't Have** | P3 | Explicitly excluded from current scope | ~5% |

---

## Competitive Terms

| Term | Definition |
|------|------------|
| **Better Together** | yHealth's integration superiority positioning |
| **Specialist App** | Single-domain competitor (fitness-only, nutrition-only, finance-only) |
| **Data Aggregator** | Passive dashboard competitor (Apple Health, Google Fit) |
| **Stateless Chatbot** | AI without persistent memory (ChatGPT, generic bots) |

---

*Updated for Executive Vision Document v5.0 — reflecting whole-life coaching positioning*
