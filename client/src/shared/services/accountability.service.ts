/**
 * @file Accountability API Service
 * @description Client-side API layer for Social Accountability & Contracts
 */

import { api } from '@/lib/api-client';
import { transformKeysToCamelCase } from '@/src/shared/utils/case-transform';

type ApiResp<T> = { success: boolean; data?: T; message?: string };

function unwrap<T>(resp: ApiResp<unknown>): ApiResp<T> {
  if (!resp?.data) return resp as ApiResp<T>;
  return { ...resp, data: transformKeysToCamelCase<T>(resp.data) };
}

// ─── Social Accountability Types ───────────────────────────────────

export interface AccountabilityConsent {
  id: string;
  userId: string;
  enabled: boolean;
  allowMotivationReminders: boolean;
  allowFailureAlerts: boolean;
  allowSosAlerts: boolean;
  sosInactivityDays: number;
  sosMessage: string;
  aiInterveneFirst: boolean;
  globalCooldownHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountabilityContact {
  id: string;
  userId: string;
  contactUserId: string;
  nickname: string | null;
  role: string;
  chatId: string | null;
  isActive: boolean;
  addedAt: string;
  // Populated by the server JOIN on `users`. Present once a contact is
  // resolved to a real account; optional so older rows / graceful degradation
  // still type-check.
  contactName?: string;
  contactAvatar?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface ContactConsentUpdate {
  allow_motivation?: boolean;
  allow_failure?: boolean;
  allow_sos?: boolean;
  is_emergency_contact?: boolean;
}

export interface AccountabilityGroup {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  chatId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: AccountabilityContact[];
  memberCount?: number;
}

export interface AccountabilityTrigger {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  conditionType: string;
  conditionMetric: string | null;
  conditionOperator: string | null;
  conditionValue: number | null;
  conditionWindowDays: number;
  targetType: string;
  targetContactId: string | null;
  targetGroupId: string | null;
  targetChatId?: string | null;
  messageType: string;
  messageTemplate: string | null;
  cooldownHours: number;
  isActive: boolean;
  aiInterveneFirst: boolean;
  lastTriggeredAt: string | null;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TriggerLog {
  id: string;
  triggerId: string | null;
  userId: string;
  conditionSnapshot: Record<string, unknown>;
  result: string;
  messageSent: boolean;
  targetUserIds: string[];
  createdAt: string;
  triggerName?: string;
  conditionType?: string;
  messageType?: string;
}

export interface CreateTriggerInput {
  name: string;
  description?: string;
  condition_type: 'inactivity' | 'metric_threshold' | 'streak_break' | 'login_gap' | 'custom';
  condition_metric?: string;
  condition_operator?: 'lt' | 'gt' | 'eq' | 'gte' | 'lte' | 'missed';
  condition_value?: number;
  condition_window_days?: number;
  target_type: 'contact' | 'group' | 'emergency' | 'app_chat';
  target_contact_id?: string;
  target_group_id?: string;
  target_chat_id?: string;
  message_type?: 'motivation' | 'failure' | 'sos';
  message_template?: string;
  cooldown_hours?: number;
  ai_intervene_first?: boolean;
}

export interface UpdateTriggerInput {
  name?: string;
  description?: string;
  condition_value?: number;
  condition_window_days?: number;
  message_template?: string;
  cooldown_hours?: number;
  ai_intervene_first?: boolean;
  is_active?: boolean;
}

export interface ConsentUpdate {
  enabled?: boolean;
  allow_motivation_reminders?: boolean;
  allow_failure_alerts?: boolean;
  allow_sos_alerts?: boolean;
  sos_inactivity_days?: number;
  sos_message?: string;
  ai_intervene_first?: boolean;
  global_cooldown_hours?: number;
}

// ─── Service ───────────────────────────────────────────────────────

export const accountabilityService = {
  // Consent
  async getConsent() {
    const resp = await api.get<AccountabilityConsent>('/accountability/consent');
    return unwrap<AccountabilityConsent>(resp as ApiResp<unknown>);
  },
  async updateConsent(data: ConsentUpdate) {
    const resp = await api.put<AccountabilityConsent>('/accountability/consent', data);
    return unwrap<AccountabilityConsent>(resp as ApiResp<unknown>);
  },
  async revokeAllConsent() {
    return api.post<{ revoked: boolean }>('/accountability/consent/revoke-all');
  },

  // Contacts
  async getContacts() {
    const resp = await api.get<AccountabilityContact[]>('/accountability/contacts');
    return unwrap<AccountabilityContact[]>(resp as ApiResp<unknown>);
  },
  async addContact(contactUserId: string, nickname?: string, role?: string) {
    return api.post<AccountabilityContact>('/accountability/contacts', {
      contact_user_id: contactUserId,
      nickname,
      role,
    });
  },
  async removeContact(contactId: string) {
    return api.delete<{ removed: boolean }>(`/accountability/contacts/${contactId}`);
  },
  async updateContactConsent(contactId: string, data: ContactConsentUpdate) {
    return api.put<{ updated: boolean }>(`/accountability/contacts/${contactId}/consent`, data);
  },

  // Groups
  async getGroups() {
    const resp = await api.get<AccountabilityGroup[]>('/accountability/groups');
    return unwrap<AccountabilityGroup[]>(resp as ApiResp<unknown>);
  },
  async createGroup(name: string, description?: string, contactIds?: string[]) {
    return api.post<AccountabilityGroup>('/accountability/groups', {
      name,
      description,
      contact_ids: contactIds,
    });
  },
  async deleteGroup(groupId: string) {
    return api.delete<{ deleted: boolean }>(`/accountability/groups/${groupId}`);
  },
  async addGroupMember(groupId: string, contactId: string) {
    return api.post<{ added: boolean }>(`/accountability/groups/${groupId}/members`, {
      contact_id: contactId,
    });
  },
  async removeGroupMember(groupId: string, contactId: string) {
    return api.delete<{ removed: boolean }>(`/accountability/groups/${groupId}/members/${contactId}`);
  },

  // Triggers
  async getTriggers() {
    const resp = await api.get<AccountabilityTrigger[]>('/accountability/triggers');
    return unwrap<AccountabilityTrigger[]>(resp as ApiResp<unknown>);
  },
  async createTrigger(data: CreateTriggerInput) {
    const resp = await api.post<AccountabilityTrigger>('/accountability/triggers', data);
    return unwrap<AccountabilityTrigger>(resp as ApiResp<unknown>);
  },
  async updateTrigger(triggerId: string, data: UpdateTriggerInput) {
    const resp = await api.put<AccountabilityTrigger>(`/accountability/triggers/${triggerId}`, data);
    return unwrap<AccountabilityTrigger>(resp as ApiResp<unknown>);
  },
  async deleteTrigger(triggerId: string) {
    return api.delete<{ deleted: boolean }>(`/accountability/triggers/${triggerId}`);
  },

  // Logs & Audit
  async getTriggerLogs(limit = 50) {
    const resp = await api.get<TriggerLog[]>('/accountability/logs', { params: { limit } });
    return unwrap<TriggerLog[]>(resp as ApiResp<unknown>);
  },
  async getAuditLog(limit = 50) {
    return api.get<Array<{ id: string; action: string; details: Record<string, unknown>; createdAt: string }>>('/accountability/audit', { params: { limit } });
  },

  // Emergency Contacts
  async getEmergencyContacts() {
    return api.get<AccountabilityContact[]>('/accountability/emergency-contacts');
  },
};
