/**
 * @file Intelligence Files Client Service
 * @description API service for the Intelligence Files system
 */

import { api } from "@/lib/api-client";
import type {
  FolderSummary,
  IntelligenceMemory,
  IntelligenceArtifact,
  IntelligencePlan,
  CoreProfile,
  CoreProfileEntry,
  LogReference,
  IntelligenceFeedback,
  CreateMemoryInput,
  UpdateMemoryInput,
  SubmitFeedbackInput,
  IntelligenceCategory,
  MemoryType,
  MemoryStatus,
  CoreSection,
  ArtifactType,
} from "@shared/types/domain/intelligence-files";

const BASE = "/v1/intelligence/files";

// ============================================
// FOLDERS
// ============================================

export async function getFolders() {
  return api.get<{ folders: FolderSummary[] }>(`${BASE}/folders`);
}

// ============================================
// MEMORIES
// ============================================

export interface ListMemoriesParams {
  [key: string]: string | number | boolean | undefined;
  category?: IntelligenceCategory;
  memoryType?: MemoryType;
  status?: MemoryStatus;
  minConfidence?: number;
  sort?: "date" | "confidence" | "usage";
  page?: number;
  limit?: number;
}

export async function listMemories(params: ListMemoriesParams = {}) {
  return api.get<{ memories: IntelligenceMemory[] }>(`${BASE}/memories`, {
    params,
  });
}

export async function getMemory(id: string) {
  return api.get<{ memory: IntelligenceMemory }>(`${BASE}/memories/${id}`);
}

export async function createMemory(input: CreateMemoryInput) {
  return api.post<{ memory: IntelligenceMemory }>(`${BASE}/memories`, input);
}

export async function updateMemory(id: string, input: UpdateMemoryInput) {
  return api.patch<{ memory: IntelligenceMemory }>(
    `${BASE}/memories/${id}`,
    input,
  );
}

export async function verifyMemory(id: string) {
  return api.post<{ memory: IntelligenceMemory }>(
    `${BASE}/memories/${id}/verify`,
  );
}

export async function rejectMemory(
  id: string,
  data?: { reason?: string; correction?: string },
) {
  return api.post<{ memory: IntelligenceMemory }>(
    `${BASE}/memories/${id}/reject`,
    data,
  );
}

export async function expireMemory(id: string) {
  return api.post<{ memory: IntelligenceMemory }>(
    `${BASE}/memories/${id}/expire`,
  );
}

export async function searchMemories(
  q: string,
  opts?: { category?: IntelligenceCategory; limit?: number },
) {
  return api.get<{ memories: IntelligenceMemory[] }>(
    `${BASE}/memories/search`,
    { params: { q, ...opts } },
  );
}

// ============================================
// CORE PROFILE
// ============================================

export async function getCoreProfile() {
  return api.get<{ profile: CoreProfile }>(`${BASE}/core`);
}

export async function getCoreProfileSection(section: CoreSection) {
  return api.get<{ entries: CoreProfileEntry[] }>(`${BASE}/core/${section}`);
}

export async function updateCoreValue(
  section: CoreSection,
  key: string,
  value: unknown,
  unit?: string,
) {
  return api.patch<{ entry: CoreProfileEntry }>(
    `${BASE}/core/${section}/${key}`,
    { value, unit },
  );
}

// ============================================
// ARTIFACTS
// ============================================

export interface ListArtifactsParams {
  [key: string]: string | number | boolean | undefined;
  artifactType?: ArtifactType;
  tag?: string;
  page?: number;
  limit?: number;
}

export async function listArtifacts(params: ListArtifactsParams = {}) {
  return api.get<{ artifacts: IntelligenceArtifact[] }>(
    `${BASE}/artifacts`,
    { params },
  );
}

export async function getArtifact(id: string) {
  return api.get<{ artifact: IntelligenceArtifact }>(
    `${BASE}/artifacts/${id}`,
  );
}

export async function updateArtifact(
  id: string,
  data: { isPinned?: boolean; isArchived?: boolean; tags?: string[] },
) {
  return api.patch<{ artifact: IntelligenceArtifact }>(
    `${BASE}/artifacts/${id}`,
    data,
  );
}

// ============================================
// PLANS
// ============================================

export async function listPlans() {
  return api.get<{ plans: IntelligencePlan[] }>(`${BASE}/plans`);
}

export async function getPlan(id: string) {
  return api.get<{ plan: IntelligencePlan }>(`${BASE}/plans/${id}`);
}

// ============================================
// LOGS
// ============================================

export interface ListLogsParams {
  [key: string]: string | number | boolean | undefined;
  category?: IntelligenceCategory;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function listLogs(params: ListLogsParams = {}) {
  return api.get<{ logs: LogReference[] }>(`${BASE}/logs`, { params });
}

// ============================================
// FEEDBACK
// ============================================

export async function submitFeedback(input: SubmitFeedbackInput) {
  return api.post<{ feedback: IntelligenceFeedback }>(
    `${BASE}/feedback`,
    input,
  );
}
