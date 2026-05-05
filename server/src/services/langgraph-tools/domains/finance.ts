import { z } from 'zod';
import { financeService } from '../../finance.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling, successResponse } from '../utils.js';

const GetFinancialSummarySchema = z.object({
  startDate: z.string().optional().describe('Start date (YYYY-MM-DD). Defaults to first of current month.'),
  endDate: z.string().optional().describe('End date (YYYY-MM-DD). Defaults to today.'),
});

const GetMonthlySummarySchema = z.object({
  month: z.string().optional().describe('Month in YYYY-MM format. Defaults to current month.'),
});

const GetCategoryBreakdownSchema = z.object({
  month: z.string().optional().describe('Month in YYYY-MM format. Defaults to current month.'),
});

const GetSpendingTrendsSchema = z.object({
  months: z.number().optional().describe('Number of months of history (default 6, max 12).'),
});

const GetBudgetsSchema = z.object({
  month: z.string().optional().describe('Month in YYYY-MM format. Defaults to current month.'),
});

const GetRecentTransactionsSchema = z.object({
  category: z.string().optional().describe('Filter by category (e.g. food, transport, bills, shopping).'),
  transactionType: z.string().optional().describe('Filter by type: income or expense.'),
  startDate: z.string().optional().describe('Start date (YYYY-MM-DD).'),
  endDate: z.string().optional().describe('End date (YYYY-MM-DD).'),
  limit: z.number().optional().describe('Max results (default 20, max 50).'),
});

const LogTransactionSchema = z.object({
  amount: z.number().describe('Transaction amount (required).'),
  transactionType: z.enum(['income', 'expense']).describe('Whether this is income or an expense (required).'),
  category: z.string().describe('Category: food, transport, bills, health, entertainment, shopping, subscriptions, education, salary, freelance, investments, savings, other (required).'),
  title: z.string().describe('Short description of the transaction (required).'),
  description: z.string().optional().describe('Optional longer description.'),
  transactionDate: z.string().optional().describe('Date in YYYY-MM-DD format. Defaults to today.'),
});

const GetSavingGoalsSchema = z.object({});

const GetBudgetAlertsSchema = z.object({});

const GetMonthComparisonSchema = z.object({});

const GetFinancialForecastSchema = z.object({});

const UpdateTransactionSchema = z.object({
  transactionId: z.string().uuid().describe('Transaction ID to update (required).'),
  amount: z.number().optional().describe('Updated amount.'),
  transactionType: z.enum(['income', 'expense']).optional().describe('Updated type.'),
  category: z.string().optional().describe('Updated category.'),
  title: z.string().optional().describe('Updated title.'),
  description: z.string().optional().describe('Updated description.'),
  transactionDate: z.string().optional().describe('Updated date (YYYY-MM-DD).'),
});

const DeleteTransactionSchema = z.object({
  transactionId: z.string().uuid().describe('Transaction ID to delete (required).'),
});

const CreateBudgetSchema = z.object({
  category: z.string().describe('Budget category (e.g. food, transport, entertainment) (required).'),
  monthlyLimit: z.number().describe('Monthly spending limit (required).'),
  alertThreshold: z.number().optional().describe('Alert when spending reaches this percentage (default 80).'),
  month: z.string().optional().describe('Month in YYYY-MM format. Defaults to current month.'),
});

const UpdateBudgetSchema = z.object({
  budgetId: z.string().uuid().describe('Budget ID to update (required).'),
  monthlyLimit: z.number().optional().describe('Updated monthly limit.'),
  alertThreshold: z.number().optional().describe('Updated alert threshold percentage.'),
});

const DeleteBudgetSchema = z.object({
  budgetId: z.string().uuid().describe('Budget ID to delete (required).'),
});

const CreateSavingGoalSchema = z.object({
  name: z.string().describe('Saving goal name (required).'),
  targetAmount: z.number().describe('Target amount to save (required).'),
  deadline: z.string().optional().describe('Target date in YYYY-MM-DD format.'),
});

const UpdateSavingGoalSchema = z.object({
  goalId: z.string().uuid().describe('Saving goal ID to update (required).'),
  name: z.string().optional().describe('Updated name.'),
  targetAmount: z.number().optional().describe('Updated target amount.'),
  deadline: z.string().optional().describe('Updated deadline (YYYY-MM-DD).'),
});

const DeleteSavingGoalSchema = z.object({
  goalId: z.string().uuid().describe('Saving goal ID to delete (required).'),
});

async function getFinancialSummary(userId: string, params: z.infer<typeof GetFinancialSummarySchema>): Promise<string> {
  const summary = await financeService.getTransactionSummary(userId, params.startDate, params.endDate);
  return successResponse({ summary });
}

async function getMonthlySummaryTool(userId: string, params: z.infer<typeof GetMonthlySummarySchema>): Promise<string> {
  const summary = await financeService.getMonthlySummary(userId, params.month);
  return successResponse({ summary });
}

async function getCategoryBreakdown(userId: string, params: z.infer<typeof GetCategoryBreakdownSchema>): Promise<string> {
  const breakdown = await financeService.getCategoryBreakdown(userId, params.month);
  return successResponse({ breakdown });
}

async function getSpendingTrends(userId: string, params: z.infer<typeof GetSpendingTrendsSchema>): Promise<string> {
  const months = Math.min(params.months || 6, 12);
  const trends = await financeService.getSpendingTrends(userId, months);
  return successResponse({ trends });
}

async function getMonthComparison(userId: string): Promise<string> {
  const comparison = await financeService.getMonthComparison(userId);
  return successResponse({ comparison });
}

async function getFinancialForecast(userId: string): Promise<string> {
  const forecast = await financeService.getForecast(userId);
  return successResponse({ forecast });
}

async function getBudgets(userId: string, params: z.infer<typeof GetBudgetsSchema>): Promise<string> {
  const budgets = await financeService.getBudgets(userId, params.month);
  return successResponse({ budgets });
}

async function getBudgetAlerts(userId: string): Promise<string> {
  const alerts = await financeService.getBudgetAlerts(userId);
  return successResponse({ alerts });
}

async function getSavingGoals(userId: string): Promise<string> {
  const goals = await financeService.getGoals(userId);
  return successResponse({ goals });
}

async function getRecentTransactions(userId: string, params: z.infer<typeof GetRecentTransactionsSchema>): Promise<string> {
  const result = await financeService.getTransactions(userId, {
    category: params.category,
    transactionType: params.transactionType,
    startDate: params.startDate,
    endDate: params.endDate,
    limit: Math.min(params.limit || 20, 50),
  });
  return successResponse({ transactions: result.transactions, total: result.total });
}

async function logTransaction(userId: string, params: z.infer<typeof LogTransactionSchema>): Promise<string> {
  const transaction = await financeService.createTransaction(userId, {
    amount: params.amount,
    transactionType: params.transactionType,
    category: params.category,
    title: params.title,
    description: params.description,
    transactionDate: params.transactionDate,
  });
  return successResponse({ transaction, message: 'Transaction logged successfully.' });
}

async function updateTransactionTool(userId: string, params: z.infer<typeof UpdateTransactionSchema>): Promise<string> {
  const transaction = await financeService.updateTransaction(userId, params.transactionId, {
    amount: params.amount,
    transactionType: params.transactionType,
    category: params.category,
    title: params.title,
    description: params.description,
    transactionDate: params.transactionDate,
  });
  if (!transaction) return JSON.stringify({ success: false, error: 'Transaction not found' });
  return successResponse({ transaction, message: 'Transaction updated.' });
}

async function deleteTransactionTool(userId: string, params: z.infer<typeof DeleteTransactionSchema>): Promise<string> {
  await financeService.deleteTransaction(userId, params.transactionId);
  return successResponse({ message: 'Transaction deleted.' });
}

async function createBudgetTool(userId: string, params: z.infer<typeof CreateBudgetSchema>): Promise<string> {
  const month = params.month || new Date().toISOString().slice(0, 7);
  const budget = await financeService.createBudget(userId, {
    category: params.category,
    monthlyLimit: params.monthlyLimit,
    alertThreshold: params.alertThreshold,
    month,
  });
  return successResponse({ budget, message: 'Budget created.' });
}

async function updateBudgetTool(userId: string, params: z.infer<typeof UpdateBudgetSchema>): Promise<string> {
  const budget = await financeService.updateBudget(userId, params.budgetId, {
    monthlyLimit: params.monthlyLimit,
    alertThreshold: params.alertThreshold,
  });
  if (!budget) return JSON.stringify({ success: false, error: 'Budget not found' });
  return successResponse({ budget, message: 'Budget updated.' });
}

async function deleteBudgetTool(userId: string, params: z.infer<typeof DeleteBudgetSchema>): Promise<string> {
  await financeService.deleteBudget(userId, params.budgetId);
  return successResponse({ message: 'Budget deleted.' });
}

async function createSavingGoalTool(userId: string, params: z.infer<typeof CreateSavingGoalSchema>): Promise<string> {
  const goal = await financeService.createGoal(userId, {
    title: params.name,
    targetAmount: params.targetAmount,
    deadline: params.deadline,
  });
  return successResponse({ goal, message: 'Saving goal created.' });
}

async function updateSavingGoalTool(userId: string, params: z.infer<typeof UpdateSavingGoalSchema>): Promise<string> {
  const goal = await financeService.updateGoal(userId, params.goalId, {
    title: params.name,
    targetAmount: params.targetAmount,
    deadline: params.deadline,
  });
  if (!goal) return JSON.stringify({ success: false, error: 'Saving goal not found' });
  return successResponse({ goal, message: 'Saving goal updated.' });
}

async function deleteSavingGoalTool(userId: string, params: z.infer<typeof DeleteSavingGoalSchema>): Promise<string> {
  await financeService.deleteGoal(userId, params.goalId);
  return successResponse({ message: 'Saving goal deleted.' });
}

export function registerFinanceTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getFinancialSummary',
      description: 'Get financial summary (total income, expenses, net cash flow) for a date range. Defaults to current month.',
      schema: GetFinancialSummarySchema,
      handler: withErrorHandling('getFinancialSummary', getFinancialSummary),
    },
    {
      name: 'getMonthlySummary',
      description: 'Get detailed monthly financial summary including income, expenses, net savings, month-over-month delta, and category breakdown.',
      schema: GetMonthlySummarySchema,
      handler: withErrorHandling('getMonthlySummary', getMonthlySummaryTool),
    },
    {
      name: 'getSpendingByCategory',
      description: 'Get spending breakdown by category for a month, with amounts and percentages.',
      schema: GetCategoryBreakdownSchema,
      handler: withErrorHandling('getSpendingByCategory', getCategoryBreakdown),
    },
    {
      name: 'getSpendingTrends',
      description: 'Get income vs expense trends over the last N months (default 6).',
      schema: GetSpendingTrendsSchema,
      handler: withErrorHandling('getSpendingTrends', getSpendingTrends),
    },
    {
      name: 'getMonthComparison',
      description: 'Compare current month vs previous month financials (income, expenses, savings, percentage change).',
      schema: GetMonthComparisonSchema,
      handler: withErrorHandling('getMonthComparison', getMonthComparison),
    },
    {
      name: 'getFinancialForecast',
      description: 'Get end-of-month spending forecast based on current daily burn rate, with per-category projections.',
      schema: GetFinancialForecastSchema,
      handler: withErrorHandling('getFinancialForecast', getFinancialForecast),
    },
    {
      name: 'getBudgets',
      description: 'Get all active budgets with current spend vs monthly limit for each category.',
      schema: GetBudgetsSchema,
      handler: withErrorHandling('getBudgets', getBudgets),
    },
    {
      name: 'getBudgetAlerts',
      description: 'Get budgets that have exceeded their alert threshold (typically 80%+ of limit).',
      schema: GetBudgetAlertsSchema,
      handler: withErrorHandling('getBudgetAlerts', getBudgetAlerts),
    },
    {
      name: 'getSavingGoals',
      description: 'Get all saving goals with current progress, target amounts, and deadlines.',
      schema: GetSavingGoalsSchema,
      handler: withErrorHandling('getSavingGoals', getSavingGoals),
    },
    {
      name: 'getRecentTransactions',
      description: 'Get recent transactions with optional filters for category, type (income/expense), and date range.',
      schema: GetRecentTransactionsSchema,
      handler: withErrorHandling('getRecentTransactions', getRecentTransactions),
    },
    {
      name: 'logTransaction',
      description: 'Log a new income or expense transaction. Automatically updates budget tracking.',
      schema: LogTransactionSchema,
      handler: withErrorHandling('logTransaction', logTransaction),
    },
    {
      name: 'updateTransaction',
      description: 'Update an existing transaction. Use when the user wants to correct amount, category, or description.',
      schema: UpdateTransactionSchema,
      mutationType: 'update',
      semanticDelta: (params: any) => `Updated transaction ${params.transactionId}`,
      handler: withErrorHandling('updateTransaction', updateTransactionTool),
    },
    {
      name: 'deleteTransaction',
      description: 'Delete a transaction. Use when the user wants to remove an erroneous entry.',
      schema: DeleteTransactionSchema,
      mutationType: 'delete',
      semanticDelta: () => 'Deleted transaction',
      handler: withErrorHandling('deleteTransaction', deleteTransactionTool),
    },
    {
      name: 'createBudget',
      description: 'Create a monthly budget for a spending category with an optional alert threshold.',
      schema: CreateBudgetSchema,
      mutationType: 'create',
      semanticDelta: (params: any) => `Created budget for ${params.category}`,
      handler: withErrorHandling('createBudget', createBudgetTool),
    },
    {
      name: 'updateBudget',
      description: 'Update an existing budget limit or alert threshold.',
      schema: UpdateBudgetSchema,
      mutationType: 'update',
      semanticDelta: (params: any) => `Updated budget ${params.budgetId}`,
      handler: withErrorHandling('updateBudget', updateBudgetTool),
    },
    {
      name: 'deleteBudget',
      description: 'Delete a budget. Use when the user no longer wants to track a category.',
      schema: DeleteBudgetSchema,
      mutationType: 'delete',
      semanticDelta: () => 'Deleted budget',
      handler: withErrorHandling('deleteBudget', deleteBudgetTool),
    },
    {
      name: 'createSavingGoal',
      description: 'Create a saving goal with a target amount and optional deadline.',
      schema: CreateSavingGoalSchema,
      mutationType: 'create',
      semanticDelta: (params: any) => `Created saving goal: ${params.name}`,
      handler: withErrorHandling('createSavingGoal', createSavingGoalTool),
    },
    {
      name: 'updateSavingGoal',
      description: 'Update a saving goal name, target, or deadline.',
      schema: UpdateSavingGoalSchema,
      mutationType: 'update',
      semanticDelta: (params: any) => `Updated saving goal ${params.goalId}`,
      handler: withErrorHandling('updateSavingGoal', updateSavingGoalTool),
    },
    {
      name: 'deleteSavingGoal',
      description: 'Delete a saving goal.',
      schema: DeleteSavingGoalSchema,
      mutationType: 'delete',
      semanticDelta: () => 'Deleted saving goal',
      handler: withErrorHandling('deleteSavingGoal', deleteSavingGoalTool),
    },
  ];
}
