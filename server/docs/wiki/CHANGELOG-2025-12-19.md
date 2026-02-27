# Changelog - December 19, 2025

## Overview

Major feature release focusing on authentication enhancements, profile management, and password recovery functionality.

---

## Features Implemented

### 1. NextAuth.js Integration

**Files:** `client/lib/auth.ts`, `client/app/api/auth/[...nextauth]/route.ts`

- Implemented NextAuth.js v5 with JWT strategy
- Added Credentials provider for email/password authentication
- Added Google OAuth provider for social login
- Configured session callbacks for token management
- Added debug logging for development environment

**Key Configuration:**
```typescript
// JWT-based sessions with 24-hour expiry
session: {
  strategy: "jwt",
  maxAge: 24 * 60 * 60, // 24 hours
}
```

### 2. Cookie-Based Token Storage

**Files:** `client/lib/api-client.ts`

- Implemented automatic token persistence to cookies
- Added `initFromCookie()` method for page refresh token recovery
- Cookie expires after 24 hours matching session expiry
- Automatic token initialization on API requests

**Cookie Configuration:**
- Name: `yhealth_access_token`
- Max Age: 24 hours
- Path: `/`
- SameSite: Lax
- Secure: true

### 3. AuthContext Provider

**File:** `client/app/context/AuthContext.tsx`

- Centralized authentication state management
- Automatic user profile fetching on login
- Route protection for authenticated pages
- Token synchronization with API client
- Helper methods: `getInitials()`, `getDisplayName()`, `isOnboardingComplete()`, `hasRole()`

**Protected Routes:**
- `/dashboard`
- `/onboarding`
- `/settings`
- `/profile`

### 4. Profile Pages

**Files:**
- `client/app/(pages)/profile/page.tsx` - View profile
- `client/app/(pages)/profile/edit/page.tsx` - Edit profile
- `client/app/(pages)/profile/[id]/page.tsx` - View other user's profile

**Features:**
- Modern glassmorphism design
- Profile completion indicator
- Avatar upload with preview
- Phone number input with country code selector (`react-phone-number-input`)
- Form validation with Zod
- Animated sections with Framer Motion

### 5. Avatar Upload

**Files:**
- `client/components/common/avatar-uploader.tsx`
- `server/src/controllers/upload.controller.ts`
- `server/src/routes/upload.routes.ts`
- `server/src/services/r2.service.ts`

**Features:**
- Drag and drop file upload
- Image preview before upload
- File type validation (JPEG, PNG, WebP, GIF)
- Size limit: 5MB
- Cloudflare R2 storage integration
- Automatic token authentication

### 6. Password Reset Flow

**Files:**
- `client/app/reset-password/page.tsx` (root URL)
- `client/app/auth/reset-password/page.tsx` (auth URL)
- `client/app/auth/forgot-password/page.tsx`

**Features:**
- Password strength indicator (Weak/Fair/Good/Strong)
- Real-time validation
- Confirmation password matching
- Modern animated UI
- Success/error state handling

**API Endpoint:** `POST /api/auth/reset-password`
```json
{
  "token": "reset-token-from-email",
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

### 7. Authentication Pages

**Files:**
- `client/app/auth/signin/page.tsx`
- `client/app/auth/signup/page.tsx`
- `client/app/auth/verify/page.tsx`
- `client/app/auth/layout.tsx`

**Features:**
- Modern split-screen design
- Google OAuth button
- Form validation
- OTP verification for registration
- Animated transitions

### 8. Email Templates

**Files:**
- `server/src/mails/registrationOTP.ejs` - OTP verification email
- `server/src/mails/welcome.ejs` - Welcome email (updated design)

---

## Bug Fixes

### 1. React Compiler Error Fix
**Issue:** `setMounted(true)` in useEffect causing React Compiler strict mode error
**Solution:** Replaced with `useSyncExternalStore` pattern for hydration-safe mounting

### 2. 401 Unauthorized on Avatar Upload
**Issue:** Token not being sent with upload requests
**Root Cause:** Tokens stored in NextAuth session, not accessible to API client
**Solution:** Implemented cookie-based token storage with automatic initialization

### 3. Reset Password Validation Error
**Issue:** Backend expecting `confirmPassword` field
**Solution:** Updated `ResetPasswordData` interface and API calls to include `confirmPassword`

---

## Technical Details

### Session Flow
```
1. User logs in via credentials/Google
2. NextAuth authorize() validates with backend
3. JWT callback stores accessToken in session
4. AuthContext sets token on API client
5. Token persisted to cookie for page refreshes
6. API requests auto-include Authorization header
```

### Token Management
```typescript
// Setting token (also persists to cookie)
api.setAccessToken(token);

// Getting token (auto-loads from cookie if needed)
const token = api.getToken();

// Check if token exists
api.hasToken();
```

### File Structure
```
client/
├── app/
│   ├── (pages)/
│   │   └── profile/
│   │       ├── page.tsx          # Profile view
│   │       ├── edit/page.tsx     # Edit profile
│   │       └── [id]/page.tsx     # View other profiles
│   ├── api/auth/[...nextauth]/   # NextAuth API routes
│   ├── auth/                     # Auth pages (signin, signup, etc.)
│   ├── context/AuthContext.tsx   # Auth state management
│   └── reset-password/page.tsx   # Root-level reset password
├── components/
│   ├── common/avatar-uploader.tsx
│   └── providers/
│       ├── index.tsx
│       └── session-provider.tsx
├── hooks/use-auth.ts             # Auth hook for actions
├── lib/
│   ├── api-client.ts             # API client with token management
│   └── auth.ts                   # NextAuth configuration
└── types/next-auth.d.ts          # Type extensions
```

---

## Dependencies Added

### Client
```json
{
  "next-auth": "^5.0.0-beta.25",
  "react-phone-number-input": "^3.4.9"
}
```

### Server
```json
{
  "@aws-sdk/client-s3": "^3.x.x",
  "multer": "^1.4.5-lts.1"
}
```

---

## Environment Variables Required

### Client (.env.local)
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_API_URL=http://localhost:9090/api
```

### Server (.env)
```env
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=yhealth-uploads
R2_PUBLIC_URL=https://your-r2-public-url
```

---

## API Endpoints Updated/Added

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/verify-registration` | OTP verification |
| POST | `/api/auth/resend-registration-otp` | Resend OTP |
| POST | `/api/auth/social` | Google OAuth |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/profile` | Update profile |
| POST | `/api/upload/avatar` | Upload avatar image |

---

## Testing Checklist

- [x] Email/password registration
- [x] OTP verification
- [x] Email/password login
- [x] Google OAuth login
- [x] Password reset flow
- [x] Profile view/edit
- [x] Avatar upload
- [x] Token persistence across page refresh
- [x] Route protection
- [x] Logout functionality

---

## Known Issues

None currently reported.

---

## Next Steps

1. Implement refresh token rotation
2. Add "Remember me" functionality
3. Implement account deletion
4. Add two-factor authentication (2FA)
5. Complete onboarding flow integration
