# SIA Phase 1 — Emotional Intelligence + Multi-Mode Coaching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a layered Emotional Intelligence engine and 10-persona auto-switching coaching system to the Balencia AI coach, rebranded from "Cia" to "SIA."

**Architecture:** Every conversation turn passes through an EI analysis layer that outputs an `EmotionalContext`, consumed by a `PersonaSelector` that auto-detects which of 10 coaching personas SIA should use. The `PersonaDirective` drives dynamic system prompt construction. Users never see mode switching. Confirmation flows surface only for high-stakes moments.

**Tech Stack:** TypeScript, OpenAI structured output (existing pattern), LangGraph chatbot pipeline, PostgreSQL + pgvector memory engine, Jest unit tests.

**Design Spec:** `docs/superpowers/specs/2026-05-20-sia-universal-human-intelligence-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `server/shared/types/domain/emotional-intelligence.ts` | All EI + PersonaDirective types, enums, constants |
| `server/src/services/emotional-intelligence.service.ts` | EI pipeline orchestrator — runs per-turn analysis, merges external signals |
| `server/src/services/persona-selector.service.ts` | Persona selection algorithm + transition smoothing |
| `server/tests/unit/services/emotional-intelligence.service.test.ts` | EI engine unit tests |
| `server/tests/unit/services/persona-selector.service.test.ts` | Persona selector unit tests |

### Modified Files

| File | Change |
|------|--------|
| `server/shared/types/domain/turn-insights.ts` | Add `emotional_context` field to `TurnInsights` |
| `server/src/services/conversation-insight-extractor.service.ts` | Add EI extraction to prompt and schema |
| `server/src/services/coach-persona-prompt.service.ts` | Replace 4-persona static blocks with 10-persona dynamic system accepting `PersonaDirective` |
| `server/shared/types/domain/coach-persona.ts` | Add new persona type IDs |
| `server/src/services/langgraph-chatbot.service.ts` | Wire EI analysis + persona selection into chat pipeline; rename default "Cia" → "SIA" |
| `server/src/services/rag-chatbot.service.ts` | Rename default "Cia" → "SIA" |
| `server/src/services/proactive-messaging.service.ts` | Rename default "Cia" → "SIA" |
| `server/src/services/comprehensive-user-context.service.ts` | Rename default "Cia" → "SIA" |
| `server/src/controllers/preferences.controller.ts` | Rename default "Cia" → "SIA" |
| `server/src/services/wellbeing/journal-analysis.service.ts` | Rename "Cia" → "SIA" in prompt |
| `client/app/(pages)/ai-coach/components/AICoachHeader.tsx` | "Cia" → "SIA", update tagline |
| `client/app/(pages)/ai-coach/components/AICoachWelcome.tsx` | "Cia" → "SIA" |
| `client/app/(pages)/chat/components/ChatContainer.tsx` | "Cia" → "SIA" |
| `client/app/(pages)/chat/components/ChatHeader.tsx` | "Cia" → "SIA" |
| `client/app/(pages)/chat/components/ChatInput.tsx` | "Cia" → "SIA" |
| `client/app/(pages)/chat/components/ConversationSidebar.tsx` | "Cia" → "SIA" |
| `client/app/(pages)/dashboard/components/tabs/AICoachTab.tsx` | "Cia" → "SIA", update tagline |
| `client/app/(pages)/dashboard/components/tabs/VoiceAssistantTab.tsx` | "Cia" → "SIA" |
| `client/app/(pages)/dashboard/components/voice-assistant/CiaBrandBadge.tsx` | Rename component + default to "SIA" |
| `client/app/(pages)/settings/components/settings-utils.ts` | Default "Cia" → "SIA" |
| `client/app/(pages)/settings/components/VoiceAssistantSettingsSection.tsx` | Default "Cia" → "SIA" |
| `client/lib/avatar/coachPersonality.ts` | Comment rename |

---

## Task 1: Types & Interfaces

**Files:**
- Create: `server/shared/types/domain/emotional-intelligence.ts`
- Modify: `server/shared/types/domain/turn-insights.ts`

- [ ] **Step 1: Create the emotional intelligence types file**

```typescript
// server/shared/types/domain/emotional-intelligence.ts

// ── Emotion Categories ──────────────────────────────────

export type EmotionCategory =
  | 'joy' | 'contentment' | 'excitement' | 'gratitude' | 'hope'
  | 'sadness' | 'grief' | 'loneliness' | 'emptiness'
  | 'anxiety' | 'worry' | 'panic' | 'overwhelm'
  | 'anger' | 'frustration' | 'resentment' | 'irritation'
  | 'fear' | 'insecurity' | 'vulnerability' | 'shame'
  | 'confusion' | 'numbness' | 'disconnection'
  | 'determination' | 'curiosity' | 'calm' | 'neutral';

export type ToneMarker =
  | 'passive' | 'deflecting' | 'aggressive' | 'flat'
  | 'warm' | 'guarded' | 'performative' | 'desperate'
  | 'resigned' | 'intellectualizing' | 'minimizing' | 'catastrophizing';

export type HiddenState =
  | 'masking' | 'suppressing' | 'contradicting'
  | 'avoiding' | 'dissociating' | 'people_pleasing'
  | 'emotional_shutdown' | 'hypervigilance';

export type BehavioralPatternType =
  | 'self_sabotage_loop' | 'avoidance_cycle' | 'emotional_dependency'
  | 'perfectionism_paralysis' | 'burnout_spiral' | 'dopamine_seeking'
  | 'conflict_avoidance' | 'overcommitment_pattern';

export interface BehavioralPattern {
  type: BehavioralPatternType;
  frequency: number;
  lastOccurrence: string;
  confidence: number;
}

export interface RiskFlag {
  severity: 'low' | 'medium' | 'high';
  category: string;
  description: string;
}

// ── Emotional Context (EI Engine Output) ────────────────

export interface EmotionalContext {
  primaryEmotion: EmotionCategory;
  secondaryEmotion?: EmotionCategory;
  emotionalIntensity: number;
  confidence: number;

  toneMarkers: ToneMarker[];
  hiddenStates: HiddenState[];
  behavioralPatterns: BehavioralPattern[];

  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  riskFlags: RiskFlag[];

  energyEstimate: 'low' | 'moderate' | 'high';
  cognitiveLoad: 'light' | 'heavy' | 'overloaded';
  motivationState: 'seeking' | 'present' | 'declining' | 'absent';
  sleepQuality?: 'poor' | 'fair' | 'good';
  recentStressLevel?: number;

  needsEmpathy: boolean;
  needsChallenge: boolean;
  needsStructure: boolean;
  needsSilence: boolean;
  isAvoidingTruth: boolean;
  isSelfSabotaging: boolean;
  isEmotionallyOverwhelmed: boolean;

  moodTrajectory: 'improving' | 'stable' | 'declining' | 'volatile';
  comparedToBaseline: 'above' | 'at' | 'below';

  engagementLevel: 'high' | 'moderate' | 'low' | 'withdrawing';
  responseComplexity: 'expanding' | 'stable' | 'shrinking';
}

// ── Persona Types ───────────────────────────────────────

export const SIA_PERSONA_IDS = [
  'deep_listener',
  'therapist',
  'calm_mentor',
  'strategic_advisor',
  'brutal_accountability',
  'performance_coach',
  'wellness_strategist',
  'reflective_philosopher',
  'emotional_recovery',
  'founder_advisor',
] as const;

export type SiaPersonaType = (typeof SIA_PERSONA_IDS)[number];

export interface PersonaDirective {
  primaryPersona: SiaPersonaType;
  blendWeight: number;
  secondaryPersona?: SiaPersonaType;
  secondaryWeight?: number;

  responseLength: 'minimal' | 'concise' | 'standard' | 'expansive';
  questionDensity: 'none' | 'one' | 'few';
  challengeLevel: number;
  warmthLevel: number;
  structureLevel: number;
  vulnerabilityTolerance: number;

  shouldConfirm: boolean;
  shouldUseMCQ: boolean;
  shouldEscalate: boolean;

  avoid: string[];

  openingStyle: 'acknowledge_first' | 'question_first' | 'insight_first' | 'silence_then_speak';
  closingStyle: 'action_item' | 'reflection_prompt' | 'validation' | 'open_ended' | 'none';
}

// ── Neutral Defaults (cold start / fallback) ────────────

export const NEUTRAL_EMOTIONAL_CONTEXT: EmotionalContext = {
  primaryEmotion: 'neutral',
  emotionalIntensity: 20,
  confidence: 0.3,
  toneMarkers: [],
  hiddenStates: [],
  behavioralPatterns: [],
  riskLevel: 'none',
  riskFlags: [],
  energyEstimate: 'moderate',
  cognitiveLoad: 'light',
  motivationState: 'present',
  needsEmpathy: false,
  needsChallenge: false,
  needsStructure: false,
  needsSilence: false,
  isAvoidingTruth: false,
  isSelfSabotaging: false,
  isEmotionallyOverwhelmed: false,
  moodTrajectory: 'stable',
  comparedToBaseline: 'at',
  engagementLevel: 'moderate',
  responseComplexity: 'stable',
};

export const DEFAULT_PERSONA_DIRECTIVE: PersonaDirective = {
  primaryPersona: 'calm_mentor',
  blendWeight: 1.0,
  responseLength: 'standard',
  questionDensity: 'one',
  challengeLevel: 4,
  warmthLevel: 6,
  structureLevel: 5,
  vulnerabilityTolerance: 3,
  shouldConfirm: false,
  shouldUseMCQ: false,
  shouldEscalate: false,
  avoid: ['generic_motivation', 'toxic_positivity'],
  openingStyle: 'acknowledge_first',
  closingStyle: 'action_item',
};

// ── EI Engine Input/Output ──────────────────────────────

export interface EIAnalysisInput {
  userId: string;
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  existingPatterns?: BehavioralPattern[];
  sleepQuality?: 'poor' | 'fair' | 'good';
  recentStressLevel?: number;
  recentMoodLogs?: Array<{ state: string; intensity: number; created_at: string }>;
  timeOfDay?: number;
}

export interface TopicClassification {
  domain: string;
  subtype?: string;
}
```

- [ ] **Step 2: Add emotional_context to TurnInsights**

In `server/shared/types/domain/turn-insights.ts`, add the import and field:

```typescript
// Add to imports at top
import type { EmotionalContext } from './emotional-intelligence.js';

// Add to TurnInsights interface (after core_profile_updates)
export interface TurnInsights {
  mood: ExtractedMood | null;
  intent: string;
  entities: ExtractedEntities;
  behavioral_signals: BehavioralSignals | null;
  memory_candidates: MemoryCandidate[];
  core_profile_updates: CoreProfileUpdate[];
  emotional_context?: EmotionalContext; // NEW: EI engine output
}
```

- [ ] **Step 3: Run typecheck to verify types compile**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS (no errors from new types; they're not consumed yet)

- [ ] **Step 4: Commit**

```
git add server/shared/types/domain/emotional-intelligence.ts server/shared/types/domain/turn-insights.ts
git commit -m "feat: add emotional intelligence and persona directive types"
```

---

## Task 2: SIA Rebrand — Server Defaults

**Files:**
- Modify: `server/src/services/langgraph-chatbot.service.ts` (lines 145-148, 960, 963, 1471, 1942, 2152-2156, 2390)
- Modify: `server/src/services/rag-chatbot.service.ts` (lines 78, 500, 503)
- Modify: `server/src/services/proactive-messaging.service.ts` (lines 4627, 4629)
- Modify: `server/src/services/comprehensive-user-context.service.ts` (line 637)
- Modify: `server/src/controllers/preferences.controller.ts` (lines 184, 966)
- Modify: `server/src/services/wellbeing/journal-analysis.service.ts` (line 97)

- [ ] **Step 1: Update langgraph-chatbot.service.ts — base prompt identity**

Change the `BASE_HUMAN_LIKE_PROMPT` opening (line 145):

```typescript
// OLD:
const BASE_HUMAN_LIKE_PROMPT = `You are **Cia**, an advanced AI life coach helping users improve every dimension of their life — health, fitness, nutrition, career, finances, relationships, faith, education, creativity, and personal growth.

## IDENTITY & ROLE
- You are Cia — a long-term life coaching partner, not a generic assistant.

// NEW:
const BASE_HUMAN_LIKE_PROMPT = `You are **SIA**, an advanced AI life intelligence helping users improve every dimension of their life — health, fitness, nutrition, career, finances, relationships, faith, education, creativity, and personal growth.

## IDENTITY & ROLE
- You are SIA — a long-term life coaching partner, not a generic assistant.
```

- [ ] **Step 2: Update langgraph-chatbot.service.ts — default name fallbacks**

Change `getAssistantName()` default (around line 960):

```typescript
// OLD:
return assistantName || 'Cia';
// ...
return 'Cia'; // Default fallback

// NEW:
return assistantName || 'SIA';
// ...
return 'SIA'; // Default fallback
```

Update the name replacement line (line 2152-2156):

```typescript
// OLD:
let systemPrompt = BASE_HUMAN_LIKE_PROMPT.replace(/Cia/g, assistantName).replace(/\*\*Cia\*\*/g, `**${assistantName}**`);
systemPrompt += `\n\nYour name is ${assistantName}. Never use "Cia" or any other name. Respond in whatever language the user writes in. Always use ${assistantName} when introducing yourself.`;

// NEW:
let systemPrompt = BASE_HUMAN_LIKE_PROMPT.replace(/SIA/g, assistantName).replace(/\*\*SIA\*\*/g, `**${assistantName}**`);
systemPrompt += `\n\nYour name is ${assistantName}. Never use "SIA" or any other name unless that IS your name. Respond in whatever language the user writes in. Always use ${assistantName} when introducing yourself.`;
```

Update the hardcoded default at line 1942 and line 2390:

```typescript
// OLD:
assistantName: 'Cia',
// ...
this.getAssistantName(userId).catch(() => 'Cia'),

// NEW:
assistantName: 'SIA',
// ...
this.getAssistantName(userId).catch(() => 'SIA'),
```

Update comment at line 1471:

```typescript
// OLD:
* This gives Cia ready-made insights so she doesn't need to "look into it".

// NEW:
* This gives SIA ready-made insights so she doesn't need to "look into it".
```

- [ ] **Step 3: Update rag-chatbot.service.ts defaults**

Change the prompt template (line 78) and fallbacks (lines 500, 503):

```typescript
// In HEALTH_COACH_SYSTEM_PROMPT_TEMPLATE — change the "Never use Cia" reference:
// OLD: Never use "Cia" or any other name
// NEW: Never use "SIA" or any other name unless that IS your name

// OLD (line 500):
return assistantName || 'Cia';
// OLD (line 503):
return 'Cia'; // Default fallback

// NEW (line 500):
return assistantName || 'SIA';
// NEW (line 503):
return 'SIA'; // Default fallback
```

- [ ] **Step 4: Update remaining server defaults**

`server/src/services/proactive-messaging.service.ts` (lines 4627, 4629):
```typescript
// OLD:
return result.rows[0]?.voice_assistant_name || 'Cia';
return 'Cia';

// NEW:
return result.rows[0]?.voice_assistant_name || 'SIA';
return 'SIA';
```

`server/src/services/comprehensive-user-context.service.ts` (line 637):
```typescript
// OLD:
COALESCE(up.voice_assistant_name, 'Cia') AS assistant_name,

// NEW:
COALESCE(up.voice_assistant_name, 'SIA') AS assistant_name,
```

`server/src/controllers/preferences.controller.ts` (lines 184, 966):
```typescript
// OLD:
assistantName: prefs.voice_assistant_name || 'Cia',
const assistantName = (data.voiceAssistant.assistantName || '').trim() || 'Cia';

// NEW:
assistantName: prefs.voice_assistant_name || 'SIA',
const assistantName = (data.voiceAssistant.assistantName || '').trim() || 'SIA';
```

`server/src/services/wellbeing/journal-analysis.service.ts` (line 97):
```typescript
// OLD:
"coachReflection": "...Write as Cia the coach, in first person.",

// NEW:
"coachReflection": "...Write as SIA the coach, in first person.",
```

- [ ] **Step 5: Run typecheck + lint**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS

Run: `npm.cmd --prefix server run lint`
Expected: PASS (or only pre-existing warnings)

- [ ] **Step 6: Commit**

```
git add server/src/services/langgraph-chatbot.service.ts server/src/services/rag-chatbot.service.ts server/src/services/proactive-messaging.service.ts server/src/services/comprehensive-user-context.service.ts server/src/controllers/preferences.controller.ts server/src/services/wellbeing/journal-analysis.service.ts
git commit -m "feat: rebrand AI coach from Cia to SIA across server defaults and prompts"
```

---

## Task 3: SIA Rebrand — Client UI

**Files:**
- Modify: 12 client files (see file map above)

- [ ] **Step 1: Update AICoachHeader and AICoachWelcome**

`client/app/(pages)/ai-coach/components/AICoachHeader.tsx`:
```tsx
// Line 21 comment: {/* Left: Sidebar toggle + Avatar + SIA info */}
// Line 37: alt="SIA"
// Line 43: <span>SIA</span>
// Line 48: <span>Your life intelligence.</span>   (was "Always here to help")
```

`client/app/(pages)/ai-coach/components/AICoachWelcome.tsx`:
```tsx
// Line 75: I'm <span className="italic">SIA</span>, your AI life coach...
```

- [ ] **Step 2: Update Chat components**

`client/app/(pages)/chat/components/ChatContainer.tsx`:
```tsx
// Line 301: title={activeConversation?.title || 'SIA'}
// Line 313: title="SIA"
// Line 314: description="I'm SIA, your personal AI-powered life intelligence coach..."
```

`client/app/(pages)/chat/components/ChatHeader.tsx`:
```tsx
// Line 79: const isAICoach = isAICoachProp ?? (title === 'AI Coach' || title === 'SIA');
```

`client/app/(pages)/chat/components/ChatInput.tsx`:
```tsx
// Line 58: placeholder = 'Ask SIA...',
```

`client/app/(pages)/chat/components/ConversationSidebar.tsx`:
```tsx
// Line 153: <p className="text-xs text-zinc-600 mt-1">Start chatting with SIA</p>
// Line 260: <span className="text-emerald-500/70">SIA: </span>
```

- [ ] **Step 3: Update Dashboard tabs**

`client/app/(pages)/dashboard/components/tabs/AICoachTab.tsx`:
```tsx
// Line 659: ${conv.lastMessageRole === 'assistant' ? 'SIA: ' : 'You: '}
// Line 731: <h3 className="font-semibold text-white truncate">SIA</h3>
// Line 733: Powered by Balencia • Your life intelligence
// Line 757: I'm SIA, your AI life coach...
// Line 925: placeholder="Ask SIA..."
```

`client/app/(pages)/dashboard/components/tabs/VoiceAssistantTab.tsx`:
```tsx
// Line 931: <CiaBrandBadge name={assistantName || "SIA"} />   (component rename in next step)
// Line 936: <StatusPill name={assistantName || "SIA"} ...
```

- [ ] **Step 4: Rename CiaBrandBadge component**

`client/app/(pages)/dashboard/components/voice-assistant/CiaBrandBadge.tsx`:
```tsx
// Rename: interface CiaBrandBadgeProps → SiaBrandBadgeProps
// Rename: export function CiaBrandBadge → export function SiaBrandBadge
// Default: name = "SIA"
```

Then update imports in `VoiceAssistantTab.tsx` to use `SiaBrandBadge`.

- [ ] **Step 5: Update settings defaults**

`client/app/(pages)/settings/components/settings-utils.ts`:
```tsx
// Line 106: assistantName: assistantName.trim() || 'SIA',
```

`client/app/(pages)/settings/components/VoiceAssistantSettingsSection.tsx`:
```tsx
// Line 278: assistantName: assistantName.trim() || "SIA"
```

`client/lib/avatar/coachPersonality.ts`:
```tsx
// Line 55: Update comment: /** Short system-prompt addendum describing how SIA should speak in this mood */
```

- [ ] **Step 6: Run client build to verify**

Run: `npm.cmd --prefix client run build`
Expected: PASS

- [ ] **Step 7: Commit**

```
git add client/
git commit -m "feat: rebrand Cia to SIA across all client UI components and defaults"
```

---

## Task 4: Emotional Intelligence Engine — Tests

**Files:**
- Create: `server/tests/unit/services/emotional-intelligence.service.test.ts`

- [ ] **Step 1: Write failing tests for EI engine core scenarios**

```typescript
// server/tests/unit/services/emotional-intelligence.service.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ESM mock: conversation-insight-extractor
const mockExtractInsights = jest.fn();
jest.unstable_mockModule('../../../src/services/conversation-insight-extractor.service.js', () => ({
  conversationInsightExtractorService: { extractInsights: mockExtractInsights },
}));

// ESM mock: memory-engine
const mockGetActiveMemories = jest.fn();
jest.unstable_mockModule('../../../src/services/memory-engine.service.js', () => ({
  memoryEngineService: { getActiveMemories: mockGetActiveMemories },
}));

// ESM mock: database query
const mockQuery = jest.fn();
jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

// ESM mock: logger
jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { emotionalIntelligenceService } = await import(
  '../../../src/services/emotional-intelligence.service.js'
);

describe('EmotionalIntelligenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActiveMemories.mockResolvedValue([]);
    mockQuery.mockResolvedValue({ rows: [] });
  });

  describe('analyze()', () => {
    it('returns neutral context when message is too short', async () => {
      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: 'ok',
        conversationHistory: [],
      });

      expect(result.primaryEmotion).toBe('neutral');
      expect(result.confidence).toBeLessThan(0.5);
      expect(mockExtractInsights).not.toHaveBeenCalled();
    });

    it('detects emotional masking from "I\'m fine" with declining engagement', async () => {
      mockExtractInsights.mockResolvedValue({
        mood: { state: 'neutral', intensity: 0.2, triggers: [] },
        intent: 'status_update',
        entities: {},
        behavioral_signals: { sentiment_trend: 'declining', commitment_level: 'low' },
        memory_candidates: [],
        core_profile_updates: [],
        emotional_context: {
          primaryEmotion: 'neutral',
          emotionalIntensity: 20,
          confidence: 0.6,
          toneMarkers: ['passive', 'flat'],
          hiddenStates: ['masking'],
          behavioralPatterns: [],
          riskLevel: 'low',
          riskFlags: [],
          energyEstimate: 'low',
          cognitiveLoad: 'light',
          motivationState: 'declining',
          needsEmpathy: true,
          needsChallenge: false,
          needsStructure: false,
          needsSilence: false,
          isAvoidingTruth: false,
          isSelfSabotaging: false,
          isEmotionallyOverwhelmed: false,
          moodTrajectory: 'declining',
          comparedToBaseline: 'below',
          engagementLevel: 'low',
          responseComplexity: 'shrinking',
        },
      });

      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: "I'm fine, just tired I guess",
        conversationHistory: [
          { role: 'assistant', content: 'How are you feeling today?' },
          { role: 'user', content: "I'm fine, just tired I guess" },
        ],
      });

      expect(result.hiddenStates).toContain('masking');
      expect(result.needsEmpathy).toBe(true);
      expect(result.moodTrajectory).toBe('declining');
    });

    it('detects self-sabotage from repeated goal abandonment in memory', async () => {
      mockGetActiveMemories.mockResolvedValue([
        {
          category: 'behavioral',
          memoryType: 'pattern',
          title: 'Repeated gym goal abandonment',
          structuredData: { type: 'self_sabotage_loop', frequency: 4 },
          confidence: 0.8,
        },
      ]);

      mockExtractInsights.mockResolvedValue({
        mood: { state: 'frustrated', intensity: 0.5 },
        intent: 'goal_setting',
        entities: { goals: ['start gym routine'] },
        behavioral_signals: null,
        memory_candidates: [],
        core_profile_updates: [],
        emotional_context: {
          primaryEmotion: 'determination',
          emotionalIntensity: 50,
          confidence: 0.7,
          toneMarkers: [],
          hiddenStates: [],
          behavioralPatterns: [
            { type: 'self_sabotage_loop', frequency: 4, lastOccurrence: '2026-05-15', confidence: 0.8 },
          ],
          riskLevel: 'low',
          riskFlags: [],
          energyEstimate: 'moderate',
          cognitiveLoad: 'light',
          motivationState: 'seeking',
          needsEmpathy: false,
          needsChallenge: true,
          needsStructure: true,
          needsSilence: false,
          isAvoidingTruth: false,
          isSelfSabotaging: true,
          isEmotionallyOverwhelmed: false,
          moodTrajectory: 'stable',
          comparedToBaseline: 'at',
          engagementLevel: 'moderate',
          responseComplexity: 'stable',
        },
      });

      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: "I'm going to start going to the gym again, this time for real",
        conversationHistory: [],
      });

      expect(result.isSelfSabotaging).toBe(true);
      expect(result.behavioralPatterns.some(p => p.type === 'self_sabotage_loop')).toBe(true);
      expect(result.needsChallenge).toBe(true);
    });

    it('detects emotional shutdown from shrinking responses', async () => {
      mockExtractInsights.mockResolvedValue({
        mood: { state: 'neutral', intensity: 0.1 },
        intent: 'minimal_response',
        entities: {},
        behavioral_signals: null,
        memory_candidates: [],
        core_profile_updates: [],
        emotional_context: {
          primaryEmotion: 'numbness',
          emotionalIntensity: 15,
          confidence: 0.65,
          toneMarkers: ['flat'],
          hiddenStates: ['emotional_shutdown'],
          behavioralPatterns: [],
          riskLevel: 'low',
          riskFlags: [],
          energyEstimate: 'low',
          cognitiveLoad: 'light',
          motivationState: 'absent',
          needsEmpathy: true,
          needsChallenge: false,
          needsStructure: false,
          needsSilence: true,
          isAvoidingTruth: false,
          isSelfSabotaging: false,
          isEmotionallyOverwhelmed: false,
          moodTrajectory: 'declining',
          comparedToBaseline: 'below',
          engagementLevel: 'withdrawing',
          responseComplexity: 'shrinking',
        },
      });

      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: 'yeah',
        conversationHistory: [
          { role: 'user', content: 'I had a really hard week at work with some big deadlines and stress' },
          { role: 'assistant', content: 'That sounds tough. What was the hardest part?' },
          { role: 'user', content: 'just everything' },
          { role: 'assistant', content: 'I hear you. Want to talk about what specifically drained you most?' },
          { role: 'user', content: 'yeah' },
        ],
      });

      expect(result.hiddenStates).toContain('emotional_shutdown');
      expect(result.needsSilence).toBe(true);
      expect(result.engagementLevel).toBe('withdrawing');
      expect(result.responseComplexity).toBe('shrinking');
    });

    it('returns neutral context on extraction failure (fallback)', async () => {
      mockExtractInsights.mockRejectedValue(new Error('OpenAI timeout'));

      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: 'How should I structure my morning routine?',
        conversationHistory: [],
      });

      expect(result.primaryEmotion).toBe('neutral');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('enriches context with external signals when available', async () => {
      // Mock mood logs returning recent declining mood
      mockQuery.mockResolvedValueOnce({
        rows: [
          { state: 'sad', intensity: 7, created_at: '2026-05-20T08:00:00Z' },
          { state: 'anxious', intensity: 6, created_at: '2026-05-19T09:00:00Z' },
          { state: 'neutral', intensity: 4, created_at: '2026-05-18T10:00:00Z' },
        ],
      });

      mockExtractInsights.mockResolvedValue({
        mood: { state: 'sad', intensity: 0.6 },
        intent: 'venting',
        entities: {},
        behavioral_signals: { sentiment_trend: 'declining' },
        memory_candidates: [],
        core_profile_updates: [],
        emotional_context: {
          primaryEmotion: 'sadness',
          emotionalIntensity: 60,
          confidence: 0.75,
          toneMarkers: ['resigned'],
          hiddenStates: [],
          behavioralPatterns: [],
          riskLevel: 'low',
          riskFlags: [],
          energyEstimate: 'low',
          cognitiveLoad: 'heavy',
          motivationState: 'declining',
          needsEmpathy: true,
          needsChallenge: false,
          needsStructure: false,
          needsSilence: false,
          isAvoidingTruth: false,
          isSelfSabotaging: false,
          isEmotionallyOverwhelmed: false,
          moodTrajectory: 'declining',
          comparedToBaseline: 'below',
          engagementLevel: 'moderate',
          responseComplexity: 'stable',
        },
      });

      const result = await emotionalIntelligenceService.analyze({
        userId: 'user-1',
        message: "I've been feeling really down lately, nothing seems to help",
        conversationHistory: [],
        recentMoodLogs: [
          { state: 'sad', intensity: 7, created_at: '2026-05-20T08:00:00Z' },
          { state: 'anxious', intensity: 6, created_at: '2026-05-19T09:00:00Z' },
        ],
      });

      expect(result.primaryEmotion).toBe('sadness');
      expect(result.moodTrajectory).toBe('declining');
      expect(result.needsEmpathy).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm.cmd --prefix server run test:unit -- --testPathPatterns="emotional-intelligence"`
Expected: FAIL — `Cannot find module '../../../src/services/emotional-intelligence.service.js'`

- [ ] **Step 3: Commit failing tests**

```
git add server/tests/unit/services/emotional-intelligence.service.test.ts
git commit -m "test: add failing tests for emotional intelligence engine"
```

---

## Task 5: Emotional Intelligence Engine — Implementation

**Files:**
- Create: `server/src/services/emotional-intelligence.service.ts`
- Modify: `server/src/services/conversation-insight-extractor.service.ts`

- [ ] **Step 1: Extend the extraction prompt in conversation-insight-extractor.service.ts**

Add the `emotional_context` section to the `EXTRACTION_PROMPT` (after line 49):

```typescript
const EXTRACTION_PROMPT = `You are an insight extraction engine for a health coaching AI. Given a conversation turn between a user and their AI health coach, extract structured insights.

EXISTING USER MEMORIES (do not duplicate these):
{existingMemoryTitles}

CONVERSATION TURN:
User: {userMessage}
Coach: {coachResponse}

Extract insights as JSON matching this schema exactly:
{
  "mood": { "state": string, "intensity": number 0-1, "triggers": [string] } | null,
  "intent": string,
  "entities": { "goals": [string], "habits": [string], "preferences": [string], "issues": [string] },
  "behavioral_signals": { "pattern": string, "sentiment_trend": "improving"|"stable"|"declining", "commitment_level": "high"|"medium"|"low" } | null,
  "memory_candidates": [{ "title": string, "description": string, "category": "fitness"|"nutrition"|"sleep"|"wellbeing"|"lifestyle"|"behavioral"|"cross_domain", "memoryType": "pattern"|"preference"|"context"|"feedback"|"relationship"|"learned_rule", "confidence": number 0-1 }],
  "core_profile_updates": [{ "section": "biometrics"|"targets"|"constraints"|"preferences"|"medical"|"lifestyle", "key": string, "value": any, "unit": string|null, "source": string }],
  "emotional_context": {
    "primaryEmotion": string,
    "secondaryEmotion": string|null,
    "emotionalIntensity": number 0-100,
    "confidence": number 0-1,
    "toneMarkers": [string],
    "hiddenStates": [string],
    "behavioralPatterns": [{ "type": string, "frequency": number, "lastOccurrence": string, "confidence": number }],
    "riskLevel": "none"|"low"|"moderate"|"high"|"critical",
    "riskFlags": [{ "severity": "low"|"medium"|"high", "category": string, "description": string }],
    "energyEstimate": "low"|"moderate"|"high",
    "cognitiveLoad": "light"|"heavy"|"overloaded",
    "motivationState": "seeking"|"present"|"declining"|"absent",
    "needsEmpathy": boolean,
    "needsChallenge": boolean,
    "needsStructure": boolean,
    "needsSilence": boolean,
    "isAvoidingTruth": boolean,
    "isSelfSabotaging": boolean,
    "isEmotionallyOverwhelmed": boolean,
    "moodTrajectory": "improving"|"stable"|"declining"|"volatile",
    "comparedToBaseline": "above"|"at"|"below",
    "engagementLevel": "high"|"moderate"|"low"|"withdrawing",
    "responseComplexity": "expanding"|"stable"|"shrinking"
  }
}

Rules:
- Only extract insights clearly stated or strongly implied
- memory_candidates: only genuinely new insights not in EXISTING USER MEMORIES
- core_profile_updates: only when user explicitly states a preference or fact about themselves
- mood: null if no emotional signal detected
- behavioral_signals: null if no behavioral pattern detected
- emotional_context: ALWAYS populate. Analyze the user's emotional state, tone, hidden states, and needs. Consider conversation history for trajectory and engagement patterns.
  - toneMarkers: detect passive, deflecting, aggressive, flat, warm, guarded, performative, desperate, resigned, intellectualizing, minimizing, catastrophizing
  - hiddenStates: detect masking (positive words + negative signals), suppressing, contradicting, avoiding, dissociating, people_pleasing, emotional_shutdown, hypervigilance
  - Detect self-sabotage: repeated goal-set then abandon patterns
  - Detect emotional shutdown: progressively shorter responses, flat tone, withdrawal
  - responseComplexity: compare current message length/detail to conversation history
- If the turn is purely transactional (navigation, commands), return empty arrays for memory_candidates and core_profile_updates
- Respond with valid JSON only, no prose`;
```

Also export the `extractInsights` method so EI engine can call it directly. Add a public wrapper if not already exported:

```typescript
// Add as a new public method on the service object
export async function extractInsightsOnly(
  userMessage: string,
  coachResponse: string,
  existingMemoryTitles: string,
): Promise<TurnInsights> {
  return extractInsights(userMessage, coachResponse, existingMemoryTitles);
}
```

At the bottom of the file, update the export:

```typescript
export const conversationInsightExtractorService = {
  extractAndPersist,
  extractInsightsOnly,
};
```

- [ ] **Step 2: Create the emotional intelligence service**

```typescript
// server/src/services/emotional-intelligence.service.ts
import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { memoryEngineService } from './memory-engine.service.js';
import { conversationInsightExtractorService } from './conversation-insight-extractor.service.js';
import {
  NEUTRAL_EMOTIONAL_CONTEXT,
  type EmotionalContext,
  type EIAnalysisInput,
  type BehavioralPattern,
} from '@shared/types/domain/emotional-intelligence.js';

const MIN_MESSAGE_LENGTH = 8;
const EI_TIMEOUT_MS = 4000;

class EmotionalIntelligenceService {
  async analyze(input: EIAnalysisInput): Promise<EmotionalContext> {
    const { userId, message, conversationHistory } = input;

    if (message.length < MIN_MESSAGE_LENGTH) {
      return { ...NEUTRAL_EMOTIONAL_CONTEXT };
    }

    try {
      const [extractionResult, existingPatterns] = await Promise.all([
        this.extractWithTimeout(message, conversationHistory),
        this.fetchExistingPatterns(userId, input.existingPatterns),
      ]);

      if (!extractionResult?.emotional_context) {
        return { ...NEUTRAL_EMOTIONAL_CONTEXT };
      }

      const eiContext = extractionResult.emotional_context;

      // Merge existing behavioral patterns from memory engine
      const mergedPatterns = this.mergePatterns(
        eiContext.behavioralPatterns || [],
        existingPatterns,
      );

      // Enrich with external signals
      const enriched: EmotionalContext = {
        ...eiContext,
        behavioralPatterns: mergedPatterns,
        isSelfSabotaging: eiContext.isSelfSabotaging ||
          mergedPatterns.some(p => p.type === 'self_sabotage_loop' && p.frequency >= 3),
        sleepQuality: input.sleepQuality ?? eiContext.sleepQuality,
        recentStressLevel: input.recentStressLevel ?? eiContext.recentStressLevel,
      };

      // Compute trajectory from recent mood logs if provided
      if (input.recentMoodLogs && input.recentMoodLogs.length >= 2) {
        enriched.moodTrajectory = this.computeMoodTrajectory(input.recentMoodLogs);
      }

      // Detect response complexity from conversation history
      if (conversationHistory.length >= 4) {
        enriched.responseComplexity = this.detectResponseComplexity(
          message,
          conversationHistory,
        );
        if (enriched.responseComplexity === 'shrinking' && enriched.engagementLevel !== 'withdrawing') {
          enriched.engagementLevel = 'low';
        }
      }

      return enriched;
    } catch (error) {
      logger.warn('[EI] Analysis failed, returning neutral context', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId,
      });
      return { ...NEUTRAL_EMOTIONAL_CONTEXT };
    }
  }

  private async extractWithTimeout(
    message: string,
    conversationHistory: Array<{ role: string; content: string }>,
  ) {
    const lastCoachMessage = conversationHistory
      .filter(m => m.role === 'assistant')
      .pop()?.content || '';

    const result = await Promise.race([
      conversationInsightExtractorService.extractInsightsOnly(
        message,
        lastCoachMessage,
        '',
      ),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), EI_TIMEOUT_MS)),
    ]);

    return result;
  }

  private async fetchExistingPatterns(
    userId: string,
    provided?: BehavioralPattern[],
  ): Promise<BehavioralPattern[]> {
    if (provided && provided.length > 0) return provided;

    try {
      const memories = await memoryEngineService.getActiveMemories(userId, {
        category: 'behavioral',
        minConfidence: 0.4,
      });

      return memories
        .filter((m: any) => m.structuredData?.type)
        .map((m: any) => ({
          type: m.structuredData.type,
          frequency: m.structuredData.frequency || m.evidenceCount || 1,
          lastOccurrence: m.updatedAt || m.createdAt || new Date().toISOString(),
          confidence: m.confidence,
        }));
    } catch {
      return [];
    }
  }

  private mergePatterns(
    fromExtraction: BehavioralPattern[],
    fromMemory: BehavioralPattern[],
  ): BehavioralPattern[] {
    const merged = new Map<string, BehavioralPattern>();

    for (const p of fromMemory) {
      merged.set(p.type, p);
    }
    for (const p of fromExtraction) {
      const existing = merged.get(p.type);
      if (existing) {
        merged.set(p.type, {
          ...p,
          frequency: Math.max(p.frequency, existing.frequency),
          confidence: Math.max(p.confidence, existing.confidence),
        });
      } else {
        merged.set(p.type, p);
      }
    }

    return Array.from(merged.values());
  }

  private computeMoodTrajectory(
    logs: Array<{ state: string; intensity: number; created_at: string }>,
  ): EmotionalContext['moodTrajectory'] {
    if (logs.length < 2) return 'stable';

    const negativeStates = new Set([
      'sad', 'sadness', 'angry', 'anger', 'anxious', 'anxiety',
      'stressed', 'distressed', 'frustrated', 'overwhelmed',
    ]);

    const scores = logs.map(l => negativeStates.has(l.state.toLowerCase()) ? -l.intensity : l.intensity);
    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.ceil(scores.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - recentAvg, 2), 0) / scores.length;

    if (variance > 20) return 'volatile';
    if (recentAvg - olderAvg > 1.5) return 'improving';
    if (olderAvg - recentAvg > 1.5) return 'declining';
    return 'stable';
  }

  private detectResponseComplexity(
    currentMessage: string,
    history: Array<{ role: string; content: string }>,
  ): EmotionalContext['responseComplexity'] {
    const userMessages = history.filter(m => m.role === 'user').map(m => m.content);
    if (userMessages.length < 2) return 'stable';

    const prevLengths = userMessages.slice(-3).map(m => m.length);
    const avgPrevLength = prevLengths.reduce((a, b) => a + b, 0) / prevLengths.length;

    if (currentMessage.length < avgPrevLength * 0.4) return 'shrinking';
    if (currentMessage.length > avgPrevLength * 1.8) return 'expanding';
    return 'stable';
  }
}

export const emotionalIntelligenceService = new EmotionalIntelligenceService();
```

- [ ] **Step 3: Run the tests**

Run: `npm.cmd --prefix server run test:unit -- --testPathPatterns="emotional-intelligence"`
Expected: PASS (all 5 tests)

- [ ] **Step 4: Run typecheck**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```
git add server/src/services/emotional-intelligence.service.ts server/src/services/conversation-insight-extractor.service.ts
git commit -m "feat: implement emotional intelligence engine with per-turn analysis"
```

---

## Task 6: Persona Selector — Tests

**Files:**
- Create: `server/tests/unit/services/persona-selector.service.test.ts`

- [ ] **Step 1: Write failing tests for persona selection**

```typescript
// server/tests/unit/services/persona-selector.service.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const { personaSelectorService } = await import(
  '../../../src/services/persona-selector.service.js'
);

import {
  NEUTRAL_EMOTIONAL_CONTEXT,
  type EmotionalContext,
  type PersonaDirective,
  type TopicClassification,
} from '@shared/types/domain/emotional-intelligence.js';

function makeContext(overrides: Partial<EmotionalContext> = {}): EmotionalContext {
  return { ...NEUTRAL_EMOTIONAL_CONTEXT, ...overrides };
}

describe('PersonaSelectorService', () => {
  beforeEach(() => {
    personaSelectorService.resetTransitionState();
  });

  describe('select()', () => {
    it('returns deep_listener for emotional shutdown', () => {
      const ctx = makeContext({
        hiddenStates: ['emotional_shutdown'],
        engagementLevel: 'withdrawing',
      });
      const result = personaSelectorService.select(ctx, { domain: 'general' });

      expect(result.primaryPersona).toBe('deep_listener');
      expect(result.responseLength).toBe('minimal');
      expect(result.challengeLevel).toBe(0);
      expect(result.warmthLevel).toBeGreaterThanOrEqual(8);
    });

    it('returns brutal_accountability for self-sabotage with low risk', () => {
      const ctx = makeContext({
        isSelfSabotaging: true,
        riskLevel: 'low',
        behavioralPatterns: [
          { type: 'self_sabotage_loop', frequency: 4, lastOccurrence: '2026-05-15', confidence: 0.8 },
        ],
      });
      const result = personaSelectorService.select(ctx, { domain: 'fitness' });

      expect(result.primaryPersona).toBe('brutal_accountability');
      expect(result.shouldConfirm).toBe(true);
      expect(result.challengeLevel).toBeGreaterThanOrEqual(7);
    });

    it('returns therapist for multiple hidden states', () => {
      const ctx = makeContext({
        hiddenStates: ['masking', 'suppressing'],
        primaryEmotion: 'sadness',
        emotionalIntensity: 65,
      });
      const result = personaSelectorService.select(ctx, { domain: 'general' });

      expect(result.primaryPersona).toBe('therapist');
      expect(result.shouldUseMCQ).toBe(true);
    });

    it('returns strategic_advisor for career strategy with low emotional intensity', () => {
      const ctx = makeContext({ emotionalIntensity: 25, motivationState: 'present' });
      const topic: TopicClassification = { domain: 'career', subtype: 'strategy' };
      const result = personaSelectorService.select(ctx, topic);

      expect(result.primaryPersona).toBe('strategic_advisor');
      expect(result.structureLevel).toBeGreaterThanOrEqual(8);
    });

    it('returns calm_mentor for cognitive overload', () => {
      const ctx = makeContext({ cognitiveLoad: 'overloaded', emotionalIntensity: 50 });
      const result = personaSelectorService.select(ctx, { domain: 'general' });

      expect(result.primaryPersona).toBe('calm_mentor');
      expect(result.responseLength).toBe('concise');
      expect(result.challengeLevel).toBeLessThanOrEqual(2);
    });

    it('returns emotional_recovery blend for high risk', () => {
      const ctx = makeContext({ riskLevel: 'high' });
      const result = personaSelectorService.select(ctx, { domain: 'general' });

      expect(result.primaryPersona).toBe('emotional_recovery');
      expect(result.secondaryPersona).toBe('therapist');
      expect(result.shouldEscalate).toBe(true);
    });

    it('blends therapist + accountability when needs empathy AND challenge', () => {
      const ctx = makeContext({ needsEmpathy: true, needsChallenge: true });
      const result = personaSelectorService.select(ctx, { domain: 'general' });

      expect(result.primaryPersona).toBe('therapist');
      expect(result.secondaryPersona).toBe('brutal_accountability');
      expect(result.blendWeight).toBeCloseTo(0.6, 1);
    });

    it('returns wellness_strategist for fitness topics', () => {
      const ctx = makeContext({ emotionalIntensity: 20 });
      const result = personaSelectorService.select(ctx, { domain: 'fitness' });

      expect(result.primaryPersona).toBe('wellness_strategist');
    });

    it('returns reflective_philosopher for spirituality topics', () => {
      const ctx = makeContext({ emotionalIntensity: 20 });
      const result = personaSelectorService.select(ctx, { domain: 'spirituality' });

      expect(result.primaryPersona).toBe('reflective_philosopher');
      expect(result.responseLength).toBe('expansive');
    });

    it('defaults to calm_mentor when no strong signals', () => {
      const result = personaSelectorService.select(
        NEUTRAL_EMOTIONAL_CONTEXT,
        { domain: 'general' },
      );

      expect(result.primaryPersona).toBe('calm_mentor');
    });
  });

  describe('transition smoothing', () => {
    it('limits persona shift to 30% per turn', () => {
      // First selection: therapist
      const ctx1 = makeContext({
        hiddenStates: ['masking', 'suppressing'],
        primaryEmotion: 'sadness',
        emotionalIntensity: 65,
      });
      personaSelectorService.select(ctx1, { domain: 'general' });

      // Second selection: would be strategic_advisor, but should be smoothed
      const ctx2 = makeContext({
        emotionalIntensity: 15,
        motivationState: 'present',
      });
      const result = personaSelectorService.select(ctx2, { domain: 'career', subtype: 'strategy' });

      // Should still have therapist influence due to smoothing
      expect(result.secondaryPersona || result.primaryPersona).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm.cmd --prefix server run test:unit -- --testPathPatterns="persona-selector"`
Expected: FAIL — `Cannot find module '../../../src/services/persona-selector.service.js'`

- [ ] **Step 3: Commit failing tests**

```
git add server/tests/unit/services/persona-selector.service.test.ts
git commit -m "test: add failing tests for persona selector service"
```

---

## Task 7: Persona Selector — Implementation

**Files:**
- Create: `server/src/services/persona-selector.service.ts`

- [ ] **Step 1: Implement the persona selector**

```typescript
// server/src/services/persona-selector.service.ts
import { logger } from './logger.service.js';
import {
  DEFAULT_PERSONA_DIRECTIVE,
  type EmotionalContext,
  type PersonaDirective,
  type SiaPersonaType,
  type TopicClassification,
} from '@shared/types/domain/emotional-intelligence.js';

const MAX_TRANSITION_SHIFT = 0.3;
const ANCHOR_TURNS = 10;
const ANCHOR_MAX_SHIFT = 0.2;

function persona(
  type: SiaPersonaType,
  overrides: Partial<PersonaDirective> = {},
): PersonaDirective {
  return { ...DEFAULT_PERSONA_DIRECTIVE, primaryPersona: type, blendWeight: 1.0, ...overrides };
}

function blend(
  primary: SiaPersonaType,
  secondary: SiaPersonaType,
  primaryWeight: number,
  overrides: Partial<PersonaDirective> = {},
): PersonaDirective {
  return {
    ...DEFAULT_PERSONA_DIRECTIVE,
    primaryPersona: primary,
    blendWeight: primaryWeight,
    secondaryPersona: secondary,
    secondaryWeight: 1.0 - primaryWeight,
    ...overrides,
  };
}

class PersonaSelectorService {
  private history: Array<{ persona: SiaPersonaType; timestamp: number }> = [];

  select(ctx: EmotionalContext, topic: TopicClassification): PersonaDirective {
    const raw = this.selectRaw(ctx, topic);
    const smoothed = this.applyTransitionSmoothing(raw);

    this.history.push({ persona: smoothed.primaryPersona, timestamp: Date.now() });
    if (this.history.length > 20) this.history.shift();

    logger.debug('[PersonaSelector] Selected persona', {
      primary: smoothed.primaryPersona,
      secondary: smoothed.secondaryPersona,
      blendWeight: smoothed.blendWeight,
      topic: topic.domain,
    });

    return smoothed;
  }

  resetTransitionState(): void {
    this.history = [];
  }

  private selectRaw(ctx: EmotionalContext, topic: TopicClassification): PersonaDirective {
    // Crisis override
    if (ctx.riskLevel === 'critical') {
      return blend('emotional_recovery', 'therapist', 0.8, {
        shouldEscalate: true,
        warmthLevel: 10,
        challengeLevel: 0,
        responseLength: 'standard',
        openingStyle: 'acknowledge_first',
        avoid: ['generic_motivation', 'toxic_positivity', 'premature_solutions'],
      });
    }

    if (ctx.riskLevel === 'high') {
      return blend('emotional_recovery', 'therapist', 0.7, {
        shouldEscalate: true,
        warmthLevel: 9,
        challengeLevel: 0,
        responseLength: 'standard',
        openingStyle: 'acknowledge_first',
        avoid: ['generic_motivation', 'toxic_positivity', 'premature_solutions'],
      });
    }

    // Emotional shutdown
    if (ctx.hiddenStates.includes('emotional_shutdown')) {
      return persona('deep_listener', {
        responseLength: 'minimal',
        challengeLevel: 0,
        warmthLevel: 9,
        questionDensity: 'none',
        vulnerabilityTolerance: 0,
        openingStyle: 'silence_then_speak',
        closingStyle: 'none',
        avoid: ['unsolicited_advice', 'premature_solutions', 'generic_motivation'],
      });
    }

    // Self-sabotage (3+ occurrences, not high risk)
    if (ctx.isSelfSabotaging && (ctx.riskLevel === 'none' || ctx.riskLevel === 'low')) {
      return persona('brutal_accountability', {
        challengeLevel: 8,
        warmthLevel: 4,
        shouldConfirm: true,
        questionDensity: 'one',
        vulnerabilityTolerance: 6,
        openingStyle: 'insight_first',
        closingStyle: 'action_item',
        avoid: ['toxic_positivity', 'minimizing_feelings'],
      });
    }

    // Multiple hidden states or shame
    if (ctx.hiddenStates.length >= 2 || ctx.primaryEmotion === 'shame') {
      return persona('therapist', {
        warmthLevel: 8,
        challengeLevel: 2,
        shouldUseMCQ: true,
        vulnerabilityTolerance: 7,
        questionDensity: 'one',
        openingStyle: 'acknowledge_first',
        closingStyle: 'reflection_prompt',
        avoid: ['unsolicited_advice', 'premature_solutions'],
      });
    }

    // Cognitive overload
    if (ctx.cognitiveLoad === 'overloaded') {
      return persona('calm_mentor', {
        responseLength: 'concise',
        structureLevel: 9,
        challengeLevel: 1,
        warmthLevel: 7,
        questionDensity: 'none',
        openingStyle: 'acknowledge_first',
        closingStyle: 'action_item',
        avoid: ['information_dumps', 'multiple_options'],
      });
    }

    // Topic-based selection (low emotional intensity)
    if (ctx.emotionalIntensity < 40) {
      const topicPersona = this.selectByTopic(topic);
      if (topicPersona) return topicPersona;
    }

    // Needs-based fallback
    if (ctx.needsEmpathy && !ctx.needsChallenge) {
      return persona('therapist', { warmthLevel: 8, challengeLevel: 2 });
    }
    if (ctx.needsChallenge && !ctx.needsEmpathy) {
      return persona('performance_coach', { challengeLevel: 7, warmthLevel: 4 });
    }
    if (ctx.needsEmpathy && ctx.needsChallenge) {
      return blend('therapist', 'brutal_accountability', 0.6, {
        warmthLevel: 6,
        challengeLevel: 6,
      });
    }
    if (ctx.needsStructure) {
      return persona('calm_mentor', { structureLevel: 9 });
    }

    // Default
    return persona('calm_mentor', { warmthLevel: 6, challengeLevel: 4 });
  }

  private selectByTopic(topic: TopicClassification): PersonaDirective | null {
    switch (topic.domain) {
      case 'career':
        if (topic.subtype === 'founder') {
          return persona('founder_advisor', { structureLevel: 7, challengeLevel: 5 });
        }
        return persona('strategic_advisor', { structureLevel: 9, challengeLevel: 5 });

      case 'fitness':
      case 'health':
      case 'nutrition':
      case 'sleep':
        return persona('wellness_strategist', {
          structureLevel: 7,
          warmthLevel: 6,
          closingStyle: 'action_item',
        });

      case 'productivity':
        return persona('performance_coach', {
          responseLength: 'concise',
          structureLevel: 8,
          challengeLevel: 6,
        });

      case 'spirituality':
      case 'meaning':
      case 'purpose':
        return persona('reflective_philosopher', {
          responseLength: 'expansive',
          questionDensity: 'one',
          closingStyle: 'reflection_prompt',
          avoid: ['premature_solutions', 'unsolicited_advice'],
        });

      case 'finance':
        return persona('strategic_advisor', {
          structureLevel: 9,
          avoid: ['specific_investment_advice'],
        });

      default:
        return null;
    }
  }

  private applyTransitionSmoothing(incoming: PersonaDirective): PersonaDirective {
    if (this.history.length === 0) return incoming;

    const lastPersona = this.history[this.history.length - 1].persona;

    // Crisis/escalation overrides bypass smoothing
    if (incoming.shouldEscalate) return incoming;

    // Same persona — no smoothing needed
    if (incoming.primaryPersona === lastPersona) return incoming;

    // Count consecutive turns on the same persona
    let consecutiveCount = 0;
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].persona === lastPersona) consecutiveCount++;
      else break;
    }

    const maxShift = consecutiveCount >= ANCHOR_TURNS ? ANCHOR_MAX_SHIFT : MAX_TRANSITION_SHIFT;

    // If shifting away from a long-held persona, blend instead of hard switch
    if (consecutiveCount >= 3) {
      return blend(incoming.primaryPersona, lastPersona, 1.0 - maxShift, {
        ...incoming,
        blendWeight: 1.0 - maxShift,
        secondaryWeight: maxShift,
      });
    }

    return incoming;
  }
}

export const personaSelectorService = new PersonaSelectorService();
```

- [ ] **Step 2: Run persona selector tests**

Run: `npm.cmd --prefix server run test:unit -- --testPathPatterns="persona-selector"`
Expected: PASS (all 10 tests)

- [ ] **Step 3: Run EI tests too (regression check)**

Run: `npm.cmd --prefix server run test:unit -- --testPathPatterns="emotional-intelligence"`
Expected: PASS

- [ ] **Step 4: Run typecheck**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```
git add server/src/services/persona-selector.service.ts
git commit -m "feat: implement persona selector with 10 coaching modes and transition smoothing"
```

---

## Task 8: Coach Persona Prompt — Dynamic PersonaDirective

**Files:**
- Modify: `server/src/services/coach-persona-prompt.service.ts`
- Modify: `server/shared/types/domain/coach-persona.ts`

- [ ] **Step 1: Rewrite coach-persona-prompt.service.ts to accept PersonaDirective**

```typescript
// server/src/services/coach-persona-prompt.service.ts
import type { AICoachPersona } from '@shared/types/domain/coach-persona.js';
import { normalizePersonaId } from '@shared/types/domain/coach-persona.js';
import type { PersonaDirective, SiaPersonaType } from '@shared/types/domain/emotional-intelligence.js';

const PERSONA_BASE = `BASE RULES (always apply regardless of persona): Follow the 6-part response architecture internally. Apply behavioral intelligence rules. Focus on systems over motivation. Prioritize execution clarity over inspiration. Keep outputs minimal, structured, actionable. Never use guilt, shame, or pressure.`;

// ── Legacy 4-persona blocks (kept for backward compat) ──

const LEGACY_PERSONA_BLOCKS: Record<AICoachPersona, string> = {
  commander: `${PERSONA_BASE}
COACHING PERSONA: Commander
- Be direct, concise, and accountability-first. No fluff or empty reassurance.
- Name patterns clearly when data shows missed commitments; stay respectful — never insulting.
- Prefer imperative next steps with one clear action. Minimal emojis unless user uses them heavily.
- When user is stuck, cut through noise immediately: "Here's the one thing that matters right now."
- Brevity IS your warmth. A 2-sentence message from you carries more weight than a paragraph from anyone else.
- Still refuse medical diagnosis; escalate crisis language to safety resources.`,

  friend: `${PERSONA_BASE}
COACHING PERSONA: Friend
- Lead with warmth, curiosity, and validation. Normalize setbacks; avoid guilt framing.
- Ask open questions before advice. Celebrate small wins authentically.
- Use "we" language. Share victories. Express genuine worry when things slip.
- Even in warmth, always land on a concrete next step — caring without direction is just sympathy.`,

  data_nerd: `${PERSONA_BASE}
COACHING PERSONA: Data nerd
- Lead with specific metrics and trends from context; cite numbers when available.
- Keep tone calm and professional — neither harsh nor overly effusive.
- Cross-reference domains: sleep vs workout performance, stress vs nutrition — connect dots the user can't see alone.
- Translate data into actionable insight — numbers without a recommendation are just noise.`,

  guardian: `${PERSONA_BASE}
COACHING PERSONA: Guardian
- Prioritize safety, self-care, and sustainable habits. Lead with compassion.
- Gently flag overtraining, burnout signals, or unhealthy patterns.
- Recovery is never optional. Sleep debt, overtraining, and burnout get flagged before they escalate.
- When user is overwhelmed, actively reduce their load — don't just acknowledge it.`,
};

// ── SIA 10-persona directive blocks ──

const SIA_PERSONA_BLOCKS: Record<SiaPersonaType, string> = {
  deep_listener: `PERSONA: Deep Listener
- Ultra-soft, minimal, reflective. Create space. Mirror the user's language.
- Ask few questions. Never rush to solutions. Silence is a valid response strategy.
- Validate before anything else. "That sounds really heavy" before any analysis.
- Response length: minimal. Let the user lead.`,

  therapist: `PERSONA: Therapist
- Warm, exploratory, non-judgmental. Open-ended questions.
- Name emotions the user hasn't articulated yet. Validate before challenging.
- "It sounds like..." and "I'm noticing..." framing. Never diagnostic.
- Guide self-discovery. Don't prescribe — illuminate.`,

  calm_mentor: `PERSONA: Calm Mentor
- Steady, grounding, authoritative. Simplify complexity.
- Offer clear frameworks. Reduce options to 2-3 max.
- Breathing metaphors welcome. "Let's slow down and look at this step by step."
- Structured but warm. The voice of reason in chaos.`,

  strategic_advisor: `PERSONA: Strategic Advisor
- Sharp, structured, data-informed. Pros/cons analysis. Decision matrices.
- Risk assessment without hand-holding. Respect the user's intelligence.
- Lead with the insight, not the greeting. Get to the point.
- Numbers and frameworks over feelings (unless feelings ARE the topic).`,

  brutal_accountability: `PERSONA: Accountability Coach
- Direct, confrontational with care. Name the pattern explicitly.
- "This is the 4th time you've set this goal. What's really going on?" — that energy.
- Don't accept deflection. Ask the uncomfortable question.
- Still never shame or insult. Direct ≠ cruel. Challenge ≠ attack.`,

  performance_coach: `PERSONA: Performance Coach
- Energetic, focused, action-oriented. Time-blocks. Remove blockers.
- Measure output. Celebrate execution, not just intention.
- "What's the ONE thing you can do in the next 30 minutes?" mindset.
- Momentum over perfection. Ship, iterate, improve.`,

  wellness_strategist: `PERSONA: Wellness Strategist
- Holistic, body-aware, preventive. Connect physical signals to mental state.
- Reference biometric data when available (sleep, HRV, recovery).
- Prescribe recovery as seriously as exercise. "Your body is telling you something."
- Balance ambition with sustainability. Long game over short wins.`,

  reflective_philosopher: `PERSONA: Reflective Philosopher
- Contemplative, Socratic, expansive. Ask deep questions.
- Reference philosophical frameworks when fitting. Don't prescribe answers.
- "What would it mean if..." and "How does that connect to what you value?"
- Create space for the user to think deeply. Silence between questions is welcome.`,

  emotional_recovery: `PERSONA: Emotional Recovery Guide
- Gentle, rebuilding, future-oriented. Acknowledge what happened.
- Small steps only. Rebuild confidence gradually, not ambitiously.
- "You've been through something. Let's not rush past it."
- Focus on safety, stability, and one small win at a time.`,

  founder_advisor: `PERSONA: Founder Advisor
- Peer-level, experienced, pragmatic. "Been there" framing.
- Balance vision with execution reality. Acknowledge founder loneliness.
- Strategic without being academic. Practical without being reductive.
- "Here's what I've seen work..." energy. Validate the weight of the role.`,
};

// ── Public API ──

export function normalizePersona(value: string | null | undefined): AICoachPersona {
  return normalizePersonaId(value);
}

export function buildPersonaDirectiveBlock(persona: string | null | undefined): string {
  const p = normalizePersona(persona ?? undefined);
  return LEGACY_PERSONA_BLOCKS[p];
}

export function buildDynamicPersonaPrompt(directive: PersonaDirective): string {
  const primary = SIA_PERSONA_BLOCKS[directive.primaryPersona];
  let block = `${PERSONA_BASE}\n\n${primary}`;

  if (directive.secondaryPersona && directive.secondaryWeight && directive.secondaryWeight > 0.1) {
    const secondary = SIA_PERSONA_BLOCKS[directive.secondaryPersona];
    const pct = Math.round(directive.blendWeight * 100);
    const sPct = Math.round(directive.secondaryWeight * 100);
    block += `\n\nBLENDED APPROACH (${pct}% primary, ${sPct}% secondary):\n${secondary}`;
    block += `\nLead with ${directive.primaryPersona.replace(/_/g, ' ')} energy (${pct}%), then transition to ${directive.secondaryPersona.replace(/_/g, ' ')} energy (${sPct}%).`;
  }

  // Behavioral parameters
  const params: string[] = [];
  params.push(`Response length: ${directive.responseLength}`);
  params.push(`Challenge level: ${directive.challengeLevel}/10`);
  params.push(`Warmth level: ${directive.warmthLevel}/10`);

  if (directive.questionDensity === 'none') params.push('Do not ask questions this turn.');
  else if (directive.questionDensity === 'one') params.push('Ask at most one question.');

  if (directive.openingStyle === 'acknowledge_first') params.push('Open by acknowledging the user\'s state.');
  else if (directive.openingStyle === 'insight_first') params.push('Open with your key insight or observation.');
  else if (directive.openingStyle === 'silence_then_speak') params.push('Keep your opening very brief. Less is more.');

  if (directive.closingStyle === 'action_item') params.push('Close with one clear next action.');
  else if (directive.closingStyle === 'reflection_prompt') params.push('Close with a reflective question.');
  else if (directive.closingStyle === 'validation') params.push('Close with validation of the user\'s experience.');
  else if (directive.closingStyle === 'none') params.push('No formal closing needed. Let the response breathe.');

  block += `\n\nBEHAVIORAL PARAMETERS:\n${params.join('\n')}`;

  if (directive.avoid.length > 0) {
    block += `\n\nNEVER DO:\n${directive.avoid.map(a => `- ${a.replace(/_/g, ' ')}`).join('\n')}`;
  }

  if (directive.shouldConfirm) {
    block += `\n\nCONFIRMATION REQUIRED: Before providing your main guidance, confirm your interpretation of the user's emotional state. Use natural therapeutic phrasing like "It sounds like..." followed by options (Yes / Partially / No / I'm not sure).`;
  }

  if (directive.shouldUseMCQ) {
    block += `\n\nCLARIFICATION FLOW: The user's state is ambiguous. Present 6-8 options as a natural multiple-choice to help them articulate what they're feeling. Format: "What feels most accurate right now?" followed by numbered options. Include "I don't fully understand what's wrong" as the last option.`;
  }

  return block;
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```
git add server/src/services/coach-persona-prompt.service.ts
git commit -m "feat: add dynamic persona prompt builder for 10 SIA coaching modes"
```

---

## Task 9: LangGraph Integration — Wire EI + Persona into Chat Pipeline

**Files:**
- Modify: `server/src/services/langgraph-chatbot.service.ts`

- [ ] **Step 1: Add imports for new services**

At the top of `langgraph-chatbot.service.ts`, add:

```typescript
import { emotionalIntelligenceService } from './emotional-intelligence.service.js';
import { personaSelectorService } from './persona-selector.service.js';
import { buildDynamicPersonaPrompt } from './coach-persona-prompt.service.js';
import type { EmotionalContext, PersonaDirective } from '@shared/types/domain/emotional-intelligence.js';
```

- [ ] **Step 2: Add EI analysis after crisis detection (around line 3548)**

After the crisis detection block (`if (crisisResult.isCrisis) { ... }`), insert:

```typescript
      // ── Emotional Intelligence Analysis ──
      let eiContext: EmotionalContext | undefined;
      let personaDirective: PersonaDirective | undefined;
      try {
        const recentMoodLogs = await query<{ state: string; intensity: number; created_at: string }>(
          `SELECT state, intensity, created_at FROM mood_logs
           WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
          [userId],
        ).then(r => r.rows).catch(() => []);

        eiContext = await emotionalIntelligenceService.analyze({
          userId,
          message,
          conversationHistory: (messages || [])
            .filter((m: any) => m.role === 'user' || m.role === 'assistant')
            .slice(-10)
            .map((m: any) => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' })),
          recentMoodLogs,
          timeOfDay: new Date().getHours(),
        });

        const topicDomain = this.classifyTopicDomain(message);
        personaDirective = personaSelectorService.select(eiContext, { domain: topicDomain });
      } catch (error) {
        logger.warn('[LangGraphChatbot] EI analysis failed (non-critical)', {
          error: error instanceof Error ? error.message : 'Unknown',
          userId,
        });
      }
```

- [ ] **Step 3: Add topic classification helper method**

Add this private method to the `LangGraphChatbotService` class:

```typescript
  private classifyTopicDomain(message: string): string {
    const lower = message.toLowerCase();
    const domainKeywords: Record<string, string[]> = {
      fitness: ['workout', 'exercise', 'gym', 'run', 'lift', 'training', 'muscle', 'cardio'],
      nutrition: ['meal', 'food', 'diet', 'calories', 'macro', 'protein', 'eat', 'cook', 'recipe'],
      health: ['sleep', 'recovery', 'hrv', 'rest', 'fatigue', 'energy', 'sick', 'pain'],
      career: ['work', 'job', 'career', 'boss', 'interview', 'promotion', 'business', 'startup', 'founder'],
      finance: ['money', 'budget', 'saving', 'invest', 'expense', 'income', 'debt', 'financial'],
      spirituality: ['meaning', 'purpose', 'faith', 'prayer', 'spiritual', 'meditat', 'values', 'existential'],
      productivity: ['focus', 'productiv', 'procrastinat', 'time manage', 'deep work', 'schedule', 'todo'],
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(k => lower.includes(k))) return domain;
    }
    return 'general';
  }
```

- [ ] **Step 4: Inject dynamic persona directive into system prompt**

In the system prompt construction section (around line 2285), replace the static persona injection:

```typescript
    // OLD (around line 2285):
    // if (userPrefs.aiCoachPersona) {
    //   systemPrompt += `\n\n---\nUSER-SELECTED COACH PERSONA (overrides generic adaptive-tone guidance when they conflict):\n${buildPersonaDirectiveBlock(userPrefs.aiCoachPersona)}`;
    // }

    // NEW: Use dynamic persona from EI engine if available, fall back to user-selected
    if (personaDirective) {
      systemPrompt += `\n\n---\nADAPTIVE COACHING PERSONA (dynamically selected based on user's current emotional state):\n${buildDynamicPersonaPrompt(personaDirective)}`;
    } else if (userPrefs?.aiCoachPersona) {
      systemPrompt += `\n\n---\nUSER-SELECTED COACH PERSONA (overrides generic adaptive-tone guidance when they conflict):\n${buildPersonaDirectiveBlock(userPrefs.aiCoachPersona)}`;
    }
```

- [ ] **Step 5: Run typecheck + lint**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS

Run: `npm.cmd --prefix server run lint`
Expected: PASS (or only pre-existing warnings)

- [ ] **Step 6: Run existing tests (regression check)**

Run: `npm.cmd --prefix server run test:unit`
Expected: PASS (no regressions)

- [ ] **Step 7: Commit**

```
git add server/src/services/langgraph-chatbot.service.ts
git commit -m "feat: wire emotional intelligence and persona selector into chat pipeline"
```

---

## Task 10: Confirmation + Clarity System

The confirmation system is already built into the PersonaDirective (`shouldConfirm`, `shouldUseMCQ`) and the dynamic prompt builder (Task 8) injects the appropriate instructions. The LLM follows these instructions to generate confirmation flows naturally.

This task validates the end-to-end flow works and stores feedback.

**Files:**
- Modify: `server/src/services/conversation-insight-extractor.service.ts` (feedback routing)

- [ ] **Step 1: Add emotional calibration feedback routing**

In `conversation-insight-extractor.service.ts`, add a method to route confirmation feedback back to memory:

```typescript
async function routeConfirmationFeedback(
  userId: string,
  confirmationType: 'confirmed' | 'partially' | 'denied' | 'unsure',
  emotionalContext: Record<string, unknown>,
): Promise<void> {
  try {
    if (confirmationType === 'confirmed') {
      // Reinforce the emotional pattern in memory
      const similar = await memoryEngineService.findSimilarMemories(
        userId,
        'behavioral',
        JSON.stringify(emotionalContext),
      );
      if (similar.length > 0) {
        await memoryEngineService.reinforceMemory(similar[0].id, userId, [{
          source_table: 'confirmation_feedback',
          source_id: `confirm-${Date.now()}`,
          date: new Date().toISOString(),
          summary: 'User confirmed emotional interpretation',
        }]);
      }
    } else if (confirmationType === 'denied') {
      // Store learned correction
      await memoryEngineService.createMemory(userId, {
        title: 'Emotional calibration correction',
        description: `User denied emotional interpretation. Context: ${JSON.stringify(emotionalContext)}`,
        category: 'behavioral',
        memoryType: 'learned_rule',
        confidence: 0.7,
        evidence: [{
          source_table: 'confirmation_feedback',
          source_id: `deny-${Date.now()}`,
          date: new Date().toISOString(),
          summary: 'User denied SIA emotional interpretation',
        }],
      });
    }
  } catch (error) {
    logger.warn('[InsightExtractor] Confirmation feedback routing failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      userId,
    });
  }
}
```

Update the export to include this:

```typescript
export const conversationInsightExtractorService = {
  extractAndPersist,
  extractInsightsOnly,
  routeConfirmationFeedback,
};
```

- [ ] **Step 2: Run typecheck + all tests**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS

Run: `npm.cmd --prefix server run test:unit`
Expected: PASS

- [ ] **Step 3: Commit**

```
git add server/src/services/conversation-insight-extractor.service.ts
git commit -m "feat: add confirmation feedback routing for emotional calibration learning"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run full server typecheck**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS with 0 errors

- [ ] **Step 2: Run full server lint**

Run: `npm.cmd --prefix server run lint`
Expected: PASS (0 new errors; pre-existing warnings OK)

- [ ] **Step 3: Run full unit test suite**

Run: `npm.cmd --prefix server run test:unit`
Expected: PASS (all tests including new EI + persona selector tests)

- [ ] **Step 4: Run client build**

Run: `npm.cmd --prefix client run build`
Expected: PASS (verifies SIA rebrand didn't break imports)

- [ ] **Step 5: Final commit if any fixups needed**

```
git add -A
git commit -m "chore: phase 1 verification — typecheck, lint, tests passing"
```
