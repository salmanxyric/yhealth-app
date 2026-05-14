/**
 * Email Engine Service
 * Centralized orchestrator for all outbound email.
 * Routes emails through: dedup → throttle → quiet hours → preferences → logging → queue.
 *
 * ALL email sends MUST go through this engine. Direct mailHelper.send() calls
 * bypass rate limiting, deduplication, and preference checks.
 */

import { createHash, randomUUID } from 'crypto';
import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { mailHelper, EMAIL_SUBJECTS } from '../helper/mail.js';
import { emailQueueService, type EmailCategory, type EmailPriority, type EmailJobData } from './email-queue.service.js';

// ============================================================================
// Types
// ============================================================================

export interface SendEmailOptions {
  userId?: string;
  template: string;
  recipient: string;
  subject?: string;
  data: Record<string, unknown>;
  category?: EmailCategory;
  priority?: EmailPriority;
  /** Skip dedup check (use sparingly — OTPs, security alerts) */
  skipDedup?: boolean;
}

export interface EmailPreference {
  category: string;
  enabled: boolean;
  frequency: string;
}

export interface EmailAnalytics {
  totalSent: number;
  totalFailed: number;
  totalQueued: number;
  byTemplate: Array<{ template: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

// ============================================================================
// Priority Classification
// ============================================================================

const PRIORITY_CONFIG = {
  critical: { bypassThrottle: true, bypassQuietHours: true, bypassDedup: true },
  high:     { bypassThrottle: false, bypassQuietHours: true, bypassDedup: false },
  normal:   { bypassThrottle: false, bypassQuietHours: false, bypassDedup: false },
  low:      { bypassThrottle: false, bypassQuietHours: false, bypassDedup: false },
} as const;

/** Templates that are always transactional — never throttled or deduped */
const TRANSACTIONAL_TEMPLATES = new Set([
  'emailVerification', 'resendVerification', 'emailVerified',
  'passwordReset', 'passwordResetOTP', 'passwordChanged',
  'registrationOTP', 'securityAlert',
]);

/** Per-template dedup windows (seconds). Missing = use default. */
const DEDUP_WINDOWS: Record<string, number> = {
  coachingInsight:   3600,     // 1 hour — coaching nudges
  digestSummary:     86400,    // 24 hours — weekly digest
  reEngagement:      2592000,  // 30 days
  weeklyProgress:    518400,   // 6 days
  assessmentReminder: 86400,   // 24 hours
  integrationReminder: 86400,  // 24 hours
  taskReminder:      1800,     // 30 min — same task reminder
  milestoneAchieved: 3600,     // 1 hour — same milestone
  streakMilestone:   3600,     // 1 hour
  goalSet:           600,      // 10 min
  welcome:           86400,    // 24 hours — prevent multiple welcome emails
};

const DEFAULT_DEDUP_WINDOW_S = 1800; // 30 minutes

/** Minimum seconds between any two non-transactional emails to the same user */
const MIN_EMAIL_SPACING_S = 900; // 15 minutes

/** Soft daily cap for non-transactional emails */
const DAILY_SOFT_CAP = 5;

/** Hard daily cap — even high-priority stops here (critical still bypasses) */
const DAILY_HARD_CAP = 8;

// ============================================================================
// In-Memory Dedup Cache
// ============================================================================

interface DedupEntry {
  timestamp: number;
  contentHash: string;
}

class DedupCache {
  private cache = new Map<string, DedupEntry>();

  constructor() {
    setInterval(() => this.cleanup(), 5 * 60_000);
  }

  /**
   * Returns true if this email should be suppressed (is a duplicate).
   */
  isDuplicate(userId: string, template: string, data: Record<string, unknown>): boolean {
    const key = `${userId}:${template}`;
    const contentHash = this.hashContent(data);
    const entry = this.cache.get(key);

    if (!entry) return false;

    const windowS = DEDUP_WINDOWS[template] ?? DEFAULT_DEDUP_WINDOW_S;
    const elapsed = (Date.now() - entry.timestamp) / 1000;

    if (elapsed < windowS) {
      // Within window — check if content is same or similar
      if (entry.contentHash === contentHash) return true;
      // Even different content within a tight window (5 min) for same template
      if (elapsed < 300) return true;
    }

    return false;
  }

  record(userId: string, template: string, data: Record<string, unknown>): void {
    const key = `${userId}:${template}`;
    this.cache.set(key, {
      timestamp: Date.now(),
      contentHash: this.hashContent(data),
    });
  }

  private hashContent(data: Record<string, unknown>): string {
    const stable = JSON.stringify(data, Object.keys(data).sort());
    return createHash('sha256').update(stable).digest('hex').substring(0, 16);
  }

  private cleanup(): void {
    const maxAge = Math.max(...Object.values(DEDUP_WINDOWS), DEFAULT_DEDUP_WINDOW_S) * 1000;
    const cutoff = Date.now() - maxAge;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < cutoff) this.cache.delete(key);
    }
  }
}

// ============================================================================
// Email Engine
// ============================================================================

class EmailEngine {
  private static instance: EmailEngine;
  private dedupCache = new DedupCache();

  private constructor() {}

  static getInstance(): EmailEngine {
    if (!EmailEngine.instance) {
      EmailEngine.instance = new EmailEngine();
    }
    return EmailEngine.instance;
  }

  /**
   * Core send method — ALL email goes through here.
   * Pipeline: classify → dedup → throttle → quiet hours → preferences → log → queue
   */
  async send(options: SendEmailOptions): Promise<string | null> {
    const {
      userId,
      template,
      recipient,
      subject = this.resolveSubject(template),
      data,
      category = 'engagement',
      priority = 'normal',
      skipDedup = false,
    } = options;

    const isTransactional = category === 'transactional' || TRANSACTIONAL_TEMPLATES.has(template);
    const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;

    // 1. Skip system users
    if (recipient.endsWith('@balencia.system')) {
      return null;
    }

    // Non-transactional pipeline for authenticated users
    if (userId && !isTransactional) {
      // 2. Deduplication
      if (!skipDedup && !priorityConfig.bypassDedup) {
        if (this.dedupCache.isDuplicate(userId, template, data)) {
          logger.debug('[EmailEngine] Deduped', { userId, template });
          return null;
        }
      }

      // 3. Preference check
      const allowed = await this.checkPreferences(userId, category);
      if (!allowed) {
        logger.debug('[EmailEngine] Opted out', { userId, category, template });
        return null;
      }

      // 4. Frequency preference check (user may want weekly-only)
      const frequency = await this.getUserFrequency(userId, category);
      if (frequency === 'never') return null;
      if (frequency === 'weekly' && category !== 'digest') {
        // Suppress non-digest emails for weekly-preference users
        logger.debug('[EmailEngine] Suppressed — user prefers weekly', { userId, template });
        return null;
      }

      // 5. Rate limiting — adaptive throttle
      if (!priorityConfig.bypassThrottle) {
        const throttleResult = await this.checkThrottle(userId, priority);
        if (throttleResult.blocked) {
          logger.debug('[EmailEngine] Throttled', { userId, template, reason: throttleResult.reason });
          return null;
        }
      }

      // 6. Quiet hours — defer low/normal priority during sleep
      if (!priorityConfig.bypassQuietHours) {
        const inQuietHours = await this.isInQuietHours(userId);
        if (inQuietHours) {
          logger.debug('[EmailEngine] Quiet hours — suppressed', { userId, template });
          return null;
        }
      }

      // 7. Engagement-based suppression
      const engagementOk = await this.checkEngagement(userId, category);
      if (!engagementOk) {
        logger.debug('[EmailEngine] Low engagement — suppressed', { userId, template, category });
        return null;
      }
    }

    try {
      // Generate unsubscribe token for non-transactional
      let unsubscribeToken: string | undefined;
      if (userId && !isTransactional) {
        unsubscribeToken = await this.ensureUnsubscribeToken(userId, category);
      }

      // Create email log entry
      const logId = randomUUID();
      await query(
        `INSERT INTO email_logs (id, user_id, template, subject, recipient, status, category, metadata)
         VALUES ($1, $2, $3, $4, $5, 'queued', $6, $7)`,
        [
          logId,
          userId || null,
          template,
          subject,
          recipient,
          isTransactional ? 'transactional' : category,
          JSON.stringify({ priority, templateData: Object.keys(data) }),
        ]
      );

      // Record in dedup cache
      if (userId) {
        this.dedupCache.record(userId, template, data);
      }

      // Route: queue (if Redis available) or inline fallback
      if (emailQueueService.isAvailable()) {
        const jobData: EmailJobData = {
          logId,
          userId: userId || undefined,
          template,
          recipient,
          subject,
          data,
          category: isTransactional ? 'transactional' : category,
          priority,
          unsubscribeToken,
        };

        await emailQueueService.enqueue(jobData);
        return logId;
      }

      // Inline fallback — send immediately
      return await this.sendInline(logId, template, recipient, subject, data, unsubscribeToken);
    } catch (error) {
      logger.error('[EmailEngine] Failed to send email', {
        userId,
        template,
        recipient,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Send transactional email (always inline, bypasses queue and preferences).
   * For auth emails, security alerts, etc. that can't wait.
   */
  async sendTransactional(options: Omit<SendEmailOptions, 'category' | 'priority'>): Promise<boolean> {
    const { userId, template, recipient, subject = this.resolveSubject(template), data } = options;

    try {
      const logId = randomUUID();
      await query(
        `INSERT INTO email_logs (id, user_id, template, subject, recipient, status, category)
         VALUES ($1, $2, $3, $4, $5, 'queued', 'transactional')`,
        [logId, userId || null, template, subject, recipient]
      );

      const result = await this.sendInline(logId, template, recipient, subject, data);
      return result !== null;
    } catch (error) {
      logger.error('[EmailEngine] Transactional email failed', {
        template,
        recipient,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Send engagement email (queued, respects preferences)
   */
  async sendEngagement(options: Omit<SendEmailOptions, 'category'>): Promise<string | null> {
    return this.send({ ...options, category: 'engagement' });
  }

  /**
   * Send email inline (bypass queue)
   */
  private async sendInline(
    logId: string,
    template: string,
    recipient: string,
    subject: string,
    data: Record<string, unknown>,
    unsubscribeToken?: string,
  ): Promise<string | null> {
    try {
      const appUrl = process.env['APP_URL'] || 'http://localhost:3000';
      const result = await mailHelper.send({
        email: recipient,
        subject,
        template,
        data: {
          ...data,
          unsubscribeUrl: unsubscribeToken ? `${appUrl}/api/email/unsubscribe/${unsubscribeToken}` : undefined,
          preferencesUrl: `${appUrl}/settings/notifications`,
        },
      });

      if (result) {
        await query(
          `UPDATE email_logs SET status = 'sent', sent_at = NOW(), attempts = 1, updated_at = NOW() WHERE id = $1`,
          [logId]
        );
        return logId;
      } else {
        await query(
          `UPDATE email_logs SET status = 'failed', last_error = 'MailHelper returned false', attempts = 1, updated_at = NOW() WHERE id = $1`,
          [logId]
        );
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await query(
        `UPDATE email_logs SET status = 'failed', last_error = $1, attempts = 1, updated_at = NOW() WHERE id = $2`,
        [errorMsg.substring(0, 2000), logId]
      ).catch(() => {});
      return null;
    }
  }

  // ============================================================================
  // Throttling & Rate Limiting
  // ============================================================================

  private async checkThrottle(
    userId: string,
    priority: EmailPriority
  ): Promise<{ blocked: boolean; reason?: string }> {
    try {
      // Check daily count
      const dailyCount = await this.getDailyEmailCount(userId);

      // Hard cap — block everything except critical
      if (dailyCount >= DAILY_HARD_CAP) {
        return { blocked: true, reason: `hard_cap_${DAILY_HARD_CAP}` };
      }

      // Soft cap — block low/normal, allow high
      if (dailyCount >= DAILY_SOFT_CAP && priority !== 'high') {
        return { blocked: true, reason: `soft_cap_${DAILY_SOFT_CAP}` };
      }

      // Minimum spacing — no two emails within MIN_EMAIL_SPACING_S
      const lastSentAt = await this.getLastEmailTimestamp(userId);
      if (lastSentAt) {
        const elapsedS = (Date.now() - lastSentAt.getTime()) / 1000;
        if (elapsedS < MIN_EMAIL_SPACING_S) {
          return { blocked: true, reason: `spacing_${Math.round(MIN_EMAIL_SPACING_S - elapsedS)}s_remaining` };
        }
      }

      return { blocked: false };
    } catch {
      return { blocked: false };
    }
  }

  private async getLastEmailTimestamp(userId: string): Promise<Date | null> {
    try {
      const result = await query<{ sent_at: Date }>(
        `SELECT sent_at FROM email_logs
         WHERE user_id = $1
         AND category != 'transactional'
         AND status = 'sent'
         AND sent_at IS NOT NULL
         ORDER BY sent_at DESC
         LIMIT 1`,
        [userId]
      );
      return result.rows[0]?.sent_at || null;
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Quiet Hours
  // ============================================================================

  private async isInQuietHours(userId: string): Promise<boolean> {
    try {
      const result = await query<{ quiet_hours_start: number | null; quiet_hours_end: number | null }>(
        `SELECT quiet_hours_start, quiet_hours_end
         FROM user_communication_preferences
         WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) return false;

      const { quiet_hours_start, quiet_hours_end } = result.rows[0];
      if (quiet_hours_start === null || quiet_hours_end === null) return false;

      const now = new Date();
      const currentHour = now.getUTCHours();

      // Handle overnight ranges (e.g., 22:00 → 07:00)
      if (quiet_hours_start > quiet_hours_end) {
        return currentHour >= quiet_hours_start || currentHour < quiet_hours_end;
      }

      return currentHour >= quiet_hours_start && currentHour < quiet_hours_end;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Engagement-Based Suppression
  // ============================================================================

  /**
   * Check if user is engaged enough to warrant sending this category.
   * Suppresses marketing/engagement emails for users with zero opens in 30 days.
   */
  private async checkEngagement(userId: string, category: string): Promise<boolean> {
    // Never suppress digest or coaching — those are core value
    if (category === 'digest' || category === 'coaching' || category === 'transactional') {
      return true;
    }

    try {
      // Count emails sent vs opened in last 30 days
      const result = await query<{ sent: string; opened: string }>(
        `SELECT
           COUNT(*) as sent,
           COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened
         FROM email_logs
         WHERE user_id = $1
           AND category != 'transactional'
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [userId]
      );

      const sent = parseInt(result.rows[0]?.sent || '0');
      const opened = parseInt(result.rows[0]?.opened || '0');

      // New users (< 5 emails sent) — always send
      if (sent < 5) return true;

      // Zero opens in 30 days across 5+ emails — suppress engagement/marketing
      if (opened === 0 && (category === 'engagement' || category === 'marketing')) {
        return false;
      }

      return true;
    } catch {
      return true;
    }
  }

  // ============================================================================
  // Preferences
  // ============================================================================

  async checkPreferences(userId: string, category: string): Promise<boolean> {
    try {
      const result = await query<{ enabled: boolean }>(
        `SELECT enabled FROM email_preferences WHERE user_id = $1 AND category = $2`,
        [userId, category]
      );
      return result.rows.length === 0 || result.rows[0].enabled;
    } catch {
      return true;
    }
  }

  private async getUserFrequency(userId: string, category: string): Promise<string> {
    try {
      const result = await query<{ frequency: string }>(
        `SELECT frequency FROM email_preferences WHERE user_id = $1 AND category = $2`,
        [userId, category]
      );
      return result.rows[0]?.frequency || 'immediate';
    } catch {
      return 'immediate';
    }
  }

  async getPreferences(userId: string): Promise<EmailPreference[]> {
    const categories: EmailCategory[] = ['transactional', 'engagement', 'digest', 'coaching', 'marketing'];

    const result = await query<{ category: string; enabled: boolean; frequency: string }>(
      `SELECT category, enabled, frequency FROM email_preferences WHERE user_id = $1`,
      [userId]
    );

    const existing = new Map(result.rows.map(r => [r.category, r]));

    return categories.map(cat => ({
      category: cat,
      enabled: existing.get(cat)?.enabled ?? true,
      frequency: existing.get(cat)?.frequency ?? 'immediate',
    }));
  }

  async updatePreference(
    userId: string,
    category: string,
    enabled: boolean,
    frequency?: string,
  ): Promise<void> {
    if (category === 'transactional' && !enabled) {
      throw new Error('Cannot disable transactional emails');
    }

    await query(
      `INSERT INTO email_preferences (user_id, category, enabled, frequency)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         frequency = COALESCE(EXCLUDED.frequency, email_preferences.frequency),
         updated_at = NOW()`,
      [userId, category, enabled, frequency || 'immediate']
    );
  }

  // ============================================================================
  // Unsubscribe
  // ============================================================================

  private async ensureUnsubscribeToken(userId: string, category: string): Promise<string> {
    const result = await query<{ unsubscribe_token: string }>(
      `SELECT unsubscribe_token FROM email_preferences
       WHERE user_id = $1 AND category = $2 AND unsubscribe_token IS NOT NULL`,
      [userId, category]
    );

    if (result.rows.length > 0 && result.rows[0].unsubscribe_token) {
      return result.rows[0].unsubscribe_token;
    }

    const token = randomUUID();
    await query(
      `INSERT INTO email_preferences (user_id, category, unsubscribe_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, category) DO UPDATE SET
         unsubscribe_token = EXCLUDED.unsubscribe_token,
         updated_at = NOW()`,
      [userId, category, token]
    );

    return token;
  }

  async processUnsubscribe(token: string): Promise<{ success: boolean; category: string | null }> {
    try {
      const result = await query<{ user_id: string; category: string }>(
        `UPDATE email_preferences SET enabled = false, updated_at = NOW()
         WHERE unsubscribe_token = $1
         RETURNING user_id, category`,
        [token]
      );

      if (result.rows.length === 0) {
        return { success: false, category: null };
      }

      logger.info('[EmailEngine] User unsubscribed via token', {
        userId: result.rows[0].user_id,
        category: result.rows[0].category,
      });

      return { success: true, category: result.rows[0].category };
    } catch (error) {
      logger.error('[EmailEngine] Failed to process unsubscribe', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { success: false, category: null };
    }
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  async getAnalytics(filters?: {
    userId?: string;
    template?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<EmailAnalytics> {
    const conditions: string[] = [];
    const params: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (filters?.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }
    if (filters?.template) {
      conditions.push(`template = $${paramIndex++}`);
      params.push(filters.template);
    }
    if (filters?.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [totals, byTemplate, byCategory, byStatus] = await Promise.all([
      query<{ total_sent: string; total_failed: string; total_queued: string }>(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'sent') as total_sent,
          COUNT(*) FILTER (WHERE status = 'failed') as total_failed,
          COUNT(*) FILTER (WHERE status = 'queued') as total_queued
         FROM email_logs ${where}`,
        params
      ),
      query<{ template: string; count: string }>(
        `SELECT template, COUNT(*) as count FROM email_logs ${where}
         GROUP BY template ORDER BY count DESC LIMIT 20`,
        params
      ),
      query<{ category: string; count: string }>(
        `SELECT category, COUNT(*) as count FROM email_logs ${where}
         GROUP BY category ORDER BY count DESC`,
        params
      ),
      query<{ status: string; count: string }>(
        `SELECT status, COUNT(*) as count FROM email_logs ${where}
         GROUP BY status ORDER BY count DESC`,
        params
      ),
    ]);

    const t = totals.rows[0];
    return {
      totalSent: parseInt(t?.total_sent || '0'),
      totalFailed: parseInt(t?.total_failed || '0'),
      totalQueued: parseInt(t?.total_queued || '0'),
      byTemplate: byTemplate.rows.map(r => ({ template: r.template, count: parseInt(r.count) })),
      byCategory: byCategory.rows.map(r => ({ category: r.category, count: parseInt(r.count) })),
      byStatus: byStatus.rows.map(r => ({ status: r.status, count: parseInt(r.count) })),
    };
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private async getDailyEmailCount(userId: string): Promise<number> {
    try {
      const result = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM email_logs
         WHERE user_id = $1
         AND category != 'transactional'
         AND status IN ('sent', 'queued')
         AND created_at >= CURRENT_DATE`,
        [userId]
      );
      return parseInt(result.rows[0]?.count || '0');
    } catch {
      return 0;
    }
  }

  private resolveSubject(template: string): string {
    const key = template as keyof typeof EMAIL_SUBJECTS;
    return EMAIL_SUBJECTS[key] || `yHealth — ${template.replace(/[-_]/g, ' ')}`;
  }
}

export const emailEngine = EmailEngine.getInstance();
