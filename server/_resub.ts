import { query, closePool } from './src/config/database.config.js';
import { grantCredits } from './src/services/credit.service.js';

async function main() {
  const userId = 'f7d1bd7e-a910-484a-b717-85584a92b398';
  
  // Get Premium plan ID
  const plan = await query(`SELECT id, credits_included_monthly FROM subscription_plans WHERE slug = 'premium'`);
  if (!plan.rows[0]) { console.log('Premium plan not found'); return; }
  const planId = plan.rows[0].id;
  const credits = plan.rows[0].credits_included_monthly;
  console.log('Premium plan:', planId, 'credits:', credits);

  // Create subscription
  const now = new Date();
  const end = new Date(now);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  
  await query(
    `INSERT INTO user_subscriptions (
      user_id, plan_id, stripe_subscription_id, stripe_customer_id, status,
      current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at
    ) VALUES ($1, $2, NULL, NULL, 'active', $3::timestamptz, $4::timestamptz, false, $3::timestamptz, $3::timestamptz)`,
    [userId, planId, now.toISOString(), end.toISOString()]
  );
  console.log('Subscription created');

  // Get subscription ID for idempotency key
  const sub = await query(`SELECT id FROM user_subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`, [userId]);
  const subId = sub.rows[0]?.id;

  // Reset wallet and re-grant credits
  await query(`UPDATE credit_wallets SET plan_credits_balance = 0, bonus_credits_balance = 0, version = version + 1, updated_at = NOW() AT TIME ZONE 'UTC' WHERE user_id = $1`, [userId]);
  
  const wallet = await grantCredits({
    userId,
    amount: credits,
    bucket: 'plan',
    reason: 'subscription:premium:initial_grant',
    kind: 'grant',
    idempotencyKey: `subscription:initial:${subId}:${userId}`,
  });
  
  console.log('Credits granted:', { plan: wallet.plan_credits_balance, bonus: wallet.bonus_credits_balance, total: wallet.plan_credits_balance + wallet.bonus_credits_balance });
  
  // Clear entitlements cache
  await query(`DELETE FROM user_entitlements_cache WHERE user_id = $1`, [userId]).catch(() => {});
  
  await closePool();
}
main().catch(e => { console.error(e); process.exit(1); });
