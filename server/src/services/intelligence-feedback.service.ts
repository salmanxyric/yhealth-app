/**
 * @file Intelligence Feedback Service
 * @description Closes the feedback loop: corrections become memories,
 * rejections reduce confidence, verifications strengthen decisions.
 */

import { query } from '../config/database.config.js';
import { memoryEngineService } from './memory-engine.service.js';
import type {
  FeedbackAction,
  IntelligenceFeedback,
  SubmitFeedbackInput,
} from '@shared/types/domain/intelligence-files.js';

class IntelligenceFeedbackService {

  async submitFeedback(userId: string, input: SubmitFeedbackInput): Promise<IntelligenceFeedback> {
    let confidenceDelta: number | null = null;
    const memoriesAffected: string[] = [];

    switch (input.action) {
      case 'verify':
        if (input.targetType === 'memory') {
          const result = await memoryEngineService.processUserFeedback(
            input.targetId, userId, 'verify'
          );
          confidenceDelta = 0.15;
          memoriesAffected.push(result.memory.id);
        }
        break;

      case 'reject':
        if (input.targetType === 'memory') {
          const result = await memoryEngineService.processUserFeedback(
            input.targetId, userId, 'reject', undefined, input.comment
          );
          memoriesAffected.push(result.memory.id);
        }
        break;

      case 'correct':
        if (input.targetType === 'memory' && input.correctionData) {
          const result = await memoryEngineService.processUserFeedback(
            input.targetId, userId, 'correct',
            input.correctionData as { title?: string; description?: string },
            input.comment
          );
          memoriesAffected.push(result.memory.id);
          if (result.counterMemoryId) {
            memoriesAffected.push(result.counterMemoryId);
          }
        }
        break;

      case 'dismiss':
        if (input.targetType === 'memory') {
          const result = await memoryEngineService.processUserFeedback(
            input.targetId, userId, 'dismiss'
          );
          confidenceDelta = -0.1;
          memoriesAffected.push(result.memory.id);
        }
        break;

      case 'pin':
      case 'expand':
        // These actions are handled by the artifact/plan update endpoints
        break;
    }

    const feedbackResult = await query(
      `INSERT INTO intelligence_feedback
       (user_id, target_type, target_id, action, correction_data, comment, confidence_delta, memories_affected)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId, input.targetType, input.targetId, input.action,
        input.correctionData ? JSON.stringify(input.correctionData) : null,
        input.comment || null,
        confidenceDelta,
        memoriesAffected,
      ]
    );

    return this.mapRow(feedbackResult.rows[0]);
  }

  async getUserFeedbackHistory(
    userId: string,
    limit: number = 50
  ): Promise<IntelligenceFeedback[]> {
    const result = await query(
      `SELECT * FROM intelligence_feedback
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map((r: Record<string, unknown>) => this.mapRow(r));
  }

  private mapRow(row: Record<string, unknown>): IntelligenceFeedback {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      targetType: row.target_type as IntelligenceFeedback['targetType'],
      targetId: row.target_id as string,
      action: row.action as FeedbackAction,
      correctionData: (row.correction_data as Record<string, unknown>) || null,
      comment: (row.comment as string) || null,
      confidenceDelta: (row.confidence_delta as number) || null,
      memoriesAffected: (row.memories_affected as string[]) || [],
      createdAt: (row.created_at as Date).toISOString(),
    };
  }
}

export const intelligenceFeedbackService = new IntelligenceFeedbackService();
