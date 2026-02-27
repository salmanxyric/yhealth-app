/**
 * Email Service - Re-exports from mail helper for backward compatibility
 *
 * This file maintains backward compatibility with existing imports.
 * All email functionality is now centralized in src/helper/mail.ts
 *
 * Usage:
 *   import { mailHelper } from '../helper/mail.js';
 *   // or
 *   import { emailService } from '../services/email.service.js';
 */

import {
  mailHelper,
  sendMail,
  EMAIL_SUBJECTS,
  type EmailTemplateType,
  type SendMailOptions,
  type IMailHelper,
} from '../helper/mail.js';

// Re-export everything from mail helper
export {
  mailHelper,
  sendMail,
  EMAIL_SUBJECTS,
  type EmailTemplateType,
  type SendMailOptions,
  type IMailHelper,
};

// Alias for backward compatibility (typed as interface to avoid exposing private members)
export const emailService: IMailHelper = mailHelper;

export default emailService;
