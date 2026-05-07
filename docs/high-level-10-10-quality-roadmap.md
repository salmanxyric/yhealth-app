# yHealth 10/10 Code Quality Roadmap

Date: 2026-05-07
Scope: `client`, `server`, shared TypeScript, deployment/runtime posture

## Summary

The current yHealth codebase is approximately **7/10**: production builds pass, server checks are healthy, and the architecture has useful domain separation. To reach a **10/10 production-grade standard**, the next work should focus on security hardening, operational reliability, module decomposition, frontend correctness, stronger test gates, and observability.

## Target 10/10 Standard

A 10/10 yHealth codebase should have:

- No browser-readable refresh tokens or long-lived API tokens.
- Third-party OAuth tokens encrypted at rest.
- No schema or seed mutation during normal application startup.
- Background jobs that run exactly once per environment and are idempotent under retries.
- Clean build, typecheck, lint, and test gates.
- Small, reviewable modules with clear domain boundaries.
- Structured logging with request IDs and secret/PII redaction.
- CI that blocks high-risk regressions.
- Clear deployment, migration, and rollback workflows.
- High-confidence tests around auth, billing, integrations, background jobs, AI tools, and health data.

## Priority Roadmap

## Phase 1: Security Hardening

Goal: remove account takeover and credential exposure risks.

Required work:

- Replace script-readable `balencia_access_token` cookie usage with `HttpOnly`, `Secure`, `SameSite` cookies.
- Stop copying `refreshToken` into browser-visible NextAuth session data.
- Route sensitive browser/API interactions through Next route handlers or a backend-for-frontend layer where practical.
- Encrypt `access_token`, `refresh_token`, and `client_secret` values for WHOOP, Spotify, Google Calendar, and similar integrations.
- Add token, cookie, auth header, and PII redaction to logging.
- Tighten CSP by removing `unsafe-eval` and reducing `unsafe-inline`.
- Review admin/debug endpoints for token or PII exposure.

Target outcome: XSS no longer directly compromises API/session tokens or third-party credentials.

## Phase 2: Operational Reliability

Goal: make production boot, jobs, and deploys predictable.

Required work:

- Remove `runColumnSync()` from normal server startup.
- Move all schema and bootstrap data changes into explicit migrations and seed scripts.
- Disable runtime `createTableIfMissing` behavior in production.
- Fix cluster scheduler ownership. `cluster.worker.id === 0` is likely incorrect because Node cluster worker IDs are normally 1-based.
- Ensure scheduled background jobs run exactly once per environment.
- Ensure queue workers and periodic jobs are idempotent and retry-safe.
- Add startup checks for database, Redis, required migrations, and required environment variables.
- Track and clean up every interval, timeout, worker, queue, socket, and server handle during graceful shutdown.

Target outcome: deploys are predictable, rollback-safe, and jobs neither double-run nor silently skip.

## Phase 3: Codebase Decomposition

Goal: make high-risk areas easier to review, test, and change.

Top files to split first:

- `server/src/services/langgraph-chatbot.service.ts`
- `server/src/services/proactive-messaging.service.ts`
- `server/src/services/langgraph-semantic-tools.service.ts`
- `server/src/controllers/integration.controller.ts`
- `client/app/(pages)/dashboard/components/tabs/nutrition/hooks/useNutritionData.ts`
- `client/app/(pages)/admin/testimonials/AdminTestimonialsPageContent.tsx`

Recommended extraction pattern:

- API/client adapters
- Domain logic
- Validation and parsing
- Persistence
- Orchestration
- Presentation components
- Pure helpers
- Focused tests beside changed behavior

Target outcome: core production files stay below roughly 800-1000 lines unless there is a strong reason.

## Phase 4: Frontend Correctness

Goal: make React 19 and Next 16 behavior clean and future-proof.

Required work:

- Reduce client lint warnings from the current warning count to zero.
- Promote React Compiler rules back to errors after cleanup.
- Fix render-time `Math.random()` and `Date.now()` purity warnings.
- Fix synchronous `setState` in effects where it creates cascading renders.
- Fix missing hook dependencies and manual memoization warnings.
- Move unsupported metadata viewport configuration to proper `viewport` exports.
- Fix Recharts container sizing warnings seen during production build.

Target outcome: client lint is clean, compiler-compatible, and warning-free.

## Phase 5: Testing Upgrade

Goal: protect the areas that can hurt users, privacy, billing, and trust.

High-priority test coverage:

- Auth refresh/session behavior.
- Browser token migration.
- OAuth token encryption/decryption and rotation.
- Integration reconnect and credential-change flows.
- Background job single-run and idempotency behavior.
- Billing, credits, and entitlement enforcement.
- AI tool routing and safety guardrails.
- Calendar, WHOOP, Spotify, and email sync failure modes.
- Migration verification.

Recommended CI commands:

```bash
cd server && npm run typecheck
cd server && npm run lint
cd server && npm run test:ci
cd server && npm run build
cd client && npm run lint
cd client && npm run test:ci
cd client && npm run build
```

Target outcome: high-risk regressions are caught before deploy.

## Phase 6: Observability

Goal: production issues should be diagnosable quickly and safely.

Required work:

- Replace raw runtime `console.*` usage with structured logging.
- Redact tokens, auth headers, cookies, passwords, health notes, and PII.
- Carry request IDs across client calls, API handlers, workers, queues, and logs.
- Add job metrics: started, completed, failed, retried, skipped, and duration.
- Add API metrics: latency, status codes, rate-limit hits, and DB timings.
- Add integration metrics: OAuth refresh failures, sync failures, and provider rate limits.
- Add error tracking with clear severity levels and ownership.

Target outcome: incidents have actionable evidence instead of guesswork.

## Quality Gates

Before calling the codebase 10/10, require:

- Server typecheck passes.
- Server lint passes with zero warnings or explicitly approved exceptions.
- Server build passes.
- Client lint passes with zero warnings.
- Client build passes.
- Unit and integration tests pass.
- No browser-readable refresh token.
- OAuth tokens encrypted at rest.
- No production schema mutation on startup.
- Background jobs are single-run safe.
- No known critical or high security findings.
- Large active modules have either been decomposed or have a documented extraction plan.
- Deployment, migration, and rollback workflow is documented and tested.

## Recommended Execution Order

1. Auth and browser token security.
2. OAuth token encryption.
3. Startup migration cleanup.
4. Background job cluster and idempotency fixes.
5. Client lint warning cleanup.
6. Large module decomposition.
7. Observability and CI hardening.

## Final Assessment

The project is already past the “prototype” stage: it builds, it has meaningful tests, and the server has respectable foundations. The next level is production discipline. The fastest path to 10/10 is to harden secrets and auth first, make runtime operations deterministic, then steadily pay down module and lint debt behind strict CI gates.
