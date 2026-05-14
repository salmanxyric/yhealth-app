/**
 * @file Chat Call Service
 * @description Volatile call orchestration for chat voice/video calls.
 */

import { randomUUID } from 'crypto';
import { query } from '../config/database.config.js';
import { chatService } from './chat.service.js';
import { messageService } from './message.service.js';
import { notificationEngine } from './notification-engine.service.js';
import { socketService } from './socket.service.js';
import { logger } from './logger.service.js';
import { ApiError } from '../utils/ApiError.js';
import { transformMessageForSocket } from '../utils/message-transform.util.js';
import { communicationPreferencesService } from './communication-preferences.service.js';
import { pushNotificationService } from './push-notification.service.js';
import { getUserLocalHour } from '../lib/user-timezone.js';

type ChatCallType = 'voice' | 'video';
type ChatCallStatus = 'ringing' | 'active' | 'ended' | 'declined' | 'missed' | 'cancelled';

interface ChatCallParticipant {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  audioEnabled: boolean;
  videoEnabled: boolean;
  joinedAt?: string;
}

interface ChatCallSession {
  id: string;
  chatId: string;
  chatName: string;
  callType: ChatCallType;
  isGroupCall: boolean;
  initiatorId: string;
  initiatorName: string;
  initiatorAvatar?: string | null;
  participantProfiles: Map<string, { name: string; avatar?: string | null }>;
  participantIds: string[];
  invitedUserIds: string[];
  acceptedUserIds: Set<string>;
  declinedUserIds: Set<string>;
  status: ChatCallStatus;
  createdAt: Date;
  startedAt: Date | null;
  endedAt: Date | null;
  timeout?: NodeJS.Timeout;
  mediaState: Map<string, { audioEnabled: boolean; videoEnabled: boolean }>;
}

const CALL_TIMEOUT_MS = 45_000;
const AI_COACH_USER_ID = process.env.AI_COACH_USER_ID || '00000000-0000-0000-0000-000000000001';

const EVENTS = {
  INCOMING: 'chat:call:incoming',
  OUTGOING: 'chat:call:outgoing',
  ACCEPTED: 'chat:call:accepted',
  DECLINED: 'chat:call:declined',
  CANCELLED: 'chat:call:cancelled',
  ENDED: 'chat:call:ended',
  PARTICIPANTS_LIST: 'chat:call:participants-list',
  PARTICIPANT_JOINED: 'chat:call:participant-joined',
  PARTICIPANT_LEFT: 'chat:call:participant-left',
  MEDIA_STATE: 'chat:call:media-state-changed',
  OFFER: 'chat:call:offer',
  ANSWER: 'chat:call:answer',
  ICE_CANDIDATE: 'chat:call:ice-candidate',
  ERROR: 'chat:call:error',
} as const;

function displayName(user?: { first_name?: string; last_name?: string; email?: string }): string {
  if (!user) return 'Unknown user';
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.email || 'Unknown user';
}

class ChatCallService {
  private calls = new Map<string, ChatCallSession>();

  async invite(chatId: string, initiatorId: string, callType: ChatCallType): Promise<ChatCallSession> {
    const chat = await chatService.getChatById(chatId, initiatorId);

    if (callType !== 'voice' && callType !== 'video') {
      throw ApiError.badRequest('Invalid call type');
    }

    if (callType === 'video' && chat.is_group_chat) {
      throw ApiError.badRequest('Video calls are only available in direct chats');
    }

    const participants = chat.participants.filter((p) => !p.left_at && !p.is_blocked);
    const initiator = participants.find((p) => p.user_id === initiatorId);
    const invitees = participants.filter((p) => p.user_id !== initiatorId && p.user_id !== AI_COACH_USER_ID);

    if (!initiator) {
      throw ApiError.forbidden('You are not a participant of this chat');
    }

    if (invitees.length === 0) {
      throw ApiError.badRequest('No eligible participants to call');
    }

    const existing = Array.from(this.calls.values()).find(
      (call) =>
        call.chatId === chatId &&
        call.initiatorId === initiatorId &&
        (call.status === 'ringing' || call.status === 'active'),
    );
    if (existing) {
      throw ApiError.conflict('A call is already active for this chat');
    }

    const call: ChatCallSession = {
      id: randomUUID(),
      chatId,
      chatName: chat.chat_name,
      callType,
      isGroupCall: chat.is_group_chat,
      initiatorId,
      initiatorName: displayName(initiator.user),
      initiatorAvatar: initiator.user?.avatar,
      participantProfiles: new Map(
        participants.map((participant) => [
          participant.user_id,
          {
            name: displayName(participant.user),
            avatar: participant.user?.avatar,
          },
        ]),
      ),
      participantIds: participants.map((p) => p.user_id),
      invitedUserIds: invitees.map((p) => p.user_id),
      acceptedUserIds: new Set([initiatorId]),
      declinedUserIds: new Set(),
      status: 'ringing',
      createdAt: new Date(),
      startedAt: null,
      endedAt: null,
      mediaState: new Map([[initiatorId, { audioEnabled: true, videoEnabled: callType === 'video' }]]),
    };

    call.timeout = setTimeout(() => {
      this.timeoutCall(call.id).catch((error) => {
        logger.error('[ChatCall] Timeout handling failed', {
          callId: call.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, CALL_TIMEOUT_MS);

    this.calls.set(call.id, call);

    const outgoingPayload = this.toPayload(call);
    socketService.emitToUser(initiatorId, EVENTS.OUTGOING, outgoingPayload);

    for (const invitee of invitees) {
      const payload = this.toPayload(call, invitee.user_id);
      if (socketService.isUserConnected(invitee.user_id)) {
        socketService.emitToUser(invitee.user_id, EVENTS.INCOMING, payload);
      } else {
        await notificationEngine.send({
          userId: invitee.user_id,
          type: 'chat_call',
          title: `Incoming ${callType} call`,
          message: `${call.initiatorName} is calling you${chat.is_group_chat ? ` in ${chat.chat_name}` : ''}.`,
          icon: callType === 'video' ? 'video' : 'phone',
          actionUrl: `/chat?chatId=${chatId}`,
          actionLabel: 'Open chat',
          category: 'chat',
          priority: 'high',
          relatedEntityType: 'chat_call',
          relatedEntityId: call.id,
          metadata: { callId: call.id, chatId, callType },
          expiresAt: new Date(Date.now() + CALL_TIMEOUT_MS).toISOString(),
        });
      }
    }

    logger.info('[ChatCall] Call invited', {
      callId: call.id,
      chatId,
      initiatorId,
      callType,
      inviteeCount: invitees.length,
    });

    await this.persistCallStart(call);

    return call;
  }

  async accept(callId: string, userId: string): Promise<ChatCallSession> {
    const call = this.requireCall(callId);
    this.requireParticipant(call, userId);

    if (call.status !== 'ringing' && call.status !== 'active') {
      throw ApiError.badRequest('Call is no longer available');
    }

    call.declinedUserIds.delete(userId);
    call.acceptedUserIds.add(userId);
    call.mediaState.set(userId, { audioEnabled: true, videoEnabled: call.callType === 'video' && !call.isGroupCall });

    if (call.status === 'ringing') {
      call.status = 'active';
      call.startedAt = new Date();
      if (call.timeout) clearTimeout(call.timeout);
      call.timeout = undefined;
    }

    await this.persistCallState(call);

    const acceptedParticipants = this.getAcceptedParticipants(call);

    socketService.emitToUser(userId, EVENTS.PARTICIPANTS_LIST, {
      call: this.toPayload(call, userId),
      participants: acceptedParticipants.filter((p) => p.userId !== userId),
      self: acceptedParticipants.find((p) => p.userId === userId),
    });

    this.emitToCallParticipants(call, EVENTS.ACCEPTED, {
      call: this.toPayload(call),
      participant: acceptedParticipants.find((p) => p.userId === userId),
    });

    logger.info('[ChatCall] Call accepted', { callId, userId });
    return call;
  }

  async decline(callId: string, userId: string): Promise<void> {
    const call = this.requireCall(callId);
    this.requireParticipant(call, userId);

    if (call.status !== 'ringing' && call.status !== 'active') return;

    call.declinedUserIds.add(userId);
    call.acceptedUserIds.delete(userId);

    this.emitToCallParticipants(call, EVENTS.DECLINED, {
      callId,
      chatId: call.chatId,
      userId,
    });

    const allInviteesDone = call.invitedUserIds.every(
      (id) => call.declinedUserIds.has(id) || !socketService.isUserConnected(id),
    );

    if (!call.isGroupCall || allInviteesDone) {
      await this.finishCall(call, 'declined');
    }
  }

  async cancel(callId: string, userId: string): Promise<void> {
    const call = this.requireCall(callId);
    if (call.initiatorId !== userId) {
      throw ApiError.forbidden('Only the caller can cancel this call');
    }
    if (call.status !== 'ringing') return;
    await this.finishCall(call, 'cancelled');
  }

  async end(callId: string, userId: string): Promise<void> {
    const call = this.requireCall(callId);
    this.requireParticipant(call, userId);
    if (call.status !== 'ringing' && call.status !== 'active') return;
    await this.finishCall(call, call.status === 'active' ? 'ended' : 'cancelled');
  }

  updateMediaState(
    callId: string,
    userId: string,
    state: { audioEnabled?: boolean; videoEnabled?: boolean },
  ): void {
    const call = this.requireCall(callId);
    this.requireParticipant(call, userId);

    const current = call.mediaState.get(userId) || {
      audioEnabled: true,
      videoEnabled: call.callType === 'video' && !call.isGroupCall,
    };
    const next = {
      audioEnabled: state.audioEnabled ?? current.audioEnabled,
      videoEnabled: call.isGroupCall ? false : state.videoEnabled ?? current.videoEnabled,
    };
    call.mediaState.set(userId, next);

    this.emitToCallParticipants(call, EVENTS.MEDIA_STATE, {
      callId,
      userId,
      ...next,
    });
  }

  relayOffer(callId: string, fromUserId: string, targetUserId: string, sdp: string): void {
    const call = this.requireCall(callId);
    this.requireAccepted(call, fromUserId);
    this.requireAccepted(call, targetUserId);
    socketService.emitToUser(targetUserId, EVENTS.OFFER, { callId, fromUserId, sdp });
  }

  relayAnswer(callId: string, fromUserId: string, targetUserId: string, sdp: string): void {
    const call = this.requireCall(callId);
    this.requireAccepted(call, fromUserId);
    this.requireAccepted(call, targetUserId);
    socketService.emitToUser(targetUserId, EVENTS.ANSWER, { callId, fromUserId, sdp });
  }

  relayIceCandidate(
    callId: string,
    fromUserId: string,
    targetUserId: string,
    candidate: { candidate: string; sdpMLineIndex: number | null; sdpMid: string | null },
  ): void {
    const call = this.requireCall(callId);
    this.requireAccepted(call, fromUserId);
    this.requireAccepted(call, targetUserId);
    socketService.emitToUser(targetUserId, EVENTS.ICE_CANDIDATE, { callId, fromUserId, candidate });
  }

  handleDisconnect(userId: string): void {
    for (const call of Array.from(this.calls.values())) {
      if (!call.acceptedUserIds.has(userId)) continue;
      call.acceptedUserIds.delete(userId);
      this.emitToCallParticipants(call, EVENTS.PARTICIPANT_LEFT, {
        callId: call.id,
        userId,
      });

      if (call.status === 'active' && call.acceptedUserIds.size < 2) {
        this.finishCall(call, 'ended').catch(() => {});
      }
    }
  }

  emitPendingIncomingCalls(userId: string): void {
    for (const call of this.calls.values()) {
      const shouldNotify =
        call.status === 'ringing' &&
        call.invitedUserIds.includes(userId) &&
        !call.acceptedUserIds.has(userId) &&
        !call.declinedUserIds.has(userId);

      if (shouldNotify) {
        socketService.emitToUser(userId, EVENTS.INCOMING, this.toPayload(call, userId));
      }
    }
  }

  async initiateAICoachCall(
    targetUserId: string,
    context: { preCallContext: string; sessionType: string },
  ): Promise<ChatCallSession> {
    const chatId = await this.findOrCreateAICoachChat(targetUserId);

    const aiCoachProfile = await query<{ first_name: string; last_name: string; avatar: string | null }>(
      `SELECT first_name, last_name, avatar FROM users WHERE id = $1`,
      [AI_COACH_USER_ID],
    );
    const aiProfile = aiCoachProfile.rows[0];
    const aiName = aiProfile ? displayName(aiProfile) : 'AI Coach';

    const targetProfile = await query<{ first_name: string; last_name: string; avatar: string | null }>(
      `SELECT first_name, last_name, avatar FROM users WHERE id = $1`,
      [targetUserId],
    );
    const targetUser = targetProfile.rows[0];
    const targetName = targetUser ? displayName(targetUser) : 'User';

    const call: ChatCallSession = {
      id: randomUUID(),
      chatId,
      chatName: aiName,
      callType: 'voice',
      isGroupCall: false,
      initiatorId: AI_COACH_USER_ID,
      initiatorName: aiName,
      initiatorAvatar: aiProfile?.avatar ?? null,
      participantProfiles: new Map([
        [AI_COACH_USER_ID, { name: aiName, avatar: aiProfile?.avatar ?? null }],
        [targetUserId, { name: targetName, avatar: targetUser?.avatar ?? null }],
      ]),
      participantIds: [AI_COACH_USER_ID, targetUserId],
      invitedUserIds: [targetUserId],
      acceptedUserIds: new Set([AI_COACH_USER_ID]),
      declinedUserIds: new Set(),
      status: 'ringing',
      createdAt: new Date(),
      startedAt: null,
      endedAt: null,
      mediaState: new Map([
        [AI_COACH_USER_ID, { audioEnabled: true, videoEnabled: false }],
      ]),
    };

    call.timeout = setTimeout(() => {
      this.timeoutCall(call.id).catch((error) => {
        logger.error('[ChatCall] AI coach call timeout failed', {
          callId: call.id,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, CALL_TIMEOUT_MS);

    this.calls.set(call.id, call);

    if (socketService.isUserConnected(targetUserId)) {
      socketService.emitToUser(targetUserId, EVENTS.INCOMING, this.toPayload(call, targetUserId));
    } else {
      await notificationEngine.send({
        userId: targetUserId,
        type: 'chat_call',
        title: `${aiName} is calling`,
        message: 'Your coach wants to check in. Tap to answer.',
        icon: 'phone',
        actionUrl: `/chat?chatId=${chatId}`,
        actionLabel: 'Answer',
        category: 'coaching',
        priority: 'high',
        relatedEntityType: 'chat_call',
        relatedEntityId: call.id,
        metadata: { callId: call.id, chatId, callType: 'voice' },
        expiresAt: new Date(Date.now() + CALL_TIMEOUT_MS).toISOString(),
      });
    }

    await this.persistCallStart(call);

    logger.info('[ChatCall] AI coach call initiated', {
      callId: call.id,
      chatId,
      targetUserId,
      sessionType: context.sessionType,
    });

    return call;
  }

  async isAICoachChat(chatId: string, aiCoachUserId: string): Promise<boolean> {
    const result = await query<{ cnt: string }>(
      `SELECT COUNT(*)::text AS cnt FROM chat_participants
       WHERE chat_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [chatId, aiCoachUserId],
    );
    return parseInt(result.rows[0]?.cnt || '0', 10) > 0;
  }

  private async findOrCreateAICoachChat(userId: string): Promise<string> {
    const result = await query<{ id: string }>(
      `SELECT c.id FROM chats c
       JOIN chat_participants cp1 ON cp1.chat_id = c.id AND cp1.user_id = $1
       JOIN chat_participants cp2 ON cp2.chat_id = c.id AND cp2.user_id = $2
       WHERE c.is_group_chat = false AND cp1.left_at IS NULL AND cp2.left_at IS NULL
       LIMIT 1`,
      [AI_COACH_USER_ID, userId],
    );
    if (result.rows[0]) return result.rows[0].id;

    const chat = await chatService.createOrGetChat({
      userId: AI_COACH_USER_ID,
      otherUserId: userId,
      isGroupChat: false,
    });
    return chat.id;
  }

  private async timeoutCall(callId: string): Promise<void> {
    const call = this.calls.get(callId);
    if (!call || call.status !== 'ringing') return;
    await this.finishCall(call, 'missed');
  }

  private async finishCall(call: ChatCallSession, status: ChatCallStatus): Promise<void> {
    if (!this.calls.has(call.id)) return;

    call.status = status;
    call.endedAt = new Date();
    if (call.timeout) clearTimeout(call.timeout);
    call.timeout = undefined;

    const event = status === 'cancelled'
      ? EVENTS.CANCELLED
      : status === 'declined'
        ? EVENTS.DECLINED
        : EVENTS.ENDED;

    this.emitToCallParticipants(call, event, {
      call: this.toPayload(call),
      message: await this.persistCallMessage(call, status),
    });

    this.calls.delete(call.id);

    // Durable AI coach call outcome tracking
    if (call.initiatorId === AI_COACH_USER_ID) {
      this.handleAICoachCallOutcome(call, status).catch((err) => {
        logger.error('[ChatCall] AI coach outcome handling failed', {
          callId: call.id,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    logger.info('[ChatCall] Call finished', {
      callId: call.id,
      chatId: call.chatId,
      status,
      durationSeconds: this.durationSeconds(call),
    });
  }

  private async persistCallMessage(
    call: ChatCallSession,
    status: ChatCallStatus,
  ): Promise<Record<string, unknown> | null> {
    try {
      const content = JSON.stringify({
        callId: call.id,
        callType: call.callType,
        status,
        startedAt: call.startedAt?.toISOString() || null,
        endedAt: call.endedAt?.toISOString() || new Date().toISOString(),
        durationSeconds: this.durationSeconds(call),
        participantIds: Array.from(call.acceptedUserIds),
      });

      const message = await messageService.sendMessage({
        chatId: call.chatId,
        senderId: call.initiatorId,
        content,
        contentType: 'call',
      });
      await this.persistCallState(call, message.id);
      const transformed = transformMessageForSocket(message);
      socketService.emitToChat(call.chatId, 'newMessage', {
        chatId: call.chatId,
        message: transformed,
        senderId: call.initiatorId,
      });
      return transformed;
    } catch (error) {
      logger.error('[ChatCall] Failed to persist call message', {
        callId: call.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async persistCallStart(call: ChatCallSession): Promise<void> {
    try {
      await query(
        `INSERT INTO chat_calls (
          id, chat_id, initiator_id, call_type, status, is_group_call,
          invited_user_ids, accepted_user_ids, declined_user_ids, participants,
          started_at, ended_at, duration_seconds, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14, $15
        )
        ON CONFLICT (id) DO NOTHING`,
        [
          call.id,
          call.chatId,
          call.initiatorId,
          call.callType,
          call.status,
          call.isGroupCall,
          call.invitedUserIds,
          Array.from(call.acceptedUserIds),
          Array.from(call.declinedUserIds),
          JSON.stringify(this.getCallParticipantsSnapshot(call)),
          call.startedAt,
          call.endedAt,
          this.durationSeconds(call),
          call.createdAt,
          new Date(),
        ],
      );
    } catch (error) {
      this.logPersistenceFailure('insert', call.id, error);
    }
  }

  private async persistCallState(call: ChatCallSession, messageId?: string): Promise<void> {
    try {
      await query(
        `UPDATE chat_calls
         SET status = $2,
             accepted_user_ids = $3,
             declined_user_ids = $4,
             participants = $5,
             started_at = $6,
             ended_at = $7,
             duration_seconds = $8,
             message_id = COALESCE($9, message_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [
          call.id,
          call.status,
          Array.from(call.acceptedUserIds),
          Array.from(call.declinedUserIds),
          JSON.stringify(this.getCallParticipantsSnapshot(call)),
          call.startedAt,
          call.endedAt,
          this.durationSeconds(call),
          messageId || null,
        ],
      );
    } catch (error) {
      this.logPersistenceFailure('update', call.id, error);
    }
  }

  private getCallParticipantsSnapshot(call: ChatCallSession): Array<{
    userId: string;
    name: string;
    avatar?: string | null;
    accepted: boolean;
    declined: boolean;
  }> {
    return call.participantIds.map((userId) => {
      const profile = call.participantProfiles.get(userId);
      return {
        userId,
        name: profile?.name || 'Participant',
        avatar: profile?.avatar || null,
        accepted: call.acceptedUserIds.has(userId),
        declined: call.declinedUserIds.has(userId),
      };
    });
  }

  private logPersistenceFailure(action: string, callId: string, error: unknown): void {
    const code = typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : undefined;
    const level = code === '42P01' ? 'warn' : 'error';
    logger[level]('[ChatCall] Failed to persist call state', {
      action,
      callId,
      code,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  private async handleAICoachCallOutcome(
    call: ChatCallSession,
    status: ChatCallStatus,
  ): Promise<void> {
    const targetUserId = call.participantIds.find((id) => id !== AI_COACH_USER_ID);
    if (!targetUserId) return;

    try {
      // Resolve user-local hour (must match the worker's scheduledTimeHHMM hour)
      const tzResult = await query<{ timezone: string | null }>(
        `SELECT timezone FROM users WHERE id = $1`,
        [targetUserId],
      );
      const userTimezone = tzResult.rows[0]?.timezone || 'UTC';
      const localHour = getUserLocalHour(userTimezone);

      if (status === 'ended' && call.startedAt) {
        await query(
          `UPDATE ai_coach_call_log
           SET status = 'answered', answered_at = $1, ended_at = $2,
               call_duration_seconds = $3, chat_call_id = $4, updated_at = NOW()
           WHERE id = (
             SELECT id FROM ai_coach_call_log
             WHERE chat_call_id = $4 OR
                   (user_id = $5 AND status = 'initiated' AND scheduled_date = CURRENT_DATE)
             LIMIT 1
           )`,
          [
            call.startedAt,
            call.endedAt || new Date(),
            this.durationSeconds(call),
            call.id,
            targetUserId,
          ],
        );

        await communicationPreferencesService.recordAnswer(targetUserId, localHour);

      } else if (status === 'missed' || status === 'declined' || status === 'cancelled') {
        await query(
          `UPDATE ai_coach_call_log
           SET status = $1, chat_call_id = $2, ended_at = NOW(), updated_at = NOW()
           WHERE id = (
             SELECT id FROM ai_coach_call_log
             WHERE chat_call_id = $2 OR
                   (user_id = $3 AND status = 'initiated' AND scheduled_date = CURRENT_DATE)
             LIMIT 1
           )`,
          [
            status === 'cancelled' ? 'missed' : status,
            call.id,
            targetUserId,
          ],
        );

        await communicationPreferencesService.recordMiss(targetUserId, localHour);

        await this.sendMissedCallFollowUp(targetUserId, call, userTimezone);
      }
    } catch (error) {
      logger.error('[ChatCall] Failed to update ai_coach_call_log', {
        callId: call.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async sendMissedCallFollowUp(
    userId: string,
    call: ChatCallSession,
    userTimezone: string,
  ): Promise<void> {
    try {
      const chatId = call.chatId;
      const localHour = getUserLocalHour(userTimezone);
      const timeStr = call.createdAt.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: userTimezone,
      });

      const prefs = await communicationPreferencesService.getForUser(userId);
      const missCount = prefs.checkin_miss_count_by_hour?.[String(localHour)] || 0;

      let content: string;
      if (missCount >= 3) {
        content = `Hey! I tried calling at ${timeStr} but couldn't reach you. I've noticed this time doesn't seem to work well — would you like to pick a different time for our check-ins?`;
      } else if (missCount === 2) {
        content = `I tried to call at ${timeStr} — no worries if you were busy! Is this still a good time for check-ins, or should we try a different slot?`;
      } else {
        content = `Hey, I tried reaching you at ${timeStr} for a quick check-in! Whenever you're free, I'm here. How's your day going?`;
      }

      const message = await messageService.sendMessage({
        chatId,
        senderId: AI_COACH_USER_ID,
        content,
        contentType: 'text',
      });

      await query(
        `UPDATE ai_coach_call_log SET followup_message_id = $1, updated_at = NOW()
         WHERE chat_call_id = $2`,
        [message.id, call.id],
      );

      await pushNotificationService.deliverForUser(userId, {
        title: 'Missed check-in',
        body: 'Your coach tried to call. Tap to chat.',
        type: 'missed_checkin',
        category: 'coaching',
        actionUrl: `/chat?chatId=${chatId}`,
      });
    } catch (error) {
      logger.error('[ChatCall] Failed to send missed call follow-up', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private durationSeconds(call: ChatCallSession): number {
    if (!call.startedAt || !call.endedAt) return 0;
    return Math.max(0, Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000));
  }

  private requireCall(callId: string): ChatCallSession {
    const call = this.calls.get(callId);
    if (!call) {
      throw ApiError.notFound('Call not found');
    }
    return call;
  }

  private requireParticipant(call: ChatCallSession, userId: string): void {
    if (!call.participantIds.includes(userId)) {
      throw ApiError.forbidden('You are not a participant of this call');
    }
  }

  private requireAccepted(call: ChatCallSession, userId: string): void {
    this.requireParticipant(call, userId);
    if (!call.acceptedUserIds.has(userId)) {
      throw ApiError.forbidden('User has not joined this call');
    }
  }

  private emitToCallParticipants(call: ChatCallSession, event: string, payload: unknown): void {
    for (const userId of call.participantIds) {
      socketService.emitToUser(userId, event, payload);
    }
  }

  private getAcceptedParticipants(call: ChatCallSession): ChatCallParticipant[] {
    return Array.from(call.acceptedUserIds).map((userId) => {
      const state = call.mediaState.get(userId) || { audioEnabled: true, videoEnabled: call.callType === 'video' };
      const profile = call.participantProfiles.get(userId);
      return {
        userId,
        userName: profile?.name || 'Participant',
        userAvatar: profile?.avatar || null,
        joinedAt: call.startedAt?.toISOString(),
        audioEnabled: state.audioEnabled,
        videoEnabled: state.videoEnabled,
      };
    });
  }

  private toPayload(call: ChatCallSession, recipientId?: string): Record<string, unknown> {
    return {
      id: call.id,
      callId: call.id,
      chatId: call.chatId,
      chatName: call.chatName,
      callType: call.callType,
      isGroupCall: call.isGroupCall,
      initiatorId: call.initiatorId,
      initiatorName: call.initiatorName,
      initiatorAvatar: call.initiatorAvatar,
      recipientId,
      status: call.status,
      createdAt: call.createdAt.toISOString(),
      startedAt: call.startedAt?.toISOString() || null,
      endedAt: call.endedAt?.toISOString() || null,
      participantIds: call.participantIds,
      acceptedUserIds: Array.from(call.acceptedUserIds),
      invitedUserIds: call.invitedUserIds,
    };
  }
}

export const chatCallService = new ChatCallService();
export default chatCallService;
