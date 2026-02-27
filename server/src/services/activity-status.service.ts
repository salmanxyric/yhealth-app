import { query } from '../database/pg.js';
import { logger } from './logger.service.js';
import { ApiError } from '../utils/ApiError.js';
import type {
  ActivityStatus,
  ActivityStatusHistory,
  CurrentStatusResponse,
  CalendarMonthResponse,
  CalendarDayStatus,
  StatusHistoryResponse,
  StatusStats,
} from '../types/activity-status.types.js';

/**
 * Activity Status Service
 * Manages user activity status tracking and history
 */
class ActivityStatusService {
  /**
   * Get user's current activity status from profile
   */
  async getCurrentStatus(userId: string): Promise<CurrentStatusResponse> {
    try {
      const result = await query<{
        current_activity_status: ActivityStatus;
        activity_status_updated_at: Date | null;
      }>(
        `SELECT current_activity_status, activity_status_updated_at
         FROM users
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw ApiError.notFound('User not found');
      }

      const user = result.rows[0];
      return {
        status: user.current_activity_status || 'working',
        updatedAt: user.activity_status_updated_at || undefined,
      };
    } catch (error) {
      logger.error('[ActivityStatusService] Error getting current status', { error, userId });
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to get current status');
    }
  }

  /**
   * Update user's current activity status in profile
   * Uses a transaction to ensure both updates succeed or fail together
   */
  async updateCurrentStatus(userId: string, status: ActivityStatus): Promise<CurrentStatusResponse> {
    const { transaction } = await import('../database/pg.js');
    
    try {
      // Use transaction to ensure both operations succeed or fail together
      await transaction(async (client) => {
        // Update user profile
        await client.query(
          `UPDATE users
           SET current_activity_status = $1,
               activity_status_updated_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [status, userId]
        );

        // Also set status for today if not already set
        const today = new Date();
        // Format using local timezone, not UTC
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // Insert or update status for today within the same transaction
        await client.query(
          `INSERT INTO activity_status_history (user_id, status_date, activity_status, mood, notes, source)
           VALUES ($1, $2::DATE, $3, $4, $5, $6)
           ON CONFLICT (user_id, status_date)
           DO UPDATE SET
             activity_status = EXCLUDED.activity_status,
             mood = EXCLUDED.mood,
             notes = EXCLUDED.notes,
             source = EXCLUDED.source,
             updated_at = CURRENT_TIMESTAMP`,
          [userId, todayStr, status, null, null, 'auto']
        );
      });

      return {
        status,
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error('[ActivityStatusService] Error updating current status', { 
        error, 
        userId, 
        status,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to update current status');
    }
  }

  /**
   * Set activity status for a specific date
   */
  async setStatusForDate(
    userId: string,
    date: string,
    status: ActivityStatus,
    mood?: number,
    notes?: string,
    source: string = 'manual'
  ): Promise<ActivityStatusHistory> {
    try {
      // Validate mood range
      if (mood !== undefined && (mood < 1 || mood > 5)) {
        throw ApiError.badRequest('Mood must be between 1 and 5');
      }

      // Normalize date string to YYYY-MM-DD format
      // Handle both date strings and Date objects
      let normalizedDate: string;
      if (date.includes('T')) {
        // If it's an ISO string, extract just the date part
        normalizedDate = date.split('T')[0];
      } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Already in YYYY-MM-DD format
        normalizedDate = date;
      } else {
        // Try to parse and format
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          throw ApiError.badRequest('Invalid date format');
        }
        // Use local date to avoid timezone issues
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        normalizedDate = `${year}-${month}-${day}`;
      }

      logger.debug('[ActivityStatusService] Setting status for date', { 
        userId, 
        originalDate: date, 
        normalizedDate,
        status 
      });

      // Use UPSERT to insert or update
      // Cast to DATE to ensure proper date comparison
      const result = await query<ActivityStatusHistory>(
        `INSERT INTO activity_status_history (user_id, status_date, activity_status, mood, notes, source)
         VALUES ($1, $2::DATE, $3, $4, $5, $6)
         ON CONFLICT (user_id, status_date)
         DO UPDATE SET
           activity_status = EXCLUDED.activity_status,
           mood = EXCLUDED.mood,
           notes = EXCLUDED.notes,
           source = EXCLUDED.source,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, normalizedDate, status, mood || null, notes || null, source]
      );

      if (result.rows.length === 0) {
        throw ApiError.internal('Failed to set status');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('[ActivityStatusService] Error setting status for date', { error, userId, date, status });
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to set status for date');
    }
  }

  /**
   * Get status history for a date range
   */
  async getStatusHistory(
    userId: string,
    startDate: Date,
    endDate: Date,
    page: number = 1,
    limit: number = 50
  ): Promise<StatusHistoryResponse> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM activity_status_history
         WHERE user_id = $1
           AND status_date >= $2
           AND status_date <= $3`,
        [userId, startDate, endDate]
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get statuses
      const statusesResult = await query<ActivityStatusHistory>(
        `SELECT *
         FROM activity_status_history
         WHERE user_id = $1
           AND status_date >= $2
           AND status_date <= $3
         ORDER BY status_date DESC
         LIMIT $4 OFFSET $5`,
        [userId, startDate, endDate, limit, offset]
      );

      return {
        statuses: statusesResult.rows,
        total,
      };
    } catch (error) {
      logger.error('[ActivityStatusService] Error getting status history', { error, userId });
      throw ApiError.internal('Failed to get status history');
    }
  }

  /**
   * Get all statuses for a specific month (for calendar view)
   */
  async getStatusForMonth(userId: string, year: number, month: number): Promise<CalendarMonthResponse> {
    try {
      // Get first and last day of month as date strings (YYYY-MM-DD)
      // Use date strings to avoid timezone issues with Date objects
      const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const daysInMonth = new Date(year, month, 0).getDate();
      const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      const result = await query<ActivityStatusHistory>(
        `SELECT *
         FROM activity_status_history
         WHERE user_id = $1
           AND status_date >= $2::DATE
           AND status_date <= $3::DATE
         ORDER BY status_date ASC`,
        [userId, startDateStr, endDateStr]
      );

      // Create a map of date -> status
      // Format dates using local timezone to avoid UTC conversion issues
      const statusMap = new Map<string, CalendarDayStatus>();
      result.rows.forEach((row) => {
        // Handle both Date objects and date strings from PostgreSQL
        let dateObj: Date;
        if (row.status_date instanceof Date) {
          dateObj = row.status_date;
        } else {
          dateObj = new Date(row.status_date);
        }
        
        // Format using local timezone, not UTC
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        statusMap.set(dateStr, {
          date: dateStr,
          status: row.activity_status,
          mood: row.mood || undefined,
          notes: row.notes || undefined,
        });
      });

      // Generate all days in the month
      const days: CalendarDayStatus[] = [];
      const daysInMonthCount = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonthCount; day++) {
        const date = new Date(year, month - 1, day);
        // Format using local timezone, not UTC
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
        days.push(statusMap.get(dateStr) || { date: dateStr });
      }

      return {
        year,
        month,
        days,
      };
    } catch (error) {
      logger.error('[ActivityStatusService] Error getting status for month', { error, userId, year, month });
      throw ApiError.internal('Failed to get status for month');
    }
  }

  /**
   * Get status statistics
   */
  async getStatusStats(userId: string, startDate: Date, endDate: Date): Promise<StatusStats> {
    try {
      // Get all statuses in range
      const result = await query<ActivityStatusHistory>(
        `SELECT *
         FROM activity_status_history
         WHERE user_id = $1
           AND status_date >= $2
           AND status_date <= $3
         ORDER BY status_date ASC`,
        [userId, startDate, endDate]
      );

      const totalDays = result.rows.length;
      const statusDistribution: Record<ActivityStatus, number> = {
        working: 0,
        sick: 0,
        injury: 0,
        rest: 0,
        vacation: 0,
        travel: 0,
        stress: 0,
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      };

      let totalMood = 0;
      let moodCount = 0;

      result.rows.forEach((row) => {
        statusDistribution[row.activity_status] = (statusDistribution[row.activity_status] || 0) + 1;
        if (row.mood) {
          totalMood += row.mood;
          moodCount++;
        }
      });

      // Find most common status
      const mostCommonStatus = Object.entries(statusDistribution).reduce((a, b) =>
        statusDistribution[a[0] as ActivityStatus] > statusDistribution[b[0] as ActivityStatus] ? a : b
      )[0] as ActivityStatus;

      // Calculate streak (consecutive days with status)
      let streakDays = 0;
      if (result.rows.length > 0) {
        const sortedRows = [...result.rows].sort((a, b) => 
          b.status_date.getTime() - a.status_date.getTime()
        );
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);
        
        for (const row of sortedRows) {
          const rowDate = new Date(row.status_date);
          rowDate.setHours(0, 0, 0, 0);
          
          if (rowDate.getTime() === checkDate.getTime()) {
            streakDays++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      return {
        totalDays,
        statusDistribution,
        averageMood: moodCount > 0 ? totalMood / moodCount : undefined,
        mostCommonStatus,
        streakDays,
      };
    } catch (error) {
      logger.error('[ActivityStatusService] Error getting status stats', { error, userId });
      throw ApiError.internal('Failed to get status stats');
    }
  }

  /**
   * Get status for a specific date
   */
  async getStatusForDate(userId: string, date: string): Promise<ActivityStatusHistory | null> {
    try {
      // Normalize date string to YYYY-MM-DD format
      let normalizedDate: string;
      if (date.includes('T')) {
        normalizedDate = date.split('T')[0];
      } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        normalizedDate = date;
      } else {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          throw ApiError.badRequest('Invalid date format');
        }
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        normalizedDate = `${year}-${month}-${day}`;
      }

      const result = await query<ActivityStatusHistory>(
        `SELECT *
         FROM activity_status_history
         WHERE user_id = $1
           AND status_date = $2::DATE
         LIMIT 1`,
        [userId, normalizedDate]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error('[ActivityStatusService] Error getting status for date', { error, userId, date });
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to get status for date');
    }
  }

  /**
   * Delete status for a specific date
   */
  async deleteStatusForDate(userId: string, date: string): Promise<void> {
    try {
      // Normalize date string to YYYY-MM-DD format
      let normalizedDate: string;
      if (date.includes('T')) {
        normalizedDate = date.split('T')[0];
      } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        normalizedDate = date;
      } else {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          throw ApiError.badRequest('Invalid date format');
        }
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        normalizedDate = `${year}-${month}-${day}`;
      }

      await query(
        `DELETE FROM activity_status_history
         WHERE user_id = $1
           AND status_date = $2::DATE`,
        [userId, normalizedDate]
      );
    } catch (error) {
      logger.error('[ActivityStatusService] Error deleting status for date', { error, userId, date });
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal('Failed to delete status for date');
    }
  }
}

export const activityStatusService = new ActivityStatusService();

