/**
 * Schedule Service Unit Tests
 *
 * Tests for getScheduleByDate, createSchedule, updateSchedule, deleteSchedule,
 * addScheduleItem, updateScheduleItem, deleteScheduleItem, getTemplates, createTemplate.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  pool: { query: mockQuery, end: jest.fn() },
  database: { healthCheck: jest.fn() },
  getClient: jest.fn(),
  closePool: jest.fn(),
  testConnection: jest.fn(),
  getPoolStats: jest.fn(),
  default: {},
}));

jest.unstable_mockModule('../../../src/database/pg.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

// ============================================
// IMPORTS
// ============================================

const { ApiError: _ApiError } = await import('../../../src/utils/ApiError.js');
const { scheduleService } = await import('../../../src/services/schedule.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

const USER_ID = 'user-uuid-1';
const SCHEDULE_ID = 'schedule-uuid-1';
const ITEM_ID = 'item-uuid-1';
const NOW = new Date();

function makeScheduleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: SCHEDULE_ID,
    user_id: USER_ID,
    schedule_date: NOW,
    template_id: null,
    name: 'My Day',
    notes: null,
    is_template: false,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeItemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ITEM_ID,
    schedule_id: SCHEDULE_ID,
    title: 'Morning Workout',
    description: null,
    start_time: '07:00:00',
    end_time: '08:00:00',
    duration_minutes: 60,
    color: '#ff0000',
    icon: null,
    category: 'fitness',
    shape: 'square',
    position: 0,
    metadata: {},
    source: 'manual',
    external_source: null,
    external_id: null,
    source_updated_at: null,
    completed: false,
    completed_at: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeTemplateRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'template-uuid-1',
    user_id: USER_ID,
    name: 'Weekday Routine',
    description: 'My standard weekday',
    is_default: false,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('ScheduleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------
  // getScheduleByDate
  // ------------------------------------------
  describe('getScheduleByDate', () => {
    it('returns schedule with items and links for a given date', async () => {
      const scheduleRow = makeScheduleRow();
      const itemRow = makeItemRow();

      mockQuery
        .mockResolvedValueOnce(pgResult([scheduleRow])) // SELECT schedule
        // syncExternalSlots: getUserTimezone
        .mockResolvedValueOnce(pgResult([{ timezone: 'UTC' }]))
        // Google calendar query
        .mockResolvedValueOnce(pgResult([]))
        // Prayer query
        .mockResolvedValueOnce(pgResult([]))
        // Prune stale externals (no keeps, delete non-manual)
        .mockResolvedValueOnce(pgResult([]))
        // getScheduleItems
        .mockResolvedValueOnce(pgResult([itemRow]))
        // getScheduleLinks
        .mockResolvedValueOnce(pgResult([]));

      const result = await scheduleService.getScheduleByDate(USER_ID, '2026-04-24');

      expect(result).not.toBeNull();
      expect(result!.id).toBe(SCHEDULE_ID);
      expect(result!.items).toHaveLength(1);
      expect(result!.items[0].title).toBe('Morning Workout');
    });

    it('returns null when no schedule exists for the date', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const result = await scheduleService.getScheduleByDate(USER_ID, '2026-01-01');

      expect(result).toBeNull();
    });
  });

  // ------------------------------------------
  // createSchedule
  // ------------------------------------------
  describe('createSchedule', () => {
    it('creates a new schedule and returns it', async () => {
      const scheduleRow = makeScheduleRow();

      // getScheduleByDate check (returns null)
      mockQuery.mockResolvedValueOnce(pgResult([]));
      // INSERT
      mockQuery.mockResolvedValueOnce(pgResult([scheduleRow]));
      // getScheduleItems
      mockQuery.mockResolvedValueOnce(pgResult([]));
      // getScheduleLinks
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const result = await scheduleService.createSchedule(USER_ID, {
        scheduleDate: '2026-04-24',
        name: 'My Day',
      });

      expect(result.id).toBe(SCHEDULE_ID);
      expect(result.items).toHaveLength(0);
    });

    it('returns existing schedule when one already exists for that date', async () => {
      const scheduleRow = makeScheduleRow();

      // getScheduleByDate returns existing
      mockQuery
        .mockResolvedValueOnce(pgResult([scheduleRow])) // SELECT schedule
        .mockResolvedValueOnce(pgResult([{ timezone: 'UTC' }])) // getUserTimezone
        .mockResolvedValueOnce(pgResult([])) // Google sync
        .mockResolvedValueOnce(pgResult([])) // Prayer sync
        .mockResolvedValueOnce(pgResult([])) // Prune
        .mockResolvedValueOnce(pgResult([])) // items
        .mockResolvedValueOnce(pgResult([])); // links

      const result = await scheduleService.createSchedule(USER_ID, {
        scheduleDate: '2026-04-24',
      });

      expect(result.id).toBe(SCHEDULE_ID);
    });
  });

  // ------------------------------------------
  // updateSchedule
  // ------------------------------------------
  describe('updateSchedule', () => {
    it('updates schedule metadata', async () => {
      const updatedRow = makeScheduleRow({ name: 'Updated Day' });

      // verifyScheduleOwnership
      mockQuery.mockResolvedValueOnce(pgResult([{ id: SCHEDULE_ID }]));
      // UPDATE
      mockQuery.mockResolvedValueOnce(pgResult([updatedRow]));
      // getScheduleItems
      mockQuery.mockResolvedValueOnce(pgResult([]));
      // getScheduleLinks
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const result = await scheduleService.updateSchedule(USER_ID, SCHEDULE_ID, {
        name: 'Updated Day',
      });

      expect(result.name).toBe('Updated Day');
    });

    it('throws 404 for missing schedule', async () => {
      // verifyScheduleOwnership returns empty
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        scheduleService.updateSchedule(USER_ID, 'nonexistent', { name: 'X' })
      ).rejects.toThrow();
    });
  });

  // ------------------------------------------
  // deleteSchedule
  // ------------------------------------------
  describe('deleteSchedule', () => {
    it('deletes an existing schedule', async () => {
      // verifyScheduleOwnership
      mockQuery.mockResolvedValueOnce(pgResult([{ id: SCHEDULE_ID }]));
      // DELETE
      mockQuery.mockResolvedValueOnce(pgResult([{ id: SCHEDULE_ID }]));

      await expect(
        scheduleService.deleteSchedule(USER_ID, SCHEDULE_ID)
      ).resolves.toBeUndefined();
    });

    it('throws 404 when schedule does not exist', async () => {
      // verifyScheduleOwnership
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        scheduleService.deleteSchedule(USER_ID, 'nonexistent')
      ).rejects.toThrow();
    });
  });

  // ------------------------------------------
  // addScheduleItem
  // ------------------------------------------
  describe('addScheduleItem', () => {
    it('adds item with start and end times', async () => {
      const itemRow = makeItemRow();

      // verifyScheduleOwnership
      mockQuery.mockResolvedValueOnce(pgResult([{ id: SCHEDULE_ID }]));
      // INSERT item
      mockQuery.mockResolvedValueOnce(pgResult([itemRow]));

      const result = await scheduleService.addScheduleItem(USER_ID, SCHEDULE_ID, {
        title: 'Morning Workout',
        startTime: '07:00',
        endTime: '08:00',
        position: 0,
      });

      expect(result.title).toBe('Morning Workout');
      expect(result.startTime).toBe('07:00');
    });

    it('calculates duration from start and end times when not provided', async () => {
      const itemRow = makeItemRow({ duration_minutes: 60 });

      mockQuery.mockResolvedValueOnce(pgResult([{ id: SCHEDULE_ID }]));
      mockQuery.mockResolvedValueOnce(pgResult([itemRow]));

      const result = await scheduleService.addScheduleItem(USER_ID, SCHEDULE_ID, {
        title: 'Meeting',
        startTime: '09:00',
        endTime: '10:00',
        position: 1,
      });

      expect(result.durationMinutes).toBe(60);
    });
  });

  // ------------------------------------------
  // updateScheduleItem
  // ------------------------------------------
  describe('updateScheduleItem', () => {
    it('updates a manual item successfully', async () => {
      const updatedRow = makeItemRow({ title: 'Evening Workout' });

      // SELECT item to verify ownership + source
      mockQuery.mockResolvedValueOnce(pgResult([{ schedule_id: SCHEDULE_ID, source: 'manual' }]));
      // verifyScheduleOwnership
      mockQuery.mockResolvedValueOnce(pgResult([{ id: SCHEDULE_ID }]));
      // UPDATE item
      mockQuery.mockResolvedValueOnce(pgResult([updatedRow]));

      const result = await scheduleService.updateScheduleItem(USER_ID, ITEM_ID, {
        title: 'Evening Workout',
      });

      expect(result.title).toBe('Evening Workout');
    });

    it('rejects content edit on external source item', async () => {
      // SELECT item — source is google
      mockQuery.mockResolvedValueOnce(pgResult([{ schedule_id: SCHEDULE_ID, source: 'google' }]));
      // verifyScheduleOwnership
      mockQuery.mockResolvedValueOnce(pgResult([{ id: SCHEDULE_ID }]));

      await expect(
        scheduleService.updateScheduleItem(USER_ID, ITEM_ID, { title: 'New Title' })
      ).rejects.toThrow(/external source/i);
    });

    it('allows position-only metadata update on external item', async () => {
      const itemRow = makeItemRow({ source: 'google' });

      mockQuery.mockResolvedValueOnce(pgResult([{ schedule_id: SCHEDULE_ID, source: 'google' }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ id: SCHEDULE_ID }]));
      // SELECT existing metadata for merge
      mockQuery.mockResolvedValueOnce(pgResult([{ metadata: {} }]));
      // UPDATE
      mockQuery.mockResolvedValueOnce(pgResult([itemRow]));

      const result = await scheduleService.updateScheduleItem(USER_ID, ITEM_ID, {
        metadata: { x: 100, y: 200 },
      });

      expect(result).toBeDefined();
    });
  });

  // ------------------------------------------
  // deleteScheduleItem
  // ------------------------------------------
  describe('deleteScheduleItem', () => {
    it('deletes a manual item and its links', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ schedule_id: SCHEDULE_ID, source: 'manual' }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ id: SCHEDULE_ID }]));
      mockQuery.mockResolvedValueOnce(pgResult([])); // DELETE links
      mockQuery.mockResolvedValueOnce(pgResult([])); // DELETE item

      await expect(
        scheduleService.deleteScheduleItem(USER_ID, ITEM_ID)
      ).resolves.toBeUndefined();
    });

    it('rejects deletion of external source item', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ schedule_id: SCHEDULE_ID, source: 'google' }]));
      mockQuery.mockResolvedValueOnce(pgResult([{ id: SCHEDULE_ID }]));

      await expect(
        scheduleService.deleteScheduleItem(USER_ID, ITEM_ID)
      ).rejects.toThrow(/external source/i);
    });

    it('throws 404 when item does not exist', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        scheduleService.deleteScheduleItem(USER_ID, 'nonexistent')
      ).rejects.toThrow();
    });
  });

  // ------------------------------------------
  // getTemplates
  // ------------------------------------------
  describe('getTemplates', () => {
    it('returns user templates ordered by default then date', async () => {
      const templates = [
        makeTemplateRow({ is_default: true, name: 'Default' }),
        makeTemplateRow({ id: 't2', is_default: false, name: 'Custom' }),
      ];

      mockQuery.mockResolvedValueOnce(pgResult(templates));

      const result = await scheduleService.getTemplates(USER_ID);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Default');
      expect(result[0].isDefault).toBe(true);
    });
  });

  // ------------------------------------------
  // createTemplate
  // ------------------------------------------
  describe('createTemplate', () => {
    it('creates a new template', async () => {
      const templateRow = makeTemplateRow();

      mockQuery.mockResolvedValueOnce(pgResult([templateRow]));

      const result = await scheduleService.createTemplate(USER_ID, {
        name: 'Weekday Routine',
        description: 'My standard weekday',
      });

      expect(result.name).toBe('Weekday Routine');
    });

    it('unsets other defaults when creating a default template', async () => {
      const templateRow = makeTemplateRow({ is_default: true });

      // UPDATE existing defaults
      mockQuery.mockResolvedValueOnce(pgResult([]));
      // INSERT new template
      mockQuery.mockResolvedValueOnce(pgResult([templateRow]));

      const result = await scheduleService.createTemplate(USER_ID, {
        name: 'New Default',
        isDefault: true,
      });

      expect(result.isDefault).toBe(true);
      // Verify the unset query was called
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });
});
