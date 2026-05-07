/**
 * @file Quick Note Service
 * @description User-scoped lightweight notes for fast capture and AI coach recall.
 */

import { pool, query } from '../config/database.config.js';
import { logger } from './logger.service.js';

export type QuickNoteStatus = 'active' | 'pinned' | 'archived';
export type QuickNoteSource = 'text' | 'voice' | 'ai';

export interface QuickNote {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  status: QuickNoteStatus;
  color: string | null;
  tags: string[] | null;
  source: QuickNoteSource;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuickNoteInput {
  title?: string | null;
  content: string;
  status?: QuickNoteStatus;
  color?: string | null;
  tags?: string[] | null;
  source?: QuickNoteSource;
  metadata?: Record<string, unknown>;
}

export interface UpdateQuickNoteInput {
  title?: string | null;
  content?: string;
  status?: QuickNoteStatus;
  color?: string | null;
  tags?: string[] | null;
  source?: QuickNoteSource;
  metadata?: Record<string, unknown>;
}

interface QuickNoteRow {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  status: string;
  color: string | null;
  tags: string[] | null;
  source: string;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapQuickNoteRow(row: QuickNoteRow): QuickNote {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    status: row.status as QuickNoteStatus,
    color: row.color,
    tags: row.tags,
    source: row.source as QuickNoteSource,
    metadata: row.metadata || {},
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

class QuickNoteService {
  async createNote(userId: string, input: CreateQuickNoteInput): Promise<QuickNote> {
    const result = await query<QuickNoteRow>(
      `INSERT INTO quick_notes (user_id, title, content, status, color, tags, source, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        input.title?.trim() || null,
        input.content.trim(),
        input.status || 'active',
        input.color || '#facc15',
        input.tags || null,
        input.source || 'text',
        JSON.stringify(input.metadata || {}),
      ],
    );

    const note = mapQuickNoteRow(result.rows[0]);
    logger.info('[QuickNotes] Created note', { userId, noteId: note.id, source: note.source });
    return note;
  }

  async getNotes(
    userId: string,
    options: {
      status?: QuickNoteStatus;
      search?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ notes: QuickNote[]; total: number }> {
    const conditions = ['user_id = $1'];
    const params: Array<string | number> = [userId];
    let paramIndex = 2;

    if (options.status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(options.status);
    }

    if (options.search?.trim()) {
      conditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
      params.push(`%${options.search.trim()}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM quick_notes WHERE ${whereClause}`,
      params,
    );

    const limit = Math.min(Math.max(options.limit || 50, 1), 100);
    const offset = Math.max(options.offset || 0, 0);

    const result = await query<QuickNoteRow>(
      `SELECT * FROM quick_notes
       WHERE ${whereClause}
       ORDER BY
         CASE status WHEN 'pinned' THEN 0 WHEN 'active' THEN 1 ELSE 2 END,
         updated_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset],
    );

    return {
      notes: result.rows.map(mapQuickNoteRow),
      total: parseInt(countResult.rows[0]?.count || '0', 10),
    };
  }

  async getNote(userId: string, noteId: string): Promise<QuickNote | null> {
    const result = await query<QuickNoteRow>(
      `SELECT * FROM quick_notes WHERE id = $1 AND user_id = $2`,
      [noteId, userId],
    );

    return result.rows[0] ? mapQuickNoteRow(result.rows[0]) : null;
  }

  async updateNote(userId: string, noteId: string, input: UpdateQuickNoteInput): Promise<QuickNote | null> {
    const updates: string[] = [];
    const values: Array<string | string[] | null> = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(input.title?.trim() || null);
    }
    if (input.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(input.content.trim());
    }
    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(input.color);
    }
    if (input.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(input.tags);
    }
    if (input.source !== undefined) {
      updates.push(`source = $${paramIndex++}`);
      values.push(input.source);
    }
    if (input.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(input.metadata));
    }

    if (updates.length === 0) {
      return this.getNote(userId, noteId);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(noteId, userId);

    const result = await query<QuickNoteRow>(
      `UPDATE quick_notes SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING *`,
      values,
    );

    if (!result.rows[0]) return null;

    const note = mapQuickNoteRow(result.rows[0]);
    logger.info('[QuickNotes] Updated note', { userId, noteId });
    return note;
  }

  async deleteNote(userId: string, noteId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM quick_notes WHERE id = $1 AND user_id = $2`,
      [noteId, userId],
    );

    if (result.rowCount === 0) return false;
    logger.info('[QuickNotes] Deleted note', { userId, noteId });
    return true;
  }
}

export const quickNoteService = new QuickNoteService();
export default quickNoteService;
