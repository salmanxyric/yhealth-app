/**
 * Socket/API message shape: ISO strings and nested relations.
 */

import { describe, it, expect } from '@jest/globals';
import { transformMessageForSocket } from '../../../src/utils/message-transform.util.js';
import type { MessageWithRelations } from '../../../src/services/message.service.js';

function baseMessage(overrides: Partial<MessageWithRelations> = {}): MessageWithRelations {
  const now = new Date('2026-04-17T12:00:00.000Z');
  return {
    id: 'm1',
    chat_id: 'c1',
    sender_id: 'u1',
    content: 'hello',
    content_type: 'text',
    media_url: null,
    media_thumbnail: null,
    media_size: null,
    media_duration: null,
    is_edited: false,
    edited_at: null,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    is_pinned: false,
    pinned_at: null,
    pinned_by: null,
    replied_to_id: null,
    forwarded_from_id: null,
    forwarded_by: null,
    is_view_once: false,
    view_once_opened_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe('transformMessageForSocket', () => {
  it('serializes top-level dates to ISO strings', () => {
    const msg = baseMessage();
    const out = transformMessageForSocket(msg);
    expect(out.created_at).toBe('2026-04-17T12:00:00.000Z');
    expect(out.updated_at).toBe('2026-04-17T12:00:00.000Z');
    expect(out.content).toBe('hello');
  });

  it('recursively transforms replied_to', () => {
    const child = baseMessage({ id: 'm0', content: 'prior' });
    const msg = baseMessage({ replied_to: child });
    const out = transformMessageForSocket(msg) as Record<string, unknown>;
    const replied = out.replied_to as Record<string, unknown>;
    expect(replied.content).toBe('prior');
    expect(replied.created_at).toBe('2026-04-17T12:00:00.000Z');
  });

  it('strips view-once media when opened', () => {
    const opened = new Date('2026-04-17T13:00:00.000Z');
    const msg = baseMessage({
      is_view_once: true,
      view_once_opened_at: opened,
      media_url: 'https://example.com/secret.jpg',
      media_thumbnail: 'https://example.com/thumb.jpg',
    });
    const out = transformMessageForSocket(msg) as Record<string, unknown>;
    expect(out.media_url).toBeNull();
    expect(out.media_thumbnail).toBeNull();
  });
});
