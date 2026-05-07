import { env } from '../../../config/env.config.js';
import { logger } from '../../logger.service.js';
import { ApiError } from '../../../utils/ApiError.js';
import type { AIProvider } from '../core/ai-provider.js';
import { goalCategoryNames } from '../core/goal-context.js';
import type { GenerateGoalsRequest, GenerateGoalsResponse } from '../types/index.js';

export class GoalGeneratorService {
  constructor(private provider: AIProvider) {}

  private buildFallbackGoals(request: GenerateGoalsRequest): GenerateGoalsResponse {
    const { goalCategory, customGoalText } = request;
    const categoryName = goalCategoryNames[goalCategory] || goalCategory;
    const theme = (customGoalText || categoryName || 'personal growth').trim();

    const targetByCategory: Record<string, { value: number; unit: string; weeks: number }> = {
      weight_loss: { value: 1, unit: 'pounds per week', weeks: 12 },
      muscle_building: { value: 3, unit: 'strength sessions per week', weeks: 12 },
      sleep_improvement: { value: 7, unit: 'hours per night', weeks: 6 },
      stress_wellness: { value: 10, unit: 'minutes per day', weeks: 6 },
      energy_productivity: { value: 5, unit: 'focused sessions per week', weeks: 8 },
      event_training: { value: 4, unit: 'training sessions per week', weeks: 10 },
      health_condition: { value: 5, unit: 'check-ins per week', weeks: 8 },
      habit_building: { value: 5, unit: 'days per week', weeks: 8 },
      nutrition: { value: 5, unit: 'planned meals per week', weeks: 8 },
      fitness: { value: 4, unit: 'workouts per week', weeks: 8 },
      custom: { value: 3, unit: 'focused actions per week', weeks: 8 },
    };

    const target = targetByCategory[goalCategory] || {
      value: 3,
      unit: 'focused actions per week',
      weeks: 8,
    };

    return {
      goals: [
        {
          title: `Build consistency around ${theme}`,
          description: `Create a repeatable weekly routine for ${theme}. Start small, track completion, and adjust the target only after the habit feels stable.`,
          targetValue: target.value,
          targetUnit: target.unit,
          timeline: { durationWeeks: target.weeks },
          motivation: `A clear routine makes ${theme} easier to act on even when motivation changes.`,
          milestones: [
            { week: 2, target: Math.max(1, Math.ceil(target.value / 2)), description: 'Complete the routine at a reduced target.' },
            { week: 4, target: target.value, description: 'Reach the full weekly target at least once.' },
            { week: target.weeks, target: target.value, description: 'Sustain the routine and review what worked.' },
          ],
        },
        {
          title: `Track progress for ${theme}`,
          description: `Log each completed action and one short note about what helped or blocked you. Review the notes weekly to make the next week easier.`,
          targetValue: 1,
          targetUnit: 'weekly review',
          timeline: { durationWeeks: target.weeks },
          motivation: 'Visible progress turns a vague goal into a practical system you can improve.',
          milestones: [
            { week: 1, target: 1, description: 'Set up the tracker and complete the first review.' },
            { week: 4, target: 4, description: 'Complete four weekly reviews.' },
          ],
        },
        {
          title: `Remove one blocker for ${theme}`,
          description: `Identify the most common obstacle and create a simple backup plan. Keep the backup plan small enough to do on a busy day.`,
          targetValue: 1,
          targetUnit: 'backup plan',
          timeline: { durationWeeks: 4 },
          motivation: 'A backup plan protects the goal from missed days and keeps momentum intact.',
          milestones: [
            { week: 1, target: 1, description: 'Name the blocker and write the backup action.' },
            { week: 4, target: 1, description: 'Use or refine the backup plan after real-world testing.' },
          ],
        },
      ],
      reasoning: `Generated from the local goal template because external AI providers were unavailable. The goals are aligned to ${categoryName}${customGoalText ? ` and "${customGoalText}"` : ''}.`,
      source: 'fallback',
    };
  }

  async generateGoals(request: GenerateGoalsRequest): Promise<GenerateGoalsResponse> {
    if (!this.provider.visionClient && !this.provider.geminiApiKey) {
      logger.warn('[AICoach] No AI provider configured for goal generation, using fallback goals');
      return this.buildFallbackGoals(request);
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

      const assessmentContext = assessmentResponses.length > 0
        ? `Assessment Responses:\n${assessmentResponses.map(r => `- ${r.questionId}: ${r.value}`).join('\n')}`
        : 'No assessment responses provided.';

      const bodyStatsContext = bodyStats
        ? `Body Statistics:\n${bodyStats.height ? `- Height: ${bodyStats.height}cm\n` : ''}${bodyStats.weight ? `- Weight: ${bodyStats.weight}kg\n` : ''}${bodyStats.age ? `- Age: ${bodyStats.age} years\n` : ''}`
        : 'No body statistics provided.';

      const categoryName = goalCategoryNames[goalCategory] || goalCategory;
      const customGoalPrompt = customGoalText ? `\n\nCustom Goal Description: ${customGoalText}` : '';

      const prompt = `You are an expert life coach specializing in personalized goal-setting. Generate SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals for a user.

Goal Category: ${categoryName}
${customGoalPrompt}

${assessmentContext}

${bodyStatsContext}

CRITICAL: Goals MUST directly match the user's goal category and custom goal description above. If the user's goal is about prayer, spirituality, saving money, reading books, or any non-fitness topic, generate goals about THAT topic — NOT about weight loss, fitness, or nutrition. Only generate fitness/health goals if the user's goal category is explicitly about fitness or health.

Generate 1-3 SMART goals that are:
1. Specific and clear
2. Measurable with concrete metrics
3. Achievable and realistic
4. Directly relevant to what the user actually asked for
5. Time-bound with clear deadlines

Respond with ONLY a valid JSON object. Each goal should have:
- "title": A clear, specific goal title that matches the user's goal theme
- "description": A concise description (2-3 sentences max) explaining the goal and how to achieve it
- "targetValue": A numeric target value (e.g., 5 for "pray 5 times daily", 20 for "read 20 books")
- "targetUnit": The unit of measurement matching the goal (e.g., "times per day", "books", "days per week", "pounds", "hours")
- "timeline": An object with "durationWeeks" (number of weeks to achieve the goal, typically 4-16 weeks)
- "motivation": A brief motivational statement explaining why this goal matters
- "milestones": An optional array of weekly milestones (each with "week" number, "target" value, and "description")

Format your response EXACTLY as:
{
  "goals": [
    {
      "title": "Goal title here",
      "description": "Detailed goal description here",
      "targetValue": 5,
      "targetUnit": "times per day",
      "timeline": {
        "durationWeeks": 8
      },
      "motivation": "Why this goal matters to you",
      "milestones": [
        {
          "week": 3,
          "target": 3,
          "description": "Milestone description"
        }
      ]
    }
  ],
  "reasoning": "Brief explanation of why these goals were chosen and how they align with the user's actual goal"
}

IMPORTANT:
- Return ONLY valid JSON. No markdown, no additional text.
- Ensure all numeric values are actual numbers, not strings.
- Duration should be realistic (typically 4-16 weeks for most goals).
- The targetUnit MUST match the goal topic (prayer → "times per day", reading → "books per month", savings → "amount per week", fitness → "pounds" or "sessions per week", etc.)
- Keep descriptions and motivations SHORT (2-3 sentences each). Do not write paragraphs.
- Limit milestones to 2-3 per goal maximum.
- NEVER generate weight loss or fitness goals unless the user specifically asked for them.`;

      let content = '';
      const goalSystemPrompt = 'You are an expert life coach specializing in creating personalized SMART goals across all life domains — health, fitness, spirituality, finance, education, habits, and personal development. Always generate goals that match the user\'s actual goal category. Always respond with valid JSON only.';

      if (this.provider.geminiApiKey) {
        try {
          content = await this.provider.callGeminiText(goalSystemPrompt, [{ role: 'user', content: prompt }], undefined, 0.4, true);
        } catch (geminiError: any) {
          logger.warn('[AICoach] Gemini goal generation failed, trying OpenAI', { error: geminiError?.message });
        }
      }

      if (!content && this.provider.visionClient) {
        try {
          const model = env.openai.model || 'gpt-4o-mini';
          const response = await this.provider.visionClient.chat.completions.create({
            model,
            ...this.provider.getTokenParameter(model, 4096),
            ...this.provider.getResponseFormatParameter(model),
            messages: [
              { role: 'system', content: goalSystemPrompt },
              { role: 'user', content: prompt },
            ],
          });
          content = response.choices[0]?.message?.content || '';
        } catch (openaiError: any) {
          logger.warn('[AICoach] OpenAI goal generation also failed', { error: openaiError?.message });
        }
      }

      if (!content || content.trim().length === 0) {
        logger.error('[AICoach] All providers failed for goal generation, using fallback goals');
        return this.buildFallbackGoals(request);
      }

      const cleanContent = this.provider.stripMarkdownFences(content);
      let result: GenerateGoalsResponse;
      try {
        result = JSON.parse(cleanContent);
      } catch {
        const repaired = this.provider.repairJSON(cleanContent);
        try {
          result = JSON.parse(repaired);
        } catch {
          const jsonMatch = repaired.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            logger.error('[AICoach] No JSON found in goal generation response', {
              contentPreview: content.substring(0, 200),
            });
            throw ApiError.internal('Invalid response format from goal generation service.');
          }
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (innerError) {
            logger.error('[AICoach] Failed to parse goal generation response', {
              error: innerError instanceof Error ? innerError.message : 'Unknown parse error',
              contentPreview: content.substring(0, 500),
            });
            throw ApiError.internal('Failed to parse goal generation response. Please try again.');
          }
        }
      }

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
}
