---
type: milestone
id: M-015
title: Automation & Background Jobs
product: yhealth-platform
status: completed
completed: 2026-02-04
milestone_type: development
---

# [M-015] Automation & Background Jobs

## Summary
Background job system using BullMQ with Redis for reliable job processing. Includes schedule automation, activity automation, reminder processor, and stress reminder services. Supports clustering for scalability.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| BullMQ over node-cron for reliability | Redis-backed persistence survives server restarts |
| Redis-backed queues | Distributed job processing with at-least-once delivery |
| Separate job processors for each domain | Independent scaling and failure isolation |
| Clustering support | Horizontal scaling for background job processing |

## Artifacts Created

### Backend Services
- `server/src/services/schedule-automation.service.ts` - Automated schedule generation and management
- `server/src/services/activity-automation.service.ts` - Activity-based automation triggers
- `server/src/services/reminder-processor.service.ts` - Reminder scheduling and delivery
- `server/src/services/stress-reminder.service.ts` - Stress-aware reminder timing

### Infrastructure
- BullMQ job queue configuration
- Redis connection management
- Job retry and dead-letter handling
- Cluster-aware job distribution

### Database
- Job execution records
- Automation rule storage

## Context

The background job system provides the automation backbone for the platform. Rather than relying on in-process cron jobs that are lost on restart, BullMQ with Redis ensures reliable job processing with at-least-once delivery guarantees. Each domain (scheduling, activity, reminders, stress) has its own job processor, enabling independent scaling and failure isolation. The system supports clustering for horizontal scaling as the user base grows.

## Session Reference

| Field | Value |
|-------|-------|
| **Session Date** | 2026-02-04 |
| **Participants** | Hamza |
| **Related Milestones** | M-009 (Wellbeing Pillar), M-014 (Workout & Fitness) |

---
*Created: 2026-02-08 | Product: yhealth-platform | Milestone: M-015*
