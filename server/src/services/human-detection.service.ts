/**
 * Human Detection Service
 * Detects if an image contains a human person before analysis
 */

import OpenAI from 'openai';
import { env } from '../config/env.config.js';
import { logger } from './logger.service.js';

export interface HumanDetectionResult {
  hasHuman: boolean;
  confidence: number;
  reason?: string;
  requiresHuman: boolean; // Whether this image type requires human presence
}

/**
 * Human Detection Service
 * Uses OpenAI Vision API to detect humans in images
 */
class HumanDetectionService {
  private visionClient: OpenAI | null = null;

  /**
   * Determine if model requires max_completion_tokens instead of max_tokens
   */
  private requiresMaxCompletionTokens(model: string): boolean {
    const modelLower = model.toLowerCase();
    return modelLower.startsWith('o1') || modelLower.startsWith('o3') || modelLower.startsWith('gpt-5');
  }

  /**
   * Check if model is a reasoning model that uses internal reasoning tokens
   */
  private isReasoningModel(model: string): boolean {
    const modelLower = model.toLowerCase();
    return modelLower.startsWith('o1') || modelLower.startsWith('o3') || modelLower === 'gpt-5';
  }

  /**
   * Get the correct token parameter for the model.
   * Reasoning models consume tokens for internal thinking, so we multiply the budget.
   */
  private getTokenParameter(model: string, maxTokens: number): { max_tokens?: number; max_completion_tokens?: number } {
    const adjustedTokens = this.isReasoningModel(model) ? maxTokens * 4 : maxTokens;
    if (this.requiresMaxCompletionTokens(model)) {
      return { max_completion_tokens: adjustedTokens };
    }
    return { max_tokens: adjustedTokens };
  }

  constructor() {
    this.initializeVisionClient();
  }

  private initializeVisionClient(): void {
    if (env.openai.apiKey) {
      try {
        this.visionClient = new OpenAI({
          apiKey: env.openai.apiKey,
          timeout: 30000,
          maxRetries: 1,
        });
        logger.info('[HumanDetection] Vision client initialized');
      } catch (error) {
        logger.warn('[HumanDetection] Failed to initialize Vision client', { error });
      }
    }
  }

  /**
   * Detect if image contains a human person
   * @param imageBuffer - Image buffer
   * @param mimeType - Image MIME type
   * @param imageType - Type of health image (to determine if human is required)
   * @returns Human detection result
   */
  async detectHuman(
    imageBuffer: Buffer,
    mimeType: string,
    imageType?: 'body_photo' | 'food_photo' | 'nutrition_label' | 'fitness_progress' | 'xray' | 'medical_report' | 'unknown'
  ): Promise<HumanDetectionResult> {
    // Determine if this image type requires human presence
    const requiresHuman = imageType ? ['body_photo', 'fitness_progress'].includes(imageType) : true;

    // Food photos and nutrition labels don't require human detection
    if (imageType === 'food_photo' || imageType === 'nutrition_label') {
      return {
        hasHuman: false,
        confidence: 1.0,
        requiresHuman: false,
        reason: 'Food photos and nutrition labels do not require human detection',
      };
    }

    // Medical images (xray, medical_report) don't require human detection
    if (imageType === 'xray' || imageType === 'medical_report') {
      return {
        hasHuman: false,
        confidence: 1.0,
        requiresHuman: false,
        reason: 'Medical images do not require human detection',
      };
    }

    // If Vision API not available, allow with warning if human not required
    if (!this.visionClient) {
      logger.warn('[HumanDetection] Vision API not available');
      if (!requiresHuman) {
        return {
          hasHuman: false,
          confidence: 0.5,
          requiresHuman: false,
          reason: 'Human detection skipped - Vision API unavailable',
        };
      }
      // If human is required but vision not available, reject
      return {
        hasHuman: false,
        confidence: 0,
        requiresHuman: true,
        reason: 'Human detection failed - Vision API unavailable',
      };
    }

    try {
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      const model = 'gpt-4o-mini';
      const response = await this.visionClient.chat.completions.create({
        model,
        ...this.getTokenParameter(model, 100),
        messages: [
          {
            role: 'system',
            content: `You are a human detection system for a health app. Analyze the image and determine if it contains a human person.

Respond ONLY with JSON: {"hasHuman": true|false, "confidence": 0.0-1.0, "reason": "brief explanation"}

Guidelines:
- A human person means: visible face, body parts (arms, legs, torso), or clearly identifiable human form
- Body parts visible in fitness/progress photos count as human
- Food items, objects, animals, landscapes alone do NOT count as human
- If human is partially visible (e.g., arm holding food), respond hasHuman: true
- Be strict: only respond hasHuman: true if a person is clearly present`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: dataUrl, detail: 'low' }, // Use low detail for faster detection
              },
              {
                type: 'text',
                text: 'Does this image contain a human person? Respond with JSON only.',
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          const hasHuman = Boolean(result.hasHuman);
          const confidence = typeof result.confidence === 'number' ? result.confidence : 0.5;

          return {
            hasHuman,
            confidence: Math.max(0, Math.min(1, confidence)), // Clamp between 0-1
            requiresHuman,
            reason: result.reason || (hasHuman ? 'Human detected in image' : 'No human detected in image'),
          };
        } catch (parseError) {
          logger.warn('[HumanDetection] Failed to parse JSON response', { content, error: parseError });
        }
      }

      // Fallback: check if response contains keywords
      const lowerContent = content.toLowerCase();
      const hasHumanKeywords = lowerContent.includes('yes') || lowerContent.includes('true') || lowerContent.includes('human');
      
      return {
        hasHuman: hasHumanKeywords,
        confidence: 0.6,
        requiresHuman,
        reason: 'Detection completed with lower confidence (parsing failed)',
      };
    } catch (error) {
      logger.error('[HumanDetection] Human detection error', { error });
      
      // If human is required, reject on error
      if (requiresHuman) {
        return {
          hasHuman: false,
          confidence: 0,
          requiresHuman: true,
          reason: 'Human detection failed due to error',
        };
      }

      // If human not required, allow with warning
      return {
        hasHuman: false,
        confidence: 0.5,
        requiresHuman: false,
        reason: 'Human detection failed - proceeding with caution',
      };
    }
  }

  /**
   * Check if image should be analyzed based on human detection
   * @param detectionResult - Human detection result
   * @returns Whether image should proceed to analysis
   */
  shouldAnalyzeImage(detectionResult: HumanDetectionResult): boolean {
    // If human not required, always proceed
    if (!detectionResult.requiresHuman) {
      return true;
    }

    // If human required, check if human was detected with sufficient confidence
    if (detectionResult.requiresHuman) {
      return detectionResult.hasHuman && detectionResult.confidence >= 0.5;
    }

    return false;
  }
}

export const humanDetectionService = new HumanDetectionService();
export default humanDetectionService;

