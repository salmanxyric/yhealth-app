import type { ExtractedInsight } from './coach.types.js';

export type HealthImageType = 'body_photo' | 'xray' | 'medical_report' | 'food_photo' | 'nutrition_label' | 'fitness_progress' | 'unknown';

export interface ImageValidationResult {
  isValid: boolean;
  imageType: HealthImageType;
  confidence: number;
  reason?: string;
}

export interface ImageAnalysisResult {
  isHealthRelated: boolean;
  imageType: HealthImageType;
  analysis: string;
  insights: ExtractedInsight[];
  recommendations?: string[];
  warnings?: string[];
}

export interface UploadedHealthImage {
  key: string;
  url: string;
  mimeType: string;
  size: number;
  imageType: HealthImageType;
  analysisResult?: ImageAnalysisResult;
}
