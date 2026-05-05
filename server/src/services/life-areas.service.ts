import { query } from '../config/database.config.js';
import { getDomainByType, type LifeAreaDomainType } from '../config/life-area-domains.js';
import type {
  CreateLifeAreaInput,
  UpdateLifeAreaInput,
  LinkEntityInput,
} from '../validators/life-areas.validator.js';

export interface LifeArea {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  domain_type: LifeAreaDomainType;
  icon: string | null;
  color: string | null;
  is_flagship: boolean;
  preferences: Record<string, unknown>;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface LifeAreaLink {
  id: string;
  life_area_id: string;
  entity_type: 'goal' | 'schedule' | 'contract' | 'reminder';
  entity_id: string;
  created_at: string;
}

export interface ResolvedLifeAreaLink extends LifeAreaLink {
  label: string;
  subtitle: string | null;
}

export interface LifeAreaSummaryRow {
  id: string;
  display_name: string;
  domain_type: string;
  link_count: number;
}

export interface LifeAreasDashboardSummary {
  activeAreaCount: number;
  totalLinks: number;
  areas: LifeAreaSummaryRow[];
}

class LifeAreasService {
  async list(
    userId: string,
    opts: { status?: string; domain?: LifeAreaDomainType } = {},
  ): Promise<LifeArea[]> {
    const status = opts.status ?? 'active';
    const params: unknown[] = [userId, status];
    let sql = `SELECT * FROM life_areas WHERE user_id = $1 AND status = $2`;
    if (opts.domain) {
      params.push(opts.domain);
      sql += ` AND domain_type = $3`;
    }
    sql += ` ORDER BY created_at DESC`;
    const r = await query<LifeArea>(sql, params as (string | number | boolean | null | Date | object)[]);
    return r.rows;
  }

  async getById(userId: string, id: string): Promise<LifeArea | null> {
    const r = await query<LifeArea>(
      `SELECT * FROM life_areas WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return r.rows[0] ?? null;
  }

  async create(userId: string, input: CreateLifeAreaInput): Promise<LifeArea> {
    const domain = getDomainByType(input.domain_type as LifeAreaDomainType);
    if (!domain) throw new Error(`Unknown domain_type: ${input.domain_type}`);

    try {
      const r = await query<LifeArea>(
        `INSERT INTO life_areas
           (user_id, slug, display_name, domain_type, icon, color, is_flagship, preferences)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userId,
          input.slug,
          input.display_name,
          input.domain_type,
          input.icon ?? domain.defaultIcon,
          input.color ?? domain.defaultColor,
          domain.isFlagship,
          JSON.stringify(input.preferences ?? {}),
        ],
      );
      return r.rows[0];
    } catch (e) {
      const err = e as { code?: string; constraint?: string };
      if (err.code === '23505' && err.constraint === 'life_areas_user_slug_unique') {
        throw new Error('Life area with that slug already exists for this user');
      }
      throw e;
    }
  }

  async update(
    userId: string,
    id: string,
    input: UpdateLifeAreaInput,
  ): Promise<LifeArea | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (input.display_name !== undefined) {
      sets.push(`display_name = $${i++}`);
      params.push(input.display_name);
    }
    if (input.icon !== undefined) {
      sets.push(`icon = $${i++}`);
      params.push(input.icon);
    }
    if (input.color !== undefined) {
      sets.push(`color = $${i++}`);
      params.push(input.color);
    }
    if (input.status !== undefined) {
      sets.push(`status = $${i++}`);
      params.push(input.status);
    }
    if (input.preferences !== undefined) {
      sets.push(`preferences = COALESCE(preferences, '{}'::jsonb) || $${i++}::jsonb`);
      params.push(JSON.stringify(input.preferences));
    }
    if (sets.length === 0) return this.getById(userId, id);

    params.push(id, userId);
    const r = await query<LifeArea>(
      `UPDATE life_areas SET ${sets.join(', ')}
       WHERE id = $${i++} AND user_id = $${i++}
       RETURNING *`,
      params as (string | number | boolean | null | Date | object)[],
    );
    return r.rows[0] ?? null;
  }

  async archive(userId: string, id: string): Promise<boolean> {
    const r = await query(
      `UPDATE life_areas SET status = 'archived' WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  async link(
    userId: string,
    lifeAreaId: string,
    input: LinkEntityInput,
  ): Promise<LifeAreaLink> {
    const owner = await this.getById(userId, lifeAreaId);
    if (!owner) throw new Error('Life area not found');
    try {
      const r = await query<LifeAreaLink>(
        `INSERT INTO life_area_links (life_area_id, entity_type, entity_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [lifeAreaId, input.entity_type, input.entity_id],
      );
      return r.rows[0];
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === '23505') throw new Error('Entity already linked to a life area');
      throw e;
    }
  }

  async listLinks(userId: string, lifeAreaId: string): Promise<LifeAreaLink[]> {
    const owner = await this.getById(userId, lifeAreaId);
    if (!owner) return [];
    const r = await query<LifeAreaLink>(
      `SELECT * FROM life_area_links WHERE life_area_id = $1 ORDER BY created_at DESC`,
      [lifeAreaId],
    );
    return r.rows;
  }

  /**
   * Batch-resolve link targets for UI (avoids N+1 from the client).
   */
  async listLinksResolved(userId: string, lifeAreaId: string): Promise<ResolvedLifeAreaLink[]> {
    const links = await this.listLinks(userId, lifeAreaId);
    if (links.length === 0) return [];

    const scheduleIds = [...new Set(links.filter((l) => l.entity_type === 'schedule').map((l) => l.entity_id))];
    const goalIds = [...new Set(links.filter((l) => l.entity_type === 'goal').map((l) => l.entity_id))];

    const scheduleMap = new Map<string, { name: string; subtitle: string }>();
    if (scheduleIds.length > 0) {
      const sr = await query<{ id: string; name: string | null; schedule_date: string }>(
        `SELECT id, name, schedule_date::text AS schedule_date
         FROM daily_schedules WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [userId, scheduleIds],
      );
      for (const row of sr.rows) {
        scheduleMap.set(row.id, {
          name: row.name?.trim() || 'Schedule',
          subtitle: row.schedule_date,
        });
      }
    }

    const goalTitles = new Map<string, string>();
    if (goalIds.length > 0) {
      const ug = await query<{ id: string; title: string }>(
        `SELECT id, title FROM user_goals WHERE user_id = $1 AND id = ANY($2::uuid[])`,
        [userId, goalIds],
      );
      for (const row of ug.rows) goalTitles.set(row.id, row.title);
      const missing = goalIds.filter((id) => !goalTitles.has(id));
      if (missing.length > 0) {
        const lg = await query<{ id: string; title: string }>(
          `SELECT id, title FROM life_goals WHERE user_id = $1 AND id = ANY($2::uuid[])`,
          [userId, missing],
        );
        for (const row of lg.rows) goalTitles.set(row.id, row.title);
      }
    }

    return links.map((link) => {
      if (link.entity_type === 'schedule') {
        const meta = scheduleMap.get(link.entity_id);
        return {
          ...link,
          label: meta?.name ?? 'Schedule',
          subtitle: meta?.subtitle ?? null,
        };
      }
      if (link.entity_type === 'goal') {
        const title = goalTitles.get(link.entity_id);
        return {
          ...link,
          label: title ?? 'Goal',
          subtitle: 'Linked goal',
        };
      }
      if (link.entity_type === 'contract') {
        return { ...link, label: 'Accountability contract', subtitle: null };
      }
      if (link.entity_type === 'reminder') {
        return { ...link, label: 'Reminder', subtitle: null };
      }
      return { ...link, label: link.entity_type, subtitle: null };
    });
  }

  async getDashboardSummary(userId: string): Promise<LifeAreasDashboardSummary> {
    const r = await query<{
      id: string;
      display_name: string;
      domain_type: string;
      link_count: string;
    }>(
      `SELECT la.id, la.display_name, la.domain_type,
              COUNT(lal.id)::text AS link_count
       FROM life_areas la
       LEFT JOIN life_area_links lal ON lal.life_area_id = la.id
       WHERE la.user_id = $1 AND la.status = 'active'
       GROUP BY la.id, la.display_name, la.domain_type
       ORDER BY MAX(la.updated_at) DESC NULLS LAST, la.created_at DESC
       LIMIT 24`,
      [userId],
    );
    const areas: LifeAreaSummaryRow[] = r.rows.map((row) => ({
      id: row.id,
      display_name: row.display_name,
      domain_type: row.domain_type,
      link_count: parseInt(row.link_count, 10) || 0,
    }));
    const activeAreaCount = areas.length;
    const totalLinks = areas.reduce((s, a) => s + a.link_count, 0);
    return { activeAreaCount, totalLinks, areas };
  }
}

export const lifeAreasService = new LifeAreasService();
