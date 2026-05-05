/**
 * Tool Audit Service Unit Tests
 *
 * Tests fire-and-forget audit logging and recent mutation queries.
 */

import { describe, it, expect, jest, beforeAll, beforeEach } from '@jest/globals';
import type { ToolAuditEntry } from '../../../src/services/tool-audit.service.js';

// ============================================
// MOCK REFERENCES
// ============================================

const mockQuery = jest.fn();
const mockLoggerDebug = jest.fn();

// ============================================
// MODULE UNDER TEST (loaded after mocks)
// ============================================

let toolAuditService: typeof import(
  '../../../src/services/tool-audit.service.js'
)['toolAuditService'];

beforeAll(async () => {
  await jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));
  await jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: {
      debug: (...args: unknown[]) => mockLoggerDebug(...args),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  }));
  jest.resetModules();
  const mod = await import('../../../src/services/tool-audit.service.js');
  toolAuditService = mod.toolAuditService;
});

// ============================================
// HELPERS
// ============================================

function buildEntry(overrides: Partial<ToolAuditEntry> = {}): ToolAuditEntry {
  return {
    userId: 'user-123',
    conversationId: 'conv-456',
    toolName: 'updateProfile',
    mutationType: 'UPDATE',
    toolArgs: { name: 'Jane' },
    toolResult: 'OK',
    entityType: 'user',
    entityId: 'user-123',
    durationMs: 42,
    success: true,
    errorMessage: undefined,
    idempotencyKey: 'idem-789',
    ...overrides,
  };
}

/**
 * Flush microtask queue so the fire-and-forget promise in
 * logToolExecution resolves before we assert.
 */
async function flushPromises(): Promise<void> {
  await new Promise((r) => setImmediate(r));
}

// ============================================
// TESTS
// ============================================

describe('ToolAuditService', () => {
  beforeEach(() => {
    mockQuery.mockClear();
    mockLoggerDebug.mockClear();
  });

  // ------------------------------------------
  // logToolExecution
  // ------------------------------------------
  describe('logToolExecution', () => {
    it('should call query with INSERT and correct parameter array', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const entry = buildEntry();

      toolAuditService.logToolExecution(entry);
      await flushPromises();

      expect(mockQuery).toHaveBeenCalledTimes(1);

      const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('INSERT INTO tool_audit_log');
      expect(params).toEqual([
        'user-123',       // userId
        'conv-456',       // conversationId
        'updateProfile',  // toolName
        'UPDATE',         // mutationType
        JSON.stringify({ name: 'Jane' }), // toolArgs as JSON
        'OK',             // toolResult
        'user',           // entityType
        'user-123',       // entityId
        42,               // durationMs
        true,             // success
        null,             // errorMessage (undefined -> null)
        'idem-789',       // idempotencyKey
      ]);
    });

    it('should map missing optional fields to null', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const entry = buildEntry({
        conversationId: undefined,
        toolResult: undefined,
        entityType: undefined,
        entityId: undefined,
        errorMessage: undefined,
        idempotencyKey: undefined,
      });

      toolAuditService.logToolExecution(entry);
      await flushPromises();

      const [, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(params[1]).toBeNull();  // conversationId
      expect(params[5]).toBeNull();  // toolResult
      expect(params[6]).toBeNull();  // entityType
      expect(params[7]).toBeNull();  // entityId
      expect(params[10]).toBeNull(); // errorMessage
      expect(params[11]).toBeNull(); // idempotencyKey
    });

    it('should silently catch query errors (fire-and-forget)', async () => {
      mockQuery.mockRejectedValueOnce(new Error('connection refused'));

      // Must not throw
      expect(() => {
        toolAuditService.logToolExecution(buildEntry());
      }).not.toThrow();

      await flushPromises();
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should not log via logger.debug when error message includes tool_audit_log', async () => {
      mockQuery.mockRejectedValueOnce(
        new Error('relation "tool_audit_log" does not exist')
      );

      toolAuditService.logToolExecution(buildEntry());
      await flushPromises();

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockLoggerDebug).not.toHaveBeenCalled();
    });

    it('should log via logger.debug when error is NOT about tool_audit_log', async () => {
      mockQuery.mockRejectedValueOnce(new Error('timeout'));

      toolAuditService.logToolExecution(buildEntry());
      await flushPromises();

      expect(mockLoggerDebug).toHaveBeenCalledWith(
        '[ToolAudit] Write failed',
        expect.objectContaining({ error: 'timeout', tool: 'updateProfile' })
      );
    });

    it('should serialize toolArgs as JSON string', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const complexArgs = { filters: [1, 2], nested: { deep: true } };

      toolAuditService.logToolExecution(
        buildEntry({ toolArgs: complexArgs })
      );
      await flushPromises();

      const [, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(params[4]).toBe(JSON.stringify(complexArgs));
    });
  });

  // ------------------------------------------
  // getRecentMutations
  // ------------------------------------------
  describe('getRecentMutations', () => {
    it('should call query with default options (7 days, limit 50)', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await toolAuditService.getRecentMutations('user-123');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('SELECT');
      expect(sql).toContain('FROM tool_audit_log');
      expect(sql).toContain('LIMIT $3');
      expect(params).toEqual(['user-123', 7, 50]);
    });

    it('should apply custom daysBack and limit', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await toolAuditService.getRecentMutations('user-123', {
        daysBack: 30,
        limit: 10,
      });

      const [, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(params).toEqual(['user-123', 30, 10]);
    });

    it('should add mutation_type WHERE clause when mutationType is provided', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await toolAuditService.getRecentMutations('user-123', {
        mutationType: 'DELETE',
      });

      const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('mutation_type = $4');
      expect(params).toEqual(['user-123', 7, 50, 'DELETE']);
    });

    it('should return rows from the query result', async () => {
      const fakeRows = [
        { tool_name: 'deleteUser', mutation_type: 'DELETE', success: true },
        { tool_name: 'updateProfile', mutation_type: 'UPDATE', success: true },
      ];
      mockQuery.mockResolvedValueOnce({ rows: fakeRows });

      const result = await toolAuditService.getRecentMutations('user-123');

      expect(result).toEqual(fakeRows);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when query throws', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db down'));

      const result = await toolAuditService.getRecentMutations('user-123');

      expect(result).toEqual([]);
    });
  });
});
