/**
 * @file Tool Audit Service
 * @description Fire-and-forget audit logging for AI tool mutations.
 * Writes to `tool_audit_log` table. If the table doesn't exist
 * (migration not yet run), the write silently fails.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

export interface ToolAuditEntry {
  userId: string;
  conversationId?: string;
  toolName: string;
  mutationType: string;
  toolArgs: Record<string, unknown>;
  toolResult?: string;
  entityType?: string | null;
  entityId?: string | null;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
  idempotencyKey?: string | null;
}

// ============================================
// SERVICE
// ============================================

class ToolAuditService {
  logToolExecution(entry: ToolAuditEntry): void {
    void this.writeAuditLog(entry).catch(() => {
      // Silent — table may not exist yet
    });
  }

  private async writeAuditLog(entry: ToolAuditEntry): Promise<void> {
    try {
      await query(
        `INSERT INTO tool_audit_log
          (user_id, conversation_id, tool_name, mutation_type, tool_args,
           tool_result, entity_type, entity_id, duration_ms, success,
           error_message, idempotency_key)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12)`,
        [
          entry.userId,
          entry.conversationId || null,
          entry.toolName,
          entry.mutationType,
          JSON.stringify(entry.toolArgs),
          entry.toolResult || null,
          entry.entityType || null,
          entry.entityId || null,
          entry.durationMs,
          entry.success,
          entry.errorMessage || null,
          entry.idempotencyKey || null,
        ]
      );
    } catch (err) {
      const msg = (err as Error).message;
      if (!msg.includes('tool_audit_log')) {
        logger.debug('[ToolAudit] Write failed', { error: msg, tool: entry.toolName });
      }
    }
  }

  async getRecentMutations(userId: string, options: {
    daysBack?: number;
    mutationType?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const { daysBack = 7, mutationType, limit = 50 } = options;
    try {
      const params: any[] = [userId, daysBack, limit];
      let whereClause = 'user_id = $1 AND created_at >= NOW() - ($2 || \' days\')::interval';

      if (mutationType) {
        whereClause += ' AND mutation_type = $4';
        params.push(mutationType);
      }

      const result = await query(
        `SELECT tool_name, mutation_type, entity_type, entity_id,
                duration_ms, success, error_message, created_at
           FROM tool_audit_log
          WHERE ${whereClause}
          ORDER BY created_at DESC
          LIMIT $3`,
        params
      );
      return result.rows;
    } catch {
      return [];
    }
  }
}

export const toolAuditService = new ToolAuditService();
