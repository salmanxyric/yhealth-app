# yHealth — Enterprise Subscription, Credit & Entitlement System

**Status:** shipped (Waves 1 → 6) · **Mode:** shadow (flip to `enforce-all` once 48h of ledger data is clean)

This document is the architectural contract for the monetization stack. It is the
authoritative reference for how plans, features, menus, credits, and admin overrides
are resolved end-to-end. Every piece below is implemented and covered by the migrations
/ services / routes / components enumerated.

---

## 1. Goals

- Every user belongs to a subscription plan; plan + overrides determine what they can
  do at the server boundary.
- Every AI call debits a signed, idempotent, append-only credit ledger.
- Admin can reconfigure plans, credit costs, pages, menus, promos, and per-user
  overrides from one console — no code deploy required.
- Replay, double-spend, chargeback, burst-abuse, and credit-drain are detected and
  mitigated without human intervention.
- Client gates are UX hints only — server is the single source of truth for every
  entitlement decision. Frontend manipulation cannot bypass access controls.

---

## 2. Source-of-truth rule

> **CLIENT GATES ARE UX HINTS ONLY.** Every gated action must additionally be
> enforced by the server via HTTP 402 / 403 / 429 responses. This header is
> non-negotiable and appears on every client gate primitive in the codebase.

The `entitlement.middleware.ts` stack enforces this at the Express layer. The
`PageAccessGate` and `FeatureGate` components are cosmetics that match the server
decision — they never make the decision.

---

## 3. Resolution chain (highest priority first)

The entitlement service (`server/src/services/entitlement.service.ts`) resolves each
user through this fixed chain on every cache miss:

1. **`admin_overrides` active row** — `suspend` forces all features off; `comp_plan`
   overlays a different `plan_id`; `extend_trial` adds days to the synthetic trial.
2. **`enterprise_contracts` seat (Wave 5 schema, overlay wiring pending)** —
   `custom_features` + `custom_limits` JSON overlays plan defaults.
3. **`user_subscriptions`** with status in `{active, trialing, grace, past_due}` joined
   to `plan_features`, `plan_pages`, `plan_menus`.
4. **Synthetic trial** — first `plan.trial_days` since `users.created_at`, plus any
   `extend_trial` days.
5. **Default Free plan** (`subscription_plans.slug = 'free'`).

---

## 4. Database schema (10 migrations, all additive)

| # | Migration file | Tables / columns |
|---|---|---|
| 1 | `20260423100000_create_entitlement_catalogs.sql` | `feature_catalog` (36 seeds), `menu_catalog` (35), `page_catalog` (47) |
| 2 | `20260423100100_extend_subscription_plans.sql` | `tier`, `credits_included_monthly`, `credits_rollover_policy`, `credits_rollover_cap`, `is_enterprise`, `yearly_amount_cents`, `yearly_stripe_price_id`, `trial_days`, `is_public`, `version` |
| 3 | `20260423100200_create_plan_scoped_tables.sql` | `plan_features`, `plan_pages`, `plan_menus` |
| 4 | `20260423100300_create_credit_tables.sql` | `credit_wallets`, `credit_transactions` (append-only trigger), `usage_events` |
| 5 | `20260423100400_create_entitlement_cache.sql` | `user_entitlements_cache` |
| 6 | `20260423100500_seed_starter_pro_premium_plans.sql` | Backfills starter / pro / premium tiers + full matrix mapping |
| 7 | `20260423100600_backfill_wallets_and_trial_credits.sql` | 576 wallets, 240 trial grants × 50 bonus credits |
| 8 | `20260423100700_stripe_hardening.sql` | `stripe_event_log`, `invoices`, `payment_attempts` |
| 9 | `20260423100800_extend_user_subscriptions.sql` | `grace_period_ends_at`, `dunning_state`, `last_webhook_event_id` + widened status CHECK |
| 10 | `20260423100900_admin_overrides_and_enterprise.sql` | `admin_overrides`, `enterprise_contracts`, `enterprise_contract_seats` |
| 11 | `20260423101000_promo_audit_abuse.sql` | `promo_codes`, `promo_redemptions`, `audit_log` (append-only trigger), `abuse_signals` |

**Append-only tables:** `credit_transactions` and `audit_log` have BEFORE
UPDATE/DELETE triggers that `RAISE EXCEPTION`. Any attempt to mutate the ledger
outside INSERT fails at the database level, independent of application code.

---

## 5. Credit consumption protocol

Canonical atomic debit pattern (used by `credit.service.ts::reserveCredits`):

```sql
BEGIN;
-- 1. Conditional UPDATE: zero rows returned ⇒ INSUFFICIENT_CREDITS.
UPDATE credit_wallets
   SET plan_credits_balance  = plan_credits_balance
                              - LEAST(plan_credits_balance, $amount),
       bonus_credits_balance = bonus_credits_balance
                              - GREATEST($amount - plan_credits_balance, 0),
       lifetime_consumed     = lifetime_consumed + $amount,
       version               = version + 1
 WHERE user_id = $userId
   AND (plan_credits_balance + bonus_credits_balance) >= $amount
 RETURNING plan_credits_balance, bonus_credits_balance;

-- 2. Append ledger row (UNIQUE on idempotency_key prevents replay double-debit).
INSERT INTO credit_transactions (... idempotency_key ...) VALUES (...)
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id;
COMMIT;
```

### Reservation state machine

```
reserveCredits → (AI call) → settleCredits(actualAmount)
                           ↘ releaseCredits  (stream abort / 4xx / 5xx)
                           ↘ refundCredits   (compensating, post-settle failure)
```

- `reserved > actual` → emit `release` ledger row for the difference.
- `actual > reserved` → emit extra `consume` row (capped at available balance).
- `settle` always writes a zero-delta marker so the reservation is closed.

### Idempotency

Every credit-consuming endpoint requires an `Idempotency-Key` header. The server
key is `reserve:{userId}:{featureKey}:{headerKey}` with a UNIQUE constraint on
`credit_transactions.idempotency_key`. Replay requests short-circuit and return
the original reservation + prior `usage_events` row id.

### Proven by live test (Wave 2 exit gate)

```
reserveCredits(3) → wallet 50 → 47
reserveCredits(3) REPLAY → reason='replay', wallet unchanged
settleCredits(actual=2) → 1 release, wallet lands at 45
Ledger: 3 rows (reserve + release + settle)
usage_events: status='settled', credits_charged=2
```

---

## 6. Middleware stack

Applied in front of every AI endpoint (15 endpoints wrapped in Wave 2 across 7 route
files — ai-coach, rag-chatbot, voice-calls, tts, transcription, journal, emotional-checkin,
call-summaries):

```ts
router.post('/message',
  authenticate,
  validate(schema),
  requireFeature('ai.coach.message'),
  requireFeatureLimit('ai.coach.message', { period: 'day' }),
  consumeCredits('ai.coach.message'),
  auditAction('ai.coach.chat', 'ai_coach_session', r => r.body.sessionId),
  handler
);
```

### Shadow-mode gating

`ENTITLEMENT_ENFORCEMENT_MODE` env var controls whether denials actually block:

| Mode | Behavior |
|---|---|
| `shadow` | Log would-be-denial with `[entitlement] SHADOW denial`; `next()`; ledger still writes |
| `enforce-new` | Enforce for users whose bundle was computed after `ENTITLEMENT_ROLLOUT_START` |
| `enforce-all` | Full enforcement |

Flip is one env change + process restart. Kill-switch: flip back to `shadow`.

### Streaming settle

For SSE routes (e.g. `POST /rag-chat/message/stream`), the handler attaches
`attachStreamCreditCounter(req)`, feeds each emitted token into
`counter.countToken(t)`, then calls `counter.settle({ provider, model, inputTokens })`
before `res.end()`. tiktoken runs the exact count once at settle time, not on every
token, to avoid encoding overhead on the hot path.

---

## 7. Cache strategy

Three layers (`entitlement.service.ts`):

| Layer | Scope | TTL | Invalidation |
|---|---|---|---|
| L1 in-memory `lru-cache` | Per Node process (10k entries) | 60s | `LISTEN entitlements_invalidate` NOTIFY busts key |
| L2 `user_entitlements_cache` | Shared across processes | 5 min | DELETE on webhook/override/matrix edit |
| L3 source-of-truth joins | Authoritative | n/a | `subscription_plans.version++` bumps on every matrix edit |

Every mutation that affects an entitlement result calls
`invalidateEntitlements(userId)` which:

1. Deletes L1 key.
2. DELETEs the L2 row.
3. `pg_notify('entitlements_invalidate', userId)` so all other Node processes bust
   their L1 too.
4. Emits `entitlements:invalidate` over Socket.IO to the user's room.

Client `EntitlementsSocketBridge` listens for both `entitlements:invalidate` and
`wallet:update`. The former triggers a refetch; the latter hydrates the wallet store
directly so the credits chip ticks live without a full bundle fetch.

---

## 8. Stripe hardening

- **Idempotency via `stripe_event_log`** — every inbound `evt_*` is INSERTed with
  `ON CONFLICT (event_id) DO NOTHING`. Duplicate deliveries short-circuit with
  `status=200` and zero side effects.
- **`nextSubscriptionStatus()` pure function** in `stripe-webhook.service.ts` — the
  single place that maps `(current_status, event, incoming_stripe_status)` to the
  next status. Reused by the grace-expiration cron.
- **Invoice mirror** — every `invoice.paid` / `invoice.payment_failed` upserts the
  `invoices` table keyed on `stripe_invoice_id` UNIQUE.
- **Monthly credit grant** — after `invoice.paid`, `applyMonthlyRollover()` calls
  `grantCredits` with idempotency key `rollover:{invoice_stripe_id}`, guaranteeing
  exactly one grant per invoice even under replay.
- **Dunning** — `invoice.payment_failed` schedules three `payment_attempts` rows at
  +3d / +5d / +7d and flips `user_subscriptions.dunning_state='retrying'`.
- **Grace period** — `customer.subscription.deleted` sets `grace_period_ends_at =
  NOW() + 7 days` and status `grace`. `graceExpirationJob` (hourly cron) flips
  `grace → canceled` once the deadline passes and re-invalidates entitlements.
- **Refund** — `charge.refunded` updates `invoices.amount_refunded_cents` and flips
  invoice status to `refunded` when fully refunded.

---

## 9. Admin surface

`/api/admin/billing/*` (all authenticate → authorize('admin') → audit):

| Route | Purpose |
|---|---|
| `POST /grant-credits` | Add credits to a user's plan or bonus bucket |
| `POST /deduct-credits` | Atomic wallet decrement (bonus-first, then plan) |
| `POST /extend-trial` | Add days via `admin_overrides` row |
| `POST /comp-plan` | Overlay a different plan with optional expiry |
| `POST /suspend` / `POST /unsuspend` | Instant lockdown / reversal |
| `GET /overrides` / `POST /overrides/:id/revoke` | List + rollback |
| `GET /matrix` | Full plans + catalogs + mappings in one payload |
| `PATCH /plan-features` / `/plan-pages` / `/plan-menus` | Single-cell matrix edits with version bump + mass invalidation |
| `GET/POST/PATCH /promo-codes` | Promo code CRUD |
| `GET /abuse-signals` / `POST /abuse-signals/:id/review` | Abuse worker output + review |
| `GET /audit` | Append-only audit log query |
| `GET /analytics` | MRR / ARR / ARPU / churn / credit burn / plan mix |

### Admin console routes

Under `/admin/subscriptions/`:

- `features` — 4-tab matrix editor (features / credits / pages / menus) using the
  generic `EntityMatrix` component
- `overrides` — paste user ID → fire any override action via `OverrideDialog`
- `promotions` — promo code CRUD with activate toggle
- `abuse` — signals list with severity badges + inline clear/suspend actions
- `usage` — audit log viewer with expandable before/after diffs
- `analytics` — MRR / ARPU / churn tiles + 30-day cohort bars + plan mix / status
  breakdown

---

## 10. User surface

| Route | Purpose |
|---|---|
| `/subscription` | Legacy Stripe checkout entry (preserved, still functional) |
| `/upgrade` | New plan comparison page with monthly/yearly toggle + feature highlight |
| `/settings/billing` | Plan card + dunning/grace banners + cancel flow |
| `/settings/billing/credits` | Wallet summary + paginated ledger + promo redeem |
| `/locked/[pageKey]` | Deep-link paywall |

Global chrome:

- `TrialCountdownBanner` in the dashboard header (dismissible, escalates to urgent at ≤1 day)
- `RemainingCreditsChip` in the header action bar (pulses when low, subscribes to wallet-store slice so it re-renders independently of the tree)
- `UpgradeModal` mounted at the providers root, driven by `paywallStore`

Premium routes with `PageAccessGate` server-matched guards:
`voice-assistant`, `voice-call`, `knowledge-graph`, `money-map`, `competitions`.

---

## 11. Abuse detection

`abuse.service.ts` detectors, all writing to `abuse_signals` with 0–100 scoring:

- `burst_rate` — >60 AI calls in 5 minutes → score scales with excess rate
- `plan_cycle` — subscription created + canceled within 24h (refund abuse)
- `credit_drain` — >50% of monthly allowance consumed in 1 hour

`runAbuseSignalWorker` runs every ~5 minutes against users with recent credit
activity, runs all detectors in parallel, and calls `autoSuspendHighRisk` for anyone
whose rolling 24h max score crosses 90. Auto-suspend inserts an `admin_overrides`
row with `actor_kind='system'` and writes `system.auto_suspend` to audit.

Admin `/abuse` surface shows unreviewed signals with inline "Suspend" and "Clear"
actions.

---

## 12. Security posture

| Control | Implementation |
|---|---|
| Backend-only enforcement | `entitlement.middleware.ts` — client can never grant itself access |
| Idempotency keys | Required header on every credit-consuming endpoint |
| Atomic debit | Conditional UPDATE + UNIQUE ledger constraint |
| Append-only ledger & audit | BEFORE UPDATE/DELETE triggers raise exceptions |
| Stripe replay protection | `stripe_event_log` unique PK on event_id |
| Admin role check | `authorize('admin')` with DB fallback for stale JWT |
| Secrets | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` as separate env vars; frontend only sees publishable key |
| PII discipline | `audit_log` stores Stripe IDs only, never raw card data; UA trimmed to 255 chars |
| Abuse auto-throttle | `autoSuspendHighRisk` at score ≥ 90 |
| Credit wallet race-free | Version fence + atomic UPDATE defeats multi-session races |

---

## 13. Observability

- `logger.service.ts` emits structured JSON with `[entitlement]` / `[credit]` /
  `[stripe-webhook]` / `[abuse]` prefixes on every decision point
- Shadow-mode denials log as `[entitlement] SHADOW denial — would have blocked`
  with `userId`, `featureKey`, `reason`, requested amount
- `stripe_event_log` + `audit_log` provide forensic trail
- `/admin/subscriptions/analytics` surfaces MRR / churn / credit-burn for
  operators; credit_burn row's `reserved − consumed` delta flags estimator
  over-reservation

---

## 14. Rollout

Current state: `ENTITLEMENT_ENFORCEMENT_MODE=shadow`.

| Step | Action | Gate |
|---|---|---|
| 1 | Keep shadow for 48h with real traffic | Zero double-debits in `credit_transactions`; expected blocks appear in shadow log |
| 2 | Flip to `enforce-new` with `ENTITLEMENT_ROLLOUT_START=<now>` | New signups hit 402 on Free-tier limits; existing paid users unaffected |
| 3 | Monitor 7 days | p99 `/me/entitlements` < 150ms; `stripe_event_log` has zero duplicate side-effects (`COUNT(*) GROUP BY event_id HAVING COUNT(*) > 1` returns 0) |
| 4 | Flip to `enforce-all` | Full enforcement; abuse worker enabled |

Kill-switch: flip the env back to `shadow` and restart.

---

## 15. Testing strategy

Already-proven (Wave 2):
- Live reserve → replay → settle → release cycle passed 6/6 assertions against a real wallet

Planned (Wave 6 follow-up, not yet landed):
- **Unit** — 50 parallel debits of 10 from 100-credit wallet ⇒ exactly 10 succeed, 40 fail, 10 ledger rows, final balance = 0
- **Unit** — 100 concurrent calls with identical idempotency key ⇒ exactly 1 ledger row
- **Integration** — Stripe `stripe events resend <evt>` replay 10× ⇒ 1 subscription update, 1 invoice, 1 credit grant
- **Chaos** — `pg_terminate_backend` mid-debit; wallet + ledger remain consistent
- **Load (k6)** — 1000rps on ai-coach for 5 min; zero double-debits; p99 < 300ms
- **Security fuzz** — missing `Idempotency-Key` → 400; forged admin JWT → 403 (DB fallback)
- **E2E (Playwright)** — trial → locked route → UpgradeModal → Stripe test card → success page → entitlement refetch → route accessible; admin matrix flip cascades to client within 60s
- **Visual regression** — Playwright screenshots on `/upgrade`, `/settings/billing/credits`, `/admin/subscriptions/features`, `/admin/subscriptions/analytics`

---

## 16. Deprecations

- `client/app/context/SubscriptionAccessContext.tsx` — kept as compat shim, internally proxies to `useEntitlements`.
- `client/hooks/useSubscriptionAccess.ts` — same; marked `@deprecated`. New callers use `useEntitlements()` directly.
- Both will be deleted once a codebase-wide grep shows zero imports.

---

## 17. File-level map

**Server — new files**
- `server/src/services/entitlement.service.ts`
- `server/src/services/credit.service.ts`
- `server/src/services/stripe-webhook.service.ts`
- `server/src/services/abuse.service.ts`
- `server/src/middlewares/entitlement.middleware.ts`
- `server/src/routes/admin-billing.routes.ts`
- `server/src/routes/entitlements.routes.ts`
- `server/src/routes/me-credits.routes.ts`
- `server/src/controllers/entitlements.controller.ts`
- `server/src/jobs/graceExpirationJob.ts`
- `server/src/utils/tokenCounter.ts`
- 11 migration files under `server/src/database/migrations/20260423*`

**Server — modified**
- `server/src/routes/webhooks/stripe.routes.ts` (idempotency wrapper + hardened router)
- `server/src/routes/subscription.routes.ts` (`/cancel` endpoint)
- `server/src/routes/index.ts` (mount `/me/...` and `/admin/billing`)
- `server/src/config/env.config.ts` (`ENTITLEMENT_ENFORCEMENT_MODE`)
- Every AI route file: ai-coach, rag-chatbot, voice-calls, tts, transcription, journal, emotional-checkin, call-summaries

**Client — new files**
- `client/app/context/EntitlementsContext.tsx`
- `client/stores/walletStore.ts`
- `client/stores/paywallStore.ts`
- `client/components/notifications/EntitlementsSocketBridge.tsx`
- `client/components/gates/` — `FeatureGate`, `PlanGate`, `CreditGate`, `PageAccessGate`, `PaywallErrorBoundary`, hooks
- `client/components/subscription/` — `PlanComparisonTable`, `UpgradeModal`, `PaywallCard`, `LockedFeatureScreen`, `RemainingCreditsChip`, `TrialCountdownBanner`, `CreditLedgerTable`, `CancelSubscriptionDialog`, `PromoCodeInput`, `WalletSummaryCard`, `CheckoutButton`
- `client/components/admin/` — `EntityMatrix`, `OverrideDialog`, `AbuseSignalBadge`
- `client/hooks/useNavEntitlement.ts`
- `client/lib/icon-map.ts`
- `client/lib/analytics.ts`
- Pages: `/upgrade`, `/settings/billing`, `/settings/billing/credits`, `/locked/[pageKey]`, `/admin/subscriptions/{features,overrides,promotions,abuse,usage,analytics}`

**Client — modified**
- `client/components/providers/index.tsx` (`EntitlementsProvider` + `EntitlementsSocketBridge`)
- `client/app/(pages)/dashboard/components/DashboardSidebar.tsx` (menu filter via `useNavEntitlement`)
- `client/components/layout/DashboardHeader.tsx` (credits chip + trial banner)
- 5 premium page.tsx files wrapped with `PageAccessGate`
- `client/hooks/useSubscriptionAccess.ts` (compat shim)

---

## 18. Monetization recommendations (founder-level)

1. **Keep shadow mode for 48h minimum.** Flipping to `enforce-all` prematurely
   will ship 402s to paying users who happened to hit an edge case. The shadow
   log is the evidence you need before you flip.
2. **Tune `estimateChatCredits` against real settle deltas.** The admin
   analytics "reserved − consumed" metric shows over-reservation; every 10%
   over-reservation burns 10% of the wallet on nothing. Reduce the
   `creditsPerInputBucket` / `creditsPerOutputBucket` constants in
   `tokenCounter.ts` once you have 7 days of data.
3. **Set `credits_rollover_policy='cap'` with a reasonable cap on paid tiers.**
   `'none'` punishes light months; `'unlimited'` creates a ledger that grows
   forever. `cap = 2× monthly allowance` is the industry default.
4. **Use `comp_plan` instead of `grant_credits` for support cases.** A 100-credit
   grant feels generous but disappears; a 7-day comp of Pro converts retention.
5. **Surface the chip + trial banner on marketing pages too.** The chip is the
   single most effective upgrade CTA — it's always visible, contextually accurate,
   and low-friction.
6. **Monitor `abuse_signals` weekly.** Even at 0 signals, the worker is your
   chargeback early-warning system. A single `plan_cycle` signal before the
   chargeback window closes saves a manual dispute.
