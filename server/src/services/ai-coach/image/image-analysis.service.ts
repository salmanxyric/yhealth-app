import crypto from 'crypto';
import path from 'path';
import { env } from '../../../config/env.config.js';
import { logger } from '../../logger.service.js';
import { ApiError } from '../../../utils/ApiError.js';
import { r2Service } from '../../r2.service.js';
import { humanDetectionService } from '../../human-detection.service.js';
import type { AIProvider } from '../core/ai-provider.js';
import type { GoalCategory } from '../types/index.js';
import type { HealthImageType, ImageValidationResult, ImageAnalysisResult, UploadedHealthImage } from '../types/index.js';

export class ImageAnalysisService {
  constructor(private provider: AIProvider) {}

  isAvailable(): boolean {
    return this.provider.isAvailable();
  }

  async validateHealthImage(
    buffer: Buffer,
    mimeType: string,
    originalName: string
  ): Promise<ImageValidationResult> {
    if (!this.provider.geminiApiKey && !this.provider.visionClient) {
      logger.warn('[AICoach] No vision provider available, defaulting to unknown image type');
      return {
        isValid: true,
        imageType: 'unknown',
        confidence: 0.5,
      };
    }

    try {
      const base64Image = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      const classifyPrompt = `Analyze this image and classify it into ONE of these categories:
- "nutrition_label": Photos of product Nutrition Facts panels, ingredient lists, food package labels, or nutrition information tables
- "food_photo": Any food, meal, dish, ingredient, recipe, or nutrition-related image (burgers, salads, fruits, vegetables, cooked meals, raw ingredients, etc.)
- "body_photo": Photos of people's bodies, physique, posture, or fitness progress
- "fitness_progress": Workout equipment, exercise form, fitness tracking screenshots
- "xray": Medical imaging scans (X-rays, CT scans, MRIs, etc.)
- "medical_report": Medical documents, lab results, health reports
- "unknown": If the image doesn't clearly fit any category above

IMPORTANT: If you see a Nutrition Facts panel, ingredient list, or food package label with printed nutrition data, classify it as "nutrition_label". If you see actual food items, ingredients, meals, or dishes, classify it as "food_photo".

Respond with ONLY the category name in lowercase (e.g., "nutrition_label", "food_photo", "body_photo", etc.). No explanations, no JSON, just the category name.`;

      let classificationText = '';

      if (this.provider.geminiApiKey) {
        try {
          classificationText = await this.provider.callGeminiVision('You classify images into health categories. Respond with ONLY the category name.', classifyPrompt, dataUrl, 100);
        } catch (geminiError: any) {
          logger.warn('[AICoach] Gemini classify failed, trying OpenAI', { error: geminiError?.message });
        }
      }

      if (!classificationText && this.provider.visionClient) {
        try {
          const model = env.openai.model || 'gpt-4o-mini';
          const response = await this.provider.visionClient.chat.completions.create({
            model,
            ...this.provider.getTokenParameter(model, 200),
            messages: [{ role: 'user', content: [{ type: 'text', text: classifyPrompt }, { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } }] }],
          });
          classificationText = response.choices[0]?.message?.content || '';
        } catch (openaiError: any) {
          logger.warn('[AICoach] OpenAI classify also failed', { error: openaiError?.message });
        }
      }

      const classification = (classificationText || 'unknown').trim().toLowerCase();

      let imageType: HealthImageType = 'unknown';
      let confidence = 0.7;

      const labelKeywords = ['nutrition_label', 'nutrition facts', 'label', 'package', 'ingredients list'];
      const isLabel = labelKeywords.some(kw => classification.includes(kw)) || classification === 'nutrition_label';

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
        confidence = 0.95;
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

      const isValid = imageType !== 'unknown' ||
                      classification !== 'unknown' ||
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

      const tempKey = `temp/${userId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(originalName)}`;

      return {
        key: tempKey,
        url: '',
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
    if (!this.provider.geminiApiKey && !this.provider.visionClient) {
      logger.error('[AICoach] No vision provider available', { imageType });
      throw ApiError.internal('Vision API not available. Please check API configuration.');
    }

    logger.info('[AICoach] Starting image analysis', {
      imageType,
      hasQuestion: !!userContext?.question,
      provider: this.provider.geminiApiKey ? 'gemini' : 'openai',
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
      food_photo: `You are an expert nutritionist analyzing a food photo. Identify the COMPLETE DISH first, then break down components.

CRITICAL: Identify the DISH NAME first (e.g., "Chicken Biryani", "Pad Thai", "Caesar Salad", "Butter Chicken with Naan").
Do NOT just list raw ingredients — name the actual prepared dish as a whole.
For composite/mixed dishes (biryani, curry, stir-fry, pasta, bowl, wrap, sandwich), list the FULL DISH as the primary item with TOTAL macros for the entire dish.
If there are separate side items (bread, drink, salad on the side), list those as additional items.

Respond with ONLY valid JSON — no text before or after:

{
  "analysis": "**Foods Identified:**\\n1. Chicken Biryani (1 plate, ~450g) - ~650 kcal\\n2. Raita (1 bowl, ~100g) - ~60 kcal\\n\\n**Estimated Calories:** 710 kcal\\n\\n**Macronutrients:**\\nProtein: 38g | Carbs: 78g | Fat: 24g | Fiber: 4g\\n\\n**Recommendations:**\\n1. Good protein from chicken\\n2. Watch portion size of rice",
  "items": [
    {"name": "Chicken Biryani", "portion": "1 plate (~450g)", "calories": 650, "protein": 35, "carbs": 72, "fat": 22},
    {"name": "Raita", "portion": "1 small bowl (~100g)", "calories": 60, "protein": 3, "carbs": 6, "fat": 2}
  ],
  "totalCalories": 710,
  "totalProtein": 38,
  "totalCarbs": 78,
  "totalFat": 24,
  "insights": [{"category": "wellness", "text": "Balanced meal with good protein", "confidence": 0.9}],
  "recommendations": ["Good protein source", "Consider adding vegetables"],
  "warnings": []
}

ABSOLUTE RULES — DO NOT VIOLATE:
1. EVERY item in "items" MUST have ALL 6 fields: name, portion, calories, protein, carbs, fat
2. calories/protein/carbs/fat MUST be realistic NON-ZERO numbers estimated from USDA/standard nutrition databases
3. NEVER return 0 for calories, protein, carbs, or fat — every food has macros
4. Name the ACTUAL DISH (e.g., "Chicken Biryani" NOT "Chicken Drumsticks" + "Rice" separately; "Spaghetti Bolognese" NOT "Pasta" + "Meat Sauce")
5. For mixed dishes, include ALL components (rice, meat, spices, oil, vegetables) in the dish's total macros
6. Only list SEPARATE items if they are visually distinct dishes on the plate (e.g., a side salad, separate bread, a drink)
7. Be specific with regional cuisine names (e.g., "Chicken Tikka Masala", "Pad Thai", "Jollof Rice", "Chicken Biryani" — not generic "rice with chicken")
8. Estimate realistic portions (e.g., "1 plate (~450g)", "1 bowl (~300g)", "2 pieces (~200g)")
9. totalCalories/totalProtein/totalCarbs/totalFat MUST equal the sum of all items
10. The "analysis" field uses **bold** markdown headers as shown`,
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
      unknown: `Analyze this health-related image. If this appears to be food or a meal, identify the COMPLETE DISH NAME first (e.g., "Chicken Biryani" not just "chicken" or "rice"), then respond with JSON containing an "items" array where EACH item has name, portion, calories (number), protein (number), carbs (number), fat (number) — ALL must be realistic non-zero values from standard nutrition databases. For mixed/composite dishes, list the whole dish as one item with combined macros. Include totalCalories, totalProtein, totalCarbs, totalFat as sums. Include an "analysis" field with markdown text. If it's not food, provide relevant health observations.`,
    };

    try {
      let response;

      const isNutritionLabelScan = imageType === 'nutrition_label' ||
        (userContext?.question &&
         (userContext.question.toLowerCase().includes('nutrition label') ||
          userContext.question.toLowerCase().includes('scan label') ||
          userContext.question.toLowerCase().includes('scan nutrition')));

      const isRecipeGeneration = !isNutritionLabelScan && imageType === 'food_photo' &&
        userContext?.question &&
        (userContext.question.toLowerCase().includes('recipe') ||
         userContext.question.toLowerCase().includes('ingredient') ||
         userContext.question.toLowerCase().includes('instruction'));

      let promptText: string;
      let systemPrompt: string;
      let maxTokens: number;

      if (isNutritionLabelScan) {
        systemPrompt = 'You are a nutrition label OCR specialist. Extract exact nutrition data from product labels with high precision.';
        maxTokens = 1000;
        promptText = analysisPrompts['nutrition_label'];
        imageContent.image_url.detail = 'high';
      } else if (isRecipeGeneration && userContext?.question) {
        systemPrompt = 'You are an expert chef. Identify the dish in the image and generate a complete recipe as a JSON object. Respond with ONLY valid JSON — no markdown fences, no extra text.';
        maxTokens = 4096;

        promptText = `Identify this dish and generate a recipe. Return ONLY valid JSON:
{"name":"...","description":"...","category":"breakfast|lunch|dinner|snack|dessert","cuisine":"...","servings":4,"difficulty":"easy|medium|hard","ingredients":[{"quantity":"2","unit":"cups","name":"rice"}],"instructions":[{"step":1,"description":"..."}],"nutrition":{"calories":450,"protein":35,"carbs":25,"fat":18,"fiber":4},"time":{"prep":15,"cook":30},"tags":["..."],"dietaryFlags":["..."]}

Rules: identify all visible ingredients, provide realistic nutrition, write clear step-by-step instructions, estimate accurate times. ONLY JSON output.`;
      } else if (userContext?.question && userContext.question.length > 50) {
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

      const imageDataUrl = imageContent.image_url.url;
      let content = '';

      if (this.provider.geminiApiKey) {
        try {
          logger.info('[AICoach] Trying Gemini vision (primary)', { imageType });
          content = await this.provider.callGeminiVision(systemPrompt, promptText, imageDataUrl, maxTokens, !!isRecipeGeneration);
          logger.info('[AICoach] Gemini vision succeeded', { imageType, contentLength: content.length, jsonMode: isRecipeGeneration });
        } catch (geminiError: any) {
          logger.warn('[AICoach] Gemini vision failed, trying OpenAI fallback', {
            imageType,
            error: geminiError?.message,
          });
        }
      }

      if (!content && this.provider.visionClient) {
        try {
          const openaiModel = env.openai.model || 'gpt-4o-mini';
          response = await this.provider.visionClient.chat.completions.create({
            model: openaiModel,
            ...this.provider.getTokenParameter(openaiModel, maxTokens),
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
          content = response?.choices?.[0]?.message?.content || '';
        } catch (apiError: any) {
          logger.error('[AICoach] OpenAI Vision API also failed', {
            imageType,
            error: apiError?.message || 'Unknown error',
            status: apiError?.status,
          });

          if (apiError?.status === 429 || apiError?.message?.includes('quota') || apiError?.message?.includes('billing')) {
            throw ApiError.internal('Image analysis service is temporarily rate-limited. Please try again in a few moments.');
          } else if (apiError?.status === 400) {
            throw ApiError.badRequest('Invalid image format or size. Please ensure the image is a valid JPEG, PNG, WebP, or HEIC file under 10MB.');
          } else {
            throw ApiError.internal(`Image analysis failed: ${apiError?.message || 'Unknown error'}. Please try again.`);
          }
        }
      }

      if (!content || content.trim().length === 0) {
        logger.error('[AICoach] All vision providers returned empty content', { imageType });
        throw ApiError.internal('Image analysis service returned no content. Please try again.');
      }

      logger.debug('[AICoach] Received analysis response', {
        imageType,
        contentLength: content.length,
        hasJson: content.includes('{'),
      });

      const cleanContent = this.provider.stripMarkdownFences(content);
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);

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
          logger.warn('[AICoach] JSON parse failed, attempting repair', {
            imageType,
            error: parseError instanceof Error ? parseError.message : 'Unknown',
          });

          try {
            let repaired = jsonMatch[0];
            repaired = repaired.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');
            repaired = repaired.replace(/,\s*"[^"]*":\s*$/, '');
            repaired = repaired.replace(/,\s*$/, '');
            const quotes = (repaired.match(/"/g) || []).length;
            if (quotes % 2 !== 0) repaired += '"';
            const openBraces = (repaired.match(/\{/g) || []).length;
            const closeBraces = (repaired.match(/\}/g) || []).length;
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;
            for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
            for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';
            result = JSON.parse(repaired);
            logger.info('[AICoach] Successfully repaired truncated JSON', { imageType });
            if (!result.warnings) result.warnings = [];
            result.warnings.push('Some data may be incomplete due to response length limits.');
          } catch {
            logger.error('[AICoach] JSON repair also failed', {
              imageType,
              contentPreview: content.substring(0, 300),
            });
            const fallbackAnalysis = content.substring(0, 2000);
            return {
              isHealthRelated: true,
              imageType,
              analysis: fallbackAnalysis || 'Analysis completed, but response format was unexpected.',
              insights: [],
              recommendations: [],
              warnings: ['Response parsing failed. Analysis may be incomplete.'],
            };
          }
        }

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

        const isRecipeData = !!(result.name || result.ingredients || result.instructions);

        if (isRecipeData) {
          logger.info('[AICoach] Detected recipe data in response, returning as JSON string', {
            imageType,
            hasName: !!result.name,
            ingredientCount: result.ingredients?.length || 0,
            instructionCount: result.instructions?.length || 0,
          });

          return {
            isHealthRelated: true,
            imageType,
            analysis: JSON.stringify(result),
            insights: [],
            recommendations: [],
            warnings: [],
          };
        }

        if (result.items && Array.isArray(result.items) && result.items.length > 0) {
          logger.info('[AICoach] Food analysis with items array', {
            imageType,
            itemCount: result.items.length,
            totalCalories: result.totalCalories,
          });
          return {
            isHealthRelated: true,
            imageType: imageType === 'unknown' ? 'food_photo' as HealthImageType : imageType,
            analysis: JSON.stringify(result),
            insights: result.insights || [],
            recommendations: result.recommendations || [],
            warnings: result.warnings || [],
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
      response += '\n\n**Suggestions:**\n' + analysis.recommendations.map(r => `• ${r}`).join('\n');
    }

    if (analysis.warnings?.length) {
      response += '\n\n⚠️ ' + analysis.warnings.join(' ');
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
          const { wellbeingAutoTrackerService } = await import('../../wellbeing-auto-tracker.service.js');
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
}
