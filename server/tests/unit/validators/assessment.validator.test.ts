/**
 * Assessment Validator Unit Tests
 */

import {
  goalDiscoverySchema,
  assessmentModeSchema,
  quickAssessmentResponseSchema,
  submitQuickAssessmentSchema,
  deepAssessmentMessageSchema,
  goalSetupSchema,
  goalCommitmentSchema,
  acceptSuggestedGoalsSchema,
  updateGoalSchema,
  deleteGoalsSchema,
} from '../../../src/validators/assessment.validator.js';

describe('Assessment Validators', () => {
  const validGoalCategories = [
    'weight_loss', 'muscle_building', 'sleep_improvement', 'stress_wellness',
    'energy_productivity', 'event_training', 'health_condition', 'habit_building',
    'overall_optimization', 'nutrition', 'fitness', 'custom',
  ];

  describe('goalDiscoverySchema', () => {
    it('should accept valid goal category', () => {
      const result = goalDiscoverySchema.safeParse({ category: 'weight_loss' });
      expect(result.success).toBe(true);
    });

    it('should accept all valid goal categories', () => {
      for (const category of validGoalCategories.filter(c => c !== 'custom')) {
        const result = goalDiscoverySchema.safeParse({ category });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid category', () => {
      const result = goalDiscoverySchema.safeParse({ category: 'flying' });
      expect(result.success).toBe(false);
    });

    it('should reject custom category without customGoalText', () => {
      const result = goalDiscoverySchema.safeParse({ category: 'custom' });
      expect(result.success).toBe(false);
    });

    it('should accept custom category with customGoalText', () => {
      const result = goalDiscoverySchema.safeParse({
        category: 'custom',
        customGoalText: 'I want to improve my posture',
      });
      expect(result.success).toBe(true);
    });

    it('should reject customGoalText shorter than 5 characters', () => {
      const result = goalDiscoverySchema.safeParse({
        category: 'custom',
        customGoalText: 'Hi',
      });
      expect(result.success).toBe(false);
    });

    it('should reject customGoalText over 500 characters', () => {
      const result = goalDiscoverySchema.safeParse({
        category: 'custom',
        customGoalText: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('assessmentModeSchema', () => {
    it('should accept quick mode', () => {
      const result = assessmentModeSchema.safeParse({ mode: 'quick' });
      expect(result.success).toBe(true);
    });

    it('should accept deep mode', () => {
      const result = assessmentModeSchema.safeParse({ mode: 'deep' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid mode', () => {
      const result = assessmentModeSchema.safeParse({ mode: 'medium' });
      expect(result.success).toBe(false);
    });
  });

  describe('quickAssessmentResponseSchema', () => {
    it('should accept string value', () => {
      const result = quickAssessmentResponseSchema.safeParse({
        questionId: 'q1',
        value: 'sedentary',
      });
      expect(result.success).toBe(true);
    });

    it('should accept number value', () => {
      const result = quickAssessmentResponseSchema.safeParse({
        questionId: 'q2',
        value: 7,
      });
      expect(result.success).toBe(true);
    });

    it('should accept string array value', () => {
      const result = quickAssessmentResponseSchema.safeParse({
        questionId: 'q3',
        value: ['running', 'swimming'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty questionId', () => {
      const result = quickAssessmentResponseSchema.safeParse({
        questionId: '',
        value: 'test',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('submitQuickAssessmentSchema', () => {
    const validResponses = Array.from({ length: 6 }, (_, i) => ({
      questionId: `q${i + 1}`,
      value: 'answer',
    }));

    it('should accept valid submission with 6 responses', () => {
      const result = submitQuickAssessmentSchema.safeParse({ responses: validResponses });
      expect(result.success).toBe(true);
    });

    it('should reject fewer than 6 responses', () => {
      const result = submitQuickAssessmentSchema.safeParse({
        responses: validResponses.slice(0, 5),
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional bodyStats', () => {
      const result = submitQuickAssessmentSchema.safeParse({
        responses: validResponses,
        bodyStats: { heightCm: 175, weightKg: 80 },
      });
      expect(result.success).toBe(true);
    });

    it('should reject bodyStats with height out of range', () => {
      const result = submitQuickAssessmentSchema.safeParse({
        responses: validResponses,
        bodyStats: { heightCm: 400 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject bodyStats with bodyFatPercentage out of range', () => {
      const result = submitQuickAssessmentSchema.safeParse({
        responses: validResponses,
        bodyStats: { bodyFatPercentage: 80 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('deepAssessmentMessageSchema', () => {
    it('should accept valid message', () => {
      const result = deepAssessmentMessageSchema.safeParse({ message: 'I exercise 3 times a week' });
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const result = deepAssessmentMessageSchema.safeParse({ message: '' });
      expect(result.success).toBe(false);
    });

    it('should reject message over 2000 characters', () => {
      const result = deepAssessmentMessageSchema.safeParse({ message: 'A'.repeat(2001) });
      expect(result.success).toBe(false);
    });
  });

  describe('goalSetupSchema', () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);
    const startDate = new Date();

    const validData = {
      category: 'weight_loss' as const,
      pillar: 'fitness' as const,
      title: 'Lose 10 kilograms',
      description: 'I want to lose 10kg in the next 3 months through exercise and diet',
      targetValue: 10,
      targetUnit: 'kg',
      timeline: {
        startDate: startDate.toISOString(),
        targetDate: futureDate.toISOString(),
        durationWeeks: 12,
      },
      motivation: 'I want to feel healthier and more energetic',
    };

    it('should accept valid goal setup data', () => {
      const result = goalSetupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject title shorter than 5 characters', () => {
      const result = goalSetupSchema.safeParse({ ...validData, title: 'Lose' });
      expect(result.success).toBe(false);
    });

    it('should reject title over 200 characters', () => {
      const result = goalSetupSchema.safeParse({ ...validData, title: 'A'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('should reject description shorter than 10 characters', () => {
      const result = goalSetupSchema.safeParse({ ...validData, description: 'Short' });
      expect(result.success).toBe(false);
    });

    it('should reject negative targetValue', () => {
      const result = goalSetupSchema.safeParse({ ...validData, targetValue: -5 });
      expect(result.success).toBe(false);
    });

    it('should reject zero targetValue', () => {
      const result = goalSetupSchema.safeParse({ ...validData, targetValue: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject durationWeeks over 52', () => {
      const result = goalSetupSchema.safeParse({
        ...validData,
        timeline: { ...validData.timeline, durationWeeks: 53 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject targetDate before startDate', () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      const result = goalSetupSchema.safeParse({
        ...validData,
        timeline: {
          ...validData.timeline,
          startDate: futureDate.toISOString(),
          targetDate: pastDate.toISOString(),
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject motivation shorter than 10 characters', () => {
      const result = goalSetupSchema.safeParse({ ...validData, motivation: 'Short' });
      expect(result.success).toBe(false);
    });

    it('should accept valid pillar values', () => {
      for (const pillar of ['fitness', 'nutrition', 'wellbeing']) {
        const result = goalSetupSchema.safeParse({ ...validData, pillar });
        expect(result.success).toBe(true);
      }
    });

    it('should default isPrimary to false', () => {
      const result = goalSetupSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPrimary).toBe(false);
      }
    });
  });

  describe('goalCommitmentSchema', () => {
    it('should accept valid commitment data', () => {
      const result = goalCommitmentSchema.safeParse({
        goalId: '507f1f77bcf86cd799439011',
        confidenceLevel: 8,
      });
      expect(result.success).toBe(true);
    });

    it('should reject confidenceLevel below 1', () => {
      const result = goalCommitmentSchema.safeParse({
        goalId: '507f1f77bcf86cd799439011',
        confidenceLevel: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject confidenceLevel above 10', () => {
      const result = goalCommitmentSchema.safeParse({
        goalId: '507f1f77bcf86cd799439011',
        confidenceLevel: 11,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid goalId format', () => {
      const result = goalCommitmentSchema.safeParse({
        goalId: 'invalid',
        confidenceLevel: 5,
      });
      expect(result.success).toBe(false);
    });

    it('should default acknowledgedSafetyWarnings to false', () => {
      const result = goalCommitmentSchema.safeParse({
        goalId: '507f1f77bcf86cd799439011',
        confidenceLevel: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.acknowledgedSafetyWarnings).toBe(false);
      }
    });
  });

  describe('acceptSuggestedGoalsSchema', () => {
    const validGoalEntry = {
      category: 'weight_loss' as const,
      pillar: 'fitness' as const,
      isPrimary: true,
      title: 'Lose weight',
      description: 'Lose 10kg',
      targetValue: 10,
      targetUnit: 'kg',
      timeline: { startDate: '2025-01-01', targetDate: '2025-04-01', durationWeeks: 12 },
      motivation: 'Be healthier',
      confidenceLevel: 7,
    };

    it('should accept array with 1 goal', () => {
      const result = acceptSuggestedGoalsSchema.safeParse({ goals: [validGoalEntry] });
      expect(result.success).toBe(true);
    });

    it('should accept array with 3 goals', () => {
      const result = acceptSuggestedGoalsSchema.safeParse({
        goals: [validGoalEntry, validGoalEntry, validGoalEntry],
      });
      expect(result.success).toBe(true);
    });

    it('should accept broad AI-generated categories supported by the database enum', () => {
      for (const category of ['fitness', 'nutrition']) {
        const result = acceptSuggestedGoalsSchema.safeParse({
          goals: [{ ...validGoalEntry, category }],
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject more than 3 goals', () => {
      const result = acceptSuggestedGoalsSchema.safeParse({
        goals: [validGoalEntry, validGoalEntry, validGoalEntry, validGoalEntry],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty goals array', () => {
      const result = acceptSuggestedGoalsSchema.safeParse({ goals: [] });
      expect(result.success).toBe(false);
    });
  });

  describe('updateGoalSchema', () => {
    it('should accept partial update', () => {
      const result = updateGoalSchema.safeParse({ title: 'Updated title' });
      expect(result.success).toBe(true);
    });

    it('should accept valid status values', () => {
      for (const status of ['active', 'in_progress', 'paused', 'completed', 'abandoned']) {
        const result = updateGoalSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const result = updateGoalSchema.safeParse({ status: 'deleted' });
      expect(result.success).toBe(false);
    });

    it('should reject title shorter than 5 characters', () => {
      const result = updateGoalSchema.safeParse({ title: 'Hi' });
      expect(result.success).toBe(false);
    });
  });

  describe('deleteGoalsSchema', () => {
    it('should accept array of valid UUIDs', () => {
      const result = deleteGoalsSchema.safeParse({
        goalIds: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty goalIds array', () => {
      const result = deleteGoalsSchema.safeParse({ goalIds: [] });
      expect(result.success).toBe(false);
    });

    it('should reject non-UUID strings', () => {
      const result = deleteGoalsSchema.safeParse({ goalIds: ['not-a-uuid'] });
      expect(result.success).toBe(false);
    });
  });
});
