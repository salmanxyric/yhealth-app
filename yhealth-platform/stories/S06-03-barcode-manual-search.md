---
type: story
id: S06.1.2
title: Barcode Scanning & Manual Search
epic: E06
feature: F6.1
product: yhealth-platform
priority: P0
status: Draft
---

# Barcode Scanning & Manual Search

### User Story
**As an** Optimization Enthusiast (P3),
**I want to** scan product barcodes and search for foods manually,
**So that** I can get precise nutritional data for packaged foods and find exactly what I ate.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users can scan barcodes on packaged products for instant nutritional lookup, or search the database manually for any food. Both methods prioritize speed while offering precision for users who want detailed tracking.

**Barcode Scanning:**
- Scan UPC/EAN barcodes via camera
- Instant recognition (<2 seconds)
- Nutritional data retrieval from Nutritionix (<3 seconds total)
- Support for 5M+ packaged products globally
- Offline support for top 1000 common products

**Manual Search Features:**
- **Autocomplete:** Type-ahead suggestions as user types
- **Recent Foods:** Quick access to last 20 logged foods
- **Favorites:** Star foods for instant access
- **Serving Presets:** Small/Medium/Large + custom entry
- **Smart Ranking:** User's foods first, then verified, then community

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Scan/search → Select food → One-tap serving size (S/M/L) → Logged. ~15 seconds. |
| **Deep** | Scan/search → Select food → Custom serving size (grams/cups/pieces) → View full macro breakdown → Adjust if needed → Logged. ~1-2 minutes for precision. |

**Search Database Priority:**
1. User's personal foods (created, corrected, frequently logged)
2. User's favorites (starred foods)
3. yHealth verified regional foods
4. Nutritionix verified foods
5. Nutritionix community-contributed foods

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Food Selected | UUID | From database | User-only |
| Serving Size | Float | Required, 0.1-10000 | User-only |
| Serving Unit | Enum | grams/cups/pieces/custom | User-only |
| Meal Type | Enum | breakfast/lunch/dinner/snack | User-only |
| Timestamp | ISO 8601 | Auto or manual | User-only |

**Behaviors:**
- Barcode scanner auto-focuses on barcode
- Search shows results as user types (debounced 300ms)
- Recently logged foods appear at top of search
- Favorites accessible via star icon
- Serving size remembers last used for each food
- All entries sync across channels (App, WhatsApp, Voice)

### Acceptance Criteria

**AC1: Barcode Scanning Speed**
Given a user points camera at a product barcode,
When the barcode is detected,
Then nutritional data is retrieved and displayed within 3 seconds.

**AC2: Barcode Not Found**
Given a user scans a barcode not in the database,
When lookup returns no results,
Then user is prompted: "Barcode not found. Add this product manually?" with option to create custom entry.

**AC3: Manual Search Autocomplete**
Given a user starts typing in the search field,
When at least 2 characters are entered,
Then autocomplete suggestions appear within 500ms.

**AC4: Search Results Speed**
Given a user submits a search query,
When the search executes,
Then relevant results are displayed within 1 second.

**AC5: Recent Foods Quick Access**
Given a user opens manual search,
When the search field is empty,
Then the last 20 logged foods are displayed for quick selection.

**AC6: Favorites Access**
Given a user has starred favorite foods,
When they tap the favorites icon,
Then all starred foods are displayed for quick selection.

**AC7: Serving Size Presets (Light Mode)**
Given a user selects a food in Light mode,
When choosing serving size,
Then they can tap Small/Medium/Large for quick selection based on standard portions.

**AC8: Custom Serving Size (Deep Mode)**
Given a user selects a food in Deep mode,
When choosing serving size,
Then they can enter precise amounts in grams, cups, pieces, or custom units.

**AC9: Offline Barcode Support**
Given the device has no internet connection,
When a user scans a common product barcode,
Then cached nutritional data (top 1000 products) is available.

### Success Metrics
- Barcode scan success rate: >95% for valid barcodes
- Search results in <1 second: 95th percentile
- Autocomplete suggestions: 100% within 500ms
- Offline barcode availability: 1000+ products
- User engagement: 80% try 2+ logging methods in first 30 days

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <3s barcode lookup | Camera permission required | Search history local only | Voice search option | iOS 14+, Android 10+ |
| <1s search results | API calls authenticated | No tracking of searches | Screen reader support | Camera permission required |

### Dependencies
- **Prerequisite Stories:** S06.0.1 (Food Database Infrastructure)
- **Related Stories:** S06.1.1, S06.1.3, S06.2.1
- **External Dependencies:** Nutritionix API (barcode database)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Barcode damaged/partial | Show "Couldn't read barcode. Try again or search manually?" |
| Multiple barcodes in frame | Focus on centered/largest barcode, ignore others |
| Search returns no results | Show "No results found. Try different spelling or create custom food?" |
| Typo in search query | Show "Did you mean...?" suggestions based on fuzzy matching |
| Very long food name | Truncate with ellipsis, show full name on tap |
| Duplicate results | Deduplicate, prioritize verified over user-submitted |
| API timeout during search | Show cached/local results, indicate "More results loading..." |
| User offline during search | Show only cached/local results, indicate offline status |

### Open Questions
- Should we support scanning nutrition labels (not just barcodes)?
- What's the maximum search history length?
- Should favorites sync across devices?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Barcode scanning <3 seconds
- [ ] Manual search <1 second with autocomplete
- [ ] Recent foods and favorites functional
- [ ] Serving size presets (Light) and custom entry (Deep)
- [ ] Offline support for 1000+ products
- [ ] Cross-channel sync verified