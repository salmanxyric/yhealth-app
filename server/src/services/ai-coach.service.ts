/**
 * AI Coach Service
 * Handles image analysis, goal generation, and AI coaching features
 */

import OpenAI from 'openai';
import crypto from 'crypto';
import path from 'path';
import { env } from '../config/env.config.js';
import { logger } from './logger.service.js';
import { ApiError } from '../utils/ApiError.js';
import { r2Service } from './r2.service.js';
import { humanDetectionService } from './human-detection.service.js';
import { query } from '../database/pg.js';
import { langGraphChatbotService } from './langgraph-chatbot.service.js';

export type HealthImageType = 'body_photo' | 'xray' | 'medical_report' | 'food_photo' | 'nutrition_label' | 'fitness_progress' | 'unknown';
export type GoalCategory = string;
export type ConversationPhase = string;
export type SupportedLanguage = 'en' | 'ur';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationContext {
  messages?: ChatMessage[];
  phase?: ConversationPhase;
  userId?: string;
  goal?: GoalCategory;
  messageCount?: number;
  extractedInsights?: ExtractedInsight[];
  userProfile?: { name: string };
  language?: SupportedLanguage;
  isOnboarding?: boolean;
}

export interface ExtractedInsight {
  category: string;
  text: string;
  confidence: number;
}

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

export interface DietPlanRequest {
  userId: string;
  goal?: GoalCategory;
  goalCategory?: GoalCategory;
  insights?: ExtractedInsight[];
  preferences?: Record<string, unknown>;
}

export interface GeneratedDietPlan {
  plan: unknown;
}

export interface AssessmentResponseInput {
  questionId: string;
  value: string;
}

export interface BodyStatsInput {
  height?: number;
  weight?: number;
  age?: number;
}

export interface GeneratedGoal {
  title: string;
  description: string;
  targetValue?: number;
  targetUnit?: string;
  timeline?: {
    startDate?: string;
    targetDate?: string;
    durationWeeks?: number;
  };
  motivation?: string;
  milestones?: Array<{
    week?: number;
    target?: number;
    description?: string;
  }>;
  // Additional properties that may be added during enrichment
  id?: string;
  category?: string;
  pillar?: string;
  isPrimary?: boolean;
  currentValue?: number;
  confidenceScore?: number;
  aiSuggested?: boolean;
}

export interface GenerateGoalsRequest {
  userId: string;
  goalCategory: GoalCategory;
  assessmentResponses: AssessmentResponseInput[];
  bodyStats?: BodyStatsInput;
  customGoalText?: string;
}

export interface GenerateGoalsResponse {
  goals: GeneratedGoal[];
  reasoning?: string;
}

export type MCQCategory = string;

export interface MCQOption {
  id: string;
  text: string;
  insightValue?: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: MCQOption[];
}

export interface MCQGenerationRequest {
  userId?: string;
  goal: GoalCategory;
  category?: MCQCategory;
  phase?: ConversationPhase;
  previousAnswers?: { questionId: string; selectedOptions: string[] }[];
  extractedInsights?: ExtractedInsight[];
  language?: SupportedLanguage;
}

export interface MCQGenerationResponse {
  question: MCQQuestion;
  phase: ConversationPhase;
  progress: number;
  isComplete?: boolean;
  insights?: ExtractedInsight[];
}

export interface AICoachResponse {
  message: string;
  phase: ConversationPhase;
  insights: ExtractedInsight[];
  isComplete: boolean;
  suggestedActions?: string[];
}

export interface AICoachSession {
  id: string;
  userId: string;
  goalCategory: GoalCategory;
  sessionType: string;
  messages: ChatMessage[];
  extractedInsights: ExtractedInsight[];
  conversationPhase: ConversationPhase;
  messageCount: number;
  userMessageCount: number;
  isComplete: boolean;
  sessionSummary?: string;
  keyTakeaways?: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

class AICoachService {
  private visionClient: OpenAI | null = null;

  /**
   * Determine if model requires max_completion_tokens instead of max_tokens
   * Models like o1, o1-preview, o1-mini, o3, o3-mini, gpt-4o, gpt-4o-mini, gpt-5-mini require max_completion_tokens
   */
  private requiresMaxCompletionTokens(model: string): boolean {
    const modelLower = model.toLowerCase();
    return (
      modelLower.startsWith('o1') || 
      modelLower.startsWith('o3') ||
      modelLower.startsWith('gpt-4o') ||
      modelLower.startsWith('gpt-5')
    );
  }

  /**
   * Check if model is a reasoning model that uses internal reasoning tokens
   */
  private isReasoningModel(model: string): boolean {
    const modelLower = model.toLowerCase();
    return modelLower.startsWith('o1') || modelLower.startsWith('o3') || modelLower.startsWith('gpt-5');
  }

  /**
   * Get the correct token parameter for the model.
   * Reasoning models (o1, o3, gpt-5) consume tokens for internal thinking,
   * so we multiply the budget to ensure enough room for actual output.
   */
  private getTokenParameter(model: string, maxTokens: number): { max_tokens?: number; max_completion_tokens?: number } {
    const adjustedTokens = this.isReasoningModel(model) ? maxTokens * 4 : maxTokens;
    if (this.requiresMaxCompletionTokens(model)) {
      return { max_completion_tokens: adjustedTokens };
    }
    return { max_tokens: adjustedTokens };
  }

  /**
   * Determine if model supports custom temperature values
   * Models like gpt-4o, gpt-4o-mini, gpt-5-mini only support default temperature (1)
   */
  private supportsCustomTemperature(model: string): boolean {
    const modelLower = model.toLowerCase();
    // Models that only support default temperature
    const restrictedModels = [
      'gpt-4o',
      'gpt-5',
    ];
    return !restrictedModels.some(prefix => modelLower.startsWith(prefix));
  }

  /**
   * Get temperature parameter for the model (only if supported)
   */
  private getTemperatureParameter(model: string, temperature: number): { temperature?: number } {
    if (this.supportsCustomTemperature(model)) {
      return { temperature };
    }
    // Return empty object - model will use default temperature
    return {};
  }

  /**
   * Check if model supports response_format parameter
   * Most models support it, but we can exclude specific ones if needed
   */
  private supportsResponseFormat(_model: string): boolean {
    // Allow response_format for most models including gpt-5-mini
    // If a model doesn't support it, the API will return an error which we'll handle
    return true;
  }

  /**
   * Get response_format parameter for the model (only if supported)
   */
  private getResponseFormatParameter(model: string): { response_format?: { type: 'json_object' } } {
    if (this.supportsResponseFormat(model)) {
      return { response_format: { type: 'json_object' } };
    }
    // Return empty object - will need to parse JSON from text response
    return {};
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
          maxRetries: 0,
        });
        logger.info('[AICoach] Vision client initialized');
      } catch (error) {
        logger.warn('[AICoach] Failed to initialize Vision client', { error });
      }
    }
  }

  isAvailable(): boolean {
    return this.visionClient !== null;
  }

  async validateHealthImage(
    buffer: Buffer,
    mimeType: string,
    originalName: string
  ): Promise<ImageValidationResult> {
    // If vision client is not available, default to accepting all images as valid
    if (!this.visionClient) {
      logger.warn('[AICoach] Vision client not available, defaulting to unknown image type');
      return {
        isValid: true,
        imageType: 'unknown',
        confidence: 0.5,
      };
    }

    try {
      // Convert buffer to base64 for OpenAI Vision API
      const base64Image = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Use vision API to classify the image type
      const model = env.openai.model || 'gpt-4o-mini';
      const response = await this.visionClient.chat.completions.create({
        model,
        ...this.getTokenParameter(model, 200),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and classify it into ONE of these categories:
- "nutrition_label": Photos of product Nutrition Facts panels, ingredient lists, food package labels, or nutrition information tables
- "food_photo": Any food, meal, dish, ingredient, recipe, or nutrition-related image (burgers, salads, fruits, vegetables, cooked meals, raw ingredients, etc.)
- "body_photo": Photos of people's bodies, physique, posture, or fitness progress
- "fitness_progress": Workout equipment, exercise form, fitness tracking screenshots
- "xray": Medical imaging scans (X-rays, CT scans, MRIs, etc.)
- "medical_report": Medical documents, lab results, health reports
- "unknown": If the image doesn't clearly fit any category above

IMPORTANT: If you see a Nutrition Facts panel, ingredient list, or food package label with printed nutrition data, classify it as "nutrition_label". If you see actual food items, ingredients, meals, or dishes, classify it as "food_photo".

Respond with ONLY the category name in lowercase (e.g., "nutrition_label", "food_photo", "body_photo", etc.). No explanations, no JSON, just the category name.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'low', // Use low detail for faster classification
                },
              },
            ],
          },
        ],
      });

      const classification = response.choices[0]?.message?.content?.trim().toLowerCase() || 'unknown';
      
      // Map classification to HealthImageType
      // Be very lenient with food detection - check for any food-related keywords
      let imageType: HealthImageType = 'unknown';
      let confidence = 0.7;

      // Nutrition label detection - check before food to avoid misclassification
      const labelKeywords = ['nutrition_label', 'nutrition facts', 'label', 'package', 'ingredients list'];
      const isLabel = labelKeywords.some(kw => classification.includes(kw)) || classification === 'nutrition_label';

      // Food detection - check for various food-related terms
      const foodKeywords = ['food', 'meal', 'dish', 'burger', 'pizza', 'salad', 'fruit', 'vegetable',
                            'ingredient', 'recipe', 'cooking', 'nutrition', 'eat', 'dining', 'restaurant',
                            'breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'drink'];
      const isFood = foodKeywords.some(keyword => classification.includes(keyword)) ||
                     classification === 'food_photo' ||
                     classification.startsWith('food');

      if (isLabel) {
        imageType = 'nutrition_label';
        confidence = 0.95;
      } else if (isFood) {
        imageType = 'food_photo';
        confidence = 0.95; // High confidence for food images
      } else if (classification.includes('body') || classification === 'body_photo' || classification.includes('physique')) {
        imageType = 'body_photo';
        confidence = 0.85;
      } else if (classification.includes('fitness') || classification === 'fitness_progress' || classification.includes('workout')) {
        imageType = 'fitness_progress';
        confidence = 0.8;
      } else if (classification.includes('xray') || classification.includes('x-ray') || classification.includes('medical imaging') || classification.includes('scan')) {
        imageType = 'xray';
        confidence = 0.85;
      } else if (classification.includes('medical') && (classification.includes('report') || classification.includes('document') || classification.includes('lab'))) {
        imageType = 'medical_report';
        confidence = 0.85;
      }

      logger.info('[AICoach] Image classified', {
        classification,
        imageType,
        confidence,
        filename: originalName,
      });

      // For food images and other health-related images, always return valid
      // Be especially lenient - if classification suggests food but we got unknown, 
      // still accept it as valid (might be edge case)
      const isValid = imageType !== 'unknown' || 
                      classification !== 'unknown' ||
                      // If we can't classify but it's not clearly non-health, accept it
                      (!classification.includes('not') && !classification.includes('invalid'));

      return {
        isValid,
        imageType,
        confidence,
        reason: isValid ? undefined : 'Image does not appear to be health or nutrition related',
      };
    } catch (error: any) {
      logger.error('[AICoach] Failed to classify image, defaulting to unknown', {
        error: error?.message || 'Unknown error',
        filename: originalName,
      });
      
      // On error, default to accepting the image as valid but unknown type
      // This prevents blocking legitimate food images due to API issues
      return {
        isValid: true,
        imageType: 'unknown',
        confidence: 0.5,
        reason: 'Image classification failed, but accepting image for analysis',
      };
    }
  }

  async uploadHealthImage(
    userId: string,
    buffer: Buffer,
    mimeType: string,
    originalName: string
  ): Promise<UploadedHealthImage> {
    const validation = await this.validateHealthImage(buffer, mimeType, originalName);

    if (!validation.isValid) {
      throw ApiError.badRequest(validation.reason || 'Invalid health image');
    }

    try {
      const uploadResult = await r2Service.upload(buffer, originalName, mimeType, {
        fileType: 'image',
        userId,
        customPath: `ai-coach/health-images/${validation.imageType}`,
        isPublic: false,
      });

      logger.info('[AICoach] Health image uploaded', {
        userId,
        key: uploadResult.key,
        imageType: validation.imageType,
      });

      return {
        key: uploadResult.key,
        url: uploadResult.url,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        imageType: validation.imageType,
      };
    } catch (uploadError: any) {
      // Handle timeout and other upload errors gracefully
      const isTimeout = uploadError?.code === 'ETIMEDOUT' || 
                       uploadError?.name === 'TimeoutError' ||
                       uploadError?.message?.includes('timeout') ||
                       uploadError?.message?.includes('ETIMEDOUT');

      if (isTimeout) {
        logger.warn('[AICoach] R2 upload timed out, proceeding with analysis using buffer directly', {
          userId,
          imageType: validation.imageType,
          error: uploadError?.message || 'Upload timeout',
        });
      } else {
        logger.warn('[AICoach] R2 upload failed, proceeding with analysis using buffer directly', {
          userId,
          imageType: validation.imageType,
          error: uploadError?.message || 'Upload failed',
        });
      }

      // Return a placeholder result - analysis will use buffer directly
      // Generate a temporary key for reference (won't be used for actual storage)
      const tempKey = `temp/${userId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(originalName)}`;
      
      return {
        key: tempKey,
        url: '', // Empty URL - will use buffer directly
        mimeType,
        size: buffer.length,
        imageType: validation.imageType,
      };
    }
  }

  async analyzeHealthImage(
    imageUrlOrBuffer: string | Buffer,
    imageType: HealthImageType,
    userContext?: { goal?: GoalCategory; question?: string },
    mimeType?: string
  ): Promise<ImageAnalysisResult> {
    if (!this.visionClient) {
      logger.error('[AICoach] Vision client not initialized', { imageType, userId: userContext?.goal });
      throw ApiError.internal('Vision API not available. Please check OpenAI API configuration.');
    }

    const model = env.openai.model || 'gpt-4o-mini';
    logger.info('[AICoach] Starting image analysis', {
      imageType,
      hasQuestion: !!userContext?.question,
      model,
    });

    let imageContent: { type: 'image_url'; image_url: { url: string; detail: 'auto' | 'low' | 'high' } };
    if (Buffer.isBuffer(imageUrlOrBuffer)) {
      if (!mimeType) {
        throw ApiError.badRequest('MIME type required when providing image buffer');
      }
      const base64Image = imageUrlOrBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      imageContent = {
        type: 'image_url',
        image_url: { url: dataUrl, detail: 'auto' },
      };
    } else {
      imageContent = {
        type: 'image_url',
        image_url: { url: imageUrlOrBuffer, detail: 'auto' },
      };
    }

    const analysisPrompts: Record<HealthImageType, string> = {
      body_photo: `Analyze this body/physique/face photo for a comprehensive health, fitness, wellness, and nutrition coaching app. **FOCUS PRIMARILY ON THE PERSON IN THE IMAGE** - analyze their body, face, posture, and physical appearance in detail. Provide a detailed analysis including mood, fitness level, wellness indicators, body composition, and personalized recommendations.`,
      food_photo: `Analyze this food/meal photo comprehensively for nutritional coaching. Identify all food items, ingredients, and dishes visible in the image.

CRITICAL: Format your response with clear sections using markdown headers. Structure your response as follows:

**Foods Identified:**
1. [Food Name] ([portion size]) - ~[calories] kcal
2. [Food Name] ([portion size]) - ~[calories] kcal
(Continue for all foods)

**Estimated Calories:**
[Total estimated calories] kcal

**Macronutrients:**
Protein: [X]g
Carbohydrates: [X]g
Fats: [X]g
Fiber: [X]g (if visible)

**Key Micronutrients:**
1. [Nutrient 1]
2. [Nutrient 2]
(Continue for key micronutrients)

**Nutrition & Diet Recommendations:**
1. [Recommendation 1]
2. [Recommendation 2]
(Continue for recommendations)

IMPORTANT:
- List EVERY food item you can see, even if partially visible
- Provide portion sizes (e.g., "1 burger", "150g rice", "1 cup salad")
- Estimate calories for each item based on standard nutritional values
- Be specific with food names (e.g., "Grilled Chicken Breast" not just "chicken")
- Include all visible ingredients and components`,
      nutrition_label: `You are a nutrition label OCR specialist. Extract ALL nutrition data from this product label image.

CRITICAL: Respond with ONLY a valid JSON object. No text before or after.

{
  "productName": "Product name if visible",
  "servingSize": "e.g. 3 pieces (25g)",
  "servingsPerContainer": 8,
  "nutrients": {
    "calories": 60,
    "totalFat": 2.5,
    "saturatedFat": 1,
    "transFat": 0,
    "cholesterol": 0,
    "sodium": 60,
    "totalCarbs": 9,
    "dietaryFiber": 0,
    "totalSugars": 5,
    "protein": 1
  },
  "unitNote": "All values per serving unless noted"
}

IMPORTANT:
- Extract EXACT numbers from the label, do not estimate
- All nutrient values should be numeric (grams for macros, mg for sodium/cholesterol, kcal for calories)
- If a value is not visible or not listed, use null
- Include the serving size exactly as printed on the label
- If multiple columns exist (e.g. "per serving" vs "per 100g"), use the "per serving" column
- Read carefully — do not confuse similar-looking numbers`,
      fitness_progress: `Analyze this fitness progress photo. Focus on the person's fitness level, body composition, and progress indicators.`,
      xray: `This appears to be a medical imaging scan. Acknowledge you see the image, strongly recommend consulting with a qualified radiologist/doctor, and provide general wellness tips.`,
      medical_report: `This appears to be a medical document/report. Acknowledge the document, note that you cannot provide medical interpretation, and suggest discussing results with their healthcare provider.`,
      unknown: `Analyze this health-related image and provide relevant observations and suggestions. If this appears to be a food or meal image, analyze it for nutritional content, calories, and macronutrients.`,
    };

    try {
      let response;

      // Check if this is a nutrition label scan request
      const isNutritionLabelScan = imageType === 'nutrition_label' ||
        (userContext?.question &&
         (userContext.question.toLowerCase().includes('nutrition label') ||
          userContext.question.toLowerCase().includes('scan label') ||
          userContext.question.toLowerCase().includes('scan nutrition')));

      // Check if this is a recipe generation request (custom prompt for food photos)
      const isRecipeGeneration = !isNutritionLabelScan && imageType === 'food_photo' &&
        userContext?.question &&
        (userContext.question.toLowerCase().includes('recipe') ||
         userContext.question.toLowerCase().includes('ingredient') ||
         userContext.question.toLowerCase().includes('instruction'));

      // Determine the prompt to use
      let promptText: string;
      let systemPrompt: string;
      let maxTokens: number;

      if (isNutritionLabelScan) {
        // Use nutrition label OCR prompt with high detail for accuracy
        systemPrompt = 'You are a nutrition label OCR specialist. Extract exact nutrition data from product labels with high precision.';
        maxTokens = 1000;
        promptText = analysisPrompts['nutrition_label'];
        // Override image detail to 'high' for better OCR accuracy
        imageContent.image_url.detail = 'high';
      } else if (isRecipeGeneration && userContext?.question) {
        // Use custom recipe generation prompt with JSON output format
        systemPrompt = 'You are an expert chef and nutritionist. Generate detailed, accurate recipes with precise measurements, cooking instructions, and nutritional information.';
        maxTokens = 3000; // Higher token limit for detailed recipes

        // Enhance the recipe prompt to request JSON output
        promptText = `${userContext.question}

CRITICAL: You MUST respond with a valid JSON object. Do not include any text before or after the JSON.

Format your response EXACTLY as this JSON structure:
{
  "name": "Recipe Name",
  "description": "A 2-3 sentence description of the dish",
  "category": "breakfast|lunch|dinner|snack|dessert",
  "cuisine": "Italian|Mexican|Asian|Chinese|Japanese|Indian|French|Mediterranean|American|Thai|Korean|Greek|Other",
  "ingredients": [
    {"quantity": "2", "unit": "lbs", "name": "chicken breast"},
    {"quantity": "1", "unit": "tbsp", "name": "olive oil"}
  ],
  "instructions": [
    {"step": 1, "description": "Preheat oven to 400°F (200°C)"},
    {"step": 2, "description": "Season the chicken with salt and pepper"}
  ],
  "nutrition": {
    "calories": 450,
    "protein": 35,
    "carbs": 25,
    "fat": 18,
    "fiber": 4
  },
  "time": {
    "prep": 15,
    "cook": 30
  },
  "servings": 4,
  "difficulty": "easy|medium|hard",
  "tags": ["High-Protein", "Quick", "Healthy"],
  "dietaryFlags": ["gluten-free", "dairy-free", "high-protein", "low-carb", "keto", "vegetarian", "vegan"]
}

IMPORTANT RULES:
1. Analyze the image carefully and identify the dish
2. Provide REALISTIC nutritional values based on ingredients
3. Include ALL visible ingredients with proper quantities
4. Write DETAILED step-by-step instructions
5. Estimate accurate prep and cook times
6. Only include applicable dietary flags
7. The response must be ONLY valid JSON - no markdown, no extra text`;
      } else if (userContext?.question && userContext.question.length > 50) {
        // Use custom question as prompt if substantial
        systemPrompt = 'You are an expert AI health, fitness, wellness, and nutrition coach providing comprehensive image analysis.';
        maxTokens = 2000;
        promptText = `${userContext.question}

Provide your response in valid JSON format:
{
  "analysis": "Your detailed analysis based on the question",
  "insights": [{"category": "nutrition|fitness|wellness", "text": "insight", "confidence": 0.8}],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "warnings": []
}`;
      } else {
        // Use default prompts
        systemPrompt = 'You are an expert AI health, fitness, wellness, and nutrition coach providing comprehensive image analysis.';
        maxTokens = 1500;
        promptText = `${analysisPrompts[imageType]}

CRITICAL INSTRUCTIONS:
1. You MUST respond with valid JSON only - no additional text before or after the JSON
2. The "analysis" field MUST include markdown headers (##) for each section as specified in the prompt above
3. Be DETAILED and SPECIFIC in your analysis - avoid generic statements
4. Format your response EXACTLY as:
{
  "analysis": "Your comprehensive analysis with ## markdown headers for each section as specified",
  "insights": [
    {"category": "mood|fitness|wellness|posture", "text": "specific detailed insight", "confidence": 0.8}
  ],
  "recommendations": ["specific actionable tip 1", "specific actionable tip 2"],
  "warnings": []
}

IMPORTANT: The analysis text MUST follow the exact structure with ## headers as specified in the prompt. Do not use **bold** for section headers - use ## markdown headers.`;
      }

      logger.info('[AICoach] Using prompt configuration', {
        imageType,
        isRecipeGeneration,
        hasCustomQuestion: !!userContext?.question,
        maxTokens,
        promptLength: promptText.length,
      });

      try {
        response = await this.visionClient.chat.completions.create({
          model,
          ...this.getTokenParameter(model, maxTokens),
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: [
                imageContent,
                {
                  type: 'text',
                  text: promptText,
                },
              ],
            },
          ],
        });
      } catch (apiError: any) {
        logger.error('[AICoach] Vision API call failed', {
          imageType,
          error: apiError?.message || 'Unknown error',
          errorType: apiError?.type,
          errorCode: apiError?.code,
          status: apiError?.status,
        });

        if (apiError?.status === 429) {
          throw ApiError.internal('Image analysis service is temporarily rate-limited. Please try again in a few moments.');
        } else if (apiError?.status === 401 || apiError?.status === 403) {
          throw ApiError.internal('Image analysis service authentication failed. Please contact support.');
        } else if (apiError?.status === 400) {
          throw ApiError.badRequest('Invalid image format or size. Please ensure the image is a valid JPEG, PNG, WebP, or HEIC file under 10MB.');
        } else if (apiError?.message?.includes('quota') || apiError?.message?.includes('billing')) {
          throw ApiError.internal('Image analysis service quota exceeded. Please try again later.');
        } else {
          throw ApiError.internal(`Image analysis failed: ${apiError?.message || 'Unknown error'}. Please try again or contact support if the issue persists.`);
        }
      }

      if (!response || !response.choices || response.choices.length === 0) {
        logger.error('[AICoach] Vision API returned empty response', { imageType });
        throw ApiError.internal('Image analysis service returned an empty response. Please try again.');
      }

      const content = response.choices[0]?.message?.content || '';
      
      if (!content || content.trim().length === 0) {
        logger.error('[AICoach] Vision API returned empty content', { imageType });
        throw ApiError.internal('Image analysis service returned no content. Please try again.');
      }

      logger.debug('[AICoach] Received analysis response', {
        imageType,
        contentLength: content.length,
        hasJson: content.includes('{'),
      });

      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        let result;
        try {
          result = JSON.parse(jsonMatch[0]);
          logger.debug('[AICoach] Successfully parsed JSON response', {
            imageType,
            hasAnalysis: !!result.analysis,
            hasInsights: !!result.insights,
            isRecipeData: !!(result.name || result.ingredients),
          });
        } catch (parseError) {
          logger.error('[AICoach] Failed to parse JSON from response', {
            imageType,
            error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
            contentPreview: content.substring(0, 500),
          });
          const fallbackAnalysis = content.substring(0, 2000);
          return {
            isHealthRelated: true,
            imageType,
            analysis: fallbackAnalysis || 'Analysis completed, but response format was unexpected. Please try again if you need structured analysis.',
            insights: [],
            recommendations: [],
            warnings: ['Response parsing failed. Analysis may be incomplete.'],
          };
        }

        // Check if this is nutrition label data (has nutrients object at root level)
        const isNutritionLabelData = !!(result.nutrients && (result.nutrients.calories !== undefined || result.nutrients.protein !== undefined));

        if (isNutritionLabelData) {
          logger.info('[AICoach] Detected nutrition label data in response', {
            imageType,
            productName: result.productName,
            hasCalories: result.nutrients?.calories !== undefined,
          });

          return {
            isHealthRelated: true,
            imageType: 'nutrition_label' as HealthImageType,
            analysis: JSON.stringify(result),
            insights: [],
            recommendations: [],
            warnings: [],
          };
        }

        // Check if this is recipe data (has name/ingredients/instructions at root level)
        // Recipe responses don't have an 'analysis' field - they have recipe fields directly
        const isRecipeData = !!(result.name || result.ingredients || result.instructions);

        if (isRecipeData) {
          // For recipe data, return the full JSON as a string so the client can parse it
          logger.info('[AICoach] Detected recipe data in response, returning as JSON string', {
            imageType,
            hasName: !!result.name,
            ingredientCount: result.ingredients?.length || 0,
            instructionCount: result.instructions?.length || 0,
          });

          return {
            isHealthRelated: true,
            imageType,
            analysis: JSON.stringify(result), // Return stringified JSON for client to parse
            insights: [],
            recommendations: [],
            warnings: [],
          };
        }

        return {
          isHealthRelated: true,
          imageType,
          analysis: result.analysis || 'Image analyzed successfully',
          insights: result.insights || [],
          recommendations: result.recommendations || [],
          warnings: result.warnings || [],
        };
      }

      return {
        isHealthRelated: true,
        imageType,
        analysis: content.substring(0, 2000),
        insights: [],
        recommendations: [],
        warnings: ['This is AI-generated analysis. Consult professionals for medical concerns.'],
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('[AICoach] Image analysis error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        imageType,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw ApiError.internal('Failed to analyze image. Please try again.');
    }
  }

  private formatImageAnalysisResponse(analysis: ImageAnalysisResult, question?: string): string {
    let response = analysis.analysis;

    if (question && question.trim()) {
      response = `**Regarding your question: "${question}"**\n\n${response}`;
    }

    if (analysis.recommendations?.length) {
      response += '\n\n**Suggestions:**\n' + analysis.recommendations.map(r => `â€¢ ${r}`).join('\n');
    }

    if (analysis.warnings?.length) {
      response += '\n\nâš ï¸ ' + analysis.warnings.join(' ');
    }

    return response;
  }

  async processImageMessage(
    userId: string,
    imageBuffer: Buffer,
    mimeType: string,
    originalName: string,
    userQuestion?: string,
    goal?: GoalCategory
  ): Promise<{ image: UploadedHealthImage; analysis: ImageAnalysisResult; response: string }> {
    const uploadedImage = await this.uploadHealthImage(userId, imageBuffer, mimeType, originalName);

    const humanDetection = await humanDetectionService.detectHuman(
      imageBuffer,
      mimeType,
      uploadedImage.imageType
    );

    if (!humanDetectionService.shouldAnalyzeImage(humanDetection)) {
      throw ApiError.badRequest(
        humanDetection.reason || 'Image does not contain a human person. Please upload a photo of yourself for body/fitness analysis, or a food photo for nutrition analysis.'
      );
    }

    // Use buffer directly if upload failed (empty URL), otherwise use uploaded URL
    const imageSource = uploadedImage.url ? uploadedImage.url : imageBuffer;
    const analysisMimeType = uploadedImage.url ? undefined : mimeType;
    
    const analysis = await this.analyzeHealthImage(
      imageSource, 
      uploadedImage.imageType, 
      {
        goal,
        question: userQuestion,
      },
      analysisMimeType
    );

    const response = this.formatImageAnalysisResponse(analysis, userQuestion);

    const personImageTypes = ['body_photo', 'fitness_progress'];
    if (personImageTypes.includes(uploadedImage.imageType) && analysis.analysis) {
      logger.info('[AICoach] Starting wellbeing extraction from image analysis', {
        userId,
        imageType: uploadedImage.imageType,
        hasAnalysis: !!analysis.analysis,
        analysisLength: analysis.analysis?.length || 0,
      });

      (async () => {
        try {
          const { wellbeingAutoTrackerService } = await import('./wellbeing-auto-tracker.service.js');
          const wellbeingData = await wellbeingAutoTrackerService.extractWellbeingFromImageAnalysis(
            userId,
            analysis.analysis,
            uploadedImage.imageType
          );

          if (wellbeingData.entries.length > 0) {
            await wellbeingAutoTrackerService.autoCreateEntries(userId, wellbeingData.entries);
            logger.info('[AICoach] Extracted and stored wellbeing data from image analysis', {
              userId,
              entriesCreated: wellbeingData.entries.length,
              types: wellbeingData.entries.map(e => e.type),
            });
          }
        } catch (error) {
          logger.error('[AICoach] Failed to extract wellbeing data from image analysis', {
            userId,
            imageType: uploadedImage.imageType,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      })();
    }

    return {
      image: { ...uploadedImage, analysisResult: analysis },
      analysis,
      response,
    };
  }

  /**
   * Get previous sessions for a user
   */
  async getPreviousSessions(userId: string, limit: number = 20): Promise<AICoachSession[]> {
    try {
      const result = await query<{
        id: string;
        user_id: string;
        goal_category: string;
        session_type: string;
        messages: ChatMessage[];
        extracted_insights: ExtractedInsight[];
        conversation_phase: string;
        message_count: number;
        user_message_count: number;
        is_complete: boolean;
        session_summary: string | null;
        key_takeaways: string[] | null;
        completed_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>(
        `SELECT * FROM ai_coach_sessions
         WHERE user_id = $1 AND status != 'active'
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map(row => this.mapSessionRow(row));
    } catch (error) {
      logger.error('[AICoach] Error getting previous sessions', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw ApiError.internal('Failed to retrieve chat history');
    }
  }

  /**
   * Get active session for a user
   */
  async getActiveSession(userId: string, goal?: GoalCategory, sessionType?: string): Promise<AICoachSession | null> {
    let result: { rows: Array<{
      id: string;
      user_id: string;
      goal_category: string;
      session_type: string;
      messages: ChatMessage[] | unknown;
      extracted_insights: ExtractedInsight[] | unknown;
      conversation_phase: string;
      message_count: number;
      user_message_count: number;
      is_complete: boolean;
      session_summary: string | null;
      key_takeaways: string[] | null;
      completed_at: Date | null;
      created_at: Date | null;
      updated_at: Date | null;
    }> } | null = null;

    try {
      let queryText = `SELECT * FROM ai_coach_sessions 
                       WHERE user_id = $1 AND status = 'active'`;
      const params: (string | number | boolean | null | Date | object)[] = [userId];
      
      if (goal) {
        queryText += ` AND goal_category = $${params.length + 1}`;
        params.push(goal);
      }

      if (sessionType) {
        queryText += ` AND session_type = $${params.length + 1}`;
        params.push(sessionType);
      }

      queryText += ` ORDER BY created_at DESC LIMIT 1`;

      result = await query<{
        id: string;
        user_id: string;
        goal_category: string;
        session_type: string;
        messages: ChatMessage[] | unknown;
        extracted_insights: ExtractedInsight[] | unknown;
        conversation_phase: string;
        message_count: number;
        user_message_count: number;
        is_complete: boolean;
        session_summary: string | null;
        key_takeaways: string[] | null;
        completed_at: Date | null;
        created_at: Date | null;
        updated_at: Date | null;
      }>(queryText, params);

      if (result.rows.length === 0) {
        return null;
      }

      const session = this.mapSessionRow(result.rows[0]);
      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      
      logger.error('[AICoach] Error getting active session', {
        userId,
        goal,
        error: errorMessage,
        errorName,
        stack: errorStack,
        // Include more context for debugging
        hasResult: result?.rows ? result.rows.length > 0 : false,
        resultRowCount: result?.rows ? result.rows.length : 0,
      });
      
      // Provide more specific error messages based on error type
      if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
        throw ApiError.internal('Failed to parse session data. The session may be corrupted.');
      } else if (errorMessage.includes('toISOString') || errorMessage.includes('Invalid Date')) {
        throw ApiError.internal('Failed to process session dates. The session may have invalid date data.');
      } else if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
        throw ApiError.internal('Database connection error. Please try again.');
      }
      
      throw ApiError.internal('Failed to retrieve active session');
    }
  }

  /**
   * Map database row to AICoachSession
   */
  private mapSessionRow(row: {
    id: string;
    user_id: string;
    goal_category: string;
    session_type: string;
    messages: ChatMessage[] | unknown;
    extracted_insights: ExtractedInsight[] | unknown;
    conversation_phase: string;
    message_count: number;
    user_message_count: number;
    is_complete: boolean;
    session_summary: string | null;
    key_takeaways: string[] | null;
    completed_at: Date | null;
    created_at: Date | null;
    updated_at: Date | null;
  }): AICoachSession {
    // Safely parse JSONB fields with error handling
    let messages: ChatMessage[] = [];
    try {
      if (Array.isArray(row.messages)) {
        messages = row.messages as ChatMessage[];
      } else if (typeof row.messages === 'string' && row.messages.trim()) {
        messages = JSON.parse(row.messages) as ChatMessage[];
        if (!Array.isArray(messages)) {
          logger.warn('[AICoach] messages is not an array after parsing', { 
            sessionId: row.id,
            messagesType: typeof messages,
          });
          messages = [];
        }
      }
    } catch (error) {
      logger.error('[AICoach] Failed to parse messages JSON', {
        sessionId: row.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        messagesValue: typeof row.messages === 'string' ? row.messages.substring(0, 100) : row.messages,
      });
      messages = [];
    }
    
    let extractedInsights: ExtractedInsight[] = [];
    try {
      if (Array.isArray(row.extracted_insights)) {
        extractedInsights = row.extracted_insights as ExtractedInsight[];
      } else if (typeof row.extracted_insights === 'string' && row.extracted_insights.trim()) {
        extractedInsights = JSON.parse(row.extracted_insights) as ExtractedInsight[];
        if (!Array.isArray(extractedInsights)) {
          logger.warn('[AICoach] extracted_insights is not an array after parsing', { 
            sessionId: row.id,
            extractedInsightsType: typeof extractedInsights,
          });
          extractedInsights = [];
        }
      }
    } catch (error) {
      const insightsValue = typeof row.extracted_insights === 'string' 
        ? row.extracted_insights.substring(0, 100) 
        : String(row.extracted_insights).substring(0, 100);
      logger.error('[AICoach] Failed to parse extracted_insights JSON', {
        sessionId: row.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        extractedInsightsValue: insightsValue,
      });
      extractedInsights = [];
    }

    let keyTakeaways: string[] | null = null;
    const keyTakeawaysRaw: string | string[] | null = row.key_takeaways as string | string[] | null; // Store raw value for error logging
    try {
      if (Array.isArray(keyTakeawaysRaw)) {
        keyTakeaways = keyTakeawaysRaw;
      } else if (keyTakeawaysRaw !== null && typeof keyTakeawaysRaw === 'string') {
        const trimmed = keyTakeawaysRaw.trim();
        if (trimmed) {
          const parsed = JSON.parse(trimmed);
          keyTakeaways = Array.isArray(parsed) ? parsed : null;
          if (keyTakeaways && !keyTakeaways.every(item => typeof item === 'string')) {
            logger.warn('[AICoach] key_takeaways contains non-string items', { 
              sessionId: row.id,
            });
            keyTakeaways = null;
          }
        }
      }
    } catch (error) {
      const takeawaysValue = keyTakeawaysRaw !== null && typeof keyTakeawaysRaw === 'string'
        ? keyTakeawaysRaw.substring(0, 100)
        : keyTakeawaysRaw !== null && keyTakeawaysRaw !== undefined
          ? String(keyTakeawaysRaw).substring(0, 100)
          : 'null';
      logger.error('[AICoach] Failed to parse key_takeaways JSON', {
        sessionId: row.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        keyTakeawaysValue: takeawaysValue,
      });
      keyTakeaways = null;
    }

    // Safely handle date fields with null checks
    const createdAt = row.created_at instanceof Date 
      ? row.created_at.toISOString()
      : (row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString());
    
    const updatedAt = row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : (row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString());

    const completedAt = row.completed_at instanceof Date
      ? row.completed_at.toISOString()
      : (row.completed_at ? new Date(row.completed_at).toISOString() : undefined);

    return {
      id: row.id,
      userId: row.user_id,
      goalCategory: row.goal_category,
      sessionType: row.session_type,
      messages,
      extractedInsights,
      conversationPhase: row.conversation_phase,
      messageCount: row.message_count,
      userMessageCount: row.user_message_count ?? 0,
      isComplete: row.is_complete,
      sessionSummary: row.session_summary || undefined,
      keyTakeaways: keyTakeaways || undefined,
      completedAt,
      createdAt,
      updatedAt,
    };
  }

  /**
   * Generate personalized SMART goals based on assessment
   */
  async generateGoals(request: GenerateGoalsRequest): Promise<GenerateGoalsResponse> {
    if (!this.visionClient) {
      logger.error('[AICoach] Vision client not initialized for goal generation');
      throw ApiError.internal('AI Coach is not available. Please check OpenAI API configuration.');
    }

    try {
      const { userId, goalCategory, assessmentResponses, bodyStats, customGoalText } = request;

      logger.info('[AICoach] Generating goals', {
        userId,
        goalCategory,
        responsesCount: assessmentResponses.length,
        hasBodyStats: !!bodyStats,
        hasCustomText: !!customGoalText,
      });

      // Build context from assessment responses
      const assessmentContext = assessmentResponses.length > 0
        ? `Assessment Responses:\n${assessmentResponses.map(r => `- ${r.questionId}: ${r.value}`).join('\n')}`
        : 'No assessment responses provided.';

      // Build body stats context
      const bodyStatsContext = bodyStats
        ? `Body Statistics:\n${bodyStats.height ? `- Height: ${bodyStats.height}cm\n` : ''}${bodyStats.weight ? `- Weight: ${bodyStats.weight}kg\n` : ''}${bodyStats.age ? `- Age: ${bodyStats.age} years\n` : ''}`
        : 'No body statistics provided.';

      // Build the prompt
      const goalCategoryNames: Record<string, string> = {
        weight_loss: 'Weight Loss',
        muscle_building: 'Build Muscle',
        sleep_improvement: 'Better Sleep',
        stress_wellness: 'Stress Management',
        energy_productivity: 'More Energy',
        event_training: 'Event Training',
        health_condition: 'Health Condition',
        habit_building: 'Build Habits',
        overall_optimization: 'Overall Optimization',
        custom: 'Custom Goal',
      };

      const categoryName = goalCategoryNames[goalCategory] || goalCategory;
      const customGoalPrompt = customGoalText ? `\n\nCustom Goal Description: ${customGoalText}` : '';

      const prompt = `You are an expert health and wellness coach. Generate personalized SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals for a user.

Goal Category: ${categoryName}
${customGoalPrompt}

${assessmentContext}

${bodyStatsContext}

Generate 1-3 SMART goals that are:
1. Specific and clear
2. Measurable with concrete metrics
3. Achievable and realistic
4. Relevant to the user's goal category
5. Time-bound with clear deadlines

Respond with ONLY a valid JSON object. Each goal should have:
- "title": A clear, specific goal title (e.g., "Lose 10 pounds in 3 months")
- "description": A detailed description explaining the goal, why it matters, and how to achieve it
- "targetValue": A numeric target value (e.g., 10 for "lose 10 pounds")
- "targetUnit": The unit of measurement (e.g., "pounds", "hours", "days per week")
- "timeline": An object with "durationWeeks" (number of weeks to achieve the goal, typically 4-16 weeks)
- "motivation": A brief motivational statement explaining why this goal matters
- "milestones": An optional array of weekly milestones (each with "week" number, "target" value, and "description")

Format your response EXACTLY as:
{
  "goals": [
    {
      "title": "Goal title here",
      "description": "Detailed goal description here",
      "targetValue": 10,
      "targetUnit": "pounds",
      "timeline": {
        "durationWeeks": 12
      },
      "motivation": "Why this goal matters to you",
      "milestones": [
        {
          "week": 4,
          "target": 3,
          "description": "Lose 3 pounds by week 4"
        },
        {
          "week": 8,
          "target": 7,
          "description": "Lose 7 pounds by week 8"
        }
      ]
    }
  ],
  "reasoning": "Brief explanation of why these goals were chosen and how they align with the user's assessment"
}

IMPORTANT: 
- Return ONLY valid JSON. No markdown, no additional text.
- Ensure all numeric values are actual numbers, not strings.
- Duration should be realistic (typically 4-16 weeks for most goals).
- For sleep goals, targetUnit might be "hours" and targetValue might be hours of sleep.
- For weight goals, use "pounds" or "kg" as targetUnit.
- For habit goals, targetUnit might be "days per week" or "times per week".`;

      const model = 'gpt-4o';
      const response = await this.visionClient.chat.completions.create({
        model,
        ...this.getTokenParameter(model, 2000),
        messages: [
          {
            role: 'system',
            content: 'You are an expert health and wellness coach specializing in creating personalized SMART goals. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.choices[0]?.message?.content || '';
      
      if (!content || content.trim().length === 0) {
        logger.error('[AICoach] Empty response from OpenAI for goal generation');
        throw ApiError.internal('Failed to generate goals. Please try again.');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('[AICoach] No JSON found in goal generation response', {
          contentPreview: content.substring(0, 200),
        });
        throw ApiError.internal('Invalid response format from goal generation service.');
      }

      let result: GenerateGoalsResponse;
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        logger.error('[AICoach] Failed to parse goal generation response', {
          error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          contentPreview: content.substring(0, 500),
        });
        throw ApiError.internal('Failed to parse goal generation response. Please try again.');
      }

      // Validate response structure
      if (!result.goals || !Array.isArray(result.goals) || result.goals.length === 0) {
        logger.error('[AICoach] Invalid goal generation response structure', { result });
        throw ApiError.internal('Invalid goal generation response. Please try again.');
      }

      logger.info('[AICoach] Successfully generated goals', {
        userId,
        goalCategory,
        goalsCount: result.goals.length,
      });

      return {
        goals: result.goals,
        reasoning: result.reasoning || 'Goals generated based on your assessment and preferences.',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('[AICoach] Error generating goals', {
        userId: request.userId,
        goalCategory: request.goalCategory,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw ApiError.internal('Failed to generate goals. Please try again.');
    }
  }

  // ============================================================================
  // Methods required by ai-coach.controller.ts
  // ============================================================================

  /**
   * Get user's display name from the database
   */
  async getUserName(userId: string): Promise<string | null> {
    try {
      const result = await query<{ first_name: string | null; last_name: string | null }>(
        `SELECT first_name, last_name FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const parts = [row.first_name, row.last_name].filter(Boolean);
      return parts.length > 0 ? parts.join(' ') : null;
    } catch (error) {
      logger.error('[AICoach] Error getting user name', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Generate an opening message for a new conversation
   * Uses LangGraph chatbot service to generate a personalized greeting
   * During onboarding, skips history-based personalized greetings
   */
  async generateOpeningMessage(
    goal: GoalCategory,
    userName?: string,
    language?: SupportedLanguage,
    userId?: string,
    isOnboarding?: boolean
  ): Promise<AICoachResponse> {
    try {
      let message: string;
      
      // During onboarding, ask goal-specific questions instead of greetings
      if (isOnboarding) {
        logger.debug('[AICoach] Generating onboarding question', {
          goal,
          userName,
          language,
        });
        message = this.generateOnboardingQuestion(goal, userName, language);
      } else {
        // During regular conversations, use personalized greetings
        const shouldUsePersonalizedGreeting = userId && 
          langGraphChatbotService && 
          typeof langGraphChatbotService.generateGreeting === 'function';
        
        if (shouldUsePersonalizedGreeting) {
          try {
            message = await langGraphChatbotService.generateGreeting(
              userId,
              goal,
              language || 'en'
            );
            
            // Validate greeting is not empty
            if (!message || message.trim().length === 0) {
              throw new Error('Empty greeting received');
            }
          } catch (langGraphError) {
            const errorMessage = langGraphError instanceof Error ? langGraphError.message : String(langGraphError);
            logger.warn('[AICoach] LangGraph greeting generation failed, using fallback', {
              userId,
              goal,
              error: errorMessage,
            });
            // Fall through to fallback greeting
            message = this.generateFallbackGreeting(goal, userName, language);
          }
        } else {
          // Use fallback greeting if service not available
          logger.debug('[AICoach] Using fallback greeting', {
            hasUserId: !!userId,
            hasService: !!langGraphChatbotService,
            hasMethod: langGraphChatbotService && typeof langGraphChatbotService.generateGreeting === 'function',
          });
          message = this.generateFallbackGreeting(goal, userName, language);
        }
      }
      
      return {
        message,
        phase: 'opening',
        insights: [],
        isComplete: false,
        suggestedActions: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('[AICoach] Error generating opening message', {
        goal,
        userName,
        language,
        userId,
        isOnboarding,
        error: errorMessage,
      });
      
      // Final fallback - use onboarding question if onboarding, otherwise greeting
      const fallbackMessage = isOnboarding
        ? this.generateOnboardingQuestion(goal, userName, language)
        : this.generateFallbackGreeting(goal, userName, language);
      
      return {
        message: fallbackMessage,
        phase: 'opening',
        insights: [],
        isComplete: false,
        suggestedActions: [],
      };
    }
  }
  
  /**
   * Generate a goal-specific onboarding question
   */
  private generateOnboardingQuestion(
    goal: GoalCategory,
    userName?: string,
    language?: SupportedLanguage
  ): string {
    // Language support
    if (language === 'ur') {
      const questions: Record<string, string> = {
        weight_loss: userName 
          ? `${userName}، آپ وزن کم کرنے کا فیصلہ کیوں کیا؟ کیا کوئی خاص واقعہ یا وجہ ہے جس نے آپ کو متاثر کیا؟`
          : `آپ وزن کم کرنے کا فیصلہ کیوں کیا؟ کیا کوئی خاص واقعہ یا وجہ ہے جس نے آپ کو متاثر کیا؟`,
        muscle_building: userName
          ? `${userName}، آپ پٹھے بنانے کی کوشش کیوں کر رہے ہیں؟ آپ کا موجودہ فٹنس لیول کیا ہے؟`
          : `آپ پٹھے بنانے کی کوشش کیوں کر رہے ہیں؟ آپ کا موجودہ فٹنس لیول کیا ہے؟`,
        sleep_improvement: userName
          ? `${userName}، آپ کی نیند میں کیا مسائل ہیں؟ آپ عام طور پر کتنے گھنٹے سوتے ہیں؟`
          : `آپ کی نیند میں کیا مسائل ہیں؟ آپ عام طور پر کتنے گھنٹے سوتے ہیں؟`,
        stress_wellness: userName
          ? `${userName}، آپ کو تناؤ کب سب سے زیادہ محسوس ہوتا ہے؟ آپ اسے کیسے مینج کرتے ہیں؟`
          : `آپ کو تناؤ کب سب سے زیادہ محسوس ہوتا ہے؟ آپ اسے کیسے مینج کرتے ہیں؟`,
        energy_productivity: userName
          ? `${userName}، آپ کی توانائی کا لیول دن میں کب سب سے زیادہ ہوتا ہے؟ کیا چیزیں آپ کو تھکا دیتی ہیں؟`
          : `آپ کی توانائی کا لیول دن میں کب سب سے زیادہ ہوتا ہے؟ کیا چیزیں آپ کو تھکا دیتی ہیں؟`,
        event_training: userName
          ? `${userName}، آپ کس قسم کے ایونٹ کے لیے ٹریننگ کر رہے ہیں؟ ایونٹ کب ہے اور آپ کا موجودہ فٹنس لیول کیا ہے؟`
          : `آپ کس قسم کے ایونٹ کے لیے ٹریننگ کر رہے ہیں؟ ایونٹ کب ہے اور آپ کا موجودہ فٹنس لیول کیا ہے؟`,
        health_condition: userName
          ? `${userName}، آپ کس قسم کی صحت کی حالت کا انتظام کر رہے ہیں؟ یہ آپ کی روزمرہ زندگی کو کیسے متاثر کرتا ہے؟`
          : `آپ کس قسم کی صحت کی حالت کا انتظام کر رہے ہیں؟ یہ آپ کی روزمرہ زندگی کو کیسے متاثر کرتا ہے؟`,
        habit_building: userName
          ? `${userName}، آپ کون سا عادت بنانا چاہتے ہیں؟ آپ نے پہلے کبھی یہ عادت بنانے کی کوشش کی ہے؟`
          : `آپ کون سا عادت بنانا چاہتے ہیں؟ آپ نے پہلے کبھی یہ عادت بنانے کی کوشش کی ہے؟`,
        overall_optimization: userName
          ? `${userName}، آپ کی صحت کا کون سا پہلو سب سے زیادہ بہتری چاہتا ہے؟ آپ کیا تبدیلیاں کرنے کے لیے تیار ہیں؟`
          : `آپ کی صحت کا کون سا پہلو سب سے زیادہ بہتری چاہتا ہے؟ آپ کیا تبدیلیاں کرنے کے لیے تیار ہیں؟`,
        custom: userName
          ? `${userName}، آپ کا صحت کا بنیادی مقصد کیا ہے؟ آپ کیا تبدیلیاں کرنا چاہتے ہیں؟`
          : `آپ کا صحت کا بنیادی مقصد کیا ہے؟ آپ کیا تبدیلیاں کرنا چاہتے ہیں؟`,
      };
      return questions[goal] || (userName ? `${userName}، آپ کیا تبدیلیاں کرنا چاہتے ہیں؟` : `آپ کیا تبدیلیاں کرنا چاہتے ہیں؟`);
    }
    
    // English questions
    const questions: Record<string, string> = {
      weight_loss: userName
        ? `Hi ${userName}! I'd love to understand your motivation better. What made you decide to focus on weight loss? Was there a specific moment or reason that inspired you?`
        : `I'd love to understand your motivation better. What made you decide to focus on weight loss? Was there a specific moment or reason that inspired you?`,
      muscle_building: userName
        ? `Hey ${userName}! Let's talk about your muscle building goals. What's driving you to build muscle, and what's your current fitness level?`
        : `Let's talk about your muscle building goals. What's driving you to build muscle, and what's your current fitness level?`,
      sleep_improvement: userName
        ? `Hi ${userName}! Sleep is so important for overall health. What specific sleep challenges are you facing? How many hours of sleep do you typically get each night?`
        : `Sleep is so important for overall health. What specific sleep challenges are you facing? How many hours of sleep do you typically get each night?`,
      stress_wellness: userName
        ? `Hey ${userName}! Stress management is crucial. When do you feel most stressed in your daily life, and how do you currently handle it?`
        : `Stress management is crucial. When do you feel most stressed in your daily life, and how do you currently handle it?`,
      energy_productivity: userName
        ? `Hi ${userName}! Let's talk about your energy levels. When during the day do you feel most energized, and what tends to drain your energy?`
        : `Let's talk about your energy levels. When during the day do you feel most energized, and what tends to drain your energy?`,
      event_training: userName
        ? `Hey ${userName}! Exciting that you're training for an event! What type of event are you preparing for, when is it, and what's your current fitness level?`
        : `Exciting that you're training for an event! What type of event are you preparing for, when is it, and what's your current fitness level?`,
      health_condition: userName
        ? `Hi ${userName}! I'm here to support your health journey. What health condition are you managing, and how does it affect your daily life?`
        : `I'm here to support your health journey. What health condition are you managing, and how does it affect your daily life?`,
      habit_building: userName
        ? `Hey ${userName}! Building healthy habits is powerful. What specific habit are you looking to build, and have you tried building it before?`
        : `Building healthy habits is powerful. What specific habit are you looking to build, and have you tried building it before?`,
      overall_optimization: userName
        ? `Hi ${userName}! Let's optimize your health holistically. Which aspect of your health needs the most improvement, and what changes are you ready to make?`
        : `Let's optimize your health holistically. Which aspect of your health needs the most improvement, and what changes are you ready to make?`,
      custom: userName
        ? `Hey ${userName}! I'd love to understand your goals better. What's your primary health goal, and what changes would you like to make?`
        : `I'd love to understand your goals better. What's your primary health goal, and what changes would you like to make?`,
    };
    
    return questions[goal] || (userName ? `Hi ${userName}! What changes would you like to make?` : `What changes would you like to make?`);
  }

  /**
   * Generate a fallback greeting when LangGraph service is unavailable
   */
  private generateFallbackGreeting(
    goal: GoalCategory,
    userName?: string,
    language?: SupportedLanguage
  ): string {
    // Language support
    if (language === 'ur') {
      if (userName) {
        return `السلام علیکم ${userName}! میں آپ کی ${goal} کے لیے مدد کرنے کے لیے یہاں ہوں۔ آج آپ کیا کرنا چاہیں گے؟`;
      } else {
        return `السلام علیکم! میں آپ کی ${goal} کے لیے مدد کرنے کے لیے یہاں ہوں۔ آج آپ کیا کرنا چاہیں گے؟`;
      }
    }
    
    // English greetings
    if (userName) {
      const goalMessages: Record<string, string> = {
        weight_loss: `Hey ${userName}! Ready to start your weight loss journey? Let's create a plan that works for you.`,
        muscle_building: `Hey ${userName}! Let's build some muscle together. What's your current fitness level?`,
        sleep_improvement: `Hey ${userName}! Sleep is so important. Let's work on improving your rest.`,
        stress_wellness: `Hey ${userName}! Managing stress is key to overall wellness. How are you feeling today?`,
        energy_productivity: `Hey ${userName}! Let's boost your energy and productivity. What's been draining you lately?`,
        event_training: `Hey ${userName}! Got an event coming up? Let's get you ready!`,
        health_condition: `Hey ${userName}! I'm here to support your health journey. What would you like to focus on?`,
        habit_building: `Hey ${userName}! Building good habits is the foundation of success. What habit are we working on?`,
        overall_optimization: `Hey ${userName}! Let's optimize your overall health and wellness. Where should we start?`,
        custom: `Hey ${userName}! I'm here to help you reach your goals. What are we working on today?`,
      };
      
      return goalMessages[goal] || `Hey ${userName}! I'm here to help you with your ${goal} goal. What would you like to focus on today?`;
    } else {
      return `Hey! I'm here to help you with your ${goal} goal. What would you like to focus on today?`;
    }
  }

  /**
   * Generate a response to a user message within a conversation
   * During onboarding: uses lightweight direct OpenAI call for fast assessment questions
   * During regular chat: uses LangGraph chatbot service with full tool suite
   */
  async generateResponse(
    context: ConversationContext,
    history?: ChatMessage[],
    message?: string
  ): Promise<AICoachResponse> {
    try {
      if (!context.userId || !message) {
        throw ApiError.badRequest('userId and message are required');
      }

      // Determine phase based on message count
      let phase: ConversationPhase = context.phase || 'opening';
      if (context.messageCount) {
        if (context.messageCount < 3) {
          phase = 'opening';
        } else if (context.messageCount < 10) {
          phase = 'exploration';
        } else {
          phase = 'deep_dive';
        }
      }

      // During onboarding, use lightweight direct AI call instead of heavy LangGraph
      if (context.isOnboarding) {
        return this.generateOnboardingResponse(context, history || [], message, phase);
      }

      // Use LangGraph chatbot service for regular conversations
      const response = await langGraphChatbotService.chat({
        userId: context.userId,
        message,
        conversationId: undefined,
        callPurpose: context.goal || undefined,
        language: context.language || 'en',
      });

      const insights: ExtractedInsight[] = [];
      const isComplete = context.messageCount && context.messageCount > 20 ? true : false;

      return {
        message: response.response || 'I understand. How can I help you further?',
        phase,
        insights,
        isComplete,
        suggestedActions: [],
      };
    } catch (error) {
      logger.error('[AICoach] Error generating response', {
        userId: context.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        message: "I'm here to help you with your health and fitness goals. What would you like to work on today?",
        phase: context.phase || 'opening',
        insights: [],
        isComplete: false,
        suggestedActions: [],
      };
    }
  }

  /**
   * Generate a lightweight onboarding assessment response using direct OpenAI call.
   * Skips LangGraph (18 tools, 30s) in favor of a fast, focused assessment conversation.
   */
  private async generateOnboardingResponse(
    context: ConversationContext,
    history: ChatMessage[],
    message: string,
    phase: ConversationPhase
  ): Promise<AICoachResponse> {
    const goal = context.goal || 'custom';
    const language = context.language || 'en';
    const userCount = context.messageCount || 0;
    const targetMessages = 6;
    const isComplete = userCount >= targetMessages;

    const goalDescriptions: Record<string, string> = {
      weight_loss: 'weight loss and healthy weight management',
      muscle_building: 'building muscle and strength',
      sleep_improvement: 'improving sleep quality',
      stress_wellness: 'stress management and wellbeing',
      energy_productivity: 'increasing energy and productivity',
      event_training: 'training for a specific event',
      health_condition: 'managing a health condition',
      habit_building: 'building healthy habits',
      overall_optimization: 'overall health optimization',
      custom: 'personalized health goals',
    };
    const goalDesc = goalDescriptions[goal] || goalDescriptions.custom;

    const languageInstruction = language === 'ur'
      ? 'CRITICAL: Respond in Urdu (اردو) using Urdu script. Sound like a real Urdu-speaking friend.'
      : 'Respond in English. Sound like a friendly, casual health coach.';

    const systemPrompt = `You are a health and fitness assessment coach. You are conducting a brief onboarding assessment about ${goalDesc}.

${languageInstruction}

Your job is to:
1. Acknowledge the user's answer briefly and warmly (1 short sentence)
2. Ask ONE follow-up question to learn more about their situation
3. Focus on understanding: current habits, challenges, motivation, lifestyle, and preferences

Phase: ${phase} (${userCount}/${targetMessages} questions asked)
${isComplete ? 'IMPORTANT: This is the final response. Summarize what you learned and thank the user. Do NOT ask another question.' : ''}

Guidelines:
- Keep responses SHORT (2-3 sentences max)
- Be conversational and warm, not clinical
- Ask specific, focused questions (not open-ended)
- Each question should cover a different topic area
- Do NOT use tools, do NOT reference workouts/meals/data - this is a fresh assessment`;

    // Build conversation history for context
    const recentHistory = history.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    try {
      if (!this.visionClient) {
        throw new Error('OpenAI client not initialized');
      }

      const model = env.openai.model || 'gpt-5-mini';
      const completion = await this.visionClient.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentHistory,
          { role: 'user', content: message },
        ],
        ...this.getTemperatureParameter(model, 0.7),
        ...this.getTokenParameter(model, 200),
      });

      const responseText = completion.choices[0]?.message?.content?.trim();

      if (!responseText) {
        throw new Error('Empty response from AI');
      }

      // Extract basic insights from the user's message
      const insights: ExtractedInsight[] = [{
        category: goal,
        text: message.substring(0, 200),
        confidence: 0.8,
      }];

      return {
        message: responseText,
        phase,
        insights,
        isComplete,
        suggestedActions: [],
      };
    } catch (error) {
      logger.warn('[AICoach] Onboarding response generation failed, using fallback', {
        error: error instanceof Error ? error.message : 'Unknown error',
        goal,
        phase,
      });

      // Fallback: acknowledge and ask a generic follow-up
      const fallbackMessage = isComplete
        ? "Thank you for sharing all of that! I have a great understanding of where you're at. Let's move on to creating your personalized plan."
        : "Thanks for sharing that! Can you tell me a bit more about your daily routine and what challenges you face?";

      return {
        message: fallbackMessage,
        phase,
        insights: [],
        isComplete,
        suggestedActions: [],
      };
    }
  }

  /**
   * Create a new AI coach session in the database
   */
  async createSession(
    userId: string,
    goal: GoalCategory,
    sessionType: string
  ): Promise<AICoachSession> {
    try {
      const result = await query<{
        id: string;
        user_id: string;
        goal_category: string;
        session_type: string;
        messages: ChatMessage[];
        extracted_insights: ExtractedInsight[];
        conversation_phase: string;
        message_count: number;
        user_message_count: number;
        is_complete: boolean;
        session_summary: string | null;
        key_takeaways: string[] | null;
        completed_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>(
        `INSERT INTO ai_coach_sessions (user_id, goal_category, session_type)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, goal, sessionType]
      );

      return this.mapSessionRow(result.rows[0]);
    } catch (error) {
      logger.error('[AICoach] Error creating session', {
        userId,
        goal,
        sessionType,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw ApiError.internal('Failed to create AI coach session');
    }
  }

  /**
   * Delete an AI coach session
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    try {
      const result = await query(
        `DELETE FROM ai_coach_sessions WHERE id = $1 AND user_id = $2`,
        [sessionId, userId]
      );

      if (result.rowCount === 0) {
        throw ApiError.notFound('Session not found');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('[AICoach] Error deleting session', {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to delete session');
    }
  }

  /**
   * Generate a personalized diet plan
   * Stub -- will be implemented with full AI prompt logic
   */
  async generateDietPlan(_request: DietPlanRequest): Promise<GeneratedDietPlan> {
    throw new Error('Not implemented');
  }

  /**
   * Save a generated diet plan to the database
   */
  async saveDietPlan(userId: string, plan: GeneratedDietPlan, goal: GoalCategory): Promise<string> {
    try {
      const result = await query<{ id: string }>(
        `INSERT INTO diet_plans (user_id, name, goal_category, weekly_meals, ai_generated, ai_model, generation_params)
         VALUES ($1, $2, $3, $4, true, 'gpt-5-mini', $5)
         RETURNING id`,
        [
          userId,
          `AI Diet Plan - ${goal}`,
          goal,
          JSON.stringify(plan),
          JSON.stringify({ goal }),
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      logger.error('[AICoach] Error saving diet plan', {
        userId,
        goal,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to save diet plan');
    }
  }

  /**
   * Get the active diet plan for a user
   */
  async getActiveDietPlan(userId: string): Promise<Record<string, unknown> | null> {
    try {
      const result = await query<Record<string, unknown>>(
        `SELECT * FROM diet_plans
         WHERE user_id = $1 AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('[AICoach] Error getting active diet plan', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to retrieve diet plan');
    }
  }

  /**
   * Build historical context string from previous sessions for a user
   */
  async buildHistoricalContext(userId: string): Promise<string> {
    try {
      // Get recent completed sessions
      const result = await query<{
        goal_category: string;
        session_summary: string | null;
        key_takeaways: string[] | null;
        completed_at: Date;
      }>(
        `SELECT goal_category, session_summary, key_takeaways, completed_at
         FROM ai_coach_sessions
         WHERE user_id = $1 AND is_complete = true
         ORDER BY completed_at DESC
         LIMIT 5`,
        [userId]
      );

      if (result.rows.length === 0) {
        return '';
      }

      const contextParts: string[] = [];
      contextParts.push('Previous AI Coach Sessions:');

      for (const session of result.rows) {
        const date = new Date(session.completed_at).toLocaleDateString();
        contextParts.push(`\n- ${session.goal_category} (${date})`);
        if (session.session_summary) {
          contextParts.push(`  Summary: ${session.session_summary}`);
        }
        if (session.key_takeaways && session.key_takeaways.length > 0) {
          contextParts.push(`  Key Takeaways: ${session.key_takeaways.join(', ')}`);
        }
      }

      return contextParts.join('\n');
    } catch (error) {
      logger.error('[AICoach] Error building historical context', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return '';
    }
  }

  /**
   * Add a message to an existing session and update metadata
   */
  async addMessageToSession(
    sessionId: string,
    message: ChatMessage,
    insights?: ExtractedInsight[],
    phase?: ConversationPhase,
    isComplete?: boolean
  ): Promise<void> {
    try {
      // Build SET clauses dynamically
      let setClause = `messages = messages || $2::jsonb,
                        message_count = message_count + 1,
                        updated_at = NOW()`;
      const params: (string | number | boolean | null | Date | object)[] = [
        sessionId,
        JSON.stringify([message]),
      ];
      let paramIndex = 3;

      if (message.role === 'user') {
        setClause += `, user_message_count = user_message_count + 1`;
      }

      if (insights !== undefined) {
        setClause += `, extracted_insights = $${paramIndex}::jsonb`;
        params.push(JSON.stringify(insights));
        paramIndex++;
      }

      if (phase !== undefined) {
        setClause += `, conversation_phase = $${paramIndex}`;
        params.push(phase);
        paramIndex++;
      }

      if (isComplete !== undefined) {
        setClause += `, is_complete = $${paramIndex}`;
        params.push(isComplete);
        paramIndex++;

        if (isComplete) {
          setClause += `, status = 'completed', completed_at = NOW()`;
        }
      }

      await query(
        `UPDATE ai_coach_sessions SET ${setClause} WHERE id = $1`,
        params
      );
    } catch (error) {
      logger.error('[AICoach] Error adding message to session', {
        sessionId,
        role: message.role,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw ApiError.internal('Failed to update session');
    }
  }

  /**
   * Generate a dynamic MCQ question based on context
   * Uses AI to generate personalized, contextual questions
   */
  async generateMCQQuestion(request: MCQGenerationRequest): Promise<MCQGenerationResponse> {
    try {
      const { goal, phase = 'opening', previousAnswers = [], language = 'en' } = request;

      // Generate question ID
      const questionId = crypto.randomUUID();

      // Get OpenAI client with optimized timeout for MCQ generation
      if (!this.visionClient) {
        this.visionClient = new OpenAI({
          apiKey: env.openai.apiKey,
          timeout: 15000, // 15 second timeout for faster MCQ generation
          maxRetries: 0, // No retries for speed
        });
      }

      // Build minimal context (only last 2 answers for speed)
      const recentAnswers = previousAnswers.slice(-2);
      const contextStr = recentAnswers.length > 0
        ? `Previous: ${recentAnswers.map(a => a.selectedOptions[0]).join(', ')}`
        : '';

      // Simplified goal descriptions
      const goalDescMap: Record<string, string> = {
        weight_loss: 'weight loss',
        muscle_building: 'muscle building',
        sleep_improvement: 'sleep improvement',
        stress_wellness: 'stress management',
        energy_productivity: 'energy & productivity',
        event_training: 'event training',
        health_condition: 'health condition',
        habit_building: 'habit building',
        overall_optimization: 'health optimization',
        custom: 'health goals',
      };
      const goalDesc = goalDescMap[goal] || 'health goals';

      // Simplified, concise prompt
      const systemPrompt = `Generate ONE MCQ question about ${goalDesc}. ${contextStr ? `Context: ${contextStr}` : ''} Return JSON: {"question": "text", "options": [{"text": "opt1", "insightValue": "val1"}, ...]}`;
      const userPrompt = language === 'ur' ? `Urdu question about ${goalDesc}` : `Question about ${goalDesc}`;

      try {
        const model = env.openai.model || 'gpt-5-mini';
        
        // Optimized: Single request, lower token limit for speed
        // MCQ questions are short (~150 tokens), so we use minimal tokens
        // For reasoning models (gpt-5-mini), we pass 50 which becomes 200 after 4x multiplication
        // For non-reasoning models, we pass 200 directly
        const tokenLimit = this.isReasoningModel(model) ? 50 : 200;
        const completion = await this.visionClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          ...this.getTemperatureParameter(model, 0.7),
          ...this.getTokenParameter(model, tokenLimit),
          ...this.getResponseFormatParameter(model),
        });

        const content = completion.choices[0]?.message?.content || null;

        if (!content || content.trim().length === 0) {
          logger.warn('[AICoach] Empty response from AI, using fallback', {
            model,
            finishReason: completion.choices[0]?.finish_reason,
          });
          // Use fallback immediately instead of throwing
          return this.generateFallbackMCQQuestion(goal, phase, language, questionId, previousAnswers);
        }

        // Try to parse JSON - if response_format wasn't used, extract JSON from text
        interface ParsedResponse {
          question?: string;
          options?: Array<{ text: string; insightValue?: string }>;
        }
        
        let parsed: ParsedResponse;
        try {
          parsed = JSON.parse(content) as ParsedResponse;
        } catch (parseError) {
          // If direct parse fails, try to extract JSON from markdown or text
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]) as ParsedResponse;
          } else {
            logger.warn('[AICoach] Failed to parse JSON from response', {
              model,
              contentPreview: content.substring(0, 200),
              error: parseError instanceof Error ? parseError.message : 'Unknown parse error',
            });
            throw new Error('Invalid JSON response from AI');
          }
        }
        const questionText = parsed.question || 'How can I help you achieve your goals?';
        const rawOptions = parsed.options || [];

        // Ensure we have at least 2 options
        if (rawOptions.length < 2) {
          // Fallback to default options
          const fallbackOptions = language === 'ur'
            ? ['ہاں', 'نہیں', 'شاید', 'یقین نہیں']
            : ['Yes', 'No', 'Maybe', 'Not sure'];
          rawOptions.push(...fallbackOptions.slice(0, 4 - rawOptions.length).map(opt => ({ text: opt })));
        }

        const options: MCQOption[] = rawOptions.slice(0, 4).map((opt: { text: string; insightValue?: string }, idx: number) => ({
          id: `opt-${idx + 1}`,
          text: opt.text || `Option ${idx + 1}`,
          insightValue: opt.insightValue || opt.text?.toLowerCase().replace(/\s+/g, '_') || `option_${idx + 1}`,
        }));

        // Determine next phase based on progress
        let nextPhase: ConversationPhase = phase;
        const answerCount = previousAnswers.length;
        if (answerCount < 2) {
          nextPhase = 'opening';
        } else if (answerCount < 5) {
          nextPhase = 'exploration';
        } else {
          nextPhase = 'deep_dive';
        }

        // Calculate progress (complete after 6-8 questions)
        // Progress should reflect questions answered + current question being shown
        // If we've answered N questions, we're showing question N+1
        const targetQuestions = 7;
        const questionsAnswered = answerCount;
        const currentQuestionNumber = questionsAnswered + 1;
        // Progress is based on questions completed (answered), not including current
        // But we show progress for the current question being displayed
        const progress = Math.min(100, Math.round((currentQuestionNumber / targetQuestions) * 100));

        // Determine if complete (after 6+ questions answered, meaning 7th question shown)
        const isComplete = answerCount >= 6;

        return {
          question: {
            id: questionId,
            question: questionText,
            options,
          },
          phase: nextPhase,
          progress,
          isComplete: isComplete || false,
          insights: [],
        };
      } catch (aiError) {
        logger.warn('[AICoach] AI question generation failed, using fallback', {
          goal,
          phase,
          error: aiError instanceof Error ? aiError.message : 'Unknown error',
        });

        // Fallback to basic questions
        return this.generateFallbackMCQQuestion(goal, phase, language, questionId, previousAnswers);
      }
    } catch (error) {
      logger.error('[AICoach] Error generating MCQ question', {
        goal: request.goal,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to generate MCQ question');
    }
  }

  /**
   * Generate fallback MCQ question when AI generation fails
   */
  private generateFallbackMCQQuestion(
    goal: GoalCategory,
    phase: ConversationPhase,
    language: SupportedLanguage,
    questionId: string,
    previousAnswers: { questionId: string; selectedOptions: string[] }[] = []
  ): MCQGenerationResponse {
    const goalQuestions: Record<string, Record<string, { question: string; options: string[] }>> = {
      weight_loss: {
        opening: {
          question: language === 'ur' 
            ? 'آپ کا وزن کم کرنے کا بنیادی مقصد کیا ہے؟'
            : 'What is your primary motivation for weight loss?',
          options: language === 'ur'
            ? ['صحت بہتر بنانا', 'بہتر لگنا', 'طاقت بڑھانا', 'طبی وجوہات']
            : ['Improve health', 'Look better', 'Increase energy', 'Medical reasons'],
        },
        exploration: {
          question: language === 'ur'
            ? 'آپ کتنی بار ورزش کرتے ہیں؟'
            : 'How often do you currently exercise?',
          options: language === 'ur'
            ? ['کبھی نہیں', 'ہفتے میں 1-2 بار', 'ہفتے میں 3-4 بار', 'روزانہ']
            : ['Never', '1-2 times per week', '3-4 times per week', 'Daily'],
        },
        deep_dive: {
          question: language === 'ur'
            ? 'آپ کی غذا میں سب سے بڑی چیلنج کیا ہے؟'
            : 'What is your biggest nutrition challenge?',
          options: language === 'ur'
            ? ['پورشن کنٹرول', 'صحت مند کھانا', 'میٹھا کھانا', 'وقت نہیں ملتا']
            : ['Portion control', 'Eating healthy', 'Sweet cravings', 'No time'],
        },
      },
      muscle_building: {
        opening: {
          question: language === 'ur'
            ? 'آپ کتنے عرصے سے ورزش کر رہے ہیں؟'
            : 'How long have you been working out?',
          options: language === 'ur'
            ? ['ابھی شروع کیا', '1-3 ماہ', '3-6 ماہ', '6 ماہ سے زیادہ']
            : ['Just starting', '1-3 months', '3-6 months', 'More than 6 months'],
        },
        exploration: {
          question: language === 'ur'
            ? 'آپ کس قسم کی ورزش پسند کرتے ہیں؟'
            : 'What type of exercise do you prefer?',
          options: language === 'ur'
            ? ['ویٹ لفٹنگ', 'کارڈیو', 'یوگا', 'مکس']
            : ['Weight lifting', 'Cardio', 'Yoga', 'Mixed'],
        },
        deep_dive: {
          question: language === 'ur'
            ? 'آپ کتنے دن ہفتے میں ورزش کر سکتے ہیں؟'
            : 'How many days per week can you commit to workouts?',
          options: language === 'ur'
            ? ['2-3 دن', '4-5 دن', '6 دن', 'روزانہ']
            : ['2-3 days', '4-5 days', '6 days', 'Daily'],
        },
      },
      sleep_improvement: {
        opening: {
          question: language === 'ur'
            ? 'آپ کی نیند کی سب سے بڑی مشکل کیا ہے؟'
            : 'What is your biggest sleep challenge?',
          options: language === 'ur'
            ? ['سونا مشکل', 'رات کو جاگنا', 'جلدی اٹھنا', 'تھکاوٹ']
            : ['Trouble falling asleep', 'Waking up at night', 'Waking up too early', 'Feeling tired'],
        },
        exploration: {
          question: language === 'ur'
            ? 'آپ عام طور پر کتنے گھنٹے سوتے ہیں؟'
            : 'How many hours of sleep do you typically get?',
          options: language === 'ur'
            ? ['4 گھنٹے سے کم', '4-6 گھنٹے', '6-8 گھنٹے', '8+ گھنٹے']
            : ['Less than 4 hours', '4-6 hours', '6-8 hours', '8+ hours'],
        },
        deep_dive: {
          question: language === 'ur'
            ? 'آپ کا سونے کا معمول کیا ہے؟'
            : 'What is your bedtime routine?',
          options: language === 'ur'
            ? ['باقاعدہ', 'کبھی کبھار', 'بے ترتیب', 'کوئی نہیں']
            : ['Consistent', 'Sometimes', 'Irregular', 'None'],
        },
      },
      stress_wellness: {
        opening: {
          question: language === 'ur'
            ? 'آپ کا تناؤ کب سب سے زیادہ ہوتا ہے؟'
            : 'When do you feel most stressed?',
          options: language === 'ur'
            ? ['صبح', 'دوپہر', 'شام', 'رات']
            : ['Morning', 'Afternoon', 'Evening', 'Night'],
        },
        exploration: {
          question: language === 'ur'
            ? 'آپ تناؤ کو کیسے مینج کرتے ہیں؟'
            : 'How do you currently manage stress?',
          options: language === 'ur'
            ? ['ورزش', 'مراقبہ', 'دوستوں سے بات', 'کچھ نہیں']
            : ['Exercise', 'Meditation', 'Talking to friends', 'Nothing'],
        },
        deep_dive: {
          question: language === 'ur'
            ? 'تناؤ آپ کی روزمرہ زندگی کو کس طرح متاثر کرتا ہے؟'
            : 'How does stress affect your daily life?',
          options: language === 'ur'
            ? ['بہت زیادہ', 'کچھ حد تک', 'کم', 'بہت کم']
            : ['Very much', 'Somewhat', 'A little', 'Not much'],
        },
      },
      energy_productivity: {
        opening: {
          question: language === 'ur'
            ? 'آپ کی توانائی کا لیول دن میں کب سب سے زیادہ ہوتا ہے؟'
            : 'When is your energy level highest during the day?',
          options: language === 'ur'
            ? ['صبح', 'دوپہر', 'شام', 'رات']
            : ['Morning', 'Afternoon', 'Evening', 'Night'],
        },
        exploration: {
          question: language === 'ur'
            ? 'آپ کتنے گھنٹے کام کرتے ہیں؟'
            : 'How many hours do you work per day?',
          options: language === 'ur'
            ? ['4-6 گھنٹے', '6-8 گھنٹے', '8-10 گھنٹے', '10+ گھنٹے']
            : ['4-6 hours', '6-8 hours', '8-10 hours', '10+ hours'],
        },
        deep_dive: {
          question: language === 'ur'
            ? 'آپ کی توانائی کو کیا متاثر کرتا ہے؟'
            : 'What affects your energy levels most?',
          options: language === 'ur'
            ? ['نیند', 'خوراک', 'ورزش', 'تناؤ']
            : ['Sleep', 'Nutrition', 'Exercise', 'Stress'],
        },
      },
      event_training: {
        opening: {
          question: language === 'ur'
            ? 'آپ کس قسم کے ایونٹ کے لیے ٹریننگ کر رہے ہیں؟'
            : 'What type of event are you training for?',
          options: language === 'ur'
            ? ['ماراتھن', 'ٹرائیتھلون', 'ویٹ لفٹنگ', 'دوسرا']
            : ['Marathon', 'Triathlon', 'Weightlifting', 'Other'],
        },
        exploration: {
          question: language === 'ur'
            ? 'ایونٹ کب ہے؟'
            : 'When is the event?',
          options: language === 'ur'
            ? ['1 ماہ میں', '3 ماہ میں', '6 ماہ میں', 'ایک سال میں']
            : ['In 1 month', 'In 3 months', 'In 6 months', 'In 1 year'],
        },
        deep_dive: {
          question: language === 'ur'
            ? 'آپ کا موجودہ فٹنس لیول کیا ہے؟'
            : 'What is your current fitness level?',
          options: language === 'ur'
            ? ['ابتدائی', 'درمیانی', 'اعلیٰ', 'پیشہ ورانہ']
            : ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
        },
      },
      health_condition: {
        opening: {
          question: language === 'ur'
            ? 'آپ کس قسم کی صحت کی حالت کا انتظام کر رہے ہیں؟'
            : 'What type of health condition are you managing?',
          options: language === 'ur'
            ? ['ذیابیطس', 'بلڈ پریشر', 'جوڑوں کا درد', 'دوسری']
            : ['Diabetes', 'Blood pressure', 'Joint pain', 'Other'],
        },
        exploration: {
          question: language === 'ur'
            ? 'آپ کی صحت کی حالت آپ کی روزمرہ زندگی کو کس طرح متاثر کرتی ہے؟'
            : 'How does your health condition affect your daily life?',
          options: language === 'ur'
            ? ['بہت زیادہ', 'کچھ حد تک', 'کم', 'بہت کم']
            : ['Very much', 'Somewhat', 'A little', 'Not much'],
        },
        deep_dive: {
          question: language === 'ur'
            ? 'آپ کیا تبدیلیاں کرنا چاہتے ہیں؟'
            : 'What changes would you like to make?',
          options: language === 'ur'
            ? ['خوراک', 'ورزش', 'نیند', 'سب کچھ']
            : ['Nutrition', 'Exercise', 'Sleep', 'Everything'],
        },
      },
      habit_building: {
        opening: {
          question: language === 'ur'
            ? 'آپ کون سا عادت بنانا چاہتے ہیں؟'
            : 'What habit would you like to build?',
          options: language === 'ur'
            ? ['روزانہ ورزش', 'صحت مند کھانا', 'بہتر نیند', 'دوسری']
            : ['Daily exercise', 'Healthy eating', 'Better sleep', 'Other'],
        },
        exploration: {
          question: language === 'ur'
            ? 'آپ نے پہلے کبھی یہ عادت بنانے کی کوشش کی ہے؟'
            : 'Have you tried building this habit before?',
          options: language === 'ur'
            ? ['ہاں، کامیاب', 'ہاں، ناکام', 'نہیں', 'کبھی کبھار']
            : ['Yes, successful', 'Yes, failed', 'No', 'Sometimes'],
        },
        deep_dive: {
          question: language === 'ur'
            ? 'آپ کو کیا رکاوٹیں آتی ہیں؟'
            : 'What barriers do you face?',
          options: language === 'ur'
            ? ['وقت نہیں', 'حوصلہ نہیں', 'علم نہیں', 'دوسری']
            : ['No time', 'No motivation', 'No knowledge', 'Other'],
        },
      },
      overall_optimization: {
        opening: {
          question: language === 'ur'
            ? 'آپ کی صحت کا کون سا پہلو سب سے زیادہ بہتری چاہتا ہے؟'
            : 'Which aspect of your health needs the most improvement?',
          options: language === 'ur'
            ? ['فٹنس', 'خوراک', 'نیند', 'ذہنی صحت']
            : ['Fitness', 'Nutrition', 'Sleep', 'Mental health'],
        },
        exploration: {
          question: language === 'ur'
            ? 'آپ اپنی صحت کو کس طرح ترجیح دیتے ہیں؟'
            : 'How do you prioritize your health?',
          options: language === 'ur'
            ? ['بہت زیادہ', 'کچھ حد تک', 'کم', 'بہت کم']
            : ['Very much', 'Somewhat', 'A little', 'Not much'],
        },
        deep_dive: {
          question: language === 'ur'
            ? 'آپ کیا تبدیلیاں کرنے کے لیے تیار ہیں؟'
            : 'What changes are you ready to make?',
          options: language === 'ur'
            ? ['چھوٹی تبدیلیاں', 'درمیانی تبدیلیاں', 'بڑی تبدیلیاں', 'سب کچھ']
            : ['Small changes', 'Moderate changes', 'Big changes', 'Everything'],
        },
      },
      custom: {
        opening: {
          question: language === 'ur'
            ? 'آپ کا صحت کا بنیادی مقصد کیا ہے؟'
            : 'What is your primary health goal?',
          options: language === 'ur'
            ? ['بہتر محسوس کرنا', 'زیادہ فعال ہونا', 'بہتر کھانا', 'بہتر سونا']
            : ['Feel better', 'Be more active', 'Eat better', 'Sleep better'],
        },
        exploration: {
          question: language === 'ur'
            ? 'آپ کیا تبدیلیاں کرنا چاہتے ہیں؟'
            : 'What changes would you like to make?',
          options: language === 'ur'
            ? ['خوراک', 'ورزش', 'نیند', 'سب کچھ']
            : ['Nutrition', 'Exercise', 'Sleep', 'Everything'],
        },
        deep_dive: {
          question: language === 'ur'
            ? 'آپ کیا چیلنجز کا سامنا کر رہے ہیں؟'
            : 'What challenges are you facing?',
          options: language === 'ur'
            ? ['وقت نہیں', 'حوصلہ نہیں', 'علم نہیں', 'دوسری']
            : ['No time', 'No motivation', 'No knowledge', 'Other'],
        },
      },
    };

    const goalQuestionSet = goalQuestions[goal] || goalQuestions.custom;
    const phaseQuestion = goalQuestionSet[phase] || goalQuestionSet.opening;

    const options: MCQOption[] = phaseQuestion.options.map((opt, idx) => ({
      id: `opt-${idx + 1}`,
      text: opt,
      insightValue: opt.toLowerCase().replace(/\s+/g, '_'),
    }));

    // Calculate progress same way as main function
    const targetQuestions = 7;
    const questionsAnswered = previousAnswers.length;
    const currentQuestionNumber = questionsAnswered + 1;
    const progress = Math.min(100, Math.round((currentQuestionNumber / targetQuestions) * 100));
    const isComplete = questionsAnswered >= 6;

    return {
      question: {
        id: questionId,
        question: phaseQuestion.question,
        options,
      },
      phase,
      progress,
      isComplete,
      insights: [],
    };
  }

  /**
   * Process an MCQ answer and extract insights
   */
  async processMCQAnswer(
    questionId: string,
    selectedOptions: MCQOption[],
    goal: GoalCategory
  ): Promise<ExtractedInsight[]> {
    try {
      const insights: ExtractedInsight[] = [];

      // Extract insights from selected options
      for (const option of selectedOptions) {
        const insight: ExtractedInsight = {
          category: goal,
          text: option.text || option.insightValue || 'User selected an option',
          confidence: 0.8, // Default confidence for MCQ answers
        };
        insights.push(insight);
      }

      // Add goal-specific insights
      if (selectedOptions.length > 0) {
        const primaryOption = selectedOptions[0];
        insights.push({
          category: 'motivation',
          text: `User's primary focus: ${primaryOption.text || primaryOption.insightValue || 'Not specified'}`,
          confidence: 0.9,
        });
      }

      return insights;
    } catch (error) {
      logger.error('[AICoach] Error processing MCQ answer', {
        questionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to process MCQ answer');
    }
  }
}

export const aiCoachService = new AICoachService();
export default aiCoachService;