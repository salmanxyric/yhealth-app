---
type: task
id: NS-006
title: OpenAI Integration for AI Features
product: yhealth-platform
status: queued
priority: P0
assignee: Unassigned
item_type: Feature
source: "@PRODUCTS/yhealth-platform/PROGRESS-DEV.md"
story_ids: [S01.2.3, S01.3.1, S01.6.1]
discovery_pending: false
curated: 2025-12-27
started:
completed:
---

# [NS-006] OpenAI Integration for AI Features

## Description
Connect OpenAI API to replace placeholder AI functions. Three critical functions use stubbed responses that need real AI integration for assessment generation, goal suggestions, and plan creation.

## Story Linkage

| Story ID | Story Title | Epic | Link |
|----------|-------------|------|------|
| S01.2.3 | AI Assessment Generation | E01 | stories/ |
| S01.3.1 | AI Goal Suggestions | E01 | stories/ |
| S01.6.1 | AI Plan Generation | E01 | stories/ |

**Coverage**: This task implements:
- [ ] Real AI responses for health assessments
- [ ] Personalized goal generation via AI
- [ ] AI-driven activity plan creation
- [ ] Contextual activity feedback

## AI Context

| Context Type | Reference |
|--------------|-----------|
| **Skills to Activate** | EXPERT-01 (Frontend), DEV-01 (Code Review) |
| **Files to Modify** | `assessment.controller.ts`, `plan.controller.ts` |
| **Dependencies** | OpenAI API key in environment |

## Dependencies

| Type | Item | Status |
|------|------|--------|
| Blocked By | - | - |
| Blocks | - | - |
| Related | NS-005 (Core App UI) | - |

## Acceptance Criteria

- [ ] `generateAIResponse()` returns real AI responses (assessment.controller.ts:364)
- [ ] `generateSuggestedGoals()` returns personalized goals (assessment.controller.ts:516)
- [ ] `generateAIPlan()` creates AI-driven activities (plan.controller.ts:1114)
- [ ] `generateActivityFeedback()` provides contextual feedback (plan.controller.ts:676)

## Definition of Done

- [ ] Acceptance criteria met
- [ ] PROGRESS-DEV.md updated
- [ ] API key management documented
- [ ] Error handling for API failures
- [ ] Rate limiting considered

## Session Notes

>

---
*Created: 2025-12-27 | Product: yhealth-platform | Task: NS-006*
