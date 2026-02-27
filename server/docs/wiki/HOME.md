# Xyric Wiki - YHealth Project

## Welcome to YHealth

YHealth is a comprehensive health and wellness platform designed to help users track their health metrics, set and achieve wellness goals, and receive personalized coaching through AI-powered assessments.

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Project Overview](#project-overview) | What YHealth is and its mission |
| [Current Status](#current-status) | Where we stand today |
| [Completed Work](#completed-work) | What has been built |
| [Roadmap](#roadmap) | What's planned next |
| [Quick Links](#quick-links) | Important resources |

---

## Project Overview

### Mission
To provide a holistic health management platform that combines:
- **Personalized Assessments** - AI-guided health evaluations
- **Goal Setting** - SMART goal framework with tracking
- **Wearable Integration** - Sync data from popular fitness devices
- **Coaching** - Configurable coaching styles and intensities
- **Plan Generation** - Personalized activity plans

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js 20+, Express 5, TypeScript |
| **Database** | MongoDB 6+ with Mongoose ODM |
| **Authentication** | JWT (Access + Refresh tokens) |
| **Validation** | Zod schemas |
| **Testing** | Jest, Supertest, mongodb-memory-server |
| **API Style** | RESTful with consistent response format |

---

## Current Status

### Overall Progress

```
Epic 01: Onboarding & Assessment  [====================] 100% COMPLETE
Epic 02: Daily Engagement         [                    ]   0% NOT STARTED
Epic 03: Progress & Insights      [                    ]   0% NOT STARTED
Epic 04: Premium Features         [                    ]   0% NOT STARTED
```

### Server Status

| Component | Status | Notes |
|-----------|--------|-------|
| Models | ✅ Complete | 5 models (User, Assessment, Integration, Preferences, Plan) |
| Controllers | ✅ Complete | 5 controllers with full CRUD operations |
| Routes | ✅ Complete | 44 API endpoints |
| Validators | ✅ Complete | Zod schemas for all inputs |
| Services | ✅ Complete | Cache, SMS, OAuth, Email, Logger |
| Middlewares | ✅ Complete | Auth, Error, Validation, Rate Limiting |
| Unit Tests | ✅ Complete | Services, Utils, Models, Validators |
| Integration Tests | ✅ Complete | Auth, Health, Assessment APIs |
| Documentation | ✅ Complete | API docs, Postman, Dev guide |

### Build Status

```bash
# TypeScript compilation: PASSING
npm run build  ✅

# Type checking: PASSING
npm run typecheck  ✅

# Tests: CONFIGURED
npm test  ✅ (requires MongoDB)
```

---

## Completed Work

### Epic 01: Onboarding & Assessment (100%)

| Feature | Status | Description |
|---------|--------|-------------|
| F1.1 Account Creation | ✅ | Email/password, social auth, consent management |
| F1.2 Flexible Assessment | ✅ | Quick & deep assessment modes with AI |
| F1.3 Goal Setting | ✅ | SMART goals with milestones and categories |
| F1.4 Integration Setup | ✅ | OAuth for WHOOP, Fitbit, Garmin, Oura, Strava |
| F1.5 Preferences | ✅ | Notifications, coaching style, display settings |
| F1.6 Plan Generation | ✅ | Personalized activity plans with scheduling |

### API Endpoints (44 Total)

- **Authentication**: 9 endpoints
- **Assessment**: 12 endpoints
- **Integrations**: 8 endpoints
- **Preferences**: 8 endpoints
- **Plans**: 9 endpoints
- **Health**: 3 endpoints

See [API Reference](./API-REFERENCE.md) for complete documentation.

---

## Roadmap

### Upcoming Epics

| Epic | Name | Priority | Estimated Scope |
|------|------|----------|-----------------|
| 02 | Daily Engagement | High | Check-ins, logging, streaks, gamification |
| 03 | Progress & Insights | High | Analytics, reports, trends, visualizations |
| 04 | Premium Features | Medium | Subscriptions, advanced coaching, exports |
| 05 | Social Features | Low | Communities, challenges, sharing |

### Technical Debt

| Item | Priority | Description |
|------|----------|-------------|
| Real SMS Integration | High | Replace mock with Twilio |
| OpenAI Integration | High | Implement deep assessment AI |
| Redis Caching | Medium | Replace node-cache with Redis |
| WebSocket | Medium | Real-time notifications |
| CI/CD Pipeline | Medium | Automated testing and deployment |

See [Roadmap](./ROADMAP.md) for detailed planning.

---

## Quick Links

### Documentation
- [API Reference](./API-REFERENCE.md)
- [Architecture](./ARCHITECTURE.md)
- [Epic 01 Details](./EPIC-01-ONBOARDING.md)
- [Roadmap](./ROADMAP.md)
- [Development Guide](../DEVELOPMENT.md)
- [README](../README.md)

### External Resources
- [Postman Collection](../postman/YHealth_API_Collection.json)
- [Environment Template](../../.env.example)

### Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Compile TypeScript
npm run typecheck        # Check types

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # With coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
```

---

## Team Notes

### Development Standards
- TypeScript strict mode enabled
- Zod for runtime validation
- Centralized error handling with ApiError
- Consistent API response format
- Test-driven development encouraged

### Git Workflow
- Feature branches from `main`
- PR reviews required
- Tests must pass before merge

---

*Last Updated: December 2024*
*Version: 1.0.0*
