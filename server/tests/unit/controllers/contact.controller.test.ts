/**
 * Contact Controller Unit Tests
 * Tests all exported handlers: createContactSubmission, getAdminContacts,
 *   getContactStatistics, getAdminContactById, updateContactSubmission,
 *   deleteContactSubmission, bulkDeleteContactsPost, bulkUpdateContactStatusPost,
 *   sendContactReply.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mocks ──
const mockContactService = {
  createContact: jest.fn<any>(),
  listContacts: jest.fn<any>(),
  getContactById: jest.fn<any>(),
  updateContact: jest.fn<any>(),
  deleteContact: jest.fn<any>(),
  bulkDeleteContacts: jest.fn<any>(),
  bulkUpdateContactStatus: jest.fn<any>(),
  getContactStats: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/contact.service.js', () => ({
  ...mockContactService,
}));

const mockMailHelper = {
  sendContactReplyEmail: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/helper/mail.js', () => ({
  mailHelper: mockMailHelper,
}));

// ── Dynamic imports AFTER mocks ──
const {
  createContactSubmission,
  getAdminContacts,
  getContactStatistics,
  getAdminContactById,
  updateContactSubmission,
  deleteContactSubmission,
  bulkDeleteContactsPost,
  bulkUpdateContactStatusPost,
  sendContactReply,
} = await import('../../../src/controllers/contact.controller.js');

const { createAuthReq, createReq: _createReq, createRes, createNext, callHandler, getJsonBody, getStatus } = await import(
  '../../helpers/controller-harness.js'
);

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
// createContactSubmission
// ─────────────────────────────────────────────
describe('createContactSubmission', () => {
  it('creates a contact and returns the id with 201', async () => {
    const req = createAuthReq({}, {
      body: { name: 'John', email: 'john@example.com', subject: 'Hello', message: 'Hi there' },
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' } as any,
      get: jest.fn().mockReturnValue('Mozilla/5.0') as any,
    });
    const res = createRes();
    const next = createNext();

    mockContactService.createContact.mockResolvedValueOnce({ id: 'contact-1' });

    await callHandler(createContactSubmission, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('contact-1');
    expect(getStatus(res)).toBe(201);
    // Verify ip_address and user_agent were injected
    expect(mockContactService.createContact).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: '127.0.0.1',
      })
    );
  });
});

// ─────────────────────────────────────────────
// getAdminContacts
// ─────────────────────────────────────────────
describe('getAdminContacts', () => {
  it('returns paginated contacts with default params', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockContactService.listContacts.mockResolvedValueOnce({
      contacts: [{ id: 'c-1', name: 'Alice' }],
      page: 1,
      limit: 20,
      total: 1,
    });

    await callHandler(getAdminContacts, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    // ApiResponse.paginated sets data as array
    expect(mockContactService.listContacts).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ page: 1, limit: 20, sort_by: 'created_at', sort_order: 'desc' })
    );
  });

  it('passes filter params to service', async () => {
    const req = createAuthReq({}, {
      query: {
        page: '2',
        limit: '10',
        status: 'new',
        priority: 'high',
        search: 'test',
        sort_by: 'name',
        sort_order: 'asc',
      },
    });
    const res = createRes();
    const next = createNext();

    mockContactService.listContacts.mockResolvedValueOnce({
      contacts: [],
      page: 2,
      limit: 10,
      total: 0,
    });

    await callHandler(getAdminContacts, req, res, next);

    expect(mockContactService.listContacts).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'new', priority: 'high', search: 'test' }),
      expect.objectContaining({ page: 2, limit: 10, sort_by: 'name', sort_order: 'asc' })
    );
  });
});

// ─────────────────────────────────────────────
// getContactStatistics
// ─────────────────────────────────────────────
describe('getContactStatistics', () => {
  it('returns contact statistics', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    const stats = { total: 50, new: 10, read: 15, in_progress: 20, resolved: 5 };
    mockContactService.getContactStats.mockResolvedValueOnce(stats);

    await callHandler(getContactStatistics, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(stats);
  });
});

// ─────────────────────────────────────────────
// getAdminContactById
// ─────────────────────────────────────────────
describe('getAdminContactById', () => {
  it('returns 404 when contact not found', async () => {
    const req = createAuthReq({}, { params: { id: 'missing-id' } });
    const res = createRes();
    const next = createNext();

    mockContactService.getContactById.mockResolvedValueOnce(null);

    await callHandler(getAdminContactById, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns contact and marks as read if status is new', async () => {
    const contact = { id: 'c-1', name: 'Alice', status: 'new', email: 'alice@test.com' };
    const req = createAuthReq({ userId: 'admin-1' }, { params: { id: 'c-1' } });
    const res = createRes();
    const next = createNext();

    mockContactService.getContactById.mockResolvedValueOnce(contact);
    mockContactService.updateContact.mockResolvedValueOnce({ ...contact, status: 'read' });

    await callHandler(getAdminContactById, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('c-1');
    // Should have been marked as read
    expect(mockContactService.updateContact).toHaveBeenCalledWith('c-1', { status: 'read' }, undefined);
  });

  it('does not mark as read if status is not new', async () => {
    const contact = { id: 'c-2', name: 'Bob', status: 'read', email: 'bob@test.com' };
    const req = createAuthReq({}, { params: { id: 'c-2' } });
    const res = createRes();
    const next = createNext();

    mockContactService.getContactById.mockResolvedValueOnce(contact);

    await callHandler(getAdminContactById, req, res, next);

    expect(mockContactService.updateContact).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// updateContactSubmission
// ─────────────────────────────────────────────
describe('updateContactSubmission', () => {
  it('updates contact and returns updated record', async () => {
    const updated = { id: 'c-1', status: 'in_progress' };
    const req = createAuthReq({ userId: 'admin-1' }, {
      params: { id: 'c-1' },
      body: { status: 'in_progress' },
    });
    const res = createRes();
    const next = createNext();

    mockContactService.updateContact.mockResolvedValueOnce(updated);

    await callHandler(updateContactSubmission, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('in_progress');
  });
});

// ─────────────────────────────────────────────
// deleteContactSubmission
// ─────────────────────────────────────────────
describe('deleteContactSubmission', () => {
  it('deletes contact and returns success', async () => {
    const req = createAuthReq({}, { params: { id: 'c-1' } });
    const res = createRes();
    const next = createNext();

    mockContactService.deleteContact.mockResolvedValueOnce(undefined);

    await callHandler(deleteContactSubmission, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(mockContactService.deleteContact).toHaveBeenCalledWith('c-1');
  });
});

// ─────────────────────────────────────────────
// bulkDeleteContactsPost
// ─────────────────────────────────────────────
describe('bulkDeleteContactsPost', () => {
  it('bulk deletes contacts', async () => {
    const req = createAuthReq({}, { body: { ids: ['c-1', 'c-2', 'c-3'] } });
    const res = createRes();
    const next = createNext();

    mockContactService.bulkDeleteContacts.mockResolvedValueOnce(undefined);

    await callHandler(bulkDeleteContactsPost, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.message).toContain('3');
    expect(mockContactService.bulkDeleteContacts).toHaveBeenCalledWith(['c-1', 'c-2', 'c-3']);
  });
});

// ─────────────────────────────────────────────
// bulkUpdateContactStatusPost
// ─────────────────────────────────────────────
describe('bulkUpdateContactStatusPost', () => {
  it('bulk updates contact status', async () => {
    const req = createAuthReq({ userId: 'admin-1' }, {
      body: { ids: ['c-1', 'c-2'], status: 'resolved' },
    });
    const res = createRes();
    const next = createNext();

    mockContactService.bulkUpdateContactStatus.mockResolvedValueOnce(undefined);

    await callHandler(bulkUpdateContactStatusPost, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.message).toContain('2');
    expect(body.message).toContain('resolved');
  });
});

// ─────────────────────────────────────────────
// sendContactReply
// ─────────────────────────────────────────────
describe('sendContactReply', () => {
  it('returns error when message is missing', async () => {
    const req = createAuthReq({}, { params: { id: 'c-1' }, body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(sendContactReply, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns error when message is empty string', async () => {
    const req = createAuthReq({}, { params: { id: 'c-1' }, body: { message: '   ' } });
    const res = createRes();
    const next = createNext();

    await callHandler(sendContactReply, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns error when message exceeds 5000 characters', async () => {
    const req = createAuthReq({}, {
      params: { id: 'c-1' },
      body: { message: 'x'.repeat(5001) },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(sendContactReply, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 404 when contact not found', async () => {
    const req = createAuthReq({}, {
      params: { id: 'c-missing' },
      body: { message: 'Hello there' },
    });
    const res = createRes();
    const next = createNext();

    mockContactService.getContactById.mockResolvedValueOnce(null);

    await callHandler(sendContactReply, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns error when email sending fails', async () => {
    const contact = { id: 'c-1', email: 'user@test.com', name: 'User', subject: 'Help', status: 'new' };
    const req = createAuthReq({ userId: 'admin-1' }, {
      params: { id: 'c-1' },
      body: { message: 'We will help you' },
    });
    (req as any).user = { ...((req as any).user), id: 'admin-1' };
    const res = createRes();
    const next = createNext();

    mockContactService.getContactById.mockResolvedValueOnce(contact);
    // Admin info query
    mockQuery.mockResolvedValueOnce({
      rows: [{ first_name: 'Admin', last_name: 'User', email: 'admin@test.com' }],
    });
    mockMailHelper.sendContactReplyEmail.mockResolvedValueOnce(false);

    await callHandler(sendContactReply, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('sends reply email and updates contact status to in_progress', async () => {
    const contact = { id: 'c-1', email: 'user@test.com', name: 'User', subject: 'Help', status: 'new' };
    const req = createAuthReq({ userId: 'admin-1' }, {
      params: { id: 'c-1' },
      body: { message: 'We will help you' },
    });
    (req as any).user = { ...((req as any).user), id: 'admin-1' };
    const res = createRes();
    const next = createNext();

    mockContactService.getContactById.mockResolvedValueOnce(contact);
    // Admin info query
    mockQuery.mockResolvedValueOnce({
      rows: [{ first_name: 'Admin', last_name: 'User', email: 'admin@test.com' }],
    });
    mockMailHelper.sendContactReplyEmail.mockResolvedValueOnce(true);
    mockContactService.updateContact.mockResolvedValueOnce({ ...contact, status: 'in_progress' });

    await callHandler(sendContactReply, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.sent).toBe(true);
    expect(mockMailHelper.sendContactReplyEmail).toHaveBeenCalledWith(
      'user@test.com', 'User', 'Help', 'We will help you', 'Admin User', 'admin@test.com'
    );
    // Should update status to in_progress since it was 'new'
    expect(mockContactService.updateContact).toHaveBeenCalledWith('c-1', { status: 'in_progress' }, 'admin-1');
  });

  it('does not update status if contact is already in_progress or resolved', async () => {
    const contact = { id: 'c-1', email: 'user@test.com', name: 'User', subject: 'Help', status: 'in_progress' };
    const req = createAuthReq({}, {
      params: { id: 'c-1' },
      body: { message: 'Following up' },
    });
    const res = createRes();
    const next = createNext();

    mockContactService.getContactById.mockResolvedValueOnce(contact);
    mockMailHelper.sendContactReplyEmail.mockResolvedValueOnce(true);

    await callHandler(sendContactReply, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(mockContactService.updateContact).not.toHaveBeenCalled();
  });
});
