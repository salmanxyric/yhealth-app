# XYRIC – Deployment Request Form (Completed)

**Submitted By:** Salman Sadiq  
**Date:** 11 February 2026

---

## 1. Project Overview

| Field | Value |
|-------|-------|
| **Project Name** | yHealth Platform |
| **One-Line Description** | AI Life Coach that unifies Fitness, Nutrition, and Wellbeing data to deliver conversational coaching via Voice, WhatsApp, and Mobile App. |
| **Problem Statement** | Health data is fragmented across fitness trackers, nutrition apps, and wellness tools. Users can't discover cross-domain insights. yHealth solves this by integrating all three pillars and delivering personalized AI coaching for health-conscious consumers and early adopters. |
| **Target Users** | Health-conscious consumers, fitness enthusiasts, internal team for beta testing, early adopters of AI coaching. |
| **Success Metrics** | User signups, multi-pillar adoption (2+ pillars in 7 days), Voice engagement, feature usage, user feedback scores. |

---

## 2. Technical Summary

### 2.1 Architecture Diagram

See **Complete System Design** (Section 11) for the full architecture diagram and component breakdown.

**Link or attachment reference:** `yhealth-app/docs/voice_call_system_design.md`, `Xyric_Deployment_Request_Form_COMPLETED.md` (this document)

### 2.2 Tech Stack

| Component | Technology & Version |
|-----------|----------------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Framer Motion 12 |
| **Backend** | Node.js 20+, Express 5, TypeScript 5 | Ejs |
| **Database** | PostgreSQL 16, pgvector for embeddings |
| **Hosting** | Railway (API), Vercel optional (client), or monolithic deploy |
| **Third-Party APIs** | OpenAI, Anthropic (LangChain), WHOOP API, Stripe, SendGrid, AWS S3, Socket.io |

---

## 3. Security Essentials

| Requirement | Status | Notes |
|-------------|--------|-------|
| Authentication implemented (JWT, OAuth) | ✓ Yes | JWT-based auth, WHOOP OAuth, role-based access |
| No secrets/API keys in source code | ✓ Verified | .env used, .gitignore for secrets |
| Environment variables configured properly | ✓ Yes | DB_*, JWT_SECRET, OPENAI_API_KEY, etc. |
| HTTPS enabled | ✓ Yes | Required for production |
| Input validation on all user inputs | ✓ Yes | Zod validation middleware |
| Basic rate limiting (if public API) | ✓ Yes | express-rate-limit on endpoints |

---

## 4. Data & Database

**What data does this application store?**  
User profiles, assessments, goals, workout plans, diet plans, meal logs, health data records (WHOOP recovery/sleep/strain), activity logs, voice call history, chat messages, wellbeing (stress, mood, journal, habits), activity status history, notifications, AI coach sessions.

**Any sensitive/personal data?**  
Yes: emails, hashed passwords, health metrics, OAuth tokens. Protected via JWT, bcrypt, env-based secrets, and RBAC.

**Database backup configured?**  
☐ Yes, automated  
☑ Manual process documented  
☐ Not yet (explain below)

---

## 5. Deployment Details

| Field | Value |
|-------|-------|
| **Target Environment** | ☐ Staging ☑ Production ☐ Beta/Preview |
| **Deployment URL** | e.g., yhealth.xyric.ai, app.yhealth.io |
| **CI/CD Setup** | ☐ GitHub Actions ☑ Railway ☐ Manual ☐ Other |
| **Rollback Plan** | Revert to previous Railway deployment; database migrations are additive where possible. |

---

## 6. Testing Status

| Test Type | Status | Coverage/Notes |
|-----------|--------|---------------|
| Core features manually tested | ☑ Done | Auth, dashboard, WHOOP, voice, chat, wellbeing |
| Unit tests exist for critical paths | ☑ Partial | Jest on server, client tests |
| No critical bugs in current build | ☑ Confirmed | |
| Works on target devices/browsers | ☑ Tested | Chrome, Safari, mobile |

---

## 7. Monitoring & Support

**How will we know if something breaks?**  
☑ Error tracking (Sentry, etc.) ☑ Health endpoint ☑ Log monitoring ☐ Manual checks

**Error tracking tool:** Sentry, Vercel Analytics, or Railway logs

**Primary contact if issues arise:** Salman Sadiq (Slack / internal contact)

---

## 8. Known Limitations & Risks

**What doesn't work yet or has known issues?**  
- Some WHOOP features require webhook registration in production.  
- Voice assistant may have latency on first cold start.  
- Embeddings migration for RAG is incremental.

**What are the main risks with this deployment?**  
- Third-party API rate limits (OpenAI, WHOOP).  
- Database migration failures on first deploy.  
- Session/WebSocket stability under load.

**Estimated monthly cost (if known):** ~$50–150/month (Railway, DB, OpenAI usage)

---

## 9. Pre-Deployment Checklist

- [x] README is up to date with setup instructions  
- [x] Environment variables are documented  
- [x] No hardcoded secrets in the codebase  
- [x] Database migrations work on fresh setup  
- [x] Core user flows tested and working  
- [x] Error handling in place (users see friendly errors)  
- [x] I can deploy and rollback without CTO intervention  
- [x] Architecture diagram attached (see Section 11)

---

## 10. Approval

| Role | Name / Signature | Date |
|------|------------------|------|
| Submitted By | Salman Sadiq |
| Tech Lead Review | Salman Sadiq |
| CTO Approval | | |

**CTO Decision:** ☐ Approved ☐ Approved with notes ☐ Needs changes (see below)

**Notes / Required Changes:**

---

---

# 11. Complete System Design

## 11.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Next.js App (React 19)     │  WhatsApp Business    │  Mobile Web (PWA)          │
│  - Dashboard, Goals        │  - Chat commands      │  - Same API, responsive   │
│  - Fitness, Nutrition       │  - Voice triggers      │  - Voice Assistant        │
│  - Wellbeing, WHOOP         │  - Notifications      │  - Offline-aware         │
│  - Voice Assistant          │                       │                           │
│  - AI Coach, Chat           │                       │                           │
└──────────────┬──────────────┴───────────┬───────────┴─────────────┬──────────────┘
               │                         │                         │
               │  HTTPS / REST          │  Webhook                │  HTTPS / WS
               ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           API LAYER (Express 5)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Auth (JWT)  │  Rate Limit  │  Validation (Zod)  │  RBAC  │  Error Handler      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  /auth  │ /assessment  │ /integrations  │ /workouts  │ /wellbeing  │ /whoop     │
│  /chat  │ /voice-calls  │ /activity-status  │ /automation  │ /nutrition  │ ...  │
└──────────────┬──────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  LangChain / LangGraph     │  WHOOP Sync       │  Automation (BullMQ)           │
│  RAG Chatbot               │  OpenAI / Claude  │  Voice TTS / STT              │
│  AI Coach Sessions         │  Embeddings       │  Email / Notifications         │
└──────────────┬──────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL (yhealth)       │  Redis (optional)   │  S3 (uploads, body images) │
│  - users, roles             │  - Session cache     │  - File storage            │
│  - health_data_records      │  - BullMQ jobs       │                             │
│  - voice_calls, ai_sessions │                     │                             │
│  - activity_status_history  │                     │                             │
│  - pgvector embeddings      │                     │                             │
└─────────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  WHOOP API  │  OpenAI  │  Anthropic  │  Stripe  │  SendGrid  │  AWS S3         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 11.2 Component Architecture

| Layer | Component | Responsibility |
|-------|-----------|----------------|
| **Client** | Next.js App | SSR/CSR, auth, dashboard, all feature UIs |
| **Client** | Socket.io Client | Real-time call state, notifications |
| **API** | Express Router | Route mounting, CORS, base middleware |
| **API** | Auth Middleware | JWT verify, role check, optional RBAC |
| **API** | Controllers | Request handling, response formatting |
| **Service** | LangGraph Chatbot | RAG, context, AI responses |
| **Service** | WHOOP Service | OAuth, sync, webhook ingestion |
| **Service** | Activity Status | Status history, calendar, stats |
| **Service** | Voice Calls | Call orchestration, TTS/STT |
| **Data** | PostgreSQL | All persistent data |
| **Data** | Migrations | Schema, enums, indexes |

## 11.3 Data Flow (Examples)

**WHOOP Analytics:**
```
User → WHOOP page → GET /integrations/whoop/status
                  → GET /whoop/analytics/overview
     ← Rendered charts, metrics
```

**Voice Call:**
```
User → Voice tab → POST /voice-calls/initiate
     → WebRTC / media server
     → AI Coach (LangChain) ↔ TTS
     ← Real-time audio, transcript
```

**Chat:**
```
User → Chat → POST /chats/:id/messages
     → RAG Chatbot service → OpenAI/Anthropic
     ← Streaming response
```

## 11.4 Database Schema (Key Tables)

- `users` – Auth, profile, `current_activity_status`
- `user_integrations` – OAuth tokens, WHOOP credentials, webhook_url
- `health_data_records` – WHOOP recovery, sleep, strain
- `activity_status_history` – Daily status log
- `voice_calls` – Call metadata, duration, session link
- `ai_coach_sessions` – Conversation context
- `chats`, `messages` – Chat history
- `wellbeing_*` – Stress, mood, journal, habits
- `user_goals`, `assessment_*` – Goals and assessments

## 11.5 Security Overview

| Concern | Mitigation |
|---------|------------|
| Auth | JWT (httpOnly cookie), bcrypt passwords |
| RBAC | roles, permissions, middleware checks |
| Secrets | .env, no keys in repo |
| Validation | Zod schemas on all inputs |
| Rate limiting | express-rate-limit per endpoint |
| HTTPS | Enforced in production |

## 11.6 Deployment Topology

```
                    ┌─────────────────┐
                    │   DNS / CDN     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────────┐   ┌──────────┐
       │  Client  │   │  API Server  │   │ WhatsApp │
       │ (Next.js)│   │  (Express)   │   │ Webhook  │
       │  Static  │   │  Railway     │   │          │
       └──────────┘   └──────┬───────┘   └──────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │PostgreSQL│   │  Redis   │   │   S3     │
       │ (DB)     │   │ (optional)│   │ (uploads)│
       └──────────┘   └──────────┘   └──────────┘
```

---

*This is a lightweight review for early-stage deployments. As projects mature and move to production scale, the full System Design Document may be expanded.*
