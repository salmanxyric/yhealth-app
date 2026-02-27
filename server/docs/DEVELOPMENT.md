# YHealth Server - Development Guide

## What Was Built Today

This document summarizes the Epic 01: Onboarding & Assessment implementation completed for the YHealth server.

---

## Features Implemented

### F1.1: Account Creation
- **User Registration** with email/password
- **Social Authentication** (Google, Apple Sign-In)
- **Consent Management** (Terms, Privacy, Marketing, WhatsApp)
- **WhatsApp Enrollment** with SMS verification

### F1.2: Flexible Assessment
- **Quick Assessment** - Structured questionnaire flow
- **Deep Assessment** - Conversational AI-guided assessment
- **Mode Switching** - Seamless transition between assessment types
- **Progress Tracking** - Resume incomplete assessments

### F1.3: Goal Setting & Refinement
- **Goal Categories** - 10 predefined categories + custom
- **SMART Goals** - Structured goal format with milestones
- **AI Suggestions** - Goal recommendations based on assessment
- **Safety Guardrails** - Medical consultation warnings

### F1.4: Integration Setup
- **OAuth Integration** - WHOOP, Fitbit, Garmin, Oura, Strava
- **Data Sync** - Initial and incremental sync
- **Golden Source** - Configurable data priority hierarchy
- **Sync Dashboard** - Status monitoring and manual sync

### F1.5: Preference Configuration
- **Notification Settings** - Email, push, WhatsApp preferences
- **Coaching Style** - 4 styles (Supportive, Direct, Analytical, Motivational)
- **Coaching Intensity** - 3 levels (Gentle, Moderate, Intensive)
- **Display Settings** - Theme, language, timezone, units

### F1.6: Personalized Plan Generation
- **Plan Preview** - Generated from goals and assessment
- **Activity Scheduling** - Weekly activities with time slots
- **Progress Tracking** - Activity completion logging
- **Onboarding Completion** - Full flow finalization

---

## Files Created/Modified

### Models (`src/models/`)
| File | Description |
|------|-------------|
| `user.model.ts` | User model with social auth, consents, WhatsApp |
| `assessment.model.ts` | Goals, questions, and assessment responses |
| `integration.model.ts` | OAuth tokens, sync logs, health data records |
| `preferences.model.ts` | User preferences (notifications, coaching, display) |
| `plan.model.ts` | Plans, activities, weekly focuses |

### Controllers (`src/controllers/`)
| File | Description |
|------|-------------|
| `auth.controller.ts` | Registration, login, social auth, consent |
| `assessment.controller.ts` | Goals, quick/deep assessment flows |
| `integration.controller.ts` | OAuth, sync management |
| `preferences.controller.ts` | Preference CRUD operations |
| `plan.controller.ts` | Plan generation, activation, activity logging |

### Routes (`src/routes/`)
| File | Description |
|------|-------------|
| `auth.routes.ts` | Authentication endpoints |
| `assessment.routes.ts` | Assessment and goal endpoints |
| `integration.routes.ts` | Integration management endpoints |
| `preferences.routes.ts` | Preferences endpoints |
| `plan.routes.ts` | Plan management endpoints |

### Validators (`src/validators/`)
| File | Description |
|------|-------------|
| `auth.validator.ts` | Registration, login, consent schemas |
| `assessment.validator.ts` | Goal and assessment schemas |
| `integration.validator.ts` | OAuth and sync schemas |
| `preferences.validator.ts` | Preference update schemas |

### Services (`src/services/`)
| File | Description |
|------|-------------|
| `sms.service.ts` | SMS verification code handling |
| `oauth.service.ts` | Google/Apple token verification |

### Tests (`tests/`)
| File | Description |
|------|-------------|
| `setup.ts` | Jest global setup with in-memory MongoDB |
| `helpers/testUtils.ts` | Test data generators |
| `helpers/mocks.ts` | Mock request/response helpers |
| `unit/services/*.test.ts` | Service unit tests |
| `unit/middlewares/*.test.ts` | Middleware unit tests |
| `unit/validators/*.test.ts` | Validator unit tests |
| `unit/models/*.test.ts` | Model unit tests |
| `unit/utils/*.test.ts` | Utility unit tests |
| `integration/*.test.ts` | API integration tests |

### Documentation (`docs/`)
| File | Description |
|------|-------------|
| `README.md` | Complete API documentation |
| `DEVELOPMENT.md` | This development guide |
| `postman/YHealth_API_Collection.json` | Postman collection |

### Configuration
| File | Description |
|------|-------------|
| `.env.example` | Environment variable template |
| `jest.config.js` | Jest test configuration |
| `package.json` | Updated with test scripts |

---

## API Endpoints Created

### Authentication (8 endpoints)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/social
GET    /api/auth/me
POST   /api/auth/consent
POST   /api/auth/whatsapp/enroll
POST   /api/auth/whatsapp/verify
POST   /api/auth/refresh
POST   /api/auth/logout
```

### Assessment (12 endpoints)
```
GET    /api/assessment/goal-categories
POST   /api/assessment/goals
GET    /api/assessment/goals
GET    /api/assessment/goals/:goalId
PATCH  /api/assessment/goals/:goalId
POST   /api/assessment/goals/:goalId/primary
POST   /api/assessment/quick/start
POST   /api/assessment/quick/:assessmentId/submit
POST   /api/assessment/deep/start
POST   /api/assessment/deep/:assessmentId/message
POST   /api/assessment/deep/:assessmentId/complete
POST   /api/assessment/switch-mode
```

### Integrations (8 endpoints)
```
GET    /api/integrations/available
GET    /api/integrations
POST   /api/integrations/oauth/initiate
POST   /api/integrations/oauth/complete
GET    /api/integrations/sync/status
POST   /api/integrations/:provider/sync
DELETE /api/integrations/:provider
PATCH  /api/integrations/golden-source
```

### Preferences (8 endpoints)
```
GET    /api/preferences
PATCH  /api/preferences
PATCH  /api/preferences/notifications
PATCH  /api/preferences/coaching
GET    /api/preferences/coaching/styles
PATCH  /api/preferences/display
PATCH  /api/preferences/privacy
PATCH  /api/preferences/integrations
```

### Plans (8 endpoints)
```
POST   /api/plans/generate
GET    /api/plans
POST   /api/plans
GET    /api/plans/today
GET    /api/plans/:planId
POST   /api/plans/:planId/activate
PATCH  /api/plans/:planId/activities/:activityId
POST   /api/plans/:planId/activities/:activityId/log
POST   /api/plans/complete-onboarding
```

---

## How to Test

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage
```

### Manual Testing with Postman

1. Import `docs/postman/YHealth_API_Collection.json`
2. Set environment variable `baseUrl` to `http://localhost:5000/api`
3. Run requests in order:
   - Register → Login → Get Me
   - Create Goal → Start Assessment → Submit
   - Generate Plan → Create Plan → Activate

---

## Environment Variables Required

### Minimum Required
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yhealth
JWT_SECRET=<32+ character secret>
JWT_REFRESH_SECRET=<32+ character secret>
```

### For Full Functionality
See `.env.example` for complete list including:
- OAuth providers
- Email/SMS services
- Third-party integrations
- Payment gateways

---

## Architecture Decisions

### TypeScript Strict Mode
- `strictNullChecks`: true
- `noImplicitAny`: true
- `noUnusedLocals`: true
- All code is fully typed

### Database Design
- MongoDB with Mongoose ODM
- Document references for relationships
- Indexes on frequently queried fields
- Soft deletes where appropriate

### Authentication
- JWT with access/refresh token pattern
- Secure cookie support
- Role-based access control
- Social OAuth support

### Validation
- Zod schemas for request validation
- Type inference from schemas
- Custom error messages
- Nested object validation

### Error Handling
- Centralized error handler
- ApiError class with factory methods
- Operational vs programming errors
- Detailed error logging

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- In-memory MongoDB for test isolation
- Factory functions for test data

---

## Next Steps

### Recommended Enhancements
1. Add OpenAI integration for deep assessment AI
2. Implement real SMS service (Twilio)
3. Add actual OAuth flows for integrations
4. Implement data sync workers
5. Add WebSocket for real-time updates

### Production Considerations
1. Set up Redis for session/cache
2. Configure proper CORS origins
3. Enable HTTPS/TLS
4. Set up monitoring (Prometheus, Grafana)
5. Configure log aggregation
6. Set up CI/CD pipeline

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Ensure MongoDB is running
mongod --dbpath /data/db
```

**Tests Failing**
```bash
# Clear Jest cache
npx jest --clearCache

# Run with verbose output
npm test -- --verbose
```

**TypeScript Errors**
```bash
# Check types without emitting
npm run typecheck
```

---

*Development completed: December 2024*
