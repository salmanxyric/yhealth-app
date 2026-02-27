# YHealth Server Documentation

## Overview

YHealth is a comprehensive health and wellness platform backend built with Node.js, Express 5, TypeScript, and MongoDB. This documentation covers the Epic 01: Onboarding & Assessment module implementation.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Environment Configuration](#environment-configuration)
4. [API Reference](#api-reference)
5. [Authentication](#authentication)
6. [Testing](#testing)
7. [Architecture](#architecture)

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- MongoDB >= 6.0
- npm >= 10.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd yhealth/server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# (See Environment Configuration section)

# Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:coverage` | Run tests with coverage report |

---

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   │   └── env.config.ts
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── assessment.controller.ts
│   │   ├── integration.controller.ts
│   │   ├── preferences.controller.ts
│   │   ├── plan.controller.ts
│   │   └── health.controller.ts
│   ├── middlewares/     # Express middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── rateLimiter.middleware.ts
│   ├── models/          # Mongoose models
│   │   ├── user.model.ts
│   │   ├── assessment.model.ts
│   │   ├── integration.model.ts
│   │   ├── preferences.model.ts
│   │   └── plan.model.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── assessment.routes.ts
│   │   ├── integration.routes.ts
│   │   ├── preferences.routes.ts
│   │   └── plan.routes.ts
│   ├── services/        # Business logic
│   │   ├── cache.service.ts
│   │   ├── email.service.ts
│   │   ├── sms.service.ts
│   │   ├── oauth.service.ts
│   │   └── logger.service.ts
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   │   ├── ApiError.ts
│   │   ├── ApiResponse.ts
│   │   └── asyncHandler.ts
│   ├── validators/      # Request validation schemas
│   ├── app.ts           # Express app configuration
│   └── index.ts         # Server entry point
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   ├── helpers/         # Test utilities
│   └── setup.ts         # Jest setup
├── docs/
│   ├── postman/         # Postman collection
│   └── README.md        # This file
├── .env.example         # Environment template
├── jest.config.js       # Jest configuration
├── tsconfig.json        # TypeScript configuration
└── package.json
```

---

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/yhealth` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `your-secret-key` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `your-refresh-secret` |

### Optional Variables

See `.env.example` for complete list including:
- AWS S3 configuration
- SMTP email settings
- OAuth providers (Google, Apple)
- Payment gateways (Stripe, PayPal)
- Third-party integrations (WHOOP, Fitbit, etc.)

---

## API Reference

### Base URL

```
http://localhost:5000/api
```

### Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "message": "Success message",
  "data": { },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Endpoints Summary

#### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe |

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with credentials |
| POST | `/auth/social` | Social authentication |
| GET | `/auth/me` | Get current user |
| POST | `/auth/consent` | Record user consent |
| POST | `/auth/whatsapp/enroll` | Enroll WhatsApp |
| POST | `/auth/whatsapp/verify` | Verify WhatsApp |
| POST | `/auth/refresh` | Refresh tokens |
| POST | `/auth/logout` | Logout |

#### Assessment
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assessment/goal-categories` | Get goal categories |
| POST | `/assessment/goals` | Create goal |
| GET | `/assessment/goals` | Get all goals |
| GET | `/assessment/goals/:id` | Get goal by ID |
| PATCH | `/assessment/goals/:id` | Update goal |
| POST | `/assessment/quick/start` | Start quick assessment |
| POST | `/assessment/quick/:id/submit` | Submit quick assessment |
| POST | `/assessment/deep/start` | Start deep assessment |
| POST | `/assessment/deep/:id/message` | Send message |
| POST | `/assessment/switch-mode` | Switch assessment mode |

#### Integrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/integrations/available` | Get available integrations |
| GET | `/integrations` | Get user integrations |
| POST | `/integrations/oauth/initiate` | Start OAuth flow |
| GET | `/integrations/sync/status` | Get sync dashboard |
| POST | `/integrations/:provider/sync` | Trigger manual sync |
| DELETE | `/integrations/:provider` | Disconnect integration |

#### Preferences
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/preferences` | Get all preferences |
| PATCH | `/preferences/notifications` | Update notifications |
| PATCH | `/preferences/coaching` | Update coaching |
| GET | `/preferences/coaching/styles` | Get coaching styles |
| PATCH | `/preferences/display` | Update display |

#### Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/plans/generate` | Generate plan preview |
| GET | `/plans` | Get all plans |
| POST | `/plans` | Create plan |
| GET | `/plans/:id` | Get plan by ID |
| POST | `/plans/:id/activate` | Activate plan |
| GET | `/plans/today` | Get today's activities |
| POST | `/plans/:id/activities/:activityId/log` | Log activity |
| POST | `/plans/complete-onboarding` | Complete onboarding |

---

## Authentication

### JWT Authentication

The API uses JWT (JSON Web Tokens) for authentication.

#### Token Types

1. **Access Token**: Short-lived (15 minutes), used for API requests
2. **Refresh Token**: Long-lived (7 days), used to get new access tokens

#### Using Tokens

Include the access token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

Or as a cookie:
```http
Cookie: access_token=<access_token>
```

#### Token Refresh Flow

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

### Role-Based Access Control

Available roles:
- `user` - Standard user
- `admin` - Administrator
- `moderator` - Content moderator
- `doctor` - Healthcare provider
- `patient` - Patient user

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── cache.service.test.ts
│   │   └── sms.service.test.ts
│   ├── middlewares/
│   │   └── auth.middleware.test.ts
│   ├── validators/
│   │   └── auth.validator.test.ts
│   ├── models/
│   │   └── user.model.test.ts
│   └── utils/
│       ├── ApiError.test.ts
│       └── ApiResponse.test.ts
├── integration/
│   ├── auth.integration.test.ts
│   ├── health.integration.test.ts
│   └── assessment.integration.test.ts
├── helpers/
│   ├── testUtils.ts
│   └── mocks.ts
└── setup.ts
```

### Test Configuration

Tests use:
- **Jest** - Test runner
- **Supertest** - HTTP assertions
- **mongodb-memory-server** - In-memory MongoDB for isolation
- **@faker-js/faker** - Test data generation

---

## Architecture

### Design Patterns

1. **Controller-Service Pattern**: Controllers handle HTTP, services handle business logic
2. **Repository Pattern**: Models abstract database operations
3. **Middleware Pattern**: Cross-cutting concerns (auth, validation, logging)
4. **Singleton Pattern**: Services instantiated once (cache, logger)

### Data Flow

```
Request → Router → Middleware → Controller → Service → Model → Database
                                    ↓
Response ← Controller ← Service ←────┘
```

### Error Handling

All errors flow through the centralized error handler:

```typescript
// Throw ApiError anywhere
throw ApiError.notFound('User not found');

// Error middleware catches and formats response
```

### Validation

Request validation using Zod schemas:

```typescript
// Define schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Use in routes
router.post('/register', validate(registerSchema), controller.register);
```

---

## Postman Collection

Import the Postman collection from `docs/postman/YHealth_API_Collection.json` to test all endpoints.

### Setup

1. Import collection into Postman
2. Set `baseUrl` variable to `http://localhost:5000/api`
3. Run "Register" or "Login" to get tokens (auto-saved)
4. All subsequent requests use the saved token

---

## Support

For questions or issues, please:
1. Check existing documentation
2. Review test files for usage examples
3. Open an issue on GitHub

---

*Generated for YHealth Server v1.0.0*
