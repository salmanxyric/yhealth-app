/**
 * Shared message → API/socket payload (ISO date strings, nested replies).
 */
import type { MessageWithRelations } from '../services/message.service.js';

function toISOString(date: Date | null | undefined): string | null | undefined {
  if (!date) return date === null ? null : undefined;
  return date instanceof Date ? date.toISOString() : undefined;
}

export function transformMessageForSocket(message: MessageWithRelations): Record<string, unknown> {
  const transformed: Record<string, unknown> = {
    ...message,
    created_at: toISOString(message.created_at),
    updated_at: toISOString(message.updated_at),
    edited_at: toISOString(message.edited_at),
    deleted_at: toISOString(message.deleted_at),
    pinned_at: toISOString(message.pinned_at),
    view_once_opened_at: toISOString(message.view_once_opened_at),
    replied_to: message.replied_to ? transformMessageForSocket(message.replied_to) : null,
    forwarded_from: message.forwarded_from ? transformMessageForSocket(message.forwarded_from) : null,
  };

  if (message.is_view_once && message.view_once_opened_at) {
    transformed.media_url = null;
    transformed.media_thumbnail = null;
  }

  return transformed;
}
