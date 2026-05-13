---
type: story
id: S06.1.1
title: Photo AI Meal Recognition
epic: E06
feature: F6.1
product: yhealth-platform
priority: P0
status: Draft
---

# Photo AI Meal Recognition

### User Story
**As a** Busy Professional (P2),
**I want to** snap a quick photo of my meal and get instant calorie/macro estimates,
**So that** I can track nutrition without disrupting my day or manually searching for foods.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users take a photo of their meal, and AI automatically identifies foods, estimates portions, and calculates nutritional values. This is the "magic" experience - snap and done. The system learns from user corrections to improve accuracy over time.

**Photo AI Capabilities:**
- **Multi-food detection:** Identify multiple items on a plate (e.g., chicken, rice, salad = 3 separate items)
- **Portion estimation:** Use plate/hand as reference for serving size
- **Cuisine recognition:** Support global + regional cuisines (Pakistani, Middle Eastern, Indian, Western)
- **Confidence scoring:** Low (<60%), Medium (60-85%), High (>85%)
- **Learning from corrections:** User feedback improves model accuracy

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Photo → AI estimate auto-accepted → Quick confirmation → Done. ~30 seconds total. No macro details shown unless tapped. One-tap "Looks good!" confirmation. |
| **Deep** | Photo → AI estimate with confidence scores → Manual adjustment UI for each food → Portion size refinement → Detailed macro breakdown → Option to save to personal database. ~3-5 minutes for precision. |

**Processing Pipeline:**
1. User captures/selects photo
2. Photo uploaded to AI service (<2 seconds upload)
3. AI processes image (<10 seconds standard, <15 seconds complex)
4. Results returned with food items, portions, macros
5. User confirms or adjusts
6. Meal logged to database

**Photo Requirements:**
- Supported formats: JPEG, PNG, HEIC (iOS)
- Maximum size: 10MB per photo
- Minimum resolution: 640x480 pixels
- Recommended: Well-lit, top-down or 45-degree angle

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Photo | Image file | Max 10MB, supported format | User-only, encrypted |
| Detected Foods | Array | From AI response | User-only |
| Confidence Score | Float | 0-100% per food | System |
| Portion Estimate | Float + Unit | Per food item | User-only |
| User Corrections | Object | Changes from AI estimate | System (for learning) |
| Final Macros | Object | Calories, P/C/F | User-only |

**Behaviors:**
- Camera opens with meal-optimized settings (auto-focus, good exposure)
- Progress indicator shows during AI processing
- Results display immediately upon completion
- Light mode auto-accepts high confidence (>85%) estimates
- Deep mode always shows adjustment options
- Corrections feed back to improve AI model

### Acceptance Criteria

**AC1: Photo Capture**
Given a user opens meal logging,
When they tap "Photo" option,
Then the camera opens with meal-optimized settings and captures a clear image.

**AC2: AI Processing Time**
Given a user submits a meal photo,
When the AI processes the image,
Then results are returned within 10 seconds for standard photos and 15 seconds for complex multi-food photos.

**AC3: Multi-Food Detection**
Given a photo contains multiple food items (e.g., plate with chicken, rice, vegetables),
When AI analyzes the photo,
Then each food item is identified separately with individual calorie/macro estimates.

**AC4: Confidence Scoring**
Given AI returns food recognition results,
When results are displayed,
Then each food item shows a confidence score (Low/Medium/High) indicating estimation reliability.

**AC5: Light Mode Quick Confirmation**
Given a user is in Light mode and AI returns high-confidence results (>85%),
When results are displayed,
Then user can confirm with one tap ("Looks good!") and meal is logged in <30 seconds total.

**AC6: Deep Mode Adjustment**
Given a user is in Deep mode,
When AI results are displayed,
Then user can tap each food item to adjust portion size, swap for different food, or add missing items.

**AC7: Learning from Corrections**
Given a user corrects an AI estimate (e.g., "That's not rice, it's quinoa"),
When the correction is submitted,
Then the correction is logged for model improvement and the corrected food is saved to user's personal database.

**AC8: Accuracy Target**
Given the Photo AI system is operational,
When measuring across all meal photos,
Then calorie estimates are within ±10-15% of actual values for 85%+ of photos.

### Success Metrics
- Photo AI adoption: 60% of meals logged via photo (primary method)
- Processing time: 95% complete in <10 seconds
- Accuracy: ±10-15% calorie variance
- Correction rate: <20% of AI estimates manually corrected
- Light mode completion: 90% complete log in <45 seconds

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <10s processing | Photos encrypted in transit | Photos auto-delete after 90 days | Alt text for detected foods | iOS 14+, Android 10+ |
| <15s complex photos | AI service authenticated | Option for on-device only | Voice confirmation option | Camera permission required |

### Dependencies
- **Prerequisite Stories:** S06.0.1 (Food Database Infrastructure)
- **Related Stories:** S06.1.2, S06.1.3, S06.2.1
- **External Dependencies:** Photo AI service (Claude Vision or custom model)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Photo too dark/blurry | Show "Photo unclear. Try better lighting or closer angle?" with retake option |
| AI confidence <40% for all items | Prompt manual entry: "Couldn't recognize this meal. Can you help identify it?" with photo attached |
| Processing timeout (>20 seconds) | Show timeout message, offer manual entry option, log for monitoring |
| Multiple plates in photo | Detect and ask: "Found multiple plates. Which one is your meal?" |
| Packaged food in photo | Suggest: "This looks packaged. Try barcode scanning for exact nutrition?" |
| AI detects non-food items | Filter out non-food detections, only show recognized foods |
| Photo upload fails | Retry automatically, show "Upload failed. Check connection?" after 3 retries |
| User denies camera permission | Show explanation why camera needed, link to settings |

### Open Questions
- Should we offer "Scan receipt" for restaurant meals?
- What's the photo retention policy (90 days default - configurable)?
- Should corrections be shared anonymously to improve global model?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Photo capture optimized for meals
- [ ] AI processing <10 seconds (95th percentile)
- [ ] Multi-food detection working
- [ ] Confidence scoring displayed
- [ ] Light/Deep mode flows functional
- [ ] Correction feedback loop implemented
- [ ] Accuracy validated (±15% target)