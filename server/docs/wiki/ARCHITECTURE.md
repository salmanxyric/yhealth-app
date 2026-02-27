# YHealth Technical Architecture

## Overview

This document describes the technical architecture of the YHealth server, including design patterns, data flow, and technology decisions.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐    │
│  │   Web   │  │   iOS   │  │ Android │  │ Third-Party API │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘    │
└───────┼────────────┼────────────┼────────────────┼──────────────┘
        │            │            │                │
        └────────────┴────────────┴────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway (Express 5)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ Rate Limiter│  │ Auth Middleware│ │ Request Validation │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Auth Routes  │  │Assessment Rts │  │  Plan Routes  │
│               │  │               │  │               │
│ - Register    │  │ - Goals       │  │ - Generate    │
│ - Login       │  │ - Quick       │  │ - Activate    │
│ - Social      │  │ - Deep        │  │ - Log         │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │  Cache  │  │   SMS   │  │  OAuth  │  │  Email  │           │
│  │ Service │  │ Service │  │ Service │  │ Service │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer (Mongoose)                       │
│  ┌─────────┐  ┌───────────┐  ┌─────────────┐  ┌───────────┐   │
│  │  User   │  │Assessment │  │ Integration │  │Preferences│   │
│  │  Model  │  │   Model   │  │    Model    │  │   Model   │   │
│  └─────────┘  └───────────┘  └─────────────┘  └───────────┘   │
│                      ┌─────────┐                               │
│                      │  Plan   │                               │
│                      │  Model  │                               │
│                      └─────────┘                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   YHealth Database                       │   │
│  │  Collections: users, goals, assessments, integrations,  │   │
│  │               syncLogs, healthDataRecords, preferences, │   │
│  │               plans, activities                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design Patterns

### 1. Controller-Service Pattern

Separates HTTP handling from business logic.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Controller  │────▶│   Service    │────▶│    Model     │
│              │     │              │     │              │
│ - Parse req  │     │ - Biz logic  │     │ - DB ops     │
│ - Validate   │     │ - Transform  │     │ - Schema     │
│ - Response   │     │ - Orchestrate│     │ - Validation │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Example Flow**:
```typescript
// Controller
export const register = asyncHandler(async (req, res) => {
  const userData = req.body;
  const user = await authService.createUser(userData);
  res.status(201).json(ApiResponse.created(user, 'User registered'));
});

// Service
export const createUser = async (data: RegisterInput) => {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  return User.create({ ...data, password: hashedPassword });
};
```

### 2. Middleware Pattern

Cross-cutting concerns handled uniformly.

```
Request ──▶ Rate Limiter ──▶ Auth ──▶ Validate ──▶ Controller
                                                       │
Response ◀── Error Handler ◀── Logger ◀────────────────┘
```

**Middleware Stack**:
```typescript
app.use(helmet());          // Security headers
app.use(cors(corsOptions)); // CORS handling
app.use(express.json());    // Body parsing
app.use(morgan('dev'));     // Request logging
app.use(rateLimiter);       // Rate limiting
app.use('/api', routes);    // Route handling
app.use(errorHandler);      // Error handling
```

### 3. Factory Pattern

For creating API errors and responses.

```typescript
// ApiError Factory
class ApiError extends Error {
  static badRequest(message: string) {
    return new ApiError(400, message);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static notFound(message: string = 'Not found') {
    return new ApiError(404, message);
  }
}

// Usage
throw ApiError.notFound('User not found');
throw ApiError.badRequest('Invalid email format');
```

### 4. Repository Pattern (via Mongoose)

Models abstract database operations.

```typescript
// Model with methods
const userSchema = new Schema({...});

userSchema.methods.comparePassword = async function(password: string) {
  return bcrypt.compare(password, this.password);
};

userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};
```

### 5. Singleton Pattern

Services instantiated once.

```typescript
// Cache service singleton
class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache({ stdTTL: 300 });
  }

  static getInstance() {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
}

export const cacheService = CacheService.getInstance();
```

---

## Data Flow

### Authentication Flow

```
┌────────┐       ┌────────┐       ┌────────┐       ┌────────┐
│ Client │       │  Auth  │       │  User  │       │  JWT   │
│        │       │ Route  │       │ Model  │       │ Utils  │
└───┬────┘       └───┬────┘       └───┬────┘       └───┬────┘
    │                │                │                │
    │  POST /login   │                │                │
    │───────────────▶│                │                │
    │                │                │                │
    │                │  findByEmail   │                │
    │                │───────────────▶│                │
    │                │                │                │
    │                │     user       │                │
    │                │◀───────────────│                │
    │                │                │                │
    │                │           comparePassword       │
    │                │───────────────▶│                │
    │                │                │                │
    │                │     boolean    │                │
    │                │◀───────────────│                │
    │                │                │                │
    │                │                │  signTokens    │
    │                │────────────────────────────────▶│
    │                │                │                │
    │                │                │     tokens     │
    │                │◀───────────────────────────────│
    │                │                │                │
    │   { tokens }   │                │                │
    │◀───────────────│                │                │
    │                │                │                │
```

### API Request Flow

```
┌────────────────────────────────────────────────────────────────┐
│                        Request Flow                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Client Request                                              │
│     POST /api/assessment/goals                                  │
│     Authorization: Bearer <token>                               │
│     Body: { title, category, ... }                             │
│                                                                 │
│  2. Rate Limiter                                                │
│     ✓ Check request count                                       │
│     ✓ Allow or reject (429)                                     │
│                                                                 │
│  3. Auth Middleware                                             │
│     ✓ Extract token                                             │
│     ✓ Verify JWT                                                │
│     ✓ Attach user to request                                   │
│                                                                 │
│  4. Validation Middleware                                       │
│     ✓ Parse body with Zod                                       │
│     ✓ Return errors or continue                                │
│                                                                 │
│  5. Controller                                                  │
│     ✓ Extract validated data                                    │
│     ✓ Call service methods                                      │
│     ✓ Format response                                           │
│                                                                 │
│  6. Service                                                     │
│     ✓ Business logic                                            │
│     ✓ Database operations                                       │
│     ✓ External API calls                                        │
│                                                                 │
│  7. Response                                                    │
│     { success: true, data: {...}, message: "..." }             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────┐
│        User         │
├─────────────────────┤
│ _id: ObjectId (PK)  │──────────────────┐
│ email: String       │                  │
│ password: String    │                  │
│ profile: Object     │                  │
│ role: String        │                  │
│ socialAccounts: []  │                  │
│ consents: Object    │                  │
│ whatsapp: Object    │                  │
│ onboardingStatus    │                  │
└─────────────────────┘                  │
         │                               │
         │ 1:N                           │ 1:N
         ▼                               │
┌─────────────────────┐                  │
│        Goal         │                  │
├─────────────────────┤                  │
│ _id: ObjectId (PK)  │                  │
│ user: ObjectId (FK) │◀─────────────────┤
│ title: String       │                  │
│ category: String    │                  │
│ type: String        │                  │
│ status: String      │                  │
│ milestones: []      │                  │
└─────────────────────┘                  │
         │                               │
         │ N:M                           │
         ▼                               │
┌─────────────────────┐                  │
│        Plan         │                  │
├─────────────────────┤                  │
│ _id: ObjectId (PK)  │                  │
│ user: ObjectId (FK) │◀─────────────────┤
│ goals: [ObjectId]   │◀────────┐        │
│ name: String        │         │        │
│ type: String        │         │        │
│ activities: []      │         │        │
│ progress: Object    │         │        │
└─────────────────────┘         │        │
                                │        │
┌─────────────────────┐         │        │
│     Assessment      │         │        │
├─────────────────────┤         │        │
│ _id: ObjectId (PK)  │         │        │
│ user: ObjectId (FK) │◀────────┼────────┤
│ type: String        │         │        │
│ status: String      │         │        │
│ responses: []       │         │        │
│ aiConversation: []  │         │        │
│ extractedData       │         │        │
└─────────────────────┘         │        │
                                │        │
┌─────────────────────┐         │        │
│    Integration      │         │        │
├─────────────────────┤         │        │
│ _id: ObjectId (PK)  │         │        │
│ user: ObjectId (FK) │◀────────┼────────┤
│ provider: String    │         │        │
│ status: String      │         │        │
│ accessToken: String │         │        │
│ refreshToken: String│         │        │
│ syncStatus: String  │         │        │
└─────────────────────┘         │        │
                                │        │
┌─────────────────────┐         │        │
│    Preferences      │         │        │
├─────────────────────┤         │        │
│ _id: ObjectId (PK)  │         │        │
│ user: ObjectId (FK) │◀────────┴────────┘
│ notifications: Obj  │
│ coaching: Object    │
│ display: Object     │
│ privacy: Object     │
└─────────────────────┘
```

### Indexes

```javascript
// User indexes
{ email: 1 }           // unique
{ 'socialAccounts.providerId': 1 }

// Goal indexes
{ user: 1 }
{ user: 1, status: 1 }
{ user: 1, type: 1 }

// Assessment indexes
{ user: 1 }
{ user: 1, status: 1 }

// Integration indexes
{ user: 1, provider: 1 }  // compound unique

// Plan indexes
{ user: 1 }
{ user: 1, status: 1 }
```

---

## Error Handling

### Error Flow

```
┌────────────────┐
│   Any Error    │
└───────┬────────┘
        │
        ▼
┌────────────────┐     ┌────────────────┐
│ Operational?   │─No─▶│   Log Error    │
│ (ApiError)     │     │  Crash/Report  │
└───────┬────────┘     └────────────────┘
        │Yes
        ▼
┌────────────────┐
│ Error Handler  │
│   Middleware   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│   Format JSON  │
│   Response     │
└───────┬────────┘
        │
        ▼
┌────────────────────────────────────┐
│ {                                  │
│   success: false,                  │
│   message: "Error message",        │
│   errors: [...],                   │
│   stack: "..." (dev only)         │
│ }                                  │
└────────────────────────────────────┘
```

### Error Categories

| Type | Status | Example |
|------|--------|---------|
| Validation | 400 | Invalid email format |
| Authentication | 401 | Invalid token |
| Authorization | 403 | Insufficient permissions |
| Not Found | 404 | User not found |
| Conflict | 409 | Email already exists |
| Rate Limited | 429 | Too many requests |
| Server Error | 500 | Database connection failed |

---

## Security

### Authentication

```
┌─────────────────────────────────────────────────────────────┐
│                    JWT Token Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Login ─────▶ Access Token (15min) + Refresh Token (7d)     │
│                                                              │
│  API Request ─────▶ Access Token in Header                  │
│                     Authorization: Bearer <token>           │
│                                                              │
│  Token Expired ─────▶ Use Refresh Token                     │
│                       POST /auth/refresh                    │
│                                                              │
│  Refresh Expired ─────▶ Re-login required                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Security Measures

| Measure | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with 12 rounds |
| Token Signing | HMAC SHA-256 |
| Rate Limiting | 100 requests per 15 minutes |
| CORS | Configurable allowed origins |
| Helmet | Security headers |
| Input Validation | Zod schemas |
| SQL Injection | N/A (MongoDB) |
| XSS Prevention | Input sanitization |

---

## Caching Strategy

### Current (Development)

```
┌──────────────────────────────────────────────────────────────┐
│                  Node-Cache (In-Memory)                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Cache Key Pattern: {entity}:{identifier}                    │
│                                                               │
│  Examples:                                                    │
│  - user:507f1f77bcf86cd799439011                             │
│  - goals:507f1f77bcf86cd799439011                            │
│  - integration:whoop:507f1f77bcf86cd799439011               │
│                                                               │
│  TTL: 300 seconds (5 minutes) default                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Production (Planned)

```
┌────────────────────────────────────────────────────────────────┐
│                        Redis Cluster                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│  │   Primary   │   │   Replica   │   │   Replica   │          │
│  └─────────────┘   └─────────────┘   └─────────────┘          │
│                                                                 │
│  Use Cases:                                                     │
│  - Session storage                                              │
│  - API response caching                                         │
│  - Rate limiting state                                          │
│  - Real-time pub/sub                                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Validation Layer

### Zod Schema Example

```typescript
// Schema definition
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(val => val.toLowerCase()),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),

  profile: z.object({
    firstName: z.string().min(1, 'First name required'),
    lastName: z.string().min(1, 'Last name required'),
  }),
});

// Type inference
export type RegisterInput = z.infer<typeof registerSchema>;

// Middleware usage
router.post('/register', validate(registerSchema), controller.register);
```

---

## File Structure

```
src/
├── config/
│   └── env.config.ts        # Environment variable parsing
│
├── controllers/
│   ├── auth.controller.ts   # Authentication logic
│   ├── assessment.controller.ts
│   ├── integration.controller.ts
│   ├── preferences.controller.ts
│   ├── plan.controller.ts
│   └── health.controller.ts
│
├── middlewares/
│   ├── auth.middleware.ts   # JWT verification
│   ├── error.middleware.ts  # Error handling
│   ├── validate.middleware.ts # Zod validation
│   └── rateLimiter.middleware.ts
│
├── models/
│   ├── user.model.ts        # User schema
│   ├── assessment.model.ts  # Goals, assessments
│   ├── integration.model.ts # OAuth, sync
│   ├── preferences.model.ts # User preferences
│   └── plan.model.ts        # Plans, activities
│
├── routes/
│   ├── index.ts             # Route aggregator
│   ├── auth.routes.ts
│   ├── assessment.routes.ts
│   ├── integration.routes.ts
│   ├── preferences.routes.ts
│   └── plan.routes.ts
│
├── services/
│   ├── cache.service.ts     # Caching operations
│   ├── email.service.ts     # Email sending
│   ├── sms.service.ts       # SMS verification
│   ├── oauth.service.ts     # OAuth helpers
│   └── logger.service.ts    # Logging
│
├── utils/
│   ├── ApiError.ts          # Error class
│   ├── ApiResponse.ts       # Response formatter
│   └── asyncHandler.ts      # Async wrapper
│
├── validators/
│   ├── auth.validator.ts    # Auth schemas
│   ├── assessment.validator.ts
│   ├── integration.validator.ts
│   └── preferences.validator.ts
│
├── types/
│   └── index.ts             # TypeScript types
│
├── app.ts                   # Express configuration
└── index.ts                 # Server entry point
```

---

## Testing Architecture

```
tests/
├── setup.ts                 # Global setup (MongoDB, env)
│
├── helpers/
│   ├── testUtils.ts         # Data generators
│   └── mocks.ts             # Mock services
│
├── unit/
│   ├── services/            # Service unit tests
│   ├── middlewares/         # Middleware tests
│   ├── validators/          # Schema tests
│   ├── models/              # Model tests
│   └── utils/               # Utility tests
│
└── integration/
    ├── auth.integration.test.ts
    ├── health.integration.test.ts
    └── assessment.integration.test.ts
```

### Test Strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Unit | Jest | Services, Utils, Models |
| Integration | Supertest | API Endpoints |
| E2E | Planned | Full User Flows |

---

*Architecture Document v1.0*
*Last Updated: December 2024*
