import type { ExerciseListItem } from "@/src/shared/services/exercises.service";
import type { CreateExercisePayload } from "@/src/shared/services/admin-exercises.service";

export const EXERCISE_EXPORT_VERSION = 1 as const;

export interface ExerciseExportDocument {
  version: typeof EXERCISE_EXPORT_VERSION;
  exportedAt: string;
  filterSummary?: string;
  exercises: CreateExercisePayload[];
}

function asStringArray(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

/**
 * Map a list row to a create-compatible payload (for export → re-import).
 */
export function exerciseListItemToCreatePayload(item: ExerciseListItem): CreateExercisePayload {
  return {
    slug: item.slug,
    name: item.name,
    description: item.description,
    category: item.category,
    primary_muscle_group: item.primary_muscle_group,
    secondary_muscle_groups: item.secondary_muscle_groups ?? [],
    equipment_required: item.equipment_required ?? [],
    difficulty_level: item.difficulty_level,
    instructions: asStringArray(item.instructions),
    tips: asStringArray(item.tips),
    common_mistakes: asStringArray(item.common_mistakes),
    video_url: item.video_url,
    thumbnail_url: item.thumbnail_url,
    animation_url: item.animation_url,
    default_sets: item.default_sets,
    default_reps: item.default_reps,
    default_duration_seconds: item.default_duration_seconds,
    default_rest_seconds: item.default_rest_seconds,
    is_active: item.is_active,
    calories_per_minute: item.calories_per_minute,
    met_value: item.met_value,
    tags: item.tags ?? [],
    body_part: item.body_part,
    target_muscles: item.target_muscles ?? [],
  };
}

export function buildExerciseExportDocument(
  exercises: ExerciseListItem[],
  filterSummary?: string
): ExerciseExportDocument {
  return {
    version: EXERCISE_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    filterSummary,
    exercises: exercises.map(exerciseListItemToCreatePayload),
  };
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/**
 * Parse client-side JSON from file. Server validates with Zod on POST.
 */
export function parseExerciseImportJson(text: string): CreateExercisePayload[] {
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Invalid JSON file");
  }

  if (Array.isArray(data)) {
    return data as CreateExercisePayload[];
  }

  if (isRecord(data) && Array.isArray(data.exercises)) {
    return data.exercises as CreateExercisePayload[];
  }

  throw new Error('Expected an array of exercises or { "exercises": [...] }');
}
