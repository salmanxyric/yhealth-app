/**
 * @file Smart Competition Service Tests
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

const { mockQuery } = setupDbMock();
setupLoggerMock();

const { smartCompetitionService } = await import('../../../src/services/smart-competition.service.js');
const { pgResult } = await import('../../helpers/factories.js');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SmartCompetitionService', () => {
  describe('getGoalDistribution', () => {
    it('uses the users.last_login schema column for recent activity', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([
          { pillar: 'fitness', count: '3' },
          { pillar: 'nutrition', count: '1' },
        ])
      );

      const distribution = await smartCompetitionService.getGoalDistribution();

      expect(distribution).toEqual([
        { pillar: 'fitness', count: 3, percentage: 75 },
        { pillar: 'nutrition', count: 1, percentage: 25 },
      ]);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('last_login >= NOW()'));
      expect(mockQuery).toHaveBeenCalledWith(expect.not.stringContaining('last_login_at'));
    });
  });
});
