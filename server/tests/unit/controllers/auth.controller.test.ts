/**
 * Auth Controller Unit Tests
 *
 * Tests the 12 most important auth handlers: register, verifyRegistration,
 * resendRegistrationOTP, login, logout, getCurrentUser, getOnboardingStatus,
 * forgotPassword, resetPassword, verifyEmail, updateProfile, socialAuth.
 *
 * The auth controller talks directly to the DB via query/transaction
 * (no service layer), so we mock at the database level.
 */

import { jest } from '@jest/globals';
import type { Response as _Response, NextFunction as _NextFunction } from 'express';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks ────────────────────────────────────────
const { mockQuery, mockTransaction } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── env mock ────────────────────────────────────────────────────
jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    isProduction: false,
    nodeEnv: 'test',
    jwt: { secret: 'test-jwt-secret-for-unit-tests-only' },
  },
  default: {
    isProduction: false,
    nodeEnv: 'test',
    jwt: { secret: 'test-jwt-secret-for-unit-tests-only' },
  },
}));

// ── services/index.js mock (emailService, smsService, logger) ──
const mockEmailService = {
  sendWelcomeEmail: jest.fn<any>().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn<any>().mockResolvedValue(true),
  sendVerificationEmail: jest.fn<any>().mockResolvedValue(true),
};
const mockSmsService = {
  sendVerificationCode: jest.fn<any>().mockResolvedValue({ success: true, expiresIn: 300 }),
  verifyCode: jest.fn<any>().mockReturnValue({ success: true }),
};
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};
jest.unstable_mockModule('../../../src/services/index.js', () => ({
  emailService: mockEmailService,
  smsService: mockSmsService,
  logger: mockLogger,
}));

// ── mailHelper mock ─────────────────────────────────────────────
const mockMailHelper = {
  sendRegistrationOTPEmail: jest.fn<any>().mockResolvedValue(true),
};
jest.unstable_mockModule('../../../src/helper/mail.js', () => ({
  mailHelper: mockMailHelper,
}));

// ── generateTokens mock ────────────────────────────────────────
const mockGenerateTokens = jest.fn<any>().mockReturnValue({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
});
jest.unstable_mockModule('../../../src/middlewares/auth.middleware.js', () => ({
  generateTokens: mockGenerateTokens,
}));

// ── encryption mock ─────────────────────────────────────────────
const mockHashPassword = jest.fn<any>().mockResolvedValue('hashed-password');
const mockComparePassword = jest.fn<any>().mockResolvedValue(true);
jest.unstable_mockModule('../../../src/helper/encryption.js', () => ({
  hashPassword: mockHashPassword,
  comparePassword: mockComparePassword,
}));

// ── notification service mock ───────────────────────────────────
const mockNotificationService = {
  welcomeUser: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/notification.service.js', () => ({
  notificationService: mockNotificationService,
}));

// ── user.helpers mock ───────────────────────────────────────────
const mockGetPublicProfile = jest.fn<any>().mockImplementation((user: any) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  avatarUrl: user.avatar || null,
  isEmailVerified: user.isEmailVerified,
  onboardingStatus: user.onboardingStatus,
}));
jest.unstable_mockModule('../../../src/utils/user.helpers.js', () => ({
  getPublicProfile: mockGetPublicProfile,
}));

// ── Dynamic imports ─────────────────────────────────────────────
const {
  register,
  verifyRegistration,
  resendRegistrationOTP,
  login,
  logout,
  getCurrentUser,
  getOnboardingStatus,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updateProfile,
  socialAuth,
} = await import('../../../src/controllers/auth.controller.js');

const { createReq, createAuthReq, createRes, createNext, callHandler, getJsonBody, getStatus, expectSuccess } =
  await import('../../helpers/controller-harness.js');

const { buildUserRow, pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ── Helpers ─────────────────────────────────────────────────────

/** Build a full user row matching the auth controller's UserRow interface */
function buildAuthUserRow(overrides: Record<string, any> = {}) {
  const base = buildUserRow(overrides);
  return {
    ...base,
    password: 'hashed-password',
    provider_id: null,
    onboarding_completed_at: null,
    last_login: null,
    refresh_token: null,
    password_reset_token: null,
    password_reset_expires: null,
    email_verification_token: null,
    email_verification_expires: null,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish mock implementations cleared by clearAllMocks
    mockTransaction.mockImplementation(
      async (cb: (client: any) => Promise<unknown>) => cb({ query: mockQuery, release: jest.fn() })
    );
    mockGenerateTokens.mockReturnValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
    mockHashPassword.mockResolvedValue('hashed-password');
    mockComparePassword.mockResolvedValue(true);
    mockEmailService.sendWelcomeEmail.mockResolvedValue(true);
    mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);
    mockEmailService.sendVerificationEmail.mockResolvedValue(true);
    mockMailHelper.sendRegistrationOTPEmail.mockResolvedValue(true);
    mockNotificationService.welcomeUser.mockResolvedValue(undefined);
    mockSmsService.sendVerificationCode.mockResolvedValue({ success: true, expiresIn: 300 });
    mockSmsService.verifyCode.mockReturnValue({ success: true });
    mockGetPublicProfile.mockImplementation((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatar || null,
      isEmailVerified: user.isEmailVerified,
      onboardingStatus: user.onboardingStatus,
    }));
  });

  // ── register ──────────────────────────────────────────────────

  describe('register', () => {
    const registerBody = {
      email: 'new@example.com',
      password: 'Str0ngP@ss!',
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'female',
    };

    it('sends OTP and returns activationToken on success (200)', async () => {
      // No existing user
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const req = createReq({ body: registerBody });
      const res = createRes();
      const next = createNext();

      await callHandler(register, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(mockHashPassword).toHaveBeenCalledWith(registerBody.password);
      expect(mockMailHelper.sendRegistrationOTPEmail).toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.data.activationToken).toBeDefined();
    });

    it('returns 409 conflict when email already exists', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'existing-id' }]));

      const req = createReq({ body: registerBody });
      const res = createRes();
      const next = createNext();

      await callHandler(register, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(409);
    });
  });

  // ── verifyRegistration ────────────────────────────────────────

  describe('verifyRegistration', () => {
    it('creates user and returns tokens on valid OTP (201)', async () => {
      // Import jwt to create a real token the controller can verify
      const jwt = await import('jsonwebtoken');
      const activationCode = '1234';
      const activationToken = jwt.default.sign(
        {
          user: {
            email: 'new@test.com',
            password: 'hashed-password',
            firstName: 'Jane',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01T00:00:00.000Z',
            gender: 'female',
          },
          activationCode,
        },
        'test-jwt-secret-for-unit-tests-only',
        { expiresIn: '10m' }
      );

      const newUser = buildAuthUserRow({
        email: 'new@test.com',
        onboarding_status: 'consent_pending',
        is_email_verified: true,
      });

      // Transaction mock: the callback receives mockClient whose query returns the user
      mockQuery
        // INSERT INTO users ... RETURNING * (inside transaction)
        .mockResolvedValueOnce(pgResult([newUser]))
        // INSERT INTO user_preferences (inside transaction)
        .mockResolvedValueOnce(pgResult([]))
        // UPDATE users SET refresh_token (after transaction)
        .mockResolvedValueOnce(pgResult([]));

      const req = createReq({ body: { activationToken, activationCode } });
      const res = createRes();
      const next = createNext();

      await callHandler(verifyRegistration, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(getStatus(res)).toBe(201);
      const body = getJsonBody(res);
      expect(body.success).toBe(true);
      expect(body.data.tokens).toBeDefined();
      expect(body.data.nextStep).toBe('consent');
    });

    it('returns 400 for invalid activation token', async () => {
      const req = createReq({
        body: { activationToken: 'invalid-token', activationCode: '1234' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(verifyRegistration, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });

    it('returns 400 for wrong activation code', async () => {
      const jwt = await import('jsonwebtoken');
      const activationToken = jwt.default.sign(
        {
          user: {
            email: 'new@test.com',
            password: 'hashed',
            firstName: 'Jane',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            gender: 'female',
          },
          activationCode: '1234',
        },
        'test-jwt-secret-for-unit-tests-only',
        { expiresIn: '10m' }
      );

      const req = createReq({
        body: { activationToken, activationCode: '9999' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(verifyRegistration, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });
  });

  // ── login ─────────────────────────────────────────────────────

  describe('login', () => {
    it('returns tokens on valid credentials (200)', async () => {
      const user = buildAuthUserRow({ is_active: true });
      mockQuery
        .mockResolvedValueOnce(pgResult([user]))  // SELECT user
        .mockResolvedValueOnce(pgResult([]));      // UPDATE last_login

      mockComparePassword.mockResolvedValueOnce(true);

      const req = createReq({
        body: { email: user.email, password: 'correct-password' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(login, req, res, next);

      expect(next).not.toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.data.tokens).toBeDefined();
      expect(body.data.user).toBeDefined();
    });

    it('returns 401 when email does not exist', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const req = createReq({
        body: { email: 'noone@example.com', password: 'pass' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(login, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(401);
    });

    it('returns 401 when password does not match', async () => {
      const user = buildAuthUserRow();
      mockQuery.mockResolvedValueOnce(pgResult([user]));
      mockComparePassword.mockResolvedValueOnce(false);

      const req = createReq({
        body: { email: user.email, password: 'wrong-password' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(login, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(401);
    });

    it('returns 401 for social auth user with no password', async () => {
      const user = buildAuthUserRow({ password: null, auth_provider: 'google' });
      mockQuery.mockResolvedValueOnce(pgResult([user]));

      const req = createReq({
        body: { email: user.email, password: 'anything' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(login, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(401);
    });

    it('returns 403 when account is blocked', async () => {
      const user = buildAuthUserRow({ is_active: false });
      mockQuery.mockResolvedValueOnce(pgResult([user]));
      mockComparePassword.mockResolvedValueOnce(true);

      const req = createReq({
        body: { email: user.email, password: 'correct' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(login, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(403);
    });
  });

  // ── logout ────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears refresh token and returns 200', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const req = createAuthReq();
      const res = createRes();
      const next = createNext();

      await callHandler(logout, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('refresh_token = NULL'),
        expect.arrayContaining(['test-user-id'])
      );
      const body = expectSuccess(res);
      expect(body.message).toContain('Logged out');
    });

    it('succeeds even without userId', async () => {
      const req = createReq();
      // Simulate unauthenticated — user is undefined
      (req as any).user = undefined;
      const res = createRes();
      const next = createNext();

      await callHandler(logout, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(mockQuery).not.toHaveBeenCalled();
      expectSuccess(res);
    });
  });

  // ── getCurrentUser ────────────────────────────────────────────

  describe('getCurrentUser', () => {
    it('returns current user profile (200)', async () => {
      const user = buildAuthUserRow();
      mockQuery.mockResolvedValueOnce(pgResult([user]));

      const req = createAuthReq({ userId: user.id });
      const res = createRes();
      const next = createNext();

      await callHandler(getCurrentUser, req, res, next);

      expect(next).not.toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.data.user).toBeDefined();
    });

    it('returns 401 when no userId in token', async () => {
      const req = createAuthReq();
      (req as any).user = {};
      const res = createRes();
      const next = createNext();

      await callHandler(getCurrentUser, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(401);
    });

    it('returns 404 when user is not found in DB', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const req = createAuthReq({ userId: 'missing-id' });
      const res = createRes();
      const next = createNext();

      await callHandler(getCurrentUser, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(404);
    });
  });

  // ── forgotPassword ────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('sends reset email when user exists (200)', async () => {
      const user = buildAuthUserRow();
      mockQuery
        .mockResolvedValueOnce(pgResult([user]))  // SELECT user
        .mockResolvedValueOnce(pgResult([]));      // UPDATE reset token

      const req = createReq({ body: { email: user.email } });
      const res = createRes();
      const next = createNext();

      await callHandler(forgotPassword, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
      expectSuccess(res);
    });

    it('returns 200 even when email does not exist (anti-enumeration)', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const req = createReq({ body: { email: 'nonexistent@example.com' } });
      const res = createRes();
      const next = createNext();

      await callHandler(forgotPassword, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expectSuccess(res);
    });
  });

  // ── resetPassword ─────────────────────────────────────────────

  describe('resetPassword', () => {
    it('resets password with valid token (200)', async () => {
      const user = buildAuthUserRow();
      mockQuery
        .mockResolvedValueOnce(pgResult([user]))  // SELECT with valid token
        .mockResolvedValueOnce(pgResult([]));      // UPDATE password

      const req = createReq({
        body: { token: 'valid-reset-token', password: 'NewStr0ngP@ss!' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(resetPassword, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(mockHashPassword).toHaveBeenCalledWith('NewStr0ngP@ss!');
      expectSuccess(res);
    });

    it('returns 400 for invalid/expired reset token', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const req = createReq({
        body: { token: 'expired-token', password: 'NewP@ss1' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(resetPassword, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });
  });

  // ── verifyEmail ───────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('verifies email with valid token (200)', async () => {
      const user = buildAuthUserRow({ is_email_verified: false });
      mockQuery
        .mockResolvedValueOnce(pgResult([user]))  // SELECT with valid token
        .mockResolvedValueOnce(pgResult([]));      // UPDATE is_email_verified

      const req = createReq({ body: { token: 'valid-email-token' } });
      const res = createRes();
      const next = createNext();

      await callHandler(verifyEmail, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expectSuccess(res);
    });

    it('returns 400 for invalid/expired email verification token', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const req = createReq({ body: { token: 'bad-token' } });
      const res = createRes();
      const next = createNext();

      await callHandler(verifyEmail, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });
  });

  // ── updateProfile ─────────────────────────────────────────────

  describe('updateProfile', () => {
    it('updates profile fields and returns 200', async () => {
      const user = buildAuthUserRow({ first_name: 'Updated' });
      mockQuery.mockResolvedValueOnce(pgResult([user]));

      const req = createAuthReq({}, {
        body: { firstName: 'Updated', phone: '+1234567890' },
      } as any);
      const res = createRes();
      const next = createNext();

      await callHandler(updateProfile, req, res, next);

      expect(next).not.toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.data.user).toBeDefined();
    });

    it('returns 400 when no fields provided', async () => {
      const req = createAuthReq({}, { body: {} } as any);
      const res = createRes();
      const next = createNext();

      await callHandler(updateProfile, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });

    it('returns 401 when not authenticated', async () => {
      const req = createAuthReq();
      (req as any).user = {};
      const res = createRes();
      const next = createNext();

      await callHandler(updateProfile, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(401);
    });
  });

  // ── getOnboardingStatus ───────────────────────────────────────

  describe('getOnboardingStatus', () => {
    it('returns full onboarding status (200)', async () => {
      const user = buildAuthUserRow({ onboarding_status: 'assessment_pending' });
      mockQuery
        .mockResolvedValueOnce(pgResult([user]))                              // SELECT user
        .mockResolvedValueOnce(pgResult([                                     // SELECT consents
          { id: '1', user_id: user.id, type: 'terms_of_service', version: '1.0.0', consented_at: new Date(), ip: '' },
          { id: '2', user_id: user.id, type: 'privacy_policy', version: '1.0.0', consented_at: new Date(), ip: '' },
        ]))
        .mockResolvedValueOnce(pgEmpty());                                    // SELECT whatsapp

      const req = createAuthReq({ userId: user.id });
      const res = createRes();
      const next = createNext();

      await callHandler(getOnboardingStatus, req, res, next);

      expect(next).not.toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.data.currentStep).toBe('assessment_pending');
      expect(body.data.steps.consent).toBe(true);
      expect(body.data.steps.registered).toBe(true);
    });

    it('returns 401 when not authenticated', async () => {
      const req = createAuthReq();
      (req as any).user = {};
      const res = createRes();
      const next = createNext();

      await callHandler(getOnboardingStatus, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(401);
    });

    it('returns 404 when user not found', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const req = createAuthReq({ userId: 'gone' });
      const res = createRes();
      const next = createNext();

      await callHandler(getOnboardingStatus, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(404);
    });
  });

  // ── resendRegistrationOTP ─────────────────────────────────────

  describe('resendRegistrationOTP', () => {
    it('resends OTP and returns new activationToken (200)', async () => {
      const jwt = await import('jsonwebtoken');
      const oldToken = jwt.default.sign(
        {
          user: {
            email: 'new@test.com',
            password: 'hashed',
            firstName: 'Jane',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            gender: 'female',
          },
          activationCode: '1234',
        },
        'test-jwt-secret-for-unit-tests-only',
        { expiresIn: '10m' }
      );

      // No existing user
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const req = createReq({ body: { activationToken: oldToken } });
      const res = createRes();
      const next = createNext();

      await callHandler(resendRegistrationOTP, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(mockMailHelper.sendRegistrationOTPEmail).toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.data.activationToken).toBeDefined();
      // New token should be different from old one
      expect(body.data.activationToken).not.toBe(oldToken);
    });

    it('returns 400 for expired activation token', async () => {
      const req = createReq({ body: { activationToken: 'expired-garbage' } });
      const res = createRes();
      const next = createNext();

      await callHandler(resendRegistrationOTP, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });

    it('returns 409 when email was already registered', async () => {
      const jwt = await import('jsonwebtoken');
      const token = jwt.default.sign(
        {
          user: {
            email: 'taken@test.com',
            password: 'hashed',
            firstName: 'Jane',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            gender: 'female',
          },
          activationCode: '5678',
        },
        'test-jwt-secret-for-unit-tests-only',
        { expiresIn: '10m' }
      );

      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'existing-id' }]));

      const req = createReq({ body: { activationToken: token } });
      const res = createRes();
      const next = createNext();

      await callHandler(resendRegistrationOTP, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(409);
    });
  });

  // ── socialAuth ────────────────────────────────────────────────

  describe('socialAuth', () => {
    it('creates new social user and returns 201', async () => {
      // No existing user
      mockQuery.mockResolvedValueOnce(pgEmpty());

      const newUser = buildAuthUserRow({
        auth_provider: 'google',
        onboarding_status: 'consent_pending',
        is_email_verified: true,
      });

      // Transaction: INSERT user, then INSERT preferences
      mockQuery
        .mockResolvedValueOnce(pgResult([newUser]))   // INSERT user
        .mockResolvedValueOnce(pgResult([]))           // INSERT preferences
        .mockResolvedValueOnce(pgResult([]));           // UPDATE refresh_token

      const req = createReq({
        body: {
          email: newUser.email,
          provider: 'google',
          providerId: 'google-id-123',
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          avatar: 'https://avatar.url/pic.jpg',
        },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(socialAuth, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(getStatus(res)).toBe(201);
      const body = getJsonBody(res);
      expect(body.data.isNewUser).toBe(true);
    });

    it('signs in existing social user (200)', async () => {
      const existingUser = buildAuthUserRow({ auth_provider: 'google' });
      mockQuery
        .mockResolvedValueOnce(pgResult([existingUser]))   // SELECT existing user
        .mockResolvedValueOnce(pgResult([]))                // UPDATE provider info
        .mockResolvedValueOnce(pgResult([existingUser]))    // SELECT refreshed user
        .mockResolvedValueOnce(pgResult([]));               // UPDATE refresh_token

      const req = createReq({
        body: {
          email: existingUser.email,
          provider: 'google',
          providerId: 'google-id-123',
        },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(socialAuth, req, res, next);

      expect(next).not.toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.data.isNewUser).toBe(false);
    });

    it('returns 400 when email or provider is missing', async () => {
      const req = createReq({ body: { email: 'a@b.com' } }); // no provider
      const res = createRes();
      const next = createNext();

      await callHandler(socialAuth, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(400);
    });
  });
});
