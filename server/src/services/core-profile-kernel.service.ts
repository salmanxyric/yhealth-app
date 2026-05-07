/**
 * @file Core Profile Kernel Service
 * @description Manages the foundational user model that grounds all AI outputs.
 * Handles calibration, graceful degradation, and history tracking.
 */

import { query } from '../config/database.config.js';
import { logger } from './logger.service.js';
import type {
  CoreSection,
  IntelligenceSource,
  CoreProfileEntry,
  CoreProfile,
} from '@shared/types/domain/intelligence-files.js';

const EXPECTED_FIELDS: Array<{ section: CoreSection; key: string; impact: 'low' | 'medium' | 'high' }> = [
  { section: 'biometrics', key: 'resting_hr', impact: 'high' },
  { section: 'biometrics', key: 'height_cm', impact: 'medium' },
  { section: 'biometrics', key: 'weight_kg', impact: 'high' },
  { section: 'biometrics', key: 'age', impact: 'medium' },
  { section: 'biometrics', key: 'avg_sleep_hours', impact: 'high' },
  { section: 'biometrics', key: 'avg_hrv', impact: 'medium' },
  { section: 'targets', key: 'daily_calories', impact: 'high' },
  { section: 'targets', key: 'protein_target_g', impact: 'medium' },
  { section: 'targets', key: 'weekly_workout_days', impact: 'medium' },
  { section: 'targets', key: 'target_weight_kg', impact: 'medium' },
  { section: 'targets', key: 'daily_steps', impact: 'low' },
  { section: 'constraints', key: 'injuries', impact: 'high' },
  { section: 'constraints', key: 'dietary_restrictions', impact: 'high' },
  { section: 'preferences', key: 'coaching_style', impact: 'medium' },
  { section: 'preferences', key: 'workout_time_preference', impact: 'low' },
];

function mapRow(row: Record<string, unknown>): CoreProfileEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    section: row.section as CoreSection,
    key: row.key as string,
    value: row.value,
    unit: row.unit as string | null,
    confidence: row.confidence as number,
    calibratedAt: (row.calibrated_at as Date).toISOString(),
    dataPointsUsed: row.data_points_used as number,
    source: row.source as IntelligenceSource,
    previousValues: (row.previous_values as Array<{ value: unknown; calibratedAt: string; dataPointsUsed: number }>) || [],
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

class CoreProfileKernelService {
  private tableExistsCache: boolean | null = null;

  private async hasCoreProfileTable(): Promise<boolean> {
    if (this.tableExistsCache !== null) return this.tableExistsCache;
    const result = await query<{ exists: boolean }>(
      `SELECT to_regclass('public.intelligence_core_profile') IS NOT NULL AS exists`,
      []
    );
    this.tableExistsCache = Boolean(result.rows[0]?.exists);
    return this.tableExistsCache;
  }

  private emptyProfile(): CoreProfile {
    return {
      biometrics: [],
      targets: [],
      constraints: [],
      preferences: [],
      medical: [],
      lifestyle: [],
      missingFields: EXPECTED_FIELDS.map(f => ({ section: f.section, key: f.key, impact: f.impact })),
    };
  }

  private isMissingTableError(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes('intelligence_core_profile') ||
      (error as Error & { code?: string }).code === '42P01'
    );
  }

  async getProfile(userId: string): Promise<CoreProfile> {
    if (!(await this.hasCoreProfileTable())) {
      return this.emptyProfile();
    }

    let result;
    try {
      result = await query(
        `SELECT * FROM intelligence_core_profile WHERE user_id = $1 ORDER BY section, key`,
        [userId]
      );
    } catch (error) {
      if (this.isMissingTableError(error)) {
        logger.warn('[CoreProfile] Table missing, returning empty profile', { userId });
        return this.emptyProfile();
      }
      throw error;
    }

    const entries = result.rows.map(mapRow);
    const grouped: CoreProfile = {
      biometrics: [],
      targets: [],
      constraints: [],
      preferences: [],
      medical: [],
      lifestyle: [],
      missingFields: [],
    };

    for (const entry of entries) {
      grouped[entry.section].push(entry);
    }

    const existingKeys = new Set(entries.map(e => `${e.section}:${e.key}`));
    grouped.missingFields = EXPECTED_FIELDS
      .filter(f => !existingKeys.has(`${f.section}:${f.key}`))
      .map(f => ({ section: f.section, key: f.key, impact: f.impact }));

    return grouped;
  }

  async getProfileSection(userId: string, section: CoreSection): Promise<CoreProfileEntry[]> {
    if (!(await this.hasCoreProfileTable())) {
      return [];
    }

    let result;
    try {
      result = await query(
        `SELECT * FROM intelligence_core_profile WHERE user_id = $1 AND section = $2 ORDER BY key`,
        [userId, section]
      );
    } catch (error) {
      if (this.isMissingTableError(error)) return [];
      throw error;
    }
    return result.rows.map(mapRow);
  }

  async getProfileSummary(userId: string): Promise<string> {
    if (!(await this.hasCoreProfileTable())) {
      return '(No core profile data available yet)';
    }

    let result;
    try {
      result = await query(
        `SELECT section, key, value, unit, confidence
         FROM intelligence_core_profile
         WHERE user_id = $1 AND confidence >= 0.3
         ORDER BY section, key`,
        [userId]
      );
    } catch (error) {
      if (this.isMissingTableError(error)) return '(No core profile data available yet)';
      throw error;
    }

    if (result.rows.length === 0) {
      return '(No core profile data available yet)';
    }

    const sections: Record<string, string[]> = {};
    for (const row of result.rows) {
      const section = row.section as string;
      if (!sections[section]) sections[section] = [];
      const val = typeof row.value === 'object' ? JSON.stringify(row.value) : String(row.value);
      const unit = row.unit ? ` ${row.unit}` : '';
      const conf = (row.confidence as number) < 0.7 ? ' (low confidence)' : '';
      sections[section].push(`- ${row.key}: ${val}${unit}${conf}`);
    }

    return Object.entries(sections)
      .map(([section, lines]) => `### ${section.charAt(0).toUpperCase() + section.slice(1)}\n${lines.join('\n')}`)
      .join('\n\n');
  }

  async calibrate(
    userId: string,
    section: CoreSection,
    key: string,
    value: unknown,
    source: IntelligenceSource,
    dataPointsUsed: number,
    unit?: string
  ): Promise<CoreProfileEntry> {
    const confidence = this.computeCalibrationConfidence(dataPointsUsed, source);

    const result = await query(
      `INSERT INTO intelligence_core_profile (user_id, section, key, value, unit, confidence, data_points_used, source, calibrated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (user_id, section, key) DO UPDATE SET
         previous_values = jsonb_build_array(
           jsonb_build_object(
             'value', intelligence_core_profile.value,
             'calibratedAt', intelligence_core_profile.calibrated_at,
             'dataPointsUsed', intelligence_core_profile.data_points_used
           )
         ) || COALESCE(intelligence_core_profile.previous_values, '[]'::jsonb),
         value = $4,
         unit = COALESCE($5, intelligence_core_profile.unit),
         confidence = $6,
         data_points_used = $7,
         source = $8,
         calibrated_at = NOW(),
         updated_at = NOW()
       RETURNING *`,
      [userId, section, key, JSON.stringify(value), unit || null, confidence, dataPointsUsed, source]
    );

    return mapRow(result.rows[0]);
  }

  async updateValue(
    userId: string,
    section: CoreSection,
    key: string,
    value: unknown,
    unit?: string
  ): Promise<CoreProfileEntry> {
    return this.calibrate(userId, section, key, value, 'user', 1, unit);
  }

  async gracefulGet(userId: string, section: CoreSection, key: string): Promise<{
    value: unknown;
    confidence: number;
    source: IntelligenceSource;
    available: boolean;
  }> {
    const result = await query(
      `SELECT value, confidence, source FROM intelligence_core_profile
       WHERE user_id = $1 AND section = $2 AND key = $3`,
      [userId, section, key]
    );

    if (result.rows.length === 0) {
      return { value: null, confidence: 0, source: 'system', available: false };
    }

    const row = result.rows[0];
    return {
      value: row.value,
      confidence: row.confidence as number,
      source: row.source as IntelligenceSource,
      available: true,
    };
  }

  async getMissingFields(userId: string): Promise<Array<{ section: CoreSection; key: string; impact: 'low' | 'medium' | 'high' }>> {
    const result = await query(
      `SELECT section, key FROM intelligence_core_profile WHERE user_id = $1`,
      [userId]
    );

    const existingKeys = new Set(result.rows.map((r: Record<string, unknown>) => `${r.section}:${r.key}`));
    return EXPECTED_FIELDS.filter(f => !existingKeys.has(`${f.section}:${f.key}`));
  }

  async deleteEntry(userId: string, section: CoreSection, key: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM intelligence_core_profile WHERE user_id = $1 AND section = $2 AND key = $3`,
      [userId, section, key]
    );
    return (result.rowCount ?? 0) > 0;
  }

  private computeCalibrationConfidence(dataPointsUsed: number, source: IntelligenceSource): number {
    if (source === 'user') return 0.9;
    if (source === 'wearable') return Math.min(0.5 + dataPointsUsed * 0.02, 0.95);
    return Math.min(0.3 + dataPointsUsed * 0.05, 0.85);
  }
}

export const coreProfileKernelService = new CoreProfileKernelService();
