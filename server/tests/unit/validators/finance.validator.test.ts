/**
 * Finance Validator Unit Tests
 */

import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
  createBudgetSchema,
  updateBudgetSchema,
  createSavingGoalSchema,
  updateSavingGoalSchema,
  contributeToGoalSchema,
  analyticsQuerySchema,
  aiCoachMessageSchema,
  updateProfileSchema,
} from '../../../src/validators/finance.validator.js';

describe('Finance Validators', () => {
  describe('createTransactionSchema', () => {
    const validData = {
      amount: 49.99,
      transactionType: 'expense' as const,
      category: 'food' as const,
      title: 'Grocery shopping',
    };

    it('should accept valid transaction data', () => {
      const result = createTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject zero amount', () => {
      const result = createTransactionSchema.safeParse({ ...validData, amount: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = createTransactionSchema.safeParse({ ...validData, amount: -10 });
      expect(result.success).toBe(false);
    });

    it('should reject amount exceeding maximum', () => {
      const result = createTransactionSchema.safeParse({ ...validData, amount: 1000000000 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid transactionType', () => {
      const result = createTransactionSchema.safeParse({ ...validData, transactionType: 'transfer' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid categories', () => {
      const categories = [
        'food', 'transport', 'bills', 'health', 'entertainment',
        'shopping', 'subscriptions', 'savings', 'education',
        'salary', 'freelance', 'investments', 'other',
      ];
      for (const category of categories) {
        const result = createTransactionSchema.safeParse({ ...validData, category });
        expect(result.success).toBe(true);
      }
    });

    it('should reject empty title', () => {
      const result = createTransactionSchema.safeParse({ ...validData, title: '' });
      expect(result.success).toBe(false);
    });

    it('should reject title over 255 characters', () => {
      const result = createTransactionSchema.safeParse({ ...validData, title: 'A'.repeat(256) });
      expect(result.success).toBe(false);
    });

    it('should accept valid transactionDate format', () => {
      const result = createTransactionSchema.safeParse({
        ...validData,
        transactionDate: '2025-03-15',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid transactionDate format', () => {
      const result = createTransactionSchema.safeParse({
        ...validData,
        transactionDate: '15-03-2025',
      });
      expect(result.success).toBe(false);
    });

    it('should accept tags array', () => {
      const result = createTransactionSchema.safeParse({
        ...validData,
        tags: ['groceries', 'weekly'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject more than 10 tags', () => {
      const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
      const result = createTransactionSchema.safeParse({ ...validData, tags });
      expect(result.success).toBe(false);
    });

    it('should reject tag over 50 characters', () => {
      const result = createTransactionSchema.safeParse({
        ...validData,
        tags: ['A'.repeat(51)],
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional recurring fields', () => {
      const result = createTransactionSchema.safeParse({
        ...validData,
        isRecurring: true,
        recurringInterval: 'monthly',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateTransactionSchema', () => {
    it('should accept partial update', () => {
      const result = updateTransactionSchema.safeParse({ amount: 75.00 });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (all fields optional)', () => {
      const result = updateTransactionSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('listTransactionsQuerySchema', () => {
    it('should accept empty query (all optional)', () => {
      const result = listTransactionsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid date range', () => {
      const result = listTransactionsQuerySchema.safeParse({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should transform page string to number', () => {
      const result = listTransactionsQuerySchema.safeParse({ page: '3' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
      }
    });

    it('should reject page of 0', () => {
      const result = listTransactionsQuerySchema.safeParse({ page: '0' });
      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = listTransactionsQuerySchema.safeParse({ limit: '101' });
      expect(result.success).toBe(false);
    });

    it('should accept search query', () => {
      const result = listTransactionsQuerySchema.safeParse({ search: 'grocery' });
      expect(result.success).toBe(true);
    });
  });

  describe('createBudgetSchema', () => {
    const validData = {
      category: 'food' as const,
      monthlyLimit: 500,
      month: '2025-03',
    };

    it('should accept valid budget data', () => {
      const result = createBudgetSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative monthlyLimit', () => {
      const result = createBudgetSchema.safeParse({ ...validData, monthlyLimit: -100 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid month format', () => {
      const result = createBudgetSchema.safeParse({ ...validData, month: '2025/03' });
      expect(result.success).toBe(false);
    });

    it('should accept alertThreshold between 1 and 100', () => {
      const result = createBudgetSchema.safeParse({ ...validData, alertThreshold: 80 });
      expect(result.success).toBe(true);
    });

    it('should reject alertThreshold above 100', () => {
      const result = createBudgetSchema.safeParse({ ...validData, alertThreshold: 101 });
      expect(result.success).toBe(false);
    });

    it('should reject alertThreshold below 1', () => {
      const result = createBudgetSchema.safeParse({ ...validData, alertThreshold: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateBudgetSchema', () => {
    it('should accept partial update', () => {
      const result = updateBudgetSchema.safeParse({ monthlyLimit: 600 });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateBudgetSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('createSavingGoalSchema', () => {
    it('should accept valid saving goal', () => {
      const result = createSavingGoalSchema.safeParse({
        title: 'Emergency Fund',
        targetAmount: 10000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = createSavingGoalSchema.safeParse({
        title: '',
        targetAmount: 10000,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative targetAmount', () => {
      const result = createSavingGoalSchema.safeParse({
        title: 'Goal',
        targetAmount: -100,
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional deadline', () => {
      const result = createSavingGoalSchema.safeParse({
        title: 'Goal',
        targetAmount: 5000,
        deadline: '2025-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('should accept optional emoji', () => {
      const result = createSavingGoalSchema.safeParse({
        title: 'Vacation',
        targetAmount: 3000,
        emoji: '✈️',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateSavingGoalSchema', () => {
    it('should accept status update', () => {
      const result = updateSavingGoalSchema.safeParse({ status: 'achieved' });
      expect(result.success).toBe(true);
    });

    it('should accept all valid statuses', () => {
      for (const status of ['in_progress', 'achieved', 'paused']) {
        const result = updateSavingGoalSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid status', () => {
      const result = updateSavingGoalSchema.safeParse({ status: 'deleted' });
      expect(result.success).toBe(false);
    });

    it('should accept nullable deadline', () => {
      const result = updateSavingGoalSchema.safeParse({ deadline: null });
      expect(result.success).toBe(true);
    });
  });

  describe('contributeToGoalSchema', () => {
    it('should accept positive amount', () => {
      const result = contributeToGoalSchema.safeParse({ amount: 100 });
      expect(result.success).toBe(true);
    });

    it('should reject zero amount', () => {
      const result = contributeToGoalSchema.safeParse({ amount: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = contributeToGoalSchema.safeParse({ amount: -50 });
      expect(result.success).toBe(false);
    });
  });

  describe('analyticsQuerySchema', () => {
    it('should accept empty query', () => {
      const result = analyticsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept date range', () => {
      const result = analyticsQuerySchema.safeParse({
        startDate: '2025-01-01',
        endDate: '2025-03-31',
      });
      expect(result.success).toBe(true);
    });

    it('should transform months string to number', () => {
      const result = analyticsQuerySchema.safeParse({ months: '6' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.months).toBe(6);
      }
    });

    it('should reject months over 24', () => {
      const result = analyticsQuerySchema.safeParse({ months: '25' });
      expect(result.success).toBe(false);
    });
  });

  describe('aiCoachMessageSchema', () => {
    it('should accept valid message', () => {
      const result = aiCoachMessageSchema.safeParse({ message: 'How can I save more?' });
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const result = aiCoachMessageSchema.safeParse({ message: '' });
      expect(result.success).toBe(false);
    });

    it('should reject message over 500 characters', () => {
      const result = aiCoachMessageSchema.safeParse({ message: 'A'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('should accept valid profile update', () => {
      const result = updateProfileSchema.safeParse({
        currency: 'EUR',
        monthlyIncome: 5000,
      });
      expect(result.success).toBe(true);
    });

    it('should reject currency not exactly 3 characters', () => {
      const result = updateProfileSchema.safeParse({ currency: 'US' });
      expect(result.success).toBe(false);
    });

    it('should reject negative monthlyIncome', () => {
      const result = updateProfileSchema.safeParse({ monthlyIncome: -100 });
      expect(result.success).toBe(false);
    });

    it('should accept nullable budgetLimit', () => {
      const result = updateProfileSchema.safeParse({ budgetLimit: null });
      expect(result.success).toBe(true);
    });

    it('should accept aiInsightsEnabled boolean', () => {
      const result = updateProfileSchema.safeParse({ aiInsightsEnabled: true });
      expect(result.success).toBe(true);
    });
  });
});
