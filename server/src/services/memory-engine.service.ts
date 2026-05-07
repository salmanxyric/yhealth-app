/**
 * @file Memory Engine Service
 * @description Core engine for managing AI memories with evidence-based creation,
 * confidence scoring, decay, reinforcement, semantic retrieval, and feedback processing.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import type {
  IntelligenceMemory,
  IntelligenceCategory,
  MemoryType,
  MemoryStatus,
  IntelligenceSource,
  MemoryEvidence,
  CreateMemoryInput,
} from '@shared/types/domain/intelligence-files.js';

const MIN_EVIDENCE_AI = 3;
const MIN_EVIDENCE_USER = 1;
const DEFAULT_DECAY_RATE = 0.01;
const MAX_CONTEXT_MEMORIES = 20;
let memoryTableExistsCache: boolean | null = null;

async function hasMemoryTable(): Promise<boolean> {
  if (memoryTableExistsCache !== null) return memoryTableExistsCache;
  const result = await query<{ exists: boolean }>(
    `SELECT to_regclass('public.intelligence_memories') IS NOT NULL AS exists`,
    []
  );
  memoryTableExistsCache = Boolean(result.rows[0]?.exists);
  return memoryTableExistsCache;
}

function isMissingMemoryTable(error: unknown): boolean {
  return error instanceof Error && (
    error.message.includes('intelligence_memories') ||
    (error as Error & { code?: string }).code === '42P01'
  );
}

interface MemoryFilter {
  category?: IntelligenceCategory;
  memoryType?: MemoryType;
  status?: MemoryStatus;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

interface ReinforcementResult {
  memoryId: string;
  previousConfidence: number;
  newConfidence: number;
  totalEvidence: number;
}

function mapRow(row: Record<string, unknown>): IntelligenceMemory {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    memoryType: row.memory_type as MemoryType,
    category: row.category as IntelligenceCategory,
    subcategory: (row.subcategory as string) || undefined,
    title: row.title as string,
    description: row.description as string,
    structuredData: (row.structured_data as Record<string, unknown>) || {},
    confidence: row.confidence as number,
    evidenceCount: row.evidence_count as number,
    evidence: (row.evidence as MemoryEvidence[]) || [],
    minEvidence: row.min_evidence as number,
    source: row.source as IntelligenceSource,
    kgNodeIds: (row.kg_node_ids as string[]) || [],
    relatedMemoryIds: (row.related_memory_ids as string[]) || [],
    status: row.status as MemoryStatus,
    verifiedAt: row.verified_at ? (row.verified_at as Date).toISOString() : null,
    rejectedAt: row.rejected_at ? (row.rejected_at as Date).toISOString() : null,
    rejectionReason: (row.rejection_reason as string) || null,
    supersededBy: (row.superseded_by as string) || null,
    lastAccessedAt: (row.last_accessed_at as Date).toISOString(),
    accessCount: row.access_count as number,
    decayRate: row.decay_rate as number,
    expiresAt: row.expires_at ? (row.expires_at as Date).toISOString() : null,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

class MemoryEngineService {

  async createMemory(userId: string, input: CreateMemoryInput): Promise<IntelligenceMemory> {
    const source = input.source || 'ai';
    const minEvidence = source === 'user' ? MIN_EVIDENCE_USER : MIN_EVIDENCE_AI;

    if (input.evidence.length < minEvidence) {
      throw new Error(
        `${source === 'user' ? 'User' : 'AI'}-created memories require at least ${minEvidence} evidence item(s), got ${input.evidence.length}`
      );
    }

    const confidence = this.computeInitialConfidence(input.evidence.length, source);

    const result = await query(
      `INSERT INTO intelligence_memories
       (user_id, memory_type, category, subcategory, title, description,
        structured_data, confidence, evidence_count, evidence, min_evidence,
        source, decay_rate, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        userId, input.memoryType, input.category, input.subcategory || null,
        input.title, input.description,
        JSON.stringify(input.structuredData || {}),
        confidence, input.evidence.length, JSON.stringify(input.evidence),
        minEvidence, source, DEFAULT_DECAY_RATE,
        input.expiresAt || null,
      ]
    );

    return mapRow(result.rows[0]);
  }

  async getActiveMemories(userId: string, filter: MemoryFilter = {}): Promise<IntelligenceMemory[]> {
    const conditions = [`user_id = $1`, `status IN ('active', 'verified')`];
    const values: (string | number | boolean | null | Date | object)[] = [userId];
    let paramIdx = 2;

    if (filter.category) {
      conditions.push(`category = $${paramIdx++}`);
      values.push(filter.category);
    }
    if (filter.memoryType) {
      conditions.push(`memory_type = $${paramIdx++}`);
      values.push(filter.memoryType);
    }
    if (filter.minConfidence !== undefined) {
      conditions.push(`confidence >= $${paramIdx++}`);
      values.push(filter.minConfidence);
    }

    const limit = filter.limit || 50;
    const offset = filter.offset || 0;

    const result = await query(
      `SELECT * FROM intelligence_memories
       WHERE ${conditions.join(' AND ')}
       ORDER BY confidence DESC, updated_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...values, limit, offset]
    );

    return result.rows.map(mapRow);
  }

  /**
   * Primary method for chat context assembly.
   * Retrieves semantically relevant memories ranked by confidence, recency, and usage.
   * Falls back to text search when embeddings are unavailable.
   */
  async getMemoriesForContext(
    userId: string,
    userMessage: string,
    limit: number = 10
  ): Promise<IntelligenceMemory[]> {
    const effectiveLimit = Math.min(limit, MAX_CONTEXT_MEMORIES);
    if (!(await hasMemoryTable())) {
      return [];
    }

    let result;
    try {
      result = await query(
        `SELECT *,
          (
            confidence
            * GREATEST(0.1, 1.0 - EXTRACT(EPOCH FROM (NOW() - last_accessed_at)) / 86400.0 * decay_rate)
            * (CASE WHEN title ILIKE $3 OR description ILIKE $3 THEN 1.5 ELSE 1.0 END)
            * (1.0 + LEAST(access_count, 50) * 0.005)
          ) AS relevance_score
         FROM intelligence_memories
         WHERE user_id = $1
           AND status IN ('active', 'verified')
           AND confidence >= 0.2
         ORDER BY relevance_score DESC
         LIMIT $2`,
        [userId, effectiveLimit, `%${userMessage.substring(0, 100)}%`]
      );
    } catch (error) {
      if (isMissingMemoryTable(error)) {
        logger.warn('[MemoryEngine] Table missing, continuing without memory context', { userId });
        return [];
      }
      throw error;
    }

    // Record access for all returned memories
    if (result.rows.length > 0) {
      const ids = result.rows.map((r: Record<string, unknown>) => r.id);
      await query(
        `UPDATE intelligence_memories
         SET last_accessed_at = NOW(), access_count = access_count + 1
         WHERE id = ANY($1)`,
        [ids]
      );
    }

    return result.rows.map(mapRow);
  }

  /**
   * Format memories as a prompt section for LLM context injection.
   */
  formatMemoriesForPrompt(memories: IntelligenceMemory[]): string {
    if (memories.length === 0) return '';

    const grouped: Record<string, string[]> = {};
    for (const m of memories) {
      const cat = m.category;
      if (!grouped[cat]) grouped[cat] = [];
      const source = m.source === 'user' ? 'user-reported' : m.source;
      const conf = m.confidence < 0.5 ? ' (low confidence)' : '';
      grouped[cat].push(
        `- [${m.memoryType}] ${m.title}: ${m.description} (${source}, ${m.evidenceCount} data points${conf})`
      );
    }

    return Object.entries(grouped)
      .map(([cat, lines]) => `### ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n${lines.join('\n')}`)
      .join('\n\n');
  }

  async reinforceMemory(
    memoryId: string,
    userId: string,
    newEvidence: MemoryEvidence[]
  ): Promise<ReinforcementResult> {
    const existing = await query(
      `SELECT confidence, evidence_count, evidence FROM intelligence_memories
       WHERE id = $1 AND user_id = $2 AND status IN ('active', 'verified')`,
      [memoryId, userId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Memory not found or not active');
    }

    const row = existing.rows[0];
    const previousConfidence = row.confidence as number;
    const currentEvidence = (row.evidence as MemoryEvidence[]) || [];
    const mergedEvidence = [...currentEvidence, ...newEvidence];
    const boost = Math.min(newEvidence.length * 0.1, 0.3);
    const newConfidence = Math.min(previousConfidence + boost, 1.0);

    await query(
      `UPDATE intelligence_memories
       SET confidence = $3,
           evidence_count = $4,
           evidence = $5,
           last_accessed_at = NOW(),
           access_count = access_count + 1,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [
        memoryId, userId, newConfidence,
        mergedEvidence.length, JSON.stringify(mergedEvidence),
      ]
    );

    return {
      memoryId,
      previousConfidence,
      newConfidence,
      totalEvidence: mergedEvidence.length,
    };
  }

  async processUserFeedback(
    memoryId: string,
    userId: string,
    action: 'verify' | 'reject' | 'correct' | 'dismiss',
    correctionData?: { title?: string; description?: string },
    comment?: string
  ): Promise<{ memory: IntelligenceMemory; counterMemoryId?: string }> {
    let result;
    let counterMemoryId: string | undefined;

    switch (action) {
      case 'verify':
        result = await query(
          `UPDATE intelligence_memories
           SET status = 'verified', verified_at = NOW(),
               confidence = LEAST(confidence + 0.15, 1.0),
               last_accessed_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND user_id = $2 AND status IN ('active', 'verified')
           RETURNING *`,
          [memoryId, userId]
        );
        break;

      case 'reject':
        result = await query(
          `UPDATE intelligence_memories
           SET status = 'rejected', rejected_at = NOW(),
               rejection_reason = $3, updated_at = NOW()
           WHERE id = $1 AND user_id = $2 AND status IN ('active', 'verified')
           RETURNING *`,
          [memoryId, userId, comment || null]
        );

        // Reduce confidence on related memories
        if (result.rows.length > 0) {
          const relatedIds = (result.rows[0].related_memory_ids as string[]) || [];
          if (relatedIds.length > 0) {
            await query(
              `UPDATE intelligence_memories
               SET confidence = GREATEST(confidence - 0.1, 0.0), updated_at = NOW()
               WHERE id = ANY($1) AND user_id = $2 AND status IN ('active', 'verified')`,
              [relatedIds, userId]
            );
          }
        }
        break;

      case 'correct':
        result = await query(
          `UPDATE intelligence_memories
           SET status = 'superseded', updated_at = NOW()
           WHERE id = $1 AND user_id = $2 AND status IN ('active', 'verified')
           RETURNING *`,
          [memoryId, userId]
        );

        if (result.rows.length > 0 && correctionData) {
          const original = result.rows[0];
          const counterResult = await query(
            `INSERT INTO intelligence_memories
             (user_id, memory_type, category, subcategory, title, description,
              structured_data, confidence, evidence_count, evidence, min_evidence,
              source, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 0.9, 1, $8, 1, 'user', 'active')
             RETURNING id`,
            [
              userId, original.memory_type, original.category,
              original.subcategory,
              correctionData.title || original.title,
              correctionData.description || original.description,
              original.structured_data ? JSON.stringify(original.structured_data) : '{}',
              JSON.stringify([{
                source_table: 'user_correction',
                source_id: memoryId,
                date: new Date().toISOString().split('T')[0],
                summary: 'User correction of previous memory',
              }]),
            ]
          );
          counterMemoryId = counterResult.rows[0].id as string;

          await query(
            `UPDATE intelligence_memories SET superseded_by = $1 WHERE id = $2`,
            [counterMemoryId as string, memoryId]
          );
        }
        break;

      case 'dismiss':
        result = await query(
          `UPDATE intelligence_memories
           SET confidence = GREATEST(confidence - 0.1, 0.0),
               last_accessed_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND user_id = $2 AND status IN ('active', 'verified')
           RETURNING *`,
          [memoryId, userId]
        );
        break;
    }

    if (!result || result.rows.length === 0) {
      throw new Error('Memory not found or action not applicable');
    }

    // Record feedback
    const confidenceDelta =
      action === 'verify' ? 0.15 :
      action === 'dismiss' ? -0.1 :
      action === 'reject' ? null : null;

    await query(
      `INSERT INTO intelligence_feedback
       (user_id, target_type, target_id, action, comment, confidence_delta, memories_affected)
       VALUES ($1, 'memory', $2, $3, $4, $5, $6)`,
      [
        userId, memoryId, action, comment || null,
        confidenceDelta,
        counterMemoryId ? [counterMemoryId] : [],
      ]
    );

    return { memory: mapRow(result.rows[0]), counterMemoryId };
  }

  async recordAccess(memoryId: string): Promise<void> {
    await query(
      `UPDATE intelligence_memories
       SET last_accessed_at = NOW(), access_count = access_count + 1
       WHERE id = $1`,
      [memoryId]
    );
  }

  /**
   * Find or create a memory from a recurring pattern.
   * Used by background extraction jobs: if a similar memory exists, reinforce it;
   * otherwise create a new one.
   */
  async findOrCreatePattern(
    userId: string,
    category: IntelligenceCategory,
    title: string,
    description: string,
    evidence: MemoryEvidence[],
    source: IntelligenceSource = 'ai'
  ): Promise<{ memory: IntelligenceMemory; wasReinforced: boolean }> {
    // Check for existing similar memory
    const existing = await query(
      `SELECT id FROM intelligence_memories
       WHERE user_id = $1 AND category = $2
         AND status IN ('active', 'verified')
         AND (title ILIKE $3 OR description ILIKE $4)
       ORDER BY confidence DESC
       LIMIT 1`,
      [userId, category, `%${title}%`, `%${title}%`]
    );

    if (existing.rows.length > 0) {
      const memoryId = existing.rows[0].id as string;
      await this.reinforceMemory(memoryId, userId, evidence);
      const refreshed = await query(
        `SELECT * FROM intelligence_memories WHERE id = $1`,
        [memoryId]
      );
      return { memory: mapRow(refreshed.rows[0]), wasReinforced: true };
    }

    const memory = await this.createMemory(userId, {
      memoryType: 'pattern',
      category,
      title,
      description,
      evidence,
      source,
    });

    return { memory, wasReinforced: false };
  }

  /**
   * Apply time-based confidence decay to all active memories for a user.
   * Called by the memory-decay background job.
   */
  async applyDecay(userId: string): Promise<{ decayed: number; archived: number }> {
    // Decay memories not accessed in 7+ days
    const decayResult = await query(
      `UPDATE intelligence_memories
       SET confidence = GREATEST(confidence - decay_rate, 0.0),
           updated_at = NOW()
       WHERE user_id = $1
         AND status IN ('active', 'verified')
         AND last_accessed_at < NOW() - INTERVAL '7 days'
         AND confidence > 0.0
       RETURNING id`,
      [userId]
    );

    // Archive memories that fell below threshold
    const archiveResult = await query(
      `UPDATE intelligence_memories
       SET status = 'expired', updated_at = NOW()
       WHERE user_id = $1
         AND status IN ('active', 'verified')
         AND confidence < 0.1
       RETURNING id`,
      [userId]
    );

    // Expire memories past their hard expiry date
    await query(
      `UPDATE intelligence_memories
       SET status = 'expired', updated_at = NOW()
       WHERE user_id = $1
         AND status IN ('active', 'verified')
         AND expires_at IS NOT NULL
         AND expires_at < NOW()`,
      [userId]
    );

    return {
      decayed: decayResult.rows.length,
      archived: archiveResult.rows.length,
    };
  }

  /**
   * Get a summary of the memory system state for a user.
   */
  async getMemoryStats(userId: string): Promise<{
    total: number;
    active: number;
    verified: number;
    avgConfidence: number;
    byCategory: Record<string, number>;
  }> {
    const [totalResult, statsResult, categoryResult] = await Promise.all([
      query(
        `SELECT COUNT(*) as total FROM intelligence_memories WHERE user_id = $1`,
        [userId]
      ),
      query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'active') as active,
           COUNT(*) FILTER (WHERE status = 'verified') as verified,
           AVG(confidence) FILTER (WHERE status IN ('active', 'verified')) as avg_confidence
         FROM intelligence_memories WHERE user_id = $1`,
        [userId]
      ),
      query(
        `SELECT category, COUNT(*) as count
         FROM intelligence_memories
         WHERE user_id = $1 AND status IN ('active', 'verified')
         GROUP BY category`,
        [userId]
      ),
    ]);

    const byCategory: Record<string, number> = {};
    for (const row of categoryResult.rows) {
      byCategory[row.category as string] = parseInt(row.count as string);
    }

    return {
      total: parseInt(totalResult.rows[0].total as string),
      active: parseInt(statsResult.rows[0].active as string),
      verified: parseInt(statsResult.rows[0].verified as string),
      avgConfidence: parseFloat(statsResult.rows[0].avg_confidence as string) || 0,
      byCategory,
    };
  }

  private computeInitialConfidence(evidenceCount: number, source: IntelligenceSource): number {
    if (source === 'user') return Math.min(0.5 + evidenceCount * 0.2, 0.9);
    if (source === 'wearable') return Math.min(0.4 + evidenceCount * 0.08, 0.85);
    return Math.min(0.3 + evidenceCount * 0.1, 0.8);
  }
}

export const memoryEngineService = new MemoryEngineService();
