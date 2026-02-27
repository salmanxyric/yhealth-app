1) Goals and key flows
Core features

Daily AI leaderboard (auto-generated) across:

Workout (steps, HR zones, training load, sessions)

Nutrition (macro targets, calorie adherence, meal timing)

Wellbeing (sleep, stress, mood, readiness)

“Everyday” participation (check-ins, streaks, community actions)

Competitions

AI-generated daily/weekly challenges (e.g., “Zone 2 minutes”, “7-day protein streak”)

Admin-created competitions with rules, eligibility, prizes, anti-cheat settings

Live

Live camera rooms (participant video)

Live streaming (coach/host broadcast)

Live chat, comments, reactions, moderation

Community

Posts, comments, likes, media uploads

Scale: 100k users, heavy spikes during “daily reset” and live events

Main user journeys

User logs activities (manual, device integration, camera sessions) → data ingested

AI scoring service computes per-user scores → daily leaderboard generated

User joins competition / live event → real-time updates, chat, video/stream

Admin creates competition → users enrolled → scoring rules applied

2) High-level architecture (services)
Client apps

Mobile apps (iOS/Android): health data, camera, streaming viewer, push notifications

Web admin portal: competition creation, moderation, reports

Backend API layer

API Gateway / BFF (Backend for Frontend)

Auth, rate limiting, request routing

Separate BFFs optional: bff-user, bff-admin, bff-live

Core services

Identity & Auth Service

OAuth2/OIDC, JWT access tokens

RBAC (user, coach, admin, moderator)

User Profile Service

User settings, timezone, privacy, device links

Activity Ingestion Service

Accepts workout/nutrition/wellbeing events (manual + integrations)

Validates, normalizes, deduplicates

AI Scoring Service

Produces daily “fitness score” and dimension scores

Detects anomalies/cheating signals

Leaderboard Service

Stores daily boards, competition boards

Fast query API (top N, around me, friends, filters)

Competitions Service

Competition definitions (AI-created + admin-created)

Enrollment, rules, schedules, scoring mapping

Social/Community Service

Posts, comments, likes, reporting, moderation

Live Service (Real-time)

Presence, chat, reactions, room state

WebSocket gateway + pub/sub

Media Service

Uploads, transcoding, thumbnails

Signed URLs, CDN integration

Notifications Service

Push + in-app notifications (daily reset, rank changes, live event reminders)

Admin/Moderation Service

Bans, shadowbans, content takedowns, audit logs

Data/infra

Message bus / streaming: Kafka / Pulsar (or SNS/SQS + Kinesis)

Caches: Redis (leaderboard ranks, sessions, rate-limit counters)

Databases

Relational (Postgres) for transactional data (users, competitions)

NoSQL / wide-column (DynamoDB/Cassandra) for high-write activity events & leaderboard snapshots

Search (OpenSearch/Elasticsearch) for discovery + admin queries

Object storage: S3/GCS for images/videos, plus CDN

Observability: logs, metrics, tracing, alerting

3) Data model (high-level)
Entities

User

id, timezone, privacy flags, cohorts, device links

ActivityEvent

user_id, type (workout/nutrition/wellbeing), source, timestamp, payload, confidence

DailyUserScore

user_id, date, total_score, component_scores, explanation, flags

LeaderboardSnapshot

date, board_type (global/friends/country/competition), sorted ranks, metadata

Competition

id, name, type (AI/admin), start/end, rules, eligibility, scoring weights, anti-cheat policy

CompetitionEntry

competition_id, user_id, joined_at, status

LiveRoom / LiveEvent

id, host_id, stream_url, participants, chat_room_id, moderation flags

Post / Comment / Reaction

4) AI scoring + leaderboard generation (daily automation)
Inputs

Structured activity events from:

manual logs

wearables/health platforms

in-app workout sessions

live participation and streaks

Scoring approach (practical)

Hybrid scoring (recommended for explainability + safety):

Rule-based baseline + ML adjustments

Weighted components with caps to prevent “gaming”

Example components

Workout consistency, intensity minutes, progressive overload

Nutrition adherence, protein/fiber targets, hydration

Sleep duration/regularity, stress check-ins

Community: participation (small weight), not spammy

Anti-cheat

Outlier detection (impossible steps/time), repeated identical logs, camera session verification signals

“Confidence score” per event; low-confidence events contribute less

Daily pipeline (timezone-aware)

Event ingestion continuously

Aggregation window per user per local day (timezone)

Daily scoring job

triggers at user’s local “end of day” or a global schedule with timezone bucketing

Leaderboard materialization

compute top K per segment (global, country, friends, groups, competitions)

Publish updates

cache leaderboard in Redis for fast reads

notify users of rank changes / new challenges

Implementation note: Precompute leaderboards rather than sorting at query time.

5) Competitions (AI + admin)
Competition definition

Rule schema examples:

Metric: steps, workout minutes, calories burned, sleep score, meal adherence, “sessions attended”

Aggregation: sum, average, streak, best-of

Constraints: min data confidence, max per-day cap

Eligibility: region, subscription tier, age bracket, groups, invite-only

Tie-breakers: consistency, latest completion time, fewer flags

AI-generated competitions

“Competition Generator” (part of AI service):

picks daily challenges based on population trends and user segments

avoids repeats, balances difficulty

generates title, description, rules, and reward badges

Admin-created competitions

Admin UI → Competitions Service:

create/edit/publish, schedule, moderation settings, prize metadata

A/B tests, featured competitions

6) Live streaming + camera sharing + chat
Two “live” modes (common pattern)

Broadcast streaming (one-to-many)

Use RTMP ingest (host) → media server → HLS/DASH playback via CDN

Scale-friendly for 100k viewers

Interactive video rooms (many-to-many)

WebRTC SFU (Selective Forwarding Unit) for multi-participant sessions

Limit participant count per room (e.g., 16–50 on camera), unlimited viewers via broadcast

Real-time layer

WebSocket Gateway for chat/presence/reactions

Pub/Sub channels per room/competition

Message moderation pipeline:

keyword filters + abuse detection + admin tools

7) Scalability plan for ~100k users
Hot paths

Leaderboard reads (top N, “around me”)

Daily reset computations

Live chat bursts

Techniques

Caching

Redis sorted sets for leaderboards (per segment/date)

Cache top N + user’s neighborhood ranks

Precompute

Nightly/daily leaderboard snapshots

Sharding

Partition events by user_id hash

Partition leaderboards by segment (global/country/group/competition)

Rate limits

Prevent spam on comments/chat and leaderboard polling

CDN

All video & images via CDN

Async processing

ingestion → queue → processing → storage

8) APIs (example, high level)
Leaderboard

GET /leaderboards/daily?date=YYYY-MM-DD&type=global&segment=country:PK

GET /leaderboards/daily/around-me?date=...

GET /leaderboards/competition/{id}

Activity

POST /activity-events (batch)

GET /daily-score?date=... (with explanation)

Competitions

POST /admin/competitions

POST /competitions/{id}/join

GET /competitions/active

Live

POST /live/events (host)

GET /live/events/{id}

WS /live/ws (chat/presence)

9) Security, privacy, compliance (must-haves)

Privacy controls: hide from global boards, allow friends-only, anonymous mode

Media safety: reporting, takedowns, moderation logs

Data minimization + encryption at rest/in transit

Audit logs for admin actions

Device/health data consent flows and revocation

10) Suggested MVP vs Phase 2
MVP (fast path)

Daily leaderboard (precomputed) for workout + wellbeing

Admin-created competitions (simple rule types)

Live broadcast events + chat (no multi-camera rooms initially)

Basic anti-cheat + explainable score breakdown

Phase 2

AI-generated competitions per segment

WebRTC multi-participant camera rooms

Personalized scoring model per user + goal-based weights

Advanced moderation tooling and community features