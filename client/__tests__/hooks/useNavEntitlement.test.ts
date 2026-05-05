/**
 * @file useNavEntitlement hook tests
 *
 * Tests the route-to-menu-key mapping and entitlement resolution logic.
 */

import { renderHook } from '@testing-library/react';
import { useNavEntitlement } from '@/hooks/useNavEntitlement';
import type { EntitlementBundle } from '@/app/context/EntitlementsContext';

// ---------------------------------------------------------------------------
// Mock useEntitlements
// ---------------------------------------------------------------------------

let mockBundle: EntitlementBundle | null = null;
let mockIsLoading = false;

jest.mock('@/app/context/EntitlementsContext', () => ({
  useEntitlements: () => ({
    bundle: mockBundle,
    isLoading: mockIsLoading,
    error: null,
    refetch: jest.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal EntitlementBundle with specific menus and pages. */
function makeBundle(
  menus: Record<string, { visible: boolean; lockedCta: string | null }>,
  pages: Record<string, 'none' | 'preview' | 'locked' | 'full'> = {},
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
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      graceEndsAt: null,
      trialEndsAt: null,
      daysLeftInTrial: null,
    },
    features: {},
    pages,
    menus,
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

describe('useNavEntitlement', () => {
  beforeEach(() => {
    mockBundle = null;
    mockIsLoading = false;
  });

  // =========================================================================
  // Route-to-menu-key mapping
  // =========================================================================

  describe('HREF_PREFIX_TO_MENU_KEY mappings', () => {
    it('/ai-coach maps to menu key "ai.coach"', () => {
      mockBundle = makeBundle(
        { 'ai.coach': { visible: true, lockedCta: null } },
        { 'ai.coach': 'full' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/ai-coach');

      expect(entitlement.visible).toBe(true);
      expect(entitlement.locked).toBe(false);
      expect(entitlement.loading).toBe(false);
    });

    it('/ai-coach/some-subpath also maps to "ai.coach"', () => {
      mockBundle = makeBundle(
        { 'ai.coach': { visible: false, lockedCta: 'Upgrade to Pro' } },
        { 'ai.coach': 'locked' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/ai-coach/history');

      expect(entitlement.visible).toBe(false);
      expect(entitlement.locked).toBe(true);
      expect(entitlement.lockedCta).toBe('Upgrade to Pro');
    });

    it('/admin/subscriptions maps to "admin.subscriptions" (NOT "subscription")', () => {
      mockBundle = makeBundle(
        {
          'admin.subscriptions': { visible: true, lockedCta: null },
          'subscription': { visible: false, lockedCta: 'Hidden' },
        },
        { 'admin.subscriptions': 'full' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/admin/subscriptions');

      // Must resolve to admin.subscriptions, not subscription
      expect(entitlement.visible).toBe(true);
      expect(entitlement.locked).toBe(false);
    });

    it('/dashboard maps to generic "dashboard" segment', () => {
      mockBundle = makeBundle(
        { dashboard: { visible: true, lockedCta: null } },
        { dashboard: 'full' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/dashboard');

      expect(entitlement.visible).toBe(true);
      expect(entitlement.locked).toBe(false);
    });

    it('/locked falls through to generic "locked" segment (no specific override)', () => {
      // "locked" is not in HREF_PREFIX_TO_MENU_KEY, so the generic
      // first-segment logic extracts "locked" as the menu key.
      mockBundle = makeBundle(
        { locked: { visible: true, lockedCta: null } },
        { locked: 'locked' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/locked');

      expect(entitlement.visible).toBe(true);
      expect(entitlement.locked).toBe(true);
    });
  });

  // =========================================================================
  // Fail-open behavior
  // =========================================================================

  describe('fail-open for unknown routes', () => {
    it('unknown route with no menu entry -> visible=true, locked=false', () => {
      mockBundle = makeBundle({}, {});

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/some-unknown-route');

      expect(entitlement.visible).toBe(true);
      expect(entitlement.locked).toBe(false);
      expect(entitlement.lockedCta).toBeNull();
    });

    it('empty href -> visible=true, locked=false', () => {
      mockBundle = makeBundle({}, {});

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('');

      expect(entitlement.visible).toBe(true);
      expect(entitlement.locked).toBe(false);
    });
  });

  // =========================================================================
  // Loading / null bundle states
  // =========================================================================

  describe('loading and null bundle states', () => {
    it('returns loading=true when isLoading=true and bundle is null', () => {
      mockIsLoading = true;
      mockBundle = null;

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/ai-coach');

      expect(entitlement.loading).toBe(true);
      expect(entitlement.visible).toBe(true);
      expect(entitlement.locked).toBe(false);
    });

    it('returns loading=false when bundle is null and not loading', () => {
      mockIsLoading = false;
      mockBundle = null;

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/ai-coach');

      expect(entitlement.loading).toBe(false);
      expect(entitlement.visible).toBe(true);
      expect(entitlement.locked).toBe(false);
    });
  });

  // =========================================================================
  // Page access → locked derivation
  // =========================================================================

  describe('page access locking', () => {
    it('page access "locked" -> locked=true', () => {
      mockBundle = makeBundle(
        { 'ai.coach': { visible: true, lockedCta: 'Upgrade' } },
        { 'ai.coach': 'locked' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/ai-coach');

      expect(entitlement.locked).toBe(true);
    });

    it('page access "preview" -> locked=true', () => {
      mockBundle = makeBundle(
        { 'ai.coach': { visible: true, lockedCta: null } },
        { 'ai.coach': 'preview' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/ai-coach');

      expect(entitlement.locked).toBe(true);
    });

    it('page access "full" -> locked=false', () => {
      mockBundle = makeBundle(
        { 'ai.coach': { visible: true, lockedCta: null } },
        { 'ai.coach': 'full' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/ai-coach');

      expect(entitlement.locked).toBe(false);
    });

    it('page access "none" -> locked=false', () => {
      mockBundle = makeBundle(
        { 'ai.coach': { visible: true, lockedCta: null } },
        { 'ai.coach': 'none' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/ai-coach');

      expect(entitlement.locked).toBe(false);
    });

    it('no page entry for key -> locked=false (undefined !== "locked")', () => {
      mockBundle = makeBundle(
        { 'ai.coach': { visible: true, lockedCta: null } },
        {}, // no page entry
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/ai-coach');

      expect(entitlement.locked).toBe(false);
    });
  });

  // =========================================================================
  // Query string handling
  // =========================================================================

  describe('query string handling', () => {
    it('strips query params before resolving generic segment', () => {
      mockBundle = makeBundle(
        { dashboard: { visible: true, lockedCta: null } },
        { dashboard: 'full' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/dashboard?tab=overview');

      expect(entitlement.visible).toBe(true);
      expect(entitlement.locked).toBe(false);
    });

    it('prefix match works with query string on override routes', () => {
      mockBundle = makeBundle(
        { 'ai.coach': { visible: true, lockedCta: null } },
        { 'ai.coach': 'full' },
      );

      const { result } = renderHook(() => useNavEntitlement());
      const entitlement = result.current('/ai-coach?new=true');

      expect(entitlement.visible).toBe(true);
      expect(entitlement.locked).toBe(false);
    });
  });
});
