import { jest } from '@jest/globals';

// ── Mocks ────────────────────────────────────────────────────────────

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
const mockEnqueueEmbedding = jest.fn<any>();

const mockWorkoutAlarmService = {
  getAlarms: jest.fn<any>(),
  getEnabledAlarms: jest.fn<any>(),
  getAlarm: jest.fn<any>(),
  getTodayAlarms: jest.fn<any>(),
  getScheduleSummary: jest.fn<any>(),
  createAlarm: jest.fn<any>(),
  updateAlarm: jest.fn<any>(),
  deleteAlarm: jest.fn<any>(),
  toggleAlarm: jest.fn<any>(),
  snoozeAlarm: jest.fn<any>(),
  formatDaysOfWeek: jest.fn<any>(),
};

const mockWorkoutPlanService = {
  getWorkoutPlans: jest.fn<any>(),
  createWorkoutPlan: jest.fn<any>(),
  updateWorkoutPlan: jest.fn<any>(),
  deleteWorkoutPlan: jest.fn<any>(),
};

const mockTaskService = {
  getTasks: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/services/embedding-queue.service.js', () => ({
  embeddingQueueService: { enqueueEmbedding: mockEnqueueEmbedding },
}));

jest.unstable_mockModule('../../../src/config/queue.config.js', () => ({
  JobPriorities: { HIGH: 1, MEDIUM: 5, LOW: 10 },
}));

jest.unstable_mockModule('../../../src/services/workout-alarm.service.js', () => ({
  workoutAlarmService: mockWorkoutAlarmService,
}));

jest.unstable_mockModule('../../../src/services/workout-plan.service.js', () => ({
  workoutPlanService: mockWorkoutPlanService,
}));

jest.unstable_mockModule('../../../src/services/task.service.js', () => ({
  taskService: mockTaskService,
}));

const { registerWorkoutTools } = await import(
  '../../../src/services/langgraph-tools/domains/workout.js'
);

// ── Helpers ──────────────────────────────────────────────────────────

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

function getTool(name: string) {
  const tool = registerWorkoutTools('user-1').find((d) => d.name === name);
  if (!tool) throw new Error(`Missing tool: ${name}`);
  return tool;
}

function makeAlarm(overrides: Record<string, any> = {}) {
  return {
    id: 'alarm-1',
    userId: 'user-1',
    workoutPlanId: null,
    title: 'Morning Workout',
    message: 'Time to exercise!',
    alarmTime: '07:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    isEnabled: true,
    lastTriggeredAt: null,
    nextTriggerAt: '2026-05-08T02:00:00.000Z',
    notificationType: 'push' as const,
    soundEnabled: true,
    soundFile: 'alarm.wav',
    vibrationEnabled: true,
    snoozeMinutes: 10,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('LangGraph alarm tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueEmbedding.mockResolvedValue(undefined);
    mockWorkoutAlarmService.formatDaysOfWeek.mockImplementation((days: number[]) => {
      if (days.length === 7) return 'Every day';
      if (JSON.stringify([...days].sort()) === JSON.stringify([1, 2, 3, 4, 5])) return 'Weekdays';
      if (JSON.stringify([...days].sort()) === JSON.stringify([0, 6])) return 'Weekends';
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map((d) => names[d]).join(', ');
    });
  });

  // ── Tool existence ───────────────────────────────────────────────

  describe('tool registration', () => {
    const expectedTools = [
      'getAllAlarms',
      'getAlarmById',
      'getAlarmsByDay',
      'getTodayAlarms',
      'getAlarmSummary',
      'toggleAlarm',
      'snoozeAlarm',
      'createWorkoutAlarm',
      'updateWorkoutAlarm',
      'deleteWorkoutAlarm',
    ];

    it.each(expectedTools)('registers %s tool', (name) => {
      expect(() => getTool(name)).not.toThrow();
    });
  });

  // ── Schema validation ────────────────────────────────────────────

  describe('schema validation', () => {
    it('getAllAlarms accepts empty object', () => {
      const parsed = getTool('getAllAlarms').schema.safeParse({});
      expect(parsed.success).toBe(true);
    });

    it('getAllAlarms accepts enabledOnly filter', () => {
      const parsed = getTool('getAllAlarms').schema.safeParse({ enabledOnly: true });
      expect(parsed.success).toBe(true);
    });

    it('getAlarmById requires alarmId', () => {
      const fail = getTool('getAlarmById').schema.safeParse({});
      expect(fail.success).toBe(false);

      const pass = getTool('getAlarmById').schema.safeParse({ alarmId: 'alarm-1' });
      expect(pass.success).toBe(true);
    });

    it('getAlarmsByDay requires dayOfWeek as number', () => {
      const fail = getTool('getAlarmsByDay').schema.safeParse({});
      expect(fail.success).toBe(false);

      const failStr = getTool('getAlarmsByDay').schema.safeParse({ dayOfWeek: 'Monday' });
      expect(failStr.success).toBe(false);

      const pass = getTool('getAlarmsByDay').schema.safeParse({ dayOfWeek: 1 });
      expect(pass.success).toBe(true);
    });

    it('getTodayAlarms accepts empty object', () => {
      const parsed = getTool('getTodayAlarms').schema.safeParse({});
      expect(parsed.success).toBe(true);
    });

    it('getAlarmSummary accepts empty object', () => {
      const parsed = getTool('getAlarmSummary').schema.safeParse({});
      expect(parsed.success).toBe(true);
    });

    it('toggleAlarm requires alarmId', () => {
      const fail = getTool('toggleAlarm').schema.safeParse({});
      expect(fail.success).toBe(false);

      const pass = getTool('toggleAlarm').schema.safeParse({ alarmId: 'alarm-1' });
      expect(pass.success).toBe(true);
    });

    it('snoozeAlarm requires alarmId, optional minutes', () => {
      const fail = getTool('snoozeAlarm').schema.safeParse({});
      expect(fail.success).toBe(false);

      const pass = getTool('snoozeAlarm').schema.safeParse({ alarmId: 'alarm-1' });
      expect(pass.success).toBe(true);

      const passMin = getTool('snoozeAlarm').schema.safeParse({ alarmId: 'alarm-1', minutes: 15 });
      expect(passMin.success).toBe(true);
    });

    it('createWorkoutAlarm requires alarmTime', () => {
      const fail = getTool('createWorkoutAlarm').schema.safeParse({});
      expect(fail.success).toBe(false);

      const pass = getTool('createWorkoutAlarm').schema.safeParse({ alarmTime: '07:00' });
      expect(pass.success).toBe(true);
    });

    it('createWorkoutAlarm accepts all optional fields', () => {
      const parsed = getTool('createWorkoutAlarm').schema.safeParse({
        workoutPlanId: 'plan-1',
        title: 'Gym Time',
        message: 'Let\'s go!',
        alarmTime: '06:30',
        daysOfWeek: [1, 3, 5],
        notificationType: 'all',
        soundEnabled: true,
        vibrationEnabled: false,
        snoozeMinutes: 5,
      });
      expect(parsed.success).toBe(true);
    });

    it('updateWorkoutAlarm requires alarmId', () => {
      const fail = getTool('updateWorkoutAlarm').schema.safeParse({});
      expect(fail.success).toBe(false);

      const pass = getTool('updateWorkoutAlarm').schema.safeParse({
        alarmId: 'alarm-1',
        title: 'Updated Title',
      });
      expect(pass.success).toBe(true);
    });

    it('deleteWorkoutAlarm requires alarmId', () => {
      const fail = getTool('deleteWorkoutAlarm').schema.safeParse({});
      expect(fail.success).toBe(false);

      const pass = getTool('deleteWorkoutAlarm').schema.safeParse({ alarmId: 'alarm-1' });
      expect(pass.success).toBe(true);
    });
  });

  // ── getAllAlarms ──────────────────────────────────────────────────

  describe('getAllAlarms', () => {
    it('returns all alarms', async () => {
      const alarms = [makeAlarm(), makeAlarm({ id: 'alarm-2', title: 'Evening Run', alarmTime: '18:00' })];
      mockWorkoutAlarmService.getAlarms.mockResolvedValue(alarms);

      const result = JSON.parse(await getTool('getAllAlarms').handler('user-1', {}));

      expect(result.count).toBe(2);
      expect(result.alarms).toHaveLength(2);
      expect(result.alarms[0].title).toBe('Morning Workout');
      expect(result.alarms[1].title).toBe('Evening Run');
      expect(mockWorkoutAlarmService.getAlarms).toHaveBeenCalledWith('user-1');
    });

    it('returns only enabled alarms when enabledOnly is true', async () => {
      const alarms = [makeAlarm()];
      mockWorkoutAlarmService.getEnabledAlarms.mockResolvedValue(alarms);

      const result = JSON.parse(await getTool('getAllAlarms').handler('user-1', { enabledOnly: true }));

      expect(result.count).toBe(1);
      expect(mockWorkoutAlarmService.getEnabledAlarms).toHaveBeenCalledWith('user-1');
      expect(mockWorkoutAlarmService.getAlarms).not.toHaveBeenCalled();
    });

    it('returns empty list when no alarms exist', async () => {
      mockWorkoutAlarmService.getAlarms.mockResolvedValue([]);

      const result = JSON.parse(await getTool('getAllAlarms').handler('user-1', {}));

      expect(result.count).toBe(0);
      expect(result.alarms).toEqual([]);
      expect(result.message).toContain('No alarms found');
    });

    it('includes formatted days in response', async () => {
      mockWorkoutAlarmService.getAlarms.mockResolvedValue([makeAlarm()]);

      const result = JSON.parse(await getTool('getAllAlarms').handler('user-1', {}));

      expect(result.alarms[0].daysFormatted).toBe('Weekdays');
    });
  });

  // ── getAlarmById ─────────────────────────────────────────────────

  describe('getAlarmById', () => {
    it('returns alarm details', async () => {
      mockWorkoutAlarmService.getAlarm.mockResolvedValue(makeAlarm());

      const result = JSON.parse(await getTool('getAlarmById').handler('user-1', { alarmId: 'alarm-1' }));

      expect(result.success).toBe(true);
      expect(result.alarm.id).toBe('alarm-1');
      expect(result.alarm.title).toBe('Morning Workout');
      expect(result.alarm.alarmTime).toBe('07:00');
      expect(result.alarm.daysFormatted).toBe('Weekdays');
      expect(result.alarm.createdAt).toBeDefined();
      expect(mockWorkoutAlarmService.getAlarm).toHaveBeenCalledWith('user-1', 'alarm-1');
    });

    it('returns error when alarm not found', async () => {
      mockWorkoutAlarmService.getAlarm.mockResolvedValue(null);

      const result = JSON.parse(await getTool('getAlarmById').handler('user-1', { alarmId: 'nonexistent' }));

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ── getAlarmsByDay ───────────────────────────────────────────────

  describe('getAlarmsByDay', () => {
    it('returns alarms for a specific day', async () => {
      const alarms = [
        makeAlarm({ daysOfWeek: [1, 3, 5] }),
        makeAlarm({ id: 'alarm-2', title: 'Stretching', daysOfWeek: [1, 2, 3, 4, 5] }),
      ];
      mockWorkoutAlarmService.getAlarms.mockResolvedValue(alarms);

      const result = JSON.parse(await getTool('getAlarmsByDay').handler('user-1', { dayOfWeek: 1 }));

      expect(result.day).toBe('Monday');
      expect(result.count).toBe(2);
      expect(result.alarms).toHaveLength(2);
    });

    it('filters out alarms not on the requested day', async () => {
      const alarms = [
        makeAlarm({ daysOfWeek: [1, 3, 5] }),
        makeAlarm({ id: 'alarm-2', title: 'Weekend Run', daysOfWeek: [0, 6] }),
      ];
      mockWorkoutAlarmService.getAlarms.mockResolvedValue(alarms);

      const result = JSON.parse(await getTool('getAlarmsByDay').handler('user-1', { dayOfWeek: 1 }));

      expect(result.count).toBe(1);
      expect(result.alarms[0].title).toBe('Morning Workout');
    });

    it('returns empty list when no alarms on that day', async () => {
      mockWorkoutAlarmService.getAlarms.mockResolvedValue([
        makeAlarm({ daysOfWeek: [1, 2, 3, 4, 5] }),
      ]);

      const result = JSON.parse(await getTool('getAlarmsByDay').handler('user-1', { dayOfWeek: 0 }));

      expect(result.count).toBe(0);
      expect(result.message).toContain('No alarms scheduled');
      expect(result.message).toContain('Sunday');
    });

    it('handles Sunday (0) correctly', async () => {
      mockWorkoutAlarmService.getAlarms.mockResolvedValue([
        makeAlarm({ daysOfWeek: [0, 6] }),
      ]);

      const result = JSON.parse(await getTool('getAlarmsByDay').handler('user-1', { dayOfWeek: 0 }));

      expect(result.day).toBe('Sunday');
      expect(result.count).toBe(1);
    });

    it('handles Saturday (6) correctly', async () => {
      mockWorkoutAlarmService.getAlarms.mockResolvedValue([
        makeAlarm({ daysOfWeek: [0, 6] }),
      ]);

      const result = JSON.parse(await getTool('getAlarmsByDay').handler('user-1', { dayOfWeek: 6 }));

      expect(result.day).toBe('Saturday');
      expect(result.count).toBe(1);
    });
  });

  // ── getTodayAlarms ───────────────────────────────────────────────

  describe('getTodayAlarms', () => {
    it('returns today\'s active alarms', async () => {
      const alarms = [makeAlarm(), makeAlarm({ id: 'alarm-2', title: 'Noon Walk', alarmTime: '12:00' })];
      mockWorkoutAlarmService.getTodayAlarms.mockResolvedValue(alarms);

      const result = JSON.parse(await getTool('getTodayAlarms').handler('user-1', {}));

      expect(result.count).toBe(2);
      expect(result.day).toBeDefined();
      expect(result.alarms[0].title).toBe('Morning Workout');
      expect(mockWorkoutAlarmService.getTodayAlarms).toHaveBeenCalledWith('user-1');
    });

    it('returns empty list with message when no alarms today', async () => {
      mockWorkoutAlarmService.getTodayAlarms.mockResolvedValue([]);

      const result = JSON.parse(await getTool('getTodayAlarms').handler('user-1', {}));

      expect(result.count).toBe(0);
      expect(result.alarms).toEqual([]);
      expect(result.message).toContain('No active alarms');
    });
  });

  // ── getAlarmSummary ──────────────────────────────────────────────

  describe('getAlarmSummary', () => {
    it('returns complete summary with next alarm', async () => {
      const nextAlarm = makeAlarm();
      mockWorkoutAlarmService.getScheduleSummary.mockResolvedValue({
        totalAlarms: 5,
        enabledAlarms: 3,
        nextAlarm,
        todayAlarms: [makeAlarm(), makeAlarm({ id: 'alarm-2', alarmTime: '12:00' })],
      });

      const result = JSON.parse(await getTool('getAlarmSummary').handler('user-1', {}));

      expect(result.success).toBe(true);
      expect(result.summary.totalAlarms).toBe(5);
      expect(result.summary.enabledAlarms).toBe(3);
      expect(result.summary.disabledAlarms).toBe(2);
      expect(result.summary.todayAlarmsCount).toBe(2);
      expect(result.summary.nextAlarm).toBeDefined();
      expect(result.summary.nextAlarm.id).toBe('alarm-1');
      expect(result.summary.nextAlarm.daysFormatted).toBe('Weekdays');
    });

    it('returns null nextAlarm when none upcoming', async () => {
      mockWorkoutAlarmService.getScheduleSummary.mockResolvedValue({
        totalAlarms: 2,
        enabledAlarms: 0,
        nextAlarm: null,
        todayAlarms: [],
      });

      const result = JSON.parse(await getTool('getAlarmSummary').handler('user-1', {}));

      expect(result.summary.nextAlarm).toBeNull();
      expect(result.summary.todayAlarmsCount).toBe(0);
      expect(result.summary.disabledAlarms).toBe(2);
    });

    it('returns zero counts when no alarms exist', async () => {
      mockWorkoutAlarmService.getScheduleSummary.mockResolvedValue({
        totalAlarms: 0,
        enabledAlarms: 0,
        nextAlarm: null,
        todayAlarms: [],
      });

      const result = JSON.parse(await getTool('getAlarmSummary').handler('user-1', {}));

      expect(result.summary.totalAlarms).toBe(0);
      expect(result.summary.enabledAlarms).toBe(0);
      expect(result.summary.disabledAlarms).toBe(0);
    });
  });

  // ── toggleAlarm ──────────────────────────────────────────────────

  describe('toggleAlarm', () => {
    it('toggles alarm on and returns new state', async () => {
      mockWorkoutAlarmService.toggleAlarm.mockResolvedValue(makeAlarm({ isEnabled: true }));

      const result = JSON.parse(await getTool('toggleAlarm').handler('user-1', { alarmId: 'alarm-1' }));

      expect(result.success).toBe(true);
      expect(result.data.isEnabled).toBe(true);
      expect(result.message).toContain('enabled');
      expect(mockWorkoutAlarmService.toggleAlarm).toHaveBeenCalledWith('user-1', 'alarm-1');
    });

    it('toggles alarm off and returns new state', async () => {
      mockWorkoutAlarmService.toggleAlarm.mockResolvedValue(makeAlarm({ isEnabled: false }));

      const result = JSON.parse(await getTool('toggleAlarm').handler('user-1', { alarmId: 'alarm-1' }));

      expect(result.success).toBe(true);
      expect(result.data.isEnabled).toBe(false);
      expect(result.message).toContain('disabled');
    });

    it('returns error when alarm not found', async () => {
      mockWorkoutAlarmService.toggleAlarm.mockResolvedValue(null);

      const result = JSON.parse(await getTool('toggleAlarm').handler('user-1', { alarmId: 'nonexistent' }));

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ── snoozeAlarm ──────────────────────────────────────────────────

  describe('snoozeAlarm', () => {
    it('snoozes alarm with custom minutes', async () => {
      const alarm = makeAlarm({ nextTriggerAt: '2026-05-08T02:15:00.000Z' });
      mockWorkoutAlarmService.getAlarm.mockResolvedValue(makeAlarm());
      mockWorkoutAlarmService.snoozeAlarm.mockResolvedValue(alarm);

      const result = JSON.parse(await getTool('snoozeAlarm').handler('user-1', { alarmId: 'alarm-1', minutes: 15 }));

      expect(result.success).toBe(true);
      expect(result.message).toContain('15 minutes');
      expect(mockWorkoutAlarmService.snoozeAlarm).toHaveBeenCalledWith('user-1', 'alarm-1', 15);
    });

    it('uses alarm default snooze when minutes not specified', async () => {
      mockWorkoutAlarmService.getAlarm.mockResolvedValue(makeAlarm({ snoozeMinutes: 10 }));
      mockWorkoutAlarmService.snoozeAlarm.mockResolvedValue(makeAlarm());

      const result = JSON.parse(await getTool('snoozeAlarm').handler('user-1', { alarmId: 'alarm-1' }));

      expect(result.success).toBe(true);
      expect(result.message).toContain('10 minutes');
      expect(mockWorkoutAlarmService.snoozeAlarm).toHaveBeenCalledWith('user-1', 'alarm-1', 10);
    });

    it('returns error when alarm not found (getAlarm check)', async () => {
      mockWorkoutAlarmService.getAlarm.mockResolvedValue(null);

      const result = JSON.parse(await getTool('snoozeAlarm').handler('user-1', { alarmId: 'nonexistent' }));

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(mockWorkoutAlarmService.snoozeAlarm).not.toHaveBeenCalled();
    });

    it('returns error when snooze service fails', async () => {
      mockWorkoutAlarmService.getAlarm.mockResolvedValue(makeAlarm());
      mockWorkoutAlarmService.snoozeAlarm.mockResolvedValue(null);

      const result = JSON.parse(await getTool('snoozeAlarm').handler('user-1', { alarmId: 'alarm-1', minutes: 5 }));

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to snooze');
    });
  });

  // ── createWorkoutAlarm ───────────────────────────────────────────

  describe('createWorkoutAlarm', () => {
    it('creates alarm with required fields', async () => {
      mockWorkoutAlarmService.createAlarm.mockResolvedValue(
        makeAlarm({ id: 'new-alarm', title: 'Workout Reminder', alarmTime: '08:00' }),
      );

      const result = JSON.parse(
        await getTool('createWorkoutAlarm').handler('user-1', { alarmTime: '08:00' }),
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('new-alarm');
      expect(result.data.alarmTime).toBe('08:00');
      expect(mockWorkoutAlarmService.createAlarm).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ alarmTime: '08:00' }),
      );
    });

    it('creates alarm with all optional fields', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'plan-1' }]));
      mockWorkoutAlarmService.createAlarm.mockResolvedValue(
        makeAlarm({ id: 'new-alarm', title: 'Gym Time' }),
      );

      const result = JSON.parse(
        await getTool('createWorkoutAlarm').handler('user-1', {
          workoutPlanId: 'plan-1',
          title: 'Gym Time',
          message: 'Go!',
          alarmTime: '06:30',
          daysOfWeek: [1, 3, 5],
          notificationType: 'all',
          soundEnabled: true,
          vibrationEnabled: false,
          snoozeMinutes: 5,
        }),
      );

      expect(result.success).toBe(true);
    });

    it('returns error when alarmTime is missing', async () => {
      const result = JSON.parse(
        await getTool('createWorkoutAlarm').handler('user-1', {}),
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('warns when workout plan not found but still creates alarm', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));
      mockWorkoutAlarmService.createAlarm.mockResolvedValue(makeAlarm());

      const result = JSON.parse(
        await getTool('createWorkoutAlarm').handler('user-1', {
          workoutPlanId: 'nonexistent-plan',
          alarmTime: '07:00',
        }),
      );

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings[0]).toContain('not found');
    });
  });

  // ── updateWorkoutAlarm ───────────────────────────────────────────

  describe('updateWorkoutAlarm', () => {
    it('updates alarm fields', async () => {
      mockWorkoutAlarmService.updateAlarm.mockResolvedValue(
        makeAlarm({ title: 'Updated Title' }),
      );

      const result = JSON.parse(
        await getTool('updateWorkoutAlarm').handler('user-1', {
          alarmId: 'alarm-1',
          title: 'Updated Title',
          alarmTime: '09:00',
        }),
      );

      expect(result.success).toBe(true);
      expect(mockWorkoutAlarmService.updateAlarm).toHaveBeenCalledWith(
        'user-1',
        'alarm-1',
        expect.objectContaining({ title: 'Updated Title', alarmTime: '09:00' }),
      );
    });

    it('can update isEnabled via update tool', async () => {
      mockWorkoutAlarmService.updateAlarm.mockResolvedValue(
        makeAlarm({ isEnabled: false }),
      );

      const result = JSON.parse(
        await getTool('updateWorkoutAlarm').handler('user-1', {
          alarmId: 'alarm-1',
          isEnabled: false,
        }),
      );

      expect(result.success).toBe(true);
    });

    it('returns error when alarm not found', async () => {
      mockWorkoutAlarmService.updateAlarm.mockResolvedValue(null);

      const result = JSON.parse(
        await getTool('updateWorkoutAlarm').handler('user-1', {
          alarmId: 'nonexistent',
          title: 'Test',
        }),
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ── deleteWorkoutAlarm ───────────────────────────────────────────

  describe('deleteWorkoutAlarm', () => {
    it('deletes alarm successfully', async () => {
      mockWorkoutAlarmService.deleteAlarm.mockResolvedValue(true);

      const result = JSON.parse(
        await getTool('deleteWorkoutAlarm').handler('user-1', { alarmId: 'alarm-1' }),
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted');
      expect(mockWorkoutAlarmService.deleteAlarm).toHaveBeenCalledWith('user-1', 'alarm-1');
    });

    it('returns error when alarm not found', async () => {
      mockWorkoutAlarmService.deleteAlarm.mockResolvedValue(false);

      const result = JSON.parse(
        await getTool('deleteWorkoutAlarm').handler('user-1', { alarmId: 'nonexistent' }),
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  // ── mutationType metadata ────────────────────────────────────────

  describe('mutationType metadata', () => {
    it.each([
      ['getAllAlarms', 'read'],
      ['getAlarmById', 'read'],
      ['getAlarmsByDay', 'read'],
      ['getTodayAlarms', 'read'],
      ['getAlarmSummary', 'read'],
      ['toggleAlarm', 'update'],
      ['snoozeAlarm', 'update'],
    ] as const)('%s has mutationType "%s"', (toolName, expectedType) => {
      const tools = registerWorkoutTools('user-1');
      const tool = tools.find((t) => t.name === toolName);
      expect(tool?.mutationType).toBe(expectedType);
    });
  });

  // ── error handling (withErrorHandling wrapper) ───────────────────

  describe('error handling', () => {
    it('getAllAlarms returns error response on service exception', async () => {
      mockWorkoutAlarmService.getAlarms.mockRejectedValue(new Error('DB down'));

      const result = JSON.parse(await getTool('getAllAlarms').handler('user-1', {}));

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to execute');
    });

    it('toggleAlarm returns error response on service exception', async () => {
      mockWorkoutAlarmService.toggleAlarm.mockRejectedValue(new Error('Connection lost'));

      const result = JSON.parse(await getTool('toggleAlarm').handler('user-1', { alarmId: 'alarm-1' }));

      expect(result.success).toBe(false);
    });

    it('snoozeAlarm returns error response on service exception', async () => {
      mockWorkoutAlarmService.getAlarm.mockRejectedValue(new Error('Timeout'));

      const result = JSON.parse(await getTool('snoozeAlarm').handler('user-1', { alarmId: 'alarm-1' }));

      expect(result.success).toBe(false);
    });

    it('getAlarmSummary returns error response on service exception', async () => {
      mockWorkoutAlarmService.getScheduleSummary.mockRejectedValue(new Error('Query failed'));

      const result = JSON.parse(await getTool('getAlarmSummary').handler('user-1', {}));

      expect(result.success).toBe(false);
    });
  });
});
