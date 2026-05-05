/**
 * @file Accountability Consent Service
 * @description Manages consent settings, contacts, groups, and audit logging
 * for the Social Accountability system. All social messaging is opt-in (default OFF).
 */

import { query, transaction } from '../config/database.config.js';
import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

export interface ConsentSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  allow_motivation_reminders: boolean;
  allow_failure_alerts: boolean;
  allow_sos_alerts: boolean;
  sos_inactivity_days: number;
  sos_message: string;
  ai_intervene_first: boolean;
  global_cooldown_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateConsentParams {
  enabled?: boolean;
  allow_motivation_reminders?: boolean;
  allow_failure_alerts?: boolean;
  allow_sos_alerts?: boolean;
  sos_inactivity_days?: number;
  sos_message?: string;
  ai_intervene_first?: boolean;
  global_cooldown_hours?: number;
}

export interface AccountabilityContact {
  id: string;
  user_id: string;
  contact_user_id: string;
  nickname: string | null;
  role: string;
  chat_id: string | null;
  is_active: boolean;
  added_at: Date;
  removed_at: Date | null;
}

export interface ContactWithConsent extends AccountabilityContact {
  allow_motivation: boolean;
  allow_failure: boolean;
  allow_sos: boolean;
  is_emergency_contact: boolean;
}

export interface ContactConsentPermissions {
  allow_motivation?: boolean;
  allow_failure?: boolean;
  allow_sos?: boolean;
  is_emergency_contact?: boolean;
}

export interface AccountabilityGroup {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  chat_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  member_count?: number;
}

export interface ConsentAuditEntry {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date;
}

// ============================================
// SERVICE
// ============================================

class AccountabilityConsentService {

  private _consentCache = new Map<string, { data: ConsentSettings; expiresAt: number }>();
  private static CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private invalidateCache(userId: string): void {
    this._consentCache.delete(userId);
  }

  // ------------------------------------------
  // Consent Management
  // ------------------------------------------

  /**
   * Get consent settings for a user. Creates default (OFF) row if none exists.
   * Cached for 5 minutes to reduce DB load during trigger evaluation.
   */
  async getConsent(userId: string): Promise<ConsentSettings> {
    try {
      const cached = this._consentCache.get(userId);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }

      const existing = await query(
        `SELECT * FROM accountability_consent WHERE user_id = $1`,
        [userId]
      );

      if (existing.rows.length > 0) {
        const consent = existing.rows[0] as ConsentSettings;
        this._consentCache.set(userId, { data: consent, expiresAt: Date.now() + AccountabilityConsentService.CACHE_TTL_MS });
        return consent;
      }

      // Create default consent (everything OFF)
      const created = await query(
        `INSERT INTO accountability_consent (user_id)
         VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
         RETURNING *`,
        [userId]
      );

      const newConsent = created.rows[0] as ConsentSettings;
      this._consentCache.set(userId, { data: newConsent, expiresAt: Date.now() + AccountabilityConsentService.CACHE_TTL_MS });
      logger.info(`Created default accountability consent for user ${userId}`);
      return newConsent;
    } catch (error) {
      logger.error('Failed to get accountability consent', { userId, error });
      throw error;
    }
  }

  /**
   * Update consent settings and log the change to the audit trail.
   */
  async updateConsent(
    userId: string,
    settings: UpdateConsentParams,
    ipAddress?: string
  ): Promise<ConsentSettings> {
    try {
      // Ensure row exists first
      await this.getConsent(userId);

      const setClauses: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      const allowedFields: Array<keyof UpdateConsentParams> = [
        'enabled',
        'allow_motivation_reminders',
        'allow_failure_alerts',
        'allow_sos_alerts',
        'sos_inactivity_days',
        'sos_message',
        'ai_intervene_first',
        'global_cooldown_hours',
      ];

      for (const field of allowedFields) {
        if (settings[field] !== undefined) {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(settings[field]);
          paramIndex++;
        }
      }

      if (setClauses.length === 0) {
        return this.getConsent(userId);
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(userId);

      const result = await query(
        `UPDATE accountability_consent
         SET ${setClauses.join(', ')}
         WHERE user_id = $${paramIndex}
         RETURNING *`,
        values as (string | number | boolean | null)[]
      );

      // Determine audit action
      let action = 'consent_changed';
      if (settings.enabled === true) action = 'enabled';
      else if (settings.enabled === false) action = 'disabled';
      else if (settings.allow_sos_alerts === true) action = 'sos_enabled';

      await this.logAudit(userId, action, { changes: settings }, ipAddress);

      this.invalidateCache(userId);
      logger.info(`Updated accountability consent for user ${userId}`, { action });
      return result.rows[0] as ConsentSettings;
    } catch (error) {
      logger.error('Failed to update accountability consent', { userId, error });
      throw error;
    }
  }

  /**
   * Revoke all accountability permissions. Disables consent and deactivates all triggers.
   */
  async revokeAll(userId: string, ipAddress?: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // Disable master consent
        await client.query(
          `UPDATE accountability_consent
           SET enabled = false, updated_at = NOW()
           WHERE user_id = $1`,
          [userId]
        );

        // Deactivate all triggers
        await client.query(
          `UPDATE accountability_triggers
           SET is_active = false, updated_at = NOW()
           WHERE user_id = $1 AND is_active = true`,
          [userId]
        );
      });

      await this.logAudit(userId, 'revoke_all', null, ipAddress);
      this.invalidateCache(userId);
      logger.info(`Revoked all accountability consent for user ${userId}`);
    } catch (error) {
      logger.error('Failed to revoke all accountability consent', { userId, error });
      throw error;
    }
  }

  /**
   * Check if a user has consented for a specific message type to a specific contact.
   * Checks both master consent and per-contact consent.
   */
  async isConsentedForMessageType(
    userId: string,
    contactId: string,
    messageType: string
  ): Promise<boolean> {
    try {
      // Check master consent is enabled
      const consent = await this.getConsent(userId);
      if (!consent.enabled) return false;

      // Check master-level type permission
      if (messageType === 'motivation' && !consent.allow_motivation_reminders) return false;
      if (messageType === 'failure' && !consent.allow_failure_alerts) return false;
      if (messageType === 'sos' && !consent.allow_sos_alerts) return false;

      // Check per-contact consent (fetch all columns, check in JS to avoid dynamic SQL)
      const result = await query<{ allow_motivation: boolean; allow_failure: boolean; allow_sos: boolean }>(
        `SELECT allow_motivation, allow_failure, allow_sos
         FROM accountability_contact_consent
         WHERE user_id = $1 AND contact_id = $2`,
        [userId, contactId]
      );

      if (result.rows.length === 0) return false;
      const row = result.rows[0]!;
      if (messageType === 'motivation') return row.allow_motivation === true;
      if (messageType === 'failure') return row.allow_failure === true;
      if (messageType === 'sos') return row.allow_sos === true;
      return false;
    } catch (error) {
      logger.error('Failed to check consent for message type', { userId, contactId, messageType, error });
      return false;
    }
  }

  // ------------------------------------------
  // Contact Management
  // ------------------------------------------

  /**
   * Add a trusted accountability contact. Creates default per-contact consent.
   */
  async addContact(
    userId: string,
    contactUserId: string,
    nickname?: string,
    role: string = 'friend'
  ): Promise<AccountabilityContact> {
    try {
      let contact: AccountabilityContact;

      await transaction(async (client) => {
        // Insert or reactivate contact
        const contactResult = await client.query(
          `INSERT INTO accountability_contacts (user_id, contact_user_id, nickname, role)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, contact_user_id) DO UPDATE
           SET is_active = true, nickname = COALESCE($3, accountability_contacts.nickname),
               role = $4, removed_at = NULL
           RETURNING *`,
          [userId, contactUserId, nickname || null, role]
        );

        contact = contactResult.rows[0] as AccountabilityContact;

        // Create default per-contact consent
        await client.query(
          `INSERT INTO accountability_contact_consent (user_id, contact_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, contact_id) DO NOTHING`,
          [userId, contact.id]
        );
      });

      await this.logAudit(userId, 'contact_added', {
        contact_id: contact!.id,
        contact_user_id: contactUserId,
        role,
      });

      logger.info(`Added accountability contact for user ${userId}`, { contactUserId });
      return contact!;
    } catch (error) {
      logger.error('Failed to add accountability contact', { userId, contactUserId, error });
      throw error;
    }
  }

  /**
   * Remove (soft-delete) an accountability contact and deactivate related triggers.
   */
  async removeContact(userId: string, contactId: string): Promise<void> {
    try {
      await transaction(async (client) => {
        // Soft-delete the contact
        await client.query(
          `UPDATE accountability_contacts
           SET is_active = false, removed_at = NOW()
           WHERE id = $1 AND user_id = $2`,
          [contactId, userId]
        );

        // Deactivate triggers targeting this contact
        await client.query(
          `UPDATE accountability_triggers
           SET is_active = false, updated_at = NOW()
           WHERE user_id = $1 AND target_contact_id = $2 AND is_active = true`,
          [userId, contactId]
        );
      });

      await this.logAudit(userId, 'contact_removed', { contact_id: contactId });
      logger.info(`Removed accountability contact ${contactId} for user ${userId}`);
    } catch (error) {
      logger.error('Failed to remove accountability contact', { userId, contactId, error });
      throw error;
    }
  }

  /**
   * Get all active contacts for a user with their per-contact consent settings.
   */
  async getContacts(userId: string): Promise<ContactWithConsent[]> {
    try {
      // Join `users` so the frontend receives the contact's real name +
      // avatar rather than a placeholder. Nickname wins when the user has
      // explicitly set one; otherwise we fall back to first + last name.
      const result = await query(
        `SELECT
           ac.*,
           COALESCE(acc.allow_motivation, true) AS allow_motivation,
           COALESCE(acc.allow_failure, false) AS allow_failure,
           COALESCE(acc.allow_sos, true) AS allow_sos,
           COALESCE(acc.is_emergency_contact, false) AS is_emergency_contact,
           NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), '') AS contact_name,
           u.avatar AS contact_avatar,
           u.email AS contact_email,
           u.phone AS contact_phone
         FROM accountability_contacts ac
         LEFT JOIN accountability_contact_consent acc
           ON acc.contact_id = ac.id AND acc.user_id = ac.user_id
         LEFT JOIN users u
           ON u.id = ac.contact_user_id
         WHERE ac.user_id = $1 AND ac.is_active = true
         ORDER BY ac.added_at DESC`,
        [userId]
      );

      // Normalise snake_case → camelCase so the API shape matches the
      // AccountabilityContact interface on the client. Prefer nickname when
      // set, otherwise fall back to the joined full name.
      return result.rows.map((row: Record<string, unknown>) => ({
        ...row,
        contactName: (row.nickname as string | null) || (row.contact_name as string | null) || null,
        contactAvatar: (row.contact_avatar as string | null) || null,
        contactEmail: (row.contact_email as string | null) || null,
        contactPhone: (row.contact_phone as string | null) || null,
      })) as unknown[] as ContactWithConsent[];
    } catch (error) {
      logger.error('Failed to get accountability contacts', { userId, error });
      throw error;
    }
  }

  /**
   * Update per-contact consent permissions.
   */
  async updateContactConsent(
    userId: string,
    contactId: string,
    permissions: ContactConsentPermissions
  ): Promise<void> {
    try {
      const setClauses: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      const allowedFields: Array<keyof ContactConsentPermissions> = [
        'allow_motivation',
        'allow_failure',
        'allow_sos',
        'is_emergency_contact',
      ];

      for (const field of allowedFields) {
        if (permissions[field] !== undefined) {
          setClauses.push(`${field} = $${paramIndex}`);
          values.push(permissions[field]);
          paramIndex++;
        }
      }

      if (setClauses.length === 0) return;

      setClauses.push(`updated_at = NOW()`);
      values.push(userId, contactId);

      await query(
        `UPDATE accountability_contact_consent
         SET ${setClauses.join(', ')}
         WHERE user_id = $${paramIndex} AND contact_id = $${paramIndex + 1}`,
        values as (string | number | boolean | null)[]
      );

      await this.logAudit(userId, 'consent_changed', {
        contact_id: contactId,
        changes: permissions,
      });

      logger.info(`Updated contact consent for user ${userId}, contact ${contactId}`);
    } catch (error) {
      logger.error('Failed to update contact consent', { userId, contactId, error });
      throw error;
    }
  }

  // ------------------------------------------
  // Group Management
  // ------------------------------------------

  /**
   * Create an accountability group with optional initial members.
   */
  async createGroup(
    userId: string,
    name: string,
    description?: string,
    contactIds?: string[]
  ): Promise<AccountabilityGroup> {
    try {
      let group: AccountabilityGroup;

      await transaction(async (client) => {
        const groupResult = await client.query(
          `INSERT INTO accountability_groups (user_id, name, description)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [userId, name, description || null]
        );

        group = groupResult.rows[0] as AccountabilityGroup;

        // Add initial members if provided (validate ownership first)
        if (contactIds && contactIds.length > 0) {
          // Verify all contacts belong to this user
          const validContacts = await client.query<{ id: string }>(
            `SELECT id FROM accountability_contacts
             WHERE id = ANY($1) AND user_id = $2 AND is_active = true`,
            [contactIds, userId]
          );
          const validIds = validContacts.rows.map(r => r.id);
          if (validIds.length === 0) {
            logger.warn('No valid contacts found for group creation', { userId, contactIds });
          }

          if (validIds.length > 0) {
            const memberValues = validIds
              .map((_, i) => `($1, $${i + 2})`)
              .join(', ');
            const memberParams = [group.id, ...validIds];

            await client.query(
              `INSERT INTO accountability_group_members (group_id, contact_id)
               VALUES ${memberValues}
               ON CONFLICT (group_id, contact_id) DO NOTHING`,
              memberParams
            );
          }
        }
      });

      await this.logAudit(userId, 'group_created', {
        group_id: group!.id,
        name,
        member_count: contactIds?.length || 0,
      });

      logger.info(`Created accountability group "${name}" for user ${userId}`);
      return group!;
    } catch (error) {
      logger.error('Failed to create accountability group', { userId, name, error });
      throw error;
    }
  }

  /**
   * Get all active groups for a user with member counts.
   */
  async getGroups(userId: string): Promise<AccountabilityGroup[]> {
    try {
      const result = await query(
        `SELECT
           ag.*,
           COUNT(agm.id)::int AS member_count
         FROM accountability_groups ag
         LEFT JOIN accountability_group_members agm ON agm.group_id = ag.id
         WHERE ag.user_id = $1 AND ag.is_active = true
         GROUP BY ag.id
         ORDER BY ag.created_at DESC`,
        [userId]
      );

      return result.rows as AccountabilityGroup[];
    } catch (error) {
      logger.error('Failed to get accountability groups', { userId, error });
      throw error;
    }
  }

  /**
   * Add a contact to a group.
   */
  async addGroupMember(userId: string, groupId: string, contactId: string): Promise<void> {
    try {
      // Verify group AND contact belong to the user
      const ownership = await query<{ gid: string; cid: string }>(
        `SELECT g.id AS gid, c.id AS cid
         FROM accountability_groups g, accountability_contacts c
         WHERE g.id = $1 AND g.user_id = $2 AND g.is_active = true
           AND c.id = $3 AND c.user_id = $2 AND c.is_active = true`,
        [groupId, userId, contactId]
      );
      if (ownership.rows.length === 0) {
        throw new Error('Group or contact not found or not owned by user');
      }

      await query(
        `INSERT INTO accountability_group_members (group_id, contact_id)
         VALUES ($1, $2)
         ON CONFLICT (group_id, contact_id) DO NOTHING`,
        [groupId, contactId]
      );

      logger.info(`Added contact ${contactId} to group ${groupId}`);
    } catch (error) {
      logger.error('Failed to add group member', { groupId, contactId, error });
      throw error;
    }
  }

  /**
   * Remove a contact from a group.
   */
  async removeGroupMember(userId: string, groupId: string, contactId: string): Promise<void> {
    try {
      // Verify group belongs to the user
      const ownership = await query<{ id: string }>(
        `SELECT id FROM accountability_groups WHERE id = $1 AND user_id = $2 AND is_active = true`,
        [groupId, userId]
      );
      if (ownership.rows.length === 0) {
        throw new Error('Group not found or not owned by user');
      }

      await query(
        `DELETE FROM accountability_group_members
         WHERE group_id = $1 AND contact_id = $2`,
        [groupId, contactId]
      );

      logger.info(`Removed contact ${contactId} from group ${groupId}`);
    } catch (error) {
      logger.error('Failed to remove group member', { groupId, contactId, error });
      throw error;
    }
  }

  /**
   * Soft-delete a group and deactivate triggers targeting it.
   */
  async deleteGroup(userId: string, groupId: string): Promise<void> {
    try {
      await transaction(async (client) => {
        await client.query(
          `UPDATE accountability_groups
           SET is_active = false, updated_at = NOW()
           WHERE id = $1 AND user_id = $2`,
          [groupId, userId]
        );

        // Deactivate triggers targeting this group
        await client.query(
          `UPDATE accountability_triggers
           SET is_active = false, updated_at = NOW()
           WHERE user_id = $1 AND target_group_id = $2 AND is_active = true`,
          [userId, groupId]
        );
      });

      await this.logAudit(userId, 'group_deleted', { group_id: groupId });
      logger.info(`Deleted accountability group ${groupId} for user ${userId}`);
    } catch (error) {
      logger.error('Failed to delete accountability group', { userId, groupId, error });
      throw error;
    }
  }

  // ------------------------------------------
  // Audit
  // ------------------------------------------

  /**
   * Log an action to the consent audit trail.
   */
  async logAudit(
    userId: string,
    action: string,
    details?: Record<string, unknown> | null,
    ipAddress?: string
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO accountability_consent_audit (user_id, action, details, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [userId, action, details ? JSON.stringify(details) : null, ipAddress || null]
      );
    } catch (error) {
      // Audit logging should not throw — log and continue
      logger.error('Failed to log accountability audit', { userId, action, error });
    }
  }

  /**
   * Get the audit log for a user.
   */
  async getAuditLog(userId: string, limit: number = 50): Promise<ConsentAuditEntry[]> {
    try {
      const result = await query(
        `SELECT * FROM accountability_consent_audit
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows as ConsentAuditEntry[];
    } catch (error) {
      logger.error('Failed to get accountability audit log', { userId, error });
      throw error;
    }
  }

  // ------------------------------------------
  // Emergency Contacts
  // ------------------------------------------

  /**
   * Get all active emergency contacts for a user.
   */
  async getEmergencyContacts(userId: string): Promise<ContactWithConsent[]> {
    try {
      const result = await query(
        `SELECT
           ac.*,
           acc.allow_motivation,
           acc.allow_failure,
           acc.allow_sos,
           acc.is_emergency_contact
         FROM accountability_contacts ac
         JOIN accountability_contact_consent acc
           ON acc.contact_id = ac.id AND acc.user_id = ac.user_id
         WHERE ac.user_id = $1
           AND ac.is_active = true
           AND acc.is_emergency_contact = true
         ORDER BY ac.added_at ASC`,
        [userId]
      );

      return result.rows as ContactWithConsent[];
    } catch (error) {
      logger.error('Failed to get emergency contacts', { userId, error });
      throw error;
    }
  }

  /**
   * Set or unset a contact as an emergency contact.
   */
  async setEmergencyContact(
    userId: string,
    contactId: string,
    isEmergency: boolean
  ): Promise<void> {
    try {
      await query(
        `UPDATE accountability_contact_consent
         SET is_emergency_contact = $1, updated_at = NOW()
         WHERE user_id = $2 AND contact_id = $3`,
        [isEmergency, userId, contactId]
      );

      await this.logAudit(userId, 'consent_changed', {
        contact_id: contactId,
        is_emergency_contact: isEmergency,
      });

      logger.info(`Set emergency contact status for contact ${contactId}: ${isEmergency}`);
    } catch (error) {
      logger.error('Failed to set emergency contact', { userId, contactId, error });
      throw error;
    }
  }
}

export const accountabilityConsentService = new AccountabilityConsentService();
export default accountabilityConsentService;
