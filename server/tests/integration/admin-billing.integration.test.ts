/**
 * Admin Billing API Integration Tests
 *
 * Tests RBAC enforcement and admin billing operations.
 * All endpoints require admin role.
 */

import request from 'supertest';
import { createApp } from '../../src/app.js';
import { query } from '../../src/database/pg.js';
import { createAuthenticatedUser, createTestUser } from '../helpers/testUtils.js';
import { seedCreditWallet, cleanupEntitlementData } from '../helpers/entitlement.testUtils.js';
import type { Application } from 'express';

describe('Admin Billing API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  // ---------------------------------------------------------------
  // RBAC enforcement — all admin endpoints reject non-admin users
  // ---------------------------------------------------------------
  describe('RBAC enforcement', () => {
    const adminEndpoints = [
      { method: 'post' as const, path: '/api/admin/billing/grant-credits' },
      { method: 'post' as const, path: '/api/admin/billing/deduct-credits' },
      { method: 'post' as const, path: '/api/admin/billing/extend-trial' },
      { method: 'post' as const, path: '/api/admin/billing/comp-plan' },
      { method: 'post' as const, path: '/api/admin/billing/suspend' },
      { method: 'post' as const, path: '/api/admin/billing/unsuspend' },
      { method: 'get' as const, path: '/api/admin/billing/overrides' },
      { method: 'get' as const, path: '/api/admin/billing/promo-codes' },
      { method: 'get' as const, path: '/api/admin/billing/matrix' },
      { method: 'get' as const, path: '/api/admin/billing/analytics' },
      { method: 'get' as const, path: '/api/admin/billing/audit' },
    ];

    it('should return 401 without authentication', async () => {
      for (const ep of adminEndpoints) {
        const res = await request(app)[ep.method](ep.path);
        expect(res.status).toBe(401);
      }
    });

    it('should return 403 for regular user', async () => {
      const { accessToken } = await createAuthenticatedUser({ role: 'user' });

      for (const ep of adminEndpoints) {
        const res = await request(app)[ep.method](ep.path)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ userId: '00000000-0000-0000-0000-000000000000', amount: 10 });
        expect(res.status).toBe(403);
      }
    });
  });

  // ---------------------------------------------------------------
  // POST /api/admin/billing/grant-credits
  // ---------------------------------------------------------------
  describe('POST /api/admin/billing/grant-credits', () => {
    const endpoint = '/api/admin/billing/grant-credits';

    it('should grant credits as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const targetUser = await createTestUser();

      await seedCreditWallet({ userId: targetUser.id, planCredits: 0, bonusCredits: 0 });

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id, amount: 100, reason: 'test grant' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overrideId');

      await cleanupEntitlementData(targetUser.id);
    });

    it('should reject missing userId', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject zero amount', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: '00000000-0000-0000-0000-000000000000', amount: 0 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject negative amount', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: '00000000-0000-0000-0000-000000000000', amount: -50 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid bucket', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: '00000000-0000-0000-0000-000000000000',
          amount: 10,
          bucket: 'invalid',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // POST /api/admin/billing/deduct-credits
  // ---------------------------------------------------------------
  describe('POST /api/admin/billing/deduct-credits', () => {
    const endpoint = '/api/admin/billing/deduct-credits';

    it('should deduct credits as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const targetUser = await createTestUser();

      await seedCreditWallet({ userId: targetUser.id, planCredits: 100, bonusCredits: 50 });

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id, amount: 30, reason: 'test deduct' })
        .expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overrideId');

      await cleanupEntitlementData(targetUser.id);
    });

    it('should reject missing userId', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 10 })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------
  // POST /api/admin/billing/extend-trial
  // ---------------------------------------------------------------
  describe('POST /api/admin/billing/extend-trial', () => {
    const endpoint = '/api/admin/billing/extend-trial';

    it('should extend trial as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const targetUser = await createTestUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id, days: 14, reason: 'VIP extension' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overrideId');
    });

    it('should reject days > 365', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: '00000000-0000-0000-0000-000000000000', days: 500 })
        .expect(400);
    });

    it('should reject days <= 0', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: '00000000-0000-0000-0000-000000000000', days: 0 })
        .expect(400);
    });
  });

  // ---------------------------------------------------------------
  // POST /api/admin/billing/suspend & unsuspend
  // ---------------------------------------------------------------
  describe('POST /api/admin/billing/suspend & unsuspend', () => {
    it('should suspend user as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const targetUser = await createTestUser();

      const res = await request(app)
        .post('/api/admin/billing/suspend')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id, reason: 'abuse detected' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overrideId');
    });

    it('should unsuspend user as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const targetUser = await createTestUser();

      // Suspend first
      await request(app)
        .post('/api/admin/billing/suspend')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id })
        .expect(200);

      // Then unsuspend
      const res = await request(app)
        .post('/api/admin/billing/unsuspend')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id, reason: 'cleared' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.ok).toBe(true);

      // Verify suspend overrides are revoked
      const overrides = await query(
        `SELECT id FROM admin_overrides
         WHERE user_id = $1 AND kind = 'suspend' AND revoked_at IS NULL`,
        [targetUser.id]
      );
      expect(overrides.rows.length).toBe(0);
    });

    it('should reject suspend without userId', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      await request(app)
        .post('/api/admin/billing/suspend')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });
  });

  // ---------------------------------------------------------------
  // GET /api/admin/billing/overrides
  // ---------------------------------------------------------------
  describe('GET /api/admin/billing/overrides', () => {
    const endpoint = '/api/admin/billing/overrides';

    it('should list overrides as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overrides');
      expect(Array.isArray(res.body.data.overrides)).toBe(true);
    });

    it('should filter overrides by userId', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const targetUser = await createTestUser();

      // Create an override for the target user
      await request(app)
        .post('/api/admin/billing/suspend')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id })
        .expect(200);

      const res = await request(app)
        .get(`${endpoint}?userId=${targetUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.overrides.length).toBeGreaterThanOrEqual(1);
      for (const o of res.body.data.overrides) {
        expect(o.userId).toBe(targetUser.id);
      }
    });
  });

  // ---------------------------------------------------------------
  // POST /api/admin/billing/overrides/:id/revoke
  // ---------------------------------------------------------------
  describe('POST /api/admin/billing/overrides/:id/revoke', () => {
    it('should revoke an existing override', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const targetUser = await createTestUser();

      // Create override
      const createRes = await request(app)
        .post('/api/admin/billing/suspend')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: targetUser.id })
        .expect(200);

      const overrideId = createRes.body.data.overrideId;

      // Revoke it
      const res = await request(app)
        .post(`/api/admin/billing/overrides/${overrideId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.ok).toBe(true);
    });

    it('should return 404 for non-existent override', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      await request(app)
        .post('/api/admin/billing/overrides/00000000-0000-0000-0000-000000000000/revoke')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  // ---------------------------------------------------------------
  // Promo codes CRUD
  // ---------------------------------------------------------------
  describe('Promo Codes CRUD', () => {
    it('should list promo codes as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      const res = await request(app)
        .get('/api/admin/billing/promo-codes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('promos');
    });

    it('should create promo code as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const code = `ADMINTEST${Date.now()}`;

      const res = await request(app)
        .post('/api/admin/billing/promo-codes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code,
          kind: 'credit_grant',
          creditsGranted: 100,
          maxRedemptions: 50,
          perUserLimit: 1,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(code.toUpperCase());
      expect(res.body.data).toHaveProperty('id');

      // Cleanup
      await query(`DELETE FROM promo_codes WHERE id = $1`, [res.body.data.id]);
    });

    it('should reject promo code without code field', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      await request(app)
        .post('/api/admin/billing/promo-codes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ kind: 'credit_grant' })
        .expect(400);
    });

    it('should update promo code as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });
      const code = `UPDATETEST${Date.now()}`;

      // Create
      const createRes = await request(app)
        .post('/api/admin/billing/promo-codes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code, creditsGranted: 50 })
        .expect(200);

      const promoId = createRes.body.data.id;

      // Update
      const res = await request(app)
        .patch(`/api/admin/billing/promo-codes/${promoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false, maxRedemptions: 10 })
        .expect(200);

      expect(res.body.data.ok).toBe(true);

      // Cleanup
      await query(`DELETE FROM promo_codes WHERE id = $1`, [promoId]);
    });
  });

  // ---------------------------------------------------------------
  // GET /api/admin/billing/matrix
  // ---------------------------------------------------------------
  describe('GET /api/admin/billing/matrix', () => {
    it('should return entitlement matrix as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      const res = await request(app)
        .get('/api/admin/billing/matrix')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('plans');
      expect(res.body.data).toHaveProperty('planFeatures');
    });
  });

  // ---------------------------------------------------------------
  // GET /api/admin/billing/analytics
  // ---------------------------------------------------------------
  describe('GET /api/admin/billing/analytics', () => {
    it('should return analytics as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      const res = await request(app)
        .get('/api/admin/billing/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('mrrCents');
      expect(res.body.data.summary).toHaveProperty('activeSubscriptions');
      expect(res.body.data.summary).toHaveProperty('monthlyChurnRate');
    });
  });

  // ---------------------------------------------------------------
  // GET /api/admin/billing/audit
  // ---------------------------------------------------------------
  describe('GET /api/admin/billing/audit', () => {
    it('should return audit log as admin', async () => {
      const { accessToken: adminToken } = await createAuthenticatedUser({ role: 'admin' });

      const res = await request(app)
        .get('/api/admin/billing/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('entries');
      expect(Array.isArray(res.body.data.entries)).toBe(true);
    });
  });
});
