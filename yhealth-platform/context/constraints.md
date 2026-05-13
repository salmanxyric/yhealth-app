# yHealth Platform - Constraints

> **Source:** PRD v4.1, Sections 11-14, updated for Vision v5.0

---

## Performance Constraints

| Constraint | Target | Context |
|------------|--------|---------|
| Voice response latency | <2 seconds | P95 for coaching conversations |
| Chat message delivery | <1 second | Real-time Socket.IO messaging |
| Photo analysis | <10 seconds | Meal photo processing |
| Dashboard load | <3 seconds | Initial load time |
| Chart rendering | <2 seconds | All visualizations |
| Data sync | <15 minutes | From source update |

---

## Reliability Constraints

| Constraint | Target |
|------------|--------|
| Platform uptime | 99.9% |
| Voice coaching availability | 24/7 |
| Chat availability | 24/7 |
| Data sync reliability | 99.5% success rate |

---

## Security Constraints

| Requirement | Standard |
|-------------|----------|
| Penetration testing | Required before launch |
| Data encryption | At rest and in transit |
| Authentication | Email + password minimum, 2FA supported |
| Session management | Secure token handling |
| Password requirements | Min 8 chars, 1 number, 1 special |

---

## Privacy Constraints

| Requirement | Implementation |
|-------------|----------------|
| GDPR compliance | Required (EU users) |
| Data portability | Export within 48 hours |
| Right to erasure | Deletion within 30 days |
| Cooling-off period | 14 days for deletion requests |
| Consent | Explicit for all data collection |
| Financial records retention | 7 years (legal requirement) |

---

## Accessibility Constraints

| Requirement | Standard |
|-------------|----------|
| Compliance level | WCAG 2.1 Level AA |
| Color contrast | 4.5:1 normal text, 3:1 large |
| Touch targets | Minimum 44x44pt |
| Text scaling | Support 200% zoom |
| Screen reader support | Full ARIA implementation |

---

## AI Safety Constraints

### Medical Advice Boundaries

**The AI Will NOT:**
- Diagnose medical conditions
- Prescribe medications or dosages
- Recommend stopping prescribed treatments
- Provide emergency medical guidance
- Interpret medical test results
- Override healthcare provider recommendations

### Required Disclaimers

> "yHealth provides wellness coaching, not medical advice. Always consult healthcare professionals for medical concerns."

### Crisis Detection Requirements

System must detect and escalate:
- Self-harm references
- Suicidal ideation
- Severe depression indicators
- Extreme anxiety/panic
- Eating disorder behaviors
- Substance abuse crisis

---

## Content Constraints

### Pre-Generation Filters Required

- Dangerous exercise recommendations (injury risk)
- Extreme caloric restriction (<1200 kcal without medical supervision)
- Unsafe supplement combinations
- Overtraining recommendations
- Fasting for vulnerable populations

### Transparency Requirements

Users must know:
- They're interacting with AI, not humans
- How data is used for personalization
- Limitations of AI capabilities
- How to reach human support
- How to report concerning AI behavior

---

## Data Constraints

### Offline Mode Requirements

| Feature | Offline Capability |
|---------|-------------------|
| View dashboard | Last 7 days cached |
| Log mood | Queue locally |
| Log meals | Queue locally (no photo AI) |
| View insights | Cached insights only |
| Voice coaching | NOT available |
| Chat | NOT available (requires Socket.IO) |

### Storage Limits

| Data Type | Limit |
|-----------|-------|
| Dashboard data | 50MB max |
| Cached insights | 10MB max |
| Queued entries | 20MB max |
| Conversation history | 20MB max |
| **Total per user** | 100MB max |

### Data Retention

| Data Type | Active Account | After Deletion |
|-----------|----------------|----------------|
| Health metrics | Indefinite | Deleted in 30 days |
| Conversation history | 24 months rolling | Deleted in 30 days |
| Insights | 12 months rolling | Deleted in 30 days |
| Audit logs | 7 years | 7 years (regulatory) |

---

## Integration Constraints

### MVP Integration Scope

10 primary integrations only:
1. WHOOP
2. Apple Health
3. Google Fit
4. Fitbit
5. Garmin
6. Oura
7. Samsung Health
8. Strava
9. Nutritionix
10. Sleep tracking APIs

### OAuth Requirements

- All integrations must use OAuth 2.0
- Token refresh must be automatic
- Re-auth prompt when tokens expire
- Clear data permissions explanation

---

## Business Constraints

### Built vs Remaining

| Feature | Status |
|---------|--------|
| Gamification (XP, streaks, achievements, leaderboards) | ✅ Built |
| Social features (buddies, competitions, accountability) | ✅ Built |
| Web dashboard | ✅ Built |
| In-app chat with voice/video calling | ✅ Built |
| Financial wellness module | ✅ Built |
| AI memory & knowledge graph | ✅ Built |
| Family plans | Planned |
| Enterprise plans | Planned |
| Terra API (300+ wearables) | Planned |
| Native mobile apps (iOS/Android) | Planned (PWA first) |

### Quality Gates (Launch Requirements)

| Gate | Criteria |
|------|----------|
| Performance | <2s response time p95 |
| Reliability | 99.9% uptime |
| Security | Pass penetration testing |
| Privacy | GDPR/HIPAA compliant |
| Accessibility | WCAG 2.1 AA |
| User Satisfaction | 4.5/5 beta rating |

---

*Extracted from PRD v4.1, Sections 11-14*
