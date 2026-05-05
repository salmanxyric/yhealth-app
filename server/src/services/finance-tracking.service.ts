/**
 * @file Finance Tracking Service
 * @description Manual spending entry, CSV import, and spending stress analysis.
 * Separate from the core finance module — focused on stress-correlation signals.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

interface SpendingTransactionRow {
  id: string;
  user_id: string;
  transaction_date: string;
  amount: string;
  currency: string;
  category: string | null;
  description: string | null;
  source: string;
  stress_indicator: boolean;
  created_at: Date;
}

export interface SpendingTransaction {
  id: string;
  userId: string;
  transactionDate: string;
  amount: number;
  currency: string;
  category: string | null;
  description: string | null;
  source: string;
  stressIndicator: boolean;
  createdAt: string;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

// ============================================
// HELPERS
// ============================================

function mapRow(row: SpendingTransactionRow): SpendingTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    transactionDate: row.transaction_date,
    amount: parseFloat(row.amount),
    currency: row.currency,
    category: row.category,
    description: row.description,
    source: row.source,
    stressIndicator: row.stress_indicator,
    createdAt: row.created_at.toISOString(),
  };
}

// ============================================
// SERVICE CLASS
// ============================================

class FinanceTrackingService {

  async addTransaction(
    userId: string,
    data: {
      transactionDate: string;
      amount: number;
      currency?: string;
      category?: string;
      description?: string;
    },
  ): Promise<SpendingTransaction> {
    const avg30 = await this.get30DayAverage(userId);
    const stressIndicator = avg30 > 0 && data.amount > avg30 * 2;

    const result = await query<SpendingTransactionRow>(
      `INSERT INTO spending_transactions
         (user_id, transaction_date, amount, currency, category, description, source, stress_indicator)
       VALUES ($1, $2, $3, $4, $5, $6, 'manual', $7)
       RETURNING *`,
      [
        userId,
        data.transactionDate,
        data.amount,
        data.currency || 'USD',
        data.category || null,
        data.description || null,
        stressIndicator,
      ],
    );

    logger.info('[FinanceTracking] Transaction added', {
      userId: userId.slice(0, 8),
      amount: data.amount,
      stressIndicator,
    });

    return mapRow(result.rows[0]);
  }

  async importCSV(
    userId: string,
    rows: Array<{ date: string; amount: number; category?: string; description?: string }>,
  ): Promise<{ inserted: number }> {
    if (rows.length === 0) return { inserted: 0 };

    const values: string[] = [];
    const params: (string | number | boolean | null)[] = [userId];
    let idx = 2;

    const avg30 = await this.get30DayAverage(userId);

    for (const row of rows) {
      const stressIndicator = avg30 > 0 && row.amount > avg30 * 2;
      values.push(
        `($1, $${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, 'csv_import', $${idx + 4})`,
      );
      params.push(
        row.date,
        row.amount,
        row.category || null,
        row.description || null,
        stressIndicator,
      );
      idx += 5;
    }

    const result = await query(
      `INSERT INTO spending_transactions
         (user_id, transaction_date, amount, category, description, source, stress_indicator)
       VALUES ${values.join(', ')}`,
      params,
    );

    logger.info('[FinanceTracking] CSV import complete', {
      userId: userId.slice(0, 8),
      inserted: result.rowCount,
    });

    return { inserted: result.rowCount ?? rows.length };
  }

  async getTransactions(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<SpendingTransaction[]> {
    const result = await query<SpendingTransactionRow>(
      `SELECT * FROM spending_transactions
       WHERE user_id = $1
         AND transaction_date >= $2
         AND transaction_date <= $3
       ORDER BY transaction_date DESC, created_at DESC`,
      [userId, startDate, endDate],
    );
    return result.rows.map(mapRow);
  }

  async getDailyTotal(userId: string, date: string): Promise<number> {
    const result = await query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM spending_transactions
       WHERE user_id = $1 AND transaction_date = $2`,
      [userId, date],
    );
    return parseFloat(result.rows[0].total);
  }

  async get30DayAverage(userId: string): Promise<number> {
    const result = await query<{ avg_daily: string }>(
      `SELECT COALESCE(SUM(amount) / NULLIF(COUNT(DISTINCT transaction_date), 0), 0) AS avg_daily
       FROM spending_transactions
       WHERE user_id = $1
         AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'`,
      [userId],
    );
    return parseFloat(result.rows[0].avg_daily);
  }

  async getSpendingStress(userId: string, date: string): Promise<number> {
    const [dailyTotal, avg30Day] = await Promise.all([
      this.getDailyTotal(userId, date),
      this.get30DayAverage(userId),
    ]);

    if (avg30Day === 0) return 0;

    const ratio = dailyTotal / avg30Day;

    let score: number;
    if (ratio <= 1.0) {
      score = ratio * 30;
    } else if (ratio <= 2.0) {
      score = 30 + (ratio - 1.0) * 40;
    } else {
      score = 70 + Math.min((ratio - 2.0) * 15, 30);
    }

    return Math.round(score * 10) / 10;
  }

  async emitSignals(userId: string, date: string): Promise<void> {
    const [transactions, stressScore, avg30Day] = await Promise.all([
      this.getTransactions(userId, date, date),
      this.getSpendingStress(userId, date),
      this.get30DayAverage(userId),
    ]);

    if (transactions.length === 0) return;

    const signalValues: string[] = [];
    const params: (string | number | boolean | null)[] = [userId, date];
    let idx = 3;

    for (const tx of transactions) {
      signalValues.push(
        `($1, 'spending', 'spending', $2, $${idx}::jsonb, '{}'::jsonb)`,
      );
      params.push(
        JSON.stringify({
          transactionId: tx.id,
          amount: tx.amount,
          category: tx.category,
          stressScore,
        }),
      );
      idx++;

      if (avg30Day > 0 && tx.amount > avg30Day * 2) {
        signalValues.push(
          `($1, 'spending', 'spending_spike', $2, $${idx}::jsonb, '{}'::jsonb)`,
        );
        params.push(
          JSON.stringify({
            transactionId: tx.id,
            amount: tx.amount,
            avg30Day,
            ratio: Math.round((tx.amount / avg30Day) * 100) / 100,
          }),
        );
        idx++;
      }
    }

    if (signalValues.length > 0) {
      await query(
        `INSERT INTO data_source_signals
           (user_id, source_type, signal_type, signal_date, value, metadata)
         VALUES ${signalValues.join(', ')}`,
        params,
      );

      logger.info('[FinanceTracking] Signals emitted', {
        userId: userId.slice(0, 8),
        date,
        signalCount: signalValues.length,
        stressScore,
      });
    }
  }

  async getCategoryBreakdown(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<CategoryBreakdown[]> {
    const result = await query<{ category: string; total: string; count: string }>(
      `SELECT COALESCE(category, 'uncategorized') AS category,
              SUM(amount) AS total,
              COUNT(*) AS count
       FROM spending_transactions
       WHERE user_id = $1
         AND transaction_date >= $2
         AND transaction_date <= $3
       GROUP BY category
       ORDER BY total DESC`,
      [userId, startDate, endDate],
    );

    return result.rows.map(row => ({
      category: row.category,
      total: parseFloat(row.total),
      count: parseInt(row.count, 10),
    }));
  }
}

export const financeTrackingService = new FinanceTrackingService();
