/**
 * Core Profile Kernel Service Unit Tests
 *
 * Tests for getProfile, getProfileSection, getProfileSummary, calibrate,
 * updateValue, gracefulGet, getMissingFields, deleteEntry.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';
import { pgResult, pgEmpty } from '../../helpers/factories.js';

// ============================================
// MOCKS
// ============================================

const { mockQuery } = setupDbMock();
setupLoggerMock();

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const { coreProfileKernelService } = await import(
  '../../../src/services/core-profile-kernel.service.js'
);

// ============================================
// HELPERS
// ============================================

const USER_ID = '11111111-aaaa-bbbb-cccc-000000000001';
const NOW = new Date();

function makeCoreProfileRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'row-001',
    user_id: USER_ID,
    section: 'biometrics',
    key: 'resting_hr',
    value: 62,
    unit: 'bpm',
    confidence: 0.85,
    calibrated_at: NOW,
    data_points_used: 14,
    source: 'wearable',
    previous_values: [],
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('CoreProfileKernelService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------------------------
  // getProfile
  // ------------------------------------------
  describe('getProfile', () => {
    it('should return entries grouped by section', async () => {
      const rows = [
        makeCoreProfileRow({ section: 'biometrics', key: 'resting_hr' }),
        makeCoreProfileRow({ id: 'row-002', section: 'biometrics', key: 'weight_kg', value: 75, unit: 'kg' }),
        makeCoreProfileRow({ id: 'row-003', section: 'targets', key: 'daily_calories', value: 2200, unit: 'kcal' }),
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const profile = await coreProfileKernelService.getProfile(USER_ID);

      expect(profile.biometrics).toHaveLength(2);
      expect(profile.targets).toHaveLength(1);
      expect(profile.constraints).toHaveLength(0);
      expect(profile.preferences).toHaveLength(0);
      expect(profile.medical).toHaveLength(0);
      expect(profile.lifestyle).toHaveLength(0);
    });

    it('should add missingFields for uncalibrated expected fields', async () => {
      // Only provide resting_hr and weight_kg — remaining 13 should be missing
      const rows = [
        makeCoreProfileRow({ section: 'biometrics', key: 'resting_hr' }),
        makeCoreProfileRow({ id: 'row-002', section: 'biometrics', key: 'weight_kg' }),
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const profile = await coreProfileKernelService.getProfile(USER_ID);

      expect(profile.missingFields.length).toBe(13);
      // Should NOT include resting_hr or weight_kg
      const missingKeys = profile.missingFields.map((f: { key: string }) => f.key);
      expect(missingKeys).not.toContain('resting_hr');
      expect(missingKeys).not.toContain('weight_kg');
    });

    it('should return all sections empty for a user with no profile data', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const profile = await coreProfileKernelService.getProfile(USER_ID);

      expect(profile.biometrics).toHaveLength(0);
      expect(profile.targets).toHaveLength(0);
      expect(profile.constraints).toHaveLength(0);
      expect(profile.preferences).toHaveLength(0);
      expect(profile.medical).toHaveLength(0);
      expect(profile.lifestyle).toHaveLength(0);
      // All 15 expected fields should be missing
      expect(profile.missingFields).toHaveLength(15);
    });
  });

  // ------------------------------------------
  // getProfileSection
  // ------------------------------------------
  describe('getProfileSection', () => {
    it('should return entries for a specific section', async () => {
      const rows = [
        makeCoreProfileRow({ section: 'biometrics', key: 'resting_hr' }),
        makeCoreProfileRow({ id: 'row-002', section: 'biometrics', key: 'weight_kg' }),
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const entries = await coreProfileKernelService.getProfileSection(USER_ID, 'biometrics');

      expect(entries).toHaveLength(2);
      expect(entries[0].section).toBe('biometrics');
      expect(entries[0].key).toBe('resting_hr');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('section = $2'),
        [USER_ID, 'biometrics']
      );
    });

    it('should return empty array for section with no entries', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const entries = await coreProfileKernelService.getProfileSection(USER_ID, 'medical');

      expect(entries).toHaveLength(0);
    });
  });

  // ------------------------------------------
  // getProfileSummary
  // ------------------------------------------
  describe('getProfileSummary', () => {
    it('should format markdown summary for entries with confidence >= 0.3', async () => {
      const rows = [
        { section: 'biometrics', key: 'resting_hr', value: 62, unit: 'bpm', confidence: 0.85 },
        { section: 'biometrics', key: 'weight_kg', value: 75, unit: 'kg', confidence: 0.9 },
        { section: 'targets', key: 'daily_calories', value: 2200, unit: 'kcal', confidence: 0.7 },
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const summary = await coreProfileKernelService.getProfileSummary(USER_ID);

      expect(summary).toContain('### Biometrics');
      expect(summary).toContain('- resting_hr: 62 bpm');
      expect(summary).toContain('- weight_kg: 75 kg');
      expect(summary).toContain('### Targets');
      expect(summary).toContain('- daily_calories: 2200 kcal');
    });

    it('should mark low-confidence entries (< 0.7)', async () => {
      const rows = [
        { section: 'biometrics', key: 'avg_hrv', value: 45, unit: 'ms', confidence: 0.4 },
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const summary = await coreProfileKernelService.getProfileSummary(USER_ID);

      expect(summary).toContain('(low confidence)');
    });

    it('should not mark entries with confidence >= 0.7 as low', async () => {
      const rows = [
        { section: 'biometrics', key: 'resting_hr', value: 62, unit: 'bpm', confidence: 0.85 },
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const summary = await coreProfileKernelService.getProfileSummary(USER_ID);

      expect(summary).not.toContain('(low confidence)');
    });

    it('should return placeholder when no profile data exists', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const summary = await coreProfileKernelService.getProfileSummary(USER_ID);

      expect(summary).toBe('(No core profile data available yet)');
    });

    it('should JSON.stringify object values', async () => {
      const rows = [
        { section: 'constraints', key: 'injuries', value: { type: 'knee', severity: 'mild' }, unit: null, confidence: 0.9 },
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const summary = await coreProfileKernelService.getProfileSummary(USER_ID);

      expect(summary).toContain('{"type":"knee","severity":"mild"}');
    });

    it('should omit unit suffix when unit is null', async () => {
      const rows = [
        { section: 'biometrics', key: 'age', value: 30, unit: null, confidence: 0.9 },
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const summary = await coreProfileKernelService.getProfileSummary(USER_ID);

      expect(summary).toContain('- age: 30');
      // Should NOT have trailing space from missing unit
      expect(summary).not.toContain('30 ');
    });
  });

  // ------------------------------------------
  // calibrate
  // ------------------------------------------
  describe('calibrate', () => {
    it('should insert a new entry and return mapped result', async () => {
      const returnedRow = makeCoreProfileRow({
        value: 64,
        confidence: 0.8,
        data_points_used: 10,
        source: 'wearable',
      });
      mockQuery.mockResolvedValueOnce(pgResult([returnedRow]));

      const entry = await coreProfileKernelService.calibrate(
        USER_ID, 'biometrics', 'resting_hr', 64, 'wearable', 10, 'bpm'
      );

      expect(entry.section).toBe('biometrics');
      expect(entry.key).toBe('resting_hr');
      expect(entry.userId).toBe(USER_ID);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO intelligence_core_profile'),
        expect.arrayContaining([USER_ID, 'biometrics', 'resting_hr'])
      );
    });

    it('should use UPSERT (ON CONFLICT) to update existing entry', async () => {
      const returnedRow = makeCoreProfileRow();
      mockQuery.mockResolvedValueOnce(pgResult([returnedRow]));

      await coreProfileKernelService.calibrate(
        USER_ID, 'biometrics', 'resting_hr', 62, 'wearable', 14, 'bpm'
      );

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT'),
        expect.any(Array)
      );
    });

    it('should compute confidence for wearable source using data points', async () => {
      // Formula: Math.min(0.5 + dataPointsUsed * 0.02, 0.95)
      // With 20 data points: 0.5 + 20 * 0.02 = 0.9
      const returnedRow = makeCoreProfileRow({ confidence: 0.9 });
      mockQuery.mockResolvedValueOnce(pgResult([returnedRow]));

      await coreProfileKernelService.calibrate(
        USER_ID, 'biometrics', 'resting_hr', 62, 'wearable', 20
      );

      const passedArgs = mockQuery.mock.calls[0][1] as unknown[];
      // confidence is at index 5 in the params array
      expect(passedArgs[5]).toBe(0.9);
    });

    it('should cap wearable confidence at 0.95', async () => {
      // With 100 data points: Math.min(0.5 + 100 * 0.02, 0.95) = 0.95
      const returnedRow = makeCoreProfileRow({ confidence: 0.95 });
      mockQuery.mockResolvedValueOnce(pgResult([returnedRow]));

      await coreProfileKernelService.calibrate(
        USER_ID, 'biometrics', 'resting_hr', 62, 'wearable', 100
      );

      const passedArgs = mockQuery.mock.calls[0][1] as unknown[];
      expect(passedArgs[5]).toBe(0.95);
    });

    it('should compute confidence for AI source', async () => {
      // Formula: Math.min(0.3 + dataPointsUsed * 0.05, 0.85)
      // With 5 data points: 0.3 + 5 * 0.05 = 0.55
      const returnedRow = makeCoreProfileRow({ confidence: 0.55, source: 'ai' });
      mockQuery.mockResolvedValueOnce(pgResult([returnedRow]));

      await coreProfileKernelService.calibrate(
        USER_ID, 'biometrics', 'resting_hr', 62, 'ai', 5
      );

      const passedArgs = mockQuery.mock.calls[0][1] as unknown[];
      expect(passedArgs[5]).toBe(0.55);
    });

    it('should pass null for unit when not provided', async () => {
      const returnedRow = makeCoreProfileRow({ unit: null });
      mockQuery.mockResolvedValueOnce(pgResult([returnedRow]));

      await coreProfileKernelService.calibrate(
        USER_ID, 'biometrics', 'age', 30, 'user', 1
      );

      const passedArgs = mockQuery.mock.calls[0][1] as unknown[];
      // unit is at index 4
      expect(passedArgs[4]).toBeNull();
    });
  });

  // ------------------------------------------
  // updateValue
  // ------------------------------------------
  describe('updateValue', () => {
    it('should delegate to calibrate with source=user and confidence=0.9', async () => {
      const returnedRow = makeCoreProfileRow({
        source: 'user',
        confidence: 0.9,
        data_points_used: 1,
      });
      mockQuery.mockResolvedValueOnce(pgResult([returnedRow]));

      const entry = await coreProfileKernelService.updateValue(
        USER_ID, 'biometrics', 'weight_kg', 78, 'kg'
      );

      const passedArgs = mockQuery.mock.calls[0][1] as unknown[];
      // source is at index 7
      expect(passedArgs[7]).toBe('user');
      // confidence is at index 5 — user source always returns 0.9
      expect(passedArgs[5]).toBe(0.9);
      // data_points_used is at index 6
      expect(passedArgs[6]).toBe(1);
      expect(entry.userId).toBe(USER_ID);
    });

    it('should upsert correctly via the INSERT ON CONFLICT query', async () => {
      const returnedRow = makeCoreProfileRow({ source: 'user', confidence: 0.9 });
      mockQuery.mockResolvedValueOnce(pgResult([returnedRow]));

      await coreProfileKernelService.updateValue(USER_ID, 'targets', 'daily_calories', 2500);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT (user_id, section, key)'),
        expect.any(Array)
      );
    });
  });

  // ------------------------------------------
  // gracefulGet
  // ------------------------------------------
  describe('gracefulGet', () => {
    it('should return value with available=true when entry exists', async () => {
      const rows = [{ value: 62, confidence: 0.85, source: 'wearable' }];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const result = await coreProfileKernelService.gracefulGet(
        USER_ID, 'biometrics', 'resting_hr'
      );

      expect(result.available).toBe(true);
      expect(result.value).toBe(62);
      expect(result.confidence).toBe(0.85);
      expect(result.source).toBe('wearable');
    });

    it('should return available=false when entry does not exist', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const result = await coreProfileKernelService.gracefulGet(
        USER_ID, 'biometrics', 'resting_hr'
      );

      expect(result.available).toBe(false);
      expect(result.value).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.source).toBe('system');
    });
  });

  // ------------------------------------------
  // getMissingFields
  // ------------------------------------------
  describe('getMissingFields', () => {
    it('should return all 15 expected fields when user has none', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const missing = await coreProfileKernelService.getMissingFields(USER_ID);

      expect(missing).toHaveLength(15);
    });

    it('should not flag existing fields as missing', async () => {
      const rows = [
        { section: 'biometrics', key: 'resting_hr' },
        { section: 'biometrics', key: 'weight_kg' },
        { section: 'targets', key: 'daily_calories' },
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const missing = await coreProfileKernelService.getMissingFields(USER_ID);

      expect(missing).toHaveLength(12);
      const missingKeys = missing.map((f: { key: string }) => f.key);
      expect(missingKeys).not.toContain('resting_hr');
      expect(missingKeys).not.toContain('weight_kg');
      expect(missingKeys).not.toContain('daily_calories');
    });

    it('should assign correct impact levels', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const missing = await coreProfileKernelService.getMissingFields(USER_ID);

      const byKey = Object.fromEntries(
        missing.map((f: { key: string; impact: string }) => [f.key, f.impact])
      );
      expect(byKey['resting_hr']).toBe('high');
      expect(byKey['weight_kg']).toBe('high');
      expect(byKey['height_cm']).toBe('medium');
      expect(byKey['workout_time_preference']).toBe('low');
      expect(byKey['daily_steps']).toBe('low');
      expect(byKey['injuries']).toBe('high');
      expect(byKey['dietary_restrictions']).toBe('high');
      expect(byKey['coaching_style']).toBe('medium');
    });

    it('should return empty array when all expected fields exist', async () => {
      const rows = [
        { section: 'biometrics', key: 'resting_hr' },
        { section: 'biometrics', key: 'height_cm' },
        { section: 'biometrics', key: 'weight_kg' },
        { section: 'biometrics', key: 'age' },
        { section: 'biometrics', key: 'avg_sleep_hours' },
        { section: 'biometrics', key: 'avg_hrv' },
        { section: 'targets', key: 'daily_calories' },
        { section: 'targets', key: 'protein_target_g' },
        { section: 'targets', key: 'weekly_workout_days' },
        { section: 'targets', key: 'target_weight_kg' },
        { section: 'targets', key: 'daily_steps' },
        { section: 'constraints', key: 'injuries' },
        { section: 'constraints', key: 'dietary_restrictions' },
        { section: 'preferences', key: 'coaching_style' },
        { section: 'preferences', key: 'workout_time_preference' },
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const missing = await coreProfileKernelService.getMissingFields(USER_ID);

      expect(missing).toHaveLength(0);
    });
  });

  // ------------------------------------------
  // deleteEntry
  // ------------------------------------------
  describe('deleteEntry', () => {
    it('should return true when a row was deleted', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: 'DELETE', oid: 0, fields: [] });

      const result = await coreProfileKernelService.deleteEntry(
        USER_ID, 'biometrics', 'resting_hr'
      );

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM intelligence_core_profile'),
        [USER_ID, 'biometrics', 'resting_hr']
      );
    });

    it('should return false when no row matched', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: 'DELETE', oid: 0, fields: [] });

      const result = await coreProfileKernelService.deleteEntry(
        USER_ID, 'biometrics', 'nonexistent_key'
      );

      expect(result).toBe(false);
    });
  });
});
