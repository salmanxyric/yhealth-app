import { jest } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
const mockEnqueueEmbedding = jest.fn<any>();
const mockScheduleService = {
  getScheduleByDate: jest.fn<any>(),
  getScheduleById: jest.fn<any>(),
  createSchedule: jest.fn<any>(),
  updateSchedule: jest.fn<any>(),
  deleteSchedule: jest.fn<any>(),
  addScheduleItem: jest.fn<any>(),
  updateScheduleItem: jest.fn<any>(),
  deleteScheduleItem: jest.fn<any>(),
  createScheduleLink: jest.fn<any>(),
  deleteScheduleLink: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/services/embedding-queue.service.js', () => ({
  embeddingQueueService: {
    enqueueEmbedding: mockEnqueueEmbedding,
  },
}));

jest.unstable_mockModule('../../../src/services/schedule.service.js', () => ({
  scheduleService: mockScheduleService,
}));

const { registerScheduleTools } = await import('../../../src/services/langgraph-tools/domains/schedule.js');

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

function getTool(name: string) {
  const tool = registerScheduleTools('user-1').find((definition) => definition.name === name);
  if (!tool) throw new Error(`Missing tool ${name}`);
  return tool;
}

describe('LangGraph schedule tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnqueueEmbedding.mockResolvedValue(undefined);
  });

  it('createScheduleItem schema accepts modal-equivalent visual fields', () => {
    const tool = getTool('createScheduleItem');

    const parsed = tool.schema.safeParse({
      scheduleId: '2026-05-06',
      title: 'Workout',
      description: 'Upper body',
      startTime: '09:00',
      durationMinutes: 30,
      category: 'exercise',
      color: '#6d4bc3',
      shape: 'diamond',
      icon: '🏋️',
      position: 0,
      metadata: { intensity: 'high' },
    });

    expect(parsed.success).toBe(true);
  });

  it('createDailySchedule schema preserves visual fields on item objects', () => {
    const tool = getTool('createDailySchedule');

    const parsed = tool.schema.safeParse({
      scheduleDate: '2026-05-06',
      items: [{
        title: 'Study',
        startTime: '14:00',
        endTime: '15:00',
        category: 'study',
        color: '#7c3aed',
        shape: 'rounded',
        icon: 'book',
      }],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items?.[0]).toEqual(expect.objectContaining({
        category: 'study',
        color: '#7c3aed',
        shape: 'rounded',
        icon: 'book',
      }));
    }
  });

  it('createDailySchedule parses basic string items like "Workout at 9 AM"', async () => {
    const tool = getTool('createDailySchedule');
    mockQuery.mockResolvedValueOnce(pgResult([{ timezone: 'UTC' }]));
    mockScheduleService.getScheduleByDate
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'schedule-1',
        userId: 'user-1',
        scheduleDate: '2026-05-06',
        items: [{ id: 'item-1', title: 'Workout' }],
        links: [],
      });
    mockScheduleService.createSchedule.mockResolvedValue({
      id: 'schedule-1',
      userId: 'user-1',
      scheduleDate: '2026-05-06',
      items: [],
      links: [],
    });
    mockScheduleService.getScheduleById.mockResolvedValue({
      id: 'schedule-1',
      userId: 'user-1',
      scheduleDate: '2026-05-06',
      items: [{ id: 'item-1', title: 'Workout' }],
      links: [],
    });
    mockScheduleService.addScheduleItem.mockResolvedValue({
      id: 'item-1',
      title: 'Workout',
      position: 0,
    });

    const result = JSON.parse(await tool.handler('user-1', {
      scheduleDate: '2026-05-06',
      items: ['Workout at 9 AM'],
    }));

    expect(result.success).toBe(true);
    expect(mockScheduleService.addScheduleItem).toHaveBeenCalledWith(
      'user-1',
      'schedule-1',
      expect.objectContaining({
        title: 'Workout',
        startTime: '09:00',
        durationMinutes: 30,
        color: undefined,
        shape: 'square',
        metadata: { shape: 'square' },
      }),
    );
  });
});
