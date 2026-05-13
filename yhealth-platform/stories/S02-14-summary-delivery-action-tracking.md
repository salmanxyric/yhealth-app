---
type: story
id: S02.5.2
title: Summary Delivery & Action Tracking
epic: E02
epic_name: Voice Coaching
feature: F2.5
feature_name: Post-Call Summary
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-07
---

# S02.5.2: Summary Delivery & Action Tracking

## User Story

**As a** yHealth user,
**I want** my call summary delivered to both the app and WhatsApp with interactive action items,
**So that** I can access it conveniently and track my progress on commitments.

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

**Multi-Channel Delivery:**
| Channel | Content | Timing |
|---------|---------|--------|
| Mobile App | Full summary | Immediate |
| WhatsApp | Light summary + app link | Within 1 minute |
| Push Notification | "Summary ready" alert | Immediate |

**Action Item Interactivity:**
- Tap to mark complete
- Add to calendar/reminders
- Set deadline if not AI-suggested
- Progress tracking in dashboard

**Action Item Lifecycle:**
1. Extracted from call summary
2. Added to action item dashboard
3. Progress tracked throughout week
4. AI asks about items in next call
5. Completed items celebrated, incomplete explored
6. Completion feeds into goal progress tracking

**Export Options:**
- Copy summary to clipboard
- Share to notes apps (Apple Notes, Google Keep)
- Email summary to self
- Export as PDF (Deep mode)

**Light Mode:**
- WhatsApp delivery: Condensed summary
- App: Full summary
- Basic action item tracking

**Deep Mode:**
- Full summary on all channels
- Advanced action item features (calendar, reminders)
- Export to multiple formats
- Summary searchable in history

---

## Acceptance Criteria

```gherkin
Scenario: Multi-channel delivery
  Given a summary is generated
  When delivery is triggered
  Then it appears in both mobile app and WhatsApp within 1 minute

Scenario: Action item interactivity
  Given a summary contains action items
  When the user views them in app
  Then they can tap to mark complete, add to calendar, or set deadline

Scenario: WhatsApp action completion
  Given a user marked an action item complete via WhatsApp
  When they reply "Done ✅"
  Then the item is marked complete and synced to app

Scenario: Summary export
  Given a user wants to export their summary
  When they select export option
  Then they can copy, share, or email the summary

Scenario: AI follow-up on action items
  Given the next call starts
  When action items were set in previous call
  Then AI asks: "How did your action items go?"

Scenario: WhatsApp delivery fallback
  Given WhatsApp delivery fails
  When the error is detected
  Then the system retries, then notifies: "Summary available in app. WhatsApp delivery delayed."
```

---

## Success Metrics

- Delivery Success Rate: 99% delivered to both channels
- Action Item Completion Rate: 60% completed within 7 days
- Summary View Rate: 75% viewed within 24 hours
- Export Usage: 20% of Deep mode users export summaries
- WhatsApp Engagement: 40% reply to WhatsApp summary actions

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1 min delivery | Encrypted transmission | Summary data protected | Screen reader support | iOS, Android, WhatsApp |
| Reliable sync | Auth for all channels | Export excludes sensitive data | Action items accessible | Export formats standard |

---

## Dependencies

- **Prerequisite Stories:** S02.5.1 (summary generation)
- **Related Stories:** E4 Mobile App (dashboard), E3 WhatsApp (delivery)
- **External Dependencies:** WhatsApp Business API, Calendar APIs, Notes app integrations

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| WhatsApp delivery fails | Retry 3x, fallback to app-only with notification |
| User has app notifications disabled | WhatsApp delivery becomes primary |
| Calendar integration fails | Note failure, allow manual adding |
| Action item deadline passed | Show as overdue, offer to reschedule or close |
| User hasn't viewed summary in 48 hours | Send reminder nudge |

---

## Open Questions

- Third-party notes app integration priority (Notion, Evernote)
- Action item reminder frequency customization

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] App delivery working
- [ ] WhatsApp delivery working
- [ ] Push notification working
- [ ] Action item tap-to-complete functional
- [ ] Calendar/reminder integration working
- [ ] Export options functional
- [ ] AI follow-up on action items working
- [ ] WhatsApp reply handling working

---

*Story S02.5.2 | Epic E02 | Product: yHealth Platform*
