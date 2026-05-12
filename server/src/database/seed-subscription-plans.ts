/**
 * @file Seed Subscription Plans
 * @description Deletes ALL existing plans and seeds exactly 3: Free, Pro, Premium.
 *   Also populates plan_features, plan_pages, plan_menus entitlement matrices.
 *   Run: npx tsx src/database/seed-subscription-plans.ts
 */

import { query, transaction, closePool } from '../config/database.config.js';

const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Essential tracking and community access. Start your wellness journey today.',
    amount_cents: 0,
    currency: 'usd',
    interval: 'month' as const,
    tier: 0,
    credits_included_monthly: 100,
    credits_rollover_policy: 'none',
    credits_rollover_cap: 0,
    trial_days: 7,
    sort_order: 0,
    features: [
      '1 week free full access to all features',
      'Basic activity & mood tracking',
      'Daily step counter & water intake',
      '7-day history',
      'Community access',
    ],
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'Full access, billed monthly. Cancel anytime.',
    amount_cents: 999,
    currency: 'usd',
    interval: 'month' as const,
    tier: 20,
    credits_included_monthly: 2000,
    credits_rollover_policy: 'cap',
    credits_rollover_cap: 2000,
    trial_days: 0,
    sort_order: 1,
    features: [
      'Everything in Free',
      'Unlimited AI coaching & insights',
      'Advanced analytics & trends',
      'Nutrition & meal planning',
      'Sleep & recovery analysis',
      'Workout plans & exercise library',
      'Mood & journal tracking',
      'Unlimited history',
      'Priority support',
    ],
  },
  {
    name: 'Premium',
    slug: 'premium',
    description: 'Everything in Pro plus exclusive features. Billed yearly — save vs monthly.',
    amount_cents: 19999,
    currency: 'usd',
    interval: 'year' as const,
    tier: 30,
    credits_included_monthly: 5000,
    credits_rollover_policy: 'cap',
    credits_rollover_cap: 5000,
    trial_days: 0,
    sort_order: 2,
    features: [
      'Everything in Pro',
      'Voice AI assistant',
      'Knowledge graph insights',
      'Money map & financial wellness',
      'Premium competitions & leaderboards',
      'Webinars & exclusive content',
      'Advanced export & reports',
      'Soundscape & guided meditation',
      'Billed yearly — save vs monthly',
    ],
  },
];

async function seedSubscriptionPlans(): Promise<void> {
  console.log('🌱 Seeding subscription plans…\n');

  await transaction(async (client) => {
    // ── 1. Wipe existing entitlement matrices + plans ──
    console.log('🗑️  Deleting existing entitlement matrices…');
    await client.query('DELETE FROM plan_menus');
    await client.query('DELETE FROM plan_pages');
    await client.query('DELETE FROM plan_features');

    console.log('🗑️  Deleting existing subscription plans…');
    await client.query('DELETE FROM user_subscriptions');
    await client.query('DELETE FROM subscription_plans');

    // ── 2. Insert 3 plans ──
    const now = new Date().toISOString();
    const planIds: Record<string, string> = {};

    for (const plan of PLANS) {
      const r = await client.query<{ id: string }>(
        `INSERT INTO subscription_plans (
          name, slug, description, stripe_price_id, stripe_product_id,
          amount_cents, currency, interval, features, is_active, sort_order,
          tier, credits_included_monthly, credits_rollover_policy, credits_rollover_cap,
          trial_days, is_public, version,
          created_at, updated_at
        ) VALUES ($1,$2,$3, NULL, NULL, $4,$5,$6, $7::jsonb, true, $8,
                  $9, $10, $11, $12, $13, true, 1,
                  $14::timestamptz, $14::timestamptz)
        RETURNING id`,
        [
          plan.name, plan.slug, plan.description,
          plan.amount_cents, plan.currency, plan.interval,
          JSON.stringify(plan.features), plan.sort_order,
          plan.tier, plan.credits_included_monthly,
          plan.credits_rollover_policy, plan.credits_rollover_cap,
          plan.trial_days, now,
        ]
      );
      planIds[plan.slug] = r.rows[0].id;
      const price = plan.interval === 'year'
        ? `$${(plan.amount_cents / 100).toFixed(2)}/year`
        : `$${(plan.amount_cents / 100).toFixed(2)}/mo`;
      console.log(`  ✅ ${plan.name} (${plan.slug}) — ${price}  [tier=${plan.tier}, credits=${plan.credits_included_monthly}/mo]`);
    }

    // ── 3. Seed plan_features ──
    console.log('\n📋 Seeding plan_features…');

    // FREE: all features enabled — users get 100 credits to explore the full platform.
    // When credits run out the entitlement middleware returns 402 and the client
    // shows the upgrade modal.
    await client.query(
      `INSERT INTO plan_features (plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost)
       SELECT $1::uuid, fc.feature_key, true, NULL, NULL, NULL
         FROM feature_catalog fc`,
      [planIds['free']]
    );
    console.log('  ✅ Free plan features seeded (all enabled)');

    // PRO: everything enabled
    await client.query(
      `INSERT INTO plan_features (plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost)
       SELECT $1::uuid, fc.feature_key, true, NULL, NULL, NULL
         FROM feature_catalog fc`,
      [planIds['pro']]
    );
    console.log('  ✅ Pro plan features seeded');

    // PREMIUM: everything enabled
    await client.query(
      `INSERT INTO plan_features (plan_id, feature_key, is_enabled, limit_value, limit_period, credit_cost)
       SELECT $1::uuid, fc.feature_key, true, NULL, NULL, NULL
         FROM feature_catalog fc`,
      [planIds['premium']]
    );
    console.log('  ✅ Premium plan features seeded');

    // ── 4. Seed plan_pages ──
    console.log('\n📄 Seeding plan_pages…');

    // FREE: full access to all pages
    await client.query(
      `INSERT INTO plan_pages (plan_id, page_key, access_level)
       SELECT $1::uuid, pc.page_key, 'full'
         FROM page_catalog pc`,
      [planIds['free']]
    );
    console.log('  ✅ Free plan pages seeded');

    // PRO: full access to all pages
    await client.query(
      `INSERT INTO plan_pages (plan_id, page_key, access_level)
       SELECT $1::uuid, pc.page_key, 'full'
         FROM page_catalog pc`,
      [planIds['pro']]
    );
    console.log('  ✅ Pro plan pages seeded');

    // PREMIUM: everything full
    await client.query(
      `INSERT INTO plan_pages (plan_id, page_key, access_level)
       SELECT $1::uuid, pc.page_key, 'full'
         FROM page_catalog pc`,
      [planIds['premium']]
    );
    console.log('  ✅ Premium plan pages seeded');

    // ── 5. Seed plan_menus ──
    console.log('\n📌 Seeding plan_menus…');

    // FREE: all visible, no locks
    await client.query(
      `INSERT INTO plan_menus (plan_id, menu_key, visible, locked_cta)
       SELECT $1::uuid, mc.menu_key, true, NULL
         FROM menu_catalog mc`,
      [planIds['free']]
    );
    console.log('  ✅ Free plan menus seeded');

    // PRO: all visible, no locks
    await client.query(
      `INSERT INTO plan_menus (plan_id, menu_key, visible, locked_cta)
       SELECT $1::uuid, mc.menu_key, true, NULL
         FROM menu_catalog mc`,
      [planIds['pro']]
    );
    console.log('  ✅ Pro plan menus seeded');

    // PREMIUM: everything visible, no locks
    await client.query(
      `INSERT INTO plan_menus (plan_id, menu_key, visible, locked_cta)
       SELECT $1::uuid, mc.menu_key, true, NULL
         FROM menu_catalog mc`,
      [planIds['premium']]
    );
    console.log('  ✅ Premium plan menus seeded');
  });

  // Reset test user trial (dev convenience)
  const updated = await query(
    `UPDATE users SET created_at = NOW() AT TIME ZONE 'UTC' WHERE email = 'salman@xyric.ai' RETURNING id`
  );
  if (updated.rows.length > 0) {
    console.log('\n✅ Reset salman@xyric.ai created_at to NOW (trial restarted)');
  }

  console.log('\n🎉 Subscription plans seed completed — 3 plans with full entitlement matrices.');
  await closePool();
}

seedSubscriptionPlans().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
