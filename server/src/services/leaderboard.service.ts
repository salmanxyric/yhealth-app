/**
 * @file Leaderboard Service
 * @description Manages daily leaderboards with precomputed snapshots and Redis caching
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { redisCacheService } from './redis-cache.service.js';

// ============================================
// TYPES
// ============================================

export type LeaderboardType = 'global' | 'country' | 'friends' | 'competition';

export interface LeaderboardEntry {
  user_id: string;
  rank: number;
  total_score: number;
  component_scores: {
    workout: number;
    nutrition: number;
    wellbeing: number;
    biometrics: number;
    engagement: number;
    consistency: number;
  };
  user?: {
    name: string;
    avatar?: string;
  };
}

export interface LeaderboardResponse {
  date: string;
  type: LeaderboardType;
  segment: string | null;
  ranks: LeaderboardEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// ============================================
// SERVICE
// ============================================

class LeaderboardService {
  /**
   * Get Redis key for leaderboard
   */
  private getRedisKey(type: LeaderboardType, date: string, segment?: string): string {
    const segmentPart = segment ? `:${segment}` : '';
    return `leaderboard:${type}:${date}${segmentPart}`;
  }

  /**
   * Materialize leaderboard (compute and store top N)
   */
  async materializeLeaderboard(
    type: LeaderboardType,
    date: string,
    topN: number = 100,
    segment?: string
  ): Promise<void> {
    let queryStr = `
      SELECT 
        dus.user_id,
        dus.total_score,
        dus.component_scores,
        u.first_name || ' ' || u.last_name as name,
        u.avatar
      FROM daily_user_scores dus
      JOIN users u ON u.id = dus.user_id
      WHERE dus.date = $1::date
        AND u.onboarding_status = 'completed'
    `;
    const params: (string | number)[] = [date];
    let paramIndex = 2;

    // Apply filters based on type
    if (type === 'country' && segment) {
      // Would need country field in users table - simplified for MVP
      queryStr += ` AND u.id IN (SELECT id FROM users LIMIT 1000)`;
    } else if (type === 'friends') {
      // Would need friends table - simplified for MVP
      queryStr += ` AND u.id IN (SELECT id FROM users LIMIT 100)`;
    } else if (type === 'competition' && segment) {
      queryStr += ` AND dus.user_id IN (
        SELECT user_id FROM competition_entries 
        WHERE competition_id = $${paramIndex++} AND status = 'active'
      )`;
      params.push(segment);
    }

    // Filter out users who opted out of global leaderboards
    if (type === 'global') {
      queryStr += ` AND (u.privacy_flags->>'hide_from_global')::boolean IS NOT TRUE`;
    }

    queryStr += ` ORDER BY dus.total_score DESC LIMIT $${paramIndex++}`;
    params.push(topN);

    const result = await query<{
      user_id: string;
      total_score: number;
      component_scores: Record<string, number>;
      name: string;
      avatar: string | null;
    }>(queryStr, params);

    const ranks: LeaderboardEntry[] = result.rows.map((row, index) => ({
      user_id: row.user_id,
      rank: index + 1,
      total_score: parseFloat(row.total_score.toString()),
      component_scores: row.component_scores as LeaderboardEntry['component_scores'],
      user: {
        name: row.name,
        avatar: row.avatar || undefined,
      },
    }));

    // Ensure unique constraint exists before upsert (self-healing)
    await query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'leaderboard_snapshots_date_board_type_segment_key_key'
        ) THEN
          ALTER TABLE leaderboard_snapshots ADD CONSTRAINT leaderboard_snapshots_date_board_type_segment_key_key
            UNIQUE (date, board_type, segment_key);
        END IF;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `).catch(() => { /* constraint may already exist */ });

    // Store in database snapshot
    await query(
      `INSERT INTO leaderboard_snapshots (date, board_type, segment_key, ranks, metadata)
       VALUES ($1::date, $2, $3, $4, $5)
       ON CONFLICT (date, board_type, segment_key)
       DO UPDATE SET
         ranks = EXCLUDED.ranks,
         metadata = EXCLUDED.metadata,
         updated_at = CURRENT_TIMESTAMP`,
      [
        date,
        type,
        segment || null,
        JSON.stringify(ranks),
        JSON.stringify({
          total_users: ranks.length,
          last_updated: new Date().toISOString(),
          top_n_count: topN,
        }),
      ]
    );

    // Update Redis sorted set
    const redisKey = this.getRedisKey(type, date, segment);
    const members = ranks.map((entry) => ({
      score: entry.total_score,
      member: entry.user_id,
    }));
    await redisCacheService.zDelete(redisKey);
    
    if (members.length > 0) {
      await redisCacheService.zAddMultiple(redisKey, members);
      await redisCacheService.expire(redisKey, 86400 * 7); // 7 days
    } else {
      const logPayload = { type, date, segment };
      if (type === 'competition') {
        logger.debug('[Leaderboard] Competition leaderboard has no scored members yet', logPayload);
      } else {
        logger.info('[Leaderboard] Leaderboard has no scored members yet', logPayload);
      }
    }

    logger.info('[Leaderboard] Materialized leaderboard', { type, date, segment, count: ranks.length });
  }

  /**
   * Get leaderboard from cache or database
   */
  async getLeaderboard(
    type: LeaderboardType,
    date: string,
    options: {
      segment?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<LeaderboardResponse> {
    const limit = options.limit || 100;
    const offset = options.offset || 0;

    // Try Redis first
    const redisKey = this.getRedisKey(type, date, options.segment);
    const cachedRanks = await redisCacheService.zRevRange(redisKey, offset, offset + limit - 1, true);

    let ranks: LeaderboardEntry[] = [];

    if (cachedRanks.length > 0) {
      const userIds: string[] = [];
      const scoreMap = new Map<string, { score: number; rank: number }>();
      for (let i = 0; i < cachedRanks.length; i += 2) {
        const userId = cachedRanks[i];
        const score = parseFloat(cachedRanks[i + 1] || '0');
        const rank = offset + Math.floor(i / 2) + 1;
        userIds.push(userId);
        scoreMap.set(userId, { score, rank });
      }

      if (userIds.length > 0) {
        const placeholders = userIds.map((_, i) => `$${i + 2}`).join(',');
        const enrichResult = await query<{
          id: string;
          first_name: string;
          last_name: string;
          avatar: string | null;
          component_scores: Record<string, number> | null;
        }>(
          `SELECT u.id, u.first_name, u.last_name, u.avatar, dus.component_scores
           FROM users u
           LEFT JOIN daily_user_scores dus ON dus.user_id = u.id AND dus.date = $1::date
           WHERE u.id IN (${placeholders})`,
          [date, ...userIds]
        );

        const userMap = new Map(enrichResult.rows.map((r) => [r.id, r]));
        for (const userId of userIds) {
          const userData = userMap.get(userId);
          const cached = scoreMap.get(userId)!;
          if (!userData) continue;
          const raw = userData.component_scores;
          const cs: LeaderboardEntry['component_scores'] = raw ? {
            workout: raw.workout ?? 0,
            nutrition: raw.nutrition ?? 0,
            wellbeing: raw.wellbeing ?? 0,
            biometrics: raw.biometrics ?? 0,
            engagement: raw.engagement ?? (raw as any).participation ?? 0,
            consistency: raw.consistency ?? 0,
          } : { workout: 0, nutrition: 0, wellbeing: 0, biometrics: 0, engagement: 0, consistency: 0 };

          ranks.push({
            user_id: userId,
            rank: cached.rank,
            total_score: cached.score,
            component_scores: cs,
            user: {
              name: `${userData.first_name} ${userData.last_name}`,
              avatar: userData.avatar || undefined,
            },
          });
        }
      }
    } else {
      // Fallback to database snapshot
      const snapshotResult = await query<{
        ranks: LeaderboardEntry[];
        metadata: Record<string, unknown>;
      }>(
        `SELECT ranks, metadata FROM leaderboard_snapshots 
         WHERE date = $1::date AND board_type = $2 AND (segment_key = $3 OR ($3 IS NULL AND segment_key IS NULL))`,
        [date, type, options.segment || null]
      );

      if (snapshotResult.rows.length > 0) {
        const allRanks = snapshotResult.rows[0].ranks as LeaderboardEntry[];
        ranks = allRanks.slice(offset, offset + limit);
      }
    }

    // Get total count filtered by board type
    let countQuery = `SELECT COUNT(*) as count FROM daily_user_scores dus
       JOIN users u ON u.id = dus.user_id
       WHERE dus.date = $1::date AND u.onboarding_status = 'completed'`;
    const countParams: (string | number)[] = [date];

    if (type === 'global') {
      countQuery += ` AND (u.privacy_flags->>'hide_from_global')::boolean IS NOT TRUE`;
    } else if (type === 'competition' && options.segment) {
      countQuery += ` AND dus.user_id IN (
        SELECT user_id FROM competition_entries WHERE competition_id = $2 AND status = 'active'
      )`;
      countParams.push(options.segment);
    }

    const totalResult = await query<{ count: string }>(countQuery, countParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    return {
      date,
      type,
      segment: options.segment || null,
      ranks,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  /**
   * Get "around me" leaderboard (ranks around user)
   */
  async getAroundMe(
    userId: string,
    date: string,
    range: number = 50
  ): Promise<LeaderboardResponse> {
    // Get user's rank
    const userRankResult = await query<{ rank_global: number | null }>(
      `SELECT rank_global FROM daily_user_scores WHERE user_id = $1 AND date = $2::date`,
      [userId, date]
    );

    const userRank = userRankResult.rows[0]?.rank_global;
    if (userRank == null) {
      return {
        date,
        type: 'global',
        segment: null,
        ranks: [],
        pagination: { total: 0, limit: range * 2 + 1, offset: 0 },
      };
    }

    const startRank = Math.max(1, userRank - range);
    const endRank = userRank + range;

    // Get ranks around user
    const result = await query<{
      user_id: string;
      total_score: number;
      component_scores: Record<string, number>;
      rank_global: number;
      first_name: string;
      last_name: string;
      avatar: string | null;
    }>(
      `SELECT 
        dus.user_id,
        dus.total_score,
        dus.component_scores,
        dus.rank_global,
        u.first_name,
        u.last_name,
        u.avatar
      FROM daily_user_scores dus
      JOIN users u ON u.id = dus.user_id
      WHERE dus.date = $1::date
        AND dus.rank_global >= $2
        AND dus.rank_global <= $3
        AND u.onboarding_status = 'completed'
        AND (u.privacy_flags->>'hide_from_global')::boolean IS NOT TRUE
      ORDER BY dus.rank_global ASC`,
      [date, startRank, endRank]
    );

    const ranks: LeaderboardEntry[] = result.rows.map((row) => ({
      user_id: row.user_id,
      rank: row.rank_global,
      total_score: parseFloat(row.total_score.toString()),
      component_scores: row.component_scores as LeaderboardEntry['component_scores'],
      user: {
        name: `${row.first_name} ${row.last_name}`,
        avatar: row.avatar || undefined,
      },
    }));

    return {
      date,
      type: 'global',
      segment: null,
      ranks,
      pagination: {
        total: ranks.length,
        limit: range * 2 + 1,
        offset: 0,
      },
    };
  }

  /**
   * Get user's current rank
   */
  async getUserRank(
    userId: string,
    date: string,
    type: LeaderboardType = 'global'
  ): Promise<number | null> {
    const rankColumn = type === 'global' ? 'rank_global' : type === 'country' ? 'rank_country' : 'rank_friends';

    const result = await query<{ rank: number | null }>(
      `SELECT ${rankColumn} as rank 
       FROM daily_user_scores 
       WHERE user_id = $1 AND date = $2::date`,
      [userId, date]
    );

    return result.rows[0]?.rank ?? null;
  }

  /**
   * Update ranks in daily_user_scores after materialization
   */
  async updateRanks(date: string): Promise<void> {
    // Update global ranks
    await query(
      `UPDATE daily_user_scores dus
       SET rank_global = sub.rank
       FROM (
         SELECT dus2.user_id, ROW_NUMBER() OVER (ORDER BY dus2.total_score DESC) as rank
         FROM daily_user_scores dus2
         JOIN users u ON u.id = dus2.user_id
         WHERE dus2.date = $1::date AND u.onboarding_status = 'completed'
       ) sub
       WHERE dus.user_id = sub.user_id AND dus.date = $1::date`,
      [date]
    );

    logger.info('[Leaderboard] Updated ranks', { date });
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();
export default leaderboardService;

