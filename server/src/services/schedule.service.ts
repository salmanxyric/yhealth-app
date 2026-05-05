/**
 * @file Schedule Service
 * @description Handles daily schedules with drag-drop items and workflow-style linking
 */

import { query } from '../config/database.config.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

export interface ScheduleTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Polymorphic source discriminator. Manual items are user-created; google and
 * prayer items are materialised by the scheduled sync from external providers
 * (Google Calendar + prayer_schedules) and are read-only from the mutation APIs.
 */
export type ScheduleItemSource = 'manual' | 'google' | 'prayer';

export interface ScheduleItem {
  id: string;
  scheduleId: string;
  title: string;
  description?: string;
  startTime: string; // HH:mm format
  endTime?: string; // HH:mm format
  durationMinutes?: number;
  color?: string;
  icon?: string;
  category?: string;
  position: number;
  metadata: Record<string, unknown>;
  source: ScheduleItemSource;
  externalSource?: string; // e.g. 'google_calendar', 'prayer_times'
  externalId?: string;     // provider's ID — Google event id / prayer row id
  sourceUpdatedAt?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleLink {
  id: string;
  scheduleId: string;
  sourceItemId: string;
  targetItemId: string;
  linkType: 'sequential' | 'conditional' | 'parallel';
  delayMinutes: number;
  conditions: Record<string, unknown>;
  createdAt: string;
}

export interface DailySchedule {
  id: string;
  userId: string;
  scheduleDate: string; // YYYY-MM-DD
  templateId?: string;
  name?: string;
  notes?: string;
  isTemplate: boolean;
  items: ScheduleItem[];
  links: ScheduleLink[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleInput {
  scheduleDate: string;
  templateId?: string;
  name?: string;
  notes?: string;
}

export interface UpdateScheduleInput {
  name?: string;
  notes?: string;
}

export interface CreateScheduleItemInput {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  color?: string;
  icon?: string;
  category?: string;
  position: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateScheduleItemInput {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  color?: string;
  icon?: string;
  category?: string;
  position?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateScheduleLinkInput {
  sourceItemId: string;
  targetItemId: string;
  linkType?: 'sequential' | 'conditional' | 'parallel';
  delayMinutes?: number;
  conditions?: Record<string, unknown>;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface CalendarSchedule {
  date: string;
  scheduleId?: string;
  itemCount: number;
  hasSchedule: boolean;
}

// ============================================
// DATABASE ROW TYPES
// ============================================

interface ScheduleTemplateRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

interface DailyScheduleRow {
  id: string;
  user_id: string;
  schedule_date: Date;
  template_id: string | null;
  name: string | null;
  notes: string | null;
  is_template: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ScheduleItemRow {
  id: string;
  schedule_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  color: string | null;
  icon: string | null;
  category: string | null;
  shape: string | null;
  position: number;
  metadata: Record<string, unknown>;
  source: string | null;
  external_source: string | null;
  external_id: string | null;
  source_updated_at: Date | null;
  completed: boolean | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface ScheduleLinkRow {
  id: string;
  schedule_id: string;
  source_item_id: string;
  target_item_id: string;
  link_type: string;
  delay_minutes: number;
  conditions: Record<string, unknown>;
  created_at: Date;
}

// ============================================
// SERVICE CLASS
// ============================================

class ScheduleService {
  /**
   * Get schedule for a specific date.
   * Also triggers an external sync (Google Calendar + prayers) so the returned
   * items reflect the latest provider state without a separate round-trip.
   * Sync errors are swallowed — a transient provider failure must not block
   * the user from seeing their manual items.
   */
  async getScheduleByDate(userId: string, date: string): Promise<DailySchedule | null> {
    const result = await query<DailyScheduleRow>(
      `SELECT * FROM daily_schedules
       WHERE user_id = $1 AND schedule_date = $2 AND is_template = false
       LIMIT 1`,
      [userId, date]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const schedule = result.rows[0];

    try {
      await this.syncExternalSlots(userId, schedule.id, date);
    } catch (err) {
      logger.warn('[Schedule] External sync failed, continuing with cached items', {
        userId,
        scheduleId: schedule.id,
        date,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const items = await this.getScheduleItems(schedule.id);
    const links = await this.getScheduleLinks(schedule.id);

    return {
      ...this.mapRowToSchedule(schedule),
      items,
      links,
    };
  }

  /**
   * Materialise the day's Google Calendar events and prayer schedule into
   * `schedule_items` so they participate in the canvas, conflict detection,
   * and history like any manual row. Idempotent: unique partial index
   * `(schedule_id, external_source, external_id)` makes this an upsert; rows
   * no longer in the provider response are pruned.
   */
  async syncExternalSlots(
    userId: string,
    scheduleId: string,
    date: string,
  ): Promise<{ google: number; prayer: number; pruned: number }> {
    const upsertKeys: Array<{ source: string; externalId: string }> = [];
    let googleCount = 0;
    let prayerCount = 0;

    // Resolve the user's timezone so HH:mm reflects what they actually see
    // in Google Calendar / the prayer widget, not the server's local time
    // (which is typically UTC in production).
    const userTz = await this.getUserTimezone(userId);

    // ── Google Calendar ──
    // Extract the local clock-face HH:mm directly in SQL via `AT TIME ZONE`
    // so we don't depend on the Node process's timezone.
    try {
      const gRes = await query<{
        external_id: string;
        title: string;
        description: string | null;
        start_hhmm: string;
        end_hhmm: string;
        duration_minutes: string;
        all_day: boolean;
        location: string | null;
      }>(
        `SELECT
           e.external_id,
           e.title,
           e.description,
           TO_CHAR(e.start_time AT TIME ZONE $3, 'HH24:MI') AS start_hhmm,
           TO_CHAR(e.end_time   AT TIME ZONE $3, 'HH24:MI') AS end_hhmm,
           GREATEST(1, CEIL(EXTRACT(EPOCH FROM (e.end_time - e.start_time)) / 60))::int AS duration_minutes,
           e.all_day,
           e.location
         FROM calendar_events e
         WHERE e.user_id = $1
           AND e.status <> 'cancelled'
           AND (e.start_time AT TIME ZONE $3)::date <= $2::date
           AND (e.end_time   AT TIME ZONE $3)::date >= $2::date`,
        [userId, date, userTz],
      );

      for (const r of gRes.rows) {
        const desc = r.location ? `📍 ${r.location}` : r.description || null;
        await this.upsertExternalItem({
          scheduleId,
          source: 'google',
          externalSource: 'google_calendar',
          externalId: r.external_id,
          title: r.title || 'Google event',
          description: desc,
          startTime: r.start_hhmm,
          endTime: r.end_hhmm,
          durationMinutes: Number(r.duration_minutes) || null,
          color: '#2d9cdb',
          icon: null,
          category: null,
        });
        upsertKeys.push({ source: 'google', externalId: r.external_id });
        googleCount++;
      }
    } catch (err) {
      logger.warn('[Schedule] Google calendar sync query failed', {
        error: err instanceof Error ? err.message : String(err),
        userTz,
      });
    }

    // ── Prayers ──
    // Same `AT TIME ZONE` trick — prayer_schedules stores TIMESTAMPTZ so the
    // raw getHours() approach was returning UTC on UTC servers.
    try {
      const pRes = await query<{
        id: string;
        prayer_name: string;
        start_hhmm: string;
        end_hhmm: string;
        completed: boolean;
        completed_at: Date | null;
      }>(
        `SELECT
           id,
           prayer_name,
           TO_CHAR(scheduled_time AT TIME ZONE $3, 'HH24:MI') AS start_hhmm,
           TO_CHAR((scheduled_time + INTERVAL '15 minutes') AT TIME ZONE $3, 'HH24:MI') AS end_hhmm,
           completed,
           completed_at
         FROM prayer_schedules
         WHERE user_id = $1 AND prayer_date = $2::date
         ORDER BY scheduled_time ASC`,
        [userId, date, userTz],
      );

      for (const r of pRes.rows) {
        await this.upsertExternalItem({
          scheduleId,
          source: 'prayer',
          externalSource: 'prayer_times',
          externalId: r.id,
          title: r.prayer_name,
          description: null,
          startTime: r.start_hhmm,
          endTime: r.end_hhmm,
          durationMinutes: 15,
          color: '#a855f7',
          icon: null,
          category: null,
          completed: r.completed,
          completedAt: r.completed_at,
        });
        upsertKeys.push({ source: 'prayer', externalId: r.id });
        prayerCount++;
      }
    } catch (err) {
      logger.warn('[Schedule] Prayer sync query failed', {
        error: err instanceof Error ? err.message : String(err),
        userTz,
      });
    }

    // ── Prune stale external items ──
    // Anything in this schedule with source <> 'manual' whose (source, external_id)
    // is NOT in the upsert set for this run has been deleted upstream.
    const pruned = await this.pruneStaleExternals(scheduleId, upsertKeys);

    return { google: googleCount, prayer: prayerCount, pruned };
  }

  private async upsertExternalItem(args: {
    scheduleId: string;
    source: 'google' | 'prayer';
    externalSource: string;
    externalId: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    durationMinutes: number | null;
    color: string | null;
    icon: string | null;
    category: string | null;
    completed?: boolean;
    completedAt?: Date | null;
  }): Promise<void> {
    const {
      scheduleId, source, externalSource, externalId,
      title, description, startTime, endTime, durationMinutes,
      color, icon, category, completed = false, completedAt = null,
    } = args;

    await query(
      `INSERT INTO schedule_items (
         schedule_id, title, description, start_time, end_time,
         duration_minutes, color, icon, category, shape, position, metadata,
         source, external_source, external_id, source_updated_at,
         completed, completed_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'rounded', 0, '{}'::jsonb,
               $10, $11, $12, NOW(), $13, $14)
       ON CONFLICT (schedule_id, external_source, external_id)
       WHERE external_source IS NOT NULL AND external_id IS NOT NULL
       DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         duration_minutes = EXCLUDED.duration_minutes,
         color = EXCLUDED.color,
         source_updated_at = NOW(),
         completed = EXCLUDED.completed,
         completed_at = EXCLUDED.completed_at,
         updated_at = CURRENT_TIMESTAMP`,
      [
        scheduleId, title, description, startTime, endTime, durationMinutes,
        color, icon, category,
        source, externalSource, externalId,
        completed, completedAt,
      ],
    );
  }

  private async pruneStaleExternals(
    scheduleId: string,
    keep: Array<{ source: string; externalId: string }>,
  ): Promise<number> {
    if (keep.length === 0) {
      const result = await query(
        `DELETE FROM schedule_items
         WHERE schedule_id = $1 AND source <> 'manual'
         RETURNING id`,
        [scheduleId],
      );
      return result.rows.length;
    }
    // Build a parameterised "NOT IN" using a VALUES table to avoid array-type issues.
    const params: Array<string> = [scheduleId];
    const tuples: string[] = [];
    keep.forEach((k) => {
      const p1 = params.length + 1;
      const p2 = params.length + 2;
      params.push(k.source, k.externalId);
      tuples.push(`($${p1}::text, $${p2}::text)`);
    });
    const result = await query(
      `DELETE FROM schedule_items
       WHERE schedule_id = $1
         AND source <> 'manual'
         AND (source, external_id) NOT IN (${tuples.join(', ')})
       RETURNING id`,
      params,
    );
    return result.rows.length;
  }

  /**
   * Resolve the user's IANA timezone. Falls back to `UTC` so we still
   * produce *some* HH:mm rather than crashing, but the canvas will show
   * wall-clock = UTC in that case (visible clue that tz isn't set yet).
   */
  private async getUserTimezone(userId: string): Promise<string> {
    try {
      const result = await query<{ timezone: string | null }>(
        `SELECT timezone FROM user_preferences WHERE user_id = $1 LIMIT 1`,
        [userId],
      );
      const tz = result.rows[0]?.timezone;
      // Reject empty strings / obviously bad values.
      if (tz && /^[A-Za-z_+\-0-9/]+$/.test(tz)) return tz;
    } catch (err) {
      logger.warn('[Schedule] Failed to resolve user timezone', {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return 'UTC';
  }

  /**
   * Get schedules for a date range (for calendar view)
   */
  async getSchedulesForCalendar(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarSchedule[]> {
    const result = await query<{ date: string; schedule_id: string; item_count: string }>(
      `SELECT 
        schedule_date::text as date,
        id as schedule_id,
        (SELECT COUNT(*) FROM schedule_items WHERE schedule_id = daily_schedules.id) as item_count
       FROM daily_schedules
       WHERE user_id = $1 
         AND schedule_date >= $2 
         AND schedule_date <= $3
         AND is_template = false
       ORDER BY schedule_date ASC`,
      [userId, startDate, endDate]
    );

    const scheduleMap = new Map<string, CalendarSchedule>();

    // Initialize all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      scheduleMap.set(dateStr, {
        date: dateStr,
        hasSchedule: false,
        itemCount: 0,
      });
    }

    // Update with actual schedules
    result.rows.forEach((row) => {
      scheduleMap.set(row.date, {
        date: row.date,
        scheduleId: row.schedule_id,
        hasSchedule: true,
        itemCount: parseInt(row.item_count, 10),
      });
    });

    return Array.from(scheduleMap.values());
  }

  /**
   * Create a new schedule (or return existing if it already exists)
   */
  async createSchedule(userId: string, input: CreateScheduleInput): Promise<DailySchedule> {
    // Check if schedule already exists for this date
    const existing = await this.getScheduleByDate(userId, input.scheduleDate);
    if (existing) {
      // Return existing schedule instead of throwing error (upsert behavior)
      return existing;
    }

    const result = await query<DailyScheduleRow>(
      `INSERT INTO daily_schedules (user_id, schedule_date, template_id, name, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, input.scheduleDate, input.templateId || null, input.name || null, input.notes || null]
    );

    const schedule = result.rows[0];

    // If template_id is provided, copy items and links from template
    if (input.templateId) {
      await this.applyTemplateToSchedule(schedule.id, input.templateId);
    }

    const items = await this.getScheduleItems(schedule.id);
    const links = await this.getScheduleLinks(schedule.id);

    return {
      ...this.mapRowToSchedule(schedule),
      items,
      links,
    };
  }

  /**
   * Update a schedule
   */
  async updateSchedule(
    userId: string,
    scheduleId: string,
    input: UpdateScheduleInput
  ): Promise<DailySchedule> {
    await this.verifyScheduleOwnership(userId, scheduleId);

    const updates: string[] = [];
    const values: (string | null)[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(input.name || null);
    }

    if (input.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(input.notes || null);
    }

    if (updates.length === 0) {
      return this.getScheduleById(userId, scheduleId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(scheduleId, userId);

    const queryText = `UPDATE daily_schedules 
                       SET ${updates.join(', ')} 
                       WHERE id = $${paramCount++} AND user_id = $${paramCount++} 
                       RETURNING *`;

    const result = await query<DailyScheduleRow>(queryText, values);

    const schedule = result.rows[0];
    const items = await this.getScheduleItems(schedule.id);
    const links = await this.getScheduleLinks(schedule.id);

    return {
      ...this.mapRowToSchedule(schedule),
      items,
      links,
    };
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(userId: string, scheduleId: string): Promise<void> {
    await this.verifyScheduleOwnership(userId, scheduleId);

    const result = await query(
      `DELETE FROM daily_schedules WHERE id = $1 AND user_id = $2 RETURNING id`,
      [scheduleId, userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Schedule not found');
    }
  }

  /**
   * Get schedule by ID
   */
  async getScheduleById(userId: string, scheduleId: string): Promise<DailySchedule> {
    const result = await query<DailyScheduleRow>(
      `SELECT * FROM daily_schedules WHERE id = $1 AND user_id = $2 AND is_template = false`,
      [scheduleId, userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Schedule not found');
    }

    const schedule = result.rows[0];
    const items = await this.getScheduleItems(schedule.id);
    const links = await this.getScheduleLinks(schedule.id);

    return {
      ...this.mapRowToSchedule(schedule),
      items,
      links,
    };
  }

  /**
   * Add item to schedule
   */
  async addScheduleItem(
    userId: string,
    scheduleId: string,
    input: CreateScheduleItemInput
  ): Promise<ScheduleItem> {
    await this.verifyScheduleOwnership(userId, scheduleId);

    // Calculate duration if not provided
    let durationMinutes = input.durationMinutes;
    if (!durationMinutes && input.endTime) {
      const start = this.timeToMinutes(input.startTime);
      const end = this.timeToMinutes(input.endTime);
      durationMinutes = end - start;
    }

    const shape = (input.metadata as any)?.shape || 'square';
    const result = await query<ScheduleItemRow>(
      `INSERT INTO schedule_items (
        schedule_id, title, description, start_time, end_time, 
        duration_minutes, color, icon, category, shape, position, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        scheduleId,
        input.title,
        input.description || null,
        input.startTime,
        input.endTime || null,
        durationMinutes || null,
        input.color || null,
        input.icon || null,
        input.category || null,
        shape,
        input.position,
        JSON.stringify(input.metadata || {}),
      ]
    );

    return this.mapRowToScheduleItem(result.rows[0]);
  }

  /**
   * Update schedule item
   */
  async updateScheduleItem(
    userId: string,
    itemId: string,
    input: UpdateScheduleItemInput
  ): Promise<ScheduleItem> {
    // Verify item belongs to user's schedule AND is user-editable (manual).
    // External items (google/prayer) are owned by their provider and must
    // not be mutated through this endpoint — they'll just get overwritten by
    // the next sync anyway.
    const itemResult = await query<{ schedule_id: string; source: string | null }>(
      `SELECT schedule_id, source FROM schedule_items WHERE id = $1`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      throw ApiError.notFound('Schedule item not found');
    }

    await this.verifyScheduleOwnership(userId, itemResult.rows[0].schedule_id);

    // External items (google / prayer) are owned by their provider — block
    // content edits, but allow position-only updates so the user can still
    // rearrange them on the canvas. A drag-move sends only a metadata patch
    // containing `x`/`y`; any other field means the client is trying to
    // edit content we must refuse.
    const isExternal = itemResult.rows[0].source && itemResult.rows[0].source !== 'manual';
    if (isExternal) {
      const contentKeys = [
        input.title, input.description, input.startTime, input.endTime,
        input.durationMinutes, input.color, input.icon, input.category,
        input.position,
      ];
      const touchesContent = contentKeys.some((v) => v !== undefined);
      const metadataKeys = input.metadata ? Object.keys(input.metadata) : [];
      const metadataIsPositionOnly =
        metadataKeys.length > 0 &&
        metadataKeys.every((k) => k === 'x' || k === 'y');
      const metadataTouchesContent = input.metadata !== undefined && !metadataIsPositionOnly;

      if (touchesContent || metadataTouchesContent) {
        throw ApiError.badRequest(
          'This activity is synced from an external source. You can reposition it on the canvas, but its content must be edited in the original provider.',
        );
      }
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramCount = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(input.title);
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(input.description || null);
    }

    if (input.startTime !== undefined) {
      updates.push(`start_time = $${paramCount++}`);
      values.push(input.startTime);
    }

    if (input.endTime !== undefined) {
      updates.push(`end_time = $${paramCount++}`);
      values.push(input.endTime || null);
    }

    if (input.durationMinutes !== undefined) {
      updates.push(`duration_minutes = $${paramCount++}`);
      values.push(input.durationMinutes || null);
    }

    if (input.color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(input.color || null);
    }

    if (input.icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(input.icon || null);
    }

    if (input.category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(input.category || null);
    }

    if (input.position !== undefined) {
      updates.push(`position = $${paramCount++}`);
      values.push(input.position);
    }

    if (input.metadata !== undefined) {
      // Get existing metadata to merge with new metadata
      const existingItemResult = await query<ScheduleItemRow>(
        `SELECT metadata FROM schedule_items WHERE id = $1`,
        [itemId]
      );
      
      let mergedMetadata = input.metadata;
      if (existingItemResult.rows.length > 0 && existingItemResult.rows[0].metadata) {
        const existingMetadata = typeof existingItemResult.rows[0].metadata === 'string'
          ? JSON.parse(existingItemResult.rows[0].metadata)
          : existingItemResult.rows[0].metadata;
        mergedMetadata = {
          ...existingMetadata,
          ...input.metadata,
        };
      }
      
      updates.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(mergedMetadata));
      
      // Handle shape from metadata
      const shape = (mergedMetadata as any)?.shape;
      if (shape) {
        updates.push(`shape = $${paramCount++}`);
        values.push(shape);
      }
    }

    if (updates.length === 0) {
      const result = await query<ScheduleItemRow>(
        `SELECT * FROM schedule_items WHERE id = $1`,
        [itemId]
      );
      return this.mapRowToScheduleItem(result.rows[0]);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(itemId);

    const queryText = `UPDATE schedule_items 
                       SET ${updates.join(', ')} 
                       WHERE id = $${paramCount++} 
                       RETURNING *`;

    const result = await query<ScheduleItemRow>(queryText, values);

    return this.mapRowToScheduleItem(result.rows[0]);
  }

  /**
   * Delete schedule item
   */
  async deleteScheduleItem(userId: string, itemId: string): Promise<void> {
    // Verify item belongs to user's schedule
    const itemResult = await query<{ schedule_id: string; source: string | null }>(
      `SELECT schedule_id, source FROM schedule_items WHERE id = $1`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      throw ApiError.notFound('Schedule item not found');
    }

    await this.verifyScheduleOwnership(userId, itemResult.rows[0].schedule_id);

    if (itemResult.rows[0].source && itemResult.rows[0].source !== 'manual') {
      throw ApiError.badRequest(
        'This activity is synced from an external source and cannot be deleted here. Remove it from the original provider to stop syncing.',
      );
    }

    // Delete associated links
    await query(
      `DELETE FROM schedule_links 
       WHERE source_item_id = $1 OR target_item_id = $1`,
      [itemId]
    );

    // Delete item
    await query(`DELETE FROM schedule_items WHERE id = $1`, [itemId]);
  }

  /**
   * Create link between schedule items
   */
  async createScheduleLink(
    userId: string,
    scheduleId: string,
    input: CreateScheduleLinkInput
  ): Promise<ScheduleLink> {
    await this.verifyScheduleOwnership(userId, scheduleId);

    // Verify both items belong to this schedule. External items (google /
    // prayer) are allowed as link endpoints now — they're real UUIDs and
    // `schedule_links` ON DELETE CASCADE auto-cleans if an external row
    // is pruned during a later sync.
    const itemsResult = await query<{ id: string }>(
      `SELECT id FROM schedule_items
       WHERE id IN ($1, $2) AND schedule_id = $3`,
      [input.sourceItemId, input.targetItemId, scheduleId]
    );

    if (itemsResult.rows.length !== 2) {
      throw ApiError.badRequest('Both items must belong to the same schedule');
    }

    const result = await query<ScheduleLinkRow>(
      `INSERT INTO schedule_links (
        schedule_id, source_item_id, target_item_id, 
        link_type, delay_minutes, conditions
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        scheduleId,
        input.sourceItemId,
        input.targetItemId,
        input.linkType || 'sequential',
        input.delayMinutes || 0,
        JSON.stringify(input.conditions || {}),
      ]
    );

    return this.mapRowToScheduleLink(result.rows[0]);
  }

  /**
   * Delete schedule link
   */
  async deleteScheduleLink(userId: string, linkId: string): Promise<void> {
    // Verify link belongs to user's schedule
    const linkResult = await query<{ schedule_id: string }>(
      `SELECT schedule_id FROM schedule_links WHERE id = $1`,
      [linkId]
    );

    if (linkResult.rows.length === 0) {
      throw ApiError.notFound('Schedule link not found');
    }

    await this.verifyScheduleOwnership(userId, linkResult.rows[0].schedule_id);

    await query(`DELETE FROM schedule_links WHERE id = $1`, [linkId]);
  }

  /**
   * Get all templates for user
   */
  async getTemplates(userId: string): Promise<ScheduleTemplate[]> {
    const result = await query<ScheduleTemplateRow>(
      `SELECT * FROM schedule_templates 
       WHERE user_id = $1 
       ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => this.mapRowToTemplate(row));
  }

  /**
   * Create template
   */
  async createTemplate(userId: string, input: CreateTemplateInput): Promise<ScheduleTemplate> {
    // If setting as default, unset other defaults
    if (input.isDefault) {
      await query(
        `UPDATE schedule_templates 
         SET is_default = false 
         WHERE user_id = $1 AND is_default = true`,
        [userId]
      );
    }

    const result = await query<ScheduleTemplateRow>(
      `INSERT INTO schedule_templates (user_id, name, description, is_default)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, input.name, input.description || null, input.isDefault || false]
    );

    return this.mapRowToTemplate(result.rows[0]);
  }

  /**
   * Apply template to schedule
   */
  async applyTemplateToSchedule(_scheduleId: string, templateId: string): Promise<void> {
    // Get template schedule (templates are stored as schedules with is_template = true)
    // Actually, templates are separate - we need to get the template's items
    // For now, we'll create a template schedule when saving as template
    // This is a simplified version - in production, you'd want to store template items separately

    // Get the template
    const templateResult = await query<ScheduleTemplateRow>(
      `SELECT * FROM schedule_templates WHERE id = $1`,
      [templateId]
    );

    if (templateResult.rows.length === 0) {
      throw ApiError.notFound('Template not found');
    }

    // For MVP, we'll copy items from a template schedule if it exists
    // This would need to be enhanced based on how templates are stored
  }

  /**
   * Save schedule as template
   */
  async saveScheduleAsTemplate(
    userId: string,
    scheduleId: string,
    templateName: string,
    description?: string
  ): Promise<ScheduleTemplate> {
    await this.verifyScheduleOwnership(userId, scheduleId);

    // Create template
    const template = await this.createTemplate(userId, {
      name: templateName,
      description,
      isDefault: false,
    });

    // Copy schedule items to template (this would need a template_items table in full implementation)
    // For MVP, we'll just create the template reference
    await query(
      `UPDATE daily_schedules 
       SET template_id = $1 
       WHERE id = $2`,
      [template.id, scheduleId]
    );

    return template;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async getScheduleItems(scheduleId: string): Promise<ScheduleItem[]> {
    const result = await query<ScheduleItemRow>(
      `SELECT * FROM schedule_items 
       WHERE schedule_id = $1 
       ORDER BY position ASC, start_time ASC`,
      [scheduleId]
    );

    return result.rows.map((row) => this.mapRowToScheduleItem(row));
  }

  private async getScheduleLinks(scheduleId: string): Promise<ScheduleLink[]> {
    const result = await query<ScheduleLinkRow>(
      `SELECT * FROM schedule_links 
       WHERE schedule_id = $1`,
      [scheduleId]
    );

    return result.rows.map((row) => this.mapRowToScheduleLink(row));
  }

  private async verifyScheduleOwnership(userId: string, scheduleId: string): Promise<void> {
    const result = await query<{ id: string }>(
      `SELECT id FROM daily_schedules WHERE id = $1 AND user_id = $2`,
      [scheduleId, userId]
    );

    if (result.rows.length === 0) {
      throw ApiError.notFound('Schedule not found');
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private mapRowToSchedule(row: DailyScheduleRow): Omit<DailySchedule, 'items' | 'links'> {
    return {
      id: row.id,
      userId: row.user_id,
      scheduleDate: typeof row.schedule_date === 'string' ? row.schedule_date : row.schedule_date.toISOString().split('T')[0],
      templateId: row.template_id || undefined,
      name: row.name || undefined,
      notes: row.notes || undefined,
      isTemplate: row.is_template,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private mapRowToScheduleItem(row: ScheduleItemRow): ScheduleItem {
    const source = (row.source || 'manual') as ScheduleItemSource;
    const item: ScheduleItem = {
      id: row.id,
      scheduleId: row.schedule_id,
      title: row.title,
      description: row.description || undefined,
      startTime: typeof row.start_time === 'string' ? row.start_time.slice(0, 5) : row.start_time,
      endTime: row.end_time ? (typeof row.end_time === 'string' ? row.end_time.slice(0, 5) : row.end_time) : undefined,
      durationMinutes: row.duration_minutes || undefined,
      color: row.color || undefined,
      icon: row.icon || undefined,
      category: row.category || undefined,
      position: row.position,
      metadata: row.metadata || {},
      source,
      externalSource: row.external_source || undefined,
      externalId: row.external_id || undefined,
      sourceUpdatedAt: row.source_updated_at ? row.source_updated_at.toISOString() : undefined,
      completed: !!row.completed,
      completedAt: row.completed_at ? row.completed_at.toISOString() : undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
    // Add shape to metadata if it exists
    if (row.shape) {
      (item as any).shape = row.shape;
    }
    return item;
  }

  private mapRowToScheduleLink(row: ScheduleLinkRow): ScheduleLink {
    return {
      id: row.id,
      scheduleId: row.schedule_id,
      sourceItemId: row.source_item_id,
      targetItemId: row.target_item_id,
      linkType: row.link_type as 'sequential' | 'conditional' | 'parallel',
      delayMinutes: row.delay_minutes,
      conditions: row.conditions || {},
      createdAt: row.created_at.toISOString(),
    };
  }

  private mapRowToTemplate(row: ScheduleTemplateRow): ScheduleTemplate {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description || undefined,
      isDefault: row.is_default,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}

export const scheduleService = new ScheduleService();
export default scheduleService;


