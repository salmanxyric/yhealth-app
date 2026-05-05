/**
 * @file useSubscriptionAccess hook tests
 *
 * Tests the backward-compatibility shim that maps EntitlementBundle
 * subscription status onto the legacy SubscriptionAccessState shape.
 */

import { renderHook } from '@testing-library/react';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import type { EntitlementBundle, SubscriptionStatus } from '@/app/context/EntitlementsContext';

// ---------------------------------------------------------------------------
// Mock useEntitlements
// ---------------------------------------------------------------------------

const mockRefetch = jest.fn().mockResolvedValue(undefined);

let mockBundle: EntitlementBundle | null = null;
let mockIsLoading = false;
let mockError: Error | null = null;

jest.mock('@/app/context/EntitlementsContext', () => ({
  useEntitlements: () => ({
    bundle: mockBundle,
    isLoading: mockIsLoading,
    error: mockError,
    refetch: mockRefetch,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal EntitlementBundle with a given subscription status. */
function makeBundle(
  status: SubscriptionStatus,
  overrides?: Partial<EntitlementBundle['subscription']>,
): EntitlementBundle {
  return {
    plan: {
      id: 'plan_test',
      slug: 'pro',
      tier: 20,
      name: 'Pro',
      version: 1,
      isEnterprise: false,
    },
    subscription: {
      status,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      graceEndsAt: null,
      trialEndsAt: null,
      daysLeftInTrial: null,
      ...overrides,
    },
    features: {},
    pages: {},
    menus: {},
    wallet: {
      planCredits: 100,
      bonusCredits: 0,
      total: 100,
      lastResetAt: null,
      nextResetAt: null,
    },
    overrides: [],
    computedAt: new Date().toISOString(),
    etag: 'test-etag',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSubscriptionAccess', () => {
  beforeEach(() => {
    mockBundle = null;
    mockIsLoading = false;
    mockError = null;
  });

  // ----- active -----
  it('status "active" -> hasAccess=true, isSubscribed=true, isExpired=false', () => {
    mockBundle = makeBundle('active');

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.hasAccess).toBe(true);
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.isTrial).toBe(false);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isIncomplete).toBe(false);
  });

  // ----- trialing -----
  it('status "trialing" -> hasAccess=true, isTrial=true', () => {
    mockBundle = makeBundle('trialing', {
      trialEndsAt: '2026-06-01T00:00:00Z',
      daysLeftInTrial: 14,
    });

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.hasAccess).toBe(true);
    expect(result.current.isTrial).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.trialEndsAt).toBe('2026-06-01T00:00:00Z');
    expect(result.current.daysLeftInTrial).toBe(14);
  });

  // ----- canceled -----
  it('status "canceled" -> hasAccess=false, isExpired=true', () => {
    mockBundle = makeBundle('canceled');

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isTrial).toBe(false);
  });

  // ----- none -----
  it('status "none" -> hasAccess=false, isExpired=true', () => {
    mockBundle = makeBundle('none');

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
  });

  // ----- paused -----
  it('status "paused" -> hasAccess=false, isPaused=true', () => {
    mockBundle = makeBundle('paused');

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isPaused).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  // ----- incomplete -----
  it('status "incomplete" -> hasAccess=false, isIncomplete=true', () => {
    mockBundle = makeBundle('incomplete');

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isIncomplete).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  // ----- past_due -----
  it('status "past_due" -> hasAccess=true, isSubscribed=true', () => {
    mockBundle = makeBundle('past_due');

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.hasAccess).toBe(true);
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  // ----- grace -----
  it('status "grace" -> hasAccess=true, isSubscribed=true', () => {
    mockBundle = makeBundle('grace');

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.hasAccess).toBe(true);
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.isExpired).toBe(false);
  });

  // ----- incomplete_expired -----
  it('status "incomplete_expired" -> hasAccess=false, isExpired=true', () => {
    mockBundle = makeBundle('incomplete_expired');

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.isIncomplete).toBe(false);
  });

  // ----- null bundle (pre-fetch) -----
  it('null bundle defaults to status "none" -> hasAccess=false, isExpired=true', () => {
    mockBundle = null;

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.hasAccess).toBe(false);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.trialEndsAt).toBeNull();
    expect(result.current.daysLeftInTrial).toBe(0);
  });

  // ----- loading state -----
  it('propagates isLoading from entitlements context', () => {
    mockIsLoading = true;
    mockBundle = null;

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.isLoading).toBe(true);
  });

  // ----- error state -----
  it('propagates error as boolean from entitlements context', () => {
    mockError = new Error('Network failure');
    mockBundle = null;

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(result.current.error).toBe(true);
  });

  // ----- refetch -----
  it('exposes a refetch callback', () => {
    mockBundle = makeBundle('active');

    const { result } = renderHook(() => useSubscriptionAccess());

    expect(typeof result.current.refetch).toBe('function');
  });
});
