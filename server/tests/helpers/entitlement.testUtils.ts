/**
 * Entitlement & Credit test utilities.
 * Seed feature configs, credit wallets, promo codes, and usage events.
 */

import { query } from '../../src/database/pg.js';

// ---------------------------------------------------------------------------
// Feature catalog seeding
// ---------------------------------------------------------------------------

export async function seedFeatureConfig(opts: {
  planId: string;
  featureKey: string;
  isEnabled?: boolean;
  limit?: number | null;
  limitPeriod?: 'day' | 'week' | 'month' | 'cycle' | null;
  creditCost?: number;
}): Promise<void> {
  // Ensure the feature exists in the catalog
  await query(
    `INSERT INTO feature_catalog (key, label, description)
     VALUES ($1, $1, $1)
     ON CONFLICT (key) DO NOTHING`,
    [opts.featureKey]
  );

  // Link feature to plan
  await query(
    `INSERT INTO plan_features (plan_id, feature_key, is_enabled, "limit", limit_period, credit_cost)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (plan_id, feature_key) DO UPDATE SET
       is_enabled = EXCLUDED.is_enabled,
       "limit" = EXCLUDED."limit",
       limit_period = EXCLUDED.limit_period,
       credit_cost = EXCLUDED.credit_cost`,
    [
      opts.planId,
      opts.featureKey,
      opts.isEnabled ?? true,
      opts.limit ?? null,
      opts.limitPeriod ?? null,
      opts.creditCost ?? 0,
    ]
  );
}

// ---------------------------------------------------------------------------
// Credit wallet seeding
// ---------------------------------------------------------------------------

export async function seedCreditWallet(opts: {
  userId: string;
  planCredits?: number;
  bonusCredits?: number;
}): Promise<{ user_id: string }> {
  const planCredits = opts.planCredits ?? 100;
  const bonusCredits = opts.bonusCredits ?? 0;

  const r = await query<{ user_id: string }>(
    `INSERT INTO credit_wallets (user_id, plan_credits_balance, bonus_credits_balance)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET
       plan_credits_balance = EXCLUDED.plan_credits_balance,
       bonus_credits_balance = EXCLUDED.bonus_credits_balance,
       updated_at = NOW() AT TIME ZONE 'UTC'
     RETURNING user_id`,
    [opts.userId, planCredits, bonusCredits]
  );
  return r.rows[0];
}

// ---------------------------------------------------------------------------
// Credit transaction seeding (for ledger tests)
// ---------------------------------------------------------------------------

export async function seedCreditTransaction(opts: {
  userId: string;
  delta: number;
  bucket?: 'plan' | 'bonus';
  kind?: string;
  reason?: string;
  featureKey?: string | null;
  balanceAfterPlan?: number;
  balanceAfterBonus?: number;
}): Promise<{ id: string }> {
  const r = await query<{ id: string }>(
    `INSERT INTO credit_transactions (
      user_id, delta, bucket, kind, reason,
      feature_key, balance_after_plan, balance_after_bonus
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id`,
    [
      opts.userId,
      opts.delta,
      opts.bucket ?? 'plan',
      opts.kind ?? 'grant',
      opts.reason ?? 'test',
      opts.featureKey ?? null,
      opts.balanceAfterPlan ?? 100,
      opts.balanceAfterBonus ?? 0,
    ]
  );
  return r.rows[0];
}

// ---------------------------------------------------------------------------
// Promo code seeding
// ---------------------------------------------------------------------------

export async function seedPromoCode(opts: {
  code: string;
  kind?: string;
  creditsGranted?: number;
  maxRedemptions?: number | null;
  perUserLimit?: number;
  isActive?: boolean;
  startsAt?: Date;
  expiresAt?: Date | null;
}): Promise<{ id: string; code: string }> {
  const r = await query<{ id: string; code: string }>(
    `INSERT INTO promo_codes (
      code, kind, credits_granted, max_redemptions,
      per_user_limit, is_active, starts_at, expires_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id, code`,
    [
      opts.code.toUpperCase(),
      opts.kind ?? 'credit_grant',
      opts.creditsGranted ?? 50,
      opts.maxRedemptions ?? null,
      opts.perUserLimit ?? 1,
      opts.isActive ?? true,
      opts.startsAt ?? new Date(Date.now() - 86400000),
      opts.expiresAt ?? null,
    ]
  );
  return r.rows[0];
}

// ---------------------------------------------------------------------------
// Usage event seeding (for feature limit tests)
// ---------------------------------------------------------------------------

export async function seedUsageEvent(opts: {
  userId: string;
  featureKey: string;
  status?: string;
  createdAt?: Date;
}): Promise<void> {
  await query(
    `INSERT INTO usage_events (user_id, feature_key, status, created_at)
     VALUES ($1, $2, $3, $4)`,
    [
      opts.userId,
      opts.featureKey,
      opts.status ?? 'settled',
      opts.createdAt ?? new Date(),
    ]
  );
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export async function cleanupEntitlementData(userId: string): Promise<void> {
  const tables = [
    'usage_events',
    'credit_transactions',
    'credit_wallets',
    'user_entitlements_cache',
    'admin_overrides',
    'audit_log',
  ];
  for (const table of tables) {
    try {
      await query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
    } catch { /* table may not exist */ }
  }
}

export async function cleanupPromoCode(code: string): Promise<void> {
  try {
    const upper = code.toUpperCase();
    await query(
      `DELETE FROM promo_redemptions WHERE promo_code_id IN (SELECT id FROM promo_codes WHERE code = $1)`,
      [upper]
    );
    await query(`DELETE FROM promo_codes WHERE code = $1`, [upper]);
  } catch { /* ignore */ }
}
