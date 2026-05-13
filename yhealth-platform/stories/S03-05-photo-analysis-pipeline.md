---
type: story
id: S03.3.1
title: Photo Analysis Pipeline
epic: E03
epic_name: WhatsApp Integration
feature: F3.3
feature_name: Photo Logging
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.3.1: Photo Analysis Pipeline

## User Story

**As a** Busy Professional (P2),
**I want to** send a photo of my meal to my coach on WhatsApp,
**So that** I can log nutrition instantly without typing anything.

---

## Story Type

- [x] Feature
- [ ] Enhancement
- [ ] Technical
- [ ] Integration

## Priority

- [x] Must Have (P0)
- [ ] Should Have (P1)

---

## Scope Description

**User Experience:**
- User sends meal photo via WhatsApp
- AI analyzes image within 10 seconds
- Returns nutrition estimate (calories, macros)
- Identifies visible food items
- Confidence indicator (High/Medium/Low)

**Photo Analysis Pipeline:**
1. Photo received via WhatsApp webhook
2. Image preprocessing (resize, normalize)
3. Object detection (identify food items)
4. Food identification (what specific foods)
5. Portion estimation (how much of each)
6. Nutrition database lookup (calories, macros)
7. Confidence scoring (0-100)
8. Generate response

**Analysis Output:**
| Component | Description | Example |
|-----------|-------------|---------|
| Food Items | Identified foods | Turkey, whole wheat bread, lettuce, tomato |
| Calories | Total estimate | 500 cal |
| Protein | Macro estimate | 35g |
| Carbs | Macro estimate | 45g |
| Fat | Macro estimate | 18g |
| Confidence | Accuracy indicator | High (85%) |

**Light Mode:**
- Photo → Quick estimate
- "~500 calories, high protein. Log it?"
- Simple yes/no confirmation

**Deep Mode:**
- Photo → Detailed breakdown
- "Turkey sandwich (500 cal): 35g protein, 45g carbs, 18g fat. Ingredients: whole wheat bread, turkey breast, lettuce, tomato. Adjust portions or confirm to log?"
- Editable values before logging

**Confidence-Based Responses:**
| Confidence | Response |
|------------|----------|
| High (>80%) | "Grilled chicken salad - 420 cal, 35g protein. Log it?" |
| Medium (50-80%) | "Looks like pasta dish - ~600 cal (estimate). Confirm?" |
| Low (<50%) | "Can't identify this clearly. What did you eat?" |

---

## Acceptance Criteria

```gherkin
Scenario: Meal photo processing
  Given a user sends a meal photo
  When the image is processed
  Then analysis results return within 10 seconds

Scenario: High confidence analysis
  Given a clear meal photo
  When analysis completes with high confidence
  Then accurate calorie and macro estimates are provided

Scenario: Multiple food items
  Given multiple food items in photo
  When analyzed
  Then each item is identified and combined totals provided

Scenario: Poor quality photo
  Given a blurry or dark photo
  When quality is detected as low
  Then user is prompted: "Photo is a bit dark - my estimate might be less accurate. Confirm or edit?"

Scenario: Non-food photo
  Given a non-food photo
  When classification fails
  Then user sees: "This doesn't look like food. Send a meal photo?"

Scenario: Low confidence identification
  Given confidence is low
  When AI cannot identify foods
  Then it asks: "Can't quite identify this. Tell me what it is and I'll estimate nutrition!"
```

---

## Success Metrics

- Photo Analysis Time: <10 seconds (p95)
- Calorie Accuracy: +/-20% of actual values
- User Acceptance: 70% of estimates logged without edits
- Photo Logging Adoption: 60% of meal logs via photo

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <10s analysis | Images encrypted | 90-day retention, deletable | Alt text for analysis | JPEG, PNG, HEIC |
| <16MB file size | - | - | - | WhatsApp media API |

---

## Dependencies

- **Prerequisite Stories:** S03.0.1 (media handling), S03.2.1 (response delivery)
- **Related Stories:** S03.3.2 (confirmation and logging)
- **External Dependencies:** Computer vision service, Nutrition database
- **Cross-Epic:** E6 (Nutrition pillar logging)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Photo too large (>16MB) | "Photo is too large. Try taking a new one?" |
| Analysis timeout (>15s) | "Taking longer than usual. Try a clearer photo?" |
| Unrecognizable food | "Can't identify this. Tell me what it is?" |
| Multiple meals in frame | "I see multiple items. Analyzing everything together." |
| Image corrupted | "Couldn't read that image. Try sending again?" |

---

## Open Questions

- Portion size estimation approach (visual vs. reference objects)
- Multi-language food recognition requirements

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Photo received and processed via webhook
- [ ] Object detection identifying foods
- [ ] Nutrition estimates calculated
- [ ] Confidence scoring functional
- [ ] Light/Deep response modes working
- [ ] <10s processing time achieved
- [ ] Error handling for all scenarios

---

*Story S03.3.1 | Epic E03 | Product: yHealth Platform*
