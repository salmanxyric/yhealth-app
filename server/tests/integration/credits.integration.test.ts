/**
 * Credits & Promo Redemption Integration Tests
 *
 * Tests the user-facing credit ledger and promo code redemption endpoints.
 */

import request from 'supertest';
import { createApp } from '../../src/app.js';
import { query as _query } from '../../src/database/pg.js';
import { createAuthenticatedUser } from '../helpers/testUtils.js';
import {
  seedCreditWallet,
  seedCreditTransaction,
  seedPromoCode,
  cleanupEntitlementData,
  cleanupPromoCode,
} from '../helpers/entitlement.testUtils.js';
import type { Application } from 'express';

describe('Credits & Promo API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  // ---------------------------------------------------------------
  // GET /api/me/credits/ledger
  // ---------------------------------------------------------------
  describe('GET /api/me/credits/ledger', () => {
    const endpoint = '/api/me/credits/ledger';

    it('should require authentication', async () => {
      await request(app).get(endpoint).expect(401);
    });

    it('should return empty ledger for new user', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.entries).toEqual([]);
    });

    it('should return transactions in descending order', async () => {
      const { user, accessToken } = await createAuthenticatedUser();

      await seedCreditWallet({ userId: user.id, planCredits: 200 });
      await seedCreditTransaction({
        userId: user.id,
        delta: 100,
        kind: 'grant',
        reason: 'initial',
        balanceAfterPlan: 100,
      });
      await seedCreditTransaction({
        userId: user.id,
        delta: 100,
        kind: 'grant',
        reason: 'bonus',
        balanceAfterPlan: 200,
      });

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.entries.length).toBe(2);
      const dates = res.body.data.entries.map((e: any) => new Date(e.createdAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);

      await cleanupEntitlementData(user.id);
    });

    it('should respect limit parameter', async () => {
      const { user, accessToken } = await createAuthenticatedUser();

      await seedCreditWallet({ userId: user.id });
      for (let i = 0; i < 5; i++) {
        await seedCreditTransaction({ userId: user.id, delta: 10, reason: `tx-${i}` });
      }

      const res = await request(app)
        .get(`${endpoint}?limit=3`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.entries.length).toBe(3);

      await cleanupEntitlementData(user.id);
    });

    it('should include expected fields in ledger entries', async () => {
      const { user, accessToken } = await createAuthenticatedUser();

      await seedCreditWallet({ userId: user.id });
      await seedCreditTransaction({
        userId: user.id,
        delta: 50,
        bucket: 'bonus',
        kind: 'grant',
        reason: 'test-promo',
        featureKey: null,
        balanceAfterPlan: 100,
        balanceAfterBonus: 50,
      });

      const res = await request(app)
        .get(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const entry = res.body.data.entries[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('createdAt');
      expect(entry).toHaveProperty('delta', 50);
      expect(entry).toHaveProperty('bucket', 'bonus');
      expect(entry).toHaveProperty('kind', 'grant');
      expect(entry).toHaveProperty('reason', 'test-promo');
      expect(entry).toHaveProperty('balanceAfterPlan');
      expect(entry).toHaveProperty('balanceAfterBonus');

      await cleanupEntitlementData(user.id);
    });
  });

  // ---------------------------------------------------------------
  // POST /api/me/promos/redeem
  // ---------------------------------------------------------------
  describe('POST /api/me/promos/redeem', () => {
    const endpoint = '/api/me/promos/redeem';
    const TEST_CODE = `TESTPROMO${Date.now()}`;

    afterAll(async () => {
      await cleanupPromoCode(TEST_CODE);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(endpoint)
        .send({ code: 'ANYCODE' })
        .expect(401);
    });

    it('should reject empty code', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent promo code', async () => {
      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: 'NONEXISTENT999' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not valid');
    });

    it('should redeem valid promo code and grant credits', async () => {
      const code = `VALID${Date.now()}`;
      await seedPromoCode({ code, creditsGranted: 75, kind: 'credit_grant' });

      const { user, accessToken } = await createAuthenticatedUser();
      await seedCreditWallet({ userId: user.id, planCredits: 0, bonusCredits: 0 });

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.grantedCredits).toBe(75);

      await cleanupPromoCode(code);
      await cleanupEntitlementData(user.id);
    });

    it('should reject already redeemed promo code (per-user limit)', async () => {
      const code = `ONCE${Date.now()}`;
      await seedPromoCode({ code, creditsGranted: 50, perUserLimit: 1 });

      const { user, accessToken } = await createAuthenticatedUser();
      await seedCreditWallet({ userId: user.id });

      // First redemption
      await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code })
        .expect(200);

      // Second redemption — should fail
      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code })
        .expect(400);

      expect(res.body.message).toContain('already redeemed');

      await cleanupPromoCode(code);
      await cleanupEntitlementData(user.id);
    });

    it('should reject expired promo code', async () => {
      const code = `EXPIRED${Date.now()}`;
      await seedPromoCode({
        code,
        creditsGranted: 50,
        expiresAt: new Date(Date.now() - 86400000), // expired yesterday
      });

      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code })
        .expect(400);

      expect(res.body.message).toContain('expired');

      await cleanupPromoCode(code);
    });

    it('should reject inactive promo code', async () => {
      const code = `INACTIVE${Date.now()}`;
      await seedPromoCode({ code, creditsGranted: 50, isActive: false });

      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code })
        .expect(400);

      expect(res.body.message).toContain('no longer active');

      await cleanupPromoCode(code);
    });

    it('should reject promo code that reached max redemptions', async () => {
      const code = `MAXED${Date.now()}`;
      await seedPromoCode({ code, creditsGranted: 50, maxRedemptions: 0 });

      const { accessToken } = await createAuthenticatedUser();

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code })
        .expect(400);

      expect(res.body.message).toContain('reached its limit');

      await cleanupPromoCode(code);
    });

    it('should be case-insensitive for promo codes', async () => {
      const code = `CASETEST${Date.now()}`;
      await seedPromoCode({ code, creditsGranted: 25 });

      const { user, accessToken } = await createAuthenticatedUser();
      await seedCreditWallet({ userId: user.id });

      const res = await request(app)
        .post(endpoint)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: code.toLowerCase() })
        .expect(200);

      expect(res.body.success).toBe(true);

      await cleanupPromoCode(code);
      await cleanupEntitlementData(user.id);
    });
  });
});
