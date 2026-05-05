// CLIENT GATES ARE UX HINTS ONLY.
// The server is the source of truth for entitlement and credit checks.

'use client';

/**
 * @deprecated Use `useEntitlements` from '@/app/context/EntitlementsContext'.
 *
 * This hook is a backward-compatibility shim that maps the new
 * EntitlementBundle onto the legacy SubscriptionAccessState shape so existing
 * callers keep working during the migration. Remove this file once every
 * caller has been updated (see /audit grep for remaining imports).
 *
 * New callers should use `useEntitlements()` directly — it exposes the full
 * plan, features, menus, pages, wallet, and a stable canUse(featureKey) API
 * rather than the legacy binary hasAccess flag.
 */

import { useCallback } from 'react';
import { useEntitlements } from '@/app/context/EntitlementsContext';

export interface SubscriptionAccessState {
  hasAccess: boolean;
  isSubscribed: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isPaused: boolean;
  isIncomplete: boolean;
  trialEndsAt: string | null;
  daysLeftInTrial: number;
  isLoading: boolean;
  error: boolean;
  refetch: () => Promise<void>;
}

export function useSubscriptionAccess(): SubscriptionAccessState {
  const { bundle, isLoading, error, refetch } = useEntitlements();
  const status = bundle?.subscription.status ?? 'none';
  const isSubscribed = status === 'active' || status === 'past_due' || status === 'grace';
  const isTrial = status === 'trialing';
  const isExpired = status === 'canceled' || status === 'incomplete_expired' || status === 'none';
  const isPaused = status === 'paused';
  const isIncomplete = status === 'incomplete';
  const hasAccess = isSubscribed || isTrial;

  const refetchCb = useCallback(() => refetch(), [refetch]);

  return {
    hasAccess,
    isSubscribed,
    isTrial,
    isExpired,
    isPaused,
    isIncomplete,
    trialEndsAt: bundle?.subscription.trialEndsAt ?? null,
    daysLeftInTrial: bundle?.subscription.daysLeftInTrial ?? 0,
    isLoading,
    error: !!error,
    refetch: refetchCb,
  };
}
