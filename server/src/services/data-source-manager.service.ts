/**
 * @file Data Source Manager Service
 * Unified service for managing data source connections and signals.
 */

import { pool } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

export interface DataSourceConnection {
  id: string;
  userId: string;
  sourceType: string;
  status: string;
  credentials: Record<string, unknown>;
  config: Record<string, unknown>;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  syncError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceSignal {
  id: string;
  userId: string;
  sourceType: string;
  signalType: string;
  signalDate: string;
  startTime: string | null;
  endTime: string | null;
  value: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface SignalInput {
  userId: string;
  sourceType: string;
  signalType: string;
  signalDate: string;
  startTime?: string;
  endTime?: string;
  value: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface DataSourceOverview {
  sourceType: string;
  status: string;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  syncError: string | null;
  signalCount: number;
}

// ============================================
// SERVICE
// ============================================

class DataSourceManagerService {
  async getConnections(userId: string): Promise<DataSourceConnection[]> {
    const { rows } = await pool.query(
      `SELECT id, user_id, source_type, status, credentials, config,
              last_sync_at, next_sync_at, sync_error,
              created_at, updated_at
       FROM data_source_connections
       WHERE user_id = $1
       ORDER BY source_type`,
      [userId]
    );

    return rows.map(this.mapConnection);
  }

  async getConnection(userId: string, sourceType: string): Promise<DataSourceConnection | null> {
    const { rows } = await pool.query(
      `SELECT id, user_id, source_type, status, credentials, config,
              last_sync_at, next_sync_at, sync_error,
              created_at, updated_at
       FROM data_source_connections
       WHERE user_id = $1 AND source_type = $2`,
      [userId, sourceType]
    );

    return rows.length > 0 ? this.mapConnection(rows[0]) : null;
  }

  async upsertConnection(
    userId: string,
    sourceType: string,
    config: Record<string, unknown>
  ): Promise<DataSourceConnection> {
    const { rows } = await pool.query(
      `INSERT INTO data_source_connections (user_id, source_type, config, status)
       VALUES ($1, $2, $3, 'active')
       ON CONFLICT (user_id, source_type)
       DO UPDATE SET config = $3, status = 'active', sync_error = NULL, updated_at = NOW()
       RETURNING id, user_id, source_type, status, credentials, config,
                 last_sync_at, next_sync_at, sync_error,
                 created_at, updated_at`,
      [userId, sourceType, JSON.stringify(config)]
    );

    logger.info('Data source connection upserted', { userId, sourceType });
    return this.mapConnection(rows[0]);
  }

  async updateConnectionStatus(
    userId: string,
    sourceType: string,
    status: string,
    syncError?: string
  ): Promise<void> {
    await pool.query(
      `UPDATE data_source_connections
       SET status = $3, sync_error = $4, updated_at = NOW()
       WHERE user_id = $1 AND source_type = $2`,
      [userId, sourceType, status, syncError ?? null]
    );
  }

  async markSynced(userId: string, sourceType: string): Promise<void> {
    await pool.query(
      `UPDATE data_source_connections
       SET last_sync_at = NOW(),
           next_sync_at = NOW() + INTERVAL '1 hour',
           sync_error = NULL,
           status = 'active',
           updated_at = NOW()
       WHERE user_id = $1 AND source_type = $2`,
      [userId, sourceType]
    );
  }

  async disconnect(userId: string, sourceType: string): Promise<void> {
    await pool.query(
      `UPDATE data_source_connections
       SET status = 'disconnected', updated_at = NOW()
       WHERE user_id = $1 AND source_type = $2`,
      [userId, sourceType]
    );

    logger.info('Data source disconnected', { userId, sourceType });
  }

  async getActiveConnectionsForSync(batchSize: number): Promise<DataSourceConnection[]> {
    const { rows } = await pool.query(
      `SELECT id, user_id, source_type, status, credentials, config,
              last_sync_at, next_sync_at, sync_error,
              created_at, updated_at
       FROM data_source_connections
       WHERE status = 'active'
         AND (next_sync_at IS NULL OR next_sync_at <= NOW())
       ORDER BY next_sync_at ASC NULLS FIRST
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [batchSize]
    );

    return rows.map(this.mapConnection);
  }

  async insertSignals(signals: SignalInput[]): Promise<number> {
    if (signals.length === 0) return 0;

    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (let i = 0; i < signals.length; i++) {
      const s = signals[i];
      const offset = i * 8;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
      );
      values.push(
        s.userId,
        s.sourceType,
        s.signalType,
        s.signalDate,
        s.startTime ?? null,
        s.endTime ?? null,
        JSON.stringify(s.value),
        s.metadata ? JSON.stringify(s.metadata) : null
      );
    }

    const { rowCount } = await pool.query(
      `INSERT INTO data_source_signals
         (user_id, source_type, signal_type, signal_date, start_time, end_time, value, metadata)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT DO NOTHING`,
      values
    );

    logger.info('Signals inserted', { count: rowCount });
    return rowCount ?? 0;
  }

  async getSignalsForDate(userId: string, date: string): Promise<DataSourceSignal[]> {
    const { rows } = await pool.query(
      `SELECT id, user_id, source_type, signal_type, signal_date,
              start_time, end_time, value, metadata, created_at
       FROM data_source_signals
       WHERE user_id = $1 AND signal_date = $2
       ORDER BY source_type, signal_type`,
      [userId, date]
    );

    return rows.map(this.mapSignal);
  }

  async getOverview(userId: string): Promise<DataSourceOverview[]> {
    const { rows } = await pool.query(
      `SELECT c.source_type,
              c.status,
              c.last_sync_at,
              c.next_sync_at,
              c.sync_error,
              COALESCE(s.signal_count, 0)::int AS signal_count
       FROM data_source_connections c
       LEFT JOIN (
         SELECT user_id, source_type, COUNT(*) AS signal_count
         FROM data_source_signals
         WHERE user_id = $1
         GROUP BY user_id, source_type
       ) s ON s.user_id = c.user_id AND s.source_type = c.source_type
       WHERE c.user_id = $1
       ORDER BY c.source_type`,
      [userId]
    );

    return rows.map((r) => ({
      sourceType: r.source_type,
      status: r.status,
      lastSyncAt: r.last_sync_at,
      nextSyncAt: r.next_sync_at,
      syncError: r.sync_error,
      signalCount: r.signal_count,
    }));
  }

  async cleanupOldSignals(daysToKeep: number): Promise<number> {
    const { rowCount } = await pool.query(
      `DELETE FROM data_source_signals
       WHERE created_at < NOW() - ($1 || ' days')::INTERVAL`,
      [daysToKeep]
    );

    logger.info('Old signals cleaned up', { daysToKeep, deleted: rowCount });
    return rowCount ?? 0;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private mapConnection(row: Record<string, unknown>): DataSourceConnection {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      sourceType: row.source_type as string,
      status: row.status as string,
      credentials: (typeof row.credentials === 'string' ? JSON.parse(row.credentials) : row.credentials ?? {}) as Record<string, unknown>,
      config: (typeof row.config === 'string' ? JSON.parse(row.config) : row.config ?? {}) as Record<string, unknown>,
      lastSyncAt: row.last_sync_at as string | null,
      nextSyncAt: row.next_sync_at as string | null,
      syncError: row.sync_error as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapSignal(row: Record<string, unknown>): DataSourceSignal {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      sourceType: row.source_type as string,
      signalType: row.signal_type as string,
      signalDate: row.signal_date as string,
      startTime: row.start_time as string | null,
      endTime: row.end_time as string | null,
      value: (typeof row.value === 'string' ? JSON.parse(row.value) : row.value) as Record<string, unknown>,
      metadata: row.metadata
        ? ((typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) as Record<string, unknown>)
        : null,
      createdAt: row.created_at as string,
    };
  }
}

export const dataSourceManagerService = new DataSourceManagerService();
