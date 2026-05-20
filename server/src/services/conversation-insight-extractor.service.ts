import OpenAI from 'openai';
import { query } from '../config/database.config.js';
import { env } from '../config/env.config.js';
import { getTokenParameter } from '../utils/openai-tokens.util.js';
import { logger } from './logger.service.js';
import { memoryEngineService } from './memory-engine.service.js';

import { coreProfileKernelService } from './core-profile-kernel.service.js';
import type { MemoryEvidence } from '@shared/types/domain/intelligence-files.js';
import type {
  TurnInsights,
  ExtractAndPersistParams,
  MemoryCandidate,
  CoreProfileUpdate,
} from '@shared/types/domain/turn-insights.js';

const MIN_MESSAGE_LENGTH = 10;
const SIGNAL_PROMOTION_THRESHOLD = 3;

function escapeLikePattern(text: string): string {
  return text.replace(/[%_\\]/g, '\\$&');
}

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
- If the turn is purely transactional (navigation, commands), return empty arrays for memory_candidates and core_profile_updates
- emotional_context: ALWAYS populate. Analyze the user's emotional state, tone, hidden states, and needs. Consider conversation history for trajectory and engagement patterns.
  - toneMarkers: detect passive, deflecting, aggressive, flat, warm, guarded, performative, desperate, resigned, intellectualizing, minimizing, catastrophizing
  - hiddenStates: detect masking (positive words + negative signals), suppressing, contradicting, avoiding, dissociating, people_pleasing, emotional_shutdown, hypervigilance
  - Detect self-sabotage: repeated goal-set then abandon patterns
  - Detect emotional shutdown: progressively shorter responses, flat tone, withdrawal
  - responseComplexity: compare current message length/detail to conversation history
- Respond with valid JSON only, no prose`;

class ConversationInsightExtractorService {
  private openai: OpenAI | null;

  constructor() {
    this.openai = env.openai.apiKey
      ? new OpenAI({ apiKey: env.openai.apiKey })
      : null;
  }

  async extractAndPersist(params: ExtractAndPersistParams): Promise<void> {
    const { userId, userMessage, coachResponse, conversationId } = params;

    if (userMessage.length < MIN_MESSAGE_LENGTH) return;
    if (!this.openai) {
      logger.debug('[InsightExtractor] No OpenAI key configured, skipping');
      return;
    }

    let insights: TurnInsights;
    try {
      insights = await this.extractInsights(userId, userMessage, coachResponse);
    } catch (error) {
      logger.warn('[InsightExtractor] Extraction failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return;
    }

    const evidence: MemoryEvidence = {
      source_table: 'rag_conversations',
      source_id: conversationId,
      date: new Date().toISOString().split('T')[0],
      summary: userMessage.substring(0, 200),
    };

    await Promise.allSettled([
      this.routeMemoryCandidates(userId, insights.memory_candidates, evidence),
      this.routeCoreProfileUpdates(userId, insights.core_profile_updates),
      this.routeVectorEmbedding(userId, conversationId, insights),
      this.routeToDailyAnalysis(userId, insights),
      this.routeMoodLog(userId, insights),
    ]);

    const candidateCount = insights.memory_candidates.length;
    const profileCount = insights.core_profile_updates.length;
    if (candidateCount > 0 || profileCount > 0) {
      logger.info('[InsightExtractor] Processed turn', {
        userId,
        conversationId,
        memoryCandidates: candidateCount,
        coreProfileUpdates: profileCount,
        mood: insights.mood?.state ?? 'none',
        intent: insights.intent,
      });
    }
  }

  private async extractInsights(
    userId: string,
    userMessage: string,
    coachResponse: string
  ): Promise<TurnInsights> {
    const existingMemories = await memoryEngineService.getMemoriesForContext(userId, userMessage, 20);
    const existingTitles = existingMemories.map((m: { title: string }) => `- ${m.title}`).join('\n') || '(none)';

    const prompt = EXTRACTION_PROMPT
      .replace('{existingMemoryTitles}', existingTitles)
      .replace('{userMessage}', userMessage)
      .replace('{coachResponse}', coachResponse);

    const response = await this.openai!.chat.completions.create({
      model: env.openai.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Respond with strict JSON only, no prose.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      ...getTokenParameter(env.openai.model || 'gpt-4o-mini', 1000),
    });

    const content = response.choices[0]?.message?.content ?? '';
    return JSON.parse(content) as TurnInsights;
  }

  async extractInsightsOnly(
    userMessage: string,
    coachResponse: string,
    existingMemoryTitles: string,
  ): Promise<TurnInsights> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const prompt = EXTRACTION_PROMPT
      .replace('{existingMemoryTitles}', existingMemoryTitles || '(none)')
      .replace('{userMessage}', userMessage)
      .replace('{coachResponse}', coachResponse);

    const response = await this.openai.chat.completions.create({
      model: env.openai.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Respond with strict JSON only, no prose.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      ...getTokenParameter(env.openai.model || 'gpt-4o-mini', 1500),
    });

    const content = response.choices[0]?.message?.content ?? '';
    return JSON.parse(content) as TurnInsights;
  }

  private async routeMemoryCandidates(
    userId: string,
    candidates: MemoryCandidate[],
    evidence: MemoryEvidence
  ): Promise<void> {
    for (const candidate of candidates) {
      try {
        const similar = await memoryEngineService.findSimilarMemories(
          userId,
          candidate.category,
          candidate.title,
          5
        );

        if (similar.length > 0) {
          await memoryEngineService.reinforceMemory(similar[0].id, userId, [evidence]);
          continue;
        }

        await this.upsertPendingSignal(userId, candidate, evidence);
      } catch (error) {
        logger.debug('[InsightExtractor] Memory candidate routing failed', {
          userId,
          title: candidate.title,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }
  }

  private async upsertPendingSignal(
    userId: string,
    candidate: MemoryCandidate,
    evidence: MemoryEvidence
  ): Promise<void> {
    const escapedTitle = escapeLikePattern(candidate.title);
    const escapedPrefix = escapeLikePattern(candidate.title.split(' ').slice(0, 3).join(' '));
    const existing = await query(
      `SELECT id, occurrence_count, evidence, promoted_memory_id
       FROM intelligence_pending_signals
       WHERE user_id = $1 AND category = $2
         AND (title ILIKE $3 OR title ILIKE $4)
         AND promoted_memory_id IS NULL
       LIMIT 1`,
      [userId, candidate.category, `%${escapedTitle}%`, `%${escapedPrefix}%`]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const newCount = (row.occurrence_count as number) + 1;
      const existingEvidence = (row.evidence as MemoryEvidence[]) || [];
      const mergedEvidence = [...existingEvidence, evidence];

      await query(
        `UPDATE intelligence_pending_signals
         SET occurrence_count = $2, last_seen_at = NOW(),
             evidence = $3, updated_at = NOW()
         WHERE id = $1`,
        [row.id, newCount, JSON.stringify(mergedEvidence)]
      );

      if (newCount >= SIGNAL_PROMOTION_THRESHOLD && !row.promoted_memory_id) {
        await this.promoteSignal(userId, row.id as string, candidate, mergedEvidence);
      }
    } else {
      await query(
        `INSERT INTO intelligence_pending_signals
         (user_id, title, description, category, memory_type, confidence, evidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          candidate.title,
          candidate.description,
          candidate.category,
          candidate.memoryType,
          candidate.confidence,
          JSON.stringify([evidence]),
        ]
      );
    }
  }

  private async promoteSignal(
    userId: string,
    signalId: string,
    candidate: MemoryCandidate,
    evidence: MemoryEvidence[]
  ): Promise<void> {
    try {
      const result = await memoryEngineService.findOrCreatePattern(
        userId,
        candidate.category,
        candidate.title.slice(0, 255),
        candidate.description,
        evidence.slice(0, 10),
        'ai'
      );

      await query(
        `UPDATE intelligence_pending_signals SET promoted_memory_id = $1, updated_at = NOW() WHERE id = $2`,
        [result.memory.id, signalId]
      );

      logger.info('[InsightExtractor] Promoted pending signal to memory', {
        userId,
        signalId,
        memoryId: result.memory.id,
        title: candidate.title,
      });
    } catch (error) {
      logger.warn('[InsightExtractor] Signal promotion failed', {
        userId,
        signalId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  private async routeCoreProfileUpdates(
    userId: string,
    updates: CoreProfileUpdate[]
  ): Promise<void> {
    for (const update of updates) {
      try {
        await coreProfileKernelService.updateValue(
          userId,
          update.section,
          update.key,
          update.value,
          update.unit
        );
      } catch (error) {
        logger.debug('[InsightExtractor] Core profile update failed', {
          userId,
          section: update.section,
          key: update.key,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async routeVectorEmbedding(
    _userId: string,
    _conversationId: string,
    _insights: TurnInsights
  ): Promise<void> {
    // Insight data flows through memory candidates + daily analysis.
    // Embedding enqueue was never wired to a worker handler and used a
    // non-UUID sourceId that would fail at INSERT. Removed in pipeline
    // hardening — see embedding-worker.ts for supported source types.
    return;
  }

  private async routeToDailyAnalysis(
    userId: string,
    insights: TurnInsights
  ): Promise<void> {
    const claims = insights.memory_candidates.map(c => ({
      claim: c.title,
      category: c.category,
      evidence: c.description,
    }));

    if (claims.length === 0) return;

    try {
      const values = claims.map((_, i) => {
        const offset = i * 4;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      });
      const params = claims.flatMap(c => [userId, c.claim, c.category, c.evidence]);

      await query(
        `INSERT INTO conversation_claims (user_id, claim, category, evidence)
         VALUES ${values.join(', ')}`,
        params
      );
    } catch (error) {
      logger.debug('[InsightExtractor] Conversation claims insert failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  private async routeMoodLog(
    userId: string,
    insights: TurnInsights
  ): Promise<void> {
    if (!insights.mood) return;

    try {
      const moodRating = Math.round(insights.mood.intensity * 10);
      const clampedRating = Math.max(1, Math.min(10, moodRating));
      await query(
        `INSERT INTO mood_logs (user_id, mood_rating, happiness_rating, context_note, mode, logged_at)
         VALUES ($1, $2, $3, $4, 'deep', NOW())`,
        [userId, clampedRating, clampedRating, `AI-extracted: ${insights.mood.state}`]
      );
    } catch (error) {
      logger.debug('[InsightExtractor] Mood log insert failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }
}

export const conversationInsightExtractorService = new ConversationInsightExtractorService();
