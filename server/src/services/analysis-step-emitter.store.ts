import type { AnalysisStep } from '@shared/types/domain/intelligence-files.js';

const emitters = new Map<string, (step: AnalysisStep) => void>();

export function setAnalysisStepEmitter(key: string, fn: (step: AnalysisStep) => void): void {
  emitters.set(key, fn);
}

export function getAnalysisStepEmitter(key: string): ((step: AnalysisStep) => void) | undefined {
  return emitters.get(key);
}

export function clearAnalysisStepEmitter(key: string): void {
  emitters.delete(key);
}
