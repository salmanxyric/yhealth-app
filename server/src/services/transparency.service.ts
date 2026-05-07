/**
 * @file Transparency Service
 * @description Tracks and exposes which intelligence was used for each AI response.
 * Persists to intelligence_session_context for per-message auditability.
 */

import { query } from '../config/database.config.js';
import { memoryEngineService } from './memory-engine.service.js';
import { coreProfileKernelService } from './core-profile-kernel.service.js';
import type {
  MemoryReference,
  CoreProfileReference,
  TransparencyData,
} from '@shared/types/domain/intelligence-files.js';

interface PreparedContext {
  memoriesForPrompt: string;
  coreProfileForPrompt: string;
  memoriesUsed: MemoryReference[];
  coreProfileUsed: CoreProfileReference[];
  overallConfidence: number;
}

class TransparencyService {

  async prepareContext(
    userId: string,
    userMessage: string,
    _conversationId: string
  ): Promise<PreparedContext> {
    const [memories, profileSummary, profile] = await Promise.all([
      memoryEngineService.getMemoriesForContext(userId, userMessage, 10),
      coreProfileKernelService.getProfileSummary(userId),
      coreProfileKernelService.getProfile(userId),
    ]);

    const memoriesUsed: MemoryReference[] = memories.map((m) => ({
      memoryId: m.id,
      title: m.title,
      memoryType: m.memoryType,
      confidence: m.confidence,
      relevanceScore: m.confidence,
    }));

    const coreProfileUsed: CoreProfileReference[] = [];
    const allEntries = [
      ...profile.biometrics,
      ...profile.targets,
      ...profile.constraints,
      ...profile.preferences,
      ...profile.medical,
      ...profile.lifestyle,
    ];
    for (const entry of allEntries) {
      if (entry.confidence >= 0.3) {
        coreProfileUsed.push({
          section: entry.section,
          key: entry.key,
          value: entry.value,
          unit: entry.unit || undefined,
        });
      }
    }

    const avgConfidence =
      memoriesUsed.length > 0
        ? memoriesUsed.reduce((sum, m) => sum + m.confidence, 0) / memoriesUsed.length
        : 0;

    const memoriesForPrompt = memoryEngineService.formatMemoriesForPrompt(memories);
    const coreProfileForPrompt = profileSummary;

    return {
      memoriesForPrompt,
      coreProfileForPrompt,
      memoriesUsed,
      coreProfileUsed,
      overallConfidence: Math.round(avgConfidence * 100) / 100,
    };
  }

  async recordUsage(
    userId: string,
    conversationId: string,
    messageId: string | null,
    data: {
      memoriesUsed: MemoryReference[];
      coreProfileUsed: CoreProfileReference[];
      overallConfidence: number;
    }
  ): Promise<void> {
    await query(
      `INSERT INTO intelligence_session_context
       (user_id, conversation_id, message_id, memories_used, core_profile_used, overall_confidence)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (conversation_id, message_id) WHERE message_id IS NOT NULL
       DO UPDATE SET
         memories_used = $4,
         core_profile_used = $5,
         overall_confidence = $6,
         updated_at = NOW()`,
      [
        userId, conversationId, messageId,
        JSON.stringify(data.memoriesUsed),
        JSON.stringify(data.coreProfileUsed),
        data.overallConfidence,
      ]
    );
  }

  async getMessageTransparency(
    userId: string,
    messageId: string
  ): Promise<TransparencyData | null> {
    const result = await query(
      `SELECT * FROM intelligence_session_context
       WHERE user_id = $1 AND message_id = $2`,
      [userId, messageId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async getConversationTransparency(
    userId: string,
    conversationId: string
  ): Promise<TransparencyData[]> {
    const result = await query(
      `SELECT * FROM intelligence_session_context
       WHERE user_id = $1 AND conversation_id = $2
       ORDER BY created_at ASC`,
      [userId, conversationId]
    );

    return result.rows.map((r: Record<string, unknown>) => this.mapRow(r));
  }

  async submitHelpfulness(
    userId: string,
    messageId: string,
    wasHelpful: boolean,
    correction?: string
  ): Promise<void> {
    await query(
      `UPDATE intelligence_session_context
       SET was_helpful = $3, correction = $4, updated_at = NOW()
       WHERE user_id = $1 AND message_id = $2`,
      [userId, messageId, wasHelpful, correction || null]
    );
  }

  private mapRow(row: Record<string, unknown>): TransparencyData {
    return {
      conversationId: row.conversation_id as string,
      messageId: (row.message_id as string) || null,
      memoriesUsed: (row.memories_used as MemoryReference[]) || [],
      coreProfileUsed: (row.core_profile_used as CoreProfileReference[]) || [],
      analysesUsed: [],
      overallConfidence: (row.overall_confidence as number) || null,
      confidenceBreakdown: null,
      wasHelpful: row.was_helpful as boolean | null,
      correction: (row.correction as string) || null,
    };
  }
}

export const transparencyService = new TransparencyService();
