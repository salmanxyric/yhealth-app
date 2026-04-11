import { query } from '../database/pg.js';
import { logger } from './logger.service.js';
import type {
  ActivityStatus,
  PlanStatusOverride,
  WorkoutOverride,
  NutritionOverride,
  GoalOverride,
} from '../types/activity-status.types.js';

// Tier 1: Safety-critical → auto-apply
// Tier 2: Lifestyle → suggest, wait for confirmation
// Tier 3: Adjustment → suggest alternatives
const STATUS_OVERRIDE_MAP: Record<string, {
  workoutOverride: WorkoutOverride;
  nutritionOverride: NutritionOverride;
  goalOverride: GoalOverride;
  autoConfirm: boolean;
}> = {
  sick:     { workoutOverride: 'skip_all', nutritionOverride: 'comfort_foods', goalOverride: 'pause_fitness', autoConfirm: true },
  injury:   { workoutOverride: 'skip_all', nutritionOverride: 'anti_inflammatory', goalOverride: 'pause_fitness', autoConfirm: true },
  rest:     { workoutOverride: 'skip_all', nutritionOverride: 'none', goalOverride: 'none', autoConfirm: true },
  travel:   { workoutOverride: 'suggest_alternatives', nutritionOverride: 'flexible', goalOverride: 'extend_deadlines', autoConfirm: false },
  vacation: { workoutOverride: 'optional_only', nutritionOverride: 'flexible', goalOverride: 'extend_deadlines', autoConfirm: false },
  stress:   { workoutOverride: 'suggest_alternatives', nutritionOverride: 'none', goalOverride: 'reduce_intensity', autoConfirm: false },
};

const NO_OVERRIDE: PlanStatusOverride = {
  status: 'working',
  appliedAt: new Date().toISOString(),
  workoutOverride: 'none',
  nutritionOverride: 'none',
  goalOverride: 'none',
  userConfirmed: true,
};

class StatusPlanAdjusterService {
  getOverridesForStatus(status: ActivityStatus, expiresAt?: string): PlanStatusOverride {
    const mapping = STATUS_OVERRIDE_MAP[status];
    if (!mapping) return { ...NO_OVERRIDE, status };

    return {
      status,
      appliedAt: new Date().toISOString(),
      expiresAt,
      workoutOverride: mapping.workoutOverride,
      nutritionOverride: mapping.nutritionOverride,
      goalOverride: mapping.goalOverride,
      userConfirmed: mapping.autoConfirm,
    };
  }

  async applyOverridesToPlan(userId: string, status: ActivityStatus, expiresAt?: string): Promise<void> {
    const override = this.getOverridesForStatus(status, expiresAt);

    const planResult = await query<{ id: string }>(
      `SELECT id FROM user_plans WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (planResult.rows.length === 0) {
      logger.info('[StatusPlanAdjuster] No active plan to adjust', { userId, status });
      return;
    }

    const planId = planResult.rows[0]!.id;

    await query(
      `UPDATE user_plans SET status_overrides = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(override), planId]
    );

    logger.info('[StatusPlanAdjuster] Applied plan overrides', { userId, status, planId, override: override.workoutOverride });
  }

  async clearOverrides(userId: string): Promise<void> {
    await query(
      `UPDATE user_plans SET status_overrides = NULL, updated_at = NOW() WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    logger.info('[StatusPlanAdjuster] Cleared plan overrides', { userId });
  }

  async getActiveOverrides(userId: string): Promise<PlanStatusOverride | null> {
    const result = await query<{ status_overrides: PlanStatusOverride | null }>(
      `SELECT status_overrides FROM user_plans WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    return result.rows[0]?.status_overrides ?? null;
  }

  isAutoConfirmStatus(status: ActivityStatus): boolean {
    return STATUS_OVERRIDE_MAP[status]?.autoConfirm ?? false;
  }
}

export const statusPlanAdjusterService = new StatusPlanAdjusterService();
