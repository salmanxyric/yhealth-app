---
type: story
id: S06.1.3
title: Voice & WhatsApp Meal Logging
epic: E06
feature: F6.1
product: yhealth-platform
priority: P0
status: Draft
---

# Voice & WhatsApp Meal Logging

### User Story
**As a** Holistic Health Seeker (P1),
**I want to** log meals via WhatsApp messages or voice commands,
**So that** I can maintain consistent tracking without always opening the app.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users can log meals through natural language - either by sending WhatsApp messages/photos or speaking to the Voice Coaching system. The AI extracts food items, estimates portions, and logs meals seamlessly across all channels.

**WhatsApp Meal Logging:**
- **Text messages:** "I had scrambled eggs and toast for breakfast"
- **Photo messages:** Send meal photo for AI analysis (same as S06.1.1)
- **Voice messages:** Transcribed and processed as text
- **Quick confirmations:** Reply "yes" to confirm AI suggestions

**Voice Coaching Meal Logging:**
- **Conversational input:** "Log my lunch: chicken biryani, one plate"
- **Clarification dialogue:** AI asks follow-ups if details missing
- **Multi-turn conversation:** Handle complex meals with multiple items
- **Context awareness:** Remembers meal context during conversation

**Natural Language Processing:**
| Input Example | AI Extraction |
|---------------|---------------|
| "I had scrambled eggs and toast for breakfast" | Foods: scrambled eggs, toast; Meal: breakfast; Portions: estimated standard |
| "Log my lunch: chicken biryani, one plate" | Foods: chicken biryani; Meal: lunch; Portion: 1 plate (~400g) |
| "Just had a coffee with milk" | Foods: coffee with milk; Meal: snack; Portion: 1 cup |
| "Ate leftover pizza, 2 slices" | Foods: pizza; Portion: 2 slices |

**Clarification Triggers:**
- Portion unclear: "Did you say 'one cup' or 'one plate' of rice?"
- Food ambiguous: "Was that regular coffee or espresso?"
- Meal type missing: "What meal was this - breakfast, lunch, dinner, or snack?"
- Multiple interpretations: "Did you mean chicken biryani or vegetable biryani?"

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Single message → AI extracts → Auto-confirms high confidence → Logged with brief confirmation. |
| **Deep** | Message → AI extracts → Shows detailed breakdown → User confirms/adjusts each item → Full macro summary provided. |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Input Text | String | From user message | User-only |
| Input Type | Enum | text/voice/photo | System |
| Channel | Enum | whatsapp/voice_coaching | System |
| Extracted Foods | Array | From NLP | User-only |
| NLP Confidence | Float | 0-100% | System |
| User Confirmations | Object | Changes from extraction | User-only |

**Behaviors:**
- Messages processed within 5 seconds
- High confidence (>85%) auto-confirms in Light mode
- Low confidence (<70%) triggers clarification
- All logs sync to Mobile App immediately
- WhatsApp acknowledges with summary message
- Voice Coaching confirms verbally

### Acceptance Criteria

**AC1: WhatsApp Text Logging**
Given a user sends "I had scrambled eggs and toast for breakfast" via WhatsApp,
When the message is processed,
Then AI extracts foods (scrambled eggs, toast), meal type (breakfast), and logs with estimated portions.

**AC2: WhatsApp Photo Logging**
Given a user sends a meal photo via WhatsApp,
When the photo is processed,
Then AI analyzes it (same as S06.1.1) and responds with detected foods and nutritional summary.

**AC3: WhatsApp Voice Message**
Given a user sends a voice message describing their meal,
When the voice is transcribed and processed,
Then meal is logged as if it were a text message.

**AC4: Voice Coaching Logging**
Given a user says "Log my lunch: chicken biryani, one plate" during a Voice Coaching session,
When the AI processes the input,
Then the meal is logged and AI confirms: "Got it! Logged chicken biryani, one plate for lunch - about 550 calories."

**AC5: Clarification Dialogue**
Given a user input has ambiguous details (e.g., "I had some rice"),
When NLP confidence is below 70%,
Then AI asks clarifying question: "How much rice - one cup, one bowl, or one plate?"

**AC6: NLP Accuracy**
Given various natural language meal descriptions,
When NLP processes the inputs,
Then food items are correctly extracted with 85%+ accuracy.

**AC7: Cross-Channel Sync**
Given a user logs a meal via WhatsApp,
When the log is complete,
Then the meal appears in the Mobile App within 5 minutes with full details.

**AC8: Multi-Item Logging**
Given a user describes multiple foods ("eggs, toast, orange juice, and coffee"),
When the message is processed,
Then all four items are extracted and logged as part of the same meal.

### Success Metrics
- Voice/WhatsApp logging adoption: 30% of users try within first month
- NLP extraction accuracy: 85%+ correct food identification
- Clarification rate: <30% of logs require follow-up questions
- Cross-channel sync: 100% within 5 minutes
- User satisfaction: 4.3/5 for voice/WhatsApp logging

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5s message processing | WhatsApp E2E encryption | Voice recordings not stored | Native voice input | WhatsApp integration (E3) |
| <5min sync latency | Voice data encrypted | Transcriptions deleted after processing | Multi-language support | Voice Coaching (E2) |

### Dependencies
- **Prerequisite Stories:** S06.0.1, S06.1.1, S06.1.2
- **Related Stories:** S06.2.1
- **External Dependencies:** E2 (Voice Coaching), E3 (WhatsApp Integration)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Voice message too noisy | "I couldn't understand that clearly. Could you try again or type it out?" |
| Unknown food mentioned | "I don't recognize 'makhani'. Is that a type of curry?" with suggestions |
| Very long message | Process first 5-10 food items, ask if there's more |
| Mixed languages | Support English + common regional terms (biryani, daal, etc.) |
| User says "nevermind" or "cancel" | Cancel current logging, confirm cancellation |
| Conflicting information | "You said breakfast but it's 7pm. Did you mean dinner?" |
| WhatsApp rate limiting | Queue messages, process in order, acknowledge receipt |
| Voice coaching disconnection | Save partial log, resume when reconnected |

### Open Questions
- Should we support logging by emoji (e.g., "🍕🍕" = 2 slices pizza)?
- What languages should NLP support beyond English?
- Should WhatsApp support "quick log" buttons (breakfast/lunch/dinner)?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] WhatsApp text, photo, voice logging functional
- [ ] Voice Coaching logging functional
- [ ] NLP extraction accuracy validated (85%+)
- [ ] Clarification dialogue working
- [ ] Cross-channel sync <5 minutes
- [ ] Multi-item logging working