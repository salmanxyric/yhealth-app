/**
 * Finance Controller Unit Tests
 *
 * Tests all exported handlers: profile (get/update), transactions (CRUD + summary),
 * analytics (monthly, category, trends, comparison, forecast), budgets (CRUD + alerts),
 * goals (CRUD + contribute + projection), insights, AI coach chat, receipt scanning.
 */

import { jest } from '@jest/globals';

// 1. Infrastructure mocks
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

setupDbMock();
setupLoggerMock();
setupCacheMock();

// 2. Mock finance service
const mockFinanceService = {
  getOrCreateProfile: jest.fn<any>(),
  updateProfile: jest.fn<any>(),
  createTransaction: jest.fn<any>(),
  getTransactions: jest.fn<any>(),
  getTransaction: jest.fn<any>(),
  updateTransaction: jest.fn<any>(),
  deleteTransaction: jest.fn<any>(),
  getTransactionSummary: jest.fn<any>(),
  getMonthlySummary: jest.fn<any>(),
  getCategoryBreakdown: jest.fn<any>(),
  getSpendingTrends: jest.fn<any>(),
  getMonthComparison: jest.fn<any>(),
  getForecast: jest.fn<any>(),
  getBudgets: jest.fn<any>(),
  createBudget: jest.fn<any>(),
  updateBudget: jest.fn<any>(),
  deleteBudget: jest.fn<any>(),
  getBudgetAlerts: jest.fn<any>(),
  getGoals: jest.fn<any>(),
  createGoal: jest.fn<any>(),
  updateGoal: jest.fn<any>(),
  deleteGoal: jest.fn<any>(),
  contributeToGoal: jest.fn<any>(),
  getGoalProjection: jest.fn<any>(),
  getActiveInsights: jest.fn<any>(),
  dismissInsight: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/finance.service.js', () => ({
  financeService: mockFinanceService,
}));

// 3. Mock ai-provider service (used by scanReceipt at top-level import + aiCoachChat dynamic import)
const mockAiProviderService = {
  generateCompletion: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/ai-provider.service.js', () => ({
  aiProviderService: mockAiProviderService,
}));

// 4. Dynamic imports (AFTER mocks)
const {
  getProfile,
  updateProfile,
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
  getMonthlySummary,
  getCategoryBreakdown,
  getSpendingTrends,
  getMonthComparison,
  getForecast,
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetAlerts,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
  getGoalProjection,
  getInsights,
  dismissInsight,
  aiCoachChat,
  scanReceipt,
} = await import('../../../src/controllers/finance.controller.js');

const { createAuthReq, createRes, createNext, callHandler, getJsonBody, getStatus } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => {
  jest.clearAllMocks();
});

// Helper: assert 401 for unauthenticated requests
async function expectUnauth(handler: (...args: unknown[]) => unknown) {
  const req = createAuthReq();
  (req as any).user = undefined;
  const res = createRes();
  const next = createNext();

  await callHandler(handler, req, res, next);

  expect(next).toHaveBeenCalled();
  const error = (next as jest.Mock<any>).mock.calls[0][0];
  expect(error.statusCode).toBe(401);
}

// ─── PROFILE ────────────────────────────────────────────────

describe('getProfile', () => {
  it('should return user profile', async () => {
    const profile = { id: 'p1', currency: 'USD' };
    mockFinanceService.getOrCreateProfile.mockResolvedValue(profile);

    const req = createAuthReq({ userId: 'user-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getProfile, req, res, next);

    expect(mockFinanceService.getOrCreateProfile).toHaveBeenCalledWith('user-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(profile);
    expect(body.message).toBe('Profile retrieved');
  });

  it('should throw 401 when not authenticated', async () => {
    await expectUnauth(getProfile);
  });
});

describe('updateProfile', () => {
  it('should update and return profile', async () => {
    const updated = { id: 'p1', currency: 'EUR' };
    mockFinanceService.updateProfile.mockResolvedValue(updated);

    const req = createAuthReq({ userId: 'user-1' }, { body: { currency: 'EUR' } });
    const res = createRes();
    const next = createNext();

    await callHandler(updateProfile, req, res, next);

    expect(mockFinanceService.updateProfile).toHaveBeenCalledWith('user-1', { currency: 'EUR' });
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(updated);
  });

  it('should throw 401 when not authenticated', async () => {
    await expectUnauth(updateProfile);
  });
});

// ─── TRANSACTIONS ───────────────────────────────────────────

describe('createTransaction', () => {
  it('should create a transaction', async () => {
    const tx = { id: 'tx-1', amount: 50 };
    mockFinanceService.createTransaction.mockResolvedValue(tx);

    const req = createAuthReq({ userId: 'user-1' }, { body: { amount: 50, category: 'food' } });
    const res = createRes();
    const next = createNext();

    await callHandler(createTransaction, req, res, next);

    expect(mockFinanceService.createTransaction).toHaveBeenCalledWith('user-1', { amount: 50, category: 'food' });
    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.data).toEqual(tx);
    expect(body.message).toBe('Transaction created');
  });
});

describe('getTransactions', () => {
  it('should return transactions with filters', async () => {
    const result = { transactions: [], total: 0 };
    mockFinanceService.getTransactions.mockResolvedValue(result);

    const req = createAuthReq({ userId: 'user-1' }, {
      query: { category: 'food', page: '2', limit: '10', search: 'lunch' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(getTransactions, req, res, next);

    expect(mockFinanceService.getTransactions).toHaveBeenCalledWith('user-1', {
      category: 'food',
      transactionType: undefined,
      startDate: undefined,
      endDate: undefined,
      search: 'lunch',
      page: 2,
      limit: 10,
    });
    expect(getStatus(res)).toBe(200);
  });

  it('should use undefined for missing query params', async () => {
    mockFinanceService.getTransactions.mockResolvedValue({ transactions: [] });

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getTransactions, req, res, next);

    expect(mockFinanceService.getTransactions).toHaveBeenCalledWith('user-1', {
      category: undefined,
      transactionType: undefined,
      startDate: undefined,
      endDate: undefined,
      search: undefined,
      page: undefined,
      limit: undefined,
    });
  });
});

describe('getTransaction', () => {
  it('should return a single transaction', async () => {
    const tx = { id: 'tx-1', amount: 25 };
    mockFinanceService.getTransaction.mockResolvedValue(tx);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'tx-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getTransaction, req, res, next);

    expect(mockFinanceService.getTransaction).toHaveBeenCalledWith('user-1', 'tx-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(tx);
  });

  it('should throw 404 when not found', async () => {
    mockFinanceService.getTransaction.mockResolvedValue(null);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'missing' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getTransaction, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });
});

describe('updateTransaction', () => {
  it('should update a transaction', async () => {
    const updated = { id: 'tx-1', amount: 100 };
    mockFinanceService.updateTransaction.mockResolvedValue(updated);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'tx-1' }, body: { amount: 100 } });
    const res = createRes();
    const next = createNext();

    await callHandler(updateTransaction, req, res, next);

    expect(mockFinanceService.updateTransaction).toHaveBeenCalledWith('user-1', 'tx-1', { amount: 100 });
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(updated);
  });
});

describe('deleteTransaction', () => {
  it('should delete a transaction', async () => {
    mockFinanceService.deleteTransaction.mockResolvedValue(undefined);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'tx-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(deleteTransaction, req, res, next);

    expect(mockFinanceService.deleteTransaction).toHaveBeenCalledWith('user-1', 'tx-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toBeNull();
  });
});

describe('getTransactionSummary', () => {
  it('should return summary with date range', async () => {
    const summary = { totalIncome: 5000, totalExpense: 3000 };
    mockFinanceService.getTransactionSummary.mockResolvedValue(summary);

    const req = createAuthReq({ userId: 'user-1' }, {
      query: { startDate: '2025-01-01', endDate: '2025-01-31' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(getTransactionSummary, req, res, next);

    expect(mockFinanceService.getTransactionSummary).toHaveBeenCalledWith('user-1', '2025-01-01', '2025-01-31');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(summary);
  });

  it('should pass undefined when no date range', async () => {
    mockFinanceService.getTransactionSummary.mockResolvedValue({ totalIncome: 0, totalExpense: 0 });

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getTransactionSummary, req, res, next);

    expect(mockFinanceService.getTransactionSummary).toHaveBeenCalledWith('user-1', undefined, undefined);
  });
});

// ─── ANALYTICS ──────────────────────────────────────────────

describe('getMonthlySummary', () => {
  it('should return monthly summary', async () => {
    const summary = { income: 5000, expense: 3000 };
    mockFinanceService.getMonthlySummary.mockResolvedValue(summary);

    const req = createAuthReq({ userId: 'user-1' }, { query: { month: '2025-01' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getMonthlySummary, req, res, next);

    expect(mockFinanceService.getMonthlySummary).toHaveBeenCalledWith('user-1', '2025-01');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(summary);
    expect(body.message).toBe('Monthly summary retrieved');
  });

  it('should throw 401 when not authenticated', async () => {
    await expectUnauth(getMonthlySummary);
  });
});

describe('getCategoryBreakdown', () => {
  it('should return category breakdown', async () => {
    const breakdown = [{ category: 'food', percentage: 40 }];
    mockFinanceService.getCategoryBreakdown.mockResolvedValue(breakdown);

    const req = createAuthReq({ userId: 'user-1' }, { query: { month: '2025-01' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getCategoryBreakdown, req, res, next);

    expect(mockFinanceService.getCategoryBreakdown).toHaveBeenCalledWith('user-1', '2025-01');
    expect(getStatus(res)).toBe(200);
  });
});

describe('getSpendingTrends', () => {
  it('should return spending trends with default months', async () => {
    const trends = [{ month: '2025-01', total: 3000 }];
    mockFinanceService.getSpendingTrends.mockResolvedValue(trends);

    const req = createAuthReq({ userId: 'user-1' }, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getSpendingTrends, req, res, next);

    expect(mockFinanceService.getSpendingTrends).toHaveBeenCalledWith('user-1', 6);
    expect(getStatus(res)).toBe(200);
  });

  it('should use custom months param', async () => {
    mockFinanceService.getSpendingTrends.mockResolvedValue([]);

    const req = createAuthReq({ userId: 'user-1' }, { query: { months: '12' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getSpendingTrends, req, res, next);

    expect(mockFinanceService.getSpendingTrends).toHaveBeenCalledWith('user-1', 12);
  });
});

describe('getMonthComparison', () => {
  it('should return month comparison', async () => {
    const comparison = { current: 3000, previous: 2500 };
    mockFinanceService.getMonthComparison.mockResolvedValue(comparison);

    const req = createAuthReq({ userId: 'user-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getMonthComparison, req, res, next);

    expect(mockFinanceService.getMonthComparison).toHaveBeenCalledWith('user-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.message).toBe('Month comparison retrieved');
  });
});

describe('getForecast', () => {
  it('should return forecast', async () => {
    const forecast = { projectedExpense: 4000 };
    mockFinanceService.getForecast.mockResolvedValue(forecast);

    const req = createAuthReq({ userId: 'user-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getForecast, req, res, next);

    expect(mockFinanceService.getForecast).toHaveBeenCalledWith('user-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(forecast);
  });
});

// ─── BUDGETS ────────────────────────────────────────────────

describe('getBudgets', () => {
  it('should return budgets for a month', async () => {
    const budgets = [{ id: 'b1', category: 'food', monthlyLimit: 500 }];
    mockFinanceService.getBudgets.mockResolvedValue(budgets);

    const req = createAuthReq({ userId: 'user-1' }, { query: { month: '2025-01' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getBudgets, req, res, next);

    expect(mockFinanceService.getBudgets).toHaveBeenCalledWith('user-1', '2025-01');
    expect(getStatus(res)).toBe(200);
  });
});

describe('createBudget', () => {
  it('should create a budget', async () => {
    const budget = { id: 'b1', category: 'food', monthlyLimit: 500 };
    mockFinanceService.createBudget.mockResolvedValue(budget);

    const req = createAuthReq({ userId: 'user-1' }, { body: { category: 'food', monthlyLimit: 500 } });
    const res = createRes();
    const next = createNext();

    await callHandler(createBudget, req, res, next);

    expect(mockFinanceService.createBudget).toHaveBeenCalledWith('user-1', { category: 'food', monthlyLimit: 500 });
    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.message).toBe('Budget created');
  });
});

describe('updateBudget', () => {
  it('should update a budget', async () => {
    const updated = { id: 'b1', monthlyLimit: 600 };
    mockFinanceService.updateBudget.mockResolvedValue(updated);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'b1' }, body: { monthlyLimit: 600 } });
    const res = createRes();
    const next = createNext();

    await callHandler(updateBudget, req, res, next);

    expect(mockFinanceService.updateBudget).toHaveBeenCalledWith('user-1', 'b1', { monthlyLimit: 600 });
    expect(getStatus(res)).toBe(200);
  });
});

describe('deleteBudget', () => {
  it('should delete a budget', async () => {
    mockFinanceService.deleteBudget.mockResolvedValue(undefined);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'b1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(deleteBudget, req, res, next);

    expect(mockFinanceService.deleteBudget).toHaveBeenCalledWith('user-1', 'b1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toBeNull();
  });
});

describe('getBudgetAlerts', () => {
  it('should return budget alerts', async () => {
    const alerts = [{ budgetId: 'b1', exceeded: true }];
    mockFinanceService.getBudgetAlerts.mockResolvedValue(alerts);

    const req = createAuthReq({ userId: 'user-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getBudgetAlerts, req, res, next);

    expect(mockFinanceService.getBudgetAlerts).toHaveBeenCalledWith('user-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(alerts);
  });
});

// ─── SAVING GOALS ───────────────────────────────────────────

describe('getGoals', () => {
  it('should return goals', async () => {
    const goals = [{ id: 'g1', title: 'Emergency fund' }];
    mockFinanceService.getGoals.mockResolvedValue(goals);

    const req = createAuthReq({ userId: 'user-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getGoals, req, res, next);

    expect(mockFinanceService.getGoals).toHaveBeenCalledWith('user-1');
    expect(getStatus(res)).toBe(200);
  });
});

describe('createGoal', () => {
  it('should create a goal', async () => {
    const goal = { id: 'g1', title: 'Vacation', targetAmount: 2000 };
    mockFinanceService.createGoal.mockResolvedValue(goal);

    const req = createAuthReq({ userId: 'user-1' }, { body: { title: 'Vacation', targetAmount: 2000 } });
    const res = createRes();
    const next = createNext();

    await callHandler(createGoal, req, res, next);

    expect(mockFinanceService.createGoal).toHaveBeenCalledWith('user-1', { title: 'Vacation', targetAmount: 2000 });
    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.message).toBe('Goal created');
  });
});

describe('updateGoal', () => {
  it('should update a goal', async () => {
    const updated = { id: 'g1', targetAmount: 3000 };
    mockFinanceService.updateGoal.mockResolvedValue(updated);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'g1' }, body: { targetAmount: 3000 } });
    const res = createRes();
    const next = createNext();

    await callHandler(updateGoal, req, res, next);

    expect(mockFinanceService.updateGoal).toHaveBeenCalledWith('user-1', 'g1', { targetAmount: 3000 });
    expect(getStatus(res)).toBe(200);
  });
});

describe('deleteGoal', () => {
  it('should delete a goal', async () => {
    mockFinanceService.deleteGoal.mockResolvedValue(undefined);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'g1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(deleteGoal, req, res, next);

    expect(mockFinanceService.deleteGoal).toHaveBeenCalledWith('user-1', 'g1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toBeNull();
  });
});

describe('contributeToGoal', () => {
  it('should contribute to a goal', async () => {
    const goal = { id: 'g1', currentAmount: 500 };
    mockFinanceService.contributeToGoal.mockResolvedValue(goal);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'g1' }, body: { amount: 100 } });
    const res = createRes();
    const next = createNext();

    await callHandler(contributeToGoal, req, res, next);

    expect(mockFinanceService.contributeToGoal).toHaveBeenCalledWith('user-1', 'g1', 100);
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.message).toBe('Contribution added');
  });
});

describe('getGoalProjection', () => {
  it('should return projection for a goal', async () => {
    const projection = { estimatedCompletion: '2025-12-01' };
    mockFinanceService.getGoalProjection.mockResolvedValue(projection);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'g1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getGoalProjection, req, res, next);

    expect(mockFinanceService.getGoalProjection).toHaveBeenCalledWith('user-1', 'g1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(projection);
  });
});

// ─── AI INSIGHTS ────────────────────────────────────────────

describe('getInsights', () => {
  it('should return active insights', async () => {
    const insights = [{ id: 'i1', message: 'You overspent on food' }];
    mockFinanceService.getActiveInsights.mockResolvedValue(insights);

    const req = createAuthReq({ userId: 'user-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getInsights, req, res, next);

    expect(mockFinanceService.getActiveInsights).toHaveBeenCalledWith('user-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(insights);
  });
});

describe('dismissInsight', () => {
  it('should dismiss an insight', async () => {
    mockFinanceService.dismissInsight.mockResolvedValue(undefined);

    const req = createAuthReq({ userId: 'user-1' }, { params: { id: 'i1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(dismissInsight, req, res, next);

    expect(mockFinanceService.dismissInsight).toHaveBeenCalledWith('user-1', 'i1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toBeNull();
  });
});

// ─── AI COACH CHAT ──────────────────────────────────────────

describe('aiCoachChat', () => {
  it('should return AI response with financial context', async () => {
    // Setup financial context mocks
    mockFinanceService.getTransactionSummary.mockResolvedValue({ totalIncome: 5000, totalExpense: 3000 });
    mockFinanceService.getBudgets.mockResolvedValue([{ category: 'food', currentSpend: 400, monthlyLimit: 500 }]);
    mockFinanceService.getGoals.mockResolvedValue([{ title: 'Vacation', currentAmount: 500, targetAmount: 2000 }]);
    mockFinanceService.getCategoryBreakdown.mockResolvedValue([{ category: 'food', percentage: 40 }]);

    mockAiProviderService.generateCompletion.mockResolvedValue({
      content: 'Great job saving! Consider reducing food spending.',
      provider: 'openai',
    });

    const req = createAuthReq({ userId: 'user-1' }, { body: { message: 'How am I doing?' } });
    const res = createRes();
    const next = createNext();

    await callHandler(aiCoachChat, req, res, next);

    expect(mockFinanceService.getTransactionSummary).toHaveBeenCalledWith('user-1');
    expect(mockAiProviderService.generateCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        userPrompt: 'How am I doing?',
        maxTokens: 1500,
        temperature: 0.7,
      })
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.reply).toBe('Great job saving! Consider reducing food spending.');
    expect(body.data.provider).toBe('openai');
  });

  it('should throw 400 when message is missing', async () => {
    const req = createAuthReq({ userId: 'user-1' }, { body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(aiCoachChat, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 400 when message is empty string', async () => {
    const req = createAuthReq({ userId: 'user-1' }, { body: { message: '   ' } });
    const res = createRes();
    const next = createNext();

    await callHandler(aiCoachChat, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 401 when not authenticated', async () => {
    await expectUnauth(aiCoachChat);
  });
});

// ─── RECEIPT SCANNING ───────────────────────────────────────

describe('scanReceipt', () => {
  it('should scan receipt and return parsed data', async () => {
    const receiptJson = JSON.stringify({
      vendor: 'Grocery Store',
      total: 45.99,
      category: 'food',
    });
    mockAiProviderService.generateCompletion.mockResolvedValue({
      content: receiptJson,
      provider: 'gemini',
    });

    const req = createAuthReq({ userId: 'user-1' }, { body: { imageBase64: 'base64data' } });
    const res = createRes();
    const next = createNext();

    await callHandler(scanReceipt, req, res, next);

    expect(mockAiProviderService.generateCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        imageBase64: 'base64data',
        maxTokens: 2000,
        temperature: 0.1,
      })
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.receipt.vendor).toBe('Grocery Store');
    expect(body.data.provider).toBe('gemini');
  });

  it('should handle parse failure gracefully', async () => {
    mockAiProviderService.generateCompletion.mockResolvedValue({
      content: 'not valid json at all',
      provider: 'gemini',
    });

    const req = createAuthReq({ userId: 'user-1' }, { body: { imageBase64: 'base64data' } });
    const res = createRes();
    const next = createNext();

    await callHandler(scanReceipt, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.receipt.error).toBe('parse_failed');
    expect(body.data.receipt.rawText).toBeDefined();
  });

  it('should throw 400 when imageBase64 is missing', async () => {
    const req = createAuthReq({ userId: 'user-1' }, { body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(scanReceipt, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 401 when not authenticated', async () => {
    await expectUnauth(scanReceipt);
  });
});
