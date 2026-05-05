import { env } from '../../../config/env.config.js';
import { logger } from '../../logger.service.js';
import type { AIProvider } from '../core/ai-provider.js';
import { batchGoalContextMap } from '../core/goal-context.js';
import type {
  GoalCategory,
  SupportedLanguage,
  MCQOption,
  MCQQuestion,
  BatchMCQRequest,
  BatchMCQResponse,
} from '../types/index.js';

export class BatchMCQService {
  constructor(private provider: AIProvider) {}

  async generateBatchMCQQuestions(request: BatchMCQRequest): Promise<BatchMCQResponse> {
    try {
      const { goal, customGoalText, count = 6, language = 'en' } = request;

      const goalContext = batchGoalContextMap[goal] || batchGoalContextMap.custom;
      const goalTitle = goal === 'custom' && customGoalText ? customGoalText : goalContext.name;
      const goalDesc = goal === 'custom' && customGoalText ? customGoalText : goalContext.description;

      const systemPrompt = `You are Balencia's AI life coach. Generate ${count} personalized quick-assessment MCQ questions based strictly on the user's goal.

User's goal: "${goalTitle}"
Goal description: ${goalDesc}
Key assessment topics: ${goalContext.keyTopics.join(', ')}

Rules:
- Every question MUST directly relate to the user's goal — no generic or random questions
- Questions should help understand: current state, blockers, lifestyle, motivation, constraints, and preferred support style
- Use warm, life-coach-style language
- CRITICAL: Do NOT embed or repeat the user's full goal text inside questions. Instead, reference the goal's THEME naturally. For example, if the goal is "improve my prayer routine and wake up for fajr", ask "How consistent is your current prayer routine?" or "What usually stops you from waking up early?" — NOT "How much time can you dedicate to improve my prayer routine..."
- Each question must have exactly 4-5 MCQ options
- Options should be meaningful and reveal actionable insights
- Questions should be easy to answer quickly
- Do NOT ask for sensitive medical, legal, or financial data
- ${language === 'ur' ? 'Generate all questions and options in Urdu language' : 'Generate in English'}

Return ONLY valid JSON in this exact format:
{
  "goal_summary": "Short summary of the user's goal",
  "detected_goal_categories": ["category1", "category2"],
  "questions": [
    {
      "id": "q1",
      "question": "Personalized MCQ question text",
      "goal_area": "relevant_area",
      "reason_for_asking": "Why this question helps create the plan",
      "options": [
        { "label": "Option text", "value": "option_value" }
      ]
    }
  ]
}`;

      const userPrompt = `Generate exactly ${count} assessment questions for a user whose goal is: "${goalTitle}". Cover these topics: ${goalContext.keyTopics.slice(0, count).join(', ')}.`;

      let content: string | null = null;

      if (this.provider.geminiApiKey) {
        try {
          content = await this.provider.callGeminiText(systemPrompt, [{ role: 'user', content: userPrompt }], 2000, 0.4, true);
        } catch (geminiError: any) {
          logger.warn('[AICoach] Gemini batch MCQ generation failed, trying OpenAI', { error: geminiError?.message });
        }
      }

      if (!content && this.provider.visionClient) {
        const model = env.openai.model || 'gpt-4o-mini';
        const tokenLimit = this.provider.isReasoningModel(model) ? 1500 : 2000;
        const completion = await this.provider.visionClient.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          ...this.provider.getTemperatureParameter(model, 0.4),
          ...this.provider.getTokenParameter(model, tokenLimit),
          ...this.provider.getResponseFormatParameter(model),
        });
        content = completion.choices[0]?.message?.content || null;
      }

      if (!content || content.trim().length === 0) {
        logger.warn('[AICoach] Empty response from all providers for batch MCQ, using fallback');
        return this.generateFallbackBatchQuestions(goal, customGoalText, count, language);
      }

      const cleanContent = this.provider.stripMarkdownFences(content);

      interface ParsedBatchResponse {
        goal_summary?: string;
        detected_goal_categories?: string[];
        questions?: Array<{
          id?: string;
          question?: string;
          goal_area?: string;
          reason_for_asking?: string;
          options?: Array<{ label?: string; value?: string; text?: string }>;
        }>;
      }

      let parsed: ParsedBatchResponse;
      try {
        parsed = JSON.parse(cleanContent) as ParsedBatchResponse;
      } catch {
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]) as ParsedBatchResponse;
        } else {
          logger.warn('[AICoach] Failed to parse batch MCQ JSON, using fallback');
          return this.generateFallbackBatchQuestions(goal, customGoalText, count, language);
        }
      }

      const rawQuestions = parsed.questions || [];
      if (rawQuestions.length < 2) {
        logger.warn('[AICoach] Too few questions from AI, using fallback');
        return this.generateFallbackBatchQuestions(goal, customGoalText, count, language);
      }

      const questions: MCQQuestion[] = rawQuestions.slice(0, count).map((q, idx) => {
        const options: MCQOption[] = (q.options || []).slice(0, 5).map((opt, optIdx) => ({
          id: `opt-${optIdx + 1}`,
          text: opt.label || opt.text || `Option ${optIdx + 1}`,
          insightValue: opt.value || (opt.label || '').toLowerCase().replace(/\s+/g, '_') || `option_${optIdx + 1}`,
        }));

        if (options.length < 2) {
          const defaults = ['Yes', 'No', 'Sometimes', 'Not sure'];
          while (options.length < 4) {
            options.push({ id: `opt-${options.length + 1}`, text: defaults[options.length] || `Option ${options.length + 1}`, insightValue: defaults[options.length]?.toLowerCase().replace(/\s+/g, '_') || `opt_${options.length + 1}` });
          }
        }

        return {
          id: q.id || `batch-q${idx + 1}`,
          question: q.question || `Question ${idx + 1}`,
          options,
        };
      });

      return {
        questions,
        goalSummary: parsed.goal_summary || goalTitle,
        detectedCategories: parsed.detected_goal_categories || [goal],
      };
    } catch (error) {
      logger.error('[AICoach] Error generating batch MCQ questions', {
        goal: request.goal,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return this.generateFallbackBatchQuestions(request.goal, request.customGoalText, request.count || 6, request.language || 'en');
    }
  }

  private generateFallbackBatchQuestions(
    goal: GoalCategory,
    customGoalText: string | undefined,
    count: number,
    language: SupportedLanguage,
  ): BatchMCQResponse {
    const goalLabel = customGoalText || goal.replace(/_/g, ' ');

    const universalQuestions = language === 'ur'
      ? [
          { q: `آپ کی "${goalLabel}" کی طرف موجودہ صورتحال کیا ہے؟`, opts: ['ابھی شروع کر رہا ہوں', 'کچھ تجربہ ہے', 'درمیانی سطح', 'اعلی سطح'] },
          { q: `"${goalLabel}" میں آپ کی سب سے بڑی رکاوٹ کیا ہے؟`, opts: ['وقت نہیں', 'حوصلہ نہیں', 'علم نہیں', 'مدد نہیں ملتی'] },
          { q: `آپ اس مقصد کے لیے ہفتے میں کتنا وقت دے سکتے ہیں؟`, opts: ['1-2 گھنٹے', '3-5 گھنٹے', '5-10 گھنٹے', '10+ گھنٹے'] },
          { q: `آپ کس قسم کی مدد ترجیح دیتے ہیں؟`, opts: ['روزانہ یاد دہانی', 'ہفتہ وار منصوبہ', 'ذاتی کوچنگ', 'خود مختار'] },
          { q: `آپ نے پہلے اس مقصد کے لیے کیا کوشش کی ہے؟`, opts: ['کچھ نہیں', 'ایک بار کوشش کی', 'کئی بار', 'ابھی کر رہا ہوں'] },
          { q: `آپ کب سب سے زیادہ متحرک ہوتے ہیں؟`, opts: ['صبح', 'دوپہر', 'شام', 'رات'] },
        ]
      : [
          { q: `Since your goal is to ${goalLabel}, where are you starting from right now?`, opts: ['Complete beginner', 'Some experience', 'Intermediate', 'Advanced'] },
          { q: `What usually gets in the way of making progress toward ${goalLabel}?`, opts: ['Lack of time', 'Low motivation', 'Not sure how', 'No support system'] },
          { q: `How much time per week can you dedicate to ${goalLabel}?`, opts: ['1-2 hours', '3-5 hours', '5-10 hours', '10+ hours'] },
          { q: `What kind of support helps you most when working toward a goal?`, opts: ['Daily reminders', 'Weekly plans', 'Personal coaching', 'Self-directed'] },
          { q: `Have you tried working on ${goalLabel} before?`, opts: ['Never tried', 'Tried once', 'Multiple attempts', 'Currently working on it'] },
          { q: `When are you most energized and focused during the day?`, opts: ['Morning', 'Midday', 'Afternoon', 'Evening'] },
        ];

    const questions: MCQQuestion[] = universalQuestions.slice(0, count).map((fq, idx) => ({
      id: `fallback-q${idx + 1}`,
      question: fq.q,
      options: fq.opts.map((opt, optIdx) => ({
        id: `opt-${optIdx + 1}`,
        text: opt,
        insightValue: opt.toLowerCase().replace(/\s+/g, '_'),
      })),
    }));

    return {
      questions,
      goalSummary: goalLabel,
      detectedCategories: [goal],
    };
  }
}
