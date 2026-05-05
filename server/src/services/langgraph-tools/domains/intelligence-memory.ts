import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import { memoryEngineService } from '../../memory-engine.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

const MEMORY_TYPES = ['pattern', 'preference', 'context', 'feedback', 'relationship', 'learned_rule'] as const;
const CATEGORIES = ['fitness', 'nutrition', 'sleep', 'wellbeing', 'lifestyle', 'behavioral', 'cross_domain'] as const;

const SearchMemoriesSchema = z.object({
  query: z.string().min(1).describe('Search query for user memories'),
  category: z.enum(CATEGORIES).optional().describe('Filter by category'),
  limit: z.number().int().min(1).max(20).optional().describe('Max results (default 10)'),
});

const CreateMemorySchema = z.object({
  memoryType: z.enum(MEMORY_TYPES).describe('Type of memory'),
  category: z.enum(CATEGORIES).describe('Memory category'),
  title: z.string().min(1).max(255).describe('Short descriptive title'),
  description: z.string().min(1).max(2000).describe('Full memory description'),
  evidence: z.array(z.object({
    source_table: z.string().describe('Data source table name'),
    source_id: z.string().optional().describe('Source record ID'),
    date: z.string().describe('Evidence date (YYYY-MM-DD)'),
    summary: z.string().describe('Brief summary of the evidence'),
  })).min(3).describe('Supporting evidence (minimum 3 for AI-created memories)'),
  structuredData: z.record(z.unknown()).optional().describe('Machine-readable data'),
});

const GetMemoryEvidenceSchema = z.object({
  memoryId: z.string().uuid().describe('Memory ID to get evidence for'),
});

async function searchMemories(userId: string, params: z.infer<typeof SearchMemoriesSchema>): Promise<string> {
  const memories = await memoryEngineService.getMemoriesForContext(
    userId, params.query, params.limit || 10
  );

  if (memories.length === 0) {
    return JSON.stringify({ message: 'No matching memories found', memories: [] });
  }

  const formatted = memories.map((m) => ({
    id: m.id,
    type: m.memoryType,
    category: m.category,
    title: m.title,
    description: m.description,
    confidence: m.confidence,
    evidenceCount: m.evidenceCount,
    source: m.source,
    status: m.status,
  }));

  return JSON.stringify({ memories: formatted, count: formatted.length }, null, 2);
}

async function createMemory(userId: string, params: z.infer<typeof CreateMemorySchema>): Promise<string> {
  const memory = await memoryEngineService.createMemory(userId, {
    memoryType: params.memoryType,
    category: params.category,
    title: params.title,
    description: params.description,
    evidence: params.evidence.map((e) => ({
      source_table: e.source_table,
      source_id: e.source_id || '',
      date: e.date,
      summary: e.summary,
    })),
    structuredData: params.structuredData,
    source: 'ai',
  });

  return JSON.stringify({
    success: true,
    message: `Memory "${memory.title}" created with confidence ${Math.round(memory.confidence * 100)}%`,
    data: { id: memory.id, title: memory.title, confidence: memory.confidence },
  });
}

async function getMemoryEvidence(userId: string, params: z.infer<typeof GetMemoryEvidenceSchema>): Promise<string> {
  const memories = await memoryEngineService.getActiveMemories(userId);
  const memory = memories.find((m) => m.id === params.memoryId);

  if (!memory) {
    return JSON.stringify({ success: false, error: 'Memory not found' });
  }

  return JSON.stringify({
    id: memory.id,
    title: memory.title,
    confidence: memory.confidence,
    evidenceCount: memory.evidenceCount,
    evidence: memory.evidence,
    source: memory.source,
    status: memory.status,
    lastAccessed: memory.lastAccessedAt,
  }, null, 2);
}

const UpdateMemorySchema = z.object({
  memoryId: z.string().uuid().describe('Memory ID to update (required)'),
  title: z.string().min(1).max(255).optional().describe('Updated title'),
  description: z.string().min(1).max(2000).optional().describe('Updated description'),
  category: z.enum(CATEGORIES).optional().describe('Updated category'),
  status: z.enum(['active', 'verified', 'archived']).optional().describe('Updated status'),
});

const DeleteMemorySchema = z.object({
  memoryId: z.string().uuid().describe('Memory ID to delete (required)'),
});

async function updateMemory(userId: string, params: z.infer<typeof UpdateMemorySchema>): Promise<string> {
  const existing = await query('SELECT id FROM intelligence_memories WHERE id = $1 AND user_id = $2', [params.memoryId, userId]);
  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Memory not found' });
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (params.title !== undefined) { fields.push(`title = $${paramIndex++}`); values.push(params.title); }
  if (params.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(params.description); }
  if (params.category !== undefined) { fields.push(`category = $${paramIndex++}`); values.push(params.category); }
  if (params.status !== undefined) { fields.push(`status = $${paramIndex++}`); values.push(params.status); }

  if (fields.length === 0) {
    return JSON.stringify({ success: false, error: 'No fields to update' });
  }

  fields.push(`updated_at = NOW()`);
  values.push(params.memoryId, userId);

  const result = await query(
    `UPDATE intelligence_memories SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING id, title, category, status`,
    values,
  );

  return JSON.stringify({
    success: true,
    message: `Memory "${result.rows[0].title}" updated`,
    data: result.rows[0],
  });
}

async function deleteMemory(userId: string, params: z.infer<typeof DeleteMemorySchema>): Promise<string> {
  const result = await query('DELETE FROM intelligence_memories WHERE id = $1 AND user_id = $2 RETURNING id, title', [params.memoryId, userId]);
  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Memory not found' });
  }
  return JSON.stringify({ success: true, message: `Memory "${result.rows[0].title}" deleted` });
}

export function registerIntelligenceMemoryTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'searchUserMemories',
      description: 'Search the user\'s intelligence memories. Use when you need to recall a previously learned pattern, preference, or context about the user that goes beyond what\'s in the system prompt.',
      schema: SearchMemoriesSchema,
      icon: 'brain',
      mutationType: 'read' as const,
      handler: withErrorHandling('searchUserMemories', searchMemories),
    },
    {
      name: 'createUserMemory',
      description: 'Create a new memory about the user. Use when you discover a recurring pattern (e.g., "user performs best with morning workouts"), learn a preference, or identify a relationship between behaviors. Requires at least 3 evidence items with source data. Do NOT create memories for one-off observations.',
      schema: CreateMemorySchema,
      icon: 'brain',
      mutationType: 'create' as const,
      semanticDelta: (params: any) => `Learned: ${params.title}`,
      handler: withErrorHandling('createUserMemory', createMemory),
    },
    {
      name: 'getMemoryEvidence',
      description: 'Get the supporting evidence for a specific memory. Use when the user asks "why do you think that?" or wants to understand the basis of a recommendation.',
      schema: GetMemoryEvidenceSchema,
      icon: 'search',
      mutationType: 'read' as const,
      handler: withErrorHandling('getMemoryEvidence', getMemoryEvidence),
    },
    {
      name: 'updateUserMemory',
      description: 'Update an existing memory. Use when you need to correct a memory\'s title, description, category, or archive an outdated memory.',
      schema: UpdateMemorySchema,
      icon: 'brain',
      mutationType: 'update' as const,
      semanticDelta: (params: any) => `Updated memory: ${params.title || params.memoryId}`,
      handler: withErrorHandling('updateUserMemory', updateMemory),
    },
    {
      name: 'deleteUserMemory',
      description: 'Delete a memory that is incorrect or no longer relevant. Use when the user says a learned pattern is wrong.',
      schema: DeleteMemorySchema,
      icon: 'trash',
      mutationType: 'delete' as const,
      semanticDelta: () => 'Deleted memory',
      handler: withErrorHandling('deleteUserMemory', deleteMemory),
    },
  ];
}
