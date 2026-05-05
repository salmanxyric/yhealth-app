/**
 * @file Commitment Tracker Service
 * @description Tracks user commitments made in chat ("I'll do X") and follows up
 * on them. When a user promises to work out, eat better, or rest, the AI
 * stores the commitment and checks back within 24-48h.
 *
 * Extracted commitments are matched against actual behavior data.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';


// ============================================
// TYPES
// ============================================

export interface UserCommitment {
  id: string;
  userId: string;
  commitmentText: string;
  category: string;           // health + life domains: career, relationships, creativity, etc.
  extractedAction: string;    // What specifically they committed to
  commitmentDate: string;
  followUpDate: string;       // When to check
  fulfilled: boolean | null;  // null = not yet checked
  followedUp: boolean;
  createdAt: string;
  lifeAreaId?: string | null;
}

// ============================================
// COMMITMENT EXTRACTION PATTERNS
// ============================================

interface CommitmentPattern {
  keywords: string[];
  category: string;
  extractAction: (message: string) => string | null;
}

const COMMITMENT_PATTERNS: CommitmentPattern[] = [
  {
    keywords: ["i'll work out", "i'll workout", "i'll exercise", "i'll train", "i'll go to the gym", "i'll hit the gym", "gonna work out", "gonna train", "going to work out"],
    category: 'workout',
    extractAction: (msg) => {
      const timeMatch = msg.match(/(?:at|by|around|before)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      return timeMatch
        ? `Workout${timeMatch ? ` at ${timeMatch[1]}` : ''}`
        : 'Complete a workout';
    },
  },
  {
    keywords: ["i'll eat", "i'll have", "gonna eat clean", "i'll cook", "i'll meal prep", "i'll track my meals", "i'll log my food"],
    category: 'nutrition',
    extractAction: () => 'Follow nutrition plan / track meals',
  },
  {
    keywords: ["i'll sleep", "i'll go to bed", "i'll be in bed", "early night", "gonna sleep early", "i'll rest"],
    category: 'sleep',
    extractAction: (msg) => {
      const timeMatch = msg.match(/(?:by|at|before)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      return timeMatch ? `In bed by ${timeMatch[1]}` : 'Sleep early / rest';
    },
  },
  {
    keywords: ["i'll drink", "i'll hydrate", "i'll drink more water", "gonna drink water", "i'll hit my water"],
    category: 'hydration',
    extractAction: () => 'Hit water intake target',
  },
  {
    keywords: [
      "i'll apply", "i will apply", "going to apply", "submit applications", "send applications",
      "update my resume", "i'll update my resume", "reach out to", "networking", "job search",
      "i'll interview", "prep for interview", "i'll study for", "skill i'll",
    ],
    category: 'career',
    extractAction: (msg) => {
      const m = msg.match(/(?:apply|application|resume|network|interview|job)\s*[^.!?]{0,50}/i);
      return m ? m[0].trim().slice(0, 80) : 'Career follow-through (applications, resume, or networking)';
    },
  },
  {
    keywords: [
      "call my mother", "call my mom", "visit my mother", "spend time with my",
      "time with family", "call my dad", "call my friend", "see my partner",
      "quality time", "i'll call", "i'll visit",
    ],
    category: 'relationships',
    extractAction: (msg) => {
      const m = msg.match(/(?:call|visit|spend time with)\s+[^.!?]{0,40}/i);
      return m ? m[0].trim().slice(0, 80) : 'Relationship or family time you committed to';
    },
  },
  {
    keywords: [
      "i'll write", "i will write", "practice guitar", "i'll draw", "i'll paint",
      "creative time", "work on my novel", "i'll practice", "make art",
    ],
    category: 'creativity',
    extractAction: (msg) => {
      const m = msg.match(/(?:write|draw|paint|practice|novel|song|art)\s*[^.!?]{0,40}/i);
      return m ? m[0].trim().slice(0, 80) : 'Creative practice you committed to';
    },
  },
  {
    keywords: ["i'll do it", "i promise", "i commit", "i'll make sure", "tomorrow i'll", "starting tomorrow", "from now on"],
    category: 'general',
    extractAction: (msg) => {
      const match = msg.match(/(?:i'll|i promise to|i commit to|i'll make sure to)\s+(.{10,60})/i);
      return match ? match[1].replace(/[.!?,]+$/, '') : 'Follow through on commitment';
    },
  },
];

// ============================================
// SERVICE CLASS
// ============================================

class CommitmentTrackerService {
  private tableEnsured = false;

  private async ensureTable(): Promise<void> {
    if (this.tableEnsured) return;
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_commitments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          commitment_text TEXT NOT NULL,
          category VARCHAR(30) NOT NULL,
          extracted_action TEXT NOT NULL,
          commitment_date DATE NOT NULL DEFAULT CURRENT_DATE,
          follow_up_date DATE NOT NULL,
          fulfilled BOOLEAN,
          followed_up BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_uc_user_followup
          ON user_commitments(user_id, follow_up_date)
          WHERE followed_up = false
      `);
      await query(`
        ALTER TABLE user_commitments
        ADD COLUMN IF NOT EXISTS life_area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL
      `).catch(() => {});
      await query(`
        CREATE INDEX IF NOT EXISTS idx_uc_user_life_area
        ON user_commitments(user_id, life_area_id)
        WHERE life_area_id IS NOT NULL
      `).catch(() => {});
      this.tableEnsured = true;
    } catch (error) {
      logger.error('[CommitmentTracker] Error ensuring table', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Extract commitments from a user's chat message.
   * Returns extracted commitments (may be empty).
   */
  extractCommitments(userMessage: string): Array<{ category: string; action: string }> {
    const messageLower = userMessage.toLowerCase();
    const extracted: Array<{ category: string; action: string }> = [];

    for (const pattern of COMMITMENT_PATTERNS) {
      const hasKeyword = pattern.keywords.some(kw => messageLower.includes(kw));
      if (!hasKeyword) continue;

      const action = pattern.extractAction(userMessage);
      if (action) {
        extracted.push({ category: pattern.category, action });
      }
    }

    return extracted;
  }

  /**
   * Store a commitment for follow-up.
   */
  async trackCommitment(
    userId: string,
    commitmentText: string,
    category: string,
    extractedAction: string,
    followUpHours = 24,
    lifeAreaId?: string | null
  ): Promise<UserCommitment | null> {
    await this.ensureTable();

    const followUpDate = new Date();
    followUpDate.setHours(followUpDate.getHours() + followUpHours);

    try {
      const followDateStr = followUpDate.toISOString().split('T')[0];
      type CommitmentRow = {
        id: string;
        user_id: string;
        commitment_text: string;
        category: string;
        extracted_action: string;
        commitment_date: string;
        follow_up_date: string;
        fulfilled: boolean | null;
        followed_up: boolean;
        created_at: string;
        life_area_id?: string | null;
      };
      const result =
        lifeAreaId != null && lifeAreaId !== ''
          ? await query<CommitmentRow>(
              `INSERT INTO user_commitments
               (user_id, commitment_text, category, extracted_action, follow_up_date, life_area_id)
               VALUES ($1, $2, $3, $4, $5::date, $6)
               RETURNING *`,
              [userId, commitmentText, category, extractedAction, followDateStr, lifeAreaId],
            )
          : await query<CommitmentRow>(
              `INSERT INTO user_commitments
               (user_id, commitment_text, category, extracted_action, follow_up_date)
               VALUES ($1, $2, $3, $4, $5::date)
               RETURNING *`,
              [userId, commitmentText, category, extractedAction, followDateStr],
            );

      if (result.rows.length === 0) return null;
      const row = result.rows[0];

      logger.debug('[CommitmentTracker] Commitment tracked', {
        userId,
        category,
        action: extractedAction,
        followUpDate: followUpDate.toISOString(),
      });

      return {
        id: row.id,
        userId: row.user_id,
        commitmentText: row.commitment_text,
        category: row.category,
        extractedAction: row.extracted_action,
        commitmentDate: row.commitment_date,
        followUpDate: row.follow_up_date,
        fulfilled: row.fulfilled,
        followedUp: row.followed_up,
        createdAt: row.created_at,
        lifeAreaId: row.life_area_id ?? null,
      };
    } catch (error) {
      logger.error('[CommitmentTracker] Error tracking commitment', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return null;
    }
  }

  /**
   * Get commitments due for follow-up (follow_up_date <= today, not yet followed up).
   */
  async getDueCommitments(userId: string): Promise<UserCommitment[]> {
    await this.ensureTable();
    try {
      const result = await query<{
        id: string;
        user_id: string;
        commitment_text: string;
        category: string;
        extracted_action: string;
        commitment_date: string;
        follow_up_date: string;
        fulfilled: boolean | null;
        followed_up: boolean;
        created_at: string;
      }>(
        `SELECT * FROM user_commitments
         WHERE user_id = $1 AND followed_up = false
           AND follow_up_date <= CURRENT_DATE
         ORDER BY commitment_date DESC
         LIMIT 5`,
        [userId]
      );

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        commitmentText: row.commitment_text,
        category: row.category,
        extractedAction: row.extracted_action,
        commitmentDate: row.commitment_date,
        followUpDate: row.follow_up_date,
        fulfilled: row.fulfilled,
        followedUp: row.followed_up,
        createdAt: row.created_at,
      }));
    } catch (error) {
      logger.error('[CommitmentTracker] Error fetching due commitments', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return [];
    }
  }

  /**
   * Mark a commitment as followed up (with optional fulfillment status).
   */
  async markFollowedUp(commitmentId: string, fulfilled?: boolean): Promise<void> {
    await this.ensureTable();
    try {
      await query(
        `UPDATE user_commitments
         SET followed_up = true, fulfilled = $2
         WHERE id = $1`,
        [commitmentId, fulfilled ?? null]
      );
    } catch (error) {
      logger.error('[CommitmentTracker] Error marking followed up', {
        commitmentId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  /**
   * Build a follow-up context for the AI chat prompt.
   * Returns empty string if no commitments are due.
   */
  async buildFollowUpContext(userId: string): Promise<string> {
    const dueCommitments = await this.getDueCommitments(userId);
    if (dueCommitments.length === 0) return '';

    const parts = dueCommitments.map(c =>
      `- "${c.extractedAction}" (${c.category}, committed ${c.commitmentDate})`
    );

    return `\n\n--- PENDING COMMITMENTS ---\n` +
      `The user made these commitments that are due for follow-up:\n${parts.join('\n')}\n` +
      `Naturally reference ONE of these in your response. Use curiosity, not accusation: ` +
      `"Yesterday you mentioned [X] — how did that go?" or "I noticed you committed to [X]. What happened?"`;
  }
}

export const commitmentTrackerService = new CommitmentTrackerService();
export default commitmentTrackerService;
