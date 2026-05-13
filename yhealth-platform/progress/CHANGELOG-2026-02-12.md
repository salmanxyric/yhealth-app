# Changelog - February 12, 2026

## Subscription & Payments (Epic 04 – Premium)

### 1. Subscription Management (Client)
- **Subscription page** (`/subscription`): Manage subscription, cancel, animated timer, invoice download, invoice card
- **Subscription in nav**: "Subscription" in user dropdown (DashboardHeader) only when user is subscribed (`useSubscriptionAccess().isSubscribed`)
- **Refetch on return**: When landing with `?refreshed=1` (e.g. from payment success), refetch subscription and remove query param so plan is visible
- **Suspense**: Subscription page and success page wrap `useSearchParams()` in Suspense for Next.js static generation

### 2. Dynamic Pricing & Plans
- **Pricing from API**: Landing and plans pricing load from `GET /subscription/plans` (no static plans)
- **Nav**: "Pricing" in header/footer/CTA links to `/plans`
- **Plans page** (`/plans`): Emerald/sky gradient hero; if user has active subscription, redirect to `/subscription`; 3s timeout so loading does not hang
- **PricingSection**: Emerald/sky styling; `isPro(plan.slug)` for popular plan badge

### 3. Payment Flow
- **Payment success page** (`/subscription/success`): Reads `session_id` from query; verifies via `POST /subscription/verify-session`; shows verifying → success (with plan name) or error; "View subscription" + auto-redirect to `/subscription?refreshed=1` after 4s
- **Stripe success URL**: Checkout success URL set to `${origin}/subscription/success` (Stripe appends `session_id`)
- **Verify-session**: Backend verifies Stripe Checkout session and syncs subscription to DB when webhook is not available

### 4. Backend: Subscriptions & Stripe
- **One-time payments**: If plan has no `stripe_price_id`, Checkout uses `mode: 'payment'` with `price_data` (one-time product)
- **Webhook**: `checkout.session.completed` handles both subscription and one-time; syncs to DB
- **Subscription service**: `getLatestInvoiceUrl`, `verifyCheckoutSession`, `syncSubscriptionFromStripe`, `getPeriodEndForPlan` (one-time period), invoice URL in `GET /subscription/me`
- **Stripe API version**: Unified to `2025-12-15.clover` (subscription service + webhook route)

### 5. Admin & Visitor Analytics
- **Admin subscriptions** (`/admin/subscriptions`): List/manage plans and subscriptions
- **Admin analytics** (`/admin/analytics`): Visitor analytics with time series (Recharts)
- **Visitor tracking**: Visitor visits table, visitor routes, controller, service; `VisitorTracker` component
- **PaginationMeta**: Admin subscription/plan list responses include `totalPages`, `hasNextPage`, `hasPrevPage`

### 6. Seed & Data
- **Subscription plans seed**: Free ($0), 1 Month ($9.99/mo), 3 Month ($24.99 per 3 months); 1 week free trial (TRIAL_DAYS in service)
- **Seed script**: `seed-subscription-plans.ts`; interval label supports `year` for future plans

### 7. Build & Fixes
- **Framer Motion**: Subscription timer transition set to `type: 'tween', ease: 'linear'` (fixes `AnimationGeneratorType`)
- **Recharts**: Removed `animationDuration` / `animationBegin` from chart props where types do not expose them (admin page, admin analytics)
- **Subscription page**: Single default export; inner content in `SubscriptionPageContent` to avoid duplicate name
- **Server TS**: PaginationMeta full shape in subscription controller; Stripe apiVersion in webhook; seed interval comparison; visitor.service `groupBy` marked unused (`_groupBy`)

---

## Technical Summary

### Backend (`server/`)
- **New**: `subscription.controller.ts`, `subscription.service.ts`, `subscription.routes.ts`, `subscription.validator.ts`
- **New**: `visitor.controller.ts`, `visitor.service.ts`, `visitor.routes.ts`
- **New**: `admin-subscription.routes.ts`, `admin-analytics.routes.ts`
- **New**: `webhooks/stripe.routes.ts`
- **New migrations**: `add-subscription-tables.sql`, `add-visitor-visits.sql`
- **New seed**: `seed-subscription-plans.ts`
- **Updated**: `app.ts` (routes), `routes/index.ts`, PaginationMeta in subscription controller, Stripe apiVersion, visitor.service

### Frontend (`client/`)
- **New pages**: `/subscription`, `/subscription/success`, `/plans`, `/admin/subscriptions`, `/admin/analytics`
- **New**: `SubscriptionAccessContext`, `useSubscriptionAccess`, `PricingSection`, `SubscriptionTimer`, visitor analytics charts
- **New**: `VisitorTracker`, `use-count-up.ts`
- **Updated**: DashboardHeader (Subscription menu when subscribed), landing pricing (dynamic, link to `/plans`), layout/nav, api-client, auth context

---

## Docs

- **STATUS.md**: Epic 04 (Premium) progress and February 12, 2026 updates section added.
