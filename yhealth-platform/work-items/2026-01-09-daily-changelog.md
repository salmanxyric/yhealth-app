# Daily Changelog: January 9, 2026

> **Date**: 2026-01-09
> **Focus**: Voice Call System, Emotion Detection, Mental Recovery Scoring, Reporting
> **Status**: Completed

---

## Summary

Major development session focused on enhancing the voice call system with emotion detection, mental recovery scoring, report generation, crisis detection, and AssemblyAI transcription integration. Added comprehensive dashboard analytics tabs and voice assistant modal components.

---

## Completed Tasks

### 1. Voice Call System Enhancements
**Feature**: Enhanced voice call lifecycle with session types and error handling
**Files Modified**:
- `server/src/services/voice-call.service.ts` - Comprehensive error handling, schema validation, rate limiting
- `server/src/controllers/voice-call.controller.ts` - Input validation improvements
- `server/src/types/voice-call.types.ts` - Added session type definitions

**Improvements**:
- Fixed callId undefined error in LangGraph chatbot service
- Added schema validation for optional database columns with caching
- Improved rate limiting with detailed logging
- Added session type support (checkin, breakthrough, extended_support)

### 2. Emotion Detection Service
**Feature**: Real-time emotion analysis during voice calls
**New Files**:
- `server/src/services/emotion-detection.service.ts` - Emotion analysis service
- `server/src/controllers/emotion-data.controller.ts` - CRUD operations for emotions
- `server/src/routes/emotions.routes.ts` - Emotion API endpoints
- `server/src/database/tables/34-emotion-logs.sql` - Emotion logs table

**Features**:
- Real-time emotion detection during conversations
- Foreign key constraint handling for missing users
- User existence check before logging emotions
- Graceful error handling for edge cases

### 3. Mental Recovery Scoring
**Feature**: Track and score mental recovery progress
**New Files**:
- `server/src/services/mental-recovery-score.service.ts` - Recovery scoring logic
- `server/src/controllers/mental-recovery.controller.ts` - Score management
- `server/src/routes/recovery-score.routes.ts` - Recovery score endpoints
- `server/src/database/tables/35-mental-recovery-scores.sql` - Scores table

**Features**:
- Physical and mental recovery score tracking
- Integration with voice sessions
- Historical score analysis

### 4. Crisis Detection Service
**Feature**: Safety monitoring and escalation for conversations
**New File**: `server/src/services/crisis-detection.service.ts`

**Capabilities**:
- Real-time crisis keyword detection
- Escalation protocols for safety concerns
- Integration with emotion detection

### 5. Report Generation Service
**Feature**: Comprehensive analytics and reporting
**New Files**:
- `server/src/services/report-generation.service.ts` - Report generation logic
- `server/src/controllers/report.controller.ts` - Report endpoints
- `server/src/routes/reports.routes.ts` - Report API routes

**Features**:
- Session summaries and analytics
- Progress tracking reports
- User insights aggregation

### 6. AssemblyAI Transcription Integration
**Feature**: Audio transcription service
**New Files**:
- `server/src/services/assemblyai.service.ts` - AssemblyAI integration
- `server/src/controllers/transcription.controller.ts` - Transcription management
- `server/src/routes/transcription.routes.ts` - Transcription endpoints
- `client/src/shared/services/transcription.service.ts` - Client-side service

**Features**:
- Real-time audio transcription
- Transcript storage and retrieval
- Integration with voice call system

### 7. Session Orchestration Service
**Feature**: Voice session lifecycle management
**New Files**:
- `server/src/services/session-orchestration.service.ts` - Session orchestration
- `server/src/services/voice-session.service.ts` - Voice session management

**Features**:
- Session type selection and management
- Conversation flow orchestration
- Multi-session support

### 8. Email Service Improvements
**File**: `server/src/helper/mail.ts`

**Improvements**:
- Enhanced SMTP authentication error detection
- Added helpful error messages for Gmail App Password setup
- Made email sending non-blocking for user registration
- Enhanced transporter configuration with timeouts

### 9. LangGraph Chatbot Fixes
**File**: `server/src/services/langgraph-chatbot.service.ts`

**Fixes**:
- Fixed `callId is not defined` error by properly extracting from params
- Updated both `chat()` and `chatStream()` methods
- Removed duplicate callId extractions

### 10. Dashboard Analytics Tabs
**Feature**: Enhanced dashboard with analytics views
**New Files**:
- `client/app/(pages)/dashboard/components/tabs/overview/AnalyticsTab.tsx`
- `client/app/(pages)/dashboard/components/tabs/overview/ReportingTab.tsx`
- `client/app/(pages)/dashboard/components/tabs/overview/ScoringTab.tsx`

**Features**:
- Analytics overview with visualizations
- Reporting dashboard for insights
- Scoring tab for progress metrics

### 11. Voice Assistant Modal Components
**Feature**: Enhanced voice assistant UI
**New Files**:
- `client/app/(pages)/dashboard/components/voice-assistant/CallPurposeSelector.tsx`
- `client/app/(pages)/dashboard/components/voice-assistant/EmergencyResources.tsx`
- `client/app/(pages)/dashboard/components/voice-assistant/SessionTypeSelector.tsx`
- `client/app/(pages)/dashboard/components/voice-assistant/VoiceAssistantControls.tsx`
- `client/app/(pages)/dashboard/components/voice-assistant/VoiceAssistantHeader.tsx`
- `client/app/(pages)/dashboard/components/voice-assistant/VoiceAssistantOrb.tsx`
- `client/app/(pages)/dashboard/components/voice-assistant/AnimatedEyesAvatar.tsx`
- `client/app/(pages)/dashboard/components/voice-assistant/AudioVisualizer.tsx`
- `client/app/(pages)/dashboard/components/voice-assistant/InlineCameraPanel.tsx`

**Features**:
- Call purpose selection before initiating calls
- Emergency resources quick access
- Session type selector for different coaching modes
- Animated voice assistant avatar with expressions
- Audio visualizer for call feedback

### 12. Progress Charts
**Feature**: Visual progress tracking components
**New Files**:
- `client/app/(pages)/dashboard/components/progress/BMITrendChart.tsx`
- `client/app/(pages)/dashboard/components/progress/MeasurementTrendChart.tsx`
- `client/app/(pages)/dashboard/components/progress/MonthlyProgressChart.tsx`
- `client/app/(pages)/dashboard/components/progress/WeeklyProgressChart.tsx`
- `client/app/(pages)/dashboard/components/progress/WeightTrendChart.tsx`
- `client/app/(pages)/dashboard/components/progress/utils/progressCalculations.ts`

### 13. Database Schema Updates
**New/Modified Files**:
- `server/src/database/tables/34-emotion-logs.sql` - Emotion tracking
- `server/src/database/tables/35-mental-recovery-scores.sql` - Recovery scores
- `server/src/database/tables/31-voice-calls.sql` - Session type support
- `server/src/database/migrations/add-voice-calls-session-type.sql` - Migration
- `server/src/database/tables/01-enums.sql` - New enum types

---

## Files Modified

### Server (New Files)
| File | Description |
|------|-------------|
| `src/services/emotion-detection.service.ts` | Emotion analysis service |
| `src/services/mental-recovery-score.service.ts` | Recovery scoring |
| `src/services/crisis-detection.service.ts` | Crisis detection |
| `src/services/report-generation.service.ts` | Report generation |
| `src/services/assemblyai.service.ts` | Transcription service |
| `src/services/session-orchestration.service.ts` | Session management |
| `src/services/voice-session.service.ts` | Voice session handling |
| `src/controllers/emotion-data.controller.ts` | Emotion CRUD |
| `src/controllers/mental-recovery.controller.ts` | Recovery scores |
| `src/controllers/report.controller.ts` | Reports |
| `src/controllers/transcription.controller.ts` | Transcription |
| `src/routes/emotions.routes.ts` | Emotion endpoints |
| `src/routes/recovery-score.routes.ts` | Recovery endpoints |
| `src/routes/reports.routes.ts` | Report endpoints |
| `src/routes/transcription.routes.ts` | Transcription endpoints |
| `src/database/tables/34-emotion-logs.sql` | Emotion table |
| `src/database/tables/35-mental-recovery-scores.sql` | Recovery table |
| `src/database/migrations/add-voice-calls-session-type.sql` | Migration |
| `src/database/run-migration.ts` | Migration runner |

### Server (Modified Files)
| File | Changes |
|------|---------|
| `src/services/voice-call.service.ts` | Error handling, schema validation |
| `src/services/langgraph-chatbot.service.ts` | Fixed callId undefined error |
| `src/services/embedding-queue.service.ts` | Updates |
| `src/services/human-detection.service.ts` | Updates |
| `src/services/activity-status.service.ts` | Updates |
| `src/controllers/voice-call.controller.ts` | Input validation |
| `src/controllers/rag-chatbot.controller.ts` | callId passing |
| `src/controllers/auth.controller.ts` | Non-blocking email |
| `src/controllers/auth/auth-registration.controller.ts` | Non-blocking email |
| `src/controllers/auth/auth-onboarding.controller.ts` | Updates |
| `src/helper/mail.ts` | SMTP error handling |
| `src/routes/index.ts` | New route registrations |
| `src/config/env.config.ts` | New config options |
| `src/database/setup.ts` | Schema updates |
| `src/database/auto-migrate.ts` | Migration support |

### Client (New Files)
| File | Description |
|------|-------------|
| `app/(pages)/dashboard/components/voice-assistant/*.tsx` | 9 voice assistant components |
| `app/(pages)/dashboard/components/progress/*.tsx` | 5 progress chart components |
| `app/(pages)/dashboard/components/tabs/overview/AnalyticsTab.tsx` | Analytics view |
| `app/(pages)/dashboard/components/tabs/overview/ReportingTab.tsx` | Reporting view |
| `app/(pages)/dashboard/components/tabs/overview/ScoringTab.tsx` | Scoring view |
| `src/shared/services/transcription.service.ts` | Transcription client |
| `hooks/use-toast.ts` | Toast notifications hook |

### Client (Modified Files)
| File | Changes |
|------|---------|
| `app/(pages)/dashboard/components/CallCoachButton.tsx` | Session type support |
| `app/(pages)/dashboard/components/tabs/VoiceAssistantTab.tsx` | Enhanced UI |
| `app/(pages)/dashboard/components/tabs/VoiceCallTab.tsx` | Session selection |
| `app/(pages)/dashboard/components/tabs/ProgressTab.tsx` | Chart integration |
| `app/(pages)/dashboard/components/tabs/overview/OverviewTab.tsx` | Updated structure |
| `app/(pages)/chat/page.tsx` | Updates |
| `app/(pages)/onboarding/steps/deep-assessment/*.tsx` | Updates |
| `config/env.ts` | New env vars |
| `lib/api-client.ts` | API updates |
| `lib/auth.ts` | Auth updates |
| `src/shared/services/voice-call.service.ts` | Session types |
| `src/shared/services/ai-coach.service.ts` | Updates |
| `src/shared/services/rag-chat.service.ts` | Updates |
| `src/shared/services/tts.service.ts` | Updates |
| `src/shared/services/upload.service.ts` | Updates |

---

## Build Status

- Client build: **PASSED**
- Server build: **PASSED**
- All TypeScript checks: **PASSED**
- Total files changed: **87 files**
- Lines added: **+13,044**
- Lines removed: **-1,329**

---

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Session type enum | Clear categorization of call purposes |
| Non-blocking emails | Improve user registration response time |
| Schema validation caching | Reduce database queries for column checks |
| Emotion logs table | Separate tracking for emotional states |
| Crisis detection service | Safety-first approach for mental health |
| AssemblyAI for transcription | Industry-leading accuracy for audio |

---

## Commits

| Hash | Message |
|------|---------|
| `706f422` | feat: Voice call system, emotion detection, and reporting features |

---

## Next Steps

- [ ] Add real-time emotion visualization during calls
- [ ] Implement crisis escalation notifications
- [ ] Add recovery score trends visualization
- [ ] Complete report PDF generation
- [ ] Add session recording and playback
- [ ] Implement multi-language transcription support

---

*Daily Changelog | yHealth Platform*
*Session Duration: Full day development*
*Total Tasks Completed: 13*

