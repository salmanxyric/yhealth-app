# Epic 01: Onboarding & Assessment

## Overview

Epic 01 covers the complete user onboarding journey from account creation through plan generation. This epic establishes the foundation for user engagement with the YHealth platform.

---

## Status: COMPLETE ✅

| Metric | Value |
|--------|-------|
| Features | 6/6 Complete |
| Endpoints | 44 Implemented |
| Models | 5 Created |
| Test Coverage | Unit + Integration |

---

## Features

### F1.1: Account Creation ✅

**Purpose**: Allow users to create accounts and manage consents

#### Capabilities
- Email/password registration with strong validation
- Social authentication (Google, Apple Sign-In)
- Consent management (Terms, Privacy, Marketing, WhatsApp)
- WhatsApp enrollment with SMS verification

#### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email/password |
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/social` | Social OAuth login |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/consent` | Record user consents |
| POST | `/api/auth/whatsapp/enroll` | Start WhatsApp enrollment |
| POST | `/api/auth/whatsapp/verify` | Verify SMS code |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |

#### Data Model: User
```typescript
{
  email: string;
  password: string; // hashed with bcrypt
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    height?: { value: number; unit: 'cm' | 'in' };
    weight?: { value: number; unit: 'kg' | 'lb' };
    avatar?: string;
  };
  role: 'user' | 'admin' | 'moderator' | 'doctor' | 'patient';
  socialAccounts: {
    provider: 'google' | 'apple';
    providerId: string;
    email: string;
  }[];
  consents: {
    terms: { accepted: boolean; acceptedAt?: Date; version: string };
    privacy: { accepted: boolean; acceptedAt?: Date; version: string };
    marketing: { accepted: boolean; acceptedAt?: Date };
    whatsapp: { accepted: boolean; acceptedAt?: Date };
  };
  whatsapp: {
    phoneNumber?: string;
    verified: boolean;
    verificationCode?: string;
    verificationExpires?: Date;
  };
  onboardingStatus: 'not_started' | 'in_progress' | 'completed';
  onboardingStep: number;
}
```

---

### F1.2: Flexible Assessment ✅

**Purpose**: Gather health information through structured or conversational methods

#### Capabilities
- **Quick Assessment**: Structured questionnaire with predefined questions
- **Deep Assessment**: AI-guided conversational assessment
- **Mode Switching**: Seamlessly transition between modes
- **Progress Tracking**: Resume incomplete assessments

#### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assessment/quick/start` | Start quick assessment |
| POST | `/api/assessment/quick/:id/submit` | Submit quick assessment |
| POST | `/api/assessment/deep/start` | Start deep assessment |
| POST | `/api/assessment/deep/:id/message` | Send AI message |
| POST | `/api/assessment/deep/:id/complete` | Complete deep assessment |
| POST | `/api/assessment/switch-mode` | Switch assessment mode |

#### Assessment Types

**Quick Assessment Questions**:
1. How would you describe your current activity level?
2. What best describes your diet?
3. How many hours of sleep do you typically get?
4. How would you rate your overall stress level?
5. What health conditions do you currently manage?
6. What is your primary fitness goal?
7. How much time can you dedicate to exercise weekly?
8. Do you have any dietary restrictions?
9. What motivates you to improve your health?
10. How would you rate your current health?

**Deep Assessment**:
- Uses OpenAI (when configured) for conversational AI
- Adapts questions based on responses
- Extracts structured health data from conversation

---

### F1.3: Goal Setting & Refinement ✅

**Purpose**: Help users set and track meaningful health goals

#### Capabilities
- **Goal Categories**: 10 predefined + custom categories
- **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound
- **Milestones**: Break goals into trackable milestones
- **AI Suggestions**: Recommendations based on assessment
- **Safety Guardrails**: Medical consultation warnings

#### Goal Categories
1. Weight Management
2. Fitness & Exercise
3. Nutrition & Diet
4. Sleep Quality
5. Stress Management
6. Mental Health
7. Energy & Vitality
8. Disease Prevention
9. Recovery & Rehabilitation
10. Custom

#### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessment/goal-categories` | Get all categories |
| POST | `/api/assessment/goals` | Create a goal |
| GET | `/api/assessment/goals` | Get user's goals |
| GET | `/api/assessment/goals/:id` | Get goal by ID |
| PATCH | `/api/assessment/goals/:id` | Update a goal |
| POST | `/api/assessment/goals/:id/primary` | Set primary goal |

#### Data Model: Goal
```typescript
{
  user: ObjectId;
  title: string;
  description?: string;
  category: GoalCategory;
  type: 'primary' | 'secondary';
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  startDate: Date;
  targetDate?: Date;
  milestones: {
    title: string;
    targetValue?: number;
    targetDate?: Date;
    completed: boolean;
    completedAt?: Date;
  }[];
  aiSuggested: boolean;
  requiresMedicalConsultation: boolean;
}
```

---

### F1.4: Integration Setup ✅

**Purpose**: Connect wearables and fitness apps for data sync

#### Supported Integrations
| Provider | Data Types | Status |
|----------|-----------|--------|
| WHOOP | Sleep, Recovery, Strain | OAuth Ready |
| Fitbit | Activity, Sleep, Heart Rate | OAuth Ready |
| Garmin | Activity, Sleep, Stress | OAuth Ready |
| Oura | Sleep, Readiness, Activity | OAuth Ready |
| Strava | Activities, Routes | OAuth Ready |
| MyFitnessPal | Nutrition, Calories | Planned |

#### Capabilities
- **OAuth Flow**: Secure token exchange
- **Initial Sync**: Historical data import
- **Incremental Sync**: Daily updates
- **Golden Source**: Priority hierarchy for conflicting data
- **Sync Dashboard**: Status monitoring

#### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/available` | List available integrations |
| GET | `/api/integrations` | Get user integrations |
| POST | `/api/integrations/oauth/initiate` | Start OAuth flow |
| POST | `/api/integrations/oauth/complete` | Complete OAuth |
| GET | `/api/integrations/sync/status` | Get sync dashboard |
| POST | `/api/integrations/:provider/sync` | Trigger manual sync |
| DELETE | `/api/integrations/:provider` | Disconnect integration |
| PATCH | `/api/integrations/golden-source` | Set data priority |

#### Data Model: Integration
```typescript
{
  user: ObjectId;
  provider: 'whoop' | 'fitbit' | 'garmin' | 'oura' | 'strava' | 'myfitnesspal';
  status: 'connected' | 'disconnected' | 'expired' | 'error';
  accessToken: string; // encrypted
  refreshToken?: string; // encrypted
  tokenExpiresAt?: Date;
  scopes: string[];
  lastSyncAt?: Date;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError?: string;
  dataTypes: string[];
  goldenSourcePriority: number;
}
```

---

### F1.5: Preference Configuration ✅

**Purpose**: Personalize user experience and coaching

#### Preference Categories

**Notification Settings**:
- Email notifications (on/off, frequency)
- Push notifications (on/off)
- WhatsApp notifications (on/off)
- Daily summary preference
- Quiet hours configuration

**Coaching Style**:
| Style | Description |
|-------|-------------|
| Supportive | Encouraging and empathetic approach |
| Direct | Straightforward, no-nonsense feedback |
| Analytical | Data-driven insights and analysis |
| Motivational | High-energy, inspirational coaching |

**Coaching Intensity**:
| Level | Check-ins | Accountability |
|-------|-----------|----------------|
| Gentle | 1-2/week | Low |
| Moderate | 3-4/week | Medium |
| Intensive | Daily+ | High |

**Display Settings**:
- Theme: Light/Dark/System
- Language selection
- Timezone configuration
- Unit system (Metric/Imperial)

#### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/preferences` | Get all preferences |
| PATCH | `/api/preferences` | Update all preferences |
| PATCH | `/api/preferences/notifications` | Update notifications |
| PATCH | `/api/preferences/coaching` | Update coaching |
| GET | `/api/preferences/coaching/styles` | Get coaching styles |
| PATCH | `/api/preferences/display` | Update display |
| PATCH | `/api/preferences/privacy` | Update privacy |
| PATCH | `/api/preferences/integrations` | Update integrations |

---

### F1.6: Personalized Plan Generation ✅

**Purpose**: Create actionable health plans based on assessment

#### Capabilities
- **Plan Preview**: Generated from goals and assessment data
- **Activity Scheduling**: Weekly activities with time slots
- **Progress Tracking**: Completion logging and streaks
- **Plan Activation**: Convert preview to active plan
- **Onboarding Completion**: Finalize full onboarding flow

#### Activity Types
- Exercise sessions
- Meditation/mindfulness
- Nutrition tasks
- Sleep hygiene routines
- Check-ins and logging

#### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plans/generate` | Generate plan preview |
| GET | `/api/plans` | Get all plans |
| POST | `/api/plans` | Create plan |
| GET | `/api/plans/:id` | Get plan by ID |
| POST | `/api/plans/:id/activate` | Activate plan |
| GET | `/api/plans/today` | Get today's activities |
| PATCH | `/api/plans/:id/activities/:activityId` | Update activity |
| POST | `/api/plans/:id/activities/:activityId/log` | Log completion |
| POST | `/api/plans/complete-onboarding` | Complete onboarding |

#### Data Model: Plan
```typescript
{
  user: ObjectId;
  name: string;
  description?: string;
  type: 'preview' | 'active' | 'completed' | 'archived';
  status: 'draft' | 'active' | 'paused' | 'completed';
  goals: ObjectId[]; // linked goals
  startDate: Date;
  endDate?: Date;
  weeklyFocus: {
    week: number;
    theme: string;
    description: string;
    targetMetrics: Map<string, number>;
  }[];
  activities: {
    id: string;
    name: string;
    description?: string;
    type: 'exercise' | 'nutrition' | 'sleep' | 'mindfulness' | 'check_in' | 'custom';
    scheduledDays: number[]; // 0-6 for Sun-Sat
    scheduledTime?: string; // HH:MM format
    duration?: number; // minutes
    completed: boolean;
    completedAt?: Date;
    notes?: string;
  }[];
  progress: {
    completedActivities: number;
    totalActivities: number;
    streakDays: number;
    lastActivityAt?: Date;
  };
}
```

---

## Files Created

### Models (`src/models/`)
| File | Purpose |
|------|---------|
| `user.model.ts` | User accounts, auth, consents |
| `assessment.model.ts` | Goals, assessments, responses |
| `integration.model.ts` | OAuth tokens, sync logs |
| `preferences.model.ts` | User preferences |
| `plan.model.ts` | Plans and activities |

### Controllers (`src/controllers/`)
| File | Purpose |
|------|---------|
| `auth.controller.ts` | Authentication logic |
| `assessment.controller.ts` | Assessment and goals |
| `integration.controller.ts` | OAuth and sync |
| `preferences.controller.ts` | Preference management |
| `plan.controller.ts` | Plan generation |

### Routes (`src/routes/`)
| File | Endpoints |
|------|-----------|
| `auth.routes.ts` | 9 auth endpoints |
| `assessment.routes.ts` | 12 assessment endpoints |
| `integration.routes.ts` | 8 integration endpoints |
| `preferences.routes.ts` | 8 preference endpoints |
| `plan.routes.ts` | 9 plan endpoints |

### Validators (`src/validators/`)
| File | Schemas |
|------|---------|
| `auth.validator.ts` | Register, login, consent |
| `assessment.validator.ts` | Goals, assessment |
| `integration.validator.ts` | OAuth, sync |
| `preferences.validator.ts` | All preferences |

### Services (`src/services/`)
| File | Purpose |
|------|---------|
| `sms.service.ts` | SMS verification (mock) |
| `oauth.service.ts` | Google/Apple verification |
| `cache.service.ts` | In-memory caching |
| `email.service.ts` | Email sending |
| `logger.service.ts` | Application logging |

---

## Testing

### Unit Tests
- `tests/unit/services/cache.service.test.ts`
- `tests/unit/services/sms.service.test.ts`
- `tests/unit/utils/ApiError.test.ts`
- `tests/unit/utils/ApiResponse.test.ts`
- `tests/unit/middlewares/auth.middleware.test.ts`
- `tests/unit/validators/auth.validator.test.ts`
- `tests/unit/models/user.model.test.ts`

### Integration Tests
- `tests/integration/auth.integration.test.ts`
- `tests/integration/health.integration.test.ts`
- `tests/integration/assessment.integration.test.ts`

---

## Next Steps for Epic 01

### Production Ready Tasks
1. Implement real SMS service (Twilio)
2. Configure OpenAI for deep assessment
3. Implement actual OAuth flows with providers
4. Add comprehensive error logging
5. Set up monitoring and alerting

### Enhancement Opportunities
1. Add email verification flow
2. Implement password reset
3. Add two-factor authentication
4. Create admin dashboard for user management
5. Add bulk import for historical data

---

*Epic 01 Completed: December 2024*
