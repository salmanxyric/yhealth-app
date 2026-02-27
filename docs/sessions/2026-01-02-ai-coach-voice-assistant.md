# Session: AI Coach & Voice Assistant Implementation

**Date:** 2026-01-02
**Commit:** `0bf52be` - feat(ai-coach): Add RAG-based AI health coach with voice assistant

---

## Summary

Implemented a complete RAG-based AI health coaching system with both text and voice interfaces, providing users with personalized health and fitness guidance powered by GPT-4o-mini with semantic search capabilities.

---

## Tasks Completed

### 1. Backend - RAG Chatbot Service

**Files Created:**
- `server/src/services/rag-chatbot.service.ts` - Core RAG chatbot with LangChain
- `server/src/services/vector-embedding.service.ts` - Vector storage & semantic search
- `server/src/controllers/rag-chatbot.controller.ts` - API controller
- `server/src/routes/rag-chatbot.routes.ts` - REST API routes

**Features:**
- RAG context retrieval (knowledge base, user profile, conversation history)
- Streaming chat responses via SSE (Server-Sent Events)
- Conversation management (create, get, delete, archive)
- Conversation title and summary generation
- Health profile sections (goals, conditions, preferences, history, metrics)
- Knowledge categories (nutrition, exercise, sleep, mental_health, medical, general)

**API Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rag-chat/message` | Send message, get AI response |
| POST | `/api/rag-chat/message/stream` | Send message, get streaming response |
| POST | `/api/rag-chat/conversations` | Create new conversation |
| GET | `/api/rag-chat/conversations` | Get user's conversation list |
| GET | `/api/rag-chat/conversations/:id` | Get conversation with messages |
| DELETE | `/api/rag-chat/conversations/:id` | Delete conversation |
| PATCH | `/api/rag-chat/conversations/:id/archive` | Archive conversation |
| POST | `/api/rag-chat/conversations/:id/title` | Generate title |
| POST | `/api/rag-chat/conversations/:id/summary` | Generate summary |
| GET | `/api/rag-chat/search` | Search conversation history |
| POST | `/api/rag-chat/profile` | Update health profile |
| POST | `/api/rag-chat/knowledge` | Add knowledge (admin) |
| GET | `/api/rag-chat/knowledge/search` | Search knowledge base |

---

### 2. Frontend - AI Coach Tab

**Files Created:**
- `client/app/(pages)/dashboard/components/tabs/AICoachTab.tsx`

**Features:**
- Text-based chat interface
- Message history display
- Conversation list sidebar
- New conversation creation
- Responsive design

---

### 3. Frontend - Voice Assistant Tab

**Files Created:**
- `client/app/(pages)/dashboard/components/tabs/VoiceAssistantTab.tsx`
- `client/types/speech.d.ts` - TypeScript declarations for Web Speech API

**Features:**
- Vapi-like voice assistant experience
- Web Speech API integration (SpeechRecognition, SpeechSynthesis)
- Auto-detection when user stops speaking (silence threshold: 1200ms)
- Continuous conversation flow with auto-restart
- Streaming response display (text appears as AI generates)
- Female voice preference with natural pitch settings
- Visual orb UI with state-based animations
- TTS toggle control

**Voice Selection Priority:**
1. Samantha, Victoria, Karen, Moira, Tessa, Fiona
2. Google UK/US English Female
3. Microsoft Zira, Hazel, Susan
4. Aria, Jenny, Sara, Natasha, Ava, Allison
5. Any English voice (fallback)

---

### 4. Frontend - Chat Service

**Files Created:**
- `client/src/shared/services/rag-chat.service.ts`

**Features:**
- Complete API client for RAG chat endpoints
- TypeScript types for all responses
- Conversation CRUD operations
- Search functionality

---

### 5. Frontend - Standalone Chat Page

**Files Created:**
- `client/app/(pages)/chat/page.tsx`
- `client/app/(pages)/chat/components/ChatInput.tsx`
- `client/app/(pages)/chat/components/ChatMessage.tsx`
- `client/app/(pages)/chat/components/ConversationSidebar.tsx`
- `client/app/(pages)/chat/components/index.ts`

---

### 6. Dashboard Integration

**Files Modified:**
- `client/app/(pages)/dashboard/components/DashboardSidebar.tsx` - Added AI Coach & Voice Assistant tabs
- `client/app/(pages)/dashboard/components/tabs/index.ts` - Export new tabs
- `client/app/(pages)/dashboard/page.tsx` - Render new tabs

---

## Bug Fixes During Implementation

### Fix 1: Function Ordering Bug
- **Issue:** `speakText` referenced `startSpeaking` before it was defined
- **Solution:** Moved `startSpeaking` inside `speakText` as nested function

### Fix 2: Stale Closure in Callbacks
- **Issue:** Voice assistant stuck in "Ready" state, not transitioning to "Listening"
- **Root Cause:** Circular dependencies and stale state closures
- **Solution:** Used refs (`isConversationActiveRef`, `conversationIdRef`, `isTTSEnabledRef`) synced via useEffect

### Fix 3: API URL Configuration
- **Issue:** Frontend called `/api/rag-chat/message/stream` instead of backend URL
- **Solution:** Updated to use `${API_URL}/rag-chat/message/stream` with proper auth headers

### Fix 4: Validation Error for null conversationId
- **Issue:** Zod schema rejected `null` for `conversationId` field
- **Solution:** Only include `conversationId` in request body when it exists (not null)

---

## Technical Stack

**Backend:**
- LangChain with ChatOpenAI (GPT-4o-mini)
- Server-Sent Events (SSE) for streaming
- PostgreSQL for conversation storage
- Vector embeddings for semantic search

**Frontend:**
- React with TypeScript
- Web Speech API (SpeechRecognition, SpeechSynthesis)
- Framer Motion for animations
- Tailwind CSS for styling

---

## Configuration

**Environment Variables:**
- `OPENAI_API_KEY` - Required for LangChain/OpenAI integration
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:9090/api`)

**LLM Settings:**
- Model: `gpt-4o-mini`
- Temperature: `0.7`
- Max Tokens: `1024`

---

## Testing Notes

1. Start backend: `cd server && npm run dev`
2. Start frontend: `cd client && npm run dev`
3. Navigate to Dashboard > AI Coach or Voice Assistant
4. For voice: Allow microphone permission, tap orb to start

---

## Files Changed Summary

| Category | Files Added | Files Modified |
|----------|-------------|----------------|
| Backend Services | 2 | 0 |
| Backend Controllers | 1 | 0 |
| Backend Routes | 1 | 1 |
| Frontend Components | 7 | 3 |
| Frontend Services | 1 | 1 |
| Type Definitions | 1 | 0 |
| Database | 2 | 0 |
| **Total** | **15** | **5** |

---

## Next Steps (Future)

- [ ] Add pgvector for true vector similarity search
- [ ] Implement knowledge base seeding with health content
- [ ] Add voice activity detection (VAD) for better silence detection
- [ ] Implement conversation export/import
- [ ] Add multi-language support
- [ ] Integrate with user's health data (workouts, nutrition, etc.)
