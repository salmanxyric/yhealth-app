# Chat Calling Design

## Goal

Add WhatsApp-style calling to the chat experience while reusing the existing Socket.IO and WebRTC patterns already used by competition video rooms.

The feature supports:

- One-to-one video calls in direct user chats.
- Multi-user voice calls in group/community chats.
- Incoming call modal when the recipient has the application open.
- High-priority notification fallback when a recipient is offline.
- Persisted call history inside chat as a call message with status and duration.

## Scope

Video calls are limited to direct user-to-user chats. AI coach chats, community chats, and group chats do not expose video calling.

Voice calls are allowed for direct chats and group/community chats. Multi-user calls are audio-only.

The competition video-room implementation remains unchanged. Chat calls use a separate namespace and lifecycle so competition rooms do not inherit ringing, missed-call, or chat-history behavior.

## Architecture

### Server

Add a chat-call service responsible for:

- Verifying the caller belongs to the chat.
- Resolving eligible recipients from chat participants.
- Enforcing direct-chat-only video calls.
- Creating and tracking active call sessions.
- Relaying call lifecycle events through Socket.IO.
- Creating notification fallback records for offline invitees.
- Writing a call summary message when the call ends, is declined, is missed, or is cancelled.

Call signaling uses Socket.IO events:

- `chat:call:invite`
- `chat:call:accept`
- `chat:call:decline`
- `chat:call:cancel`
- `chat:call:end`
- `chat:call:offer`
- `chat:call:answer`
- `chat:call:ice-candidate`
- `chat:call:media-state`

The server emits recipient-facing events to `user:{userId}` rooms and active call events to a call-specific room.

### Client

Add a chat call provider near the chat page shell. It owns:

- Active incoming-call state.
- Outgoing ringing state.
- Active call state.
- WebRTC peer setup and cleanup.
- Accept, decline, cancel, end, mute, camera-toggle, and speaker controls.

The chat header shows:

- Video call button only for direct non-AI chats.
- Voice call button for eligible direct and group chats.

Incoming and active call UI should be modal/fullscreen enough to be obvious, but visually consistent with the existing dark chat interface.

### WebRTC

Create a chat-specific peer client derived from the existing competition `MeshRoomClient` approach.

Direct video calls use camera and microphone constraints.

Group voice calls use microphone-only constraints and do not render a video grid.

ICE offer, answer, and candidate messages are relayed through the chat-call socket events rather than the competition `room:*` events.

## Data Model

Persist call history as regular chat messages with `content_type = 'call'`.

The `content` field stores compact JSON metadata:

```json
{
  "callId": "uuid",
  "callType": "video",
  "status": "ended",
  "startedAt": "2026-05-12T10:00:00.000Z",
  "endedAt": "2026-05-12T10:05:12.000Z",
  "durationSeconds": 312,
  "participantIds": ["caller", "recipient"]
}
```

This avoids a schema migration for the first pass and keeps call cards compatible with existing message pagination, unread counts, and socket delivery. If future analytics require richer querying, this can be promoted into a dedicated `chat_calls` table without changing the chat UI contract.

## Notifications

If an invitee has an active socket connection, they receive `chat:call:incoming` and see the pick-up modal.

If an invitee is offline, the server creates a high-priority notification with:

- Title: incoming voice or video call.
- Message: caller name and chat name.
- Action URL: `/chat?chatId={chatId}` or the closest route supported by the current chat page.

The offline notification does not keep the call alive indefinitely. Unanswered calls time out and write a missed-call message.

## Error Handling

The server rejects:

- Calls from users who are not chat participants.
- Video calls in group/community chats.
- Calls to chats with no eligible recipient.
- Duplicate active calls from the same caller/chat when a call is already ringing or active.

The client handles:

- Camera or microphone permission denial.
- Socket disconnect during ringing or active call.
- Peer connection failure.
- Recipient decline or timeout.

Failures should close media tracks and leave a visible status message or toast.

## Testing

Server tests should cover:

- Participant authorization.
- Direct-video allowance.
- Group-video rejection.
- Group voice allowance.
- Offline notification path.
- Persisted call message content and duration.

Client tests should cover:

- Header button visibility for direct vs group chats.
- Call message adapter/rendering for duration and missed/ended status.

Manual verification should include:

- Direct user video call accept/end.
- Direct user video call decline.
- Offline invite notification.
- Group voice call with multiple recipients.

## Assumptions

- Existing Socket.IO auth and `user:{userId}` rooms are the source of online presence.
- Existing chat messages can safely store a JSON call payload in `content`.
- Push notification delivery follows the existing notification engine behavior.
- TURN server configuration is not added in this pass; existing STUN-only behavior matches the competition implementation.
