/**
 * Crisis Detection Service Unit Tests
 *
 * Tests for keyword detection, distress level analysis,
 * emergency protocol triggering, and crisis resource retrieval.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS (unstable_mockModule for ESM)
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
// IMPORTS (dynamic, after mock setup)
// ============================================

const { crisisDetectionService } = await import('../../../src/services/crisis-detection.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('detectCrisisKeywords', () => {
  it('detects critical keywords and returns critical severity', async () => {
    const result = await crisisDetectionService.detectCrisisKeywords(
      'I want to kill myself',
    );

    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('critical');
    expect(result.keywords).toContain('kill myself');
    expect(result.confidence).toBeGreaterThanOrEqual(100);
    expect(result.reasoning).toContain('crisis-related keyword');
  });

  it('detects high severity keywords', async () => {
    const result = await crisisDetectionService.detectCrisisKeywords(
      'I feel so hopeless and trapped',
    );

    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('high');
    expect(result.keywords).toEqual(expect.arrayContaining(['hopeless', 'trapped']));
  });

  it('detects medium severity keywords', async () => {
    const result = await crisisDetectionService.detectCrisisKeywords(
      "I can't cope with everything",
    );

    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('medium');
    expect(result.keywords).toContain("can't cope");
  });

  it('returns no crisis for safe text', async () => {
    const result = await crisisDetectionService.detectCrisisKeywords(
      'I had a great day today and feel wonderful!',
    );

    expect(result.isCrisis).toBe(false);
    expect(result.severity).toBe('low');
    expect(result.keywords).toHaveLength(0);
    expect(result.confidence).toBe(0);
    expect(result.reasoning).toBeUndefined();
  });

  it('is case insensitive', async () => {
    const result = await crisisDetectionService.detectCrisisKeywords(
      'I WANT TO KILL MYSELF',
    );

    expect(result.isCrisis).toBe(true);
    expect(result.severity).toBe('critical');
  });

  it('critical severity takes precedence over high/medium', async () => {
    const result = await crisisDetectionService.detectCrisisKeywords(
      "I'm hopeless and want to end my life",
    );

    expect(result.severity).toBe('critical');
    // Should contain the critical keyword, not the high one
    expect(result.keywords).toContain('end my life');
  });

  it('logs warning when crisis detected', async () => {
    await crisisDetectionService.detectCrisisKeywords('I want to hurt myself');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[CrisisDetection] Crisis keywords detected',
      expect.objectContaining({ severity: 'critical' }),
    );
  });
});

describe('analyzeDistressLevel', () => {
  it('returns critical distress for critical keywords + distressed emotion', async () => {
    const result = await crisisDetectionService.analyzeDistressLevel(
      'I want to kill myself',
      { category: 'distressed', confidence: 95, emotions: [], reasoning: '' },
    );

    expect(result.level).toBe('critical');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.indicators.length).toBeGreaterThan(0);
  });

  it('returns moderate distress for sad emotion without crisis keywords', async () => {
    const result = await crisisDetectionService.analyzeDistressLevel(
      'I feel really down today',
      { category: 'sad', confidence: 80, emotions: [], reasoning: '' },
    );

    expect(['moderate', 'mild']).toContain(result.level);
    expect(result.indicators).toEqual(
      expect.arrayContaining([expect.stringContaining('sad')]),
    );
  });

  it('returns none for positive text and happy emotion', async () => {
    const result = await crisisDetectionService.analyzeDistressLevel(
      'Having a wonderful day!',
      { category: 'happy', confidence: 90, emotions: [], reasoning: '' },
    );

    expect(result.level).toBe('none');
    expect(result.score).toBe(0);
  });

  it('incorporates tone data when provided', async () => {
    const withoutTone = await crisisDetectionService.analyzeDistressLevel(
      'I feel anxious',
      { category: 'anxious', confidence: 60, emotions: [], reasoning: '' },
    );

    const withTone = await crisisDetectionService.analyzeDistressLevel(
      'I feel anxious',
      { category: 'anxious', confidence: 60, emotions: [], reasoning: '' },
      { intensity: 0.9, pace: 0.9 },
    );

    // Tone should add to the score
    expect(withTone.score).toBeGreaterThan(withoutTone.score);
    expect(withTone.indicators).toEqual(
      expect.arrayContaining([expect.stringContaining('intensity')]),
    );
  });

  it('returns safe default on error', async () => {
    // Force an error by passing null emotion (will fail accessing .category)
    const result = await crisisDetectionService.analyzeDistressLevel(
      'test',
      null as any,
    );

    expect(result.level).toBe('none');
    expect(result.score).toBe(0);
  });
});

describe('triggerEmergencyProtocol', () => {
  it('updates voice call and conversation records', async () => {
    // UPDATE voice_calls
    mockQuery.mockResolvedValueOnce(pgResult([]));
    // SELECT conversation_id
    mockQuery.mockResolvedValueOnce(pgResult([{ conversation_id: 'conv-001' }]));
    // UPDATE rag_conversations
    mockQuery.mockResolvedValueOnce(pgResult([]));
    // user_preferences
    mockQuery.mockResolvedValueOnce(pgResult([{ safety_team_notification: false }]));

    await crisisDetectionService.triggerEmergencyProtocol('call-001', 'u-001');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('emergency_triggered = true'),
      ['call-001', 'u-001'],
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      '[CrisisDetection] Emergency protocol activated',
      expect.objectContaining({ callId: 'call-001' }),
    );
  });

  it('handles missing conversation gracefully', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([])); // UPDATE voice_calls
    mockQuery.mockResolvedValueOnce(pgResult([{ conversation_id: null }])); // no conversation
    mockQuery.mockResolvedValueOnce(pgResult([])); // user_preferences

    await crisisDetectionService.triggerEmergencyProtocol('call-002', 'u-001');

    // Should not try to update rag_conversations
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  it('throws on database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

    await expect(
      crisisDetectionService.triggerEmergencyProtocol('call-err', 'u-001'),
    ).rejects.toThrow('DB connection failed');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[CrisisDetection] Error triggering emergency protocol',
      expect.any(Object),
    );
  });
});

describe('getCrisisResources', () => {
  it('returns default US crisis resources', async () => {
    const resources = await crisisDetectionService.getCrisisResources();

    expect(resources.country).toBe('US');
    expect(resources.hotlines).toHaveLength(3);
    expect(resources.hotlines[0].number).toBe('988');
    expect(resources.hotlines[0].type).toBe('suicide_prevention');
  });

  it('returns default resources even when location provided (pending implementation)', async () => {
    const resources = await crisisDetectionService.getCrisisResources('UK');

    expect(resources.country).toBe('US'); // Falls back to default
    expect(resources.hotlines.length).toBeGreaterThan(0);
  });

  it('includes crisis text line and emergency services', async () => {
    const resources = await crisisDetectionService.getCrisisResources();

    const types = resources.hotlines.map((h) => h.type);
    expect(types).toContain('crisis_text');
    expect(types).toContain('emergency');
  });
});
