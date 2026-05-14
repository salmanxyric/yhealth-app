/**
 * Email Service - Wraps mail helper with EmailEngine routing for key methods.
 *
 * Backward-compatible: all existing imports continue to work.
 * Welcome/onboarding/engagement emails now route through EmailEngine
 * for dedup, throttling, quiet hours, and engagement checks.
 */

import {
  mailHelper,
  sendMail,
  EMAIL_SUBJECTS,
  type EmailTemplateType,
  type SendMailOptions,
  type IMailHelper,
} from '../helper/mail.js';
import { emailEngine } from './email-engine.service.js';
import { query } from '../config/database.config.js';

export {
  mailHelper,
  sendMail,
  EMAIL_SUBJECTS,
  type EmailTemplateType,
  type SendMailOptions,
  type IMailHelper,
};

const appUrl = process.env['APP_URL'] || 'http://localhost:3000';

async function resolveUserId(email: string): Promise<string | undefined> {
  try {
    const result = await query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    return result.rows[0]?.id;
  } catch {
    return undefined;
  }
}

/**
 * Engine-routed overrides for lifecycle emails.
 * Methods listed here go through EmailEngine (dedup + throttle + quiet hours).
 * Everything else delegates to mailHelper directly.
 */
const engineOverrides: Partial<IMailHelper> = {
  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const userId = await resolveUserId(email);
    const logId = await emailEngine.send({
      userId,
      template: 'welcome',
      recipient: email,
      data: {
        firstName,
        dashboardUrl: `${appUrl}/dashboard`,
        assessmentUrl: `${appUrl}/onboarding/assessment`,
      },
      category: 'transactional',
      priority: 'normal',
    });
    return logId !== null;
  },

  async sendAssessmentReminderEmail(email: string, firstName: string, daysRegistered: number): Promise<boolean> {
    const userId = await resolveUserId(email);
    const logId = await emailEngine.send({
      userId,
      template: 'assessmentReminder',
      recipient: email,
      data: {
        firstName,
        assessmentUrl: `${appUrl}/onboarding/assessment`,
        daysRegistered,
      },
      category: 'engagement',
      priority: 'normal',
    });
    return logId !== null;
  },

  async sendIntegrationReminderEmail(
    email: string,
    firstName: string,
    connectedCount: number,
    availableIntegrations: string[] = ['WHOOP', 'Fitbit', 'Garmin', 'Oura']
  ): Promise<boolean> {
    const userId = await resolveUserId(email);
    const logId = await emailEngine.send({
      userId,
      template: 'integrationReminder',
      recipient: email,
      data: {
        firstName,
        integrationsUrl: `${appUrl}/onboarding/integrations`,
        connectedCount,
        availableIntegrations,
      },
      category: 'engagement',
      priority: 'low',
    });
    return logId !== null;
  },

  async sendGoalSetEmail(email: string, firstName: string, goalTitle: string, goalCategory: string): Promise<boolean> {
    const userId = await resolveUserId(email);
    const logId = await emailEngine.send({
      userId,
      template: 'goalSet',
      recipient: email,
      data: {
        firstName,
        goalTitle,
        goalCategory,
        dashboardUrl: `${appUrl}/dashboard`,
      },
      category: 'engagement',
      priority: 'low',
    });
    return logId !== null;
  },

  async sendWeeklyProgressEmail(
    email: string,
    firstName: string,
    data: {
      weekStart: string;
      weekEnd: string;
      checkIns?: number;
      goalsProgress?: number;
      streak?: number;
      coachMessage?: string;
      highlights?: Array<{ icon?: string; title: string; description: string }>;
      insights?: string[];
      nextWeekFocus?: string;
    }
  ): Promise<boolean> {
    const userId = await resolveUserId(email);
    const logId = await emailEngine.send({
      userId,
      template: 'weeklyProgress',
      recipient: email,
      data: { firstName, ...data, appUrl },
      category: 'digest',
      priority: 'low',
    });
    return logId !== null;
  },

  async sendMilestoneAchievedEmail(
    email: string,
    firstName: string,
    data: {
      milestoneTitle: string;
      milestoneDescription: string;
      milestoneCategory: string;
      milestoneIcon?: string;
      stats?: {
        daysActive?: number;
        totalCheckIns?: number;
        goalsCompleted?: number;
      };
    }
  ): Promise<boolean> {
    const userId = await resolveUserId(email);
    const logId = await emailEngine.send({
      userId,
      template: 'milestoneAchieved',
      recipient: email,
      data: { firstName, ...data, appUrl },
      category: 'engagement',
      priority: 'normal',
    });
    return logId !== null;
  },

  async sendStreakMilestoneEmail(
    email: string,
    firstName: string,
    streakDays: number,
    nextMilestone?: number,
    motivationalQuote?: string,
    quoteAuthor?: string
  ): Promise<boolean> {
    const userId = await resolveUserId(email);
    const logId = await emailEngine.send({
      userId,
      template: 'streakMilestone',
      recipient: email,
      data: { firstName, streakDays, nextMilestone, motivationalQuote, quoteAuthor, appUrl },
      category: 'engagement',
      priority: 'low',
    });
    return logId !== null;
  },
};

/**
 * Proxy-based email service: engine-routed methods override mailHelper,
 * everything else delegates transparently.
 */
export const emailService: IMailHelper = new Proxy(mailHelper, {
  get(target, prop, receiver) {
    if (prop in engineOverrides) {
      return (engineOverrides as Record<string | symbol, unknown>)[prop];
    }
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  },
});

export default emailService;
