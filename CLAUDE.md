# CLAUDE.md

## Project Structure

Monorepo: `server/` (Node.js/Express API) + `client/` (Next.js frontend).

## Commands

### Server
- `npm.cmd --prefix server run typecheck` — TypeScript check (run before committing)
- `npm.cmd --prefix server run lint` — ESLint (0 errors policy; pre-existing warnings are OK)
- `npm.cmd --prefix server run test:unit` — Jest unit tests (tests/unit/)
- `npm.cmd --prefix server run test:integration` — Jest integration tests (tests/integration/)
- Filter tests: `npm.cmd --prefix server run test:unit -- --testPathPatterns="<pattern>"`
  Note: `--testPathPatterns` (plural), NOT `--testPathPattern`

### Client
- `npm.cmd --prefix client run build` — Next.js build
- `npm.cmd --prefix client run lint` — ESLint
- `npm.cmd --prefix client run test` — Jest tests

## Auth Identity

JWT payload field is `req.user.userId` (NOT `req.user.id`).
Type: `IJwtPayload` in `server/src/types/index.ts`. Fields: userId, email, role, sessionId.
Base controller getter: `req.user?.userId` in `server/src/controllers/base.controller.ts`.
Authorization middleware: `authorize(...roles)` from `server/src/middlewares/auth.middleware.ts`.

## Testing Patterns

- ESM mocking: `jest.unstable_mockModule('path', () => ({ ... }))` then `await import('path')`
- Controller test harness: `createAuthReq`, `createRes`, `callHandler` from `tests/helpers/controller-harness.js`
- DB/service mocks: `setupDbMock()`, `setupLoggerMock()`, `setupCacheMock()` from `tests/helpers/`
- BullMQ: use `UnrecoverableError` for non-retryable job failures

## Database

- Migrations: `server/src/database/migrations/YYYYMMDDHHMMSS_description.sql`
- Table DDL: `server/src/database/tables/NN-name.sql`
- Some tables are created dynamically via `ensureTable()` in services (e.g. cross_pillar_contradictions, daily_analysis_reports)

## Gotchas

- Node.js `cluster.worker.id` starts at 1, not 0
- PowerShell interprets `|` in npm args — run filtered tests one pattern at a time
- `daily_analysis_reports` is the deterministic analytics source of truth — never write LLM-derived data there
- Conversation-derived LLM claims go to `conversation_claims` table, not `daily_analysis_reports`
