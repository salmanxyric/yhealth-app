---
type: feature-review
title: yHealth Feature Review — Hamza & Salman
status: Completed
owner: Salman
last_updated: 2026-04-07
kb_summary: Founder review of yHealth features vs vision — life-coach reframe, streaks, accountability, statuses
---

# yHealth Feature Review — Hamza & Salman

**Date**: 2026-04-07
**Participants**: Hamza (Founder), Salman (Developer)
**Duration**: ~30 minutes
**Context**: Review of yHealth features against founder's vision, covering current state, gaps, and new feature ideas

---

## Executive Summary

This review session walked through yHealth's core identity and feature set against the founder's North Star principles. The key takeaway: **yHealth is a life coach, not a health app**. Fitness, nutrition, and well-being are data sensors for the AI — not the product itself. The discussion covered streaks, AI coach intelligence, accountability mechanisms, data correlation across life domains, and ensuring the product can help with *anything* involving self-improvement.

---

## Feature Status At-a-Glance

| # | Feature | Status | Implementation Reference |
|---|---------|--------|--------------------------|
| 1 | Snapchat-style Streaks | ✅ Done | P45 — `streak.service.ts`, `StreakWidget`, `StreakCalendar`, `StreakFreezeControls`, `StreakMilestoneModal` |
| 2 | AI Coach Status Awareness | ✅ Done | P45 — `activity-status.service.ts`, `status-intent-classifier.service.ts`, `status-pattern-analyzer.service.ts`, `status-plan-adjuster.service.ts`, `status-plan-generator.service.ts`, `ActivityStatusPageContent`, `StatusPill` |
| 3 | AI-generated Achievements | 🔄 Partial | Existing achievements API + gamification; AI-personalized cards pending |
| 4 | Google Calendar Integration | ⏳ Planned | Not started — confirmed feasible |
| 5 | Social Accountability (Consent-Based) | ✅ Done | P45 — `accountability-consent.service.ts`, `accountability-trigger.service.ts`, `accountability.routes.ts`, `SocialAccountabilitySection`, `AccountabilityTab` |
| 6 | Accountability Contracts | ✅ Done | P45 — `accountability-contract.service.ts`, `contract-suggestion.service.ts`, `accountability-contract.routes.ts`, `ContractsPageContent`, `ContractCard`, `CreateContractModal` |
| 7 | Accountability Buddy Matching | ✅ Done | P45 — `buddy-suggestion.service.ts`, `BuddyProfileModal`; in-chat suggestion → follow request → shared chat flow |
| 8 | Universal Data Source Correlation | 🔄 Partial | Cross-domain intelligence (P31/E08) covers most; Spotify/Calendar signals pending |
| 9 | Universal Self-Improvement Scope | 🔄 Partial | Life Goals 13 categories (P35) covers career/relationships/faith/finance; coaching follow-ups being tightened |
| 10 | Communication Channels (Call / Push / Email) | 🔄 Partial | Push ✅ (P36), Email ✅ (P36), Voice Calls ✅ (P8). AI-initiated outbound phone calls pending |
| 11 | AI Coach Personalities | ✅ Done | Settings-driven personality selection (P37 coaching styles: brutal_honesty, fired_up_pride, tough_love, gentle) |
| 12 | Obstacle Diagnosis | 🔄 Partial | `/obstacles` page scaffold exists; root-cause prompts need wiring |
| 13 | Goal Reconnection (DKA Prevention) | 🔄 Partial | Life goals stalled/encouragement proactive messages (P35) — needs explicit "forgotten goals" revisit logic |
| 14 | Contextual Timing | 🔄 Partial | Smart timing + quiet hours exist; pattern learning of talkative times pending |
| 15 | Mental Health Guardrails | 🔄 Partial | Crisis detection + emergency support session exist; clinical-depression differentiation pending |

**Legend**: ✅ Done · 🔄 Partial · ⏳ Planned

---

## Founder's North Star Principles

### Principle 1: It's a Life Coach
- yHealth is NOT a fitness app, NOT a nutrition app, NOT a health app — it's a **life coach**
- Target user: **anyone who wants to improve themselves, period**
- The three pillars (fitness, nutrition, well-being) exist because **AI needs quantifiable data** to understand users
- They are **sensors, not features** — the **engine, not the car**
- Documentation needs updating to fully reflect this — the vision doc says "broader life aspirations" but treats it as secondary to health

### Principle 2: Motivation, Accountability & Human Needs
- The core problem yHealth solves is **sustaining motivation and providing accountability** for any goal
- The friend's pain point is losing steam — the AI coach prevents that
- Currently implemented: AI sends messages, creates follow-up when goals aren't met, can express frustration
- Needs enhancement: multiple channels (calls, push notifications, email), friction reduction, pattern-based adjustments

---

## Feature Areas Discussed

### 1. Streaks & Gamification ✅ Done (P45)

**Status**: Implemented in P45 — `streak.service.ts` (single master streak fed by any qualifying activity, freeze economy, midnight validation, calendar heatmap, leaderboard, Socket.IO real-time).

**Delivered**:
- Snapchat-style visual streaks with streak widget and calendar heatmap
- Streak break warnings, freeze mechanic, milestone modals
- Master-streak pattern: any qualifying activity keeps it alive
- Tier progression, at-risk flag, total active days
- Real-time updates via Socket.IO

**Still to enhance**:
- Friction reduction ("2-minute check-in instead of full routine") — logic pending
- Competition-with-self visualizations over longer time horizons

---

### 2. AI Coach Status Awareness ✅ Done (P45)

**Status**: Implemented in P45 — `activity-status.service.ts`, `status-intent-classifier.service.ts`, `status-pattern-analyzer.service.ts`, `status-plan-adjuster.service.ts`, `status-plan-generator.service.ts`, full `/activity-status` page.

**Delivered**:
- Status-based plan adjustment (sick/traveling/vacation/injured → plan shifts)
- Auto-updating status from conversations via intent classifier
- Pattern analyzer learns recurring patterns (e.g., low-energy Mondays)
- Calendar, timeline, picker modal, stats, StatusPill in voice assistant
- Day-by-day reset + follow-up queries ("still sick?")

---

### 3. Achievements System 🔄 Partial

**Status**: Base achievements exist (Perfect Day, Connected Fitness, Starter, Goal Setter) via achievements API + gamification service. AI-generated personalized achievement cards tied to individual goals **not yet** implemented.

**Still needed**:
- AI-generated goal-specific achievements ("You used to pray 0 times — now 5/day")
- Achievement push notifications (infrastructure exists in P36 notification engine)
- Micro-wins resurfacing ("first 3-day workout streak in 6 weeks")

---

### 4. Google Calendar Integration ⏳ Planned

Not started. Confirmed feasible. Scope:
- Meeting density → stress detection
- Contextual awareness before big meetings
- Smart scheduling around free days
- Ramadan/holiday awareness

---

### 5. Social Accountability (Consent-Based) ✅ Done (P45)

**Status**: Implemented — `accountability-consent.service.ts`, `accountability-trigger.service.ts`, `accountability.routes.ts`, `SocialAccountabilitySection`, `AccountabilityTab`.

**Delivered**:
- Consent capture for friends/family/group notifications
- User-defined trigger conditions (e.g., "no gym for 3 days → notify friends")
- Group and individual contact targeting
- Settings-based configuration

**Still to enhance**:
- SOS feature for users living alone — alert saved contacts via WhatsApp/chat after extended inactivity

---

### 6. Accountability Contracts ✅ Done (P45)

**Status**: Implemented — `accountability-contract.service.ts`, `contract-suggestion.service.ts`, `accountability-contract.routes.ts`, `ContractsPageContent`, `ContractCard`, `CreateContractModal`.

**Delivered**:
- Optional contracts with real stakes (donate X if condition not met)
- User-driven or AI-suggested contract terms
- Formal signing flow with `signedAt`, `startDate`, `endDate`
- Lifecycle management (pause, auto-renew, violations)
- Condition evaluation engine shared with trigger service
- Integration with gamification and notifications

---

### 7. Accountability Buddy Matching ✅ Done (P45)

**Status**: Implemented — `buddy-suggestion.service.ts`, `BuddyProfileModal`. Flow: AI suggests buddy in chat → user sends follow request → on accept, shared chat is created.

**Delivered**:
- Goal-similarity matching (not random)
- In-chat buddy suggestion cards
- Follow-request → accept → auto-created 1:1 chat
- Buddy profile modal with goal alignment

**Still to enhance**:
- Goal-based shared challenges (e.g., "No sugar for a month" for cluster of compatible users)

---

### 8. Universal Data Source Correlation 🔄 Partial

**Status**: Cross-domain intelligence engine (P31/E08) already correlates health + wellbeing + WHOOP + fitness + nutrition across 22 contradiction rules and 6 SQL-based correlation detectors.

**Still needed**:
- Spotify listening-pattern → mood signal
- Calendar event density → stress signal
- Prayer times → observance tracking
- Spending → financial stress

---

### 9. Universal Self-Improvement Scope 🔄 Partial

**Status**: Life Goals ecosystem (P35) covers 13 categories: faith, career, finances, relationships, education, personal growth, creative, productivity, social, spiritual, happiness, anxiety management, health wellness.

**Still to tighten**:
- Career follow-up loops (resume review, application tracking)
- Relationship commitment follow-ups (call mother, family time)

---

### 10. Communication Channels 🔄 Partial

| Channel | Status |
|---------|--------|
| Chat (text) | ✅ Done |
| Push notifications | ✅ Done (P36) |
| Email | ✅ Done (P36 — digests, coaching, re-engagement) |
| Voice (user-initiated & AI-initiated in-app) | ✅ Done (P8) |
| AI outbound phone call (PSTN) | ⏳ Planned |

---

### 11. AI Coach Personalities ✅ Done

Settings-driven selection. Coaching styles include drill-sergeant-like `brutal_honesty`, supportive `fired_up_pride`, `tough_love`, and neutral `gentle` (P37 coaching style mapping + 3-day new-user guard).

---

### 12. Obstacle Diagnosis 🔄 Partial

Client page `/obstacles` exists. AI-driven root-cause prompts ("Is it time, location, or energy?") not yet wired.

---

### 13. Goal Reconnection (DKA Prevention) 🔄 Partial

Life goals proactive messaging (P35) covers stalled/encouragement cases. Explicit "silent goal revisit" (goals untouched for 3+ weeks) not yet explicit.

---

### 14. Contextual Timing 🔄 Partial

Smart timing + quiet hours exist. Learning user's most receptive hour from conversation patterns not yet implemented.

---

### 15. Mental Health Guardrails 🔄 Partial

Crisis detection and emergency support session flow exist (P8). Differentiation between clinical depression and normal sadness (with professional-help escalation) pending.

---

## Health Pillars as Infrastructure (Key Reframe)

This was identified as **the most important conceptual reframe** for the product:

> **Health pillars are infrastructure, not product.**

| Concept | What it means |
|---------|---------------|
| Fitness, Nutrition, Well-being | **Sensors** that feed data to AI — not the product's features |
| The AI Coach | **The actual product** — everything else serves it |
| Why pillars exist | AI needs quantifiable data to understand users |
| Analogy | Pillars are the **engine**, the coach is the **car** |

**Documentation action needed**: Update vision document and PRD to make this distinction crystal clear.

---

## Action Items

| # | Action | Owner | Priority | Status |
|---|--------|-------|----------|--------|
| 1 | Add Snapchat-style streak feature | Salman | High | ✅ Done (P45) |
| 2 | Implement friction reduction (2-min check-in after 3 days absence) | Salman | High | ⏳ Pending |
| 3 | Make status auto-update from AI coach conversations | Salman | Medium | ✅ Done (P45) |
| 4 | Add status follow-up logic (ask next day if still sick, etc.) | Salman | Medium | ✅ Done (P45) |
| 5 | Implement AI-generated personalized achievements | Salman | Medium | 🔄 Partial |
| 6 | Social accountability — consent-based friend/family messaging | Salman | Medium | ✅ Done (P45) |
| 7 | Accountability contracts with financial stakes | Salman | Low | ✅ Done (P45) |
| 8 | Accountability buddy matching (goal-based, not random) | Salman | Low | ✅ Done (P45) |
| 9 | Google Calendar integration for stress/context detection | Salman | Medium | ⏳ Pending |
| 10 | Universal self-improvement: ensure career & relationships work as goals | Salman | High | 🔄 Partial (P35) |
| 11 | Update vision document to reflect "pillars as infrastructure" reframe | Hamza | High | ⏳ Pending |
| 12 | Calling feature for AI coach (outbound PSTN) | Salman | Medium | ⏳ Pending |
| 13 | Obstacle diagnosis when user keeps missing same goal | Salman | Low | 🔄 Partial |
| 14 | Goal reconnection — revisit forgotten goals | Salman | Low | 🔄 Partial |
| 15 | Mental health guardrails for clinical depression/anxiety | Salman | High | 🔄 Partial |
| 16 | SOS feature for people living alone | Salman | Low | ⏳ Pending |
| 17 | Smart competitions based on goal similarity instead of random | Salman | Low | 🔄 Partial |

---

## Raw Notes (Provided by Hamza)

### Streaks for Self-Motivation
- Streak detection — notices when you've missed 2-3 days and reaches out with a calibrated nudge (not guilt, not cheerfulness — matched to your personality)
- Friction reduction — "You haven't logged in 3 days. Want to do a 2-minute check-in instead of the full routine?" Lowers the bar when motivation dips

### Status-Based Plan Updates
- Based on statuses, plans can be updated and changed
- AI coach should be asking about specific status:
  - If sick, ask the next day if still sick
  - If vacation, ask how long the vacation is for in messaging to understand the plan
  - If traveling, ask how long the travel is for
- Status should also automatically get updated based on conversations between AI coach and user

### Achievements
- Based on your goals, AI creates achievements

### Google Calendar
- Integration for context-aware coaching

### Social Accountability
- Ask for consent if your friends/family/group can be messaged in case you are losing motivation
- Extra accountability, motivation through real people

### Accountability Contracts
- Create contracts between users and the AI coach (optional)
- "If I don't go to the gym tomorrow, I'll donate 500 rupees"
- "If I eat more than 3000 calories, I'll donate 1000 rupees"

### Accountability Buddy Matching
- Connect users with similar goals

### Universal Data Source Correlation
- Any data source — Spotify listening patterns, calendar events, prayer times, spending habits — can feed the AI's understanding of the user
- The correlation engine should work across ALL life domains, not just health metrics
- Example: If I have 6 meetings on my Google Calendar, it should know that it's a stressful day. It should know that I might not have time to talk. When it does call, it should have an idea that I might be tired, it should ask and learn about the user. It should ask if the user wants to have a shorter conversation.

### Universal Scope
- Careers, Relationships
- If someone asks "Can yHealth help me with X?" the answer should always be **yes** — if X involves self-improvement
- Prayer, finances, career, relationships, fitness, anxiety, creativity — all valid
