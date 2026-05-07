/**
 * Schedule Controller Unit Tests
 *
 * Tests all scheduleController handlers:
 *   getCalendarSchedules, getScheduleByDate, createSchedule, updateSchedule,
 *   deleteSchedule, getScheduleById, addScheduleItem, updateScheduleItem,
 *   deleteScheduleItem, createScheduleLink, deleteScheduleLink, getTemplates,
 *   createTemplate, saveScheduleAsTemplate, applyTemplate
 */

import { jest } from '@jest/globals';

// 1. Infrastructure mocks
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

setupDbMock();
setupLoggerMock();
setupCacheMock();

// 2. Mock schedule service
const mockScheduleService = {
  getSchedulesForCalendar: jest.fn<any>(),
  getScheduleByDate: jest.fn<any>(),
  createSchedule: jest.fn<any>(),
  updateSchedule: jest.fn<any>(),
  deleteSchedule: jest.fn<any>(),
  getScheduleById: jest.fn<any>(),
  addScheduleItem: jest.fn<any>(),
  updateScheduleItem: jest.fn<any>(),
  deleteScheduleItem: jest.fn<any>(),
  createScheduleLink: jest.fn<any>(),
  deleteScheduleLink: jest.fn<any>(),
  getTemplates: jest.fn<any>(),
  createTemplate: jest.fn<any>(),
  saveScheduleAsTemplate: jest.fn<any>(),
  applyTemplateToSchedule: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/schedule.service.js', () => ({
  scheduleService: mockScheduleService,
}));

// 3. Dynamic imports (AFTER mocks)
const { scheduleController } = await import(
  '../../../src/controllers/schedule.controller.js'
);

const { createAuthReq, createRes, createNext, getJsonBody, getStatus, callHandler } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── helpers ────────────────────────────────────────────────

const FAKE_SCHEDULE = {
  id: 'sched-1',
  userId: 'test-user-id',
  scheduleDate: '2025-06-01',
  name: 'My Day',
  notes: null,
  items: [],
  links: [],
};

const FAKE_ITEM = {
  id: 'item-1',
  scheduleId: 'sched-1',
  title: 'Morning Run',
  startTime: '07:00',
  position: 0,
};

const FAKE_LINK = {
  id: 'link-1',
  scheduleId: 'sched-1',
  sourceItemId: 'item-1',
  targetItemId: 'item-2',
  linkType: 'sequence',
};

const FAKE_TEMPLATE = {
  id: 'tpl-1',
  userId: 'test-user-id',
  name: 'Workout Day',
  description: 'A typical workout day',
};

// ─── getCalendarSchedules ───────────────────────────────────

describe('getCalendarSchedules', () => {
  it('should return schedules for date range', async () => {
    mockScheduleService.getSchedulesForCalendar.mockResolvedValue([FAKE_SCHEDULE]);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { startDate: '2025-06-01', endDate: '2025-06-30' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getCalendarSchedules, req, res, next);

    expect(mockScheduleService.getSchedulesForCalendar).toHaveBeenCalledWith(
      'test-user-id',
      '2025-06-01',
      '2025-06-30'
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.schedules).toEqual([FAKE_SCHEDULE]);
  });

  it('should throw 400 when startDate is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { endDate: '2025-06-30' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getCalendarSchedules, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 400 when endDate is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { startDate: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getCalendarSchedules, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getCalendarSchedules, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── getScheduleByDate ──────────────────────────────────────

describe('getScheduleByDate', () => {
  it('should return schedule when found', async () => {
    mockScheduleService.getScheduleByDate.mockResolvedValue(FAKE_SCHEDULE);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getScheduleByDate, req, res, next);

    expect(mockScheduleService.getScheduleByDate).toHaveBeenCalledWith(
      'test-user-id',
      '2025-06-01'
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.schedule).toEqual(FAKE_SCHEDULE);
    expect(body.message).toBe('Schedule retrieved successfully');
  });

  it('should return null schedule when not found', async () => {
    mockScheduleService.getScheduleByDate.mockResolvedValue(null);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getScheduleByDate, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.schedule).toBeNull();
    expect(body.message).toBe('No schedule found for this date');
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getScheduleByDate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── createSchedule ─────────────────────────────────────────

describe('createSchedule', () => {
  it('should create a new schedule with 201 status', async () => {
    mockScheduleService.getScheduleByDate.mockResolvedValue(null);
    mockScheduleService.createSchedule.mockResolvedValue(FAKE_SCHEDULE);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { body: { schedule_date: '2025-06-01', name: 'My Day' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createSchedule, req, res, next);

    expect(mockScheduleService.createSchedule).toHaveBeenCalledWith(
      'test-user-id',
      { scheduleDate: '2025-06-01', templateId: undefined, name: 'My Day', notes: undefined }
    );
    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.schedule).toEqual(FAKE_SCHEDULE);
  });

  it('should return existing schedule with 200 status', async () => {
    mockScheduleService.getScheduleByDate.mockResolvedValue(FAKE_SCHEDULE);
    mockScheduleService.createSchedule.mockResolvedValue(FAKE_SCHEDULE);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { body: { schedule_date: '2025-06-01' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createSchedule, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.message).toContain('already exists');
  });

  it('should throw 400 when schedule_date is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { body: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createSchedule, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createSchedule, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── updateSchedule ─────────────────────────────────────────

describe('updateSchedule', () => {
  it('should update schedule successfully', async () => {
    const updated = { ...FAKE_SCHEDULE, name: 'Updated Day' };
    mockScheduleService.updateSchedule.mockResolvedValue(updated);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1' }, body: { name: 'Updated Day', notes: 'some notes' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.updateSchedule, req, res, next);

    expect(mockScheduleService.updateSchedule).toHaveBeenCalledWith(
      'test-user-id',
      'sched-1',
      { name: 'Updated Day', notes: 'some notes' }
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.schedule).toEqual(updated);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.updateSchedule, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should propagate service errors via next', async () => {
    mockScheduleService.updateSchedule.mockRejectedValue(new Error('Not found'));

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1' }, body: { name: 'X' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.updateSchedule, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.message).toBe('Not found');
  });
});

// ─── deleteSchedule ─────────────────────────────────────────

describe('deleteSchedule', () => {
  it('should delete schedule successfully', async () => {
    mockScheduleService.deleteSchedule.mockResolvedValue(undefined);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.deleteSchedule, req, res, next);

    expect(mockScheduleService.deleteSchedule).toHaveBeenCalledWith(
      'test-user-id',
      'sched-1'
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Schedule deleted successfully');
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.deleteSchedule, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── getScheduleById ────────────────────────────────────────

describe('getScheduleById', () => {
  it('should return schedule by ID', async () => {
    mockScheduleService.getScheduleById.mockResolvedValue(FAKE_SCHEDULE);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getScheduleById, req, res, next);

    expect(mockScheduleService.getScheduleById).toHaveBeenCalledWith(
      'test-user-id',
      'sched-1'
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.schedule).toEqual(FAKE_SCHEDULE);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getScheduleById, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── addScheduleItem ────────────────────────────────────────

describe('addScheduleItem', () => {
  it('should add item with 201 status', async () => {
    mockScheduleService.addScheduleItem.mockResolvedValue(FAKE_ITEM);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      {
        params: { id: 'sched-1' },
        body: {
          title: 'Morning Run',
          start_time: '07:00',
          position: 0,
          description: 'Jog in park',
          end_time: '08:00',
          duration_minutes: 60,
          color: '#FF0000',
          icon: 'run',
          category: 'exercise',
          shape: 'diamond',
          metadata: { intensity: 'high' },
        },
      }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.addScheduleItem, req, res, next);

    expect(mockScheduleService.addScheduleItem).toHaveBeenCalledWith(
      'test-user-id',
      'sched-1',
      {
        title: 'Morning Run',
        description: 'Jog in park',
        startTime: '07:00',
        endTime: '08:00',
        durationMinutes: 60,
        color: '#FF0000',
        icon: 'run',
        category: 'exercise',
        shape: 'diamond',
        position: 0,
        metadata: { intensity: 'high' },
      }
    );
    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.data.item).toEqual(FAKE_ITEM);
  });

  it('should throw 400 when title is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1' }, body: { start_time: '07:00', position: 0 } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.addScheduleItem, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 400 when start_time is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1' }, body: { title: 'Run', position: 0 } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.addScheduleItem, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 400 when position is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1' }, body: { title: 'Run', start_time: '07:00' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.addScheduleItem, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.addScheduleItem, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── updateScheduleItem ─────────────────────────────────────

describe('updateScheduleItem', () => {
  it('should update item successfully', async () => {
    const updatedItem = { ...FAKE_ITEM, title: 'Evening Run' };
    mockScheduleService.updateScheduleItem.mockResolvedValue(updatedItem);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      {
        params: { id: 'item-1' },
        body: { title: 'Evening Run', start_time: '18:00', position: 1 },
      }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.updateScheduleItem, req, res, next);

    expect(mockScheduleService.updateScheduleItem).toHaveBeenCalledWith(
      'test-user-id',
      'item-1',
      expect.objectContaining({ title: 'Evening Run', startTime: '18:00', position: 1 })
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.item).toEqual(updatedItem);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.updateScheduleItem, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── deleteScheduleItem ─────────────────────────────────────

describe('deleteScheduleItem', () => {
  it('should delete item successfully', async () => {
    mockScheduleService.deleteScheduleItem.mockResolvedValue(undefined);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'item-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.deleteScheduleItem, req, res, next);

    expect(mockScheduleService.deleteScheduleItem).toHaveBeenCalledWith(
      'test-user-id',
      'item-1'
    );
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).message).toBe('Schedule item deleted successfully');
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.deleteScheduleItem, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── createScheduleLink ─────────────────────────────────────

describe('createScheduleLink', () => {
  it('should create link with 201 status', async () => {
    mockScheduleService.createScheduleLink.mockResolvedValue(FAKE_LINK);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      {
        params: { id: 'sched-1' },
        body: {
          source_item_id: 'item-1',
          target_item_id: 'item-2',
          link_type: 'sequence',
          delay_minutes: 5,
          conditions: { auto: true },
        },
      }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createScheduleLink, req, res, next);

    expect(mockScheduleService.createScheduleLink).toHaveBeenCalledWith(
      'test-user-id',
      'sched-1',
      {
        sourceItemId: 'item-1',
        targetItemId: 'item-2',
        linkType: 'sequence',
        delayMinutes: 5,
        conditions: { auto: true },
      }
    );
    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.data.link).toEqual(FAKE_LINK);
  });

  it('should throw 400 when source_item_id is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1' }, body: { target_item_id: 'item-2' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createScheduleLink, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 400 when target_item_id is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1' }, body: { source_item_id: 'item-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createScheduleLink, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createScheduleLink, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── deleteScheduleLink ─────────────────────────────────────

describe('deleteScheduleLink', () => {
  it('should delete link successfully', async () => {
    mockScheduleService.deleteScheduleLink.mockResolvedValue(undefined);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'link-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.deleteScheduleLink, req, res, next);

    expect(mockScheduleService.deleteScheduleLink).toHaveBeenCalledWith(
      'test-user-id',
      'link-1'
    );
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).message).toBe('Schedule link deleted successfully');
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.deleteScheduleLink, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── getTemplates ───────────────────────────────────────────

describe('getTemplates', () => {
  it('should return templates list', async () => {
    mockScheduleService.getTemplates.mockResolvedValue([FAKE_TEMPLATE]);

    const req = createAuthReq({ userId: 'test-user-id' });
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getTemplates, req, res, next);

    expect(mockScheduleService.getTemplates).toHaveBeenCalledWith('test-user-id');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.templates).toEqual([FAKE_TEMPLATE]);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.getTemplates, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── createTemplate ─────────────────────────────────────────

describe('createTemplate', () => {
  it('should create template with 201 status', async () => {
    mockScheduleService.createTemplate.mockResolvedValue(FAKE_TEMPLATE);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { body: { name: 'Workout Day', description: 'A typical workout day', is_default: false } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createTemplate, req, res, next);

    expect(mockScheduleService.createTemplate).toHaveBeenCalledWith(
      'test-user-id',
      { name: 'Workout Day', description: 'A typical workout day', isDefault: false }
    );
    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.data.template).toEqual(FAKE_TEMPLATE);
  });

  it('should throw 400 when name is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { body: { description: 'No name' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createTemplate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.createTemplate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── saveScheduleAsTemplate ─────────────────────────────────

describe('saveScheduleAsTemplate', () => {
  it('should save schedule as template with 201 status', async () => {
    mockScheduleService.saveScheduleAsTemplate.mockResolvedValue(FAKE_TEMPLATE);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      {
        params: { id: 'sched-1' },
        body: { template_name: 'Saved Template', description: 'From schedule' },
      }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.saveScheduleAsTemplate, req, res, next);

    expect(mockScheduleService.saveScheduleAsTemplate).toHaveBeenCalledWith(
      'test-user-id',
      'sched-1',
      'Saved Template',
      'From schedule'
    );
    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.data.template).toEqual(FAKE_TEMPLATE);
  });

  it('should throw 400 when template_name is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1' }, body: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.saveScheduleAsTemplate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.saveScheduleAsTemplate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── applyTemplate ──────────────────────────────────────────

describe('applyTemplate', () => {
  it('should apply template and return updated schedule', async () => {
    mockScheduleService.applyTemplateToSchedule.mockResolvedValue(undefined);
    mockScheduleService.getScheduleById.mockResolvedValue(FAKE_SCHEDULE);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1', templateId: 'tpl-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.applyTemplate, req, res, next);

    expect(mockScheduleService.applyTemplateToSchedule).toHaveBeenCalledWith(
      'sched-1',
      'tpl-1'
    );
    expect(mockScheduleService.getScheduleById).toHaveBeenCalledWith(
      'test-user-id',
      'sched-1'
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.schedule).toEqual(FAKE_SCHEDULE);
    expect(body.message).toBe('Template applied successfully');
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.applyTemplate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should propagate service errors via next', async () => {
    mockScheduleService.applyTemplateToSchedule.mockRejectedValue(
      new Error('Template not found')
    );

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'sched-1', templateId: 'tpl-999' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(scheduleController.applyTemplate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.message).toBe('Template not found');
  });
});
