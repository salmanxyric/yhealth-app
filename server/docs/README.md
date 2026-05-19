# Balencia Server

Express 5 backend API for the Balencia AI Life Coach platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ (with cluster mode for production) |
| Framework | Express.js 5 |
| Language | TypeScript 5.8 |
| Database | PostgreSQL 14+ with pgvector extension |
| ORM | Prisma 5 |
| Cache | Redis (ioredis) + in-memory (node-cache) |
| Job Queue | BullMQ (Redis-backed) |
| AI/LLM | LangChain (Anthropic, OpenAI, Google GenAI) |
| Real-time | Socket.io |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Payments | Stripe + PayPal |
| Email | Nodemailer + EJS templates |
| SMS/WhatsApp | Twilio |
| File Storage | AWS S3 |
| Validation | Zod |
| Testing | Jest 30 + Supertest |

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env — at minimum: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET

# Create tables and run migrations
npm run db:setup
npm run db:migrate

# Start development server
npm run dev
```

Server starts at [http://localhost:5000](http://localhost:5000).

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload (nodemon + tsx) |
| `npm run build` | Compile TypeScript + resolve path aliases |
| `npm start` | Start compiled production server |
| `npm run start:prod` | Start in production mode (NODE_ENV=production) |
| `npm run typecheck` | Type-check without emitting files |
| `npm run lint` | Run ESLint (0 errors policy) |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests (requires PostgreSQL) |
| `npm run test:coverage` | Run all tests with coverage |
| `npm run test:ci` | CI mode (serial execution, coverage) |
| `npm run db:setup` | Create all database tables |
| `npm run db:migrate` | Run pending SQL migrations |
| `npm run db:migrate:auto` | Auto-detect and run new migrations |
| `npm run db:migrate:verify` | Verify migration state |

### Filtering Tests

```bash
# Run tests matching a pattern
npm run test:unit -- --testPathPatterns="ai-coach"
```

> Note: Use `--testPathPatterns` (plural), not `--testPathPattern`.

---

## Project Structure

```
server/
├── src/
│   ├── index.ts              # Entry point (clustering, job orchestration, graceful shutdown)
│   ├── app.ts                # Express setup (middleware stack, security, CORS, rate limiting)
│   ├── config/
│   │   ├── env.config.ts     # Zod-validated environment configuration
│   │   └── database.config.ts # Connection pooling, session store
│   ├── controllers/          # 76 request handlers
│   │   ├── base.controller.ts # Base class (auth helpers, response formatting)
│   │   ├── auth.controller.ts
│   │   ├── ai-coach.controller.ts
│   │   ├── plan.controller.ts
│   │   └── ...
│   ├── services/             # 217+ business logic services
│   │   ├── ai-coach/         # AI coaching engine
│   │   │   ├── core/         # Provider abstraction, model factory
│   │   │   └── image/        # Image analysis service
│   │   ├── langgraph-chatbot.service.ts    # LangGraph agent pipeline
│   │   ├── conversation-insight-extractor.service.ts
│   │   ├── memory-engine.service.ts        # Conversation memory
│   │   ├── knowledge-graph.service.ts      # Knowledge graph
│   │   ├── vector-embedding.service.ts     # pgvector embeddings
│   │   ├── cross-pillar-intelligence.service.ts  # Cross-domain insights
│   │   ├── comprehensive-user-context.service.ts
│   │   ├── model-factory.service.ts        # LLM provider routing
│   │   ├── chat-call.service.ts            # Voice call management
│   │   ├── emotion-detection.service.ts
│   │   ├── mental-recovery-score.service.ts
│   │   ├── health-profile-access.service.ts
│   │   ├── embedding-queue.service.ts
│   │   ├── water-intake.service.ts
│   │   ├── subscription.service.ts         # Stripe/PayPal billing
│   │   └── ...
│   ├── routes/               # 99 API route files
│   │   ├── auth.routes.ts
│   │   ├── ai-coach.routes.ts
│   │   ├── rag-chatbot.routes.ts
│   │   ├── fitness.routes.ts
│   │   ├── nutrition.routes.ts
│   │   ├── wellness.routes.ts
│   │   ├── knowledge-graph.routes.ts
│   │   ├── community.routes.ts
│   │   ├── subscription.routes.ts
│   │   └── ...
│   ├── jobs/                 # 42 background jobs
│   │   ├── daily-scoring.job.ts
│   │   ├── streak-validation.job.ts
│   │   ├── insights-computation.job.ts
│   │   ├── memory-extraction.job.ts
│   │   ├── wiki-synthesis.job.ts
│   │   ├── whoop-sync.job.ts
│   │   ├── nutrition-analysis.job.ts
│   │   └── ...
│   ├── workers/              # Async task processors (BullMQ)
│   │   ├── embedding-worker.ts
│   │   └── ...
│   ├── database/
│   │   ├── tables/           # Table DDL (numbered for dependency order)
│   │   ├── migrations/       # SQL migrations (YYYYMMDDHHMMSS_description.sql)
│   │   ├── setup.ts          # Full schema creation
│   │   └── run-migrations.ts # Migration runner
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # JWT verification + role-based authorization
│   │   ├── error.middleware.ts     # Centralized error handler
│   │   ├── validate.middleware.ts  # Zod schema validation
│   │   ├── rateLimiter.middleware.ts
│   │   └── request-id.middleware.ts
│   ├── validators/           # Zod request schemas
│   ├── types/                # TypeScript types (IJwtPayload, domain types)
│   ├── lib/                  # External integration clients
│   ├── helpers/              # Utility functions
│   ├── models/               # Prisma schema index
│   └── mails/                # EJS email templates
│
├── tests/
│   ├── unit/                 # Fast, isolated tests with mocked dependencies
│   ├── integration/          # Tests with real PostgreSQL
│   ├── load/                 # k6 load test scenarios (ramp-up, sustained, spike, soak)
│   └── helpers/              # Test utilities
│       ├── controller-harness.js   # createAuthReq, createRes, callHandler
│       ├── db-mock.js              # setupDbMock()
│       ├── logger-mock.js          # setupLoggerMock()
│       └── cache-mock.js           # setupCacheMock()
│
├── docs/
│   ├── postman/              # Postman API collection
│   └── README.md             # This file
├── .env.example              # Environment variable template
├── jest.config.js            # Jest configuration
├── tsconfig.json             # TypeScript configuration
└── package.json
```

---

## Architecture

### Request Flow

```
Client Request
    ↓
Express Router  →  Middleware Chain  →  Controller  →  Service  →  Database
                   (auth, validate,      (HTTP       (business     (PostgreSQL
                    rate limit,           handling)    logic)        + Redis)
                    request ID)
                        ↓
                   Error Middleware  →  Formatted Error Response
```

### Design Patterns

| Pattern | Usage |
|---------|-------|
| Controller-Service | Controllers handle HTTP; services contain business logic |
| Middleware Pipeline | Auth, validation, rate limiting, error handling as composable middleware |
| Job Queue | BullMQ for async work (embeddings, analysis, notifications) |
| Cron Scheduling | node-cron for periodic tasks (scoring, syncing, cleanup) |
| Cluster Mode | Node.js cluster for multi-core production deployments |
| Graceful Shutdown | Clean connection/job draining on SIGTERM/SIGINT |

### Authentication

JWT-based with dual tokens:

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 15 minutes | API authentication (Bearer header or cookie) |
| Refresh Token | 7 days | Token renewal |

JWT payload type: `IJwtPayload` with fields `userId`, `email`, `role`, `sessionId`.

Roles: `user`, `admin`, `moderator`, `doctor`, `patient`

Authorization: `authorize(...roles)` middleware from `auth.middleware.ts`.

### AI/LLM Integration

The AI coaching system uses LangChain with multiple provider support:

- **Model Factory** (`model-factory.service.ts`) — Routes requests to Anthropic, OpenAI, or Google GenAI based on task type and availability
- **LangGraph Chatbot** (`langgraph-chatbot.service.ts`) — Stateful conversation agent with tool use
- **Memory Engine** (`memory-engine.service.ts`) — Extracts and stores conversation memories with deduplication
- **Vector Embeddings** (`vector-embedding.service.ts`) — pgvector for semantic search and RAG
- **Cross-Pillar Intelligence** (`cross-pillar-intelligence.service.ts`) — Correlates data across life domains

### Background Jobs

42 background jobs handle async processing:

| Category | Examples |
|----------|---------|
| **Scoring** | Daily scoring, streak validation, engagement scoring |
| **AI Processing** | Insights computation, memory extraction/decay, wiki synthesis/lint |
| **Data Sync** | WHOOP sync, calendar sync, data source sync |
| **Notifications** | Reminder jobs, email digest, accountability triggers |
| **Maintenance** | Stale reservation cleanup, grace expiration, dunning retry |
| **Analytics** | Leaderboard materialization, correlation computation, status analysis |
| **Coaching** | Coaching profile generation, check-in calls, obstacle detection |

Jobs use BullMQ with `UnrecoverableError` for non-retryable failures.

---

## API Reference

### Base URL

```
http://localhost:5000/api
```

### Response Format

```json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

### Core Endpoints

#### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Server health status |
| GET | `/health/live` | No | Liveness probe |
| GET | `/health/ready` | No | Readiness probe |

#### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login with credentials |
| POST | `/auth/social` | No | Social authentication (Google) |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | Yes | Logout (invalidate tokens) |

#### AI Coach

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ai-coach/chat` | Yes | Send message to SIA (SSE streaming) |
| GET | `/ai-coach/sessions` | Yes | List coaching sessions |
| POST | `/ai-coach/voice` | Yes | Voice interaction |
| POST | `/ai-coach/image` | Yes | Image analysis |

#### Goals & Plans

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/plans/generate` | Yes | AI-generate plan preview |
| GET | `/plans` | Yes | List user plans |
| POST | `/plans` | Yes | Create plan |
| POST | `/plans/:id/activate` | Yes | Activate plan |
| GET | `/plans/today` | Yes | Today's activities |

#### Fitness

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/fitness/workouts` | Yes | List workouts |
| POST | `/fitness/workouts` | Yes | Create workout |
| POST | `/fitness/exercises/log` | Yes | Log exercise activity |
| GET | `/fitness/activity` | Yes | Activity dashboard |

#### Nutrition

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/nutrition/plans` | Yes | Diet plans |
| POST | `/nutrition/meals/log` | Yes | Log meal |
| GET | `/nutrition/macros` | Yes | Macro summary |

#### Wellness

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/wellness/mood` | Yes | Log mood |
| POST | `/wellness/journal` | Yes | Create journal entry |
| GET | `/wellness/habits` | Yes | Habit tracking |
| POST | `/wellness/checkin` | Yes | Emotional check-in |

See the full Postman collection at `docs/postman/YHealth_API_Collection.json` for all 99 route files.

---

## Environment Configuration

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `PORT` | Server port (default: 5000) |

### Optional (grouped by feature)

| Group | Variables |
|-------|----------|
| **Redis** | `REDIS_URL` |
| **AWS S3** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` |
| **SMTP** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` |
| **OAuth** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Payments** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID` |
| **SMS** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| **AI/LLM** | `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` |
| **Wearables** | `WHOOP_CLIENT_ID`, `FITBIT_CLIENT_ID`, `GARMIN_KEY`, `STRAVA_CLIENT_ID` |
| **Feature Flags** | `WHATSAPP_COACHING`, `AI_ASSESSMENT`, `WEARABLE_SYNC`, `VOICE_CALLS` |

See `.env.example` for the complete list with descriptions.

---

## Testing

### Test Pyramid

```
       /\
      /E2E\         10% — Load tests (k6)
     /------\
    /Integr. \       20% — Integration tests (real PostgreSQL)
   /----------\
  /    Unit    \     70% — Unit tests (mocked dependencies)
  /------------\
```

### Running Tests

```bash
npm run test:unit                # Unit tests only
npm run test:integration         # Integration tests (requires PostgreSQL)
npm run test:coverage            # All tests with coverage report
npm run test:ci                  # CI mode (serial, coverage)
```

### Test Helpers

| Helper | Purpose |
|--------|---------|
| `createAuthReq(userId)` | Create authenticated mock request |
| `createRes()` | Create mock response with spy methods |
| `callHandler(handler, req, res)` | Execute controller handler |
| `setupDbMock()` | Mock database pool |
| `setupLoggerMock()` | Mock logger |
| `setupCacheMock()` | Mock cache service |

### ESM Mocking Pattern

```typescript
jest.unstable_mockModule('path', () => ({
  myFunction: jest.fn(),
}));
const { myFunction } = await import('path');
```

### Coverage Thresholds

| Metric | Target |
|--------|--------|
| Branches | 85% |
| Functions | 90% |
| Lines | 90% |
| Statements | 90% |

### Load Testing

k6 scenarios for AI Coach SSE pipeline — see [`tests/load/README.md`](../tests/load/README.md).

---

## Database

### PostgreSQL + pgvector

Tables are defined as numbered SQL files in `src/database/tables/` for dependency ordering. Vector embeddings use the pgvector extension for semantic search.

### Migrations

New migrations use the format `YYYYMMDDHHMMSS_description.sql` in `src/database/migrations/`.

```bash
npm run db:setup           # Create all tables
npm run db:migrate         # Run pending migrations
npm run db:migrate:auto    # Auto-detect and run new migrations
npm run db:migrate:verify  # Verify migration state
```

### Dynamic Tables

Some tables are created at runtime via `ensureTable()` in services:
- `cross_pillar_contradictions`
- `daily_analysis_reports`
- `conversation_claims`

---

## Docker

Multi-stage Dockerfile optimized for production:

1. **Dependencies** — `npm ci --legacy-peer-deps`
2. **Builder** — TypeScript compilation + path alias resolution
3. **Runner** — Non-root user, health checks, email templates + migration files

```bash
docker build -f Dockerfile.server -t balencia-server .
docker run -p 5000:5000 -e DATABASE_URL=... balencia-server
```

Health check: `GET http://localhost:5000/api/health`
