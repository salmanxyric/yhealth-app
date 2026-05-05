/**
 * @file Shared Challenge Service
 * @description AI-driven shared challenge generation and competition invitation management.
 * Takes 2+ users, finds goal commonality via LLM, creates a competition, and sends invitations.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import { modelFactory } from './model-factory.service.js';
import { llmCircuitBreaker } from './llm-circuit-breaker.service.js';
import { notificationEngine } from './notification-engine.service.js';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

// ─── Types ───────────────────────────────────────────────────────────

export interface GeneratedChallenge {
  name: string;
  description: string;
  metric: string;
  durationDays: number;
  target: number | null;
  reasoning: string;
  scoringWeights: Record<string, number>;
}

export interface CompetitionInvitation {
  id: string;
  competitionId: string;
  inviterId: string;
  inviteeId: string;
  status: string;
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
  competitionName?: string;
  inviterName?: string;
}

// ─── Table auto-creation ─────────────────────────────────────────────

let tablesEnsured = false;

async function ensureTables(): Promise<void> {
  if (tablesEnsured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS competition_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
        inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        message TEXT,
        responded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(competition_id, invitee_id)
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_ci_invitee_pending ON competition_invitations(invitee_id, status) WHERE status = 'pending'`);
    tablesEnsured = true;
  } catch (error) {
    logger.error('[SharedChallenge] Error ensuring tables', { error: error instanceof Error ? error.message : 'Unknown' });
  }
}

// ─── Service ─────────────────────────────────────────────────────────

class SharedChallengeService {
  private llm: BaseChatModel | null = null;
  private _rateMap = new Map<string, number>();
  private static COOLDOWN_MS = 60 * 60 * 1000; // 1 per hour per user

  private async getLLM(): Promise<BaseChatModel | null> {
    if (this.llm) return this.llm;
    try {
      this.llm = modelFactory.getModel({ tier: 'default' });
      return this.llm;
    } catch {
      return null;
    }
  }

  /**
   * Generate a shared challenge for a group of users based on their goals.
   */
  async generateChallenge(requesterId: string, userIds: string[]): Promise<GeneratedChallenge> {
    const allIds = [requesterId, ...userIds.filter(id => id !== requesterId)];
    if (allIds.length < 2) throw new Error('Need at least 2 participants');

    const lastCall = this._rateMap.get(requesterId);
    if (lastCall && Date.now() - lastCall < SharedChallengeService.COOLDOWN_MS) {
      throw new Error('Please wait before generating another challenge');
    }

    // Gather goals for all participants
    const goalsResult = await query<{
      user_id: string; first_name: string; pillar: string; category: string; title: string;
    }>(
      `SELECT ug.user_id, u.first_name, ug.pillar, ug.category, ug.title
       FROM user_goals ug
       JOIN users u ON u.id = ug.user_id
       WHERE ug.user_id = ANY($1::uuid[]) AND ug.status = 'active'
       ORDER BY ug.is_primary DESC, ug.created_at DESC`,
      [allIds]
    );

    const userGoals = new Map<string, { name: string; goals: string[] }>();
    for (const row of goalsResult.rows) {
      const existing = userGoals.get(row.user_id) || { name: row.first_name, goals: [] };
      existing.goals.push(`${row.pillar}/${row.category}: ${row.title}`);
      userGoals.set(row.user_id, existing);
    }

    if (!llmCircuitBreaker.isCallAllowed()) {
      return this.fallbackChallenge(userGoals);
    }

    const llm = await this.getLLM();
    if (!llm) return this.fallbackChallenge(userGoals);

    try {
      const participantSummaries = Array.from(userGoals.entries()).map(([, v]) =>
        `- ${v.name}: ${v.goals.slice(0, 3).join('; ') || 'no active goals'}`
      ).join('\n');

      const prompt = `You are a fitness challenge designer. Create ONE shared challenge that benefits ALL participants.

Participants:
${participantSummaries || '- No goal data available'}

Find the commonality — even if goals differ, find what helps everyone (e.g., sleep improvement helps weight loss AND muscle gain).

Return JSON (no markdown):
{"name":"short catchy name (max 40 chars)","description":"1-sentence motivating description","metric":"workout|nutrition|wellbeing|steps|sleep","durationDays":7,"target":null,"reasoning":"why this helps all participants","scoringWeights":{"workout":20,"nutrition":20,"wellbeing":20,"biometrics":10,"engagement":15,"consistency":15}}

durationDays must be 3, 7, 14, or 30. target is optional numeric goal.`;

      const response = await llm.invoke(prompt);
      this._rateMap.set(requesterId, Date.now());

      const text = typeof response.content === 'string' ? response.content : String(response.content);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return this.fallbackChallenge(userGoals);

      const parsed = JSON.parse(jsonMatch[0]);
      llmCircuitBreaker.recordSuccess();

      return {
        name: parsed.name || 'Shared Accountability Challenge',
        description: parsed.description || 'Work together toward better health!',
        metric: parsed.metric || 'workout',
        durationDays: [3, 7, 14, 30].includes(parsed.durationDays) ? parsed.durationDays : 7,
        target: parsed.target || null,
        reasoning: parsed.reasoning || 'Shared health goals',
        scoringWeights: parsed.scoringWeights || { workout: 20, nutrition: 20, wellbeing: 20, biometrics: 10, engagement: 15, consistency: 15 },
      };
    } catch (error) {
      llmCircuitBreaker.recordRateLimitError(error);
      logger.warn('[SharedChallenge] LLM generation failed', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return this.fallbackChallenge(userGoals);
    }
  }

  private fallbackChallenge(_userGoals: Map<string, { name: string; goals: string[] }>): GeneratedChallenge {
    return {
      name: '7-Day Wellness Sprint',
      description: 'Stay active, eat clean, and support each other for 7 days!',
      metric: 'workout',
      durationDays: 7,
      target: null,
      reasoning: 'A well-rounded challenge that benefits everyone',
      scoringWeights: { workout: 25, nutrition: 25, wellbeing: 15, biometrics: 10, engagement: 10, consistency: 15 },
    };
  }

  /**
   * Create a competition from a generated challenge, auto-join creator, and invite others.
   */
  async createSharedCompetition(
    challenge: GeneratedChallenge,
    creatorId: string,
    inviteeIds: string[],
    message?: string,
  ): Promise<{ competitionId: string; invitationCount: number }> {
    await ensureTables();

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + challenge.durationDays * 24 * 60 * 60 * 1000);

    // Create competition
    const compResult = await query<{ id: string }>(
      `INSERT INTO competitions (name, type, description, start_date, end_date, rules, eligibility, scoring_weights, status, created_by)
       VALUES ($1, 'ai_generated', $2, $3, $4, $5, '{}', $6, 'active', $7)
       RETURNING id`,
      [
        challenge.name,
        challenge.description,
        startDate.toISOString(),
        endDate.toISOString(),
        JSON.stringify({ metric: challenge.metric, aggregation: 'total', target: challenge.target }),
        JSON.stringify(challenge.scoringWeights),
        creatorId,
      ]
    );

    const competitionId = compResult.rows[0].id;

    // Auto-join creator
    await query(
      `INSERT INTO competition_entries (competition_id, user_id, status) VALUES ($1, $2, 'active')
       ON CONFLICT (competition_id, user_id) DO NOTHING`,
      [competitionId, creatorId]
    );

    // Get creator name
    const creatorResult = await query<{ first_name: string }>(
      'SELECT first_name FROM users WHERE id = $1', [creatorId]
    );
    const creatorName = creatorResult.rows[0]?.first_name || 'Someone';

    // Create invitations and notify
    let invitationCount = 0;
    for (const inviteeId of inviteeIds) {
      if (inviteeId === creatorId) continue;
      try {
        await query(
          `INSERT INTO competition_invitations (competition_id, inviter_id, invitee_id, message)
           VALUES ($1, $2, $3, $4) ON CONFLICT (competition_id, invitee_id) DO NOTHING`,
          [competitionId, creatorId, inviteeId, message || null]
        );

        await notificationEngine.send({
          userId: inviteeId,
          type: 'social',
          title: 'Challenge Invitation!',
          message: `${creatorName} invited you to "${challenge.name}" — ${challenge.description}`,
          icon: '🏆',
          priority: 'high',
          relatedEntityType: 'challenge_invitation',
          relatedEntityId: competitionId,
          actionUrl: '/dashboard?tab=social',
          actionLabel: 'View Challenge',
        });

        invitationCount++;
      } catch (error) {
        logger.warn('[SharedChallenge] Failed to invite user', { inviteeId, error: error instanceof Error ? error.message : 'Unknown' });
      }
    }

    return { competitionId, invitationCount };
  }

  /**
   * Get pending invitations for a user.
   */
  async getPendingInvitations(userId: string): Promise<CompetitionInvitation[]> {
    await ensureTables();
    const result = await query<{
      id: string; competition_id: string; inviter_id: string; invitee_id: string;
      status: string; message: string | null; created_at: string; responded_at: string | null;
      competition_name: string; inviter_name: string;
    }>(
      `SELECT ci.*, c.name as competition_name,
              u.first_name || ' ' || COALESCE(u.last_name, '') as inviter_name
       FROM competition_invitations ci
       JOIN competitions c ON c.id = ci.competition_id
       JOIN users u ON u.id = ci.inviter_id
       WHERE ci.invitee_id = $1 AND ci.status = 'pending'
       ORDER BY ci.created_at DESC`,
      [userId]
    );

    return result.rows.map(r => ({
      id: r.id,
      competitionId: r.competition_id,
      inviterId: r.inviter_id,
      inviteeId: r.invitee_id,
      status: r.status,
      message: r.message,
      createdAt: r.created_at,
      respondedAt: r.responded_at,
      competitionName: r.competition_name,
      inviterName: r.inviter_name,
    }));
  }

  /**
   * Accept a challenge invitation — join the competition.
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    await ensureTables();

    const result = await query<{ competition_id: string; inviter_id: string }>(
      `UPDATE competition_invitations SET status = 'accepted', responded_at = NOW()
       WHERE id = $1 AND invitee_id = $2 AND status = 'pending'
       RETURNING competition_id, inviter_id`,
      [invitationId, userId]
    );

    if (result.rows.length === 0) throw new Error('Invitation not found or already responded');

    const { competition_id, inviter_id } = result.rows[0];

    // Join the competition
    await query(
      `INSERT INTO competition_entries (competition_id, user_id, status) VALUES ($1, $2, 'active')
       ON CONFLICT (competition_id, user_id) DO NOTHING`,
      [competition_id, userId]
    );

    // Notify the inviter
    const userName = await query<{ first_name: string }>('SELECT first_name FROM users WHERE id = $1', [userId]);
    const name = userName.rows[0]?.first_name || 'Someone';
    const compName = await query<{ name: string }>('SELECT name FROM competitions WHERE id = $1', [competition_id]);
    const challengeName = compName.rows[0]?.name || 'challenge';

    await notificationEngine.send({
      userId: inviter_id,
      type: 'social',
      title: 'Challenge Accepted!',
      message: `${name} joined your "${challengeName}"`,
      icon: '🎉',
      priority: 'normal',
      relatedEntityType: 'challenge_accepted',
      relatedEntityId: competition_id,
      actionUrl: `/competitions/${competition_id}`,
    });

    // Check if enough participants (3+) — notify all participants that challenge is active
    const participantCount = await query<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM competition_entries WHERE competition_id = $1 AND status = 'active'`,
      [competition_id]
    );
    const count = Number(participantCount.rows[0]?.count || 0);
    if (count === 3) {
      const participants = await query<{ user_id: string }>(
        'SELECT user_id FROM competition_entries WHERE competition_id = $1 AND status = $2',
        [competition_id, 'active']
      );
      for (const p of participants.rows) {
        notificationEngine.send({
          userId: p.user_id,
          type: 'competition',
          title: 'Challenge Started!',
          message: `"${challengeName}" now has ${count} participants — game on!`,
          icon: '🔥',
          priority: 'normal',
          relatedEntityType: 'competition_started',
          relatedEntityId: competition_id,
          actionUrl: `/competitions/${competition_id}`,
        }).catch(() => {});
      }
    }
  }

  /**
   * Decline a challenge invitation.
   */
  async declineInvitation(invitationId: string, userId: string): Promise<void> {
    await ensureTables();
    const result = await query(
      `UPDATE competition_invitations SET status = 'declined', responded_at = NOW()
       WHERE id = $1 AND invitee_id = $2 AND status = 'pending'`,
      [invitationId, userId]
    );
    if (result.rowCount === 0) throw new Error('Invitation not found or already responded');
  }

  /**
   * Send invitations to existing competition.
   */
  async inviteToCompetition(
    competitionId: string,
    inviterId: string,
    inviteeIds: string[],
    message?: string,
  ): Promise<number> {
    await ensureTables();

    const comp = await query<{ name: string }>('SELECT name FROM competitions WHERE id = $1', [competitionId]);
    if (comp.rows.length === 0) throw new Error('Competition not found');

    const inviterResult = await query<{ first_name: string }>('SELECT first_name FROM users WHERE id = $1', [inviterId]);
    const inviterName = inviterResult.rows[0]?.first_name || 'Someone';
    let count = 0;

    for (const inviteeId of inviteeIds) {
      if (inviteeId === inviterId) continue;
      try {
        await query(
          `INSERT INTO competition_invitations (competition_id, inviter_id, invitee_id, message)
           VALUES ($1, $2, $3, $4) ON CONFLICT (competition_id, invitee_id) DO NOTHING`,
          [competitionId, inviterId, inviteeId, message || null]
        );

        await notificationEngine.send({
          userId: inviteeId,
          type: 'social',
          title: 'Challenge Invitation!',
          message: `${inviterName} invited you to "${comp.rows[0].name}"`,
          icon: '🏆',
          priority: 'high',
          relatedEntityType: 'challenge_invitation',
          relatedEntityId: competitionId,
          actionUrl: '/dashboard?tab=social',
          actionLabel: 'View Challenge',
        });
        count++;
      } catch {
        // skip duplicates
      }
    }
    return count;
  }
}

export const sharedChallengeService = new SharedChallengeService();
export default sharedChallengeService;
