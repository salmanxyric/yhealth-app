/**
 * yHealth Email Templates
 * Modern, responsive email templates for the AI Life Coach platform
 */

// Base template components
export {
  baseEmailLayout,
  featureBox,
  statsBox,
  alertBox,
  codeBox,
  BRAND_COLORS,
  type EmailTemplateData,
} from './base.template.js';

// Verification templates
export {
  emailVerificationTemplate,
  resendVerificationTemplate,
  emailVerifiedTemplate,
  type VerificationEmailData,
} from './verification.template.js';

// Password templates
export {
  passwordResetTemplate,
  passwordChangedTemplate,
  passwordResetOTPTemplate,
  securityAlertTemplate,
  type PasswordResetEmailData,
} from './password.template.js';

// Welcome & onboarding templates
export {
  welcomeTemplate,
  assessmentReminderTemplate,
  integrationReminderTemplate,
  goalSetTemplate,
  type WelcomeEmailData,
} from './welcome.template.js';

// Onboarding completion & progress templates
export {
  onboardingCompleteTemplate,
  weeklyProgressTemplate,
  milestoneAchievedTemplate,
  streakMilestoneTemplate,
  reEngagementTemplate,
} from './onboarding.template.js';

/**
 * Email template types for TypeScript
 */
export type EmailTemplateType =
  | 'verification'
  | 'resend-verification'
  | 'email-verified'
  | 'password-reset'
  | 'password-changed'
  | 'password-reset-otp'
  | 'security-alert'
  | 'welcome'
  | 'assessment-reminder'
  | 'integration-reminder'
  | 'goal-set'
  | 'onboarding-complete'
  | 'weekly-progress'
  | 'milestone-achieved'
  | 'streak-milestone'
  | 're-engagement';

/**
 * Email subject lines
 */
export const EMAIL_SUBJECTS: Record<EmailTemplateType, string> = {
  'verification': 'Verify Your Email - yHealth',
  'resend-verification': 'New Verification Link - yHealth',
  'email-verified': 'Email Verified! - yHealth',
  'password-reset': 'Reset Your Password - yHealth',
  'password-changed': 'Password Changed - yHealth',
  'password-reset-otp': 'Your Password Reset Code - yHealth',
  'security-alert': 'Security Alert - yHealth',
  'welcome': 'Welcome to yHealth - Your AI Life Coach!',
  'assessment-reminder': 'Complete Your Assessment - yHealth',
  'integration-reminder': 'Connect Your Devices - yHealth',
  'goal-set': 'Goal Set! - yHealth',
  'onboarding-complete': 'You\'re All Set! - yHealth',
  'weekly-progress': 'Your Weekly Progress - yHealth',
  'milestone-achieved': 'Milestone Achieved! - yHealth',
  'streak-milestone': 'Streak Milestone! - yHealth',
  're-engagement': 'We Miss You! - yHealth',
};

import { BRAND_COLORS as BrandColors } from './base.template.js';

export default {
  BRAND_COLORS: BrandColors,
  EMAIL_SUBJECTS,
};
