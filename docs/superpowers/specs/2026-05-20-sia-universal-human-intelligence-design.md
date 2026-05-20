# SIA — Universal-Level Human Understanding Architecture

**Date:** 2026-05-20
**Status:** Design — awaiting implementation plan
**Scope:** Full roadmap for AI Life Operating System + deep spec for Phase 1 (EI Engine + Multi-Mode Coaching + SIA Rebrand)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Audit](#2-current-state-audit)
3. [SIA Rebrand](#3-sia-rebrand)
4. [Phase 1: Emotional Intelligence Engine (Deep Spec)](#4-phase-1-emotional-intelligence-engine)
5. [Phase 1: Multi-Mode Coaching System (Deep Spec)](#5-phase-1-multi-mode-coaching-system)
6. [Phase 1: Confirmation + Clarity System (Deep Spec)](#6-phase-1-confirmation--clarity-system)
7. [Full Roadmap: Phases 2-8](#7-full-roadmap-phases-2-8)
8. [Architecture Decisions](#8-architecture-decisions)
9. [Integration Points](#9-integration-points)
10. [Testing Strategy](#10-testing-strategy)

---

## 1. Executive Summary

Transform Balencia from an AI health coaching platform into a full **AI Life Operating System** — a continuously evolving human intelligence system that understands, guides, optimizes, challenges, protects, and transforms every dimension of a user's life.

The AI coach is rebranded from "Cia" to **SIA** and evolves from assistant → coach → strategist → life companion.

**Architecture approach:** Layered Intelligence Pipeline — a separate EI analysis layer runs on every conversation turn, outputs a structured `EmotionalContext`, which drives a Persona Selector that auto-detects which of 10 coaching modes SIA should operate in. The user never sees mode switching. EI analysis is invisible, shaping responses silently, except for high-stakes moments where SIA confirms its interpretation.

**What already exists:** 217+ services, 143 database tables, 76 controllers, 1,369 React components, 42+ background jobs. 8 life domains, cross-pillar intelligence with 22 contradiction rules, voice calls with real-time transcription, 3D avatar, gamification, community features, and WHOOP/fitness integrations.

**What this adds:** Deep emotional intelligence, dynamic persona switching, 10-score life analytics, life-stage modeling, behavioral loop detection, domain deepening (career, relationships, finance psychology, spirituality), daily life OS flows, predictive interventions, and premium cinematic UX.

---

## 2. Current State Audit

### Architecture Summary

| Layer | Technology | Count |
|-------|-----------|-------|
| Backend | Express.js 5 + Node.js 20+ | 217+ services, 76 controllers |
| Frontend | Next.js 16 + React 19 | 1,369 .tsx components, 60+ pages |
| Database | PostgreSQL + pgvector | 143 tables |
| Cache | Redis + node-cache | Multi-tier |
| Jobs | BullMQ | 42+ workers |
| LLMs | Anthropic Claude, OpenAI, Google Gemini via LangChain/LangGraph | Multi-model |
| Voice | WebRTC + AssemblyAI | Real-time transcription |
| 3D | Three.js + React Three Fiber + Spline + @pixiv/three-vrm | Avatar rendering |

### Existing Capabilities vs. Vision

| Capability | Current State | Gap |
|-----------|--------------|-----|
| Emotional detection | Emotion detection (voice/text/facial), mood tracking, crisis detection | Needs tone-shift detection, emotional masking, contradiction ID, behavioral loop detection |
| Coaching personas | Static coaching style/intensity in user preferences | No dynamic switching, no auto-detection, no persona matrix |
| MCQ system | Phase-aware MCQ generator, life coach assessment | Needs adaptive "root cause narrowing" MCQ flows |
| Cross-domain intelligence | 22 contradiction rules, daily analysis, correlations | Needs more pattern types, predictive intelligence |
| Analytics scores | 6-component daily fitness score | Missing burnout, confidence, purpose alignment, social energy, 4 other scores |
| Memory | Evidence-based with decay, knowledge graph, wiki | Missing life-stage awareness, evolution timeline, long-term psychological model |
| Domain depth | 8 domains (Fitness, Nutrition strongest) | Career, Relationships, Spirituality need significant deepening |
| Daily life OS | Dashboard, scheduling, habits | Missing unified "today" view, "what next?" engine, morning/evening flows |
| Real-time context | Energy/mood/stress tracking | Missing time-of-day adaptation, dynamic rescheduling, predictive interventions |
| Premium UX | 3D avatar, knowledge graph viz, gamification | Missing cinematic transitions, mood heatmaps, SIA identity system |

### Key Service Files

| Service | Path | Relevance |
|---------|------|-----------|
| AI Coach Engine | `server/src/services/ai-coach/core/ai-coach.engine.ts` | Main orchestrator — entry point for coaching |
| LangGraph Chatbot | `server/src/services/langgraph-chatbot.service.ts` | State graph with tool calling — where persona directives are consumed |
| Conversation Insight Extractor | `server/src/services/conversation-insight-extractor.service.ts` | Per-turn analysis — extend for EI engine |
| Coach Persona Prompt | `server/src/services/coach-persona-prompt.service.ts` | Current prompt building — replace with dynamic persona system |
| User Coaching Profile | `server/src/services/user-coaching-profile.service.ts` | Emotional state, risk flags — extend for richer emotional model |
| Daily Analysis | `server/src/services/daily-analysis.service.ts` | Cross-domain insights — feed EI scores into this |
| Cross-Pillar Intelligence | `server/src/services/cross-pillar-intelligence.service.ts` | 22 contradiction rules — extend with behavioral patterns |
| Memory Engine | `server/src/services/memory-engine.service.ts` | Evidence-based memory — extend for long-term psychological model |
| Emotion Detection | `server/src/services/emotion-detection.service.ts` | Voice/text emotion detection — feed into EI engine |
| MCQ Generator | `server/src/services/ai-coach/assessment/mcq-generator.service.ts` | Dynamic MCQs — extend for confirmation flows |
| Crisis Detection | `server/src/services/crisis-detection.service.ts` | Safety guardrails — integrate with EI risk assessment |
| Comprehensive User Context | `server/src/services/comprehensive-user-context.service.ts` | Context aggregation — EI engine enrichment source |

---

## 3. SIA Rebrand

### Identity

| Attribute | Value |
|-----------|-------|
| Name | SIA |
| Full identity | SIA — Your Life Intelligence |
| Accent color | Warm amber `#D4A574` |
| Identity mark | Geometric form: compass + neural node + heartbeat. Breathes on 4-second cycle (2s inhale, 2s exhale) synced to resting breath rate |
| Voice personality | Warm, direct, emotionally intelligent — adapts per coaching mode |

### Rename Scope

| Area | Change |
|------|--------|
| UI labels | "Cia" → "SIA" in chat header, voice UI, notifications, settings |
| Prompt templates | All system prompts reference "SIA" identity |
| Email templates | Coach name in email content |
| Push notifications | Coach name in notification copy |
| Database | No table renames (risk). Add `coach_identity` metadata where needed |
| Avatar | "Arina" remains as the avatar name. SIA is the intelligence; Arina is the visual embodiment |
| Tagline | "Powered by Balencia. Always here to help" → "Powered by Balencia. Your life intelligence." |

### Brand Colors (from Production Bible)

| Token | Value | Usage |
|-------|-------|-------|
| `--sia-void` | `#000000` | True black for OLED |
| `--sia-surface` | `#0A0A0B` | Primary background |
| `--sia-elevated` | `#141416` | Cards, panels |
| `--sia-border` | `rgba(255,255,255,0.06)` | Glass edges |
| `--sia-text-primary` | `#F5F5F7` | Off-white (pure white banned) |
| `--sia-text-secondary` | `rgba(245,245,247,0.6)` | Supporting text |
| `--sia-accent` | `#D4A574` | SIA's warm amber signature |

### Domain Colors

| Domain | Hex | Character |
|--------|-----|-----------|
| Mental Wellbeing | `#8B5CF6` | Introspective, calm |
| Physical Health | `#10B981` | Alive, grounded |
| Career & Purpose | `#3B82F6` | Focused, ambitious |
| Relationships | `#F43F5E` | Connected, intimate |
| Financial Health | `#F59E0B` | Secure, abundant |
| Personal Growth | `#D97706` | Evolving, warm |
| Spiritual Life | `#6366F1` | Deep, expansive |
| Recreation | `#FB7185` | Joyful, energized |
| Physical Environment | `#6EE7B7` | Ordered, peaceful |
| Community | `#14B8A6` | Belonging, open |

Domain colors used at 60% saturation on dark backgrounds, 100% only for active/selected states.

---

## 4. Phase 1: Emotional Intelligence Engine

### Purpose

A per-turn analysis layer that detects emotional state, patterns, hidden intent, and behavioral signals from user input — outputting a structured `EmotionalContext` that drives persona selection, response tone, and intervention decisions.

### Architecture

```
User Message + Conversation History + External Signals
    ↓
┌──────────────────────────────────────────────────────┐
│  EI Analysis Layer (runs every turn)                 │
│                                                      │
│  Inputs:                                             │
│  - Current message text                              │
│  - Last 10 conversation turns                        │
│  - User's emotional baseline (from memory engine)    │
│  - Time of day, day of week                          │
│  - Recent sleep/energy/stress data (if available)    │
│  - Recent app engagement patterns                    │
│  - Memory engine: known triggers, patterns, cycles   │
│                                                      │
│  Processing:                                         │
│  1. Linguistic Tone Analysis                         │
│  2. Pattern Detection (cross-conversation)           │
│  3. Hidden State Detection                           │
│  4. Risk Assessment                                  │
│  5. Context Integration (external signals)           │
│  6. Needs Classification                             │
│                                                      │
│  Output: EmotionalContext                             │
└──────────────────────────────────────────────────────┘
    ↓
PersonaSelector → PersonaDirective → Response Generator
```

### EmotionalContext Interface

```typescript
interface EmotionalContext {
  // Primary emotional state
  primaryEmotion: EmotionCategory;
  secondaryEmotion?: EmotionCategory;
  emotionalIntensity: number;       // 0-100
  confidence: number;               // 0-1

  // Tone analysis
  toneMarkers: ToneMarker[];
  // Possible values: 'passive', 'deflecting', 'aggressive', 'flat',
  // 'warm', 'guarded', 'performative', 'desperate', 'resigned',
  // 'intellectualizing', 'minimizing', 'catastrophizing'

  // Deep analysis
  hiddenStates: HiddenState[];
  // Possible values: 'masking', 'suppressing', 'contradicting',
  // 'avoiding', 'dissociating', 'people_pleasing',
  // 'emotional_shutdown', 'hypervigilance'

  behavioralPatterns: BehavioralPattern[];
  // Each pattern includes: type, frequency, lastOccurrence, confidence
  // Types: 'self_sabotage_loop', 'avoidance_cycle', 'emotional_dependency',
  // 'perfectionism_paralysis', 'burnout_spiral', 'dopamine_seeking',
  // 'conflict_avoidance', 'overcommitment_pattern'

  // Risk assessment
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  riskFlags: RiskFlag[];
  // Integrates with existing crisis-detection.service.ts

  // Context enrichment (from external signals)
  energyEstimate: 'low' | 'moderate' | 'high';
  cognitiveLoad: 'light' | 'heavy' | 'overloaded';
  motivationState: 'seeking' | 'present' | 'declining' | 'absent';
  sleepQuality?: 'poor' | 'fair' | 'good';  // from WHOOP/manual logging
  recentStressLevel?: number;                 // 0-10, from last check-in

  // What the user needs right now
  needsEmpathy: boolean;
  needsChallenge: boolean;
  needsStructure: boolean;
  needsSilence: boolean;
  isAvoidingTruth: boolean;
  isSelfSabotaging: boolean;
  isEmotionallyOverwhelmed: boolean;

  // Temporal trajectory
  moodTrajectory: 'improving' | 'stable' | 'declining' | 'volatile';
  comparedToBaseline: 'above' | 'at' | 'below';

  // Conversation dynamics
  engagementLevel: 'high' | 'moderate' | 'low' | 'withdrawing';
  responseComplexity: 'expanding' | 'stable' | 'shrinking';
  // 'shrinking' = user giving shorter responses over time = possible shutdown
}

type EmotionCategory =
  | 'joy' | 'contentment' | 'excitement' | 'gratitude' | 'hope'
  | 'sadness' | 'grief' | 'loneliness' | 'emptiness'
  | 'anxiety' | 'worry' | 'panic' | 'overwhelm'
  | 'anger' | 'frustration' | 'resentment' | 'irritation'
  | 'fear' | 'insecurity' | 'vulnerability' | 'shame'
  | 'confusion' | 'numbness' | 'disconnection'
  | 'determination' | 'curiosity' | 'calm' | 'neutral';
```

### Detection Capabilities

| Signal | Detection Method | Linguistic Markers |
|--------|-----------------|-------------------|
| **Emotional masking** | Positive words + passive structure + low energy signals | "I'm fine," "it's whatever," "no big deal" + declining engagement metrics |
| **Self-sabotage loop** | Memory engine: 3+ goal-set → abandon cycles for same domain | Repeated pattern in conversation_claims + goal status history |
| **Avoidance** | Topic redirect detection — SIA raises topic A, user pivots to B | Intent classification mismatch between SIA's question and user's response |
| **Emotional shutdown** | Response complexity shrinking + neutral tone + engagement drop | Progressively shorter messages, fewer details, "yeah" / "ok" / "sure" |
| **Contradictions** | Stated emotion vs. behavioral signals from data | "I'm motivated" + 0 logged activities in 14 days |
| **Silent suffering** | No explicit distress but composite signal decline | Reduced engagement + worse sleep scores + skipped check-ins + lower mood logs |
| **Cognitive fatigue** | Time-of-day + decision density (from calendar/activity) + response quality | Late evening + heavy day + one-word answers |
| **Performative positivity** | Excessive positive framing + no vulnerability + high frequency | "Everything's great!" repeatedly + never mentions struggles |
| **Intellectualizing** | Analyzing feelings instead of feeling them | Third-person self-reference, clinical language about own emotions |
| **Catastrophizing** | Absolute language, worst-case framing | "always," "never," "everything is," "nothing works" |

### Implementation Strategy

Extend `conversation-insight-extractor.service.ts`:

1. **Add new extraction categories** to the existing structured output prompt:
   - `emotional_context` section with all EmotionalContext fields
   - The extractor already uses OpenAI for per-turn structured output — add EI fields to the schema

2. **Add cross-conversation pattern detection**:
   - Query memory engine for known patterns (last 30 days of emotional signals)
   - Compare current turn against baseline emotional profile
   - Detect trajectory (improving/declining/volatile)

3. **Add external signal integration**:
   - Pull latest WHOOP data (sleep, recovery, HRV) from `daily_health_metrics`
   - Pull latest mood/stress logs from `mood_logs` / `stress_logs`
   - Pull calendar density from scheduling data
   - Combine into context enrichment fields

4. **Create `emotional-intelligence.service.ts`**:
   - Orchestrates the full EI pipeline
   - Calls insight extractor with enhanced prompt
   - Merges with external signals
   - Computes derived fields (trajectory, baseline comparison, needs classification)
   - Returns `EmotionalContext`

### Data Storage

| Data | Storage | Purpose |
|------|---------|---------|
| Per-turn EmotionalContext | `intelligence` table (existing) with type `emotional_context` | Short-term context for persona selection |
| Emotional baseline | Memory engine with category `behavioral` | Long-term user emotional profile |
| Detected patterns | `conversation_claims` table with claim type `behavioral_pattern` | Pattern tracking over time |
| Risk events | Existing risk flag system in user coaching profile | Crisis tracking |

### Performance

- **Latency budget:** The EI analysis runs as part of the existing insight extraction (already ~1-2s). Adding EI fields to the same LLM call adds minimal latency.
- **Fallback:** If EI analysis fails or times out, default to a neutral EmotionalContext (doesn't block response generation).
- **Caching:** Cache external signal lookups (WHOOP data, mood logs) for 15 minutes to avoid repeated DB hits.

---

## 5. Phase 1: Multi-Mode Coaching System

### Persona Matrix

| # | Persona | Activation Signals | Tone | Behavioral Characteristics |
|---|---------|-------------------|------|---------------------------|
| 1 | **Deep Listener** | Grief, loss, heavy emotion, emotional shutdown detected | Ultra-soft, minimal, reflective | Asks few questions. Mirrors language. Creates space. Never rushes to solutions. Response length: minimal. |
| 2 | **Therapist** | Emotional complexity, identity confusion, trauma patterns, hidden states detected | Warm, exploratory, non-judgmental | Open-ended questions. Names emotions user hasn't. Validates before challenging. |
| 3 | **Calm Mentor** | Anxiety, overthinking, decision paralysis, cognitive overload | Steady, grounding, authoritative | Simplifies complexity. Offers frameworks. Reduces options to 2-3. Breathing metaphors. |
| 4 | **Strategic Advisor** | Career decisions, business strategy, financial planning, high motivation present | Sharp, structured, data-informed | Pros/cons. Decision matrices. Risk assessment. No hand-holding. |
| 5 | **Brutal Accountability** | Repeated avoidance, broken commitments, self-sabotage (3+ occurrences), low risk | Direct, confrontational (with care) | Names the pattern. Asks "what's really going on?" Doesn't accept deflection. |
| 6 | **Performance Coach** | Productivity context, deep work topics, execution mode, high energy | Energetic, focused, action-oriented | Time-blocks. Removes blockers. Measures output. Celebrates execution. |
| 7 | **Wellness Strategist** | Physical health topics, sleep issues, recovery, burnout indicators | Holistic, body-aware, preventive | Connects physical→mental. Prescribes recovery. References biometric data. |
| 8 | **Reflective Philosopher** | Existential questions, meaning, purpose, life direction, spiritual topics | Contemplative, Socratic, expansive | Deep questions. References philosophy. Doesn't prescribe answers. |
| 9 | **Emotional Recovery** | Post-crisis, after emotional breakdown, rebuilding phase | Gentle, rebuilding, future-oriented | Acknowledges what happened. Small steps. Rebuilds confidence gradually. |
| 10 | **Founder Advisor** | Startup stress, leadership isolation, high-stakes business decisions | Peer-level, experienced, pragmatic | "Been there" framing. Balances vision with execution reality. |

### PersonaDirective Interface

```typescript
interface PersonaDirective {
  primaryPersona: PersonaType;
  blendWeight: number;              // 0-1, how strongly to lean into primary
  secondaryPersona?: PersonaType;   // for blended responses
  secondaryWeight?: number;         // remaining weight

  // Behavioral parameters
  responseLength: 'minimal' | 'concise' | 'standard' | 'expansive';
  questionDensity: 'none' | 'one' | 'few';
  challengeLevel: number;           // 0-10
  warmthLevel: number;              // 0-10
  structureLevel: number;           // 0-10
  vulnerabilityTolerance: number;   // 0-10 (how much to push into uncomfortable territory)

  // Intervention triggers
  shouldConfirm: boolean;
  shouldUseMCQ: boolean;
  shouldEscalate: boolean;

  // Anti-patterns to avoid
  avoid: string[];
  // Examples: 'generic_motivation', 'toxic_positivity', 'unsolicited_advice',
  // 'premature_solutions', 'minimizing_feelings', 'cliches'

  // Prompt modifiers
  openingStyle: 'acknowledge_first' | 'question_first' | 'insight_first' | 'silence_then_speak';
  closingStyle: 'action_item' | 'reflection_prompt' | 'validation' | 'open_ended' | 'none';
}

type PersonaType =
  | 'deep_listener'
  | 'therapist'
  | 'calm_mentor'
  | 'strategic_advisor'
  | 'brutal_accountability'
  | 'performance_coach'
  | 'wellness_strategist'
  | 'reflective_philosopher'
  | 'emotional_recovery'
  | 'founder_advisor';
```

### Persona Selection Algorithm

```typescript
// Pseudocode for persona selection
function selectPersona(ctx: EmotionalContext, topic: TopicClassification): PersonaDirective {

  // Crisis override — always prioritize safety
  if (ctx.riskLevel === 'critical') {
    return crisisProtocol(); // existing crisis-detection flow
  }
  if (ctx.riskLevel === 'high') {
    return blend('emotional_recovery', 'therapist', 0.7);
  }

  // Emotional shutdown — go minimal
  if (ctx.hiddenStates.includes('emotional_shutdown')) {
    return persona('deep_listener', { responseLength: 'minimal', challengeLevel: 0, warmthLevel: 9 });
  }

  // Self-sabotage detected (3+ occurrences, not high risk)
  if (ctx.isSelfSabotaging && ctx.riskLevel <= 'low') {
    return persona('brutal_accountability', { challengeLevel: 8, warmthLevel: 4, shouldConfirm: true });
  }

  // Emotional complexity + hidden states
  if (ctx.hiddenStates.length >= 2 || ctx.primaryEmotion === 'shame') {
    return persona('therapist', { vulnerabilityTolerance: 7, shouldUseMCQ: true });
  }

  // Cognitive overload
  if (ctx.cognitiveLoad === 'overloaded') {
    return persona('calm_mentor', { responseLength: 'concise', structureLevel: 9, challengeLevel: 1 });
  }

  // Topic-based selection (when emotional state is moderate/stable)
  if (ctx.emotionalIntensity < 40) {
    if (topic.domain === 'career' && topic.subtype === 'strategy') {
      return persona('strategic_advisor', { structureLevel: 9 });
    }
    if (topic.domain === 'career' && topic.subtype === 'founder') {
      return persona('founder_advisor');
    }
    if (topic.domain === 'fitness' || topic.domain === 'health') {
      return persona('wellness_strategist');
    }
    if (topic.domain === 'productivity') {
      return persona('performance_coach', { responseLength: 'concise' });
    }
    if (topic.domain === 'spirituality' || topic.domain === 'meaning') {
      return persona('reflective_philosopher', { responseLength: 'expansive' });
    }
  }

  // Needs-based fallback
  if (ctx.needsEmpathy && !ctx.needsChallenge) {
    return persona('therapist', { warmthLevel: 8 });
  }
  if (ctx.needsChallenge && !ctx.needsEmpathy) {
    return persona('performance_coach', { challengeLevel: 7 });
  }
  if (ctx.needsEmpathy && ctx.needsChallenge) {
    return blend('therapist', 'brutal_accountability', 0.6);
  }
  if (ctx.needsStructure) {
    return persona('calm_mentor', { structureLevel: 9 });
  }

  // Default: Calm Mentor (safe, versatile)
  return persona('calm_mentor', { warmthLevel: 6, challengeLevel: 4 });
}
```

### Persona Blending Implementation

When `secondaryPersona` is set, the blend is applied at the **system prompt level**: the prompt includes language, tone markers, and behavioral constraints from both personas, weighted by their respective blend ratios. For a 60/40 Therapist/Accountability blend, the prompt opens with Therapist-style validation (empathy first), then transitions to Accountability-style directness (pattern naming, commitment request). The LLM receives explicit instructions like: "Lead with empathy and validation (60% of response energy), then shift to direct, pattern-naming accountability (40% of response energy)."

### Emotional Baseline Cold Start

For new users with insufficient data (<7 days of interaction), the EI engine uses a **neutral baseline**: `moodTrajectory: 'stable'`, `comparedToBaseline: 'at'`, all hidden states empty, default energy/cognitive estimates. After 7+ days of conversation data and mood logs, the memory engine computes a personalized baseline from the median emotional state across the user's history. The baseline is recalculated weekly by the existing `core-profile-calibration.job`.

### Transition Smoothing

| Rule | Behavior |
|------|----------|
| **Blend window** | Over 2-3 turns, blend weights shift gradually (max 30% change per turn) |
| **Anchor check** | If SIA has been in a persona for 10+ turns, max 20% shift per turn |
| **Escalation override** | Crisis detection bypasses smoothing (immediate shift) |
| **User signal override** | Explicit user requests ("push me harder", "I just need to vent") override auto-detection — these are detected by the EI engine's intent classification, not a UI control |
| **Session boundary** | New conversation session resets persona to default (Calm Mentor) unless emotional baseline suggests otherwise |

### Integration with Existing System

**Replace static coaching style:**
```
Before:  user_preferences.coaching_style → coach-persona-prompt.service.ts → static prompt modifier
After:   EmotionalContext → PersonaSelector → PersonaDirective → coach-persona-prompt.service.ts → dynamic prompt
```

**Create `persona-selector.service.ts`:**
- Consumes EmotionalContext from EI engine
- Applies selection algorithm
- Manages transition state (last 3 personas, blend history)
- Outputs PersonaDirective

**Modify `coach-persona-prompt.service.ts`:**
- Accept PersonaDirective instead of static coaching_style
- Build system prompt using persona-specific language, tone markers, and behavioral constraints
- Include `avoid[]` list in system prompt as explicit "never do" instructions

**Modify `langgraph-chatbot.service.ts`:**
- Add EI analysis node before response generation
- Pass PersonaDirective into response generation context
- Existing tool-calling flow unchanged

---

## 6. Phase 1: Confirmation + Clarity System

### High-Stakes Confirmation

**Triggers** (when `shouldConfirm === true`):
- Crisis risk moderate or higher
- Self-sabotage pattern identified (3+ occurrences of same loop)
- Life-stage transition suspected (signals from multiple domains shifting simultaneously)
- Emotional contradiction that could lead SIA down the wrong path (confidence < 0.5 on primary emotion)

**Format:** Natural therapeutic phrasing embedded in the response. Never clinical:

```
"It sounds like this is more emotional exhaustion than a lack of discipline. Does that feel accurate?"

Options: Yes / Partially / No / I'm not sure
```

**Response handling:**
- **Yes** → Proceed with current EmotionalContext, increase confidence for future similar patterns
- **Partially** → Ask one follow-up MCQ to narrow, then proceed
- **No** → Reset emotional analysis for this turn, ask what's actually going on
- **I'm not sure** → Stay in exploratory mode (Therapist persona), don't commit to a direction

### MCQ-Based Subtle Confirmation

**Triggers** (when `shouldUseMCQ === true`):
- User expresses vague distress ("I feel stuck", "something's off", "I don't know")
- EI engine has multiple competing hypotheses (top 2 emotions within 0.1 confidence)
- User needs help articulating what they're feeling

**Flow:**

1. EI engine generates 6-8 hypothesis options ranked by confidence
2. MCQ generator formats them as natural-language options
3. User selects one (or types custom)
4. Selected option refines EmotionalContext
5. Persona selector re-evaluates with refined context
6. Response generated with updated persona

**Example:**

```
User: "I feel stuck"

EI analysis hypotheses (internal, not shown):
  - emotional_exhaustion (0.35)
  - motivation_loss (0.25)
  - avoidance_behavior (0.20)
  - overwhelm (0.10)
  - disconnection (0.10)

SIA presents:
"What feels most accurate right now?"
  1. I feel mentally exhausted
  2. I've lost motivation
  3. I feel directionless
  4. I'm overwhelmed by responsibilities
  5. I'm emotionally drained
  6. I'm avoiding something important
  7. I feel disconnected from myself
  8. I don't fully understand what's wrong
```

Options are dynamically generated per-turn, not templates. The MCQ generator uses the EI engine's hypothesis ranking to order them.

### Feedback Loop

Both confirmation methods feed back into the EI engine's learning:
- **Correct interpretation** → increases weight for similar signal combinations in future
- **Wrong interpretation** → logged to memory engine as a "learned correction" for this user
- **"I'm not sure"** → no weight update, persona stays exploratory

Stored in memory engine with type `learned_rule` and category `emotional_calibration`.

---

## 7. Full Roadmap: Phases 2-8

### Phase 2: Advanced Analytics & Scoring

**Goal:** Expand from 6-component fitness score to 10 universal life scores with visualizations.

| Score | Computation Sources | Range |
|-------|-------------------|-------|
| **Mood Score** | Mood logs, EI engine primary emotion history, emotional check-in results | 0-100 |
| **Burnout Score** | Sleep quality + stress levels + work hours + recovery metrics + engagement decline | 0-100 (higher = more burned out) |
| **Recovery Score** | WHOOP recovery + sleep quality + rest day compliance + mental recovery | 0-100 |
| **Discipline Score** | Streak maintenance + plan adherence + commitment completion + consistency | 0-100 |
| **Focus Score** | Deep work duration + task completion + distraction reports + cognitive load | 0-100 |
| **Stress Score** | Stress logs + HRV trends + sleep disruption + calendar density | 0-100 (higher = more stressed) |
| **Emotional Stability** | Mood variance over 7 days + EI volatility metric + emotional shutdown frequency | 0-100 |
| **Social Energy** | Relationship interactions + community engagement + social check-in frequency | 0-100 |
| **Confidence Score** | Goal completion rate + self-reported confidence + challenge acceptance rate | 0-100 |
| **Purpose Alignment** | Life area satisfaction + values reflection frequency + goal-value alignment | 0-100 |

**Visualizations:**
- Radar chart showing all 10 scores (daily snapshot)
- Mood heatmap (calendar grid, color-coded by emotional state)
- Trend lines (30-day rolling average per score)
- Cross-domain correlation matrix (which scores affect which)
- Life Evolution Timeline (monthly milestones, growth markers)

**Implementation:** Extend `ai-scoring.service.ts` with new score calculators. Add new `daily-life-scores` table. Create scoring background job (extends existing `daily-scoring.job`).

### Phase 3: Deep Memory & Human Modeling

**Goal:** Build a long-term evolving psychological model for each user.

**New memory categories:**
- `life_stage` — Current life phase (detected from conversation patterns, age, life events)
- `core_values` — User's expressed and demonstrated values
- `fear_patterns` — Recurring fears and their triggers
- `growth_markers` — Evidence of personal growth over time
- `relationship_dynamics` — How user relates to key people in their life
- `decision_patterns` — How user makes decisions (impulsive, analytical, avoidant, collaborative)
- `energy_cycles` — Weekly/monthly energy patterns
- `trigger_map` — Known emotional triggers with context

**Life-Stage Detection:**
- Teen years / University / Early career / Established career / Career transition
- Single / Dating / Committed relationship / Marriage / Parenthood
- Financial building / Financial stability / Financial stress
- Health focus / Health crisis / Health maintenance
- Identity exploration / Identity clarity / Identity evolution

Life stage influences persona default weights and coaching framing.

**Behavioral Loop Detection Job:**
- New BullMQ job: runs weekly per user
- Scans conversation_claims + goal history + mood logs for repeating patterns
- Identifies self-defeating cycles (e.g., "sets ambitious goal → overcommits → burns out → abandons → guilt → sets another ambitious goal")
- Stores detected loops in memory engine with evidence chain
- EI engine references these loops for real-time detection

**Evolution Tracking:**
- Monthly "growth snapshot" computed from score trends + memory milestones
- "You've improved your emotional stability by 23% since February"
- Visualized as a timeline with key moments (first week streak, first hard conversation, first goal completed)

### Phase 4: Domain Deepening

**Goal:** Bring Career, Relationships, Financial Psychology, and Spirituality to the depth level of Fitness/Nutrition.

**Career Intelligence:**
- Founder psychology detection (isolation, decision fatigue, imposter syndrome)
- Leadership communication coaching
- Strategic thinking frameworks (2x2 matrices, MECE, first principles)
- Career transition support (role evaluation, skill gap analysis, networking strategy)
- Business decision support with structured analysis

**Relationship Intelligence:**
- Attachment style detection (secure, anxious, avoidant, disorganized) from conversation patterns
- Communication pattern analysis (criticism, contempt, defensiveness, stonewalling — Gottman's Four Horsemen)
- Boundary coaching (identify, articulate, maintain)
- Conflict analysis with structured reflection
- Emotional dependency detection and coaching

**Financial Psychology:**
- Money trauma detection (scarcity mindset, guilt spending, financial avoidance)
- Spending behavior pattern analysis (emotional spending triggers)
- Wealth habit coaching (automate savings, reduce decision fatigue)
- Financial stress early warning (from cross-domain signals)

**Spirituality & Purpose:**
- Purpose discovery guided flows (values clarification, ikigai framework)
- Existential crisis support (meaning-making without prescribing beliefs)
- Identity evolution tracking (who am I becoming?)
- Value-life alignment scoring (are your actions aligned with your stated values?)

Each domain gets: dedicated MCQ flows, domain-specific memory categories, cross-domain correlation rules, and persona tuning.

### Phase 5: Daily Life OS

**Goal:** SIA becomes the central operating system for daily life management.

**"What Next?" Engine:**
- Cross-domain priority algorithm: considers all 10 scores, time of day, energy level, calendar, and pending tasks
- Returns top 3 recommended actions with reasoning
- Example: "Your burnout score is trending up and you skipped yesterday's meditation. Start with 10 minutes of breathing before your first meeting."

**Morning Planning Flow:**
- Triggered daily (or on first app open)
- SIA presents: yesterday's summary → today's schedule → 3 recommended priorities → energy forecast
- User confirms or adjusts priorities
- Plan locked and tracked throughout day

**Evening Reflection Flow:**
- Triggered in evening (configurable time)
- SIA presents: what was accomplished → one reflection question → mood check → tomorrow preview
- Quick, 2-3 minute flow — not a journal (unless user wants to expand)

**Dynamic Rescheduling:**
- If mood/energy signals shift mid-day, SIA proactively offers to replan
- "Your stress score spiked after that meeting. Want me to move your workout to tomorrow and replace it with a recovery session?"

**Energy-Based Scheduling:**
- Map user's personal energy curve (learned from patterns over 2+ weeks)
- Suggest high-cognitive tasks during peak energy, low-friction tasks during dips
- Integrate with calendar data for smart scheduling

### Phase 6: Real-Time Contextual Intelligence

**Goal:** Every SIA response feels context-aware and alive.

**Time-of-Day Adaptation:**
- Morning: energizing, forward-looking, planning-oriented
- Afternoon: focused, productivity-aligned, check-in style
- Evening: reflective, winding-down, gentler
- Late night: extra gentle, sleep-encouraging, shorter responses

**Contextual Signal Fusion:**
- Merge: sleep quality (last night) + calendar density (today) + mood trajectory (last 3 entries) + wearable data (current HRV/recovery) + conversation engagement level
- Output: real-time "user state vector" that modulates all SIA responses

**Predictive Interventions:**
- Based on weekly patterns: "Tomorrow is usually your lowest-energy day. I've front-loaded your priorities for today."
- Based on behavioral patterns: "You tend to skip workouts after late meetings. Your calendar shows a 7pm meeting tomorrow — want me to reschedule your morning workout?"

**Proactive Life Optimization:**
- SIA-initiated conversations when pattern signals suggest intervention
- Extends existing proactive messaging (18+ types) with EI-driven triggers
- Example: 3 days of declining mood + reduced engagement → SIA sends: "Hey, I noticed things have been quieter than usual. Just checking in — no agenda. How are you actually doing?"

### Phase 7: Premium Cinematic UX

**Goal:** The app feels luxury, intelligent, emotionally immersive.

**Cinematic Landing Experience:**
- Interactive onboarding based on the 5-act story frame document
- Frame 1: Constellation animation (10 life domain orbs)
- Frame 2: SIA introduction with typographic choreography
- Frame 3: Three guided questions (domain selection, vision setting, coaching intensity)
- Frame 4: 12-week plan generation with cross-domain intelligence reveal
- Frame 5: Today Screen arrival with SIA's presence

**SIA Identity System (Client):**
- Breathing identity mark (4s cycle CSS/Framer Motion animation)
- Ambient glow behind SIA's chat area using domain-specific colors
- Dark glass material language throughout (`backdrop-filter: blur(40px)`)
- Domain color system at 60%/100% saturation states

**Animation System:**
- Spring physics: `stiffness: 200, damping: 20, mass: 1`
- Ease curve: `cubic-bezier(0.16, 1, 0.3, 1)`
- Micro animations: 150-200ms, Standard: 300-500ms, Macro: 800-1200ms
- Stagger: 80-120ms between siblings
- No bounce. No elastic overshoot >15%. No linear motion on UI.

**Today Screen Redesign:**
- SIA greeting zone (full-width, breathing mark, contextual message)
- 3 action cards with domain color accents and time badges
- Intelligence teaser card ("As we learn together, I'll start connecting dots...")
- Locked insight slots (retention hooks for deeper analysis features)
- Integration offer (non-intrusive, 40% opacity)

### Phase 8: Multi-Mode UX (Voice + Avatar)

**Goal:** SIA speaks, animates, and analyzes voice emotion.

**Avatar TTS Integration:**
- ElevenLabs TTS primary (or Google Cloud TTS as fallback)
- Voice selection per persona (warmer voice for Therapist, crisper for Strategic Advisor)
- Streaming TTS for low-latency response
- Voice cadence adapts to persona (slower for Deep Listener, energetic for Performance Coach)

**Avatar Lip-Sync:**
- Audio → viseme extraction → VRM blend shape animation
- Extend existing @pixiv/three-vrm integration
- Arina avatar lip-syncs in real-time with TTS output
- Emotional expressions mapped from EmotionalContext (SIA's expression mirrors the appropriate coaching persona)

**Voice Emotion Analysis:**
- Extend AssemblyAI integration with audio tone analysis
- Voice pitch, pace, volume → additional signals for EI engine
- Detects: trembling, flat affect, forced cheerfulness, sighing, long pauses

**Immersive Voice Sessions:**
- Full coaching session in voice with avatar visualization
- SIA speaks responses instead of typing
- User speaks, real-time transcription + emotion analysis
- Post-session summary with emotional journey map

---

## 8. Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| EI architecture | Layered Pipeline (separate analysis layer) | Independently testable, reusable across chat/notifications/analytics, auditable for mental health product |
| Persona switching | Auto-detect only (no manual mode selector) | Seamless user experience, SIA should feel like one entity adapting, not a mode-switching tool |
| EI visibility | Invisible (shapes responses silently) | Users should feel understood, not analyzed. Exception: high-stakes confirmation for safety |
| Confirmation approach | High-stakes explicit + MCQ for subtle validation | Safety for critical moments, natural flow for exploration |
| Persona transitions | Gradual blending over 2-3 turns | Prevents jarring personality shifts |
| Score expansion | 10 universal scores (extend existing 6) | Covers all life dimensions without overwhelming |
| Memory expansion | New categories in existing memory engine | Reuses evidence-based decay system |
| Branding | Cia → SIA (intelligence name), Arina stays (avatar name) | Separate intelligence identity from visual embodiment |

---

## 9. Integration Points

### Phase 1 Service Dependencies

```
                    ┌─────────────────────┐
                    │   User Message       │
                    └─────────┬───────────┘
                              ↓
┌─────────────────────────────────────────────────────┐
│  conversation-insight-extractor.service.ts           │
│  (EXTEND: add EI extraction categories)              │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  emotional-intelligence.service.ts (NEW)             │
│  Orchestrates EI pipeline                            │
│                                                      │
│  Reads from:                                         │
│  - memory-engine.service.ts (patterns, baselines)    │
│  - daily-health-metrics (sleep, HRV, recovery)       │
│  - mood_logs, stress_logs (recent entries)            │
│  - comprehensive-user-context.service.ts (aggregated)│
│  - crisis-detection.service.ts (risk assessment)     │
│                                                      │
│  Outputs: EmotionalContext                            │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  persona-selector.service.ts (NEW)                   │
│  Applies selection algorithm + transition smoothing   │
│                                                      │
│  Reads from:                                         │
│  - EmotionalContext (current turn)                    │
│  - life-area-intent-router.service.ts (topic)        │
│  - Previous PersonaDirectives (transition history)   │
│                                                      │
│  Outputs: PersonaDirective                            │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  coach-persona-prompt.service.ts (MODIFY)            │
│  Accepts PersonaDirective instead of static style    │
│  Builds dynamic system prompt with persona-specific  │
│  language, tone, constraints, and avoid list          │
└─────────────────────┬───────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  langgraph-chatbot.service.ts (MODIFY)               │
│  Add EI analysis node before response generation     │
│  Pass PersonaDirective into response context         │
└─────────────────────────────────────────────────────┘
```

### Files to Create (Phase 1)

| File | Purpose |
|------|---------|
| `server/src/services/emotional-intelligence.service.ts` | EI pipeline orchestrator |
| `server/src/services/persona-selector.service.ts` | Persona selection + transition management |
| `server/src/types/emotional-intelligence.types.ts` | EmotionalContext, PersonaDirective, enums |
| `server/tests/unit/services/emotional-intelligence.service.test.ts` | EI engine unit tests |
| `server/tests/unit/services/persona-selector.service.test.ts` | Persona selection unit tests |

### Files to Modify (Phase 1)

| File | Change |
|------|--------|
| `server/src/services/conversation-insight-extractor.service.ts` | Add EI extraction categories to structured output |
| `server/src/services/coach-persona-prompt.service.ts` | Accept PersonaDirective, build dynamic prompts |
| `server/src/services/langgraph-chatbot.service.ts` | Add EI analysis node, pass PersonaDirective |
| `server/src/services/user-coaching-profile.service.ts` | Store EmotionalContext history, baseline tracking |
| Client UI files | Cia → SIA renaming |
| Prompt templates | Cia → SIA identity |

---

## 10. Testing Strategy

### Unit Tests

| Service | Test Focus |
|---------|-----------|
| `emotional-intelligence.service.ts` | Given specific message + context → correct EmotionalContext output |
| `persona-selector.service.ts` | Given EmotionalContext → correct PersonaDirective. Transition smoothing. Edge cases. |
| Confirmation triggers | Given EmotionalContext with various risk levels → correct shouldConfirm/shouldUseMCQ |
| MCQ hypothesis generation | Given EI hypotheses → correctly formatted MCQ options |

**Key test scenarios for EI engine:**
1. "I'm fine" + declining engagement metrics → detects emotional masking
2. User sets same goal for 4th time → detects self-sabotage loop
3. SIA asks about relationships, user talks about work → detects avoidance
4. Increasingly short responses over 5 turns → detects emotional shutdown
5. "I'm motivated" + 0 activity in 14 days → detects contradiction
6. Late night + heavy calendar + one-word answers → detects cognitive fatigue

**Key test scenarios for Persona Selector:**
1. Emotional shutdown → Deep Listener (minimal, warmth: 9)
2. Self-sabotage + low risk → Brutal Accountability
3. Career strategy + high motivation → Strategic Advisor
4. Needs empathy AND challenge → Therapist/Accountability blend
5. Crisis risk high → Emotional Recovery (escalation override)
6. Persona transition: Therapist for 10 turns → max 20% shift per turn

### Integration Tests

| Flow | Test |
|------|------|
| Full pipeline | Message → EI analysis → Persona selection → Prompt building → Response generation |
| Confirmation flow | High-stakes trigger → Confirmation presented → User responds → Context updated |
| MCQ flow | Vague user input → MCQ generated from EI hypotheses → User selects → Refined response |
| Transition smoothing | Sequence of messages that should trigger gradual persona shift |
| Fallback | EI analysis times out → Neutral EmotionalContext → Default persona → Response still generated |

### Acceptance Criteria

- [ ] SIA correctly identifies emotional masking in >80% of test scenarios
- [ ] Persona transitions feel natural (no jarring shifts reported in user testing)
- [ ] Response latency increase <500ms from adding EI analysis
- [ ] Crisis detection still triggers within 1 turn (no regression)
- [ ] Confirmation flows appear only for genuine high-stakes moments (not over-triggering)
- [ ] MCQ options feel natural and helpful (not clinical or survey-like)
- [ ] All existing coaching functionality continues to work (no regression)
- [ ] SIA branding consistent across all UI touchpoints
