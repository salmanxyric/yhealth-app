System Design: User-
Initiated Voice Calls (S02.1.1)

1. Architecture Overview
1.1 System Components
The voice calling system consists of:

Frontend (Next.js): Call initiation UI, WebRTC client, call status management
Backend API (Express): Call orchestration, authentication, call history
Voice Infrastructure: WebRTC signaling server or third-party service (Twilio/Vonage)
WhatsApp Business API: Voice command processing
AI Coach Service: Real-time conversation during calls
Database (PostgreSQL): Call history, session tracking
Real-time Communication: Socket.io for call state updates
1.2 High-Level Architecture
External Services
Data Layer
AI Services
Voice Infrastructure
API Layer
Client Layer
HTTPS
Webhook
HTTPS
Webhook
WhatsApp Business API
PostgreSQL(Call History)
Redis(Call State Cache)
AI Coach Service(LangChain)
RAG Service(Context)
WebRTC Server(Signaling)
Media Server(STUN/TURN)
Express API(Call Orchestration)
Auth Middleware(JWT)
Call Controller
Mobile App(Next.js)
WhatsApp(Business API)
App Widget(iOS/Android)


2. Database Schema
2.1 Voice Calls Table
File: server/src/database/tables/18-voice-calls.sql



-- Voice Calls Table
CREATE TYPE call_status AS ENUM (
  'initiating',    -- Call being set up
  'connecting',   -- Establishing connection
  'ringing',       -- Waiting for answer
  'active',        -- Call in progress
  'ended',         -- Call completed normally
  'failed',        -- Call failed to connect
  'timeout',       -- Connection timeout
  'cancelled'      -- User cancelled before connection
);

CREATE TYPE call_channel AS ENUM (
  'mobile_app',    -- Mobile app button
  'whatsapp',      -- WhatsApp voice command
  'widget'         -- Home screen widget
);

CREATE TABLE voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Call metadata
  channel call_channel NOT NULL,
  status call_status DEFAULT 'initiating',
  session_id UUID,  -- Links to ai_coach_sessions if conversation started
  
  -- Timing
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  connected_at TIMESTAMP,
  ended_at TIMESTAMP,
  connection_duration INTEGER,  -- Seconds to connect
  call_duration INTEGER,         -- Total call duration in seconds
  
  -- Connection details
  webrtc_session_id VARCHAR(255),
  signaling_url TEXT,
  ice_servers JSONB,
  
  -- Error tracking
  error_code VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Context
  pre_call_context TEXT,  -- User's stated reason for call
  call_summary TEXT,       -- AI-generated summary after call
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_voice_calls_user ON voice_calls(user_id, initiated_at DESC);
CREATE INDEX idx_voice_calls_status ON voice_calls(status) WHERE status IN ('initiating', 'connecting', 'active');
CREATE INDEX idx_voice_calls_channel ON voice_calls(channel, initiated_at DESC);
CREATE INDEX idx_voice_calls_webrtc_session ON voice_calls(webrtc_session_id) WHERE webrtc_session_id IS NOT NULL;


2.2 Call Events Table (Optional - for detailed analytics)
CREATE TYPE call_event_type AS ENUM (
  'initiated',
  'signaling_started',
  'ice_candidate_exchanged',
  'connection_established',
  'media_started',
  'ai_response_started',
  'ai_response_completed',
  'user_spoke',
  'call_ended',
  'error_occurred'
);

CREATE TABLE voice_call_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
  event_type call_event_type NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_events_call ON voice_call_events(call_id, timestamp);


3. API Design
3.1 Call Initiation Endpoints
File: server/src/routes/voice-calls.routes.ts

POST   /api/voice-calls/initiate
  Body: { channel: 'mobile_app' | 'whatsapp' | 'widget', pre_call_context?: string }
  Response: { callId, webrtcConfig, signalingUrl, status }

GET    /api/voice-calls/:callId/status
  Response: { status, connectionDuration, callDuration, error }

POST   /api/voice-calls/:callId/end
  Response: { success, summary }

GET    /api/voice-calls/history
  Query: { page, limit, channel? }
  Response: { calls[], total, page }

GET    /api/voice-calls/:callId
  Response: { call details, summary, transcript }


3.2 WebRTC Signaling Endpoints
POST   /api/voice-calls/:callId/offer
  Body: { sdp, type: 'offer' }
  Response: { answer: { sdp, type: 'answer' } }

POST   /api/voice-calls/:callId/ice-candidate
  Body: { candidate, sdpMLineIndex, sdpMid }
  Response: { success }

GET    /api/voice-calls/:callId/ice-servers
  Response: { iceServers[] }


3.3 WhatsApp Webhook Endpoint
POST   /api/webhooks/whatsapp/voice-command
  Body: { From, Body, MessageType }
  Response: { status, callId? }


4. Service Layer Design
4.1 Voice Call Service
File: server/src/services/voice-call.service.tsResponsibilities:

Call lifecycle management (initiate, connect, end)
WebRTC session management
Call state persistence
Retry logic for failed connections
Integration with AI Coach for real-time responses
Key Methods:

class VoiceCallService {
  async initiateCall(userId: string, channel: CallChannel, context?: string): Promise<CallInitiationResponse>
  async establishConnection(callId: string, webrtcOffer: RTCSessionDescription): Promise<RTCSessionDescription>
  async handleIceCandidate(callId: string, candidate: RTCIceCandidate): Promise<void>
  async endCall(callId: string, reason?: string): Promise<CallSummary>
  async getCallHistory(userId: string, filters: CallHistoryFilters): Promise<CallHistoryResponse>
  async retryConnection(callId: string): Promise<boolean>
  async generateCallSummary(callId: string): Promise<string>
}


4.2 WebRTC Signaling Service
File: server/src/services/webrtc-signaling.service.ts

Responsibilities:

WebRTC offer/answer exchange
ICE candidate management
STUN/TURN server configuration
Connection quality monitoring
4.3 WhatsApp Voice Command Service
File: server/src/services/whatsapp-voice-command.service.ts

Responsibilities:

Process WhatsApp voice messages
Extract voice commands ("Call my coach", "Hey Coach")
Trigger call initiation
Send WhatsApp status updates
Voice Command Patterns:

"Call my coach" / "Call coach"
"Hey Coach" / "Hi Coach"
"Start voice call"
"Connect to AI coach"
5. Frontend Components
5.1 Call Initiation Components
File: client/app/(pages)/dashboard/components/CallCoachButton.tsx

One-tap "Call Coach" button
Connection status indicator
Pre-call context input (Deep Mode)
File: client/app/components/voice/CallWidget.tsx

iOS/Android home screen widget
Quick call initiation
Call status display
File: client/app/components/voice/ActiveCallView.tsx

Active call UI
Real-time audio visualization
Call controls (mute, end)
Connection quality indicator
5.2 WebRTC Client
File: client/lib/webrtc/voice-call-client.tsResponsibilities:

WebRTC peer connection management
Media stream handling (microphone)
Signaling with backend
Connection state management
Error handling and retry logic
5.3 Call History Component
File: client/app/(pages)/dashboard/components/CallHistory.tsx

List of past calls
Filter by channel, date
Call details modal
Summary and transcript display
6. Real-Time Communication Flow
6.1 Call Initiation Flow
DB
AICoach
WebRTC
VoiceService
API
Frontend
User
DB
AICoach
WebRTC
VoiceService
API
Frontend
User
Real-time voice conversation
Tap "Call Coach"
POST /api/voice-calls/initiate
initiateCall(userId, channel)
Create call record (status: initiating)
Create signaling session
signalingUrl, iceServers
Prepare AI session
sessionId
{ callId, webrtcConfig, status }
Call initiation response
Initialize WebRTC peer connection
Create offer
Answer
POST /api/voice-calls/:id/offer
establishConnection(callId, offer)
Update status: connecting
Start AI conversation
Answer SDP
Connection established
Update status: active (via Socket.io)


6.2 WhatsApp Voice Command Flow
UserPhone
WebRTC
VoiceService
Webhook
WhatsAppAPI
WhatsApp
User
UserPhone
WebRTC
VoiceService
Webhook
WhatsAppAPI
WhatsApp
User
alt
[Command recognized]
[Command not recognized]
Send "Call my coach" voice message
Voice message received
POST /api/webhooks/whatsapp/voice-command
Process voice command
Extract command intent
initiateCall(userId, 'whatsapp')
Create call session
Initiate voice call
Ring
Answer call
Call connected
Connection established
Send status update
"Call connected"
Send clarification message
"Say 'Call my coach' to start"


7. Integration Points
7.1 WebRTC Infrastructure Options
Option A: Self-Hosted (Janus/Mediasoup)

Full control
Higher setup complexity
Requires STUN/TURN servers
Option B: Third-Party Service (Twilio/Vonage)

Faster implementation
Managed infrastructure
Cost per minute
Recommended for MVP
Recommendation: Start with Twilio Programmable Voice for MVP, migrate to self-hosted if needed.

7.2 WhatsApp Business API Integration
Setup Requirements:

WhatsApp Business Account
Meta Business Verification
Webhook configuration
Voice message processing
Implementation:

Use Twilio WhatsApp API or Meta Cloud API
Process incoming voice messages
Extract text via speech-to-text
Match against command patterns
Trigger call initiation
8. AI Coach Integration
8.1 Real-Time Voice Conversation
File: server/src/services/voice-ai-coach.service.ts

Flow:

User speaks → Speech-to-Text (WebRTC audio stream)
Text sent to RAG Chatbot Service
AI generates response
Response → Text-to-Speech
Audio streamed back via WebRTC
Optimizations: