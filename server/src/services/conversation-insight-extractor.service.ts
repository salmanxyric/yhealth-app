import OpenAI from 'openai';
import { query } from '../config/database.config.js';
import { env } from '../config/env.config.js';
import { logger } from './logger.service.js';
import { memoryEngineService } from './memory-engine.service.js';
import { embeddingQueueService } from './embedding-queue.service.js';
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
  "core_profile_updates": [{ "section": "biometrics"|"targets"|"constraints"|"preferences"|"medical"|"lifestyle", "key": string, "value": any, "unit": string|null, "source": string }]
}

Rules:
- Only extract insights clearly stated or strongly implied
- memory_candidates: only genuinely new insights not in EXISTING USER MEMORIES
- core_profile_updates: only when user explicitly states a preference or fact about themselves
- mood: null if no emotional signal detected
- behavioral_signals: null if no behavioral pattern detected
- If the turn is purely transactional (navigation, commands), return empty arrays for memory_candidates and core_profile_updates
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
      max_tokens: 1000,
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
    const existing = await query(
      `SELECT id, occurrence_count, evidence, promoted_memory_id
       FROM intelligence_pending_signals
       WHERE user_id = $1 AND category = $2
         AND (title ILIKE $3 OR title ILIKE $4)
         AND promoted_memory_id IS NULL
       LIMIT 1`,
      ...(() => {
        const escapedTitle = escapeLikePattern(candidate.title);
        const escapedPrefix = escapeLikePattern(candidate.title.split(' ').slice(0, 3).join(' '));
        return [userId, candidate.category, `%${escapedTitle}%`, `%${escapedPrefix}%`];
      })()
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

  private async routeVectorEmbedding(
    userId: string,
    conversationId: string,
    insights: TurnInsights
  ): Promise<void> {
    if (!embeddingQueueService.isAvailable()) return;

    try {
      const textContent = [
        insights.mood ? `Mood: ${insights.mood.state} (${insights.mood.intensity})` : '',
        `Intent: ${insights.intent}`,
        ...insights.memory_candidates.map(c => `${c.category}: ${c.title} - ${c.description}`),
        ...insights.core_profile_updates.map(u => `${u.section}.${u.key}: ${u.value}`),
      ].filter(Boolean).join('\n');

      if (textContent.length < 20) return;

      await embeddingQueueService.enqueueEmbedding({
        userId,
        sourceType: 'insight_extraction',
        sourceId: `${conversationId}-${Date.now()}`,
        operation: 'create',
      });
    } catch (error) {
      logger.debug('[InsightExtractor] Embedding queue failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
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
      await query(
        `INSERT INTO daily_analysis_reports (user_id, report_date, snapshot, insights, cross_domain_insights)
         VALUES ($1, CURRENT_DATE, '{}'::jsonb, $2::jsonb, '[]'::jsonb)
         ON CONFLICT (user_id, report_date)
         DO UPDATE SET
           insights = COALESCE(daily_analysis_reports.insights, '[]'::jsonb) || $2::jsonb,
           updated_at = NOW()`,
        [userId, JSON.stringify(claims)]
      );
    } catch (error) {
      logger.debug('[InsightExtractor] Daily analysis upsert failed', {
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
        `INSERT INTO mood_logs (user_id, mood_rating, context_note, mode, logged_at)
         VALUES ($1, $2, $3, 'light', NOW())`,
        [userId, clampedRating, `AI-extracted: ${insights.mood.state}`]
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
