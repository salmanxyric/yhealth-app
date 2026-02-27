# YHealth API Reference

## Base URL

```
http://localhost:9090/api
```

## Response Format

### Success Response
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
  "timestamp": "2024-12-17T10:30:00.000Z"
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
  "timestamp": "2024-12-17T10:30:00.000Z"
}
```

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

Or as a cookie:
```http
Cookie: access_token=<access_token>
```

---

## Health Check Endpoints

### GET /health
Get server health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-12-17T10:30:00.000Z",
    "uptime": 3600,
    "version": "1.0.0"
  }
}
```

### GET /health/live
Kubernetes liveness probe.

**Response:** `200 OK`

### GET /health/ready
Kubernetes readiness probe (checks database).

**Response:** `200 OK` or `503 Service Unavailable`

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "male"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-05-15",
      "gender": "male",
      "onboardingStatus": "consent_pending"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    },
    "nextStep": "consent"
  }
}
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "onboardingStatus": "completed"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresIn": 900
    }
  }
}
```

### POST /auth/social
Authenticate via social provider (NextAuth integration).

Frontend (NextAuth) handles OAuth flow and sends user data to this endpoint.
Creates user if not exists, verifies if exists.

**Request Body:**
```json
{
  "provider": "google",
  "email": "user@gmail.com",
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "providerId": "google-sub-id",
  "avatar": "https://lh3.googleusercontent.com/..."
}
```

**Response (New User):** `201 Created`
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://...",
      "isEmailVerified": true,
      "onboardingStatus": "consent_pending"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "...",
      "expiresIn": 900
    },
    "isNewUser": true,
    "needsProfileCompletion": true,
    "nextStep": "complete_profile"
  }
}
```

**Response (Existing User):** `200 OK`
```json
{
  "success": true,
  "message": "Signed in successfully",
  "data": {
    "user": { ... },
    "tokens": { ... },
    "isNewUser": false,
    "needsProfileCompletion": false
  }
}
```

### POST /auth/complete-profile
Complete profile for social sign-up users (DOB, Gender). **Protected**

**Request Body:**
```json
{
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `200 OK`

### GET /auth/me
Get current authenticated user. **Protected**

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "profile": { },
      "onboardingStatus": "in_progress",
      "onboardingStep": 2
    }
  }
}
```

### POST /auth/consent
Record user consents. **Protected**

**Request Body:**
```json
{
  "terms": true,
  "privacy": true,
  "marketing": false,
  "whatsapp": true
}
```

**Response:** `200 OK`

### POST /auth/whatsapp/enroll
Start WhatsApp enrollment. **Protected**

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Verification code sent"
}
```

### POST /auth/whatsapp/verify
Verify WhatsApp SMS code. **Protected**

**Request Body:**
```json
{
  "code": "123456"
}
```

**Response:** `200 OK`

### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### POST /auth/logout
Logout user. **Protected**

**Response:** `200 OK`

---

## Assessment Endpoints

### GET /assessment/goal-categories
Get available goal categories.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "weight_management",
        "name": "Weight Management",
        "description": "Goals related to weight loss or gain",
        "icon": "scale"
      }
    ]
  }
}
```

### POST /assessment/goals
Create a new goal. **Protected**

**Request Body:**
```json
{
  "title": "Lose 10 pounds",
  "description": "Lose weight through exercise and diet",
  "category": "weight_management",
  "type": "primary",
  "targetValue": 10,
  "unit": "pounds",
  "targetDate": "2025-06-01",
  "milestones": [
    {
      "title": "Lose first 5 pounds",
      "targetValue": 5,
      "targetDate": "2025-03-01"
    }
  ]
}
```

**Response:** `201 Created`

### GET /assessment/goals
Get user's goals. **Protected**

**Query Parameters:**
- `status` - Filter by status (active, completed, paused)
- `type` - Filter by type (primary, secondary)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "Lose 10 pounds",
        "category": "weight_management",
        "status": "active",
        "progress": 30
      }
    ]
  }
}
```

### GET /assessment/goals/:goalId
Get specific goal. **Protected**

**Response:** `200 OK`

### PATCH /assessment/goals/:goalId
Update a goal. **Protected**

**Request Body:**
```json
{
  "currentValue": 3,
  "status": "active"
}
```

**Response:** `200 OK`

### POST /assessment/goals/:goalId/primary
Set goal as primary. **Protected**

**Response:** `200 OK`

### POST /assessment/quick/start
Start quick assessment. **Protected**

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "507f1f77bcf86cd799439011",
      "type": "quick",
      "status": "in_progress",
      "questions": [
        {
          "id": "activity_level",
          "question": "How would you describe your current activity level?",
          "type": "single_choice",
          "options": ["Sedentary", "Light", "Moderate", "Active", "Very Active"]
        }
      ]
    }
  }
}
```

### POST /assessment/quick/:assessmentId/submit
Submit quick assessment answers. **Protected**

**Request Body:**
```json
{
  "responses": [
    {
      "questionId": "activity_level",
      "answer": "Moderate"
    }
  ]
}
```

**Response:** `200 OK`

### POST /assessment/deep/start
Start deep (AI) assessment. **Protected**

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "assessment": {
      "id": "507f1f77bcf86cd799439011",
      "type": "deep",
      "status": "in_progress",
      "initialMessage": "Hello! I'm here to learn more about your health goals..."
    }
  }
}
```

### POST /assessment/deep/:assessmentId/message
Send message in deep assessment. **Protected**

**Request Body:**
```json
{
  "message": "I want to focus on improving my sleep quality"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "aiResponse": "That's a great goal! Can you tell me more about your current sleep patterns?",
    "extractedTopics": ["sleep"]
  }
}
```

### POST /assessment/deep/:assessmentId/complete
Complete deep assessment. **Protected**

**Response:** `200 OK`

### POST /assessment/switch-mode
Switch assessment mode. **Protected**

**Request Body:**
```json
{
  "assessmentId": "507f1f77bcf86cd799439011",
  "newMode": "deep"
}
```

**Response:** `200 OK`

---

## Integration Endpoints

### GET /integrations/available
Get available integrations.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "provider": "whoop",
        "name": "WHOOP",
        "description": "Connect your WHOOP band",
        "dataTypes": ["sleep", "recovery", "strain"],
        "icon": "whoop-icon"
      }
    ]
  }
}
```

### GET /integrations
Get user's connected integrations. **Protected**

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "provider": "whoop",
        "status": "connected",
        "lastSyncAt": "2024-12-17T10:30:00.000Z",
        "dataTypes": ["sleep", "recovery"]
      }
    ]
  }
}
```

### POST /integrations/oauth/initiate
Start OAuth flow. **Protected**

**Request Body:**
```json
{
  "provider": "whoop"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://api.whoop.com/oauth/authorize?..."
  }
}
```

### POST /integrations/oauth/complete
Complete OAuth flow. **Protected**

**Request Body:**
```json
{
  "provider": "whoop",
  "code": "authorization-code",
  "state": "state-parameter"
}
```

**Response:** `200 OK`

### GET /integrations/sync/status
Get sync dashboard. **Protected**

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "syncStatus": [
      {
        "provider": "whoop",
        "status": "idle",
        "lastSyncAt": "2024-12-17T10:30:00.000Z",
        "recordsSynced": 150,
        "errors": null
      }
    ]
  }
}
```

### POST /integrations/:provider/sync
Trigger manual sync. **Protected**

**Response:** `200 OK`

### DELETE /integrations/:provider
Disconnect integration. **Protected**

**Response:** `200 OK`

### PATCH /integrations/golden-source
Set data source priority. **Protected**

**Request Body:**
```json
{
  "priority": ["whoop", "fitbit", "oura"]
}
```

**Response:** `200 OK`

---

## Preferences Endpoints

### GET /preferences
Get all user preferences. **Protected**

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "preferences": {
      "notifications": {
        "email": { "enabled": true, "frequency": "daily" },
        "push": { "enabled": true },
        "whatsapp": { "enabled": false }
      },
      "coaching": {
        "style": "supportive",
        "intensity": "moderate"
      },
      "display": {
        "theme": "system",
        "language": "en",
        "timezone": "America/New_York",
        "units": "imperial"
      }
    }
  }
}
```

### PATCH /preferences
Update all preferences. **Protected**

**Request Body:**
```json
{
  "notifications": { },
  "coaching": { },
  "display": { }
}
```

**Response:** `200 OK`

### PATCH /preferences/notifications
Update notification settings. **Protected**

**Request Body:**
```json
{
  "email": {
    "enabled": true,
    "frequency": "weekly"
  },
  "push": {
    "enabled": false
  }
}
```

**Response:** `200 OK`

### PATCH /preferences/coaching
Update coaching preferences. **Protected**

**Request Body:**
```json
{
  "style": "direct",
  "intensity": "intensive"
}
```

**Response:** `200 OK`

### GET /preferences/coaching/styles
Get available coaching styles.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "styles": [
      {
        "id": "supportive",
        "name": "Supportive",
        "description": "Encouraging and empathetic approach"
      },
      {
        "id": "direct",
        "name": "Direct",
        "description": "Straightforward, no-nonsense feedback"
      }
    ],
    "intensities": [
      {
        "id": "gentle",
        "name": "Gentle",
        "description": "1-2 check-ins per week"
      }
    ]
  }
}
```

### PATCH /preferences/display
Update display settings. **Protected**

**Request Body:**
```json
{
  "theme": "dark",
  "language": "es",
  "timezone": "Europe/London",
  "units": "metric"
}
```

**Response:** `200 OK`

### PATCH /preferences/privacy
Update privacy settings. **Protected**

**Request Body:**
```json
{
  "dataSharing": false,
  "analytics": true
}
```

**Response:** `200 OK`

### PATCH /preferences/integrations
Update integration preferences. **Protected**

**Request Body:**
```json
{
  "autoSync": true,
  "syncFrequency": "hourly"
}
```

**Response:** `200 OK`

---

## Plan Endpoints

### POST /plans/generate
Generate plan based on goal. **Protected**

**Request Body:**
```json
{
  "goalId": "uuid"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Plan generated successfully",
  "data": {
    "plan": {
      "id": "uuid",
      "name": "Lose 10 kg in 16 weeks Plan",
      "description": "A 16-week plan...",
      "pillar": "fitness",
      "goalCategory": "weight_loss",
      "startDate": "2025-01-01",
      "endDate": "2025-04-30",
      "durationWeeks": 16,
      "status": "active",
      "activities": [...],
      "weeklyFocuses": [...]
    }
  }
}
```

### GET /plans
Get all user plans. **Protected**

**Query Parameters:**
- `status` - Filter by status (draft, active, completed, paused, archived)

**Response:** `200 OK`

### GET /plans/active
Get the active plan. **Protected**

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "uuid",
      "name": "My Health Plan",
      "status": "active",
      ...
    },
    "todayActivities": [...],
    "weekCompletionRate": 75
  }
}
```

### POST /plans
Create a plan. **Protected**

**Request Body:**
```json
{
  "goalId": "uuid",
  "name": "My Health Plan"
}
```

**Response:** `201 Created`

### GET /plans/today
Get today's activities from active plan. **Protected**

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "planId": "uuid",
    "date": "2025-01-15T10:30:00.000Z",
    "dayOfWeek": "wednesday",
    "activities": [
      {
        "id": "act_1",
        "type": "workout",
        "title": "Strength Training",
        "duration": 45,
        "preferredTime": "07:00",
        "status": "pending",
        "log": null
      }
    ],
    "completedCount": 0,
    "totalCount": 3
  }
}
```

### GET /plans/:planId
Get specific plan. **Protected**

**Response:** `200 OK`

### GET /plans/:planId/today
Get today's activities for specific plan. **Protected**

**Response:** `200 OK` (same as GET /plans/today)

### GET /plans/:planId/summary/weekly
Get weekly summary for a plan. **Protected**

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "week": 1,
    "weekStartDate": "2025-01-13",
    "weekEndDate": "2025-01-19",
    "focus": {
      "theme": "Foundation",
      "focus": "Building habits..."
    },
    "stats": {
      "totalActivities": 10,
      "completed": 7,
      "skipped": 1,
      "pending": 2,
      "completionRate": 70
    },
    "activityBreakdown": {
      "workout": { "completed": 3, "total": 3 },
      "meal": { "completed": 5, "total": 7 }
    }
  }
}
```

### GET /plans/:planId/logs
Get activity logs for a plan. **Protected**

**Query Parameters:**
- `startDate` - Filter from date
- `endDate` - Filter to date
- `activityId` - Filter by activity

**Response:** `200 OK`

### PATCH /plans/:planId
Update a plan. **Protected**

**Request Body:**
```json
{
  "status": "paused"
}
```

**Response:** `200 OK`

### POST /plans/:planId/activate
Activate a plan. **Protected**

**Response:** `200 OK`

### POST /plans/:planId/activities/:activityId/log
Log activity completion. **Protected**

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Felt great!",
  "mood": 4,
  "actualValue": 45,
  "duration": 45
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Activity logged successfully",
  "data": {
    "log": {
      "id": "uuid",
      "activity_id": "act_1",
      "status": "completed",
      "completed_at": "2025-01-15T10:30:00.000Z",
      "mood": 4,
      "user_notes": "Felt great!"
    },
    "feedback": "Great job completing \"Strength Training\"! Keep up the momentum!"
  }
}
```

### POST /plans/complete-onboarding
Complete onboarding flow. **Protected**

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "user": {
      "onboardingStatus": "completed"
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limiting

Default limits:
- 100 requests per 15 minutes per IP
- Authenticated users: 200 requests per 15 minutes

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702809600
```

---

*API Reference v1.0*
*Last Updated: December 2024*
