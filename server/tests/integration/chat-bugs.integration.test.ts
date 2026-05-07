/**
 * @file Chat Bug Fixes Integration Tests
 * @description Tests for three chat bugs:
 *   1. Admin query returning ALL chats instead of admin's own
 *   2. getChatById caching bypassing authorization for non-participants
 *   3. createOrGetChat transaction isolation causing intermittent 403
 */

import request from 'supertest';
import { createApp } from '../../src/app.js';
import type { Application } from 'express';
import {
  createTestUser,
  createTestChat,
  addUserToChat,
  removeUserFromChat,
  generateTestToken,
} from '../helpers/chat.testUtils.js';
import { query } from '../../src/database/pg.js';
import { cache } from '../../src/services/cache.service.js';

describe('Chat Bug Fixes', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  afterEach(async () => {
    cache.flush();
  });

  // ============================================
  // Bug 1: Admin query returning ALL chats
  // ============================================
  describe('Bug 1: Admin user chat list', () => {
    let admin: { id: string; email: string };
    let regularUser1: { id: string; email: string };
    let regularUser2: { id: string; email: string };
    let regularUser3: { id: string; email: string };
    let adminToken: string;

    beforeEach(async () => {
      admin = await createTestUser({ role: 'admin' });
      regularUser1 = await createTestUser();
      regularUser2 = await createTestUser();
      regularUser3 = await createTestUser();

      adminToken = generateTestToken(admin.id, admin.email, 'admin');
    });

    afterEach(async () => {
      const userIds = [admin.id, regularUser1.id, regularUser2.id, regularUser3.id];
      await query(
        `DELETE FROM chats WHERE id IN (
          SELECT chat_id FROM chat_participants WHERE user_id = ANY($1)
        )`,
        [userIds]
      );
      await query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
    });

    it('should only return chats the admin is a participant of', async () => {
      // Create a chat the admin IS in
      const adminChat = await createTestChat([admin.id, regularUser1.id], {
        isGroupChat: true,
        chatName: 'Admin Group',
      });

      // Create chats the admin is NOT in
      await createTestChat([regularUser1.id, regularUser2.id], {
        isGroupChat: true,
        chatName: 'Other Group 1',
      });
      await createTestChat([regularUser2.id, regularUser3.id], {
        isGroupChat: true,
        chatName: 'Other Group 2',
      });
      await createTestChat([regularUser1.id, regularUser3.id]);

      const response = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(adminChat.id);
    });

    it('should not produce FORBIDDEN warnings for unrelated chats', async () => {
      // Create only chats the admin is NOT in
      await createTestChat([regularUser1.id, regularUser2.id], {
        isGroupChat: true,
        chatName: 'Unrelated Group',
      });

      const response = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should show multiple groups when admin is in multiple groups', async () => {
      await createTestChat([admin.id, regularUser1.id], {
        isGroupChat: true,
        chatName: 'Admin Group A',
      });
      await createTestChat([admin.id, regularUser2.id], {
        isGroupChat: true,
        chatName: 'Admin Group B',
      });
      await createTestChat([admin.id, regularUser3.id], {
        isGroupChat: true,
        chatName: 'Admin Group C',
      });

      const response = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(3);
    });
  });

  // ============================================
  // Bug 2: getChatById cache bypass authorization
  // ============================================
  describe('Bug 2: Chat detail cache authorization', () => {
    let participant: { id: string; email: string };
    let nonParticipant: { id: string; email: string };
    let otherUser: { id: string; email: string };
    let participantToken: string;
    let nonParticipantToken: string;

    beforeEach(async () => {
      participant = await createTestUser();
      nonParticipant = await createTestUser();
      otherUser = await createTestUser();

      participantToken = generateTestToken(participant.id, participant.email, 'user');
      nonParticipantToken = generateTestToken(nonParticipant.id, nonParticipant.email, 'user');
    });

    afterEach(async () => {
      const userIds = [participant.id, nonParticipant.id, otherUser.id];
      await query(
        `DELETE FROM chats WHERE id IN (
          SELECT chat_id FROM chat_participants WHERE user_id = ANY($1)
        )`,
        [userIds]
      );
      await query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
    });

    it('should deny access to non-participant even after participant cached the chat', async () => {
      const chat = await createTestChat([participant.id, otherUser.id], {
        isGroupChat: true,
        chatName: 'Private Group',
      });

      // Participant requests first — populates cache
      const firstResponse = await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(firstResponse.body.success).toBe(true);
      expect(firstResponse.body.data.id).toBe(chat.id);

      // Non-participant requests same chat — must still get 403
      const secondResponse = await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${nonParticipantToken}`)
        .expect(403);

      expect(secondResponse.body.success).toBe(false);
    });

    it('should allow access after user is added to a cached chat', async () => {
      const chat = await createTestChat([participant.id, otherUser.id], {
        isGroupChat: true,
        chatName: 'Growing Group',
      });

      // Participant populates cache
      await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      // Non-participant denied
      await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${nonParticipantToken}`)
        .expect(403);

      // Add non-participant to the chat
      await addUserToChat(chat.id, nonParticipant.id);

      // Now they should have access
      const response = await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${nonParticipantToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(chat.id);
    });

    it('should deny access after user is removed from a cached chat', async () => {
      const chat = await createTestChat([participant.id, nonParticipant.id, otherUser.id], {
        isGroupChat: true,
        chatName: 'Shrinking Group',
      });

      // Both users have access initially
      await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${nonParticipantToken}`)
        .expect(200);

      // Remove user from chat
      await removeUserFromChat(chat.id, nonParticipant.id);

      // Removed user should be denied
      await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${nonParticipantToken}`)
        .expect(403);
    });
  });

  // ============================================
  // Bug 3: createOrGetChat transaction isolation
  // ============================================
  describe('Bug 3: Create one-on-one chat reliability', () => {
    let user1: { id: string; email: string };
    let user2: { id: string; email: string };
    let token1: string;

    beforeEach(async () => {
      user1 = await createTestUser();
      user2 = await createTestUser();
      token1 = generateTestToken(user1.id, user1.email, 'user');
    });

    afterEach(async () => {
      const userIds = [user1.id, user2.id];
      await query(
        `DELETE FROM chats WHERE id IN (
          SELECT chat_id FROM chat_participants WHERE user_id = ANY($1)
        )`,
        [userIds]
      );
      await query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
    });

    it('should reliably create a one-on-one chat without 403', async () => {
      const response = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.participants.length).toBe(2);

      const participantUserIds = response.body.data.participants.map(
        (p: { user_id: string }) => p.user_id
      );
      expect(participantUserIds).toContain(user1.id);
      expect(participantUserIds).toContain(user2.id);
    });

    it('should return existing chat when creating duplicate one-on-one', async () => {
      // Create first chat
      const first = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2.id })
        .expect(200);

      // Create duplicate — should return same chat
      const second = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2.id })
        .expect(200);

      expect(second.body.data.id).toBe(first.body.data.id);
    });

    it('should create chat reliably across multiple sequential attempts', async () => {
      for (let i = 0; i < 5; i++) {
        const newUser = await createTestUser();
        const response = await request(app)
          .post('/api/chats')
          .set('Authorization', `Bearer ${token1}`)
          .send({ userId: newUser.id })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.participants.length).toBe(2);

        // Cleanup inline
        await query(
          `DELETE FROM chats WHERE id IN (
            SELECT chat_id FROM chat_participants WHERE user_id = $1
              EXCEPT SELECT chat_id FROM chat_participants WHERE user_id = $2
          )`,
          [newUser.id, user1.id]
        );
        await query('DELETE FROM users WHERE id = $1', [newUser.id]);
      }
    });
  });

  // ============================================
  // Regression: Chat list general behavior
  // ============================================
  describe('Chat list regression tests', () => {
    let user1: { id: string; email: string };
    let user2: { id: string; email: string };
    let user3: { id: string; email: string };
    let token1: string;
    let token2: string;

    beforeEach(async () => {
      user1 = await createTestUser();
      user2 = await createTestUser();
      user3 = await createTestUser();
      token1 = generateTestToken(user1.id, user1.email, 'user');
      token2 = generateTestToken(user2.id, user2.email, 'user');
    });

    afterEach(async () => {
      const userIds = [user1.id, user2.id, user3.id];
      await query(
        `DELETE FROM chats WHERE id IN (
          SELECT chat_id FROM chat_participants WHERE user_id = ANY($1)
        )`,
        [userIds]
      );
      await query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
    });

    it('should show group chat to all participants', async () => {
      await createTestChat([user1.id, user2.id, user3.id], {
        isGroupChat: true,
        chatName: 'Shared Group',
      });

      const res1 = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const res2 = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(res1.body.data.length).toBe(1);
      expect(res2.body.data.length).toBe(1);
      expect(res1.body.data[0].chat_name).toBe('Shared Group');
      expect(res2.body.data[0].chat_name).toBe('Shared Group');
    });

    it('should not show left groups in chat list', async () => {
      const chat = await createTestChat([user1.id, user2.id], {
        isGroupChat: true,
        chatName: 'Temporary Group',
      });

      // User1 can see it initially
      const before = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
      expect(before.body.data.length).toBe(1);

      // User1 leaves
      await removeUserFromChat(chat.id, user1.id);
      cache.flush();

      // User1 should no longer see it
      const after = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
      expect(after.body.data.length).toBe(0);
    });

    it('should show rejoined groups in chat list', async () => {
      const chat = await createTestChat([user1.id, user2.id], {
        isGroupChat: true,
        chatName: 'Rejoin Group',
      });

      // Leave
      await removeUserFromChat(chat.id, user1.id);
      cache.flush();

      const left = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
      expect(left.body.data.length).toBe(0);

      // Rejoin
      await addUserToChat(chat.id, user1.id);
      cache.flush();

      const rejoined = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
      expect(rejoined.body.data.length).toBe(1);
      expect(rejoined.body.data[0].id).toBe(chat.id);
    });

    it('should show one-on-one and group chats together', async () => {
      await createTestChat([user1.id, user2.id]); // 1-on-1
      await createTestChat([user1.id, user2.id, user3.id], {
        isGroupChat: true,
        chatName: 'Group Chat',
      });

      const response = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);

      const types = response.body.data.map((c: { is_group_chat: boolean }) => c.is_group_chat);
      expect(types).toContain(true);
      expect(types).toContain(false);
    });

    it('should respect pagination limit', async () => {
      // Create 3 chats
      for (let i = 0; i < 3; i++) {
        const otherUser = await createTestUser();
        await createTestChat([user1.id, otherUser.id], {
          isGroupChat: true,
          chatName: `Group ${i}`,
        });
      }

      const response = await request(app)
        .get('/api/chats?page=1&limit=2')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.limit).toBe(2);
    });
  });

  // ============================================
  // Group chat participant management
  // ============================================
  describe('Group chat participant management', () => {
    let admin: { id: string; email: string };
    let member: { id: string; email: string };
    let outsider: { id: string; email: string };
    let adminToken: string;
    let memberToken: string;
    let outsiderToken: string;

    beforeEach(async () => {
      admin = await createTestUser();
      member = await createTestUser();
      outsider = await createTestUser();
      adminToken = generateTestToken(admin.id, admin.email, 'user');
      memberToken = generateTestToken(member.id, member.email, 'user');
      outsiderToken = generateTestToken(outsider.id, outsider.email, 'user');
    });

    afterEach(async () => {
      const userIds = [admin.id, member.id, outsider.id];
      await query(
        `DELETE FROM chats WHERE id IN (
          SELECT chat_id FROM chat_participants WHERE user_id = ANY($1)
        )`,
        [userIds]
      );
      await query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
    });

    it('should add user and they can immediately see the chat', async () => {
      const chat = await createTestChat([admin.id, member.id], {
        isGroupChat: true,
        chatName: 'Growing Group',
      });

      // Outsider cannot see chat before being added
      await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);

      // Add outsider
      await request(app)
        .post(`/api/chats/group/${chat.id}/add-user`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: outsider.id })
        .expect(200);

      // Outsider can now see the chat
      const response = await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(200);

      expect(response.body.data.participants.length).toBe(3);
    });

    it('should remove user and they can no longer see the chat', async () => {
      const chat = await createTestChat([admin.id, member.id, outsider.id], {
        isGroupChat: true,
        chatName: 'Shrinking Group',
      });

      // Member can see chat
      await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      // Remove member
      await request(app)
        .post(`/api/chats/group/${chat.id}/remove-user`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: member.id })
        .expect(200);

      // Member can no longer see chat
      await request(app)
        .get(`/api/chats/${chat.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('removed user should not see group in chat list', async () => {
      const chat = await createTestChat([admin.id, member.id], {
        isGroupChat: true,
        chatName: 'Removal Test',
      });

      // Member sees it in list
      const before = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);
      expect(before.body.data.some((c: { id: string }) => c.id === chat.id)).toBe(true);

      // Remove member
      await request(app)
        .post(`/api/chats/group/${chat.id}/remove-user`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: member.id })
        .expect(200);

      cache.flush();

      // Member no longer sees it in list
      const after = await request(app)
        .get('/api/chats')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);
      expect(after.body.data.some((c: { id: string }) => c.id === chat.id)).toBe(false);
    });
  });
});
