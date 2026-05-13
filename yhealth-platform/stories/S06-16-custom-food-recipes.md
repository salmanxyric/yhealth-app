---
type: story
id: S06.6.1
title: Custom Food & Recipe Builder
epic: E06
feature: F6.6
product: yhealth-platform
priority: P0
status: Draft
---

# Custom Food & Recipe Builder

### User Story
**As an** Optimization Enthusiast (P3),
**I want to** create custom recipes with precise macro calculations,
**So that** I can track my homemade meal prep accurately.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users create custom foods and recipes that save to their personal database for quick future logging. The recipe builder calculates per-serving macros automatically from ingredients.

**Custom Food Entry (Simple):**
| Field | Required | Description |
|-------|----------|-------------|
| Food Name | Yes | Name for the custom food |
| Serving Size | Yes | Amount per serving (grams, cups, pieces) |
| Calories | Yes | Calories per serving |
| Protein | Yes | Grams per serving |
| Carbs | Yes | Grams per serving |
| Fats | Yes | Grams per serving |
| Fiber | No | Grams per serving |
| Sugar | No | Grams per serving |
| Sodium | No | mg per serving |
| Photo | No | Reference image |

**Recipe Builder (Complex):**

| Step | Action |
|------|--------|
| 1 | Enter recipe name + servings (e.g., "Protein Pancakes - serves 3") |
| 2 | Add ingredients by searching database or entering custom |
| 3 | Specify quantity for each ingredient |
| 4 | System auto-calculates total nutrition |
| 5 | System divides by servings for per-serving macros |
| 6 | Add cooking instructions (optional) |
| 7 | Upload photo (optional) |
| 8 | Add tags (meal type, cuisine, dietary flags) |
| 9 | Save to personal database |

**Example Recipe Flow:**
```
Recipe: Homemade Protein Pancakes (serves 3)
Ingredients:
- 100g oats (search → 389 kcal, 13g P, 66g C, 7g F)
- 2 eggs (search → 156 kcal, 12g P, 1g C, 11g F)
- 30g protein powder (search → 120 kcal, 24g P, 3g C, 1g F)
- 200ml almond milk (search → 30 kcal, 1g P, 1g C, 3g F)

Total: 695 kcal, 50g P, 71g C, 22g F
Per Serving (÷3): 232 kcal, 17g P, 24g C, 7g F
```

**Auto-Save from Corrections:**
When user corrects a Photo AI estimate, the corrected food is automatically offered to save to personal database.

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Simple custom food entry (name + macros). Quick save. No recipe building. |
| **Deep** | Full recipe builder with ingredients, instructions, photos, tags. Export recipes. |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Food/Recipe ID | UUID | Generated | User-only |
| Name | String | Required, max 100 chars | User-only |
| Type | Enum | custom_food / recipe | User-only |
| Ingredients | Array | For recipes only | User-only |
| Nutrition | Object | Calculated or manual | User-only |
| Tags | Array | Optional | User-only |
| Is Public | Boolean | Default false | User-controlled |

**Behaviors:**
- Created foods appear in search results (prioritized)
- Recipes can be logged as single item or per-ingredient
- Duplicate detection warns if similar food exists
- Edit history preserved for corrections

### Acceptance Criteria

**AC1: Custom Food Entry**
Given a user wants to add a custom food,
When they enter name, serving size, and macros,
Then the food is saved to their personal database and searchable.

**AC2: Recipe Builder**
Given a user creates a recipe with multiple ingredients,
When they specify quantities and servings,
Then total and per-serving macros are automatically calculated.

**AC3: Ingredient Search**
Given a user is adding ingredients to a recipe,
When they search for an ingredient,
Then they can select from the full food database (Nutritionix + custom).

**AC4: Recipe Serving Calculation**
Given a recipe has 4 servings and total calories of 1200,
When the user views per-serving nutrition,
Then it shows 300 kcal per serving.

**AC5: Auto-Save from Correction**
Given a user corrects a Photo AI estimate,
When the correction is saved,
Then user is prompted: "Save 'Homemade Biryani' to your foods for quick access?"

**AC6: Recipe Quick-Log**
Given a user has saved a recipe,
When they want to log it,
Then they can log 1 serving with one tap, auto-filling all macros.

**AC7: Macro Validation**
Given a user enters macros manually,
When calories don't match macro math (P*4 + C*4 + F*9 ≈ calories),
Then a warning is shown: "Macros don't match calories. Check your entries?"

**AC8: Search Priority**
Given a user has custom foods and searches,
When results are displayed,
Then custom foods appear first, followed by database foods.

### Success Metrics
- Custom food creation: 40% of users create 5+ custom foods in first 3 months
- Recipe builder usage: 30% of Deep mode users create 3+ recipes
- Auto-save acceptance: 60% accept prompt to save corrected foods
- Search efficiency: Custom foods selected 70% of time when available

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s save time | Custom foods encrypted | Default private | Form accessibility | iOS 14+, Android 10+ |
| <2s recipe calculation | No sharing without consent | User controls publicity | Voice input option | Cross-device sync |

### Dependencies
- **Prerequisite Stories:** S06.0.1
- **Related Stories:** S06.1.1, S06.4.2
- **External Dependencies:** None (uses existing food database infrastructure)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Recipe macro total = 0 (all ingredients have no data) | Warning: "Couldn't calculate macros. Add ingredients with nutritional data." |
| Duplicate food name | Warning: "You already have 'Chicken Curry'. Update existing or create new?" |
| Very long ingredient list (>20 items) | Allow, but suggest simplifying for tracking ease |
| User deletes ingredient mid-recipe | Recalculate totals immediately |
| Recipe serving size = 0 | Validation error: "Servings must be at least 1" |
| Ingredient not found | Option to add as custom food inline |

### Open Questions
- Should we support importing recipes from URLs?
- Should recipes be shareable (community features)?
- How to handle recipe versioning (user updates recipe)?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] Custom food entry functional
- [ ] Recipe builder with auto-calculation
- [ ] Auto-save from corrections working
- [ ] Search priority implemented
- [ ] Macro validation working