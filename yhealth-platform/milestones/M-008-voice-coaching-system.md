---
type: milestone
id: M-008
title: Voice Coaching System
product: yhealth-platform
status: completed
completed: 2026-01-12
milestone_type: development
---

# [M-008] Voice Coaching System

## Summary
Implemented the full voice coaching system with WebRTC signaling, real-time emotion detection, crisis detection and escalation, session orchestration (quick check-in, coaching, emergency, goal review), and post-call summaries with action tracking.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| WebRTC for real-time audio | Low-latency peer-to-peer communication for voice calls |
| AssemblyAI for transcription | High-accuracy speech-to-text with streaming support |
| TensorFlow for emotion detection | Client-side ML inference, no round-trip latency |
| Session types for different coaching needs | Quick check-in (5 min), coaching (20-30 min), emergency, goal review (15 min) |
| Crisis detection with escalation protocol | Safety-first design with automatic resource surfacing |

## Artifacts Created

### Backend Services
- `server/src/services/voice-call.service.ts` - Voice call lifecycle management
- `server/src/services/emotion-detection.service.ts` - Real-time emotion analysis
- `server/src/services/crisis-detection.service.ts` - Safety monitoring and escalation
- `server/src/services/session-orchestration.service.ts` - Session type management
- `server/src/services/call-summary.service.ts` - AI-powered post-call summaries
- `server/src/services/summary-delivery.service.ts` - Multi-channel summary delivery
- `server/src/services/voice-schedule.service.ts` - Voice preferences and scheduling

### Frontend Components
- `client/components/VoiceCallTab` - Voice call interface with status tracking
- `client/components/CallCoachButton` - One-tap voice call initiation
- `client/components/CallHistory` - Call history display
- `client/components/CallSummaryView` - Post-call summary display
- `client/components/VoiceCustomizationPanel` - Voice and schedule customization
- `client/components/EmotionTrendsWidget` - Emotion data visualization
- `client/components/ActionItemList` - Action item tracking
- `client/components/VoiceAssistant` - CallPurposeSelector, EmergencyResources, SessionTypeSelector

### Session Flows
- `QuickCheckInFlow` - 5-minute quick check-in session
- `CoachingSessionFlow` - 20-30 minute coaching session
- `EmergencySessionFlow` - Emergency support session protocol
- `GoalReviewFlow` - 15-minute goal review session

### Database
- `call_summaries` table - Post-call summary storage
- `action_items` table - Action item tracking storage

## Context

The voice coaching system extends the AI coach from text-based chat to real-time voice interactions. It supports four session types designed for different user needs, from a quick 5-minute check-in to emergency support with crisis detection. The system uses WebRTC for audio streaming, AssemblyAI for transcription, and TensorFlow for real-time emotion analysis during calls. Post-call summaries are generated using AI and delivered through multiple channels.

## Session Reference

| Field | Value |
|-------|-------|
| **Session Date** | 2026-01-09 to 2026-01-12 |
| **Participants** | Hamza |
| **Related Milestones** | M-007 (Onboarding Framework) |

---
*Created: 2026-02-08 | Product: yhealth-platform | Milestone: M-008*
