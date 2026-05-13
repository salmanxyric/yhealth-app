# yHealth Platform - Epic 09: Data Integrations

## EPIC OVERVIEW

### Epic Statement
Data Integrations is the FOUNDATIONAL LAYER that connects yHealth's AI coach to real-world health data from 10+ wearable devices and APIs, enabling automated tracking across all three pillars (Fitness, Nutrition, Wellbeing) without manual entry burden. This epic powers the "Better Together" strategy by aggregating diverse data sources into unified insights.

### Epic Goal
Enable seamless, automatic health data synchronization from multiple wearable devices and APIs while maintaining HIPAA/GDPR compliance, handling data conflicts intelligently, and providing manual entry fallbacks - all to minimize user friction and maximize data completeness for AI-driven insights.

### Core Philosophy
**"Integration Superiority Strategy":** Our competitive advantage isn't replicating dedicated fitness or nutrition apps - it's CONNECTING data from 10+ sources to deliver cross-domain insights impossible for single-purpose tools. Data Integrations is the engine that makes "unimaginable insights" possible.

### Data Integrations Scope (10 Features)

| Feature | Integration Type | Data Types | MVP Tier | MVP Status |
|---------|------------------|------------|----------|------------|
| **F9.1** | WHOOP Integration | HR, Sleep, Recovery, Strain, HRV | Tier 1 | Core |
| **F9.2** | Apple Health Integration | Aggregated activity, steps, HR, workouts | Tier 1 | Core |
| **F9.3** | Google Fit Integration | Activity, steps, HR, sleep basics | Tier 1 | Core |
| **F9.4** | Fitbit Integration | HR, Sleep stages, Activity, SpO2 | Tier 2 | Core |
| **F9.5** | Garmin Integration | Activity, HR, Sleep, Body Battery, Stress | Tier 2 | Core |
| **F9.6** | Oura Ring Integration | Sleep, HRV, Readiness, Activity | Tier 2 | Core |
| **F9.7** | Samsung Health Integration | Activity, Sleep, HR, Stress | Tier 3 | Future |
| **F9.8** | Strava Integration | Workouts, routes, effort scores | Tier 3 | Future |
| **F9.9** | Nutritionix Integration | Food database, nutrition data | Tier 3 | Future |
| **F9.10** | Sleep Tracking Apps Integration | Generic sleep apps (Sleep Cycle, Pillow) | Tier 3 | Future |

### Integration Tiers Strategy

**Tier 1 (MVP Critical - Launch Blockers):**
- WHOOP, Apple Health, Google Fit
- These cover ~70% of target users' primary devices
- Must be functional and reliable for MVP launch
- Represents the "core integration foundation"

**Tier 2 (MVP Important - Launch Week):**
- Fitbit, Garmin, Oura
- Adds ~25% user coverage (total 95% with Tier 1)
- Complete within 1-2 weeks post-launch
- Important for competitive parity with BEVEL/WHOOP

**Tier 3 (Post-MVP - Month 1-3):**
- Samsung, Strava, Nutritionix, Sleep apps
- Adds niche coverage and specialized features
- Can be phased in based on user demand
- Lower priority for MVP validation

### User Decisions Applied

**1. Priority Order (Confirmed):**
- Tier 1: WHOOP, Apple Health, Google Fit (MVP critical)
- Tier 2: Fitbit, Garmin, Oura (MVP important)
- Tier 3: Samsung, Strava, Nutritionix, Sleep apps (post-MVP)

**2. Data Types - NO Standardization:**
- Each device captures different data with unique capabilities
- WHOOP: Strain score (0-21), recovery metrics, HRV focus
- Oura: Readiness score, sleep specialization
- Apple Health: Aggregated hub, broad but less specialized
- **Strategy:** Tailored integration plans per device to capture ALL available features
- **NO forced standardization** - preserve device-specific metrics for expert users

**3. Manual Entry Strategy:**
- **Allow but not priority:** Manual entry available as fallback
- **Always try automated first:** Push users toward wearable connections
- **Make it easy when needed:** Simple manual logging for users without devices
- **Cross-pillar manual support:** Mood (no device), meals (photo + manual), workouts (manual as fallback)

**4. Golden Source Override:**
- **NO user override capability** (Hamza's decision confirmed)
- **We decide the priority hierarchy** based on device accuracy and specialization
- **Rationale:** Users typically use ONE primary source anyway; conflicts are rare
- **Priority Rules:** See PRD Section 15 for detailed golden source hierarchy

### Integration Architecture Principles

**OAuth 2.0 + PKCE (RFC 7636):**
- All integrations use Authorization Code flow with PKCE for mobile security
- Short-lived access tokens (1-2 hours), refresh token rotation
- Tokens stored server-side only, encrypted with AWS Secrets Manager Managed HSM
- No token material on device or in logs

**Adaptive Sync Strategy:**
- Baseline: Hourly sync per entity for active users
- Elevated: 15-30 min sync for recently active users (within rate budget)
- Daily reconciliation: Full cursor verification to catch drift
- Backfill: 30-90 days on first connect (configurable per device)

**Data Storage Layers:**
1. **Raw Layer:** Persist vendor JSON in encrypted blob storage (per-region, WORM)
2. **Normalized Layer:** Map to canonical yHealth schema (see Data Dictionary)
3. **FHIR Layer:** Create Observation/Device representations for interoperability (where applicable)

**Error Handling Philosophy:**
- Exponential backoff with jitter for 5xx/network errors
- Honor Retry-After and rate-limit headers for 429 responses
- Circuit breaker for persistent vendor outages
- Dead Letter Queue (DLQ) for schema/data quality issues
- Proactive user communication for auth failures (>48h no sync)

**Compliance by Design:**
- All data treated as PHI/ePHI (HIPAA) and sensitive personal data (GDPR)
- Field-level encryption for sensitive columns (HR time-series, sleep, etc.)
- Regional data residency: EU PHI stays in EU, US PHI in US
- Consent per provider with scope-level granularity
- DSR-ready: Export and deletion propagate across all storage layers

---

## F9.1: WHOOP INTEGRATION (TIER 1 - MVP CRITICAL)

### Description
WHOOP is a TIER 1 CRITICAL integration providing elite recovery metrics, strain tracking, sleep analysis, and HRV data. WHOOP users are optimization enthusiasts who expect deep physiological insights - this integration powers yHealth's Physical Recovery Score and advanced fitness analytics. WHOOP is the "golden source" for heart rate, recovery, and strain metrics.

### User Story
As an **Optimization Enthusiast** (P3), I want yHealth to automatically sync my WHOOP data (recovery, strain, sleep, HRV) so that I can get cross-domain insights connecting my physiological readiness to my mood, nutrition, and workout performance without manual entry.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Auto-sync WHOOP recovery score, strain, and sleep. View summary in app: "Recovery: 85% (Green), Strain: 12.5, Sleep: 7h 30m (Good)". No manual intervention required. |
| **Deep** | Detailed WHOOP metrics breakdown (HRV, RHR, sleep stages, strain by activity, respiratory rate). Historical trends, export WHOOP data, cross-domain correlation analysis. |

### WHOOP-Specific Data Types

**Recovery Data:**
- Recovery score (0-100)
- HRV (RMSSD in milliseconds)
- Resting heart rate (BPM)
- Respiratory rate (breaths/min)
- Skin temperature deviation
- Blood oxygen saturation (SpO2) - if available
- Sleep performance percentage

**Sleep Data:**
- Total sleep time (ms)
- Sleep stages: Awake, Light Sleep, Slow Wave Sleep (Deep), REM
- Sleep efficiency percentage
- Sleep consistency percentage
- Sleep need calculation (baseline + debt + strain + nap adjustment)
- Disturbances count
- Respiratory rate during sleep

**Activity/Strain Data:**
- Daily strain score (0-21 scale)
- Workout strain scores
- Activity type (via sport_id mapping)
- Heart rate zones during activities (Zone 0-5)
- Calories burned (kilojoules)
- Distance (meters)
- Average/max heart rate during workouts

**Cycle Data (Physiological Cycle):**
- 24-hour physiological cycle tracking
- Cumulative strain over cycle
- Average heart rate for cycle
- Kilojoule expenditure

### WHOOP API v2 Integration Specifications

**OAuth 2.0 Scopes Required:**
- `read:recovery` - Recovery score and related metrics
- `read:cycles` - Physiological cycle information
- `read:sleep` - Sleep data including stages
- `read:workout` - Workout/activity data
- `read:profile` - Basic user profile
- `read:body_measurement` - Height, weight, max HR
- `offline` - **REQUIRED** for refresh token (long-term access)

**API Endpoints:**
- Base URL: `https://api.whoop.com/developer/v1/`
- Recovery: `GET /recovery/collection`
- Sleep: `GET /activity/sleep/collection`
- Workout: `GET /activity/workout/collection`
- Cycle: `GET /cycle/collection`
- Profile: `GET /user/profile/basic`
- Body: `GET /user/measurement/body`

**Rate Limits:**
- Default: 100 requests/minute, 10,000 requests/day
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 429 response when exceeded
- Increased limits available via WHOOP typeform request (recommended for production)

**Pagination:**
- Method: `next_token` based (NOT offset)
- Parameters: `start` (ISO 8601), `end` (ISO 8601), `nextToken`, `limit`
- Pattern: Request returns `records` + `next_token`; repeat with `?nextToken=[token]` until empty

### OAuth Flow Implementation

**Authorization Flow (PKCE):**
1. Mobile app generates `code_verifier` (cryptographically random string)
2. Creates `code_challenge = BASE64URL(SHA256(code_verifier))`
3. Initiates WHOOP OAuth:
   ```
   https://api.whoop.com/oauth/oauth2/auth?
     client_id=[CLIENT_ID]&
     redirect_uri=[REDIRECT_URI]&
     response_type=code&
     scope=read:recovery read:sleep read:workout read:cycles read:profile read:body_measurement offline&
     state=[RANDOM_STATE]&
     code_challenge=[CODE_CHALLENGE]&
     code_challenge_method=S256
   ```
4. WHOOP redirects to app deep link with `code` and `state`
5. App relays `code` to backend via short-lived session
6. Backend exchanges code for tokens:
   ```
   POST /oauth/oauth2/token
   {
     "grant_type": "authorization_code",
     "code": "[CODE]",
     "code_verifier": "[CODE_VERIFIER]",
     "redirect_uri": "[REDIRECT_URI]",
     "client_id": "[CLIENT_ID]",
     "client_secret": "[CLIENT_SECRET]"
   }
   ```
7. Store access/refresh tokens server-side with envelope encryption (AWS Secrets Manager)

**Token Management:**
- Access token lifetime: ~1 hour (typical OAuth standard)
- Refresh token: Long-lived (months), requires `offline` scope
- Refresh flow: Automatic when access token expires
- Storage: Envelope-encrypted in database (AWS Secrets Manager Managed HSM)
- Rotation: Refresh tokens rotated on use (detect reuse = revoke)
- Revocation: User disconnects = revoke tokens + delete from WHOOP

### Sync Architecture

**Backfill Strategy (First Connect):**
- Pull 90 days of historical data (WHOOP recommended for pattern establishment)
- Entities: Recovery (90 days), Sleep (90 days), Workouts (90 days), Cycles (90 days)
- Rate limit aware: Throttle requests to stay under 100/min
- Progress indicator: Show user "Syncing WHOOP data: 45% complete"

**Ongoing Sync Cadence:**
- **Active users:** Every 15 minutes (recently logged activity in yHealth)
- **Standard users:** Every 60 minutes (baseline)
- **Daily reconciliation:** Full cursor sweep at 4 AM user local time
- **Entity priority:** Recovery (morning), Sleep (morning), Workouts (real-time), Cycles (daily)

**Cursor Management:**
- Per-user, per-entity cursor based on `updated_at` timestamp
- Cursors stored: `user_id`, `provider`, `entity_type`, `last_sync_timestamp`, `last_page_token`
- Idempotent upserts: Natural key = (`provider`, `provider_user_id`, `entity_type`, `source_record_id`, `timestamp`)
- Drift detection: Daily reconciliation catches missed updates

**Sync Pseudocode:**
```python
for user in users_with_whoop_enabled:
    for entity in ["recovery", "sleep", "workout", "cycle"]:
        cursor = load_cursor(user.id, "WHOOP", entity)
        next_token = None

        while True:
            # Fetch page from WHOOP
            response = whoop_api.get(
                endpoint=f"/{entity}/collection",
                params={
                    "start": cursor.last_sync_timestamp,
                    "end": now(),
                    "nextToken": next_token,
                    "limit": 50  # Configurable batch size
                },
                headers={"Authorization": f"Bearer {decrypt_token(user.whoop_access_token)}"}
            )

            # Handle rate limits
            if response.status == 429:
                retry_after = response.headers.get("X-RateLimit-Reset", 60)
                backoff_with_jitter(retry_after)
                continue

            # Process records
            for record in response.json()["records"]:
                # Archive raw JSON
                archive_raw_blob(user.id, "WHOOP", entity, record)

                # Normalize to yHealth schema
                normalized = normalize_whoop_record(entity, record)

                # Idempotent upsert
                upsert_health_data(
                    user_id=user.id,
                    provider="WHOOP",
                    entity_type=entity,
                    data=normalized,
                    natural_key=build_natural_key(normalized)
                )

            # Update cursor
            if response.json()["records"]:
                max_updated = max(r["updated_at"] for r in response.json()["records"])
                update_cursor(user.id, "WHOOP", entity, max_updated)

            # Check pagination
            next_token = response.json().get("next_token")
            if not next_token:
                break

            # Rate limit compliance
            respect_rate_limits(response.headers)
```

### Data Normalization Mapping

**WHOOP → yHealth Schema:**

**Recovery Mapping:**
```json
WHOOP API Response:
{
  "cycle_id": "abc123",
  "sleep_id": "xyz789",
  "user_id": 12345,
  "created_at": "2025-12-02T06:00:00.000Z",
  "updated_at": "2025-12-02T06:00:00.000Z",
  "score": {
    "user_calibrating": false,
    "recovery_score": 67,
    "resting_heart_rate": 54,
    "hrv_rmssd_milli": 38.2,
    "spo2_percentage": 96.5,
    "skin_temp_celsius": 33.8
  }
}

yHealth Normalized:
{
  "user_id": "[yHealth user UUID]",
  "provider": "WHOOP",
  "provider_user_id": "12345",
  "entity_type": "recovery",
  "source_record_id": "abc123",
  "timestamp": "2025-12-02T06:00:00.000Z",
  "recovery_score": 67,  // 0-100 scale (native WHOOP)
  "hrv_rmssd_ms": 38.2,
  "resting_heart_rate_bpm": 54,
  "spo2_percent": 96.5,
  "skin_temp_celsius": 33.8,
  "calibrating": false,
  "related_sleep_id": "xyz789",
  "raw_data_blob_ref": "s3://yhealth-raw/whoop/[user_id]/recovery/[timestamp].json"
}
```

**Sleep Mapping:**
```json
WHOOP Sleep → yHealth Sleep:
{
  "user_id": "[yHealth UUID]",
  "provider": "WHOOP",
  "entity_type": "sleep",
  "source_record_id": "[WHOOP sleep_id]",
  "start_time": "[ISO 8601]",
  "end_time": "[ISO 8601]",
  "duration_minutes": total_in_bed_time_milli / 60000,
  "sleep_quality_score": sleep_performance_percentage,  // 0-100
  "sleep_efficiency_percent": sleep_efficiency_percentage,
  "sleep_consistency_percent": sleep_consistency_percentage,
  "stages": {
    "awake_minutes": total_awake_time_milli / 60000,
    "light_minutes": total_light_sleep_time_milli / 60000,
    "deep_minutes": total_slow_wave_sleep_time_milli / 60000,
    "rem_minutes": total_rem_sleep_time_milli / 60000,
    "no_data_minutes": total_no_data_time_milli / 60000
  },
  "respiratory_rate_bpm": respiratory_rate,
  "sleep_need_minutes": sleep_needed.baseline_milli / 60000,
  "sleep_debt_minutes": sleep_needed.need_from_sleep_debt_milli / 60000,
  "is_nap": nap,
  "timezone_offset": timezone_offset
}
```

**Strain/Activity Mapping:**
```json
WHOOP Workout → yHealth Activity:
{
  "user_id": "[yHealth UUID]",
  "provider": "WHOOP",
  "entity_type": "workout",
  "source_record_id": "[WHOOP workout_id]",
  "start_time": "[ISO 8601]",
  "end_time": "[ISO 8601]",
  "duration_minutes": (end - start) / 60000,
  "activity_type": map_whoop_sport_id(sport_id),  // Map to yHealth taxonomy
  "strain_score": score.strain,  // 0-21 scale (WHOOP native)
  "strain_score_normalized": (score.strain / 21) * 100,  // 0-100 for cross-device comparison
  "calories_kcal": kilojoule / 4.184,
  "distance_meters": distance_meter,
  "altitude_gain_meters": altitude_gain_meter,
  "avg_heart_rate_bpm": average_heart_rate,
  "max_heart_rate_bpm": max_heart_rate,
  "heart_rate_zones": {
    "zone_0_minutes": zone_duration.zone_zero_milli / 60000,
    "zone_1_minutes": zone_duration.zone_one_milli / 60000,
    "zone_2_minutes": zone_duration.zone_two_milli / 60000,
    "zone_3_minutes": zone_duration.zone_three_milli / 60000,
    "zone_4_minutes": zone_duration.zone_four_milli / 60000,
    "zone_5_minutes": zone_duration.zone_five_milli / 60000
  },
  "percent_recorded": percent_recorded
}
```

**WHOOP Sport ID Mapping (Sample):**
- 1: Running → yHealth: "running"
- 2: Cycling → yHealth: "cycling"
- 43: Strength Training → yHealth: "strength_training"
- 44: CrossFit → yHealth: "crossfit"
- 46: Yoga → yHealth: "yoga"
- [Full mapping table maintained in config]

### Golden Source Priority (WHOOP-Specific)

**When WHOOP data conflicts with other sources:**

| Metric Type | WHOOP Priority | Rationale |
|-------------|----------------|-----------|
| **Heart Rate** | Priority 1 (Golden Source) | WHOOP's continuous HR is more accurate than wrist-based devices |
| **Sleep** | Priority 1 (Golden Source) | WHOOP's dedicated sleep tracking with stage accuracy is superior |
| **Recovery/HRV** | Priority 1 (Golden Source) | WHOOP specializes in recovery metrics; no competition |
| **Strain** | Priority 1 (Golden Source) | WHOOP's proprietary strain algorithm is unique |
| **Activity/Steps** | Priority 3 (Lower) | WHOOP doesn't track steps; defer to Apple Health/Fitbit for steps |

**WHOOP Overrides:** Recovery score, HRV, strain score, sleep stages
**WHOOP Defers:** Steps, generic activity minutes (no step counter)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **OAuth token expired** | 401 Unauthorized | Auto-refresh with refresh_token; if fails, notify user | "WHOOP connection needs renewal. Reconnect in Settings." |
| **Rate limit hit (429)** | X-RateLimit-Remaining = 0 | Exponential backoff per Retry-After header; reduce sync cadence | Silent: Queue syncs, resume when limit resets |
| **WHOOP API outage (5xx)** | 3+ consecutive 5xx responses | Open circuit breaker; pause syncs for 30 min; retry | "WHOOP sync temporarily paused due to service issues. Retrying..." |
| **Missing data (>48h gap)** | No new records for 48h | Backfill request for gap period; alert user | "Missing WHOOP data from [date]. Ensure your WHOOP is charged and syncing." |
| **Schema change** | Unexpected fields or missing required fields | Quarantine to DLQ; log schema diff; alert eng | Silent: Process known fields; engineering reviews schema changes |
| **Duplicate records** | Same source_record_id + timestamp | Deduplicate via natural key; update if updated_at is newer | Silent: Idempotent upsert handles duplicates |
| **User revokes access** | 403 Forbidden or explicit webhook | Disable sync; preserve historical data; notify user | "WHOOP access revoked. Reconnect to continue syncing." |
| **Data quality issue** | HR <30 or >220 BPM, strain >21, recovery >100 | Flag record; apply to insights with caution; log anomaly | Silent: Use data but mark as potential outlier |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sync success rate | >98% | (Successful syncs / Total attempts) over 7 days |
| Sync latency (P95) | <15 minutes | Time from WHOOP data available to yHealth processed |
| OAuth connection completion | >90% | Users who initiate OAuth complete successfully |
| Data completeness | >95% | Users with WHOOP have ≥1 data point per day |
| Rate limit violations | <1% | Syncs that hit 429 rate limits |
| User satisfaction | 4.6/5 | In-app survey: "WHOOP integration works smoothly" |

### Acceptance Criteria

- [ ] OAuth 2.0 + PKCE flow completes successfully on iOS and Android
- [ ] All 7 WHOOP scopes granted and stored with user consent
- [ ] Access/refresh tokens encrypted with AWS Secrets Manager Managed HSM
- [ ] Backfill pulls 90 days of recovery, sleep, workout, cycle data on first connect
- [ ] Ongoing sync runs every 15-60 minutes based on user activity
- [ ] Data normalized to yHealth schema and stored in PostgreSQL + TimescaleDB
- [ ] Raw WHOOP JSON archived in encrypted blob storage (S3)
- [ ] Recovery score, HRV, RHR integrated into Physical Recovery Score (F5.3)
- [ ] Sleep data powers sleep tracking UI (F5.2) and sleep quality insights
- [ ] Strain scores feed into workout recommendations (F5.5) and load management (F5.6)
- [ ] Golden source priority: WHOOP overrides other sources for HR, sleep, recovery, strain
- [ ] Error handling: Token refresh, rate limits, API outages, schema changes
- [ ] User can disconnect WHOOP from Settings; tokens revoked and syncs stopped
- [ ] Compliance: All data treated as PHI; regional residency; DSR-ready
- [ ] Monitoring: Metrics for sync success, latency, rate limits, errors
- [ ] Alerts: >5% sync failures, token refresh failures, circuit breaker trips

### Cross-Pillar Connections

**To Fitness Pillar (E5):**
- F5.1 (Activity Tracking): Workout data, strain scores
- F5.2 (Sleep Tracking): Sleep duration, stages, quality, respiratory rate
- F5.3 (Recovery Monitoring): HRV, RHR, recovery score → Physical Recovery Score
- F5.5 (Workout Recommendations): Strain and recovery inform intensity
- F5.6 (Strain/Load Management): WHOOP strain score is primary input

**To Cross-Domain Intelligence (E8):**
- "Your WHOOP recovery is 30% higher on days you journal" (Fitness ↔ Wellbeing)
- "Best sleep (WHOOP) happens when you eat dinner before 7pm" (Fitness ↔ Nutrition)
- "WHOOP strain >15 correlates with lower mood next day" (Fitness ↔ Wellbeing)

**To Analytics Dashboard (E10):**
- Recovery/Strain/Sleep scores visualized in Three-Pillar Harmony View
- HRV trends in Readiness Score calculation
- WHOOP data feeds "What's Affecting What" correlation explorer

### Dependencies

- **E1 (Onboarding):** WHOOP connection prompted during setup
- **E4 (Mobile App):** OAuth redirect handling, Settings UI for disconnect
- **E5 (Fitness Pillar):** All fitness features consume WHOOP data
- **E8 (Cross-Domain Intelligence):** WHOOP data in correlation engine
- **E10 (Analytics Dashboard):** WHOOP metrics visualized
- **AWS Secrets Manager Managed HSM:** Token encryption
- **PostgreSQL + TimescaleDB:** Normalized data storage
- **AWS S3:** Raw data archival

### MVP Status
[X] MVP Core (Tier 1 - Critical)

### Technical Reference
See [WHOOP Integration Guide](../../technical-docs/api-integrations/WHOOP-Integration-Guide.md) for detailed implementation specifications, API v2 migration notes, and security requirements.

---

## F9.2: APPLE HEALTH INTEGRATION (TIER 1 - MVP CRITICAL)

### Description
Apple Health is a TIER 1 CRITICAL integration serving as the AGGREGATION HUB for iPhone users. Unlike dedicated devices, Apple Health combines data from Apple Watch, iPhone sensors, and third-party apps into a unified HealthKit store. This integration is essential for iOS users and provides broad coverage across all three pillars (Fitness, Nutrition, Wellbeing).

### User Story
As a **Holistic Health Seeker** (P1), I want yHealth to automatically pull my health data from Apple Health (which already aggregates my Apple Watch, iPhone, and other apps) so that I don't need to connect multiple devices separately and can get comprehensive insights from all my existing health tracking.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Auto-sync Apple Health data (steps, heart rate, workouts, sleep). View summary: "10,245 steps, 45 min active, 7h 15m sleep". No configuration needed. |
| **Deep** | Granular HealthKit data types selection, historical trends, cross-app data source visibility, manual priority overrides for conflicting sources, export Apple Health data. |

### Apple Health-Specific Data Types

**HealthKit Categories (yHealth Consumes):**

**Fitness & Activity:**
- Steps (HKQuantityTypeIdentifierStepCount)
- Distance (HKQuantityTypeIdentifierDistanceWalkingRunning)
- Flights climbed (HKQuantityTypeIdentifierFlightsClimbed)
- Active energy burned (HKQuantityTypeIdentifierActiveEnergyBurned)
- Basal energy burned (HKQuantityTypeIdentifierBasalEnergyBurned)
- Exercise minutes (HKQuantityTypeIdentifierAppleExerciseTime)
- Stand hours (HKCategoryTypeIdentifierAppleStandHour)
- Workouts (HKWorkoutType) - type, duration, calories, distance, HR zones
- Cycling distance (HKQuantityTypeIdentifierDistanceCycling)
- Swimming distance (HKQuantityTypeIdentifierDistanceSwimming)

**Heart Rate & Cardiovascular:**
- Heart rate (HKQuantityTypeIdentifierHeartRate) - continuous and spot checks
- Resting heart rate (HKQuantityTypeIdentifierRestingHeartRate)
- Heart rate variability (HKQuantityTypeIdentifierHeartRateVariabilitySDNN)
- Walking heart rate average (HKQuantityTypeIdentifierWalkingHeartRateAverage)
- VO2 Max (HKQuantityTypeIdentifierVO2Max)

**Sleep:**
- Sleep analysis (HKCategoryTypeIdentifierSleepAnalysis) - In Bed, Asleep, Awake, Core, Deep, REM
- Time in bed
- Time asleep

**Nutrition (if available from Apple Health apps):**
- Dietary energy (HKQuantityTypeIdentifierDietaryEnergyConsumed)
- Protein (HKQuantityTypeIdentifierDietaryProtein)
- Carbohydrates (HKQuantityTypeIdentifierDietaryCarbohydrates)
- Fat (HKQuantityTypeIdentifierDietaryFatTotal)
- Water (HKQuantityTypeIdentifierDietaryWater)

**Body Measurements:**
- Weight (HKQuantityTypeIdentifierBodyMass)
- Height (HKQuantityTypeIdentifierHeight)
- Body mass index (HKQuantityTypeIdentifierBodyMassIndex)
- Body fat percentage (HKQuantityTypeIdentifierBodyFatPercentage)

**Mindfulness (if available):**
- Mindful minutes (HKCategoryTypeIdentifierMindfulSession)

### Apple HealthKit Integration Architecture

**iOS HealthKit Framework (NOT OAuth-based):**
- Apple Health uses local HealthKit API (NOT REST API or OAuth)
- yHealth iOS app requests HealthKit permissions on-device
- Data accessed directly from user's local HealthKit database
- No server-to-server sync - data pulled by mobile app and uploaded to yHealth backend

**Permission Model:**
```swift
// Swift code in yHealth iOS app
import HealthKit

let healthStore = HKHealthStore()

// Define data types to read
let readTypes: Set<HKObjectType> = [
    HKObjectType.quantityType(forIdentifier: .stepCount)!,
    HKObjectType.quantityType(forIdentifier: .heartRate)!,
    HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
    HKObjectType.workoutType(),
    HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!,
    // ... all other HealthKit types yHealth needs
]

// Request authorization (iOS shows native permission dialog)
healthStore.requestAuthorization(toShare: nil, read: readTypes) { success, error in
    if success {
        // Start background sync
        startHealthKitSync()
    }
}
```

**Sync Strategy (iOS App to yHealth Backend):**

1. **Initial Backfill:**
   - On first authorization, query 90 days of historical data
   - Batch upload to yHealth backend (encrypted HTTPS)
   - Data types: Steps, workouts, heart rate, sleep, nutrition (if available)

2. **Background Sync:**
   - Use HKObserverQuery to listen for HealthKit updates
   - Trigger background sync when new data detected
   - Upload incremental changes to yHealth backend every 15-60 minutes
   - iOS background execution limits: Sync when app is in background (limited) or foreground

3. **Data Upload Format:**
   ```json
   POST /api/v1/integrations/apple-health/sync
   Headers: Authorization: Bearer [yHealth access token]
   Body: {
     "user_id": "[yHealth UUID]",
     "provider": "AppleHealth",
     "device_info": {
       "source": "iPhone 15 Pro", // HKSource name
       "os_version": "iOS 18.0"
     },
     "data_points": [
       {
         "type": "steps",
         "value": 1250,
         "unit": "count",
         "start_date": "2025-12-02T10:00:00Z",
         "end_date": "2025-12-02T11:00:00Z",
         "source": "Apple Watch Series 9",
         "uuid": "[HKSample UUID]"
       },
       {
         "type": "heart_rate",
         "value": 72,
         "unit": "bpm",
         "timestamp": "2025-12-02T10:30:15Z",
         "source": "Apple Watch Series 9",
         "uuid": "[HKSample UUID]"
       }
       // ... batch of data points
     ]
   }
   ```

4. **Deduplication:**
   - Use HKSample UUID as natural key to prevent duplicates
   - yHealth backend checks: (`provider=AppleHealth`, `sample_uuid`) exists → skip
   - Handle multiple sources within Apple Health (e.g., Apple Watch + Withings scale)

### Data Normalization Mapping

**Apple Health → yHealth Schema:**

**Steps Mapping:**
```json
HealthKit StepCount Sample:
{
  "uuid": "abc-def-ghi",
  "type": "HKQuantityTypeIdentifierStepCount",
  "value": 1250,
  "unit": "count",
  "startDate": "2025-12-02T10:00:00Z",
  "endDate": "2025-12-02T11:00:00Z",
  "source": "Apple Watch Series 9",
  "device": {
    "name": "Apple Watch",
    "model": "Watch6,1"
  }
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "AppleHealth",
  "entity_type": "steps",
  "source_record_id": "abc-def-ghi",
  "timestamp": "2025-12-02T10:00:00Z",
  "value": 1250,
  "unit": "count",
  "duration_minutes": 60,
  "device_source": "Apple Watch Series 9",
  "raw_data_blob_ref": "s3://yhealth-raw/applehealth/[user_id]/steps/[timestamp].json"
}
```

**Heart Rate Mapping:**
```json
HealthKit HeartRate Sample → yHealth:
{
  "user_id": "[yHealth UUID]",
  "provider": "AppleHealth",
  "entity_type": "heart_rate",
  "source_record_id": "[HKSample UUID]",
  "timestamp": "2025-12-02T10:30:15Z",
  "heart_rate_bpm": 72,
  "measurement_type": "continuous",  // vs "resting"
  "device_source": "Apple Watch Series 9"
}
```

**Workout Mapping:**
```json
HealthKit Workout Sample:
{
  "uuid": "workout-xyz",
  "workoutActivityType": "HKWorkoutActivityTypeRunning",
  "duration": 1800,  // seconds
  "totalDistance": 5000,  // meters
  "totalEnergyBurned": 350,  // kcal
  "startDate": "2025-12-02T07:00:00Z",
  "endDate": "2025-12-02T07:30:00Z",
  "source": "Apple Watch",
  "heartRateData": [/* HR samples during workout */]
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "AppleHealth",
  "entity_type": "workout",
  "source_record_id": "workout-xyz",
  "start_time": "2025-12-02T07:00:00Z",
  "end_time": "2025-12-02T07:30:00Z",
  "duration_minutes": 30,
  "activity_type": map_healthkit_workout_type("HKWorkoutActivityTypeRunning"),  // → "running"
  "distance_meters": 5000,
  "calories_kcal": 350,
  "avg_heart_rate_bpm": calculate_avg(heartRateData),
  "max_heart_rate_bpm": max(heartRateData),
  "device_source": "Apple Watch"
}
```

**Sleep Mapping:**
```json
HealthKit Sleep Analysis:
{
  "samples": [
    {"value": "HKCategoryValueSleepAnalysisAsleepCore", "startDate": "...", "endDate": "..."},
    {"value": "HKCategoryValueSleepAnalysisAsleepDeep", "startDate": "...", "endDate": "..."},
    {"value": "HKCategoryValueSleepAnalysisAsleepREM", "startDate": "...", "endDate": "..."},
    {"value": "HKCategoryValueSleepAnalysisAwake", "startDate": "...", "endDate": "..."}
  ]
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "AppleHealth",
  "entity_type": "sleep",
  "source_record_id": "[Composite sleep session ID]",
  "start_time": "[First sleep sample start]",
  "end_time": "[Last sleep sample end]",
  "duration_minutes": total_time_in_bed,
  "sleep_quality_score": calculate_quality_score(samples),  // yHealth algorithm
  "stages": {
    "awake_minutes": sum_duration("Awake"),
    "light_minutes": sum_duration("AsleepCore"),  // Apple's "Core" = Light
    "deep_minutes": sum_duration("AsleepDeep"),
    "rem_minutes": sum_duration("AsleepREM")
  },
  "device_source": "Apple Watch"
}
```

**HealthKit Workout Type Mapping (Sample):**
- HKWorkoutActivityTypeRunning → "running"
- HKWorkoutActivityTypeCycling → "cycling"
- HKWorkoutActivityTypeSwimming → "swimming"
- HKWorkoutActivityTypeYoga → "yoga"
- HKWorkoutActivityTypeFunctionalStrengthTraining → "strength_training"
- [Full mapping maintained in config]

### Golden Source Priority (Apple Health-Specific)

**When Apple Health conflicts with other sources:**

| Metric Type | Apple Health Priority | Rationale |
|-------------|----------------------|-----------|
| **Steps** | Priority 1 (Golden Source for iPhone users) | Apple Health aggregates iPhone + Watch; most comprehensive for iOS |
| **Activity Minutes** | Priority 1 (iOS users) | Apple's active energy + exercise time is accurate for iOS ecosystem |
| **Heart Rate** | Priority 2 (Lower than WHOOP) | Apple Watch HR is good but WHOOP's continuous monitoring is more accurate |
| **Sleep** | Priority 2-3 (Lower than WHOOP/Oura) | Apple Watch sleep is basic; WHOOP/Oura specialize in sleep |
| **Workouts** | Priority 1 (iOS users without WHOOP) | Apple Watch workout tracking is excellent; use unless WHOOP available |

**Apple Health Overrides:** Steps, generic activity, workouts (for non-WHOOP users)
**Apple Health Defers:** Sleep (to WHOOP/Oura), HRV/Recovery (to WHOOP)

### Sync Architecture (Mobile-to-Backend)

**iOS App Responsibilities:**
1. Request HealthKit permissions (native iOS dialog)
2. Query HealthKit database (HKHealthStore)
3. Batch and upload data to yHealth backend
4. Handle background updates (HKObserverQuery)
5. Manage sync state (last sync timestamp per data type)

**yHealth Backend Responsibilities:**
1. Receive Apple Health data via REST API
2. Validate and authenticate requests (user JWT token)
3. Deduplicate via HKSample UUID
4. Normalize to yHealth schema
5. Archive raw HealthKit JSON
6. Apply golden source priority rules
7. Trigger insight generation

**Sync Frequency:**
- **Foreground:** Immediate sync when app is active and new HealthKit data detected
- **Background:** iOS allows limited background execution; sync when app wakes (15-60 min intervals realistic)
- **Daily reconciliation:** Full HealthKit query at 4 AM local time (when app is likely foreground for morning check-in)

**Error Handling:**

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **HealthKit permission denied** | HKHealthStore authorization status = .denied | Show permission explanation; deep link to Settings | "yHealth needs Apple Health access to sync your data. Enable in Settings > Privacy > Health." |
| **iOS background sync limits** | Background task expired | Resume sync when app returns to foreground | Silent: Queue data for next foreground session |
| **Data upload failure (network)** | HTTP timeout or 5xx error | Retry with exponential backoff; persist locally | Silent: Retry automatically; show "Syncing..." indicator |
| **Duplicate HKSample UUID** | Backend detects existing UUID | Skip duplicate (idempotent) | Silent: No user impact |
| **Conflicting sources within Apple Health** | Multiple apps write same metric (e.g., Fitbit app + Apple Watch for steps) | Apply HealthKit's source priority (most recent/highest priority source) | Silent: Use HealthKit's resolution |
| **Missing data types** | User grants partial permissions | Sync available types only; prompt for additional | "Some data types unavailable. Grant access to Steps, Heart Rate for full insights." |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| HealthKit permission grant rate | >85% | Users who complete authorization successfully |
| Sync completeness (iOS users) | >90% | Users with ≥1 data point per day from Apple Health |
| Upload success rate | >95% | Successful uploads to yHealth backend / total attempts |
| Sync latency (foreground) | <5 minutes | Time from HealthKit update to yHealth processed |
| Data accuracy | >98% | Spot-checks of Apple Health data vs yHealth display |
| User satisfaction | 4.5/5 | In-app survey: "Apple Health sync works smoothly" |

### Acceptance Criteria

- [ ] yHealth iOS app requests HealthKit permissions for all required data types
- [ ] Native iOS permission dialog explains why each data type is needed
- [ ] Backfill pulls 90 days of steps, heart rate, workouts, sleep on first authorization
- [ ] Background sync triggers when new HealthKit data is available (HKObserverQuery)
- [ ] Foreground sync runs immediately when app is active
- [ ] Data uploaded to yHealth backend with HKSample UUIDs for deduplication
- [ ] Backend normalizes Apple Health data to yHealth schema
- [ ] Raw HealthKit JSON archived in encrypted blob storage
- [ ] Steps and activity data feed into Fitness Pillar (E5)
- [ ] Sleep data integrated with Sleep Tracking (F5.2)
- [ ] Heart rate data used in Recovery Monitoring (F5.3) when WHOOP unavailable
- [ ] Workouts power Workout Recommendations (F5.5)
- [ ] Golden source priority: Apple Health is primary for steps/activity for iOS users
- [ ] Error handling: Permission denials, background limits, upload failures
- [ ] User can view Apple Health sync status in Settings
- [ ] Compliance: All data treated as PHI; regional residency; DSR-ready
- [ ] Monitoring: Track permission grant rate, sync success, data completeness

### Cross-Pillar Connections

**To Fitness Pillar (E5):**
- F5.1 (Activity Tracking): Steps, active minutes, workouts
- F5.2 (Sleep Tracking): Sleep duration and stages
- F5.3 (Recovery Monitoring): Heart rate variability (HRV), resting HR
- F5.5 (Workout Recommendations): Apple Watch workout data

**To Nutrition Pillar (E6):**
- Dietary energy, macros (if user logs in Apple Health-connected apps)
- Water intake (if logged in Apple Health)

**To Wellbeing Pillar (E7):**
- Mindful minutes (if user tracks meditation in Apple Health)

**To Cross-Domain Intelligence (E8):**
- "Your Apple Watch shows better sleep on days with 10k+ steps" (Fitness ↔ Fitness)
- "Heart rate spikes correlate with low mood ratings" (Fitness ↔ Wellbeing)

**To Analytics Dashboard (E10):**
- Steps, activity, and sleep visualized in Three-Pillar Harmony View
- Apple Health data in "What's Affecting What" explorer

### Dependencies

- **E1 (Onboarding):** Apple Health permission prompt during iOS setup
- **E4 (Mobile App - iOS):** HealthKit integration code, background sync, permission UI
- **E5 (Fitness Pillar):** Consumes Apple Health activity and sleep data
- **E8 (Cross-Domain Intelligence):** Apple Health data in correlation engine
- **E10 (Analytics Dashboard):** Visualizes Apple Health metrics
- **yHealth Backend API:** Receives and processes Apple Health uploads

### MVP Status
[X] MVP Core (Tier 1 - Critical for iOS users)

### Platform Note
**iOS Only:** Apple Health integration is exclusive to iOS. Android users will use Google Fit (F9.3) as the aggregation hub. No Android HealthKit equivalent exists.

---

## F9.3: GOOGLE FIT INTEGRATION (TIER 1 - MVP CRITICAL)

### Description
Google Fit is a TIER 1 CRITICAL integration serving as the AGGREGATION HUB for Android users (equivalent to Apple Health for iOS). Google Fit aggregates data from Android devices, Wear OS watches, and third-party fitness apps, providing broad health data coverage across fitness and basic wellbeing metrics.

### User Story
As a **Busy Professional** (P2) using Android, I want yHealth to automatically pull my health data from Google Fit (which already combines my Wear OS watch, phone sensors, and fitness apps) so that I can get comprehensive health insights without connecting every app separately.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Auto-sync Google Fit data (steps, heart rate, activities, sleep). View summary: "9,856 steps, 38 active mins, 7h 22m sleep". No manual setup. |
| **Deep** | Granular data source management, historical trends across all Fit data types, cross-app source visibility, manual data entry for gaps, export Google Fit data. |

### Google Fit-Specific Data Types

**Google Fit Data Sources (yHealth Consumes):**

**Activity & Fitness:**
- Steps (com.google.step_count.delta)
- Distance (com.google.distance.delta)
- Active minutes (com.google.active_minutes)
- Calories expended (com.google.calories.expended)
- Heart points (Google's activity intensity metric)
- Move minutes (any movement, not just active)
- Speed (com.google.speed)
- Cycling distance (com.google.cycling.distance)
- Walking distance (com.google.walking.distance)
- Running distance (com.google.running.distance)

**Heart Rate & Vitals:**
- Heart rate (com.google.heart_rate.bpm)
- Resting heart rate (com.google.heart_rate.resting)
- Heart rate variability (com.google.heart_rate.variability) - if available

**Sleep:**
- Sleep segments (com.google.sleep.segment) - In bed, Light sleep, Deep sleep, REM, Awake
- Sleep duration

**Workouts/Sessions:**
- Activity segments (com.google.activity.segment) - running, cycling, walking, strength training, yoga, etc.
- Workout sessions with duration, calories, distance, HR data

**Body Measurements:**
- Weight (com.google.weight)
- Height (com.google.height)
- Body fat percentage (com.google.body.fat.percentage)

**Nutrition (if available from Fit-connected apps):**
- Calories consumed (com.google.nutrition)
- Macronutrients (protein, carbs, fat)
- Hydration (com.google.hydration)

### Google Fit REST API Integration Architecture

**OAuth 2.0 + REST API (Server-to-Server):**
- Google Fit uses OAuth 2.0 for authorization
- yHealth backend accesses Google Fit REST API with user-granted tokens
- Data synced server-side (not mobile-to-backend like Apple Health)
- Supports Android, iOS (if user has Google Fit app), and Web

**OAuth 2.0 Scopes Required:**
```
https://www.googleapis.com/auth/fitness.activity.read
https://www.googleapis.com/auth/fitness.body.read
https://www.googleapis.com/auth/fitness.heart_rate.read
https://www.googleapis.com/auth/fitness.location.read (for workout routes - optional)
https://www.googleapis.com/auth/fitness.nutrition.read
https://www.googleapis.com/auth/fitness.sleep.read
```

**OAuth Flow (PKCE for Mobile):**
1. Mobile app initiates Google OAuth:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=[CLIENT_ID]&
     redirect_uri=[REDIRECT_URI]&
     response_type=code&
     scope=https://www.googleapis.com/auth/fitness.activity.read ...&
     state=[RANDOM_STATE]&
     code_challenge=[CODE_CHALLENGE]&
     code_challenge_method=S256&
     access_type=offline&
     prompt=consent
   ```
2. Google redirects to yHealth app with `code` and `state`
3. App relays `code` to yHealth backend
4. Backend exchanges code for tokens:
   ```
   POST https://oauth2.googleapis.com/token
   {
     "grant_type": "authorization_code",
     "code": "[CODE]",
     "code_verifier": "[CODE_VERIFIER]",
     "redirect_uri": "[REDIRECT_URI]",
     "client_id": "[CLIENT_ID]",
     "client_secret": "[CLIENT_SECRET]"
   }
   ```
5. Response includes `access_token`, `refresh_token`, `expires_in`
6. Store tokens server-side with envelope encryption

**Token Management:**
- Access token lifetime: 1 hour (Google standard)
- Refresh token: Long-lived (until revoked)
- Refresh flow: Automatic on expiry
- Storage: Envelope-encrypted (AWS Secrets Manager Managed HSM)
- Revocation: User disconnects = revoke tokens from Google

### Google Fit REST API Endpoints

**Base URL:** `https://www.googleapis.com/fitness/v1/users/me/`

**Key Endpoints:**

**1. Data Sources:**
```
GET /dataSources
Returns list of available data sources (e.g., phone step counter, watch HR sensor)
```

**2. Datasets (Aggregated Data):**
```
GET /dataSources/[DATA_SOURCE_ID]/datasets/[START_TIME_NANOS]-[END_TIME_NANOS]

Example: Get steps for a day
GET /dataSources/derived:com.google.step_count.delta:com.google.android.gms:estimated_steps/datasets/1701388800000000000-1701475200000000000
```

**3. Sessions (Workouts):**
```
GET /sessions?startTime=[ISO_8601]&endTime=[ISO_8601]
Returns workout sessions (activity type, duration, calories, etc.)
```

**4. Aggregate (Multi-Source Query):**
```
POST /dataset:aggregate
Body: {
  "aggregateBy": [
    {"dataTypeName": "com.google.step_count.delta"},
    {"dataTypeName": "com.google.heart_rate.bpm"}
  ],
  "bucketByTime": {"durationMillis": 86400000},  // 1 day buckets
  "startTimeMillis": 1701388800000,
  "endTimeMillis": 1701475200000
}

Returns aggregated data across all sources for specified data types
```

**Rate Limits:**
- Default: 10,000 requests per day per project (Google Cloud quota)
- Burst: 100 requests per 100 seconds per user
- Rate limit errors: 429 Too Many Requests
- Quota increase requests via Google Cloud Console

### Sync Architecture

**Backfill Strategy (First Connect):**
- Pull 90 days of historical data using aggregate API
- Data types: Steps, heart rate, activities, sleep, workouts, body measurements
- Batch requests: 7-day buckets to avoid API payload limits
- Rate limit aware: Throttle to stay under 100 req/100s

**Ongoing Sync Cadence:**
- **Active users:** Every 30 minutes (recently active in yHealth)
- **Standard users:** Every 2 hours (baseline for Google Fit)
- **Daily reconciliation:** Full aggregate query at 4 AM user local time
- **Entity priority:** Steps (hourly), Heart rate (hourly), Sleep (daily), Workouts (real-time)

**Cursor Management:**
- Per-user, per-data-type cursor based on `endTimeNanos`
- Cursors stored: `user_id`, `provider=GoogleFit`, `data_type`, `last_sync_timestamp_nanos`
- Idempotent upserts: Natural key = (`provider`, `provider_user_id`, `data_type`, `start_time_nanos`, `end_time_nanos`)

**Sync Pseudocode:**
```python
for user in users_with_google_fit_enabled:
    for data_type in ["steps", "heart_rate", "activity", "sleep"]:
        cursor = load_cursor(user.id, "GoogleFit", data_type)

        # Use aggregate API for efficiency
        request_body = {
            "aggregateBy": [{"dataTypeName": fit_data_type_mapping[data_type]}],
            "bucketByTime": {"durationMillis": 3600000},  # 1-hour buckets
            "startTimeMillis": cursor.last_sync_timestamp_nanos / 1000000,
            "endTimeMillis": now_millis()
        }

        response = google_fit_api.post(
            "/dataset:aggregate",
            headers={"Authorization": f"Bearer {decrypt_token(user.google_fit_access_token)}"},
            json=request_body
        )

        # Handle rate limits
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After", 60)
            backoff_with_jitter(retry_after)
            continue

        # Process buckets
        for bucket in response.json()["bucket"]:
            for dataset in bucket["dataset"]:
                for point in dataset["point"]:
                    # Archive raw JSON
                    archive_raw_blob(user.id, "GoogleFit", data_type, point)

                    # Normalize to yHealth schema
                    normalized = normalize_google_fit_point(data_type, point)

                    # Idempotent upsert
                    upsert_health_data(
                        user_id=user.id,
                        provider="GoogleFit",
                        data_type=data_type,
                        data=normalized,
                        natural_key=build_natural_key(normalized)
                    )

            # Update cursor to end of bucket
            update_cursor(user.id, "GoogleFit", data_type, bucket["endTimeMillis"] * 1000000)

        # Rate limit compliance
        respect_rate_limits(response.headers)
```

### Data Normalization Mapping

**Google Fit → yHealth Schema:**

**Steps Mapping:**
```json
Google Fit Aggregate Response:
{
  "bucket": [
    {
      "startTimeMillis": "1701388800000",
      "endTimeMillis": "1701392400000",
      "dataset": [
        {
          "dataSourceId": "derived:com.google.step_count.delta:...",
          "point": [
            {
              "startTimeNanos": "1701388800000000000",
              "endTimeNanos": "1701392400000000000",
              "dataTypeName": "com.google.step_count.delta",
              "value": [{"intVal": 1543}],
              "originDataSourceId": "raw:com.google.step_count.delta:Samsung:Galaxy Watch:..."
            }
          ]
        }
      ]
    }
  ]
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "GoogleFit",
  "entity_type": "steps",
  "source_record_id": hash("GoogleFit-steps-1701388800000000000"),
  "start_time": "2025-12-02T10:00:00.000Z",
  "end_time": "2025-12-02T11:00:00.000Z",
  "value": 1543,
  "unit": "count",
  "device_source": extract_device_name(originDataSourceId),  // "Samsung Galaxy Watch"
  "raw_data_blob_ref": "s3://yhealth-raw/googlefit/[user_id]/steps/[timestamp].json"
}
```

**Heart Rate Mapping:**
```json
Google Fit HR Point → yHealth:
{
  "startTimeNanos": "1701390000000000000",
  "endTimeNanos": "1701390000000000000",  // Same for instant measurement
  "dataTypeName": "com.google.heart_rate.bpm",
  "value": [{"fpVal": 72.5}],
  "originDataSourceId": "raw:com.google.heart_rate.bpm:Wear OS:..."
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "GoogleFit",
  "entity_type": "heart_rate",
  "source_record_id": hash("GoogleFit-hr-1701390000000000000"),
  "timestamp": "2025-12-02T10:20:00.000Z",
  "heart_rate_bpm": 72.5,
  "measurement_type": "continuous",
  "device_source": "Wear OS Watch"
}
```

**Workout/Session Mapping:**
```json
Google Fit Session:
{
  "id": "session_abc123",
  "name": "Morning Run",
  "description": "",
  "startTimeMillis": "1701388800000",
  "endTimeMillis": "1701390600000",
  "activityType": 8,  // Running (see activity type mapping)
  "application": {"packageName": "com.google.android.apps.fitness"},
  "activeTimeMillis": "1800000"
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "GoogleFit",
  "entity_type": "workout",
  "source_record_id": "session_abc123",
  "start_time": "2025-12-02T10:00:00.000Z",
  "end_time": "2025-12-02T10:30:00.000Z",
  "duration_minutes": 30,
  "activity_type": map_google_fit_activity_type(8),  // → "running"
  "active_minutes": 30,
  "calories_kcal": fetch_calories_for_session(session_id),  // Separate query
  "distance_meters": fetch_distance_for_session(session_id),
  "avg_heart_rate_bpm": fetch_avg_hr_for_session(session_id),
  "device_source": "Google Fit App"
}
```

**Sleep Mapping:**
```json
Google Fit Sleep Segment:
{
  "startTimeNanos": "1701388800000000000",
  "endTimeNanos": "1701418200000000000",
  "dataTypeName": "com.google.sleep.segment",
  "value": [{"intVal": 1}]  // 1=Awake, 2=Sleep(generic), 3=Out-of-bed, 4=Light, 5=Deep, 6=REM
}

Multiple sleep segments aggregated into one sleep session:

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "GoogleFit",
  "entity_type": "sleep",
  "source_record_id": hash("GoogleFit-sleep-1701388800000000000"),
  "start_time": "2025-12-01T22:00:00.000Z",
  "end_time": "2025-12-02T06:10:00.000Z",
  "duration_minutes": 490,
  "sleep_quality_score": calculate_quality_from_segments(segments),
  "stages": {
    "awake_minutes": sum_segments(value=1),
    "light_minutes": sum_segments(value=4),
    "deep_minutes": sum_segments(value=5),
    "rem_minutes": sum_segments(value=6),
    "unknown_minutes": sum_segments(value=2)  // Generic sleep
  },
  "device_source": extract_device(originDataSourceId)
}
```

**Google Fit Activity Type Mapping (Sample):**
- 1: Biking → "cycling"
- 8: Running → "running"
- 7: Walking → "walking"
- 10: Swimming → "swimming"
- 97: Strength training → "strength_training"
- 104: Yoga → "yoga"
- [Full mapping: https://developers.google.com/fit/rest/v1/reference/activity-types]

### Golden Source Priority (Google Fit-Specific)

**When Google Fit conflicts with other sources:**

| Metric Type | Google Fit Priority | Rationale |
|-------------|---------------------|-----------|
| **Steps** | Priority 1 (Golden Source for Android users) | Google Fit aggregates all Android sources; most comprehensive for Android |
| **Activity Minutes** | Priority 1 (Android users) | Google's move minutes and heart points are accurate for Android ecosystem |
| **Heart Rate** | Priority 2-3 (Lower than WHOOP/Apple Watch) | Wear OS HR is good but less accurate than dedicated devices |
| **Sleep** | Priority 3 (Lower than WHOOP/Oura/Apple Watch) | Google Fit sleep is basic; specialized devices are better |
| **Workouts** | Priority 2 (Android users without WHOOP) | Google Fit workout tracking is good; use unless WHOOP/dedicated app available |

**Google Fit Overrides:** Steps, generic activity (Android users only)
**Google Fit Defers:** Sleep (to WHOOP/Oura), HRV/Recovery (to WHOOP), detailed HR (to WHOOP)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **OAuth token expired** | 401 Unauthorized | Auto-refresh with refresh_token; if fails, notify user | "Google Fit connection needs renewal. Reconnect in Settings." |
| **Rate limit hit (429)** | 429 Too Many Requests | Exponential backoff per Retry-After header; reduce sync cadence | Silent: Queue syncs, resume when limit resets |
| **Google Fit API outage (5xx)** | 3+ consecutive 5xx responses | Open circuit breaker; pause syncs for 30 min; retry | "Google Fit sync temporarily paused due to service issues. Retrying..." |
| **Missing data (>48h gap)** | No new data for 48h | Backfill request for gap period; alert user | "Missing Google Fit data from [date]. Check your Fit app sync status." |
| **Quota exceeded** | Daily quota limit hit | Pause syncs until quota resets (midnight PT); alert eng | Silent: Resume syncs after quota reset; engineering reviews usage |
| **Schema change** | Unexpected fields or missing required fields | Quarantine to DLQ; log schema diff; alert eng | Silent: Process known fields; engineering reviews schema changes |
| **Duplicate records** | Same start/end time + data type | Deduplicate via natural key; update if newer timestamp | Silent: Idempotent upsert handles duplicates |
| **User revokes access** | 403 Forbidden or token revocation webhook | Disable sync; preserve historical data; notify user | "Google Fit access revoked. Reconnect to continue syncing." |
| **Data quality issue** | HR <30 or >220 BPM, steps >50k/day | Flag record; apply to insights with caution; log anomaly | Silent: Use data but mark as potential outlier |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sync success rate | >95% | (Successful syncs / Total attempts) over 7 days |
| Sync latency (P95) | <30 minutes | Time from Google Fit data available to yHealth processed |
| OAuth connection completion | >85% | Users who initiate OAuth complete successfully |
| Data completeness | >90% | Android users with Google Fit have ≥1 data point per day |
| Rate limit violations | <2% | Syncs that hit 429 rate limits |
| User satisfaction | 4.4/5 | In-app survey: "Google Fit integration works smoothly" |

### Acceptance Criteria

- [ ] OAuth 2.0 + PKCE flow completes successfully on Android and iOS (if Fit app installed)
- [ ] All Google Fit scopes granted and stored with user consent
- [ ] Access/refresh tokens encrypted with AWS Secrets Manager Managed HSM
- [ ] Backfill pulls 90 days of steps, heart rate, activities, sleep on first connect
- [ ] Ongoing sync runs every 30-120 minutes based on user activity
- [ ] Data normalized to yHealth schema and stored in PostgreSQL + TimescaleDB
- [ ] Raw Google Fit JSON archived in encrypted blob storage
- [ ] Steps and activity data feed into Fitness Pillar (E5)
- [ ] Sleep data integrated with Sleep Tracking (F5.2)
- [ ] Heart rate data used in Recovery Monitoring (F5.3) when WHOOP unavailable
- [ ] Workouts power Workout Recommendations (F5.5)
- [ ] Golden source priority: Google Fit is primary for steps/activity for Android users
- [ ] Error handling: Token refresh, rate limits, API outages, quota limits
- [ ] User can disconnect Google Fit from Settings; tokens revoked
- [ ] Compliance: All data treated as PHI; regional residency; DSR-ready
- [ ] Monitoring: Track sync success, latency, rate limits, errors
- [ ] Alerts: >5% sync failures, token refresh failures, quota approaching

### Cross-Pillar Connections

**To Fitness Pillar (E5):**
- F5.1 (Activity Tracking): Steps, active minutes, workouts
- F5.2 (Sleep Tracking): Sleep duration and segments
- F5.3 (Recovery Monitoring): Heart rate, resting HR (if available)
- F5.5 (Workout Recommendations): Google Fit workout/session data

**To Nutrition Pillar (E6):**
- Calories consumed (if user logs in Google Fit-connected apps)
- Hydration (if logged in Google Fit)

**To Cross-Domain Intelligence (E8):**
- "Your Google Fit shows higher heart points on days with better mood" (Fitness ↔ Wellbeing)
- "Sleep quality improves with 10k+ steps per day" (Fitness ↔ Fitness)

**To Analytics Dashboard (E10):**
- Steps, activity, and sleep visualized in Three-Pillar Harmony View
- Google Fit data in "What's Affecting What" explorer

### Dependencies

- **E1 (Onboarding):** Google Fit connection prompted during Android setup
- **E4 (Mobile App - Android):** OAuth redirect handling, Settings UI for disconnect
- **E5 (Fitness Pillar):** Consumes Google Fit activity and sleep data
- **E8 (Cross-Domain Intelligence):** Google Fit data in correlation engine
- **E10 (Analytics Dashboard):** Visualizes Google Fit metrics
- **yHealth Backend API:** REST API endpoints for Google Fit sync
- **AWS Secrets Manager:** Token encryption
- **Google Cloud Project:** OAuth client credentials, quota management

### MVP Status
[X] MVP Core (Tier 1 - Critical for Android users)

### Platform Note
**Cross-Platform:** Google Fit works on Android (primary), iOS (if Fit app installed), and Web. Android users are the primary audience for this integration.

---

## F9.4: FITBIT INTEGRATION (TIER 2 - MVP IMPORTANT)

### Description
Fitbit is a TIER 2 IMPORTANT integration providing comprehensive fitness tracking with strong sleep analysis, heart rate monitoring, and SpO2 capabilities. Fitbit users expect detailed activity tracking and sleep insights. This integration complements Tier 1 devices by adding coverage for Fitbit's large user base (est. 10-15% of fitness tracker market).

### User Story
As a **Holistic Health Seeker** (P1) using a Fitbit device, I want yHealth to automatically sync my Fitbit data (activity, sleep stages, heart rate, SpO2) so that I can leverage my existing Fitbit investment while gaining cross-domain insights connecting my physical metrics to mood and nutrition.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Auto-sync Fitbit data (steps, sleep, heart rate). View summary: "11,204 steps, 7h 45m sleep (85 score), Resting HR: 58 bpm". |
| **Deep** | Detailed Fitbit metrics (sleep stages, HR zones, SpO2, active zone minutes, VO2 Max), historical trends, device battery status, export Fitbit data. |

### Fitbit-Specific Data Types

**Activity & Fitness:**
- Steps (daily and intraday)
- Distance (daily total and intraday)
- Floors climbed
- Active zone minutes (Fitbit's intensity metric)
- Calories burned (basal + active)
- Activity types (tracked exercises with GPS if available)
- Elevation gain
- Sedentary minutes

**Heart Rate:**
- Continuous heart rate (intraday time series)
- Resting heart rate (daily)
- Heart rate variability (if device supports)
- Heart rate zones during activities
- Cardio fitness score (VO2 Max estimate)

**Sleep:**
- Sleep stages: Awake, Light, Deep, REM
- Sleep score (0-100)
- Sleep duration (time asleep vs. time in bed)
- Sleep efficiency
- Sleep schedule consistency
- Restlessness and awake count

**Body & Vitals:**
- Weight (if using Aria scale or manual entry)
- Body mass index (BMI)
- Body fat percentage (Aria scale)
- SpO2 (blood oxygen saturation) - if device supports

**Breathing & Wellness:**
- Breathing rate (during sleep)
- Skin temperature variation
- Stress management score (select devices)

### Fitbit Web API Integration Architecture

**OAuth 2.0 + REST API:**
- Fitbit uses OAuth 2.0 (Authorization Code Grant)
- yHealth backend accesses Fitbit Web API with user-granted tokens
- Data synced server-side
- Supports all Fitbit devices (trackers, smartwatches, scales)

**OAuth 2.0 Scopes Required:**
```
activity - Daily activity stats and activity log
heartrate - Heart rate time series and resting heart rate
sleep - Sleep logs and sleep stages
weight - Weight and body composition
profile - User profile (name, avatar, age, gender for calculations)
settings - User settings (units, locale)
nutrition - Food logs (if user logs in Fitbit app)
```

**OAuth Flow (PKCE):**
1. Mobile app initiates Fitbit OAuth:
   ```
   https://www.fitbit.com/oauth2/authorize?
     client_id=[CLIENT_ID]&
     redirect_uri=[REDIRECT_URI]&
     response_type=code&
     scope=activity heartrate sleep weight profile settings nutrition&
     state=[RANDOM_STATE]&
     code_challenge=[CODE_CHALLENGE]&
     code_challenge_method=S256
   ```
2. Fitbit redirects to yHealth app with `code` and `state`
3. App relays `code` to yHealth backend
4. Backend exchanges code for tokens:
   ```
   POST https://api.fitbit.com/oauth2/token
   {
     "grant_type": "authorization_code",
     "code": "[CODE]",
     "code_verifier": "[CODE_VERIFIER]",
     "redirect_uri": "[REDIRECT_URI]",
     "client_id": "[CLIENT_ID]"
   }
   Headers: Authorization: Basic [Base64(client_id:client_secret)]
   ```
5. Response: `access_token`, `refresh_token`, `expires_in` (8 hours)
6. Store tokens server-side with envelope encryption

**Token Management:**
- Access token lifetime: 8 hours (Fitbit standard)
- Refresh token: Valid until revoked
- Refresh flow: Automatic on expiry
- Storage: Envelope-encrypted (AWS Secrets Manager)
- Revocation: User disconnects = revoke from Fitbit

### Fitbit Web API Endpoints

**Base URL:** `https://api.fitbit.com/1/user/[user-id]/`

**Key Endpoints:**

**Activity:**
```
GET /activities/date/[date].json                    // Daily activity summary
GET /activities/steps/date/[date]/1d/[detail].json // Intraday steps (1min/15min)
GET /activities/distance/date/[date]/1d.json        // Distance
GET /activities/floors/date/[date]/1d.json          // Floors climbed
GET /activities/list.json?afterDate=[date]          // Activity log (workouts)
```

**Heart Rate:**
```
GET /activities/heart/date/[date]/1d/[detail].json  // Intraday HR (1sec/1min)
GET /activities/heart/date/[date]/7d.json           // 7-day resting HR
```

**Sleep:**
```
GET /sleep/date/[date].json                         // Sleep log for date
GET /sleep/list.json?afterDate=[date]&limit=100     // Sleep logs (paginated)
```

**Body:**
```
GET /body/log/weight/date/[date]/30d.json           // Weight logs
GET /body/log/fat/date/[date]/30d.json              // Body fat %
```

**SpO2:**
```
GET /spo2/date/[date].json                          // SpO2 summary for date
GET /spo2/date/[date]/all.json                      // Intraday SpO2
```

**Rate Limits:**
- Default: 150 requests/hour per user
- Rate limit header: `Fitbit-Rate-Limit-Remaining`
- 429 response when exceeded
- Retry-After header indicates seconds until reset

### Sync Architecture

**Backfill Strategy (First Connect):**
- Pull 90 days of historical data
- Entities: Activity (90d), Sleep (90d), Heart rate (30d intraday - more data-heavy), Weight (90d)
- Batch by day to stay under rate limits
- Intraday data: 1-minute detail for HR, 15-minute for activity (balance granularity vs. rate limits)

**Ongoing Sync Cadence:**
- **Active users:** Every 30 minutes (recently active in yHealth)
- **Standard users:** Every 2 hours (baseline)
- **Daily reconciliation:** Full day query at 4 AM user local time
- **Entity priority:** Activity (hourly), Heart rate (hourly), Sleep (morning), Weight (daily)

**Cursor Management:**
- Per-user, per-entity cursor based on date
- Cursors: `user_id`, `provider=Fitbit`, `entity_type`, `last_sync_date`
- Idempotent upserts: Natural key = (`provider`, `provider_user_id`, `entity_type`, `date` or `timestamp`)

**Sync Pseudocode:**
```python
for user in users_with_fitbit_enabled:
    for entity in ["activity", "heart_rate", "sleep", "weight"]:
        cursor = load_cursor(user.id, "Fitbit", entity)

        # Determine date range to sync
        start_date = cursor.last_sync_date + 1_day
        end_date = today()

        for date in date_range(start_date, end_date):
            # Fetch daily summary
            if entity == "activity":
                response = fitbit_api.get(
                    f"/activities/date/{date}.json",
                    headers={"Authorization": f"Bearer {decrypt_token(user.fitbit_access_token)}"}
                )

                # Also fetch intraday steps
                intraday_response = fitbit_api.get(
                    f"/activities/steps/date/{date}/1d/15min.json",
                    headers={"Authorization": f"Bearer {decrypt_token(user.fitbit_access_token)}"}
                )

            elif entity == "heart_rate":
                response = fitbit_api.get(
                    f"/activities/heart/date/{date}/1d/1min.json",
                    headers={"Authorization": f"Bearer {decrypt_token(user.fitbit_access_token)}"}
                )

            elif entity == "sleep":
                response = fitbit_api.get(
                    f"/sleep/date/{date}.json",
                    headers={"Authorization": f"Bearer {decrypt_token(user.fitbit_access_token)}"}
                )

            # Handle rate limits
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After", 3600)
                backoff_with_jitter(retry_after)
                continue

            # Archive raw JSON
            archive_raw_blob(user.id, "Fitbit", entity, date, response.json())

            # Normalize to yHealth schema
            normalized = normalize_fitbit_data(entity, response.json())

            # Idempotent upsert
            for record in normalized:
                upsert_health_data(
                    user_id=user.id,
                    provider="Fitbit",
                    entity_type=entity,
                    data=record,
                    natural_key=build_natural_key(record)
                )

            # Update cursor
            update_cursor(user.id, "Fitbit", entity, date)

            # Rate limit compliance
            check_rate_limit_headers(response.headers)
            sleep(1)  // Throttle requests to respect 150/hour limit
```

### Data Normalization Mapping

**Fitbit → yHealth Schema:**

**Activity Mapping:**
```json
Fitbit Daily Activity Summary:
{
  "summary": {
    "steps": 11204,
    "distance": 8.5,
    "floors": 12,
    "elevation": 36.576,
    "activeMinutes": 45,
    "sedentaryMinutes": 720,
    "lightlyActiveMinutes": 180,
    "fairlyActiveMinutes": 30,
    "veryActiveMinutes": 15,
    "caloriesOut": 2345
  }
}

Fitbit Intraday Steps:
{
  "activities-steps-intraday": {
    "dataset": [
      {"time": "10:00:00", "value": 234},
      {"time": "10:15:00", "value": 189},
      ...
    ]
  }
}

yHealth Normalized (Daily Summary):
{
  "user_id": "[yHealth UUID]",
  "provider": "Fitbit",
  "entity_type": "activity_summary",
  "source_record_id": hash("Fitbit-activity-2025-12-02"),
  "date": "2025-12-02",
  "steps": 11204,
  "distance_km": 8.5,
  "floors_climbed": 12,
  "elevation_meters": 36.576,
  "active_minutes": 45,
  "calories_kcal": 2345,
  "sedentary_minutes": 720,
  "lightly_active_minutes": 180,
  "fairly_active_minutes": 30,
  "very_active_minutes": 15
}

yHealth Normalized (Intraday Steps - stored separately for granularity):
{
  "user_id": "[yHealth UUID]",
  "provider": "Fitbit",
  "entity_type": "steps_intraday",
  "timestamp": "2025-12-02T10:00:00Z",
  "value": 234,
  "granularity": "15min"
}
```

**Heart Rate Mapping:**
```json
Fitbit Intraday HR:
{
  "activities-heart-intraday": {
    "dataset": [
      {"time": "10:30:00", "value": 72},
      {"time": "10:31:00", "value": 74},
      ...
    ]
  }
}

Fitbit Resting HR:
{
  "activities-heart": [
    {
      "dateTime": "2025-12-02",
      "value": {
        "restingHeartRate": 58
      }
    }
  ]
}

yHealth Normalized (Intraday):
{
  "user_id": "[yHealth UUID]",
  "provider": "Fitbit",
  "entity_type": "heart_rate",
  "timestamp": "2025-12-02T10:30:00Z",
  "heart_rate_bpm": 72,
  "measurement_type": "continuous"
}

yHealth Normalized (Resting HR):
{
  "user_id": "[yHealth UUID]",
  "provider": "Fitbit",
  "entity_type": "resting_heart_rate",
  "date": "2025-12-02",
  "resting_hr_bpm": 58
}
```

**Sleep Mapping:**
```json
Fitbit Sleep Log:
{
  "sleep": [
    {
      "logId": 123456789,
      "dateOfSleep": "2025-12-02",
      "startTime": "2025-12-01T22:30:00.000",
      "endTime": "2025-12-02T06:45:00.000",
      "duration": 29700000,  // milliseconds
      "minutesToFallAsleep": 10,
      "minutesAsleep": 465,
      "minutesAwake": 30,
      "timeInBed": 495,
      "efficiency": 94,
      "type": "stages",
      "levels": {
        "summary": {
          "deep": {"count": 2, "minutes": 95},
          "light": {"count": 12, "minutes": 280},
          "rem": {"count": 4, "minutes": 90},
          "wake": {"count": 8, "minutes": 30}
        },
        "data": [
          {"dateTime": "2025-12-01T22:40:00.000", "level": "light", "seconds": 1800},
          {"dateTime": "2025-12-01T23:10:00.000", "level": "deep", "seconds": 2700},
          ...
        ]
      }
    }
  ]
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "Fitbit",
  "entity_type": "sleep",
  "source_record_id": "123456789",
  "start_time": "2025-12-01T22:30:00.000Z",
  "end_time": "2025-12-02T06:45:00.000Z",
  "duration_minutes": 495,
  "sleep_quality_score": 94,  // Fitbit efficiency as quality proxy
  "sleep_efficiency_percent": 94,
  "minutes_to_fall_asleep": 10,
  "stages": {
    "awake_minutes": 30,
    "light_minutes": 280,
    "deep_minutes": 95,
    "rem_minutes": 90
  },
  "restlessness_count": 8,
  "sleep_type": "stages"  // vs "classic" for older devices
}
```

### Golden Source Priority (Fitbit-Specific)

**When Fitbit conflicts with other sources:**

| Metric Type | Fitbit Priority | Rationale |
|-------------|-----------------|-----------|
| **Steps** | Priority 2 (Lower than Apple Health/Google Fit for aggregation) | Fitbit is accurate but Apple/Google aggregate multiple sources |
| **Heart Rate** | Priority 2 (Lower than WHOOP, similar to Apple Watch) | Fitbit HR is good; WHOOP's continuous monitoring is better |
| **Sleep** | Priority 2 (Lower than WHOOP/Oura) | Fitbit sleep stages are good but WHOOP/Oura specialize in sleep |
| **SpO2** | Priority 1 (Golden Source if available) | Fitbit SpO2 is reliable; few competitors track this |
| **Activity Minutes** | Priority 2 (Use for Fitbit users) | Fitbit's active zone minutes are valuable but not priority over aggregators |

**Fitbit Overrides:** SpO2 (if available), active zone minutes (Fitbit-specific metric)
**Fitbit Defers:** Steps (to Apple Health/Google Fit), Sleep (to WHOOP/Oura), HRV/Recovery (to WHOOP)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **OAuth token expired** | 401 Unauthorized | Auto-refresh with refresh_token; if fails, notify user | "Fitbit connection needs renewal. Reconnect in Settings." |
| **Rate limit hit (429)** | Fitbit-Rate-Limit-Remaining = 0 | Backoff per Retry-After header (usually 1 hour); reduce sync cadence | Silent: Queue syncs, resume when limit resets |
| **Fitbit API outage (5xx)** | 3+ consecutive 5xx responses | Open circuit breaker; pause syncs for 30 min; retry | "Fitbit sync temporarily paused due to service issues. Retrying..." |
| **Missing data (>48h gap)** | No new sleep/activity for 48h | Backfill request for gap period; alert user | "Missing Fitbit data from [date]. Ensure your Fitbit is syncing to the Fitbit app." |
| **Device not syncing** | Fitbit API returns no recent data | Notify user to sync Fitbit device | "Your Fitbit hasn't synced recently. Open the Fitbit app to sync." |
| **Schema change** | Unexpected fields or missing sleep stages | Quarantine to DLQ; log diff; alert eng | Silent: Process available fields; engineering reviews |
| **Duplicate sleep logs** | Multiple sleep entries for same date | Keep entry with highest efficiency; flag duplicates | Silent: Deduplicate automatically |
| **User revokes access** | 403 Forbidden or revocation webhook | Disable sync; preserve historical data; notify user | "Fitbit access revoked. Reconnect to continue syncing." |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sync success rate | >93% | (Successful syncs / Total attempts) over 7 days |
| Sync latency (P95) | <2 hours | Time from Fitbit data available to yHealth processed |
| OAuth connection completion | >80% | Users who initiate OAuth complete successfully |
| Data completeness | >88% | Users with Fitbit have ≥1 data point per day |
| Rate limit violations | <5% | Syncs that hit 429 rate limits (higher tolerance due to 150/hr limit) |
| User satisfaction | 4.3/5 | In-app survey: "Fitbit integration works smoothly" |

### Acceptance Criteria

- [ ] OAuth 2.0 + PKCE flow completes successfully on iOS and Android
- [ ] All Fitbit scopes granted and stored with user consent
- [ ] Access/refresh tokens encrypted with AWS Secrets Manager Managed HSM
- [ ] Backfill pulls 90 days of activity, sleep, heart rate, weight on first connect
- [ ] Ongoing sync runs every 30-120 minutes based on user activity
- [ ] Data normalized to yHealth schema and stored in PostgreSQL + TimescaleDB
- [ ] Raw Fitbit JSON archived in encrypted blob storage
- [ ] Steps and activity data feed into Fitness Pillar (E5)
- [ ] Sleep stages integrated with Sleep Tracking (F5.2)
- [ ] Heart rate data used in Recovery Monitoring (F5.3)
- [ ] SpO2 data stored and visualized (if device supports)
- [ ] Active zone minutes mapped to yHealth activity intensity
- [ ] Golden source priority: Fitbit defers to WHOOP/Oura for sleep, to aggregators for steps
- [ ] Error handling: Token refresh, rate limits, API outages
- [ ] User can disconnect Fitbit from Settings; tokens revoked
- [ ] Compliance: All data treated as PHI; regional residency; DSR-ready
- [ ] Monitoring: Track sync success, latency, rate limits, errors
- [ ] Alerts: >7% sync failures, token refresh failures

### Cross-Pillar Connections

**To Fitness Pillar (E5):**
- F5.1 (Activity Tracking): Steps, active zone minutes, workouts
- F5.2 (Sleep Tracking): Sleep stages, efficiency, duration
- F5.3 (Recovery Monitoring): Resting HR, sleep quality
- F5.5 (Workout Recommendations): Activity intensity data

**To Cross-Domain Intelligence (E8):**
- "Your Fitbit sleep score is 15 points higher after evening journaling" (Fitness ↔ Wellbeing)
- "Active zone minutes correlate with better mood next day" (Fitness ↔ Wellbeing)

**To Analytics Dashboard (E10):**
- Sleep stages, activity, and HR visualized in Three-Pillar Harmony View
- Fitbit data in "What's Affecting What" explorer

### Dependencies

- **E1 (Onboarding):** Fitbit connection prompted during setup
- **E4 (Mobile App):** OAuth redirect handling, Settings UI
- **E5 (Fitness Pillar):** Consumes Fitbit activity and sleep data
- **E8 (Cross-Domain Intelligence):** Fitbit data in correlation engine
- **E10 (Analytics Dashboard):** Visualizes Fitbit metrics
- **AWS Secrets Manager:** Token encryption
- **Fitbit Developer Account:** OAuth client credentials

### MVP Status
[X] MVP Core (Tier 2 - Important, launch week priority)

---

## F9.5: GARMIN INTEGRATION (TIER 2 - MVP IMPORTANT)

### Description
Garmin is a TIER 2 IMPORTANT integration providing elite activity tracking, advanced training metrics, and Body Battery energy monitoring. Garmin users are serious athletes and fitness enthusiasts who expect detailed performance analytics. This integration adds coverage for Garmin's dedicated user base (est. 5-10% of fitness tracker market, skewed toward endurance athletes).

### User Story
As an **Optimization Enthusiast** (P3) using a Garmin device, I want yHealth to automatically sync my Garmin data (activities, Body Battery, stress, sleep, training status) so that I can combine Garmin's elite training insights with yHealth's cross-domain intelligence connecting my performance to nutrition and wellbeing.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Auto-sync Garmin data (steps, activities, Body Battery). View summary: "12,567 steps, Body Battery: 75, Stress: Low, 7h 18m sleep". |
| **Deep** | Detailed Garmin metrics (training status, VO2 Max, lactate threshold, FTP, stress details, respiration, advanced sleep metrics), historical trends, device settings, export Garmin data. |

### Garmin-Specific Data Types

**Activity & Training:**
- Steps (daily and intraday)
- Distance (daily and per-activity)
- Floors climbed
- Active calories and total calories
- Intensity minutes (moderate + vigorous)
- Activities (runs, rides, swims, strength, etc.) with GPS tracks
- Training status (productive, maintaining, peaking, etc.)
- Training load (acute and chronic)
- Recovery time recommendation
- VO2 Max estimate
- Lactate threshold (for running/cycling)
- Functional threshold power (FTP) for cycling
- Race predictor times

**Heart Rate & Cardiovascular:**
- Continuous heart rate (all-day monitoring)
- Resting heart rate (daily)
- Heart rate variability (HRV stress)
- Heart rate zones during activities
- Abnormal heart rate alerts

**Body Battery & Stress:**
- Body Battery (Garmin's proprietary energy level metric, 0-100)
- Stress score (0-100, lower is better)
- All-day stress tracking
- Relaxation reminders

**Sleep:**
- Sleep duration (light, deep, REM, awake)
- Sleep score (0-100)
- Respiration rate during sleep
- Pulse oximetry (SpO2) during sleep
- Sleep insights (movement, stress during sleep)

**Body Measurements:**
- Weight (Garmin Index scale or manual)
- Body composition (body fat %, muscle mass, bone mass, water %)
- BMI

**Respiration & Vitals:**
- Respiration rate (breaths per minute)
- Pulse oximetry (SpO2)
- Menstrual cycle tracking (select devices)

### Garmin Health API Integration Architecture

**OAuth 2.0 + REST API:**
- Garmin uses OAuth 1.0a (legacy) or OAuth 2.0 (newer)
- yHealth will use OAuth 2.0 for modern devices
- Data synced server-side via Garmin Health API
- Requires Garmin Developer Program enrollment

**OAuth 2.0 Scopes Required:**
```
activities - Daily activity summaries and activity files
sleep - Sleep data and sleep stages
heart_rate - Heart rate time series
stress - Stress and Body Battery data
weight - Weight and body composition
profile - User profile (age, gender, height)
```

**OAuth Flow (PKCE):**
1. Mobile app initiates Garmin OAuth:
   ```
   https://connect.garmin.com/oauthConfirm?
     oauth_consumer_key=[CONSUMER_KEY]&
     oauth_callback=[REDIRECT_URI]
   ```
   (Note: Garmin OAuth 1.0a flow - simplified for clarity; OAuth 2.0 flow similar to other integrations)

2. Garmin redirects to yHealth app with `oauth_token` and `oauth_verifier`
3. App relays tokens to yHealth backend
4. Backend exchanges for access token
5. Store tokens server-side with envelope encryption

**Token Management:**
- Access token lifetime: Long-lived (Garmin tokens don't expire unless revoked)
- No refresh token required (OAuth 1.0a model)
- Storage: Envelope-encrypted (AWS Secrets Manager)
- Revocation: User disconnects = revoke from Garmin

### Garmin Health API Endpoints

**Base URL:** `https://apis.garmin.com/wellness-api/rest/`

**Key Endpoints:**

**Daily Summaries:**
```
GET /dailies?uploadStartTimeInSeconds=[timestamp]&uploadEndTimeInSeconds=[timestamp]
Returns daily activity summaries (steps, calories, distance, active minutes, etc.)
```

**Activities:**
```
GET /activities?uploadStartTimeInSeconds=[timestamp]&uploadEndTimeInSeconds=[timestamp]
Returns activity summaries (workouts with GPS, HR, calories, etc.)

GET /activityDetails?summaryId=[id]
Returns detailed activity data (HR zones, splits, cadence, power, etc.)

GET /activityFile?summaryId=[id]
Returns FIT file (binary format with full activity data)
```

**Sleep:**
```
GET /sleeps?uploadStartTimeInSeconds=[timestamp]&uploadEndTimeInSeconds=[timestamp]
Returns sleep summaries (duration, stages, score)
```

**Heart Rate:**
```
GET /epochs?summaryId=[daily_summary_id]
Returns intraday heart rate (15-min epochs)
```

**Body Battery & Stress:**
```
GET /stressDetails?uploadStartTimeInSeconds=[timestamp]&uploadEndTimeInSeconds=[timestamp]
Returns stress and Body Battery data
```

**Body Composition:**
```
GET /bodyComps?uploadStartTimeInSeconds=[timestamp]&uploadEndTimeInSeconds=[timestamp]
Returns weight and body composition data
```

**Rate Limits:**
- Default: Varies by endpoint (typically 100-200 requests/hour per user)
- Garmin recommends backfill once, then poll daily
- Rate limit headers: Garmin-specific (check documentation)
- 429 response when exceeded

**Data Push (Alternative to Polling):**
- Garmin offers webhook "Daily Data Push" where Garmin pushes new data to yHealth
- Recommended for production to reduce polling overhead
- Requires webhook endpoint and signature verification

### Sync Architecture

**Backfill Strategy (First Connect):**
- Pull 90 days of historical data
- Entities: Dailies (90d), Activities (90d), Sleep (90d), Body Battery/Stress (30d), Weight (90d)
- Sequential daily requests to avoid rate limits
- FIT file downloads for activities (optional, for advanced users)

**Ongoing Sync Cadence:**
- **Polling mode:**
  - Daily summaries: Once per day at 6 AM user local time
  - Activities: Every 2 hours (to catch new workouts)
  - Sleep: Once per day at 9 AM user local time
  - Stress/Body Battery: Once per day at noon
- **Webhook mode (preferred):**
  - Garmin pushes new data to yHealth webhook endpoint
  - yHealth processes immediately upon receipt
  - Fallback daily poll to catch missed pushes

**Cursor Management:**
- Per-user, per-entity cursor based on `uploadStartTimeInSeconds`
- Cursors: `user_id`, `provider=Garmin`, `entity_type`, `last_sync_timestamp`
- Idempotent upserts: Natural key = (`provider`, `provider_user_id`, `entity_type`, `summary_id` or `timestamp`)

**Sync Pseudocode (Polling Mode):**
```python
for user in users_with_garmin_enabled:
    for entity in ["dailies", "activities", "sleep", "stress"]:
        cursor = load_cursor(user.id, "Garmin", entity)

        # Calculate time range (Garmin uses Unix timestamps)
        start_timestamp = cursor.last_sync_timestamp
        end_timestamp = now_unix_timestamp()

        # Fetch data
        if entity == "dailies":
            response = garmin_api.get(
                "/dailies",
                params={
                    "uploadStartTimeInSeconds": start_timestamp,
                    "uploadEndTimeInSeconds": end_timestamp
                },
                headers={"Authorization": f"Bearer {decrypt_token(user.garmin_access_token)}"}
            )

        elif entity == "activities":
            response = garmin_api.get(
                "/activities",
                params={
                    "uploadStartTimeInSeconds": start_timestamp,
                    "uploadEndTimeInSeconds": end_timestamp
                },
                headers={"Authorization": f"Bearer {decrypt_token(user.garmin_access_token)}"}
            )

            # For each activity, optionally fetch detailed data
            for activity in response.json():
                detail_response = garmin_api.get(
                    "/activityDetails",
                    params={"summaryId": activity["summaryId"]},
                    headers={"Authorization": f"Bearer {decrypt_token(user.garmin_access_token)}"}
                )
                archive_raw_blob(user.id, "Garmin", "activity_detail", detail_response.json())

        elif entity == "sleep":
            response = garmin_api.get(
                "/sleeps",
                params={
                    "uploadStartTimeInSeconds": start_timestamp,
                    "uploadEndTimeInSeconds": end_timestamp
                },
                headers={"Authorization": f"Bearer {decrypt_token(user.garmin_access_token)}"}
            )

        # Handle rate limits
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After", 3600)
            backoff_with_jitter(retry_after)
            continue

        # Archive raw JSON
        archive_raw_blob(user.id, "Garmin", entity, response.json())

        # Normalize to yHealth schema
        normalized_records = normalize_garmin_data(entity, response.json())

        # Idempotent upsert
        for record in normalized_records:
            upsert_health_data(
                user_id=user.id,
                provider="Garmin",
                entity_type=entity,
                data=record,
                natural_key=build_natural_key(record)
            )

        # Update cursor to latest upload timestamp
        if response.json():
            latest_timestamp = max(item["uploadTimestamp"] for item in response.json())
            update_cursor(user.id, "Garmin", entity, latest_timestamp)

        # Rate limit compliance
        sleep(2)  // Throttle between requests
```

**Webhook Mode (Preferred for Production):**
```python
@app.post("/webhooks/garmin/daily-push")
async def garmin_daily_push(request: Request):
    # Verify Garmin signature (HMAC)
    signature = request.headers.get("X-Garmin-Signature")
    payload = await request.body()

    if not verify_garmin_signature(signature, payload, GARMIN_WEBHOOK_SECRET):
        return {"error": "Invalid signature"}, 401

    # Parse payload
    data = json.loads(payload)
    user_access_token = data.get("userAccessToken")  // Garmin identifier

    # Fetch user from yHealth DB
    user = get_user_by_garmin_token(user_access_token)

    # Trigger sync for this user (Garmin pushed new data)
    queue_garmin_sync(user.id, entities=["dailies", "activities", "sleep", "stress"])

    return {"status": "accepted"}, 200
```

### Data Normalization Mapping

**Garmin → yHealth Schema:**

**Daily Summary Mapping:**
```json
Garmin Daily Summary:
{
  "summaryId": "abc123",
  "calendarDate": "2025-12-02",
  "startTimeInSeconds": 1701475200,
  "durationInSeconds": 86400,
  "steps": 12567,
  "distanceInMeters": 9234,
  "activeTimeInSeconds": 2700,
  "activeKilocalories": 450,
  "bmrKilocalories": 1650,
  "moderateIntensityDurationInSeconds": 1800,
  "vigorousIntensityDurationInSeconds": 900,
  "floorsClimbed": 15
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "Garmin",
  "entity_type": "activity_summary",
  "source_record_id": "abc123",
  "date": "2025-12-02",
  "steps": 12567,
  "distance_meters": 9234,
  "active_minutes": 45,
  "calories_active_kcal": 450,
  "calories_basal_kcal": 1650,
  "calories_total_kcal": 2100,
  "moderate_intensity_minutes": 30,
  "vigorous_intensity_minutes": 15,
  "floors_climbed": 15
}
```

**Activity Mapping:**
```json
Garmin Activity Summary:
{
  "summaryId": "activity_xyz",
  "activityType": "RUNNING",
  "startTimeInSeconds": 1701423600,
  "durationInSeconds": 2400,
  "distanceInMeters": 8000,
  "activeKilocalories": 450,
  "averageHeartRateInBeatsPerMinute": 155,
  "maxHeartRateInBeatsPerMinute": 182,
  "averageRunCadenceInStepsPerMinute": 170,
  "maxRunCadenceInStepsPerMinute": 185,
  "averagePaceInMinutesPerKilometer": 5.0,
  "vo2MaxValue": 52.3
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "Garmin",
  "entity_type": "workout",
  "source_record_id": "activity_xyz",
  "start_time": "2025-12-02T07:00:00Z",
  "end_time": "2025-12-02T07:40:00Z",
  "duration_minutes": 40,
  "activity_type": "running",
  "distance_meters": 8000,
  "calories_kcal": 450,
  "avg_heart_rate_bpm": 155,
  "max_heart_rate_bpm": 182,
  "avg_cadence_spm": 170,
  "avg_pace_min_per_km": 5.0,
  "vo2_max": 52.3,
  "device_source": "Garmin Forerunner 965"
}
```

**Sleep Mapping:**
```json
Garmin Sleep Summary:
{
  "summaryId": "sleep_abc",
  "calendarDate": "2025-12-02",
  "startTimeInSeconds": 1701385200,
  "endTimeInSeconds": 1701411600,
  "durationInSeconds": 26400,
  "sleepTimeInSeconds": 25200,
  "unmeasurableSleepInSeconds": 0,
  "deepSleepDurationInSeconds": 5400,
  "lightSleepDurationInSeconds": 14400,
  "remSleepInSeconds": 5400,
  "awakeDurationInSeconds": 1200,
  "sleepScore": 88,
  "avgRespirationValue": 15.2,
  "avgSPO2Value": 96.5
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "Garmin",
  "entity_type": "sleep",
  "source_record_id": "sleep_abc",
  "start_time": "2025-12-01T22:00:00Z",
  "end_time": "2025-12-02T06:20:00Z",
  "duration_minutes": 440,
  "sleep_quality_score": 88,
  "stages": {
    "awake_minutes": 20,
    "light_minutes": 240,
    "deep_minutes": 90,
    "rem_minutes": 90
  },
  "respiratory_rate_bpm": 15.2,
  "spo2_percent": 96.5,
  "device_source": "Garmin Venu 3"
}
```

**Body Battery & Stress Mapping:**
```json
Garmin Stress Details:
{
  "summaryId": "stress_abc",
  "calendarDate": "2025-12-02",
  "stressValueDescriptorsDTOList": [
    {"startTimeInSeconds": 1701388800, "endTimeInSeconds": 1701392400, "stressLevel": 35},
    {"startTimeInSeconds": 1701392400, "endTimeInSeconds": 1701396000, "stressLevel": 55},
    ...
  ],
  "bodyBatteryValueDescriptorsDTOList": [
    {"startTimeInSeconds": 1701388800, "endTimeInSeconds": 1701392400, "bodyBatteryValue": 75},
    {"startTimeInSeconds": 1701392400, "endTimeInSeconds": 1701396000, "bodyBatteryValue": 68},
    ...
  ]
}

yHealth Normalized (Stress):
{
  "user_id": "[yHealth UUID]",
  "provider": "Garmin",
  "entity_type": "stress",
  "timestamp": "2025-12-02T10:00:00Z",
  "stress_level": 35,  // 0-100, lower is better
  "duration_minutes": 60
}

yHealth Normalized (Body Battery):
{
  "user_id": "[yHealth UUID]",
  "provider": "Garmin",
  "entity_type": "body_battery",
  "timestamp": "2025-12-02T10:00:00Z",
  "body_battery": 75,  // 0-100, energy level
  "duration_minutes": 60
}
```

### Golden Source Priority (Garmin-Specific)

**When Garmin conflicts with other sources:**

| Metric Type | Garmin Priority | Rationale |
|-------------|-----------------|-----------|
| **Steps** | Priority 2-3 (Lower than Apple Health/Google Fit for aggregation) | Garmin is accurate but aggregators combine multiple sources |
| **Heart Rate** | Priority 2 (Lower than WHOOP, similar to Apple Watch/Fitbit) | Garmin HR is excellent but WHOOP specializes in continuous monitoring |
| **Sleep** | Priority 2 (Lower than WHOOP/Oura) | Garmin sleep is very good but WHOOP/Oura are sleep specialists |
| **Activity/Workouts** | Priority 1 (Golden Source for serious athletes) | Garmin excels at detailed workout tracking (GPS, power, cadence) |
| **Body Battery** | Priority 1 (Unique to Garmin) | No competition for this Garmin-proprietary metric |
| **Stress** | Priority 1-2 (Use for Garmin users) | Garmin stress tracking via HRV is valuable; few direct competitors |
| **VO2 Max** | Priority 1 (Golden Source) | Garmin's VO2 Max estimates are industry-leading for athletes |

**Garmin Overrides:** Body Battery, VO2 Max, detailed workout metrics (power, cadence, lactate threshold, FTP)
**Garmin Defers:** Steps (to aggregators), Sleep (to WHOOP/Oura if available), HRV/Recovery (to WHOOP)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **OAuth token expired/revoked** | 401 Unauthorized | Notify user to reconnect (Garmin tokens don't auto-refresh) | "Garmin connection expired. Reconnect in Settings to continue syncing." |
| **Rate limit hit (429)** | 429 Too Many Requests | Exponential backoff; reduce sync frequency | Silent: Queue syncs, resume when limit resets |
| **Garmin API outage (5xx)** | 3+ consecutive 5xx responses | Open circuit breaker; pause syncs for 1 hour; retry | "Garmin sync temporarily paused due to service issues. Retrying..." |
| **Missing data (>48h gap)** | No new dailies/activities for 48h | Backfill request; alert user | "Missing Garmin data from [date]. Ensure your Garmin device is syncing to Garmin Connect." |
| **Device not syncing** | Garmin API returns no recent data | Notify user to sync device | "Your Garmin hasn't synced recently. Open Garmin Connect to sync." |
| **Webhook signature mismatch** | HMAC verification fails | Reject webhook; log security event | Silent: Engineering alerted to potential security issue |
| **FIT file parsing error** | Binary FIT file corrupted or unreadable | Skip detailed activity data; use summary | Silent: Log error; use activity summary instead of detailed file |
| **Schema change** | Unexpected fields or missing required data | Quarantine to DLQ; log diff; alert eng | Silent: Process available fields; engineering reviews |
| **User revokes access** | 403 Forbidden | Disable sync; preserve historical data; notify user | "Garmin access revoked. Reconnect to continue syncing." |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sync success rate | >90% | (Successful syncs / Total attempts) over 7 days |
| Sync latency (P95) | <4 hours (polling) or <15 min (webhook) | Time from Garmin data available to yHealth processed |
| OAuth connection completion | >75% | Users who initiate OAuth complete successfully |
| Data completeness | >85% | Users with Garmin have ≥1 data point per day |
| Rate limit violations | <3% | Syncs that hit 429 rate limits |
| User satisfaction | 4.2/5 | In-app survey: "Garmin integration works smoothly" |

### Acceptance Criteria

- [ ] OAuth 1.0a or 2.0 flow completes successfully on iOS and Android
- [ ] All Garmin scopes granted and stored with user consent
- [ ] Access tokens encrypted with AWS Secrets Manager Managed HSM
- [ ] Backfill pulls 90 days of dailies, activities, sleep, stress/Body Battery on first connect
- [ ] Ongoing sync: Daily polling or webhook-based real-time updates
- [ ] Data normalized to yHealth schema and stored in PostgreSQL + TimescaleDB
- [ ] Raw Garmin JSON archived in encrypted blob storage
- [ ] Daily summaries feed into Fitness Pillar (E5)
- [ ] Activities (workouts) integrated with Workout Recommendations (F5.5)
- [ ] Sleep data integrated with Sleep Tracking (F5.2)
- [ ] Body Battery and stress data used in Recovery Monitoring (F5.3) and Wellbeing (E7)
- [ ] VO2 Max, lactate threshold, FTP stored for advanced athletes
- [ ] Golden source priority: Garmin is primary for detailed workouts and Body Battery
- [ ] Error handling: Token expiration, rate limits, API outages, webhook verification
- [ ] User can disconnect Garmin from Settings; tokens revoked
- [ ] Compliance: All data treated as PHI; regional residency; DSR-ready
- [ ] Monitoring: Track sync success, latency, rate limits, errors
- [ ] Alerts: >10% sync failures, webhook signature failures

### Cross-Pillar Connections

**To Fitness Pillar (E5):**
- F5.1 (Activity Tracking): Steps, detailed workouts with GPS/power/cadence
- F5.2 (Sleep Tracking): Sleep stages, respiration, SpO2
- F5.3 (Recovery Monitoring): Body Battery as Mental Recovery input, stress levels
- F5.5 (Workout Recommendations): Training status, recovery time, VO2 Max
- F5.6 (Strain/Load Management): Training load (acute/chronic), recovery time

**To Wellbeing Pillar (E7):**
- Stress levels correlated with mood and journaling
- Body Battery as energy level proxy

**To Cross-Domain Intelligence (E8):**
- "Your Garmin Body Battery is 20 points higher on days you journal" (Fitness ↔ Wellbeing)
- "Best VO2 Max gains happen with 7+ hours sleep + high protein intake" (Fitness ↔ Nutrition ↔ Fitness)
- "Stress levels drop 30% on days with 10k+ steps" (Fitness ↔ Wellbeing)

**To Analytics Dashboard (E10):**
- Body Battery, stress, and training status visualized in Three-Pillar Harmony View
- Garmin advanced metrics in "What's Affecting What" explorer
- VO2 Max trends in Readiness Score calculation

### Dependencies

- **E1 (Onboarding):** Garmin connection prompted during setup
- **E4 (Mobile App):** OAuth redirect handling, Settings UI
- **E5 (Fitness Pillar):** Consumes Garmin activity and sleep data
- **E7 (Wellbeing Pillar):** Uses Body Battery and stress data
- **E8 (Cross-Domain Intelligence):** Garmin data in correlation engine
- **E10 (Analytics Dashboard):** Visualizes Garmin metrics
- **AWS Secrets Manager:** Token encryption
- **Garmin Developer Account:** OAuth credentials, webhook configuration

### MVP Status
[X] MVP Core (Tier 2 - Important, launch week priority)

### Technical Notes
- **Garmin Connect Dependency:** Garmin devices sync to Garmin Connect app first, then yHealth pulls from Garmin servers (not direct device-to-yHealth sync)
- **FIT File Format:** Garmin uses proprietary FIT (Flexible and Interoperable Data Transfer) binary format for detailed activity data. yHealth may need FIT parser library for advanced metrics.
- **Webhook Setup:** Production deployment should use Garmin Daily Data Push webhooks to minimize polling overhead and improve real-time sync.

---

## F9.6: OURA RING INTEGRATION (TIER 2 - MVP IMPORTANT)

### Description
Oura Ring is a TIER 2 IMPORTANT integration providing ELITE sleep and recovery tracking with industry-leading accuracy. Oura specializes in sleep analysis, readiness scoring, and HRV monitoring - making it the "golden source" for sleep data when available. This integration targets optimization enthusiasts and health-conscious users who prioritize sleep and recovery.

### User Story
As a **Holistic Health Seeker** (P1) using an Oura Ring, I want yHealth to automatically sync my Oura data (sleep stages, readiness score, HRV, body temperature) so that I can leverage Oura's best-in-class sleep insights while gaining cross-domain connections between my sleep quality, mood, and workout performance.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Auto-sync Oura data (sleep, readiness, activity). View summary: "Readiness: 85 (Good), Sleep: 7h 42m (92 score), Activity: 350 cal". |
| **Deep** | Detailed Oura metrics (sleep stages breakdown, HRV trends, body temperature deviation, respiratory rate, activity contributors, readiness contributors), historical trends, export Oura data. |

### Oura-Specific Data Types

**Sleep (Oura's Core Strength):**
- Sleep score (0-100, Oura's proprietary algorithm)
- Total sleep time
- Sleep stages: Awake, Light, Deep, REM
- Sleep efficiency
- Restfulness (movement during sleep)
- Sleep timing (bedtime/wake time consistency)
- Sleep latency (time to fall asleep)
- Number of wake-ups

**Readiness (Oura's Signature Metric):**
- Readiness score (0-100)
- Readiness contributors:
  - Sleep quality
  - Sleep balance (recent sleep vs. needs)
  - Resting heart rate
  - HRV balance
  - Body temperature
  - Recovery index
  - Activity balance

**Heart Rate & HRV:**
- Resting heart rate (daily)
- Heart rate variability (nightly average)
- Lowest resting heart rate (during sleep)
- HRV trends (7-day, 30-day averages)

**Activity:**
- Activity score (0-100)
- Active calories burned
- Total calories burned
- Steps (estimated, Oura doesn't track steps directly but estimates from movement)
- Equivalent walking distance
- Inactive time
- Low, medium, high activity time
- Activity contributors

**Body Temperature:**
- Body temperature deviation (from baseline)
- Temperature trend
- Skin temperature during sleep

**Respiratory:**
- Respiratory rate (breaths per minute during sleep)
- Respiratory rate variability

**Menstrual Cycle (if opted in):**
- Cycle phase prediction
- Temperature-based fertility insights

### Oura API v2 Integration Architecture

**OAuth 2.0 + REST API:**
- Oura uses OAuth 2.0 (Authorization Code Grant with PKCE)
- yHealth backend accesses Oura Cloud API with user-granted tokens
- Data synced server-side
- Supports all Oura Ring generations (Gen 2, Gen 3)

**OAuth 2.0 Scopes Required:**
```
daily - Daily summaries (activity, readiness, sleep)
heartrate - Heart rate data
workout - Workout sessions
tag - User-defined tags (optional)
personal - User profile (age, gender, weight, height)
session - Session data (rest mode, meditation)
spo2 - Blood oxygen data (if available)
temperature - Temperature data
```

**OAuth Flow (PKCE):**
1. Mobile app initiates Oura OAuth:
   ```
   https://cloud.ouraring.com/oauth/authorize?
     client_id=[CLIENT_ID]&
     redirect_uri=[REDIRECT_URI]&
     response_type=code&
     scope=daily heartrate workout personal session&
     state=[RANDOM_STATE]&
     code_challenge=[CODE_CHALLENGE]&
     code_challenge_method=S256
   ```
2. Oura redirects to yHealth app with `code` and `state`
3. App relays `code` to yHealth backend
4. Backend exchanges code for tokens:
   ```
   POST https://api.ouraring.com/oauth/token
   {
     "grant_type": "authorization_code",
     "code": "[CODE]",
     "code_verifier": "[CODE_VERIFIER]",
     "redirect_uri": "[REDIRECT_URI]",
     "client_id": "[CLIENT_ID]",
     "client_secret": "[CLIENT_SECRET]"
   }
   ```
5. Response: `access_token`, `refresh_token`, `expires_in` (1 hour)
6. Store tokens server-side with envelope encryption

**Token Management:**
- Access token lifetime: 1 hour
- Refresh token: Long-lived (until revoked)
- Refresh flow: Automatic on expiry
- Storage: Envelope-encrypted (AWS Secrets Manager)
- Revocation: User disconnects = revoke from Oura

### Oura API v2 Endpoints

**Base URL:** `https://api.ouraring.com/v2/usercollection/`

**Key Endpoints:**

**Daily Activity:**
```
GET /daily_activity?start_date=[YYYY-MM-DD]&end_date=[YYYY-MM-DD]
Returns daily activity summaries (scores, calories, steps, activity time)
```

**Daily Readiness:**
```
GET /daily_readiness?start_date=[YYYY-MM-DD]&end_date=[YYYY-MM-DD]
Returns daily readiness scores and contributors
```

**Daily Sleep:**
```
GET /daily_sleep?start_date=[YYYY-MM-DD]&end_date=[YYYY-MM-DD]
Returns daily sleep summaries (scores, stages, efficiency)

GET /sleep?start_date=[YYYY-MM-DD]&end_date=[YYYY-MM-DD]
Returns individual sleep periods (Oura tracks naps separately)
```

**Heart Rate:**
```
GET /heartrate?start_datetime=[ISO_8601]&end_datetime=[ISO_8601]
Returns intraday heart rate (5-min intervals during sleep, longer intervals during day)
```

**Workouts:**
```
GET /workout?start_date=[YYYY-MM-DD]&end_date=[YYYY-MM-DD]
Returns workout sessions logged by user or auto-detected
```

**Personal Info:**
```
GET /personal_info
Returns user profile (age, weight, height, biological sex)
```

**Rate Limits:**
- Default: 5,000 requests per day per app
- Burst: 5 requests per second
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 429 response when exceeded

### Sync Architecture

**Backfill Strategy (First Connect):**
- Pull 90 days of historical data
- Entities: Sleep (90d), Readiness (90d), Activity (90d), Heart rate (30d - data-heavy), Workouts (90d)
- Sequential daily requests to respect rate limits
- Sleep periods: Fetch individual sleep sessions for detailed stage data

**Ongoing Sync Cadence:**
- **Active users:** Every 30 minutes (recently active in yHealth)
- **Standard users:** Every 2 hours (baseline)
- **Daily reconciliation:** Full day query at 9 AM user local time (after Oura processes overnight sleep)
- **Entity priority:** Sleep (morning), Readiness (morning), Activity (evening), Heart rate (daily)

**Cursor Management:**
- Per-user, per-entity cursor based on `day` or `timestamp`
- Cursors: `user_id`, `provider=Oura`, `entity_type`, `last_sync_date`
- Idempotent upserts: Natural key = (`provider`, `provider_user_id`, `entity_type`, `id` or `day`)

**Sync Pseudocode:**
```python
for user in users_with_oura_enabled:
    for entity in ["sleep", "readiness", "activity", "heartrate"]:
        cursor = load_cursor(user.id, "Oura", entity)

        # Determine date range
        start_date = cursor.last_sync_date + 1_day
        end_date = today()

        # Fetch data
        if entity == "sleep":
            # Fetch daily sleep summary
            daily_response = oura_api.get(
                "/daily_sleep",
                params={
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                headers={"Authorization": f"Bearer {decrypt_token(user.oura_access_token)}"}
            )

            # Also fetch individual sleep periods for detailed stages
            periods_response = oura_api.get(
                "/sleep",
                params={
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                headers={"Authorization": f"Bearer {decrypt_token(user.oura_access_token)}"}
            )

        elif entity == "readiness":
            response = oura_api.get(
                "/daily_readiness",
                params={
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                headers={"Authorization": f"Bearer {decrypt_token(user.oura_access_token)}"}
            )

        elif entity == "activity":
            response = oura_api.get(
                "/daily_activity",
                params={
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                headers={"Authorization": f"Bearer {decrypt_token(user.oura_access_token)}"}
            )

        elif entity == "heartrate":
            # Heart rate requires datetime range (not just date)
            start_datetime = datetime.combine(start_date, time.min).isoformat() + "Z"
            end_datetime = datetime.combine(end_date, time.max).isoformat() + "Z"

            response = oura_api.get(
                "/heartrate",
                params={
                    "start_datetime": start_datetime,
                    "end_datetime": end_datetime
                },
                headers={"Authorization": f"Bearer {decrypt_token(user.oura_access_token)}"}
            )

        # Handle rate limits
        if response.status_code == 429:
            retry_after = response.headers.get("Retry-After", 60)
            backoff_with_jitter(retry_after)
            continue

        # Archive raw JSON
        archive_raw_blob(user.id, "Oura", entity, response.json())

        # Normalize to yHealth schema
        normalized_records = normalize_oura_data(entity, response.json())

        # Idempotent upsert
        for record in normalized_records:
            upsert_health_data(
                user_id=user.id,
                provider="Oura",
                entity_type=entity,
                data=record,
                natural_key=build_natural_key(record)
            )

        # Update cursor
        if response.json().get("data"):
            latest_date = max(item["day"] for item in response.json()["data"])
            update_cursor(user.id, "Oura", entity, latest_date)

        # Rate limit compliance
        sleep(0.2)  // Respect 5 req/sec burst limit
```

### Data Normalization Mapping

**Oura → yHealth Schema:**

**Sleep Mapping:**
```json
Oura Daily Sleep:
{
  "id": "abc123",
  "contributors": {
    "deep_sleep": 85,
    "efficiency": 92,
    "latency": 90,
    "rem_sleep": 88,
    "restfulness": 75,
    "timing": 80,
    "total_sleep": 90
  },
  "day": "2025-12-02",
  "score": 88,
  "timestamp": "2025-12-02T00:00:00+00:00"
}

Oura Sleep Period (detailed):
{
  "id": "sleep_xyz",
  "average_breath": 15.5,
  "average_heart_rate": 54,
  "average_hrv": 42,
  "awake_time": 1200,  // seconds
  "bedtime_end": "2025-12-02T06:45:00-08:00",
  "bedtime_start": "2025-12-01T22:30:00-08:00",
  "day": "2025-12-02",
  "deep_sleep_duration": 5400,
  "efficiency": 92,
  "heart_rate": {  // Time series data
    "interval": 300,  // seconds
    "items": [54, 52, 53, 51, ...]
  },
  "hrv": {
    "interval": 300,
    "items": [42, 45, 43, 44, ...]
  },
  "latency": 600,  // seconds to fall asleep
  "light_sleep_duration": 14400,
  "low_battery_alert": false,
  "lowest_heart_rate": 48,
  "movement_30_sec": "...",  // Movement data
  "period": 0,  // 0=main sleep, >0=nap
  "rem_sleep_duration": 5400,
  "restless_periods": 8,
  "sleep_phase_5_min": "443322111122223333...",  // Sleep stage codes
  "sleep_score_delta": 0,
  "time_in_bed": 27000,
  "total_sleep_duration": 25200,
  "type": "long_sleep"
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "Oura",
  "entity_type": "sleep",
  "source_record_id": "sleep_xyz",
  "start_time": "2025-12-01T22:30:00-08:00",
  "end_time": "2025-12-02T06:45:00-08:00",
  "duration_minutes": 450,
  "sleep_quality_score": 88,  // From daily_sleep
  "sleep_efficiency_percent": 92,
  "minutes_to_fall_asleep": 10,
  "stages": {
    "awake_minutes": 20,
    "light_minutes": 240,
    "deep_minutes": 90,
    "rem_minutes": 90
  },
  "avg_heart_rate_bpm": 54,
  "lowest_heart_rate_bpm": 48,
  "avg_hrv_ms": 42,
  "respiratory_rate_bpm": 15.5,
  "restlessness_count": 8,
  "sleep_type": "long_sleep",  // vs "nap"
  "body_temp_deviation": null,  // From separate endpoint if available
  "device_source": "Oura Ring Gen 3"
}
```

**Readiness Mapping:**
```json
Oura Daily Readiness:
{
  "id": "readiness_abc",
  "contributors": {
    "activity_balance": 85,
    "body_temperature": 90,
    "hrv_balance": 88,
    "previous_day_activity": 80,
    "previous_night": 92,
    "recovery_index": 87,
    "resting_heart_rate": 89,
    "sleep_balance": 85
  },
  "day": "2025-12-02",
  "score": 85,
  "temperature_deviation": -0.2,  // Celsius from baseline
  "temperature_trend_deviation": 0.1,
  "timestamp": "2025-12-02T00:00:00+00:00"
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "Oura",
  "entity_type": "readiness",
  "source_record_id": "readiness_abc",
  "date": "2025-12-02",
  "readiness_score": 85,  // 0-100
  "contributors": {
    "activity_balance": 85,
    "body_temperature": 90,
    "hrv_balance": 88,
    "previous_day_activity": 80,
    "previous_night_sleep": 92,
    "recovery_index": 87,
    "resting_heart_rate": 89,
    "sleep_balance": 85
  },
  "body_temp_deviation_celsius": -0.2,
  "body_temp_trend_deviation": 0.1
}
```

**Activity Mapping:**
```json
Oura Daily Activity:
{
  "id": "activity_abc",
  "class_5_min": "...",  // Activity class codes
  "score": 75,
  "active_calories": 450,
  "average_met_minutes": 2.5,
  "contributors": {
    "meet_daily_targets": 70,
    "move_every_hour": 65,
    "recovery_time": 80,
    "stay_active": 75,
    "training_frequency": 70,
    "training_volume": 75
  },
  "day": "2025-12-02",
  "equivalent_walking_distance": 8500,  // meters
  "high_activity_met_minutes": 120,
  "high_activity_time": 900,  // seconds
  "inactivity_alerts": 3,
  "low_activity_met_minutes": 180,
  "low_activity_time": 10800,
  "medium_activity_met_minutes": 240,
  "medium_activity_time": 3600,
  "met": {
    "interval": 60,  // seconds
    "items": [1.2, 1.5, 2.3, ...]
  },
  "meters_to_target": 0,
  "non_wear_time": 0,
  "resting_time": 28800,
  "sedentary_met_minutes": 720,
  "sedentary_time": 43200,
  "steps": 9856,  // Estimated
  "target_calories": 500,
  "target_meters": 8500,
  "total_calories": 2100,
  "timestamp": "2025-12-02T00:00:00+00:00"
}

yHealth Normalized:
{
  "user_id": "[yHealth UUID]",
  "provider": "Oura",
  "entity_type": "activity",
  "source_record_id": "activity_abc",
  "date": "2025-12-02",
  "activity_score": 75,
  "steps": 9856,  // Estimated by Oura
  "distance_meters": 8500,
  "active_calories_kcal": 450,
  "total_calories_kcal": 2100,
  "high_activity_minutes": 15,
  "medium_activity_minutes": 60,
  "low_activity_minutes": 180,
  "sedentary_minutes": 720,
  "inactivity_alerts": 3
}
```

### Golden Source Priority (Oura-Specific)

**When Oura conflicts with other sources:**

| Metric Type | Oura Priority | Rationale |
|-------------|---------------|-----------|
| **Sleep** | Priority 1 (GOLDEN SOURCE) | Oura is the industry leader in sleep tracking accuracy; overrides ALL other sources |
| **Readiness/Recovery** | Priority 1 (GOLDEN SOURCE for Oura users) | Oura's readiness score is proprietary and highly accurate; use as Physical Recovery input |
| **HRV** | Priority 1 (During sleep, GOLDEN SOURCE) | Oura's nightly HRV is more consistent than daytime HRV from other devices |
| **Resting Heart Rate** | Priority 1 (During sleep) | Oura's overnight RHR is most accurate (measured during deep sleep) |
| **Body Temperature** | Priority 1 (Unique to Oura) | Few competitors track temperature deviation; Oura is the standard |
| **Steps** | Priority 3-4 (LOWEST) | Oura estimates steps from movement; not as accurate as dedicated step trackers |
| **Activity/Workouts** | Priority 3 (Lower than WHOOP/Garmin) | Oura doesn't specialize in activity tracking; defer to activity-focused devices |

**Oura Overrides:** Sleep (all metrics), Readiness score, HRV (overnight), RHR (overnight), Body temperature
**Oura Defers:** Steps (to any step tracker), Detailed workouts (to WHOOP/Garmin/Apple Watch), Daytime HR (to other devices)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **OAuth token expired** | 401 Unauthorized | Auto-refresh with refresh_token; if fails, notify user | "Oura connection needs renewal. Reconnect in Settings." |
| **Rate limit hit (429)** | X-RateLimit-Remaining = 0 | Exponential backoff per Retry-After header; reduce sync cadence | Silent: Queue syncs, resume when limit resets |
| **Oura API outage (5xx)** | 3+ consecutive 5xx responses | Open circuit breaker; pause syncs for 30 min; retry | "Oura sync temporarily paused due to service issues. Retrying..." |
| **Missing data (>48h gap)** | No new sleep/readiness for 48h | Backfill request; alert user | "Missing Oura data from [date]. Ensure your Oura Ring is charged and syncing to the Oura app." |
| **Ring not worn** | Oura API returns low-quality or missing data | Accept partial data; notify user if chronic | "Oura detected low wear time. Wear your ring consistently for best insights." |
| **Schema change** | Unexpected fields or missing contributors | Quarantine to DLQ; log diff; alert eng | Silent: Process available fields; engineering reviews |
| **Duplicate sleep periods** | Multiple sleep entries for same day (main sleep + naps) | Aggregate naps separately; keep main sleep distinct | Silent: Handle naps as separate entities |
| **User revokes access** | 403 Forbidden | Disable sync; preserve historical data; notify user | "Oura access revoked. Reconnect to continue syncing." |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sync success rate | >94% | (Successful syncs / Total attempts) over 7 days |
| Sync latency (P95) | <2 hours | Time from Oura data available to yHealth processed |
| OAuth connection completion | >82% | Users who initiate OAuth complete successfully |
| Data completeness | >90% | Users with Oura have ≥1 sleep entry per day |
| Rate limit violations | <2% | Syncs that hit 429 rate limits |
| User satisfaction | 4.5/5 | In-app survey: "Oura integration works smoothly" |

### Acceptance Criteria

- [ ] OAuth 2.0 + PKCE flow completes successfully on iOS and Android
- [ ] All Oura scopes granted and stored with user consent
- [ ] Access/refresh tokens encrypted with AWS Secrets Manager Managed HSM
- [ ] Backfill pulls 90 days of sleep, readiness, activity, heart rate on first connect
- [ ] Ongoing sync runs every 30-120 minutes based on user activity
- [ ] Data normalized to yHealth schema and stored in PostgreSQL + TimescaleDB
- [ ] Raw Oura JSON archived in encrypted blob storage
- [ ] Sleep data powers Sleep Tracking (F5.2) and is GOLDEN SOURCE
- [ ] Readiness score integrated into Physical Recovery Score (F5.3)
- [ ] HRV and RHR used in Recovery Monitoring (F5.3)
- [ ] Body temperature trends stored and visualized
- [ ] Activity data supplemented (not primary source) in Fitness Pillar
- [ ] Naps tracked separately from main sleep
- [ ] Golden source priority: Oura overrides ALL other sources for sleep metrics
- [ ] Error handling: Token refresh, rate limits, API outages, low wear time
- [ ] User can disconnect Oura from Settings; tokens revoked
- [ ] Compliance: All data treated as PHI; regional residency; DSR-ready
- [ ] Monitoring: Track sync success, latency, rate limits, errors
- [ ] Alerts: >6% sync failures, token refresh failures

### Cross-Pillar Connections

**To Fitness Pillar (E5):**
- F5.2 (Sleep Tracking): Oura is the GOLDEN SOURCE for all sleep metrics
- F5.3 (Recovery Monitoring): Readiness score is PRIMARY input for Physical Recovery Score
- F5.5 (Workout Recommendations): Readiness informs workout intensity

**To Wellbeing Pillar (E7):**
- Body temperature correlated with stress and mood
- Sleep quality strongly predicts mood and energy levels
- Readiness score informs daily wellbeing check-ins

**To Cross-Domain Intelligence (E8):**
- "Your Oura readiness is 18 points higher on days you journal before bed" (Fitness ↔ Wellbeing)
- "Best sleep (Oura) happens when you eat dinner before 7pm and avoid caffeine after 2pm" (Fitness ↔ Nutrition)
- "Oura sleep score predicts next-day mood with 82% accuracy" (Fitness ↔ Wellbeing)

**To Analytics Dashboard (E10):**
- Readiness, sleep score, and HRV visualized in Three-Pillar Harmony View
- Oura sleep is primary data source for Sleep Score calculation
- Body temperature trends in "What's Affecting What" explorer

### Dependencies

- **E1 (Onboarding):** Oura connection prompted during setup
- **E4 (Mobile App):** OAuth redirect handling, Settings UI
- **E5 (Fitness Pillar):** Oura is the golden source for sleep data
- **E7 (Wellbeing Pillar):** Readiness and sleep quality inform wellbeing insights
- **E8 (Cross-Domain Intelligence):** Oura data is critical for sleep-based correlations
- **E10 (Analytics Dashboard):** Visualizes Oura metrics prominently
- **AWS Secrets Manager:** Token encryption
- **Oura Developer Account:** OAuth credentials

### MVP Status
[X] MVP Core (Tier 2 - Important, launch week priority)

### Technical Notes
- **Ring Dependency:** Oura Ring must be worn consistently for accurate data (especially sleep tracking). yHealth should educate users on optimal wear patterns.
- **Sleep Processing Delay:** Oura processes sleep data in the morning (typically by 8-9 AM). yHealth sync should account for this delay.
- **Nap Handling:** Oura distinguishes main sleep (period=0) from naps (period>0). yHealth should track naps separately but include in daily sleep totals where appropriate.
- **Temperature Baseline:** Oura establishes a personal temperature baseline over ~60 days. New users won't have temperature deviation data immediately.

---

## F9.7-F9.10: TIER 3 INTEGRATIONS (POST-MVP)

### Overview
Tier 3 integrations are **POST-MVP FEATURES** that will be developed in Months 1-3 after launch based on user demand and strategic priorities. These integrations provide niche coverage and specialized features but are NOT required for MVP validation.

---

## F9.7: SAMSUNG HEALTH INTEGRATION (TIER 3 - POST-MVP)

### Description
Samsung Health is a TIER 3 POST-MVP integration serving as the aggregation hub for Samsung Galaxy and Galaxy Watch users. Similar to Apple Health for iOS and Google Fit for Android, Samsung Health aggregates data from Samsung devices, third-party apps, and manual logs.

### Rationale for Tier 3
- Samsung Health primarily serves Samsung device users (est. 3-5% of yHealth target market in US/EU)
- Functionality overlaps significantly with Google Fit (many Android users prefer Google Fit)
- Samsung Health API integration is more complex than competitors (requires Samsung partnership approval)
- Lower ROI for MVP; can be added post-launch if user demand justifies

### Data Types (Planned)
- Steps, distance, floors climbed
- Heart rate (continuous and resting)
- Sleep duration and quality (basic stages)
- Activity sessions (workouts)
- Stress levels (Galaxy Watch 4+ only)
- Body composition (Samsung smart scales)
- Blood oxygen (SpO2) - select devices
- Blood pressure (Galaxy Watch with validated cuff)

### MVP Status
[ ] Post-MVP (Tier 3 - Months 1-3)

---

## F9.8: STRAVA INTEGRATION (TIER 3 - POST-MVP)

### Description
Strava is a TIER 3 POST-MVP integration specializing in workout tracking for runners, cyclists, and endurance athletes. Strava provides detailed GPS routes, segment performance, social features, and relative effort scores.

### Rationale for Tier 3
- Strava users typically also use WHOOP, Garmin, or other primary devices (Strava is secondary)
- Strava focuses on specific workout types (run/ride); not a holistic health platform
- Strava's value is in social/competitive features, which are outside yHealth MVP scope (no social features in MVP)
- Can be added post-launch for serious athletes who want workout route visualization and segment tracking

### Data Types (Planned)
- Activities (runs, rides, swims) with GPS routes
- Distance, pace, speed, elevation gain
- Heart rate zones (if connected to HR monitor)
- Relative effort score (Strava's proprietary strain metric)
- Segment performances (KOMs, PRs)
- Kudos and social interactions (view-only, no posting)

### MVP Status
[ ] Post-MVP (Tier 3 - Months 1-3 based on user demand)

---

## F9.9: NUTRITIONIX INTEGRATION (TIER 3 - POST-MVP)

### Description
Nutritionix is a TIER 3 POST-MVP integration providing a comprehensive food database with 800,000+ foods, restaurant menus, and barcode scanning capabilities for nutrition tracking. This integration powers AI-assisted meal logging and nutrition insights.

### Rationale for Tier 3
- Nutrition tracking has MANUAL ENTRY PRIORITY in MVP (photo + AI estimation is primary)
- Nutritionix adds value for users who want precise macro tracking, but this is a minority (optimization enthusiasts)
- Barcode scanning and restaurant menus are "nice-to-have" features, not MVP critical
- Can be added post-launch to enhance nutrition pillar for power users

### Data Types (Planned)
- Food database lookups (800k+ foods)
- Barcode scanning (UPC/EAN codes)
- Restaurant menu items with nutrition facts
- Nutrition data: calories, macros (protein, carbs, fat), vitamins, minerals
- Serving sizes and portion control
- Recipe builder and meal planning (potential future)

### MVP Status
[ ] Post-MVP (Tier 3 - Months 2-3 to enhance Nutrition Pillar)

---

## F9.10: SLEEP TRACKING APPS INTEGRATION (TIER 3 - POST-MVP)

### Description
Generic sleep tracking apps integration (Sleep Cycle, Pillow, Sleep as Android) is a TIER 3 POST-MVP feature for users who don't own wearables but use smartphone-based sleep tracking apps.

### Rationale for Tier 3
- yHealth's primary sleep data sources are WHOOP, Oura, Apple Watch, Fitbit, Garmin (Tier 1-2 wearables)
- Smartphone-based sleep tracking is less accurate than wearable-based (relying on accelerometer and microphone)
- Low overlap with target market (users serious about health typically have wearables)
- Can be added post-launch as a fallback for users without wearables

### Data Types (Planned)
- Sleep duration (bedtime, wake time)
- Sleep quality estimate (0-100)
- Sleep stages (basic: light, deep, REM) - accuracy varies by app
- Snoring detection (microphone-based)
- Sleep environment analysis (noise, temperature)
- Smart alarm wake-ups

### MVP Status
[ ] Post-MVP (Tier 3 - Months 2-3 as fallback for non-wearable users)

---

## CROSS-EPIC INTEGRATION SUMMARY

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA INTEGRATIONS (E9)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  WHOOP   │  │  Apple   │  │  Google  │  │  Fitbit  │  Tier 1-2 │
│  │  (Tier1) │  │  Health  │  │   Fit    │  │  (Tier2) │           │
│  │          │  │  (Tier1) │  │  (Tier1) │  │          │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │             │              │             │                  │
│  ┌────┴─────┐  ┌───┴──────┐  ┌───┴──────┐  ┌───┴──────┐           │
│  │  Garmin  │  │   Oura   │  │ Samsung  │  │  Strava  │  Tier 2-3 │
│  │  (Tier2) │  │  (Tier2) │  │  (Tier3) │  │  (Tier3) │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │             │              │             │                  │
│       └─────────────┴──────────────┴─────────────┘                  │
│                           │                                          │
│  ┌────────────────────────┴──────────────────────────┐              │
│  │           RAW DATA LAYER (Encrypted Blob)         │              │
│  │  - Provider JSON archived for reprocessing         │              │
│  │  - Regional storage (EU PHI in EU, US PHI in US)  │              │
│  └────────────────────────┬──────────────────────────┘              │
│                           │                                          │
│  ┌────────────────────────┴──────────────────────────┐              │
│  │      NORMALIZED DATA LAYER (PostgreSQL + TSDB)    │              │
│  │  - yHealth canonical schema                       │              │
│  │  - Golden source priority applied                 │              │
│  │  - Field-level encryption for PHI                 │              │
│  └────────────────────────┬──────────────────────────┘              │
│                           │                                          │
│  ┌────────────────────────┴──────────────────────────┐              │
│  │         FHIR LAYER (Interoperability)             │              │
│  │  - Observation/Device FHIR resources              │              │
│  │  - Standards-compliant for future integrations    │              │
│  └────────────────────────┬──────────────────────────┘              │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                    │
          ▼                                    ▼
┌────────────────────┐            ┌────────────────────┐
│  FITNESS PILLAR    │            │  CROSS-DOMAIN      │
│  (E5)              │            │  INTELLIGENCE      │
│                    │            │  (E8)              │
│  - Activity        │            │                    │
│  - Sleep           │◄───────────┤  Correlation       │
│  - Recovery        │            │  Engine            │
│  - Goals           │            │                    │
│  - Workouts        │            │  "Unimaginable     │
│  - Strain          │            │   Insights"        │
└────────────────────┘            └────────────────────┘
          │                                    │
          │                                    │
          ▼                                    ▼
┌────────────────────┐            ┌────────────────────┐
│  ANALYTICS         │            │  NUTRITION &       │
│  DASHBOARD (E10)   │            │  WELLBEING         │
│                    │            │  (E6, E7)          │
│  - Harmony View    │            │                    │
│  - Insights Feed   │            │  - Meals           │
│  - Readiness Score │            │  - Mood            │
│  - Correlations    │            │  - Journaling      │
└────────────────────┘            └────────────────────┘
```

### Golden Source Priority Matrix (All Integrations)

| Metric Type | Priority 1 (Golden) | Priority 2 | Priority 3 | Priority 4 |
|-------------|---------------------|------------|------------|------------|
| **Steps** | Apple Health (iOS), Google Fit (Android) | Fitbit | Garmin | Oura (estimated) |
| **Heart Rate** | WHOOP | Apple Watch, Fitbit, Garmin | Google Fit | Manual |
| **Sleep** | **Oura** (if available) | WHOOP | Apple Watch, Fitbit, Garmin | Google Fit, Manual |
| **Recovery/HRV** | WHOOP | Oura | Garmin, Fitbit | Apple Watch |
| **Strain/Load** | WHOOP | Garmin (training load) | Fitbit (active zone mins) | Apple Watch |
| **Workouts (GPS)** | Garmin, Strava | Apple Watch | WHOOP, Fitbit | Google Fit |
| **Body Battery** | Garmin (unique) | — | — | — |
| **Readiness** | Oura (unique) | WHOOP (recovery) | — | — |
| **SpO2** | Oura, Fitbit | Garmin | Apple Watch | — |
| **Body Temp** | Oura (unique) | — | — | — |

### Integration Effort Estimates (Engineering Hours)

| Integration | OAuth Setup | API Integration | Data Normalization | Testing | Total (MVP) |
|-------------|-------------|-----------------|-------------------|---------|-------------|
| **WHOOP** (Tier 1) | 8h | 24h | 16h | 12h | 60h |
| **Apple Health** (Tier 1) | 6h (HealthKit) | 32h (iOS SDK) | 20h | 16h | 74h |
| **Google Fit** (Tier 1) | 8h | 28h | 18h | 14h | 68h |
| **Fitbit** (Tier 2) | 8h | 26h | 16h | 12h | 62h |
| **Garmin** (Tier 2) | 10h | 30h | 20h | 14h | 74h |
| **Oura** (Tier 2) | 8h | 24h | 16h | 12h | 60h |
| **Samsung** (Tier 3 - Post-MVP) | 12h | 32h | 18h | 14h | 76h |
| **Strava** (Tier 3 - Post-MVP) | 6h | 20h | 12h | 10h | 48h |
| **Nutritionix** (Tier 3 - Post-MVP) | 4h | 16h | 10h | 8h | 38h |
| **Sleep Apps** (Tier 3 - Post-MVP) | 6h | 22h | 14h | 10h | 52h |
| **TOTAL MVP (Tier 1-2)** | | | | | **398 hours** (~10 weeks for 1 backend engineer) |

### Success Criteria (MVP Launch)

**Tier 1 Integrations (Launch Blockers):**
- [ ] WHOOP, Apple Health, Google Fit fully functional
- [ ] >90% sync success rate for Tier 1 integrations
- [ ] <15 min sync latency (P95) for Tier 1
- [ ] OAuth flows complete successfully on iOS and Android
- [ ] Golden source priority correctly applied for all metrics
- [ ] Data completeness: >85% of users have ≥1 data point per day

**Tier 2 Integrations (Launch Week):**
- [ ] Fitbit, Garmin, Oura functional within 1 week of launch
- [ ] >88% sync success rate for Tier 2 integrations
- [ ] <2 hour sync latency (P95) for Tier 2
- [ ] User satisfaction: >4.3/5 for Tier 2 integrations

**Compliance & Security (All Tiers):**
- [ ] All data treated as PHI/ePHI (HIPAA) and sensitive personal data (GDPR)
- [ ] Tokens encrypted with AWS Secrets Manager Managed HSM
- [ ] Raw data archived in encrypted regional blob storage
- [ ] Field-level encryption for sensitive columns (HR, sleep, mood)
- [ ] DSR-ready: Export and deletion propagate across all storage layers
- [ ] Audit logs: All sync events, token refreshes, errors logged immutably
- [ ] Penetration testing passed for OAuth flows and API endpoints

### User Experience Flow (Integration Onboarding)

**During Onboarding (E1):**
1. yHealth prompts: "Connect your wearables and apps for automatic health tracking"
2. User sees integration cards: WHOOP, Apple Health, Google Fit, Fitbit, Garmin, Oura
3. User selects primary device (e.g., WHOOP)
4. OAuth flow: User authorizes yHealth to access WHOOP data
5. Backfill begins: "Syncing 90 days of WHOOP data... 45% complete"
6. User can add additional integrations (e.g., Apple Health for steps)
7. yHealth explains golden source priority: "WHOOP will be your primary source for heart rate and recovery. Apple Health will provide step data."

**Ongoing Sync:**
- Background sync runs automatically (15-120 min intervals)
- User sees "Last synced: 12 minutes ago" in Settings
- Proactive alerts: "WHOOP hasn't synced in 2 days. Check your device."
- Manual sync button: "Sync now" for immediate refresh

**Settings Management:**
- User can view connected integrations in Settings > Integrations
- Disconnect button: Revokes tokens, stops syncs, preserves historical data
- Data source visibility: "Your steps come from Apple Health. Your sleep comes from Oura."
- Manual entry fallback: "No wearable? Log workouts and sleep manually."

---

## DOCUMENT GOVERNANCE

**Review Schedule:** After MVP launch and quarterly thereafter
**Update Triggers:** New API versions, user demand for Tier 3 integrations, golden source priority adjustments
**Version Control:** All changes require version increment and rationale
**Ownership:** Backend Engineering Team with Product and Security review

---

*yHealth Platform - Epic 09: Data Integrations*
*Comprehensive integration strategy powering the "Better Together" vision*
*10 integrations (6 MVP Core, 4 Post-MVP) delivering unimaginable cross-domain insights*

---

*Document Classification: INTERNAL USE - Epic Specification*
*Created: 2025-12-02 | Updated: 2025-12-02*
*Epic Status: Design Stage | MVP Tier 1-2: 6 integrations (WHOOP, Apple Health, Google Fit, Fitbit, Garmin, Oura)*
*Total Engineering Effort (MVP): ~398 hours | ~10 weeks for 1 backend engineer*