/**
 * @file Tool Transaction Service
 * @description Manages tool operation tracking for the agentic execution timeline.
 * Records each tool invocation within an agent turn, supports transactional
 * rollback on partial failure, and provides undo capability for individual operations.
 */

import { randomUUID } from 'crypto';
import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import type { ToolDefinition, ToolMutationType, ToolOperation } from './langgraph-tools/types.js';

export interface AgentTurn {
  id: string;
  userId: string;
  conversationId?: string;
  operations: ToolOperation[];
}

class ToolTransactionService {
  private definitionsMap: Map<string, ToolDefinition> = new Map();

  setDefinitions(definitions: Map<string, ToolDefinition>): void {
    this.definitionsMap = definitions;
  }

  startTurn(userId: string, conversationId?: string): AgentTurn {
    return {
      id: randomUUID(),
      userId,
      conversationId,
      operations: [],
    };
  }

  async recordOperation(
    turn: AgentTurn,
    toolName: string,
    args: Record<string, unknown>,
    mutationType: ToolMutationType,
  ): Promise<string> {
    const operationId = randomUUID();
    const def = this.definitionsMap.get(toolName);
    const icon = def?.icon ?? null;
    const label = this.generateLabel(toolName, args);

    const op: ToolOperation = {
      id: operationId,
      userId: turn.userId,
      conversationId: turn.conversationId,
      agentTurnId: turn.id,
      toolName,
      mutationType,
      args,
      icon: icon ?? undefined,
      status: 'pending',
      createdAt: new Date(),
    };
    turn.operations.push(op);

    try {
      await query(
        `INSERT INTO tool_operations
          (id, user_id, conversation_id, agent_turn_id, tool_name, mutation_type, args, icon, label, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
        [operationId, turn.userId, turn.conversationId || null, turn.id, toolName, mutationType, JSON.stringify(args), icon, label],
      );
    } catch (err) {
      logger.warn('[ToolTransaction] Failed to record operation — continuing without persistence', {
        operationId, toolName, error: err instanceof Error ? err.message : 'Unknown',
      });
    }

    return operationId;
  }

  async completeOperation(
    operationId: string,
    result: Record<string, unknown>,
    toolName: string,
  ): Promise<{ semanticDelta: string; undoable: boolean }> {
    const def = this.definitionsMap.get(toolName);
    const undoable = !!def?.undoHandler;

    let semanticDelta = '';
    if (def?.semanticDelta) {
      try {
        const op = await this.getOperation(operationId);
        semanticDelta = def.semanticDelta(op?.args ?? {}, result);
      } catch {
        semanticDelta = '';
      }
    }

    try {
      await query(
        `UPDATE tool_operations
         SET status = 'completed', result = $2, semantic_delta = $3, undoable = $4, completed_at = NOW()
         WHERE id = $1`,
        [operationId, JSON.stringify(result), semanticDelta || null, undoable],
      );
    } catch (err) {
      logger.warn('[ToolTransaction] Failed to complete operation record', {
        operationId, error: err instanceof Error ? err.message : 'Unknown',
      });
    }

    return { semanticDelta, undoable };
  }

  async failOperation(operationId: string, error: string): Promise<void> {
    try {
      await query(
        `UPDATE tool_operations SET status = 'failed', error_message = $2, completed_at = NOW() WHERE id = $1`,
        [operationId, error.slice(0, 2000)],
      );
    } catch (err) {
      logger.warn('[ToolTransaction] Failed to record operation failure', {
        operationId, error: err instanceof Error ? err.message : 'Unknown',
      });
    }
  }

  async rollbackTurn(turn: AgentTurn): Promise<void> {
    const completedOps = turn.operations.filter(op => op.status === 'completed');

    for (const op of completedOps.reverse()) {
      const def = this.definitionsMap.get(op.toolName);
      if (def?.undoHandler && op.result) {
        try {
          await def.undoHandler(op.userId, op.id, op.args, op.result);
          logger.info('[ToolTransaction] Rolled back operation', { operationId: op.id, toolName: op.toolName });
        } catch (err) {
          logger.error('[ToolTransaction] Failed to rollback operation', {
            operationId: op.id, toolName: op.toolName,
            error: err instanceof Error ? err.message : 'Unknown',
          });
        }
      }
    }

    try {
      await query(
        `UPDATE tool_operations SET status = 'failed', error_message = 'Rolled back due to turn failure' WHERE agent_turn_id = $1 AND status IN ('pending', 'completed')`,
        [turn.id],
      );
    } catch (err) {
      logger.warn('[ToolTransaction] Failed to mark turn as rolled back', {
        agentTurnId: turn.id, error: err instanceof Error ? err.message : 'Unknown',
      });
    }
  }

  async undoOperation(userId: string, operationId: string): Promise<{ success: boolean; error?: string }> {
    const op = await this.getOperation(operationId);
    if (!op) return { success: false, error: 'Operation not found' };
    if (op.userId !== userId) return { success: false, error: 'Unauthorized' };
    if (op.status !== 'completed') return { success: false, error: `Cannot undo operation with status: ${op.status}` };

    const def = this.definitionsMap.get(op.toolName);
    if (!def?.undoHandler) return { success: false, error: 'Operation is not undoable' };

    try {
      await def.undoHandler(userId, operationId, op.args, op.result ?? {});

      await query(
        `UPDATE tool_operations SET status = 'undone', undone_at = NOW() WHERE id = $1`,
        [operationId],
      );

      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[ToolTransaction] Undo failed', { operationId, error });
      return { success: false, error };
    }
  }

  async getOperation(operationId: string): Promise<ToolOperation | null> {
    try {
      const result = await query<{
        id: string; user_id: string; conversation_id: string | null;
        agent_turn_id: string; tool_name: string; mutation_type: ToolMutationType;
        args: Record<string, unknown>; result: Record<string, unknown> | null;
        semantic_delta: string | null; icon: string | null;
        status: ToolOperation['status']; created_at: Date;
        completed_at: Date | null; undone_at: Date | null;
      }>(
        'SELECT * FROM tool_operations WHERE id = $1',
        [operationId],
      );

      if (result.rows.length === 0) return null;
      const row = result.rows[0];

      return {
        id: row.id,
        userId: row.user_id,
        conversationId: row.conversation_id ?? undefined,
        agentTurnId: row.agent_turn_id,
        toolName: row.tool_name,
        mutationType: row.mutation_type,
        args: row.args,
        result: row.result ?? undefined,
        semanticDelta: row.semantic_delta ?? undefined,
        icon: row.icon ?? undefined,
        status: row.status,
        createdAt: row.created_at,
        completedAt: row.completed_at ?? undefined,
        undoneAt: row.undone_at ?? undefined,
      };
    } catch (err) {
      logger.error('[ToolTransaction] Failed to get operation', {
        operationId, error: err instanceof Error ? err.message : 'Unknown',
      });
      return null;
    }
  }

  async getTurnOperations(agentTurnId: string): Promise<ToolOperation[]> {
    try {
      const result = await query<{
        id: string; user_id: string; conversation_id: string | null;
        agent_turn_id: string; tool_name: string; mutation_type: ToolMutationType;
        args: Record<string, unknown>; result: Record<string, unknown> | null;
        semantic_delta: string | null; icon: string | null; label: string | null;
        status: ToolOperation['status']; created_at: Date;
        completed_at: Date | null; undone_at: Date | null; undoable: boolean;
      }>(
        'SELECT * FROM tool_operations WHERE agent_turn_id = $1 ORDER BY created_at ASC',
        [agentTurnId],
      );

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        conversationId: row.conversation_id ?? undefined,
        agentTurnId: row.agent_turn_id,
        toolName: row.tool_name,
        mutationType: row.mutation_type,
        args: row.args,
        result: row.result ?? undefined,
        semanticDelta: row.semantic_delta ?? undefined,
        icon: row.icon ?? undefined,
        status: row.status,
        createdAt: row.created_at,
        completedAt: row.completed_at ?? undefined,
        undoneAt: row.undone_at ?? undefined,
      }));
    } catch (err) {
      logger.error('[ToolTransaction] Failed to get turn operations', {
        agentTurnId, error: err instanceof Error ? err.message : 'Unknown',
      });
      return [];
    }
  }

  private generateLabel(toolName: string, _args: Record<string, unknown>): string {
    const lower = toolName.toLowerCase();
    if (lower.includes('meal') || lower.includes('diet') || lower.includes('recipe') || lower.includes('nutrition')) {
      return this.extractFoodLabel(toolName, _args);
    }
    if (lower.includes('workout') || lower.includes('exercise')) {
      return this.extractWorkoutLabel(toolName, _args);
    }
    if (lower.includes('goal')) return ((_args as any).title || (_args as any).name || 'Goal') as string;
    if (lower.includes('journal')) return 'Journal Entry';
    if (lower.includes('habit')) return ((_args as any).name || 'Habit') as string;
    if (lower.includes('schedule') || lower.includes('reminder')) return 'Schedule Item';
    if (lower.includes('water')) return 'Water Intake';

    return toolName.replace(/([A-Z])/g, ' $1').trim();
  }

  private extractFoodLabel(_toolName: string, args: Record<string, unknown>): string {
    const name = (args as any).name || (args as any).mealName || (args as any).foodName || (args as any).title;
    if (name) return name as string;

    const foods = (args as any).foods;
    if (Array.isArray(foods) && foods.length > 0) {
      return foods.map((f: any) => f.name || f.foodName || 'food').join(', ');
    }

    return 'Meal';
  }

  private extractWorkoutLabel(_toolName: string, args: Record<string, unknown>): string {
    return ((args as any).name || (args as any).workoutName || (args as any).title || 'Workout') as string;
  }
}

export const toolTransactionService = new ToolTransactionService();
