# yHealth Journaling Inspiration: Cross-Pollination from Story Writer

> **Type**: Ideation / Inspiration Document
> **Source**: PLAYGROUND/@story writer copy 2 (personal Life Intelligence Ecosystem)
> **Target**: PRODUCTS/yhealth-platform (Epic 07 — Wellbeing Pillar)
> **Created**: 2026-03-09

---

## 1. Executive Summary

**The vision**: yHealth's journaling system should be voice-first, whole-life, and conversational — not a text box with prompts.

The user talks. The AI transcribes, then responds like a therapist would — asking follow-up questions, reflecting back what it heard, gently probing deeper. That conversation *becomes* the journal entry. Over time, the AI coach learns the user's patterns, voice, and life context not from structured health data alone, but primarily from these journal conversations and voice calls.

This transforms yHealth from a health tracker into a **whole-life AI coach** — one that understands work stress, relationship dynamics, financial anxiety, and personal growth alongside sleep scores and step counts. Real wellbeing is holistic. The journal is the AI coach's soul.

**Story Writer** (the personal project) has battle-tested many of these patterns across 927 drafts, 88 voice recordings, 129 days of Whoop health data, and 132 life-story skills. This document captures what yHealth can learn from it.

---

## 2. What Story Writer Teaches Us

The Story Writer project is a personal Life Intelligence Ecosystem — a hybrid system combining memoir capture, health tracking (Whoop), trading psychology, and voice processing. Key patterns relevant to yHealth:

### 2.1 Dual Capture Model: Journals vs. Entries

Story Writer separates two distinct capture modes:

| Mode | Purpose | Depth | Trigger |
|------|---------|-------|---------|
| **Journals** | Present-focused daily reflections | Light-medium | Daily habit |
| **Entries** | Deep structured past memories | Heavy | Prompted or inspired |

Both feed a unified timeline but serve different psychological functions. yHealth's current journaling is prompt-based (closer to "Entries") but lacks the lightweight daily reflection mode that builds habit.

### 2.2 Rich Emotional State Model

The trading journal tracks **9 emotional states** with color-coded badges:

| State | Emoji | Valence |
|-------|-------|---------|
| Calm | 😌 | Positive |
| Confident | 😎 | Positive |
| Focused | 🎯 | Positive |
| Neutral | 😐 | Neutral |
| Distracted | 🤔 | Intermediate |
| Euphoric | 🤩 | Intermediate (can be risky) |
| Anxious | 😰 | Negative |
| Frustrated | 😤 | Negative |
| Fearful | 😨 | Negative |

These states are tracked *per activity* (per trade), not just once per day. The system detects when emotional states lead to poor decisions (revenge trading after a loss, FOMO entries when euphoric).

**yHealth parallel**: Mood check-ins currently use 6 emojis (😊 😐 😟 😡 😰 😴). The model could expand to capture transitions, not just snapshots.

### 2.3 Psychology Detection System

Story Writer's trading app automatically detects behavioral patterns:

- **REVENGE_TRADE**: Entry within 15 minutes of a loss
- **OVERSIZED**: Position >1.5x average (overconfidence signal)
- **EXTENDED_HOLD**: Duration >2x average (hope/fear paralysis)
- **FOMO_ENTRY**: Chasing momentum
- **FEAR_EXIT**: Cutting winners too early

These are surfaced as visual badges (color-coded severity), not as judgments. The system *shows* patterns and lets the user reflect.

**yHealth parallel**: The same approach works for wellbeing — detecting when users skip meals before stressful meetings, sleep poorly after evening screen time, or journal only when upset (negativity bias).

### 2.4 Voice Pipeline (7 Phases)

Story Writer processed 88 recordings through a mature pipeline:

```
Phase 0: Transcription (MLX-Whisper, local/private)
Phase 1: Categorization (full/selective/voice_only/skip)
Phase 2: Import (84 transcripts → structured storage)
Phase 3: Extraction (100 story drafts from 47 recordings)
Phase 4: Review (human approval of AI extractions)
Phase 5: Cross-Recording Analysis (themes, people, threads)
Phase 6: Voice Mining (22 speech patterns, 11 confirmed)
```

**Key insight**: Voice is not just "speech-to-text." The pipeline *extracts structured insights* from unstructured speech — detecting characters, themes, emotional patterns, and even the user's linguistic fingerprint ("So basically..." openers, code-switching, teaching-via-analogy style).

### 2.5 Health-Performance Correlation

Story Writer correlates Whoop biometrics with trading performance:

> "When recovery is <34% (red zone), win rate drops from 58% to 38%"

**Data tracked daily**: recovery score, HRV (rmssd), resting HR, SpO2, skin temp, sleep stages (light/deep/REM), strain, max HR.

**Baselines computed**: Average recovery 53.5%, HRV 72.5ms, sleep 7.2hrs. Green/yellow/red day distribution tracked. Best recovery day: Monday. Worst: Saturday.

### 2.6 Lessons Learned as First-Class Data

The trading journal has a dedicated `lessonsLearned` array field — not buried in free text, but structured as discrete items that can be:
- Reviewed across time ("What lessons keep repeating?")
- Correlated with outcomes ("Did learning this lesson improve results?")
- Surfaced proactively ("You learned X three weeks ago — did you apply it today?")

### 2.7 Plan/Review Loop

Every trading day has a structured cycle:

| Phase | Field | When |
|-------|-------|------|
| **Plan** | `gamePlan` | Pre-market (morning) |
| **Execute** | Per-trade notes | During the day |
| **Review** | `dayReview` | End of day |
| **Reflect** | `mindsetNotes` | Emotional shifts |
| **Crystallize** | `lessonsLearned` | Key takeaways |

This is the missing structure in yHealth's journaling — it's currently open-ended prompts without a daily rhythm.

---

## 3. yHealth Current State (Epic 07)

### What's Built (55% of 18 stories)

**Mood Tracking** — Fully operational:
- Light mode: 6 emoji quick-tap (😊 😐 😟 😡 😰 😴)
- Deep mode: 4 sliders (happiness, energy, stress, anxiety on 1-10)
- 14 emotion tags (grateful, frustrated, excited, anxious, content, overwhelmed, peaceful, irritated, hopeful, lonely, confident, sad, energized, calm)
- Timeline visualization (day/week/month)
- Pattern analysis (time-of-day, dominant emotions, averages)

**Journaling** — Core functional:
- 24 research-based prompts across 6 categories (gratitude, reflection, emotional processing, stress management, self-compassion, future focus)
- Light/Deep entry modes
- Word count tracking, auto-save
- Sentiment analysis (basic, -1.0 to 1.0)
- Streak tracking with milestone celebrations (3, 7, 30 days)
- Voice-to-text support (flag exists, basic implementation)

**Emotional Check-ins** — Screening system:
- LangChain/LLM-powered adaptive questioning
- Light/standard/deep screening types
- Risk assessment (none → critical)
- Crisis detection with escalation
- Insights and recommendations (JSONB)

**Supporting Features**:
- Energy level logging
- Habit creation, tracking & streaks
- Mindfulness practice library (drafted)
- Routine templates

### What's Missing (45% — Draft Stories)

| Story | Gap |
|-------|-----|
| S07-07 | Habit correlation with other pillars |
| S07-09 | Voice journal UI & transcription flow |
| S07-10 | AI personalization of prompts & responses |
| S07-11 | Self-report stress logging |
| S07-12 | Multi-signal stress detection |
| S07-13 | Stress alerts & interventions |
| S07-14 | Wellbeing goal setting |
| S07-16 | Routine tracking analytics |
| S07-18 | Context-aware recommendations |

### Architecture

**Database**: PostgreSQL with `mood_logs`, `journal_entries`, `emotional_checkin_sessions` tables. No cross-table relationships (independent pillars).

**Backend**: Express.js → Service layer → PostgreSQL. Mood service, journal service, emotional check-in service.

**Frontend**: React 19, Tailwind CSS, Framer Motion animations. Modal-based entry forms, dark theme (slate-900 + emerald-500 accents).

**API Client**: Typed service layer (`wellbeing.service.ts`) with `{ success, data, error }` responses.

---

## 4. The Gap & Opportunity

### What Story Writer Has That yHealth Doesn't

| Story Writer Feature | yHealth Status | Opportunity |
|---------------------|----------------|-------------|
| Voice-first capture with AI conversation | Voice flag exists, no conversational flow | Transform journaling from text-box to therapy session |
| Plan/Review daily loop | Open-ended prompts only | Add morning intentions + evening review structure |
| Mood *transitions* (per-activity tracking) | Single daily snapshots | Track how mood changes through the day and why |
| Lessons learned extraction | Free text only | Structure insights as reviewable, trackable items |
| 9 emotional states with behavioral detection | 6 emojis + 14 tags | Expand model, add automatic pattern detection |
| Cross-domain correlation (health × behavior) | Pillars are independent | Connect sleep, nutrition, exercise to mood/journal patterns |
| Voice pattern mining | None | Learn user's communication style for personalized AI |
| Auto-theme detection | None | Surface recurring themes across journal entries |
| 8-lens psychology profile | Basic sentiment score | Build deeper understanding over time |

### The Core Insight

yHealth's current wellbeing system is **input-focused**: "Log your mood. Write in your journal. Check in emotionally." It collects data but doesn't create a *relationship* with the user.

Story Writer's model is **conversation-focused**: The AI asks, listens, reflects, and learns. The data collection happens as a *byproduct* of a meaningful interaction, not as the goal itself.

The shift: **From health tracker to life coach.**

---

## 5. Feature Opportunities

### 5.1 Voice-First Conversational Journaling

**What**: User opens the journal and talks. AI transcribes in real-time, then responds conversationally — asking follow-up questions, reflecting emotions back, probing gently. The dialogue becomes the entry.

**How it works**:
1. User taps "Voice Journal" → recording starts
2. AI transcribes (AssemblyAI already integrated in yHealth)
3. AI responds: "It sounds like the meeting really frustrated you. What specifically bothered you most?"
4. User responds (voice or text)
5. 3-5 exchange conversation
6. AI generates journal entry summary with extracted: mood, themes, lessons, action items
7. User reviews/approves the structured output

**Story Writer basis**: The 7-phase voice pipeline proved that voice captures richer content than typing. 88 recordings → 100 story drafts, plus 22 speech patterns detected. Voice reveals what people won't type.

**Why it matters**: Voice lowers the barrier to journaling (talk for 2 minutes vs. write for 10). The conversational format ensures depth (AI probes beyond surface statements). And the AI learns the user's voice patterns over time, enabling increasingly personalized interactions.

**Effort**: Large (new UI flow, real-time transcription, conversational AI logic)
**Priority**: P0 — This is the core differentiator

---

### 5.2 Full Day Plan/Review Loop

**What**: Structured daily cycle — morning intentions and evening review — covering whole-life domains, not just health.

**Morning Check-in (2-3 minutes)**:
- Set 3 intentions for the day (any domain: work, health, relationships, personal)
- Predict your mood/energy for the day
- Note any known stressors or challenges ahead

**Evening Review (3-5 minutes)**:
- Compare actual day to morning plan
- Rate the day (1-10)
- Capture what went well and what didn't
- Extract 1-3 lessons learned
- Set any intentions for tomorrow

**Story Writer basis**: The trading journal's `gamePlan` → `dayReview` → `lessonsLearned` cycle is the most consistently used feature. Traders who plan before market open perform measurably better. The same psychology applies to daily life.

**Why it matters**: This creates the daily rhythm that habit research shows is essential. It's also the strongest signal for the AI coach — morning predictions vs. evening reality reveals self-awareness gaps, recurring stressors, and growth patterns.

**Effort**: Medium (UI for plan/review, schema additions, comparison logic)
**Priority**: P0 — Foundation for the coach learning loop

---

### 5.3 Mood Arc Tracking (Transitions, Not Snapshots)

**What**: Track mood changes *through* the day with contextual triggers, not just "How do you feel right now?"

**Current**: One mood log per check-in, independent entries.
**Proposed**: Mood timeline showing transitions with tagged causes:

```
Morning: Calm (😌) → [stressful meeting] → Anxious (😰) → [workout] → Focused (🎯) → [good news] → Confident (😎)
```

**Story Writer basis**: The trading journal tracks emotional state *per trade*, revealing patterns like "confident after first win → euphoric → oversized position → loss → frustrated → revenge trade." This temporal emotional sequence is far more valuable than any single snapshot.

**Why it matters**: Knowing someone is "anxious" is less useful than knowing they *become* anxious after meetings but recover after exercise. The arc reveals interventions that work and triggers to manage.

**Effort**: Small-Medium (extend mood_logs with transition tracking, timeline UI enhancement)
**Priority**: P1 — Enhances existing mood system significantly

---

### 5.4 Lessons Learned Extraction

**What**: After each journal entry or day review, AI extracts discrete "lessons" as structured, searchable, reviewable items.

**Examples**:
- "When I skip lunch, I'm irritable by 4pm" (health-behavior link)
- "Saying no to the extra project reduced my stress for the whole week" (boundary insight)
- "Morning walks before work improve my focus more than coffee" (personal discovery)

**Features**:
- AI suggests lessons from journal text; user confirms/edits
- Lessons are tagged by domain (health, work, relationships, personal)
- Weekly/monthly lesson review surfaces patterns
- Proactive reminders: "3 weeks ago you learned X — has that held true?"
- Lesson frequency tracking: lessons that repeat indicate unlearned patterns

**Story Writer basis**: The `lessonsLearned` array in trading journals is the most-reviewed field. Traders who review lessons weekly improve faster. The structure (discrete items, not buried in prose) makes them actionable.

**Why it matters**: This is how the AI coach demonstrates value — by remembering what the user discovered about themselves and surfacing it at the right moment. It creates a personal wisdom database.

**Effort**: Medium (extraction logic, schema for lessons, review UI)
**Priority**: P1 — Key differentiator for coach intelligence

---

### 5.5 Expanded Emotional State Model

**What**: Expand from 6 emojis to a richer emotional vocabulary with behavioral detection.

**Proposed 9-State Model** (from Story Writer's trading journal):

| State | Emoji | Color | Behavioral Signal |
|-------|-------|-------|-------------------|
| Calm | 😌 | Blue | Baseline, good decision-making |
| Confident | 😎 | Green | Positive, watch for overconfidence |
| Focused | 🎯 | Purple | Flow state, productive |
| Neutral | 😐 | Gray | Neither positive nor negative |
| Distracted | 🤔 | Yellow | Attention fragmented |
| Euphoric | 🤩 | Pink | High energy, risk of impulsive decisions |
| Anxious | 😰 | Orange | Stress response, needs intervention |
| Frustrated | 😤 | Red | Blocked, risk of avoidance |
| Fearful | 😨 | Dark Red | Threat response, needs support |

**Behavioral Detection** (auto-flagged patterns):
- Logging only when upset → negativity bias alert
- Mood crash after specific activities → trigger identification
- Euphoria → impulsive behavior → regret cycle detection
- Sustained anxiety without intervention → escalation flag

**Story Writer basis**: The trading app's `PsychologyBadges.tsx` component automatically surfaces behavioral flags (REVENGE_TRADE, FOMO_ENTRY, etc.) as color-coded badges. Users find these *more* valuable than raw data because they're actionable.

**Why it matters**: Better emotional vocabulary leads to better self-awareness. Behavioral detection transforms passive tracking into active coaching.

**Effort**: Small-Medium (extend emotion enums, add detection logic)
**Priority**: P1 — Enhances existing mood infrastructure

---

### 5.6 AI Interview / Biographer Mode

**What**: The AI conducts a structured interview to deeply understand the user's life context, goals, values, and history. Not a journal entry — an intake session that builds the coach's foundational understanding.

**Session types**:
- **Life Context Interview** (30 min): Family, work, relationships, health history, values, goals
- **Weekly Deep Dive** (10 min): Focus on one life domain — "Tell me about your work this week"
- **Prompted Reflection** (5 min): AI asks about a specific pattern it noticed — "You've mentioned your manager three times this week. What's going on there?"

**Story Writer basis**: The "biographer mode" capture system uses structured questioning to extract stories the user wouldn't volunteer. The 8-lens psychology profile (attachment, cognitive patterns, defense mechanisms, emotional regulation, relationship dynamics, work alignment, financial patterns, trauma response) was built from these interviews.

**Why it matters**: Journal entries capture daily surface events. Interviews build deep context. The AI coach that knows your relationship with your father, your career aspirations, and your financial anxiety can provide fundamentally better guidance than one that only knows today's mood score.

**Effort**: Large (interview flow, context storage, profile building)
**Priority**: P2 — Powerful but can come after core journaling loop

---

### 5.7 Auto-Theme Detection from Content

**What**: AI analyzes journal entries over time and surfaces recurring themes — topics, people, emotions, and situations that appear repeatedly.

**Examples**:
- "Work stress" appeared in 12 of your last 20 entries
- "Partner conflict" clusters around weekends
- "Financial worry" correlates with month-end dates
- "Gratitude for friends" is your most consistent positive theme

**Features**:
- Theme dashboard showing frequency, trend, and sentiment per theme
- Theme alerts: "New theme emerging: sleep anxiety"
- Theme connections: "When 'work stress' appears, 'exercise' disappears"
- User can tag/rename themes or mark as resolved

**Story Writer basis**: Cross-recording analysis (Phase 5) found 8 themes across 47 recordings and 18 tracked people. Series synthesis grouped related content (e.g., "Lahore series" = 25 stories about the same city). Auto-detected themes, characters, and locations in journal frontmatter.

**Why it matters**: Users don't see their own patterns. The AI coach's job is to be the mirror — "You keep coming back to this. Let's explore why."

**Effort**: Medium (NLP theme extraction, dashboard UI, trend tracking)
**Priority**: P2 — Becomes powerful once there's enough journal data

---

### 5.8 Social Wellbeing Dimension

**What**: Track relationships and social connections as a wellbeing dimension — who you spend time with, how interactions affect your mood, and relationship health over time.

**Features**:
- Log social interactions (who, what, mood before/after)
- Relationship energy tracking (which people energize vs. drain you)
- Social isolation alerts (no logged interactions in X days)
- Relationship goals (e.g., "Call mom weekly", "Have lunch with friend monthly")
- AI insights: "You feel most energized after time with [person]"

**Story Writer basis**: The character system tracks 47 people with relationship profiles, journey maps, and interaction histories. Auto-detection from journal text identifies who appears in entries and how often. Relationship maps show how connections evolve over time.

**Why it matters**: Social connection is one of the strongest predictors of wellbeing (stronger than exercise, sleep, or nutrition). Yet most health apps ignore it completely. This is a major differentiator.

**Effort**: Medium-Large (new data model, interaction logging, relationship engine)
**Priority**: P2 — Important for whole-life vision but not core loop

---

### 5.9 Health-Performance Correlation

**What**: Connect structured health data (sleep, exercise, nutrition) with journal content, mood patterns, and life outcomes to surface personalized insights.

**Examples**:
- "When you sleep <6 hours, your mood is 40% more likely to be negative"
- "After days you exercise, your journal entries are 2x more likely to mention gratitude"
- "Your stress peaks correlate with weeks where you skip meal logging"
- "Your best 'day ratings' all share: 7+ hours sleep, morning walk, <3 meetings"

**Story Writer basis**: The health-trading correlation hypothesis ("recovery <34% → win rate drops from 58% to 38%") was derived from correlating 129 Whoop daily files with trading outcomes. The LIFE-100 (Cross-Domain Correlator) skill was designed specifically for this pattern.

**Why it matters**: This is the AI coach's superpower — connecting dots across life domains that humans can't track manually. The journal provides the subjective signal, health data provides the objective signal, and the correlation reveals actionable insights.

**Effort**: Medium (cross-pillar query logic, correlation engine, insight presentation)
**Priority**: P1 — This is where yHealth's three pillars become more than the sum of parts

---

## 6. What NOT to Port

Some Story Writer features are memoir/biography-specific and don't belong in yHealth:

| Feature | Why It Doesn't Fit |
|---------|-------------------|
| Book/Chapter system | yHealth is a coach, not a memoir platform |
| Draft → Entry → Companion → Chapter pipeline | Over-structured for daily wellbeing |
| 132 LIFE skills ecosystem | Too complex; yHealth needs streamlined AI |
| Character profiles with journey maps | Simplified social tracking is enough (see 5.8) |
| WhatsApp import | Chat history mining is a privacy concern in a health app |
| Voice pattern mining (Phase 6) | Learning speech patterns is creepy in a health context |
| Domain lenses (auto-tagging dreams, trading) | Too niche for general wellbeing |
| Revisit count / book_worthy flags | Publishing metaphors don't apply |
| 31-rule data integrity system | Overkill for personal journaling |
| Prose polishing / ghostwriter | Users aren't publishing their journals |

**The principle**: Port the *interaction patterns* (voice-first, plan/review, lesson extraction) not the *data architecture* (chapters, companions, domain lenses).

---

## 7. Vision Statement

### From Health Tracker to Whole-Life AI Coach

Today's yHealth wellbeing pillar is a solid health journaling system — mood tracking, prompted reflections, emotional check-ins. It collects data well.

With the Story Writer patterns applied, it becomes something fundamentally different:

**The user wakes up** and tells their AI coach about the day ahead — 3 intentions, predicted challenges, energy level. The coach knows they slept 6.2 hours (from health data) and had a stressful evening (from last night's journal) and adjusts its response accordingly.

**During the day**, the user drops in for a 2-minute voice check-in after a difficult meeting. The AI transcribes, asks one follow-up question, and logs the mood transition (confident → anxious) with the trigger (meeting with manager).

**In the evening**, the user reviews the day against their morning plan. The AI surfaces: "You planned to go for a walk but didn't. The last three times you skipped your walk, your next-day mood was lower. Want to set a reminder?" It also extracts a lesson: "Preparing talking points before manager meetings reduces anxiety."

**Over weeks**, the coach builds a picture: this user's wellbeing is most affected by (1) sleep quality, (2) work-manager relationship, and (3) exercise consistency. It notices the user never mentions finances — is that because finances are fine, or because they're avoiding the topic? It gently asks.

**Over months**, the coach can say: "Three months ago you were averaging 4/10 mood scores on workdays. After you started the morning intention practice and the manager prep routine, you're now averaging 7/10. Here's what changed."

**This is the product**: An AI that knows your whole life — not just your step count — and uses that knowledge to help you live better. The journal is how it listens. The voice is how it speaks. The health data is supporting context. The human relationship is the product.

---

## 8. Reference: Key yHealth Files

For when implementation begins, these are the files to read and extend:

### Product Documentation
| File | Purpose |
|------|---------|
| `PRODUCTS/yhealth-platform/prd-epics/PRD-Epic-07-Wellbeing-Pillar.md` | Epic PRD with 7 features |
| `PRODUCTS/yhealth-platform/stories/S07-09-*.md` | Voice journal input story (Draft) |
| `PRODUCTS/yhealth-platform/stories/S07-10-*.md` | AI personalization story (Draft) |
| `PRODUCTS/yhealth-platform/stories/S07-14-*.md` | Wellbeing goal setting story (Draft) |

### Database Schema
| File | Tables |
|------|--------|
| `apps/yhealth-app/server/src/database/tables/46-mood-logs.sql` | `mood_logs` |
| `apps/yhealth-app/server/src/database/tables/47-journal-entries.sql` | `journal_entries` |
| `apps/yhealth-app/server/src/database/tables/60-emotional-checkin-sessions.sql` | `emotional_checkin_sessions` |

### Backend Services
| File | Service |
|------|---------|
| `apps/yhealth-app/server/src/services/wellbeing/mood.service.ts` | Mood logging & patterns |
| `apps/yhealth-app/server/src/services/wellbeing/journal.service.ts` | Journal entries & streaks |
| `apps/yhealth-app/server/src/services/emotional-checkin.service.ts` | Screening & risk assessment |

### Frontend Components
| Directory | Components |
|-----------|------------|
| `.../dashboard/components/wellbeing/mood/` | MoodCheckIn, MoodCheckInLight, MoodCheckInDeep, MoodTimeline, MoodPatterns |
| `.../dashboard/components/wellbeing/journal/` | JournalEntryForm, JournalPrompt, JournalHistory, JournalStreaks |

### Story Writer Source Patterns
| File | Pattern |
|------|---------|
| `PLAYGROUND/@story writer copy 2/trades-app/src/types/journal.ts` | EmotionalState enum, DayJournal structure, lessonsLearned array |
| `PLAYGROUND/@story writer copy 2/trades-app/src/components/journal/JournalEditor.tsx` | Plan/Review UI pattern |
| `PLAYGROUND/@story writer copy 2/trades-app/src/components/analysis/PsychologyBadges.tsx` | Behavioral detection badges |
| `PLAYGROUND/@story writer copy 2/story-data/journals/_TEMPLATE.md` | Rich journal frontmatter (mood, energy, themes, characters) |
| `PLAYGROUND/@story writer copy 2/story-data/whoop/daily/` | Health daily file structure (129 files) |
| `PLAYGROUND/@story writer copy 2/recordings-processor/` | 7-phase voice pipeline |

---

*This document is inspiration, not specification. When the time comes to implement, each opportunity should be broken into proper Epic PRD stories with BDD acceptance criteria following the yHealth product pipeline.*
