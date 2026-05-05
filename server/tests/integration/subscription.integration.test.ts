/**
 * Subscription API Integration Tests
 *
 * Tests plan listing, auth guards, and subscription management.
 * Stripe SDK calls are not mocked here — those routes test validation/auth only.
 * Full Stripe webhook flow is tested in stripe-webhook.integration.test.ts.
 */

import request from 'supertest';
import { createApp } from '../../src/app.js';
import { query } from '../../src/database/pg.js';
import { createAuthenticatedUser } from '../helpers/testUtils.js';
import type { Application } from 'express';

describe('Subscription API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  // ---------------------------------------------------------------
  // GET /api/subscription/plans
  // ---------------------------------------------------------------
  describe('GET /api/subscription/plans', () => {
    it('should return plans without authentication', async () => {
      const res = await request(app)
        .get('/api/subscription/plans')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('plans');
      expect(Array.isArray(res.body.data.plans)).toBe(true);
    });

    it('should return plans with authentication', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .get('/api/subscription/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.plans).toBeDefined();
    });

    it('should include plan properties in response', async () => {
      const res = await request(app)
        .get('/api/subscription/plans')
        .expect(200);

      if (res.body.data.plans.length > 0) {
        const plan = res.body.data.plans[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('slug');
        expect(plan).toHaveProperty('name');
      }
    });
  });

  // ---------------------------------------------------------------
  // POST /api/subscription/checkout-session
  // ---------------------------------------------------------------
  describe('POST /api/subscription/checkout-session', () => {
    const endpoint = '/api/subscription/checkout-session';

    it('should require authentication', async () => {
      const res = await request(app)
        .post(endpoint)
        .send({
          planId: '00000000-0000-0000-0000-000000000000',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid planId format', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          planId: 'not-a-uuid',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing fields', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid URL format', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          planId: '00000000-0000-0000-0000-000000000001',
          successUrl: 'not-a-url',
          cancelUrl: 'http://localhost:3000/cancel',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // POST /api/subscription/portal-session
  // ---------------------------------------------------------------
  describe('POST /api/subscription/portal-session', () => {
    const endpoint = '/api/subscription/portal-session';

    it('should require authentication', async () => {
      await request(app)
        .post(endpoint)
        .send({ returnUrl: 'http://localhost:3000/settings' })
        .expect(401);
    });

    it('should reject invalid returnUrl', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ returnUrl: 'not-a-url' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // POST /api/subscription/verify-session
  // ---------------------------------------------------------------
  describe('POST /api/subscription/verify-session', () => {
    const endpoint = '/api/subscription/verify-session';

    it('should require authentication', async () => {
      await request(app)
        .post(endpoint)
        .send({ session_id: 'cs_test_123' })
        .expect(401);
    });

    it('should reject empty session_id', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ session_id: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing session_id', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // POST /api/subscription/sync-from-stripe
  // ---------------------------------------------------------------
  describe('POST /api/subscription/sync-from-stripe', () => {
    const endpoint = '/api/subscription/sync-from-stripe';

    it('should require authentication', async () => {
      await request(app)
        .post(endpoint)
        .expect(401);
    });
  });

  // ---------------------------------------------------------------
  // GET /api/subscription/me
  // ---------------------------------------------------------------
  describe('GET /api/subscription/me', () => {
    const endpoint = '/api/subscription/me';

    it('should require authentication', async () => {
      await request(app)
        .get(endpoint)
        .expect(401);
    });

    it('should return subscription info for authenticated user', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('access');
    });

    it('should return null subscription for user without subscription', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.subscription).toBeNull();
    });
  });

  // ---------------------------------------------------------------
  // POST /api/subscription/cancel
  // ---------------------------------------------------------------
  describe('POST /api/subscription/cancel', () => {
    const endpoint = '/api/subscription/cancel';

    it('should require authentication', async () => {
      await request(app)
        .post(endpoint)
        .expect(401);
    });

    it('should return 400 when user has no active subscription', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ reason: 'too expensive' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return alreadyScheduled for double cancel', async () => {
      const { user, accessToken } = await createAuthenticatedUser();

      // Seed a subscription with cancel_at_period_end = true
      const planResult = await query<{ id: string }>(
        `SELECT id FROM subscription_plans LIMIT 1`
      );
      if (planResult.rows.length === 0) return; // skip if no plans seeded

      await query(
        `INSERT INTO user_subscriptions (
          user_id, plan_id, status, cancel_at_period_end,
          stripe_subscription_id, stripe_customer_id,
          current_period_start, current_period_end
        ) VALUES ($1, $2, 'active', true, $3, $4, NOW(), NOW() + interval '30 days')`,
        [user.id, planResult.rows[0].id, `sub_cancel_${Date.now()}`, `cus_cancel_${Date.now()}`]
      );

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.alreadyScheduled).toBe(true);
    });
  });
});
