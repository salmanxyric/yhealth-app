/**
 * @file Data Source Sync Job Tests
 * Tests for unified data source sync fan-out to per-source handlers.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

setupDbMock();
setupLoggerMock();
setupCacheMock();

const mockDataSourceManagerService = {
  getActiveConnectionsForSync: jest.fn<any>().mockResolvedValue([]),
  markSynced: jest.fn<any>().mockResolvedValue(undefined),
  updateConnectionStatus: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/data-source-manager.service.js', () => ({
  dataSourceManagerService: mockDataSourceManagerService,
}));

const mockSpotifyListeningService = {
  syncListeningHistory: jest.fn<any>().mockResolvedValue(undefined),
  emitSignals: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/spotify-listening.service.js', () => ({
  spotifyListeningService: mockSpotifyListeningService,
}));

const mockPrayerTimesService = {
  syncPrayerTimes: jest.fn<any>().mockResolvedValue(undefined),
  emitSignals: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/prayer-times.service.js', () => ({
  prayerTimesService: mockPrayerTimesService,
}));

const mockFinanceTrackingService = {
  emitSignals: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/finance-tracking.service.js', () => ({
  financeTrackingService: mockFinanceTrackingService,
}));

// ── Dynamic imports ─────────────────────────────────────────

const { dataSourceSyncJob } = await import('../../../src/jobs/data-source-sync.job.js');

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set defaults after clearAllMocks wipes implementations
  mockDataSourceManagerService.getActiveConnectionsForSync.mockResolvedValue([]);
  mockDataSourceManagerService.markSynced.mockResolvedValue(undefined);
  mockDataSourceManagerService.updateConnectionStatus.mockResolvedValue(undefined);
  mockSpotifyListeningService.syncListeningHistory.mockResolvedValue(undefined);
  mockSpotifyListeningService.emitSignals.mockResolvedValue(undefined);
  mockPrayerTimesService.syncPrayerTimes.mockResolvedValue(undefined);
  mockPrayerTimesService.emitSignals.mockResolvedValue(undefined);
  mockFinanceTrackingService.emitSignals.mockResolvedValue(undefined);
});

describe('DataSourceSyncJob', () => {
  describe('processNow', () => {
    it('should sync Spotify connections and mark as synced', async () => {
      const connections = [
        {
          id: 'conn-1',
          userId: 'u1',
          sourceType: 'spotify',
          credentials: { accessToken: 'tok-123' },
          config: {},
        },
      ];
      mockDataSourceManagerService.getActiveConnectionsForSync.mockResolvedValueOnce(connections);

      await dataSourceSyncJob.processNow();

      expect(mockSpotifyListeningService.syncListeningHistory).toHaveBeenCalledWith('u1', 'tok-123');
      expect(mockSpotifyListeningService.emitSignals).toHaveBeenCalledWith('u1', expect.any(String));
      expect(mockDataSourceManagerService.markSynced).toHaveBeenCalledWith('u1', 'spotify');
    });

    it('should sync prayer_times connections', async () => {
      const connections = [
        {
          id: 'conn-2',
          userId: 'u2',
          sourceType: 'prayer_times',
          credentials: {},
          config: { latitude: 1.3, longitude: 36.8 },
        },
      ];
      mockDataSourceManagerService.getActiveConnectionsForSync.mockResolvedValueOnce(connections);

      await dataSourceSyncJob.processNow();

      expect(mockPrayerTimesService.syncPrayerTimes).toHaveBeenCalledWith(
        'u2',
        expect.objectContaining({ latitude: 1.3 }),
      );
      expect(mockDataSourceManagerService.markSynced).toHaveBeenCalledWith('u2', 'prayer_times');
    });

    it('should sync finance connections (emit signals only)', async () => {
      const connections = [
        {
          id: 'conn-3',
          userId: 'u3',
          sourceType: 'finance',
          credentials: {},
          config: {},
        },
      ];
      mockDataSourceManagerService.getActiveConnectionsForSync.mockResolvedValueOnce(connections);

      await dataSourceSyncJob.processNow();

      expect(mockFinanceTrackingService.emitSignals).toHaveBeenCalledWith('u3', expect.any(String));
      expect(mockDataSourceManagerService.markSynced).toHaveBeenCalledWith('u3', 'finance');
    });

    it('should do nothing when no connections are due for sync', async () => {
      mockDataSourceManagerService.getActiveConnectionsForSync.mockResolvedValueOnce([]);

      await dataSourceSyncJob.processNow();

      expect(mockSpotifyListeningService.syncListeningHistory).not.toHaveBeenCalled();
      expect(mockDataSourceManagerService.markSynced).not.toHaveBeenCalled();
    });

    it('should skip unknown source types gracefully', async () => {
      const connections = [
        {
          id: 'conn-4',
          userId: 'u4',
          sourceType: 'google_calendar',
          credentials: {},
          config: {},
        },
      ];
      mockDataSourceManagerService.getActiveConnectionsForSync.mockResolvedValueOnce(connections);

      await dataSourceSyncJob.processNow();

      // Should not mark as synced or crash
      expect(mockDataSourceManagerService.markSynced).not.toHaveBeenCalled();
      expect(mockDataSourceManagerService.updateConnectionStatus).not.toHaveBeenCalled();
    });

    it('should mark connection as error when sync handler fails', async () => {
      const connections = [
        {
          id: 'conn-5',
          userId: 'u5',
          sourceType: 'spotify',
          credentials: { accessToken: 'expired-tok' },
          config: {},
        },
      ];
      mockDataSourceManagerService.getActiveConnectionsForSync.mockResolvedValueOnce(connections);
      mockSpotifyListeningService.syncListeningHistory.mockRejectedValueOnce(
        new Error('Token expired'),
      );

      await dataSourceSyncJob.processNow();

      expect(mockDataSourceManagerService.updateConnectionStatus).toHaveBeenCalledWith(
        'u5',
        'spotify',
        'error',
        'Token expired',
      );
      expect(mockDataSourceManagerService.markSynced).not.toHaveBeenCalled();
    });

    it('should handle fatal error in getActiveConnectionsForSync gracefully', async () => {
      mockDataSourceManagerService.getActiveConnectionsForSync.mockRejectedValueOnce(
        new Error('Redis connection lost'),
      );

      await expect(dataSourceSyncJob.processNow()).resolves.toBeUndefined();
    });
  });

  describe('lifecycle', () => {
    it('should report isRunning correctly', () => {
      // isRunning is a function that checks the internal flag, not the interval
      expect(dataSourceSyncJob.isRunning()).toBe(false);
    });
  });
});
