/**
 * @file Data Source Sync Job
 * @description Unified sync job that fans out to per-source sync workers.
 * Runs every 30 minutes, fetching active connections due for sync and
 * dispatching to the appropriate source-specific handler.
 */

import { logger } from '../services/logger.service.js';
import { dataSourceManagerService } from '../services/data-source-manager.service.js';
import { spotifyListeningService } from '../services/spotify-listening.service.js';
import { prayerTimesService } from '../services/prayer-times.service.js';
import { financeTrackingService } from '../services/finance-tracking.service.js';

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const BATCH_SIZE = 50;
const MAX_CONCURRENT = 10;

let isRunning = false;
let intervalId: NodeJS.Timeout | null = null;

// ============================================
// SYNC HANDLERS
// ============================================

type SyncHandler = (
  userId: string,
  credentials: Record<string, unknown>,
  config: Record<string, unknown>,
  date: string,
) => Promise<void>;

const syncHandlers: Record<string, SyncHandler> = {
  async spotify(userId, credentials, _config, date) {
    const accessToken = credentials.accessToken as string;
    if (!accessToken) throw new Error('Missing Spotify access token');
    await spotifyListeningService.syncListeningHistory(userId, accessToken);
    await spotifyListeningService.emitSignals(userId, date);
  },

  async prayer_times(userId, _credentials, config, date) {
    await prayerTimesService.syncPrayerTimes(userId, config as any);
    await prayerTimesService.emitSignals(userId, date);
  },

  async finance(userId, _credentials, _config, date) {
    await financeTrackingService.emitSignals(userId, date);
  },
};

// ============================================
// JOB PROCESSOR
// ============================================

async function processDataSourceSync(): Promise<void> {
  if (isRunning) return;
  isRunning = true;

  try {
    const connections = await dataSourceManagerService.getActiveConnectionsForSync(BATCH_SIZE);
    if (connections.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    // Process in chunks of MAX_CONCURRENT
    for (let i = 0; i < connections.length; i += MAX_CONCURRENT) {
      const chunk = connections.slice(i, i + MAX_CONCURRENT);

      const results = await Promise.allSettled(
        chunk.map(async (conn) => {
          const handler = syncHandlers[conn.sourceType];

          if (!handler) {
            // google_calendar handled by calendar-sync.job, others unknown
            skipped++;
            return;
          }

          try {
            await handler(conn.userId, conn.credentials, conn.config, today);
            await dataSourceManagerService.markSynced(conn.userId, conn.sourceType);
            synced++;
          } catch (err) {
            failed++;
            const message = err instanceof Error ? err.message : 'Unknown error';
            await dataSourceManagerService.updateConnectionStatus(
              conn.userId,
              conn.sourceType,
              'error',
              message,
            );
            logger.warn('[DataSourceSync] Sync failed for connection', {
              connectionId: conn.id,
              userId: conn.userId,
              sourceType: conn.sourceType,
              error: message,
            });
          }
        }),
      );

      const rejected = results.filter((r) => r.status === 'rejected');
      if (rejected.length > 0) {
        logger.error('[DataSourceSync] Unexpected rejections in chunk', {
          count: rejected.length,
        });
      }
    }

    if (synced > 0 || failed > 0 || skipped > 0) {
      logger.info('[DataSourceSync] Batch completed', {
        total: connections.length,
        synced,
        failed,
        skipped,
      });
    }
  } catch (error) {
    logger.error('[DataSourceSync] Job failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    isRunning = false;
  }
}

// ============================================
// JOB LIFECYCLE
// ============================================

export function startDataSourceSyncJob(): void {
  if (intervalId) {
    logger.warn('[DataSourceSync] Already running');
    return;
  }

  const intervalMs =
    parseInt(process.env.DATA_SOURCE_SYNC_INTERVAL_MS || '', 10) || DEFAULT_INTERVAL_MS;

  logger.info('[DataSourceSync] Starting data source sync job', {
    intervalMs,
    intervalHuman: `${(intervalMs / (1000 * 60)).toFixed(0)} min`,
  });

  // Delay first run to let the server fully start
  setTimeout(processDataSourceSync, 120_000);
  intervalId = setInterval(processDataSourceSync, intervalMs);
}

export function stopDataSourceSyncJob(): void {
  if (!intervalId) {
    logger.warn('[DataSourceSync] Not running');
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  logger.info('[DataSourceSync] Stopped');
}

// ============================================
// EXPORTS
// ============================================

export const dataSourceSyncJob = {
  start: startDataSourceSyncJob,
  stop: stopDataSourceSyncJob,
  isRunning: () => isRunning,
  processNow: processDataSourceSync,
};

export default dataSourceSyncJob;
