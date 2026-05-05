/**
 * AI Coach Validator Unit Tests
 */

import {
  startConversationSchema,
  sendMessageSchema,
  completeAssessmentSchema,
  generateGoalsSchema,
  sessionSchema,
  chatSchema,
  generateDietPlanSchema,
  analyzeImageSchema,
  chatWithImageSchema,
} from '../../../src/validators/ai-coach.validator.js';

describe('AI Coach Validators', () => {
  const validGoal = 'weight_loss' as const;
  const allGoalCategories = [
    'weight_loss', 'muscle_building', 'sleep_improvement', 'stress_wellness',
    'energy_productivity', 'event_training', 'health_condition', 'habit_building',
    'overall_optimization', 'nutrition', 'fitness', 'custom',
  ];

  describe('startConversationSchema', () => {
    it('should accept valid start conversation data', () => {
      const result = startConversationSchema.safeParse({ goal: validGoal });
      expect(result.success).toBe(true);
    });

    it('should accept all goal categories', () => {
      for (const goal of allGoalCategories) {
        const result = startConversationSchema.safeParse({ goal });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid goal category', () => {
      const result = startConversationSchema.safeParse({ goal: 'invalid_goal' });
      expect(result.success).toBe(false);
    });

    it('should reject missing goal', () => {
      const result = startConversationSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept optional userName', () => {
      const result = startConversationSchema.safeParse({ goal: validGoal, userName: 'Alice' });
      expect(result.success).toBe(true);
    });

    it('should reject userName over 100 characters', () => {
      const result = startConversationSchema.safeParse({ goal: validGoal, userName: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should accept supported languages', () => {
      for (const language of ['en', 'ur']) {
        const result = startConversationSchema.safeParse({ goal: validGoal, language });
        expect(result.success).toBe(true);
      }
    });

    it('should reject unsupported language', () => {
      const result = startConversationSchema.safeParse({ goal: validGoal, language: 'fr' });
      expect(result.success).toBe(false);
    });
  });

  describe('sendMessageSchema', () => {
    const validData = {
      message: 'I want to lose weight',
      goal: validGoal,
      conversationHistory: [{ role: 'user' as const, content: 'Hello' }],
    };

    it('should accept valid send message data', () => {
      const result = sendMessageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const result = sendMessageSchema.safeParse({ ...validData, message: '' });
      expect(result.success).toBe(false);
    });

    it('should reject message over 2000 characters', () => {
      const result = sendMessageSchema.safeParse({ ...validData, message: 'A'.repeat(2001) });
      expect(result.success).toBe(false);
    });

    it('should reject invalid role in conversation history', () => {
      const result = sendMessageSchema.safeParse({
        ...validData,
        conversationHistory: [{ role: 'system', content: 'test' }],
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional extractedInsights', () => {
      const result = sendMessageSchema.safeParse({
        ...validData,
        extractedInsights: [{ category: 'motivation', text: 'Wants to be healthy', confidence: 0.9 }],
      });
      expect(result.success).toBe(true);
    });

    it('should reject insight with confidence out of range', () => {
      const result = sendMessageSchema.safeParse({
        ...validData,
        extractedInsights: [{ category: 'motivation', text: 'test', confidence: 1.5 }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject insight with invalid category', () => {
      const result = sendMessageSchema.safeParse({
        ...validData,
        extractedInsights: [{ category: 'invalid', text: 'test', confidence: 0.5 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('completeAssessmentSchema', () => {
    const validData = {
      goal: validGoal,
      conversationHistory: [{ role: 'user' as const, content: 'My assessment' }],
      extractedInsights: [{ category: 'goal' as const, text: 'Lose 10kg', confidence: 0.8 }],
    };

    it('should accept valid assessment data', () => {
      const result = completeAssessmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty conversation history', () => {
      const result = completeAssessmentSchema.safeParse({
        ...validData,
        conversationHistory: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing extractedInsights', () => {
      const { extractedInsights: _extractedInsights, ...rest } = validData;
      const result = completeAssessmentSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('generateGoalsSchema', () => {
    it('should accept minimal valid data', () => {
      const result = generateGoalsSchema.safeParse({ goalCategory: validGoal });
      expect(result.success).toBe(true);
    });

    it('should apply default empty arrays for assessmentResponses', () => {
      const result = generateGoalsSchema.safeParse({ goalCategory: validGoal });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assessmentResponses).toEqual([]);
      }
    });

    it('should accept body stats within valid ranges', () => {
      const result = generateGoalsSchema.safeParse({
        goalCategory: validGoal,
        bodyStats: { heightCm: 175, weightKg: 80, age: 30, gender: 'male' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject height below 50cm', () => {
      const result = generateGoalsSchema.safeParse({
        goalCategory: validGoal,
        bodyStats: { heightCm: 20 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject height above 300cm', () => {
      const result = generateGoalsSchema.safeParse({
        goalCategory: validGoal,
        bodyStats: { heightCm: 350 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject weight below 20kg', () => {
      const result = generateGoalsSchema.safeParse({
        goalCategory: validGoal,
        bodyStats: { weightKg: 10 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject age below 13', () => {
      const result = generateGoalsSchema.safeParse({
        goalCategory: validGoal,
        bodyStats: { age: 5 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject age above 120', () => {
      const result = generateGoalsSchema.safeParse({
        goalCategory: validGoal,
        bodyStats: { age: 150 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject customGoalText over 500 characters', () => {
      const result = generateGoalsSchema.safeParse({
        goalCategory: validGoal,
        customGoalText: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('sessionSchema', () => {
    it('should accept valid session data', () => {
      const result = sessionSchema.safeParse({ goal: validGoal });
      expect(result.success).toBe(true);
    });

    it('should accept optional sessionType', () => {
      const result = sessionSchema.safeParse({ goal: validGoal, sessionType: 'coaching' });
      expect(result.success).toBe(true);
    });

    it('should reject sessionType over 50 characters', () => {
      const result = sessionSchema.safeParse({ goal: validGoal, sessionType: 'A'.repeat(51) });
      expect(result.success).toBe(false);
    });
  });

  describe('chatSchema', () => {
    it('should accept valid chat data', () => {
      const result = chatSchema.safeParse({ message: 'Hello coach', goal: validGoal });
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const result = chatSchema.safeParse({ message: '', goal: validGoal });
      expect(result.success).toBe(false);
    });

    it('should reject message over 2000 characters', () => {
      const result = chatSchema.safeParse({ message: 'A'.repeat(2001), goal: validGoal });
      expect(result.success).toBe(false);
    });

    it('should accept optional sessionId UUID', () => {
      const result = chatSchema.safeParse({
        message: 'Hello',
        goal: validGoal,
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid sessionId', () => {
      const result = chatSchema.safeParse({
        message: 'Hello',
        goal: validGoal,
        sessionId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('generateDietPlanSchema', () => {
    it('should accept minimal valid data', () => {
      const result = generateDietPlanSchema.safeParse({ goal: validGoal });
      expect(result.success).toBe(true);
    });

    it('should accept preferences with dietary restrictions', () => {
      const result = generateDietPlanSchema.safeParse({
        goal: validGoal,
        preferences: {
          dietaryRestrictions: ['vegetarian'],
          mealsPerDay: 3,
          budget: 'medium',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject mealsPerDay below 1', () => {
      const result = generateDietPlanSchema.safeParse({
        goal: validGoal,
        preferences: { mealsPerDay: 0 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject mealsPerDay above 6', () => {
      const result = generateDietPlanSchema.safeParse({
        goal: validGoal,
        preferences: { mealsPerDay: 7 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid budget value', () => {
      const result = generateDietPlanSchema.safeParse({
        goal: validGoal,
        preferences: { budget: 'unlimited' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('analyzeImageSchema', () => {
    it('should accept empty object', () => {
      const result = analyzeImageSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept optional question', () => {
      const result = analyzeImageSchema.safeParse({ question: 'What food is this?' });
      expect(result.success).toBe(true);
    });

    it('should reject question over 500 characters', () => {
      const result = analyzeImageSchema.safeParse({ question: 'A'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  describe('chatWithImageSchema', () => {
    it('should accept valid data', () => {
      const result = chatWithImageSchema.safeParse({ goal: validGoal });
      expect(result.success).toBe(true);
    });

    it('should accept optional message', () => {
      const result = chatWithImageSchema.safeParse({ goal: validGoal, message: 'Analyze this' });
      expect(result.success).toBe(true);
    });

    it('should reject message over 2000 characters', () => {
      const result = chatWithImageSchema.safeParse({ goal: validGoal, message: 'A'.repeat(2001) });
      expect(result.success).toBe(false);
    });
  });
});
