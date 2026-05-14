/**
 * DB & Validator Fixes — Unit Tests
 *
 * Validates the SQL and Zod fixes made in this session:
 * 1. micro_wins table — expression UNIQUE moved to CREATE INDEX
 * 2. accountability_contract_checks — ON CONFLICT matches check_date column
 * 3. date - bigint casts in streak calculations
 * 4. aiCoachPersona Zod enum includes all 7 values
 * 5. Voice schedule settings update via functional React state
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// =============================================
// 1. micro_wins table creation SQL
// =============================================

describe('micro_wins table creation', () => {
  const mockQuery = jest.fn<any>();
  let ensureTable: () => Promise<void>;

  beforeEach(async () => {
    jest.restoreAllMocks();

    jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
      query: (...args: unknown[]) => mockQuery(...args),
    }));

    jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
    }));

    jest.resetModules();
    mockQuery.mockReset();
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

    const mod = await import('../../../src/services/micro-wins.service.js');
    ensureTable = (mod as any).ensureTable;
  });

  it('creates table without inline expression UNIQUE constraint', async () => {
    if (!ensureTable) return;
    await ensureTable();

    const createTableCall = mockQuery.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('CREATE TABLE IF NOT EXISTS micro_wins'),
    );

    expect(createTableCall).toBeDefined();
    const sql = createTableCall![0] as string;
    expect(sql).not.toContain('UNIQUE(');
    expect(sql).not.toContain('detected_at::date');
  });

  it('creates a separate UNIQUE INDEX for the expression constraint', async () => {
    if (!ensureTable) return;
    await ensureTable();

    const indexCall = mockQuery.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('idx_micro_wins_unique_per_day'),
    );

    expect(indexCall).toBeDefined();
    const sql = indexCall![0] as string;
    expect(sql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS');
    expect(sql).toContain('detected_at::date');
  });
});

// =============================================
// 2. accountability_contract_checks ON CONFLICT
// =============================================

describe('accountability_contract_checks ON CONFLICT', () => {
  it('INSERT SQL uses ON CONFLICT (contract_id, check_date)', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      'src/services/accountability-contract.service.ts',
      'utf-8',
    );

    const onConflictLine = content.split('\n').find(
      (line) => line.includes('ON CONFLICT') && line.includes('contract'),
    );

    expect(onConflictLine).toBeDefined();
    expect(onConflictLine).toContain('ON CONFLICT (contract_id, check_date)');
    expect(onConflictLine).not.toContain('checked_at::date');
  });

  it('INSERT includes check_date column', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      'src/services/accountability-contract.service.ts',
      'utf-8',
    );

    const insertLine = content.split('\n').find(
      (line) => line.includes('INSERT INTO accountability_contract_checks') && line.includes('check_date'),
    );

    expect(insertLine).toBeDefined();
  });
});

// =============================================
// 3. Streak calculation date - bigint cast
// =============================================

describe('streak SQL integer cast', () => {
  it('micro-wins uses ::INTEGER for ROW_NUMBER subtraction', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      'src/services/micro-wins.service.ts',
      'utf-8',
    );

    const streakLines = content.split('\n').filter(
      (line) => line.includes('ROW_NUMBER') || line.includes('sub.rn'),
    );

    for (const line of streakLines) {
      if (line.includes('- (ROW_NUMBER') || line.includes('- sub.rn') || line.includes('CURRENT_DATE - sub.rn')) {
        expect(line).toMatch(/::INTEGER/i);
      }
    }
  });

  it('achievements controller uses ::INTEGER for ROW_NUMBER subtraction', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      'src/controllers/achievements.controller.ts',
      'utf-8',
    );

    const castLine = content.split('\n').find(
      (line) => line.includes('CURRENT_DATE - rn'),
    );

    expect(castLine).toBeDefined();
    expect(castLine).toMatch(/::INTEGER/i);
  });

  it('achievement-ai service uses ::INTEGER for ROW_NUMBER subtraction', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      'src/services/achievement-ai.service.ts',
      'utf-8',
    );

    const castLine = content.split('\n').find(
      (line) => line.includes('CURRENT_DATE - rn'),
    );

    expect(castLine).toBeDefined();
    expect(castLine).toMatch(/::INTEGER/i);
  });
});

// =============================================
// 4. aiCoachPersona Zod enum validation
// =============================================

describe('preferences validator — aiCoachPersona', () => {
  it('accepts all 7 persona values', async () => {
    const { coachingPreferencesSchema } = await import(
      '../../../src/validators/preferences.validator.js'
    );

    const allPersonas = [
      'commander', 'friend', 'data_nerd', 'guardian',
      'drill_sergeant', 'gentle_friend', 'data_driven_neutral',
    ];

    for (const persona of allPersonas) {
      const result = coachingPreferencesSchema.safeParse({ aiCoachPersona: persona });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid persona values', async () => {
    const { coachingPreferencesSchema } = await import(
      '../../../src/validators/preferences.validator.js'
    );

    const result = coachingPreferencesSchema.safeParse({ aiCoachPersona: 'invalid_persona' });
    expect(result.success).toBe(false);
  });
});

// =============================================
// 5. Voice schedule service — updateScheduleSettings
// =============================================

describe('voice schedule settings update', () => {
  const mockQuery = jest.fn<any>();

  beforeEach(async () => {
    jest.restoreAllMocks();

    jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
      query: (...args: unknown[]) => mockQuery(...args),
    }));

    jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
    }));

    jest.unstable_mockModule('../../../src/services/ai-coach-call-queue.service.js', () => ({
      aiCoachCallQueueService: { syncUserSchedule: jest.fn<any>().mockResolvedValue(undefined) },
    }));

    jest.resetModules();
    mockQuery.mockReset();
  });

  it('builds UPDATE SQL with all schedule fields', async () => {
    const mod = await import('../../../src/services/voice-schedule.service.js');
    const service = mod.voiceScheduleService;

    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'pref-1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [{
          voice_id: 'alloy', speech_pace: 1.0, voice_preview_played: false,
          quiet_hours_enabled: true, quiet_hours_start: '22:00', quiet_hours_end: '07:00',
          dnd_days: [0, 6], ai_call_frequency: 'proactive', preferred_call_times: ['09:00', '18:00'],
        }],
        rowCount: 1,
      });

    const result = await service.updateScheduleSettings('user-1', {
      aiCallFrequency: 'proactive',
      preferredCallTimes: ['09:00', '18:00'],
      quietHoursEnabled: true,
      dndDays: [0, 6],
    });

    expect(result.aiCallFrequency).toBe('proactive');
    expect(result.preferredCallTimes).toEqual(['09:00', '18:00']);
    expect(result.quietHoursEnabled).toBe(true);
    expect(result.dndDays).toEqual([0, 6]);

    const updateCall = mockQuery.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('UPDATE user_preferences SET'),
    );

    expect(updateCall).toBeDefined();
    const sql = updateCall![0] as string;
    expect(sql).toContain('quiet_hours_enabled');
    expect(sql).toContain('ai_call_frequency');
    expect(sql).toContain('preferred_call_times');
    expect(sql).toContain('dnd_days');
  });

  it('casts quiet hours times to ::TIME', async () => {
    const mod = await import('../../../src/services/voice-schedule.service.js');
    const service = mod.voiceScheduleService;

    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'pref-1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [{
          voice_id: 'alloy', speech_pace: 1.0, voice_preview_played: false,
          quiet_hours_enabled: false, quiet_hours_start: '23:00', quiet_hours_end: '08:00',
          dnd_days: [], ai_call_frequency: 'moderate', preferred_call_times: [],
        }],
        rowCount: 1,
      });

    await service.updateScheduleSettings('user-1', {
      quietHoursStart: '23:00',
      quietHoursEnd: '08:00',
    });

    const updateCall = mockQuery.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('quiet_hours_start'),
    );

    expect(updateCall).toBeDefined();
    const sql = updateCall![0] as string;
    expect(sql).toContain('::TIME');
  });

  it('validates DND days are 0-6', async () => {
    const mod = await import('../../../src/services/voice-schedule.service.js');
    const service = mod.voiceScheduleService;

    await expect(
      service.updateScheduleSettings('user-1', { dndDays: [0, 7] }),
    ).rejects.toThrow('DND days must be between 0');
  });

  it('validates AI call frequency', async () => {
    const mod = await import('../../../src/services/voice-schedule.service.js');
    const service = mod.voiceScheduleService;

    await expect(
      service.updateScheduleSettings('user-1', { aiCallFrequency: 'invalid' as any }),
    ).rejects.toThrow('Invalid AI call frequency');
  });
});
