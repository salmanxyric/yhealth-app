import type { z } from 'zod';

export type ToolMutationType = 'read' | 'create' | 'update' | 'delete';

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodType;
  handler: (userId: string, params: any) => Promise<string>;
  icon?: string;
  mutationType?: ToolMutationType;
  semanticDelta?: (params: any, result: any) => string;
  undoHandler?: (userId: string, operationId: string, originalParams: any, originalResult: any) => Promise<string>;
}

export interface ToolOperation {
  id: string;
  userId: string;
  conversationId?: string;
  agentTurnId: string;
  toolName: string;
  mutationType: ToolMutationType;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  semanticDelta?: string;
  icon?: string;
  status: 'pending' | 'completed' | 'failed' | 'undone';
  createdAt: Date;
  completedAt?: Date;
  undoneAt?: Date;
}

export interface StreamToolCallEvent {
  operationId: string;
  toolName: string;
  label: string;
  icon?: string;
}

export interface StreamToolResultEvent {
  operationId: string;
  toolName: string;
  success: boolean;
  delta: string;
  icon?: string;
  undoable: boolean;
  label?: string;
}
