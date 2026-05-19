<div align="center">

# Balencia

**AI Life Coach Platform**

A full-stack SaaS platform that connects every part of a user's life system — career, relationships, spirituality, finance, fitness, creativity, and learning — through AI-powered coaching that reveals the connections humans can't see themselves.

[![CI](https://github.com/xyric-ai/yhealth-app/actions/workflows/ci.yml/badge.svg)](https://github.com/xyric-ai/yhealth-app/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](./LICENSE)

</div>

---

## Overview

Balencia is an AI-first life coaching platform built as a monorepo with a Next.js frontend and Express.js API backend. It spans **8 life domains** — Fitness, Nutrition, Mental Health, Finance, Career, Relationships, Spirituality, and Learning — and uses cross-domain intelligence to surface insights users can't discover on their own.

### Key Capabilities

| Domain | What It Does |
|--------|-------------|
| **AI Coach (SIA)** | Conversational AI coach with text, voice, and image analysis. Adapts tone by motivation tier. 18+ proactive message types. |
| **Cross-Domain Intelligence** | Correlates data across all life domains. "Your spending increases on days you skip exercise." |
| **Fitness & Movement** | AI-generated workout plans, sport-specific coaching, WHOOP/Fitbit/Garmin/Strava sync, exercise library |
| **Nutrition & Diet** | Adaptive meal plans, macro tracking, nutrition learning system, calorie optimization |
| **Mental Health** | Journaling, mood tracking, stress management, breathing exercises, emotional check-ins, guided soundscapes |
| **Finance** | Budget tracking, spending pattern analysis, financial goal connection to life goals |
| **Spirituality** | Prayer tracking, spiritual practice logging, faith-aware coaching |
| **Community** | Competitions, leaderboards, accountability buddies, team challenges |
| **Knowledge System** | Personal wiki, knowledge graph, memory engine, vector embeddings for semantic recall |
| **Gamification** | Streaks, achievements, micro-wins, XP system — intensity adapts by motivation tier |

---

## Architecture

```
                            ┌──────────────────────────────┐
                            │       Next.js 16 Client      │
                            │     React 19 · App Router     │
                            │  Shadcn/UI · Redux · RQ · 3D  │
                            └──────────────┬───────────────┘
                                           │ REST / WebSocket / SSE
                            ┌──────────────▼───────────────┐
                            │      Express 5 API Server     │
                            │   TypeScript · Node.js 20+    │
                            │  76 Controllers · 99 Routes   │
                            │       217+ Services           │
                            └──┬──────┬──────┬──────┬──────┘
                               │      │      │      │
                 ┌─────────────▼┐ ┌───▼────┐ │  ┌───▼──────────┐
                 │  PostgreSQL  │ │ Redis  │ │  │   BullMQ     │
                 │  + pgvector  │ │ Cache  │ │  │  Job Queue   │
                 │  (Primary)   │ │Sessions│ │  │  42 Workers  │
                 └──────────────┘ └────────┘ │  └──────────────┘
                                             │
              ┌──────────────────────────────┘
              │
    ┌─────────▼──────────┐   ┌──────────────────┐   ┌─────────────────┐
    │  LangChain + LLMs  │   │  External APIs   │   │   AWS S3        │
    │  Anthropic · OpenAI │   │  Stripe · PayPal │   │   File Storage  │
    │  Google GenAI       │   │  Twilio · SMTP   │   │                 │
    └─────────────────────┘   │  WHOOP · Fitbit  │   └─────────────────┘
                              │  Garmin · Strava │
                              └──────────────────┘
```

### Scale

| Component | Count |
|-----------|-------|
| API Routes | 99 route files |
| Backend Services | 217+ |
| Controllers | 76 |
| Background Jobs | 42 (cron + queue) |
| Client Pages | 60+ |
| React Components (.tsx) | 1,369 |
| Database Migrations | 40+ |

---

## Tech Stack

### Frontend (`client/`)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5 |
| Component System | Radix UI + Shadcn/UI |
| Styling | Tailwind CSS 4 |
| State Management | Redux Toolkit + TanStack React Query |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| 3D Rendering | Three.js + React Three Fiber |
| Charts | Recharts + Chart.js + D3.js |
| Rich Text | TipTap |
| Graph Visualization | Graphology + React Sigma |
| Auth | NextAuth.js (Google OAuth) |
| Testing | Jest + React Testing Library |

### Backend (`server/`)

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ (with cluster mode) |
| Framework | Express.js 5 |
| Language | TypeScript 5.8 |
| Database | PostgreSQL 14+ with pgvector |
| ORM | Prisma 5 |
| Cache | Redis (ioredis) + node-cache |
| Job Queue | BullMQ |
| AI/LLM | LangChain (Anthropic, OpenAI, Google GenAI) |
| Real-time | Socket.io |
| Auth | JWT + bcrypt |
| Payments | Stripe + PayPal |
| Email | Nodemailer + EJS templates |
| SMS | Twilio |
| File Storage | AWS S3 |
| Validation | Zod |
| Testing | Jest + Supertest |

### Infrastructure

| Concern | Technology |
|---------|-----------|
| CI/CD | GitHub Actions (lint, typecheck, test, build, Trivy scan) |
| Containers | Docker (multi-stage builds) |
| Deployment | Railway |
| Monitoring | Health check endpoints + structured logging |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **PostgreSQL** 14+
- **Redis** (optional for dev, required for production)
- **Git** 2.30+

### Installation

```bash
# Clone the repository
git clone https://github.com/xyric-ai/yhealth-app.git
cd yhealth-app

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Setup

```bash
# Server environment
cd server
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET

# Client environment
cd ../client
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
```

### Database Setup

```bash
cd server

# Create tables and run migrations
npm run db:setup
npm run db:migrate
```

### Start Development

```bash
# Terminal 1 — API server (port 5000)
cd server
npm run dev

# Terminal 2 — Next.js client (port 3000)
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development

### Commands

#### Server

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (nodemon + tsx) |
| `npm run build` | Compile TypeScript + resolve path aliases |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Run ESLint |
| `npm run test:unit` | Run unit tests |
| `npm run test:integration` | Run integration tests (requires PostgreSQL) |
| `npm run test:coverage` | Run all tests with coverage report |
| `npm run db:setup` | Create database tables |
| `npm run db:migrate` | Run pending migrations |

#### Client

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |
| `npm run test:coverage` | Tests with coverage |

### Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production (protected) |
| `develop` | Staging / integration |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `hotfix/*` | Critical production fixes |

### Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```bash
feat(ai-coach): add voice call with real-time transcription
fix(nutrition): correct macro calculation for custom meals
test(wellbeing): add integration tests for mood tracking
```

---

## Project Structure

```
yhealth-app/
├── client/                      # Next.js 16 frontend
│   ├── app/                     # App Router (60+ page routes)
│   │   ├── (pages)/             # Authenticated pages
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── ai-coach/        # SIA AI coach interface
│   │   │   ├── chat/            # Chat & messaging
│   │   │   ├── goals/           # Life goal tracking
│   │   │   ├── schedule/        # Calendar & scheduling
│   │   │   ├── nutrition/       # Meal plans & logging
│   │   │   ├── workouts/        # Exercise & fitness
│   │   │   ├── wellness/        # Mental health hub
│   │   │   ├── knowledge-graph/ # Interactive knowledge visualization
│   │   │   ├── community/       # Social features
│   │   │   ├── voice-assistant/ # Voice interaction
│   │   │   ├── admin/           # Admin panel (19+ sub-routes)
│   │   │   └── ...
│   │   └── auth/                # Authentication pages
│   ├── components/              # React components (30+ groups)
│   │   ├── ui/                  # Shadcn/UI base components
│   │   ├── dashboard/           # Dashboard widgets
│   │   ├── chat/                # Chat interfaces
│   │   ├── ai-coach/            # AI coach UI
│   │   ├── voice-assistant/     # Voice interaction UI
│   │   └── ...
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities (API client, auth, etc.)
│   └── store/                   # Redux store & slices
│
├── server/                      # Express 5 backend API
│   ├── src/
│   │   ├── controllers/         # 76 request handlers
│   │   ├── services/            # 217+ business logic services
│   │   │   ├── ai-coach/        # AI coaching engine
│   │   │   ├── langgraph-*.ts   # LangGraph agent pipelines
│   │   │   ├── memory-engine.*  # Conversation memory system
│   │   │   ├── knowledge-*.ts   # Knowledge graph services
│   │   │   ├── vector-*.ts      # Vector embedding services
│   │   │   └── ...
│   │   ├── routes/              # 99 API route files
│   │   ├── jobs/                # 42 background jobs (cron + BullMQ)
│   │   ├── workers/             # Async task processors
│   │   ├── database/            # Migrations, table DDL, setup scripts
│   │   ├── middlewares/         # Auth, validation, rate limiting, error handling
│   │   ├── validators/          # Zod request schemas
│   │   ├── config/              # Environment config (Zod-validated)
│   │   ├── types/               # TypeScript type definitions
│   │   ├── lib/                 # External integration clients
│   │   ├── helpers/             # Utility functions
│   │   └── mails/               # EJS email templates
│   └── tests/
│       ├── unit/                # Unit tests (mocked dependencies)
│       ├── integration/         # Integration tests (real PostgreSQL)
│       ├── load/                # k6 load test scenarios
│       └── helpers/             # Test utilities & harnesses
│
├── .github/workflows/ci.yml    # CI pipeline (lint, typecheck, test, build, security)
├── docker-compose.yml           # Docker orchestration
├── Dockerfile.client            # Multi-stage client build
├── Dockerfile.server            # Multi-stage server build
├── CONTRIBUTING.md              # Contribution guidelines
├── CODE_OF_CONDUCT.md           # Code of conduct
├── SECURITY.md                  # Security policy
└── railway.toml                 # Railway deployment config
```

---

## Docker Deployment

Both services use optimized multi-stage Docker builds (95%+ context reduction via `.dockerignore`).

```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up -d
```

| Service | Port | Health Check |
|---------|------|-------------|
| Client | 3000 | `GET /` |
| Server | 5000 | `GET /api/health` |

Services run on a shared `balencia-network` with automatic restarts and health monitoring.

---

## CI/CD Pipeline

GitHub Actions runs on every push and PR:

1. **Client** — ESLint, TypeScript check, Jest tests, Next.js build
2. **Server** — ESLint, TypeScript check, Jest tests (with PostgreSQL service), build
3. **Security** — Trivy vulnerability scanning
4. **Gate** — All checks must pass before merge

Build artifacts are retained for 1 day. Concurrent runs on the same branch are automatically cancelled.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, coding standards, PR process, and commit message guidelines.

## Security

**Do not** open public issues for security vulnerabilities. Email **support@xyric.ai** directly. See [SECURITY.md](./SECURITY.md) for details.

## License

[ISC](./LICENSE)

---

<div align="center">

**Built by [Xyric AI](https://xyric.ai)**

</div>
