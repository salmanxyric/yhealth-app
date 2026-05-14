/**
 * @file Intelligence Files Controller
 * @description API endpoints for the AI Memory & Intelligence System.
 * Manages memories, artifacts, plans, core profile, logs, and feedback.
 * Mounted at /api/v1/intelligence/files
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { query } from '../config/database.config.js';
import { coreProfileKernelService } from '../services/core-profile-kernel.service.js';
import { transparencyService } from '../services/transparency.service.js';
import {
  createMemorySchema,
  updateMemorySchema,
  rejectMemorySchema,
  updateCoreValueSchema,
  submitFeedbackSchema,
  listMemoriesQuerySchema,
  listArtifactsQuerySchema,
  updateArtifactSchema,
  listLogsQuerySchema,
  searchMemoriesQuerySchema,
  coreSectionEnum,
} from '../validators/intelligence-files.validator.js';
import type { CoreSection } from '@shared/types/domain/intelligence-files.js';

class IntelligenceFilesController {

  // ============================================
  // FOLDERS
  // ============================================

  getFolders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const safeCount = async (sql: string, params: (string | number | boolean | object | Date | null)[]) => {
      try {
        const result = await query(sql, params);
        return { count: parseInt(result.rows[0].count), lastModified: result.rows[0].last_modified?.toISOString() || null };
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (code === '42P01') return { count: 0, lastModified: null };
        throw err;
      }
    };

    const [memories, artifacts, plans, core, logs, notes, wiki] = await Promise.all([
      safeCount(
        `SELECT COUNT(*) as count, MAX(updated_at) as last_modified
         FROM intelligence_memories WHERE user_id = $1 AND status IN ('active', 'verified')`,
        [userId]
      ),
      safeCount(
        `SELECT COUNT(*) as count, MAX(updated_at) as last_modified
         FROM intelligence_artifacts WHERE user_id = $1 AND NOT is_archived`,
        [userId]
      ),
      safeCount(
        `SELECT COUNT(*) as count, MAX(updated_at) as last_modified
         FROM intelligence_plans WHERE user_id = $1 AND NOT is_archived`,
        [userId]
      ),
      safeCount(
        `SELECT COUNT(*) as count, MAX(updated_at) as last_modified
         FROM intelligence_core_profile WHERE user_id = $1`,
        [userId]
      ),
      safeCount(
        `SELECT COUNT(*) as count, MAX(created_at) as last_modified
         FROM intelligence_log_references WHERE user_id = $1`,
        [userId]
      ),
      safeCount(
        `SELECT COUNT(*) as count, MAX(updated_at) as last_modified
         FROM user_files WHERE user_id = $1 AND NOT is_archived`,
        [userId]
      ),
      safeCount(
        `SELECT COUNT(*) as count, MAX(updated_at) as last_modified
         FROM wiki_pages WHERE user_id = $1 AND status IN ('active', 'draft')`,
        [userId]
      ),
    ]);

    const folders = [
      { id: 'memories', label: 'Memories', itemCount: memories.count, lastModified: memories.lastModified },
      { id: 'notes', label: 'Notes', itemCount: notes.count, lastModified: notes.lastModified },
      { id: 'artifacts', label: 'Artifacts', itemCount: artifacts.count, lastModified: artifacts.lastModified },
      { id: 'plans', label: 'Plans', itemCount: plans.count, lastModified: plans.lastModified },
      { id: 'core', label: 'Core', itemCount: core.count, lastModified: core.lastModified },
      { id: 'logs', label: 'Logs', itemCount: logs.count, lastModified: logs.lastModified },
      { id: 'wiki', label: 'Wiki', itemCount: wiki.count, lastModified: wiki.lastModified },
    ];

    ApiResponse.success(res, { folders }, 'Folder summaries retrieved', undefined, req);
  });

  // ============================================
  // MEMORIES
  // ============================================

  listMemories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const params = listMemoriesQuerySchema.parse(req.query);
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [`user_id = $1`];
    const values: (string | number | boolean | null | Date | object)[] = [userId];
    let paramIdx = 2;

    const status = params.status || 'active';
    if (status === 'active') {
      conditions.push(`status IN ('active', 'verified')`);
    } else {
      conditions.push(`status = $${paramIdx}`);
      values.push(status);
      paramIdx++;
    }

    if (params.category) {
      conditions.push(`category = $${paramIdx}`);
      values.push(params.category);
      paramIdx++;
    }
    if (params.memoryType) {
      conditions.push(`memory_type = $${paramIdx}`);
      values.push(params.memoryType);
      paramIdx++;
    }
    if (params.minConfidence !== undefined) {
      conditions.push(`confidence >= $${paramIdx}`);
      values.push(params.minConfidence);
      paramIdx++;
    }

    let orderBy = 'updated_at DESC';
    if (params.sort === 'confidence') orderBy = 'confidence DESC';
    if (params.sort === 'usage') orderBy = 'access_count DESC';

    const where = conditions.join(' AND ');

    const [countResult, dataResult] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM intelligence_memories WHERE ${where}`, values),
      query(
        `SELECT * FROM intelligence_memories WHERE ${where} ORDER BY ${orderBy} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...values, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);

    ApiResponse.success(res, {
      memories: dataResult.rows.map(mapMemoryRow),
    }, {
      message: 'Memories retrieved',
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 },
    });
  });

  getMemory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const result = await query(
      `SELECT * FROM intelligence_memories WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId]
    );

    if (result.rows.length === 0) throw ApiError.notFound('Memory not found');

    await query(
      `UPDATE intelligence_memories SET last_accessed_at = NOW(), access_count = access_count + 1 WHERE id = $1`,
      [req.params.id]
    );

    ApiResponse.success(res, { memory: mapMemoryRow(result.rows[0]) }, 'Memory retrieved', undefined, req);
  });

  createMemory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const data = createMemorySchema.parse(req.body);
    const source = data.source || 'user';
    const minEvidence = source === 'user' ? 1 : 3;

    if (data.evidence.length < minEvidence) {
      throw ApiError.badRequest(`${source === 'user' ? 'User' : 'AI'}-created memories require at least ${minEvidence} evidence item(s)`);
    }

    const confidence = Math.min(0.3 + data.evidence.length * 0.1, source === 'user' ? 0.9 : 0.8);

    const result = await query(
      `INSERT INTO intelligence_memories
       (user_id, memory_type, category, subcategory, title, description, structured_data,
        confidence, evidence_count, evidence, min_evidence, source, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        userId, data.memoryType, data.category, data.subcategory || null,
        data.title, data.description, JSON.stringify(data.structuredData || {}),
        confidence, data.evidence.length, JSON.stringify(data.evidence),
        minEvidence, source, data.expiresAt || null,
      ]
    );

    ApiResponse.success(res, { memory: mapMemoryRow(result.rows[0]) }, { message: 'Memory created', statusCode: 201 });
  });

  updateMemory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const data = updateMemorySchema.parse(req.body);
    const sets: string[] = ['updated_at = NOW()'];
    const values: (string | number | boolean | null | Date | object)[] = [];
    let paramIdx = 1;

    if (data.title !== undefined) {
      sets.push(`title = $${paramIdx}`);
      values.push(data.title);
      paramIdx++;
    }
    if (data.description !== undefined) {
      sets.push(`description = $${paramIdx}`);
      values.push(data.description);
      paramIdx++;
    }
    if (data.structuredData !== undefined) {
      sets.push(`structured_data = $${paramIdx}`);
      values.push(JSON.stringify(data.structuredData));
      paramIdx++;
    }

    if (values.length === 0) throw ApiError.badRequest('No fields to update');

    values.push(req.params.id, userId);
    const result = await query(
      `UPDATE intelligence_memories SET ${sets.join(', ')}
       WHERE id = $${paramIdx} AND user_id = $${paramIdx + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw ApiError.notFound('Memory not found');
    ApiResponse.success(res, { memory: mapMemoryRow(result.rows[0]) }, 'Memory updated', undefined, req);
  });

  verifyMemory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const result = await query(
      `UPDATE intelligence_memories
       SET status = 'verified', verified_at = NOW(), confidence = LEAST(confidence + 0.15, 1.0),
           last_accessed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('active', 'verified')
       RETURNING *`,
      [req.params.id, userId]
    );

    if (result.rows.length === 0) throw ApiError.notFound('Memory not found or not verifiable');

    await query(
      `INSERT INTO intelligence_feedback (user_id, target_type, target_id, action, confidence_delta)
       VALUES ($1, 'memory', $2, 'verify', 0.15)`,
      [userId, req.params.id]
    );

    ApiResponse.success(res, { memory: mapMemoryRow(result.rows[0]) }, 'Memory verified', undefined, req);
  });

  rejectMemory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const data = rejectMemorySchema.parse(req.body);

    const result = await query(
      `UPDATE intelligence_memories
       SET status = 'rejected', rejected_at = NOW(), rejection_reason = $3, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('active', 'verified')
       RETURNING *`,
      [req.params.id, userId, data.reason || null]
    );

    if (result.rows.length === 0) throw ApiError.notFound('Memory not found or already rejected');

    await query(
      `INSERT INTO intelligence_feedback (user_id, target_type, target_id, action, comment)
       VALUES ($1, 'memory', $2, 'reject', $3)`,
      [userId, req.params.id, data.reason || null]
    );

    if (data.correction) {
      await query(
        `INSERT INTO intelligence_memories
         (user_id, memory_type, category, title, description, confidence, evidence_count,
          evidence, min_evidence, source, status)
         SELECT user_id, memory_type, category, title, $3, 0.9, 1,
                $4::jsonb, 1, 'user', 'active'
         FROM intelligence_memories WHERE id = $1 AND user_id = $2`,
        [
          req.params.id, userId, data.correction,
          JSON.stringify([{ source_table: 'user_correction', source_id: req.params.id, date: new Date().toISOString().split('T')[0], summary: 'User correction' }]),
        ]
      );
    }

    ApiResponse.success(res, { memory: mapMemoryRow(result.rows[0]) }, 'Memory rejected', undefined, req);
  });

  expireMemory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const result = await query(
      `UPDATE intelligence_memories
       SET status = 'expired', expires_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('active', 'verified')
       RETURNING *`,
      [req.params.id, userId]
    );

    if (result.rows.length === 0) throw ApiError.notFound('Memory not found');
    ApiResponse.success(res, { memory: mapMemoryRow(result.rows[0]) }, 'Memory expired', undefined, req);
  });

  searchMemories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const params = searchMemoriesQuerySchema.parse(req.query);
    const limit = params.limit || 10;

    const conditions = [`user_id = $1`, `status IN ('active', 'verified')`];
    const values: (string | number | boolean | null | Date | object)[] = [userId];
    let paramIdx = 2;

    if (params.category) {
      conditions.push(`category = $${paramIdx}`);
      values.push(params.category);
      paramIdx++;
    }

    conditions.push(`(title ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`);
    values.push(`%${params.q}%`);
    paramIdx++;

    const where = conditions.join(' AND ');
    const result = await query(
      `SELECT * FROM intelligence_memories WHERE ${where}
       ORDER BY confidence DESC, updated_at DESC LIMIT $${paramIdx}`,
      [...values, limit]
    );

    ApiResponse.success(res, { memories: result.rows.map(mapMemoryRow) }, 'Search results', undefined, req);
  });

  // ============================================
  // CORE PROFILE
  // ============================================

  getCoreProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const profile = await coreProfileKernelService.getProfile(userId);
    ApiResponse.success(res, { profile }, 'Core profile retrieved', undefined, req);
  });

  getCoreProfileSection = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const section = coreSectionEnum.parse(req.params.section) as CoreSection;
    const entries = await coreProfileKernelService.getProfileSection(userId, section);
    ApiResponse.success(res, { entries }, 'Profile section retrieved', undefined, req);
  });

  updateCoreValue = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const section = coreSectionEnum.parse(req.params.section) as CoreSection;
    const key = req.params.key;
    const data = updateCoreValueSchema.parse(req.body);

    const entry = await coreProfileKernelService.updateValue(userId, section, key, data.value, data.unit);
    ApiResponse.success(res, { entry }, 'Core value updated', undefined, req);
  });

  // ============================================
  // ARTIFACTS
  // ============================================

  listArtifacts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const params = listArtifactsQuerySchema.parse(req.query);
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [`user_id = $1`, `NOT is_archived`];
    const values: (string | number | boolean | null | Date | object)[] = [userId];
    let paramIdx = 2;

    if (params.artifactType) {
      conditions.push(`artifact_type = $${paramIdx}`);
      values.push(params.artifactType);
      paramIdx++;
    }
    if (params.tag) {
      conditions.push(`$${paramIdx} = ANY(tags)`);
      values.push(params.tag);
      paramIdx++;
    }

    const where = conditions.join(' AND ');
    const [countResult, dataResult] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM intelligence_artifacts WHERE ${where}`, values),
      query(
        `SELECT * FROM intelligence_artifacts WHERE ${where} ORDER BY is_pinned DESC, updated_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...values, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);
    ApiResponse.success(res, {
      artifacts: dataResult.rows.map(mapArtifactRow),
    }, {
      message: 'Artifacts retrieved',
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 },
    });
  });

  getArtifact = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const result = await query(
      `SELECT * FROM intelligence_artifacts WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId]
    );

    if (result.rows.length === 0) throw ApiError.notFound('Artifact not found');
    ApiResponse.success(res, { artifact: mapArtifactRow(result.rows[0]) }, 'Artifact retrieved', undefined, req);
  });

  updateArtifact = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const data = updateArtifactSchema.parse(req.body);
    const sets: string[] = ['updated_at = NOW()'];
    const values: (string | number | boolean | null | Date | object)[] = [];
    let paramIdx = 1;

    if (data.isPinned !== undefined) {
      sets.push(`is_pinned = $${paramIdx}`);
      values.push(data.isPinned);
      paramIdx++;
    }
    if (data.isArchived !== undefined) {
      sets.push(`is_archived = $${paramIdx}`);
      values.push(data.isArchived);
      paramIdx++;
    }
    if (data.tags !== undefined) {
      sets.push(`tags = $${paramIdx}`);
      values.push(data.tags);
      paramIdx++;
    }

    values.push(req.params.id, userId);
    const result = await query(
      `UPDATE intelligence_artifacts SET ${sets.join(', ')}
       WHERE id = $${paramIdx} AND user_id = $${paramIdx + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw ApiError.notFound('Artifact not found');
    ApiResponse.success(res, { artifact: mapArtifactRow(result.rows[0]) }, 'Artifact updated', undefined, req);
  });

  // ============================================
  // PLANS
  // ============================================

  listPlans = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const result = await query(
      `SELECT * FROM intelligence_plans WHERE user_id = $1 AND NOT is_archived
       ORDER BY is_pinned DESC, CASE status WHEN 'active' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, updated_at DESC`,
      [userId]
    );

    ApiResponse.success(res, { plans: result.rows.map(mapPlanRow) }, 'Plans retrieved', undefined, req);
  });

  getPlan = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const result = await query(
      `SELECT * FROM intelligence_plans WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId]
    );

    if (result.rows.length === 0) throw ApiError.notFound('Plan not found');
    ApiResponse.success(res, { plan: mapPlanRow(result.rows[0]) }, 'Plan retrieved', undefined, req);
  });

  // ============================================
  // LOGS
  // ============================================

  listLogs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const params = listLogsQuerySchema.parse(req.query);
    const page = params.page || 1;
    const limit = params.limit || 30;
    const offset = (page - 1) * limit;

    const conditions = [`user_id = $1`];
    const values: (string | number | boolean | null | Date | object)[] = [userId];
    let paramIdx = 2;

    if (params.category) {
      conditions.push(`category = $${paramIdx}`);
      values.push(params.category);
      paramIdx++;
    }
    if (params.startDate) {
      conditions.push(`source_date >= $${paramIdx}`);
      values.push(params.startDate);
      paramIdx++;
    }
    if (params.endDate) {
      conditions.push(`source_date <= $${paramIdx}`);
      values.push(params.endDate);
      paramIdx++;
    }

    const where = conditions.join(' AND ');
    const [countResult, dataResult] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM intelligence_log_references WHERE ${where}`, values),
      query(
        `SELECT * FROM intelligence_log_references WHERE ${where}
         ORDER BY source_date DESC, created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...values, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);
    ApiResponse.success(res, {
      logs: dataResult.rows.map(mapLogRow),
    }, {
      message: 'Logs retrieved',
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 },
    });
  });

  // ============================================
  // FEEDBACK
  // ============================================

  getMessageTransparency = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { messageId } = req.params;
    if (!messageId) throw ApiError.badRequest('Message ID is required');

    const transparency = await transparencyService.getMessageTransparency(userId, messageId);
    if (!transparency) throw ApiError.notFound('Transparency data not found');

    ApiResponse.success(res, { transparency }, 'Transparency data retrieved', undefined, req);
  });

  submitTransparencyFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { messageId } = req.params;
    if (!messageId) throw ApiError.badRequest('Message ID is required');

    const wasHelpful = req.body?.wasHelpful;
    if (typeof wasHelpful !== 'boolean') {
      throw ApiError.badRequest('wasHelpful must be a boolean');
    }

    const correction = typeof req.body?.correction === 'string' ? req.body.correction : undefined;
    await transparencyService.submitHelpfulness(userId, messageId, wasHelpful, correction);

    ApiResponse.success(res, { messageId }, 'Transparency feedback submitted', undefined, req);
  });

  submitFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const data = submitFeedbackSchema.parse(req.body);

    const result = await query(
      `INSERT INTO intelligence_feedback
       (user_id, target_type, target_id, action, correction_data, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, data.targetType, data.targetId, data.action, data.correctionData ? JSON.stringify(data.correctionData) : null, data.comment || null]
    );

    ApiResponse.success(res, { feedback: result.rows[0] }, { message: 'Feedback submitted', statusCode: 201 });
  });
}

// ============================================
// ROW MAPPERS
// ============================================

function mapMemoryRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    memoryType: row.memory_type,
    category: row.category,
    subcategory: row.subcategory || null,
    title: row.title,
    description: row.description,
    structuredData: row.structured_data || {},
    confidence: row.confidence,
    evidenceCount: row.evidence_count,
    evidence: row.evidence || [],
    minEvidence: row.min_evidence,
    source: row.source,
    kgNodeIds: row.kg_node_ids || [],
    relatedMemoryIds: row.related_memory_ids || [],
    status: row.status,
    verifiedAt: row.verified_at ? (row.verified_at as Date).toISOString() : null,
    rejectedAt: row.rejected_at ? (row.rejected_at as Date).toISOString() : null,
    rejectionReason: row.rejection_reason || null,
    supersededBy: row.superseded_by || null,
    lastAccessedAt: (row.last_accessed_at as Date).toISOString(),
    accessCount: row.access_count,
    decayRate: row.decay_rate,
    expiresAt: row.expires_at ? (row.expires_at as Date).toISOString() : null,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

function mapArtifactRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    artifactType: row.artifact_type,
    title: row.title,
    description: row.description || null,
    chartConfig: row.chart_config || {},
    data: row.data || [],
    insight: row.insight || null,
    generatedBy: row.generated_by,
    triggerMessageId: row.trigger_message_id || null,
    conversationId: row.conversation_id || null,
    analysisId: row.analysis_id || null,
    memoryIdsUsed: row.memory_ids_used || [],
    dataSources: row.data_sources || [],
    isPinned: row.is_pinned,
    isArchived: row.is_archived,
    tags: row.tags || [],
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

function mapPlanRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    planType: row.plan_type,
    title: row.title,
    description: row.description || null,
    planData: row.plan_data || {},
    currentPhase: row.current_phase || null,
    version: row.version,
    adaptationLog: row.adaptation_log || [],
    adherenceRate: row.adherence_rate,
    status: row.status,
    startsAt: row.starts_at || null,
    endsAt: row.ends_at || null,
    lastAdaptedAt: row.last_adapted_at ? (row.last_adapted_at as Date).toISOString() : null,
    source: row.source,
    memoryIdsUsed: row.memory_ids_used || [],
    goalIds: row.goal_ids || [],
    isPinned: row.is_pinned,
    isArchived: row.is_archived,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

function mapLogRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    sourceTable: row.source_table,
    sourceId: row.source_id,
    sourceDate: row.source_date,
    summary: row.summary || null,
    category: row.category,
    memoryIds: row.memory_ids || [],
    artifactIds: row.artifact_ids || [],
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export const intelligenceFilesController = new IntelligenceFilesController();
