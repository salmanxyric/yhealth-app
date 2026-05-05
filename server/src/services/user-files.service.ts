import { randomUUID } from 'crypto';
import { query } from '../config/database.config.js';

export type FileType = 'goal' | 'training_plan' | 'nutrition_targets' | 'constraint' | 'artifact' | 'pattern' | 'note';
export type FileSource = 'ai' | 'user';

export interface UserFile {
  id: string;
  userId: string;
  fileType: FileType;
  title: string;
  content: Record<string, unknown>;
  source: FileSource;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFileParams {
  fileType: FileType;
  title: string;
  content: Record<string, unknown>;
  source?: FileSource;
  isPinned?: boolean;
}

export interface UpdateFileParams {
  title?: string;
  content?: Record<string, unknown>;
  isPinned?: boolean;
  isArchived?: boolean;
}

class UserFilesService {
  async createFile(userId: string, params: CreateFileParams): Promise<UserFile> {
    const id = randomUUID();
    const result = await query<{
      id: string; user_id: string; file_type: string; title: string;
      content: Record<string, unknown>; source: string; is_pinned: boolean;
      is_archived: boolean; created_at: Date; updated_at: Date;
    }>(
      `INSERT INTO user_files (id, user_id, file_type, title, content, source, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, userId, params.fileType, params.title, JSON.stringify(params.content), params.source || 'ai', params.isPinned || false],
    );

    return this.mapRow(result.rows[0]);
  }

  async getFile(userId: string, fileId: string): Promise<UserFile | null> {
    const result = await query<any>(
      `SELECT * FROM user_files WHERE id = $1 AND user_id = $2`,
      [fileId, userId],
    );
    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async getUserFiles(userId: string, opts?: {
    fileType?: FileType;
    includeArchived?: boolean;
    limit?: number;
  }): Promise<UserFile[]> {
    const conditions = ['user_id = $1'];
    const params: any[] = [userId];
    let idx = 2;

    if (!opts?.includeArchived) {
      conditions.push('is_archived = FALSE');
    }

    if (opts?.fileType) {
      conditions.push(`file_type = $${idx}`);
      params.push(opts.fileType);
      idx++;
    }

    const limit = opts?.limit || 50;
    const result = await query<any>(
      `SELECT * FROM user_files WHERE ${conditions.join(' AND ')}
       ORDER BY is_pinned DESC, updated_at DESC
       LIMIT ${limit}`,
      params,
    );

    return result.rows.map((r: any) => this.mapRow(r));
  }

  async updateFile(userId: string, fileId: string, params: UpdateFileParams): Promise<UserFile | null> {
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.title !== undefined) { sets.push(`title = $${idx}`); values.push(params.title); idx++; }
    if (params.content !== undefined) { sets.push(`content = $${idx}`); values.push(JSON.stringify(params.content)); idx++; }
    if (params.isPinned !== undefined) { sets.push(`is_pinned = $${idx}`); values.push(params.isPinned); idx++; }
    if (params.isArchived !== undefined) { sets.push(`is_archived = $${idx}`); values.push(params.isArchived); idx++; }

    if (sets.length === 0) return this.getFile(userId, fileId);

    sets.push('updated_at = NOW()');
    values.push(fileId, userId);

    const result = await query<any>(
      `UPDATE user_files SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      values,
    );

    if (result.rows.length === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async archiveFile(userId: string, fileId: string): Promise<boolean> {
    const result = await query(
      `UPDATE user_files SET is_archived = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [fileId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteFile(userId: string, fileId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM user_files WHERE id = $1 AND user_id = $2`,
      [fileId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getFilesForSystemPrompt(userId: string): Promise<string> {
    const files = await this.getUserFiles(userId, { limit: 20 });
    if (files.length === 0) return '';

    const grouped = new Map<string, UserFile[]>();
    for (const f of files) {
      const group = grouped.get(f.fileType) || [];
      group.push(f);
      grouped.set(f.fileType, group);
    }

    let output = '## YOUR FILES\n\n';
    for (const [type, items] of Array.from(grouped.entries())) {
      output += `### ${type.replace(/_/g, ' ').toUpperCase()}\n`;
      for (const item of items) {
        const pinMark = item.isPinned ? ' [pinned]' : '';
        output += `- **${item.title}**${pinMark} (id: ${item.id})\n`;
        const summary = (item.content as any).summary || (item.content as any).description || '';
        if (summary) output += `  ${String(summary).slice(0, 200)}\n`;
      }
      output += '\n';
    }

    return output;
  }

  private mapRow(row: any): UserFile {
    return {
      id: row.id,
      userId: row.user_id,
      fileType: row.file_type,
      title: row.title,
      content: row.content,
      source: row.source,
      isPinned: row.is_pinned,
      isArchived: row.is_archived,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const userFilesService = new UserFilesService();
