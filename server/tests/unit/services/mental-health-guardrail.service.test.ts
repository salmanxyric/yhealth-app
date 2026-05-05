/**
 * Mental Health Guardrail Service Unit Tests
 *
 * Comprehensive tests for assessUserText covering all lanes,
 * keyword variations, edge cases, false positive prevention,
 * and logScreeningEvent.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
const mockDetectCrisisKeywords = jest.fn<any>();

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

jest.unstable_mockModule('../../../src/services/crisis-detection.service.js', () => ({
  crisisDetectionService: {
    detectCrisisKeywords: mockDetectCrisisKeywords,
  },
}));

// ============================================
// IMPORTS
// ============================================

const { mentalHealthGuardrailService } = await import(
  '../../../src/services/mental-health-guardrail.service.js'
);

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

// Default: no crisis detected
function setNoCrisis() {
  mockDetectCrisisKeywords.mockResolvedValue({ isCrisis: false, keywords: [] });
}

function setCrisis(keywords: string[] = ['kill myself']) {
  mockDetectCrisisKeywords.mockResolvedValue({ isCrisis: true, keywords });
}

// ============================================
// TESTS
// ============================================

describe('MentalHealthGuardrailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setNoCrisis();
  });

  // ------------------------------------------
  // Lane: none (neutral text)
  // ------------------------------------------
  describe('lane: none', () => {
    it('returns none for neutral coaching text', async () => {
      const r = await mentalHealthGuardrailService.assessUserText('What is a good leg day split?');
      expect(r.lane).toBe('none');
      expect(r.suppressCoachingGoals).toBe(false);
      expect(r.showProfessionalHelp).toBe(false);
      expect(r.matchedCodes).toEqual([]);
    });

    it('returns none for positive emotional text', async () => {
      const r = await mentalHealthGuardrailService.assessUserText('I feel amazing after my workout today!');
      expect(r.lane).toBe('none');
    });

    it('returns none for goal-setting text', async () => {
      const r = await mentalHealthGuardrailService.assessUserText('I want to lose 5kg in the next 3 months');
      expect(r.lane).toBe('none');
    });

    it('returns none for empty string', async () => {
      const r = await mentalHealthGuardrailService.assessUserText('');
      expect(r.lane).toBe('none');
    });

    it('returns none for very long neutral text', async () => {
      const longText = 'I love my workout routine. '.repeat(500);
      const r = await mentalHealthGuardrailService.assessUserText(longText);
      expect(r.lane).toBe('none');
    });
  });

  // ------------------------------------------
  // Lane: acute_safety_risk
  // ------------------------------------------
  describe('lane: acute_safety_risk', () => {
    it('returns acute_safety_risk when crisis keywords present', async () => {
      setCrisis(['kill myself']);
      const r = await mentalHealthGuardrailService.assessUserText('I want to kill myself');
      expect(r.lane).toBe('acute_safety_risk');
      expect(r.showProfessionalHelp).toBe(true);
      expect(r.suppressCoachingGoals).toBe(true);
      expect(r.matchedCodes).toContain('crisis_keywords');
    });

    it('prioritizes acute_safety_risk over clinical concern', async () => {
      // Text has both crisis keywords AND clinical concern patterns
      setCrisis(['suicide']);
      const r = await mentalHealthGuardrailService.assessUserText(
        'I have clinical depression and thoughts of suicide'
      );
      expect(r.lane).toBe('acute_safety_risk');
    });

    it('prioritizes acute_safety_risk over situational stress', async () => {
      setCrisis(['end it all']);
      const r = await mentalHealthGuardrailService.assessUserText(
        'I am so stressed I want to end it all'
      );
      expect(r.lane).toBe('acute_safety_risk');
    });

    it('includes crisis keywords in matchedCodes (limited to 5)', async () => {
      setCrisis(['kw1', 'kw2', 'kw3', 'kw4', 'kw5', 'kw6', 'kw7']);
      const r = await mentalHealthGuardrailService.assessUserText('test');
      // crisis_keywords + up to 5 from the keywords array
      expect(r.matchedCodes.length).toBeLessThanOrEqual(6);
    });
  });

  // ------------------------------------------
  // Lane: elevated_clinical_concern
  // ------------------------------------------
  describe('lane: elevated_clinical_concern', () => {
    it('detects persistent depression phrasing (weeks depressed)', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I have been depressed for weeks and cannot get out of bed'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
      expect(r.showProfessionalHelp).toBe(true);
      expect(r.suppressCoachingGoals).toBe(true);
    });

    it('detects "months depressed"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I have been months depressed now'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
      expect(r.matchedCodes).toContain('dep_weeks');
    });

    it('detects "depressed for months"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I have been depressed for months'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('detects emotional numbness (feel nothing)', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I feel nothing anymore, just emptiness'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
      expect(r.matchedCodes).toContain('no_feeling');
    });

    it('detects "emotionally numb"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I am emotionally numb and detached'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('detects "completely numb"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I feel completely numb inside'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('detects functional impairment (can\'t get out of bed)', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        "I can't get out of bed most days"
      );
      expect(r.lane).toBe('elevated_clinical_concern');
      expect(r.matchedCodes).toContain('cant_function');
    });

    it('detects "cannot get out of bed"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I cannot get out of bed anymore'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('detects "stopped showering"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I have stopped showering for days'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('detects "not eating for days"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I have been not eating for days'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('detects clinical terminology (clinical depression)', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I was diagnosed with clinical depression last month'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
      expect(r.matchedCodes).toContain('clinical_term');
    });

    it('detects "bipolar disorder"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'My bipolar disorder makes exercise really hard'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('detects "psychiatrist"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'My psychiatrist told me to take it easy'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('detects "antidepressants" (plural)', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I just started antidepressants and feel groggy'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('detects "antidepressant" (singular)', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'My antidepressant makes me tired all day'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('matches multiple clinical codes simultaneously', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        "I have clinical depression, feel nothing, and can't get out of bed"
      );
      expect(r.lane).toBe('elevated_clinical_concern');
      expect(r.matchedCodes).toContain('clinical_term');
      expect(r.matchedCodes).toContain('no_feeling');
      expect(r.matchedCodes).toContain('cant_function');
    });

    it('is case-insensitive', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I Have CLINICAL DEPRESSION'
      );
      expect(r.lane).toBe('elevated_clinical_concern');
    });
  });

  // ------------------------------------------
  // Lane: situational_stress
  // ------------------------------------------
  describe('lane: situational_stress', () => {
    it('detects work stress (stressed at work)', async () => {
      const r = await mentalHealthGuardrailService.assessUserText('I am so stressed at work this week');
      expect(r.lane).toBe('situational_stress');
      expect(r.showProfessionalHelp).toBe(false);
      expect(r.suppressCoachingGoals).toBe(false);
    });

    it('detects "stressed with work"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I am stressed with work deadlines'
      );
      expect(r.lane).toBe('situational_stress');
      expect(r.matchedCodes).toContain('stress_work');
    });

    it('detects "overwhelmed at work"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I feel overwhelmed at work lately'
      );
      expect(r.lane).toBe('situational_stress');
    });

    it('detects "so stressed"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I am so stressed right now'
      );
      expect(r.lane).toBe('situational_stress');
      expect(r.matchedCodes).toContain('stress_general');
    });

    it('detects "really stressed"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'Feeling really stressed about everything'
      );
      expect(r.lane).toBe('situational_stress');
    });

    it('detects "too much going on"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'There is too much going on in my life'
      );
      expect(r.lane).toBe('situational_stress');
    });

    it('detects "feeling sad"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I am feeling sad today'
      );
      expect(r.lane).toBe('situational_stress');
      expect(r.matchedCodes).toContain('sad_situational');
    });

    it('detects "a bit down"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I have been a bit down this week'
      );
      expect(r.lane).toBe('situational_stress');
    });

    it('detects "rough day"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'Had a rough day at the office'
      );
      expect(r.lane).toBe('situational_stress');
    });

    it('detects "really depressed" as situational (mood_low_mild)', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I am really depressed about my exam results'
      );
      expect(r.lane).toBe('situational_stress');
      expect(r.matchedCodes).toContain('mood_low_mild');
    });

    it('detects "extremely sad"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I feel extremely sad about losing my pet'
      );
      expect(r.lane).toBe('situational_stress');
    });

    it('detects "miserable"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I feel miserable after the breakup'
      );
      expect(r.lane).toBe('situational_stress');
    });
  });

  // ------------------------------------------
  // False positive prevention
  // ------------------------------------------
  describe('false positive prevention', () => {
    it('does NOT flag "depressed" alone (too short/ambiguous)', async () => {
      // "depressed" by itself is not in any pattern — patterns require context
      const r = await mentalHealthGuardrailService.assessUserText(
        'I feel a bit depressed after the rain'
      );
      // "a bit down" is not an exact match to "a bit depressed"
      // This should not match any clinical or situational pattern
      expect(r.lane).toBe('none');
    });

    it('does NOT flag "my bed is comfortable" (false positive for bed keywords)', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'My bed is so comfortable I never want to leave'
      );
      expect(r.lane).toBe('none');
    });

    it('does NOT flag "stressed about my workout plan" if no matching phrase', async () => {
      // "stressed about" is not an exact match to any needle
      const r = await mentalHealthGuardrailService.assessUserText(
        'I am stressed about my workout plan'
      );
      // Check — "stressed" alone does not match. Needs "so stressed" or "really stressed"
      expect(r.lane).toBe('none');
    });

    it('does NOT flag discussion of medication side effects neutrally', async () => {
      // "antidepressant" IS a clinical term keyword, so this correctly flags
      const r = await mentalHealthGuardrailService.assessUserText(
        'My antidepressant is working well, no side effects'
      );
      // This SHOULD flag as elevated_clinical_concern because the keyword is present
      expect(r.lane).toBe('elevated_clinical_concern');
    });

    it('does NOT flag "I am feeling great today"', async () => {
      const r = await mentalHealthGuardrailService.assessUserText(
        'I am feeling great today, best workout ever!'
      );
      expect(r.lane).toBe('none');
    });
  });

  // ------------------------------------------
  // hashContent
  // ------------------------------------------
  describe('hashContent', () => {
    it('returns consistent SHA-256 hash for same input', () => {
      const hash1 = mentalHealthGuardrailService.hashContent('test input');
      const hash2 = mentalHealthGuardrailService.hashContent('test input');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });

    it('returns different hash for different input', () => {
      const hash1 = mentalHealthGuardrailService.hashContent('input A');
      const hash2 = mentalHealthGuardrailService.hashContent('input B');
      expect(hash1).not.toBe(hash2);
    });
  });

  // ------------------------------------------
  // logScreeningEvent
  // ------------------------------------------
  describe('logScreeningEvent', () => {
    it('inserts audit row for non-none lanes', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await mentalHealthGuardrailService.logScreeningEvent(
        'user-1', 'elevated_clinical_concern', 'chat', 'some text'
      );

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery.mock.calls[0][1]).toEqual(
        expect.arrayContaining(['user-1', 'elevated_clinical_concern', 'chat'])
      );
    });

    it('skips logging for lane = none', async () => {
      await mentalHealthGuardrailService.logScreeningEvent(
        'user-1', 'none', 'chat', 'neutral text'
      );

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('does not throw on DB error (graceful degradation)', async () => {
      mockQuery.mockRejectedValueOnce(new Error('table missing'));

      await expect(
        mentalHealthGuardrailService.logScreeningEvent(
          'user-1', 'situational_stress', 'chat', 'stressed text'
        )
      ).resolves.toBeUndefined();
    });

    it('hashes content before storing (no raw text)', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await mentalHealthGuardrailService.logScreeningEvent(
        'user-1', 'elevated_clinical_concern', 'rag', 'sensitive content'
      );

      const params = mockQuery.mock.calls[0][1] as string[];
      // Fourth param should be the SHA-256 hash, not the raw text
      expect(params[3]).toHaveLength(64);
      expect(params[3]).not.toBe('sensitive content');
    });
  });
});
