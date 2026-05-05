/**
 * Non-clinical mental health guardrails for coaching surfaces.
 * Complements crisis-detection (acute self-harm) with a separate "clinical concern" lane.
 */

import { createHash } from 'crypto';
import { logger } from './logger.service.js';
import { query } from '../config/database.config.js';
import { crisisDetectionService } from './crisis-detection.service.js';

export type MentalHealthLane =
  | 'none'
  | 'situational_stress'
  | 'elevated_clinical_concern'
  | 'acute_safety_risk';

export interface MentalHealthAssessment {
  lane: MentalHealthLane;
  showProfessionalHelp: boolean;
  suppressCoachingGoals: boolean;
  /** Stable codes for logging — never raw user text */
  matchedCodes: string[];
}

/** Persistent low mood / possible clinical depression language — not suicide protocol */
const CLINICAL_CONCERN_PATTERNS: Array<{ code: string; needles: string[] }> = [
  { code: 'dep_weeks', needles: ['weeks depressed', 'months depressed', 'depressed for weeks', 'depressed for months'] },
  { code: 'no_feeling', needles: ['feel nothing', 'emotionally numb', 'completely numb'] },
  { code: 'cant_function', needles: ["can't get out of bed", 'cannot get out of bed', 'stopped showering', 'not eating for days'] },
  { code: 'clinical_term', needles: ['clinical depression', 'bipolar disorder', 'psychiatrist', 'antidepressant', 'antidepressants'] },
];

const SITUATIONAL_PATTERNS: Array<{ code: string; needles: string[] }> = [
  { code: 'stress_work', needles: ['stressed at work', 'stressed with work', 'overwhelmed at work'] },
  { code: 'stress_general', needles: ['so stressed', 'really stressed', 'too much going on'] },
  { code: 'sad_situational', needles: ['feeling sad', 'a bit down', 'rough day', 'bad day at'] },
  { code: 'mood_low_mild', needles: ['really depressed', 'extremely sad', 'miserable'] },
];

export const MENTAL_HEALTH_SYSTEM_ADDENDUM = `MENTAL_HEALTH_GUARDRAIL (mandatory):
- You are not a clinician. Do not diagnose, label psychiatric disorders, or prescribe treatment.
- If the user shows signs of persistent clinical depression or loss of function, encourage professional / crisis-appropriate support and keep your reply short, warm, and non-directive about goals.
- Do not push performance goals, streaks, or aggressive accountability in this turn.`;

class MentalHealthGuardrailService {
  hashContent(text: string): string {
    return createHash('sha256').update(text, 'utf8').digest('hex');
  }

  /**
   * Order: acute safety (crisis keywords) → clinical concern phrases → situational.
   */
  async assessUserText(text: string): Promise<MentalHealthAssessment> {
    const lower = text.toLowerCase();
    const matchedCodes: string[] = [];

    const crisis = await crisisDetectionService.detectCrisisKeywords(text);
    if (crisis.isCrisis) {
      return {
        lane: 'acute_safety_risk',
        showProfessionalHelp: true,
        suppressCoachingGoals: true,
        matchedCodes: ['crisis_keywords', ...crisis.keywords.slice(0, 5)],
      };
    }

    for (const { code, needles } of CLINICAL_CONCERN_PATTERNS) {
      if (needles.some((n) => lower.includes(n))) {
        matchedCodes.push(code);
      }
    }
    if (matchedCodes.length > 0) {
      logger.info('[MentalHealthGuardrail] elevated_clinical_concern', {
        codes: matchedCodes,
        textLength: text.length,
      });
      return {
        lane: 'elevated_clinical_concern',
        showProfessionalHelp: true,
        suppressCoachingGoals: true,
        matchedCodes,
      };
    }

    for (const { code, needles } of SITUATIONAL_PATTERNS) {
      if (needles.some((n) => lower.includes(n))) {
        matchedCodes.push(code);
      }
    }
    if (matchedCodes.length > 0) {
      return {
        lane: 'situational_stress',
        showProfessionalHelp: false,
        suppressCoachingGoals: false,
        matchedCodes,
      };
    }

    return {
      lane: 'none',
      showProfessionalHelp: false,
      suppressCoachingGoals: false,
      matchedCodes: [],
    };
  }

  /**
   * Optional audit row — no raw message body.
   */
  async logScreeningEvent(
    userId: string,
    lane: MentalHealthLane,
    source: 'chat' | 'rag' | 'emotional_checkin',
    text: string
  ): Promise<void> {
    if (lane === 'none') return;
    const contentSha256 = this.hashContent(text.slice(0, 4000));
    try {
      await query(
        `INSERT INTO mental_health_screening_events (user_id, lane, source, content_sha256)
         VALUES ($1, $2, $3, $4)`,
        [userId, lane, source, contentSha256]
      );
    } catch (e) {
      logger.debug('[MentalHealthGuardrail] log skip (table missing?)', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

export const mentalHealthGuardrailService = new MentalHealthGuardrailService();
