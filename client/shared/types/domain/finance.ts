/**
 * @file Finance domain types
 * @description Single source of truth for Finance module types
 */

// ============================================
// ENUMS
// ============================================

export type FinanceTransactionType = 'income' | 'expense';

export type FinanceCategory =
  | 'food'
  | 'transport'
  | 'bills'
  | 'health'
  | 'entertainment'
  | 'shopping'
  | 'subscriptions'
  | 'savings'
  | 'education'
  | 'salary'
  | 'freelance'
  | 'investments'
  | 'other';

export type BudgetStatus = 'active' | 'exceeded' | 'healthy';
export type SavingGoalStatus = 'in_progress' | 'achieved' | 'paused';
export type AIInsightType = 'pattern' | 'alert' | 'suggestion' | 'forecast';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ============================================
// CORE MODELS
// ============================================

export interface FinanceProfile {
  id: string;
  userId: string;
  currency: string;
  monthlyIncome: number;
  budgetLimit: number | null;
  timezone: string;
  aiInsightsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransaction {
  id: string;
  userId: string;
  amount: number;
  transactionType: FinanceTransactionType;
  category: FinanceCategory;
  title: string;
  description: string | null;
  transactionDate: string; // YYYY-MM-DD
  isRecurring: boolean;
  recurringInterval: RecurringInterval | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FinanceBudget {
  id: string;
  userId: string;
  category: FinanceCategory;
  monthlyLimit: number;
  currentSpend: number;
  alertThreshold: number;
  month: string; // YYYY-MM
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSavingGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  category: FinanceCategory;
  status: SavingGoalStatus;
  emoji: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceAIInsight {
  id: string;
  userId: string;
  insightType: AIInsightType;
  title: string;
  body: string;
  actionable: boolean;
  relatedCategory: FinanceCategory | null;
  savingsPotential: number | null;
  generatedAt: string;
  expiresAt: string | null;
  dismissed: boolean;
}

export interface FinanceMonthlySnapshot {
  id: string;
  userId: string;
  month: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  categoryBreakdown: Record<FinanceCategory, number>;
  aiSummary: string | null;
  createdAt: string;
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateTransactionInput {
  amount: number;
  transactionType: FinanceTransactionType;
  category: FinanceCategory;
  title: string;
  description?: string;
  transactionDate?: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  tags?: string[];
}

export interface UpdateTransactionInput {
  amount?: number;
  transactionType?: FinanceTransactionType;
  category?: FinanceCategory;
  title?: string;
  description?: string;
  transactionDate?: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  tags?: string[];
}

export interface CreateBudgetInput {
  category: FinanceCategory;
  monthlyLimit: number;
  alertThreshold?: number;
  month: string;
}

export interface CreateSavingGoalInput {
  title: string;
  targetAmount: number;
  deadline?: string;
  category?: FinanceCategory;
  emoji?: string;
}

export interface ContributeToGoalInput {
  amount: number;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface TransactionListResponse {
  transactions: FinanceTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  transactionCount: number;
  period: { start: string; end: string };
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  momDelta: number; // month-over-month % change in expenses
  categoryBreakdown: CategoryBreakdownItem[];
}

export interface CategoryBreakdownItem {
  category: FinanceCategory;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface SpendingTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface BudgetAlert {
  budgetId: string;
  category: FinanceCategory;
  monthlyLimit: number;
  currentSpend: number;
  percentUsed: number;
  status: BudgetStatus;
}

export interface GoalProjection {
  goalId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  projectedCompletionDate: string | null;
  monthlyContributionNeeded: number;
}

export interface FinanceForecast {
  projectedTotal: number;
  projectedByCategory: Record<string, number>;
  dailyBurnRate: number;
  daysRemaining: number;
  savingsSuggestion: string;
}

// ============================================
// CATEGORY METADATA
// ============================================

export const FINANCE_CATEGORY_LABELS: Record<FinanceCategory, string> = {
  food: 'Food & Dining',
  transport: 'Transport',
  bills: 'Bills & Utilities',
  health: 'Health & Fitness',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  subscriptions: 'Subscriptions',
  savings: 'Savings',
  education: 'Education',
  salary: 'Salary',
  freelance: 'Freelance',
  investments: 'Investments',
  other: 'Other',
};

export const FINANCE_CATEGORY_ICONS: Record<FinanceCategory, string> = {
  food: '\u{1F354}',        // 🍔
  transport: '\u{1F697}',   // 🚗
  bills: '\u{26A1}',        // ⚡
  health: '\u{2764}',       // ❤
  entertainment: '\u{1F3AE}', // 🎮
  shopping: '\u{1F6D2}',    // 🛒
  subscriptions: '\u{1F504}', // 🔄
  savings: '\u{1F4B0}',     // 💰
  education: '\u{1F4DA}',   // 📚
  salary: '\u{1F4B5}',      // 💵
  freelance: '\u{1F4BB}',   // 💻
  investments: '\u{1F4C8}', // 📈
  other: '\u{1F4CC}',       // 📌
};
