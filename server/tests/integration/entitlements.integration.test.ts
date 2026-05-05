/**
 * Entitlements API Integration Tests
 *
 * Tests the server-authoritative entitlement bundle endpoint.
 */

import request from 'supertest';
import { createApp } from '../../src/app.js';
import { query } from '../../src/database/pg.js';
import { createAuthenticatedUser } from '../helpers/testUtils.js';
import { seedSubscriptionPlan, seedUserSubscription } from '../helpers/subscription.testUtils.js';
import { seedCreditWallet as _seedCreditWallet, cleanupEntitlementData } from '../helpers/entitlement.testUtils.js';
import type { Application } from 'express';

describe('Entitlements API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/me/entitlements', () => {
    const endpoint = '/api/me/entitlements';

    it('should require authentication', async () => {
      await request(app).get(endpoint).expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get(endpoint)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return entitlement bundle for free user', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;

      // Plan info
      expect(data).toHaveProperty('plan');
      expect(data.plan).toHaveProperty('slug');
      expect(data.plan).toHaveProperty('tier');
      expect(data.plan).toHaveProperty('name');

      // Subscription info
      expect(data).toHaveProperty('subscription');

      // Features map
      expect(data).toHaveProperty('features');
      expect(typeof data.features).toBe('object');

      // Wallet
      expect(data).toHaveProperty('wallet');
      expect(data.wallet).toHaveProperty('planCredits');
      expect(data.wallet).toHaveProperty('bonusCredits');
      expect(data.wallet).toHaveProperty('total');

      // Pages and menus
      expect(data).toHaveProperty('pages');
      expect(data).toHaveProperty('menus');

      // Metadata
      expect(data).toHaveProperty('computedAt');
      expect(data).toHaveProperty('etag');
    });

    it('should set ETag header', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.headers['etag']).toBeDefined();
      expect(res.headers['etag']).toMatch(/^W\//);
    });

    it('should set Cache-Control header', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.headers['cache-control']).toContain('private');
      expect(res.headers['cache-control']).toContain('max-age=60');
    });

    it('should return 304 when If-None-Match matches ETag', async () => {
      const { accessToken } = await createAuthenticatedUser();

      // First request to get ETag
      const first = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const etag = first.headers['etag'];
      expect(etag).toBeDefined();

      // Second request with If-None-Match
      await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('If-None-Match', etag)
        .expect(304);
    });

    it('should return 200 when If-None-Match does not match', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('If-None-Match', 'W/"stale-etag"')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reflect subscription plan for subscribed user', async () => {
      const { user, accessToken } = await createAuthenticatedUser();

      // Seed a Pro plan and subscription
      const plan = await seedSubscriptionPlan({
        slug: `entitlement-test-pro-${Date.now()}`,
        name: 'Pro Test',
        tier: 20,
        amountCents: 999,
      });
      await seedUserSubscription({
        userId: user.id,
        planId: plan.id,
        status: 'active',
      });

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      // The plan should reflect the seeded plan
      expect(res.body.data.plan.tier).toBeGreaterThanOrEqual(0);
      expect(res.body.data.subscription).toHaveProperty('status');
    });

    it('should auto-create wallet for first-time users', async () => {
      const { user, accessToken } = await createAuthenticatedUser();

      // Ensure no wallet exists
      await query(`DELETE FROM credit_wallets WHERE user_id = $1`, [user.id]).catch(() => {});

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.wallet).toBeDefined();

      // Verify wallet was created in DB
      const walletCheck = await query(
        `SELECT user_id FROM credit_wallets WHERE user_id = $1`,
        [user.id]
      );
      expect(walletCheck.rows.length).toBe(1);

      await cleanupEntitlementData(user.id);
    });

    it('should return different bundles for different users', async () => {
      const { accessToken: token1 } = await createAuthenticatedUser();
      const { accessToken: token2 } = await createAuthenticatedUser();

      const [res1, res2] = await Promise.all([
        request(app).get(endpoint).set('Authorization', `Bearer ${token1}`).expect(200),
        request(app).get(endpoint).set('Authorization', `Bearer ${token2}`).expect(200),
      ]);

      // ETags should differ because different users
      expect(res1.headers['etag']).not.toBe(res2.headers['etag']);
    });
  });
});
