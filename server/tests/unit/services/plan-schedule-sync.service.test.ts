/**
 * Plan Schedule Sync Service Unit Tests
 *
 * Tests for syncing workout and diet plan items to daily schedules.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  pool: { query: mockQuery, connect: jest.fn(), end: jest.fn() },
  query: mockQuery,
  transaction: jest.fn(),
  database: { healthCheck: jest.fn() },
  getClient: jest.fn(),
  closePool: jest.fn(),
  testConnection: jest.fn(),
  getPoolStats: jest.fn(),
  default: {},
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

// ============================================
// IMPORTS
// ============================================

const { planScheduleSyncService } = await import('../../../src/services/plan-schedule-sync.service.js');

// ============================================
// HELPERS
// ============================================

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const TEST_SCHEDULE_ID = '22222222-2222-2222-2222-222222222222';
const TEST_WORKOUT_PLAN_ID = '33333333-3333-3333-3333-333333333333';
const TEST_DIET_PLAN_ID = '44444444-4444-4444-4444-444444444444';

const mockWorkoutPlan = {
  id: TEST_WORKOUT_PLAN_ID,
  name: 'Strength Training Plan',
  weekly_schedule: {
    monday: {
      dayOfWeek: 'monday',
      workoutName: 'Upper Body Strength',
      focusArea: 'Chest & Arms',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: 8 },
        { name: 'Bicep Curls', sets: 3, reps: 12 },
        { name: 'Tricep Dips', sets: 3, reps: 10 },
        { name: 'Shoulder Press', sets: 3, reps: 10 },
      ],
      estimatedDuration: 60,
      scheduledTime: '21:00',
      isRestDay: false,
    },
    tuesday: {
      dayOfWeek: 'tuesday',
      workoutName: 'Rest Day',
      focusArea: 'Recovery',
      exercises: [],
      estimatedDuration: 0,
      isRestDay: true,
    },
    wednesday: {
      dayOfWeek: 'wednesday',
      workoutName: 'Lower Body Strength',
      focusArea: 'Legs & Core',
      exercises: [
        { name: 'Squats', sets: 4, reps: 8 },
        { name: 'Deadlift', sets: 3, reps: 8 },
      ],
      estimatedDuration: 45,
      isRestDay: false,
    },
  },
  schedule_days: ['monday', 'wednesday', 'friday'],
  start_date: '2026-05-01',
};

const mockDietPlan = {
  id: TEST_DIET_PLAN_ID,
  name: 'Balanced Nutrition Plan',
  daily_calories: 2000,
  meal_times: {
    breakfast: '08:00',
    lunch: '12:30',
    dinner: '19:00',
    snack: '15:00',
  },
  meals_per_day: 3,
  snacks_per_day: 1,
};

function setupQueryMocks(options: {
  existingSchedule?: boolean;
  hasWorkoutPlan?: boolean;
  hasDietPlan?: boolean;
}) {
  mockQuery.mockImplementation(async (sql: string, _params?: unknown[]) => {
    // Schedule existence check
    if (sql.includes('FROM daily_schedules') && sql.includes('schedule_date')) {
      if (options.existingSchedule) {
        return { rows: [{ id: TEST_SCHEDULE_ID }] };
      }
      return { rows: [] };
    }

    // Schedule creation
    if (sql.includes('INSERT INTO daily_schedules')) {
      return { rows: [{ id: TEST_SCHEDULE_ID }] };
    }

    // Workout plan query
    if (sql.includes('FROM workout_plans')) {
      if (options.hasWorkoutPlan) {
        return { rows: [mockWorkoutPlan] };
      }
      return { rows: [] };
    }

    // Diet plan query
    if (sql.includes('FROM diet_plans')) {
      if (options.hasDietPlan) {
        return { rows: [mockDietPlan] };
      }
      return { rows: [] };
    }

    // Upsert schedule item
    if (sql.includes('INSERT INTO schedule_items')) {
      return { rows: [{ id: 'item-id' }] };
    }

    return { rows: [] };
  });
}

// ============================================
// TESTS
// ============================================

describe('PlanScheduleSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncToExistingSchedule', () => {
    it('should sync workout items for a workout day', async () => {
      setupQueryMocks({ hasWorkoutPlan: true, hasDietPlan: false });

      // 2026-05-11 is a Monday
      const result = await planScheduleSyncService.syncToExistingSchedule(
        TEST_USER_ID,
        TEST_SCHEDULE_ID,
        '2026-05-11',
      );

      expect(result.workoutItems).toBe(1);
      expect(result.mealItems).toBe(0);

      // Verify upsert was called with correct data
      const upsertCalls = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO schedule_items'),
      );
      expect(upsertCalls.length).toBe(1);

      const upsertParams = upsertCalls[0][1] as any[];
      expect(upsertParams[0]).toBe(TEST_SCHEDULE_ID); // schedule_id
      expect(upsertParams[1]).toBe('Upper Body Strength'); // title
      expect(upsertParams[3]).toBe('21:00'); // start_time (from scheduledTime)
      expect(upsertParams[4]).toBe('22:00'); // end_time (21:00 + 60 min)
      expect(upsertParams[5]).toBe(60); // duration_minutes
      expect(upsertParams[7]).toBe('exercise'); // category
      expect(upsertParams[9]).toBe('workout_plan'); // external_source
    });

    it('should NOT sync workout items for a rest day', async () => {
      setupQueryMocks({ hasWorkoutPlan: true, hasDietPlan: false });

      // 2026-05-12 is a Tuesday (rest day in our mock)
      const result = await planScheduleSyncService.syncToExistingSchedule(
        TEST_USER_ID,
        TEST_SCHEDULE_ID,
        '2026-05-12',
      );

      expect(result.workoutItems).toBe(0);
    });

    it('should sync meal items from diet plan', async () => {
      setupQueryMocks({ hasWorkoutPlan: false, hasDietPlan: true });

      const result = await planScheduleSyncService.syncToExistingSchedule(
        TEST_USER_ID,
        TEST_SCHEDULE_ID,
        '2026-05-11',
      );

      expect(result.mealItems).toBe(4); // breakfast, lunch, dinner, snack

      const upsertCalls = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO schedule_items'),
      );
      expect(upsertCalls.length).toBe(4);

      // Verify breakfast
      const breakfastParams = upsertCalls[0][1] as any[];
      expect(breakfastParams[1]).toBe('Breakfast');
      expect(breakfastParams[3]).toBe('08:00');
      expect(breakfastParams[7]).toBe('meal');
      expect(breakfastParams[9]).toBe('diet_plan');

      // Verify lunch
      const lunchParams = upsertCalls[1][1] as any[];
      expect(lunchParams[1]).toBe('Lunch');
      expect(lunchParams[3]).toBe('12:30');

      // Verify dinner
      const dinnerParams = upsertCalls[2][1] as any[];
      expect(dinnerParams[1]).toBe('Dinner');
      expect(dinnerParams[3]).toBe('19:00');

      // Verify snack
      const snackParams = upsertCalls[3][1] as any[];
      expect(snackParams[1]).toContain('Snack');
      expect(snackParams[3]).toBe('15:00');
    });

    it('should sync both workout and meal items together', async () => {
      setupQueryMocks({ hasWorkoutPlan: true, hasDietPlan: true });

      // Monday - has workout
      const result = await planScheduleSyncService.syncToExistingSchedule(
        TEST_USER_ID,
        TEST_SCHEDULE_ID,
        '2026-05-11',
      );

      expect(result.workoutItems).toBe(1);
      expect(result.mealItems).toBe(4);
    });

    it('should return zero counts when no active plans exist', async () => {
      setupQueryMocks({ hasWorkoutPlan: false, hasDietPlan: false });

      const result = await planScheduleSyncService.syncToExistingSchedule(
        TEST_USER_ID,
        TEST_SCHEDULE_ID,
        '2026-05-11',
      );

      expect(result.workoutItems).toBe(0);
      expect(result.mealItems).toBe(0);
    });

    it('should skip snacks when snacks_per_day is 0', async () => {
      const noSnackPlan = { ...mockDietPlan, snacks_per_day: 0 };
      mockQuery.mockImplementation(async (sql: string) => {
        if (sql.includes('FROM diet_plans')) return { rows: [noSnackPlan] };
        if (sql.includes('FROM workout_plans')) return { rows: [] };
        if (sql.includes('INSERT INTO schedule_items')) return { rows: [{ id: 'item-id' }] };
        return { rows: [] };
      });

      const result = await planScheduleSyncService.syncToExistingSchedule(
        TEST_USER_ID,
        TEST_SCHEDULE_ID,
        '2026-05-11',
      );

      expect(result.mealItems).toBe(3); // Only breakfast, lunch, dinner
    });

    it('should use default start time when workout has no scheduledTime', async () => {
      const noTimePlan = {
        ...mockWorkoutPlan,
        weekly_schedule: {
          ...mockWorkoutPlan.weekly_schedule,
          monday: {
            ...mockWorkoutPlan.weekly_schedule.monday,
            scheduledTime: undefined,
          },
        },
      };

      mockQuery.mockImplementation(async (sql: string) => {
        if (sql.includes('FROM workout_plans')) return { rows: [noTimePlan] };
        if (sql.includes('FROM diet_plans')) return { rows: [] };
        if (sql.includes('INSERT INTO schedule_items')) return { rows: [{ id: 'item-id' }] };
        return { rows: [] };
      });

      const result = await planScheduleSyncService.syncToExistingSchedule(
        TEST_USER_ID,
        TEST_SCHEDULE_ID,
        '2026-05-11',
      );

      expect(result.workoutItems).toBe(1);

      const upsertCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO schedule_items'),
      );
      const params = upsertCall![1] as any[];
      expect(params[3]).toBe('07:00'); // Default start time
    });
  });

  describe('syncPlansToSchedule', () => {
    it('should create schedule if none exists and sync items', async () => {
      setupQueryMocks({ existingSchedule: false, hasWorkoutPlan: true, hasDietPlan: true });

      const result = await planScheduleSyncService.syncPlansToSchedule(
        TEST_USER_ID,
        '2026-05-11',
      );

      expect(result.scheduleId).toBe(TEST_SCHEDULE_ID);
      expect(result.workoutItems).toBe(1);
      expect(result.mealItems).toBe(4);

      // Verify schedule creation was attempted
      const createCalls = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO daily_schedules'),
      );
      expect(createCalls.length).toBe(1);
    });

    it('should use existing schedule if one exists', async () => {
      setupQueryMocks({ existingSchedule: true, hasWorkoutPlan: true, hasDietPlan: false });

      const result = await planScheduleSyncService.syncPlansToSchedule(
        TEST_USER_ID,
        '2026-05-11',
      );

      expect(result.scheduleId).toBe(TEST_SCHEDULE_ID);

      // Verify no schedule creation
      const createCalls = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO daily_schedules'),
      );
      expect(createCalls.length).toBe(0);
    });

    it('should include calorie targets in meal metadata', async () => {
      setupQueryMocks({ existingSchedule: true, hasWorkoutPlan: false, hasDietPlan: true });

      await planScheduleSyncService.syncPlansToSchedule(TEST_USER_ID, '2026-05-11');

      const upsertCalls = mockQuery.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO schedule_items'),
      );

      // Breakfast: 25% of 2000 = 500
      const breakfastMeta = JSON.parse(upsertCalls[0][1]![8] as string);
      expect(breakfastMeta.targetCalories).toBe(500);

      // Lunch: 35% of 2000 = 700
      const lunchMeta = JSON.parse(upsertCalls[1][1]![8] as string);
      expect(lunchMeta.targetCalories).toBe(700);

      // Dinner: 30% of 2000 = 600
      const dinnerMeta = JSON.parse(upsertCalls[2][1]![8] as string);
      expect(dinnerMeta.targetCalories).toBe(600);
    });

    it('should include exercise details in workout description', async () => {
      setupQueryMocks({ existingSchedule: true, hasWorkoutPlan: true, hasDietPlan: false });

      await planScheduleSyncService.syncPlansToSchedule(TEST_USER_ID, '2026-05-11');

      const upsertCall = mockQuery.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('INSERT INTO schedule_items') &&
          (call[1] as any[])[9] === 'workout_plan',
      );

      const description = (upsertCall![1] as any[])[2];
      expect(description).toContain('Bench Press');
      expect(description).toContain('Bicep Curls');
      expect(description).toContain('Tricep Dips');
      expect(description).toContain('...'); // 4th exercise truncated
    });

    it('should propagate errors from DB failures', async () => {
      mockQuery.mockRejectedValue(new Error('DB connection failed'));

      await expect(
        planScheduleSyncService.syncPlansToSchedule(TEST_USER_ID, '2026-05-11'),
      ).rejects.toThrow('DB connection failed');
    });
  });
});
