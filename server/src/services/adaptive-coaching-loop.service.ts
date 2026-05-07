import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

export type CoachingState =
  | 'stuck'
  | 'inconsistent'
  | 'progressing'
  | 'overwhelmed'
  | 'disengaged'
  | 'stable';

export interface AdaptiveDirective {
  state: CoachingState;
  strategy: string;
  promptInjection: string;
  planAdjustments?: {
    maxActiveActions: number;
    challengeMultiplier: number;
  };
}

interface UserSignals {
  scoreTrend: number[];
  avgCompletion7d: number;
  completionVariance7d: number;
  activeGoalCount: number;
  daysSinceLastInteraction: number;
  recentMoodAvg: number | null;
  stagnantDays: number;
}

// ============================================
// PROMPT INJECTION TEMPLATES
// ============================================

const PROMPT_INJECTIONS: Record<CoachingState, string> = {
  stuck: `The user is STUCK — progress has stalled for over a week with low task completion.
COACHING STRATEGY: SIMPLIFY.
- Cut their current plan to the 1-2 most impactful actions. Remove everything else.
- Do NOT add new goals or suggestions. Reduce complexity ruthlessly.
- Ask: "What's the ONE thing you could do today?" — make it trivially easy.
- If the same action has been failing, replace it with something easier — the action is the problem, not the user.
- Acknowledge the plateau without judgment. Focus entirely on the smallest possible next step.`,

  inconsistent: `The user is INCONSISTENT — completion swings wildly day-to-day. Some great days, some total misses.
COACHING STRATEGY: REDUCE FRICTION.
- Identify what's different between good days and bad days. Ask about the environment, not willpower.
- Suggest the easiest version of each habit (2 min instead of 30 min).
- Anchor habits to existing routines ("after your morning coffee, do X").
- Don't lecture about consistency. Help them design a system that requires less motivation.
- Focus on making the default action easier, not harder to skip.`,

  progressing: `The user is PROGRESSING — steady completion rate, scores trending up. They're in a good rhythm.
COACHING STRATEGY: INCREASE CHALLENGE.
- Acknowledge the momentum genuinely — reference specific wins from their data.
- Suggest raising targets by 10-20% or adding ONE new action to their routine.
- Introduce a stretch goal or a skill-building challenge.
- Keep the positive momentum going — don't add so much that you tip them into overwhelm.
- This is the time for ambitious conversations about what's next.`,

  overwhelmed: `The user is OVERWHELMED — too many active goals with very low completion across the board.
COACHING STRATEGY: RESTRUCTURE & REDUCE.
- Immediately suggest pausing all but the TOP 1-2 goals. Frame it as strategic focus, not failure.
- Break remaining actions into tiny 5-minute steps.
- Ask which goal matters MOST to them right now — let them choose the focus.
- Do NOT add any new suggestions, goals, or habits. Remove load.
- Validate that doing less right now is the smartest move for long-term progress.`,

  disengaged: `The user is DISENGAGED — they haven't interacted much recently or session depth has been declining.
COACHING STRATEGY: RECONNECT TO PURPOSE.
- Welcome them back warmly without guilt ("Good to see you" not "Where have you been?").
- Reconnect to their original WHY — reference their stated motivation from when they set their goals.
- Reduce the plan to the absolute bare minimum. One action. One goal.
- Make re-entry frictionless. Don't review everything they missed.
- Ask a single genuine question about what's been going on in their life.`,

  stable: `The user is in a STABLE state — moderate, consistent engagement without clear red flags or strong momentum.
COACHING STRATEGY: MAINTAIN & EXPLORE.
- Continue current coaching approach. No major adjustments needed.
- Look for opportunities to deepen engagement — introduce a new domain or connection.
- Periodically check if their goals still feel right. Priorities shift.`,
};

// ============================================
// SERVICE
// ============================================

class AdaptiveCoachingLoopService {
  private cache = new Map<string, { directive: AdaptiveDirective; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async evaluate(userId: string): Promise<AdaptiveDirective> {
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.directive;
    }

    try {
      const signals = await this.gatherSignals(userId);
      const directive = this.classify(signals);

      this.cache.set(userId, { directive, timestamp: Date.now() });
      logger.debug('[AdaptiveCoachingLoop] Evaluated user state', {
        userId,
        state: directive.state,
        strategy: directive.strategy,
      });

      return directive;
    } catch (error) {
      logger.error('[AdaptiveCoachingLoop] Failed to evaluate, returning stable', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return this.buildDirective('stable');
    }
  }

  private async gatherSignals(userId: string): Promise<UserSignals> {
    const [scoreRows, completionRows, goalCountRow, lastInteractionRow, moodRow] =
      await Promise.all([
        // Last 14 days of daily scores (trend detection)
        query<{ date: string; total_score: number }>(
          `SELECT date, total_score
           FROM daily_user_scores
           WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '14 days'
           ORDER BY date ASC`,
          [userId]
        ),

        // Last 7 days of action completion rates
        query<{ completion_date: string; completed: number; total: number }>(
          `SELECT
             d.date::date AS completion_date,
             COUNT(gac.id) AS completed,
             (SELECT COUNT(*) FROM goal_actions ga
              JOIN life_goals lg ON ga.goal_id = lg.id
              WHERE lg.user_id = $1 AND lg.status = 'active' AND ga.is_completed = false
             ) AS total
           FROM generate_series(CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, '1 day') AS d(date)
           LEFT JOIN goal_action_completions gac
             ON gac.user_id = $1 AND gac.completion_date = d.date::date
           GROUP BY d.date
           ORDER BY d.date ASC`,
          [userId]
        ),

        // Active goal count
        query<{ count: string }>(
          `SELECT COUNT(*) AS count FROM life_goals WHERE user_id = $1 AND status = 'active'`,
          [userId]
        ),

        // Last interaction (most recent AI coach message)
        query<{ last_at: Date | null }>(
          `SELECT MAX(rm.created_at) AS last_at
           FROM rag_messages rm
           JOIN rag_conversations rc ON rm.conversation_id = rc.id
           WHERE rc.user_id = $1 AND rm.role = 'user'`,
          [userId]
        ),

        // Average mood last 7 days
        query<{ avg_mood: number | null }>(
          `SELECT AVG(happiness_rating) AS avg_mood
           FROM mood_logs
           WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
          [userId]
        ),
      ]);

    // Compute score trend
    const scores = scoreRows.rows.map((r) => parseFloat(r.total_score as unknown as string));

    // Compute 7-day completion stats
    const dailyRates = completionRows.rows.map((r) => {
      const total = parseInt(r.total as unknown as string) || 1;
      const completed = parseInt(r.completed as unknown as string) || 0;
      return completed / total;
    });

    const avgCompletion = dailyRates.length > 0
      ? dailyRates.reduce((a, b) => a + b, 0) / dailyRates.length
      : 0;

    // Variance = average of squared differences from mean
    const variance = dailyRates.length > 1
      ? dailyRates.reduce((sum, r) => sum + Math.pow(r - avgCompletion, 2), 0) / dailyRates.length
      : 0;

    // Count stagnant days: how many consecutive recent days had roughly the same score
    let stagnantDays = 0;
    if (scores.length >= 3) {
      const recentScores = scores.slice(-7);
      const range = Math.max(...recentScores) - Math.min(...recentScores);
      if (range < 5) {
        stagnantDays = recentScores.length;
      }
    }

    // Days since last interaction
    const lastAt = lastInteractionRow.rows[0]?.last_at;
    const daysSinceLastInteraction = lastAt
      ? Math.floor((Date.now() - new Date(lastAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      scoreTrend: scores,
      avgCompletion7d: avgCompletion,
      completionVariance7d: variance,
      activeGoalCount: parseInt(goalCountRow.rows[0]?.count ?? '0'),
      daysSinceLastInteraction,
      recentMoodAvg: moodRow.rows[0]?.avg_mood != null
        ? parseFloat(moodRow.rows[0].avg_mood as unknown as string)
        : null,
      stagnantDays,
    };
  }

  private classify(signals: UserSignals): AdaptiveDirective {
    // Priority order: disengaged > overwhelmed > stuck > inconsistent > progressing > stable

    // DISENGAGED: no interaction for 3+ days
    if (signals.daysSinceLastInteraction >= 3) {
      return this.buildDirective('disengaged');
    }

    // OVERWHELMED: many goals + very low completion (or low mood)
    if (
      signals.activeGoalCount > 5 &&
      signals.avgCompletion7d < 0.2
    ) {
      return this.buildDirective('overwhelmed');
    }
    // Also overwhelmed if moderate goals but extremely low completion + low mood
    if (
      signals.activeGoalCount > 3 &&
      signals.avgCompletion7d < 0.15 &&
      signals.recentMoodAvg !== null &&
      signals.recentMoodAvg < 3
    ) {
      return this.buildDirective('overwhelmed');
    }

    // STUCK: stagnant scores + low completion
    if (signals.stagnantDays >= 7 && signals.avgCompletion7d < 0.3) {
      return this.buildDirective('stuck');
    }

    // INCONSISTENT: high variance in daily completion
    // Variance > 0.04 means ~20% standard deviation in daily rates
    if (signals.completionVariance7d > 0.04 && signals.avgCompletion7d < 0.6) {
      return this.buildDirective('inconsistent');
    }

    // PROGRESSING: good completion + upward score trend
    if (signals.avgCompletion7d >= 0.6 && this.isTrendingUp(signals.scoreTrend)) {
      return this.buildDirective('progressing');
    }

    return this.buildDirective('stable');
  }

  private isTrendingUp(scores: number[]): boolean {
    if (scores.length < 3) return false;
    const recent = scores.slice(-3);
    return recent[2] > recent[0] && recent[1] >= recent[0];
  }

  private buildDirective(state: CoachingState): AdaptiveDirective {
    const strategyMap: Record<CoachingState, string> = {
      stuck: 'simplify',
      inconsistent: 'reduce_friction',
      progressing: 'increase_challenge',
      overwhelmed: 'restructure_reduce',
      disengaged: 'reconnect_purpose',
      stable: 'maintain_explore',
    };

    const adjustmentMap: Record<CoachingState, { maxActiveActions: number; challengeMultiplier: number } | undefined> = {
      stuck: { maxActiveActions: 2, challengeMultiplier: 0.5 },
      inconsistent: { maxActiveActions: 3, challengeMultiplier: 0.8 },
      progressing: { maxActiveActions: 8, challengeMultiplier: 1.2 },
      overwhelmed: { maxActiveActions: 2, challengeMultiplier: 0.3 },
      disengaged: { maxActiveActions: 1, challengeMultiplier: 0.5 },
      stable: undefined,
    };

    return {
      state,
      strategy: strategyMap[state],
      promptInjection: PROMPT_INJECTIONS[state],
      planAdjustments: adjustmentMap[state],
    };
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }
}

export const adaptiveCoachingLoopService = new AdaptiveCoachingLoopService();
export default adaptiveCoachingLoopService;
